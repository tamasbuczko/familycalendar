import React, { useState, useEffect } from 'react';

// Megerősítő Modal komponens
const ConfirmModal = ({ message, onConfirm, onCancel, showCancellationReason = false }) => {
    const [cancellationReason, setCancellationReason] = useState('');
    
    // Reset cancellationReason amikor a modal megnyílik
    useEffect(() => {
        setCancellationReason('');
    }, [showCancellationReason]);
    
    const handleConfirm = () => {
        if (showCancellationReason) {
            onConfirm(cancellationReason || '');
        } else {
            onConfirm();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Megerősítés</h2>
                <p className="text-gray-700 mb-6 text-center">{message}</p>
                
                {showCancellationReason && (
                    <div className="mb-6">
                        <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
                            Lemondás oka (opcionális):
                        </label>
                        <textarea
                            id="cancellationReason"
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Pl. elmarad az óra, betegség, stb."
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="3"
                        />
                    </div>
                )}
                
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleConfirm}
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