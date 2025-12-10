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

    // Esemény mentése - konfliktus kezeléssel, kivétel kezeléssel, konverzióval
    const handleSaveEvent = async (eventData) => {
        if (!db || !userFamilyId) {
            showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges.");
            return;
        }

        try {
            const currentTimestamp = new Date().toISOString();
            
            // Ellenőrizzük, hogy szerkesztünk-e egy eseményt (state.editingEvent vagy eventData.id alapján)
            const eventId = eventData.id || (state.editingEvent?.id);
            const isRecurringOccurrence = eventData.isRecurringOccurrence || state.editingEvent?.isRecurringOccurrence;
            const originalEventId = eventData.originalEventId || state.editingEvent?.originalEventId;
            const saveAsException = eventData.saveAsException || false;
            
            // Eltávolítjuk az id-t és a helper mezőket az eventData-ból
            const { id, originalEventId: _, isRecurringOccurrence: __, displayDate: ___, saveAsException: ____, ...eventDataWithoutId } = eventData;
            
            const eventDataWithTimestamp = {
                ...eventDataWithoutId,
                // Ha lemondott esemény, akkor a cancellationReason-t is mentjük, ha aktív, akkor null
                cancellationReason: eventData.status === 'cancelled' ? (eventData.cancellationReason || null) : null,
                lastModified: currentTimestamp,
                lastModifiedBy: userId || 'offline'
            };
            
            console.log("CalendarEventHandlers: Saving event", {
                eventId,
                isRecurringOccurrence,
                originalEventId,
                saveAsException,
                recurrenceType: eventData.recurrenceType
            });

            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
            
            // Kivétel kezelés: ha ismétlődő esemény előfordulását szerkesztjük és kivételként mentjük
            if (isRecurringOccurrence && originalEventId && saveAsException) {
                const originalEventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, originalEventId);
                const originalEventDoc = await getDoc(originalEventRef);
                
                if (originalEventDoc.exists()) {
                    const originalEvent = originalEventDoc.data();
                    const exceptions = originalEvent.exceptions || [];
                    
                    // A dátum meghatározása: eventData.date, displayDate, vagy state.editingEvent-ből
                    let eventDate = eventData.date;
                    if (!eventDate && state.editingEvent?.displayDate) {
                        eventDate = state.editingEvent.displayDate.toISOString().split('T')[0];
                    }
                    if (!eventDate && state.editingEvent?.date) {
                        eventDate = state.editingEvent.date;
                    }
                    
                    if (!eventDate) {
                        showTemporaryMessage("Hiba: Nem sikerült meghatározni az esemény dátumát.");
                        return;
                    }
                    
                    // Ellenőrizzük, hogy már van-e kivétel erre a dátumra
                    const existingExceptionIndex = exceptions.findIndex(ex => ex.date === eventDate);
                    
                    const exceptionData = {
                        date: eventDate,
                        name: eventData.name || state.editingEvent?.name,
                        time: eventData.time || state.editingEvent?.time,
                        endTime: eventData.endTime || state.editingEvent?.endTime,
                        location: eventData.location || state.editingEvent?.location,
                        assignedTo: eventData.assignedTo || state.editingEvent?.assignedTo,
                        notes: eventData.notes || state.editingEvent?.notes,
                        status: eventData.status || state.editingEvent?.status || 'cancelled', // Megtartjuk a lemondott státuszt, ha van
                        cancellationReason: eventData.cancellationReason || state.editingEvent?.cancellationReason || null,
                        lastModified: currentTimestamp,
                        lastModifiedBy: userId || 'offline'
                    };
                    
                    if (existingExceptionIndex >= 0) {
                        // Ha már van kivétel, frissítjük
                        exceptions[existingExceptionIndex] = exceptionData;
                    } else {
                        // Ha nincs kivétel, hozzáadjuk
                        exceptions.push(exceptionData);
                    }
                    
                    await updateDoc(originalEventRef, {
                        exceptions,
                        lastModified: currentTimestamp,
                        lastModifiedBy: userId || 'offline'
                    });
                    
                    showTemporaryMessage("Esemény kivételként sikeresen mentve!");
                    resetEventModal();
                    return;
                } else {
                    showTemporaryMessage("Hiba: Az eredeti ismétlődő esemény nem található.");
                    return;
                }
            }
            
            // Ha ismétlődő esemény előfordulása (de nem kivételként), akkor az eredeti eseményt frissítjük
            if (isRecurringOccurrence && originalEventId && !saveAsException) {
                const originalEventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, originalEventId);
                const originalEventDoc = await getDoc(originalEventRef);
                
                if (originalEventDoc.exists()) {
                    // Az eredeti ismétlődő eseményt frissítjük (minden előfordulás módosul)
                    await updateDoc(originalEventRef, eventDataWithTimestamp);
                    showTemporaryMessage("Ismétlődő esemény sikeresen frissítve! (Minden előfordulás módosul)");
                    resetEventModal();
                    return;
                } else {
                    showTemporaryMessage("Hiba: Az eredeti ismétlődő esemény nem található.");
                    return;
                }
            }
            
            if (eventId) {
                // Ellenőrizzük, hogy az eventId nem egy generált ID-e (ismétlődő esemény előfordulásának ID-ja)
                // Generált ID formátum: {originalEventId}-{date} (pl. "USBaja5jMeXb8ISbrhfu-2025-12-10")
                // Ellenőrizzük, hogy az ID tartalmaz-e dátum formátumot a végén (YYYY-MM-DD)
                const datePattern = /\d{4}-\d{2}-\d{2}$/;
                const isGeneratedId = datePattern.test(eventId) && eventId.includes('-');
                
                console.log("CalendarEventHandlers: Checking eventId", {
                    eventId,
                    isGeneratedId,
                    originalEventId,
                    isRecurringOccurrence
                });
                
                if (isGeneratedId && originalEventId) {
                    // Ha generált ID és van originalEventId, akkor az eredeti eseményt frissítjük
                    const originalEventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, originalEventId);
                    const originalEventDoc = await getDoc(originalEventRef);
                    
                    if (originalEventDoc.exists()) {
                        // Az eredeti ismétlődő eseményt frissítjük
                        await updateDoc(originalEventRef, eventDataWithTimestamp);
                        showTemporaryMessage("Ismétlődő esemény sikeresen frissítve! (Minden előfordulás módosul)");
                        resetEventModal();
                        return;
                    } else {
                        console.warn("CalendarEventHandlers: Original event not found", { originalEventId });
                        showTemporaryMessage("Hiba: Az eredeti ismétlődő esemény nem található.");
                        return;
                    }
                }
                
                // Esemény szerkesztése - konfliktus ellenőrzés
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventId);
                const eventDoc = await getDoc(eventDocRef);
                
                if (eventDoc.exists()) {
                    const existingEvent = eventDoc.data();
                    const existingTimestamp = existingEvent.lastModified;
                    
                    // Ha a meglévő esemény újabb, mint amit szerkesztünk, konfliktus
                    if (existingTimestamp && state.editingEvent?.lastModified && 
                        new Date(existingTimestamp).getTime() > new Date(state.editingEvent.lastModified).getTime()) {
                        showTemporaryMessage("Figyelem: Az eseményt valaki más már módosította. A legújabb verzió lesz mentve.");
                    }
                    
                    // Ha létezik, updateDoc-ot használunk
                    await updateDoc(eventDocRef, eventDataWithTimestamp);
                    showTemporaryMessage("Esemény sikeresen frissítve!");
                } else {
                    // Ha nem létezik és generált ID, akkor ne próbáljuk frissíteni
                    if (isGeneratedId) {
                        console.warn("CalendarEventHandlers: Generated ID document does not exist, skipping update", {
                            eventId,
                            originalEventId
                        });
                        showTemporaryMessage("Hiba: Az esemény nem található. Kérjük, próbálja újra.");
                        return;
                    }
                    
                    // Ha nem létezik és nincs originalEventId, setDoc-ot használunk merge: true-val
                    await setDoc(eventDocRef, eventDataWithTimestamp, { merge: true });
                    showTemporaryMessage("Esemény sikeresen frissítve!");
                }
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

    // Esemény törlése - egységes logika egyszeri és ismétlődő eseményekre
    // Ha törlünk egy ismétlődő eseményt (bármelyik előfordulását), az EGÉSZ ismétlődő eseményt töröljük
    const handleDeleteEvent = async (event) => {
        if (!db || !userFamilyId) return;

        try {
            // Meghatározzuk az eredeti esemény ID-ját
            // Ha ismétlődő esemény előfordulása, akkor az originalEventId-t használjuk
            // Ha nem, akkor az event.id-t
            const originalEventId = event.isRecurringOccurrence && event.originalEventId 
                ? event.originalEventId 
                : event.id;
            
            console.log("CalendarEventHandlers: Deleting event", {
                eventId: event.id,
                isRecurringOccurrence: event.isRecurringOccurrence,
                originalEventId: event.originalEventId,
                targetEventId: originalEventId
            });
            
            // Az eredeti eseményt töröljük (egységes logika egyszeri és ismétlődő eseményekre)
            const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, originalEventId);
            const eventDoc = await getDoc(eventDocRef);
            
            if (eventDoc.exists()) {
                // Egységes logika: minden eseményt deleted státuszra állítunk (soft delete)
                // Ez törli az egész ismétlődő eseményt, minden előfordulással együtt
                await updateDoc(eventDocRef, {
                    status: 'deleted',
                    lastModified: new Date().toISOString(),
                    lastModifiedBy: userId || 'offline'
                });
                
                console.log("CalendarEventHandlers: Event deleted successfully", {
                    eventId: originalEventId,
                    wasRecurring: event.isRecurringOccurrence
                });
                
                showTemporaryMessage("Esemény sikeresen törölve!");
            } else {
                // Ha nem létezik, deleted státuszra állítjuk
                await setDoc(eventDocRef, {
                    ...event,
                    status: 'deleted',
                    lastModified: new Date().toISOString(),
                    lastModifiedBy: userId || 'offline'
                }, { merge: true });
                
                console.log("CalendarEventHandlers: Event marked as deleted (did not exist)", {
                    eventId: originalEventId
                });
                
                showTemporaryMessage("Esemény sikeresen törölve!");
            }
        } catch (error) {
            console.error("CalendarEventHandlers: Hiba az esemény törlésekor:", error);
            showTemporaryMessage("Hiba az esemény törlésekor.");
        }
    };

    // Esemény státuszának módosítása - egységes logika egyszeri és ismétlődő eseményekre
    const handleChangeEventStatus = async (event, newStatus, cancellationReason = '') => {
        console.log("CalendarEventHandlers: handleChangeEventStatus called", {
            eventId: event.id,
            eventName: event.name,
            newStatus,
            cancellationReason: cancellationReason || '(empty)',
            cancellationReasonType: typeof cancellationReason,
            cancellationReasonLength: cancellationReason ? cancellationReason.length : 0,
            isRecurringOccurrence: event.isRecurringOccurrence
        });
        
        if (!db || !userFamilyId) return;

        try {
            // Ha ismétlődő esemény előfordulása, kivételt hozunk létre
            if (event.isRecurringOccurrence && event.originalEventId) {
                const originalEventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, event.originalEventId);
                const originalEventDoc = await getDoc(originalEventRef);
                
                if (originalEventDoc.exists()) {
                    const originalEvent = originalEventDoc.data();
                    const exceptions = originalEvent.exceptions || [];
                    
                    // A dátum meghatározása - fontos, hogy konzisztens formátumban legyen (YYYY-MM-DD)
                    let eventDate = event.date;
                    if (!eventDate && event.displayDate) {
                        // Ha displayDate Date objektum, konvertáljuk string formátumba
                        if (event.displayDate instanceof Date) {
                            eventDate = event.displayDate.toISOString().split('T')[0];
                        } else if (typeof event.displayDate === 'string') {
                            eventDate = event.displayDate.split('T')[0];
                        }
                    }
                    
                    if (!eventDate) {
                        showTemporaryMessage("Hiba: Nem sikerült meghatározni az esemény dátumát.");
                        return;
                    }
                    
                    console.log("CalendarEventHandlers: Changing status of recurring occurrence", {
                        originalEventId: event.originalEventId,
                        eventDate,
                        newStatus,
                        currentExceptions: exceptions.length
                    });
                    
                    // Ellenőrizzük, hogy már van-e kivétel erre a dátumra
                    const existingExceptionIndex = exceptions.findIndex(ex => ex.date === eventDate);
                    
                    if (existingExceptionIndex >= 0) {
                        // Ha már van kivétel, frissítjük a státuszt
                        exceptions[existingExceptionIndex] = {
                            ...exceptions[existingExceptionIndex],
                            status: newStatus,
                            cancellationReason: newStatus === 'cancelled' ? cancellationReason : (exceptions[existingExceptionIndex].cancellationReason || ''),
                            lastModified: new Date().toISOString(),
                            lastModifiedBy: userId || 'offline'
                        };
                    } else {
                        // Ha nincs kivétel, hozzáadjuk az eredeti esemény adataival
                        exceptions.push({
                            date: eventDate,
                            name: event.name,
                            time: event.time,
                            endTime: event.endTime,
                            location: event.location,
                            assignedTo: event.assignedTo,
                            notes: event.notes,
                            status: newStatus,
                            cancellationReason: newStatus === 'cancelled' ? cancellationReason : '',
                            lastModified: new Date().toISOString(),
                            lastModifiedBy: userId || 'offline'
                        });
                    }
                    
                    await updateDoc(originalEventRef, {
                        exceptions,
                        lastModified: new Date().toISOString(),
                        lastModifiedBy: userId || 'offline'
                    });
                    
                    showTemporaryMessage(`Esemény előfordulás státusza sikeresen ${newStatus}-re módosítva!`);
                    return;
                } else {
                    showTemporaryMessage("Hiba: Az eredeti esemény nem található.");
                    return;
                }
            }
            
            // Ha nem ismétlődő esemény előfordulása, akkor az eredeti eseményt frissítjük
            const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, event.id);
            const eventDoc = await getDoc(eventDocRef);
            
            if (eventDoc.exists()) {
                // Ha létezik, updateDoc-ot használunk
                const updateData = {
                    status: newStatus,
                    lastModified: new Date().toISOString(),
                    lastModifiedBy: userId || 'offline'
                };
                // Ha lemondás, akkor a cancellationReason-t is mentjük
                if (newStatus === 'cancelled') {
                    updateData.cancellationReason = cancellationReason;
                } else if (newStatus === 'active') {
                    // Ha aktívvá teszünk, töröljük a cancellationReason-t
                    updateData.cancellationReason = null;
                }
                await updateDoc(eventDocRef, updateData);
            } else {
                // Ha nem létezik, deleted státuszra állítjuk
                await setDoc(eventDocRef, { 
                    ...event,
                    status: newStatus,
                    cancellationReason: newStatus === 'cancelled' ? cancellationReason : null,
                    lastModified: new Date().toISOString(),
                    lastModifiedBy: userId || 'offline'
                }, { merge: true });
            }
            
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
