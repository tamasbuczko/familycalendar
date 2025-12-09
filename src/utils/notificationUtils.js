import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, collection, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebaseConfig.js';

// VAPID kulcs
const VAPID_KEY = 'BM5Wud49RYQkXZy5Fg3XkfO_Oq5pg4ARO8dIw6SficLufr7Yb7yvYPlgFSV4OgkWed5FshXS7bCKPuhlA0hJgU0';

/**
 * FCM token regisztráció és Firestore-ba mentés
 */
export const registerFCMToken = async (userId) => {
  try {
    // Ellenőrizzük, hogy a böngésző támogatja-e az értesítéseket
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notifications not supported');
      return null;
    }

    // Értesítési engedélyek kérése
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // FCM token lekérése
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (!token) {
      console.log('No FCM token available');
      return null;
    }

    console.log('FCM Token obtained:', token);

    // Token mentése Firestore-ba
    await saveTokenToFirestore(userId, token);

    return token;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return null;
  }
};

/**
 * Token mentése Firestore-ba
 */
export const saveTokenToFirestore = async (userId, token) => {
  try {
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const existingTokens = data.deviceTokens || [];
      
      // Ellenőrizzük, hogy a token már létezik-e
      const tokenExists = existingTokens.some(t => t.token === token);
      
      if (!tokenExists) {
        // Új token hozzáadása
        const updatedTokens = [...existingTokens, {
          token,
          platform: 'web',
          lastUsed: new Date().toISOString(),
          isActive: true
        }];
        
        await updateDoc(userDocRef, {
          deviceTokens: updatedTokens,
          lastUpdated: new Date().toISOString()
        });
        
        console.log('New FCM token added to Firestore');
      } else {
        // Token frissítése
        const updatedTokens = existingTokens.map(t => 
          t.token === token 
            ? { ...t, lastUsed: new Date().toISOString(), isActive: true }
            : t
        );
        
        await updateDoc(userDocRef, {
          deviceTokens: updatedTokens,
          lastUpdated: new Date().toISOString()
        });
        
        console.log('FCM token updated in Firestore');
      }
    } else {
      // Új felhasználó - alapértelmezett beállításokkal
      const defaultPreferences = getDefaultNotificationPreferences();
      
      await setDoc(userDocRef, {
        deviceTokens: [{
          token,
          platform: 'web',
          lastUsed: new Date().toISOString(),
          isActive: true
        }],
        preferences: defaultPreferences,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('New user notification preferences created');
    }
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
    throw error;
  }
};

/**
 * Alapértelmezett értesítési beállítások
 */
export const getDefaultNotificationPreferences = () => ({
  eventReminders: {
    enabled: true,
    times: [10, 30], // percek az esemény előtt
    sound: true,
    vibration: true
  },
  weatherAlerts: {
    enabled: true,
    rainAlerts: true,
    snowAlerts: true,
    extremeTemp: true,
    checkInterval: 30 // percek
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
});

/**
 * Értesítési beállítások betöltése
 */
export const loadNotificationPreferences = async (userId) => {
  try {
    if (!userId) {
      return getDefaultNotificationPreferences();
    }
    
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Ha van preferences, használjuk azt, különben alapértelmezett
      return data.preferences || getDefaultNotificationPreferences();
    } else {
      // Új felhasználó - alapértelmezett beállítások
      const defaultPreferences = getDefaultNotificationPreferences();
      try {
        await setDoc(userDocRef, {
          preferences: defaultPreferences,
          lastUpdated: new Date().toISOString()
        });
      } catch (saveError) {
        // Ha nem sikerül menteni, csak loggoljuk, de adjuk vissza az alapértelmezett beállításokat
        console.warn('Could not save default preferences to Firestore:', saveError);
      }
      return defaultPreferences;
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    // Hiba esetén mindig adjunk vissza alapértelmezett beállításokat
    return getDefaultNotificationPreferences();
  }
};

/**
 * Értesítési beállítások mentése
 */
export const saveNotificationPreferences = async (userId, preferences) => {
  try {
    const userDocRef = doc(db, 'notification_preferences', userId);
    await updateDoc(userDocRef, {
      preferences,
      lastUpdated: new Date().toISOString()
    });
    
    console.log('Notification preferences saved');
    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
};

/**
 * Esemény értesítések ütemezése
 */
export const scheduleEventNotifications = async (event, userId, reminderTimes) => {
  try {
    const notifications = [];
    
    for (const minutes of reminderTimes) {
      const scheduledTime = new Date(event.date);
      scheduledTime.setMinutes(scheduledTime.getMinutes() - minutes);
      
      // Csak jövőbeli értesítéseket ütemezünk
      if (scheduledTime > new Date()) {
        const notificationData = {
          userId,
          eventId: event.id,
          type: 'event_reminder',
          scheduledTime: scheduledTime.toISOString(),
          message: {
            title: `${minutes} perc múlva ott kell lennie`,
            body: `${event.name}${event.location ? ` - ${event.location}` : ''}`,
            icon: '/icon-192x192.svg',
            badge: '/badge-72x72.png',
            data: {
              eventId: event.id,
              action: 'view_event',
              url: `/calendar/event/${event.id}`
            }
          },
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
          createdAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'scheduled_notifications'), notificationData);
        notifications.push({ id: docRef.id, ...notificationData });
      }
    }
    
    console.log(`Scheduled ${notifications.length} notifications for event ${event.id}`);
    return notifications;
  } catch (error) {
    console.error('Error scheduling event notifications:', error);
    throw error;
  }
};

/**
 * Teszt értesítés küldése
 */
export const sendTestNotification = async (userId, token) => {
  try {
    const sendTestNotificationFunction = httpsCallable(functions, 'sendTestNotification');
    
    const result = await sendTestNotificationFunction({
      token,
      title: 'Teszt értesítés',
      body: 'Ez egy teszt értesítés a Család Háló alkalmazásból!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
    
    return result.data.success;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Értesítések figyelése (amikor az app meg van nyitva)
 */
export const setupNotificationListener = (onNotificationReceived) => {
  try {
    const messaging = getMessaging();
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Ha van callback függvény, hívjuk meg
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
      
      // Ha az app meg van nyitva, megjelenítjük az értesítést
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192x192.svg',
          badge: payload.notification.badge || '/badge-72x72.png',
          data: payload.data,
          tag: payload.data?.eventId || 'default'
        });
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    return null;
  }
};

/**
 * Inaktív tokenek tisztítása
 */
export const cleanupInactiveTokens = async (userId) => {
  try {
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) return;
    
    const data = userDoc.data();
    const deviceTokens = data.deviceTokens || [];
    
    // 30 napnál régebbi tokenek inaktiválása
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const updatedTokens = deviceTokens.map(token => {
      const lastUsed = new Date(token.lastUsed);
      if (lastUsed < thirtyDaysAgo) {
        return { ...token, isActive: false };
      }
      return token;
    });
    
    await updateDoc(userDocRef, {
      deviceTokens: updatedTokens,
      lastUpdated: new Date().toISOString()
    });
    
    console.log('Inactive tokens cleaned up');
  } catch (error) {
    console.error('Error cleaning up inactive tokens:', error);
  }
};

/**
 * Felhasználó összes aktív tokenjének lekérése
 */
export const getUserActiveTokens = async (userId) => {
  try {
    const userDocRef = doc(db, 'notification_preferences', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) return [];
    
    const data = userDoc.data();
    const deviceTokens = data.deviceTokens || [];
    
    return deviceTokens
      .filter(token => token.isActive)
      .map(token => token.token);
  } catch (error) {
    console.error('Error getting user active tokens:', error);
    return [];
  }
};
