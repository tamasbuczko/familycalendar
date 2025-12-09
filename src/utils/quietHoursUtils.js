/**
 * Csendes órák kezelése
 */

/**
 * Ellenőrzi, hogy az aktuális idő a csendes órákban van-e
 */
export const isInQuietHours = (currentTime, startTime, endTime, timezone = 'Europe/Budapest') => {
    try {
        // Aktuális idő a megadott időzónában
        const now = new Date();
        const currentTimeInZone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        
        // Csendes órák kezdete és vége
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const start = new Date(currentTimeInZone);
        start.setHours(startHour, startMinute, 0, 0);
        
        const end = new Date(currentTimeInZone);
        end.setHours(endHour, endMinute, 0, 0);
        
        // Ha a kezdő idő későbbi, mint a befejező idő (éjszakai csendes órák)
        if (start > end) {
            return currentTimeInZone >= start || currentTimeInZone <= end;
        } else {
            // Nappali csendes órák
            return currentTimeInZone >= start && currentTimeInZone <= end;
        }
    } catch (error) {
        console.error('Error checking quiet hours:', error);
        return false;
    }
};

/**
 * Kiszámítja a következő elérhető időt a csendes órák után
 */
export const getNextAvailableTime = (endTime, timezone = 'Europe/Budapest') => {
    try {
        const now = new Date();
        const currentTimeInZone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const nextAvailable = new Date(currentTimeInZone);
        nextAvailable.setHours(endHour, endMinute, 0, 0);
        
        // Ha a befejező idő már elmúlt ma, akkor holnapra számítjuk
        if (nextAvailable <= currentTimeInZone) {
            nextAvailable.setDate(nextAvailable.getDate() + 1);
        }
        
        return nextAvailable;
    } catch (error) {
        console.error('Error calculating next available time:', error);
        // Fallback: 1 óra múlva
        return new Date(Date.now() + 60 * 60 * 1000);
    }
};

/**
 * Formázza a csendes órák időtartamát
 */
export const formatQuietHours = (startTime, endTime) => {
    try {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const start = new Date();
        start.setHours(startHour, startMinute, 0, 0);
        
        const end = new Date();
        end.setHours(endHour, endMinute, 0, 0);
        
        const startFormatted = start.toLocaleTimeString('hu-HU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const endFormatted = end.toLocaleTimeString('hu-HU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `${startFormatted} - ${endFormatted}`;
    } catch (error) {
        console.error('Error formatting quiet hours:', error);
        return `${startTime} - ${endTime}`;
    }
};

/**
 * Ellenőrzi, hogy egy értesítés küldhető-e a csendes órák figyelembevételével
 */
export const canSendNotification = (userPreferences, currentTime = new Date()) => {
    try {
        const quietHours = userPreferences?.quietHours;
        
        if (!quietHours?.enabled) {
            return { canSend: true, reason: null };
        }
        
        const inQuietHours = isInQuietHours(
            currentTime, 
            quietHours.start, 
            quietHours.end, 
            quietHours.timezone
        );
        
        if (inQuietHours) {
            const nextAvailable = getNextAvailableTime(
                quietHours.end, 
                quietHours.timezone
            );
            
            return {
                canSend: false,
                reason: 'quiet_hours',
                nextAvailableTime: nextAvailable,
                quietHoursFormatted: formatQuietHours(quietHours.start, quietHours.end)
            };
        }
        
        return { canSend: true, reason: null };
    } catch (error) {
        console.error('Error checking notification permission:', error);
        return { canSend: true, reason: null };
    }
};

/**
 * Késleltet egy értesítést a csendes órák miatt
 */
export const delayNotificationForQuietHours = (notification, userPreferences) => {
    try {
        const quietHours = userPreferences?.quietHours;
        
        if (!quietHours?.enabled) {
            return notification;
        }
        
        const checkResult = canSendNotification(userPreferences);
        
        if (!checkResult.canSend && checkResult.reason === 'quiet_hours') {
            return {
                ...notification,
                scheduledTime: checkResult.nextAvailableTime.toISOString(),
                delayedReason: 'quiet_hours',
                originalScheduledTime: notification.scheduledTime
            };
        }
        
        return notification;
    } catch (error) {
        console.error('Error delaying notification for quiet hours:', error);
        return notification;
    }
};

/**
 * Alapértelmezett csendes órák beállítások
 */
export const getDefaultQuietHours = () => ({
    enabled: false,
    start: "22:00",
    end: "07:00",
    timezone: "Europe/Budapest"
});

/**
 * Csendes órák validálása
 */
export const validateQuietHours = (quietHours) => {
    const errors = [];
    
    if (!quietHours.start || !quietHours.end) {
        errors.push('A kezdő és befejező idő megadása kötelező');
    }
    
    if (quietHours.start && quietHours.end) {
        const [startHour, startMinute] = quietHours.start.split(':').map(Number);
        const [endHour, endMinute] = quietHours.end.split(':').map(Number);
        
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            errors.push('Érvénytelen időformátum');
        }
        
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            errors.push('Az óra 0-23 között kell legyen');
        }
        
        if (startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
            errors.push('A perc 0-59 között kell legyen');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Csendes órák tesztelése
 */
export const testQuietHours = (startTime, endTime, timezone = 'Europe/Budapest') => {
    const now = new Date();
    const testTimes = [
        new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 órával korábban
        new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 órával korábban
        now, // Most
        new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 órával később
        new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 órával később
    ];
    
    return testTimes.map(testTime => ({
        time: testTime.toLocaleString('hu-HU'),
        inQuietHours: isInQuietHours(testTime, startTime, endTime, timezone)
    }));
};
