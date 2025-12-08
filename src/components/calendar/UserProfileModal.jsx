import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const UserProfileModal = ({ onClose, onSaveProfile, userEmail, displayName, loading, isChildMode = false, childSession = null }) => {
    // Gyerek módban a gyerek adatait használjuk, szülő módban a szülő adatait
    const currentDisplayName = isChildMode ? (childSession?.childName || '') : (displayName || '');
    const currentEmail = isChildMode ? '' : (userEmail || '');
    
    const [newDisplayName, setNewDisplayName] = useState(currentDisplayName);
    const [newEmail, setNewEmail] = useState(currentEmail);

    // Frissítsük az állapotot, ha a props változik
    React.useEffect(() => {
        console.log("UserProfileModal: useEffect triggered", {
            isChildMode,
            childSession,
            displayName,
            userEmail
        });
        
        if (isChildMode) {
            console.log("UserProfileModal: Setting child data", childSession?.childName);
            setNewDisplayName(childSession?.childName || '');
            setNewEmail('');
        } else {
            console.log("UserProfileModal: Setting parent data", displayName);
            setNewDisplayName(displayName || '');
            setNewEmail(userEmail || '');
        }
    }, [displayName, userEmail, isChildMode, childSession]);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("UserProfileModal: handleSubmit called with displayName:", newDisplayName);
        
        onSaveProfile({
            displayName: newDisplayName.trim(),
            email: newEmail.trim()
        });
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('A jelszavak nem egyeznek!');
            return;
        }
        if (newPassword.length < 6) {
            alert('A jelszónak legalább 6 karakter hosszúnak kell lennie!');
            return;
        }
        
        // Itt kellene implementálni a jelszó változtatást
        console.log("Password change requested");
        alert('Jelszó változtatás még nincs implementálva');
    };

    return (
        <Modal onClose={onClose} title={isChildMode ? "Gyerek Profil" : "Felhasználói Profil"}>
            <div className="space-y-6">
                {isChildMode ? (
                    /* Gyerek profil - csak olvasható */
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                            <span className="text-2xl mr-2">{childSession?.childAvatar}</span>
                            Gyerek Profil
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Név
                                </label>
                                <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800">
                                    {childSession?.childName || 'Névtelen'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Szerepkör
                                </label>
                                <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800">
                                    {childSession?.childRole || 'Gyerek'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Születési dátum
                                </label>
                                <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800">
                                    {childSession?.childBirthDate || 'Nincs megadva'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bejelentkezés ideje
                                </label>
                                <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800">
                                    {childSession?.loginTime ? new Date(childSession.loginTime).toLocaleString('hu-HU') : 'Nincs megadva'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <i className="fas fa-info-circle mr-2"></i>
                                Ez egy gyerek profil. A szerkesztéshez szülői jogosultság szükséges.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Szülő profil - szerkeszthető */
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                            <i className="fas fa-user mr-2"></i>
                            Profil Adatok
                        </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                Megjelenítendő név
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Adja meg a nevét"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                E-mail cím
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading || !newDisplayName.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span><i className="fas fa-spinner fa-spin mr-2"></i>Mentés...</span>
                                ) : (
                                    <span><i className="fas fa-save mr-2"></i>Profil Mentése</span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-times mr-2"></i>Mégsem
                            </button>
                        </div>
                    </form>
                    </div>
                )}

                {/* Jelszó változtatás - csak szülő módban */}
                {!isChildMode && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                        <i className="fas fa-key mr-2"></i>
                        Jelszó Változtatás
                    </h3>
                    
                    <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="fas fa-edit mr-2"></i>
                        {showPasswordChange ? 'Jelszó Változtatás Elrejtése' : 'Jelszó Változtatás'}
                    </button>

                    {showPasswordChange && (
                        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Jelenlegi jelszó
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Új jelszó
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Új jelszó megerősítése
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-key mr-2"></i>Jelszó Változtatás
                            </button>
                        </form>
                    )}
                    </div>
                )}

                {/* Információ */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        Információ
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• A megjelenítendő név látható a családtagok számára</li>
                        <li>• Az e-mail cím a bejelentkezéshez szükséges</li>
                        <li>• A jelszó változtatás biztonsági okokból jelenleg nem elérhető</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;
