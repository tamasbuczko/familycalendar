import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.js';

// Firebase inicializálás
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// PWA Service Worker registration with FCM
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service Worker regisztráció cache-bypass-szal
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Kényszerítsük a Service Worker frissítését
        registration.update();
        
        // FCM token regisztráció
        const messaging = getMessaging(app);
        getToken(messaging, {
          vapidKey: 'BM5Wud49RYQkXZy5Fg3XkfO_Oq5pg4ARO8dIw6SficLufr7Yb7yvYPlgFSV4OgkWed5FshXS7bCKPuhlA0hJgU0',
          serviceWorkerRegistration: registration
        }).then((token) => {
          if (token) {
            console.log('FCM Token:', token);
            // Token mentése localStorage-ba, hogy később használhassuk
            localStorage.setItem('fcmToken', token);
          } else {
            console.log('No registration token available.');
          }
        }).catch((err) => {
          console.log('An error occurred while retrieving token. ', err);
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 