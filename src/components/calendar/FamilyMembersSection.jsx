import React from 'react';

const FamilyMembersSection = ({ 
    familyMembers, 
    onAddMember, 
    onInviteMember, 
    onChildProfile, 
    onEditMember, 
    onDeleteMember,
    isChildMode = false
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Családtagok</h2>
                {!isChildMode && (
                    <div className="flex space-x-2">
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
                            <i className="fas fa-baby mr-1"></i>Gyerek profil
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {familyMembers.length === 0 ? (
                    <p className="text-gray-500">Még nincsenek családtagok hozzáadva.</p>
                ) : (
                    familyMembers.map(member => (
                        <div key={member.id} className="group relative">
                            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-0 group-hover:gap-2 transition-all duration-200 ease-in-out min-w-fit">
                                <span className="whitespace-nowrap">{member.name}</span>
                                {!isChildMode && (
                                    <>
                                        <button
                                            onClick={() => onEditMember(member)}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-blue-600 hover:text-blue-800 font-bold text-xs hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                            title="Családtag szerkesztése"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onDeleteMember(member.id, member.name)}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-600 hover:text-red-800 font-bold text-xs hover:scale-110 w-0 group-hover:w-4 overflow-hidden"
                                            title="Családtag törlése"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </>
                                )}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FamilyMembersSection;
