import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import NotificationSettings from './NotificationSettings.jsx';
import UsageStatsModal from '../ui/UsageStatsModal.jsx';
import FamilySettingsModal from './FamilySettingsModal.jsx';
import { useUsageLimits } from '../../utils/usageLimits.js';

const SettingsPage = ({ onClose, onSaveParentPin, onSaveFamilyData, currentParentPin, loading, userId, familyData }) => {
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
            console.log("SettingsPage: PIN updated from Firebase:", currentParentPin);
        }
    }, [currentParentPin]);

    // Használati statisztikák betöltése
    useEffect(() => {
        console.log("SettingsPage: useEffect triggered, userId:", userId);
        if (userId) {
            console.log("SettingsPage: Calling getUsageStats with userId:", userId);
            const stats = getUsageStats();
            console.log("SettingsPage: getUsageStats returned:", stats);
            setUsageStats(stats);
        } else {
            console.log("SettingsPage: No userId, not loading stats");
        }
    }, [userId, getUsageStats]); // Added getUsageStats back to dependencies

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("SettingsPage: handleSubmit called with newPin:", newPin, "confirmPin:", confirmPin);
        
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
        
        console.log("SettingsPage: Calling onSaveParentPin with:", newPin);
        onSaveParentPin(newPin);
    };

    const handleCancel = () => {
        setNewPin('');
        setConfirmPin('');
        onClose();
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
        <Modal onClose={handleCancel} title="Beállítások">
            {/* Tab navigáció */}
            <div className="flex border-b mb-4">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 font-medium ${
                        activeTab === 'general' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <i className="fas fa-cog mr-2"></i>Általános
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 font-medium ${
                        activeTab === 'notifications' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <i className="fas fa-bell mr-2"></i>Értesítések
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                {console.log("SettingsPage: Rendering general tab, usageStats:", usageStats)}
                {/* Szülői PIN beállítás */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <i className="fas fa-shield-alt mr-2"></i>
                        Szülői PIN Beállítás
                    </h3>
                    
                    {currentParentPin ? (
                        <div className="mb-4 p-3 bg-white rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jelenlegi PIN kód
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type={showCurrentPin ? "text" : "password"}
                                    value={currentParentPin}
                                    readOnly
                                    className="flex-1 p-2 border border-gray-300 rounded text-center font-mono tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                >
                                    {showCurrentPin ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Nincs beállított szülői PIN kód. Állíts be egyet a gyerek mód védelméhez.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-2">
                                Új PIN kód
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
                                    <span><i className="fas fa-save mr-2"></i>PIN Mentése</span>
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

                    {currentParentPin && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            <button
                                type="button"
                                onClick={handleClearPin}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-trash mr-2"></i>PIN Kód Törlése
                            </button>
                        </div>
                    )}
                </div>

                {/* Család beállítások */}
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">
                        <i className="fas fa-home mr-2"></i>
                        Család beállítások
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                        Szerkeszd a család nevét, várost és egyéb adatokat.
                    </p>
                    <button
                        onClick={() => setShowFamilySettings(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="fas fa-edit mr-2"></i>Család adatok szerkesztése
                    </button>
                </div>

                {/* TEST DIV - Ez látható kell legyen */}
                <div className="bg-red-100 p-4 rounded-lg border-2 border-red-500">
                    <h4 className="text-lg font-bold text-red-800">TEST: Ez a div látható kell legyen!</h4>
                    <p className="text-red-700">Ha ezt látod, akkor a rendering működik.</p>
                </div>

                {/* Használati statisztikák */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
                        <i className="fas fa-chart-bar mr-2"></i>
                        Használati statisztikák
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                        Nézd meg a napi használati korlátokat és a Firebase költségeket.
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                        Debug: usageStats = {usageStats ? 'loaded' : 'null'}, userId = {userId}
                    </p>
                    <button
                        onClick={() => {
                            console.log("SettingsPage: Opening usage stats modal, stats:", usageStats);
                            console.log("SettingsPage: showUsageStats will be set to true");
                            setShowUsageStats(true);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="fas fa-chart-line mr-2"></i>Statisztikák megtekintése
                    </button>
                </div>

                {/* Információ */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        Fontos információk
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• A szülői PIN védi a gyerek módot a véletlen kilépéstől</li>
                        <li>• A PIN kód 4-6 számjegyű lehet</li>
                        <li>• A PIN kód csak számokat tartalmazhat</li>
                        <li>• Ha elfelejti a PIN kódot, törölje és állítson be újat</li>
                    </ul>
                </div>
            </div>
            )}

            {activeTab === 'notifications' && (
                <NotificationSettings userId={userId} onClose={onClose} />
            )}

            {/* Clear PIN Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
                        <div className="flex items-center justify-center mb-4">
                            <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                            PIN Kód Törlése
                        </h3>
                        <p className="text-gray-600 text-sm mb-6 text-center">
                            Biztosan törölni szeretné a szülői PIN kódot?<br/>
                            <strong className="text-red-600">Ez veszélyezteti a gyerek mód védelmét!</strong>
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={confirmClearPin}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-trash mr-2"></i>
                                Igen, Törlöm
                            </button>
                            <button
                                onClick={cancelClearPin}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-times mr-2"></i>
                                Mégse
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Használati statisztikák modal */}
            {console.log("SettingsPage: Rendering UsageStatsModal with showUsageStats:", showUsageStats, "usageStats:", usageStats)}
            <UsageStatsModal
                isOpen={showUsageStats}
                onClose={() => {
                    console.log("SettingsPage: Closing usage stats modal");
                    setShowUsageStats(false);
                }}
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
                    functions: { used: 0, limit: 200, remaining: 200 }
                }}
                userPlan="FREE"
            />

            {/* Család beállítások modal */}
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
        </Modal>
    );
};

export default SettingsPage;
