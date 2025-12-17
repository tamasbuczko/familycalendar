import * as admin from 'firebase-admin';

/**
 * Szökőév ellenőrzés
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Dátum számítása adott évre (szökőév kezeléssel)
 */
function getEventDateForYear(month: number, day: number, year: number): Date {
  // Ha február 29. és nem szökőév, akkor február 28-án legyen
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28); // Február 28. (month 1 = február, mert 0-indexed)
  }
  
  // Normál eset
  return new Date(year, month - 1, day); // month - 1, mert Date konstruktor 0-indexed hónapokat használ
}

/**
 * Prémium státusz ellenőrzése
 */
async function isFamilyPremium(familyId: string, projectId: string): Promise<boolean> {
  try {
    const familyDoc = await admin.firestore()
      .doc(`artifacts/${projectId}/families/${familyId}`)
      .get();
    
    if (familyDoc.exists) {
      const familyData = familyDoc.data();
      // Elsősorban family szintű prémium
      if (familyData?.isPremium === true) {
        return true;
      }
    }
    
    // Fallback: user szintű prémium (első admin user)
    const familyData = familyDoc.data();
    if (familyData?.admin) {
      const userDoc = await admin.firestore()
        .doc(`artifacts/${projectId}/users/${familyData.admin}`)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.isPremium === true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Esemény generálása egy adott évre
 */
async function generateEventForYear(
  familyId: string,
  projectId: string,
  annualEventId: string,
  year: number,
  annualEventData: any,
  isReminder: boolean = false,
  reminderDaysBefore: number | null = null,
  reminderFor: string | null = null
): Promise<string | null> {
  try {
    // Idempotens ID generálás
    const eventIdSuffix = isReminder 
      ? `reminder-${reminderDaysBefore}-${year}`
      : `${year}`;
    const eventId = `annual-${annualEventId}-${eventIdSuffix}`;
    
    // Ellenőrizzük, hogy már létezik-e
    const existingEventRef = admin.firestore()
      .doc(`artifacts/${projectId}/families/${familyId}/events/${eventId}`);
    
    const existingEvent = await existingEventRef.get();
    
    if (existingEvent.exists) {
      console.log(`Event already exists: ${eventId}`);
      return eventId;
    }
    
    // Dátum számítása
    const [month, day] = annualEventData.date.split('-').map(Number);
    let eventDate: Date;
    
    if (isReminder && reminderDaysBefore) {
      // Emlékeztető dátum: az eredeti dátum - reminderDaysBefore nap
      const originalDate = getEventDateForYear(month, day, year);
      const reminderDate = new Date(originalDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);
      eventDate = reminderDate;
    } else {
      // Fő esemény dátum
      eventDate = getEventDateForYear(month, day, year);
    }
    
    // Ha az esemény múltban van, ne generáljuk (kivéve ha cleanup)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (eventDate < now && !isReminder) {
      console.log(`Skipping past event: ${eventId}`);
      return null;
    }
    
    // Esemény neve
    let eventName = '';
    if (isReminder) {
      if (reminderDaysBefore === 14) {
        eventName = `Emlékeztető: Ajándékvásárlás - ${annualEventData.name} ${annualEventData.type === 'birthday' ? 'szülinapja' : annualEventData.type === 'anniversary' ? 'évfordulója' : 'eseménye'} hamarosan! 🎁`;
      } else if (reminderDaysBefore === 2) {
        eventName = `Emlékeztető: Torta és dekoráció ellenőrzése - ${annualEventData.name} ${annualEventData.type === 'birthday' ? 'szülinapja' : annualEventData.type === 'anniversary' ? 'évfordulója' : 'eseménye'} 🎂`;
      } else {
        eventName = `Emlékeztető: ${annualEventData.name} ${annualEventData.type === 'birthday' ? 'szülinapja' : annualEventData.type === 'anniversary' ? 'évfordulója' : 'eseménye'} ${reminderDaysBefore} nap múlva`;
      }
    } else {
      // Fő esemény
      const typeLabels: { [key: string]: string } = {
        'birthday': 'születésnapja',
        'nameDay': 'névnapja',
        'anniversary': 'évfordulója',
        'other': 'eseménye'
      };
      const typeLabel = typeLabels[annualEventData.type] || 'eseménye';
      eventName = `${annualEventData.name} ${typeLabel} ${annualEventData.icon || '🎂'}`;
    }
    
    // Esemény adatok
    const eventData: any = {
      name: eventName,
      date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
      time: '00:00', // Egész napos esemény
      endTime: null,
      annualEventId: annualEventId,
      isAnnualEvent: !isReminder,
      isReminder: isReminder,
      reminderFor: reminderFor,
      reminderDaysBefore: reminderDaysBefore,
      color: annualEventData.color || (annualEventData.type === 'birthday' ? '#FFB6C1' : '#FFD700'),
      icon: isReminder ? '🎁' : (annualEventData.icon || '🎂'),
      opacity: isReminder ? 0.7 : 1.0,
      status: 'active',
      visibility: 'family',
      notes: annualEventData.notes || null,
      createdBy: annualEventData.createdBy || 'system',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'system'
    };
    
    // Létrehozás
    await existingEventRef.set(eventData);
    console.log(`Event created: ${eventId} for year ${year}`);
    
    return eventId;
  } catch (error) {
    console.error(`Error generating event for year ${year}:`, error);
    return null;
  }
}

/**
 * Éves események generálása egy annualEvent-hez
 */
export async function generateAnnualEventsForEvent(
  familyId: string,
  projectId: string,
  annualEventId: string,
  annualEventData: any,
  isPremium: boolean
): Promise<void> {
  try {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    // Fő esemény generálása jelenlegi évre és következő évre
    const mainEventCurrentYear = await generateEventForYear(
      familyId,
      projectId,
      annualEventId,
      currentYear,
      annualEventData,
      false
    );
    
    const mainEventNextYear = await generateEventForYear(
      familyId,
      projectId,
      annualEventId,
      nextYear,
      annualEventData,
      false
    );
    
    // Prémium esetén emlékeztetők generálása
    if (isPremium && annualEventData.notifyPrior !== false) {
      // 14 napos emlékeztető
      await generateEventForYear(
        familyId,
        projectId,
        annualEventId,
        currentYear,
        annualEventData,
        true,
        14,
        mainEventCurrentYear || undefined
      );
      
      await generateEventForYear(
        familyId,
        projectId,
        annualEventId,
        nextYear,
        annualEventData,
        true,
        14,
        mainEventNextYear || undefined
      );
      
      // 2 napos emlékeztető
      await generateEventForYear(
        familyId,
        projectId,
        annualEventId,
        currentYear,
        annualEventData,
        true,
        2,
        mainEventCurrentYear || undefined
      );
      
      await generateEventForYear(
        familyId,
        projectId,
        annualEventId,
        nextYear,
        annualEventData,
        true,
        2,
        mainEventNextYear || undefined
      );
    }
    
    console.log(`Generated events for annualEvent ${annualEventId}`);
  } catch (error) {
    console.error(`Error generating annual events for ${annualEventId}:`, error);
    throw error;
  }
}

/**
 * Családtag születésnap események generálása
 */
export async function generateBirthdayEventsForMember(
  familyId: string,
  projectId: string,
  memberId: string,
  memberData: any,
  isPremium: boolean
): Promise<void> {
  try {
    if (!memberData.birthDate) {
      console.log(`Member ${memberId} has no birthDate`);
      return;
    }
    
    // birthDate formátum: YYYY-MM-DD
    const [, birthMonth, birthDay] = memberData.birthDate.split('-').map(Number);
    
    // Annual event adatok
    const annualEventData = {
      name: memberData.name || 'Ismeretlen',
      type: 'birthday',
      date: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`, // MM-DD
      notifyPrior: true,
      color: memberData.color || '#FFB6C1',
      icon: '🎂',
      notes: null,
      createdBy: memberData.createdBy || 'system'
    };
    
    // Használjuk a memberId-t mint annualEventId-t (egyedi azonosító)
    const annualEventId = `member-birthday-${memberId}`;
    
    // Generálás
    await generateAnnualEventsForEvent(
      familyId,
      projectId,
      annualEventId,
      annualEventData,
      isPremium
    );
    
    console.log(`Generated birthday events for member ${memberId}`);
  } catch (error) {
    console.error(`Error generating birthday events for member ${memberId}:`, error);
    throw error;
  }
}

/**
 * Szinkronizálás: minden annualEvent-hez generál eseményeket
 */
export async function syncAnnualEvents(projectId: string): Promise<void> {
  try {
    console.log('Starting annual events sync...');
    
    // Összes family lekérése
    const familiesSnapshot = await admin.firestore()
      .collection(`artifacts/${projectId}/families`)
      .get();
    
    let processedCount = 0;
    const batchSize = 10; // Batch processing
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      
      // Prémium státusz ellenőrzése
      const isPremium = await isFamilyPremium(familyId, projectId);
      
      // Annual events lekérése
      const annualEventsSnapshot = await admin.firestore()
        .collection(`artifacts/${projectId}/families/${familyId}/annualEvents`)
        .get();
      
      for (const annualEventDoc of annualEventsSnapshot.docs) {
        const annualEventId = annualEventDoc.id;
        const annualEventData = annualEventDoc.data();
        
        // Generálás
        await generateAnnualEventsForEvent(
          familyId,
          projectId,
          annualEventId,
          annualEventData,
          isPremium
        );
        
        processedCount++;
        
        // Batch limit
        if (processedCount >= batchSize) {
          console.log(`Processed ${processedCount} annual events, taking a break...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 másodperc szünet
          processedCount = 0;
        }
      }
      
      // Members születésnapjai
      const membersSnapshot = await admin.firestore()
        .collection(`artifacts/${projectId}/families/${familyId}/members`)
        .where('birthDate', '!=', null)
        .get();
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberId = memberDoc.id;
        const memberData = memberDoc.data();
        
        // Generálás
        await generateBirthdayEventsForMember(
          familyId,
          projectId,
          memberId,
          memberData,
          isPremium
        );
        
        processedCount++;
        
        if (processedCount >= batchSize) {
          console.log(`Processed ${processedCount} items, taking a break...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          processedCount = 0;
        }
      }
    }
    
    // Cleanup: múltbeli emlékeztetők törlése (> 2 nap)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      
      const oldRemindersSnapshot = await admin.firestore()
        .collection(`artifacts/${projectId}/families/${familyId}/events`)
        .where('isReminder', '==', true)
        .where('date', '<', twoDaysAgo.toISOString().split('T')[0])
        .get();
      
      const batch = admin.firestore().batch();
      oldRemindersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (oldRemindersSnapshot.docs.length > 0) {
        await batch.commit();
        console.log(`Deleted ${oldRemindersSnapshot.docs.length} old reminders from family ${familyId}`);
      }
    }
    
    console.log('Annual events sync completed');
  } catch (error) {
    console.error('Error syncing annual events:', error);
    throw error;
  }
}

