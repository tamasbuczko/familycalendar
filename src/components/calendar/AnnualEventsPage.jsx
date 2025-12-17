import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, deleteDoc, doc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';
import CalendarHeader from './CalendarHeader.jsx';
import EventModal from './EventModal.jsx';
import MessageDisplay from './MessageDisplay.jsx';

const AnnualEventsPage = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth } = useFirebase();
    const navigate = useNavigate();
    
    const [annualEvents, setAnnualEvents] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyData, setFamilyData] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // Modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventForModal, setEventForModal] = useState(null);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    
    // Családtagok lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;
        
        const membersColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/members`);
        const unsubscribe = onSnapshot(membersColRef, (snapshot) => {
            const fetchedMembers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Duplikációk eltávolítása
            const uniqueMembers = fetchedMembers.filter((member, index, self) => {
                if (member.userId) {
                    return index === self.findIndex(m => m.userId === member.userId && m.userId);
                } else {
                    return index === self.findIndex(m => m.id === member.id);
                }
            });
            
            setFamilyMembers(uniqueMembers);
        }, (error) => {
            console.error("AnnualEventsPage: Error loading family members:", error);
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
            console.error("AnnualEventsPage: Error loading family data:", error);
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
            console.error("AnnualEventsPage: Error loading user profile:", error);
        });
        
        return () => unsubscribe();
    }, [db, userId]);
    
    // Annual Events lekérése
    useEffect(() => {
        if (!db || !userFamilyId || !userId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const annualEventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/annualEvents`);
        
        const unsubscribe = onSnapshot(annualEventsColRef, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAnnualEvents(fetchedEvents);
            setLoading(false);
        }, (error) => {
            console.error("AnnualEventsPage: Error loading annual events:", error);
            setMessage("Hiba az éves események betöltésekor. Ellenőrizd, hogy be vagy-e jelentkezve.");
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [db, userFamilyId, userId]);
    
    // Szűrt Annual Events
    const filteredAnnualEvents = useMemo(() => {
        let filtered = [...annualEvents];
        
        // Keresés
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(event => 
                event.name.toLowerCase().includes(query)
            );
        }
        
        // Típus szűrés
        if (filterType) {
            filtered = filtered.filter(event => event.type === filterType);
        }
        
        return filtered;
    }, [annualEvents, searchQuery, filterType]);
    
    // Családtagok születésnapjai (automatikusan generált)
    const memberBirthdays = useMemo(() => {
        return familyMembers
            .filter(member => member.birthDate)
            .map(member => {
                const [year, month, day] = member.birthDate.split('-').map(Number);
                return {
                    id: `member-birthday-${member.id}`,
                    name: member.name,
                    type: 'birthday',
                    date: `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, // MM-DD
                    color: member.color || '#FFB6C1',
                    icon: '🎂',
                    isMemberBirthday: true,
                    memberId: member.id
                };
            });
    }, [familyMembers]);
    
    // Összes esemény (annualEvents + memberBirthdays)
    const allEvents = useMemo(() => {
        return [...filteredAnnualEvents, ...memberBirthdays];
    }, [filteredAnnualEvents, memberBirthdays]);
    
    // Esemény törlése
    const handleDeleteEvent = async (eventId) => {
        if (!db || !userFamilyId) return;
        
        if (!window.confirm('Biztosan törölni szeretnéd ezt az éves eseményt?')) {
            return;
        }
        
        try {
            const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/annualEvents`, eventId);
            await deleteDoc(eventDocRef);
            setMessage("Éves esemény sikeresen törölve!");
        } catch (error) {
            console.error("AnnualEventsPage: Error deleting event:", error);
            setMessage("Hiba az esemény törlésekor.");
        }
    };
    
    // Esemény szerkesztése
    const handleEditEvent = (event) => {
        if (event.isMemberBirthday) {
            setMessage("A családtagok születésnapjait a profiljukban lehet szerkeszteni.");
            return;
        }
        
        setEventForModal(event);
        setIsCreatingEvent(false);
        setShowEventModal(true);
    };
    
    // Új esemény létrehozása
    const handleCreateEvent = () => {
        setEventForModal({
            name: '',
            type: 'birthday',
            date: '',
            color: '#FFB6C1',
            icon: '🎂',
            notes: '',
            notifyPrior: true
        });
        setIsCreatingEvent(true);
        setShowEventModal(true);
    };
    
    // Esemény mentése
    const handleEventSave = async (eventData) => {
        if (!db || !userFamilyId || !userId) {
            setMessage("Hiba: Az adatok mentése nem lehetséges.");
            return;
        }

        try {
            const currentTimestamp = new Date().toISOString();
            const annualEventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/annualEvents`);
            
            const annualEventData = {
                name: eventData.name,
                type: eventData.type || 'birthday',
                date: eventData.date, // MM-DD formátum
                notifyPrior: eventData.notifyPrior !== false,
                color: eventData.color || '#FFB6C1',
                icon: eventData.icon || '🎂',
                notes: eventData.notes || null,
                lastModified: currentTimestamp,
                lastModifiedBy: userId,
                ...(isCreatingEvent ? {
                    createdBy: userId,
                    createdAt: currentTimestamp
                } : {})
            };
            
            if (isCreatingEvent) {
                await addDoc(annualEventsColRef, annualEventData);
                setMessage("Éves esemény sikeresen létrehozva!");
            } else if (eventForModal?.id) {
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/annualEvents`, eventForModal.id);
                await updateDoc(eventDocRef, annualEventData);
                setMessage("Éves esemény sikeresen frissítve!");
            }
            
            setShowEventModal(false);
            setEventForModal(null);
            setIsCreatingEvent(false);
        } catch (error) {
            console.error("AnnualEventsPage: Error saving:", error);
            setMessage("Hiba az esemény mentésekor.");
        }
    };
    
    // Üzenet törlése
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);
    
    // Típus címkék
    const typeLabels = {
        'birthday': 'Születésnap',
        'nameDay': 'Névnap',
        'anniversary': 'Évforduló',
        'other': 'Egyéb'
    };
    
    return (
        <div className="min-h-screen bg-gray-100">
            <CalendarHeader 
                familyName={familyData?.name}
                onFamilySelectorClick={() => navigate('/app')}
                onChildLoginClick={() => {}}
                isChildMode={false}
                childSession={null}
                onChildLogout={() => {}}
                onSettingsClick={() => {}}
                onProfileClick={() => {}}
                onQuickAddClick={() => {}}
                onColorPriorityChange={() => {}}
                userEmail={auth.currentUser?.email}
                userDisplayName={userDisplayName}
                currentUserMember={null}
                familyMembers={familyMembers}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/app')}
                        className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2"
                    >
                        <i className="fas fa-arrow-left"></i>
                        Vissza a naptárhoz
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Kiemelt Események
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Kezeld az évente ismétlődő eseményeket: születésnapok, névnapok, évfordulók.
                    </p>
                </div>
                
                {/* Keresés és szűrés */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                Keresés
                            </label>
                            <input
                                type="text"
                                id="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Esemény neve..."
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                Típus
                            </label>
                            <select
                                id="type"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Összes típus</option>
                                {Object.entries(typeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Hozzáadás gomb */}
                <div className="mb-4">
                    <button
                        onClick={handleCreateEvent}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <i className="fas fa-plus mr-2"></i>Új éves esemény
                    </button>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Események betöltése...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Családtagok Születésnapjai */}
                        {memberBirthdays.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Családtagok Születésnapjai
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {memberBirthdays.map(event => (
                                        <div
                                            key={event.id}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{event.icon}</span>
                                                    <h3 className="font-semibold text-gray-900">{event.name}</h3>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {typeLabels[event.type]} - {event.date}
                                            </p>
                                            {event.color && (
                                                <div 
                                                    className="h-2 rounded"
                                                    style={{ backgroundColor: event.color }}
                                                ></div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2 italic">
                                                Automatikusan generálva
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* Éves Események */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Éves Események
                                </h2>
                            </div>
                            {filteredAnnualEvents.length === 0 ? (
                                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                                    <p className="text-gray-600 mb-4">
                                        {searchQuery || filterType 
                                            ? "Nincs találat a keresési feltételeknek."
                                            : "Nincs még éves esemény. Hozz létre egy újat!"}
                                    </p>
                                    {!searchQuery && !filterType && (
                                        <button
                                            onClick={handleCreateEvent}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <i className="fas fa-plus mr-2"></i>Új éves esemény létrehozása
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredAnnualEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{event.icon || '🎂'}</span>
                                                    <h3 className="font-semibold text-gray-900">{event.name}</h3>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditEvent(event)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                                        title="Szerkesztés"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                        title="Törlés"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {typeLabels[event.type] || event.type} - {event.date}
                                            </p>
                                            {event.color && (
                                                <div 
                                                    className="h-2 rounded"
                                                    style={{ backgroundColor: event.color }}
                                                ></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
            
            {/* EventModal - éves esemény szerkesztéshez */}
            {showEventModal && (
                <AnnualEventModal
                    event={eventForModal}
                    onSave={handleEventSave}
                    onClose={() => {
                        setShowEventModal(false);
                        setEventForModal(null);
                        setIsCreatingEvent(false);
                    }}
                />
            )}
            
            <MessageDisplay message={message} />
        </div>
    );
};

// Éves esemény modal komponens (egyszerűsített EventModal)
const AnnualEventModal = ({ event, onSave, onClose }) => {
    const [name, setName] = useState(event?.name || '');
    const [type, setType] = useState(event?.type || 'birthday');
    const [date, setDate] = useState(event?.date || ''); // MM-DD formátum
    const [color, setColor] = useState(event?.color || '#FFB6C1');
    const [icon, setIcon] = useState(event?.icon || '🎂');
    const [notes, setNotes] = useState(event?.notes || '');
    const [notifyPrior, setNotifyPrior] = useState(event?.notifyPrior !== false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim() || !date.trim()) {
            alert('Kérlek töltsd ki a kötelező mezőket!');
            return;
        }
        
        // Dátum validálás (MM-DD)
        const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
        if (!dateRegex.test(date)) {
            alert('A dátum formátuma: MM-DD (pl. 04-12)');
            return;
        }
        
        onSave({
            name: name.trim(),
            type,
            date,
            color,
            icon,
            notes: notes.trim() || null,
            notifyPrior
        });
    };
    
    const typeLabels = {
        'birthday': 'Születésnap',
        'nameDay': 'Névnap',
        'anniversary': 'Évforduló',
        'other': 'Egyéb'
    };
    
    const commonIcons = ['🎂', '🎁', '💍', '📅', '⭐', '🎉', '🎈', '🌹'];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {event?.id ? 'Éves Esemény Szerkesztése' : 'Új Éves Esemény'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Név *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Pl. Nagymama, Péter barát"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Típus *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                {Object.entries(typeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dátum (MM-DD) *
                            </label>
                            <input
                                type="text"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="04-12"
                                pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Formátum: MM-DD (pl. 04-12 április 12.)</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Szín
                            </label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-10 border border-gray-300 rounded-lg"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ikon
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {commonIcons.map(ic => (
                                    <button
                                        key={ic}
                                        type="button"
                                        onClick={() => setIcon(ic)}
                                        className={`p-2 text-2xl rounded ${icon === ic ? 'bg-blue-100 border-2 border-blue-500' : 'border border-gray-300'}`}
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg mt-2"
                                placeholder="Vagy írj be egy emoji-t"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Megjegyzések
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                rows={3}
                                placeholder="Opcionális megjegyzések..."
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="notifyPrior"
                                checked={notifyPrior}
                                onChange={(e) => setNotifyPrior(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="notifyPrior" className="text-sm text-gray-700">
                                Emlékeztető generálása (Prémium funkció)
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Mentés
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnnualEventsPage;

