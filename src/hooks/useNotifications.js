import { useState, useEffect } from 'react';
import { 
  registerFCMToken, 
  loadNotificationPreferences, 
  saveNotificationPreferences,
  sendTestNotification,
  setupNotificationListener,
  getDefaultNotificationPreferences
} from '../utils/notificationUtils';

export const useNotifications = (userId) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Értesítési támogatás ellenőrzése
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // FCM token regisztráció
  const registerToken = async () => {
    if (!isSupported || !userId) return null;
    
    try {
      const token = await registerFCMToken(userId);
      if (token) {
        setToken(token);
        return token;
      }
    } catch (error) {
      console.error('Token registration failed:', error);
    }
    return null;
  };


  // Értesítési engedélyek kérése
  const requestPermission = async () => {
    if (!isSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        const token = await registerToken();
        return !!token;
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Értesítési beállítások betöltése
  const loadPreferences = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const prefs = await loadNotificationPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPreferences(getDefaultNotificationPreferences());
    } finally {
      setIsLoading(false);
    }
  };

  // Értesítési beállítások mentése
  const savePreferences = async (newPreferences) => {
    if (!userId) return false;
    
    setIsLoading(true);
    try {
      const success = await saveNotificationPreferences(userId, newPreferences);
      if (success) {
        setPreferences(newPreferences);
      }
      return success;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Értesítés küldése (teszteléshez)
  const sendTestNotificationHandler = async () => {
    if (!token || !userId) return false;
    
    try {
      return await sendTestNotification(userId, token);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  };

  // Értesítések figyelése (amikor az app meg van nyitva)
  useEffect(() => {
    if (!isSupported || !token) return;

    const unsubscribe = setupNotificationListener((payload) => {
      console.log('Message received in foreground:', payload);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupported, token]);

  // Automatikus beállítások betöltése felhasználó bejelentkezésekor
  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  return {
    isSupported,
    permission,
    token,
    preferences,
    isLoading,
    requestPermission,
    loadPreferences,
    savePreferences,
    registerToken,
    sendTestNotification: sendTestNotificationHandler
  };
};
