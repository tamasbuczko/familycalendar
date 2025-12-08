import React from 'react';
import { useFirebase } from '../../context/FirebaseContext.jsx';

// Import the new smaller components
import CalendarHeader from './CalendarHeader.jsx';
import FamilyMembersSection from './FamilyMembersSection.jsx';
import CalendarControls from './CalendarControls.jsx';
import ModalsContainer from './ModalsContainer.jsx';
import MessageDisplay from './MessageDisplay.jsx';

// Import the new hooks
import { useCalendarState } from './CalendarStateManager.jsx';
import { useCalendarEventHandlers } from './CalendarEventHandlers.jsx';

// A naptár alkalmazás logikáját tartalmazó komponens - most egyszerűsített
const CalendarApp = ({ onLogout }) => {
    const { db, userId, userFamilyId, auth, setUserFamilyId } = useFirebase();
    
    // State kezelés a hook-kal
    const state = useCalendarState(db, userId, userFamilyId);
    
    // Event handler függvények a hook-kal
    const handlers = useCalendarEventHandlers(db, userId, userFamilyId, state, {
        setChildLoading: state.setChildLoading,
        setInviteLoading: state.setInviteLoading,
        setChildLoginLoading: state.setChildLoginLoading,
        setChildSession: state.setChildSession,
        setSettingsLoading: state.setSettingsLoading,
        setParentPin: state.setParentPin,
        setParentPinLoading: state.setParentPinLoading,
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
        state.setConfirmAction(() => () => handlers.handleDeleteEvent(event));
        state.setConfirmMessage(`Biztosan törölni szeretné az eseményt: "${event.name}"?`);
        state.setShowConfirmModal(true);
    };

    const handleStatusChangeConfirm = (event, newStatus) => {
        state.setConfirmAction(() => () => handlers.handleChangeEventStatus(event, newStatus));
        state.setConfirmMessage(`Biztosan ${newStatus === 'cancelled' ? 'lemondja' : 'aktívvá teszi'} az eseményt: "${event.name}"?`);
        state.setShowConfirmModal(true);
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
            </div>

            <ModalsContainer
                // Event modal
                showEventModal={state.showEventModal}
                editingEvent={state.editingEvent}
                onSaveEvent={handlers.handleSaveEvent}
                onCloseEventModal={state.resetEventModal}
                familyMembers={state.familyMembers}
                showTemporaryMessage={state.showTemporaryMessage}
                
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
                    onConfirm={() => {
                    if (state.confirmAction) {
                        state.confirmAction();
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
                currentParentPin={state.parentPin}
                settingsLoading={state.settingsLoading}
                
                // User profile modal
                showUserProfileModal={state.showUserProfileModal}
                onCloseUserProfileModal={state.resetUserProfileModal}
                onSaveUserProfile={handlers.handleSaveUserProfile}
                userEmail={auth.currentUser?.email}
                userDisplayName={state.userDisplayName || auth.currentUser?.displayName}
                userProfileLoading={state.userProfileLoading}
                
                // Child mode props
                isChildMode={isChildMode}
                childSession={state.childSession}
            />

            <MessageDisplay message={state.message} />
        </div>
    );
};

export default CalendarApp; 