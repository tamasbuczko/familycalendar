import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../../context/FirebaseContext.jsx';
import { firebaseConfig } from '../../firebaseConfig.js';

/**
 * Quick Add Dropdown komponens
 * Headerben [ + ] ikon, real-time szűrés a Saját Sablonok között
 */
const QuickAddDropdown = ({ onTemplateSelect, userId, userFamilyId }) => {
    const { db } = useFirebase();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userTemplates, setUserTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // User Templates lekérése
    useEffect(() => {
        if (!db || !userFamilyId) {
            setLoading(false);
            return;
        }

        const templatesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/families/${userFamilyId}/userTemplates`);
        
        const unsubscribe = onSnapshot(templatesColRef, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserTemplates(fetchedTemplates);
            setLoading(false);
        }, (error) => {
            console.error("QuickAddDropdown: Error loading user templates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userFamilyId]);

    // Szűrt sablonok (max 10)
    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) {
            return userTemplates.slice(0, 10);
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = userTemplates.filter(template =>
            template.name.toLowerCase().includes(query) ||
            (template.category && template.category.toLowerCase().includes(query))
        );

        return filtered.slice(0, 10);
    }, [userTemplates, searchQuery]);

    // Kattintás kívülre → bezárás
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleTemplateClick = (template) => {
        onTemplateSelect(template);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md transition duration-200 hover:scale-110"
                title="Gyors Hozzáadás"
            >
                <i className="fas fa-plus"></i>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Sablon keresése..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                <p className="mt-2 text-sm">Betöltés...</p>
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">
                                    {searchQuery.trim() 
                                        ? "Nincs találat." 
                                        : "Nincs aktivált sablon. Lépj a Sablonok oldalra!"}
                                </p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {filteredTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateClick(template)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-2xl">{template.icon || '📅'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{template.name}</p>
                                            {template.category && (
                                                <p className="text-xs text-gray-500 truncate">{template.category}</p>
                                            )}
                                        </div>
                                        {template.color && (
                                            <div 
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: template.color }}
                                            ></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickAddDropdown;

