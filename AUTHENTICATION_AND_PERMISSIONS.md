# 🔐 **AUTHENTICATION & PERMISSIONS SYSTEM**
## **Bejelentkezési és Jogosultság Kezelési Rendszer**

---

## 📋 **TÁBLÁZAT TARTALMA**

### **1. Felhasználói Típusok és Jogosultságok**
### **2. Bejelentkezési Folyamatok**
### **3. PIN Rendszerek**
### **4. Device Type Kezelés**
### **5. Session Management**
### **6. Security Rules**
### **7. Database Schema**
### **8. UI Flow Diagrams**

---

## 👥 **1. FELHASZNÁLÓI TÍPUSOK ÉS JOGOSULTSÁGOK**

### **1.1 Admin Felhasználó (Szülő)**
- **Regisztráció:** Email/Google/Facebook
- **Jogosultságok:** Teljes admin hozzáférés
- **Funkciók:**
  - Család létrehozása és kezelése
  - Családtagok hozzáadása/szerkesztése/törlése
  - Gyerek profilok létrehozása
  - Események kezelése
  - Meghívók küldése
  - Device type beállítása
  - Szülői PIN beállítása

### **1.2 Gyerek Profil (Guest User)**
- **Létrehozás:** Admin által
- **Jogosultságok:** Korlátozott hozzáférés
- **Funkciók:**
  - Saját események megtekintése
  - Saját profil megtekintése
  - PIN alapú bejelentkezés

### **1.3 Meghívott Családtag**
- **Regisztráció:** Meghívó link alapján
- **Jogosultságok:** Családtag szintű
- **Funkciók:**
  - Családi naptár megtekintése
  - Saját események kezelése
  - Profil beállítások

---

## 🔑 **2. BEJELENTKEZÉSI FOLYAMATOK**

### **2.1 Első Regisztráció (Admin)**
```
1. Felhasználó regisztrál (email/Google/Facebook)
2. Család neve megadása
3. Opcionális: város, gyerekek száma
4. Család létrehozása
5. Admin jogosultság hozzárendelése
6. Családi naptár megnyitása
```

### **2.2 Admin Bejelentkezés**
```
1. Email/jelszó vagy social login
2. Család kiválasztása (ha többhez tartozik)
3. Teljes admin felület betöltése
4. Családi naptár kezelése
```

### **2.3 Gyerek Bejelentkezés**
```
1. Gyerek profil kiválasztása
2. PIN beírása (név + életkor alapján)
3. Gyerek session létrehozása
4. Korlátozott felület betöltése
```

### **2.4 Meghívott Családtag Bejelentkezés**
```
1. Meghívó link megnyitása
2. Regisztráció vagy bejelentkezés
3. Családhoz csatlakozás
4. Családtag jogosultságok
```

---

## 🔢 **3. PIN RENDSZEREK**

### **3.1 Gyerek PIN (Bejelentkezéshez)**
- **Formátum:** `{név első 3 betűje}{életkor}`
- **Példa:** Anna, 8 éves → `ann8`
- **Használat:** Gyerek bejelentkezése a gyerek telefonján
- **Generálás:** Automatikus a gyerek profil létrehozásakor
- **Megjelenítés:** Gyerek profil létrehozásakor

### **3.2 Szülői PIN (Admin módra váltáshoz)**
- **Formátum:** 4-6 számjegy
- **Beállítás:** Szülő által a "Ez gyerek telefon" beállításnál
- **Használat:** Gyerek telefonján admin módra váltás
- **Megjelenítés:** Profil oldalon (egy szem ikonnal)
- **Próbálkozás:** Végtelen

---

## 📱 **4. DEVICE TYPE KEZELÉS**

### **4.1 Admin Device**
- **Beállítás:** Alapértelmezett
- **Funkciók:** Teljes admin felület
- **Család váltás:** Lehetséges
- **Kijelentkezés:** Lehetséges

### **4.2 Child Device**
- **Beállítás:** "Ez gyerek telefon" gombra kattintva
- **Folyamat:**
  1. Admin bejelentkezik
  2. "Ez gyerek telefon" gomb
  3. Gyerek profil kiválasztása
  4. Szülői PIN beállítása
  5. Device type: 'child' mentése
  6. Automatikus gyerek módba váltás

**Device Setup Flow:**
```
Admin bejelentkezés → "Ez gyerek telefon" → 
Gyerek profil kiválasztás → Szülői PIN beállítás → 
Device type: 'child' mentés → Automatikus gyerek mód
```

### **4.3 Automatikus Bejelentkezés Megőrzés**
- **Telefonra telepítés után:** Minden bejelentkezés automatikusan megőrződik
- **Admin session:** Firebase Auth + Local Storage
- **Gyerek session:** Local Storage (`childSession`)
- **Device type:** Local Storage (`deviceType`)
- **Szülői PIN:** Local Storage (`parentPin`)
- **App indításkor:** Automatikus session betöltés a device type alapján

---

## 🎭 **5. SESSION MANAGEMENT**

### **5.1 Admin Session**
- **Típus:** `admin`
- **Adatok:** userId, userFamilyId, admin privileges
- **Storage:** Firebase Auth + Local Storage
- **Lejárat:** Firebase Auth alapján
- **Megőrzés:** Automatikus telefonra telepítés után

### **5.2 Child Session**
- **Típus:** `child`
- **Adatok:** childId, childName, childAge, childAvatar, familyId
- **Storage:** Local Storage (`childSession`)
- **Lejárat:** Nincs (addig, amíg nem lép ki)
- **Megőrzés:** Automatikus telefonra telepítés után

### **5.3 Session States**
```javascript
// Admin mód
{
  isAdmin: true,
  isChildMode: false,
  deviceType: 'admin'
}

// Gyerek mód
{
  isAdmin: false,
  isChildMode: true,
  deviceType: 'child',
  childSession: {...}
}
```

### **5.4 Automatikus Session Betöltés**
```javascript
// App indításkor
useEffect(() => {
  const deviceType = localStorage.getItem('deviceType')
  
  if (deviceType === 'child') {
    // Automatikus gyerek mód betöltés
    const childSession = localStorage.getItem('childSession')
    if (childSession) {
      setChildSession(JSON.parse(childSession))
      setIsChildMode(true)
    }
  } else if (deviceType === 'admin') {
    // Firebase Auth session ellenőrzése
    // Ha van aktív session, automatikus admin mód
  }
}, [])
```

---

## 🛡️ **6. SECURITY RULES**

### **6.1 Firebase Auth Rules**
- **Admin:** Teljes hozzáférés a saját családjához
- **Gyerek:** Csak olvasási jogosultság
- **Meghívott:** Családtag szintű jogosultságok

### **6.2 Firestore Security Rules**
```javascript
// Család adatok
families/{familyId} {
  read: if request.auth != null && 
        (resource.data.adminId == request.auth.uid ||
         resource.data.members[request.auth.uid] != null)
  write: if request.auth != null && 
          resource.data.adminId == request.auth.uid
}

// Családtagok
families/{familyId}/members/{memberId} {
  read: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid ||
         resource.data.familyId in get(/databases/$(db.name)/documents/users/$(request.auth.uid)).data.families)
  write: if request.auth != null && 
          resource.data.createdBy == request.auth.uid
}
```

---

## 🗄️ **7. DATABASE SCHEMA**

### **7.1 Users Collection**
```javascript
users/{userId} {
  email: string,
  displayName: string,
  photoURL: string,
  families: [familyId1, familyId2], // Több családhoz tartozhat
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### **7.2 Families Collection**
```javascript
families/{familyId} {
  name: string,
  adminId: string, // Admin felhasználó ID
  city: string,
  childrenCount: number,
  interests: [string],
  createdAt: timestamp,
  createdBy: string
}
```

### **7.3 Family Members Collection**
```javascript
families/{familyId}/members/{memberId} {
  name: string,
  age: number,
  avatar: string,
  role: 'parent' | 'child' | 'teenager' | 'adult',
  isChild: boolean, // Gyerek profil jelölés
  createdAt: timestamp,
  createdBy: string // Admin ID
}
```

### **7.4 Device Settings Collection**
```javascript
deviceSettings/{deviceId} {
  userId: string,
  deviceType: 'admin' | 'child',
  childProfileId: string, // Ha gyerek device
  parentPin: string, // Szülői PIN (hashed)
  familyId: string,
  lastUpdated: timestamp
}
```

---

## 🎨 **8. UI FLOW DIAGRAMS**

### **8.1 Admin Device Flow**
```
Bejelentkezés → Családi Naptár → Teljes Admin Felület
     ↓
Családtag Kezelés, Események, Gyerek Profilok
     ↓
Kijelentkezés → Bejelentkezési Képernyő
```

### **8.2 Child Device Setup Flow**
```
Admin Bejelentkezés → "Ez gyerek telefon" → 
Gyerek Profil Kiválasztás → Szülői PIN Beállítás → 
Device Type: 'child' mentés → Automatikus Gyerek Mód
     ↓
Gyerek Mód: Korlátozott Felület
     ↓
"Admin mód" gomb → Szülői PIN → Admin Mód
```

### **8.3 Child Device Normal Flow**
```
App Indítás → Automatikus Gyerek Mód Betöltés → 
Korlátozott Felület → "Admin mód" gomb → 
Szülői PIN → Admin Mód → Teljes Felület
```

### **8.4 Automatikus Session Megőrzés Flow**
```
Telefonra Telepítés → Első Bejelentkezés → 
Session Mentés Local Storage-ba → 
App Indítás → Automatikus Session Betöltés → 
Megfelelő Mód (Admin/Gyerek) Aktiválása
```

---

## 🔧 **9. IMPLEMENTÁCIÓS RÉSZLETEK**

### **9.1 Local Storage Keys**
```javascript
// Device type
localStorage.setItem('deviceType', 'child' | 'admin')

// Child session
localStorage.setItem('childSession', JSON.stringify(childSession))

// Parent PIN
localStorage.setItem('parentPin', '1234')

// Child profile
localStorage.setItem('childProfileId', 'selectedChildId')
```

### **9.2 State Management**
```javascript
// CalendarStateManager
const [deviceType, setDeviceType] = useState('admin')
const [childSession, setChildSession] = useState(null)
const [parentPin, setParentPin] = useState(null)

// CalendarEventHandlers
const handleDeviceSetup = async (setupData) => {
  // Device type beállítása
  // Gyerek profil kiválasztása
  // Szülői PIN beállítása
}

const handleAdminModeSwitch = async (pin) => {
  // Szülői PIN ellenőrzése
  // Admin módra váltás
}
```

### **9.3 Modal Components**
```javascript
// DeviceSetupModal
- "Ez gyerek telefon" beállítás
- Gyerek profil kiválasztása
- Szülői PIN beállítása

// ProfileModal
- Szülői PIN megjelenítés
- Egy szem ikon (PIN láthatóság)

// AdminPinModal
- Szülői PIN beírása
- Admin módra váltás
```

---

## 🚀 **10. KÖVETKEZŐ LÉPÉSEK**

### **10.1 Azonnali Implementáció**
1. **DeviceSetupModal** létrehozása
2. **ProfileModal** létrehozása
3. **AdminPinModal** létrehozása
4. **CalendarHeader** frissítése
5. **State management** frissítése
6. **Automatikus session betöltés** implementálása
7. **Local Storage kezelés** finomhangolása

### **10.2 Tesztelés**
1. Admin device setup tesztelése
2. Child device setup tesztelése
3. PIN rendszerek tesztelése
4. Session management tesztelése

### **10.3 Optimalizálás**
1. PIN hashing implementálása
2. Session timeout kezelése
3. Error handling fejlesztése
4. UI/UX finomhangolás

---

## 📝 **11. MEGJEGYZÉSEK**

- **Gyerek PIN:** Automatikusan generálódik, nem változtatható
- **Szülői PIN:** Szülő állítja be, változtatható
- **Device Type:** Egyszer beállítva, nehezen változtatható
- **Session Persistence:** Local storage alapú
- **Security:** Firebase Auth + Firestore Rules
- **PIN Próbálkozás:** Végtelen (nincs lockout)
- **Automatikus Bejelentkezés:** Telefonra telepítés után minden session megőrződik
- **Gyerek Kilépés:** Nem lehetséges szülői PIN nélkül
- **Egyszerűség:** Nincs szükség újra bejelentkezésre minden alkalommal

---

## 🔗 **12. KAPCSOLÓDÓ FÁJLOK**

- `src/components/auth/AuthScreen.jsx` - Bejelentkezési képernyő
- `src/components/calendar/CalendarApp.jsx` - Fő alkalmazás
- `src/components/calendar/CalendarHeader.jsx` - Fejléc
- `src/components/calendar/ChildProfileModal.jsx` - Gyerek profil létrehozás
- `src/components/calendar/ChildLoginModal.jsx` - Gyerek bejelentkezés
- `src/context/FirebaseContext.jsx` - Firebase kontextus
- `firestore.rules` - Firestore biztonsági szabályok

---

**📅 Utolsó frissítés:** 2024. december 19.
**👨‍💻 Fejlesztő:** AI Assistant
**📋 Verzió:** 1.0.0
