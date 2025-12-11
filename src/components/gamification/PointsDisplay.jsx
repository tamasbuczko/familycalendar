import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../../firebaseConfig';

/**
 * Pontszám megjelenítő komponens
 * @param {Object} props
 * @param {Object} props.db - Firestore database instance
 * @param {string} props.memberId - Gyerek member ID
 * @param {string} props.familyId - Család ID
 * @param {string} props.view - Megjelenítési mód: 'profile' | 'card' | 'list'
 */
const PointsDisplay = ({ db, memberId, familyId, view = 'profile' }) => {
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || !memberId || !familyId) {
            setLoading(false);
            return;
        }

        const pointsDocRef = doc(
            db,
            `artifacts/${firebaseConfig.projectId}/families/${familyId}/member_points/${memberId}`
        );

        // Realtime listener
        const unsubscribe = onSnapshot(
            pointsDocRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setPoints(docSnapshot.data());
                    setError(null);
                } else {
                    // Ha nincs még pontszám dokumentum, null-t állítunk
                    setPoints(null);
                    setError(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("PointsDisplay: Error loading points:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [db, memberId, familyId]);

    // Loading state
    if (loading) {
        return (
            <div className="points-display points-display--loading">
                <div className="text-gray-500 text-sm">Betöltés...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="points-display points-display--error">
                <div className="text-red-500 text-sm">Hiba a pontszám betöltésekor</div>
            </div>
        );
    }

    // No points state
    if (!points || points.totalPoints === undefined) {
        if (view === 'profile') {
            return (
                <div className="points-display points-display--profile">
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">🌟</div>
                        <div className="text-gray-600 text-lg">Még nincs pontszám</div>
                        <div className="text-gray-500 text-sm mt-1">Teljesíts eseményeket, hogy pontokat gyűjts!</div>
                    </div>
                </div>
            );
        }
        return null; // Card és list view esetén ne jelenjen meg semmi
    }

    const totalPoints = points.totalPoints || 0;
    const weeklyPoints = points.weeklyPoints || 0;
    const monthlyPoints = points.monthlyPoints || 0;
    const pointsHistory = points.pointsHistory || [];

    // Profil nézet: nagy, részletes
    if (view === 'profile') {
        // Progress bar színezés (alacsony→sárga→zöld)
        const getProgressColor = (points) => {
            if (points < 50) return 'bg-yellow-400';
            if (points < 100) return 'bg-yellow-500';
            if (points < 200) return 'bg-green-400';
            return 'bg-green-500';
        };

        const weeklyProgressColor = getProgressColor(weeklyPoints);
        const monthlyProgressColor = getProgressColor(monthlyPoints);

        // Progress bar százalék (max 300 pont = 100%)
        const weeklyProgress = Math.min((weeklyPoints / 300) * 100, 100);
        const monthlyProgress = Math.min((monthlyPoints / 600) * 100, 100);

        // Utolsó 10 elem a történetből (legújabbak először)
        const recentHistory = pointsHistory
            .slice()
            .reverse()
            .slice(0, 10);

        return (
            <div className="points-display points-display--profile bg-white rounded-lg shadow-md p-6 mb-6">
                {/* Fő pontszám */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-5xl">🌟</span>
                        <div>
                            <div className="text-5xl font-bold text-gray-800">
                                {totalPoints.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">pont</div>
                        </div>
                    </div>
                </div>

                {/* Heti/Havi breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Heti pontszám */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Heti pontszám</span>
                            <span className="text-lg font-bold text-gray-800">{weeklyPoints}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${weeklyProgressColor}`}
                                style={{ width: `${weeklyProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Havi pontszám */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Havi pontszám</span>
                            <span className="text-lg font-bold text-gray-800">{monthlyPoints}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${monthlyProgressColor}`}
                                style={{ width: `${monthlyProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Mini history - Landing page stílus */}
                {recentHistory.length > 0 && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legutóbbi pontok</h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {recentHistory.map((entry, index) => (
                                <div
                                    key={`${entry.eventId}-${entry.timestamp}-${index}`}
                                    className="flex items-center justify-between p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                                    style={{
                                        backgroundColor: '#F9FAFB'
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-800 truncate text-sm">
                                            {entry.eventName || 'Esemény teljesítve'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(entry.date).toLocaleDateString('hu-HU', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                            {entry.completedBy === 'parent' && (
                                                <span className="ml-2 text-gray-400">(szülő)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 shadow-sm">
                                            +{entry.points} pont
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Card view: kicsi, eseménykártyán
    if (view === 'card') {
        return (
            <div className="points-display points-display--card inline-flex items-center gap-1 text-xs text-gray-500">
                <span>+{points.lastPoints || 0}p</span>
            </div>
        );
    }

    // List view: közepes, családtagok listájában
    if (view === 'list') {
        return (
            <div className="points-display points-display--list flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-semibold text-gray-800">{totalPoints}</span>
                <span className="text-sm text-gray-500">pts</span>
            </div>
        );
    }

    return null;
};

export default PointsDisplay;

