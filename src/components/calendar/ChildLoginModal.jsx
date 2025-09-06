import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const ChildLoginModal = ({ onClose, onChildLogin, familyMembers, loading }) => {
    const [selectedChild, setSelectedChild] = useState('');
    const [childPin, setChildPin] = useState('');

    // Csak gyerek profilokat mutatunk
    const childMembers = familyMembers.filter(member => member.isChild);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedChild && childPin.trim()) {
            onChildLogin({
                childId: selectedChild,
                pin: childPin.trim()
            });
        }
    };

    const handleChildSelect = (childId) => {
        setSelectedChild(childId);
        // Automatikus PIN generálás a gyerek neve alapján
        const child = childMembers.find(c => c.id === childId);
        if (child) {
            // Egyszerű PIN: név első 3 betűje + életkor
            const namePart = child.name.substring(0, 3).toLowerCase();
            const agePart = child.age || 0;
            const autoPin = `${namePart}${agePart}`;
            setChildPin(autoPin);
        }
    };

    if (childMembers.length === 0) {
        return (
            <Modal onClose={onClose} title="Gyerek Bejelentkezés">
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">👶</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Nincsenek Gyerek Profilok
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Először hozz létre gyerek profilokat!
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
        <Modal onClose={onClose} title="Gyerek Bejelentkezés">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Válaszd ki a Gyerek Profilt
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {childMembers.map(child => (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() => handleChildSelect(child.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                    selectedChild === child.id
                                        ? 'border-blue-500 bg-blue-50 scale-105'
                                        : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                                }`}
                            >
                                <div className="text-3xl mb-2">{child.avatar}</div>
                                <div className="font-medium text-gray-900">{child.name}</div>
                                <div className="text-sm text-gray-500">
                                    {child.age ? `${child.age} éves` : 'Életkor nincs megadva'}
                                </div>
                                <div className="text-xs text-gray-400 capitalize">{child.role}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedChild && (
                    <div>
                        <label htmlFor="childPin" className="block text-sm font-medium text-gray-700 mb-2">
                            PIN kód
                        </label>
                        <input
                            type="text"
                            id="childPin"
                            value={childPin}
                            onChange={(e) => setChildPin(e.target.value)}
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
                                const child = childMembers.find(c => c.id === selectedChild);
                                if (child) {
                                    const namePart = child.name.substring(0, 3).toLowerCase();
                                    const agePart = child.age || 0;
                                    const testPin = `${namePart}${agePart}`;
                                    setChildPin(testPin);
                                    console.log("Teszt PIN generálva:", testPin);
                                }
                            }}
                            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                        >
                            🧪 Teszt PIN generálás
                        </button>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !selectedChild || !childPin.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin mr-2"></i>Bejelentkezés...</span>
                        ) : (
                            <span><i className="fas fa-sign-in-alt mr-2"></i>Bejelentkezés</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <i className="fas fa-times mr-2"></i>Mégsem
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChildLoginModal;
