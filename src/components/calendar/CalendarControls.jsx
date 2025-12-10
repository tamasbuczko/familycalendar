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
    userDisplayName
}) => {
    return (
        <div className={`w-full ${currentView === 'day' ? 'max-w-4xl mx-auto' : ''}`}>
            <CalendarView
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                events={events}
                familyMembers={familyMembers}
                currentView={currentView}
                setCurrentView={setCurrentView}
                onAddEvent={onAddEvent}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
                onStatusChange={onStatusChange}
                userId={userId}
                userDisplayName={userDisplayName}
            />
        </div>
    );
};

export default CalendarControls;
