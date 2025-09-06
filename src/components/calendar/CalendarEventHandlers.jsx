import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { firebaseConfig } from '../../firebaseConfig.js';

// Event handler függvények a CalendarApp számára
export const useCalendarEventHandlers = (db, userId, userFamilyId, state, setState) => {
    const {
        showTemporaryMessage,
        resetEventModal,
        resetFamilyModal,
        resetConfirmModal,
        resetInviteModal,
        resetChildProfileModal,
        resetChildLoginModal
    } = state;

    // Esemény mentése
    const handleSaveEvent = async (eventData) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
            return;
        }

        try {
            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
            
            if (state.editingEvent) {
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, state.editingEvent.id);
                await updateDoc(eventDocRef, eventData);
                showTemporaryMessage("Esemény sikeresen frissítve!");
            } else {
                await addDoc(eventsColRef, eventData);
                showTemporaryMessage("Esemény sikeresen hozzáadva!");
            }
            
            resetEventModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba az esemény mentésekor:", error);
            showTemporaryMessage("Hiba az esemény mentésekor.");
        }
    };

    // Családtag mentése
    const handleSaveFamilyMember = async () => {
        if (!db || !userFamilyId || !state.newFamilyMemberName.trim()) {
            showTemporaryMessage("Kérjük, adjon meg egy nevet a családtaghoz.");
            return;
        }

        try {
            if (state.editingFamilyMember) {
                const memberDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members/${state.editingFamilyMember.id}`);
                await updateDoc(memberDocRef, { name: state.newFamilyMemberName.trim() });
                showTemporaryMessage("Családtag sikeresen frissítve!");
            } else {
                const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
                await addDoc(familyMembersColRef, { name: state.newFamilyMemberName.trim() });
                showTemporaryMessage("Családtag sikeresen hozzáadva!");
            }
            
            resetFamilyModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba a családtag mentésekor:", error);
            showTemporaryMessage("Hiba a családtag mentésekor.");
        }
    };

    // Családtag törlése
    const handleDeleteFamilyMember = async (memberId, memberName) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Nem sikerült törölni a családtagot.");
            return;
        }

        try {
            const memberDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members/${memberId}`);
            await deleteDoc(memberDocRef);
            showTemporaryMessage("Családtag sikeresen törölve!");
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba a családtag törlésekor:", error);
            showTemporaryMessage("Hiba a családtag törlésekor.");
        }
    };

    // Esemény törlése
    const handleDeleteEvent = async (event) => {
        if (!db || !userFamilyId) return;

        try {
            const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, event.id);
            await deleteDoc(eventDocRef);
            showTemporaryMessage("Esemény sikeresen törölve!");
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba az esemény törlésekor:", error);
            showTemporaryMessage("Hiba az esemény törlésekor.");
        }
    };

    // Esemény státuszának módosítása
    const handleChangeEventStatus = async (event, newStatus) => {
        if (!db || !userFamilyId) return;

        try {
            const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, event.id);
            await updateDoc(eventDocRef, { status: newStatus });
            showTemporaryMessage(`Esemény státusza sikeresen ${newStatus}-re módosítva!`);
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba az esemény státuszának módosításakor:", error);
            showTemporaryMessage("Hiba az esemény státuszának módosításakor.");
        }
    };

    // Gyerek profil létrehozása
    const handleCreateChildProfile = async (childData) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Nem sikerült létrehozni a gyerek profilt.");
            return;
        }

        setState.setChildLoading(true);
        try {
            const childMemberData = {
                name: childData.name,
                birthDate: childData.birthDate,
                avatar: childData.avatar,
                role: childData.role,
                isChild: true,
                createdAt: new Date().toISOString(),
                createdBy: userId
            };

            const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
            await addDoc(familyMembersColRef, childMemberData);

            showTemporaryMessage("Gyerek profil sikeresen létrehozva!");
            resetChildProfileModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Error creating child profile:", error);
            showTemporaryMessage("Hiba a gyerek profil létrehozásakor.");
        } finally {
            setState.setChildLoading(false);
        }
    };

    // Meghívó küldése
    const handleSendInvite = async (inviteData) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Nem sikerült elküldeni a meghívót.");
            return;
        }

        setState.setInviteLoading(true);
        try {
            const invitationData = {
                familyId: userFamilyId,
                familyName: state.familyData?.name || 'Család',
                invitedEmail: inviteData.email,
                role: inviteData.role,
                message: inviteData.message,
                status: 'pending',
                createdBy: userId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            const invitationsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/invitations`);
            await addDoc(invitationsColRef, invitationData);

            showTemporaryMessage("Meghívó sikeresen elküldve!");
            resetInviteModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Error sending invitation:", error);
            showTemporaryMessage("Hiba a meghívó küldésekor.");
        } finally {
            setState.setInviteLoading(false);
        }
    };

    // Gyerek bejelentkezés
    const handleChildLogin = async (loginData) => {
        setState.setChildLoginLoading(true);
        try {
            const child = state.familyMembers.find(member => 
                member.id === loginData.childId && member.isChild
            );

            if (!child) {
                showTemporaryMessage("Hiba: Gyerek profil nem található.");
                return;
            }

            const expectedPin = `${child.name.substring(0, 3).toLowerCase()}${child.age || 0}`;
            
            if (loginData.pin !== expectedPin) {
                showTemporaryMessage("Hibás PIN kód!");
                return;
            }

            // Gyerek session létrehozása
            const childSession = {
                childId: child.id,
                childName: child.name,
                childAge: child.age,
                childAvatar: child.avatar,
                childRole: child.role,
                familyId: userFamilyId,
                loginTime: new Date().toISOString(),
                isChild: true
            };

            // Gyerek session mentése local storage-be
            localStorage.setItem('childSession', JSON.stringify(childSession));
            
            // Gyerek session state frissítése
            setState.setChildSession(childSession);

            showTemporaryMessage(`Üdvözlünk, ${child.name}! Gyerek módban vagy bejelentkezve.`);
            resetChildLoginModal();
            
            console.log("CalendarEventHandlers: Child login successful for:", child.name);
            console.log("CalendarEventHandlers: Child session created:", childSession);
            
        } catch (error) {
            console.error("CalendarEventHandlers: Error during child login:", error);
            showTemporaryMessage("Hiba a gyerek bejelentkezés során.");
        } finally {
            setState.setChildLoginLoading(false);
        }
    };

    // Szülői PIN ellenőrzés
    const handleParentPinVerification = async (enteredPin) => {
        setState.setParentPinLoading(true);
        try {
            const savedPin = localStorage.getItem('parentPin');
            
            if (!savedPin) {
                showTemporaryMessage("Nincs beállítva szülői PIN! Kérjük, állítsa be a beállításokban.");
                return false;
            }
            
            if (enteredPin === savedPin) {
                // PIN helyes - kilépés gyerek módból
                localStorage.removeItem('childSession');
                setState.setChildSession(null);
                showTemporaryMessage("Sikeresen kilépve gyerek módból.");
                return true;
            } else {
                showTemporaryMessage("Hibás szülői PIN kód!");
                return false;
            }
        } catch (error) {
            console.error("CalendarEventHandlers: Error verifying parent PIN:", error);
            showTemporaryMessage("Hiba a PIN ellenőrzése során.");
            return false;
        } finally {
            setState.setParentPinLoading(false);
        }
    };

    // Szülői PIN mentése
    const handleSaveParentPin = async (newPin) => {
        console.log("CalendarEventHandlers: handleSaveParentPin called with PIN:", newPin);
        setState.setSettingsLoading(true);
        try {
            if (newPin.trim()) {
                // PIN mentése localStorage-ba
                localStorage.setItem('parentPin', newPin.trim());
                setState.setParentPin(newPin.trim());
                console.log("CalendarEventHandlers: PIN saved to localStorage:", newPin.trim());
                showTemporaryMessage("Szülői PIN sikeresen mentve!");
            } else {
                // PIN törlése
                localStorage.removeItem('parentPin');
                setState.setParentPin('');
                console.log("CalendarEventHandlers: PIN removed from localStorage");
                showTemporaryMessage("Szülői PIN sikeresen törölve!");
            }
            
            setState.resetSettingsModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Error saving parent PIN:", error);
            showTemporaryMessage("Hiba a PIN mentése során.");
        } finally {
            setState.setSettingsLoading(false);
        }
    };

    // Felhasználói profil mentése
    const handleSaveUserProfile = async (profileData) => {
        console.log("CalendarEventHandlers: handleSaveUserProfile called with:", profileData);
        setState.setUserProfileLoading(true);
        try {
            if (!db || !userId) {
                showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
                return;
            }

            // Felhasználói dokumentum frissítése Firestore-ban
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            await updateDoc(userDocRef, {
                displayName: profileData.displayName,
                email: profileData.email,
                updatedAt: new Date().toISOString()
            });

            // Frissítsük a state-et is
            setState.setUserDisplayName(profileData.displayName);

            console.log("User profile saved successfully:", profileData);
            showTemporaryMessage("Profil sikeresen mentve!");
            setState.resetUserProfileModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Error saving user profile:", error);
            showTemporaryMessage("Hiba a profil mentése során.");
        } finally {
            setState.setUserProfileLoading(false);
        }
    };

    return {
        handleSaveEvent,
        handleSaveFamilyMember,
        handleDeleteFamilyMember,
        handleDeleteEvent,
        handleChangeEventStatus,
        handleCreateChildProfile,
        handleSendInvite,
        handleChildLogin,
        handleParentPinVerification,
        handleSaveParentPin,
        handleSaveUserProfile
    };
};
