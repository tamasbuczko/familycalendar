import React from 'react';

const MessageDisplay = ({ message }) => {
    if (!message) return null;
    
    return (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {message}
        </div>
    );
};

export default MessageDisplay;
