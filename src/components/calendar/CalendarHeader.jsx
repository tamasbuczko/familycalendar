import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorPriorityToggle from '../ui/ColorPriorityToggle.jsx';
import QuickAddDropdown from '../ui/QuickAddDropdown.jsx';

const CalendarHeader = ({ 
    familyName, 
    onFamilySelectorClick, 
    onChildLoginClick, 
    isChildMode, 
    childSession, 
    onChildLogout,
    onSettingsClick,
    onProfileClick,
    onQuickAddTemplateSelect,
    onColorPriorityChange,
    userEmail,
    userDisplayName,
    currentUserMember,
    familyMembers = [],
    userId,
    userFamilyId
}) => {
    const navigate = useNavigate();
    
    // Gyerek színének meghatározása
    const childMember = isChildMode && childSession 
        ? familyMembers.find(m => m.id === childSession.childId)
        : null;
    const childColor = childMember?.color;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

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

    // Kattintás a menün kívülre - bezárás
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                // Ellenőrizzük, hogy nem a hamburger gombra kattintottunk
                const hamburgerButton = event.target.closest('button[aria-label="Menü megnyitása"]');
                if (!hamburgerButton) {
                    handleMenuClose();
                }
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

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
                            // Admin mód - csak gyors gombok maradnak kint
                            <>
                                <ColorPriorityToggle onChange={onColorPriorityChange} />
                                <QuickAddDropdown 
                                    onTemplateSelect={onQuickAddTemplateSelect}
                                    userId={userId}
                                    userFamilyId={userFamilyId}
                                />
                            </>
                        )}
                    </div>

                    {/* Hamburger menü gomb - mindenhol látható (desktop és mobil) */}
                    {!isChildMode && (
                        <div className="flex items-center ml-6">
                            <button
                                onClick={handleMenuToggle}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
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

            {/* Hamburger menü - desktop és mobil is */}
            {isMenuOpen && (
                <>
                    {/* Menü panel - desktop: jobb oldali dropdown, mobil: teljes szélesség */}
                    <div ref={menuRef} className="absolute top-full right-0 md:right-4 bg-white shadow-lg z-50 border-t md:border md:rounded-lg md:w-80">
                        <div className="px-4 py-2">
                            {/* Profil gomb - csak mobilon */}
                            {isChildMode && childSession && (
                                <div className="md:hidden">
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
                                </div>
                            )}
                            {!isChildMode && (userDisplayName || userEmail) && (
                                <div className="md:hidden">
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
                                </div>
                            )}

                            {/* Elválasztó, ha van profil gomb (csak mobilon) */}
                            {((isChildMode && childSession) || (!isChildMode && (userDisplayName || userEmail))) && (
                                <div className="border-t my-2 md:hidden"></div>
                            )}

                            {/* Gyors gombok - csak mobilon */}
                            {!isChildMode && (
                                <div className="md:hidden px-4 py-2 mb-2 flex items-center gap-2">
                                    <ColorPriorityToggle onChange={onColorPriorityChange} />
                                    <QuickAddDropdown 
                                        onTemplateSelect={onQuickAddTemplateSelect}
                                        userId={userId}
                                        userFamilyId={userFamilyId}
                                    />
                                </div>
                            )}

                            {/* Elválasztó gyors gombok után (csak mobilon) */}
                            {!isChildMode && (
                                <div className="border-t my-2 md:hidden"></div>
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
                                // Admin mód - FontAwesome ikonokkal + szöveggel
                                <>
                                    {/* Események csoport */}
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/app/templates'))}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition duration-200 text-gray-700 mb-1"
                                    >
                                        <i className="fas fa-layer-group mr-3"></i>
                                        <span>Sablonok</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/app/recurring-events'))}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 transition duration-200 text-gray-700 mb-1"
                                    >
                                        <i className="fas fa-calendar-check mr-3"></i>
                                        <span>Események</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/app/annual-events'))}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-yellow-50 transition duration-200 text-gray-700 mb-2"
                                    >
                                        <i className="fas fa-star mr-3"></i>
                                        <span>Kiemelt Események</span>
                                    </button>
                                    
                                    {/* Válaszvonal */}
                                    <div className="border-t my-2"></div>
                                    
                                    {/* Család csoport */}
                                    <button
                                        onClick={() => handleMenuItemClick(onChildLoginClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition duration-200 text-gray-700 mb-1"
                                    >
                                        <i className="fas fa-child mr-3"></i>
                                        <span>Gyerek Bejelentkezés</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuItemClick(onFamilySelectorClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition duration-200 text-gray-700 mb-2"
                                    >
                                        <i className="fas fa-exchange-alt mr-3"></i>
                                        <span>Család választó</span>
                                    </button>
                                    
                                    {/* Válaszvonal */}
                                    <div className="border-t my-2"></div>
                                    
                                    {/* Beállítások */}
                                    <button
                                        onClick={() => handleMenuItemClick(onSettingsClick)}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-200 text-gray-700"
                                    >
                                        <i className="fas fa-cog mr-3"></i>
                                        <span>Beállítások</span>
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
