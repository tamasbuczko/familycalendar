import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../config.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    onSnapshot,
} from 'firebase/firestore';

// FamilySetupScreen komponens
const FamilySetupScreen = ({ onLogout }) => {
    const { db, userId, setUserFamilyId, setUserId } = useFirebase();
    const navigate = useNavigate();
    const userIdRef = useRef(userId);
    useEffect(() => { userIdRef.current = userId; }, [userId]);
    const [families, setFamilies] = useState([]);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [joinFamilyId, setJoinFamilyId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingFamilyIds, setLoadingFamilyIds] = useState(new Set());
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [loadingFamilies, setLoadingFamilies] = useState(false);
    const unsubscribeRef = useRef(null);

    // Családok manuális betöltése
    const refreshFamilies = async () => {
        if (!db || !userId) {
            console.log("FamilySetupScreen: refreshFamilies - DB or userId not available");
            setFamilies([]);
            setLoadingFamilies(false);
            return;
        }
        
        setLoadingFamilies(true);
        setError('');
        
        try {
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let userFamilyIds = userData.familyIds || [];
                
                // Ha van régi familyId, adjuk hozzá a listához
                if (userData.familyId && !userFamilyIds.includes(userData.familyId)) {
                    userFamilyIds = [...userFamilyIds, userData.familyId];
                }
                
                if (userFamilyIds.length === 0) {
                    setFamilies([]);
                    setLoadingFamilies(false);
                    return;
                }
                
                // Lekérjük az összes családot
                const familiesList = [];
                for (const familyId of userFamilyIds) {
                    try {
                        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${familyId}`);
                        const familyDoc = await getDoc(familyDocRef);
                        if (familyDoc.exists()) {
                            familiesList.push({
                                id: familyDoc.id,
                                ...familyDoc.data()
                            });
                        }
                    } catch (error) {
                        console.error("FamilySetupScreen: Error loading family:", familyId, error);
                    }
                }
                
                setFamilies(familiesList);
                console.log("FamilySetupScreen: User familyIds:", userFamilyIds);
                console.log("FamilySetupScreen: Families refreshed:", familiesList);
            } else {
                // Ha a felhasználói dokumentum nem létezik, csak üres listát jelenítünk meg
                console.log("FamilySetupScreen: User document does not exist in refreshFamilies");
                setFamilies([]);
            }
        } catch (error) {
            console.error("FamilySetupScreen: Error refreshing families:", error);
            setError("Hiba a családok frissítésekor.");
        } finally {
            setLoadingFamilies(false);
        }
    };

    // Családok betöltése valós időben
    useEffect(() => {
        if (!db || !userId) {
            console.log("FamilySetupScreen: DB or userId not available for loading families");
            setFamilies([]);
            setLoadingFamilies(false);
            return;
        }

        console.log("FamilySetupScreen: Setting up families listener...");
        console.log("FamilySetupScreen: Project ID:", firebaseConfig.projectId);
        console.log("FamilySetupScreen: User ID:", userId);
        
        // Kezdeti betöltés
        refreshFamilies();
        
        // Lekérjük a felhasználó dokumentumát, hogy megtudjuk, melyik családokhoz csatlakozott
        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
        const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
            if (!userIdRef.current) return;
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let userFamilyIds = userData.familyIds || []; // Több család ID tárolása
                
                // Ha van régi familyId, adjuk hozzá a listához és frissítsük a dokumentumot
                if (userData.familyId && !userFamilyIds.includes(userData.familyId)) {
                    userFamilyIds = [...userFamilyIds, userData.familyId];
                    
                    // Frissítsük a dokumentumot, hogy eltávolítsuk a régi familyId mezőt
                    try {
                        await updateDoc(userDocRef, {
                            familyIds: userFamilyIds,
                            familyId: null // Eltávolítjuk a régi mezőt
                        });
                        console.log("FamilySetupScreen: Updated user document to remove old familyId");
                    } catch (error) {
                        console.error("FamilySetupScreen: Error updating user document:", error);
                    }
                }
                
                console.log("FamilySetupScreen: User family IDs:", userFamilyIds);
                
                if (userFamilyIds.length === 0) {
                    setFamilies([]);
                    setLoadingFamilies(false);
                    return;
                }
                
                // Lekérjük az összes családot, amikhez a felhasználó csatlakozott
                const familiesList = [];
                for (const familyId of userFamilyIds) {
                    try {
                        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${familyId}`);
                        const familyDoc = await getDoc(familyDocRef);
                        if (familyDoc.exists()) {
                            familiesList.push({
                                id: familyDoc.id,
                                ...familyDoc.data()
                            });
                        }
                    } catch (error) {
                        console.error("FamilySetupScreen: Error loading family:", familyId, error);
                    }
                }
                
                setFamilies(familiesList);
                setLoadingFamilies(false);
                console.log("FamilySetupScreen: User families loaded:", familiesList);
            } else {
                // Ha a felhasználói dokumentum nem létezik, csak üres listát jelenítünk meg
                console.log("FamilySetupScreen: User document does not exist, showing empty list");
                setFamilies([]);
                setLoadingFamilies(false);
            }
        }, (error) => {
            if (!userIdRef.current) return;
            console.error("FamilySetupScreen: Hiba a felhasználói adatok betöltésekor:", error);
            setError("Hiba a családok betöltésekor. Kérjük, próbálja újra.");
            setLoadingFamilies(false);
        });

        // Tároljuk a listener referenciáját
        unsubscribeRef.current = unsubscribeUser;

        return () => {
            console.log("FamilySetupScreen: Cleaning up user listener");
            setFamilies([]);
            setLoadingFamilies(false);
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [db, userId]);

    const generateFamilyId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleCreateFamily = async () => {
        setError('');
        setLoading(true);

        if (!userId) {
            setError("Hiba: Nincs bejelentkezett felhasználó.");
            setLoading(false);
            return;
        }

        if (!newFamilyName.trim()) {
            setError("Kérjük, adja meg az új család nevét.");
            setLoading(false);
            return;
        }

        try {
            const generatedId = generateFamilyId();
            const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${generatedId}`);

            // Ellenőrizzük, hogy az ID nem létezik-e
            const familyDocSnap = await getDoc(familyDocRef);
            if (familyDocSnap.exists()) {
                return handleCreateFamily(); // Rekurzív hívás ütközés esetén
            }

            const newFamilyData = {
                name: newFamilyName.trim(),
                createdAt: new Date().toISOString(),
                admin: userId
            };

            await setDoc(familyDocRef, newFamilyData);

            // Felhasználó hozzárendelése a családhoz
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            const currentFamilyIds = userData.familyIds || [];
            
            if (!currentFamilyIds.includes(generatedId)) {
                if (userDoc.exists()) {
                    // Ha a dokumentum létezik, frissítsük
                    await updateDoc(userDocRef, { 
                        familyIds: [...currentFamilyIds, generatedId],
                        currentFamilyId: generatedId // Aktuális család
                    });
                } else {
                    // Ha a dokumentum nem létezik, hozzuk létre
                    await setDoc(userDocRef, { 
                        familyIds: [generatedId],
                        currentFamilyId: generatedId // Aktuális család
                    });
                }
            }

            setUserFamilyId(generatedId);
            setLoading(false);
            setError('');
            setNewFamilyName('');
            setShowCreateForm(false);
            
            // Frissítsük a családok listáját manuálisan
            setFamilies(prevFamilies => [...prevFamilies, {
                id: generatedId,
                name: newFamilyName.trim(),
                createdAt: new Date().toISOString(),
                admin: userId
            }]);
        } catch (err) {
            setLoading(false);
            let errorMessage = "Hiba a család létrehozásakor.";
            if (err.code === 'permission-denied') {
                errorMessage += " Kérjük, ellenőrizze a Firebase Firestore biztonsági szabályait.";
            }
            setError(errorMessage);
            console.error("Család létrehozási hiba:", err);
        }
    };

    const handleJoinFamily = async () => {
        setError('');
        setLoading(true);

        if (!userId) {
            setError("Hiba: Nincs bejelentkezett felhasználó.");
            setLoading(false);
            return;
        }

        if (!joinFamilyId.trim()) {
            setError("Kérjük, adja meg a családi azonosítót.");
            setLoading(false);
            return;
        }

        try {
            const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${joinFamilyId.trim().toUpperCase()}`);
            const familyDocSnap = await getDoc(familyDocRef);

            if (!familyDocSnap.exists()) {
                setError("Érvénytelen családi azonosító.");
                setLoading(false);
                return;
            }

            // Felhasználó hozzárendelése a családhoz
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            const currentFamilyIds = userData.familyIds || [];
            const familyIdToJoin = joinFamilyId.trim().toUpperCase();
            
            if (!currentFamilyIds.includes(familyIdToJoin)) {
                if (userDoc.exists()) {
                    // Ha a dokumentum létezik, frissítsük
                    await updateDoc(userDocRef, { 
                        familyIds: [...currentFamilyIds, familyIdToJoin],
                        currentFamilyId: familyIdToJoin // Aktuális család
                    });
                } else {
                    // Ha a dokumentum nem létezik, hozzuk létre
                    await setDoc(userDocRef, { 
                        familyIds: [familyIdToJoin],
                        currentFamilyId: familyIdToJoin // Aktuális család
                    });
                }
            }

            setUserFamilyId(familyIdToJoin);
            setLoading(false);
            setError('');
            setJoinFamilyId('');
            setShowJoinForm(false);
            
            // Frissítsük a családok listáját manuálisan
            const familyData = familyDocSnap.data();
            setFamilies(prevFamilies => {
                // Ellenőrizzük, hogy már nincs-e a listában
                if (!prevFamilies.find(f => f.id === familyIdToJoin)) {
                    return [...prevFamilies, {
                        id: familyIdToJoin,
                        name: familyData.name,
                        createdAt: familyData.createdAt,
                        admin: familyData.admin
                    }];
                }
                return prevFamilies;
            });
        } catch (err) {
            setLoading(false);
            let errorMessage = "Hiba a családhoz való csatlakozáskor.";
            if (err.code === 'permission-denied') {
                errorMessage += " Kérjük, ellenőrizze a Firebase Firestore biztonsági szabályait.";
            }
            setError(errorMessage);
            console.error("Családhoz csatlakozási hiba:", err);
        }
    };

    const handleJoinExistingFamily = async (familyId) => {
        setError('');
        setLoadingFamilyIds(prev => new Set([...prev, familyId]));

        if (!userId) {
            setError("Hiba: Nincs bejelentkezett felhasználó.");
            setLoadingFamilyIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(familyId);
                return newSet;
            });
            return;
        }

        try {
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                // Ha a dokumentum létezik, frissítsük
                await updateDoc(userDocRef, { currentFamilyId: familyId });
            } else {
                // Ha a dokumentum nem létezik, hozzuk létre
                await setDoc(userDocRef, { 
                    familyIds: [familyId],
                    currentFamilyId: familyId 
                });
            }

            setUserFamilyId(familyId);
            setLoadingFamilyIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(familyId);
                return newSet;
            });
            setError('');
        } catch (err) {
            setLoadingFamilyIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(familyId);
                return newSet;
            });
            let errorMessage = "Hiba a családhoz való csatlakozáskor.";
            if (err.code === 'permission-denied') {
                errorMessage += " Kérjük, ellenőrizze a Firebase Firestore biztonsági szabályait.";
            }
            setError(errorMessage);
            console.error("Családhoz csatlakozási hiba:", err);
        }
    };

    // Kijelentkezés kezelése
    const handleLogoutClick = async () => {
        console.log("FamilySetupScreen: Logout button clicked");
        // Előbb töröljük a listener-t
        if (unsubscribeRef.current) {
            console.log("FamilySetupScreen: Cleaning up listener before logout");
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        // Töröljük a state-et
        setFamilies([]);
        setLoadingFamilies(false);
        setError('');
        // Azonnal nullázzuk a userId-t, hogy a UI váltáson
        setUserId(null);
        // Most már biztonságosan kijelentkezhetünk
        await onLogout();
        // Kijelentkezés után a landing page-re irányít
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Családi csoportok</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLogoutClick}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Kijelentkezés
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center py-8">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                    {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

                    {/* Családok listája */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Családi csoportok</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition duration-200"
                                    title="Új család létrehozása"
                                >
                                    <i className="fas fa-plus mr-1"></i>Új család
                                </button>
                                <button
                                    onClick={refreshFamilies}
                                    disabled={loadingFamilies}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                                    title="Családok listájának frissítése"
                                >
                                    {loadingFamilies ? <><i className="fas fa-spinner fa-spin mr-1"></i>Betöltés...</> : <><i className="fas fa-sync-alt mr-1"></i>Frissítés</>}
                                </button>
                            </div>
                        </div>
                        {loadingFamilies ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Családok betöltése...</p>
                            </div>
                        ) : families.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Még nincsenek családi csoportok.</p>
                                <p className="text-sm mt-2">Hozz létre egyet, vagy csatlakozz egy meglévőhöz!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {families.map((family) => (
                                    <div key={family.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{family.name}</h4>
                                            <p className="text-sm text-gray-600">ID: {family.id}</p>
                                            <p className="text-xs text-gray-500">
                                                Létrehozva: {new Date(family.createdAt).toLocaleDateString('hu-HU')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleJoinExistingFamily(family.id)}
                                            disabled={loadingFamilyIds.has(family.id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                                        >
                                            {loadingFamilyIds.has(family.id) ? "Belépés..." : "Belépés"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Új család létrehozása */}
                    <div className="mb-6">
                        {!showCreateForm ? (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300"
                            >
                                Új család létrehozása
                            </button>
                        ) : (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Új család létrehozása</h4>
                                <div className="mb-4">
                                    <label htmlFor="newFamilyName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Család neve
                                    </label>
                                    <input
                                        type="text"
                                        id="newFamilyName"
                                        value={newFamilyName}
                                        onChange={(e) => setNewFamilyName(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Adja meg az új család nevét"
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleCreateFamily}
                                        disabled={loading}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                                    >
                                        {loading ? "Létrehozás..." : "Létrehozás"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setNewFamilyName('');
                                            setError('');
                                        }}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Csatlakozás meglévő családhoz */}
                    <div>
                        {!showJoinForm ? (
                            <button
                                onClick={() => setShowJoinForm(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300"
                            >
                                Csatlakozás új családhoz
                            </button>
                        ) : (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Csatlakozás családhoz</h4>
                                <div className="mb-4">
                                    <label htmlFor="joinFamilyId" className="block text-sm font-medium text-gray-700 mb-1">
                                        Családi azonosító
                                    </label>
                                    <input
                                        type="text"
                                        id="joinFamilyId"
                                        value={joinFamilyId}
                                        onChange={(e) => setJoinFamilyId(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Adja meg a családi azonosítót"
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleJoinFamily}
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                                    >
                                        {loading ? "Csatlakozás..." : "Csatlakozás"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowJoinForm(false);
                                            setJoinFamilyId('');
                                            setError('');
                                        }}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilySetupScreen; 