import React, { useEffect } from 'react';
import EventModal from './EventModal.jsx';
import FamilyMemberEditModal from './FamilyMemberEditModal.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import InviteModal from './InviteModal.jsx';
import ChildLoginModal from './ChildLoginModal.jsx';
import ParentPinModal from './ParentPinModal.jsx';
import SettingsScreen from './SettingsScreen.jsx';
import UserProfileModal from './UserProfileModal.jsx';

const ModalsContainer = ({
    // Event modal
    showEventModal,
    editingEvent,
    onSaveEvent,
    onCloseEventModal,
    familyMembers,
    showTemporaryMessage,
    userId,
    onStatusChange,
    
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
    showCancellationReason = false, // Default érték
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
    onSaveFamilyData,
    currentParentPin,
    settingsLoading,
    
    // User profile modal
    showUserProfileModal,
    onCloseUserProfileModal,
    onSaveUserProfile,
    userEmail,
    userDisplayName,
    userProfileLoading,
    currentUserMember,
    
    // Child mode props
    isChildMode,
    childSession,
    
    // Family data
    familyData,
    
    // Database props
    db,
    familyId
}) => {
    // Body scroll kezelése modal megnyitáskor
    useEffect(() => {
        if (showSettingsModal) {
            // Modal megnyitáskor letiltjuk a body scroll-t
            document.body.style.overflow = 'hidden';
        } else {
            // Modal bezáráskor visszaállítjuk a body scroll-t
            document.body.style.overflow = 'unset';
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showSettingsModal]);

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
                    userId={userId}
                    onStatusChange={onStatusChange}
                    userDisplayName={userDisplayName}
                    currentUserMember={currentUserMember}
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
                    showCancellationReason={showCancellationReason}
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

            {/* Settings Screen */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50" style={{overflow: 'hidden'}}>
                    <div className="h-full overflow-y-auto">
                        <SettingsScreen
                        onClose={onCloseSettingsModal}
                        onSaveParentPin={onSaveParentPin}
                        onSaveFamilyData={onSaveFamilyData}
                        currentParentPin={currentParentPin}
                        loading={settingsLoading}
                        userId={userId}
                        familyData={familyData}
                        />
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showUserProfileModal && (() => {
                console.log("ModalsContainer: Rendering UserProfileModal", {
                    isChildMode,
                    childSession,
                    userEmail,
                    userDisplayName,
                    currentUserMember,
                    userId
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
                    familyData={familyData}
                    currentUserMember={currentUserMember}
                    userId={userId}
                    db={db}
                    familyId={familyId}
                />
                );
            })()}
        </>
    );
};

export default ModalsContainer;
