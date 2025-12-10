// Hook a naptár segédfüggvényekhez
export const useCalendarUtils = () => {
    // Heti nézet generálása a kiválasztott nézet típus alapján
    const getDaysForView = (date, viewType) => {
        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Hétfőre állítás

        const days = [];
        if (viewType === 'day') {
            days.push(new Date(date));
        } else if (viewType === 'week') {
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                days.push(day);
            }
        } else if (viewType === 'weekdays-only') {
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                if (day.getDay() !== 0 && day.getDay() !== 6) { // 0 = Vasárnap, 6 = Szombat
                    days.push(day);
                }
            }
        }
        return days;
    };

    // Navigáció a nézet típusától függően
    const navigateDays = (currentDate, offset, viewType) => {
        const newDate = new Date(currentDate);
        if (viewType === 'day') {
            newDate.setDate(currentDate.getDate() + offset);
        } else { // 'week' or 'weekdays-only'
            newDate.setDate(currentDate.getDate() + (offset * 7));
        }
        return newDate;
    };

    // Funkció az összes esemény előfordulásának generálásához az aktuális héten
    const getEventsForDisplay = (currentDays, allEvents) => {
        const displayEvents = [];
        const weekStart = new Date(currentDays[0]);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(currentDays[currentDays.length - 1]);
        weekEnd.setHours(23, 59, 59, 999);

        allEvents.forEach(event => {
            // Ne jelenítsük meg a törölt eseményeket (kivéve, ha van kivétel)
            if (event.status === 'deleted') {
                console.log("calendarUtils: Skipping deleted event", {
                    eventId: event.id,
                    eventName: event.name,
                    recurrenceType: event.recurrenceType
                });
                return; // Kihagyjuk a törölt eseményeket
            }
            
            // Debug log ismétlődő eseményekhez
            if (event.recurrenceType === 'weekly') {
                console.log("calendarUtils: Processing recurring event", {
                    eventId: event.id,
                    eventName: event.name,
                    exceptionsCount: event.exceptions?.length || 0,
                    exceptions: event.exceptions?.map(ex => ({ date: ex.date, status: ex.status })) || []
                });
            }
            
            if (event.recurrenceType === 'none') {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                // Csak akkor adjuk hozzá, ha az aktuális nézetben látható napok között esik
                if (eventDate >= weekStart && eventDate <= weekEnd) {
                    displayEvents.push({
                        ...event,
                        displayDate: eventDate, // Date objektumként tároljuk a rendezéshez
                        isRecurringOccurrence: false,
                        originalEventId: event.id,
                    });
                }
            } else if (event.recurrenceType === 'weekly') {
                const eventStartDate = new Date(event.startDate);
                eventStartDate.setHours(0, 0, 0, 0);
                const eventEndDate = event.endDate ? new Date(event.endDate) : null;
                if (eventEndDate) eventEndDate.setHours(23, 59, 59, 999);

                currentDays.forEach(day => {
                    const currentDayStart = new Date(day);
                    currentDayStart.setHours(0, 0, 0, 0);
                    // Ellenőrizzük, hogy a nap az ismétlődő esemény dátumtartományán belül van-e
                    if (currentDayStart >= eventStartDate && (!eventEndDate || currentDayStart <= eventEndDate)) {
                        // Ellenőrizzük, hogy a hét napja megegyezik-e
                        if (event.recurrenceDays && event.recurrenceDays.includes(day.getDay())) {
                            // Ellenőrizzük a kivételeket erre a specifikus előfordulásra
                            // A dátum formátuma: YYYY-MM-DD (string)
                            const dayDateString = day.toISOString().split('T')[0];
                            const exception = event.exceptions?.find(ex => {
                                // Biztosítjuk, hogy mindkét dátum string formátumban legyen
                                const exDate = typeof ex.date === 'string' ? ex.date : (ex.date instanceof Date ? ex.date.toISOString().split('T')[0] : null);
                                const matches = exDate === dayDateString;
                                if (matches) {
                                    console.log("calendarUtils: Found exception for date", {
                                        dayDateString,
                                        exDate,
                                        exceptionStatus: ex.status,
                                        exception: ex
                                    });
                                }
                                return matches;
                            });
                            const occurrenceStatus = exception ? exception.status : event.status;
                            
                            // Debug log, ha deleted státuszú
                            if (occurrenceStatus === 'deleted') {
                                console.log("calendarUtils: Skipping deleted occurrence", {
                                    eventId: event.id,
                                    dayDateString,
                                    hasException: !!exception,
                                    exceptionStatus: exception?.status,
                                    eventStatus: event.status
                                });
                            }

                            if (occurrenceStatus !== 'deleted') { // Ne jelenítsük meg, ha véglegesen törölve van erre az előfordulásra
                                // Ha van kivétel, alkalmazzuk az összes kivétel mezőt
                                const eventData = exception ? { ...event, ...exception } : event;
                                
                                displayEvents.push({
                                    ...eventData,
                                    id: `${event.id}-${day.toISOString().split('T')[0]}`, // Egyedi ID ehhez az előforduláshoz
                                    displayDate: day,
                                    date: day.toISOString().split('T')[0], // Konziszencia miatt az egyszeri eseményekkel
                                    status: occurrenceStatus,
                                    isRecurringOccurrence: true,
                                    originalEventId: event.id, // Hivatkozás az eredeti ismétlődő eseményre
                                });
                            }
                        }
                    }
                });
            }
        });

        // Eseményenkénti rendezés dátum és idő szerint
        displayEvents.sort((a, b) => {
            const dateA = a.displayDate;
            const dateB = b.displayDate;
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            // Ha a dátumok azonosak, rendezés idő szerint
            const timeA = new Date(`1970/01/01 ${a.time}`);
            const timeB = new Date(`1970/01/01 ${b.time}`);
            return timeA.getTime() - timeB.getTime();
        });

        return displayEvents;
    };

    return {
        getDaysForView,
        getEventsForDisplay,
        navigateDays
    };
}; 