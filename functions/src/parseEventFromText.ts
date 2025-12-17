import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// Node.js 20-ban a beépített fetch elérhető, ugyanaz, mint a böngészőben

/**
 * AI-alapú esemény feldolgozás szövegből
 * A függvény egy természetes nyelvi szöveget kap és JSON formátumba alakítja
 * 
 * Request:
 * {
 *   text: string, // Pl. "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor"
 *   familyId: string, // Opcionális - ha van, akkor validálhatjuk a családtagokat
 *   userId: string // Opcionális - ha van, akkor használhatjuk default értékként
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   event: { ... } // JSON objektum, ami a createEvent API-nak megfelelő formátum
 * }
 */
// CORS beállítások explicit módon (ha szükséges)
export const parseEventFromText = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
  // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { text } = data;

  // LOG: Bejövő adatok
  console.log('=== parseEventFromText START ===');
  console.log('Input text:', text);
  console.log('User ID:', userId);
  console.log('Full data:', JSON.stringify(data, null, 2));

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'text is required and must be a non-empty string');
  }

  try {
    // Rate limiting: ellenőrizzük, hogy a felhasználó nem lépette-e túl a napi limitet
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const usageRef = admin.firestore()
      .collection('ai_api_usage')
      .doc(`${userId}_${today}`);
    
    const usageDoc = await usageRef.get();
    const usage = usageDoc.exists ? (usageDoc.data() || { count: 0, lastReset: today }) : { count: 0, lastReset: today };
    
    // Napi limit: 100 hívás felhasználónként (teszteléshez, később beállítható)
    const dailyLimit = 100;
    
    if ((usage.count || 0) >= dailyLimit) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Napi limit túllépve (${dailyLimit} hívás/nap). Próbáld újra holnap.`
      );
    }

    // AI API kulcs (Google Gemini - hivatalos csomag)
    const geminiApiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;

    if (!geminiApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured');
    }

    // Rövid prompt + JSON Schema (strukturált output)
    // A Gemini API response_schema paraméterével garantáljuk a formátumot
    const prompt = `Alakítsd át ezt a magyar nyelvű szöveget esemény adatokká: "${text}"

KRITIKUS SZABÁLYOK:
1. ISMÉTLŐDŐ vs EGYSZERI (NAGYON FONTOS!):
   - Csak akkor legyen ismétlődő (recurrenceType = "weekly"/"daily"/"monthly"), ha VAN "minden", "minden héten", "minden nap", "naponta", "hétfőnként", "ismétlődő" vagy hasonló kifejezés
   - Ha CSAK napnév van (pl. "pénteken", "hétfőn", "kedden") ÉS NINCS "minden" vagy "ismétlődő" → EGYSZERI esemény (recurrenceType = "none"), date = következő előfordulás
   - Példa: "pénteken kettőkor" → EGYSZERI (recurrenceType = "none"), date = következő péntek
   - Példa: "minden pénteken" → ISMÉTLŐDŐ (recurrenceType = "weekly"), recurrenceDays = [5], date = null
   - Alapértelmezés szerint a recurrenceType = "none" és a recurrenceDays = null

2. DÁTUM SZÁMÍTÁS:
   - Ha napnév van (hétfő, kedd...) és egyszeri: date = KÖVETKEZŐ előfordulás (nem az előző!)
   - Ha nincs napnév: date = mai dátum (${today})
   - Mai dátum: ${today}

3. LÁTHATÓSÁG:
   - "csak én láthassam" → visibility = "only_me"
   - Egyébként: visibility = "family"

4. HOZZÁRENDELÉS:
   - "nekem" vagy "én" → assignedTo = "én"
   - Családtag név (Péternek, Mariának) → assignedTo = név
   - Egyébként: assignedTo = null

5. HELYSZÍN:
   - "anyámnál" → location = "Anyám háza"
   - "apámnál" → location = "Apám háza"
   - Helyszín kinyerése a szövegből (pl. "budapestre" → location = "Budapest")

6. IDŐ:
   - "kettőkor" = "14:00"
   - "este 8" = "20:00"
   - "reggel 8" = "08:00"
   - Alapértelmezett: "08:00"

A JSON Schema szerint add vissza az adatokat.`;

    // LOG: Prompt létrehozva
    console.log('=== PROMPT CREATED ===');
    console.log('Prompt length:', prompt.length);
    console.log('Prompt (first 200 chars):', prompt.substring(0, 200));
    console.log('Prompt (full):', prompt);

    // Google Gemini API használata - REST API közvetlenül
    // v1 végpontot használunk (nem v1beta) - támogatja az új modelleket
    // Több modellt próbálunk, ha egy túlterhelt
    // Végleges lista alapján (lásd: GEMINI_MODELS_ACTUAL.md) - csak biztosan létező modellek
    const models = [
      'gemini-2.5-flash',        // ✅ Létezik - Legújabb, gyors, stabil
      'gemini-2.0-flash',        // ✅ Létezik - Régebbi, de stabil fallback
      'gemini-2.0-flash-001',    // ✅ Létezik - Alternatív Flash verzió
      'gemini-2.5-pro',          // ✅ Létezik - Erősebb, de lassabb
      'gemini-flash-latest',     // ✅ Létezik - Latest Flash verzió
      'gemini-pro-latest'        // ✅ Létezik - Latest Pro verzió
    ];
    
    let content: string | null = null;
    let lastError: any = null;
    const maxRetriesPerModel = 3; // 3 próbálkozás modellenként
    const baseRetryDelay = 2000; // 2 másodperc alapérték
    
    // Próbálkozások követése (frontend logoláshoz)
    const attempts: Array<{model: string, attempt: number, success: boolean, error?: string}> = [];

    // Próbáljuk meg minden modellt
    modelLoop: for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const model = models[modelIndex];
      // v1beta végpont használata - támogatja a generationConfig és responseSchema-t
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      
      console.log(`=== Trying model: ${model} (${modelIndex + 1}/${models.length}) ===`);
      
      // Retry mechanizmus modellenként
      for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
        try {
          if (attempt > 0) {
            // Exponenciális backoff: 2s, 4s
            const retryDelay = baseRetryDelay * attempt;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            console.log(`Retry attempt ${attempt}/${maxRetriesPerModel} for model ${model} (waiting ${retryDelay}ms)...`);
          }

          console.log(`Calling Gemini API - Model: ${model} (attempt ${attempt + 1}/${maxRetriesPerModel})...`);
          console.log('API URL:', geminiApiUrl.replace(geminiApiKey, '***'));
          
          // Próbálkozás rögzítése
          attempts.push({ model, attempt: attempt + 1, success: false });
          
          // JSON Schema a strukturált output-hoz (Gemini API response_schema)
          // Megjegyzés: A Gemini API nem támogatja a union típusokat (type: ['string', 'null'])
          // Ezért csak egy típust használunk, és a null értékeket a kódban kezeljük
          const responseSchema = {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Esemény neve' },
              date: { type: 'string', description: 'Egyszeri esemény dátuma (YYYY-MM-DD) vagy üres string ha ismétlődő' },
              time: { type: 'string', description: 'Kezdő idő (HH:MM)' },
              endTime: { type: 'string', description: 'Befejező idő (HH:MM) vagy üres string' },
              location: { type: 'string', description: 'Helyszín vagy üres string' },
              notes: { type: 'string', description: 'Megjegyzések vagy üres string' },
              recurrenceType: { 
                type: 'string', 
                enum: ['none', 'daily', 'weekly', 'monthly'],
                description: 'Ismétlődési típus: "none" (egyszeri), "daily", "weekly", "monthly"'
              },
              startDate: { type: 'string', description: 'Ismétlődő esemény kezdő dátuma (YYYY-MM-DD) vagy üres string' },
              endDate: { type: 'string', description: 'Ismétlődő esemény befejező dátuma (YYYY-MM-DD) vagy üres string' },
              recurrenceDays: { 
                type: 'array',
                items: { type: 'integer', minimum: 0, maximum: 6 },
                description: 'Hét napjai (0=Vasárnap, 1=Hétfő, ..., 6=Szombat) vagy üres tömb ha nincs ismétlődés'
              },
              icon: { type: 'string', description: 'Emoji ikon vagy üres string' },
              color: { type: 'string', description: 'Szín hex kód vagy üres string' },
              status: { type: 'string', enum: ['active', 'cancelled', 'inactive'], default: 'active', description: 'Esemény státusza' },
              visibility: { 
                type: 'string', 
                enum: ['only_me', 'family', 'known_families'],
                default: 'family',
                description: 'Láthatóság: "only_me" (csak én), "family" (család), "known_families"'
              },
              assignedTo: { type: 'string', description: 'Hozzárendelt családtag neve vagy "én" vagy üres string' },
              showAvatar: { type: 'boolean', default: true, description: 'Avatar megjelenítése' },
              points: { type: 'integer', default: 10, minimum: 0, description: 'Pontok az esemény teljesítéséért' }
            },
            required: ['name', 'time', 'status', 'visibility']
          };
          
          const requestBody = {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              responseSchema: responseSchema,
              responseMimeType: 'application/json'
            }
          };
          
          // LOG: Request body teljes
          console.log('Request body (full):', JSON.stringify(requestBody, null, 2));
          
          const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          console.log('=== GEMINI API RESPONSE ===');
          console.log('Response status:', response.status);
          console.log('Response ok:', response.ok);
          
          let responseData: any;
          try {
            responseData = await response.json() as any;
          } catch (parseError: any) {
            console.error('Failed to parse JSON response:', parseError);
            const responseText = await response.text();
            console.error('Response text:', responseText);
            throw new Error(`Failed to parse JSON response: ${parseError.message}. Response: ${responseText.substring(0, 200)}`);
          }
          
          // LOG: Teljes response
          console.log('Response data (full):', JSON.stringify(responseData, null, 2));
          console.log('Response data keys:', Object.keys(responseData || {}));
          
          if (!response.ok) {
            console.error('=== GEMINI API ERROR ===');
            console.error('Error response:', JSON.stringify(responseData, null, 2));
            const error = new Error(`Gemini API error: ${response.status} - ${JSON.stringify(responseData)}`) as any;
            error.status = response.status;
            throw error;
          }

          // Válasz kinyerése - strukturált output esetén közvetlenül JSON string
          // A Gemini API responseSchema esetén közvetlenül JSON string-et ad vissza
          let jsonContent: string | null = null;
          
          // Próbáljuk meg a különböző válasz formátumokat
          if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
            jsonContent = responseData.candidates[0].content.parts[0].text;
          } else if (responseData.text) {
            jsonContent = responseData.text;
          }
          
          // LOG: Extracted content teljes
          console.log('=== EXTRACTED CONTENT ===');
          console.log('Content exists:', !!jsonContent);
          console.log('Content length:', jsonContent?.length || 0);
          console.log('Content (full):', jsonContent);
          
          // Ellenőrizzük, hogy a válasz nem üres
          if (jsonContent && jsonContent.trim().length > 0) {
            // Strukturált output esetén már JSON string formátumban jön
            content = jsonContent;
            console.log(`✅ Success with model: ${model} (structured output)`);
            // Sikeres próbálkozás frissítése
            attempts[attempts.length - 1].success = true;
            break modelLoop; // Sikeres, kilépünk mindkét loop-ból
          } else {
            console.warn(`Empty response from Gemini API - Model: ${model} (attempt ${attempt + 1}/${maxRetriesPerModel}), response:`, JSON.stringify(responseData, null, 2));
            attempts[attempts.length - 1].error = 'Empty response';
            if (attempt < maxRetriesPerModel - 1) {
              continue; // Próbáljuk újra, ha még van lehetőség
            }
          }
        } catch (error: any) {
          lastError = error;
          
          // Próbálkozás hibájának rögzítése
          if (attempts.length > 0) {
            attempts[attempts.length - 1].error = error.message || error.toString();
          }
          
          console.error(`Gemini API error - Model: ${model} (attempt ${attempt + 1}/${maxRetriesPerModel}):`, {
            message: error.message,
            status: error.status || error.statusCode || (error.response?.status),
            code: error.code,
            stack: error.stack?.substring(0, 500)
          });
          
          // Ellenőrizzük a hiba típusát
          const errorStatus = error.status || error.statusCode || (error.response?.status) || 0;
          const errorMessage = error.message || error.toString() || '';
          
          // 503 (Service Unavailable), 429 (Too Many Requests), 500 (Internal Server Error)
          // 404 (Not Found) - modell nem elérhető, próbáljuk a következőt
          // Network hibákat is retryable-nek tekintjük
          const isRetryableError = errorStatus === 503 || 
                                  errorStatus === 429 || 
                                  errorStatus === 500 ||
                                  errorMessage.includes('503') || 
                                  errorMessage.includes('429') ||
                                  errorMessage.includes('500') ||
                                  errorMessage.includes('overloaded') ||
                                  errorMessage.includes('quota') ||
                                  errorMessage.includes('rate limit') ||
                                  errorMessage.includes('unavailable') ||
                                  errorMessage.includes('timeout') ||
                                  errorMessage.includes('fetch') ||
                                  errorMessage.includes('network') ||
                                  errorMessage.includes('ECONNREFUSED') ||
                                  errorMessage.includes('ENOTFOUND') ||
                                  !errorStatus; // Ha nincs status, valószínűleg network hiba
          
          // 404-es hiba (modell nem elérhető) - ne próbáljuk újra, menjünk a következő modellre
          const isModelNotFound = errorStatus === 404 || 
                                 errorMessage.includes('404') ||
                                 errorMessage.includes('not found') ||
                                 errorMessage.includes('NOT_FOUND');
          
          if (isModelNotFound) {
            console.warn(`Model ${model} not found (404), trying next model...`);
            if (modelIndex < models.length - 1) {
              break; // Kilépünk a retry loop-ból és próbáljuk a következő modellt
            }
            // Ha ez az utolsó modell, folytatjuk
          }
          
          // Ha retryable hiba és még van próbálkozás, próbáljuk újra
          if (isRetryableError && attempt < maxRetriesPerModel - 1) {
            console.warn(`Gemini API error (${errorStatus || 'unknown'}) - Model: ${model}, attempt ${attempt + 1}/${maxRetriesPerModel}, retrying...`);
            continue; // Próbáljuk újra ugyanazzal a modellel
          }
          
          // Ha nem retryable hiba vagy elfogyott a retry erre a modelre, próbáljuk a következő modellt
          // DE csak akkor, ha még van másik modell
          if (modelIndex < models.length - 1) {
            console.warn(`Model ${model} failed after ${attempt + 1} attempts, trying next model...`);
            break; // Kilépünk a retry loop-ból és próbáljuk a következő modellt
          }
          
          // Ha ez az utolsó modell és az utolsó próbálkozás is hibázott, akkor folytatjuk a következő iterációval
          // (ami nem lesz, mert ez az utolsó modell), de nem dobunk hibát itt
          console.warn(`Model ${model} failed after all ${maxRetriesPerModel} attempts`);
        }
      } // End of retry loop for this model
      
      // Ha ez az utolsó modell, ne próbáljuk meg a következőt
      if (modelIndex < models.length - 1) {
        console.log(`⚠️ Model ${model} failed after all retries, trying next model...`);
      }
    } // End of model loop

    if (!content) {
      console.error('=== ALL MODELS FAILED ===');
      console.error('Last error:', lastError);
      console.error('Tried models:', models.join(', '));
      console.error('Total attempts:', models.length * maxRetriesPerModel);
      console.error('Attempts details:', attempts);
      
      // Részletesebb hibaüzenet
      const errorDetails = lastError ? {
        message: lastError.message,
        status: lastError.status || lastError.statusCode,
        code: lastError.code,
        attempts: attempts
      } : { attempts: attempts };
      
      console.error('Error details:', errorDetails);
      throw new functions.https.HttpsError('unavailable', `Gemini API nem elérhető. Próbáltuk ${models.length} modellt, összesen ${models.length * maxRetriesPerModel} alkalommal. Kérlek próbáld újra később.`, errorDetails);
    }

    // LOG: JSON parse előtt
    console.log('=== JSON PARSE ===');
    console.log('Content before JSON parse:', content);
    
    // JSON parse - strukturált output esetén már JSON string, egyébként kinyerjük
    let eventJson: any;
    
    try {
      // Először próbáljuk meg közvetlenül parse-olni (strukturált output esetén)
      eventJson = JSON.parse(content);
      console.log('✅ Direct JSON parse successful (structured output)');
    } catch (parseError) {
      // Ha nem sikerült, akkor kinyerjük a JSON-t a szövegből (visszafelé kompatibilitás)
      console.log('⚠️ Direct parse failed, extracting JSON from text...');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      // LOG: JSON match eredmény
      console.log('JSON match found:', !!jsonMatch);
      if (jsonMatch) {
        console.log('JSON match (full):', jsonMatch[0]);
        console.log('JSON match length:', jsonMatch[0].length);
        eventJson = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON match found in content!');
        throw new functions.https.HttpsError('internal', 'Could not parse JSON from AI response');
      }
    }
    
    // LOG: JSON parse után
    console.log('=== PARSED JSON ===');
    console.log('Parsed JSON (full):', JSON.stringify(eventJson, null, 2));
    
    // Használati statisztika frissítése (sikeres hívás után)
    await usageRef.set({
      count: (usage.count || 0) + 1,
      lastReset: today,
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    }, { merge: true });

    // LOG: Validáció előtt
    console.log('=== VALIDATION ===');
    console.log('Event JSON before validation:', JSON.stringify(eventJson, null, 2));
    
    // Validáció és alapértelmezett értékek
    // Az üres stringeket és üres tömböket null-ra konvertáljuk (mert a JSON Schema nem támogatja a union típusokat)
    const validatedEvent = {
      name: eventJson.name || 'Esemény',
      date: (eventJson.date && eventJson.date.trim()) || new Date().toISOString().split('T')[0],
      time: eventJson.time || '08:00',
      endTime: (eventJson.endTime && eventJson.endTime.trim()) || null,
      location: (eventJson.location && eventJson.location.trim()) || null,
      notes: (eventJson.notes && eventJson.notes.trim()) || null,
      recurrenceType: eventJson.recurrenceType || 'none',
      startDate: (eventJson.startDate && eventJson.startDate.trim()) || null,
      endDate: (eventJson.endDate && eventJson.endDate.trim()) || null,
      recurrenceDays: (eventJson.recurrenceDays && Array.isArray(eventJson.recurrenceDays) && eventJson.recurrenceDays.length > 0) ? eventJson.recurrenceDays : null,
      icon: (eventJson.icon && eventJson.icon.trim()) || null,
      color: (eventJson.color && eventJson.color.trim()) || null,
      status: eventJson.status || 'active',
      visibility: eventJson.visibility || 'family', // 'only_me', 'family', 'known_families'
      assignedTo: eventJson.assignedTo || null, // Családtag neve vagy "én" - a frontend majd kezeli
      points: eventJson.points || 10, // Pontok (alapértelmezett: 10)
      showAvatar: eventJson.showAvatar !== undefined ? eventJson.showAvatar : true // Avatar megjelenítése (alapértelmezett: true)
    };

    // Ha heti ismétlődés van, de nincs recurrenceDays, akkor a mai napot használjuk
    if (validatedEvent.recurrenceType === 'weekly' && !validatedEvent.recurrenceDays) {
      const today = new Date();
      validatedEvent.recurrenceDays = [today.getDay()];
    }

    // LOG: Validáció után
    console.log('=== VALIDATED EVENT ===');
    console.log('Validated event (full):', JSON.stringify(validatedEvent, null, 2));

    // LOG: Return előtt
    console.log('=== RETURN ===');
    const returnValue = {
      success: true,
      event: validatedEvent,
      confidence: 0.8, // AI válasz megbízhatósága (később finomítható)
      attempts: attempts // Próbálkozások információi (frontend logoláshoz)
    };
    console.log('Return value (full):', JSON.stringify(returnValue, null, 2));
    console.log('=== parseEventFromText END ===');
    
    return returnValue;

  } catch (error: any) {
    console.error('Error parsing event from text:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Részletesebb hibaüzenet
    const errorMessage = error.message || 'Unknown error';
    console.error('Throwing HttpsError with message:', errorMessage);
    throw new functions.https.HttpsError('internal', `Failed to parse event from text: ${errorMessage}`, error);
  }
});

