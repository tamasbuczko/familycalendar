import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';

// Esemény Modal komponens
const EventModal = ({ event, onSave, onClose, familyMembers, showTemporaryMessage, userId }) => {
    const [name, setName] = useState(event?.name || '');
    const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0]); // Egyszeri esemény dátuma
    const [time, setTime] = useState(event?.time || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || ''); // Új: befejező idő
    const [location, setLocation] = useState(event?.location || '');
    const [assignedTo, setAssignedTo] = useState(event?.assignedTo || '');
    const [notes, setNotes] = useState(event?.notes || ''); // Új: megjegyzések
    const [status, setStatus] = useState(event?.status || 'active');

    // Ismétlődéshez kapcsolódó állapotok
    const [recurrenceType, setRecurrenceType] = useState(event?.recurrenceType || 'none'); // 'none', 'weekly'
    const [startDate, setStartDate] = useState(event?.startDate || new Date().toISOString().split('T')[0]); // Ismétlődő esemény kezdő dátuma
    const [endDate, setEndDate] = useState(event?.endDate || ''); // Ismétlődő esemény befejező dátuma (opcionális)
    const [recurrenceDays, setRecurrenceDays] = useState(event?.recurrenceDays || []); // Hét napjai (0=Vasárnap, 1=Hétfő...)

    // Értesítési beállítások
    const [remindersEnabled, setRemindersEnabled] = useState(event?.reminders?.enabled || true);
    const [reminderTimes, setReminderTimes] = useState(event?.reminders?.times || [10, 30]); // percek az esemény előtt
    const [reminderSound, setReminderSound] = useState(event?.reminders?.sound || true);
    const [reminderVibration, setReminderVibration] = useState(event?.reminders?.vibration || true);

    // Értesítések hook
    const notifications = useNotifications(userId);

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

        const eventData = {
            name,
            time,
            endTime: endTime || null, // Null, ha üres
            location,
            assignedTo,
            notes, // Új mező
            status: event?.status || 'active', // Megőrizzük a meglévő státuszt vagy alapértelmezettként aktív
            exceptions: event?.exceptions || [], // Megőrizzük a meglévő kivételeket
            reminders: {
                enabled: remindersEnabled,
                times: reminderTimes,
                sound: reminderSound,
                vibration: reminderVibration
            }
        };

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
        } else { // 'weekly'
            if (!startDate) {
                showTemporaryMessage('Kérjük, adja meg az ismétlődő esemény kezdő dátumát.');
                console.log("EventModal: Validation failed - startDate missing for weekly recurrence"); // Debug log
                return;
            }
            if (recurrenceDays.length === 0) {
                showTemporaryMessage('Kérjük, válasszon legalább egy napot az ismétlődéshez.');
                console.log("EventModal: Validation failed - no recurrence days selected"); // Debug log
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
            eventData.recurrenceType = recurrenceType;
            eventData.recurrenceDays = recurrenceDays;
            eventData.date = null; // Nincs egyedi dátum az ismétlődő esemény definíciójához
        }

        console.log("EventModal: Calling onSave with eventData:", eventData); // Debug log
        onSave(eventData);
    };

    return (
        <Modal onClose={onClose} title={event ? "Esemény szerkesztése" : "Új esemény hozzáadása"}>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        {familyMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
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
                                onChange={() => setRecurrenceType('none')}
                            />
                            <span className="ml-2 text-gray-700">Egyszeri</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-blue-600"
                                value="weekly"
                                checked={recurrenceType === 'weekly'}
                                onChange={() => setRecurrenceType('weekly')}
                            />
                            <span className="ml-2 text-gray-700">Hetente</span>
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
                    </>
                )}

                {event && ( // Csak szerkesztéskor jelenjen meg a státusz (az eredeti esemény státusza)
                    <div>
                        <label htmlFor="eventStatus" className="block text-sm font-medium text-gray-700">Státusz (eredeti esemény)</label>
                        <select
                            id="eventStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="active">Aktív</option>
                            <option value="cancelled">Lemondva (teljes sorozat)</option>
                            {/* A "deleted" státuszt itt nem engedjük, mert az előfordulásonkénti törlésre vonatkozik */}
                        </select>
                    </div>
                )}

                {/* Emlékeztető beállítások */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">🔔 Emlékeztető beállítások</h3>
                    
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
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {event ? "Mentés" : "Hozzáadás"}
                </button>
            </form>
        </Modal>
    );
};

export default EventModal; 