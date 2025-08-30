import React from 'react';
import Modal from '../ui/Modal.jsx';

const FamilyMemberModal = ({ newFamilyMemberName, setNewFamilyMemberName, onAdd, onClose, isEditing = false }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (newFamilyMemberName.trim()) {
            onAdd();
        }
    };

    return (
        <Modal onClose={onClose} title={isEditing ? "Családtag szerkesztése" : "Családtag hozzáadása"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="memberName" className="block text-sm font-medium text-gray-700">Név</label>
                    <input
                        type="text"
                        id="memberName"
                        value={newFamilyMemberName}
                        onChange={(e) => setNewFamilyMemberName(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adja meg a családtag nevét"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {isEditing ? "Mentés" : "Hozzáadás"}
                </button>
            </form>
        </Modal>
    );
};

export default FamilyMemberModal; 