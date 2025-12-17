# Éves Események Modul - Implementációs Vélemény és Finomítások

## 📋 Gemini AI Javaslat Összefoglalása

### Elfogadott Pontok ✅

1. **Fázis 1 és 2 kombinálása** - Logikus, gyorsabb fejlesztés
2. **annualEvents kollekció** - Jó megoldás
3. **birthDate kezelés** - Már létezik, csak validálni kell
4. **"Különleges Napok" fül** - Konzisztens UX a Sablonok mellett
5. **Cloud Function generálás** - Helyes megközelítés (nem recurrenceType: yearly)
6. **Szökőév kezelés** - Fontos részlet

### Finomítandó/Kiegészítendő Pontok ⚠️

---

## 🔍 Részletes Vélemény

### 1. Cloud Function Trigger Stratégia

**Gemini javaslat:** "Cloud Function (vagy trigger) generáljon minden évre egyedi event dokumentumot"

**Vélemény:** ✅ **Jó, de pontosítani kell a trigger típusát**

#### Javasolt Megoldás:

**A. Firestore Trigger (onCreate/onUpdate) - Reaktív generálás**
```typescript
// Amikor annualEvent vagy member birthDate változik
onAnnualEventCreated/Updated → generál eseményeket
onMemberBirthDateUpdated → generál eseményeket
```

**Előnyök:**
- Azonnali generálás (nincs késleltetés)
- Nem kell scheduled function
- Pontos timing

**Hátrányok:**
- Több trigger = több költség
- Duplikáció ellenőrzés szükséges

**B. Scheduled Function (Cron) - Proaktív generálás**
```typescript
// Naponta fut, ellenőrzi és generálja a hiányzó eseményeket
schedule('every day 00:00') → syncAnnualEvents
```

**Előnyök:**
- Egyszerű logika
- Kevesebb trigger
- Batch processing

**Hátrányok:**
- Késleltetés (max 24 óra)
- Nem azonnali

**C. Hibrid Megoldás (AJÁNLOTT) ⭐**

```typescript
// 1. Firestore Trigger - Azonnali generálás új/l módosított eseményekhez
onAnnualEventCreated → generateEventsForNextYear()
onMemberBirthDateUpdated → generateEventsForNextYear()

// 2. Scheduled Function - Backup és cleanup (naponta)
schedule('every day 02:00') → syncAnnualEvents()
  - Ellenőrzi, hogy minden annualEvent-hez van-e esemény a következő évre
  - Generálja a hiányzókat
  - Törli a múltbeli emlékeztetőket (> 2 nap)
```

**Indoklás:**
- Azonnali válasz új eseményekhez
- Backup biztonság (ha valami kimaradt)
- Automatikus cleanup

---

### 2. Esemény Generálás Logika

**Gemini javaslat:** "Minden évre egyedi event dokumentumot"

**Vélemény:** ⚠️ **Pontosítani kell: mennyi évre előre?**

#### Javasolt Megoldás:

**Inkrementális Generálás (AJÁNLOTT) ⭐**

```typescript
// Ne generáljunk 10 évre előre, hanem:
// 1. Következő év (mindig)
// 2. Jelenlegi év (ha még nincs)
// 3. Törlés múltbeli események (> 1 év múlva)

generateEventsForAnnualEvent(annualEventId) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  // Generálás csak a következő évre (ha még nincs)
  if (!hasEventForYear(annualEventId, nextYear)) {
    createEventForYear(annualEventId, nextYear);
  }
  
  // Ha még nincs jelenlegi évre, generáljuk
  if (!hasEventForYear(annualEventId, currentYear)) {
    createEventForYear(annualEventId, currentYear);
  }
}
```

**Előnyök:**
- Kevesebb adatbázis művelet
- Gyorsabb generálás
- Könnyebb karbantartás

---

### 3. Emlékeztetők Tárolása és Megjelenítése

**Gemini javaslat:** 
- "Külön eseményként tároljuk"
- "Vizuálisan különböztessük (halványabb szín vagy 'Emlékeztető:' előtag)"

**Vélemény:** ✅ **Jó, de pontosítani kell a struktúrát**

#### Javasolt Adatmodell:

```typescript
// events/{eventId} - Fő esemény (születésnap)
{
  name: "Péter születésnapja 🎂",
  date: "2025-04-12",
  annualEventId: "annual-event-123",
  isAnnualEvent: true,
  // ...
}

// events/{eventId-reminder-14} - 14 napos emlékeztető
{
  name: "Emlékeztető: Ajándékvásárlás - Péter szülinapja hamarosan! 🎁",
  date: "2025-03-29", // 14 nappal előtte
  annualEventId: "annual-event-123",
  isReminder: true,
  reminderFor: "event-id-main", // Referencia a fő eseményhez
  reminderDaysBefore: 14,
  color: "#FFB6C1", // Halványabb szín
  opacity: 0.7, // ÚJ: Vizuális jelölés
  // ...
}

// events/{eventId-reminder-2} - 2 napos emlékeztető
{
  name: "Emlékeztető: Torta és dekoráció ellenőrzése - Péter szülinapja 🎂",
  date: "2025-04-10", // 2 nappal előtte
  annualEventId: "annual-event-123",
  isReminder: true,
  reminderFor: "event-id-main",
  reminderDaysBefore: 2,
  color: "#FFB6C1",
  opacity: 0.7,
  // ...
}
```

**Vizuális Megjelenítés:**

```jsx
// CalendarView.jsx vagy EventCard.jsx
{event.isReminder && (
  <div className="opacity-70 border-l-4 border-yellow-400 pl-2">
    <span className="text-xs text-gray-500">Emlékeztető:</span>
    {event.name}
  </div>
)}
```

---

### 4. Prémium Ellenőrzés

**Gemini javaslat:** "Ha isPremium: true, akkor generáljuk az emlékeztetőket"

**Vélemény:** ✅ **Jó, de hol ellenőrizzük?**

#### Javasolt Megoldás:

**A. Family szintű prémium (AJÁNLOTT) ⭐**

```typescript
// families/{familyId}
{
  isPremium: boolean, // Család szintű prémium
  premiumUntil: timestamp | null,
  // ...
}
```

**Előnyök:**
- Egyszerűbb logika (egy helyen)
- Konzisztens a többi funkcióval

**B. User szintű prémium (jelenlegi)**

```typescript
// users/{userId}
{
  isPremium: boolean,
  // ...
}
```

**Probléma:** Ha egy családban több user van, akkor melyik prémium?

**Javaslat:** **Kombinált megoldás**
- Elsősorban family.isPremium
- Ha nincs, akkor user.isPremium (fallback)
- Admin user prémium státusza dönt

---

### 5. Szökőév Kezelés

**Gemini javaslat:** "Február 29. → február 28. nem-szökőévekben"

**Vélemény:** ✅ **Jó, de pontosítani kell**

#### Javasolt Logika:

```typescript
function getEventDateForYear(month: number, day: number, year: number): Date {
  // Ha február 29. és nem szökőév
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28); // Február 28.
  }
  
  // Normál eset
  return new Date(year, month - 1, day);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
```

**Kiegészítés:** 
- Ha a felhasználó február 29-én született, akkor mindig február 28-án ünnepeljük nem-szökőévekben
- Ez a standard gyakorlat (pl. Google Calendar is így csinálja)

---

### 6. Duplikáció Megelőzése

**Gemini javaslat:** Nincs említés

**Vélemény:** ⚠️ **KRITIKUS - Hozzá kell adni!**

#### Probléma:

Ha többször fut le a generálás (pl. trigger + scheduled), duplikált események jönnek létre.

#### Javasolt Megoldás:

**A. Unique Constraint (Firestore nem támogatja natív módon)**

**B. Query ellenőrzés (AJÁNLOTT) ⭐**

```typescript
async function generateEventForYear(annualEventId: string, year: number) {
  // Ellenőrizzük, hogy már létezik-e
  const existingEvent = await db.collection('events')
    .where('annualEventId', '==', annualEventId)
    .where('date', '==', `${year}-${month}-${day}`)
    .where('isAnnualEvent', '==', true)
    .limit(1)
    .get();
  
  if (!existingEvent.empty) {
    console.log(`Event already exists for ${annualEventId} in year ${year}`);
    return existingEvent.docs[0].id;
  }
  
  // Generálás csak ha nincs
  const eventRef = await db.collection('events').add({
    // ...
  });
  
  return eventRef.id;
}
```

**C. Idempotens ID generálás**

```typescript
// Event ID: `annual-{annualEventId}-{year}`
const eventId = `annual-${annualEventId}-${year}`;

// setDoc használata addDoc helyett (ha létezik, nem hozza létre újra)
await db.collection('events').doc(eventId).set({
  // ...
}, { merge: true });
```

---

### 7. UI Helye és Navigáció

**Gemini javaslat:** "Különleges Napok fül a Sablonok mellett"

**Vélemény:** ✅ **Jó, de pontosítani kell**

#### Javasolt UI Struktúra:

```
Menü:
├── Naptár
├── Sablonok
├── Különleges Napok ← ÚJ
│   ├── Családtagok Születésnapjai (automatikus, csak megjelenítés)
│   ├── Éves Események (annualEvents - szerkeszthető)
│   └── Névnapok (opcionális, később)
└── Beállítások
```

**Vagy Tab Layout (mint a Sablonok oldalon):**

```
Sablonok oldal:
├── [Saját Sablonok] Tab
├── [Globális Katalógus] Tab
└── [Különleges Napok] Tab ← ÚJ
```

**Javaslat:** **Külön oldal** (nem tab), mert:
- Több funkció (szerkesztés, hozzáadás, törlés)
- Jobb UX (nem zsúfolt)
- Könnyebb navigáció

---

### 8. Családtagok Születésnapjai - Automatikus Generálás

**Gemini javaslat:** "Add hozzá a birthDate kezelést"

**Vélemény:** ✅ **Jó, de pontosítani kell a trigger-t**

#### Javasolt Megoldás:

**A. Member Update Trigger**

```typescript
// functions/src/index.ts
export const onMemberUpdated = functions.firestore
  .document('artifacts/{projectId}/families/{familyId}/members/{memberId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Csak akkor generálunk, ha a birthDate változott
    if (before.birthDate !== after.birthDate && after.birthDate) {
      await generateBirthdayEvents(context.params.familyId, context.params.memberId, after);
    }
  });
```

**B. Member Create Trigger**

```typescript
export const onMemberCreated = functions.firestore
  .document('artifacts/{projectId}/families/{familyId}/members/{memberId}')
  .onCreate(async (snap, context) => {
    const member = snap.data();
    if (member.birthDate) {
      await generateBirthdayEvents(context.params.familyId, context.params.memberId, member);
    }
  });
```

**C. Manual Sync (opcionális)**

```typescript
// Callable function - manuális szinkronizálás
export const syncMemberBirthdays = functions.https.onCall(async (data, context) => {
  // Ellenőrzi az összes member-t és generálja a hiányzó eseményeket
});
```

---

### 9. Esemény Cím Formátuma

**Gemini javaslat:** "Az események címe tartalmazza az ikont (🎂, 💍 stb.)"

**Vélemény:** ✅ **Jó, de pontosítani kell**

#### Javasolt Formátumok:

```typescript
// Születésnap (családtag)
name: `${member.name} születésnapja 🎂`

// Születésnap (külső)
name: `${annualEvent.name} születésnapja ${annualEvent.icon}`

// Névnap
name: `${annualEvent.name} névnapja ${annualEvent.icon}`

// Évforduló
name: `${annualEvent.name} évfordulója ${annualEvent.icon}`

// Emlékeztetők
name: `Emlékeztető: Ajándékvásárlás - ${originalName} 🎁`
name: `Emlékeztető: Torta és dekoráció - ${originalName} 🎂`
```

**Javaslat:** **Dinamikus ikon választás típus alapján**

```typescript
function getIconForType(type: string): string {
  const icons = {
    'birthday': '🎂',
    'nameDay': '📅',
    'anniversary': '💍',
    'other': '⭐'
  };
  return icons[type] || '⭐';
}
```

---

### 10. Teljesítmény Optimalizálás

**Gemini javaslat:** Nincs említés

**Vélemény:** ⚠️ **Fontos hozzáadni!**

#### Javasolt Optimalizációk:

**A. Batch Processing**

```typescript
// Ne egyesével, hanem batch-ben
const batch = db.batch();
events.forEach(event => {
  const ref = db.collection('events').doc();
  batch.set(ref, event);
});
await batch.commit();
```

**B. Limit és Pagination**

```typescript
// Scheduled function-ben limit
const annualEvents = await db.collection('annualEvents')
  .limit(50) // Max 50/alkalom
  .get();
```

**C. Indexelés**

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "annualEventId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 📝 Módosított Implementációs Terv

### Fázis 1: Adatmodell és Alapstruktúra (1 nap)

1. ✅ `annualEvents` kollekció létrehozása
2. ✅ `events` kollekció bővítése (`annualEventId`, `isReminder`, `reminderFor`, `reminderDaysBefore`, `opacity`)
3. ✅ `families` kollekció bővítése (`isPremium` mező - ha nincs)
4. ✅ Firestore indexek létrehozása

### Fázis 2: Backend Functions (2 nap)

1. ✅ `generateAnnualEvents` function (trigger + callable)
2. ✅ `onMemberUpdated` trigger (birthDate változás)
3. ✅ `onAnnualEventCreated/Updated` trigger
4. ✅ `syncAnnualEvents` scheduled function (naponta 02:00)
5. ✅ Szökőév logika
6. ✅ Duplikáció ellenőrzés
7. ✅ Prémium ellenőrzés

### Fázis 3: Frontend UI (2-3 nap)

1. ✅ `AnnualEventsPage.jsx` komponens
2. ✅ `AnnualEventModal.jsx` komponens
3. ✅ **Route hozzáadása** `App.jsx`-hez (`/app/annual-events`)
4. ✅ **Menüpont már létezik** `CalendarHeader.jsx`-ben (370. sor) ✅
5. ✅ Családtagok születésnap szerkesztő (member profilban)
6. ✅ Naptár megjelenítés (éves események + emlékeztetők)
7. ✅ Vizuális különbségtétel (emlékeztetők halványabbak)

### Fázis 4: Tesztelés és Finomítás (1 nap)

1. ✅ Unit tesztek
2. ✅ Integration tesztek
3. ✅ Edge case-ek (szökőév, duplikáció, prémium)
4. ✅ Performance tesztelés

---

## ✅ Jelenlegi Állapot - Menüpont

**Fontos:** A "Kiemelt Események" menüpont **már létezik** a `CalendarHeader.jsx`-ben:

```370:375:src/components/calendar/CalendarHeader.jsx
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/app/annual-events'))}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-yellow-50 transition duration-200 text-gray-700 mb-2"
                                    >
                                        <i className="fas fa-star mr-3"></i>
                                        <span>Kiemelt Események</span>
                                    </button>
```

**Hiányzó részek:**
1. ❌ Route hozzáadása `App.jsx`-hez: `/app/annual-events`
2. ❌ `AnnualEventsPage.jsx` komponens létrehozása
3. ❌ Import hozzáadása `App.jsx`-hez

---

## ✅ Végleges Javaslatok

### 1. Trigger Stratégia: **Hibrid** ⭐
- Firestore trigger azonnali generáláshoz
- Scheduled function backup és cleanup-hoz

### 2. Generálás: **Inkrementális** ⭐
- Csak következő év + jelenlegi év
- Automatikus cleanup múltbeli események után

### 3. Emlékeztetők: **Külön eseményként** ⭐
- `isReminder: true` mező
- Vizuális különbségtétel (`opacity: 0.7`)

### 4. Prémium: **Family szintű** ⭐
- `families/{familyId}.isPremium`
- Fallback: `users/{userId}.isPremium`

### 5. Duplikáció: **Query ellenőrzés + Idempotens ID** ⭐
- Query ellenőrzés generálás előtt
- Idempotens ID: `annual-{annualEventId}-{year}`

---

## 🎯 Következő Lépések

1. **Véleményezés:** Ezt a dokumentumot átnézni
2. **Döntés:** Elfogadás/módosítás a javaslatokról
3. **Implementáció:** Fázisok szerint fejlesztés

---

**Dátum:** 2024
**Verzió:** 1.1
**Szerző:** AI Assistant (Véleményezés Gemini AI javaslatára)

