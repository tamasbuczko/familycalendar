# Gemini API Elérhető Modellek

**Utolsó frissítés:** 2025-01-XX

## 📊 Összefoglaló

Ez a dokumentum a Google Gemini API elérhető modelleinek listáját tartalmazza, amelyeket 3 módszerrel lehet lekérdezni:

1. **REST API** - `https://generativelanguage.googleapis.com/v1/models`
2. **OpenAI Kompatibilitási API** - `https://generativelanguage.googleapis.com/v1beta/openai/models`
3. **OpenAI SDK** - JavaScript/TypeScript könyvtár használatával

## 🔍 Modellek Lekérdezése

### 1. REST API (curl)

```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

### 2. OpenAI Kompatibilitási API (curl)

```bash
curl "https://generativelanguage.googleapis.com/v1beta/openai/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. JavaScript/TypeScript (OpenAI SDK)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const models = await client.models.list();
models.data.forEach(m => console.log(m.id));
```

### 4. Automatikus Script

A `functions/scripts/listGeminiModels.js` script automatikusan lekérdezi az összes modelt mindhárom módszerrel:

```bash
cd functions
GEMINI_API_KEY=your_key node scripts/listGeminiModels.js
```

Vagy Firebase Functions konfigurációval:

```bash
cd functions
node scripts/listGeminiModels.js
```

(A script automatikusan használja a `functions.config().gemini.key` értéket)

## 📝 Dokumentációból Ismert Modellek

A [Gemini API OpenAI kompatibilitási dokumentáció](https://ai.google.dev/gemini-api/docs/openai) alapján:

### ✅ Biztosan Létező Modellek

1. **`gemini-2.5-flash`** ⭐⭐⭐
   - Gyors, költséghatékony modell
   - Rövid válaszidő, valós idejű alkalmazásokhoz
   - **Státusz:** ✅ Létezik (503 = túlterhelt, de elérhető)

2. **`gemini-2.0-flash`** ⭐⭐
   - Előző verzió
   - **Státusz:** ✅ Létezik (dokumentációban szerepel)

3. **`gemini-2.5-pro`** ⭐⭐⭐
   - Nagyobb teljesítményű modell
   - Összetettebb feladatokhoz
   - **Státusz:** ✅ Létezik (dokumentációban szerepel)

### ❓ Lehetséges Modellek (ellenőrizendő)

4. **`gemini-1.5-flash`** ⭐
   - **Státusz:** ❌ 404 hiba (nem létezik ezzel a névvel)
   - **Lehetséges helyes név:** `gemini-1.5-flash-latest` vagy `gemini-2.5-flash`

5. **`gemini-1.5-pro`** ⭐
   - **Státusz:** ❌ 404 hiba (nem létezik ezzel a névvel)
   - **Lehetséges helyes név:** `gemini-1.5-pro-latest` vagy `gemini-2.5-pro`

6. **`gemini-pro`** ⭐
   - Régebbi, stabil modell
   - **Státusz:** ✅ Valószínűleg létezik (fallback opció)

## 🏆 Ajánlott Modell Prioritások

### 1. Elsődleges (Flash - gyors, olcsó)

1. **`gemini-2.5-flash`** ⭐⭐⭐
   - ✅ Legújabb Flash modell
   - ✅ Gyors válaszidő
   - ✅ Költséghatékony
   - ⚠️ Néha túlterhelt (503 hiba)

2. **`gemini-2.0-flash`** ⭐⭐
   - ✅ Stabil, régebbi verzió
   - ✅ Kevesebb túlterhelés

### 2. Másodlagos (Pro - erősebb)

1. **`gemini-2.5-pro`** ⭐⭐⭐
   - ✅ Legújabb Pro modell
   - ✅ Nagyobb teljesítmény
   - ⚠️ Lassabb, drágább

2. **`gemini-pro`** ⭐
   - ✅ Régebbi, stabil
   - ✅ Fallback opció

## 🔧 Jelenlegi Kódban Használt Modellek

A `functions/src/parseEventFromText.ts` fájlban:

```typescript
const models = [
  'gemini-2.5-flash',    // ✅ Létezik (503 = túlterhelt)
  'gemini-1.5-flash',    // ❌ 404 hiba (nem létezik)
  'gemini-1.5-pro'       // ❌ 404 hiba (nem létezik)
];
```

## 💡 Javasolt Javítások

### Opció 1: Csak létező modellek használata

```typescript
const models = [
  'gemini-2.5-flash',    // ✅ Létezik
  'gemini-2.0-flash',     // ✅ Létezik (fallback)
  'gemini-2.5-pro',       // ✅ Létezik (erősebb)
  'gemini-pro'            // ✅ Létezik (legrégebbi fallback)
];
```

### Opció 2: Latest utótaggal

```typescript
const models = [
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',  // Lehetséges helyes név
  'gemini-1.5-pro-latest',    // Lehetséges helyes név
  'gemini-pro'
];
```

### Opció 3: Dinamikus lekérdezés

A modellek listáját dinamikusan lekérdezni a script segítségével, és csak a létező modelleket használni.

## 📚 További Források

- [Gemini API Dokumentáció](https://ai.google.dev/gemini-api/docs)
- [OpenAI Kompatibilitás](https://ai.google.dev/gemini-api/docs/openai)
- [Modellek API Referencia](https://ai.google.dev/api/rest/generativelanguage/models/list)
- [Gemini Modellek Áttekintés](https://ai.google.dev/gemini-api/docs/models)

## 🔄 Frissítési Útmutató

1. Futtasd a `listGeminiModels.js` scriptet:
   ```bash
   cd functions
   node scripts/listGeminiModels.js
   ```

2. A script automatikusan frissíti ezt a fájlt (`GEMINI_MODELS.md`)

3. Ellenőrizd a rangsorolt modelleket és frissítsd a kódot

4. Teszteld az új modelleket

## ⚠️ Fontos Megjegyzések

- A 503 hiba **nem** azt jelenti, hogy a modell nem létezik, hanem hogy túlterhelt
- A 404 hiba azt jelenti, hogy a modell **nem létezik** ezzel a névvel
- A modellnevek idővel változhatnak
- A `-latest` utótag garantálja, hogy mindig a legújabb verziót használod
- A Flash modellek gyorsabbak és olcsóbbak, de kevésbé pontosak
- A Pro modellek lassabbak és drágábbak, de pontosabbak

