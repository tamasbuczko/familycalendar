"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGeminiModels = void 0;
const functions = require("firebase-functions");
/**
 * Gemini API modellek lekérdezése
 *
 * Ez a function lekérdezi az elérhető Gemini modelleket 3 módszerrel:
 * 1. REST API (v1/models)
 * 2. OpenAI kompatibilitási API (v1beta/openai/models)
 *
 * Response:
 * {
 *   success: true,
 *   models: {
 *     rest: string[],
 *     openaiCompat: string[],
 *     all: string[],
 *     ranked: Array<{model: string, score: number, sources: string[]}>
 *   },
 *   timestamp: string
 * }
 */
exports.listGeminiModels = functions
    .region('us-central1')
    .https
    .onCall(async (data, context) => {
    var _a;
    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const geminiApiKey = process.env.GEMINI_API_KEY || ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key);
    if (!geminiApiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured');
    }
    const models = {
        rest: [],
        openaiCompat: [],
        all: [],
        ranked: []
    };
    try {
        // 1. REST API - v1/models endpoint
        console.log('📡 Lekérdezés: REST API (v1/models)...');
        try {
            const restResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`);
            if (restResponse.ok) {
                const restData = await restResponse.json();
                if (restData.models) {
                    models.rest = restData.models
                        .filter((m) => m.name && m.name.startsWith('models/gemini'))
                        .map((m) => m.name.replace('models/', ''))
                        .sort();
                    console.log(`✅ REST API: ${models.rest.length} modell található`);
                }
            }
            else {
                console.warn(`⚠️ REST API hiba: ${restResponse.status}`);
            }
        }
        catch (error) {
            console.error('❌ REST API hiba:', error.message);
        }
        // 2. OpenAI kompatibilitási API - v1beta/openai/models endpoint
        console.log('📡 Lekérdezés: OpenAI kompatibilitási API...');
        try {
            const openaiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/models', {
                headers: {
                    'Authorization': `Bearer ${geminiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (openaiResponse.ok) {
                const openaiData = await openaiResponse.json();
                if (openaiData.data) {
                    models.openaiCompat = openaiData.data
                        .filter((m) => m.id && m.id.startsWith('gemini'))
                        .map((m) => m.id)
                        .sort();
                    console.log(`✅ OpenAI Compat: ${models.openaiCompat.length} modell található`);
                }
            }
            else {
                console.warn(`⚠️ OpenAI Compat API hiba: ${openaiResponse.status}`);
            }
        }
        catch (error) {
            console.error('❌ OpenAI Compat API hiba:', error.message);
        }
        // Összegyűjtjük az összes egyedi modellt
        const allModelsSet = new Set([...models.rest, ...models.openaiCompat]);
        models.all = Array.from(allModelsSet).sort();
        // Rangsorolás: előnyben részesítjük azokat, amelyek mindkét módszerrel elérhetők
        models.ranked = models.all.map(model => {
            let score = 0;
            const sources = [];
            if (models.rest.includes(model)) {
                score += 3; // REST API a legmegbízhatóbb
                sources.push('REST');
            }
            if (models.openaiCompat.includes(model)) {
                score += 2; // OpenAI kompatibilitás
                sources.push('OpenAI Compat');
            }
            return { model, score, sources };
        }).sort((a, b) => b.score - a.score);
        console.log(`✅ Összesen ${models.all.length} egyedi modell található`);
        return {
            success: true,
            models,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error listing Gemini models:', error);
        throw new functions.https.HttpsError('internal', `Failed to list models: ${error.message}`);
    }
});
//# sourceMappingURL=listGeminiModels.js.map