import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

// Esemény Modal komponens
const EventModal = ({ event, onSave, onClose, familyMembers, showTemporaryMessage }) => {
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