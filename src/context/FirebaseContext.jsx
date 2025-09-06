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
    const [authError, setAuthError] = useState(null);

    // Projekt azonosítója a firebaseConfig-ból
    const projectId = firebaseConfig.projectId;

    useEffect(() => {
        // Hitelesítés kezelése
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            console.log("FirebaseProvider: onAuthStateChanged triggered. User:", user ? user.uid : "null");
            let currentFamilyId = null; // Initialize to null
            setAuthError(null); // Reset error state

            if (user) {
                setUserId(user.uid);
                
                try {
                    // Felhasználói dokumentum lekérése
                    const userDocRef = doc(db, `artifacts/${projectId}/users/${user.uid}`);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log("FirebaseProvider: User document found:", userData);
                        
                        // Ha van currentFamilyId, használjuk azt
                        if (userData.currentFamilyId) {
                            currentFamilyId = userData.currentFamilyId;
                            console.log("FirebaseProvider: Setting currentFamilyId from user document:", currentFamilyId);
                        } else if (userData.familyIds && userData.familyIds.length > 0) {
                            // Ha nincs currentFamilyId, de van familyIds, az elsőt használjuk
                            currentFamilyId = userData.familyIds[0];
                            console.log("FirebaseProvider: Setting currentFamilyId from first familyId:", currentFamilyId);
                            
                            // Frissítsük a currentFamilyId-t
                            try {
                                await setDoc(userDocRef, { currentFamilyId }, { merge: true });
                                console.log("FirebaseProvider: Updated currentFamilyId in user document");
                            } catch (updateError) {
                                console.warn("FirebaseProvider: Could not update currentFamilyId:", updateError);
                                // Ez nem kritikus hiba, folytathatjuk
                            }
                        } else {
                            console.log("FirebaseProvider: No family IDs found for user - this is normal for new users");
                            currentFamilyId = null;
                        }
                    } else {
                        console.log("FirebaseProvider: User document not found - this might be a new user");
                        currentFamilyId = null;
                    }
                } catch (error) {
                    console.error("FirebaseProvider: Error loading user data:", error);
                    setAuthError(`Hiba a felhasználói adatok betöltésekor: ${error.message}`);
                    currentFamilyId = null;
                }
                
                console.log("FirebaseProvider: Final currentFamilyId:", currentFamilyId);
            } else {
                // Ha nincs felhasználó, akkor nincs családi azonosító sem
                console.log("FirebaseProvider: No user logged in, no family ID.");
                currentFamilyId = null;
            }
            
            setUserFamilyId(currentFamilyId); // Set state once all logic is done
            setIsAuthReady(true);
            setIsUserDataLoaded(true);
            console.log("FirebaseProvider: Auth and user data ready. Final userId:", user ? user.uid : "null", "Final userFamilyId:", currentFamilyId);
        }, (error) => {
            // Auth state change error
            console.error("FirebaseProvider: Auth state change error:", error);
            setAuthError(`Hitelesítési hiba: ${error.message}`);
            setIsAuthReady(true);
            setIsUserDataLoaded(true);
        });

        return () => unsubscribeAuth();
    }, [projectId]); // auth és db eltávolítva, mivel stabil referenciák

    // Ha a Firebase még nem inicializált, jelenítsen meg betöltő állapotot
    if (!isAuthReady || !isUserDataLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700 mb-2">Betöltés...</div>
                    {authError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {authError}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <FirebaseContext.Provider value={{ 
            db, 
            auth, 
            userId, 
            userFamilyId, 
            setUserFamilyId, 
            setUserId,
            authError,
            setAuthError
        }}>
            {children}
        </FirebaseContext.Provider>
    );
};

// Hook a Firebase instancák eléréséhez
const useFirebase = () => useContext(FirebaseContext);

export { FirebaseProvider, useFirebase }; 