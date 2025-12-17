import React, { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig.js';

/**
 * AI-alapú eseményfelvétel komponens
 * 
 * Folyamat:
 * 1. Felhasználó beírja vagy beszéli a szöveget (mikrofon gombbal)
 * 2. AI feldolgozza a természetes nyelvű szöveget (pl. "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor")
 * 3. AI JSON formátumba alakítja az esemény adatait
 * 4. Esemény automatikus létrehozása a naptárban
 */
const VoiceEventInput = ({ familyId, familyMembers, userId, currentUserMember, onEventCreated, onError }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');

    // Web Speech API inicializálása
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'hu-HU'; // Magyar nyelv

        // Tároljuk a felismert szöveget a felvétel alatt
        let recognizedText = '';

        recognition.onstart = () => {
            setIsListening(true);
            // Megtartjuk a meglévő szöveget, csak "Hallgatás..."-t jelenítjük meg
            const currentText = transcriptRef.current === 'Hallgatás...' ? '' : transcriptRef.current;
            recognizedText = ''; // Új felvétel, töröljük az előző felismert szöveget
            setTranscript('Hallgatás...');
        };

        recognition.onresult = (event) => {
            // Összegyűjtjük az összes végleges eredményt (nem jelenítjük meg valós időben)
            let finalText = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    // Csak a végleges eredményeket tároljuk
                    finalText += event.results[i][0].transcript + ' ';
                }
            }

            // Hozzáfűzzük a felismert szöveghez (de még nem jelenítjük meg)
            if (finalText.trim()) {
                recognizedText += finalText;
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            recognizedText = ''; // Töröljük a felismert szöveget hiba esetén
            // Ha még mindig "Hallgatás..." van a mezőben, akkor töröljük
            if (transcriptRef.current === 'Hallgatás...') {
                setTranscript('');
                transcriptRef.current = '';
            }
            if (onError) {
                onError(`Hangfelismerési hiba: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            
            // A felvétel vége: ha van felismert szöveg, hozzáfűzzük a meglévőhöz
            if (recognizedText.trim()) {
                const currentText = transcriptRef.current === 'Hallgatás...' ? '' : transcriptRef.current;
                const newText = currentText ? (currentText + ' ' + recognizedText.trim()) : recognizedText.trim();
                setTranscript(newText);
                transcriptRef.current = newText;
            } else {
                // Ha nincs felismert szöveg, akkor töröljük a "Hallgatás..."-t
                if (transcriptRef.current === 'Hallgatás...') {
                    setTranscript('');
                    transcriptRef.current = '';
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [familyId, onEventCreated, onError]);

    // Szöveg feldolgozása AI-val (csak gombra kattintáskor)
    const handleProcessText = async (text) => {
        if (!text || !text.trim()) {
            return;
        }

        setIsProcessing(true);

        try {
            console.log('🤖 AI Event Input: Starting text processing...');
            console.log('📝 Input text:', text);
            console.log('👤 Family ID:', familyId);
            console.log('⏳ Calling parseEventFromText function...');
            
            // AI feldolgozás Firebase Function-n keresztül (biztonságos, rate limited)
            const parseEventFromText = httpsCallable(functions, 'parseEventFromText');
            
            const startTime = Date.now();
            const parseResult = await parseEventFromText({
                text: text,
                familyId: familyId
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`✅ parseEventFromText completed in ${duration}ms`);
            console.log('📦 Response received:', parseResult.data);
            
            // Próbálkozások logolása (ha van)
            if (parseResult.data.attempts && Array.isArray(parseResult.data.attempts)) {
                console.group('🔄 API Próbálkozások');
                parseResult.data.attempts.forEach((attempt, index) => {
                    const status = attempt.success ? '✅' : '❌';
                    const error = attempt.error ? ` - ${attempt.error.substring(0, 50)}...` : '';
                    console.log(`${status} Modell: ${attempt.model}, Próbálkozás: ${attempt.attempt}${error}`);
                });
                console.log(`📊 Összesen: ${parseResult.data.attempts.length} próbálkozás`);
                console.groupEnd();
            }
            
            // Ha van debug info a response-ban, logoljuk
            if (parseResult.data.debug) {
                console.group('🔍 Debug Information');
                console.log('📥 Input text:', parseResult.data.debug.inputText);
                console.log('💬 Prompt:', parseResult.data.debug.prompt);
                console.log('🤖 API Response:', parseResult.data.debug.apiResponse);
                console.log('📋 Parsed JSON:', parseResult.data.debug.parsedJson);
                console.log('✅ Validated Event:', parseResult.data.debug.validatedEvent);
                console.groupEnd();
            }

            if (!parseResult.data.success || !parseResult.data.event) {
                console.error('❌ Parse failed:', parseResult.data);
                throw new Error('Nem sikerült feldolgozni a szöveget');
            }

            let validatedEvent = parseResult.data.event;
            
            // Debug: logoljuk az esemény adatait
            console.log('Parsed event data:', validatedEvent);

            // assignedTo konverzió: név -> ID
            if (validatedEvent.assignedTo) {
                if (validatedEvent.assignedTo === 'én' || validatedEvent.assignedTo.toLowerCase() === 'én' || validatedEvent.assignedTo.toLowerCase() === 'nekem') {
                    // Ha "én" vagy "nekem", akkor a jelenlegi felhasználó ID-ját használjuk
                    if (currentUserMember && currentUserMember.id) {
                        validatedEvent.assignedTo = currentUserMember.id;
                    } else if (userId) {
                        validatedEvent.assignedTo = `user_${userId}`;
                    } else {
                        validatedEvent.assignedTo = null;
                    }
                } else if (familyMembers && familyMembers.length > 0) {
                    // Keresés név alapján (case-insensitive)
                    const memberName = validatedEvent.assignedTo.toLowerCase().trim();
                    const foundMember = familyMembers.find(m => {
                        const memberNameLower = (m.name || '').toLowerCase().trim();
                        // Pontos egyezés vagy részleges egyezés (pl. "Péter" -> "Péternek")
                        return memberNameLower === memberName || 
                               memberNameLower.includes(memberName) || 
                               memberName.includes(memberNameLower);
                    });
                    
                    if (foundMember) {
                        validatedEvent.assignedTo = foundMember.id;
                    } else {
                        // Ha nem találjuk, akkor null-ra állítjuk
                        console.warn('Member not found for assignedTo:', validatedEvent.assignedTo);
                        validatedEvent.assignedTo = null;
                    }
                } else {
                    validatedEvent.assignedTo = null;
                }
            }

            // Esemény létrehozása
            const createEvent = httpsCallable(functions, 'createEvent');
            const createResult = await createEvent({
                familyId: familyId,
                event: validatedEvent
            });

            console.log('Create event result:', createResult.data);

            if (createResult.data.success) {
                if (onEventCreated) {
                    onEventCreated(createResult.data.eventId, validatedEvent);
                }
                setTranscript('');
                transcriptRef.current = '';
            } else {
                throw new Error('Esemény létrehozása sikertelen');
            }
        } catch (error) {
            console.group('❌ Error processing voice input');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error details:', error.details);
            
            // Ha van attempts info a hiba részletekben, logoljuk
            if (error.details && error.details.attempts) {
                console.group('🔄 Próbálkozások (hiba esetén)');
                error.details.attempts.forEach((attempt, index) => {
                    const status = attempt.success ? '✅' : '❌';
                    const errorMsg = attempt.error ? ` - ${attempt.error.substring(0, 50)}...` : '';
                    console.log(`${status} Modell: ${attempt.model}, Próbálkozás: ${attempt.attempt}${errorMsg}`);
                });
                console.groupEnd();
            }
            
            console.groupEnd();
            
            if (onError) {
                onError(`Hiba történt: ${error.message || 'Ismeretlen hiba'}`);
            }
        } finally {
            setIsProcessing(false);
            console.log('🏁 AI Event Input: Processing finished');
        }
    };

    // Hangfelvétel indítása/leállítása
    const toggleListening = () => {
        if (!recognitionRef.current) {
            if (onError) {
                onError('A hangfelismerés nem támogatott ebben a böngészőben');
            }
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
        }
    };

    // Manuális szöveg feldolgozása (teszteléshez)
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (transcript.trim()) {
            handleProcessText(transcript.trim());
        }
    };

    // Szöveg mező változása
    const handleTextChange = (e) => {
        const newValue = e.target.value;
        setTranscript(newValue);
        transcriptRef.current = newValue;
    };

    // Szöveg mező törlése
    const handleClearText = () => {
        setTranscript('');
        transcriptRef.current = '';
    };


    return (
        <div className="voice-event-input space-y-3">
            {/* Vízszintes elrendezés: Mikrofon | Szövegmező | Felvétel */}
            <div className="flex items-start gap-3">
                {/* Mikrofon gomb - bal oldal */}
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 flex-shrink-0 ${
                        isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isListening ? 'Hangfelvétel leállítása' : 'Hangalapú eseményfelvétel'}
                >
                    <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-white text-lg`}></i>
                </button>

                {/* Szöveg textarea mező - középen */}
                <div className="relative flex-1">
                    <textarea
                        value={transcript}
                        onChange={handleTextChange}
                        placeholder={!isListening ? 'Írj be szöveget vagy használd a mikrofont...' : ''}
                        disabled={isProcessing || isListening}
                        rows={3}
                        className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y min-h-[80px]"
                    />
                    {/* Törlés gomb (X) - jobb felső sarokban */}
                    {transcript && !isProcessing && (
                        <button
                            type="button"
                            onClick={handleClearText}
                            className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Szöveg törlése"
                        >
                            <i className="fas fa-times text-xs"></i>
                        </button>
                    )}
                    {/* Feldolgozás indikátor */}
                    {isProcessing && (
                        <div className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center text-blue-600">
                            <i className="fas fa-spinner fa-spin text-sm"></i>
                        </div>
                    )}
                </div>

                {/* Felvétel gomb - jobb oldal - mindig látható */}
                <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={transcript.trim().length < 20 || isProcessing || isListening}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 h-10 ${
                        transcript.trim().length >= 20 && !isProcessing && !isListening
                            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={transcript.trim().length < 20 ? 'Legalább 20 karakter szükséges' : 'Esemény felvétele'}
                >
                    <i className="fas fa-check"></i>
                    <span>Esemény felvétele</span>
                </button>
            </div>

            {/* Segítség szöveg */}
            <div className="text-xs text-gray-500">
                <p>Példa: "Vegyél fel egy eseményt a szüleim házához, családi vacsora címmel, péntek este 8-ra"</p>
            </div>
        </div>
    );
};

export default VoiceEventInput;

