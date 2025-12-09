import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';

const FamilySettingsModal = ({ isOpen, onClose, familyData, onSaveFamilyData, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        childrenCount: 0,
        location: ''
    });
    
    // Tracks if location was manually edited
    const [locationManuallyEdited, setLocationManuallyEdited] = useState(false);

    // Form adatok frissítése, ha a familyData változik
    useEffect(() => {
        if (familyData) {
            setFormData({
                name: familyData.name || '',
                city: familyData.city || '',
                childrenCount: familyData.childrenCount || 0,
                location: familyData.location || ''
            });
            // Reset manual edit flag when family data changes
            setLocationManuallyEdited(false);
        }
    }, [familyData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('Kérjük, adja meg a család nevét!');
            return;
        }
        
        if (!formData.city.trim()) {
            alert('Kérjük, adja meg a várost!');
            return;
        }
        
        if (formData.childrenCount < 0) {
            alert('A gyerekek száma nem lehet negatív!');
            return;
        }
        
        // Ha nincs location megadva, generáljuk a city alapján
        const location = formData.location.trim() || `${formData.city.trim()},HU`;
        
        onSaveFamilyData({
            ...formData,
            location
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            
            // Ha a város változik és a location nem lett manuálisan szerkesztve, frissítsük automatikusan
            if (field === 'city' && !locationManuallyEdited) {
                newData.location = value.trim() ? `${value.trim()},HU` : '';
            }
            
            return newData;
        });
    };
    
    const handleLocationChange = (value) => {
        setFormData(prev => ({
            ...prev,
            location: value
        }));
        // Jelöljük meg, hogy a location manuálisan lett szerkesztve
        setLocationManuallyEdited(true);
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Család Beállítások">
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <i className="fas fa-home mr-2"></i>
                        Család Adatok
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                                Család neve *
                            </label>
                            <input
                                type="text"
                                id="familyName"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="pl. Kovács Család"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                Város *
                            </label>
                            <input
                                type="text"
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="pl. Budapest"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700 mb-2">
                                Gyerekek száma
                            </label>
                            <input
                                type="number"
                                id="childrenCount"
                                value={formData.childrenCount}
                                onChange={(e) => handleInputChange('childrenCount', parseInt(e.target.value) || 0)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                max="20"
                            />
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Időjárás helyszín
                            </label>
                            <input
                                type="text"
                                id="location"
                                value={formData.location}
                                onChange={(e) => handleLocationChange(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="pl. Budapest,HU (automatikusan generálódik a város alapján)"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                <i className="fas fa-info-circle mr-1"></i>
                                Ha üresen hagyod, automatikusan a város alapján generálódik (pl. Budapest → Budapest,HU). 
                                Ha manuálisan szerkeszted, akkor az marad.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading || !formData.name.trim() || !formData.city.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span><i className="fas fa-spinner fa-spin mr-2"></i>Mentés...</span>
                                ) : (
                                    <span><i className="fas fa-save mr-2"></i>Család Adatok Mentése</span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fas fa-times mr-2"></i>Mégsem
                            </button>
                        </div>
                    </form>
                </div>

                {/* Információ */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        Fontos információk
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• A család neve látható a családtagok számára</li>
                        <li>• A város az időjárás riasztásokhoz szükséges</li>
                        <li>• Az időjárás helyszín automatikusan generálódik, ha üresen hagyod</li>
                        <li>• A gyerekek száma segít a megfelelő funkciók beállításában</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default FamilySettingsModal;
