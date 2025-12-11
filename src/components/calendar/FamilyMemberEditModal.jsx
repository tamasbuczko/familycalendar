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
    const [color, setColor] = useState('#10B981'); // Alapértelmezett zöld
    const [role, setRole] = useState('adult');
    const [isChild, setIsChild] = useState(false);

    const avatars = [
        '👶', '👧', '👦', '👨‍🦰', '👩‍🦰', '👴', '👵', '🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐙', '🦄', '🌈'
    ];

    // Előre definiált színpaletta - eltérő színek
    const predefinedColors = [
        { name: 'Zöld', value: '#10B981', bg: 'bg-green-500', text: 'text-green-50' },
        { name: 'Kék', value: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-50' },
        { name: 'Lila', value: '#8B5CF6', bg: 'bg-purple-500', text: 'text-purple-50' },
        { name: 'Rózsaszín', value: '#EC4899', bg: 'bg-pink-500', text: 'text-pink-50' },
        { name: 'Narancs', value: '#F59E0B', bg: 'bg-orange-500', text: 'text-orange-50' },
        { name: 'Piros', value: '#EF4444', bg: 'bg-red-500', text: 'text-red-50' },
        { name: 'Türkiz', value: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-50' },
        { name: 'Sárga', value: '#EAB308', bg: 'bg-yellow-500', text: 'text-yellow-50' },
        { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500', text: 'text-indigo-50' },
        { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500', text: 'text-teal-50' }
    ];

    // Inicializálás szerkesztési módban
    useEffect(() => {
        if (editingMember) {
            setName(editingMember.name || '');
            setEmail(editingMember.email || '');
            setBirthDate(editingMember.birthDate || '');
            setAvatar(editingMember.avatar || '👶');
            setColor(editingMember.color || '#10B981');
            setRole(editingMember.role || 'adult');
            setIsChild(editingMember.isChild || false);
        } else {
            // Új családtag alapértelmezett értékek - automatikusan választunk egy színt, ami még nincs használatban
            setName('');
            setEmail('');
            setBirthDate('');
            setAvatar('👶');
            // Alapértelmezett szín: zöld
            setColor('#10B981');
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
                color: color,
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
                                className={`text-2xl rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Szín kiválasztása</label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                        {predefinedColors.map((colorOption, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setColor(colorOption.value)}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                    color === colorOption.value 
                                        ? 'border-gray-800 scale-110 ring-2 ring-offset-2 ring-gray-400' 
                                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                                }`}
                                style={{ backgroundColor: colorOption.value }}
                                title={colorOption.name}
                            >
                                {color === colorOption.value && (
                                    <span className="text-white text-xs font-bold">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            title="Egyedi szín választása"
                        />
                        <span className="text-xs text-gray-600">Egyedi szín</span>
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
