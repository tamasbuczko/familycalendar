# Hangalapú Eseményfelvétel - AI Támogatással

## Ötlet

A felhasználó egyszerűen beszél, és az alkalmazás automatikusan létrehozza az eseményt a naptárban.

**Példa:**
- Felhasználó: *"vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor"*
- AI feldolgozza és JSON-t ad vissza
- Esemény létrejön a naptárban

## Folyamat

1. **Hangfelvétel** → Web Speech API (böngészőben működik)
2. **Szöveg** → AI feldolgozás (OpenAI vagy Google Gemini)
3. **JSON** → `createEvent` API hívás
4. **Esemény** → Naptárban megjelenik

## Komponensek

### 1. Frontend: `VoiceEventInput.jsx`

**Funkciók:**
- Mikrofon gomb a hangfelvétel indításához
- Web Speech API integráció (magyar nyelv)
- Valós idejű szöveg megjelenítés
- AI feldolgozás hívása
- Esemény automatikus létrehozása

**Használat:**
```jsx
import VoiceEventInput from './components/ui/VoiceEventInput.jsx';

<VoiceEventInput
  familyId={userFamilyId}
  onEventCreated={(eventId, event) => {
    console.log('Event created:', eventId);
    // Frissítsd a naptárt
  }}
  onError={(error) => {
    console.error('Error:', error);
  }}
/>
```

### 2. Backend: `parseEventFromText` Firebase Function

**Funkciók:**
- Természetes nyelvű szöveg feldolgozása
- AI API integráció (OpenAI vagy Gemini)
- JSON formátumba alakítás
- Validáció és alapértelmezett értékek

**API hívás:**
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

const parseEventFromText = httpsCallable(functions, 'parseEventFromText');

const result = await parseEventFromText({
  text: "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor",
  familyId: "family-123"
});

// result.data.event tartalmazza a JSON-t
```

## Konfiguráció

### 1. Firebase Functions konfiguráció

```bash
# OpenAI API kulcs beállítása
firebase functions:config:set openai.key="your-openai-api-key"

# VAGY Gemini API kulcs
firebase functions:config:set gemini.key="your-gemini-api-key"
```

### 2. Deploy

```bash
cd functions
npm run build
firebase deploy --only functions:parseEventFromText
```

## Példák

### Egyszeri esemény
- *"vegyél fel egy eseményt orvosi vizsgálat holnap 10 órakor"*
- *"anyámnál vacsora hétfő este 8-kor"*

### Ismétlődő esemény
- *"zongoraóra minden szerdán 15 órakor"*
- *"kutyasétáltatás minden nap reggel 7-kor"*

### Részletes esemény
- *"karate edzés Péternek pénteken 17:30-kor a sportcsarnokban"*
- *"szülői értekezlet jövő hét szerdán 16 órakor az iskolában"*

## Előnyök

✅ **Gyors**: Nincs gépelés, csak beszél  
✅ **Természetes**: Természetes nyelv használata  
✅ **Okos**: AI értelmezi a dátumokat, időket, helyszíneket  
✅ **Kényelmes**: Mobilról is könnyen használható  

## Korlátok

⚠️ **Böngésző támogatás**: Web Speech API nem minden böngészőben működik  
⚠️ **AI költség**: API hívások költségesek lehetnek  
⚠️ **Pontosság**: Az AI néha hibázhat, ellenőrizni kell  

## Jövőbeli fejlesztések

- [ ] Hangalapú szerkesztés ("módosítsd a zongoraórát 16 órára")
- [ ] Több nyelv támogatása
- [ ] Offline működés (lokális AI modell)
- [ ] Hangalapú keresés
- [ ] Hangalapú törlés

