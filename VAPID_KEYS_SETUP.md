# VAPID Kulcsok Beállítása

## 🔑 VAPID Kulcsok Generálása

### 1. Web-push csomag telepítése
```bash
npm install -g web-push
```

### 2. VAPID kulcsok generálása
```bash
npx web-push generate-vapid-keys
```

### 3. Kimeneti példa
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa40HI8lF3V2VjG_sNcE5rf5QiINR40v8g4jXk6c7y0xdg5OwvJ21L3LwLqVU

Private Key:
gndrIx83fXqb98PycTwhvomqntGauhv6dDbHtaiVrFQ
=======================================
```

## ⚙️ Firebase Functions Konfiguráció

### 1. VAPID kulcsok beállítása
```bash
firebase functions:config:set vapid.public_key="BEl62iUYgUivxIkv69yViEuiBIa40HI8lF3V2VjG_sNcE5rf5QiINR40v8g4jXk6c7y0xdg5OwvJ21L3LwLqVU"
firebase functions:config:set vapid.private_key="gndrIx83fXqb98PycTwhvomqntGauhv6dDbHtaiVrFQ"
```

### 2. Konfiguráció ellenőrzése
```bash
firebase functions:config:get
```

## 🔧 Frontend Konfiguráció

### 1. VAPID kulcs frissítése
```javascript
// src/main.jsx
const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI8lF3V2VjG_sNcE5rf5QiINR40v8g4jXk6c7y0xdg5OwvJ21L3LwLqVU';

// src/utils/notificationUtils.js
const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI8lF3V2VjG_sNcE5rf5QiINR40v8g4jXk6c7y0xdg5OwvJ21L3LwLqVU';
```

### 2. Service Worker frissítése
```javascript
// public/sw.js
applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI8lF3V2VjG_sNcE5rf5QiINR40v8g4jXk6c7y0xdg5OwvJ21L3LwLqVU'
```

## 🚀 Telepítés

### 1. Functions telepítése
```bash
firebase deploy --only functions
```

### 2. Frontend build
```bash
npm run build
```

## ✅ Tesztelés

### 1. VAPID kulcs tesztelése
```bash
curl -X POST http://localhost:5001/familyweekcalendar/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"token":"FCM_TOKEN","title":"Teszt","body":"VAPID kulcs teszt"}'
```

### 2. Értesítések tesztelése
- Browser értesítési engedélyek
- FCM token regisztráció
- Teszt értesítés küldése
