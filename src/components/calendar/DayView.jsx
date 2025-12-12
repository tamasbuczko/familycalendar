import React from 'react';

const DayView = ({ date, events, familyMembers, onEditEvent, onDeleteEvent, onStatusChange, userId, userDisplayName, isChildMode = false }) => {
    // Órák generálása (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Esemény órájának kinyerése (HH:MM formátumból)
    const getEventHour = (timeString) => {
        if (!timeString) return null;
        const [hours] = timeString.split(':');
        return parseInt(hours, 10);
    };

    // Esemény perceinek kinyerése
    const getEventMinutes = (timeString) => {
        if (!timeString) return 0;
        const [, minutes] = timeString.split(':');
        return parseInt(minutes || 0, 10);
    };

    // Esemény időtartamának kiszámítása percekben
    const getEventDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 60; // Alapértelmezett 1 óra
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        return Math.max(30, endTotal - startTotal); // Minimum 30 perc
    };

    // Események rendezése idő szerint
    const sortedEvents = [...events].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
    });

    // Események csoportosítása óránként
    const eventsByHour = {};
    sortedEvents.forEach(event => {
        const hour = getEventHour(event.time);
        if (hour !== null) {
            if (!eventsByHour[hour]) {
                eventsByHour[hour] = [];
            }
            eventsByHour[hour].push(event);
        }
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
                {hours.map(hour => {
                    const hourEvents = eventsByHour[hour] || [];
                    const hourString = `${hour.toString().padStart(2, '0')}:00`;

                    const hasEvents = hourEvents.length > 0;
                    
                    return (
                        <div key={hour} className={`flex ${hasEvents ? 'min-h-[80px]' : 'min-h-[40px]'} hover:bg-gray-50 transition-colors`}>
                            {/* Óra címke */}
                            <div className="w-20 md:w-24 flex-shrink-0 flex items-start justify-center pt-2 px-2 border-r border-gray-200 bg-gray-50">
                                <span className="text-sm font-semibold text-gray-700">
                                    {hourString}
                                </span>
                            </div>

                            {/* Események */}
                            <div className={`flex-1 ${hasEvents ? 'p-2 space-y-2' : 'py-1'}`}>
                                {hasEvents ? (
                                    hourEvents.map(event => {
                                        const eventMinutes = getEventMinutes(event.time);
                                        const duration = event.endTime 
                                            ? getEventDuration(event.time, event.endTime) 
                                            : 60;
                                        const heightPercent = Math.min(100, (duration / 60) * 100);


                                        return (
                                            <div
                                                key={event.id}
                                                className={`p-2 rounded-lg shadow-sm border text-sm ${
                                                    event.status === 'cancelled' 
                                                        ? 'bg-red-100 border-red-300 text-red-800 line-through' 
                                                        : event.status === 'deleted' 
                                                        ? 'bg-gray-200 border-gray-400 text-gray-600 opacity-70'
                                                        : event.status === 'completed'
                                                        ? ''
                                                        : ''
                                                }`}
                                                style={{
                                                    minHeight: `${Math.max(60, heightPercent)}px`,
                                                    ...(event.status !== 'cancelled' && event.status !== 'deleted' ? {
                                                        backgroundColor: (() => {
                                                            // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                            if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                                if (currentUserMember.color) {
                                                                    return `${currentUserMember.color}20`;
                                                                }
                                                            }
                                                            const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                            if (assignedMember?.color) {
                                                                return `${assignedMember.color}20`;
                                                            }
                                                            return '#DBEAFE'; // Alapértelmezett kék
                                                        })(),
                                                        borderColor: (() => {
                                                            // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                            if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                                if (currentUserMember.color) {
                                                                    return `${currentUserMember.color}60`;
                                                                }
                                                            }
                                                            const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                            if (assignedMember?.color) {
                                                                return `${assignedMember.color}60`;
                                                            }
                                                            return '#93C5FD'; // Alapértelmezett kék
                                                        })(),
                                                        color: (() => {
                                                            // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                            if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                                if (currentUserMember.color) {
                                                                    return currentUserMember.color;
                                                                }
                                                            }
                                                            const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                            if (assignedMember?.color) {
                                                                return assignedMember.color;
                                                            }
                                                            return '#1E40AF'; // Alapértelmezett kék szöveg
                                                        })()
                                                    } : {})
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm">
                                                            {event.time}
                                                            {event.endTime && ` - ${event.endTime}`}
                                                        </p>
                                                        <div className="flex-1 min-w-0 mt-1">
                                                            <p className="font-medium">
                                                                {event.name}
                                                            </p>
                                                            {event.isRecurringOccurrence && (
                                                                <p className="text-xs text-gray-500">(ismétlődő)</p>
                                                            )}
                                                            {event.location && (
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    <i className="fas fa-map-marker-alt mr-1"></i>
                                                                    {event.location}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                                {event.showAvatar !== false && (() => {
                                                                    // Először nézzük meg, hogy a currentUserMember-e van hozzárendelve
                                                                    if (currentUserMember && (event.assignedTo === currentUserMember.id || (event.assignedTo && event.assignedTo.startsWith('user_') && userId && event.assignedTo === `user_${userId}`))) {
                                                                        return currentUserMember.avatar ? (
                                                                            <span className="text-base flex-shrink-0">{currentUserMember.avatar}</span>
                                                                        ) : <span className="text-base flex-shrink-0">👤</span>;
                                                                    }
                                                                    const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                                                                    return assignedMember?.avatar ? (
                                                                        <span className="text-base flex-shrink-0">{assignedMember.avatar}</span>
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
                                                                   <p className="text-xs text-gray-500 mt-1 italic">
                                                                       {event.notes}
                                                                   </p>
                                                               )}
                                                               {event.status === 'completed' && event.assignedTo && (
                                                                   <div className="mt-1 flex items-center gap-2">
                                                                       <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                                                                           <i className="fas fa-check-circle"></i>
                                                                           Teljesítve
                                                                       </span>
                                                                       {!isChildMode && (
                                                                           <button
                                                                               onClick={() => onStatusChange(event, 'active')}
                                                                               className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                                                                               title="Visszaállítás"
                                                                           >
                                                                               <i className="fas fa-undo"></i>
                                                                           </button>
                                                                       )}
                                                                   </div>
                                                               )}
                                                    </div>
                                                    <div className="flex gap-1 ml-2 items-center">
                                                        <button
                                                            onClick={() => onEditEvent(event)}
                                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                                            title="Szerkesztés"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        {!isChildMode && event.status !== 'cancelled' && event.status !== 'completed' && event.assignedTo && (
                                                            <button
                                                                onClick={() => onStatusChange(event, 'completed')}
                                                                className="text-green-600 hover:text-green-800 text-xs"
                                                                title="Teljesítve"
                                                            >
                                                                <i className="fas fa-check-circle"></i>
                                                            </button>
                                                        )}
                                                        {event.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => onStatusChange(event, 'cancelled')}
                                                                className="text-red-600 hover:text-red-800 text-xs"
                                                                title="Lemondás"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        )}
                                                        {event.status !== 'deleted' && (
                                                            <button
                                                                onClick={() => onDeleteEvent(event)}
                                                                className="text-gray-600 hover:text-gray-800 text-xs"
                                                                title="Törlés"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DayView;

