import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Esemény létrehozásakor értesítések ütemezése
 */
export const scheduleEventNotifications = async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
  const event = snap.data();
  const { familyId } = context.params;
  
  if (!event) {
    console.error('Event data not found');
    return;
  }

  try {
    // Családtagok lekérése
    const familyMembers = await admin.firestore()
      .collection(`artifacts/${context.params.projectId}/families/${familyId}/members`)
      .get();
    
    console.log(`Found ${familyMembers.docs.length} family members for event ${context.params.eventId}`);
    
    // Minden családtaghoz értesítések ütemezése
    for (const member of familyMembers.docs) {
      const memberData = member.data();
      const userId = memberData.userId;
      
      if (!userId) {
        console.log('Member has no userId, skipping');
        continue;
      }
      
      // Felhasználó értesítési beállításai
      const userPrefs = await admin.firestore()
        .collection('notification_preferences')
        .doc(userId)
        .get();
      
      if (!userPrefs.exists) {
        console.log(`No notification preferences found for user ${userId}`);
        continue;
      }
      
      const preferences = userPrefs.data()?.preferences;
      
      if (!preferences?.eventReminders?.enabled) {
        console.log(`Event reminders disabled for user ${userId}`);
        continue;
      }
      
      // Emlékeztető idők
      const reminderTimes = preferences.eventReminders.times || [10, 30];
      
      console.log(`Scheduling notifications for user ${userId} with times: ${reminderTimes.join(', ')}`);
      
      for (const minutes of reminderTimes) {
        const scheduledTime = new Date(event.date);
        scheduledTime.setMinutes(scheduledTime.getMinutes() - minutes);
        
        // Csak jövőbeli értesítéseket ütemezünk
        if (scheduledTime > new Date()) {
          const notificationData = {
            userId,
            eventId: context.params.eventId,
            type: 'event_reminder',
            scheduledTime: scheduledTime.toISOString(),
            message: {
              title: `${minutes} perc múlva ott kell lennie`,
              body: `${event.name}${event.location ? ` - ${event.location}` : ''}`,
              icon: '/icon-192x192.svg',
              badge: '/badge-72x72.png',
              data: {
                eventId: context.params.eventId,
                action: 'view_event',
                url: `/calendar/event/${context.params.eventId}`
              }
            },
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date().toISOString()
          };
          
          await admin.firestore()
            .collection('scheduled_notifications')
            .add(notificationData);
          
          console.log(`Scheduled notification for user ${userId} at ${scheduledTime.toISOString()}`);
        } else {
          console.log(`Skipping notification for user ${userId} - scheduled time ${scheduledTime.toISOString()} is in the past`);
        }
      }
    }
    
    console.log(`Successfully scheduled notifications for event ${context.params.eventId}`);
  } catch (error) {
    console.error('Error scheduling event notifications:', error);
    throw error;
  }
};

/**
 * Esemény módosításakor értesítések frissítése
 */
export const updateEventNotifications = async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
  const event = snap.data();
  const { eventId } = context.params;
  
  if (!event) {
    console.error('Event data not found');
    return;
  }

  try {
    // Meglévő ütemezett értesítések lekérése
    const existingNotifications = await admin.firestore()
      .collection('scheduled_notifications')
      .where('eventId', '==', eventId)
      .where('status', '==', 'pending')
      .get();
    
    // Meglévő értesítések törlése
    const batch = admin.firestore().batch();
    existingNotifications.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'cancelled' });
    });
    await batch.commit();
    
    console.log(`Cancelled ${existingNotifications.docs.length} existing notifications for event ${eventId}`);
    
    // Új értesítések ütemezése (ha az esemény jövőbeli)
    const eventDate = new Date(event.date);
    if (eventDate > new Date()) {
      await scheduleEventNotifications(snap, context);
    }
    
    console.log(`Updated notifications for event ${eventId}`);
  } catch (error) {
    console.error('Error updating event notifications:', error);
    throw error;
  }
};

/**
 * Esemény törlésekor értesítések törlése
 */
export const deleteEventNotifications = async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
  const { eventId } = context.params;
  
  try {
    // Meglévő ütemezett értesítések lekérése
    const existingNotifications = await admin.firestore()
      .collection('scheduled_notifications')
      .where('eventId', '==', eventId)
      .where('status', '==', 'pending')
      .get();
    
    // Értesítések törlése
    const batch = admin.firestore().batch();
    existingNotifications.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'cancelled' });
    });
    await batch.commit();
    
    console.log(`Cancelled ${existingNotifications.docs.length} notifications for deleted event ${eventId}`);
  } catch (error) {
    console.error('Error deleting event notifications:', error);
    throw error;
  }
};
