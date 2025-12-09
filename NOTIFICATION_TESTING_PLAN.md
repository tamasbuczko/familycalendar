# PWA Értesítési Rendszer Tesztelési Terv

## 📋 Tesztelési Áttekintés

### Tesztelési Célok
- ✅ FCM token regisztráció és mentés
- ✅ Értesítési engedélyek kezelése
- ✅ Esemény értesítések ütemezése és küldése
- ✅ Időjárás riasztások működése
- ✅ Csendes órák logika
- ✅ Firebase Functions integráció
- ✅ Frontend komponensek működése

## 🧪 Tesztelési Környezetek

### 1. Lokális Fejlesztési Környezet
- **Frontend**: `npm run dev`
- **Firebase Emulator**: `firebase emulators:start`
- **Browser**: Chrome, Firefox, Safari

### 2. Firebase Functions Tesztelés
- **Lokális**: `firebase functions:shell`
- **Cloud**: `firebase deploy --only functions`

### 3. PWA Tesztelés
- **Desktop**: Chrome, Firefox
- **Mobile**: Chrome Mobile, Safari Mobile
- **Offline**: Service Worker tesztelés

## 🔧 Előfeltételek

### Firebase Konfiguráció
```bash
# 1. Firebase CLI bejelentkezés
firebase login

# 2. API kulcsok beállítása
firebase functions:config:set openweathermap.key="33ed77765365e783b70e4b7e6387f65f"
firebase functions:config:set vapid.public_key="YOUR_VAPID_PUBLIC_KEY"
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"

# 3. Functions telepítése
firebase deploy --only functions
```

### VAPID Kulcsok Generálása
```bash
# VAPID kulcsok generálása
npx web-push generate-vapid-keys
```

## 📱 Frontend Tesztelés

### 1. Értesítési Engedélyek
```javascript
// Tesztelendő funkciók:
- Notification.requestPermission()
- FCM token regisztráció
- Token Firestore-ba mentés
- Engedélyek ellenőrzése
```

**Teszt lépések:**
1. Alkalmazás megnyitása
2. Értesítési engedélyek kérése
3. FCM token megjelenítése
4. Token Firestore-ba mentés ellenőrzése

### 2. EventModal Emlékeztetők
```javascript
// Tesztelendő funkciók:
- Emlékeztető beállítások
- Idő választó működése
- Hang/rezgés beállítások
- Értesítési státusz megjelenítése
```

**Teszt lépések:**
1. Új esemény létrehozása
2. Emlékeztető beállítások tesztelése
3. Különböző emlékeztető idők kipróbálása
4. Mentés és ellenőrzés

### 3. WeatherWidget
```javascript
// Tesztelendő funkciók:
- Időjárás adatok lekérése
- Automatikus frissítés
- Öltözködési tanácsok
- Eső riasztások
```

**Teszt lépések:**
1. Widget megjelenítése
2. Időjárás adatok betöltése
3. Frissítés gomb működése
4. Automatikus frissítés ellenőrzése

### 4. NotificationSettings
```javascript
// Tesztelendő funkciók:
- Beállítások betöltése
- Beállítások mentése
- Teszt értesítés küldése
- Csendes órák beállítása
```

**Teszt lépések:**
1. Beállítások oldal megnyitása
2. Értesítési beállítások módosítása
3. Teszt értesítés küldése
4. Csendes órák tesztelése

## 🔥 Firebase Functions Tesztelés

### 1. Lokális Tesztelés
```bash
# Functions emulator indítása
cd functions
npm run serve

# Tesztelés
curl -X POST http://localhost:5001/familyweekcalendar/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"token":"FCM_TOKEN","title":"Teszt","body":"Teszt üzenet"}'
```

### 2. Cloud Functions Tesztelés
```bash
# Functions telepítése
firebase deploy --only functions

# Logok megtekintése
firebase functions:log
```

### 3. Cron Job Tesztelés
```javascript
// Tesztelendő funkciók:
- sendNotifications (minden percben)
- checkWeather (30 percenként)
- onEventCreated (esemény létrehozásakor)
```

## 📊 Adatbázis Tesztelés

### 1. Firestore Collections
```javascript
// Tesztelendő collections:
- notification_preferences
- scheduled_notifications
- weather_cache
```

**Teszt lépések:**
1. Adatok létrehozása
2. Adatok olvasása
3. Adatok frissítése
4. Adatok törlése

### 2. Adatbázis Szabályok
```javascript
// Firestore szabályok tesztelése:
- notification_preferences: olvasás/írás
- scheduled_notifications: olvasás/írás
- weather_cache: olvasás/írás
```

## 🌐 PWA Tesztelés

### 1. Service Worker
```javascript
// Tesztelendő funkciók:
- Service Worker regisztráció
- FCM háttér üzenetek
- Értesítés kattintás kezelése
- Offline működés
```

**Teszt lépések:**
1. Service Worker regisztráció
2. Háttér értesítések
3. Értesítés kattintás
4. Offline tesztelés

### 2. Push Értesítések
```javascript
// Tesztelendő funkciók:
- Értesítések megjelenítése
- Értesítés kattintás
- Értesítés bezárás
- Értesítés akciók
```

## 🧪 Tesztelési Forgatókönyvek

### 1. Teljes Értesítési Folyamat
1. **Felhasználó regisztráció**
   - Értesítési engedélyek kérése
   - FCM token regisztráció
   - Token Firestore-ba mentés

2. **Esemény létrehozás**
   - EventModal megnyitása
   - Emlékeztető beállítások
   - Esemény mentése
   - Értesítések ütemezése

3. **Értesítés küldés**
   - Cron job futtatása
   - Értesítés küldése
   - Értesítés megjelenítése
   - Értesítés kattintás

### 2. Időjárás Riasztások
1. **Időjárás ellenőrzés**
   - WeatherWidget betöltése
   - API hívás tesztelése
   - Adatok megjelenítése

2. **Riasztás küldés**
   - Eső észlelése
   - Riasztás ütemezése
   - Értesítés küldése

### 3. Csendes Órák
1. **Csendes órák beállítása**
   - NotificationSettings megnyitása
   - Csendes órák konfigurálása
   - Beállítások mentése

2. **Értesítés késleltetés**
   - Értesítés ütemezése csendes órákban
   - Késleltetés ellenőrzése
   - Következő elérhető idő számítása

## 🐛 Hibakeresés

### 1. Gyakori Hibák
```javascript
// FCM token hiba
- "No registration token available"
- "Token registration failed"

// Firebase Functions hiba
- "Weather API key not configured"
- "User must be authenticated"

// Service Worker hiba
- "Service Worker registration failed"
- "Background message handling failed"
```

### 2. Hibakeresési Eszközök
```bash
# Browser DevTools
- Console logok
- Network tab
- Application tab (Service Worker)

# Firebase Console
- Functions logok
- Firestore adatok
- Authentication

# Firebase CLI
- firebase functions:log
- firebase firestore:rules:get
```

## 📈 Teljesítmény Tesztelés

### 1. Időzítések
```javascript
// Mérni kell:
- FCM token regisztráció ideje
- Értesítés küldés ideje
- Időjárás API válasz ideje
- Service Worker válasz ideje
```

### 2. Memória Használat
```javascript
// Figyelni kell:
- Service Worker memória használat
- Firebase Functions memória
- Frontend komponensek memória
```

## ✅ Tesztelési Checklist

### Frontend
- [ ] Értesítési engedélyek kérése
- [ ] FCM token regisztráció
- [ ] EventModal emlékeztetők
- [ ] WeatherWidget működés
- [ ] NotificationSettings beállítások
- [ ] Service Worker regisztráció

### Firebase Functions
- [ ] sendTestNotification
- [ ] getUserNotificationPreferences
- [ ] saveUserNotificationPreferences
- [ ] getWeatherData
- [ ] sendNotifications cron job
- [ ] checkWeather cron job

### Adatbázis
- [ ] notification_preferences collection
- [ ] scheduled_notifications collection
- [ ] weather_cache collection
- [ ] Firestore szabályok

### PWA
- [ ] Service Worker működés
- [ ] Push értesítések
- [ ] Offline működés
- [ ] Értesítés kattintás

## 🚀 Telepítési Útmutató

### 1. Firebase Functions Telepítés
```bash
# 1. Bejelentkezés
firebase login

# 2. API kulcsok beállítása
firebase functions:config:set openweathermap.key="33ed77765365e783b70e4b7e6387f65f"

# 3. VAPID kulcsok beállítása
firebase functions:config:set vapid.public_key="YOUR_VAPID_PUBLIC_KEY"
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"

# 4. Functions telepítése
firebase deploy --only functions
```

### 2. Frontend Telepítés
```bash
# 1. Függőségek telepítése
npm install

# 2. Alkalmazás indítása
npm run dev

# 3. PWA build
npm run build
```

### 3. Tesztelés
```bash
# 1. Lokális tesztelés
npm run dev
firebase emulators:start

# 2. Cloud tesztelés
firebase deploy
```

## 📞 Támogatás

Ha problémák merülnek fel:
1. **Browser Console**: hibák ellenőrzése
2. **Firebase Console**: Functions logok
3. **Network Tab**: API hívások
4. **Service Worker**: háttér működés

## 🎯 Következő Lépések

A tesztelés után:
1. **Hibák javítása**
2. **Teljesítmény optimalizálás**
3. **Felhasználói visszajelzés**
4. **Produkciós telepítés**
