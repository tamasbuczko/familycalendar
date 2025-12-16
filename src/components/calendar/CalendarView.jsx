import React, { useState } from 'react';
import { useCalendarUtils } from '../../utils/calendarUtils.js';
import DayView from './DayView.jsx';

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
    onStatusChange,
    userId,
    userDisplayName,
    currentUserMember,
    isChildMode = false,
    colorPriority = 'tag'
}) => {
    const { getDaysForView, getEventsForDisplay, navigateDays } = useCalendarUtils();
    const daysToDisplay = getDaysForView(currentDate, currentView);
    const eventsForDisplay = getEventsForDisplay(daysToDisplay, events);
    
    // State a hover-elt naphoz (heti/hétköznapi nézetben)
    const [hoveredDay, setHoveredDay] = useState(null);
    
    // State az intervallum kiválasztáshoz
    const [isIntervalMode, setIsIntervalMode] = useState(false);
    const [intervalStartDate, setIntervalStartDate] = useState(null);
    const [intervalEndDate, setIntervalEndDate] = useState(null);
    const [hoveredDayInInterval, setHoveredDayInInterval] = useState(null);

    const handleNavigate = (offset) => {
        const newDate = navigateDays(currentDate, offset, currentView);
        setCurrentDate(newDate);
    };

    // Ha napi nézet, használjuk a DayView komponenst
    if (currentView === 'day') {
        // A napi nézetben is ugyanazt a dátumot használjuk, mint amit a getDaysForView generál
        const currentDayForFilter = daysToDisplay[0]; // Napi nézetben csak egy nap van
        const dayEvents = eventsForDisplay.filter(event => {
            // A displayDate lehet Date objektum vagy string
            const eventDate = event.displayDate instanceof Date 
                ? new Date(event.displayDate.getTime()) 
                : new Date(event.displayDate);
            const filterDate = new Date(currentDayForFilter);
            // Mindkét dátumot ugyanúgy normalizáljuk (00:00:00) helyi időzónában
            eventDate.setHours(0, 0, 0, 0);
            filterDate.setHours(0, 0, 0, 0);
            // Dátum stringekkel hasonlítjuk össze, hogy elkerüljük az időzóna problémákat
            const eventDateStr = eventDate.toISOString().split('T')[0];
            const filterDateStr = filterDate.toISOString().split('T')[0];
            return eventDateStr === filterDateStr;
        });
        

        return (
            <div className="bg-white p-6 rounded-lg shadow-md w-full">
                {/* Nézetválasztó gombok */}
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => setCurrentView('day')}
                        className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'day' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Napi nézet
                    </button>
                    <button
                        onClick={() => setCurrentView('week')}
                        className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'week' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Heti nézet
                    </button>
                    <button
                        onClick={() => setCurrentView('weekdays-only')}
                        className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'weekdays-only' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Hétköznapi nézet
                    </button>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => handleNavigate(-1)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Előző nap
                    </button>
                    <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-700 text-center">
                        {currentDate.toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <button
                        onClick={() => handleNavigate(1)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Következő nap
                    </button>
                </div>

                <DayView
                    date={currentDate}
                    events={dayEvents}
                    familyMembers={familyMembers}
                    onEditEvent={onEditEvent}
                    onDeleteEvent={onDeleteEvent}
                    onStatusChange={onStatusChange}
                    userId={userId}
                    userDisplayName={userDisplayName}
                    currentUserMember={currentUserMember}
                    isChildMode={isChildMode}
                    onAddEvent={onAddEvent}
                    colorPriority={colorPriority}
                />

                <button
                    onClick={onAddEvent}
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Esemény hozzáadása
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            {/* Nézetválasztó gombok */}
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={() => setCurrentView('day')}
                    className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'day' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Napi nézet
                </button>
                <button
                    onClick={() => setCurrentView('week')}
                    className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'week' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Heti nézet
                </button>
                <button
                    onClick={() => setCurrentView('weekdays-only')}
                    className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out ${currentView === 'weekdays-only' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Hétköznapi nézet
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => handleNavigate(-1)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Előző hét
                </button>
                <div className="flex items-center gap-4">
                    <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-700 text-center">
                        {`${daysToDisplay[0].toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })} - ${daysToDisplay[daysToDisplay.length - 1].toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    </h2>
                    {/* Intervallum gomb */}
                    <button
                        onClick={() => {
                            if (isIntervalMode) {
                                // Intervallum mód kikapcsolása
                                setIsIntervalMode(false);
                                setIntervalStartDate(null);
                                setIntervalEndDate(null);
                            } else {
                                // Intervallum mód bekapcsolása
                                setIsIntervalMode(true);
                                setIntervalStartDate(null);
                                setIntervalEndDate(null);
                            }
                        }}
                        className={`text-xs sm:text-sm font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out ${
                            isIntervalMode 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }`}
                        title={isIntervalMode ? 'Intervallum mód kikapcsolása' : 'Intervallum kiválasztása (pl. nyaralás tervezése)'}
                    >
                        <i className={`fas ${isIntervalMode ? 'fa-times' : 'fa-calendar-alt'} mr-2`}></i>
                        {isIntervalMode ? 'Mégse' : 'Intervallum'}
                    </button>
                </div>
                <button
                    onClick={() => handleNavigate(1)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Következő hét
                </button>
            </div>

            <div className={`grid ${currentView === 'weekdays-only' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-7'} gap-4 relative`}>
                {daysToDisplay.map(day => {
                    // Helyi időzónában formázzuk a dátumot (ne UTC-ben)
                    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                    const isHovered = hoveredDay === dayKey;
                    
                    // Ellenőrizzük, hogy ez a nap az intervallum tartományában van-e
                    // Ha van vég dátum, azt használjuk, ha nincs, de van hovered nap, akkor azt használjuk előnézetként
                    const previewEndDate = intervalEndDate || (isIntervalMode && intervalStartDate && hoveredDayInInterval ? hoveredDayInInterval : null);
                    const effectiveStart = intervalStartDate;
                    const effectiveEnd = previewEndDate;
                    
                    const isInInterval = isIntervalMode && effectiveStart && effectiveEnd && 
                        dayKey >= Math.min(effectiveStart, effectiveEnd) && dayKey <= Math.max(effectiveStart, effectiveEnd);
                    const isIntervalStart = isIntervalMode && effectiveStart && dayKey === effectiveStart;
                    const isIntervalEnd = isIntervalMode && effectiveEnd && dayKey === effectiveEnd;
                    const isIntervalCandidate = isIntervalMode && !intervalStartDate;
                    
                    return (
                    <div 
                        key={dayKey} 
                        className={`bg-gray-50 p-4 rounded-lg shadow-sm border flex flex-col relative transition-all duration-200 ${
                            isInInterval 
                                ? 'bg-blue-100 border-blue-400 border-2' 
                                : isIntervalStart || isIntervalEnd
                                ? 'bg-blue-200 border-blue-500 border-2'
                                : 'border-gray-200'
                        }`}
                        onMouseEnter={() => {
                            if (!isIntervalMode) {
                                setHoveredDay(dayKey);
                            } else if (isIntervalMode && intervalStartDate && !intervalEndDate) {
                                // Intervallum módban, ha van kezdő dátum, de nincs vég dátum, mutassuk az előnézetet
                                setHoveredDayInInterval(dayKey);
                            }
                        }}
                        onMouseLeave={() => {
                            if (!isIntervalMode) {
                                setHoveredDay(null);
                            } else if (isIntervalMode) {
                                setHoveredDayInInterval(null);
                            }
                        }}
                    >
                        {/* Plusz gomb - csak hover esetén, ha nincs intervallum mód, jobb felső sarokban */}
                        {isHovered && !isIntervalMode && (
                            <button
                                onClick={() => {
                                    // Az esemény hozzáadó ablak megnyitása a kiválasztott nappal
                                    const eventData = {
                                        date: dayKey,
                                        recurrenceType: 'none'
                                    };
                                    onAddEvent(eventData);
                                }}
                                className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 z-10"
                                title="Esemény hozzáadása erre a napra"
                            >
                                <i className="fas fa-plus text-sm"></i>
                            </button>
                        )}
                        
                        {/* Intervallum gomb - csak intervallum módban */}
                        {isIntervalMode && (
                            <button
                                onClick={() => {
                                    if (!intervalStartDate) {
                                        // Első nap kiválasztása
                                        setIntervalStartDate(dayKey);
                                        setIntervalEndDate(null);
                                    } else if (intervalStartDate && !intervalEndDate) {
                                        // Második nap kiválasztása - intervallum zárása
                                        const start = intervalStartDate;
                                        const end = dayKey;
                                        
                                        // Biztosítjuk, hogy a kezdő dátum korábbi legyen
                                        const finalStart = start <= end ? start : end;
                                        const finalEnd = start <= end ? end : start;
                                        
                                        setIntervalEndDate(finalEnd);
                                        
                                        // Esemény hozzáadó ablak megnyitása
                                        const eventData = {
                                            startDate: finalStart,
                                            endDate: finalEnd,
                                            recurrenceType: 'daily' // Intervallum esetén napi ismétlődés
                                        };
                                        
                                        onAddEvent(eventData);
                                        
                                        // Intervallum mód kikapcsolása
                                        setIsIntervalMode(false);
                                        setIntervalStartDate(null);
                                        setIntervalEndDate(null);
                                    }
                                }}
                                className={`absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 z-10 ${
                                    isIntervalStart || isIntervalCandidate
                                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                        : isInInterval
                                        ? 'bg-blue-400 hover:bg-blue-500 text-white'
                                        : 'bg-gray-400 hover:bg-gray-500 text-white opacity-60'
                                }`}
                                title={
                                    !intervalStartDate 
                                        ? 'Kezdő dátum kiválasztása' 
                                        : intervalStartDate === dayKey
                                        ? 'Kezdő dátum (kattints másik napra a befejezéshez)'
                                        : 'Vég dátum kiválasztása'
                                }
                            >
                                <i className={`fas ${!intervalStartDate ? 'fa-calendar-plus' : isIntervalStart ? 'fa-calendar-check' : 'fa-calendar'} text-sm`}></i>
                            </button>
                        )}
                        <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
                            {day.toLocaleDateString('hu-HU', { weekday: 'short' })} <br />
                            <span className="text-sm font-normal text-gray-600">{day.toLocaleDateString('hu-HU', { month: 'numeric', day: 'numeric' })}</span>
                        </h3>
                        <div className="flex-grow space-y-2">
                            {eventsForDisplay
                                .filter(event => {
                                    // A displayDate lehet Date objektum vagy string
                                    const eventDate = event.displayDate instanceof Date 
                                        ? new Date(event.displayDate.getTime()) 
                                        : new Date(event.displayDate);
                                    const filterDate = new Date(day);
                                    // Mindkét dátumot ugyanúgy normalizáljuk (00:00:00) helyi időzónában
                                    eventDate.setHours(0, 0, 0, 0);
                                    filterDate.setHours(0, 0, 0, 0);
                                    // Dátum stringekkel hasonlítjuk össze, hogy elkerüljük az időzóna problémákat
                                    const eventDateStr = eventDate.toISOString().split('T')[0];
                                    const filterDateStr = filterDate.toISOString().split('T')[0];
                                    return eventDateStr === filterDateStr;
                                })
                                .map(event => (
                                    <div
                                        key={event.id}
                                        className={`p-3 rounded-lg shadow-sm border ${
                                            event.status === 'cancelled' ? 'bg-red-100 border-red-300 text-red-800 line-through' :
                                            event.status === 'deleted' ? 'bg-gray-200 border-gray-400 text-gray-600 opacity-70' :
                                            event.status === 'completed' ? '' :
                                            ''
                                        }`}
                                        style={event.status !== 'cancelled' && event.status !== 'deleted' ? {
                                            backgroundColor: (() => {
                                                // Ha event color priority és van event.color, azt használjuk
                                                if (colorPriority === 'event' && event.color) {
                                                    return `${event.color}20`;
                                                }
                                                // Különben a tag színét használjuk (jelenlegi logika)
                                                if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                    if (currentUserMember.color) {
                                                        return `${currentUserMember.color}20`;
                                                    }
                                                }
                                                const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                if (assignedMember?.color) {
                                                    return `${assignedMember.color}20`;
                                                }
                                                return '#D1FAE5'; // Alapértelmezett zöld
                                            })(),
                                            borderColor: (() => {
                                                // Ha event color priority és van event.color, azt használjuk
                                                if (colorPriority === 'event' && event.color) {
                                                    return `${event.color}60`;
                                                }
                                                // Különben a tag színét használjuk (jelenlegi logika)
                                                if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                    if (currentUserMember.color) {
                                                        return `${currentUserMember.color}60`;
                                                    }
                                                }
                                                const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                if (assignedMember?.color) {
                                                    return `${assignedMember.color}60`;
                                                }
                                                return '#6EE7B7'; // Alapértelmezett zöld
                                            })(),
                                            color: (() => {
                                                // Ha event color priority és van event.color, azt használjuk
                                                if (colorPriority === 'event' && event.color) {
                                                    return event.color;
                                                }
                                                // Különben a tag színét használjuk (jelenlegi logika)
                                                if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                    if (currentUserMember.color) {
                                                        return currentUserMember.color;
                                                    }
                                                }
                                                const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                if (assignedMember?.color) {
                                                    return assignedMember.color;
                                                }
                                                return '#065F46'; // Alapértelmezett zöld szöveg
                                            })()
                                        } : {}}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold">
                                                {event.name}
                                            </p>
                                            {event.isRecurringOccurrence && (
                                                <p className="text-xs text-gray-500">(ismétlődő)</p>
                                            )}
                                            <p className="text-sm">{event.time}{event.endTime && ` - ${event.endTime}`} {event.location && `- ${event.location}`}</p>
                                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                            {event.showAvatar !== false && (() => {
                                                // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                    const avatar = currentUserMember.avatar && currentUserMember.avatar.trim() !== '' ? currentUserMember.avatar : null;
                                                    return avatar ? (
                                                        <span className="text-base flex-shrink-0">{avatar}</span>
                                                    ) : null;
                                                }
                                                const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                const avatar = assignedMember?.avatar && assignedMember.avatar.trim() !== '' ? assignedMember.avatar : null;
                                                return avatar ? (
                                                    <span className="text-base flex-shrink-0">{avatar}</span>
                                                ) : null;
                                            })()}
                                                <span>{(() => {
                                                    // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                    if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                        return currentUserMember.name || userDisplayName || 'Nincs hozzárendelve';
                                                    }
                                                    return familyMembers.find(m => m.id === event.assignedTo)?.name || 'Nincs hozzárendelve';
                                                })()}</span>
                                            </p>
                                        </div>
                                        {event.status === 'cancelled' && event.cancellationReason && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">
                                                ❌ Lemondás oka: {event.cancellationReason}
                                            </p>
                                        )}
                                        {event.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic">Megjegyzés: {event.notes}</p>
                                        )}
                                        {event.status === 'completed' && event.assignedTo && (() => {
                                            // Ellenőrizzük, hogy a currentUserMember-e van hozzárendelve
                                            const isAssignedToCurrentUser = currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`));
                                            const assignedMemberForCheck = isAssignedToCurrentUser ? currentUserMember : familyMembers.find(m => m.id === event.assignedTo);
                                            const isChild = assignedMemberForCheck?.isChild || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}` && currentUserMember?.isChild);
                                            if (!isChild) return null;
                                            return (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                                                        <i className="fas fa-check-circle"></i>
                                                        Teljesítve
                                                    </span>
                                                    {!isChildMode && (
                                                        <button
                                                            onClick={() => onStatusChange(event, 'active')}
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                            title="Visszaállítás"
                                                        >
                                                            <i className="fas fa-undo h-3 w-3 inline-block"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => onEditEvent(event)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                title="Szerkesztés"
                                            >
                                                <i className="fas fa-edit h-4 w-4 inline-block"></i>
                                            </button>
                                            {!isChildMode && event.status !== 'cancelled' && event.status !== 'completed' && event.assignedTo && (() => {
                                                // Ellenőrizzük, hogy a currentUserMember-e van hozzárendelve
                                                const isAssignedToCurrentUser = currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`));
                                                const assignedMemberForCheck = isAssignedToCurrentUser ? currentUserMember : familyMembers.find(m => m.id === event.assignedTo);
                                                const isChild = assignedMemberForCheck?.isChild || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}` && currentUserMember?.isChild);
                                                if (!isChild) return null;
                                                return (
                                                    <button
                                                        onClick={() => onStatusChange(event, 'completed')}
                                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        title="Teljesítve"
                                                    >
                                                        <i className="fas fa-check-circle h-4 w-4 inline-block"></i>
                                                    </button>
                                                );
                                            })()}
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
                    );
                })}
            </div>

            <button
                onClick={onAddEvent}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
            >
                <i className="fas fa-plus"></i>
                Esemény hozzáadása
            </button>
        </div>
    );
};

export default CalendarView; 