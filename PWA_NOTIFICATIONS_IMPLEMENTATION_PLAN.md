# PWA Értesítések Megvalósítási Terv

## 📋 **Áttekintés**

Ez a dokumentum részletes megvalósítási tervet tartalmaz a PWA értesítési rendszerhez. Minden fontos komponens, adatbázis struktúra, API endpoint és felhasználói felület le van írva.

---

## 🏗️ **1. Adatbázis Struktúra (Firestore)**

### **1.1 notification_preferences collection**
```javascript
// Minden felhasználó értesítési beállításai
{
  userId: "user123",
  deviceTokens: [
    {
      token: "fcm_token_123",
      platform: "web",
      lastUsed: "2024-01-15T10:30:00Z",
      isActive: true
    }
  ],
  preferences: {
    // Esemény emlékeztetők
    eventReminders: {
      enabled: true,
      times: [5, 10, 30, 60], // percek az esemény előtt
      sound: true,
      vibration: true
    },
    // Időjárás riasztások
    weatherAlerts: {
      enabled: true,
      rainAlerts: true,
      snowAlerts: true,
      extremeTemp: true,
      checkInterval: 30 // percek
    },
    // Családi frissítések
    familyUpdates: {
      enabled: true,
      newEvents: true,
      eventChanges: true,
      childCheckins: true
    },
    // Csendes órák
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "07:00",
      timezone: "Europe/Budapest"
    }
  },
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### **1.2 scheduled_notifications collection**
```javascript
// Ütemezett értesítések
{
  id: "notif_123",
  userId: "user123",
  eventId: "event_456",
  type: "event_reminder", // event_reminder, weather_alert, family_update
  scheduledTime: "2024-01-15T14:50:00Z", // ISO timestamp
  message: {
    title: "10 perc múlva ott kell lennie az iskolában",
    body: "Iskolai szülői értekezlet - 14:00-15:00",
    icon: "/icon-192x192.svg",
    badge: "/badge-72x72.png",
    data: {
      eventId: "event_456",
      action: "view_event",
      url: "/calendar/event/456"
    }
  },
  status: "pending", // pending, sent, failed, cancelled
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2024-01-15T14:45:00Z",
  sentAt: null,
  errorMessage: null
}
```

### **1.3 weather_cache collection**
```javascript
// Időjárás adatok cache-elése
{
  location: "Budapest,HU",
  coordinates: {
    lat: 47.4979,
    lng: 19.0402
  },
  currentWeather: {
    temperature: 15,
    condition: "rain",
    humidity: 80,
    windSpeed: 10,
    timestamp: "2024-01-15T14:30:00Z"
  },
  forecast: [
    {
      time: "2024-01-15T15:00:00Z",
      temperature: 14,
      condition: "rain",
      precipitation: 0.8
    }
  ],
  lastUpdated: "2024-01-15T14:30:00Z",
  nextUpdate: "2024-01-15T15:00:00Z"
}
```

---

## 🔧 **2. Service Worker Bővítése**

### **2.1 sw.js - Értesítések kezelése**
```javascript
// Értesítési engedélyek és FCM token kezelése
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyDN-W-HCfCSdVvEoLR0HLhYWsK_XfqKfD0",
  authDomain: "familyweekcalendar.firebaseapp.com",
  projectId: "familyweekcalendar"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Háttér üzenetek kezelése
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.svg',
    badge: payload.notification.badge || '/badge-72x72.png',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'Megtekintés',
        icon: '/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Elutasítás',
        icon: '/dismiss-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Értesítés kattintás kezelése
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Esemény megtekintése
    const eventId = event.notification.data.eventId;
    event.waitUntil(
      clients.openWindow(`/calendar/event/${eventId}`)
    );
  } else if (event.action === 'dismiss') {
    // Értesítés elutasítása
    console.log('Notification dismissed');
  } else {
    // Alapértelmezett kattintás
    event.waitUntil(
      clients.openWindow('/calendar')
    );
  }
});
```

---

## 🎯 **3. Frontend Komponensek**

### **3.1 NotificationManager Hook**
```javascript
// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useNotifications = (userId) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [preferences, setPreferences] = useState(null);

  // Értesítési támogatás ellenőrzése
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // FCM token regisztráció
  const registerToken = async () => {
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY'
      });
      
      if (token) {
        setToken(token);
        await saveTokenToFirestore(token);
        return token;
      }
    } catch (error) {
      console.error('Token registration failed:', error);
    }
  };

  // Token mentése Firestore-ba
  const saveTokenToFirestore = async (token) => {
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const existingTokens = data.deviceTokens || [];
      const tokenExists = existingTokens.some(t => t.token === token);
      
      if (!tokenExists) {
        await setDoc(userDocRef, {
          deviceTokens: [...existingTokens, {
            token,
            platform: 'web',
            lastUsed: new Date().toISOString(),
            isActive: true
          }]
        }, { merge: true });
      }
    }
  };

  // Értesítési engedélyek kérése
  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === 'granted') {
      await registerToken();
      return true;
    }
    return false;
  };

  // Értesítési beállítások betöltése
  const loadPreferences = async () => {
    if (!userId) return;
    
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      setPreferences(userDoc.data().preferences);
    } else {
      // Alapértelmezett beállítások
      const defaultPreferences = {
        eventReminders: {
          enabled: true,
          times: [10, 30],
          sound: true,
          vibration: true
        },
        weatherAlerts: {
          enabled: true,
          rainAlerts: true,
          snowAlerts: true,
          extremeTemp: true,
          checkInterval: 30
        },
        familyUpdates: {
          enabled: true,
          newEvents: true,
          eventChanges: true,
          childCheckins: true
        },
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "07:00",
          timezone: "Europe/Budapest"
        }
      };
      
      await setDoc(userDocRef, {
        preferences: defaultPreferences,
        lastUpdated: new Date().toISOString()
      });
      
      setPreferences(defaultPreferences);
    }
  };

  // Értesítési beállítások mentése
  const savePreferences = async (newPreferences) => {
    if (!userId) return;
    
    const userDocRef = doc(db, 'notification_preferences', userId);
    await setDoc(userDocRef, {
      preferences: newPreferences,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    setPreferences(newPreferences);
  };

  return {
    isSupported,
    permission,
    token,
    preferences,
    requestPermission,
    loadPreferences,
    savePreferences,
    registerToken
  };
};
```

### **3.2 NotificationSettings Komponens**
```javascript
// src/components/calendar/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationSettings = ({ userId, onClose }) => {
  const { preferences, savePreferences, requestPermission } = useNotifications(userId);
  const [localPreferences, setLocalPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await savePreferences(localPreferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReminderTimes = (times) => {
    setLocalPreferences(prev => ({
      ...prev,
      eventReminders: {
        ...prev.eventReminders,
        times
      }
    }));
  };

  const addReminderTime = () => {
    const newTime = parseInt(prompt('Új emlékeztető idő (perc):'));
    if (newTime && newTime > 0) {
      const currentTimes = localPreferences.eventReminders.times;
      if (!currentTimes.includes(newTime)) {
        updateReminderTimes([...currentTimes, newTime].sort((a, b) => a - b));
      }
    }
  };

  const removeReminderTime = (timeToRemove) => {
    const currentTimes = localPreferences.eventReminders.times;
    updateReminderTimes(currentTimes.filter(time => time !== timeToRemove));
  };

  if (!localPreferences) return <div>Betöltés...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Értesítési beállítások</h2>
      
      {/* Esemény emlékeztetők */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Esemény emlékeztetők</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.eventReminders.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                eventReminders: {
                  ...prev.eventReminders,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Esemény emlékeztetők engedélyezése
          </label>
        </div>

        {localPreferences.eventReminders.enabled && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Emlékeztető idők (perc az esemény előtt):
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {localPreferences.eventReminders.times.map(time => (
                  <span
                    key={time}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {time} perc
                    <button
                      onClick={() => removeReminderTime(time)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={addReminderTime}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Új emlékeztető idő hozzáadása
              </button>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.eventReminders.sound}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    eventReminders: {
                      ...prev.eventReminders,
                      sound: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Hangjelzés
              </label>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.eventReminders.vibration}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    eventReminders: {
                      ...prev.eventReminders,
                      vibration: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Rezgés
              </label>
            </div>
          </>
        )}
      </div>

      {/* Időjárás riasztások */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Időjárás riasztások</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.weatherAlerts.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                weatherAlerts: {
                  ...prev.weatherAlerts,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Időjárás riasztások engedélyezése
          </label>
        </div>

        {localPreferences.weatherAlerts.enabled && (
          <>
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.weatherAlerts.rainAlerts}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    weatherAlerts: {
                      ...prev.weatherAlerts,
                      rainAlerts: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Eső riasztások
              </label>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.weatherAlerts.snowAlerts}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    weatherAlerts: {
                      ...prev.weatherAlerts,
                      snowAlerts: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Hó riasztások
              </label>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Időjárás ellenőrzési gyakoriság (perc):
              </label>
              <select
                value={localPreferences.weatherAlerts.checkInterval}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  weatherAlerts: {
                    ...prev.weatherAlerts,
                    checkInterval: parseInt(e.target.value)
                  }
                }))}
                className="border rounded px-3 py-2"
              >
                <option value={15}>15 perc</option>
                <option value={30}>30 perc</option>
                <option value={60}>1 óra</option>
                <option value={120}>2 óra</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Csendes órák */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Csendes órák</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.quietHours.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                quietHours: {
                  ...prev.quietHours,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Csendes órák engedélyezése
          </label>
        </div>

        {localPreferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kezdés:</label>
              <input
                type="time"
                value={localPreferences.quietHours.start}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    start: e.target.value
                  }
                }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vég:</label>
              <input
                type="time"
                value={localPreferences.quietHours.end}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    end: e.target.value
                  }
                }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Műveletek */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Mégse
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
```

---

## ⚙️ **4. Backend Logika (Firebase Functions)**

### **4.1 Értesítések ütemezése esemény létrehozásakor**
```javascript
// functions/src/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

// Esemény létrehozásakor értesítések ütemezése
exports.scheduleEventNotifications = functions.firestore
  .document('artifacts/{projectId}/families/{familyId}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const { familyId } = context.params;
    
    // Családtagok lekérése
    const familyMembers = await admin.firestore()
      .collection(`artifacts/${context.params.projectId}/families/${familyId}/members`)
      .get();
    
    // Minden családtaghoz értesítések ütemezése
    for (const member of familyMembers.docs) {
      const memberData = member.data();
      const userId = memberData.userId;
      
      if (!userId) continue;
      
      // Felhasználó értesítési beállításai
      const userPrefs = await admin.firestore()
        .collection('notification_preferences')
        .doc(userId)
        .get();
      
      if (!userPrefs.exists()) continue;
      
      const preferences = userPrefs.data().preferences;
      
      if (!preferences.eventReminders.enabled) continue;
      
      // Emlékeztető idők
      const reminderTimes = preferences.eventReminders.times;
      
      for (const minutes of reminderTimes) {
        const scheduledTime = new Date(event.date);
        scheduledTime.setMinutes(scheduledTime.getMinutes() - minutes);
        
        // Csak jövőbeli értesítéseket ütemezünk
        if (scheduledTime > new Date()) {
          await admin.firestore()
            .collection('scheduled_notifications')
            .add({
              userId,
              eventId: context.params.eventId,
              type: 'event_reminder',
              scheduledTime: scheduledTime.toISOString(),
              message: {
                title: `${minutes} perc múlva ott kell lennie`,
                body: `${event.name} - ${event.location || 'Nincs megadva helyszín'}`,
                icon: '/icon-192x192.svg',
                badge: '/badge-72x72.png',
                data: {
                  eventId: context.params.eventId,
                  action: 'view_event',
                  url: `/calendar/event/${context.params.eventId}`
                }
              },
              status: 'pending',
              attempts: 0,
              maxAttempts: 3,
              createdAt: new Date().toISOString()
            });
        }
      }
    }
  });
```

### **4.2 Ütemezett értesítések küldése**
```javascript
// Cron job - minden percben fut
exports.sendScheduledNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = new Date();
    
    // Küldendő értesítések lekérése
    const notifications = await admin.firestore()
      .collection('scheduled_notifications')
      .where('status', '==', 'pending')
      .where('scheduledTime', '<=', now.toISOString())
      .limit(100)
      .get();
    
    for (const notification of notifications.docs) {
      const notificationData = notification.data();
      
      try {
        // Felhasználó device token-jei
        const userPrefs = await admin.firestore()
          .collection('notification_preferences')
          .doc(notificationData.userId)
          .get();
        
        if (!userPrefs.exists()) {
          await notification.ref.update({ status: 'failed', errorMessage: 'User preferences not found' });
          continue;
        }
        
        const deviceTokens = userPrefs.data().deviceTokens
          .filter(token => token.isActive)
          .map(token => token.token);
        
        if (deviceTokens.length === 0) {
          await notification.ref.update({ status: 'failed', errorMessage: 'No active device tokens' });
          continue;
        }
        
        // Csendes órák ellenőrzése
        const preferences = userPrefs.data().preferences;
        if (preferences.quietHours.enabled) {
          const currentTime = new Date().toLocaleTimeString('hu-HU', { 
            timeZone: preferences.quietHours.timezone || 'Europe/Budapest',
            hour12: false 
          });
          
          if (isInQuietHours(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
            // Csendes órákban - értesítés késleltetése
            const nextAvailableTime = getNextAvailableTime(preferences.quietHours.end);
            await notification.ref.update({ 
              scheduledTime: nextAvailableTime.toISOString() 
            });
            continue;
          }
        }
        
        // Értesítés küldése
        const messaging = getMessaging();
        const response = await messaging.sendToDevice(deviceTokens, {
          notification: notificationData.message,
          data: notificationData.message.data
        });
        
        // Eredmények kezelése
        const failedTokens = [];
        response.results.forEach((result, index) => {
          if (result.error) {
            failedTokens.push(deviceTokens[index]);
          }
        });
        
        if (failedTokens.length === deviceTokens.length) {
          // Minden token sikertelen
          await notification.ref.update({ 
            status: 'failed', 
            errorMessage: 'All device tokens failed',
            attempts: notificationData.attempts + 1
          });
        } else {
          // Sikeres küldés
          await notification.ref.update({ 
            status: 'sent', 
            sentAt: new Date().toISOString() 
          });
          
          // Sikertelen tokenek inaktiválása
          if (failedTokens.length > 0) {
            await updateDeviceTokens(notificationData.userId, failedTokens, false);
          }
        }
        
      } catch (error) {
        console.error('Failed to send notification:', error);
        await notification.ref.update({ 
          status: 'failed', 
          errorMessage: error.message,
          attempts: notificationData.attempts + 1
        });
      }
    }
  });

// Segédfüggvények
function isInQuietHours(currentTime, startTime, endTime) {
  const current = new Date(`2000-01-01T${currentTime}`);
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (start <= end) {
    return current >= start && current <= end;
  } else {
    // Éjszakai csendes órák (pl. 22:00-07:00)
    return current >= start || current <= end;
  }
}

function getNextAvailableTime(endTime) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [hours, minutes] = endTime.split(':');
  tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return tomorrow;
}

async function updateDeviceTokens(userId, failedTokens, isActive) {
  const userPrefsRef = admin.firestore()
    .collection('notification_preferences')
    .doc(userId);
  
  const userPrefs = await userPrefsRef.get();
  if (!userPrefs.exists()) return;
  
  const deviceTokens = userPrefs.data().deviceTokens.map(token => {
    if (failedTokens.includes(token.token)) {
      return { ...token, isActive };
    }
    return token;
  });
  
  await userPrefsRef.update({ deviceTokens });
}
```

### **4.3 Időjárás ellenőrzés és riasztások**
```javascript
// Időjárás ellenőrzés - minden 30 percben
exports.checkWeatherAndSendAlerts = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    // Aktív felhasználók lekérése
    const users = await admin.firestore()
      .collection('notification_preferences')
      .where('preferences.weatherAlerts.enabled', '==', true)
      .get();
    
    for (const user of users.docs) {
      const userData = user.data();
      const preferences = userData.preferences.weatherAlerts;
      
      // Felhasználó helyszíne (család városa)
      const familyLocation = await getUserFamilyLocation(user.id);
      if (!familyLocation) continue;
      
      // Időjárás adatok lekérése
      const weatherData = await getWeatherData(familyLocation);
      if (!weatherData) continue;
      
      // Riasztások ellenőrzése
      const alerts = checkWeatherAlerts(weatherData, preferences);
      
      for (const alert of alerts) {
        await scheduleWeatherAlert(user.id, alert, weatherData);
      }
    }
  });

async function getWeatherData(location) {
  // OpenWeatherMap API hívás
  const apiKey = functions.config().openweathermap.key;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=hu`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

function checkWeatherAlerts(weatherData, preferences) {
  const alerts = [];
  
  if (preferences.rainAlerts && weatherData.condition.includes('rain')) {
    alerts.push({
      type: 'rain',
      title: 'Eső várható!',
      body: `Jelenleg ${weatherData.description}. Ne felejtsd el az esernyőt!`,
      severity: 'medium'
    });
  }
  
  if (preferences.snowAlerts && weatherData.condition.includes('snow')) {
    alerts.push({
      type: 'snow',
      title: 'Hóesés várható!',
      body: `Jelenleg ${weatherData.description}. Óvatosan vezess!`,
      severity: 'high'
    });
  }
  
  if (preferences.extremeTemp) {
    if (weatherData.temperature < -10) {
      alerts.push({
        type: 'extreme_cold',
        title: 'Extrém hideg!',
        body: `Hőmérséklet: ${weatherData.temperature}°C. Melegen öltözz!`,
        severity: 'high'
      });
    } else if (weatherData.temperature > 35) {
      alerts.push({
        type: 'extreme_heat',
        title: 'Extrém meleg!',
        body: `Hőmérséklet: ${weatherData.temperature}°C. Kerüld a közvetlen napfényt!`,
        severity: 'high'
      });
    }
  }
  
  return alerts;
}

async function scheduleWeatherAlert(userId, alert, weatherData) {
  await admin.firestore()
    .collection('scheduled_notifications')
    .add({
      userId,
      type: 'weather_alert',
      scheduledTime: new Date().toISOString(), // Azonnali küldés
      message: {
        title: alert.title,
        body: alert.body,
        icon: '/icon-192x192.svg',
        badge: '/badge-72x72.png',
        data: {
          type: 'weather_alert',
          alertType: alert.type,
          severity: alert.severity,
          action: 'view_weather'
        }
      },
      status: 'pending',
      attempts: 0,
      maxAttempts: 1,
      createdAt: new Date().toISOString()
    });
}
```

---

## 🔗 **5. Integráció a meglévő komponensekbe**

### **5.1 EventModal bővítése értesítési beállításokkal**
```javascript
// src/components/calendar/EventModal.jsx - bővítés
const EventModal = ({ event, onSave, onClose, familyMembers, showTemporaryMessage }) => {
  // ... meglévő kód ...
  
  const [reminderTimes, setReminderTimes] = useState([10, 30]); // Alapértelmezett értékek
  
  const handleSave = async (eventData) => {
    // ... meglévő mentési logika ...
    
    // Értesítések ütemezése
    if (reminderTimes.length > 0) {
      await scheduleEventNotifications(eventData, reminderTimes);
    }
    
    onSave(eventData);
  };
  
  return (
    <Modal onClose={onClose} title={event ? "Esemény szerkesztése" : "Új esemény"}>
      {/* ... meglévő mezők ... */}
      
      {/* Értesítési beállítások */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emlékeztetők (perc az esemény előtt):
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {reminderTimes.map(time => (
            <span
              key={time}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              {time} perc
              <button
                onClick={() => setReminderTimes(prev => prev.filter(t => t !== time))}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={() => {
            const newTime = parseInt(prompt('Új emlékeztető idő (perc):'));
            if (newTime && newTime > 0 && !reminderTimes.includes(newTime)) {
              setReminderTimes(prev => [...prev, newTime].sort((a, b) => a - b));
            }
          }}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Új emlékeztető idő hozzáadása
        </button>
      </div>
      
      {/* ... többi mezők ... */}
    </Modal>
  );
};
```

### **5.2 SettingsPage bővítése értesítési beállításokkal**
```javascript
// src/components/calendar/SettingsPage.jsx - bővítés
const SettingsPage = ({ onClose, userId }) => {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <Modal onClose={onClose} title="Beállítások">
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Általános
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 ${activeTab === 'notifications' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Értesítések
        </button>
      </div>
      
      {activeTab === 'general' && (
        // ... meglévő általános beállítások ...
      )}
      
      {activeTab === 'notifications' && (
        <NotificationSettings userId={userId} onClose={onClose} />
      )}
    </Modal>
  );
};
```

---

## 🚀 **6. Telepítési és konfigurációs lépések**

### **6.1 Firebase konfiguráció**
```bash
# Firebase Functions telepítése
npm install -g firebase-tools
firebase login
firebase init functions

# Szükséges csomagok telepítése
cd functions
npm install firebase-functions firebase-admin
npm install node-fetch
```

### **6.2 VAPID kulcs generálása**
```bash
# VAPID kulcs generálása
npx web-push generate-vapid-keys
```

### **6.3 Environment változók beállítása**
```bash
# Firebase Functions konfiguráció
firebase functions:config:set openweathermap.key="YOUR_API_KEY"
firebase functions:config:set vapid.public_key="YOUR_VAPID_PUBLIC_KEY"
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"
```

### **6.4 Service Worker regisztráció**
```javascript
// src/main.jsx - bővítés
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  // ... meglévő konfiguráció ...
};

const app = initializeApp(firebaseConfig);

// Service Worker regisztráció
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
      
      // FCM token regisztráció
      const messaging = getMessaging(app);
      getToken(messaging, {
        vapidKey: 'YOUR_VAPID_PUBLIC_KEY'
      }).then(token => {
        if (token) {
          console.log('FCM Token:', token);
          // Token mentése a felhasználó profiljába
        }
      });
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
```

---

## 📊 **7. Tesztelési terv**

### **7.1 Alapértelmezett értesítések tesztelése**
1. **PWA telepítése** telefonra
2. **Értesítési engedélyek** kérése
3. **Teszt esemény** létrehozása 5 perccel későbbre
4. **Emlékeztető** beállítása 2 percre
5. **Értesítés** megérkezésének ellenőrzése

### **7.2 Időjárás riasztások tesztelése**
1. **Időjárás beállítások** engedélyezése
2. **Teszt időjárás** szimulálása
3. **Riasztás** küldésének ellenőrzése
4. **Csendes órák** tesztelése

### **7.3 Felhasználói beállítások tesztelése**
1. **Emlékeztető idők** módosítása
2. **Értesítési típusok** ki/bekapcsolása
3. **Csendes órák** beállítása
4. **Beállítások mentésének** ellenőrzése

---

## 🎯 **8. Implementációs ütemezés**

### **Heti 1: Alapértelmezett értesítések**
- [ ] Service Worker bővítése
- [ ] FCM integráció
- [ ] Alapértelmezett emlékeztetők
- [ ] Firebase Functions alapok

### **Heti 2: Testreszabható beállítások**
- [ ] NotificationSettings komponens
- [ ] Felhasználói preferenciák kezelése
- [ ] Csendes órák implementálása
- [ ] UI integráció

### **Heti 3: Időjárás integráció**
- [ ] OpenWeatherMap API integráció
- [ ] Időjárás ellenőrzés cron job
- [ ] Riasztások ütemezése
- [ ] Cache mechanizmus

### **Heti 4: Tesztelés és optimalizálás**
- [ ] Teljes rendszer tesztelése
- [ ] Performance optimalizálás
- [ ] Hibakezelés fejlesztése
- [ ] Dokumentáció frissítése

---

*Utoljára frissítve: 2024 - PWA értesítések megvalósítási terv*
