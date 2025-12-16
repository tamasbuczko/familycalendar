# Válaszok a Gemini AI Kérdéseire

## I. Kész Funkció: Ismétlődés Menedzsment Oldal

### 1. Ismétlődési minta tárolása

**Válasz:** Az ismétlődési minta **külön mezőkben** van tárolva Firestore-ban, nem JSON stringként. Az adatmodell a következő:

```javascript
{
  recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly',  // String enum
  startDate: 'YYYY-MM-DD' | null,                          // String dátum (ISO formátum)
  endDate: 'YYYY-MM-DD' | null,                            // String dátum (opcionális)
  recurrenceDays: [0, 1, 2, ...],                          // Tömb, csak heti ismétlődésnél (0=Vasárnap, 1=Hétfő...)
  exceptions: [{                                            // Kivételek tömbje
    date: 'YYYY-MM-DD',
    status: 'cancelled' | 'active',
    // ... egyéb módosított mezők
  }]
}
```

**Hely:** `src/components/calendar/EventModal.jsx` (sorok: 28-42, 349-353)
**Firestore collection:** `artifacts/{projectId}/families/{familyId}/events`

### 2. Front-end komponens az ismétlődő események listájához

**Válasz:** **Card/Kártya komponens** használata, nem táblázat. A lista egy grid layout-ban jelenik meg, ahol minden esemény egy külön kártya.

**Hely:** `src/components/calendar/RecurringEventsPage.jsx` (sorok: ~400-500)
**Komponens típus:** React komponens, Tailwind CSS grid layout (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
**Minden kártya tartalmazza:**
- Esemény neve
- Hozzárendelt családtag(ok) (avatar + név)
- Időpont
- Ismétlődési minta (pl. "Heti - Hétfő és Szerda")
- Kezdő és vég dátum
- Szerkesztés/Törlés gombok

---

## II. Fejlesztés Alatt: Gyors Bevitel (Quick Add)

### 1. Global Templates tárolása

**Válasz:** **Statikusan tárolva** egy **konstans tömbben** JavaScript fájlban, nem adatbázisból.

**Hely:** `src/data/globalTemplates.js`
**Struktúra:**
```javascript
export const globalTemplates = [
  { id: 'school', name: 'Iskola', category: 'Iskola és Oktatás', icon: '🏫', color: '#3B82F6' },
  // ... ~110 sablon
];
```

**Előnyök:**
- Gyors hozzáférés, nincs adatbázis lekérdezés
- Könnyen karbantartható
- Verziókezelt a kóddal együtt

### 2. UI komponens a Quick Add bevitelhez

**Válasz:** **Egyszerű input mező** + **grid layout** a sablonok megjelenítéséhez. Nincs komplex autocomplete/dropdown komponens.

**Hely:** `src/components/calendar/QuickAddModal.jsx`
**Komponens részletek:**
- Input mező: `<input type="text">` kereséshez (sor: ~200)
- Grid layout: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4` a sablonokhoz
- Valós idejű szűrés: `useMemo` hook a keresés optimalizálásához
- Két szekció: "Saját sablonok" és "Előre definiált sablonok"

**Nincs még:**
- Autocomplete dropdown
- Természetes nyelvű értelmezés
- Komplex UI library (pl. Material-UI, Ant Design)

### 3. Természetes nyelvű értelmezés

**Válasz:** **Nincs még implementálva** természetes nyelvű értelmezés. Jelenleg csak **keresés** működik a sablonok között (név és kategória alapján).

**Jelenlegi működés:**
- Felhasználó gépel a kereső mezőbe
- `useMemo` hook szűri a Global és User Templates-eket
- Szűrés: `template.name.toLowerCase().includes(searchQuery)`

**Nincs használva:**
- Moment.js
- Date-fns
- RegEx alapú dátum/idő értelmezés
- NLP könyvtárak

**Későbbi tervek:** A természetes nyelvű értelmezés (pl. "Zongoraóra Petinek Szerdán 16:00-ra") még nincs implementálva, de tervezett funkció.

---

## III. Üzleti és Monetizációs Alapok

### 1. Előfizetési státusz adatmodell

**Válasz:** **Van alapvető struktúra**, de még nincs teljesen implementálva.

**Hely:** `src/utils/usageLimits.js`
**Jelenlegi struktúra:**
```javascript
export const USER_PLANS = {
  FREE: { ... },
  PREMIUM: { ... }
};

export const getUserPlan = (user) => {
  return user?.isPremium ? 'PREMIUM' : 'FREE';
};
```

**Mező neve:** `isPremium` (boolean) a user objektumban

**Jelenlegi állapot:**
- Van `usageLimits.js` fájl, ami definiálja a FREE és PREMIUM limit-eket
- Van `UsageStatsModal` komponens, ami ellenőrzi a `isPremium` mezőt
- **Nincs még** teljes Firestore integráció az előfizetési státusz tárolására
- **Nincs még** fizetési integráció (Stripe, PayPal, stb.)

**Szükséges fejlesztés:**
- Firestore `users/{userId}` dokumentumban `isPremium: boolean` mező
- `subscriptionLevel: 'FREE' | 'PREMIUM'` mező (opcionális)
- `subscriptionExpiresAt: timestamp` (opcionális)

### 2. Legnehezebb technikai feladat

**Válasz:** A legnehezebb technikai feladat a **természetes nyelvű értelmezés (NLP)** implementálása a Quick Add funkcióhoz.

**Miért nehéz:**
1. **Dátum/idő értelmezés:** "Szerdán 16:00-ra", "holnap délután", "jövő hét pénteken"
2. **Személy azonosítás:** "Petinek", "Gábornak", "a gyereknek"
3. **Többnyelvű támogatás:** Magyar nyelvű bevitel értelmezése
4. **Hibakezelés:** Ambiguitás kezelése, javaslatok adása

**Alternatív megoldások:**
- **Könnyebb:** RegEx alapú dátum/idő értelmezés (korlátozott)
- **Közepes:** Date-fns vagy Moment.js használata dátum értelmezéshez
- **Nehezebb:** Teljes NLP megoldás (pl. saját parser vagy külső API)

**Javaslat:** Kezdjük egy egyszerűbb megoldással (RegEx + dátum parsing), majd fokozatosan bővítsük.

---

## Összefoglaló

| Kérdés | Válasz |
|--------|--------|
| **Ismétlődési minta tárolása** | Külön mezőkben (recurrenceType, startDate, endDate, recurrenceDays) |
| **Front-end komponens** | Card/Kártya komponens, grid layout |
| **Global Templates tárolása** | Statikusan konstans tömbben (globalTemplates.js) |
| **Quick Add UI** | Egyszerű input mező + grid layout |
| **Természetes nyelvű értelmezés** | Nincs még implementálva |
| **Előfizetési státusz** | Van `isPremium` mező, de nincs teljes integráció |
| **Legnehezebb feladat** | Természetes nyelvű értelmezés (NLP) implementálása |

