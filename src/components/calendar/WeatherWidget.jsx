import React, { useState, useEffect } from 'react';
import { useUsageLimits } from '../../utils/usageLimits.js';

// Időjárás widget komponens
const WeatherWidget = ({ location = "Budapest,HU", onWeatherUpdate, userId, familyData }) => {
    // Cache betöltése localStorage-ból
    const loadCachedWeather = () => {
        try {
            const cached = localStorage.getItem(`weather_cache_${userId || 'default'}`);
            if (cached) {
                const data = JSON.parse(cached);
                // Ellenőrizzük, hogy a cache nem régi (max 24 óra)
                const cacheAge = Date.now() - (data.timestamp || 0);
                if (cacheAge < 24 * 60 * 60 * 1000) {
                    return data.weather;
                }
            }
        } catch (error) {
            console.warn('Error loading cached weather:', error);
        }
        return null;
    };
    
    // Cache betöltése kezdeti állapotként
    const initialCachedWeather = loadCachedWeather();
    const [weather, setWeather] = useState(initialCachedWeather);
    const [loading, setLoading] = useState(!initialCachedWeather); // Töltse be, ha nincs cache
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(() => {
        try {
            const cached = localStorage.getItem(`weather_cache_${userId || 'default'}`);
            if (cached) {
                const data = JSON.parse(cached);
                return data.lastUpdated ? new Date(data.lastUpdated) : null;
            }
        } catch (error) {
            console.warn('Error loading cached lastUpdated:', error);
        }
        return null;
    });
    const [usageStats, setUsageStats] = useState(null);
    const [isEnabled, setIsEnabled] = useState(false); // Flag: engedélyezve van-e az időjárás widget
    
    // Használati korlátok kezelése
    const { 
        canMakeWeatherCall, 
        recordWeatherCall, 
        getUsageStats 
    } = useUsageLimits(userId);

    // Időjárás adatok lekérése
    const fetchWeatherData = async (isAutomatic = true, currentLocation = null) => {
        try {
            setLoading(true);
            setError(null);

            // Használati korlát ellenőrzése
            if (!canMakeWeatherCall(isAutomatic)) {
                const stats = getUsageStats();
                const limitType = isAutomatic ? 'automatic' : 'manual';
                
                // Ha manuális hívás és elfogyott a limit, mutassuk a cache-elt adatot
                if (!isAutomatic) {
                    const cached = loadCachedWeather();
                    if (cached) {
                        // Van cache, mutassuk azt
                        setWeather(cached);
                        console.log(`Manual weather call limit reached (${stats.weather.manual.used}/${stats.weather.manual.limit}), showing cached data`);
                        setLoading(false);
                        return;
                    }
                }
                
                // Automatikus hívás vagy nincs cache: dobjunk hibát
                setError(`Napi ${limitType} időjárás lekérdezési korlát elérve (${stats.weather[limitType].used}/${stats.weather[limitType].limit})`);
                setLoading(false);
                return;
            }

            // Ingyenes időjárás API használata közvetlenül (wttr.in - teljesen ingyenes, nincs API kulcs szükséges)
            const locationToUse = currentLocation || familyData?.location || location;
            
            // wttr.in API - teljesen ingyenes, CORS engedélyezett, nincs API kulcs szükséges
            // Formátum: wttr.in/{location}?format=j1 (JSON formátum)
            const encodedLocation = encodeURIComponent(locationToUse);
            const weatherUrl = `https://wttr.in/${encodedLocation}?format=j1&lang=hu`;
            
            // Timeout beállítása (10 másodperc)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            const response = await Promise.race([
                fetch(weatherUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                }),
                timeoutPromise
            ]);

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const weatherData = await response.json();
            
            // Adatok formázása wttr.in formátumból
            const current = weatherData.current_condition[0];
            const formattedWeather = {
                temperature: parseFloat(current.temp_C),
                condition: current.weatherCode < 3 ? 'clear' : 
                          current.weatherCode < 5 ? 'clouds' :
                          current.weatherCode < 7 ? 'rain' :
                          current.weatherCode < 9 ? 'drizzle' :
                          current.weatherCode < 11 ? 'thunderstorm' :
                          current.weatherCode < 13 ? 'snow' : 'mist',
                description: current.lang_hu ? current.lang_hu[0].value : current.weatherDesc[0].value,
                humidity: parseFloat(current.humidity),
                windSpeed: parseFloat(current.windspeedKmph) / 3.6, // km/h -> m/s
                location: weatherData.nearest_area[0].areaName[0].value,
                country: weatherData.nearest_area[0].country[0].value,
                timestamp: new Date().toISOString()
            };

            setWeather(formattedWeather);
            const now = new Date();
            setLastUpdated(now);
            
            // Cache mentése localStorage-ba
            try {
                localStorage.setItem(`weather_cache_${userId || 'default'}`, JSON.stringify({
                    weather: formattedWeather,
                    lastUpdated: now.toISOString(),
                    timestamp: now.getTime()
                }));
            } catch (error) {
                console.warn('Error saving weather cache:', error);
            }
            
            // Használat rögzítése
            recordWeatherCall(isAutomatic);
            
            // Használati statisztikák frissítése
            setUsageStats(getUsageStats());
            
            // Szülő komponens értesítése
            if (onWeatherUpdate) {
                onWeatherUpdate(formattedWeather);
            }
        } catch (err) {
            console.error('Weather fetch error:', err);
            
            // Timeout vagy hálózati hiba esetén informatív hibaüzenet
            if (err.message?.includes('timeout') || err.message?.includes('ERR_FAILED') || err.message?.includes('NetworkError')) {
                setError('Az időjárás szolgáltatás jelenleg nem elérhető. Kérjük, próbáld újra később.');
            } else {
                setError('Nem sikerült betölteni az időjárás adatokat');
            }
        } finally {
            setLoading(false);
        }
    };

    // Automatikus frissítés ellenőrzése - 6 óránként
    useEffect(() => {
        const checkAndRefresh = () => {
            const currentLocation = familyData?.location || location;
            const cached = loadCachedWeather();
            const cachedLastUpdated = lastUpdated;
            
            // Ha van cache és nem múlt el 6 óra, használjuk a cache-t
            if (cached && cachedLastUpdated && 
                (Date.now() - cachedLastUpdated.getTime()) < 6 * 60 * 60 * 1000) {
                setWeather(cached);
                setLoading(false);
                return;
            }
            
            // Ha nincs cache vagy elmúlt 6 óra, frissítsük automatikusan
            if (canMakeWeatherCall(true)) {
                setLoading(true);
                fetchWeatherData(true, currentLocation);
            } else {
                // Nincs limit, de van cache, mutassuk azt
                if (cached) {
                    setWeather(cached);
                    setLoading(false);
                } else {
                    // Nincs cache és nincs limit, de próbáljuk meg betölteni manuális hívással
                    if (canMakeWeatherCall(false)) {
                        setLoading(true);
                        fetchWeatherData(false, currentLocation);
                    } else {
                        setLoading(false);
                    }
                }
            }
        };
        
        // Ellenőrizzük azonnal (betöltéskor)
        checkAndRefresh();
        
        // 6 óránként ellenőrizzük
        const interval = setInterval(() => {
            checkAndRefresh();
        }, 6 * 60 * 60 * 1000); // 6 óra
        
        return () => clearInterval(interval);
    }, [location, familyData?.location]);

    // Használati statisztikák betöltése
    useEffect(() => {
        if (userId) {
            setUsageStats(getUsageStats());
        }
    }, [userId]);

    // Időjárás ikon lekérése
    const getWeatherIcon = (condition) => {
        const iconMap = {
            'clear': '☀️',
            'clouds': '☁️',
            'rain': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️',
            'fog': '🌫️',
            'haze': '🌫️',
            'dust': '🌪️',
            'sand': '🌪️',
            'ash': '🌋',
            'squall': '💨',
            'tornado': '🌪️'
        };
        
        return iconMap[condition] || '🌤️';
    };

    // Hőmérséklet szín kódolása
    const getTemperatureColor = (temp) => {
        if (temp < 0) return 'text-blue-600';
        if (temp < 10) return 'text-blue-500';
        if (temp < 20) return 'text-green-500';
        if (temp < 30) return 'text-yellow-500';
        if (temp < 35) return 'text-orange-500';
        return 'text-red-600';
    };

    // Öltözködési tanács
    const getClothingAdvice = (temp, condition) => {
        if (temp < 0) {
            return "❄️ Meleg ruhák, kabát, kesztyű, sál";
        } else if (temp < 10) {
            return "🧥 Kabát, hosszú ujjú ruha";
        } else if (temp < 20) {
            return "👕 Könnyű kabát vagy pulóver";
        } else if (temp < 30) {
            return "👕 Rövid ujjú ruha, könnyű ruházat";
        } else {
            return "🌞 Könnyű, szellős ruhák, napvédő";
        }
    };

    // Eső riasztás
    const isRainAlert = (condition) => {
        return ['rain', 'drizzle', 'thunderstorm'].includes(condition);
    };

    // IDEIGLENESEN KIKAPCSOLVA - Firebase Functions billing account probléma miatt
    // Ha nincs időjárás adat, ne jelenítsük meg a widget-et
    if (!weather && !loading && !error) {
        return null; // Ne jelenítsük meg, ha nincs adat és nincs hiba
    }

    if (loading && !weather) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Időjárás betöltése...</span>
                </div>
            </div>
        );
    }

    if (error) {
        // CORS vagy instance hiba esetén ne jelenítsük meg a hibát, csak csendben maradjunk
        const isServiceUnavailable = error.includes('CORS') || 
                                     error.includes('timeout') || 
                                     error.includes('nem elérhető') ||
                                     error.includes('internal') ||
                                     error.includes('unavailable');
        
        if (isServiceUnavailable) {
            // Ne jelenítsük meg a widget-et, ha a service nem elérhető
            return null;
        }
        
        return (
            <div className="bg-white rounded-lg shadow-md p-4 border border-red-200">
                <div className="flex items-center text-red-600">
                    <span className="text-xl mr-2">⚠️</span>
                    <div>
                        <p className="font-medium">Időjárás hiba</p>
                        <p className="text-sm text-gray-600">{error}</p>
                        <button 
                            onClick={() => fetchWeatherData(false)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            Újrapróbálás
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Ha nincs időjárás adat és nincs loading, ne jelenítsük meg a widget-et
    if (!weather && !loading) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            {/* Fejléc */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    🌤️ Időjárás
                </h3>
                <button 
                    onClick={() => fetchWeatherData(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Manuális frissítés"
                >
                    🔄
                </button>
            </div>

            {/* Fő időjárás információk */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <span className="text-4xl mr-3">
                        {getWeatherIcon(weather.condition)}
                    </span>
                    <div>
                        <div className={`text-3xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                            {Math.round(weather.temperature)}°C
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                            {weather.description}
                        </div>
                    </div>
                </div>
                
                <div className="text-right text-sm text-gray-600">
                    <div>💧 {weather.humidity}%</div>
                    <div>💨 {weather.windSpeed} m/s</div>
                </div>
            </div>

            {/* Öltözködési tanács */}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <div className="text-sm font-medium text-blue-800 mb-1">
                    👕 Öltözködési tanács:
                </div>
                <div className="text-sm text-blue-700">
                    {getClothingAdvice(weather.temperature, weather.condition)}
                </div>
            </div>

            {/* Eső riasztás */}
            {isRainAlert(weather.condition) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center text-yellow-800">
                        <span className="text-lg mr-2">☔</span>
                        <div>
                            <div className="font-medium">Eső várható!</div>
                            <div className="text-sm">Ne felejtsd el az esernyőt!</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Frissítés időpontja */}
            {lastUpdated && (
                <div className="text-xs text-gray-500 text-center">
                    Utoljára frissítve: {lastUpdated.toLocaleTimeString('hu-HU')}
                </div>
            )}

            {/* Helyszín */}
            <div className="text-xs text-gray-500 text-center mt-2">
                📍 {familyData?.location || location}
            </div>

            {/* Használati statisztikák */}
            {usageStats && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Automatikus hívások:</span>
                            <span className={usageStats.weather.automatic.remaining <= 1 ? 'text-orange-500' : 'text-green-500'}>
                                {usageStats.weather.automatic.used}/{usageStats.weather.automatic.limit}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Manuális hívások:</span>
                            <span className={usageStats.weather.manual.remaining <= 2 ? 'text-orange-500' : 'text-green-500'}>
                                {usageStats.weather.manual.used}/{usageStats.weather.manual.limit}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;
