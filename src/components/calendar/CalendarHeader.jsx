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
    userDisplayName
}) => {
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
                        {/* Profil gomb - mindenhol látható */}
                        {isChildMode && childSession && (
                            <button
                                onClick={onProfileClick}
                                className="ml-2 sm:ml-4 bg-purple-100 hover:bg-purple-200 px-2 sm:px-3 py-1 rounded-full transition duration-200 cursor-pointer"
                            >
                                <span className="text-purple-800 text-xs sm:text-sm font-medium">
                                    <span className="text-base sm:text-lg mr-1">{childSession.childAvatar}</span>
                                    <span className="hidden sm:inline">{childSession.childName} (Gyerek)</span>
                                    <span className="sm:hidden">{childSession.childName}</span>
                                </span>
                            </button>
                        )}
                        {!isChildMode && (userDisplayName || userEmail) && (
                            <button
                                onClick={onProfileClick}
                                className="ml-2 sm:ml-4 bg-green-100 hover:bg-green-200 px-2 sm:px-3 py-1 rounded-full transition duration-200 cursor-pointer"
                            >
                                <span className="text-green-800 text-xs sm:text-sm font-medium">
                                    <i className="fas fa-user mr-1"></i>
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
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition duration-200 mb-2"
                                >
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{childSession.childAvatar}</span>
                                        <div>
                                            <div className="text-purple-800 font-medium">{childSession.childName}</div>
                                            <div className="text-purple-600 text-sm">Gyerek profil</div>
                                        </div>
                                    </div>
                                </button>
                            )}
                            {!isChildMode && (userDisplayName || userEmail) && (
                                <button
                                    onClick={() => handleMenuItemClick(onProfileClick)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition duration-200 mb-2"
                                >
                                    <div className="flex items-center">
                                        <i className="fas fa-user text-green-600 text-xl mr-3"></i>
                                        <div>
                                            <div className="text-green-800 font-medium">{userDisplayName || userEmail}</div>
                                            <div className="text-green-600 text-sm">Profil</div>
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
