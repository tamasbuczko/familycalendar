import React, { useState, useEffect } from 'react';
import NotificationSettings from './NotificationSettings.jsx';
import UsageStatsModal from '../ui/UsageStatsModal.jsx';
import FamilySettingsModal from './FamilySettingsModal.jsx';
import { useUsageLimits } from '../../utils/usageLimits.js';

const SettingsScreen = ({ onClose, onSaveParentPin, onSaveFamilyData, currentParentPin, loading, userId, familyData }) => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showUsageStats, setShowUsageStats] = useState(false);
    const [showFamilySettings, setShowFamilySettings] = useState(false);
    
    // Használati korlátok kezelése
    const { getUsageStats } = useUsageLimits(userId);
    const [usageStats, setUsageStats] = useState(null);

    // Frissítsük a PIN mezőket, ha a currentParentPin változik (Firebase szinkronizálás)
    useEffect(() => {
        // Ha a currentParentPin változik, töröljük a beírt mezőket
        setNewPin('');
        setConfirmPin('');
        
        // Ha a PIN változott, jelezzük a felhasználónak
        if (currentParentPin) {
            console.log("SettingsScreen: PIN updated from Firebase:", currentParentPin);
        }
    }, [currentParentPin]);

    // Használati statisztikák betöltése
    useEffect(() => {
        if (userId) {
            const stats = getUsageStats();
            setUsageStats(stats);
        }
    }, [userId]); // Eltávolítottuk a getUsageStats függvényt a dependency array-ből

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("SettingsScreen: handleSubmit called with newPin:", newPin, "confirmPin:", confirmPin);
        
        if (!newPin.trim()) {
            alert('Kérjük, adjon meg egy PIN kódot!');
            return;
        }
        
        if (newPin.length < 4 || newPin.length > 6) {
            alert('A PIN kód 4-6 számjegyű lehet!');
            return;
        }
        
        if (!/^\d+$/.test(newPin)) {
            alert('A PIN kód csak számokat tartalmazhat!');
            return;
        }
        
        if (newPin !== confirmPin) {
            alert('A PIN kódok nem egyeznek!');
            return;
        }
        
        console.log("SettingsScreen: Calling onSaveParentPin with:", newPin);
        onSaveParentPin(newPin);
    };

    const handleCancel = () => {
        setNewPin('');
        setConfirmPin('');
    };

    const handleClearPin = () => {
        setShowClearConfirm(true);
    };

    const confirmClearPin = () => {
        onSaveParentPin('');
        setShowClearConfirm(false);
    };

    const cancelClearPin = () => {
        setShowClearConfirm(false);
    };

    return (
        <div>
            
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Vissza"
                            >
                                <i className="fas fa-arrow-left text-gray-600"></i>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Beállítások</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'general'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <i className="fas fa-cog mr-2"></i>Általános
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'notifications'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <i className="fas fa-bell mr-2"></i>Értesítések
                            </button>
                            <button
                                onClick={() => setActiveTab('privacy')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'privacy'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <i className="fas fa-shield-alt mr-2"></i>Adatvédelem
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Általános beállítások */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                {/* Szülői PIN beállítás */}
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                                        <i className="fas fa-shield-alt mr-2"></i>
                                        Szülői PIN Beállítás
                                    </h3>
                                    
                                    {currentParentPin ? (
                                        <div className="mb-6 p-4 bg-white rounded-lg border">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Jelenlegi PIN kód
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type={showCurrentPin ? "text" : "password"}
                                                    value={currentParentPin}
                                                    readOnly
                                                    className="flex-1 p-3 border border-gray-300 rounded-lg text-center font-mono tracking-widest text-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                                                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                                                >
                                                    {showCurrentPin ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                                                </button>
                                            </div>
                                            <div className="mt-3 flex space-x-3">
                                                <button
                                                    onClick={handleClearPin}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition duration-300"
                                                >
                                                    <i className="fas fa-trash mr-2"></i>PIN Törlése
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                                Nincs beállított szülői PIN kód. Állíts be egyet a gyerek mód védelméhez.
                                            </p>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-2">
                                                {currentParentPin ? 'Új PIN kód' : 'PIN kód'}
                                            </label>
                                            <input
                                                type="password"
                                                id="newPin"
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                                                placeholder="••••"
                                                maxLength="6"
                                                required
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                <i className="fas fa-info-circle mr-1"></i>
                                                4-6 számjegyű PIN kód
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
                                                PIN kód megerősítése
                                            </label>
                                            <input
                                                type="password"
                                                id="confirmPin"
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                                                placeholder="••••"
                                                maxLength="6"
                                                required
                                            />
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                type="submit"
                                                disabled={loading || !newPin.trim() || !confirmPin.trim()}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? (
                                                    <span><i className="fas fa-spinner fa-spin mr-2"></i>Mentés...</span>
                                                ) : (
                                                    <span><i className="fas fa-save mr-2"></i>{currentParentPin ? 'PIN Frissítése' : 'PIN Mentése'}</span>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                            >
                                                <i className="fas fa-times mr-2"></i>Mégsem
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Család beállítások */}
                                <div className="bg-purple-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                                        <i className="fas fa-home mr-2"></i>
                                        Család Beállítások
                                    </h3>
                                    <p className="text-sm text-purple-700 mb-4">
                                        Szerkeszd a család nevét, várost és egyéb adatokat.
                                    </p>
                                    <button
                                        onClick={() => setShowFamilySettings(true)}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                    >
                                        <i className="fas fa-edit mr-2"></i>Család Adatok Szerkesztése
                                    </button>
                                </div>

                                {/* Használati statisztikák */}
                                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-500">
                                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                                        <i className="fas fa-chart-bar mr-2"></i>
                                        Használati Statisztikák
                                    </h3>
                                    <p className="text-sm text-green-700 mb-4">
                                        Nézd meg a napi használati korlátokat és a Firebase költségeket.
                                    </p>
                                    <button
                                        onClick={() => setShowUsageStats(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                                    >
                                        <i className="fas fa-chart-line mr-2"></i>Statisztikák Megtekintése
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Értesítési beállítások */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <NotificationSettings />
                            </div>
                        )}

                        {/* Adatvédelmi beállítások */}
                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <div className="bg-yellow-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                                        <i className="fas fa-shield-alt mr-2"></i>
                                        Adatvédelem és Biztonság
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white rounded-lg border">
                                            <h4 className="font-medium text-gray-900 mb-2">Adatok tárolása</h4>
                                            <p className="text-sm text-gray-600">
                                                Az alkalmazás adatai biztonságosan tárolódnak a Firebase felhőben. 
                                                Csak a család tagjai férhetnek hozzá az adatokhoz.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-lg border">
                                            <h4 className="font-medium text-gray-900 mb-2">Gyerek mód védelme</h4>
                                            <p className="text-sm text-gray-600">
                                                A szülői PIN kód védi a gyerek módot. Csak a PIN kód ismeretében 
                                                lehet kilépni a gyerek módbol.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-lg border">
                                            <h4 className="font-medium text-gray-900 mb-2">Adatok törlése</h4>
                                            <p className="text-sm text-gray-600">
                                                Ha törölni szeretnéd az adataidat, vedd fel velünk a kapcsolatot.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <UsageStatsModal
                isOpen={showUsageStats}
                onClose={() => setShowUsageStats(false)}
                usageStats={usageStats || {
                    weather: {
                        automatic: { used: 0, limit: 4, remaining: 4 },
                        manual: { used: 0, limit: 10, remaining: 10 }
                    },
                    notifications: {
                        total: { used: 0, limit: 50, remaining: 50 },
                        eventReminders: { used: 0, limit: 3, remaining: 3 },
                        weatherAlerts: { used: 0, limit: 2, remaining: 2 }
                    },
                    firestore: {
                        reads: { used: 0, limit: 1000, remaining: 1000 },
                        writes: { used: 0, limit: 100, remaining: 100 }
                    },
                    functions: {
                        used: 0,
                        limit: 200,
                        remaining: 200
                    }
                }}
                userPlan="FREE"
            />

            <FamilySettingsModal
                isOpen={showFamilySettings}
                onClose={() => setShowFamilySettings(false)}
                familyData={familyData}
                onSaveFamilyData={(data) => {
                    console.log('Family data to save:', data);
                    onSaveFamilyData(data);
                    setShowFamilySettings(false);
                }}
                loading={false}
            />

            {/* Clear PIN confirmation modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">PIN kód törlése</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Biztosan törölni szeretnéd a szülői PIN kódot? Ez után a gyerek mód nem lesz védve.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={confirmClearPin}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300"
                            >
                                <i className="fas fa-trash mr-2"></i>Törlés
                            </button>
                            <button
                                onClick={cancelClearPin}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition duration-300"
                            >
                                <i className="fas fa-times mr-2"></i>Mégsem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsScreen;
