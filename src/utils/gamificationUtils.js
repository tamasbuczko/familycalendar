import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

/**
 * Pontszám hozzáadása egy gyerekhez esemény teljesítésért
 * @param {Object} db - Firestore database instance
 * @param {string} familyId - Család ID
 * @param {string} memberId - Gyerek member ID (isChild: true)
 * @param {Object} event - Esemény objektum
 * @param {string} completedBy - "child" vagy "parent"
 * @param {string} completedByUserId - Ha szülő, akkor userId, ha gyerek, akkor null
 * @returns {Promise<number>} Hozzáadott pontok száma
 */
export const addPointsForEventCompletion = async (db, familyId, memberId, event, completedBy, completedByUserId = null) => {
    if (!db || !familyId || !memberId) {
        console.error("GamificationUtils: Missing required parameters");
        return 0;
    }

    try {
        // Pont érték meghatározása
        // Először az esemény points mezőjét nézzük, ha nincs, akkor 10 pont (alapértelmezett)
        let points = event.points !== undefined && event.points !== null ? event.points : 10;

        // Pontszám dokumentum referenciája
        const pointsDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${familyId}/member_points/${memberId}`);
        const pointsDoc = await getDoc(pointsDocRef);

        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentWeekStart = getWeekStart(currentDate);
        const currentMonthStart = getMonthStart(currentDate);

        let pointsData;
        if (pointsDoc.exists()) {
            // Ha már létezik, frissítjük
            pointsData = pointsDoc.data();
            
            // Pontszámok frissítése
            pointsData.totalPoints = (pointsData.totalPoints || 0) + points;
            pointsData.lastUpdated = currentDate.toISOString();

            // Heti pontszám frissítése
            if (!pointsData.weeklyPoints || pointsData.lastWeekStart !== currentWeekStart.toISOString().split('T')[0]) {
                pointsData.weeklyPoints = points;
                pointsData.lastWeekStart = currentWeekStart.toISOString().split('T')[0];
            } else {
                pointsData.weeklyPoints += points;
            }

            // Havi pontszám frissítése
            if (!pointsData.monthlyPoints || pointsData.lastMonthStart !== currentMonthStart.toISOString().split('T')[0]) {
                pointsData.monthlyPoints = points;
                pointsData.lastMonthStart = currentMonthStart.toISOString().split('T')[0];
            } else {
                pointsData.monthlyPoints += points;
            }

            // Pontszám történet hozzáadása
            if (!pointsData.pointsHistory) {
                pointsData.pointsHistory = [];
            }
            pointsData.pointsHistory.push({
                date: currentDateString,
                points: points,
                reason: "event_completed",
                eventId: event.id,
                eventName: event.name,
                completedBy: completedBy,
                completedByUserId: completedByUserId,
                timestamp: currentDate.toISOString()
            });

            // Csak az utolsó 100 bejegyzést tartjuk meg
            if (pointsData.pointsHistory.length > 100) {
                pointsData.pointsHistory = pointsData.pointsHistory.slice(-100);
            }

            await updateDoc(pointsDocRef, pointsData);
        } else {
            // Ha nem létezik, létrehozzuk
            pointsData = {
                memberId: memberId,
                familyId: familyId,
                totalPoints: points,
                weeklyPoints: points,
                monthlyPoints: points,
                lastWeekStart: currentWeekStart.toISOString().split('T')[0],
                lastMonthStart: currentMonthStart.toISOString().split('T')[0],
                pointsHistory: [{
                    date: currentDateString,
                    points: points,
                    reason: "event_completed",
                    eventId: event.id,
                    eventName: event.name,
                    completedBy: completedBy,
                    completedByUserId: completedByUserId,
                    timestamp: currentDate.toISOString()
                }],
                createdAt: currentDate.toISOString(),
                lastUpdated: currentDate.toISOString()
            };

            await setDoc(pointsDocRef, pointsData);
        }

        console.log("GamificationUtils: Points added successfully", {
            memberId,
            points,
            totalPoints: pointsData.totalPoints
        });

        return points;
    } catch (error) {
        console.error("GamificationUtils: Error adding points:", error);
        return 0;
    }
};

/**
 * Pontszám lekérése egy gyerekhez
 * @param {Object} db - Firestore database instance
 * @param {string} familyId - Család ID
 * @param {string} memberId - Gyerek member ID
 * @returns {Promise<Object|null>} Pontszám adatok vagy null
 */
export const getMemberPoints = async (db, familyId, memberId) => {
    if (!db || !familyId || !memberId) {
        return null;
    }

    try {
        const pointsDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${familyId}/member_points/${memberId}`);
        const pointsDoc = await getDoc(pointsDocRef);

        if (pointsDoc.exists()) {
            return pointsDoc.data();
        }

        return null;
    } catch (error) {
        console.error("GamificationUtils: Error getting member points:", error);
        return null;
    }
};

/**
 * Összes családtag pontszámának lekérése
 * @param {Object} db - Firestore database instance
 * @param {string} familyId - Család ID
 * @param {Array} memberIds - Gyerek member ID-k tömbje
 * @returns {Promise<Object>} Member ID -> Points mapping
 */
export const getAllMembersPoints = async (db, familyId, memberIds) => {
    if (!db || !familyId || !memberIds || memberIds.length === 0) {
        return {};
    }

    try {
        const pointsMap = {};
        const promises = memberIds.map(async (memberId) => {
            const points = await getMemberPoints(db, familyId, memberId);
            if (points) {
                pointsMap[memberId] = points;
            }
        });

        await Promise.all(promises);
        return pointsMap;
    } catch (error) {
        console.error("GamificationUtils: Error getting all members points:", error);
        return {};
    }
};

/**
 * Hét kezdete számítása
 */
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Hétfő az első nap
    return new Date(d.setDate(diff));
};

/**
 * Pontszám levonása egy gyerektől esemény teljesítés visszavonásakor
 * @param {Object} db - Firestore database instance
 * @param {string} familyId - Család ID
 * @param {string} memberId - Gyerek member ID (isChild: true)
 * @param {Object} event - Esemény objektum
 * @returns {Promise<number>} Levont pontok száma
 */
export const removePointsForEventCompletion = async (db, familyId, memberId, event) => {
    if (!db || !familyId || !memberId) {
        console.error("GamificationUtils: Missing required parameters");
        return 0;
    }

    try {
        // Pont érték meghatározása (ugyanaz, mint amit hozzáadtunk)
        // Először az esemény points mezőjét nézzük, ha nincs, akkor 10 pont (alapértelmezett)
        let points = event.points !== undefined && event.points !== null ? event.points : 10;

        // Pontszám dokumentum referenciája
        const pointsDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/families/${familyId}/member_points/${memberId}`);
        const pointsDoc = await getDoc(pointsDocRef);

        if (!pointsDoc.exists()) {
            console.log("GamificationUtils: No points document found, nothing to remove");
            return 0;
        }

        const pointsData = pointsDoc.data();
        
        // Megkeressük a legutolsó bejegyzést, ami az eseményhez tartozik
        const pointsHistory = pointsData.pointsHistory || [];
        const eventId = event.id || event.originalEventId;
        
        // Keresünk egy bejegyzést, ami az eseményhez tartozik (eventId alapján)
        // Visszafelé keresünk, hogy a legutolsó teljesítést találjuk meg
        let foundIndex = -1;
        for (let i = pointsHistory.length - 1; i >= 0; i--) {
            const entry = pointsHistory[i];
            if (entry.eventId === eventId && entry.reason === "event_completed" && entry.points === points) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex === -1) {
            console.log("GamificationUtils: No matching points entry found for event", eventId);
            return 0;
        }

        // Levonjuk a pontokat
        pointsData.totalPoints = Math.max(0, (pointsData.totalPoints || 0) - points);
        pointsData.lastUpdated = new Date().toISOString();

        // Heti pontszám frissítése
        const currentDate = new Date();
        const currentWeekStart = getWeekStart(currentDate);
        const currentWeekStartString = currentWeekStart.toISOString().split('T')[0];
        
        if (pointsData.lastWeekStart === currentWeekStartString) {
            pointsData.weeklyPoints = Math.max(0, (pointsData.weeklyPoints || 0) - points);
        }

        // Havi pontszám frissítése
        const currentMonthStart = getMonthStart(currentDate);
        const currentMonthStartString = currentMonthStart.toISOString().split('T')[0];
        
        if (pointsData.lastMonthStart === currentMonthStartString) {
            pointsData.monthlyPoints = Math.max(0, (pointsData.monthlyPoints || 0) - points);
        }

        // Eltávolítjuk a bejegyzést a történetből
        pointsData.pointsHistory = pointsHistory.filter((_, index) => index !== foundIndex);

        await updateDoc(pointsDocRef, pointsData);

        console.log("GamificationUtils: Points removed successfully", {
            memberId,
            points,
            totalPoints: pointsData.totalPoints
        });

        return points;
    } catch (error) {
        console.error("GamificationUtils: Error removing points:", error);
        return 0;
    }
};

/**
 * Hónap kezdete számítása
 */
const getMonthStart = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

