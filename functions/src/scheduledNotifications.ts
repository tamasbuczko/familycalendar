import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Ütemezett értesítések küldése - cron job
 */
export const sendScheduledNotifications = async (context: functions.EventContext) => {
  const now = new Date();
  
  try {
    // Küldendő értesítések lekérése
    const notifications = await admin.firestore()
      .collection('scheduled_notifications')
      .where('status', '==', 'pending')
      .where('scheduledTime', '<=', now.toISOString())
      .limit(100) // Limit a teljesítmény miatt
      .get();
    
    console.log(`Found ${notifications.docs.length} notifications to send`);
    
    for (const notification of notifications.docs) {
      const notificationData = notification.data();
      
      try {
        // Felhasználó device token-jei
        const userPrefs = await admin.firestore()
          .collection('notification_preferences')
          .doc(notificationData.userId)
          .get();
        
        if (!userPrefs.exists) {
          console.log(`No user preferences found for user ${notificationData.userId}`);
          await notification.ref.update({ 
            status: 'failed', 
            errorMessage: 'User preferences not found',
            attempts: notificationData.attempts + 1
          });
          continue;
        }
        
        const deviceTokens = userPrefs.data()?.deviceTokens
          ?.filter((token: any) => token.isActive)
          ?.map((token: any) => token.token) || [];
        
        if (deviceTokens.length === 0) {
          console.log(`No active device tokens for user ${notificationData.userId}`);
          await notification.ref.update({ 
            status: 'failed', 
            errorMessage: 'No active device tokens',
            attempts: notificationData.attempts + 1
          });
          continue;
        }
        
        // Csendes órák ellenőrzése
        const preferences = userPrefs.data()?.preferences;
        if (preferences?.quietHours?.enabled) {
          const currentTime = new Date();
          const quietHours = preferences.quietHours;
          
          if (isInQuietHours(currentTime, quietHours.start, quietHours.end, quietHours.timezone)) {
            // Csendes órákban - értesítés késleltetése
            const nextAvailableTime = getNextAvailableTime(quietHours.end, quietHours.timezone);
            await notification.ref.update({ 
              scheduledTime: nextAvailableTime.toISOString() 
            });
            console.log(`Notification delayed to ${nextAvailableTime.toISOString()} due to quiet hours`);
            continue;
          }
        }
        
        // Értesítés küldése
        const messaging = admin.messaging();
        const response = await messaging.sendToDevice(deviceTokens, {
          notification: notificationData.message,
          data: notificationData.message.data
        });
        
        // Eredmények kezelése
        const failedTokens: string[] = [];
        response.results.forEach((result, index) => {
          if (result.error) {
            console.error(`Failed to send to token ${deviceTokens[index]}:`, result.error);
            failedTokens.push(deviceTokens[index]);
          }
        });
        
        if (failedTokens.length === deviceTokens.length) {
          // Minden token sikertelen
          await notification.ref.update({ 
            status: 'failed', 
            errorMessage: 'All device tokens failed',
            attempts: notificationData.attempts + 1
          });
        } else {
          // Sikeres küldés
          await notification.ref.update({ 
            status: 'sent', 
            sentAt: new Date().toISOString() 
          });
          
          console.log(`Successfully sent notification ${notification.id} to user ${notificationData.userId}`);
          
          // Sikertelen tokenek inaktiválása
          if (failedTokens.length > 0) {
            await updateDeviceTokens(notificationData.userId, failedTokens, false);
          }
        }
        
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        await notification.ref.update({ 
          status: 'failed', 
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          attempts: notificationData.attempts + 1
        });
      }
    }
    
    console.log('Scheduled notifications processing completed');
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    throw error;
  }
};

/**
 * Segédfüggvények
 */

// Csendes órák ellenőrzése
function isInQuietHours(currentTime: Date, startTime: string, endTime: string, timezone: string = 'Europe/Budapest'): boolean {
  try {
    // Aktuális idő a megadott időzónában
    const currentTimeInZone = new Date(currentTime.toLocaleString("en-US", { timeZone: timezone }));
    
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
}

// Következő elérhető idő kiszámítása
function getNextAvailableTime(endTime: string, timezone: string = 'Europe/Budapest'): Date {
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
}

// Device tokenek frissítése
async function updateDeviceTokens(userId: string, failedTokens: string[], isActive: boolean): Promise<void> {
  try {
    const userPrefsRef = admin.firestore()
      .collection('notification_preferences')
      .doc(userId);
    
    const userPrefs = await userPrefsRef.get();
    if (!userPrefs.exists) return;
    
    const deviceTokens = userPrefs.data()?.deviceTokens || [];
    const updatedTokens = deviceTokens.map((token: any) => {
      if (failedTokens.includes(token.token)) {
        return { ...token, isActive };
      }
      return token;
    });
    
    await userPrefsRef.update({ 
      deviceTokens: updatedTokens,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`Updated device tokens for user ${userId}`);
  } catch (error) {
    console.error('Error updating device tokens:', error);
  }
}
