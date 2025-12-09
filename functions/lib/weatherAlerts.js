"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWeatherAndSendAlerts = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * Időjárás ellenőrzés és riasztások - cron job
 */
const checkWeatherAndSendAlerts = async (context) => {
    var _a;
    try {
        // Aktív felhasználók lekérése
        const users = await admin.firestore()
            .collection('notification_preferences')
            .where('preferences.weatherAlerts.enabled', '==', true)
            .get();
        console.log(`Found ${users.docs.length} users with weather alerts enabled`);
        for (const user of users.docs) {
            const userData = user.data();
            const userId = user.id;
            const preferences = (_a = userData.preferences) === null || _a === void 0 ? void 0 : _a.weatherAlerts;
            if (!preferences)
                continue;
            try {
                // Felhasználó helyszíne (család városa)
                const familyLocation = await getUserFamilyLocation(userId);
                if (!familyLocation) {
                    console.log(`No family location found for user ${userId}`);
                    continue;
                }
                // Időjárás adatok lekérése
                const weatherData = await getWeatherData(familyLocation);
                if (!weatherData) {
                    console.log(`No weather data available for location ${familyLocation}`);
                    continue;
                }
                // Riasztások ellenőrzése
                const alerts = checkWeatherAlerts(weatherData, preferences);
                for (const alert of alerts) {
                    await scheduleWeatherAlert(userId, alert, weatherData);
                }
                // Időjárás cache frissítése
                await updateWeatherCache(familyLocation, weatherData);
            }
            catch (error) {
                console.error(`Error processing weather alerts for user ${userId}:`, error);
            }
        }
        console.log('Weather alerts processing completed');
    }
    catch (error) {
        console.error('Error processing weather alerts:', error);
        throw error;
    }
};
exports.checkWeatherAndSendAlerts = checkWeatherAndSendAlerts;
/**
 * Felhasználó családjának helyszínének lekérése
 */
async function getUserFamilyLocation(userId) {
    try {
        // Felhasználó családjának lekérése
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        if (!userDoc.exists)
            return null;
        const userData = userDoc.data();
        const familyId = userData === null || userData === void 0 ? void 0 : userData.currentFamilyId;
        if (!familyId)
            return null;
        // Család adatainak lekérése
        const familyDoc = await admin.firestore()
            .collection('families')
            .doc(familyId)
            .get();
        if (!familyDoc.exists)
            return null;
        const familyData = familyDoc.data();
        return (familyData === null || familyData === void 0 ? void 0 : familyData.location) || 'Budapest,HU'; // Alapértelmezett helyszín
    }
    catch (error) {
        console.error('Error getting user family location:', error);
        return 'Budapest,HU'; // Alapértelmezett helyszín
    }
}
/**
 * Időjárás adatok lekérése OpenWeatherMap API-ból
 */
async function getWeatherData(location) {
    var _a;
    try {
        // OpenWeatherMap API kulcs - ezt később be kell állítani
        const apiKey = ((_a = functions.config().openweathermap) === null || _a === void 0 ? void 0 : _a.key) || 'YOUR_API_KEY';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=hu`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Weather API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return {
            temperature: data.main.temp,
            condition: data.weather[0].main.toLowerCase(),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Weather API error:', error);
        return null;
    }
}
/**
 * Időjárás riasztások ellenőrzése
 */
function checkWeatherAlerts(weatherData, preferences) {
    const alerts = [];
    if (preferences.rainAlerts && weatherData.condition.includes('rain')) {
        alerts.push({
            type: 'rain',
            title: 'Eső várható!',
            body: `Jelenleg ${weatherData.description}. Ne felejtsd el az esernyőt!`,
            severity: 'medium'
        });
    }
    if (preferences.snowAlerts && weatherData.condition.includes('snow')) {
        alerts.push({
            type: 'snow',
            title: 'Hóesés várható!',
            body: `Jelenleg ${weatherData.description}. Óvatosan vezess!`,
            severity: 'high'
        });
    }
    if (preferences.extremeTemp) {
        if (weatherData.temperature < -10) {
            alerts.push({
                type: 'extreme_cold',
                title: 'Extrém hideg!',
                body: `Hőmérséklet: ${weatherData.temperature}°C. Melegen öltözz!`,
                severity: 'high'
            });
        }
        else if (weatherData.temperature > 35) {
            alerts.push({
                type: 'extreme_heat',
                title: 'Extrém meleg!',
                body: `Hőmérséklet: ${weatherData.temperature}°C. Kerüld a közvetlen napfényt!`,
                severity: 'high'
            });
        }
    }
    return alerts;
}
/**
 * Időjárás riasztás ütemezése
 */
async function scheduleWeatherAlert(userId, alert, weatherData) {
    try {
        await admin.firestore()
            .collection('scheduled_notifications')
            .add({
            userId,
            type: 'weather_alert',
            scheduledTime: new Date().toISOString(),
            message: {
                title: alert.title,
                body: alert.body,
                icon: '/icon-192x192.svg',
                badge: '/badge-72x72.png',
                data: {
                    type: 'weather_alert',
                    alertType: alert.type,
                    severity: alert.severity,
                    action: 'view_weather',
                    temperature: weatherData.temperature,
                    condition: weatherData.condition
                }
            },
            status: 'pending',
            attempts: 0,
            maxAttempts: 1,
            createdAt: new Date().toISOString()
        });
        console.log(`Scheduled weather alert for user ${userId}: ${alert.type}`);
    }
    catch (error) {
        console.error('Error scheduling weather alert:', error);
    }
}
/**
 * Időjárás cache frissítése
 */
async function updateWeatherCache(location, weatherData) {
    try {
        const cacheRef = admin.firestore()
            .collection('weather_cache')
            .doc(location);
        await cacheRef.set({
            location,
            currentWeather: weatherData,
            lastUpdated: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 perc múlva
        });
        console.log(`Updated weather cache for location ${location}`);
    }
    catch (error) {
        console.error('Error updating weather cache:', error);
    }
}
//# sourceMappingURL=weatherAlerts.js.map