import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';
import CalendarHeader from './CalendarHeader.jsx';
import EventModal from './EventModal.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import MessageDisplay from './MessageDisplay.jsx';

const RecurringEventsPage = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth } = useFirebase();
    const navigate = useNavigate();
    
    const [recurringEvents, setRecurringEvents] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyData, setFamilyData] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // Modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    
    // Filter states
    const [filterMemberId, setFilterMemberId] = useState('');
    const [filterRecurrenceType, setFilterRecurrenceType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Sort state
    const [sortBy, setSortBy] = useState('name'); // 'name', 'time', 'member'
    
    // Családtagok lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;
        
        const membersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
        const unsubscribe = onSnapshot(membersColRef, (snapshot) => {
            const fetchedMembers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Duplikációk eltávolítása: először userId alapján, ha nincs userId, akkor név alapján
            const uniqueMembers = fetchedMembers.filter((member, index, self) => {
                if (member.userId) {
                    // Ha van userId, akkor az alapján szűrünk
                    return index === self.findIndex(m => m.userId === member.userId && m.userId);
                } else {
                    // Ha nincs userId, akkor ID alapján szűrünk
                    return index === self.findIndex(m => m.id === member.id);
                }
            });
            
            setFamilyMembers(uniqueMembers);
        }, (error) => {
            console.error("RecurringEventsPage: Error loading family members:", error);
        });
        
        return () => unsubscribe();
    }, [db, userFamilyId]);
    
    // Család adatok lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;
        
        const familyDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}`);
        const unsubscribe = onSnapshot(familyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setFamilyData(data);
            } else {
                setFamilyData(null);
            }
        }, (error) => {
            console.error("RecurringEventsPage: Error loading family data:", error);
        });
        
        return () => unsubscribe();
    }, [db, userFamilyId]);
    
    // Felhasználó profil adatok lekérése
    useEffect(() => {
        if (!db || !userId) return;
        
        const userDocRef = doc(db, 'artifacts', firebaseConfig.projectId, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                if (userData.displayName) {
                    setUserDisplayName(userData.displayName);
                }
            }
        }, (error) => {
            console.error("RecurringEventsPage: Error loading user profile:", error);
        });
        
        return () => unsubscribe();
    }, [db, userId]);
    
    // Ismétlődő események lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;
        
        setLoading(true);
        const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
        
        // Csak azokat az eseményeket kérjük le, amelyek ismétlődőek (recurrenceType !== 'none')
        const q = query(eventsColRef, where('recurrenceType', '!=', 'none'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
            setRecurringEvents(fetchedEvents);
            setLoading(false);
        }, (error) => {
            console.error("RecurringEventsPage: Error loading recurring events:", error);
            setMessage("Hiba az ismétlődő események betöltésekor.");
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [db, userFamilyId]);
    
    // Szűrt és rendezett események
    const filteredAndSortedEvents = React.useMemo(() => {
        let filtered = [...recurringEvents];
        
        // Keresés esemény nevében és leírásban
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(event => {
                const nameMatch = (event.name || '').toLowerCase().includes(query);
                const notesMatch = (event.notes || '').toLowerCase().includes(query);
                return nameMatch || notesMatch;
            });
        }
        
        // Szűrés családtag szerint
        if (filterMemberId) {
            filtered = filtered.filter(event => event.assignedTo === filterMemberId);
        }
        
        // Szűrés ismétlődési típus szerint
        if (filterRecurrenceType) {
            filtered = filtered.filter(event => event.recurrenceType === filterRecurrenceType);
        }
        
        // Rendezés
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'time':
                    return (a.time || '').localeCompare(b.time || '');
                case 'member':
                    const memberA = familyMembers.find(m => m.id === a.assignedTo);
                    const memberB = familyMembers.find(m => m.id === b.assignedTo);
                    const nameA = memberA?.name || '';
                    const nameB = memberB?.name || '';
                    return nameA.localeCompare(nameB);
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [recurringEvents, searchQuery, filterMemberId, filterRecurrenceType, sortBy, familyMembers]);
    
    // Esemény szerkesztése
    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowEventModal(true);
    };
    
    // Esemény törlése
    const handleDeleteEvent = (event) => {
        setConfirmAction(() => async () => {
            try {
                const eventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, event.id);
                await deleteDoc(eventRef);
                setMessage(`"${event.name}" ismétlődő esemény sorozata sikeresen törölve!`);
            } catch (error) {
                console.error("RecurringEventsPage: Error deleting event:", error);
                setMessage("Hiba az esemény törlésekor.");
            }
        });
        setConfirmMessage(`Biztosan törölni szeretné a(z) "${event.name}" ismétlődő esemény teljes sorozatát? Ez a művelet nem visszavonható!`);
        setShowConfirmModal(true);
    };
    
    // Esemény mentése (szerkesztés után)
    const handleSaveEvent = async (eventData) => {
        try {
            const currentTimestamp = new Date().toISOString();
            
            // Eltávolítjuk az id-t és a helper mezőket az eventData-ból
            const { id, originalEventId, isRecurringOccurrence, displayDate, saveAsException, ...eventDataWithoutId } = eventData;
            
            const eventDataWithTimestamp = {
                ...eventDataWithoutId,
                lastModified: currentTimestamp,
                lastModifiedBy: userId || 'offline',
                // Ha új esemény (nincs eventId), akkor hozzáadjuk a createdBy mezőt
                ...(id ? {} : { createdBy: userId || 'offline' })
            };
            
            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
            
            if (id) {
                // Szerkesztés: frissítjük az eredeti ismétlődő eseményt
                const eventRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, id);
                await updateDoc(eventRef, eventDataWithTimestamp);
                setMessage(`"${eventData.name}" ismétlődő esemény sorozata sikeresen frissítve! (Minden jövőbeli előfordulás módosul)`);
            } else {
                // Új esemény: létrehozzuk
                const eventRef = doc(eventsColRef);
                await setDoc(eventRef, {
                    ...eventDataWithTimestamp,
                    createdBy: userId || 'offline'
                });
                setMessage(`"${eventData.name}" ismétlődő esemény sorozata sikeresen létrehozva!`);
            }
            
            setShowEventModal(false);
            setEditingEvent(null);
        } catch (error) {
            console.error("RecurringEventsPage: Error saving event:", error);
            setMessage("Hiba az esemény mentésekor.");
        }
    };
    
    // Ismétlődési minta formázása
    const formatRecurrencePattern = (event) => {
        if (event.recurrenceType === 'weekly') {
            const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
            const days = (event.recurrenceDays || []).map(day => dayNames[day]).join(', ');
            return `Heti - ${days}`;
        }
        return event.recurrenceType || 'Ismeretlen';
    };
    
    // Családtag neve
    const getMemberName = (memberId) => {
        const member = familyMembers.find(m => m.id === memberId);
        return member?.name || 'Nincs hozzárendelve';
    };
    
    // Családtag avatara
    const getMemberAvatar = (memberId) => {
        const member = familyMembers.find(m => m.id === memberId);
        return member?.avatar || null;
    };
    
    // Családtag színe
    const getMemberColor = (memberId) => {
        const member = familyMembers.find(m => m.id === memberId);
        return member?.color || null;
    };
    
    // Vissza a naptárhoz
    const handleBackToCalendar = () => {
        navigate('/app');
    };
    
    // Új ismétlődő esemény létrehozása
    const handleAddEvent = () => {
        // Alapértelmezett ismétlődő esemény beállításokkal
        const defaultRecurringEvent = {
            recurrenceType: 'weekly', // Alapértelmezett: heti
            startDate: new Date().toISOString().split('T')[0],
            recurrenceDays: []
        };
        setEditingEvent(defaultRecurringEvent);
        setShowEventModal(true);
    };
    
    // Üzenet megjelenítése
    const showTemporaryMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };
    
    return (
        <div className="min-h-screen bg-gray-100">
            <CalendarHeader 
                familyName={familyData?.name}
                onFamilySelectorClick={() => navigate('/app')}
                onChildLoginClick={() => navigate('/app')}
                isChildMode={false}
                onSettingsClick={() => navigate('/app')}
                onProfileClick={() => navigate('/app')}
                userEmail={auth.currentUser?.email}
                userDisplayName={userDisplayName || auth.currentUser?.displayName}
                currentUserMember={familyMembers.find(m => m.userId === userId)}
                familyMembers={familyMembers}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Vissza gomb és cím */}
                <div className="mb-6">
                    <button
                        onClick={handleBackToCalendar}
                        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Vissza a naptárhoz
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Családi Heti Rutin és Ismétlődő Események
                    </h1>
                    <p className="text-gray-600">
                        Itt kezelheted az összes ismétlődő eseményt egy helyen. A módosítások az összes jövőbeli előfordulásra érvényesek.
                    </p>
                </div>
                
                {/* Kereső és szűrők */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-end">
                        {/* Kereső mező - bal oldal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <i className="fas fa-search mr-2"></i>Keresés
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Keresés esemény nevében vagy leírásban..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Szűrők - jobb oldal */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Családtag szűrő */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Családtag
                                </label>
                                <select
                                    value={filterMemberId}
                                    onChange={(e) => setFilterMemberId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Összes</option>
                                    {familyMembers
                                        .filter((member, index, self) => {
                                            // Duplikációk eltávolítása: userId alapján, ha nincs userId, akkor ID alapján
                                            if (member.userId) {
                                                return index === self.findIndex(m => m.userId === member.userId && m.userId);
                                            } else {
                                                return index === self.findIndex(m => m.id === member.id);
                                            }
                                        })
                                        .map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            
                            {/* Ismétlődési típus szűrő */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ismétlődés
                                </label>
                                <select
                                    value={filterRecurrenceType}
                                    onChange={(e) => setFilterRecurrenceType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Összes</option>
                                    {Array.from(new Set(recurringEvents.map(e => e.recurrenceType).filter(Boolean)))
                                        .sort()
                                        .map(type => {
                                            const typeLabels = {
                                                'daily': 'Naponta',
                                                'weekly': 'Heti',
                                                'biweekly': 'Kéthetente',
                                                'monthly': 'Havi',
                                                'yearly': 'Évente'
                                            };
                                            return (
                                                <option key={type} value={type}>
                                                    {typeLabels[type] || type}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                            
                            {/* Rendezés */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rendezés
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="name">Név</option>
                                    <option value="time">Időpont</option>
                                    <option value="member">Családtag</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Hozzáadás gomb - csak kisebb képernyőkön (1500px alatt) */}
                    <div className="2xl:hidden">
                        <button
                            onClick={handleAddEvent}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition duration-300 ease-in-out"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Új Ismétlődő Esemény
                        </button>
                    </div>
                </div>
                
                {/* Események listája */}
                {loading ? (
                    <div className="text-center py-12">
                        <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                        <p className="mt-4 text-gray-600">Betöltés...</p>
                    </div>
                ) : filteredAndSortedEvents.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-600 text-lg">
                            {recurringEvents.length === 0 
                                ? "Még nincs ismétlődő esemény. Hozz létre egyet a fenti gombbal!"
                                : "Nincs találat a kiválasztott szűrőkre."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAndSortedEvents.map(event => {
                            const memberColor = getMemberColor(event.assignedTo);
                            const memberAvatar = getMemberAvatar(event.assignedTo);
                            
                            return (
                                <div
                                    key={event.id}
                                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Bal oldal: Esemény információk */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {event.name}
                                                </h3>
                                                {event.location && (
                                                    <span className="text-sm text-gray-500">
                                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                                {/* Családtag */}
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Kinek:</span>
                                                    {event.assignedTo ? (
                                                        <div className="flex items-center gap-2">
                                                            {memberAvatar && (
                                                                <span 
                                                                    className="text-lg"
                                                                    style={{ color: memberColor || '#6B7280' }}
                                                                >
                                                                    {memberAvatar}
                                                                </span>
                                                            )}
                                                            <span style={{ color: memberColor || '#6B7280' }}>
                                                                {getMemberName(event.assignedTo)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Nincs hozzárendelve</span>
                                                    )}
                                                </div>
                                                
                                                {/* Időpont */}
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Időpont:</span>
                                                    <span>
                                                        {event.time || 'Nincs megadva'}
                                                        {event.endTime && ` - ${event.endTime}`}
                                                    </span>
                                                </div>
                                                
                                                {/* Ismétlődés */}
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Ismétlődik:</span>
                                                    <span>{formatRecurrencePattern(event)}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Dátum tartomány */}
                                            {(event.startDate || event.endDate) && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {event.startDate && (
                                                        <span>Kezdés: {new Date(event.startDate).toLocaleDateString('hu-HU')}</span>
                                                    )}
                                                    {event.startDate && event.endDate && ' • '}
                                                    {event.endDate && (
                                                        <span>Vég: {new Date(event.endDate).toLocaleDateString('hu-HU')}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Jobb oldal: Akció gombok */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditEvent(event)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                            >
                                                <i className="fas fa-edit mr-2"></i>
                                                Szerkesztés
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(event)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                            >
                                                <i className="fas fa-trash mr-2"></i>
                                                Törlés
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Event Modal */}
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
                    userId={userId}
                    userDisplayName={auth.currentUser?.displayName}
                    currentUserMember={familyMembers.find(m => m.userId === userId)}
                />
            )}
            
            {/* Confirm Modal */}
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
            
            {/* Message Display */}
            <MessageDisplay message={message} />
            
            {/* Floating Action Button - Új esemény hozzáadása - csak nagyobb képernyőkön (1500px felett) */}
            <button
                onClick={handleAddEvent}
                className="hidden 2xl:flex fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-lg items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-xl z-50"
                aria-label="Új ismétlődő esemény hozzáadása"
                title="Új ismétlődő esemény hozzáadása"
            >
                <i className="fas fa-plus text-xl"></i>
            </button>
        </div>
    );
};

export default RecurringEventsPage;

