# Ünnepnapok, Névnapok és Külső Születésnapok Modul - Terv és Vélemény

## 📋 Összefoglaló

Ez a dokumentum egy komplex modul tervezését és implementációs tervét tartalmazza, amely kezeli az évente ismétlődő eseményeket (születésnapok, névnapok, évfordulók) intelligens emlékeztetőkkel.

---

## 🎯 Fő Célok

1. **Családtagok születésnapjainak automatikus kezelése**
2. **Külső születésnapok és évfordulók kezelése** (barátok, rokonok)
3. **Névnapok integrációja** (opcionális)
4. **Intelligens emlékeztetők** (14 nap és 2 nap előtt) - Prémium funkció
5. **Automatikus naptárbejegyzések** évente ismétlődő eseményekhez

---

## 🔍 Jelenlegi Állapot Elemzése

### ✅ Már Meglévő Funkciók

1. **Adatmodell:**
   - `familyMembers` kollekcióban már van `birthDate` mező (YYYY-MM-DD formátum)
   - `events` kollekcióban van `recurrenceType` mező ('none', 'daily', 'weekly', 'monthly')
   - Prémium státusz ellenőrzés: `user.isPremium` boolean mező

2. **Eseménykezelés:**
   - `createEvent` Firebase function működik
   - Ismétlődő események kezelése (daily, weekly, monthly)
   - Naptár megjelenítés működik

### ❌ Hiányzó Funkciók

1. **Éves ismétlődés támogatása:**
   - `recurrenceType` nem tartalmazza a `'yearly'` opciót
   - `calendarUtils.js` nem kezeli az éves ismétlődést
   - `EventModal.jsx` nem támogatja az éves ismétlődést

2. **Automatikus eseménygenerálás:**
   - Nincs automatikus születésnap esemény generálás
   - Nincs emlékeztető esemény generálás (14 nap, 2 nap)

3. **Külső események kezelése:**
   - Nincs `annualEvents` kollekció
   - Nincs UI a külső események kezeléséhez

4. **Névnapok:**
   - Nincs névnap adatbázis
   - Nincs névnap keresés funkció

---

## 🏗️ Javasolt Architektúra

### 1. Adatmodell Bővítése

#### A. Family Members - Születésnap mező (már létezik, csak validálni kell)

```typescript
// artifacts/{projectId}/families/{familyId}/members/{memberId}
{
  name: string,
  birthDate: string | null, // YYYY-MM-DD formátum (opcionális)
  // ... egyéb mezők
}
```

#### B. Annual Events - Új kollekció

```typescript
// artifacts/{projectId}/families/{familyId}/annualEvents/{eventId}
{
  name: string,                    // "Nagymama", "Péter barát"
  type: 'birthday' | 'nameDay' | 'anniversary' | 'other',
  date: string,                     // MM-DD formátum (év nélkül, mert évente ismétlődik)
  notifyPrior: boolean,             // Kér-e előzetes emlékeztetőt (Prémium)
  color: string,                    // Hex színkód (pl. #FFB6C1 - pasztell rózsaszín)
  icon: string,                     // Emoji ikon (pl. 🎂, 🎁, 💍)
  notes: string | null,             // Opcionális megjegyzések
  createdBy: string,                // User ID
  createdAt: timestamp,
  lastModified: timestamp,
  lastModifiedBy: string
}
```

#### C. Events - Éves ismétlődés támogatása

```typescript
// artifacts/{projectId}/families/{familyId}/events/{eventId}
{
  // ... meglévő mezők
  recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly', // ÚJ: 'yearly'
  annualEventId: string | null,     // ÚJ: Referencia az annualEvents dokumentumhoz (ha van)
  isReminder: boolean,               // ÚJ: Emlékeztető esemény-e (14 nap, 2 nap)
  reminderFor: string | null,        // ÚJ: Melyik eseményhez tartozik (annualEventId vagy memberId)
  reminderDaysBefore: number | null // ÚJ: Hány nappal előtte (14 vagy 2)
}
```

### 2. Firebase Functions

#### A. `generateAnnualEvents` - Automatikus eseménygenerálás

```typescript
// Trigger: amikor egy member birthDate-je változik, vagy új annualEvent jön létre
// Feladat: 
// 1. Generál éves ismétlődő eseményt a születésnaphoz/évfordulóhoz
// 2. Ha prémium: generál 14 napos és 2 napos emlékeztetőket
```

#### B. `syncAnnualEvents` - Szinkronizálás

```typescript
// Scheduled function (naponta fut)
// Feladat:
// 1. Ellenőrzi az összes annualEvent-et
// 2. Generálja a következő év eseményeit (ha még nincs)
// 3. Törli a múltbeli emlékeztetőket
```

### 3. Frontend Komponensek

#### A. `AnnualEventsPage.jsx` - Fő oldal

- Lista az összes éves eseményről
- Keresés, szűrés típus szerint
- Hozzáadás gomb
- Szerkesztés/Törlés

#### B. `AnnualEventModal.jsx` - Esemény szerkesztő

- Név mező
- Típus választó (születésnap, névnap, évforduló, egyéb)
- Dátum választó (MM-DD formátum)
- Emlékeztető beállítás (Prémium)
- Szín és ikon választó

#### C. `NameDaySearch.jsx` - Névnap keresés (opcionális)

- Keresőmező név alapján
- Magyar névnapok adatbázisa
- Egy kattintással hozzáadás

#### D. `MemberBirthdayEditor.jsx` - Családtag születésnap szerkesztő

- Dátumválasztó a member profilban
- Automatikus eseménygenerálás mentés után

---

## 🎨 UI/UX Tervezés

### Színséma

- **Születésnapok:** Pasztell rózsaszín (#FFB6C1) vagy arany (#FFD700)
- **Névnapok:** Lila (#9370DB)
- **Évfordulók:** Piros (#FF6B6B)
- **Egyéb:** Kék (#4A90E2)

### Ikonok

- 🎂 Születésnap
- 🎁 Ajándékvásárlás emlékeztető
- 💍 Évforduló
- 📅 Névnap
- ⭐ Egyéb

---

## 🔐 Prémium Funkciók

### Ingyenes Szint

- ✅ Születésnap elmentése (családtagoknál)
- ✅ Éves esemény létrehozása
- ✅ Automatikus naptárbejegyzés (a napján)

### Prémium Szint

- ✅ **14 napos emlékeztető:** "Ajándékvásárlás: [Név] szülinapja hamarosan! 🎁"
- ✅ **2 napos emlékeztető:** "Torta és dekoráció ellenőrzése: [Név] szülinapja 🎂"
- ✅ Névnap keresés és automatikus hozzáadás
- ✅ Testreszabható emlékeztető időpontok

---

## 📝 Implementációs Lépések

### Fázis 1: Alapstruktúra (1-2 nap)

1. **Adatmodell bővítése:**
   - `recurrenceType` bővítése `'yearly'` opcióval
   - `annualEvents` kollekció létrehozása
   - `events` kollekció bővítése új mezőkkel

2. **Backend támogatás:**
   - `createEvent` function módosítása (yearly support)
   - `calendarUtils.js` bővítése (yearly recurrence logika)

### Fázis 2: Családtagok Születésnapjai (2-3 nap)

1. **UI fejlesztés:**
   - `MemberBirthdayEditor` komponens
   - Dátumválasztó integrálása a member profilba

2. **Automatikus generálás:**
   - `generateAnnualEvents` function
   - Trigger: member birthDate változás

### Fázis 3: Külső Események (2-3 nap)

1. **UI fejlesztés:**
   - `AnnualEventsPage` komponens
   - `AnnualEventModal` komponens
   - Menüpont hozzáadása

2. **Backend:**
   - CRUD műveletek annualEvents-hez
   - Automatikus eseménygenerálás

### Fázis 4: Intelligens Emlékeztetők (2-3 nap)

1. **Prémium ellenőrzés:**
   - `isPremium` validáció
   - Felugró ablak prémium funkciókhoz

2. **Emlékeztető generálás:**
   - 14 napos emlékeztető
   - 2 napos emlékeztető
   - Automatikus törlés múltbeli emlékeztetők után

### Fázis 5: Névnapok (Opcionális, 1-2 nap)

1. **Adatbázis:**
   - Magyar névnapok JSON fájl
   - Keresés funkció

2. **UI:**
   - `NameDaySearch` komponens
   - Integráció az `AnnualEventModal`-ba

---

## ⚠️ Kihívások és Megoldások

### 1. Éves Ismétlődés Számítása

**Probléma:** Az éves ismétlődésnél csak hónap/nap van (MM-DD), év nélkül.

**Megoldás:**
- Minden évben automatikusan generáljuk a következő év eseményeit
- Scheduled function (naponta fut) ellenőrzi és generálja a hiányzó eseményeket

### 2. Szökőév Kezelése

**Probléma:** Február 29. csak szökőévekben van.

**Megoldás:**
- Ha a születésnap február 29., akkor nem-szökőévekben február 28-án ünnepeljük
- Logika: `if (month === 2 && day === 29 && !isLeapYear(year)) { day = 28; }`

### 3. Prémium Validáció

**Probléma:** A prémium státusz ellenőrzése minden generálásnál.

**Megoldás:**
- Cache-elt prémium státusz a family dokumentumban
- Firebase function-ben ellenőrzés a generálás előtt

### 4. Teljesítmény

**Probléma:** Sok éves esemény esetén lassú lehet a generálás.

**Megoldás:**
- Batch processing (max 50 esemény/alkalom)
- Background job queue
- Incremental generation (csak a következő év generálása)

---

## 🧪 Tesztelési Terv

### Unit Tesztek

1. **Éves ismétlődés számítás:**
   - Február 29. kezelése
   - Normál dátumok
   - Több év előre generálás

2. **Emlékeztető generálás:**
   - 14 napos emlékeztető dátum számítás
   - 2 napos emlékeztető dátum számítás
   - Prémium ellenőrzés

### Integration Tesztek

1. **Teljes flow:**
   - Member születésnap beállítása → Esemény generálás
   - Annual event létrehozása → Esemény generálás
   - Prémium user → Emlékeztetők generálása

2. **Naptár megjelenítés:**
   - Éves események megjelennek a naptárban
   - Emlékeztetők megjelennek a naptárban
   - Színek és ikonok helyesek

---

## 📊 Sikeresség Mérési Mutatók

1. **Használat:**
   - Hány család használja az éves eseményeket
   - Átlagos éves események száma/család

2. **Prémium konverzió:**
   - Hány felhasználó választ prémiumot az emlékeztetők miatt

3. **Felhasználói elégedettség:**
   - Feedback a funkcióról
   - Bug reportok száma

---

## 🎯 Vélemény és Javaslatok

### ✅ Erősségek a Tervben

1. **Moduláris felépítés:** Külön kollekció az éves eseményekhez, könnyen bővíthető
2. **Prémium integráció:** Jó értéknövelő funkció
3. **Automatizáció:** Minimális felhasználói beavatkozás

### ⚠️ Javasolt Módosítások

1. **Éves ismétlődés implementáció:**
   - **Javaslat:** Ne használjunk `recurrenceType: 'yearly'`-t az events-ben, hanem külön logikát.
   - **Indok:** Az éves ismétlődésnél csak hónap/nap van, nem teljes dátum. Jobb, ha minden évben új eseményt generálunk az `annualEvents` alapján.

2. **Emlékeztetők tárolása:**
   - **Javaslat:** Ne külön eseményként tároljuk az emlékeztetőket, hanem az eredeti esemény `reminders` mezőjében.
   - **Indok:** Egyszerűbb kezelés, kevesebb adatbázis művelet.

3. **Névnapok:**
   - **Javaslat:** Kezdjük egyszerűen, statikus JSON fájllal. Később lehet API integráció.
   - **Indok:** Gyorsabb implementáció, könnyebb karbantartás.

4. **UI helye:**
   - **Javaslat:** Ne külön oldal, hanem a "Sablonok" oldalhoz hasonló fül az éves eseményeknek.
   - **Indok:** Konzisztens UX, könnyebb navigáció.

### 🚀 Prioritások

1. **Magas prioritás:**
   - Családtagok születésnapjai (alap funkció)
   - Éves ismétlődés támogatás
   - Automatikus naptárbejegyzés

2. **Közepes prioritás:**
   - Külső események (annualEvents)
   - Prémium emlékeztetők

3. **Alacsony prioritás:**
   - Névnapok integráció
   - Testreszabható emlékeztető időpontok

---

## 📅 Becsült Időkeret

- **Fázis 1:** 1-2 nap
- **Fázis 2:** 2-3 nap
- **Fázis 3:** 2-3 nap
- **Fázis 4:** 2-3 nap
- **Fázis 5:** 1-2 nap (opcionális)

**Összesen:** 8-13 nap (opcionális funkciókkal 9-15 nap)

---

## ❓ Nyitott Kérdések

1. **Névnapok adatbázisa:** Statikus fájl vagy külső API?
2. **Emlékeztető időpontok:** Fix (14 nap, 2 nap) vagy testreszabható?
3. **Törlés:** Mi történjen, ha egy member törlődik? Töröljük az eseményeket is?
4. **Szinkronizálás:** Mennyire gyakran futtassuk a scheduled function-t?

---

## 🎬 Következő Lépések

1. **Véleményezés:** Ezt a dokumentumot átnézni és dönteni a módosításokról
2. **Prototípus:** Egyszerű UI prototípus készítése
3. **Backend:** Éves ismétlődés logika implementálása
4. **Iteratív fejlesztés:** Fázisok szerint implementálás

---

**Dátum:** 2024
**Verzió:** 1.0
**Szerző:** AI Assistant

