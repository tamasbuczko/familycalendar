import React, { useState } from 'react';

const FamilyMembersSection = ({ 
    familyMembers, 
    onAddMember, 
    onInviteMember, 
    onChildProfile, 
    onEditMember, 
    onDeleteMember,
    onMemberClick,
    selectedMemberId,
    currentUserMember,
    userId,
    isChildMode = false
}) => {
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-full max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <div className="flex items-center justify-between w-full md:w-auto mb-3 md:mb-0">
                    <h2 className="text-xl font-semibold text-gray-700">Családtagok</h2>
                    {!isChildMode && (
                        <button
                            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                            aria-label="Gombok megjelenítése/elrejtése"
                        >
                            <i className={`fas fa-chevron-${isAccordionOpen ? 'up' : 'down'} text-lg`}></i>
                        </button>
                    )}
                </div>
                {!isChildMode && (
                    <>
                        {/* Desktop gombok - változatlan */}
                        <div className="hidden md:flex flex-row space-x-2">
                            <button
                                onClick={onAddMember}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-plus mr-1"></i>Családtag hozzáadása
                            </button>
                            <button
                                onClick={onInviteMember}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-envelope mr-1"></i>Meghívás
                            </button>
                            <button
                                onClick={() => {
                                    console.log("FamilyMembersSection: Child profile button clicked");
                                    onChildProfile();
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-baby mr-1"></i>Gyerekek
                            </button>
                        </div>
                        
                        {/* Mobil accordion gombok */}
                        {isAccordionOpen && (
                            <div className="md:hidden flex flex-row space-x-2 mt-2">
                                <button
                                    onClick={onAddMember}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-plus mr-1"></i>Családtag hozzáadása
                                </button>
                                <button
                                    onClick={onInviteMember}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-envelope mr-1"></i>Meghívás
                                </button>
                                <button
                                    onClick={() => {
                                        console.log("FamilyMembersSection: Child profile button clicked");
                                        onChildProfile();
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-baby mr-1"></i>Gyerekek
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {/* Jelenlegi felhasználó member rekordja (ha van) */}
                {currentUserMember && (
                    (() => {
                        const memberColor = currentUserMember.color || '#8B5CF6';
                        const memberAvatar = currentUserMember.avatar && currentUserMember.avatar.trim() !== '' ? currentUserMember.avatar : null;
                        const memberId = currentUserMember.id;
                        const isSelected = selectedMemberId === memberId;
                        return (
                            <div key={memberId} className="group relative">
                                <span 
                                    onClick={() => onMemberClick && onMemberClick(memberId)}
                                    className={`text-sm font-medium rounded-full shadow-sm flex items-center gap-2 transition-all duration-200 ease-in-out min-w-fit cursor-pointer ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                                    style={{ 
                                        backgroundColor: isSelected ? `${memberColor}40` : `${memberColor}20`, 
                                        color: memberColor,
                                        border: `1px solid ${memberColor}40`,
                                        ringColor: memberColor,
                                        padding: memberAvatar ? '0.25rem 0.75rem' : '0.5rem 0.75rem'
                                    }}
                                >
                                    {memberAvatar && <span className="text-lg">{memberAvatar}</span>}
                                    <span className="whitespace-nowrap">{currentUserMember.name}</span>
                                </span>
                            </div>
                        );
                    })()
                )}
                {familyMembers.length === 0 && !currentUserMember ? (
                    <p className="text-gray-500">Még nincsenek családtagok hozzáadva.</p>
                ) : (
                    familyMembers.map(member => {
                        const memberColor = member.color || '#8B5CF6'; // Alapértelmezett lila, ha nincs szín
                        const memberAvatar = member.avatar && member.avatar.trim() !== '' ? member.avatar : null;
                        const isSelected = selectedMemberId === member.id;
                        return (
                            <div key={member.id} className="group relative">
                                <span 
                                    onClick={() => onMemberClick && onMemberClick(member.id)}
                                    className={`text-sm font-medium rounded-full shadow-sm flex items-center gap-2 transition-all duration-200 ease-in-out min-w-fit cursor-pointer ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                                    style={{ 
                                        backgroundColor: isSelected ? `${memberColor}40` : `${memberColor}20`, 
                                        color: memberColor,
                                        border: `1px solid ${memberColor}40`,
                                        ringColor: memberColor,
                                        padding: memberAvatar ? '0.25rem 0.75rem' : '0.5rem 0.75rem'
                                    }}
                                >
                                    {memberAvatar && <span className="text-lg">{memberAvatar}</span>}
                                    <span className="whitespace-nowrap">{member.name}</span>
                                    {!isChildMode && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditMember(member);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                                style={{ color: memberColor }}
                                                title="Családtag szerkesztése"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteMember(member.id, member.name);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-600 hover:text-red-800 font-bold text-xs hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                                title="Családtag törlése"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </>
                                    )}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FamilyMembersSection;
