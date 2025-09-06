import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const GuestProfileModal = ({ onClose, onCreateGuest, loading }) => {
    const [guestName, setGuestName] = useState('');
    const [guestAge, setGuestAge] = useState('');
    const [guestAvatar, setGuestAvatar] = useState('👶');
    const [guestRole, setGuestRole] = useState('child');

    const avatars = [
        '👶', '👧', '👦', '👨‍🦰', '👩‍🦰', '👴', '👵', '🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐙', '🦄', '🌈'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (guestName.trim()) {
            onCreateGuest({
                name: guestName.trim(),
                age: parseInt(guestAge) || 0,
                avatar: guestAvatar,
                role: guestRole
            });
        }
    };

    return (
        <Modal onClose={onClose} title="Guest Profil Létrehozása">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">Név *</label>
                    <input
                        type="text"
                        id="guestName"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adja meg a gyerek nevét"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="guestAge" className="block text-sm font-medium text-gray-700">Életkor</label>
                    <input
                        type="number"
                        id="guestAge"
                        value={guestAge}
                        onChange={(e) => setGuestAge(e.target.value)}
                        min="0"
                        max="18"
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                    />
                </div>
                
                <div>
                    <label htmlFor="guestRole" className="block text-sm font-medium text-gray-700">Szerep</label>
                    <select
                        id="guestRole"
                        value={guestRole}
                        onChange={(e) => setGuestRole(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="child">Gyerek</option>
                        <option value="teenager">Tizenéves</option>
                        <option value="adult">Felnőtt</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar kiválasztása</label>
                    <div className="grid grid-cols-8 gap-2">
                        {avatars.map((avatar, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setGuestAvatar(avatar)}
                                className={`p-2 text-2xl rounded-lg border-2 transition-all duration-200 ${
                                    guestAvatar === avatar 
                                        ? 'border-blue-500 bg-blue-50 scale-110' 
                                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                                }`}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        Guest profilok gyerekeknek készülnek, akik még nem rendelkeznek saját fiókkal. Később ők is beléphetnek a saját profiljukkal.
                    </p>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !guestName.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Létrehozás...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-baby mr-2"></i>
                                Guest Profil Létrehozása
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Mégse
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GuestProfileModal;
