/**
 * Gemini API modellek lekérdezése
 * 
 * Ez a script lekérdezi az elérhető Gemini modelleket 3 módon:
 * 1. REST API hívás (fetch)
 * 2. OpenAI kompatibilitási API (fetch)
 * 3. OpenAI SDK használatával (ha telepítve van)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || require('firebase-functions').config().gemini?.key;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY nincs beállítva!');
  console.log('Használat: GEMINI_API_KEY=your_key node listGeminiModels.js');
  process.exit(1);
}

const models = {
  rest: [],
  openaiCompat: [],
  openaiSDK: []
};

/**
 * 1. REST API - v1/models endpoint
 */
async function listModelsREST() {
  try {
    console.log('\n📡 1. REST API (v1/models) lekérdezés...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.models) {
      models.rest = data.models
        .filter(m => m.name && m.name.startsWith('models/gemini'))
        .map(m => m.name.replace('models/', ''))
        .sort();
      console.log(`✅ ${models.rest.length} modell található:`);
      models.rest.forEach(m => console.log(`   - ${m}`));
    } else {
      console.log('⚠️ Nincs models mező a válaszban');
      console.log('Válasz:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ REST API hiba:', error.message);
  }
}

/**
 * 2. OpenAI kompatibilitási API - v1beta/openai/models endpoint
 */
async function listModelsOpenAICompat() {
  try {
    console.log('\n📡 2. OpenAI kompatibilitási API (v1beta/openai/models) lekérdezés...');
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/models',
      {
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.data) {
      models.openaiCompat = data.data
        .filter(m => m.id && m.id.startsWith('gemini'))
        .map(m => m.id)
        .sort();
      console.log(`✅ ${models.openaiCompat.length} modell található:`);
      models.openaiCompat.forEach(m => console.log(`   - ${m}`));
    } else {
      console.log('⚠️ Nincs data mező a válaszban');
      console.log('Válasz:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ OpenAI kompatibilitási API hiba:', error.message);
  }
}

/**
 * 3. OpenAI SDK használata (ha telepítve van)
 */
async function listModelsOpenAISDK() {
  try {
    console.log('\n📡 3. OpenAI SDK használata...');
    
    // Próbáljuk meg importálni az OpenAI SDK-t
    let OpenAI;
    try {
      OpenAI = require('openai');
    } catch (e) {
      console.log('⚠️ OpenAI SDK nincs telepítve. Telepítés: npm install openai');
      return;
    }
    
    const client = new OpenAI({
      apiKey: GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    
    const response = await client.models.list();
    const modelList = [];
    
    for await (const model of response.data) {
      if (model.id && model.id.startsWith('gemini')) {
        modelList.push(model.id);
      }
    }
    
    models.openaiSDK = modelList.sort();
    console.log(`✅ ${models.openaiSDK.length} modell található:`);
    models.openaiSDK.forEach(m => console.log(`   - ${m}`));
  } catch (error) {
    console.error('❌ OpenAI SDK hiba:', error.message);
  }
}

/**
 * Összefoglaló és rangsorolás
 */
function generateSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ÖSSZEFOGLALÓ');
  console.log('='.repeat(60));
  
  // Összegyűjtjük az összes egyedi modellt
  const allModels = new Set([
    ...models.rest,
    ...models.openaiCompat,
    ...models.openaiSDK
  ]);
  
  const uniqueModels = Array.from(allModels).sort();
  
  console.log(`\n🔍 Összesen ${uniqueModels.length} egyedi modell található:\n`);
  
  // Rangsorolás: előnyben részesítjük azokat, amelyek mindhárom módszerrel elérhetők
  const modelScores = {};
  
  uniqueModels.forEach(model => {
    let score = 0;
    let sources = [];
    
    if (models.rest.includes(model)) {
      score += 3; // REST API a legmegbízhatóbb
      sources.push('REST');
    }
    if (models.openaiCompat.includes(model)) {
      score += 2; // OpenAI kompatibilitás
      sources.push('OpenAI Compat');
    }
    if (models.openaiSDK.includes(model)) {
      score += 1; // SDK
      sources.push('SDK');
    }
    
    modelScores[model] = { score, sources, model };
  });
  
  // Rendezés score szerint (csökkenő)
  const rankedModels = Object.values(modelScores)
    .sort((a, b) => b.score - a.score);
  
  console.log('🏆 RANGSOROLT MODELLEK (prioritás szerint):\n');
  rankedModels.forEach((item, index) => {
    const stars = '⭐'.repeat(Math.min(item.score, 6));
    const sourcesStr = item.sources.join(', ');
    console.log(`${index + 1}. ${item.model} ${stars} (${sourcesStr})`);
  });
  
  // Ajánlott modellek (minden módszerrel elérhetők)
  const recommended = rankedModels.filter(m => m.score >= 6);
  if (recommended.length > 0) {
    console.log('\n✅ AJÁNLOTT MODELLEK (minden módszerrel elérhetők):');
    recommended.forEach(m => console.log(`   - ${m.model}`));
  }
  
  // Flash modellek (gyorsak)
  const flashModels = uniqueModels.filter(m => m.includes('flash'));
  if (flashModels.length > 0) {
    console.log('\n⚡ FLASH MODELLEK (gyorsak, olcsóak):');
    flashModels.forEach(m => console.log(`   - ${m}`));
  }
  
  // Pro modellek (erősebbek)
  const proModels = uniqueModels.filter(m => m.includes('pro') && !m.includes('flash'));
  if (proModels.length > 0) {
    console.log('\n💪 PRO MODELLEK (erősebbek):');
    proModels.forEach(m => console.log(`   - ${m}`));
  }
  
  return {
    uniqueModels,
    rankedModels: rankedModels.map(m => m.model),
    recommended: recommended.map(m => m.model),
    flashModels,
    proModels
  };
}

/**
 * Főprogram
 */
async function main() {
  console.log('🔍 Gemini API modellek lekérdezése...');
  console.log(`🔑 API kulcs: ${GEMINI_API_KEY.substring(0, 10)}...`);
  
  await listModelsREST();
  await listModelsOpenAICompat();
  await listModelsOpenAISDK();
  
  const summary = generateSummary();
  
  // Eredmények mentése fájlba
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'GEMINI_MODELS.md');
  
  const markdown = `# Gemini API Elérhető Modellek

**Generálva:** ${new Date().toISOString()}

## 📊 Összefoglaló

- **Összes egyedi modell:** ${summary.uniqueModels.length}
- **Ajánlott modellek:** ${summary.recommended.length}
- **Flash modellek:** ${summary.flashModels.length}
- **Pro modellek:** ${summary.proModels.length}

## 🏆 Rangsorolt Modellek

${summary.rankedModels.map((m, i) => `${i + 1}. \`${m}\``).join('\n')}

## ✅ Ajánlott Modellek (minden módszerrel elérhetők)

${summary.recommended.map(m => `- \`${m}\``).join('\n')}

## ⚡ Flash Modellek (gyorsak, olcsóak)

${summary.flashModels.map(m => `- \`${m}\``).join('\n')}

## 💪 Pro Modellek (erősebbek)

${summary.proModels.map(m => `- \`${m}\``).join('\n')}

## 📝 Források

1. **REST API (v1/models):** ${models.rest.length} modell
   ${models.rest.map(m => `   - \`${m}\``).join('\n')}

2. **OpenAI Kompatibilitási API (v1beta/openai/models):** ${models.openaiCompat.length} modell
   ${models.openaiCompat.map(m => `   - \`${m}\``).join('\n')}

3. **OpenAI SDK:** ${models.openaiSDK.length} modell
   ${models.openaiSDK.map(m => `   - \`${m}\``).join('\n')}

## 🔗 További információk

- [Gemini API Dokumentáció](https://ai.google.dev/gemini-api/docs)
- [OpenAI Kompatibilitás](https://ai.google.dev/gemini-api/docs/openai)
- [Modellek listája](https://generativelanguage.googleapis.com/v1/models)
`;

  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`\n💾 Eredmények mentve: ${outputPath}`);
}

// Futtatás
main().catch(console.error);

