import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * API endpoint esemény létrehozásához
 * POST /createEvent
 * 
 * Request body:
 * {
 *   familyId: string (kötelező),
 *   event: {
 *     name: string (kötelező),
 *     date?: string (YYYY-MM-DD, egyszeri eseményhez),
 *     time: string (HH:MM, kötelező),
 *     endTime?: string (HH:MM, opcionális),
 *     location?: string,
 *     assignedTo?: string,
 *     notes?: string,
 *     status?: 'active' | 'cancelled' | 'inactive' (default: 'active'),
 *     icon?: string,
 *     color?: string,
 *     recurrenceType?: 'none' | 'daily' | 'weekly' | 'monthly' (default: 'none'),
 *     startDate?: string (YYYY-MM-DD, ismétlődő eseményhez),
 *     endDate?: string (YYYY-MM-DD, ismétlődő eseményhez),
 *     recurrenceDays?: number[] (0-6, heti ismétlődéshez),
 *     visibility?: 'only_me' | 'family' | 'known_families' (default: 'family'),
 *     points?: number (default: 10),
 *     reminders?: {
 *       enabled?: boolean,
 *       times?: number[],
 *       sound?: boolean,
 *       vibration?: boolean
 *     },
 *     notificationRecipients?: string[]
 *   }
 * }
 */
// CORS beállítások explicit módon (ha szükséges)
export const createEvent = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
  // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { familyId, event } = data;

  // Validáció
  if (!familyId) {
    throw new functions.https.HttpsError('invalid-argument', 'familyId is required');
  }

  if (!event || !event.name) {
    throw new functions.https.HttpsError('invalid-argument', 'event.name is required');
  }

  if (!event.time) {
    throw new functions.https.HttpsError('invalid-argument', 'event.time is required');
  }

  // Ellenőrizzük, hogy a felhasználó tagja-e a családnak
  const projectId = process.env.GCLOUD_PROJECT || functions.config().project?.id || 'familyweekroutine';
  const familyRef = admin.firestore().doc(`artifacts/${projectId}/families/${familyId}`);
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Family not found');
  }

  // Ellenőrizzük, hogy a felhasználó tagja-e a családnak
  const membersRef = familyRef.collection('members');
  const membersSnapshot = await membersRef.where('userId', '==', userId).get();

  if (membersSnapshot.empty) {
    throw new functions.https.HttpsError('permission-denied', 'User is not a member of this family');
  }

  try {
    const currentTimestamp = new Date().toISOString();
    // A projectId-t a functions.config-ből vagy környezeti változóból kérjük le
    const projectId = process.env.GCLOUD_PROJECT || functions.config().project?.id || 'familyweekroutine';
    const eventsColRef = admin.firestore().collection(`artifacts/${projectId}/families/${familyId}/events`);

    // Alapértelmezett értékek
    const eventData: any = {
      name: event.name,
      time: event.time,
      endTime: event.endTime || null,
      location: event.location || '',
      assignedTo: event.assignedTo || '',
      notes: event.notes || '',
      status: event.status || 'active',
      cancellationReason: event.status === 'cancelled' ? (event.cancellationReason || null) : null,
      showAvatar: event.showAvatar !== undefined ? event.showAvatar : true,
      points: event.points || 10,
      visibility: event.visibility || 'family',
      icon: event.icon || null,
      color: event.color || null,
      exceptions: [],
      reminders: {
        enabled: event.reminders?.enabled !== undefined ? event.reminders.enabled : true,
        times: event.reminders?.times || [10, 30],
        sound: event.reminders?.sound !== undefined ? event.reminders.sound : true,
        vibration: event.reminders?.vibration !== undefined ? event.reminders.vibration : true
      },
      notificationRecipients: event.reminders?.enabled ? (event.notificationRecipients || [userId]) : [],
      createdBy: userId,
      lastModified: currentTimestamp,
      lastModifiedBy: userId
    };

    // Recurrence kezelés
    const recurrenceType = event.recurrenceType || 'none';
    
    if (recurrenceType === 'none') {
      // Egyszeri esemény
      // Ha nincs dátum, használjuk a mai dátumot
      const eventDate = event.date || new Date().toISOString().split('T')[0];
      
      // Validáljuk a dátum formátumát (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(eventDate)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid date format: ${eventDate}. Expected YYYY-MM-DD`);
      }
      
      eventData.date = eventDate;
      eventData.recurrenceType = 'none';
      eventData.startDate = null;
      eventData.endDate = null;
      eventData.recurrenceDays = [];
    } else {
      // Ismétlődő esemény
      // Ha nincs startDate, használjuk a mai dátumot
      const startDate = event.startDate || new Date().toISOString().split('T')[0];
      
      // Validáljuk a dátum formátumát
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid startDate format: ${startDate}. Expected YYYY-MM-DD`);
      }
      
      if (recurrenceType === 'weekly' && (!event.recurrenceDays || event.recurrenceDays.length === 0)) {
        // Ha heti ismétlődés van, de nincs recurrenceDays, akkor a mai napot használjuk
        const today = new Date();
        eventData.recurrenceDays = [today.getDay()];
      } else {
        eventData.recurrenceDays = recurrenceType === 'weekly' ? (event.recurrenceDays || []) : [];
      }

      eventData.recurrenceType = recurrenceType;
      eventData.startDate = startDate;
      eventData.endDate = event.endDate || null;
      eventData.date = null;
    }
    
    // Debug logolás
    console.log('Creating event with data:', {
      recurrenceType: eventData.recurrenceType,
      date: eventData.date,
      startDate: eventData.startDate,
      recurrenceDays: eventData.recurrenceDays,
      name: eventData.name,
      time: eventData.time
    });

    // Esemény létrehozása
    const eventRef = await eventsColRef.add(eventData);

    return {
      success: true,
      eventId: eventRef.id,
      message: 'Event created successfully'
    };
  } catch (error: any) {
    console.error('Error creating event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create event', error.message);
  }
});

