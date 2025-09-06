import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { firebaseConfig } from '../../firebaseConfig.js';

// State kezelő hook a CalendarApp számára
export const useCalendarState = (db, userId, userFamilyId) => {
    // Alapvető state változók
    const [familyMembers, setFamilyMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
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
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showChildProfileModal, setShowChildProfileModal] = useState(false);
    const [showChildLoginModal, setShowChildLoginModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [childLoading, setChildLoading] = useState(false);
    const [childLoginLoading, setChildLoginLoading] = useState(false);
    
    // Child session state
    const [childSession, setChildSession] = useState(() => {
        // Local storage-ből betöltés indításkor
        const savedSession = localStorage.getItem('childSession');
        return savedSession ? JSON.parse(savedSession) : null;
    });

    // Parent PIN state
    const [parentPin, setParentPin] = useState(() => {
        // Local storage-ből betöltés indításkor
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

    // Utility függvények
    const showTemporaryMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    // Családtagok lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;

        const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
        const unsubscribe = onSnapshot(familyMembersColRef, (snapshot) => {
            const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFamilyMembers(members);
        }, (error) => {
            console.error("CalendarStateManager: Hiba a családtagok lekérésekor:", error);
            setMessage("Hiba a családtagok betöltésekor.");
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // Események lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;

        const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
        const unsubscribe = onSnapshot(eventsColRef, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(fetchedEvents);
        }, (error) => {
            console.error("CalendarStateManager: Hiba az események lekérésekor:", error);
            setMessage("Hiba az események betöltésekor.");
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // Család adatok lekérése
    useEffect(() => {
        if (!db || !userFamilyId) {
            setFamilyData(null);
            return;
        }

        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}`);
        const unsubscribe = onSnapshot(familyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setFamilyData({ id: docSnap.id, ...docSnap.data() });
            } else {
                setFamilyData(null);
            }
        }, (error) => {
            console.error("CalendarStateManager: Hiba a család adatainak lekérésekor:", error);
            setMessage("Hiba a család adatainak betöltésekor.");
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
        events,
        currentDate,
        setCurrentDate,
        currentView,
        setCurrentView,
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
        setConfirmAction,
        setConfirmMessage,
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
