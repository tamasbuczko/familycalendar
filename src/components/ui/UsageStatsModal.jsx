import React from 'react';
import Modal from './Modal.jsx';

const UsageStatsModal = ({ isOpen, onClose, usageStats, userPlan = 'FREE' }) => {
    if (!usageStats) return null;

    const isFree = userPlan === 'FREE';
    const isPremium = userPlan === 'PREMIUM';

    const getUsageColor = (used, limit) => {
        const percentage = (used / limit) * 100;
        if (percentage >= 90) return 'text-red-500';
        if (percentage >= 70) return 'text-orange-500';
        return 'text-green-500';
    };

    const getUsageBarColor = (used, limit) => {
        const percentage = (used / limit) * 100;
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-orange-500';
        return 'bg-green-500';
    };

    const getUsagePercentage = (used, limit) => {
        return Math.round((used / limit) * 100);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Használati Statisztikák">
            <div className="space-y-6">
                {/* Terv információ */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">
                                {isFree ? '🆓 Ingyenes Terv' : '⭐ Prémium Terv'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {isFree 
                                    ? 'Alapvető funkciók korlátozott használattal'
                                    : 'Teljes hozzáférés minden funkcióhoz'
                                }
                            </p>
                        </div>
                        {isFree && (
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                Frissítés Prémiumra
                            </button>
                        )}
                    </div>
                </div>

                {/* Időjárás használat */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                        🌤️ Időjárás API
                    </h4>
                    
                    <div className="space-y-3">
                        {/* Automatikus hívások */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Automatikus hívások</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.weather.automatic.used, usageStats.weather.automatic.limit)}`}>
                                    {usageStats.weather.automatic.used}/{usageStats.weather.automatic.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.weather.automatic.used, usageStats.weather.automatic.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.weather.automatic.used, usageStats.weather.automatic.limit)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {usageStats.weather.automatic.remaining} hívás maradt ma
                            </p>
                        </div>

                        {/* Manuális hívások */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Manuális hívások</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.weather.manual.used, usageStats.weather.manual.limit)}`}>
                                    {usageStats.weather.manual.used}/{usageStats.weather.manual.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.weather.manual.used, usageStats.weather.manual.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.weather.manual.used, usageStats.weather.manual.limit)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {usageStats.weather.manual.remaining} hívás maradt ma
                            </p>
                        </div>
                    </div>
                </div>

                {/* Értesítések használat */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                        🔔 Értesítések
                    </h4>
                    
                    <div className="space-y-3">
                        {/* Összes értesítés */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Összes értesítés</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.notifications.total.used, usageStats.notifications.total.limit)}`}>
                                    {usageStats.notifications.total.used}/{usageStats.notifications.total.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.notifications.total.used, usageStats.notifications.total.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.notifications.total.used, usageStats.notifications.total.limit)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Esemény emlékeztetők */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Esemény emlékeztetők</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.notifications.eventReminders.used, usageStats.notifications.eventReminders.limit)}`}>
                                    {usageStats.notifications.eventReminders.used}/{usageStats.notifications.eventReminders.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.notifications.eventReminders.used, usageStats.notifications.eventReminders.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.notifications.eventReminders.used, usageStats.notifications.eventReminders.limit)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Időjárás riasztások */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Időjárás riasztások</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.notifications.weatherAlerts.used, usageStats.notifications.weatherAlerts.limit)}`}>
                                    {usageStats.notifications.weatherAlerts.used}/{usageStats.notifications.weatherAlerts.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.notifications.weatherAlerts.used, usageStats.notifications.weatherAlerts.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.notifications.weatherAlerts.used, usageStats.notifications.weatherAlerts.limit)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Firestore használat */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                        🗄️ Adatbázis műveletek
                    </h4>
                    
                    <div className="space-y-3">
                        {/* Olvasások */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Olvasások</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.firestore.reads.used, usageStats.firestore.reads.limit)}`}>
                                    {usageStats.firestore.reads.used}/{usageStats.firestore.reads.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.firestore.reads.used, usageStats.firestore.reads.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.firestore.reads.used, usageStats.firestore.reads.limit)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Írások */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Írások</span>
                                <span className={`text-sm font-medium ${getUsageColor(usageStats.firestore.writes.used, usageStats.firestore.writes.limit)}`}>
                                    {usageStats.firestore.writes.used}/{usageStats.firestore.writes.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getUsageBarColor(usageStats.firestore.writes.used, usageStats.firestore.writes.limit)}`}
                                    style={{ width: `${getUsagePercentage(usageStats.firestore.writes.used, usageStats.firestore.writes.limit)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Firebase Functions használat */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                        ⚡ Function hívások
                    </h4>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Function hívások</span>
                            <span className={`text-sm font-medium ${getUsageColor(usageStats.functions.used, usageStats.functions.limit)}`}>
                                {usageStats.functions.used}/{usageStats.functions.limit}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full ${getUsageBarColor(usageStats.functions.used, usageStats.functions.limit)}`}
                                style={{ width: `${getUsagePercentage(usageStats.functions.used, usageStats.functions.limit)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {usageStats.functions.remaining} hívás maradt ma
                        </p>
                    </div>
                </div>

                {/* Prémium előnyök */}
                {isFree && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">⭐ Prémium előnyök</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• 24 automatikus időjárás hívás naponta</li>
                            <li>• 100 manuális időjárás hívás naponta</li>
                            <li>• 500 értesítés naponta</li>
                            <li>• 10 emlékeztető eseményenként</li>
                            <li>• 10 időjárás riasztás naponta</li>
                            <li>• 10,000 adatbázis olvasás naponta</li>
                            <li>• 1,000 adatbázis írás naponta</li>
                            <li>• 2,000 function hívás naponta</li>
                        </ul>
                    </div>
                )}

                {/* Statisztikák frissítése */}
                <div className="text-xs text-gray-500 text-center">
                    Statisztikák napi szinten frissülnek
                </div>
            </div>
        </Modal>
    );
};

export default UsageStatsModal;
