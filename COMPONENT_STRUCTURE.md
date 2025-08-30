# Komponens Struktúra Dokumentáció

## Áttekintés

Az alkalmazás moduláris komponens struktúrára lett átstrukturálva, hogy könnyebben karbantartható és bővíthető legyen.

## Mappa Struktúra

```
src/
├── components/
│   ├── auth/
│   │   └── AuthScreen.jsx          # Bejelentkezés és regisztráció
│   ├── family/
│   │   └── FamilySetupScreen.jsx   # Család létrehozása és csatlakozás
│   ├── calendar/
│   │   ├── CalendarApp.jsx         # Fő naptár alkalmazás
│   │   ├── CalendarView.jsx        # Naptár nézet komponens
│   │   ├── EventModal.jsx          # Esemény szerkesztő modal
│   │   └── FamilyMemberModal.jsx   # Családtag hozzáadó modal
│   ├── ui/
│   │   ├── Modal.jsx               # Általános modal wrapper
│   │   └── ConfirmModal.jsx        # Megerősítő modal
│   └── index.js                    # Komponens exportok
├── context/
│   └── FirebaseContext.jsx         # Firebase context és provider
├── utils/
│   ├── firebaseUtils.js            # Firebase segédfüggvények
│   └── calendarUtils.js            # Naptár segédfüggvények
├── App.jsx                         # Fő alkalmazás komponens
├── main.jsx                        # Alkalmazás belépési pont
└── firebaseConfig.js               # Firebase konfiguráció
```

## Komponens Leírások

### Auth Komponensek

#### AuthScreen.jsx
- **Funkció**: Felhasználói bejelentkezés és regisztráció
- **Props**: Nincs
- **Állapotok**: email, password, isRegistering, error, loading
- **Függőségek**: Firebase Auth, Firestore

### Family Komponensek

#### FamilySetupScreen.jsx
- **Funkció**: Új család létrehozása vagy meglévő családhoz csatlakozás
- **Props**: Nincs
- **Állapotok**: newFamilyName, joinFamilyId, error, loading
- **Függőségek**: Firebase Firestore

### Calendar Komponensek

#### CalendarApp.jsx
- **Funkció**: Fő naptár alkalmazás koordinálása
- **Props**: onLogout (function)
- **Állapotok**: familyMembers, events, currentDate, modals, messages
- **Függőségek**: Firebase Firestore, CalendarView, EventModal, FamilyMemberModal

#### CalendarView.jsx
- **Funkció**: Naptár nézet megjelenítése
- **Props**: currentDate, setCurrentDate, events, familyMembers, currentView, setCurrentView, onAddEvent, onEditEvent, onDeleteEvent, onStatusChange
- **Állapotok**: Nincs (stateless)
- **Függőségek**: calendarUtils

#### EventModal.jsx
- **Funkció**: Esemény létrehozása és szerkesztése
- **Props**: event, onSave, onClose, familyMembers, showTemporaryMessage
- **Állapotok**: name, date, time, endTime, location, assignedTo, notes, status, recurrenceType, startDate, endDate, recurrenceDays
- **Függőségek**: Modal komponens

#### FamilyMemberModal.jsx
- **Funkció**: Új családtag hozzáadása
- **Props**: newFamilyMemberName, setNewFamilyMemberName, onAdd, onClose
- **Állapotok**: Nincs (stateless)
- **Függőségek**: Modal komponens

### UI Komponensek

#### Modal.jsx
- **Funkció**: Általános modal wrapper
- **Props**: children, onClose, title
- **Állapotok**: Nincs (stateless)

#### ConfirmModal.jsx
- **Funkció**: Megerősítő párbeszédablak
- **Props**: message, onConfirm, onCancel
- **Állapotok**: Nincs (stateless)

## Context és Utils

### FirebaseContext.jsx
- **Funkció**: Firebase szolgáltatások és felhasználói állapot kezelése
- **Exportok**: FirebaseProvider, useFirebase
- **Állapotok**: userId, userFamilyId, isAuthReady, isUserDataLoaded

### firebaseUtils.js
- **Funkció**: Firebase adatbázis segédfüggvények
- **Exportok**: EXAMPLE_FAMILY_ID, ensureExampleFamilyExists

### calendarUtils.js
- **Funkció**: Naptár műveletek segédfüggvényei
- **Exportok**: useCalendarUtils hook
- **Függvények**: getDaysForView, getEventsForDisplay, navigateDays

## Használat

### Komponens Importálása

```javascript
// Egyedi komponens importálása
import AuthScreen from './components/auth/AuthScreen.jsx';

// Vagy index fájlból
import { AuthScreen, CalendarApp } from './components/index.js';
```

### Context Használata

```javascript
import { useFirebase } from './context/FirebaseContext.jsx';

function MyComponent() {
    const { db, auth, userId, userFamilyId } = useFirebase();
    // ...
}
```

### Utils Használata

```javascript
import { useCalendarUtils } from './utils/calendarUtils.js';

function CalendarComponent() {
    const { getDaysForView, getEventsForDisplay } = useCalendarUtils();
    // ...
}
```

## Előnyök

1. **Modularitás**: Minden komponens egyetlen felelősséggel rendelkezik
2. **Újrafelhasználhatóság**: UI komponensek más helyeken is használhatók
3. **Karbantarthatóság**: Könnyebb hibakeresés és fejlesztés
4. **Skálázhatóság**: Új funkciók könnyen hozzáadhatók
5. **Tesztelhetőség**: Komponensek külön-külön tesztelhetők

## Következő Lépések

- Unit tesztek írása minden komponenshez
- TypeScript migráció
- Styled-components vagy CSS-in-JS bevezetése
- Performance optimalizációk (React.memo, useMemo, useCallback)
- Error boundary komponensek hozzáadása 