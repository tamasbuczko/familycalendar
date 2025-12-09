# Firebase Functions Telepítési Útmutató

## 📋 Előfeltételek

1. **Node.js 18+** telepítve
2. **Firebase CLI** telepítve: `npm install -g firebase-tools`
3. **Firebase projekt** létrehozva és konfigurálva

## 🚀 Telepítési lépések

### 1. Firebase CLI bejelentkezés
```bash
firebase login
```

### 2. Firebase projekt inicializálása (ha még nem történt meg)
```bash
firebase init functions
```

### 3. Functions függőségek telepítése
```bash
cd functions
npm install
```

### 4. TypeScript build
```bash
npm run build
```

### 5. Firebase Functions telepítése
```bash
firebase deploy --only functions
```

## ⚙️ Konfiguráció

### VAPID kulcs beállítása
```bash
firebase functions:config:set vapid.public_key="YOUR_VAPID_PUBLIC_KEY"
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"
```

### OpenWeatherMap API kulcs beállítása
```bash
firebase functions:config:set openweathermap.key="YOUR_OPENWEATHERMAP_API_KEY"
```

### Konfiguráció lekérése
```bash
firebase functions:config:get
```

## 🔧 Telepített Functions

### 1. **onEventCreated**
- **Trigger**: Esemény létrehozásakor
- **Funkció**: Automatikus értesítések ütemezése
- **Collection**: `artifacts/{projectId}/families/{familyId}/events/{eventId}`

### 2. **sendNotifications**
- **Trigger**: Minden percben (cron job)
- **Funkció**: Ütemezett értesítések küldése
- **Schedule**: `every 1 minutes`

### 3. **checkWeather**
- **Trigger**: 30 percenként (cron job)
- **Funkció**: Időjárás ellenőrzés és riasztások
- **Schedule**: `every 30 minutes`

### 4. **sendTestNotification**
- **Trigger**: HTTPS callable function
- **Funkció**: Teszt értesítés küldése
- **Használat**: Frontend teszteléshez

### 5. **getUserNotificationPreferences**
- **Trigger**: HTTPS callable function
- **Funkció**: Felhasználó értesítési beállításainak lekérése

### 6. **saveUserNotificationPreferences**
- **Trigger**: HTTPS callable function
- **Funkció**: Felhasználó értesítési beállításainak mentése

## 📊 Adatbázis Collections

### `scheduled_notifications`
```javascript
{
  userId: "user123",
  eventId: "event456",
  type: "event_reminder",
  scheduledTime: "2024-01-15T10:30:00Z",
  message: {
    title: "10 perc múlva ott kell lennie",
    body: "Iskola - Budapest",
    icon: "/icon-192x192.svg",
    data: {
      eventId: "event456",
      action: "view_event"
    }
  },
  status: "pending", // pending, sent, failed, cancelled
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2024-01-15T10:00:00Z"
}
```

### `weather_cache`
```javascript
{
  location: "Budapest,HU",
  currentWeather: {
    temperature: 15,
    condition: "rain",
    description: "enyhe eső",
    humidity: 80,
    windSpeed: 5,
    timestamp: "2024-01-15T10:30:00Z"
  },
  lastUpdated: "2024-01-15T10:30:00Z",
  nextUpdate: "2024-01-15T11:00:00Z"
}
```

## 🧪 Tesztelés

### 1. Lokális tesztelés
```bash
cd functions
npm run serve
```

### 2. Teszt értesítés küldése
```javascript
// Frontend kódban
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

const sendTestNotification = httpsCallable(functions, 'sendTestNotification');
const result = await sendTestNotification({
  token: 'FCM_TOKEN',
  title: 'Teszt',
  body: 'Teszt üzenet'
});
```

### 3. Functions logok megtekintése
```bash
firebase functions:log
```

## 🔍 Hibakeresés

### 1. Functions logok
```bash
firebase functions:log --only sendNotifications
```

### 2. Firestore szabályok ellenőrzése
```bash
firebase firestore:rules:get
```

### 3. Functions konfiguráció ellenőrzése
```bash
firebase functions:config:get
```

## 📱 Frontend integráció

### 1. Firebase Functions import
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';
```

### 2. Callable function használata
```javascript
const getUserPreferences = httpsCallable(functions, 'getUserNotificationPreferences');
const result = await getUserPreferences();
```

## 🚨 Fontos megjegyzések

1. **VAPID kulcsok**: Kötelezően be kell állítani a push értesítésekhez
2. **OpenWeatherMap API**: Szükséges az időjárás riasztásokhoz
3. **Firestore szabályok**: Ellenőrizni kell az adatbázis hozzáférési jogokat
4. **Cron jobok**: Automatikusan futnak, de lehetőleg tesztelni kell
5. **Rate limiting**: Firebase Functions-nak van limitje, figyelni kell

## 🔄 Frissítés

### Functions frissítése
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Konfiguráció frissítése
```bash
firebase functions:config:set vapid.public_key="NEW_KEY"
firebase deploy --only functions
```

## 📞 Támogatás

Ha problémák merülnek fel:
1. Ellenőrizd a Firebase Console-t
2. Nézd meg a Functions logokat
3. Teszteld lokálisan a `npm run serve` paranccsal
4. Ellenőrizd a Firestore szabályokat
