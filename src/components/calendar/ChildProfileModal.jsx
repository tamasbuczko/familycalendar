import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const ChildProfileModal = ({ onClose, onCreateChild, loading, editingMember }) => {
    const [childName, setChildName] = useState(editingMember?.name || '');
    const [childBirthDate, setChildBirthDate] = useState(editingMember?.birthDate || '');
    const [childAvatar, setChildAvatar] = useState(editingMember?.avatar || '👶');
    const [childRole, setChildRole] = useState(editingMember?.role || 'child');

    const avatars = [
        '👶', '👧', '👦', '👨‍🦰', '👩‍🦰', '👴', '👵', '🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐙', '🦄', '🌈'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (childName.trim()) {
            onCreateChild({
                name: childName.trim(),
                birthDate: childBirthDate,
                avatar: childAvatar,
                role: childRole
            });
        }
    };

    return (
        <Modal onClose={onClose} title={editingMember ? "Gyerek Profil Szerkesztése" : "Gyerek Profil Létrehozása"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="childName" className="block text-sm font-medium text-gray-700">Név *</label>
                    <input
                        type="text"
                        id="childName"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adja meg a gyerek nevét"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="childBirthDate" className="block text-sm font-medium text-gray-700">Születési dátum</label>
                    <input
                        type="date"
                        id="childBirthDate"
                        value={childBirthDate}
                        onChange={(e) => setChildBirthDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="childRole" className="block text-sm font-medium text-gray-700">Szerep</label>
                    <select
                        id="childRole"
                        value={childRole}
                        onChange={(e) => setChildRole(e.target.value)}
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
                                onClick={() => setChildAvatar(avatar)}
                                className={`p-2 text-2xl rounded-lg border-2 transition-all duration-200 ${
                                    childAvatar === avatar 
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
                        Gyerek profilok olyan családtagoknak készülnek, akik még nem rendelkeznek saját fiókkal. Később ők is beléphetnek a saját profiljukkal.
                    </p>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !childName.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin mr-2"></i>{editingMember ? 'Mentés...' : 'Létrehozás...'}</span>
                        ) : (
                            <span><i className="fas fa-plus mr-2"></i>{editingMember ? 'Mentés' : 'Létrehozás'}</span>
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

export default ChildProfileModal;
