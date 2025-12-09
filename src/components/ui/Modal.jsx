import React from 'react';

// Modal komponens
const Modal = ({ children, onClose, title, isOpen = true }) => {
    if (!isOpen) {
        return null;
    }
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                    <i className="fas fa-times"></i>
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal; 