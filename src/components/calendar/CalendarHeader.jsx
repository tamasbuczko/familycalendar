import React from 'react';

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
    return (
        <div className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {familyName || 'Családi Naptár'}
                        </h1>
                        {isChildMode && childSession && (
                            <div className="ml-4 bg-purple-100 px-3 py-1 rounded-full">
                                <span className="text-purple-800 text-sm font-medium">
                                    <span className="text-lg mr-1">{childSession.childAvatar}</span>
                                    {childSession.childName} (Gyerek)
                                </span>
                            </div>
                        )}
                        {!isChildMode && (userDisplayName || userEmail) && (
                            <div className="ml-4 bg-green-100 px-3 py-1 rounded-full">
                                <span className="text-green-800 text-sm font-medium">
                                    <i className="fas fa-user mr-1"></i>
                                    {userDisplayName || userEmail}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {isChildMode ? (
                            // Child mód - csak child logout gomb
                            <button
                                onClick={onChildLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-sign-out-alt mr-2"></i>Kilépés
                            </button>
                        ) : (
                            // Admin mód - gyerek bejelentkezés, beállítások, profil és család választó gombok
                            <>
                                <button
                                    onClick={onChildLoginClick}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-child mr-2"></i>Gyerek Bejelentkezés
                                </button>
                                <button
                                    onClick={onSettingsClick}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-cog mr-2"></i>Beállítások
                                </button>
                                <button
                                    onClick={onProfileClick}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-user mr-2"></i>Profil
                                </button>
                                <button
                                    onClick={onFamilySelectorClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <i className="fas fa-exchange-alt mr-2"></i>Család választó
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
