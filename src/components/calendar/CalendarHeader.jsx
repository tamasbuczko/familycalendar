import React, { useState } from 'react';

const CalendarHeader = ({ 
    familyName, 
    onFamilySelectorClick, 
    onChildLoginClick, 
    isChildMode, 
    childSession, 
    onChildLogout,
    onSettingsClick,
    onProfileClick,
    userEmail,
    userDisplayName,
    currentUserMember,
    familyMembers = []
}) => {
    // Gyerek színének meghatározása
    const childMember = isChildMode && childSession 
        ? familyMembers.find(m => m.id === childSession.childId)
        : null;
    const childColor = childMember?.color;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleMenuClose = () => {
        setIsMenuOpen(false);
    };

    const handleMenuItemClick = (callback) => {
        callback();
        handleMenuClose();
    };

    return (
        <div className="bg-white shadow-md relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                            {familyName || 'Családi Naptár'}
                        </h1>
                        {/* Profil gomb - csak desktop-on, mobilon a hamburger menüben van */}
                        {isChildMode && childSession && (
                            <button
                                onClick={onProfileClick}
                                className="hidden md:block ml-2 sm:ml-4 px-2 sm:px-3 py-1 rounded-full transition duration-200 cursor-pointer"
                                style={{
                                    backgroundColor: childColor ? `${childColor}20` : '#F3E8FF',
                                    borderColor: childColor ? `${childColor}60` : '#A855F7',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                }}
                                onMouseEnter={(e) => {
                                    if (childColor) {
                                        e.currentTarget.style.backgroundColor = `${childColor}30`;
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#E9D5FF';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (childColor) {
                                        e.currentTarget.style.backgroundColor = `${childColor}20`;
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#F3E8FF';
                                    }
                                }}
                            >
                                <span 
                                    className="text-xs sm:text-sm font-medium"
                                    style={{
                                        color: childColor || '#6B21A8'
                                    }}
                                >
                                    <span className="text-base sm:text-lg mr-1">{childSession.childAvatar}</span>
                                    <span className="hidden sm:inline">{childSession.childName} (Gyerek)</span>
                                    <span className="sm:hidden">{childSession.childName}</span>
                                </span>
                            </button>
                        )}
                        {!isChildMode && (userDisplayName || userEmail) && (
                            <button
                                onClick={onProfileClick}
                                className="hidden md:block ml-2 sm:ml-4 px-2 sm:px-3 py-1 rounded-full transition duration-200 cursor-pointer"
                                style={{
                                    backgroundColor: currentUserMember?.color ? `${currentUserMember.color}20` : '#D1FAE5',
                                    borderColor: currentUserMember?.color ? `${currentUserMember.color}60` : '#10B981',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentUserMember?.color) {
                                        e.currentTarget.style.backgroundColor = `${currentUserMember.color}30`;
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#A7F3D0';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentUserMember?.color) {
                                        e.currentTarget.style.backgroundColor = `${currentUserMember.color}20`;
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#D1FAE5';
                                    }
                                }}
                            >
                                <span 
                                    className="text-xs sm:text-sm font-medium flex items-center"
                                    style={{
                                        color: currentUserMember?.color || '#065F46'
                                    }}
                                >
                                    {currentUserMember?.avatar ? (
                                        <span className="text-base sm:text-lg mr-1">{currentUserMember.avatar}</span>
                                    ) : (
                                        <i className="fas fa-user mr-1"></i>
                                    )}
                                    <span className="hidden sm:inline">{userDisplayName || userEmail}</span>
                                    <span className="sm:hidden">Profil</span>
                                </span>
                            </button>
                        )}
                    </div>
                    
                    {/* Desktop gombok - csak md felett látható */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isChildMode ? (
                            // Child mód - csak child logout gomb
                            <button
                                onClick={onChildLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-sign-out-alt mr-2"></i>Kilépés
                            </button>
                        ) : (
                            // Admin mód - gyerek bejelentkezés, beállítások, család választó gombok
                            <>
                                <button
                                    onClick={onChildLoginClick}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-child mr-2"></i>Gyerek Bejelentkezés
                                </button>
                                <button
                                    onClick={onSettingsClick}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-cog mr-2"></i>Beállítások
                                </button>
                                <button
                                    onClick={onFamilySelectorClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-exchange-alt mr-2"></i>Család választó
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hamburger menü gomb - csak mobilon és parent módban látható */}
                    {!isChildMode && (
                        <div className="md:hidden">
                            <button
                                onClick={handleMenuToggle}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-label="Menü megnyitása"
                            >
                                {isMenuOpen ? (
                                    <i className="fas fa-times text-xl"></i>
                                ) : (
                                    <i className="fas fa-bars text-xl"></i>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {/* Child módban kilépés gomb - csak mobilon látható */}
                    {isChildMode && (
                        <div className="md:hidden">
                            <button
                                onClick={onChildLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition duration-300 ease-in-out"
                            >
                                <i className="fas fa-sign-out-alt mr-2"></i>Kilépés
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hamburger menü - csak mobilon látható */}
            {isMenuOpen && (
                <>
                    {/* Overlay - háttér elhalványítása */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={handleMenuClose}
                    ></div>
                    
                    {/* Menü panel */}
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50 md:hidden border-t">
                        <div className="px-4 py-2">
                            {/* Profil gomb */}
                            {isChildMode && childSession && (
                                <button
                                    onClick={() => handleMenuItemClick(onProfileClick)}
                                    className="w-full text-left px-4 py-3 rounded-lg transition duration-200 mb-2"
                                    style={{
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (childColor) {
                                            e.currentTarget.style.backgroundColor = `${childColor}10`;
                                        } else {
                                            e.currentTarget.style.backgroundColor = '#F3E8FF';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{childSession.childAvatar}</span>
                                        <div>
                                            <div 
                                                className="font-medium"
                                                style={{
                                                    color: childColor || '#6B21A8'
                                                }}
                                            >
                                                {childSession.childName}
                                            </div>
                                            <div 
                                                className="text-sm"
                                                style={{
                                                    color: childColor || '#9333EA'
                                                }}
                                            >
                                                Gyerek profil
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )}
                            {!isChildMode && (userDisplayName || userEmail) && (
                                <button
                                    onClick={() => handleMenuItemClick(onProfileClick)}
                                    className="w-full text-left px-4 py-3 rounded-lg transition duration-200 mb-2"
                                    style={{
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentUserMember?.color) {
                                            e.currentTarget.style.backgroundColor = `${currentUserMember.color}10`;
                                        } else {
                                            e.currentTarget.style.backgroundColor = '#F0FDF4';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div className="flex items-center">
                                        {currentUserMember?.avatar ? (
                                            <span 
                                                className="text-2xl mr-3"
                                                style={{
                                                    color: currentUserMember?.color || '#10B981'
                                                }}
                                            >
                                                {currentUserMember.avatar}
                                            </span>
                                        ) : (
                                            <i 
                                                className="fas fa-user text-xl mr-3"
                                                style={{
                                                    color: currentUserMember?.color || '#10B981'
                                                }}
                                            ></i>
                                        )}
                                        <div>
                                            <div 
                                                className="font-medium"
                                                style={{
                                                    color: currentUserMember?.color || '#065F46'
                                                }}
                                            >
                                                {userDisplayName || userEmail}
                                            </div>
                                            <div 
                                                className="text-sm"
                                                style={{
                                                    color: currentUserMember?.color || '#10B981'
                                                }}
                                            >
                                                Profil
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Elválasztó, ha van profil gomb */}
                            {((isChildMode && childSession) || (!isChildMode && (userDisplayName || userEmail))) && (
                                <div className="border-t my-2"></div>
                            )}

                            {isChildMode ? (
                                // Child mód - csak child logout gomb
                                <button
                                    onClick={() => handleMenuItemClick(onChildLogout)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition duration-200 text-red-600"
                                >
                                    <i className="fas fa-sign-out-alt mr-3"></i>Kilépés
                                </button>
                            ) : (
                                // Admin mód - gyerek bejelentkezés, beállítások, család választó gombok
                                <>
                                    <button
                                        onClick={() => handleMenuItemClick(onChildLoginClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition duration-200 text-purple-600 mb-2"
                                    >
                                        <i className="fas fa-child mr-3"></i>Gyerek Bejelentkezés
                                    </button>
                                    <button
                                        onClick={() => handleMenuItemClick(onSettingsClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-200 text-gray-600 mb-2"
                                    >
                                        <i className="fas fa-cog mr-3"></i>Beállítások
                                    </button>
                                    <button
                                        onClick={() => handleMenuItemClick(onFamilySelectorClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition duration-200 text-blue-600"
                                    >
                                        <i className="fas fa-exchange-alt mr-3"></i>Család választó
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarHeader;
