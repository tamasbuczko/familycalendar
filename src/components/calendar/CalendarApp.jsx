import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';

import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import EventModal from './EventModal.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import CalendarView from './CalendarView.jsx';
import FamilyMemberModal from './FamilyMemberModal.jsx';

// A naptár alkalmazás logikáját tartalmazó komponens
const CalendarApp = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth, setUserFamilyId } = useFirebase();
    const [familyMembers, setFamilyMembers] = useState([]);
    const [events, setEvents] = useState([]); // Ez tárolja az eredeti eseménydefiníciókat (egyszeri és ismétlődő)
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [newFamilyMemberName, setNewFamilyMemberName] = useState('');
    const [editingFamilyMember, setEditingFamilyMember] = useState(null);
    const [message, setMessage] = useState(''); // Üzenetek megjelenítésére
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [currentView, setCurrentView] = useState('week'); // 'day', 'week', 'weekdays-only'
    const [familyData, setFamilyData] = useState(null); // Új állapot a család nevének tárolására

    // Családtagok lekérése valós időben
    useEffect(() => {
        if (!db || !userFamilyId) {
            console.log("CalendarApp: Skipping family members fetch. DB or userFamilyId missing.");
            return;
        }

        console.log("CalendarApp: Fetching family members for familyId:", userFamilyId);
        const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
        const unsubscribe = onSnapshot(familyMembersColRef, (snapshot) => {
            const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFamilyMembers(members);
            console.log("CalendarApp: Family members fetched:", members);
        }, (error) => {
            console.error("CalendarApp: Hiba a családtagok lekérésekor:", error);
            setMessage("Hiba a családtagok betöltésekor.");
        });

        return () => {
            console.log("CalendarApp: Unsubscribing from family members.");
            unsubscribe();
        };
    }, [db, userFamilyId]); // firebaseConfig.projectId eltávolítva, mivel stabil referencia

    // Események lekérése valós időben
    useEffect(() => {
        if (!db || !userFamilyId) {
            console.log("CalendarApp: Skipping events fetch. DB or userFamilyId missing.");
            return;
        }

        console.log("CalendarApp: Fetching events for familyId:", userFamilyId);
        const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
        const unsubscribe = onSnapshot(eventsColRef, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(fetchedEvents);
            console.log("CalendarApp: Events fetched:", fetchedEvents);
        }, (error) => {
            console.error("CalendarApp: Hiba az események lekérésekor:", error);
            setMessage("Hiba az események betöltésekor.");
        });

        return () => {
            console.log("CalendarApp: Unsubscribing from events.");
            unsubscribe();
        };
    }, [db, userFamilyId]); // firebaseConfig.projectId eltávolítva, mivel stabil referencia

    // Család adatainak lekérése (név, stb.)
    useEffect(() => {
        if (!db || !userFamilyId) {
            setFamilyData(null);
            return;
        }

        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}`);
        const unsubscribe = onSnapshot(familyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setFamilyData({ id: docSnap.id, ...docSnap.data() });
                console.log("CalendarApp: Family data fetched:", docSnap.data());
            } else {
                setFamilyData(null);
                console.log("CalendarApp: Family document does not exist.");
            }
        }, (error) => {
            console.error("CalendarApp: Hiba a család adatainak lekérésekor:", error);
            setMessage("Hiba a család adatainak betöltésekor.");
        });

        return () => unsubscribe();
    }, [db, userFamilyId]); // firebaseConfig.projectId eltávolítva, mivel stabil referencia

    // Üzenet megjelenítése és eltüntetése
    const showTemporaryMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    // Családtag hozzáadása/szerkesztése
    const handleSaveFamilyMember = async () => {
        if (!db || !userFamilyId || !newFamilyMemberName.trim()) {
            showTemporaryMessage("Kérjük, adjon meg egy nevet a családtaghoz.");
            console.log("CalendarApp: Save family member validation failed.");
            return;
        }
        try {
            if (editingFamilyMember) {
                // Szerkesztés
                console.log("CalendarApp: Updating family member:", editingFamilyMember.name, "to:", newFamilyMemberName.trim());
                const memberDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members/${editingFamilyMember.id}`);
                await updateDoc(memberDocRef, { name: newFamilyMemberName.trim() });
                showTemporaryMessage("Családtag sikeresen frissítve!");
                console.log("CalendarApp: Family member updated successfully.");
            } else {
                // Új hozzáadása
                console.log("CalendarApp: Adding family member:", newFamilyMemberName.trim(), "to family:", userFamilyId);
                const familyMembersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
                await addDoc(familyMembersColRef, { name: newFamilyMemberName.trim() });
                showTemporaryMessage("Családtag sikeresen hozzáadva!");
                console.log("CalendarApp: Family member added successfully.");
            }
            setNewFamilyMemberName('');
            setEditingFamilyMember(null);
            setShowFamilyModal(false);
        } catch (error) {
            console.error("CalendarApp: Hiba a családtag mentésekor:", error);
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
            console.log("CalendarApp: Deleting family member:", memberName, "with ID:", memberId);
            const memberDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members/${memberId}`);
            await deleteDoc(memberDocRef);
            showTemporaryMessage("Családtag sikeresen törölve!");
            console.log("CalendarApp: Family member deleted successfully.");
        } catch (error) {
            console.error("CalendarApp: Hiba a családtag törlésekor:", error);
            showTemporaryMessage("Hiba a családtag törlésekor.");
        }
    };

    // Esemény mentése (új vagy szerkesztés)
    const handleSaveEvent = async (eventData) => {
        console.log("CalendarApp: handleSaveEvent called with eventData:", eventData);
        if (!db || !userFamilyId) {
            console.error("CalendarApp: Firestore DB or User Family ID not available for saving event.");
            showTemporaryMessage("Hiba: Az adatok mentése nem lehetséges (nincs családi azonosító vagy adatbázis kapcsolat).");
            return;
        }

        try {
            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);

            if (editingEvent) {
                // Check if it's a recurring occurrence being edited
                if (editingEvent.isRecurringOccurrence) {
                    console.log("CalendarApp: Editing a recurring event occurrence.");
                    const originalEventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, editingEvent.originalEventId);
                    const originalEventDoc = await getDoc(originalEventDocRef);

                    if (originalEventDoc.exists()) {
                        const originalEventData = originalEventDoc.data();
                        let updatedExceptions = originalEventData.exceptions || [];

                        const occurrenceDate = eventData.date; // The specific date of this occurrence

                        const existingExceptionIndex = updatedExceptions.findIndex(ex => ex.date === occurrenceDate);

                        // Only include fields that can be overridden for an occurrence
                        const newExceptionData = {
                            date: occurrenceDate,
                            name: eventData.name,
                            time: eventData.time,
                            endTime: eventData.endTime,
                            location: eventData.location,
                            assignedTo: eventData.assignedTo,
                            notes: eventData.notes,
                            status: eventData.status || 'active', // Ensure status is carried over or defaults
                        };

                        if (existingExceptionIndex !== -1) {
                            // Update existing exception
                            updatedExceptions[existingExceptionIndex] = {
                                ...updatedExceptions[existingExceptionIndex], // Keep any other exception properties
                                ...newExceptionData
                            };
                        } else {
                            // Add new exception
                            updatedExceptions.push(newExceptionData);
                        }
                        await updateDoc(originalEventDocRef, { exceptions: updatedExceptions });
                        showTemporaryMessage("Esemény előfordulása sikeresen frissítve!");
                        console.log("CalendarApp: Recurring event occurrence updated successfully.");
                    } else {
                        console.error("CalendarApp: Original recurring event document not found for update.");
                        showTemporaryMessage("Hiba: Az eredeti ismétlődő esemény nem található.");
                    }
                } else {
                    // It's a single event or the original recurring event definition
                    console.log("CalendarApp: Updating a single event or original recurring event definition:", editingEvent.id);
                    const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, editingEvent.id);
                    // For a recurring event definition or single event, update its definition fields.
                    // The eventData coming from EventModal contains all the fields needed for the definition.
                    await updateDoc(eventDocRef, eventData);
                    showTemporaryMessage("Esemény sikeresen frissítve!");
                    console.log("CalendarApp: Event updated successfully.");
                }
            } else {
                // Adding a new event (single or recurring definition)
                console.log("CalendarApp: Adding new event to family:", userFamilyId);
                await addDoc(eventsColRef, eventData);
                showTemporaryMessage("Esemény sikeresen hozzáadva!");
                console.log("CalendarApp: New event added successfully.");
            }
            setShowEventModal(false);
            setEditingEvent(null);
        } catch (error) {
            console.error("CalendarApp: Hiba az esemény mentésekor:", error);
            showTemporaryMessage("Hiba az esemény mentésekor.");
        }
    };

    // Esemény törlése (akár egyszeri, akár ismétlődő előfordulás)
    const handleDeleteEvent = async (eventToDelete) => {
        if (!db || !userFamilyId) return;
        console.log("CalendarApp: Attempting to delete event:", eventToDelete);

        try {
            if (eventToDelete.isRecurringOccurrence) {
                console.log("CalendarApp: Deleting a recurring event occurrence.");
                // Ha ismétlődő esemény előfordulása, kivételt adunk az eredeti eseményhez
                const originalEventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventToDelete.originalEventId);
                const originalEventDoc = await getDoc(originalEventDocRef);
                if (originalEventDoc.exists()) {
                    const originalEventData = originalEventDoc.data();
                    let updatedExceptions = originalEventData.exceptions || [];
                    const existingExceptionIndex = updatedExceptions.findIndex(ex => ex.date === eventToDelete.date);

                    if (existingExceptionIndex !== -1) {
                        updatedExceptions[existingExceptionIndex].status = 'deleted';
                    } else {
                        updatedExceptions.push({ date: eventToDelete.date, status: 'deleted' });
                    }
                    await updateDoc(originalEventDocRef, { exceptions: updatedExceptions });
                    showTemporaryMessage("Esemény előfordulása sikeresen törölve!");
                    console.log("CalendarApp: Recurring event occurrence marked as deleted.");
                } else {
                    console.error("CalendarApp: Original recurring event document not found for deletion.");
                }
            } else {
                console.log("CalendarApp: Deleting a single event.");
                // Ha egyszeri esemény, töröljük a dokumentumot
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventToDelete.id);
                await deleteDoc(eventDocRef);
                showTemporaryMessage("Esemény sikeresen törölve!");
                console.log("CalendarApp: Single event deleted successfully.");
            }
        } catch (error) {
            console.error("CalendarApp: Hiba az esemény törlésekor:", error);
            showTemporaryMessage("Hiba az esemény törlésekor.");
        }
    };

    // Esemény státuszának módosítása (akár egyszeri, akár ismétlődő előfordulás)
    const handleChangeEventStatus = async (eventToChange, newStatus) => {
        if (!db || !userFamilyId) return;
        console.log("CalendarApp: Changing event status for event:", eventToChange, "to:", newStatus);

        try {
            if (eventToChange.isRecurringOccurrence) {
                console.log("CalendarApp: Updating status of a recurring event occurrence.");
                // Ha ismétlődő esemény előfordulása, kivételt adunk hozzá/frissítünk
                const originalEventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventToChange.originalEventId);
                const originalEventDoc = await getDoc(originalEventDocRef);
                if (originalEventDoc.exists()) {
                    const originalEventData = originalEventDoc.data();
                    let updatedExceptions = originalEventData.exceptions || [];
                    const existingExceptionIndex = updatedExceptions.findIndex(ex => ex.date === eventToChange.date);

                    if (existingExceptionIndex !== -1) {
                        updatedExceptions[existingExceptionIndex].status = newStatus;
                    } else {
                        updatedExceptions.push({ date: eventToChange.date, status: newStatus });
                    }
                    await updateDoc(originalEventDocRef, { exceptions: updatedExceptions });
                    showTemporaryMessage(`Esemény előfordulása sikeresen ${newStatus}-re módosítva!`);
                    console.log("CalendarApp: Recurring event occurrence status updated.");
                } else {
                    console.error("CalendarApp: Original recurring event document not found for status change.");
                }
            } else {
                console.log("CalendarApp: Updating status of a single event.");
                // Ha egyszeri esemény, közvetlenül frissítjük a státuszát
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventToChange.id);
                await updateDoc(eventDocRef, { status: newStatus });
                showTemporaryMessage(`Esemény státusza sikeresen ${newStatus}-re módosítva!`);
                console.log("CalendarApp: Single event status updated.");
            }
        } catch (error) {
            console.error("CalendarApp: Hiba az esemény státuszának módosításakor:", error);
            showTemporaryMessage("Hiba az esemény státuszának módosításakor.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                                    <h1 className="text-2xl font-bold text-gray-900">
            {familyData?.name || 'Családi Naptár'}
        </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setUserFamilyId(null)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-exchange-alt mr-2"></i>Család választó
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Családtagok kezelése */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-full max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Családtagok</h2>
                        <button
                            onClick={() => {
                                setEditingFamilyMember(null);
                                setNewFamilyMemberName('');
                                setShowFamilyModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="fas fa-plus mr-2"></i>Családtag hozzáadása
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {familyMembers.length === 0 ? (
                            <p className="text-gray-500">Még nincsenek családtagok hozzáadva.</p>
                        ) : (
                            familyMembers.map(member => (
                                <div key={member.id} className="group relative">
                                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-0 group-hover:gap-2 transition-all duration-200 ease-in-out min-w-fit">
                                        <span className="whitespace-nowrap">{member.name}</span>
                                        <button
                                            onClick={() => {
                                                setEditingFamilyMember(member);
                                                setNewFamilyMemberName(member.name);
                                                setShowFamilyModal(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-blue-600 hover:text-blue-800 font-bold text-xs hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                            title="Családtag szerkesztése"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setConfirmAction(() => () => handleDeleteFamilyMember(member.id, member.name));
                                                setConfirmMessage(`Biztosan törölni szeretné a családtagot: "${member.name}"?`);
                                                setShowConfirmModal(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-600 hover:text-red-800 font-bold text-xs hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                            title="Családtag törlése"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={`w-full ${currentView === 'day' ? 'max-w-4xl mx-auto' : ''}`}>
                    <CalendarView
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        events={events}
                        familyMembers={familyMembers}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        onAddEvent={() => {
                            setEditingEvent(null);
                            setShowEventModal(true);
                        }}
                        onEditEvent={(event) => {
                            setEditingEvent(event);
                            setShowEventModal(true);
                        }}
                        onDeleteEvent={(event) => {
                            setConfirmAction(() => () => handleDeleteEvent(event));
                            setConfirmMessage(`Biztosan törölni szeretné az eseményt: "${event.name}"?`);
                            setShowConfirmModal(true);
                        }}
                        onStatusChange={(event, newStatus) => {
                            setConfirmAction(() => () => handleChangeEventStatus(event, newStatus));
                            setConfirmMessage(`Biztosan ${newStatus === 'cancelled' ? 'lemondja' : 'aktívvá teszi'} az eseményt: "${event.name}"?`);
                            setShowConfirmModal(true);
                        }}
                    />
                </div>
            </div>

            {/* Modals */}
            {showEventModal && (
                <EventModal
                    event={editingEvent}
                    onSave={handleSaveEvent}
                    onClose={() => {
                        setShowEventModal(false);
                        setEditingEvent(null);
                    }}
                    familyMembers={familyMembers}
                    showTemporaryMessage={showTemporaryMessage}
                />
            )}

            {showFamilyModal && (
                <FamilyMemberModal
                    newFamilyMemberName={newFamilyMemberName}
                    setNewFamilyMemberName={setNewFamilyMemberName}
                    onAdd={handleSaveFamilyMember}
                    onClose={() => {
                        setShowFamilyModal(false);
                        setEditingFamilyMember(null);
                        setNewFamilyMemberName('');
                    }}
                    isEditing={editingFamilyMember !== null}
                />
            )}

            {showConfirmModal && (
                <ConfirmModal
                    message={confirmMessage}
                    onConfirm={() => {
                        if (confirmAction) {
                            confirmAction();
                        }
                        setShowConfirmModal(false);
                        setConfirmAction(null);
                    }}
                    onCancel={() => {
                        setShowConfirmModal(false);
                        setConfirmAction(null);
                    }}
                />
            )}

            {/* Message */}
            {message && (
                <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {message}
                </div>
            )}
        </div>
    );
};

export default CalendarApp; 