import {
    doc,
    getDoc,
    addDoc,
    setDoc,
    collection,
} from 'firebase/firestore';

// Hardcoded ID for the example family
export const EXAMPLE_FAMILY_ID = 'DEMOCSALAD';

// Utility function to ensure the example family and its data exist
export const ensureExampleFamilyExists = async (database, projectId) => {
    const familyDocRef = doc(database, `artifacts/${projectId}/families/${EXAMPLE_FAMILY_ID}`);
    const familyDocSnap = await getDoc(familyDocRef);

    if (!familyDocSnap.exists()) {
        console.log("ensureExampleFamilyExists: Example family does not exist, creating it...");

        // Create family document
        await setDoc(familyDocRef, {
            name: `Példa Család`,
            createdAt: new Date().toISOString(),
            // No admin assigned here, as it's a generic example family.
        });

        // Add example members
        const membersColRef = collection(database, `artifacts/${projectId}/families/${EXAMPLE_FAMILY_ID}/members`);
        const sampleMembers = [
            { name: 'Anya' },
            { name: 'Apa' },
            { name: 'Gyermek 1' },
            { name: 'Gyermek 2' }
        ];
        const addedMemberRefs = [];
        for (const member of sampleMembers) {
            const docRef = await addDoc(membersColRef, member);
            addedMemberRefs.push(docRef.id);
        }

        // Add example events
        const eventsColRef = collection(database, `artifacts/${projectId}/families/${EXAMPLE_FAMILY_ID}/events`);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const sampleEvents = [
            {
                name: 'Bevásárlás',
                date: today.toISOString().split('T')[0],
                time: '17:00',
                endTime: '18:00',
                location: 'Szupermarket',
                assignedTo: addedMemberRefs[0] || '', // Anya
                notes: 'Tej, kenyér, zöldség',
                status: 'active',
                recurrenceType: 'none',
                startDate: null,
                endDate: null,
                recurrenceDays: [],
                exceptions: []
            },
            {
                name: 'Foci edzés',
                startDate: today.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
                time: '16:30',
                endTime: '17:30',
                location: 'Sportpálya',
                assignedTo: addedMemberRefs[2] || '', // Gyermek 1
                notes: 'Focicipő, víz',
                status: 'active',
                recurrenceType: 'weekly',
                recurrenceDays: [3, 5], // Szerda, Péntek (0=Vasárnap)
                exceptions: []
            },
            {
                name: 'Fogorvos',
                date: tomorrow.toISOString().split('T')[0],
                time: '10:00',
                endTime: '',
                location: 'Rendelő',
                assignedTo: addedMemberRefs[1] || '', // Apa
                notes: 'Gyermek 1 ellenőrzése',
                status: 'active',
                recurrenceType: 'none',
                startDate: null,
                endDate: null,
                recurrenceDays: [],
                exceptions: []
            },
            {
                name: 'Néptánc',
                startDate: today.toISOString().split('T')[0],
                endDate: null, // Nincs befejező dátum
                time: '15:00',
                endTime: '16:00',
                location: 'Művelődési Ház',
                assignedTo: addedMemberRefs[3] || '', // Gyermek 2
                notes: 'Néptánccucc',
                status: 'active',
                recurrenceType: 'weekly',
                recurrenceDays: [2], // Kedd
                exceptions: []
            },
            {
                name: 'Családi vacsora',
                date: dayAfterTomorrow.toISOString().split('T')[0],
                time: '19:00',
                endTime: '20:30',
                location: 'Otthon',
                assignedTo: '', // Mindenki
                notes: 'Nagyi is jön',
                status: 'active',
                recurrenceType: 'none',
                startDate: null,
                endDate: null,
                recurrenceDays: [],
                exceptions: []
            }
        ];

        for (const event of sampleEvents) {
            await addDoc(eventsColRef, event);
        }
        console.log("ensureExampleFamilyExists: Example family and data created.");
    } else {
        console.log("ensureExampleFamilyExists: Example family already exists.");
    }
}; 