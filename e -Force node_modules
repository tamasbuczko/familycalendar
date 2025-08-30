// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// A Firebase projekt konfigurációs adatai
const firebaseConfig = {
    apiKey: "AIzaSyBA_5evcU8cmG_6IuBfQOirUfEl_DvqW4w",
    authDomain: "familyweekcalendar.firebaseapp.com",
    projectId: "familyweekcalendar",
    storageBucket: "familyweekcalendar.firebasestorage.app",
    messagingSenderId: "809984751394",
    appId: "1:809984751394:web:fb31b9d260ee63121d177b",
    measurementId: "G-8BZXHGQ6M1" // Opcionális
};

// Inicializálja a Firebase alkalmazást
const app = initializeApp(firebaseConfig);

// Firebase szolgáltatások inicializálása
const auth = getAuth(app);
const db = getFirestore(app);

// Exportálja az inicializált instancákat és a konfigurációt
export { db, auth, firebaseConfig }; 