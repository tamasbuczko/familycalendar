"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherData = exports.saveUserNotificationPreferences = exports.getUserNotificationPreferences = exports.sendTestNotification = exports.parseEventFromText = exports.createEvent = exports.onMemberCreated = exports.onMemberUpdated = exports.onAnnualEventUpdated = exports.onAnnualEventCreated = exports.syncAnnualEventsScheduled = exports.checkWeather = exports.sendNotifications = exports.onEventCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin inicializálás
admin.initializeApp();
// Importáljuk a notification függvényeket
const notifications_1 = require("./notifications");
const scheduledNotifications_1 = require("./scheduledNotifications");
const weatherAlerts_1 = require("./weatherAlerts");
const createEvent_1 = require("./createEvent");
Object.defineProperty(exports, "createEvent", { enumerable: true, get: function () { return createEvent_1.createEvent; } });
const parseEventFromText_1 = require("./parseEventFromText");
Object.defineProperty(exports, "parseEventFromText", { enumerable: true, get: function () { return parseEventFromText_1.parseEventFromText; } });
const annualEvents_1 = require("./annualEvents");
// Esemény létrehozásakor értesítések ütemezése
exports.onEventCreated = functions.firestore
    .document('artifacts/{projectId}/families/{familyId}/events/{eventId}')
    .onCreate(async (snap, context) => {
    return await (0, notifications_1.scheduleEventNotifications)(snap, context);
});
// Ütemezett értesítések küldése - minden percben fut
exports.sendNotifications = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
    return await (0, scheduledNotifications_1.sendScheduledNotifications)(context);
});
// Időjárás ellenőrzés és riasztások - 6 óránként (napi 4 hívás)
exports.checkWeather = functions.pubsub
    .schedule('every 6 hours')
    .onRun(async (context) => {
    return await (0, weatherAlerts_1.checkWeatherAndSendAlerts)(context);
});
// Éves események szinkronizálása - naponta 02:00-kor
exports.syncAnnualEventsScheduled = functions.pubsub
    .schedule('0 2 * * *') // Naponta 02:00 UTC (04:00 magyar idő)
    .timeZone('Europe/Budapest')
    .onRun(async (context) => {
    var _a;
    const projectId = process.env.GCLOUD_PROJECT || ((_a = functions.config().project) === null || _a === void 0 ? void 0 : _a.id) || 'familyweekroutine';
    return await (0, annualEvents_1.syncAnnualEvents)(projectId);
});
// Annual Event létrehozásakor/módosításakor események generálása
exports.onAnnualEventCreated = functions.firestore
    .document('artifacts/{projectId}/families/{familyId}/annualEvents/{annualEventId}')
    .onCreate(async (snap, context) => {
    const projectId = context.params.projectId;
    const familyId = context.params.familyId;
    const annualEventId = context.params.annualEventId;
    const annualEventData = snap.data();
    // Prémium státusz ellenőrzése
    const familyDoc = await admin.firestore()
        .doc(`artifacts/${projectId}/families/${familyId}`)
        .get();
    const familyData = familyDoc.data();
    const isPremium = (familyData === null || familyData === void 0 ? void 0 : familyData.isPremium) === true || false;
    // Generálás
    await (0, annualEvents_1.generateAnnualEventsForEvent)(familyId, projectId, annualEventId, annualEventData, isPremium);
});
exports.onAnnualEventUpdated = functions.firestore
    .document('artifacts/{projectId}/families/{familyId}/annualEvents/{annualEventId}')
    .onUpdate(async (change, context) => {
    const projectId = context.params.projectId;
    const familyId = context.params.familyId;
    const annualEventId = context.params.annualEventId;
    const newData = change.after.data();
    const oldData = change.before.data();
    // Csak akkor generálunk újra, ha a dátum vagy típus változott
    if (oldData.date !== newData.date || oldData.type !== newData.type || oldData.name !== newData.name) {
        // Töröljük a régi eseményeket
        const oldEventsSnapshot = await admin.firestore()
            .collection(`artifacts/${projectId}/families/${familyId}/events`)
            .where('annualEventId', '==', annualEventId)
            .get();
        const batch = admin.firestore().batch();
        oldEventsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        // Prémium státusz ellenőrzése
        const familyDoc = await admin.firestore()
            .doc(`artifacts/${projectId}/families/${familyId}`)
            .get();
        const familyData = familyDoc.data();
        const isPremium = (familyData === null || familyData === void 0 ? void 0 : familyData.isPremium) === true || false;
        // Új események generálása
        await (0, annualEvents_1.generateAnnualEventsForEvent)(familyId, projectId, annualEventId, newData, isPremium);
    }
});
// Member születésnap változásakor események generálása
exports.onMemberUpdated = functions.firestore
    .document('artifacts/{projectId}/families/{familyId}/members/{memberId}')
    .onUpdate(async (change, context) => {
    const projectId = context.params.projectId;
    const familyId = context.params.familyId;
    const memberId = context.params.memberId;
    const before = change.before.data();
    const after = change.after.data();
    // Csak akkor generálunk, ha a birthDate változott
    if (before.birthDate !== after.birthDate) {
        // Töröljük a régi születésnap eseményeket
        const annualEventId = `member-birthday-${memberId}`;
        const oldEventsSnapshot = await admin.firestore()
            .collection(`artifacts/${projectId}/families/${familyId}/events`)
            .where('annualEventId', '==', annualEventId)
            .get();
        const batch = admin.firestore().batch();
        oldEventsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        // Prémium státusz ellenőrzése
        const familyDoc = await admin.firestore()
            .doc(`artifacts/${projectId}/families/${familyId}`)
            .get();
        const familyData = familyDoc.data();
        const isPremium = (familyData === null || familyData === void 0 ? void 0 : familyData.isPremium) === true || false;
        // Új események generálása (ha van birthDate)
        if (after.birthDate) {
            await (0, annualEvents_1.generateBirthdayEventsForMember)(familyId, projectId, memberId, after, isPremium);
        }
    }
});
exports.onMemberCreated = functions.firestore
    .document('artifacts/{projectId}/families/{familyId}/members/{memberId}')
    .onCreate(async (snap, context) => {
    const projectId = context.params.projectId;
    const familyId = context.params.familyId;
    const memberId = context.params.memberId;
    const memberData = snap.data();
    // Prémium státusz ellenőrzése
    const familyDoc = await admin.firestore()
        .doc(`artifacts/${projectId}/families/${familyId}`)
        .get();
    const familyData = familyDoc.data();
    const isPremium = (familyData === null || familyData === void 0 ? void 0 : familyData.isPremium) === true || false;
    // Generálás (ha van birthDate)
    if (memberData.birthDate) {
        await (0, annualEvents_1.generateBirthdayEventsForMember)(familyId, projectId, memberId, memberData, isPremium);
    }
});
// Teszt értesítés küldése
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { token, title, body, data: notificationData } = data;
    if (!token || !title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        const message = {
            notification: {
                title,
                body,
                icon: '/icon-192x192.svg',
                badge: '/badge-72x72.png'
            },
            data: notificationData || {},
            token
        };
        const response = await admin.messaging().send(message);
        console.log('Test notification sent successfully:', response);
        return { success: true, messageId: response };
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send notification');
    }
});
// Felhasználó értesítési beállításainak lekérése
exports.getUserNotificationPreferences = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        const userDoc = await admin.firestore()
            .collection('notification_preferences')
            .doc(userId)
            .get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        else {
            // Alapértelmezett beállítások
            const defaultPreferences = {
                eventReminders: {
                    enabled: true,
                    times: [10, 30],
                    sound: true,
                    vibration: true
                },
                weatherAlerts: {
                    enabled: true,
                    rainAlerts: true,
                    snowAlerts: true,
                    extremeTemp: true,
                    checkInterval: 30
                },
                familyUpdates: {
                    enabled: true,
                    newEvents: true,
                    eventChanges: true,
                    childCheckins: true
                },
                quietHours: {
                    enabled: false,
                    start: "22:00",
                    end: "07:00",
                    timezone: "Europe/Budapest"
                }
            };
            // Mentjük az alapértelmezett beállításokat
            await admin.firestore()
                .collection('notification_preferences')
                .doc(userId)
                .set({
                preferences: defaultPreferences,
                lastUpdated: new Date().toISOString()
            });
            return { preferences: defaultPreferences };
        }
    }
    catch (error) {
        console.error('Error getting user notification preferences:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get preferences');
    }
});
// Felhasználó értesítési beállításainak mentése
exports.saveUserNotificationPreferences = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { preferences } = data;
    const userId = context.auth.uid;
    if (!preferences) {
        throw new functions.https.HttpsError('invalid-argument', 'Preferences are required');
    }
    try {
        await admin.firestore()
            .collection('notification_preferences')
            .doc(userId)
            .update({
            preferences,
            lastUpdated: new Date().toISOString()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error saving user notification preferences:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save preferences');
    }
});
// Időjárás adatok lekérése
exports.getWeatherData = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { location } = data;
    if (!location) {
        throw new functions.https.HttpsError('invalid-argument', 'Location is required');
    }
    try {
        // OpenWeatherMap API kulcs
        const apiKey = (_a = functions.config().openweathermap) === null || _a === void 0 ? void 0 : _a.key;
        if (!apiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'Weather API key not configured');
        }
        // Időjárás adatok lekérése
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=hu`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new functions.https.HttpsError('unavailable', `Weather API error: ${response.status}`);
        }
        const weatherData = await response.json();
        // Adatok formázása
        const formattedWeather = {
            temperature: weatherData.main.temp,
            condition: weatherData.weather[0].main.toLowerCase(),
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
            location: weatherData.name,
            country: weatherData.sys.country,
            timestamp: new Date().toISOString()
        };
        // Cache mentése
        await admin.firestore()
            .collection('weather_cache')
            .doc(location)
            .set({
            location,
            currentWeather: formattedWeather,
            lastUpdated: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 perc múlva
        });
        return {
            success: true,
            weather: formattedWeather
        };
    }
    catch (error) {
        console.error('Error getting weather data:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get weather data');
    }
});
//# sourceMappingURL=index.js.map