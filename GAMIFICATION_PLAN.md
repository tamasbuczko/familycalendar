# 🎮 Gamifikáció Fejlesztési Terv - Család Háló

## 📋 **Áttekintés**

A gamifikáció célja, hogy a gyerekek imádják használni a naptár alkalmazást. Játékos elemekkel motiváljuk őket, hogy következetesen használják az alkalmazást és teljesítsék az eseményeket.

**Fontos**: A gamifikációnak mindkét használati módban működnie kell:
- **Saját mobil**: Gyerek bejelentkezik gyerek módba (childSession) → saját maga jelöli meg az eseményeket
- **Szülő telefonja**: Szülő használja az alkalmazást → szülő jelöli meg az eseményeket a gyerek nevében

---

## 🎯 **Fő Funkciók**

### **1. Pontszám Rendszer** ⭐
- **Esemény teljesítésért pontok**: Minden esemény teljesítésekor pontokat kapnak
- **Pont értékek**:
  - Alap esemény teljesítés: **10 pont**
  - Ismétlődő esemény teljesítés: **15 pont** (több effort)
  - Kihívás teljesítés: **25 pont**
  - Napi bejelentkezés: **5 pont** (csak saját mobil esetén)
  - Hét teljesítés (minden esemény): **50 pont bónusz**
- **Esemény teljesítés módok**:
  - **Gyerek módban**: Gyerek saját maga jelöli meg "Teljesítve" gombbal
  - **Szülő módban**: Szülő jelöli meg a gyerek eseményét "Teljesítve" gombbal (gyerek nevében)
- **Pontszám tárolása**: Firestore `member_points` collection
- **Pontszám megjelenítése**: 
  - Profil oldalon (gyerek módban és szülő módban is)
  - Naptár nézetben (esemény kártyákon)
  - Dashboard-on
  - Családtagok listájában (pontszám mellett)

### **2. Jelvény Rendszer** 🏆
- **Jelvény típusok**:
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
- **Jelvény megszerzése**: Automatikus ellenőrzés esemény teljesítéskor
- **Jelvény kollekció**: Profil oldalon megjelenítve

### **3. Napi Kihívások** 🎯
- **Kihívás típusok**:
  - "Teljesíts 3 eseményt ma"
  - "Jelentkezz be 3 napig egymás után"
  - "Teljesíts egy sporteseményt"
  - "Teljesíts egy művészeti eseményt"
  - "Nézd meg a naptárat reggel"
- **Kihívás generálás**: Minden nap új kihívás
- **Jutalmak**: Pontok + speciális jelvény lehetőség
- **Kihívás megjelenítés**: Dashboard-on, naptár fejlécben

### **4. Családi Ranglista** 📊
- **Ranglista típusok**:
  - **Heti ranglista**: Az aktuális hét pontszámai
  - **Havi ranglista**: Az aktuális hónap pontszámai
  - **Összesített ranglista**: Minden idők pontszámai
- **Ranglista megjelenítés**: 
  - Dashboard-on
  - Profil oldalon
  - Családi nézetben
- **Győztes kijelölése**: Heti/havi győztes jelvény

---

## 🗄️ **Adatbázis Struktúra (Firestore)**

### **member_points Collection**
```javascript
{
  memberId: "member_123", // Gyerek member ID (isChild: true)
  familyId: "family_456",
  totalPoints: 340,
  weeklyPoints: 120,
  monthlyPoints: 450,
  pointsHistory: [
    {
      date: "2024-01-15",
      points: 25,
      reason: "event_completed",
      eventId: "event_789",
      completedBy: "child" | "parent", // Ki jelölte meg (childSession vagy admin)
      completedByUserId: "user_123" // Ha szülő, akkor userId, ha gyerek, akkor null
    }
  ],
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### **member_achievements Collection**
```javascript
{
  memberId: "member_123",
  familyId: "family_456",
  badges: [
    {
      badgeId: "first_steps",
      badgeName: "Első lépések",
      badgeIcon: "🥇",
      earnedAt: "2024-01-10T08:00:00Z",
      description: "Első esemény teljesítése"
    }
  ],
  stats: {
    totalEventsCompleted: 45,
    consecutiveDays: 7,
    perfectWeeks: 2,
    totalDaysActive: 30
  },
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### **daily_challenges Collection**
```javascript
{
  challengeId: "challenge_123",
  familyId: "family_456",
  date: "2024-01-15",
  challengeType: "complete_3_events",
  challengeName: "Teljesíts 3 eseményt ma",
  challengeDescription: "Teljesíts 3 eseményt ma és kapj 25 pontot!",
  rewardPoints: 25,
  rewardBadge: null,
  completedBy: ["member_123", "member_456"],
  isActive: true,
  createdAt: "2024-01-15T00:00:00Z"
}
```

---

## 🎨 **UI Komponensek**

### **1. PointsDisplay Component**
- Pontszám megjelenítése
- Animáció pont hozzáadásakor
- Színes, játékos design
- **Használat**: Gyerek módban és szülő módban is (gyerek profilján)

### **2. BadgeCollection Component**
- Jelvények megjelenítése
- Jelvény részletek modal
- Új jelvény animáció
- **Használat**: Gyerek módban és szülő módban is (gyerek profilján)

### **3. DailyChallenge Component**
- Napi kihívás kártya
- Progress bar
- Teljesítés gomb
- **Használat**: Gyerek módban (saját kihívás) és szülő módban (gyerek kihívása)

### **4. Leaderboard Component**
- Ranglista táblázat
- Avatarok és nevek
- Pontszámok
- Győztes kiemelése
- **Használat**: Mindkét módban (családi ranglista)

### **5. GamificationDashboard Component**
- Összesítő nézet
- Pontszám, jelvények, kihívások
- Statisztikák
- **Használat**: Gyerek módban (saját dashboard) és szülő módban (gyerek dashboard megtekintése)

### **6. EventCompletionButton Component** ⭐ **ÚJ**
- "Teljesítve" gomb esemény kártyákon
- Gyerek módban: gyerek saját maga jelöli meg
- Szülő módban: szülő jelöli meg a gyerek eseményét
- Pont hozzáadás animáció
- **Használat**: Naptár nézetben, esemény kártyákon

### **7. ChildProfileGamification Component** ⭐ **ÚJ**
- Gyerek profil gamifikációs része
- Pontszám, jelvények, kihívások, ranglista
- **Használat**: Szülő módban, amikor megnyitja a gyerek profilját

---

## 🔧 **Implementációs Lépések**

### **1. Lépés: Pontszám Rendszer Alapok**
- [ ] `member_points` collection létrehozása
- [ ] Pont hozzáadás logika esemény teljesítéskor
  - [ ] Gyerek módban: childSession alapján
  - [ ] Szülő módban: esemény `assignedTo` mezője alapján
- [ ] "Teljesítve" gomb hozzáadása esemény kártyákhoz
- [ ] Pontszám megjelenítés profil oldalon (gyerek és szülő módban is)
- [ ] Pontszám megjelenítés naptár nézetben
- [ ] Pontszám megjelenítés családtagok listájában

### **2. Lépés: Jelvény Rendszer**
- [ ] Jelvény típusok definiálása
- [ ] Jelvény megszerzés logika
- [ ] Jelvény kollekció komponens
- [ ] Új jelvény értesítés

### **3. Lépés: Napi Kihívások**
- [ ] Kihívás generálás logika
- [ ] Kihívás megjelenítés
- [ ] Kihívás teljesítés ellenőrzés
- [ ] Jutalmak kiosztása

### **4. Lépés: Családi Ranglista**
- [ ] Ranglista számítás logika
- [ ] Ranglista komponens
- [ ] Heti/havi győztes kijelölése
- [ ] Ranglista megjelenítés dashboard-on

### **5. Lépés: Integráció és Finomhangolás**
- [ ] Gyerek mód integráció (childSession alapján)
- [ ] Szülő mód integráció (esemény assignedTo alapján)
- [ ] "Teljesítve" gomb mindkét módban
- [ ] Gyerek profil megtekintés szülő módban
- [ ] Animációk és effektek
- [ ] Értesítések jelvény megszerzéskor
- [ ] Statisztikák és analytics
- [ ] Offline támogatás (pontok cache-elése)

---

## 🎮 **Használati Példák**

### **Esemény Teljesítés - Saját Mobil (Gyerek Mód)**
1. Gyerek bejelentkezik gyerek módba (childSession)
2. Megnézi a mai eseményeket
3. Esemény teljesítése után kattint a "Teljesítve" gombra
4. **+10 pont** animáció
5. Ha új jelvényt szerzett, értesítés jelenik meg

### **Esemény Teljesítés - Szülő Telefonja**
1. Szülő bejelentkezik admin módba
2. Megnézi a gyerek eseményeit a naptárban
3. Esemény teljesítése után kattint a "Teljesítve" gombra (gyerek nevében)
4. Pontok automatikusan a gyerek profiljához kerülnek
5. Gyerek profil oldalán látható a pontszám és jelvények
6. **Opcionális**: Értesítés a gyereknek (ha van saját mobilos beállítás)

### **Gyerek Profil Megtekintése (Szülő Módban)**
1. Szülő megnyitja a családtagok listáját
2. Rákattint a gyerek profiljára
3. Látja a gyerek pontszámát, jelvényeit, statisztikáit
4. Látja a napi kihívás progressét
5. Látja a ranglistán való helyezését

### **Napi Kihívás**
1. Reggel bejelentkezéskor látja a napi kihívást
2. "Teljesíts 3 eseményt ma" - progress bar
3. Minden esemény teljesítéskor frissül a progress
4. 3 esemény után automatikus teljesítés
5. **+25 pont** + speciális jelvény lehetőség

### **Családi Ranglista**
1. Heti ranglista megjelenítése
2. Minden családtag pontszáma látható
3. Győztes kiemelve arany színnel
4. Heti győztes kap "👑 Családi király" jelvényt

---

## 🎨 **Design Elvek**

- **Színes és játékos**: Vibráns színek, emoji ikonok
- **Pozitív visszajelzés**: Animációk, ünneplés
- **Motiváló**: Célok, progress barok, jutalmak
- **Egyszerű**: Könnyen érthető, gyerekbarát
- **Vizuális**: Sok kép, ikon, animáció

---

## 📊 **Mérőszámok**

- **Engagement**: Napi aktív gyerekek száma (saját mobil + szülő telefon)
- **Pontszámok**: Átlagos pontszám gyerekenként
- **Jelvények**: Jelvény megszerzési arány
- **Kihívások**: Kihívás teljesítési arány
- **Ranglista**: Ranglista megtekintési arány
- **Használati mód**: Hány gyerek használja saját mobil vs. szülő telefon
- **Teljesítés mód**: Hány eseményt jelöltek meg gyerek módban vs. szülő módban

---

## 🚀 **Következő Lépések**

1. **Pontszám rendszer alapok** - Kezdjük ezzel, mert ez a legfontosabb
   - Esemény "Teljesítve" gomb mindkét módban
   - Pont hozzáadás logika (gyerek mód + szülő mód)
   - Pontszám megjelenítés
2. **Jelvény rendszer** - Ez adja a hosszú távú motivációt
3. **Napi kihívások** - Napi engagement növelése
4. **Családi ranglista** - Verseny és közösség
5. **Gyerek profil gamifikáció** - Szülő módban is látható

---

## 💡 **Kulcs Megfontolások**

### **Gyerekek saját mobil nélkül:**
- Szülő jelöli meg az eseményeket a gyerek nevében
- Pontok automatikusan a gyerek profiljához kerülnek
- Gyerek profil oldalán látható minden (pontok, jelvények, ranglista)
- Szülő megmutathatja a gyereknek: "Nézd, 50 pontot gyűjtöttél!"

### **Gyerekek saját mobillal:**
- Gyerek saját maga jelöli meg az eseményeket
- Azonnali visszajelzés (animáció, pontok)
- Önálló használat, motiváció

### **Hibrid használat:**
- Egy gyerek használhatja mindkét módon
- Pontok összeadódnak
- Jelvények mindkét módon megszerezhetők

---

*Utoljára frissítve: 2024 - Gamifikáció fejlesztési terv (frissítve: saját mobil + szülő telefon támogatás)*

