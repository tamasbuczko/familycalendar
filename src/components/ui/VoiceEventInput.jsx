import React, { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig.js';

/**
 * Hangalapú eseményfelvétel komponens
 * 
 * Folyamat:
 * 1. Felhasználó rákattint a mikrofon gombra
 * 2. Beszél (pl. "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor")
 * 3. Web Speech API szöveggé alakítja
 * 4. AI feldolgozza és JSON-t ad vissza
 * 5. Esemény létrehozása a naptárban
 */
const VoiceEventInput = ({ familyId, onEventCreated, onError }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef(null);

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

        recognition.onstart = () => {
            setIsListening(true);
            // Ne töröljük a meglévő szöveget, csak jelöljük, hogy hallgatunk
        };

        recognition.onresult = (event) => {
            let newText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newText += transcript + ' ';
                }
            }

            // Hozzáfűzzük az új szöveget a meglévőhöz
            if (newText.trim()) {
                setTranscript(prev => {
                    const trimmed = prev.trim();
                    return trimmed ? `${trimmed} ${newText.trim()}` : newText.trim();
                });
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (onError) {
                onError(`Hangfelismerési hiba: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Ne dolgozzuk fel automatikusan, csak jelenítsük meg a szöveget
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
            console.log('🎤 VoiceEventInput: Starting text processing...');
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

            const validatedEvent = parseResult.data.event;
            
            // Debug: logoljuk az esemény adatait
            console.log('Parsed event data:', validatedEvent);

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
            console.log('🏁 VoiceEventInput: Processing finished');
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
        setTranscript(e.target.value);
    };

    // Szöveg mező törlése
    const handleClearText = () => {
        setTranscript('');
    };

    return (
        <div className="voice-event-input">
            <div className="flex items-center gap-3">
                {/* Mikrofon gomb */}
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                        isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isListening ? 'Hangfelvétel leállítása' : 'Hangalapú eseményfelvétel'}
                >
                    <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-white text-lg`}></i>
                </button>

                {/* Szöveg input mező */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={transcript}
                        onChange={handleTextChange}
                        placeholder={isListening ? 'Hallgatás...' : 'Írj be szöveget vagy használd a mikrofont...'}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {/* Törlés gomb (X) */}
                    {transcript && !isProcessing && (
                        <button
                            type="button"
                            onClick={handleClearText}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Szöveg törlése"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    {/* Feldolgozás indikátor */}
                    {isProcessing && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600">
                            <i className="fas fa-spinner fa-spin"></i>
                        </div>
                    )}
                </div>

                {/* Felvétel gomb (ha van szöveg) */}
                {transcript.trim() && !isListening && !isProcessing && (
                    <button
                        type="button"
                        onClick={handleManualSubmit}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <i className="fas fa-check mr-2"></i>Felvétel
                    </button>
                )}
            </div>

            {/* Segítség szöveg */}
            <div className="mt-2 text-xs text-gray-500">
                <p>Példa: "vegyél fel egy eseményt anyámnál vacsorával hétfő este 8kor"</p>
            </div>
        </div>
    );
};

export default VoiceEventInput;

