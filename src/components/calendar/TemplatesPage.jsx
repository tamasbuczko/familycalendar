import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, deleteDoc, doc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';
import { globalTemplates } from '../../data/globalTemplates.js';
import CalendarHeader from './CalendarHeader.jsx';
import EventModal from './EventModal.jsx';
import MessageDisplay from './MessageDisplay.jsx';

const TemplatesPage = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth } = useFirebase();
    const navigate = useNavigate();
    
    const [userTemplates, setUserTemplates] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyData, setFamilyData] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // Modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [templateForEvent, setTemplateForEvent] = useState(null);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    
    // Loading states
    const [activatingTemplateId, setActivatingTemplateId] = useState(null);
    const [deactivatingTemplateId, setDeactivatingTemplateId] = useState(null);
    
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
            console.error("TemplatesPage: Error loading family members:", error);
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
            console.error("TemplatesPage: Error loading family data:", error);
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
            console.error("TemplatesPage: Error loading user profile:", error);
        });
        
        return () => unsubscribe();
    }, [db, userId]);
    
    // User Templates lekérése
    useEffect(() => {
        if (!db || !userFamilyId) return;
        
        setLoading(true);
        const templatesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/userTemplates`);
        
        const unsubscribe = onSnapshot(templatesColRef, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserTemplates(fetchedTemplates);
            setLoading(false);
        }, (error) => {
            console.error("TemplatesPage: Error loading user templates:", error);
            setMessage("Hiba a sablonok betöltésekor.");
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [db, userFamilyId]);
    
    // Kategóriák dinamikus generálása
    const categories = useMemo(() => {
        const categorySet = new Set(globalTemplates.map(t => t.category));
        return Array.from(categorySet).sort();
    }, []);
    
    // Szűrt Global Templates
    const filteredGlobalTemplates = useMemo(() => {
        let filtered = [...globalTemplates];
        
        // Keresés
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(template => 
                template.name.toLowerCase().includes(query) ||
                template.category.toLowerCase().includes(query)
            );
        }
        
        // Kategória szűrés
        if (filterCategory) {
            filtered = filtered.filter(template => template.category === filterCategory);
        }
        
        return filtered;
    }, [searchQuery, filterCategory]);
    
    // Szűrt User Templates
    const filteredUserTemplates = useMemo(() => {
        let filtered = [...userTemplates];
        
        // Keresés
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(template => 
                template.name.toLowerCase().includes(query) ||
                (template.category && template.category.toLowerCase().includes(query))
            );
        }
        
        // Kategória szűrés
        if (filterCategory) {
            filtered = filtered.filter(template => template.category === filterCategory);
        }
        
        return filtered;
    }, [userTemplates, searchQuery, filterCategory]);
    
    // Aktiválás: Global sablon másolása User Templates-be
    const handleActivateTemplate = async (globalTemplate) => {
        if (!db || !userFamilyId || !userId) return;
        
        setActivatingTemplateId(globalTemplate.id);
        try {
            const templatesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/userTemplates`);
            
            // Ellenőrizzük, hogy már nincs-e aktiválva
            const existingTemplate = userTemplates.find(t => t.globalTemplateId === globalTemplate.id);
            if (existingTemplate) {
                setMessage("Ez a sablon már aktiválva van.");
                setActivatingTemplateId(null);
                return;
            }
            
            // Másoljuk a sablon adatait
            const templateData = {
                name: globalTemplate.name,
                icon: globalTemplate.icon,
                color: globalTemplate.color,
                category: globalTemplate.category,
                globalTemplateId: globalTemplate.id, // Referencia a global sablonhoz
                createdBy: userId,
                createdAt: new Date()
            };
            
            await addDoc(templatesColRef, templateData);
            setMessage(`${globalTemplate.name} hozzáadva a Saját Sablonokhoz.`);
        } catch (error) {
            console.error("TemplatesPage: Error activating template:", error);
            setMessage("Hiba a sablon aktiválásakor.");
        } finally {
            setActivatingTemplateId(null);
        }
    };
    
    // Deaktiválás: User template törlése
    const handleDeactivateTemplate = async (userTemplate) => {
        if (!db || !userFamilyId) return;
        
        setDeactivatingTemplateId(userTemplate.id);
        try {
            const templateDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/userTemplates`, userTemplate.id);
            await deleteDoc(templateDocRef);
            setMessage(`${userTemplate.name} eltávolítva a Saját Sablonokból.`);
        } catch (error) {
            console.error("TemplatesPage: Error deactivating template:", error);
            setMessage("Hiba a sablon eltávolításakor.");
        } finally {
            setDeactivatingTemplateId(null);
        }
    };
    
    // Sablon kiválasztása → EventModal megnyitása
    const handleTemplateSelect = (template) => {
        // EventModal-hoz átadandó adatok
        const eventData = {
            name: template.name,
            icon: template.icon || '',
            color: template.color || '',
            assignedTo: template.defaultAssignedTo || '',
            endTime: template.defaultDuration ? calculateEndTime(template.defaultDuration) : '',
            recurrenceType: 'none'
        };
        
        setTemplateForEvent(eventData);
        setShowEventModal(true);
    };
    
    // EndTime számítása defaultDuration-ból (perc → HH:MM)
    const calculateEndTime = (durationMinutes) => {
        // Alapértelmezett kezdő idő: 09:00
        const startHour = 9;
        const startMinute = 0;
        const totalMinutes = startHour * 60 + startMinute + durationMinutes;
        const endHour = Math.floor(totalMinutes / 60) % 24;
        const endMinute = totalMinutes % 60;
        return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    };
    
    // EventModal mentés - közvetlenül a Firestore-ba
    const handleEventSave = async (eventData) => {
        if (!db || !userFamilyId) {
            setMessage("Hiba: Az adatok mentése nem lehetséges.");
            return;
        }

        try {
            const currentTimestamp = new Date().toISOString();
            const eventId = eventData.id;
            
            // Eltávolítjuk az id-t és a helper mezőket
            const { id, originalEventId, isRecurringOccurrence, displayDate, saveAsException, ...eventDataWithoutId } = eventData;
            
            const eventDataWithTimestamp = {
                ...eventDataWithoutId,
                cancellationReason: eventData.status === 'cancelled' ? (eventData.cancellationReason || null) : null,
                lastModified: currentTimestamp,
                lastModifiedBy: userId || 'offline',
                ...(eventId ? {} : { createdBy: userId || 'offline' })
            };

            const eventsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`);
            
            if (eventId) {
                // Frissítés
                const eventDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/events`, eventId);
                const eventDoc = await getDoc(eventDocRef);
                
                if (eventDoc.exists()) {
                    await updateDoc(eventDocRef, eventDataWithTimestamp);
                    setMessage("Esemény sikeresen frissítve!");
                } else {
                    await addDoc(eventsColRef, eventDataWithTimestamp);
                    setMessage("Esemény sikeresen hozzáadva!");
                }
            } else {
                // Új esemény
                await addDoc(eventsColRef, eventDataWithTimestamp);
                setMessage("Esemény sikeresen hozzáadva!");
            }
            
            setShowEventModal(false);
            setTemplateForEvent(null);
            // Visszairányítás a naptárhoz
            navigate('/app');
        } catch (error) {
            console.error("TemplatesPage: Error saving event:", error);
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
    
    // Ellenőrizzük, hogy egy Global sablon aktiválva van-e
    const isTemplateActivated = (globalTemplateId) => {
        return userTemplates.some(t => t.globalTemplateId === globalTemplateId);
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
                        Sablonok Menedzsmentje
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Kezeld az eseménytípusokat és aktiváld a gyakran használt sablonokat.
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
                                placeholder="Sablon neve vagy kategória..."
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Kategória
                            </label>
                            <select
                                id="category"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Összes kategória</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Sablonok betöltése...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Saját Sablonok szekció */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Saját Sablonok
                            </h2>
                            {filteredUserTemplates.length === 0 ? (
                                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                                    <p className="text-gray-600 mb-4">
                                        {searchQuery || filterCategory 
                                            ? "Nincs találat a keresési feltételeknek. Próbálj meg más kategóriát választani."
                                            : "Nincs még aktivált sablonod. Válassz a Globális Katalógusból, vagy hozz létre egy újat!"}
                                    </p>
                                    {!searchQuery && !filterCategory && (
                                        <button
                                            onClick={() => {
                                                document.getElementById('global-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Lépj a Globális Katalógusba →
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredUserTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{template.icon || '📅'}</span>
                                                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeactivateTemplate(template);
                                                    }}
                                                    disabled={deactivatingTemplateId === template.id}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                                    title="Eltávolítás a Saját Sablonokból"
                                                >
                                                    {deactivatingTemplateId === template.id ? 'Eltávolítás...' : 'X Eltávolítás'}
                                                </button>
                                            </div>
                                            {template.category && (
                                                <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                                            )}
                                            {template.color && (
                                                <div 
                                                    className="h-2 rounded"
                                                    style={{ backgroundColor: template.color }}
                                                ></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        
                        {/* Global Katalógus szekció */}
                        <section id="global-section">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Globális Katalógus
                            </h2>
                            {filteredGlobalTemplates.length === 0 ? (
                                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                                    <p className="text-gray-600">
                                        Nincs találat a keresési feltételeknek. Próbálj meg más kategóriát választani.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredGlobalTemplates.map(template => {
                                        const isActivated = isTemplateActivated(template.id);
                                        return (
                                            <div
                                                key={template.id}
                                                onClick={() => handleTemplateSelect(template)}
                                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{template.icon || '📅'}</span>
                                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                                    </div>
                                                    {!isActivated && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActivateTemplate(template);
                                                            }}
                                                            disabled={activatingTemplateId === template.id}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                                                            title="Hozzáadás a Saját Sablonokhoz"
                                                        >
                                                            {activatingTemplateId === template.id ? 'Aktiválás...' : '+ Hozzáadás'}
                                                        </button>
                                                    )}
                                                    {isActivated && (
                                                        <span className="text-xs text-green-600 font-medium">✓ Aktiválva</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                                                {template.color && (
                                                    <div 
                                                        className="h-2 rounded"
                                                        style={{ backgroundColor: template.color }}
                                                    ></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
            
            {/* EventModal */}
            {showEventModal && templateForEvent && (
                <EventModal
                    event={templateForEvent}
                    onSave={handleEventSave}
                    onClose={() => {
                        setShowEventModal(false);
                        setTemplateForEvent(null);
                    }}
                    familyMembers={familyMembers}
                    showTemporaryMessage={(msg) => setMessage(msg)}
                    userId={userId}
                    onStatusChange={() => {}}
                    userDisplayName={userDisplayName}
                    currentUserMember={null}
                />
            )}
            
            <MessageDisplay message={message} />
        </div>
    );
};

export default TemplatesPage;

