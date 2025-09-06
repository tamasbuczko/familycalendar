import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    addDoc,
    collection,
} from 'firebase/firestore';

// AuthScreen komponens
const AuthScreen = () => {
    const { auth, db } = useFirebase();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [passwordResetSent, setPasswordResetSent] = useState(false);
    const [passwordResetLoading, setPasswordResetLoading] = useState(false);
    
    // Hibrid regisztráció új mezői
    const [familyName, setFamilyName] = useState('');
    const [familyCity, setFamilyCity] = useState('');
    const [childrenCount, setChildrenCount] = useState(0);
    
    const googleProvider = new GoogleAuthProvider();
    const facebookProvider = new FacebookAuthProvider();

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuthAction();
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google sign-in successful:", result.user.email);
            
            // Ellenőrizzük, hogy a felhasználó már létezik-e
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${result.user.uid}`);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                // Új felhasználó - létrehozzuk a dokumentumot
                await setDoc(userDocRef, {
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: new Date().toISOString(),
                    familyIds: [],
                    currentFamilyId: null,
                    provider: 'google'
                });
                console.log("Google user document created successfully");
            }
            
            setGoogleLoading(false);
        } catch (err) {
            setGoogleLoading(false);
            let errorMessage = "Google bejelentkezési hiba.";
            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = "A bejelentkezési ablak bezárásra került.";
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage = "A bejelentkezési ablak blokkolva van. Engedélyezze a felugró ablakokat.";
            }
            setError(errorMessage);
            console.error("Google sign-in error:", err);
        }
    };

    const handleFacebookSignIn = async () => {
        setError('');
        setFacebookLoading(true);
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            console.log("Facebook sign-in successful:", result.user.email);
            
            // Ellenőrizzük, hogy a felhasználó már létezik-e
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${result.user.uid}`);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                // Új felhasználó - létrehozzuk a dokumentumot
                await setDoc(userDocRef, {
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: new Date().toISOString(),
                    familyIds: [],
                    currentFamilyId: null,
                    provider: 'facebook'
                });
                console.log("Facebook user document created successfully");
            }
            
            setFacebookLoading(false);
        } catch (err) {
            setFacebookLoading(false);
            let errorMessage = "Facebook bejelentkezési hiba.";
            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = "A bejelentkezési ablak bezárásra került.";
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage = "A bejelentkezési ablak blokkolva van. Engedélyezze a felugró ablakokat.";
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "Ez az email cím már használatban van más bejelentkezési móddal.";
            }
            setError(errorMessage);
            console.error("Facebook sign-in error:", err);
        }
    };

    // Család létrehozása a hibrid modellben
    const createFamily = async (userId, userEmail) => {
        try {
            // Család létrehozása
            const familyData = {
                name: familyName.trim(),
                city: familyCity.trim(),
                childrenCount: parseInt(childrenCount),
                createdAt: new Date().toISOString(),
                admin: userId,
                members: [{
                    userId: userId,
                    email: userEmail,
                    role: 'admin',
                    joinedAt: new Date().toISOString()
                }]
            };

            console.log("Creating family with data:", familyData);

            const familiesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families`);
            const familyDocRef = await addDoc(familiesColRef, familyData);
            const familyId = familyDocRef.id;

            console.log("Family created successfully with ID:", familyId);

            // Felhasználó frissítése a családi azonosítóval
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            await setDoc(userDocRef, {
                email: userEmail,
                createdAt: new Date().toISOString(),
                familyIds: [familyId],
                currentFamilyId: familyId,
                emailVerified: false,
                role: 'admin'
            }, { merge: true });

            console.log("User document updated with family ID:", familyId);
            return familyId;
        } catch (error) {
            console.error("Error creating family:", error);
            throw error;
        }
    };

    const handleAuthAction = async () => {
        setError('');
        setLoading(true);
        console.log(`AuthScreen: Attempting to ${isRegistering ? "register" : "sign in"} with email: ${email}`);
        
        try {
            let userCredential;
            if (isRegistering) {
                // Regisztráció - jelszó ellenőrzés
                if (password !== confirmPassword) {
                    setError("A jelszavak nem egyeznek.");
                    setLoading(false);
                    return;
                }

                if (password.length < 6) {
                    setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
                    setLoading(false);
                    return;
                }

                // Család név ellenőrzés
                if (!familyName.trim()) {
                    setError("Kérjük, adja meg a család nevét.");
                    setLoading(false);
                    return;
                }

                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("AuthScreen: User registered, UID:", userCredential.user.uid);

                // Email verifikáció küldése
                await sendEmailVerification(userCredential.user);
                setEmailSent(true);
                console.log("Verification email sent successfully");

                // Család létrehozása a hibrid modellben
                const familyId = await createFamily(userCredential.user.uid, userCredential.user.email);
                console.log("AuthScreen: Family created and user assigned. Family ID:", familyId);

            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("AuthScreen: User signed in, UID:", userCredential.user.uid);
                
                // Email verifikáció ellenőrzése
                if (!userCredential.user.emailVerified) {
                    setError("Kérlek erősítsd meg az email címed a bejelentkezés előtt. Ellenőrizd a postaládádat.");
                    // Email verifikáció újraküldése
                    await sendEmailVerification(userCredential.user);
                    setEmailSent(true);
                    return;
                }
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

    const handleResendVerification = async () => {
        setError('');
        setVerificationLoading(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setEmailSent(true);
                console.log("Verification email resent successfully");
            }
        } catch (err) {
            let errorMessage = "Email verifikáció újraküldési hiba.";
            if (err.code === 'auth/too-many-requests') {
                errorMessage = "Túl sok kérés. Várj néhány percet az újrapróbálkozásig.";
            }
            setError(errorMessage);
            console.error("Resend verification error:", err);
        } finally {
            setVerificationLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError("Kérlek add meg az email címed a jelszó visszaállításhoz.");
            return;
        }
        
        setError('');
        setPasswordResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setPasswordResetSent(true);
            console.log("Password reset email sent successfully");
        } catch (err) {
            let errorMessage = "Jelszó visszaállítási hiba.";
            if (err.code === 'auth/user-not-found') {
                errorMessage = "Nem található felhasználó ezzel az email címmel.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Érvénytelen email cím.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Túl sok kérés. Várj néhány percet az újrapróbálkozásig.";
            }
            setError(errorMessage);
            console.error("Password reset error:", err);
        } finally {
            setPasswordResetLoading(false);
        }
    };

    // Regisztrációs mód váltásakor családi űrlap megjelenítése
    const handleRegisterModeToggle = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setEmailSent(false);
        setPasswordResetSent(false);
        setFamilyName('');
        setFamilyCity('');
        setChildrenCount(0);
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    {isRegistering ? "Család Alapítói Regisztráció" : "Bejelentkezés"}
                </h2>
                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
                {emailSent && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <i className="fas fa-check-circle text-green-600 mr-2"></i>
                            <div>
                                <p className="text-green-800 text-sm font-medium">Verifikációs email elküldve!</p>
                                <p className="text-green-600 text-xs">Ellenőrizd a postaládádat és kattints a linkre.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleResendVerification}
                            disabled={verificationLoading}
                            className="mt-2 text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                        >
                            {verificationLoading ? "Küldés..." : "Újraküldés"}
                        </button>
                    </div>
                )}
                {passwordResetSent && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                            <i className="fas fa-envelope text-blue-600 mr-2"></i>
                            <div>
                                <p className="text-blue-800 text-sm font-medium">Jelszó visszaállítási email elküldve!</p>
                                <p className="text-blue-600 text-xs">Ellenőrizd a postaládádat és kövesd az utasításokat.</p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }}>
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
                    <div className="mb-4">
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
                        {!isRegistering && (
                            <button
                                type="button"
                                onClick={() => setShowPasswordReset(true)}
                                className="mt-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition duration-300 ease-in-out"
                            >
                                Elfelejtett jelszó?
                            </button>
                        )}
                    </div>
                    {isRegistering && (
                        <>
                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Jelszó megerősítése</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="******"
                                    required
                                />
                            </div>
                            
                            {/* Családi adatok űrlap */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-blue-800 mb-3">Családi Adatok</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">Család neve *</label>
                                        <input
                                            type="text"
                                            id="familyName"
                                            value={familyName}
                                            onChange={(e) => setFamilyName(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="pl. Kovács család"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="familyCity" className="block text-sm font-medium text-gray-700 mb-1">Város</label>
                                        <input
                                            type="text"
                                            id="familyCity"
                                            value={familyCity}
                                            onChange={(e) => setFamilyCity(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="pl. Budapest"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700 mb-1">Gyerekek száma</label>
                                        <select
                                            id="childrenCount"
                                            value={childrenCount}
                                            onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={0}>0</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5+</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Betöltés..." : (isRegistering ? "Család Létrehozása" : "Bejelentkezés")}
                    </button>
                </form>
                
                {/* OAuth Gombok */}
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Vagy</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="mt-4 w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {googleLoading ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : (
                            <i className="fab fa-google text-red-500 mr-2"></i>
                        )}
                        {googleLoading ? "Betöltés..." : "Google fiókkal folytatás"}
                    </button>
                    
                    <button
                        onClick={handleFacebookSignIn}
                        disabled={facebookLoading}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {facebookLoading ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : (
                            <i className="fab fa-facebook-f text-white mr-2"></i>
                        )}
                        {facebookLoading ? "Betöltés..." : "Facebook fiókkal folytatás"}
                    </button>
                </div>
                <button
                    onClick={handleRegisterModeToggle}
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
        
        {/* Password Reset Modal */}
        {showPasswordReset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Jelszó visszaállítása</h3>
                        <button
                            onClick={() => {
                                setShowPasswordReset(false);
                                setPasswordResetSent(false);
                                setError('');
                            }}
                            className="text-gray-400 hover:text-gray-600 transition duration-300 ease-in-out"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    {!passwordResetSent ? (
                        <>
                            <p className="text-gray-600 text-sm mb-4">
                                Add meg az email címed, és küldünk egy linket a jelszó visszaállításához.
                            </p>
                            <div className="mb-4">
                                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                <input
                                    type="email"
                                    id="resetEmail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={passwordResetLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passwordResetLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Küldés...
                                        </>
                                    ) : (
                                        "Küldés"
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPasswordReset(false);
                                        setPasswordResetSent(false);
                                        setError('');
                                    }}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                                >
                                    Mégse
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mb-4">
                                <i className="fas fa-check-circle text-green-600 text-4xl"></i>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Email elküldve!</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                Ellenőrizd a postaládádat és kövesd az utasításokat a jelszó visszaállításához.
                            </p>
                            <button
                                onClick={() => {
                                    setShowPasswordReset(false);
                                    setPasswordResetSent(false);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 ease-in-out"
                            >
                                Rendben
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    );
};

export default AuthScreen; 