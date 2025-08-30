import React, { useState, useEffect, createContext, useContext } from 'react';
import { db, auth, firebaseConfig } from '../firebaseConfig.js';
import {
    signInAnonymously,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';


// Firebase Context a Firestore és Auth instancák megosztásához
const FirebaseContext = createContext(null);

// Firebase Provider komponens
const FirebaseProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [userFamilyId, setUserFamilyId] = useState(null); // Új állapot a felhasználó családi azonosítójához
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

    // Projekt azonosítója a firebaseConfig-ból
    const projectId = firebaseConfig.projectId;

    useEffect(() => {
        // Hitelesítés kezelése
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            console.log("FirebaseProvider: onAuthStateChanged triggered. User:", user ? user.uid : "null");
            let currentFamilyId = null; // Initialize to null

            if (user) {
                setUserId(user.uid);
                // Bejelentkezés után mindig a családi csoportok felületén maradunk
                // Ne állítsuk be automatikusan a currentFamilyId-t
                console.log("FirebaseProvider: User logged in, staying on family selection screen");
                currentFamilyId = null; // Always null after login
            } else {
                // Ha nincs felhasználó, akkor nincs családi azonosító sem
                console.log("FirebaseProvider: No user logged in, no family ID.");
                currentFamilyId = null;
            }
            setUserFamilyId(currentFamilyId); // Set state once all logic is done
            setIsAuthReady(true);
            setIsUserDataLoaded(true);
            console.log("FirebaseProvider: Auth and user data ready. Final userId:", user ? user.uid : "null", "Final userFamilyId:", currentFamilyId);
        });

        return () => unsubscribeAuth();
    }, [projectId]); // auth és db eltávolítva, mivel stabil referenciák

    // Ha a Firebase még nem inicializált, jelenítsen meg betöltő állapotot
    if (!isAuthReady || !isUserDataLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-lg font-semibold text-gray-700">Betöltés...</div>
            </div>
        );
    }

    return (
        <FirebaseContext.Provider value={{ db, auth, userId, userFamilyId, setUserFamilyId, setUserId }}>
            {children}
        </FirebaseContext.Provider>
    );
};

// Hook a Firebase instancák eléréséhez
const useFirebase = () => useContext(FirebaseContext);

export { FirebaseProvider, useFirebase }; 