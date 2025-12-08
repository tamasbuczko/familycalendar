// Service Worker with FCM notifications support
console.log('Service Worker loaded');

// Firebase imports for Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyDN-W-HCfCSdVvEoLR0HLhYWsK_XfqKfD0",
  authDomain: "familyweekcalendar.firebaseapp.com",
  projectId: "familyweekcalendar"
};

// Firebase inicializálás
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  self.clients.claim();
});

// Háttér üzenetek kezelése (amikor az app nincs megnyitva)
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.svg',
    badge: payload.notification.badge || '/badge-72x72.png',
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'Megtekintés',
        icon: '/icon-192x192.svg'
      },
      {
        action: 'dismiss',
        title: 'Elutasítás',
        icon: '/icon-192x192.svg'
      }
    ],
    requireInteraction: true,
    silent: false,
    tag: payload.data?.eventId || 'default',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Értesítés kattintás kezelése
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'view') {
    // Esemény vagy értesítés megtekintése
    const eventId = event.notification.data?.eventId;
    const url = event.notification.data?.url || '/calendar';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Ha van már megnyitott ablak, fókuszálj rá
        for (const client of clientList) {
          if (client.url.includes('familyweekroutine') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Ha nincs megnyitott ablak, nyiss egy újat
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Értesítés elutasítása
    console.log('Notification dismissed');
  } else {
    // Alapértelmezett kattintás - nyiss meg a naptár oldalt
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('familyweekroutine') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/calendar');
        }
      })
    );
  }
});

// Értesítés bezárás kezelése
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  // Itt lehetne analytics adatokat küldeni
});

// Push subscription kezelése
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  // Új subscription regisztrálása
  event.waitUntil(
    self.registration.pushManager           .subscribe({
             userVisibleOnly: true,
             applicationServerKey: 'BM5Wud49RYQkXZy5Fg3XkfO_Oq5pg4ARO8dIw6SficLufr7Yb7yvYPlgFSV4OgkWed5FshXS7bCKPuhlA0hJgU0'
           }).then(subscription => {
      console.log('New subscription:', subscription);
      // Új subscription küldése a szerverre
      return fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});
