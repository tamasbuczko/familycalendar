import React from 'react';
import { useCalendarUtils } from '../../utils/calendarUtils.js';

const CalendarView = ({
    currentDate,
    setCurrentDate,
    events,
    familyMembers,
    currentView,
    setCurrentView,
    onAddEvent,
    onEditEvent,
    onDeleteEvent,
    onStatusChange
}) => {
    const { getDaysForView, getEventsForDisplay, navigateDays } = useCalendarUtils();
    const daysToDisplay = getDaysForView(currentDate, currentView);
    const eventsForDisplay = getEventsForDisplay(daysToDisplay, events);

    const handleNavigate = (offset) => {
        const newDate = navigateDays(currentDate, offset, currentView);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            {/* Nézetválasztó gombok */}
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={() => setCurrentView('day')}
                    className={`py-2 px-4 rounded-lg font-bold transition duration-300 ease-in-out ${currentView === 'day' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Napi nézet
                </button>
                <button
                    onClick={() => setCurrentView('week')}
                    className={`py-2 px-4 rounded-lg font-bold transition duration-300 ease-in-out ${currentView === 'week' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Heti nézet
                </button>
                <button
                    onClick={() => setCurrentView('weekdays-only')}
                    className={`py-2 px-4 rounded-lg font-bold transition duration-300 ease-in-out ${currentView === 'weekdays-only' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Hétköznapi nézet
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => handleNavigate(-1)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {currentView === 'day' ? 'Előző nap' : 'Előző hét'}
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-700 text-center">
                    {currentView === 'day' ?
                        currentDate.toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) :
                        `${daysToDisplay[0].toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })} - ${daysToDisplay[daysToDisplay.length - 1].toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    }
                </h2>
                <button
                    onClick={() => handleNavigate(1)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {currentView === 'day' ? 'Következő nap' : 'Következő hét'}
                </button>
            </div>

            <div className={`grid ${currentView === 'day' ? 'grid-cols-1' : currentView === 'weekdays-only' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-7'} gap-4`}>
                {daysToDisplay.map(day => (
                    <div key={day.toISOString().split('T')[0]} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
                            {day.toLocaleDateString('hu-HU', { weekday: 'short' })} <br />
                            <span className="text-sm font-normal text-gray-600">{day.toLocaleDateString('hu-HU', { month: 'numeric', day: 'numeric' })}</span>
                        </h3>
                        <div className="flex-grow space-y-2">
                            {eventsForDisplay
                                .filter(event => event.displayDate.toDateString() === day.toDateString())
                                .map(event => (
                                    <div
                                        key={event.id}
                                        className={`p-3 rounded-lg shadow-sm border ${
                                            event.status === 'cancelled' ? 'bg-red-100 border-red-300 text-red-800 line-through' :
                                            event.status === 'deleted' ? 'bg-gray-200 border-gray-400 text-gray-600 opacity-70' :
                                            'bg-green-100 border-green-300 text-green-800'
                                        }`}
                                    >
                                        <p className="font-semibold">{event.name} {event.isRecurringOccurrence && <span className="text-xs text-gray-500">(ismétlődő)</span>}</p>
                                        <p className="text-sm">{event.time}{event.endTime && ` - ${event.endTime}`} - {event.location}</p>
                                        <p className="text-xs text-gray-600">
                                            {familyMembers.find(m => m.id === event.assignedTo)?.name || 'Nincs hozzárendelve'}
                                        </p>
                                        {event.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic">Megjegyzés: {event.notes}</p>
                                        )}
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => onEditEvent(event)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                title="Szerkesztés"
                                            >
                                                <i className="fas fa-edit h-4 w-4 inline-block"></i>
                                            </button>
                                            {event.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => onStatusChange(event, 'cancelled')}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    title="Lemondás"
                                                >
                                                    <i className="fas fa-times h-4 w-4 inline-block"></i>
                                                </button>
                                            )}
                                            {event.status !== 'deleted' && (
                                                <button
                                                    onClick={() => onDeleteEvent(event)}
                                                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                                    title="Törlés"
                                                >
                                                    <i className="fas fa-trash h-4 w-4 inline-block"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onAddEvent}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
                Esemény hozzáadása
            </button>
        </div>
    );
};

export default CalendarView; 