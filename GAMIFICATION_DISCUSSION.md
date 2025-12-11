# 🎮 Gamifikáció - Vita Alap

## 📋 **Áttekintés**

A gamifikáció célja, hogy a gyerekek **imádják használni** a naptár alkalmazást. Játékos elemekkel motiváljuk őket, hogy következetesen használják az alkalmazást és teljesítsék az eseményeket.

**Fontos**: A gamifikációnak mindkét használati módban működnie kell:
- ✅ **Saját mobil**: Gyerek bejelentkezik gyerek módba → saját maga jelöli meg az eseményeket
- ✅ **Szülő telefonja**: Szülő használja az alkalmazást → szülő jelöli meg az eseményeket a gyerek nevében

---

## ✅ **MI VAN KÉSZ**

### **1. Pontszám Rendszer - Alapok** ⭐

#### **Implementált funkciók:**
- ✅ **Pontszám kezelő utility** (`gamificationUtils.js`)
  - Pontok hozzáadása esemény teljesítésért
  - Pontszám tárolása Firestore-ban (`member_points` collection)
  - Heti/havi/összesített pontszám követése
  - Pontszám történet (utolsó 100 bejegyzés)

- ✅ **"Teljesítve" gomb** mindkét nézetben
  - Heti/hétköznapi nézet (`CalendarView.jsx`)
  - Napi nézet (`DayView.jsx`)
  - Zöld pipa ikon, visszaállítás gomb

- ✅ **Pont hozzáadás logika**
  - **Gyerek módban**: `childSession.childId` alapján automatikus pont hozzáadás
  - **Szülő módban**: Esemény `assignedTo` alapján pont hozzáadás
  - Csak gyerekeknek (isChild: true) adunk pontokat
  - **Pont értékek**:
    - Alap esemény teljesítés: **10 pont**
    - Ismétlődő esemény teljesítés: **15 pont**

- ✅ **"Completed" státusz kezelés**
  - Esemény státusza "completed"-re állítva
  - `completedAt`, `completedBy`, `completedByUserId` mezők mentve
  - Teljesített események megjelennek a naptárban

#### **Adatbázis struktúra:**
```javascript
// member_points collection
{
  memberId: "member_123",
  familyId: "family_456",
  totalPoints: 340,
  weeklyPoints: 120,
  monthlyPoints: 450,
  pointsHistory: [
    {
      date: "2024-01-15",
      points: 15,
      reason: "event_completed",
      eventId: "event_789",
      eventName: "Foci edzés",
      completedBy: "child" | "parent",
      completedByUserId: "user_123" | null,
      timestamp: "2024-01-15T10:30:00Z"
    }
  ],
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

---

## 🚧 **MI HIÁNYZIK MÉG**

### **1. Pontszám Megjelenítés** 📊

#### **Prioritás: MAGAS**

**Hova kell megjelennie:**
- [ ] **Profil oldalon** (gyerek módban és szülő módban is)
  - Összesített pontszám
  - Heti pontszám
  - Havi pontszám
  - Pontszám történet (utolsó 10-20 bejegyzés)

- [ ] **Naptár nézetben** (esemény kártyákon)
  - Teljesített eseményeknél zöld pipa jelölés
  - Pontszám megjelenítés (opcionális, ha kell)

- [ ] **Családtagok listájában**
  - Pontszám mellett minden családtagnál
  - Ranglista jellegű megjelenítés

- [ ] **Dashboard-on** (ha lesz)
  - Gyors áttekintés
  - Heti/havi összesítés

**Kérdések:**
- Hogyan jelenítsük meg a pontszámot? (szám, ikon, progress bar?)
- Színezés? (pl. zöld = sok pont, piros = kevés pont)
- Frissítés gyakorisága? (real-time vagy cache-elt?)

---

### **2. Jelvény Rendszer** 🏆

#### **Prioritás: KÖZEPES**

**Jelvény típusok (tervezett):**
- 🥇 **Első lépések**: Első esemény teljesítése
- ⭐ **Hétfői hős**: Hétfőn minden eseményt teljesített
- 🔥 **Tűzforró**: 7 napig minden nap bejelentkezett
- 🎯 **Tökéletes hét**: Egy héten minden eseményt teljesített
- 📅 **Naptár mester**: 30 napig használta az alkalmazást
- 🏃 **Futó**: 10 sporteseményt teljesített
- 🎹 **Művész**: 10 művészeti eseményt teljesített
- 👑 **Családi király**: Egy héten a legtöbb pontot gyűjtötte
- 💪 **Kemény dió**: 50 eseményt teljesített
- 🌟 **Szuper csillag**: 100 eseményt teljesített

**Mit kell implementálni:**
- [ ] Jelvény típusok definiálása (konstansok)
- [ ] Jelvény megszerzés logika (automatikus ellenőrzés)
- [ ] Jelvény tárolása Firestore-ban (`member_achievements` collection)
- [ ] Jelvény kollekció megjelenítése (profil oldalon)
- [ ] Jelvény megszerzés értesítés (popup, animáció?)

**Kérdések:**
- Milyen jelvényeket szeretnénk? (fentiek jók, vagy mások?)
- Hogyan jelenítsük meg? (ikonok, kártyák, lista?)
- Animációk? (jelvény megszerzéskor popup, confetti?)

---

### **3. Napi Kihívások** 🎯

#### **Prioritás: KÖZEPES**

**Kihívás típusok (tervezett):**
- "Teljesíts 3 eseményt ma" → 25 pont
- "Jelentkezz be 3 napig egymás után" → 25 pont
- "Teljesíts egy sporteseményt" → 25 pont
- "Teljesíts egy művészeti eseményt" → 25 pont
- "Nézd meg a naptárat reggel" → 5 pont

**Mit kell implementálni:**
- [ ] Kihívás generálás (minden nap új kihívás)
- [ ] Kihívás tárolása Firestore-ban (`daily_challenges` collection)
- [ ] Kihívás teljesítés ellenőrzés (automatikus)
- [ ] Kihívás megjelenítés (dashboard, naptár fejléc)
- [ ] Progress bar (pl. "2/3 esemény teljesítve")
- [ ] Jutalmak (pontok + speciális jelvény lehetőség)

**Kérdések:**
- Milyen kihívásokat szeretnénk? (fentiek jók, vagy mások?)
- Hogyan generáljuk? (véletlenszerű, vagy sorrendben?)
- Hány kihívás legyen egyszerre? (1, 2, 3?)

---

### **4. Családi Ranglista** 📊

#### **Prioritás: ALACSONY**

**Ranglista típusok:**
- **Heti ranglista**: Az aktuális hét pontszámai
- **Havi ranglista**: Az aktuális hónap pontszámai
- **Összesített ranglista**: Minden idők pontszámai

**Mit kell implementálni:**
- [ ] Pontszámok összesítése (heti/havi/összesített)
- [ ] Ranglista számítás (rendezés pontszám szerint)
- [ ] Ranglista megjelenítés (dashboard, profil oldal)
- [ ] Győztes kijelölése (heti/havi győztes jelvény)
- [ ] Frissítés gyakorisága (real-time vagy cache-elt?)

**Kérdések:**
- Hogyan jelenítsük meg? (táblázat, kártyák, lista?)
- Színezés? (arany = 1. hely, ezüst = 2. hely, bronz = 3. hely)
- Animációk? (ranglista változás animáció?)

---

## 💡 **ÖTLETEK ÉS KÉRDÉSEK**

### **1. Pontszám Rendszer**

**Kérdések:**
- ✅ **Pont értékek jók?** (10 pont alap, 15 pont ismétlődő)
- ❓ **Kell-e bónusz pont?** (pl. hét teljesítés = 50 pont bónusz)
- ❓ **Kell-e napi bejelentkezés pont?** (5 pont, csak saját mobil esetén)
- ❓ **Kell-e kategória alapú pontszám?** (sport, művészet, tanulás külön pontszám?)

**Ötletek:**
- **Streak rendszer**: Hány napig teljesített minden eseményt? (bónusz pontok)
- **Hét teljesítés bónusz**: Ha egy héten minden eseményt teljesített → 50 pont bónusz
- **Kategória bónuszok**: Pl. 10 sportesemény után extra pontok

---

### **2. Jelvény Rendszer**

**Kérdések:**
- ❓ **Milyen jelvényeket szeretnénk?** (fentiek jók, vagy mások?)
- ❓ **Hogyan jelenítsük meg?** (ikonok, kártyák, lista?)
- ❓ **Animációk?** (jelvény megszerzéskor popup, confetti?)
- ❓ **Ritkaság?** (ritka jelvények = több érték?)

**Ötletek:**
- **Szezonális jelvények**: Pl. "Karácsonyi hős" (decemberben minden eseményt teljesített)
- **Családi jelvények**: Pl. "Családi csapat" (minden családtag teljesített egy héten)
- **Speciális jelvények**: Pl. "100 nap streak" (100 napig minden nap bejelentkezett)

---

### **3. Napi Kihívások**

**Kérdések:**
- ❓ **Milyen kihívásokat szeretnénk?** (fentiek jók, vagy mások?)
- ❓ **Hogyan generáljuk?** (véletlenszerű, vagy sorrendben?)
- ❓ **Hány kihívás legyen egyszerre?** (1, 2, 3?)
- ❓ **Kell-e nehézségi szint?** (könnyű, közepes, nehéz?)

**Ötletek:**
- **Személyre szabott kihívások**: Pl. "Teljesíts 3 sporteseményt" (ha sokat sportol)
- **Családi kihívások**: Pl. "Minden családtag teljesítse a mai eseményeit"
- **Heti kihívások**: Pl. "Teljesíts 10 eseményt ezen a héten"

---

### **4. Családi Ranglista**

**Kérdések:**
- ❓ **Hogyan jelenítsük meg?** (táblázat, kártyák, lista?)
- ❓ **Színezés?** (arany = 1. hely, ezüst = 2. hely, bronz = 3. hely)
- ❓ **Animációk?** (ranglista változás animáció?)
- ❓ **Kell-e privát mód?** (ha valaki nem akarja, hogy lássák a pontszámát?)

**Ötletek:**
- **Csapat ranglista**: Családok közötti verseny (ha több család használja)
- **Szezonális ranglista**: Pl. "Téli szezon győztese"
- **Kategória ranglista**: Pl. "Sport ranglista", "Művészet ranglista"

---

## 🎯 **KÖVETKEZŐ LÉPÉSEK**

### **Rövid távú (1-2 hét):**
1. ✅ Pontszám rendszer alapok (KÉSZ)
2. ⏳ Pontszám megjelenítés (profil oldalon, naptár nézetben)
3. ⏳ Teljesített események vizuális jelölése (zöld pipa)

### **Középtávú (2-4 hét):**
4. ⏳ Jelvény rendszer alapok (jelvény típusok, megszerzés logika)
5. ⏳ Jelvény kollekció megjelenítése
6. ⏳ Napi kihívások (kihívás generálás, teljesítés ellenőrzés)

### **Hosszú távú (1-2 hónap):**
7. ⏳ Családi ranglista
8. ⏳ Dashboard (pontszám, jelvények, kihívások összefoglaló)
9. ⏳ Speciális funkciók (streak rendszer, bónusz pontok)

---

## 📝 **JEGYZETEK**

### **Technikai részletek:**
- **Firestore collections:**
  - `member_points` - Pontszámok tárolása
  - `member_achievements` - Jelvények tárolása (még nincs)
  - `daily_challenges` - Napi kihívások tárolása (még nincs)

- **Komponensek:**
  - `gamificationUtils.js` - Pontszám kezelő utility (KÉSZ)
  - `PointsDisplay.jsx` - Pontszám megjelenítő komponens (még nincs)
  - `BadgeCollection.jsx` - Jelvény kollekció komponens (még nincs)
  - `DailyChallenge.jsx` - Napi kihívás komponens (még nincs)
  - `Leaderboard.jsx` - Ranglista komponens (még nincs)

### **Dizájn kérdések:**
- Színezés? (zöld = jó, piros = rossz?)
- Ikonok? (Font Awesome, emoji, custom?)
- Animációk? (popup, confetti, progress bar?)

---

## ❓ **VITA PONTOK**

1. **Pontszám megjelenítés**: Hogyan jelenítsük meg? Hol jelenjen meg?
2. **Jelvény rendszer**: Milyen jelvényeket szeretnénk? Hogyan jelenítsük meg?
3. **Napi kihívások**: Milyen kihívásokat szeretnénk? Hogyan generáljuk?
4. **Családi ranglista**: Kell-e? Hogyan jelenítsük meg?
5. **Bónusz pontok**: Kell-e streak rendszer? Hét teljesítés bónusz?
6. **Dizájn**: Színezés, ikonok, animációk?

---

## 📚 **DOKUMENTÁCIÓ**

- **Gamifikáció terv**: `GAMIFICATION_PLAN.md` (részletes terv)
- **Implementáció**: `src/utils/gamificationUtils.js` (pontszám kezelő)
- **Komponensek**: `src/components/calendar/CalendarView.jsx`, `DayView.jsx` (Teljesítve gomb)

---

**Utolsó frissítés**: 2024. január (pontszám rendszer alapok implementálva)

