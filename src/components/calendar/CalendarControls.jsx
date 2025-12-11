import React from 'react';
import CalendarView from './CalendarView.jsx';

const CalendarControls = ({
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
    selectedMemberId,
    currentUserMember,
    isChildMode = false
}) => {
    // Szűrés a kiválasztott családtag szerint
    const filteredEvents = selectedMemberId 
        ? events.filter(event => {
            // Ha az esemény hozzá van rendelve a kiválasztott taghoz
            if (event.assignedTo === selectedMemberId) {
                return true;
            }
            // Ha a jelenlegi felhasználó member rekordjára szűrünk, akkor az eseményeket is megjelenítjük,
            // amelyek `user_${userId}` formátumú assignedTo-val rendelkeznek
            if (currentUserMember && selectedMemberId === currentUserMember.id && userId && event.assignedTo === `user_${userId}`) {
                return true;
            }
            return false;
        })
        : events; // Ha nincs kiválasztott tag, minden eseményt mutatunk
    
    return (
        <div className={`w-full ${currentView === 'day' ? 'max-w-4xl mx-auto' : ''}`}>
            <CalendarView
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                events={filteredEvents}
                familyMembers={familyMembers}
                currentView={currentView}
                setCurrentView={setCurrentView}
                onAddEvent={onAddEvent}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
                onStatusChange={onStatusChange}
                userId={userId}
                userDisplayName={userDisplayName}
                currentUserMember={currentUserMember}
                isChildMode={isChildMode}
            />
        </div>
    );
};

export default CalendarControls;
