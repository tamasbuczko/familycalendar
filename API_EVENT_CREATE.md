# API Endpoint: Esemény Létrehozása

## Endpoint
`createEvent` - Firebase Callable Function

## Használat

### Frontend (JavaScript/TypeScript)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig'; // vagy getFunctions(app)

const createEvent = httpsCallable(functions, 'createEvent');

// Példa: Egyszeri esemény
const result = await createEvent({
  familyId: 'your-family-id',
  event: {
    name: 'Zongoraóra',
    date: '2024-01-15',
    time: '15:00',
    endTime: '16:00',
    location: 'Zeneiskola',
    assignedTo: 'member-id',
    notes: 'Hozz magaddal zongorakönyvet',
    icon: '🎹',
    color: '#A855F7',
    status: 'active',
    visibility: 'family',
    points: 10
  }
});

console.log('Event created:', result.data);
```

### Külső API hívás (HTTP)

```bash
curl -X POST \
  https://us-central1-your-project-id.cloudfunctions.net/createEvent \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN' \
  -d '{
    "data": {
      "familyId": "your-family-id",
      "event": {
        "name": "Zongoraóra",
        "date": "2024-01-15",
        "time": "15:00",
        "endTime": "16:00",
        "location": "Zeneiskola",
        "assignedTo": "member-id",
        "icon": "🎹",
        "color": "#A855F7"
      }
    }
  }'
```

## Request Body

```typescript
{
  familyId: string; // Kötelező - A család ID-ja
  event: {
    name: string; // Kötelező - Esemény neve
    time: string; // Kötelező - Kezdő idő (HH:MM formátum)
    
    // Egyszeri esemény esetén:
    date?: string; // Kötelező egyszeri eseményhez - Dátum (YYYY-MM-DD)
    
    // Ismétlődő esemény esetén:
    recurrenceType?: 'none' | 'daily' | 'weekly' | 'monthly'; // Default: 'none'
    startDate?: string; // Kötelező ismétlődő eseményhez - Kezdő dátum (YYYY-MM-DD)
    endDate?: string; // Opcionális - Befejező dátum (YYYY-MM-DD)
    recurrenceDays?: number[]; // Kötelező heti ismétlődéshez - Hét napjai (0=Vasárnap, 1=Hétfő, ..., 6=Szombat)
    
    // Opcionális mezők:
    endTime?: string; // Befejező idő (HH:MM)
    location?: string; // Helyszín
    assignedTo?: string; // Hozzárendelt családtag ID-ja
    notes?: string; // Megjegyzések
    status?: 'active' | 'cancelled' | 'inactive'; // Default: 'active'
    icon?: string; // Emoji ikon
    color?: string; // Hex színkód
    visibility?: 'only_me' | 'family' | 'known_families'; // Default: 'family'
    points?: number; // Pontok (default: 10)
    showAvatar?: boolean; // Avatar megjelenítése (default: true)
    reminders?: {
      enabled?: boolean; // Default: true
      times?: number[]; // Percben (default: [10, 30])
      sound?: boolean; // Default: true
      vibration?: boolean; // Default: true
    };
    notificationRecipients?: string[]; // User ID-k listája
  }
}
```

## Response

```typescript
{
  success: true;
  eventId: string; // A létrehozott esemény ID-ja
  message: 'Event created successfully';
}
```

## Példák

### 1. Egyszeri esemény

```javascript
await createEvent({
  familyId: 'family-123',
  event: {
    name: 'Orvosi vizsgálat',
    date: '2024-01-20',
    time: '10:00',
    endTime: '11:00',
    location: 'Dr. Kovács rendelő',
    icon: '👨‍⚕️',
    color: '#10B981'
  }
});
```

### 2. Heti ismétlődő esemény

```javascript
await createEvent({
  familyId: 'family-123',
  event: {
    name: 'Zongoraóra',
    time: '15:00',
    endTime: '16:00',
    location: 'Zeneiskola',
    recurrenceType: 'weekly',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    recurrenceDays: [1, 3], // Hétfő és Szerda
    icon: '🎹',
    color: '#A855F7'
  }
});
```

### 3. Napi ismétlődő esemény

```javascript
await createEvent({
  familyId: 'family-123',
  event: {
    name: 'Kutyasétáltatás',
    time: '07:00',
    recurrenceType: 'daily',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    icon: '🐕'
  }
});
```

## Hibakezelés

A függvény `HttpsError`-t dob, ha:
- A felhasználó nincs bejelentkezve (`unauthenticated`)
- Hiányzó kötelező mezők (`invalid-argument`)
- A család nem található (`not-found`)
- A felhasználó nem tagja a családnak (`permission-denied`)
- Belső hiba (`internal`)

```javascript
try {
  const result = await createEvent({ ... });
} catch (error) {
  if (error.code === 'unauthenticated') {
    console.error('User not authenticated');
  } else if (error.code === 'invalid-argument') {
    console.error('Invalid arguments:', error.message);
  } else {
    console.error('Error:', error);
  }
}
```

## Deploy

```bash
cd functions
npm run build
firebase deploy --only functions:createEvent
```

