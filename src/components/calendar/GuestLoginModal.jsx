import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const GuestLoginModal = ({ onClose, onGuestLogin, familyMembers, loading }) => {
    const [selectedGuest, setSelectedGuest] = useState('');
    const [guestPin, setGuestPin] = useState('');

    // Csak guest profilokat mutatunk
    const guestMembers = familyMembers.filter(member => member.isGuest);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedGuest && guestPin.trim()) {
            onGuestLogin({
                guestId: selectedGuest,
                pin: guestPin.trim()
            });
        }
    };

    const handleGuestSelect = (guestId) => {
        setSelectedGuest(guestId);
        // Automatikus PIN generálás a guest neve alapján
        const guest = guestMembers.find(g => g.id === guestId);
        if (guest) {
            // Egyszerű PIN: név első 3 betűje + életkor
            const namePart = guest.name.substring(0, 3).toLowerCase();
            const agePart = guest.age || 0;
            const autoPin = `${namePart}${agePart}`;
            setGuestPin(autoPin);
        }
    };

    if (guestMembers.length === 0) {
        return (
            <Modal onClose={onClose} title="Guest Bejelentkezés">
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">👶</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Nincsenek Guest Profilok
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Először hozz létre guest profilokat a gyerekeknek!
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Bezárás
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal onClose={onClose} title="Guest Bejelentkezés">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Válaszd ki a Guest Profilt
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {guestMembers.map(guest => (
                            <button
                                key={guest.id}
                                type="button"
                                onClick={() => handleGuestSelect(guest.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                    selectedGuest === guest.id
                                        ? 'border-blue-500 bg-blue-50 scale-105'
                                        : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                                }`}
                            >
                                <div className="text-3xl mb-2">{guest.avatar}</div>
                                <div className="font-medium text-gray-900">{guest.name}</div>
                                <div className="text-sm text-gray-500">
                                    {guest.age ? `${guest.age} éves` : 'Életkor nincs megadva'}
                                </div>
                                <div className="text-xs text-gray-400 capitalize">{guest.role}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedGuest && (
                    <div>
                        <label htmlFor="guestPin" className="block text-sm font-medium text-gray-700 mb-2">
                            PIN kód
                        </label>
                        <input
                            type="text"
                            id="guestPin"
                            value={guestPin}
                            onChange={(e) => setGuestPin(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="PIN kód"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            <i className="fas fa-info-circle mr-1"></i>
                            A PIN automatikusan generálódik a név és életkor alapján
                        </p>
                        
                        {/* Tesztelő gomb */}
                        <button
                            type="button"
                            onClick={() => {
                                const guest = guestMembers.find(g => g.id === selectedGuest);
                                if (guest) {
                                    const namePart = guest.name.substring(0, 3).toLowerCase();
                                    const agePart = guest.age || 0;
                                    const testPin = `${namePart}${agePart}`;
                                    setGuestPin(testPin);
                                    console.log("Teszt PIN generálva:", testPin);
                                }
                            }}
                            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                        >
                            🧪 Teszt PIN generálás
                        </button>
                    </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Guest Bejelentkezés
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    Guest profilok korlátozott jogosultságokkal rendelkeznek:
                                </p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Csak saját eseményeket látják</li>
                                    <li>Nem tudnak új eseményeket létrehozni</li>
                                    <li>Nem tudnak családtagokat kezelni</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !selectedGuest || !guestPin.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Bejelentkezés...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Guest Bejelentkezés
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                        Mégse
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GuestLoginModal;
