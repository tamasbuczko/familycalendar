import React from 'react';
import EventModal from './EventModal.jsx';
import FamilyMemberEditModal from './FamilyMemberEditModal.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import InviteModal from './InviteModal.jsx';
import ChildLoginModal from './ChildLoginModal.jsx';
import ParentPinModal from './ParentPinModal.jsx';
import SettingsPage from './SettingsPage.jsx';
import UserProfileModal from './UserProfileModal.jsx';

const ModalsContainer = ({
    // Event modal
    showEventModal,
    editingEvent,
    onSaveEvent,
    onCloseEventModal,
    familyMembers,
    showTemporaryMessage,
    
    // Family member modal
    showFamilyModal,
    onAddFamilyMember,
    onCloseFamilyModal,
    familyMemberLoading,
    editingFamilyMember,
    familyMemberType,
    
    // Confirm modal
    showConfirmModal,
    confirmMessage,
    onConfirm,
    onCancelConfirm,
    
    // Invite modal
    showInviteModal,
    onCloseInviteModal,
    onSendInvite,
    familyName,
    inviteLoading,
    
    
    // Child login modal
    showChildLoginModal,
    onCloseChildLoginModal,
    onChildLogin,
    childLoginLoading,
    
    // Parent PIN modal
    showParentPinModal,
    onCloseParentPinModal,
    onParentPinVerification,
    parentPinLoading,
    
    // Settings modal
    showSettingsModal,
    onCloseSettingsModal,
    onSaveParentPin,
    currentParentPin,
    settingsLoading,
    
    // User profile modal
    showUserProfileModal,
    onCloseUserProfileModal,
    onSaveUserProfile,
    userEmail,
    userDisplayName,
    userProfileLoading,
    
    // Child mode props
    isChildMode,
    childSession
}) => {
    return (
        <>
            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    event={editingEvent}
                    onSave={onSaveEvent}
                    onClose={onCloseEventModal}
                    familyMembers={familyMembers}
                    showTemporaryMessage={showTemporaryMessage}
                />
            )}

            {/* Family Member Modal */}
            {showFamilyModal && (
                <FamilyMemberEditModal
                    onClose={onCloseFamilyModal}
                    onSave={onAddFamilyMember}
                    loading={familyMemberLoading}
                    editingMember={editingFamilyMember}
                    memberType={familyMemberType}
                />
            )}

            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmModal
                    message={confirmMessage}
                    onConfirm={onConfirm}
                    onCancel={onCancelConfirm}
                />
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteModal
                    onClose={onCloseInviteModal}
                    onSendInvite={onSendInvite}
                    familyName={familyName}
                    loading={inviteLoading}
                />
            )}


            {/* Child Login Modal */}
            {showChildLoginModal && (
                <ChildLoginModal
                    onClose={onCloseChildLoginModal}
                    onChildLogin={onChildLogin}
                    familyMembers={familyMembers}
                    loading={childLoginLoading}
                />
            )}

            {/* Parent PIN Modal */}
            {showParentPinModal && (
                <ParentPinModal
                    onClose={onCloseParentPinModal}
                    onPinVerified={onParentPinVerification}
                    loading={parentPinLoading}
                />
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <SettingsPage
                    onClose={onCloseSettingsModal}
                    onSaveParentPin={onSaveParentPin}
                    currentParentPin={currentParentPin}
                    loading={settingsLoading}
                />
            )}

            {/* User Profile Modal */}
            {showUserProfileModal && (() => {
                console.log("ModalsContainer: Rendering UserProfileModal", {
                    isChildMode,
                    childSession,
                    userEmail,
                    userDisplayName
                });
                return (
                <UserProfileModal
                    onClose={onCloseUserProfileModal}
                    onSaveProfile={onSaveUserProfile}
                    userEmail={isChildMode ? '' : userEmail}
                    displayName={isChildMode ? (childSession?.childName || '') : userDisplayName}
                    loading={userProfileLoading}
                    isChildMode={isChildMode}
                    childSession={childSession}
                />
                );
            })()}
        </>
    );
};

export default ModalsContainer;
