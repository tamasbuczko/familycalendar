import React, { useState, useEffect } from 'react';

/**
 * Színprioritás váltó komponens
 * Váltható a családtag színe és az esemény/sablon színe között
 */
const ColorPriorityToggle = ({ onChange }) => {
    // localStorage-ból betöltjük az állapotot, alapértelmezett: 'tag'
    const [priority, setPriority] = useState(() => {
        const saved = localStorage.getItem('eventColorPriority');
        return saved === 'event' ? 'event' : 'tag';
    });

    useEffect(() => {
        // Mentjük localStorage-ba
        localStorage.setItem('eventColorPriority', priority);
        // Értesítjük a szülő komponenst
        if (onChange) {
            onChange(priority);
        }
    }, [priority, onChange]);

    const togglePriority = () => {
        setPriority(prev => prev === 'tag' ? 'event' : 'tag');
    };

    return (
        <button
            onClick={togglePriority}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700"
            title={priority === 'tag' ? 'Színek: Családtag (kattints az Eseménytípusra váltáshoz)' : 'Színek: Eseménytípus (kattints a Családtagra váltáshoz)'}
        >
            {priority === 'tag' ? (
                <>
                    <span className="text-base">👤</span>
                    <span className="hidden sm:inline">Tag</span>
                </>
            ) : (
                <>
                    <span className="text-base">🎨</span>
                    <span className="hidden sm:inline">Esemény</span>
                </>
            )}
        </button>
    );
};

export default ColorPriorityToggle;

