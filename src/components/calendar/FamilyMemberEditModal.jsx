import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';

const FamilyMemberEditModal = ({ 
    onClose, 
    onSave, 
    loading, 
    editingMember,
    memberType = 'family' // 'family', 'child', 'guest', 'invited'
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatar, setAvatar] = useState('👶');
    const [role, setRole] = useState('adult');
    const [isChild, setIsChild] = useState(false);

    const avatars = [
        '👶', '👧', '👦', '👨‍🦰', '👩‍🦰', '👴', '👵', '🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐙', '🦄', '🌈'
    ];

    // Inicializálás szerkesztési módban
    useEffect(() => {
        if (editingMember) {
            setName(editingMember.name || '');
            setEmail(editingMember.email || '');
            setBirthDate(editingMember.birthDate || '');
            setAvatar(editingMember.avatar || '👶');
            setRole(editingMember.role || 'adult');
            setIsChild(editingMember.isChild || false);
        } else {
            // Új családtag alapértelmezett értékek
            setName('');
            setEmail('');
            setBirthDate('');
            setAvatar('👶');
            setRole(memberType === 'child' ? 'child' : 'adult');
            setIsChild(memberType === 'child');
        }
    }, [editingMember, memberType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            const memberData = {
                name: name.trim(),
                email: email.trim() || null,
                birthDate: birthDate || null,
                avatar: avatar,
                role: role,
                isChild: isChild
            };

            // Ha szerkesztés, akkor az ID-t is átadjuk
            if (editingMember) {
                memberData.id = editingMember.id;
            }

            onSave(memberData);
        }
    };

    const getTitle = () => {
        if (editingMember) {
            return "Családtag Szerkesztése";
        }
        
        switch (memberType) {
            case 'child':
                return "Gyerek Profil Létrehozása";
            case 'guest':
                return "Vendég Profil Létrehozása";
            case 'invited':
                return "Meghívott Felhasználó Hozzáadása";
            default:
                return "Családtag Hozzáadása";
        }
    };

    const getButtonText = () => {
        if (editingMember) {
            return loading ? "Mentés..." : "Mentés";
        }
        return loading ? "Létrehozás..." : "Létrehozás";
    };

    const getInfoText = () => {
        if (editingMember) return null;
        
        switch (memberType) {
            case 'child':
                return "Gyerek profilok olyan családtagoknak készülnek, akik még nem rendelkeznek saját fiókkal. Később ők is beléphetnek a saját profiljukkal.";
            case 'guest':
                return "Vendég profilok ideiglenes hozzáférést biztosítanak a családi naptárhoz.";
            case 'invited':
                return "Meghívott felhasználók saját fiókkal rendelkeznek és teljes hozzáférést kapnak a családi naptárhoz.";
            default:
                return "Új családtag hozzáadása a családi naptárhoz.";
        }
    };

    return (
        <Modal onClose={onClose} title={getTitle()}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="memberName" className="block text-sm font-medium text-gray-700">Név *</label>
                    <input
                        type="text"
                        id="memberName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adja meg a családtag nevét"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700">E-mail cím</label>
                    <input
                        type="email"
                        id="memberEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="email@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="memberBirthDate" className="block text-sm font-medium text-gray-700">Születési dátum</label>
                    <input
                        type="date"
                        id="memberBirthDate"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="memberRole" className="block text-sm font-medium text-gray-700">Szerep</label>
                    <select
                        id="memberRole"
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value);
                            setIsChild(e.target.value === 'child');
                        }}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="child">Gyerek</option>
                        <option value="teenager">Tizenéves</option>
                        <option value="adult">Felnőtt</option>
                        <option value="parent">Szülő</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar kiválasztása</label>
                    <div className="grid grid-cols-8 gap-2">
                        {avatars.map((avatarOption, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setAvatar(avatarOption)}
                                className={`p-2 text-2xl rounded-lg border-2 transition-all duration-200 ${
                                    avatar === avatarOption 
                                        ? 'border-blue-500 bg-blue-50 scale-110' 
                                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                                }`}
                            >
                                {avatarOption}
                            </button>
                        ))}
                    </div>
                </div>

                {getInfoText() && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <i className="fas fa-info-circle mr-2"></i>
                            {getInfoText()}
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin mr-2"></i>{getButtonText()}</span>
                        ) : (
                            <span><i className="fas fa-save mr-2"></i>{getButtonText()}</span>
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

export default FamilyMemberEditModal;
