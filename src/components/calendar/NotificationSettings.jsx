import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationSettings = ({ userId, onClose }) => {
  const { 
    isSupported, 
    permission, 
    preferences, 
    savePreferences, 
    requestPermission,
    sendTestNotification,
    isLoading 
  } = useNotifications(userId);
  
  const [localPreferences, setLocalPreferences] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await savePreferences(localPreferences);
      if (success) {
        onClose();
      } else {
        alert('Hiba történt a beállítások mentése során.');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Hiba történt a beállítások mentése során.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateReminderTimes = (times) => {
    setLocalPreferences(prev => ({
      ...prev,
      eventReminders: {
        ...prev.eventReminders,
        times
      }
    }));
  };

  const addReminderTime = () => {
    const newTime = parseInt(prompt('Új emlékeztető idő (perc):'));
    if (newTime && newTime > 0) {
      const currentTimes = localPreferences.eventReminders.times;
      if (!currentTimes.includes(newTime)) {
        updateReminderTimes([...currentTimes, newTime].sort((a, b) => a - b));
      }
    }
  };

  const removeReminderTime = (timeToRemove) => {
    const currentTimes = localPreferences.eventReminders.times;
    updateReminderTimes(currentTimes.filter(time => time !== timeToRemove));
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } else {
      alert('Nem sikerült elküldeni a teszt értesítést.');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Értesítések</h2>
        <p className="text-gray-600 mb-4">
          Az értesítések nem támogatottak ezen a böngészőn.
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Bezárás
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Értesítések</h2>
        <p className="text-gray-600 mb-4">
          Az értesítések le vannak tiltva. Engedélyezze őket a böngésző beállításaiban.
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Bezárás
        </button>
      </div>
    );
  }

  if (permission === 'default') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Értesítések</h2>
        <p className="text-gray-600 mb-4">
          Engedélyezze az értesítéseket, hogy értesítést kapjon eseményekről és időjárás változásokról.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={requestPermission}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Engedélyezés
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Mégse
          </button>
        </div>
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Beállítások betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto max-h-96 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Értesítési beállítások</h2>
      
      {/* Teszt értesítés */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Teszt értesítés</h3>
        <p className="text-sm text-gray-600 mb-3">
          Küldjön egy teszt értesítést, hogy ellenőrizze a működést.
        </p>
        <button
          onClick={handleTestNotification}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testNotificationSent ? '✓ Teszt értesítés elküldve!' : 'Teszt értesítés küldése'}
        </button>
      </div>
      
      {/* Esemény emlékeztetők */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Esemény emlékeztetők</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.eventReminders.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                eventReminders: {
                  ...prev.eventReminders,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Esemény emlékeztetők engedélyezése
          </label>
        </div>

        {localPreferences.eventReminders.enabled && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Emlékeztető idők (perc az esemény előtt):
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {localPreferences.eventReminders.times.map(time => (
                  <span
                    key={time}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {time} perc
                    <button
                      onClick={() => removeReminderTime(time)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={addReminderTime}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Új emlékeztető idő hozzáadása
              </button>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.eventReminders.sound}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    eventReminders: {
                      ...prev.eventReminders,
                      sound: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Hangjelzés
              </label>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.eventReminders.vibration}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    eventReminders: {
                      ...prev.eventReminders,
                      vibration: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Rezgés
              </label>
            </div>
          </>
        )}
      </div>

      {/* Időjárás riasztások */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Időjárás riasztások</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.weatherAlerts.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                weatherAlerts: {
                  ...prev.weatherAlerts,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Időjárás riasztások engedélyezése
          </label>
        </div>

        {localPreferences.weatherAlerts.enabled && (
          <>
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.weatherAlerts.rainAlerts}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    weatherAlerts: {
                      ...prev.weatherAlerts,
                      rainAlerts: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Eső riasztások
              </label>
            </div>

            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.weatherAlerts.snowAlerts}
                  onChange={(e) => setLocalPreferences(prev => ({
                    ...prev,
                    weatherAlerts: {
                      ...prev.weatherAlerts,
                      snowAlerts: e.target.checked
                    }
                  }))}
                  className="mr-2"
                />
                Hó riasztások
              </label>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Időjárás ellenőrzési gyakoriság (perc):
              </label>
              <select
                value={localPreferences.weatherAlerts.checkInterval}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  weatherAlerts: {
                    ...prev.weatherAlerts,
                    checkInterval: parseInt(e.target.value)
                  }
                }))}
                className="border rounded px-3 py-2 w-full"
              >
                <option value={15}>15 perc</option>
                <option value={30}>30 perc</option>
                <option value={60}>1 óra</option>
                <option value={120}>2 óra</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Csendes órák */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Csendes órák</h3>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPreferences.quietHours.enabled}
              onChange={(e) => setLocalPreferences(prev => ({
                ...prev,
                quietHours: {
                  ...prev.quietHours,
                  enabled: e.target.checked
                }
              }))}
              className="mr-2"
            />
            Csendes órák engedélyezése
          </label>
        </div>

        {localPreferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kezdés:</label>
              <input
                type="time"
                value={localPreferences.quietHours.start}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    start: e.target.value
                  }
                }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vég:</label>
              <input
                type="time"
                value={localPreferences.quietHours.end}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    end: e.target.value
                  }
                }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Műveletek */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Mégse
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
