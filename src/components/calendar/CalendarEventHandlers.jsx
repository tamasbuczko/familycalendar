import { addDoc, updateDoc, deleteDoc, doc, collection, setDoc, getDoc } from 'firebase/firestore';
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

    // Esemény mentése - konfliktus kezeléssel
    const handleSaveEvent = async (eventData) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
            return;
        }

        try {
            const currentTimestamp = new Date().toISOString();
            const eventDataWithTimestamp = {
                ...eventData,
                lastModified: currentTimestamp,
                lastModifiedBy: userId || 'offline'
            };
            
            console.log("CalendarEventHandlers: Saving event with user:", userId, "timestamp:", currentTimestamp);

            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
            
            if (state.editingEvent) {
                // Esemény szerkesztése - konfliktus ellenőrzés
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, state.editingEvent.id);
                const eventDoc = await getDoc(eventDocRef);
                
                if (eventDoc.exists()) {
                    const existingEvent = eventDoc.data();
                    const existingTimestamp = existingEvent.lastModified;
                    
                    // Ha a meglévő esemény újabb, mint amit szerkesztünk, konfliktus
                    if (existingTimestamp && state.editingEvent.lastModified && 
                        new Date(existingTimestamp).getTime() > new Date(state.editingEvent.lastModified).getTime()) {
                        showTemporaryMessage("Figyelem: Az eseményt valaki más már módosította. A legújabb verzió lesz mentve.");
                    }
                }
                
                await updateDoc(eventDocRef, eventDataWithTimestamp);
                showTemporaryMessage("Esemény sikeresen frissítve!");
            } else {
                await addDoc(eventsColRef, eventDataWithTimestamp);
                showTemporaryMessage("Esemény sikeresen hozzáadva!");
            }
            
            resetEventModal();
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba az esemény mentésekor:", error);
            showTemporaryMessage("Hiba az esemény mentésekor.");
        }
    };

    // Családtag mentése - konfliktus kezeléssel
    const handleSaveFamilyMember = async (memberData) => {
        if (!db || !userFamilyId || !memberData || !memberData.name || !memberData.name.trim()) {
            showTemporaryMessage("Kérjük, adjon meg egy nevet a családtaghoz.");
            return;
        }

        try {
            const currentTimestamp = new Date().toISOString();
            const memberDataWithTimestamp = {
                ...memberData,
                name: memberData.name.trim(),
                lastModified: currentTimestamp,
                lastModifiedBy: userId || 'offline'
            };

            if (state.editingFamilyMember) {
                // Családtag szerkesztése - konfliktus ellenőrzés
                const memberDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members/${state.editingFamilyMember.id}`);
                const memberDoc = await getDoc(memberDocRef);
                
                if (memberDoc.exists()) {
                    const existingMember = memberDoc.data();
                    const existingTimestamp = existingMember.lastModified;
                    
                    // Ha a meglévő családtag újabb, mint amit szerkesztünk, konfliktus
                    if (existingTimestamp && state.editingFamilyMember.lastModified && 
                        new Date(existingTimestamp).getTime() > new Date(state.editingFamilyMember.lastModified).getTime()) {
                        showTemporaryMessage("Figyelem: A családtagot valaki más már módosította. A legújabb verzió lesz mentve.");
                    }
                }
                
                await updateDoc(memberDocRef, memberDataWithTimestamp);
                showTemporaryMessage("Családtag sikeresen frissítve!");
            } else {
                const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
                await addDoc(familyMembersColRef, memberDataWithTimestamp);
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

            // PIN ellenőrzés eltávolítva - gyerek bejelentkezés PIN nélkül

            // Gyerek session létrehozása
            const childSession = {
                childId: child.id,
                childName: child.name,
                childBirthDate: child.birthDate,
                childAvatar: child.avatar,
                childRole: child.role,
                familyId: userFamilyId,
                loginTime: new Date().toISOString(),
                isChild: true
            };

            // Gyerek session mentése localStorage-ba (offline támogatás)
            localStorage.setItem('childSession', JSON.stringify(childSession));
            
            // Gyerek session mentése Firebase-be is (ha van internet)
            if (userId) {
                try {
                    const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
                    await setDoc(userDocRef, { childSession }, { merge: true });
                    console.log("CalendarEventHandlers: Child session saved to Firebase");
                } catch (firebaseError) {
                    console.warn("CalendarEventHandlers: Could not save child session to Firebase:", firebaseError);
                    // Nem kritikus hiba, localStorage-ben megvan
                }
            }
            
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

    // Szülői PIN ellenőrzés - hibrid megoldás konfliktus kezeléssel
    const handleParentPinVerification = async (enteredPin) => {
        setState.setParentPinLoading(true);
        try {
            // Először localStorage-ból olvassuk (offline támogatás)
            let savedPin = localStorage.getItem('parentPin');
            let localTimestamp = localStorage.getItem('parentPinTimestamp');
            
            // Ha van internet és felhasználó, szinkronizáljuk Firebase-szel konfliktus kezeléssel
            if (state.userId) {
                try {
                    const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${state.userId}`);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const firebasePin = userData.parentPin;
                        const firebaseTimestamp = userData.parentPinTimestamp;
                        
                        if (firebasePin && savedPin) {
                            // Konfliktus: mindkét helyen van PIN
                            if (firebaseTimestamp && localTimestamp) {
                                const firebaseTime = new Date(firebaseTimestamp).getTime();
                                const localTime = new Date(localTimestamp).getTime();
                                
                                if (firebaseTime > localTime) {
                                    // Firebase-ben újabb - használjuk azt
                                    savedPin = firebasePin;
                                    localStorage.setItem('parentPin', firebasePin);
                                    localStorage.setItem('parentPinTimestamp', firebaseTimestamp);
                                    setState.setParentPin(firebasePin);
                                    console.log("CalendarEventHandlers: Using newer Firebase PIN due to conflict");
                                } else {
                                    // localStorage-ben újabb - frissítsük Firebase-t
                                    await setDoc(userDocRef, { 
                                        parentPin: savedPin,
                                        parentPinTimestamp: localTimestamp,
                                        parentPinUserId: state.userId
                                    }, { merge: true });
                                    console.log("CalendarEventHandlers: Updated Firebase with newer local PIN");
                                }
                            } else {
                                // Ha nincs timestamp, használjuk a Firebase-t
                                savedPin = firebasePin;
                                localStorage.setItem('parentPin', firebasePin);
                                setState.setParentPin(firebasePin);
                            }
                        } else if (firebasePin && !savedPin) {
                            // Csak Firebase-ben van PIN
                            savedPin = firebasePin;
                            localStorage.setItem('parentPin', firebasePin);
                            localStorage.setItem('parentPinTimestamp', firebaseTimestamp || new Date().toISOString());
                            setState.setParentPin(firebasePin);
                        } else if (!firebasePin && savedPin) {
                            // Csak localStorage-ben van PIN - szinkronizáljuk
                            await setDoc(userDocRef, { 
                                parentPin: savedPin,
                                parentPinTimestamp: localTimestamp || new Date().toISOString(),
                                parentPinUserId: state.userId
                            }, { merge: true });
                        }
                    }
                } catch (firebaseError) {
                    console.warn("CalendarEventHandlers: Firebase sync failed, using localStorage:", firebaseError);
                }
            }
            
            if (!savedPin) {
                // Nincs beállítva szülői PIN - automatikus kilépés
                showTemporaryMessage("Nincs beállítva szülői PIN! Automatikus kilépés...");
                
                // Child session törlése (localStorage + Firebase)
                localStorage.removeItem('childSession');
                setState.setChildSession(null);
                
                if (state.userId) {
                    try {
                        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${state.userId}`);
                        await setDoc(userDocRef, { childSession: null }, { merge: true });
                    } catch (error) {
                        console.warn("CalendarEventHandlers: Could not remove child session from Firebase:", error);
                    }
                }
                
                setState.setIsChildMode(false);
                setState.setCurrentChild(null);
                setState.setShowParentPinModal(false);
                
                return true;
            }
            
            if (enteredPin === savedPin) {
                // PIN helyes - kilépés gyerek módból
                localStorage.removeItem('childSession');
                setState.setChildSession(null);
                
                if (state.userId) {
                    try {
                        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${state.userId}`);
                        await setDoc(userDocRef, { childSession: null }, { merge: true });
                    } catch (error) {
                        console.warn("CalendarEventHandlers: Could not remove child session from Firebase:", error);
                    }
                }
                
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

    // Szülői PIN mentése - hibrid megoldás konfliktus kezeléssel
    const handleSaveParentPin = async (newPin) => {
        console.log("CalendarEventHandlers: handleSaveParentPin called with PIN:", newPin);
        setState.setSettingsLoading(true);
        try {
            const pinValue = newPin.trim();
            const currentTimestamp = new Date().toISOString();
            
            console.log("CalendarEventHandlers: Saving PIN with user:", userId, "timestamp:", currentTimestamp);
            
            if (pinValue) {
                // PIN adatok timestamp-szel
                const pinData = {
                    value: pinValue,
                    timestamp: currentTimestamp,
                    userId: state.userId || 'offline'
                };
                
                // PIN mentése localStorage-ba (offline támogatás)
                localStorage.setItem('parentPin', pinValue);
                localStorage.setItem('parentPinTimestamp', currentTimestamp);
                setState.setParentPin(pinValue);
                console.log("CalendarEventHandlers: PIN saved to localStorage:", pinValue);
                
                // PIN mentése Firebase-be is (ha van internet és felhasználó)
                if (state.userId) {
                    try {
                        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${state.userId}`);
                        await setDoc(userDocRef, { 
                            parentPin: pinValue,
                            parentPinTimestamp: currentTimestamp,
                            parentPinUserId: state.userId
                        }, { merge: true });
                        console.log("CalendarEventHandlers: PIN saved to Firebase with timestamp");
                    } catch (firebaseError) {
                        console.warn("CalendarEventHandlers: Could not save PIN to Firebase:", firebaseError);
                        // Nem kritikus hiba, localStorage-ben megvan
                    }
                }
                
                showTemporaryMessage("Szülői PIN sikeresen mentve!");
            } else {
                // PIN törlése localStorage-ból
                localStorage.removeItem('parentPin');
                localStorage.removeItem('parentPinTimestamp');
                setState.setParentPin('');
                console.log("CalendarEventHandlers: PIN removed from localStorage");
                
                // PIN törlése Firebase-ből is (ha van internet és felhasználó)
                if (state.userId) {
                    try {
                        const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${state.userId}`);
                        await setDoc(userDocRef, { 
                            parentPin: null,
                            parentPinTimestamp: null,
                            parentPinUserId: null
                        }, { merge: true });
                        console.log("CalendarEventHandlers: PIN removed from Firebase");
                    } catch (firebaseError) {
                        console.warn("CalendarEventHandlers: Could not remove PIN from Firebase:", firebaseError);
                        // Nem kritikus hiba, localStorage-ből törölve
                    }
                }
                
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

    // Család adatok mentése
    const handleSaveFamilyData = async (familyData) => {
        console.log("CalendarEventHandlers: handleSaveFamilyData called with:", familyData);
        try {
            if (!db || !userId || !userFamilyId) {
                showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
                return;
            }

            const currentTimestamp = new Date().toISOString();
            
            // Család adatok mentése a families dokumentumba (ahonnan a CalendarStateManager betölti)
            const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}`);
            await setDoc(familyDocRef, { 
                name: familyData.name,
                city: familyData.city,
                childrenCount: familyData.childrenCount,
                location: familyData.location,
                lastModified: currentTimestamp,
                lastModifiedBy: userId
            }, { merge: true });
            
            // State frissítése a mentett adatokkal
            setState.setFamilyData({
                name: familyData.name,
                city: familyData.city,
                childrenCount: familyData.childrenCount,
                location: familyData.location
            });
            
            console.log("CalendarEventHandlers: Family data saved to Firebase and state updated");
            showTemporaryMessage("Család adatok sikeresen mentve!");
            
        } catch (error) {
            console.error("CalendarEventHandlers: Error saving family data:", error);
            showTemporaryMessage("Hiba a család adatok mentése során.");
        }
    };

    // Felhasználói profil mentése - konfliktus kezeléssel
    const handleSaveUserProfile = async (profileData) => {
        console.log("CalendarEventHandlers: handleSaveUserProfile called with:", profileData);
        setState.setUserProfileLoading(true);
        try {
            if (!db || !userId) {
                showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
                return;
            }

            const currentTimestamp = new Date().toISOString();
            const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}`);
            
            // Konfliktus ellenőrzés
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const existingUser = userDoc.data();
                const existingTimestamp = existingUser.lastProfileModified;
                
                // Ha a meglévő profil újabb, mint amit szerkesztünk, konfliktus
                if (existingTimestamp && profileData.lastProfileModified && 
                    new Date(existingTimestamp).getTime() > new Date(profileData.lastProfileModified).getTime()) {
                    showTemporaryMessage("Figyelem: A profilodat valaki más már módosította. A legújabb verzió lesz mentve.");
                }
            }

            // Felhasználói dokumentum frissítése Firestore-ban
            await updateDoc(userDocRef, {
                displayName: profileData.displayName,
                email: profileData.email,
                lastProfileModified: currentTimestamp,
                lastProfileModifiedBy: userId,
                updatedAt: currentTimestamp
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
        handleSaveFamilyData,
        handleSaveUserProfile
    };
};
