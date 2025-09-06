import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';

const InviteModal = ({ onClose, onSendInvite, familyName, loading }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteMessage, setInviteMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inviteEmail.trim()) {
            onSendInvite({
                email: inviteEmail.trim(),
                role: inviteRole,
                message: inviteMessage.trim()
            });
        }
    };

    return (
        <Modal onClose={onClose} title="Családtag Meghívása">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">E-mail cím *</label>
                    <input
                        type="email"
                        id="inviteEmail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="csaladtag@example.com"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">Szerep</label>
                    <select
                        id="inviteRole"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="member">Családtag</option>
                        <option value="parent">Szülő</option>
                        <option value="child">Gyerek</option>
                        <option value="grandparent">Nagyszülő</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="inviteMessage" className="block text-sm font-medium text-gray-700">Személyes üzenet (opcionális)</label>
                    <textarea
                        id="inviteMessage"
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Szia! Meghívlak a(z) ${familyName} családba...`}
                    />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        A meghívott személy e-mail címet kap, amelyen keresztül csatlakozhat a családhoz.
                    </p>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || !inviteEmail.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Küldés...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane mr-2"></i>
                                Meghívó Küldése
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

export default InviteModal;
