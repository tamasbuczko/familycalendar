// Hook a naptár segédfüggvényekhez
export const useCalendarUtils = () => {
    // Heti nézet generálása a kiválasztott nézet típus alapján
    const getDaysForView = (date, viewType) => {
        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Hétfőre állítás

        const days = [];
        if (viewType === 'day') {
            const dayDate = new Date(date);
            dayDate.setHours(0, 0, 0, 0);
            days.push(dayDate);
        } else if (viewType === 'week') {
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek.getTime());
                day.setDate(day.getDate() + i);
                day.setHours(0, 0, 0, 0);
                days.push(day);
            }
        } else if (viewType === 'weekdays-only') {
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek.getTime());
                day.setDate(day.getDate() + i);
                day.setHours(0, 0, 0, 0);
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
                return; // Kihagyjuk a törölt eseményeket
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
            } else if (event.recurrenceType === 'daily' || event.recurrenceType === 'weekly' || event.recurrenceType === 'monthly') {
                const eventStartDate = new Date(event.startDate);
                eventStartDate.setHours(0, 0, 0, 0);
                const eventEndDate = event.endDate ? new Date(event.endDate) : null;
                if (eventEndDate) eventEndDate.setHours(23, 59, 59, 999);

                currentDays.forEach(day => {
                    const currentDayStart = new Date(day);
                    currentDayStart.setHours(0, 0, 0, 0);
                    // Ellenőrizzük, hogy a nap az ismétlődő esemény dátumtartományán belül van-e
                    if (currentDayStart >= eventStartDate && (!eventEndDate || currentDayStart <= eventEndDate)) {
                        let shouldInclude = false;
                        
                        if (event.recurrenceType === 'daily') {
                            // Napi ismétlődés: minden nap
                            shouldInclude = true;
                        } else if (event.recurrenceType === 'weekly') {
                            // Heti ismétlődés: csak a kiválasztott napokon
                            if (event.recurrenceDays && event.recurrenceDays.includes(day.getDay())) {
                                shouldInclude = true;
                            }
                        } else if (event.recurrenceType === 'monthly') {
                            // Havi ismétlődés: ugyanazon a napon a hónapban (pl. minden hónap 15-én)
                            const startDay = eventStartDate.getDate();
                            if (day.getDate() === startDay) {
                                shouldInclude = true;
                            }
                        }
                        
                        if (shouldInclude) {
                            // Ellenőrizzük a kivételeket erre a specifikus előfordulásra
                            // A dátum formátuma: YYYY-MM-DD (string)
                            const dayDateString = day.toISOString().split('T')[0];
                            const exception = event.exceptions?.find(ex => {
                                // Biztosítjuk, hogy mindkét dátum string formátumban legyen
                                let exDate = ex.date;
                                if (exDate instanceof Date) {
                                    exDate = exDate.toISOString().split('T')[0];
                                } else if (typeof exDate === 'string') {
                                    // Ha már string, csak a dátum részt vesszük (YYYY-MM-DD)
                                    exDate = exDate.split('T')[0];
                                } else {
                                    exDate = null;
                                }
                                
                                return exDate === dayDateString;
                            });
                            // Ha van exception, az exception status-át használjuk, különben az eredeti esemény status-át
                            const occurrenceStatus = exception ? (exception.status || event.status) : event.status;
                            

                            if (occurrenceStatus !== 'deleted') { // Ne jelenítsük meg, ha véglegesen törölve van erre az előfordulásra
                                // Ha van kivétel, alkalmazzuk az összes kivétel mezőt
                                const eventData = exception ? { ...event, ...exception } : event;
                                
                                // FONTOS: Az occurrenceStatus-t használjuk a status mezőbe, nem az eventData.status-t
                                // mert az eventData.status lehet, hogy nem frissült az exception status-ával
                                // Normalizáljuk a dátumot helyi időzónában (00:00:00)
                                // A day objektum már normalizálva van (00:00:00 helyi időzónában)
                                // De biztosítjuk, hogy a displayDate is helyi időzónában legyen
                                const normalizedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
                                
                                const dayDateString = normalizedDay.toISOString().split('T')[0]; // YYYY-MM-DD formátum
                                
                                const displayEvent = {
                                    ...eventData,
                                    id: `${event.id}-${dayDateString}`, // Egyedi ID ehhez az előforduláshoz
                                    displayDate: normalizedDay, // Normalizált dátum helyi időzónában
                                    date: dayDateString, // Konziszencia miatt az egyszeri eseményekkel
                                    status: occurrenceStatus, // FONTOS: Az occurrenceStatus-t használjuk
                                    isRecurringOccurrence: true,
                                    originalEventId: event.id, // Hivatkozás az eredeti ismétlődő eseményre
                                };
                                
                                displayEvents.push(displayEvent);
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