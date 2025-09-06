import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const ParentPinModal = ({ onClose, onPinVerified, loading }) => {
    const [pin, setPin] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin.trim()) {
            onPinVerified(pin.trim());
        }
    };

    const handleCancel = () => {
        setPin('');
        onClose();
    };

    return (
        <Modal onClose={handleCancel} title="Szülői PIN Szükséges">
            <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Gyerek módból való kilépés
                </h3>
                <p className="text-gray-500 mb-6">
                    A gyerek módból való kilépéshez szülői PIN szükséges.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="parentPin" className="block text-sm font-medium text-gray-700 mb-2">
                        Szülői PIN kód
                    </label>
                    <input
                        type="password"
                        id="parentPin"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                        placeholder="••••"
                        maxLength="6"
                        required
                        autoFocus
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        <i className="fas fa-info-circle mr-1"></i>
                        4-6 számjegyű PIN kód
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !pin.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin mr-2"></i>Ellenőrzés...</span>
                        ) : (
                            <span><i className="fas fa-sign-out-alt mr-2"></i>Kilépés</span>
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

            <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-yellow-800">
                    <i className="fas fa-shield-alt mr-2"></i>
                    Ez a PIN kód védi a gyerek módot a véletlen kilépéstől.
                </p>
            </div>
        </Modal>
    );
};

export default ParentPinModal;
