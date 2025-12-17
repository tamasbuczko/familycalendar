import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../ui/Modal.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import { globalTemplates } from '../../data/globalTemplates.js';

// Esemény Modal komponens
const EventModal = ({ event, onSave, onClose, familyMembers, showTemporaryMessage, userId, onStatusChange, userDisplayName, currentUserMember }) => {
    const [name, setName] = useState(event?.name || '');
    const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0]); // Egyszeri esemény dátuma
    const [time, setTime] = useState(event?.time || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || ''); // Új: befejező idő
    const [location, setLocation] = useState(event?.location || '');
    const [assignedTo, setAssignedTo] = useState(event?.assignedTo || '');
    const [notes, setNotes] = useState(event?.notes || ''); // Új: megjegyzések
    // Ha sablon szerkesztésről van szó (isTemplateEdit), akkor ne legyen alapértelmezett státusz
    const [status, setStatus] = useState(() => {
        if (event?.isTemplateEdit) {
            return event?.status || 'inactive'; // Sablon esetén inaktív alapértelmezett
        }
        return event?.status || 'active'; // Esemény esetén aktív alapértelmezett
    });
    const [cancellationReason, setCancellationReason] = useState(event?.cancellationReason || '');
    const [showAvatar, setShowAvatar] = useState(event?.showAvatar !== false); // Alapértelmezetten true, ha nincs beállítva
    const [points, setPoints] = useState(event?.points || 10); // Pontok az esemény teljesítéséért (alapértelmezett: 10)
    const [visibility, setVisibility] = useState(event?.visibility || 'family'); // Láthatóság: 'only_me', 'family', 'known_families'
    const [icon, setIcon] = useState(event?.icon || ''); // Ikon (emoji vagy string)
    const [color, setColor] = useState(event?.color || ''); // Szín (hex kód vagy string)
    const [showIconPicker, setShowIconPicker] = useState(false); // Ikon választó megjelenítése
    const iconPickerRef = useRef(null); // Ref az ikon választóhoz
    
    // Összegyűjtjük az összes egyedi emoji-t
    const availableEmojis = useMemo(() => {
        // Összegyűjtjük az összes egyedi emoji-t a globalTemplates-ből
        const uniqueEmojis = [...new Set(globalTemplates.map(t => t.icon).filter(Boolean))];
        // Hozzáadunk néhány általános emoji-t is
        const commonEmojis = ['📅', '⭐', '❤️', '✅', '❌', '⚠️', '💡', '🎯', '🏆', '💪', '🌟', '🔥'];
        return [...new Set([...uniqueEmojis, ...commonEmojis])].sort();
    }, []);
    
    // Kattintás kívülre zárja az ikon választót
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target)) {
                setShowIconPicker(false);
            }
        };
        
        if (showIconPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showIconPicker]);

    // Ismétlődéshez kapcsolódó állapotok
    // Ha intervallum van (startDate és endDate), akkor 'daily' ismétlődés
    // Vagy ha már be van állítva a recurrenceType és nem 'none', akkor azt használjuk
    const initialRecurrenceType = (event?.startDate && event?.endDate) 
        ? 'daily' 
        : (event?.recurrenceType && event.recurrenceType !== 'none') 
            ? event.recurrenceType 
            : 'none';
    const [recurrenceType, setRecurrenceType] = useState(initialRecurrenceType); // 'none', 'daily', 'weekly', 'monthly'
    const [recurrenceFrequency, setRecurrenceFrequency] = useState(() => {
        // Ha intervallum van, akkor 'daily'
        if (event?.startDate && event?.endDate) {
            return 'daily';
        }
        // Ha van recurrenceType és nem 'none', akkor azt használjuk, különben 'weekly' (default)
        if (event?.recurrenceType && event.recurrenceType !== 'none') {
            return event.recurrenceType;
        }
        return 'weekly'; // Default gyakoriság
    });
    const [startDate, setStartDate] = useState(event?.startDate || new Date().toISOString().split('T')[0]); // Ismétlődő esemény kezdő dátuma
    const [endDate, setEndDate] = useState(event?.endDate || ''); // Ismétlődő esemény befejező dátuma (opcionális)
    const [recurrenceDays, setRecurrenceDays] = useState(event?.recurrenceDays || []); // Hét napjai (0=Vasárnap, 1=Hétfő...) - csak heti ismétlődésnél
    
    // Kivétel kezelés: ha ismétlődő esemény előfordulását szerkesztjük, lehetőség kivételként menteni
    const [saveAsException, setSaveAsException] = useState(false);

    // Értesítési beállítások
    const [remindersEnabled, setRemindersEnabled] = useState(event?.reminders?.enabled || true);
    const [reminderTimes, setReminderTimes] = useState(event?.reminders?.times || [10, 30]); // percek az esemény előtt
    const [reminderSound, setReminderSound] = useState(event?.reminders?.sound || true);
    const [reminderVibration, setReminderVibration] = useState(event?.reminders?.vibration || true);
    const [isRemindersAccordionOpen, setIsRemindersAccordionOpen] = useState(false);
    const [notificationRecipients, setNotificationRecipients] = useState(() => {
        // Alapértelmezett: a létrehozó (userId), ha nincs beállítva
        if (event?.notificationRecipients && event.notificationRecipients.length > 0) {
            return event.notificationRecipients;
        }
        return userId ? [userId] : [];
    });

    // Értesítések hook
    const notifications = useNotifications(userId);

    // Frissítsük az állapotot, amikor az event prop változik
    useEffect(() => {
        if (event) {
            // Ha ismétlődő esemény előfordulása, használjuk a displayDate-et
            // Ha csak dátum van megadva (pl. hover gombból), akkor azt használjuk
            // Ha intervallum van (startDate és endDate), akkor azokat használjuk
            const eventDate = event.isRecurringOccurrence && event.displayDate 
                ? event.displayDate.toISOString().split('T')[0]
                : (event.date || new Date().toISOString().split('T')[0]);
            
            setName(event.name || '');
            setDate(eventDate);
            
            // Ha intervallum van (startDate és endDate), akkor azokat beállítjuk
            if (event.startDate && event.endDate) {
                setStartDate(event.startDate);
                setEndDate(event.endDate);
                // Intervallum esetén napi ismétlődő esemény a két dátum között
                setRecurrenceType('daily');
                setRecurrenceFrequency('daily');
            }
            
            // Ha csak dátum van megadva (új esemény dátummal), akkor az időt is beállítjuk alapértelmezettként
            if (event.date && !event.name && !event.time) {
                // Csak dátum van, idő nincs - alapértelmezett időt használunk
                setTime(event.time || '09:00');
            }
            setTime(event.time || '09:00');
            setEndTime(event.endTime || '');
            setLocation(event.location || '');
            setAssignedTo(event.assignedTo || '');
            setNotes(event.notes || '');
            setStatus(event.status || (event.isTemplateEdit ? 'inactive' : 'active'));
            setCancellationReason(event.cancellationReason || '');
            setShowAvatar(event?.showAvatar !== false); // Alapértelmezetten true, ha nincs beállítva
            setPoints(event.points || 10); // Alapértelmezett: 10 pont
            setVisibility(event.visibility || 'family'); // Alapértelmezett: család
            setIcon(event.icon || ''); // Ikon
            setColor(event.color || ''); // Szín
            
            // Ha ismétlődő esemény előfordulása, az eredeti esemény recurrenceType-ját használjuk
            // Az eredeti esemény recurrenceType-ját kell használni, hogy látszódjon, hogy ismétlődő
            if (event.isRecurringOccurrence && event.originalEventId) {
                // Az eredeti esemény recurrenceType-ját használjuk
                // Meg kell keresni az eredeti eseményt, de mivel nincs hozzáférése, használjuk az event.recurrenceType-t
                // Ha az event-ben nincs recurrenceType, akkor 'weekly' (mert ismétlődő esemény)
                setRecurrenceType(event.recurrenceType || 'weekly');
            } else {
                setRecurrenceType(event.recurrenceType || 'none');
            }
            
            setStartDate(event.startDate || new Date().toISOString().split('T')[0]);
            setEndDate(event.endDate || '');
            setRecurrenceDays(event.recurrenceDays || []);
            setRemindersEnabled(event.reminders?.enabled !== undefined ? event.reminders.enabled : true);
            setReminderTimes(event.reminders?.times || [10, 30]);
            setReminderSound(event.reminders?.sound !== undefined ? event.reminders.sound : true);
            setReminderVibration(event.reminders?.vibration !== undefined ? event.reminders.vibration : true);
            setNotificationRecipients(event.notificationRecipients && event.notificationRecipients.length > 0 
                ? event.notificationRecipients 
                : (userId ? [userId] : []));
            
            // Ha ismétlődő esemény előfordulását szerkesztjük, alapértelmezetten ne legyen kivétel
            setSaveAsException(false);
        } else {
            // Új esemény - alapértelmezett értékek
            setName('');
            setDate(new Date().toISOString().split('T')[0]);
            setTime('09:00');
            setEndTime('');
            setLocation('');
            setAssignedTo('');
            setNotes('');
            setStatus(event?.isTemplateEdit ? 'inactive' : 'active');
            setCancellationReason('');
            setPoints(10); // Alapértelmezett: 10 pont
            setVisibility('family'); // Alapértelmezett: család
            setIcon(''); // Alapértelmezett: nincs ikon
            setColor(''); // Alapértelmezett: nincs szín
            setRecurrenceType('none');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate('');
            setRecurrenceDays([]);
            setRemindersEnabled(true);
            setReminderTimes([10, 30]);
            setReminderSound(true);
            setReminderVibration(true);
            setNotificationRecipients(userId ? [userId] : []);
        }
    }, [event]);

    const weekDaysOptions = [
        { name: 'Hétfő', value: 1 },
        { name: 'Kedd', value: 2 },
        { name: 'Szerda', value: 3 },
        { name: 'Csütörtök', value: 4 },
        { name: 'Péntek', value: 5 },
        { name: 'Szombat', value: 6 },
        { name: 'Vasárnap', value: 0 },
    ];

    const handleRecurrenceDayChange = (dayIndex) => {
        setRecurrenceDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex].sort((a, b) => a - b)
        );
    };

    // Emlékeztető idők kezelése
    const handleReminderTimeChange = (index, value) => {
        const newTimes = [...reminderTimes];
        newTimes[index] = parseInt(value) || 0;
        setReminderTimes(newTimes.sort((a, b) => b - a)); // Csökkenő sorrendben
    };

    const addReminderTime = () => {
        if (reminderTimes.length < 5) { // Maximum 5 emlékeztető
            setReminderTimes([...reminderTimes, 15].sort((a, b) => b - a));
        }
    };

    const removeReminderTime = (index) => {
        if (reminderTimes.length > 1) { // Legalább 1 emlékeztető maradjon
            setReminderTimes(reminderTimes.filter((_, i) => i !== index));
        }
    };

    // Elérhető emlékeztető idők
    const availableReminderTimes = [5, 10, 15, 30, 60, 120, 240, 480, 1440]; // percek

    // Emlékeztető idő formázása
    const formatReminderTime = (minutes) => {
        if (minutes < 60) {
            return `${minutes} perc`;
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours} óra`;
            } else {
                return `${hours} óra ${remainingMinutes} perc`;
            }
        } else {
            const days = Math.floor(minutes / 1440);
            const remainingHours = Math.floor((minutes % 1440) / 60);
            if (remainingHours === 0) {
                return `${days} nap`;
            } else {
                return `${days} nap ${remainingHours} óra`;
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("EventModal: handleSubmit called"); // Debug log
        
        // Ha lemondott eseményt szerkesztünk, csak a cancellationReason-t mentjük
        if (event && event.status === 'cancelled' && status === 'cancelled') {
            // Ha ismétlődő esemény előfordulása, akkor kivételként kell menteni
            if (event.isRecurringOccurrence && event.originalEventId) {
                const eventData = {
                    id: event.id,
                    originalEventId: event.originalEventId,
                    isRecurringOccurrence: true,
                    displayDate: event.displayDate,
                    date: event.date || (event.displayDate ? event.displayDate.toISOString().split('T')[0] : null),
                    cancellationReason: cancellationReason,
                    saveAsException: true // Automatikusan kivételként mentjük
                };
                console.log("EventModal: Saving cancellation reason as exception", eventData);
                onSave(eventData);
                return;
            } else {
                // Egyszeri esemény - csak a cancellationReason-t frissítjük
                const eventData = {
                    id: event.id,
                    name: event.name,
                    time: event.time,
                    endTime: event.endTime,
                    location: event.location,
                    assignedTo: event.assignedTo,
                    notes: event.notes,
                    date: event.date,
                    status: 'cancelled', // Megtartjuk a lemondott státuszt
                    cancellationReason: cancellationReason,
                    visibility: event.visibility || 'family', // Megtartjuk a láthatóság beállítást
                    notificationRecipients: event.notificationRecipients || [], // Megtartjuk az értesítés kapó személyeket
                    recurrenceType: event.recurrenceType || 'none',
                    startDate: event.startDate,
                    endDate: event.endDate,
                    recurrenceDays: event.recurrenceDays || [],
                    exceptions: event.exceptions || [],
                    reminders: event.reminders || {
                        enabled: true,
                        times: [10, 30],
                        sound: true,
                        vibration: true
                    }
                };
                console.log("EventModal: Saving cancellation reason for single event", eventData);
                onSave(eventData);
                return;
            }
        }
        
        if (!name || !time) {
            showTemporaryMessage('Kérjük, töltse ki a kötelező mezőket (Esemény neve, Idő).');
            console.log("EventModal: Validation failed - name or time missing"); // Debug log
            return;
        }
        if (endTime && time >= endTime) {
            showTemporaryMessage('A befejező időpontnak későbbinek kell lennie, mint a kezdő időpontnak.');
            console.log("EventModal: Validation failed - endTime before time"); // Debug log
            return;
        }
        
        // Ha az értesítés be van kapcsolva, legalább egy személyt ki kell választani
        if (remindersEnabled && (!notificationRecipients || notificationRecipients.length === 0)) {
            showTemporaryMessage('Ha az értesítés be van kapcsolva, legalább egy személyt ki kell választani, aki értesítést kapjon.');
            console.log("EventModal: Validation failed - no notification recipients selected"); // Debug log
            return;
        }

        const eventData = {
            name,
            time,
            endTime: endTime || null, // Null, ha üres
            location,
            assignedTo,
            notes, // Új mező
            status: status, // Használjuk a formban beállított státuszt
            cancellationReason: status === 'cancelled' ? cancellationReason : null, // Lemondás oka (csak ha lemondott)
            showAvatar: showAvatar, // Avatar megjelenítése a naptárban
            points: points, // Pontok az esemény teljesítéséért
            visibility: visibility, // Láthatóság beállítása
            icon: icon || null, // Ikon (null, ha üres)
            color: color || null, // Szín (null, ha üres)
            exceptions: event?.exceptions || [], // Megőrizzük a meglévő kivételeket
            reminders: {
                enabled: remindersEnabled,
                times: reminderTimes,
                sound: reminderSound,
                vibration: reminderVibration
            },
            notificationRecipients: remindersEnabled ? notificationRecipients : [] // Csak akkor mentjük, ha az értesítés be van kapcsolva
        };

        // Ha szerkesztünk egy eseményt, adjuk hozzá az ID-t és az originalEventId-t (ha ismétlődő előfordulás)
        if (event?.id) {
            eventData.id = event.id;
        }
        if (event?.originalEventId) {
            eventData.originalEventId = event.originalEventId;
            eventData.isRecurringOccurrence = event.isRecurringOccurrence;
            eventData.displayDate = event.displayDate;
        }
        
        // Kivétel kezelés flag
        eventData.saveAsException = saveAsException;

        if (recurrenceType === 'none') {
            if (!date) {
                showTemporaryMessage('Kérjük, adja meg az esemény dátumát.');
                console.log("EventModal: Validation failed - date missing for none recurrence"); // Debug log
                return;
            }
            eventData.date = date;
            eventData.recurrenceType = 'none';
            eventData.startDate = null;
            eventData.endDate = null;
            eventData.recurrenceDays = [];
        } else { // Ismétlődő esemény (daily, weekly, monthly)
            if (!startDate) {
                showTemporaryMessage('Kérjük, adja meg az ismétlődő esemény kezdő dátumát.');
                console.log("EventModal: Validation failed - startDate missing for recurring event"); // Debug log
                return;
            }
            // Heti ismétlődésnél kötelező legalább egy nap kiválasztása
            if (recurrenceFrequency === 'weekly' && recurrenceDays.length === 0) {
                showTemporaryMessage('Kérjük, válasszon legalább egy napot az ismétlődéshez.');
                console.log("EventModal: Validation failed - no recurrence days selected for weekly"); // Debug log
                return;
            }
            // Ellenőrizzük, hogy a startDate ne legyen későbbi, mint az endDate, ha az meg van adva
            if (endDate && startDate > endDate) {
                showTemporaryMessage('A kezdő dátum nem lehet későbbi, mint a befejező dátum.');
                console.log("EventModal: Validation failed - startDate after endDate"); // Debug log
                return;
            }
            eventData.startDate = startDate;
            eventData.endDate = endDate || null; // Null, ha üres
            eventData.recurrenceType = recurrenceFrequency; // A gyakoriságot használjuk
            eventData.recurrenceDays = recurrenceFrequency === 'weekly' ? recurrenceDays : []; // Csak heti ismétlődésnél
            eventData.date = null; // Nincs egyedi dátum az ismétlődő esemény definíciójához
        }

        console.log("EventModal: Calling onSave with eventData:", eventData); // Debug log
        onSave(eventData);
    };

    return (
        <Modal onClose={onClose} title={event?.id ? "Esemény szerkesztése" : (event?.name && !event?.date ? "Esemény hozzáadása sablonból" : "Új esemény hozzáadása")}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Ha lemondott esemény, csak a lemondás okát és a visszaállítás gombot mutatjuk */}
                {event && status === 'cancelled' ? (
                    <>
                        <div>
                            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
                                Lemondás oka:
                            </label>
                            <textarea
                                id="cancellationReason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Pl. elmarad az óra, betegség, stb."
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows="4"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                💾 Mentés
                            </button>
                            {onStatusChange && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onStatusChange) {
                                            onStatusChange(event, 'active');
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    ✅ Visszaállítás
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Esemény neve</label>
                    <input
                        type="text"
                        id="eventName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700">Kezdő idő</label>
                        <input
                            type="time"
                            id="eventTime"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Befejező idő (opcionális)</label>
                        <input
                            type="time"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">Helyszín</label>
                    <input
                        type="text"
                        id="eventLocation"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Pl. Iskola, Edzőterem, Gárdony, Iváncsa"
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Hozzárendelve</label>
                    <select
                        id="assignedTo"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Válasszon családtagot</option>
                        {(() => {
                            // Kiterjesztett lista: tartalmazza a családtagokat ÉS a családfőt is
                            const allMembers = [...familyMembers];
                            
                            // Ha a családfőnek van member rekordja, hozzáadjuk
                            if (currentUserMember) {
                                // Ha már benne van (nem kellene, de biztos, ami biztos), ne adjuk hozzá újra
                                if (!allMembers.find(m => m.id === currentUserMember.id)) {
                                    allMembers.push(currentUserMember);
                                }
                            } else if (userId && userDisplayName) {
                                // Ha nincs member rekordja, de van userId és displayName, hozzáadjuk virtuális memberként
                                allMembers.push({
                                    id: `user_${userId}`, // Virtuális ID
                                    name: userDisplayName,
                                    userId: userId,
                                    avatar: '👤',
                                    color: '#3B82F6'
                                });
                            }
                            
                            return allMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.avatar ? `${member.avatar} ${member.name}` : member.name}
                                </option>
                            ));
                        })()}
                    </select>
                    {assignedTo && (
                        <div className="mt-2 flex items-center">
                            <input
                                type="checkbox"
                                id="showAvatar"
                                checked={showAvatar}
                                onChange={(e) => setShowAvatar(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showAvatar" className="ml-2 block text-sm text-gray-700">
                                Avatar megjelenítése a naptárban
                            </label>
                        </div>
                    )}
                </div>
                {/* Ikon választó */}
                <div className="relative" ref={iconPickerRef}>
                    <label htmlFor="eventIcon" className="block text-sm font-medium text-gray-700">Ikon (opcionális)</label>
                    <div className="mt-1 relative">
                        <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                {icon ? (
                                    <>
                                        <span className="text-2xl">{icon}</span>
                                        <span className="text-sm text-gray-600">{icon}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-500">Válassz ikont...</span>
                                )}
                            </div>
                            <i className={`fas fa-chevron-${showIconPicker ? 'up' : 'down'} text-gray-400`}></i>
                        </button>
                        
                        {showIconPicker && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="p-2 grid grid-cols-8 gap-1">
                                    {availableEmojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                setIcon(emoji);
                                                setShowIconPicker(false);
                                            }}
                                            className={`p-2 text-2xl rounded hover:bg-gray-100 transition-colors flex items-center justify-center ${
                                                icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                                            }`}
                                            title={emoji}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIcon('');
                                            setShowIconPicker(false);
                                        }}
                                        className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
                                    >
                                        Ikon eltávolítása
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Szín választó */}
                <div>
                    <label htmlFor="eventColor" className="block text-sm font-medium text-gray-700">Szín (opcionális)</label>
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="color"
                            id="eventColor"
                            value={color || '#3B82F6'}
                            onChange={(e) => setColor(e.target.value)}
                            className="block w-20 h-12 border border-gray-300 rounded-lg shadow-sm cursor-pointer"
                        />
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#3B82F6"
                            pattern="^#[0-9A-Fa-f]{6}$"
                            className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setColor('')}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Törlés
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Válassz színt az eseményhez, vagy hagyd üresen</p>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Megjegyzések</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pl. Néptánccucc, Úszócucc, Tanár beteg lett"
                        rows="3"
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>

                {/* Pontok beállítása - csak ha gyerekhez van hozzárendelve */}
                {assignedTo && (() => {
                    const assignedMember = familyMembers.find(m => m.id === assignedTo);
                    // Ellenőrizzük, hogy a currentUserMember-e van hozzárendelve
                    const isAssignedToCurrentUser = currentUserMember && (assignedTo === currentUserMember.id || (assignedTo && assignedTo.startsWith('user_') && userId && assignedTo === `user_${userId}`));
                    const assignedMemberForCheck = isAssignedToCurrentUser ? currentUserMember : assignedMember;
                    const isChild = assignedMemberForCheck?.isChild || (assignedTo && assignedTo.startsWith('user_') && userId && assignedTo === `user_${userId}` && currentUserMember?.isChild);
                    if (isChild) {
                        return (
                            <div>
                                <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                                    Pontok az esemény teljesítéséért
                                </label>
                                <input
                                    type="number"
                                    id="points"
                                    min="0"
                                    max="100"
                                    value={points}
                                    onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">Alapértelmezett: 10 pont. Beállíthatod, hogy hány pont járjon az esemény teljesítéséért.</p>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Láthatóság beállítása */}
                <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                        Láthatóság
                    </label>
                    <select
                        id="visibility"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="only_me">Csak én</option>
                        <option value="family">Család</option>
                        <option value="known_families" disabled>Ismerős családok is (hamarosan)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        {visibility === 'only_me' && 'Csak te láthatod ezt az eseményt.'}
                        {visibility === 'family' && 'A család minden tagja láthatja ezt az eseményt.'}
                        {visibility === 'known_families' && 'A család és az ismerős családok tagjai is láthatják ezt az eseményt.'}
                    </p>
                </div>

                {/* Ismétlődés típusa */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ismétlődés típusa</label>
                    <div className="flex gap-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-blue-600"
                                value="none"
                                checked={recurrenceType === 'none'}
                                onChange={() => {
                                    setRecurrenceType('none');
                                }}
                            />
                            <span className="ml-2 text-gray-700">Egyszeri</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-blue-600"
                                value="recurring"
                                checked={recurrenceType !== 'none'}
                                onChange={() => {
                                    setRecurrenceType(recurrenceFrequency); // A jelenlegi gyakoriságot használjuk
                                }}
                            />
                            <span className="ml-2 text-gray-700">Ismétlődő</span>
                        </label>
                    </div>
                </div>

                {recurrenceType === 'none' ? (
                    <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Dátum</label>
                        <input
                            type="date"
                            id="eventDate"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                ) : (
                    <>
                        {/* Gyakoriság választás */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gyakoriság</label>
                            <div className="flex gap-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="daily"
                                        checked={recurrenceFrequency === 'daily'}
                                        onChange={() => {
                                            setRecurrenceFrequency('daily');
                                            setRecurrenceType('daily');
                                            setRecurrenceDays([]); // Napi ismétlődésnél nincs szükség napokra
                                        }}
                                    />
                                    <span className="ml-2 text-gray-700">Napi</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="weekly"
                                        checked={recurrenceFrequency === 'weekly'}
                                        onChange={() => {
                                            setRecurrenceFrequency('weekly');
                                            setRecurrenceType('weekly');
                                        }}
                                    />
                                    <span className="ml-2 text-gray-700">Heti</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="monthly"
                                        checked={recurrenceFrequency === 'monthly'}
                                        onChange={() => {
                                            setRecurrenceFrequency('monthly');
                                            setRecurrenceType('monthly');
                                            setRecurrenceDays([]); // Havi ismétlődésnél nincs szükség napokra
                                        }}
                                    />
                                    <span className="ml-2 text-gray-700">Havi</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Kezdő dátum</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Befejező dátum (opcionális)</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {/* Hét napjai - csak heti ismétlődésnél */}
                        {recurrenceFrequency === 'weekly' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ismétlődés napjai</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {weekDaysOptions.map(day => (
                                        <label key={day.value} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-blue-600 rounded"
                                                value={day.value}
                                                checked={recurrenceDays.includes(day.value)}
                                                onChange={() => handleRecurrenceDayChange(day.value)}
                                            />
                                            <span className="ml-2 text-gray-700">{day.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Státusz választó - csak esemény szerkesztésnél vagy új esemény létrehozásánál, NEM sablon létrehozásánál */}
                {!event?.isTemplateEdit && (event && !event.isRecurringOccurrence || !event) && (
                    <div>
                        <label htmlFor="eventStatus" className="block text-sm font-medium text-gray-700">Státusz</label>
                        <select
                            id="eventStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="active">Aktív</option>
                            <option value="cancelled">Lemondva</option>
                            {/* A "deleted" és "inactive" státuszt itt nem engedjük, mert azok belső működéshez kellenek */}
                        </select>
                    </div>
                )}

                {/* Lemondás oka szerkesztése - csak lemondott eseménynél */}
                {event && status === 'cancelled' && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">❌ Lemondás oka</h3>
                        <div>
                            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
                                Lemondás oka (opcionális):
                            </label>
                            <textarea
                                id="cancellationReason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Pl. elmarad az óra, betegség, stb."
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows="3"
                            />
                        </div>
                    </div>
                )}

                {/* Emlékeztető beállítások - Accordion */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">🔔 Emlékeztető beállítások</h3>
                        <button
                            type="button"
                            onClick={() => setIsRemindersAccordionOpen(!isRemindersAccordionOpen)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                            aria-label="Emlékeztető beállítások megjelenítése/elrejtése"
                        >
                            <i className={`fas fa-chevron-${isRemindersAccordionOpen ? 'up' : 'down'} text-lg`}></i>
                        </button>
                    </div>
                    
                    {isRemindersAccordionOpen && (
                        <div className="space-y-4">
                        {/* Emlékeztetők engedélyezése */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remindersEnabled"
                                checked={remindersEnabled}
                                onChange={(e) => setRemindersEnabled(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remindersEnabled" className="ml-2 block text-sm text-gray-700">
                                Emlékeztetők engedélyezése
                            </label>
                        </div>

                        {remindersEnabled && (
                            <>
                                {/* Emlékeztető idők */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Emlékeztetés az esemény előtt
                                    </label>
                                    <div className="space-y-2">
                                        {reminderTimes.map((time, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <select
                                                    value={time}
                                                    onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {availableReminderTimes.map(availableTime => (
                                                        <option key={availableTime} value={availableTime}>
                                                            {formatReminderTime(availableTime)}
                                                        </option>
                                                    ))}
                                                </select>
                                                {reminderTimes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReminderTime(index)}
                                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Emlékeztető törlése"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {reminderTimes.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={addReminderTime}
                                                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                ➕ Új emlékeztető hozzáadása
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Értesítés kapó személyek */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Értesítés kapó személyek
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                        {(() => {
                                            // Összegyűjtjük azokat a családtagokat, akiknek van userId-ja
                                            const recipientsWithUserId = [];
                                            
                                            // Jelenlegi felhasználó (ha van userId-ja)
                                            if (currentUserMember && currentUserMember.userId) {
                                                recipientsWithUserId.push({
                                                    userId: currentUserMember.userId,
                                                    name: currentUserMember.name || userDisplayName,
                                                    avatar: currentUserMember.avatar || '👤',
                                                    isCurrentUser: true
                                                });
                                            } else if (userId) {
                                                // Ha nincs currentUserMember, de van userId, akkor hozzáadjuk
                                                recipientsWithUserId.push({
                                                    userId: userId,
                                                    name: userDisplayName || 'Én',
                                                    avatar: '👤',
                                                    isCurrentUser: true
                                                });
                                            }
                                            
                                            // Családtagok, akiknek van userId-ja
                                            familyMembers.forEach(member => {
                                                if (member.userId && member.userId !== userId) {
                                                    recipientsWithUserId.push({
                                                        userId: member.userId,
                                                        name: member.name,
                                                        avatar: member.avatar || '👤',
                                                        isCurrentUser: false
                                                    });
                                                }
                                            });
                                            
                                            if (recipientsWithUserId.length === 0) {
                                                return (
                                                    <p className="text-sm text-gray-500">
                                                        Nincs olyan családtag, akinek van bejelentkezése. Az értesítések csak bejelentkezett felhasználóknak küldhetők.
                                                    </p>
                                                );
                                            }
                                            
                                            return recipientsWithUserId.map(recipient => (
                                                <label key={recipient.userId} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={notificationRecipients.includes(recipient.userId)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setNotificationRecipients([...notificationRecipients, recipient.userId]);
                                                            } else {
                                                                setNotificationRecipients(notificationRecipients.filter(id => id !== recipient.userId));
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <span className="ml-2 text-base flex-shrink-0">{recipient.avatar}</span>
                                                    <span className="ml-2 text-sm text-gray-700">{recipient.name}</span>
                                                    {recipient.isCurrentUser && (
                                                        <span className="ml-2 text-xs text-gray-500">(alapértelmezett)</span>
                                                    )}
                                                </label>
                                            ));
                                        })()}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {notificationRecipients.length === 0 
                                            ? 'Válassz ki legalább egy személyt, aki értesítést kapjon.'
                                            : `${notificationRecipients.length} személy kap értesítést.`}
                                    </p>
                                </div>

                                {/* Hang és rezgés beállítások */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="reminderSound"
                                            checked={reminderSound}
                                            onChange={(e) => setReminderSound(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="reminderSound" className="ml-2 block text-sm text-gray-700">
                                            🔊 Hang
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="reminderVibration"
                                            checked={reminderVibration}
                                            onChange={(e) => setReminderVibration(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="reminderVibration" className="ml-2 block text-sm text-gray-700">
                                            📳 Rezgés
                                        </label>
                                    </div>
                                </div>

                                {/* Értesítési státusz */}
                                {notifications.isSupported && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-blue-800">
                                            {notifications.permission === 'granted' ? (
                                                <>
                                                    ✅ Értesítések engedélyezve
                                                    {notifications.token && (
                                                        <span className="text-xs text-blue-600">
                                                            (Token: {notifications.token.substring(0, 20)}...)
                                                        </span>
                                                    )}
                                                </>
                                            ) : notifications.permission === 'denied' ? (
                                                <>
                                                    ❌ Értesítések letiltva
                                                    <button
                                                        type="button"
                                                        onClick={() => notifications.requestPermission()}
                                                        className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                    >
                                                        Engedélyezés
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    ⚠️ Értesítések engedélyezése szükséges
                                                    <button
                                                        type="button"
                                                        onClick={() => notifications.requestPermission()}
                                                        className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                    >
                                                        Engedélyezés
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        </div>
                    )}
                </div>
                
                {/* Kivétel kezelés: csak akkor, ha ismétlődő esemény előfordulását szerkesztjük (nem új esemény, nem egyszeri) */}
                {event?.isRecurringOccurrence && event?.originalEventId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="saveAsException"
                                checked={saveAsException}
                                onChange={(e) => setSaveAsException(e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                                <label htmlFor="saveAsException" className="block text-sm font-medium text-gray-700 cursor-pointer">
                                    Kivételként mentés (csak erre a napra)
                                </label>
                                <p className="text-xs text-gray-600 mt-1">
                                    Ha be van jelölve, a módosítások csak erre a napra vonatkoznak. Az eredeti ismétlődő esemény változatlan marad, és a többi előfordulás nem módosul.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            {event ? "Mentés" : "Hozzáadás"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full text-center text-gray-600 hover:text-gray-800 font-medium py-2 transition duration-200"
                        >
                            Mégse
                        </button>
                    </>
                )}
            </form>
        </Modal>
    );
};

export default EventModal; 