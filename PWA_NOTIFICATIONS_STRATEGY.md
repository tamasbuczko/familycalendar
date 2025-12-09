# PWA Értesítések Stratégia Dokumentáció

## 📱 **Áttekintés**

Ez a dokumentum részletezi a telefonra telepített PWA (Progressive Web App) értesítési rendszerének tervezését és implementációját. A cél az, hogy a szülők értesítést kapjanak eseményekről, például "10 perc múlva ott kell lennie az iskolában".

---

## 🎯 **Használati esetek**

### **1. Esemény emlékeztetők**
- **"10 perc múlva ott kell lennie az iskolában"** - apa telefonján rezeg
- **"30 perc múlva kezdődik a focimeccs"** - anya telefonján értesítés
- **"1 óra múlva orvosi időpont"** - mindkét szülő telefonján

### **2. Időjárás riasztások**
- **"Eső várható, vigyél esernyőt!"** - proaktív időjárás figyelés
- **"Hóesés várható, óvatosan vezess!"** - biztonsági riasztás

### **3. Családi koordináció**
- **"Gyerek elérte az iskolát"** - gyerek bejelentkezés értesítés
- **"Új esemény hozzáadva a naptárhoz"** - családi szinkronizáció

---

## 🔧 **Technológiai megoldás**

### **1. Firebase Cloud Messaging (FCM)**
- **Web Push API** használata PWA-ban
- **Service Worker** értesítések kezelése
- **Firebase Functions** háttér feldolgozás

### **2. PWA Service Worker bővítése**
```javascript
// Értesítési engedélyek kezelése
// Push üzenetek fogadása
// Értesítések megjelenítése
// Kattintási események kezelése
```

### **3. Firestore adatbázis struktúra**
```javascript
// notification_preferences collection
{
  userId: "user123",
  deviceTokens: ["token1", "token2"],
  preferences: {
    eventReminders: true,
    weatherAlerts: true,
    familyUpdates: true,
    reminderTimes: [10, 30, 60] // percek
  }
}

// scheduled_notifications collection
{
  eventId: "event123",
  userId: "user123",
  scheduledTime: "2024-01-15T14:50:00Z",
  message: "10 perc múlva ott kell lennie az iskolában",
  status: "pending" // pending, sent, failed
}
```

---

## 📋 **Implementációs lépések**

### **Phase 1: Alapértelmezett értesítések (1 hét)**

#### **1.1 Service Worker bővítése**
- [ ] Push üzenetek fogadása
- [ ] Értesítési engedélyek kezelése
- [ ] Értesítések megjelenítése
- [ ] Kattintási események kezelése

#### **1.2 Firebase Cloud Messaging integráció**
- [ ] FCM token regisztráció
- [ ] Token tárolása Firestore-ban
- [ ] Push üzenetek küldése

#### **1.3 Alapértelmezett emlékeztetők**
- [ ] 10 perces emlékeztető
- [ ] 30 perces emlékeztető
- [ ] 1 órás emlékeztető

### **Phase 2: Testreszabható értesítések (1 hét)**

#### **2.1 Értesítési beállítások**
- [ ] Felhasználói preferenciák kezelése
- [ ] Időzítési beállítások
- [ ] Értesítési típusok kiválasztása

#### **2.2 Esemény-specifikus értesítések**
- [ ] Esemény létrehozásakor értesítés beállítása
- [ ] Különböző emlékeztető idők
- [ ] Esemény típus szerinti értesítések

### **Phase 3: Fejlett értesítések (1 hét)**

#### **3.1 Időjárás integráció**
- [ ] Időjárás API integráció
- [ ] Proaktív időjárás riasztások
- [ ] Helyszín alapú értesítések

#### **3.2 Családi koordináció**
- [ ] Családtagok közötti értesítések
- [ ] Gyerek bejelentkezés értesítések
- [ ] Családi esemény frissítések

---

## 🎨 **Felhasználói élmény**

### **1. Első telepítés**
1. **PWA telepítése** telefonra
2. **Értesítési engedélyek** kérése
3. **Alapértelmezett beállítások** alkalmazása
4. **Teszt értesítés** küldése

### **2. Értesítési beállítások**
- **Beállítások menü** → **Értesítések**
- **Emlékeztető idők**: 5, 10, 15, 30, 60 perc
- **Értesítési típusok**: események, időjárás, családi frissítések
- **Csendes órák**: éjszaka, munkaidő

### **3. Értesítés megjelenítése**
```
🔔 Család Háló
10 perc múlva ott kell lennie az iskolában
Iskolai szülői értekezlet
14:00 - 15:00
```

---

## 🔒 **Biztonsági megfontolások**

### **1. Adatvédelem**
- **GDPR megfelelőség** értesítésekhez
- **Felhasználói hozzájárulás** minden értesítési típushoz
- **Adatok titkosítása** tranzitban és tárolásnál

### **2. Jogosultságok**
- **Családtagok** csak saját eseményeikről kapnak értesítést
- **Szülők** minden családi eseményről értesítést kapnak
- **Gyerekek** korlátozott értesítési jogosultságok

### **3. Rate limiting**
- **Értesítési limit** felhasználónként
- **Spam védelem** automatikus értesítéseknél
- **Backoff stratégia** sikertelen küldéseknél

---

## 📊 **Monitoring és analytics**

### **1. Értesítési metrikák**
- **Küldési arány**: hány értesítés került kiküldésre
- **Megnyitási arány**: hány értesítést nyitottak meg
- **Kattintási arány**: hány értesítésre kattintottak
- **Opt-out arány**: hány felhasználó kapcsolta ki

### **2. Hibakezelés**
- **Sikertelen küldések** naplózása
- **Token frissítés** automatikus kezelése
- **Retry mechanizmus** sikertelen értesítéseknél

---

## 🚀 **Telepítési folyamat**

### **1. PWA telepítés**
```javascript
// Service Worker regisztráció
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      // FCM token regisztráció
      return getToken(registration);
    });
}
```

### **2. Értesítési engedélyek**
```javascript
// Értesítési engedélyek kérése
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  // FCM token regisztráció
  const token = await getToken();
  // Token mentése Firestore-ban
}
```

### **3. Automatikus értesítések**
```javascript
// Esemény létrehozásakor
const event = {
  name: "Iskolai szülői értekezlet",
  date: "2024-01-15T15:00:00Z",
  reminders: [10, 30] // percek
};

// Értesítések ütemezése
await scheduleNotifications(event);
```

---

## 📱 **Platform specifikus megjegyzések**

### **1. iOS Safari**
- **Korlátozott PWA támogatás**
- **Értesítések csak Safari-ban** működnek
- **Home screen telepítés** szükséges

### **2. Android Chrome**
- **Teljes PWA támogatás**
- **Natív app-szerű élmény**
- **Háttér értesítések** működnek

### **3. Desktop böngészők**
- **Értesítések működnek** minden modern böngészőben
- **Desktop értesítések** megjelenítése
- **Kattintási események** kezelése

---

## 🎯 **Következő lépések**

### **1. Azonnali implementáció**
1. **Service Worker bővítése** értesítésekhez
2. **FCM integráció** beállítása
3. **Alapértelmezett emlékeztetők** implementálása
4. **Teszt értesítések** küldése

### **2. Felhasználói tesztelés**
1. **PWA telepítés** tesztelése
2. **Értesítési engedélyek** tesztelése
3. **Emlékeztetők** működésének ellenőrzése
4. **Felhasználói visszajelzések** gyűjtése

### **3. Optimalizálás**
1. **Értesítési timing** finomhangolása
2. **Felhasználói beállítások** bővítése
3. **Performance optimalizálás**
4. **Error handling** fejlesztése

---

## 📝 **Kapcsolódó fájlok**

- `public/sw.js` - Service Worker (bővíteni kell)
- `public/manifest.json` - PWA manifest (értesítések hozzáadása)
- `src/hooks/usePWAInstall.js` - PWA telepítés hook
- `src/components/calendar/EventModal.jsx` - Esemény létrehozás (értesítések hozzáadása)
- `src/components/calendar/SettingsPage.jsx` - Beállítások (értesítési beállítások)

---

*Utoljára frissítve: 2024 - PWA értesítések stratégia dokumentáció*
