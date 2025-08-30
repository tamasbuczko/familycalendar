import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import {
    doc,
    setDoc,
} from 'firebase/firestore';

// AuthScreen komponens
const AuthScreen = () => {
    const { auth, db } = useFirebase();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuthAction();
        }
    };

    const handleAuthAction = async () => {
        setError('');
        setLoading(true);
        console.log(`AuthScreen: Attempting to ${isRegistering ? "register" : "sign in"} with email: ${email}`);
        try {
            let userCredential;
            if (isRegistering) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("AuthScreen: User registered, UID:", userCredential.user.uid);

                // Új felhasználó esetén hozzunk létre egy felhasználói dokumentumot is, familyId nélkül
                // A FirebaseProvider majd hozzárendeli a példa családot
                const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userCredential.user.uid}`);
                console.log("AuthScreen: Creating user document at path:", userDocRef.path);
                await setDoc(userDocRef, {
                    email: userCredential.user.email,
                    createdAt: new Date().toISOString(),
                    familyIds: [], // Kezdetben nincs családhoz rendelve
                    currentFamilyId: null // Nincs aktuális család
                });
                console.log("AuthScreen: User document created successfully (familyId null).");

            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("AuthScreen: User signed in, UID:", userCredential.user.uid);
            }
            setLoading(false);
            // Az onAuthStateChanged listener a FirebaseProviderben frissíti a userId és userFamilyId állapotokat
        } catch (err) {
            setLoading(false);
            let errorMessage = "Ismeretlen hiba történt.";
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = "Ez az e-mail cím már használatban van.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Érvénytelen e-mail cím.";
            } else if (err.code === 'auth/operation-not-allowed') {
                errorMessage = "Az e-mail/jelszó hitelesítés nincs engedélyezve. Kérjük, engedélyezze a Firebase Authentication 'Sign-in method' fülén.";
            } else if (err.code === 'auth/weak-password') {
                errorMessage = "A jelszó túl gyenge (legalább 6 karakter).";
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = "Helytelen e-mail cím vagy jelszó.";
            }
            setError(errorMessage);
            console.error("AuthScreen: Hitelesítési hiba:", err.message, err.code, err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    {isRegistering ? "Regisztráció" : "Bejelentkezés"}
                </h2>
                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="******"
                        required
                    />
                </div>
                <button
                    onClick={handleAuthAction}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Betöltés..." : (isRegistering ? "Regisztráció" : "Bejelentkezés")}
                </button>
                <button
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="mt-4 w-full text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-300 ease-in-out"
                >
                    {isRegistering ? "Már van fiókom" : "Nincs még fiókom? Regisztrálok"}
                </button>
                
                {/* Vissza a főoldalra link */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition duration-300 ease-in-out flex items-center justify-center"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Vissza a főoldalra
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen; 