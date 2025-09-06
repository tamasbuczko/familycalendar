import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const SettingsPage = ({ onClose, onSaveParentPin, currentParentPin, loading }) => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

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
            <div className="space-y-6">
                {/* Szülői PIN beállítás */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <i className="fas fa-shield-alt mr-2"></i>
                        Szülői PIN Beállítás
                    </h3>
                    
                    {currentParentPin && (
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
        </Modal>
    );
};

export default SettingsPage;
