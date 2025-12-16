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

    // Prompt létrehozása az AI számára
    
    const prompt = `Egy családi naptár alkalmazás számára kell egy eseményt JSON formátumba alakítanom a következő magyar nyelvű szövegből: "${text}"

Kérlek, alakítsd át ezt egy JSON objektummá, ami a következő struktúrát követi:
{
  "name": "esemény neve",
  "date": "YYYY-MM-DD" vagy null ha ismétlődő,
  "time": "HH:MM",
  "endTime": "HH:MM" vagy null,
  "location": "helyszín" vagy null,
  "notes": "megjegyzések" vagy null,
  "recurrenceType": "none" | "daily" | "weekly" | "monthly" vagy null,
  "startDate": "YYYY-MM-DD" vagy null,
  "endDate": "YYYY-MM-DD" vagy null,
  "recurrenceDays": [0-6] vagy null, // 0=Vasárnap, 1=Hétfő, ..., 6=Szombat
  "icon": "emoji" vagy null,
  "color": "#hex" vagy null,
  "status": "active"
}

KRITIKUS SZABÁLYOK (FONTOS: OLVASD EL FIGYELMESEN!):
1. EGYSZERI ESEMÉNYEK (ELSŐBBSÉG!):
   - Ha "egyszeri esemény", "egyszer", "csak egyszer", "nem ismétlődő" vagy hasonló kifejezés van a szövegben:
     * recurrenceType = "none" (MINDIG!)
     * date = számítsd ki a dátumot:
       - Ha napnév van (hétfő, kedd, szerda, csütörtök, péntek, szombat, vasárnap): a KÖVETKEZŐ előfordulás (nem az előző!)
         * Példa: ha ma szerda van és "hétfő"-t mond, akkor a következő hétfő legyen (5 nap múlva), NEM az előző (2 napja volt)
         * Ha ma hétfő van és "hétfő"-t mond, akkor ma vagy jövő hétfő (7 nap múlva)
         * Mindig a jövőbeli napot használd, ha az már elmúlt ezen a héten
       - Ha nincs napnév: mai dátum (${today})
       - Ha konkrét dátum van (pl. "december 25", "jövő hét péntek"): a megadott dátum
     * startDate = null
     * endDate = null
     * recurrenceDays = null
     * FONTOS: Még akkor is "none", ha "hétfő", "kedd" stb. van benne, ha "egyszeri" is van!
   
   - Ha konkrét dátum van megadva (pl. "december 25", "jövő hét péntek", "2025-01-20"):
     * recurrenceType = "none"
     * date = a megadott dátum (YYYY-MM-DD formátumban)
     * startDate = null
     * endDate = null
     * recurrenceDays = null
   
   - Ha napnév van (hétfő, kedd, stb.) ÉS nincs "egyszeri" kifejezés ÉS nincs "minden hétfő", "minden héten":
     * recurrenceType = "none" (egyszeri esemény, mert nincs "minden" vagy "ismétlődő")
     * date = a KÖVETKEZŐ előfordulás (nem az előző!)
     * startDate = null
     * endDate = null
     * recurrenceDays = null
   
   - Ha nincs dátum megadva ÉS nincs napnév (hétfő, kedd, stb.) ÉS nincs "minden nap", "naponta", "havi":
     * recurrenceType = "none"
     * date = mai dátum (${today})
     * startDate = null
     * endDate = null
     * recurrenceDays = null

2. ISMÉTLŐDŐ ESEMÉNYEK (csak akkor, ha NINCS "egyszeri" kifejezés ÉS van "minden", "minden héten", "ismétlődő"):
   - Ha "minden hétfő", "minden héten hétfő", "hétfőnként", "ismétlődő hétfő" vagy hasonló van:
     * recurrenceType = "weekly"
     * recurrenceDays = [nap száma] (1=hétfő, 2=kedd, 3=szerda, 4=csütörtök, 5=péntek, 6=szombat, 0=vasárnap)
     * date = null (NEM dátum, mert ismétlődő!)
     * startDate = mai dátum (${today})
     * endDate = null (végtelen ismétlődés)
   
   - Ha "minden nap" vagy "naponta" van:
     * recurrenceType = "daily"
     * date = null
     * startDate = mai dátum (${today})
     * endDate = null
   
   - Ha "havi" vagy "minden hónapban" van:
     * recurrenceType = "monthly"
     * date = null
     * startDate = mai dátum (${today})
     * endDate = null

3. HELYSZÍN KINYERÉSE (NAGYON FONTOS!):
   - "anyámnál" -> location: "Anyám háza"
   - "apámnál" -> location: "Apám háza"
   - "nagymamánál" -> location: "Nagymama háza"
   - "iskolában" -> location: "Iskola"
   - "boltban" -> location: "Bolt"
   - Ha van helyszín a szövegben, MINDIG töltsd ki a location mezőt!

4. ESEMÉNY NEVE:
   - Legyen rövid, egyértelmű és leíró
   - Ha van helyszín, lehet benne (pl. "Vacsora anyámnál")
   - Ne csak "Vacsora", hanem "Vacsora anyámnál" vagy hasonló

5. IDŐ:
   - Ha idő nincs megadva, használd "08:00"-t
   - "este 8" vagy "este 8kor" = "20:00"
   - "reggel 8" vagy "8 óra" = "08:00"
   - "délután 3" = "15:00"

6. MÁI DÁTUM: ${today}

PÉLDÁK (MÁI DÁTUM: ${today}, MAI NAP: ${new Date().toLocaleDateString('hu-HU', { weekday: 'long' })}):
- "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor" (ha ma szerda van)
  -> {name: "Vacsora anyámnál", date: "KÖVETKEZŐ_HÉTFŐ_DÁTUMA", time: "20:00", location: "Anyám háza", recurrenceType: "none", startDate: null, endDate: null, recurrenceDays: null}

- "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8:00-kor egyszeri esemény legyen" (ha ma szerda van)
  -> {name: "Vacsora anyámnál", date: "KÖVETKEZŐ_HÉTFŐ_DÁTUMA", time: "20:00", location: "Anyám háza", recurrenceType: "none", startDate: null, endDate: null, recurrenceDays: null}

- "minden hétfő vacsora" (ismétlődő)
  -> {name: "Vacsora", date: null, time: "18:00", location: null, recurrenceType: "weekly", recurrenceDays: [1], startDate: "${today}", endDate: null}

- "futás reggel 7kor"
  -> {name: "Futás", date: "${today}", time: "07:00", location: null, recurrenceType: "none"}

Csak a JSON objektumot add vissza, semmi mást. Ha valami nem egyértelmű, használj ésszerű alapértelmezett értékeket.`;

    // LOG: Prompt létrehozva
    console.log('=== PROMPT CREATED ===');
    console.log('Prompt length:', prompt.length);
    console.log('Prompt (first 200 chars):', prompt.substring(0, 200));
    console.log('Prompt (full):', prompt);

    // Google Gemini API használata - REST API közvetlenül
    // v1 végpontot használunk (nem v1beta), mert az támogatja az új modelleket
    // Több modellt próbálunk, ha egy túlterhelt
    const models = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
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
      // v1 végpont használata (nem v1beta) - támogatja az új modelleket
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`;
      
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
          
          const requestBody = {
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
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

          // Válasz kinyerése (ugyanaz, mint a test-gemini-api.html-ben)
          content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || null;
          
          // LOG: Extracted content teljes
          console.log('=== EXTRACTED CONTENT ===');
          console.log('Content exists:', !!content);
          console.log('Content length:', content?.length || 0);
          console.log('Content (full):', content);
          
          // Ellenőrizzük, hogy a válasz nem üres
          if (content && content.trim().length > 0) {
            console.log(`✅ Success with model: ${model}`);
            // Sikeres próbálkozás frissítése
            attempts[attempts.length - 1].success = true;
            break modelLoop; // Sikeres, kilépünk mindkét loop-ból
          } else {
            console.warn(`Empty response from Gemini API - Model: ${model} (attempt ${attempt + 1}/${maxRetriesPerModel}), response:`, JSON.stringify(responseData, null, 2));
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

    // LOG: JSON kinyerés előtt
    console.log('=== JSON EXTRACTION ===');
    console.log('Content before JSON extraction:', content);
    
    // JSON kinyerése a válaszból
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    // LOG: JSON match eredmény
    console.log('JSON match found:', !!jsonMatch);
    if (jsonMatch) {
      console.log('JSON match (full):', jsonMatch[0]);
      console.log('JSON match length:', jsonMatch[0].length);
    } else {
      console.error('No JSON match found in content!');
    }
    
    if (!jsonMatch) {
      throw new functions.https.HttpsError('internal', 'Could not parse JSON from AI response');
    }

    // LOG: JSON parse előtt
    console.log('=== JSON PARSE ===');
    console.log('JSON string to parse:', jsonMatch[0]);
    
    const eventJson = JSON.parse(jsonMatch[0]);
    
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
    const validatedEvent = {
      name: eventJson.name || 'Esemény',
      date: eventJson.date || new Date().toISOString().split('T')[0],
      time: eventJson.time || '08:00',
      endTime: eventJson.endTime || null,
      location: eventJson.location || null,
      notes: eventJson.notes || null,
      recurrenceType: eventJson.recurrenceType || 'none',
      startDate: eventJson.startDate || null,
      endDate: eventJson.endDate || null,
      recurrenceDays: eventJson.recurrenceDays || null,
      icon: eventJson.icon || null,
      color: eventJson.color || null,
      status: eventJson.status || 'active',
      visibility: 'family',
      points: 10
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

