import React from 'react';

// Megerősítő Modal komponens
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Megerősítés</h2>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Igen
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Mégsem
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal; 