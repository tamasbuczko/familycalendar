import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../../firebaseConfig.js';

// State kezelő hook a CalendarApp számára
export const useCalendarState = (db, userId, userFamilyId) => {
    // Alapvető state változók
    const [familyMembers, setFamilyMembers] = useState([]); // Szűrt lista (családfő nélkül)
    const [currentUserMember, setCurrentUserMember] = useState(null); // Jelenlegi felhasználó member rekordja
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
    const [selectedMemberId, setSelectedMemberId] = useState(null); // Kiválasztott családtag ID-ja szűréshez
    const [familyData, setFamilyData] = useState(null);
    const [message, setMessage] = useState('');

    // Modal state változók
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [editingFamilyMember, setEditingFamilyMember] = useState(null);
    const [familyMemberType, setFamilyMemberType] = useState('family');
    const [familyMemberLoading, setFamilyMemberLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [showCancellationReason, setShowCancellationReason] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showChildProfileModal, setShowChildProfileModal] = useState(false);
    const [showChildLoginModal, setShowChildLoginModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [childLoading, setChildLoading] = useState(false);
    const [childLoginLoading, setChildLoginLoading] = useState(false);
    
    // Child session state - localStorage-ből betöltés offline támogatáshoz
    const [childSession, setChildSession] = useState(() => {
        const savedSession = localStorage.getItem('childSession');
        return savedSession ? JSON.parse(savedSession) : null;
    });

    // Parent PIN state - localStorage-ből betöltés offline támogatáshoz
    const [parentPin, setParentPin] = useState(() => {
        const savedPin = localStorage.getItem('parentPin');
        return savedPin || '';
    });

    // Parent PIN modal state
    const [showParentPinModal, setShowParentPinModal] = useState(false);
    const [parentPinLoading, setParentPinLoading] = useState(false);
    
    // Settings modal state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);
    
    // User profile modal state
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);
    const [userProfileLoading, setUserProfileLoading] = useState(false);
    const [userDisplayName, setUserDisplayName] = useState('');

    // Child session betöltés indításkor
    // Child session betöltése localStorage-ból (offline támogatás)
    useEffect(() => {
        const savedSession = localStorage.getItem('childSession');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setChildSession(session);
            } catch (error) {
                console.error("CalendarStateManager: Error loading child session:", error);
                localStorage.removeItem('childSession');
            }
        }
    }, []);

    // Felhasználó profil adatok betöltése
    useEffect(() => {
        if (userId && db) {
            const userDocRef = doc(db, 'artifacts', firebaseConfig.projectId, 'users', userId);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    if (userData.displayName) {
                        setUserDisplayName(userData.displayName);
                    }
                }
            }, (error) => {
                console.error("CalendarStateManager: Error loading user profile:", error);
            });

            return () => unsubscribe();
        }
    }, [userId, db]);

    // PIN valós idejű szinkronizálás Firebase-szel
    useEffect(() => {
        if (!userId || !db) {
            // Offline mód: localStorage-ból betöltés
            const savedPin = localStorage.getItem('parentPin');
            if (savedPin) {
                setParentPin(savedPin);
            }
            return;
        }

        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
        const unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
            console.log("CalendarStateManager: PIN listener triggered for user:", userId);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const firebasePin = userData.parentPin;
                const firebaseTimestamp = userData.parentPinTimestamp;
                const localPin = localStorage.getItem('parentPin');
                const localTimestamp = localStorage.getItem('parentPinTimestamp');
                
                console.log("CalendarStateManager: PIN sync data:", {
                    userId,
                    firebasePin: firebasePin ? "***" : "null",
                    firebaseTimestamp,
                    localPin: localPin ? "***" : "null", 
                    localTimestamp
                });
                
                if (firebasePin && localPin) {
                    // Konfliktus: mindkét helyen van PIN
                    if (firebaseTimestamp && localTimestamp) {
                        const firebaseTime = new Date(firebaseTimestamp).getTime();
                        const localTime = new Date(localTimestamp).getTime();
                        
                        if (firebaseTime > localTime) {
                            // Firebase-ben újabb - használjuk azt
                            localStorage.setItem('parentPin', firebasePin);
                            localStorage.setItem('parentPinTimestamp', firebaseTimestamp);
                            setParentPin(firebasePin);
                            console.log("CalendarStateManager: PIN updated from Firebase (newer version)");
                        } else if (localTime > firebaseTime) {
                            // localStorage-ben újabb - frissítsük Firebase-t
                            try {
                                await setDoc(userDocRef, { 
                                    parentPin: localPin,
                                    parentPinTimestamp: localTimestamp,
                                    parentPinUserId: userId
                                }, { merge: true });
                                console.log("CalendarStateManager: Firebase updated with newer local PIN");
                            } catch (error) {
                                console.warn("CalendarStateManager: Could not update Firebase with local PIN:", error);
                            }
                        }
                    } else {
                        // Ha nincs timestamp, használjuk a Firebase-t
                        localStorage.setItem('parentPin', firebasePin);
                        localStorage.setItem('parentPinTimestamp', firebaseTimestamp || new Date().toISOString());
                        setParentPin(firebasePin);
                    }
                } else if (firebasePin && !localPin) {
                    // Csak Firebase-ben van PIN
                    localStorage.setItem('parentPin', firebasePin);
                    localStorage.setItem('parentPinTimestamp', firebaseTimestamp || new Date().toISOString());
                    setParentPin(firebasePin);
                    console.log("CalendarStateManager: PIN synced from Firebase to localStorage");
                } else if (!firebasePin && localPin) {
                    // Csak localStorage-ben van PIN - szinkronizáljuk
                    try {
                        await setDoc(userDocRef, { 
                            parentPin: localPin,
                            parentPinTimestamp: localTimestamp || new Date().toISOString(),
                            parentPinUserId: userId
                        }, { merge: true });
                        console.log("CalendarStateManager: PIN synced from localStorage to Firebase");
                    } catch (error) {
                        console.warn("CalendarStateManager: Could not sync local PIN to Firebase:", error);
                    }
                } else if (!firebasePin && !localPin) {
                    // Nincs PIN sehol
                    setParentPin('');
                }
            }
        }, (error) => {
            console.error("CalendarStateManager: Error in PIN real-time listener:", error);
            // Offline fallback: localStorage-ból betöltés
            const savedPin = localStorage.getItem('parentPin');
            if (savedPin) {
                setParentPin(savedPin);
            }
        });

        return () => unsubscribe();
    }, [userId, db]);

    // Utility függvények
    const showTemporaryMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    // Családtagok lekérése - Firebase elsőbbség offline fallback-kel
    useEffect(() => {
        if (!db || !userFamilyId) {
            // Offline mód: localStorage-ból betöltés
            const savedMembers = localStorage.getItem('familyMembers');
            if (savedMembers) {
                try {
                    const members = JSON.parse(savedMembers);
                    // Jelenlegi felhasználó member rekordjának kinyerése
                    const userMember = userId ? members.find(m => m.userId === userId) : null;
                    setCurrentUserMember(userMember || null);
                    
                    // Kizárjuk a jelenlegi felhasználót (családfő) a családtagok listájából
                    const filteredMembers = members.filter(member => {
                        return !member.userId || member.userId !== userId;
                    });
                    setFamilyMembers(filteredMembers);
                } catch (error) {
                    console.warn("CalendarStateManager: Error loading family members from localStorage:", error);
                }
            }
            return;
        }

        const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
        const unsubscribe = onSnapshot(familyMembersColRef, (snapshot) => {
            const allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Jelenlegi felhasználó member rekordjának kinyerése
            const userMember = userId ? allMembers.find(m => m.userId === userId) : null;
            setCurrentUserMember(userMember || null);
            
            // Szűrt lista (családfő nélkül) - megjelenítéshez
            const filteredMembers = allMembers.filter(member => {
                // Kizárjuk a jelenlegi felhasználót (családfő) a családtagok listájából
                // mert ő már a jobb felső sarokban van megjelenítve
                return !member.userId || member.userId !== userId;
            });
            setFamilyMembers(filteredMembers);
            
            // Offline backup: localStorage-ba mentés
            try {
                localStorage.setItem('familyMembers', JSON.stringify(members));
            } catch (error) {
                console.warn("CalendarStateManager: Could not save family members to localStorage:", error);
            }
        }, (error) => {
            console.error("CalendarStateManager: Hiba a családtagok lekérésekor:", error);
            setMessage("Hiba a családtagok betöltésekor. Offline módban folytatás...");
            
            // Offline fallback: localStorage-ból betöltés
            const savedMembers = localStorage.getItem('familyMembers');
            if (savedMembers) {
                try {
                    const members = JSON.parse(savedMembers);
                    // Jelenlegi felhasználó member rekordjának kinyerése
                    const userMember = userId ? members.find(m => m.userId === userId) : null;
                    setCurrentUserMember(userMember || null);
                    
                    // Kizárjuk a jelenlegi felhasználót (családfő) a családtagok listájából
                    const filteredMembers = members.filter(member => {
                        return !member.userId || member.userId !== userId;
                    });
                    setFamilyMembers(filteredMembers);
                } catch (parseError) {
                    console.warn("CalendarStateManager: Error parsing saved family members:", parseError);
                }
            }
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // Események lekérése - Firebase elsőbbség offline fallback-kel
    useEffect(() => {
        if (!db || !userFamilyId) {
            // Offline mód: localStorage-ból betöltés
            const savedEvents = localStorage.getItem('events');
            if (savedEvents) {
                try {
                    setEvents(JSON.parse(savedEvents));
                } catch (error) {
                    console.warn("CalendarStateManager: Error loading events from localStorage:", error);
                }
            }
            return;
        }

        const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
        const unsubscribe = onSnapshot(eventsColRef, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
            setEvents(fetchedEvents);
            
            // Offline backup: localStorage-ba mentés
            try {
                localStorage.setItem('events', JSON.stringify(fetchedEvents));
            } catch (error) {
                console.warn("CalendarStateManager: Could not save events to localStorage:", error);
            }
        }, (error) => {
            console.error("CalendarStateManager: Hiba az események lekérésekor:", error);
            setMessage("Hiba az események betöltésekor. Offline módban folytatás...");
            
            // Offline fallback: localStorage-ból betöltés
            const savedEvents = localStorage.getItem('events');
            if (savedEvents) {
                try {
                    setEvents(JSON.parse(savedEvents));
                } catch (parseError) {
                    console.warn("CalendarStateManager: Error parsing saved events:", parseError);
                }
            }
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // Család adatok lekérése - Firebase elsőbbség offline fallback-kel
    useEffect(() => {
        if (!db || !userFamilyId) {
            // Offline mód: localStorage-ból betöltés
            const savedFamilyData = localStorage.getItem('familyData');
            if (savedFamilyData) {
                try {
                    setFamilyData(JSON.parse(savedFamilyData));
                } catch (error) {
                    console.warn("CalendarStateManager: Error loading family data from localStorage:", error);
                }
            } else {
                setFamilyData(null);
            }
            return;
        }

        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}`);
        const unsubscribe = onSnapshot(familyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const familyData = { id: docSnap.id, ...docSnap.data() };
                setFamilyData(familyData);
                
                // Offline backup: localStorage-ba mentés
                try {
                    localStorage.setItem('familyData', JSON.stringify(familyData));
                } catch (error) {
                    console.warn("CalendarStateManager: Could not save family data to localStorage:", error);
                }
            } else {
                setFamilyData(null);
                localStorage.removeItem('familyData');
            }
        }, (error) => {
            console.error("CalendarStateManager: Hiba a család adatainak lekérésekor:", error);
            setMessage("Hiba a család adatainak betöltésekor. Offline módban folytatás...");
            
            // Offline fallback: localStorage-ból betöltés
            const savedFamilyData = localStorage.getItem('familyData');
            if (savedFamilyData) {
                try {
                    setFamilyData(JSON.parse(savedFamilyData));
                } catch (parseError) {
                    console.warn("CalendarStateManager: Error parsing saved family data:", parseError);
                }
            }
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // State reset függvények
    const resetEventModal = () => {
        setShowEventModal(false);
        setEditingEvent(null);
    };

    const resetFamilyModal = () => {
        setShowFamilyModal(false);
        setEditingFamilyMember(null);
        setFamilyMemberType('family');
        setFamilyMemberLoading(false);
    };

    const resetConfirmModal = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setShowCancellationReason(false);
    };

    const resetInviteModal = () => {
        setShowInviteModal(false);
    };

    const resetChildProfileModal = () => {
        setShowChildProfileModal(false);
    };

    const resetChildLoginModal = () => {
        setShowChildLoginModal(false);
    };

    const resetParentPinModal = () => {
        setShowParentPinModal(false);
    };

    const resetSettingsModal = () => {
        setShowSettingsModal(false);
    };

    const resetUserProfileModal = () => {
        setShowUserProfileModal(false);
        setUserProfileLoading(false);
    };

    return {
        // State változók
        familyMembers,
        currentUserMember, // Jelenlegi felhasználó member rekordja
        events,
        currentDate,
        setCurrentDate,
        currentView,
        setCurrentView,
        selectedMemberId,
        setSelectedMemberId,
        familyData,
        message,
        
        // Modal state változók
        showEventModal,
        editingEvent,
        showFamilyModal,
        editingFamilyMember,
        familyMemberType,
        familyMemberLoading,
        showConfirmModal,
        confirmAction,
        confirmMessage,
        showCancellationReason,
        showInviteModal,
        showChildProfileModal,
        showChildLoginModal,
        inviteLoading,
        childLoading,
        childLoginLoading,
        
        // Child session
        childSession,
        setChildSession,
        
        // Parent PIN
        parentPin,
        setParentPin,
        showParentPinModal,
        setShowParentPinModal,
        parentPinLoading,
        setParentPinLoading,
        
        // Settings modal
        showSettingsModal,
        setShowSettingsModal,
        settingsLoading,
        setSettingsLoading,
        
        // User profile modal
        showUserProfileModal,
        setShowUserProfileModal,
        userProfileLoading,
        setUserProfileLoading,
        userDisplayName,
        setUserDisplayName,
        
        // Setter függvények
        setEditingEvent,
        setEditingFamilyMember,
        setFamilyMemberType,
        setFamilyMemberLoading,
        setFamilyData,
        setConfirmAction,
        setConfirmMessage,
        setShowCancellationReason,
        setInviteLoading,
        setChildLoading,
        setChildLoginLoading,
        setShowEventModal,
        setShowFamilyModal,
        setShowConfirmModal,
        setShowInviteModal,
        setShowChildProfileModal,
        setShowChildLoginModal,
        
        // Utility függvények
        showTemporaryMessage,
        
        // Reset függvények
        resetEventModal,
        resetFamilyModal,
        resetConfirmModal,
        resetInviteModal,
        resetChildProfileModal,
        resetChildLoginModal,
        resetParentPinModal,
        resetSettingsModal,
        resetUserProfileModal
    };
};
