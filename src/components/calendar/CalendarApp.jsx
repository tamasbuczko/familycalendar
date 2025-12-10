import React, { useEffect } from 'react';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';

// Import the new smaller components
import CalendarHeader from './CalendarHeader.jsx';
import FamilyMembersSection from './FamilyMembersSection.jsx';
import CalendarControls from './CalendarControls.jsx';
import ModalsContainer from './ModalsContainer.jsx';
import MessageDisplay from './MessageDisplay.jsx';
import WeatherWidget from './WeatherWidget.jsx';

// Import the new hooks
import { useCalendarState } from './CalendarStateManager.jsx';
import { useCalendarEventHandlers } from './CalendarEventHandlers.jsx';

// A naptár alkalmazás logikáját tartalmazó komponens - most egyszerűsített
const CalendarApp = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth, setUserFamilyId } = useFirebase();
    
    // State kezelés a hook-kal
    const state = useCalendarState(db, userId, userFamilyId);
    
    // Értesítések kezelése
    const notifications = useNotifications(userId);
    
    // Automatikus FCM token regisztráció bejelentkezéskor
    useEffect(() => {
        if (userId && notifications.isSupported && notifications.permission === 'default') {
            // Automatikusan kérjük az értesítési engedélyeket
            notifications.requestPermission();
        }
    }, [userId, notifications.isSupported, notifications.permission]);
    
    // Event handler függvények a hook-kal
    const handlers = useCalendarEventHandlers(db, userId, userFamilyId, state, {
        setChildLoading: state.setChildLoading,
        setInviteLoading: state.setInviteLoading,
        setChildLoginLoading: state.setChildLoginLoading,
        setChildSession: state.setChildSession,
        setSettingsLoading: state.setSettingsLoading,
        setParentPin: state.setParentPin,
        setParentPinLoading: state.setParentPinLoading,
        setFamilyData: state.setFamilyData,
        resetSettingsModal: state.resetSettingsModal,
        setUserProfileLoading: state.setUserProfileLoading,
        resetUserProfileModal: state.resetUserProfileModal,
        setUserDisplayName: state.setUserDisplayName
    });

    // Ellenőrizzük, hogy child módban vagyunk-e
    const isChildMode = !!state.childSession;
    
    // Child logout funkció - szülői PIN bekérés
    const handleChildLogout = () => {
        state.setShowParentPinModal(true);
    };

    // Szülői PIN ellenőrzés
    const handleParentPinVerification = async (enteredPin) => {
        const success = await handlers.handleParentPinVerification(enteredPin);
        if (success) {
            state.resetParentPinModal();
        }
    };

    // Settings modal megnyitása
    const handleSettingsClick = () => {
        state.setShowSettingsModal(true);
    };

    // Event handler functions for the smaller components
    const handleAddMember = () => {
        state.setEditingFamilyMember(null);
        state.setFamilyMemberType('family');
        state.setShowFamilyModal(true);
    };

    const handleEditMember = (member) => {
        state.setEditingFamilyMember(member);
        // Meghatározzuk a típust a member alapján
        if (member.isChild) {
            state.setFamilyMemberType('child');
        } else if (member.email) {
            state.setFamilyMemberType('invited');
        } else {
            state.setFamilyMemberType('family');
        }
        state.setShowFamilyModal(true);
    };

    const handleDeleteMember = (memberId, memberName) => {
        state.setConfirmAction(() => () => handlers.handleDeleteFamilyMember(memberId, memberName));
        state.setConfirmMessage(`Biztosan törölni szeretné a családtagot: "${memberName}"?`);
        state.setShowConfirmModal(true);
    };

    const handleAddEvent = () => {
        state.setEditingEvent(null);
        state.setShowEventModal(true);
    };

    const handleEditEvent = (event) => {
        state.setEditingEvent(event);
        state.setShowEventModal(true);
    };

    const handleDeleteEventConfirm = (event) => {
        console.log("CalendarApp: handleDeleteEventConfirm called", { eventName: event.name });
        // Először bezárjuk a modalt, ha van nyitva
        state.resetConfirmModal();
        state.setConfirmAction(() => () => {
            console.log("CalendarApp: confirmAction called for delete");
            handlers.handleDeleteEvent(event);
        });
        state.setConfirmMessage(`Biztosan törölni szeretné az eseményt: "${event.name}"?`);
        state.setShowCancellationReason(false);
        state.setShowConfirmModal(true);
        console.log("CalendarApp: Delete confirm modal should be shown now");
    };

    const handleStatusChangeConfirm = (event, newStatus) => {
        console.log("CalendarApp: handleStatusChangeConfirm called", { eventName: event.name, newStatus });
        
        // Először bezárjuk a modalt, ha van nyitva
        state.resetConfirmModal();
        
        // Ha lemondás, akkor a cancellationReason-t is kérjük
        if (newStatus === 'cancelled') {
            // Tároljuk az event-et, hogy az onConfirm-ben elérhető legyen
            state.setEditingEvent(event);
            // Dummy confirmAction, mert az onConfirm-ben közvetlenül hívjuk a handleSaveEvent-et
            state.setConfirmAction(() => () => {
                console.log("CalendarApp: confirmAction dummy function called");
            });
            state.setConfirmMessage(`Biztosan lemondja az eseményt: "${event.name}"?`);
            state.setShowCancellationReason(true);
        } else {
            state.setConfirmAction(() => () => {
                console.log("CalendarApp: confirmAction called for active status");
                handlers.handleChangeEventStatus(event, newStatus, '');
            });
            state.setConfirmMessage(`Biztosan aktívvá teszi az eseményt: "${event.name}"?`);
            state.setShowCancellationReason(false);
        }
        state.setShowConfirmModal(true);
        console.log("CalendarApp: Confirm modal should be shown now");
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <CalendarHeader 
                familyName={state.familyData?.name}
                onFamilySelectorClick={() => setUserFamilyId(null)}
                onChildLoginClick={() => state.setShowChildLoginModal(true)}
                isChildMode={isChildMode}
                childSession={state.childSession}
                onChildLogout={handleChildLogout}
                onSettingsClick={handleSettingsClick}
                onProfileClick={() => state.setShowUserProfileModal(true)}
                userEmail={auth.currentUser?.email}
                userDisplayName={state.userDisplayName}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FamilyMembersSection
                    familyMembers={state.familyMembers}
                    onAddMember={handleAddMember}
                    onInviteMember={() => state.setShowInviteModal(true)}
                    onChildProfile={() => {
                        console.log("CalendarApp: Child profile button clicked, setting showFamilyModal to true");
                        state.setEditingFamilyMember(null);
                        state.setFamilyMemberType('child');
                        state.setShowFamilyModal(true);
                    }}
                    onEditMember={handleEditMember}
                    onDeleteMember={handleDeleteMember}
                    isChildMode={isChildMode}
                />

                <CalendarControls
                    currentDate={state.currentDate}
                    setCurrentDate={state.setCurrentDate}
                    events={state.events}
                    familyMembers={state.familyMembers}
                    currentView={state.currentView}
                    setCurrentView={state.setCurrentView}
                    onAddEvent={handleAddEvent}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEventConfirm}
                    onStatusChange={handleStatusChangeConfirm}
                />

                {/* Időjárás widget */}
                <div className="mt-6">
                    <WeatherWidget 
                        location="Budapest,HU"
                        userId={userId}
                        familyData={state.familyData}
                        onWeatherUpdate={(weather) => {
                            console.log('Weather updated:', weather);
                        }}
                    />
                </div>
            </div>

            <ModalsContainer
                // Event modal
                showEventModal={state.showEventModal}
                editingEvent={state.editingEvent}
                onSaveEvent={handlers.handleSaveEvent}
                onCloseEventModal={state.resetEventModal}
                familyMembers={state.familyMembers}
                showTemporaryMessage={state.showTemporaryMessage}
                userId={userId}
                onStatusChange={handleStatusChangeConfirm}
                
                // Family member modal
                showFamilyModal={state.showFamilyModal}
                onAddFamilyMember={handlers.handleSaveFamilyMember}
                onCloseFamilyModal={state.resetFamilyModal}
                familyMemberLoading={state.familyMemberLoading}
                editingFamilyMember={state.editingFamilyMember}
                familyMemberType={state.familyMemberType}
                
                // Confirm modal
                showConfirmModal={state.showConfirmModal}
                confirmMessage={state.confirmMessage}
                showCancellationReason={state.showCancellationReason}
                onConfirm={(cancellationReason) => {
                    console.log("CalendarApp: onConfirm called with cancellationReason", cancellationReason);
                    if (state.confirmAction) {
                        // Ha showCancellationReason igaz, akkor lemondás, és közvetlenül hívjuk a handleSaveEvent-et (ugyanúgy, mint szerkesztéskor)
                        if (state.showCancellationReason && state.editingEvent) {
                            const event = state.editingEvent;
                            // Ugyanazt a logikát használjuk, mint az EventModal-ban
                            if (event.isRecurringOccurrence && event.originalEventId) {
                                // Ismétlődő esemény előfordulása - kivételként mentjük
                                const eventData = {
                                    id: event.id,
                                    originalEventId: event.originalEventId,
                                    isRecurringOccurrence: true,
                                    displayDate: event.displayDate,
                                    date: event.date || (event.displayDate ? event.displayDate.toISOString().split('T')[0] : null),
                                    cancellationReason: cancellationReason || '',
                                    status: 'cancelled', // Fontos: beállítjuk a státuszt is
                                    saveAsException: true
                                };
                                console.log("CalendarApp: Saving cancellation reason as exception", eventData);
                                // Frissítjük a state.editingEvent-et, hogy a handleSaveEvent elérje
                                state.setEditingEvent({ ...event, cancellationReason: cancellationReason || '', status: 'cancelled' });
                                handlers.handleSaveEvent(eventData);
                            } else {
                                // Egyszeri esemény
                                const eventData = {
                                    id: event.id,
                                    name: event.name,
                                    time: event.time,
                                    endTime: event.endTime,
                                    location: event.location,
                                    assignedTo: event.assignedTo,
                                    notes: event.notes,
                                    date: event.date,
                                    status: 'cancelled',
                                    cancellationReason: cancellationReason || '',
                                    recurrenceType: event.recurrenceType || 'none',
                                    startDate: event.startDate,
                                    endDate: event.endDate
                                };
                                console.log("CalendarApp: Saving cancellation reason for single event", eventData);
                                handlers.handleSaveEvent(eventData);
                            }
                        } else {
                            // Törlés vagy más művelet esetén
                            const actionFunction = state.confirmAction();
                            if (actionFunction) {
                                actionFunction();
                            }
                        }
                    }
                    state.resetConfirmModal();
                }}
                onCancelConfirm={state.resetConfirmModal}
                
                // Invite modal
                showInviteModal={state.showInviteModal}
                onCloseInviteModal={state.resetInviteModal}
                onSendInvite={handlers.handleSendInvite}
                familyName={state.familyData?.name || 'Család'}
                inviteLoading={state.inviteLoading}
                
                
                // Child login modal
                showChildLoginModal={state.showChildLoginModal}
                onCloseChildLoginModal={state.resetChildLoginModal}
                onChildLogin={handlers.handleChildLogin}
                childLoginLoading={state.childLoginLoading}
                
                // Parent PIN modal
                showParentPinModal={state.showParentPinModal}
                onCloseParentPinModal={state.resetParentPinModal}
                onParentPinVerification={handleParentPinVerification}
                parentPinLoading={state.parentPinLoading}
                
                // Settings modal
                showSettingsModal={state.showSettingsModal}
                onCloseSettingsModal={state.resetSettingsModal}
                onSaveParentPin={handlers.handleSaveParentPin}
                onSaveFamilyData={handlers.handleSaveFamilyData}
                currentParentPin={state.parentPin}
                settingsLoading={state.settingsLoading}
                
                // User profile modal
                showUserProfileModal={state.showUserProfileModal}
                onCloseUserProfileModal={state.resetUserProfileModal}
                onSaveUserProfile={handlers.handleSaveUserProfile}
                userEmail={auth.currentUser?.email}
                userDisplayName={state.userDisplayName || auth.currentUser?.displayName}
                userProfileLoading={state.userProfileLoading}
                familyData={state.familyData}
                
                // Child mode props
                isChildMode={isChildMode}
                childSession={state.childSession}
            />

            <MessageDisplay message={state.message} />
        </div>
    );
};

export default CalendarApp; 