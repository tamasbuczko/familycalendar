import React from 'react';
import CalendarView from './CalendarView.jsx';
import VoiceEventInput from '../ui/VoiceEventInput.jsx';

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
    isChildMode = false,
    colorPriority = 'tag',
    familyId,
    onEventCreated,
    onError
}) => {
    // Szűrés a kiválasztott családtag szerint
    let filteredEvents = selectedMemberId 
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
    
    // Láthatósági szűrés
    filteredEvents = filteredEvents.filter(event => {
        const visibility = event.visibility || 'family'; // Alapértelmezett: család
        
        // Ha nincs visibility mező vagy 'family', mindenki láthatja
        if (visibility === 'family') {
            return true;
        }
        
        // Ha 'only_me', csak a létrehozó láthatja
        if (visibility === 'only_me') {
            // Gyerek módban ne jelenítsük meg a "csak én" láthatóságú eseményeket
            if (isChildMode) {
                return false;
            }
            // Csak akkor jelenjen meg, ha van createdBy mező ÉS az megegyezik a jelenlegi userId-vel
            // Ha nincs createdBy mező, akkor ne jelenjen meg senkinek (biztonsági okokból)
            if (!event.createdBy || !userId) {
                return false;
            }
            return event.createdBy === userId;
        }
        
        // Ha 'known_families', még nincs implementálva, de most nem jelenítjük meg
        if (visibility === 'known_families') {
            // Később implementáljuk, amikor az ismerős családok funkció kész lesz
            return false; // Most még nem jelenítjük meg
        }
        
        // Alapértelmezett: ha ismeretlen visibility érték, ne jelenjen meg
        return false;
    });
    
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
                colorPriority={colorPriority}
            />
            
            {/* AI-alapú eseményfelvétel - a naptár alatt */}
            {!isChildMode && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        <i className="fas fa-robot mr-2 text-blue-600"></i>
                        AI-alapú eseményfelvétel
                    </h2>
                    <VoiceEventInput
                        familyId={familyId}
                        familyMembers={familyMembers}
                        userId={userId}
                        currentUserMember={currentUserMember}
                        onEventCreated={onEventCreated}
                        onError={onError}
                    />
                </div>
            )}
        </div>
    );
};

export default CalendarControls;
