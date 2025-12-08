// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { firebaseConfig } from './config.js';

// Inicializálja a Firebase alkalmazást
const app = initializeApp(firebaseConfig);

// Firebase szolgáltatások inicializálása
const auth = getAuth(app);
const db = getFirestore(app);
// Functions region explicit beállítása (us-central1)
const functions = getFunctions(app, 'us-central1');

// Exportálja az inicializált instancákat és a konfigurációt
export { db, auth, functions, firebaseConfig }; 