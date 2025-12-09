// Használati korlátok kezelése a fizetős verzió előkészítésére
export const USAGE_LIMITS = {
  // Ingyenes verzió korlátai
  FREE: {
    // Időjárás API hívások
    weather: {
      dailyAutomaticCalls: 4, // Napi 4 automatikus hívás
      manualCallsPerDay: 10,  // Napi 10 manuális hívás (klikkelésre)
      cacheDuration: 30 * 60 * 1000, // 30 perc cache
    },
    
    // Értesítések
    notifications: {
      dailyLimit: 50,         // Napi 50 értesítés
      eventReminders: 3,      // Max 3 emlékeztető eseményenként
      weatherAlerts: 2,       // Napi 2 időjárás riasztás
    },
    
    // Firestore műveletek
    firestore: {
      dailyReads: 1000,       // Napi 1000 olvasás
      dailyWrites: 100,       // Napi 100 írás
    },
    
    // Firebase Functions hívások
    functions: {
      dailyCalls: 200,        // Napi 200 function hívás
    }
  },
  
  // Fizetős verzió korlátai (jövőbeli implementáció)
  PREMIUM: {
    weather: {
      dailyAutomaticCalls: 24, // Napi 24 automatikus hívás (óránként)
      manualCallsPerDay: 100,  // Napi 100 manuális hívás
      cacheDuration: 10 * 60 * 1000, // 10 perc cache
    },
    
    notifications: {
      dailyLimit: 500,        // Napi 500 értesítés
      eventReminders: 10,     // Max 10 emlékeztető eseményenként
      weatherAlerts: 10,      // Napi 10 időjárás riasztás
    },
    
    firestore: {
      dailyReads: 10000,      // Napi 10000 olvasás
      dailyWrites: 1000,      // Napi 1000 írás
    },
    
    functions: {
      dailyCalls: 2000,       // Napi 2000 function hívás
    }
  }
};

// Felhasználó típus meghatározása
export const getUserPlan = (user) => {
  // Jelenleg mindenki ingyenes, később itt ellenőrizzük a fizetős státuszt
  return user?.isPremium ? 'PREMIUM' : 'FREE';
};

// Használati statisztikák kezelése
export class UsageTracker {
  constructor(userId, plan = 'FREE') {
    this.userId = userId;
    this.plan = plan;
    this.limits = USAGE_LIMITS[plan];
    this.storageKey = `usage_${userId}`;
  }

  // Napi használat lekérése
  getDailyUsage() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return this.getDefaultUsage();
    }
    
    const usage = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Ha másik nap, reseteljük a használatot
    if (usage.date !== today) {
      return this.getDefaultUsage();
    }
    
    return usage;
  }

  // Alapértelmezett használat objektum
  getDefaultUsage() {
    return {
      date: new Date().toDateString(),
      weather: {
        automaticCalls: 0,
        manualCalls: 0,
        lastAutomaticCall: null,
        lastManualCall: null
      },
      notifications: {
        sent: 0,
        eventReminders: 0,
        weatherAlerts: 0
      },
      firestore: {
        reads: 0,
        writes: 0
      },
      functions: {
        calls: 0
      }
    };
  }

  // Használat mentése
  saveUsage(usage) {
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
  }

  // Időjárás hívás ellenőrzése
  canMakeWeatherCall(isAutomatic = false) {
    const usage = this.getDailyUsage();
    const weatherUsage = usage.weather;
    const limits = this.limits.weather;

    if (isAutomatic) {
      return weatherUsage.automaticCalls < limits.dailyAutomaticCalls;
    } else {
      return weatherUsage.manualCalls < limits.manualCallsPerDay;
    }
  }

  // Időjárás hívás rögzítése
  recordWeatherCall(isAutomatic = false) {
    const usage = this.getDailyUsage();
    
    if (isAutomatic) {
      usage.weather.automaticCalls++;
      usage.weather.lastAutomaticCall = new Date().toISOString();
    } else {
      usage.weather.manualCalls++;
      usage.weather.lastManualCall = new Date().toISOString();
    }
    
    this.saveUsage(usage);
  }

  // Értesítés küldés ellenőrzése
  canSendNotification(type = 'general') {
    const usage = this.getDailyUsage();
    const limits = this.limits.notifications;

    switch (type) {
      case 'eventReminder':
        return usage.notifications.eventReminders < limits.eventReminders;
      case 'weatherAlert':
        return usage.notifications.weatherAlerts < limits.weatherAlerts;
      default:
        return usage.notifications.sent < limits.dailyLimit;
    }
  }

  // Értesítés küldés rögzítése
  recordNotificationSent(type = 'general') {
    const usage = this.getDailyUsage();
    usage.notifications.sent++;
    
    switch (type) {
      case 'eventReminder':
        usage.notifications.eventReminders++;
        break;
      case 'weatherAlert':
        usage.notifications.weatherAlerts++;
        break;
    }
    
    this.saveUsage(usage);
  }

  // Firestore művelet ellenőrzése
  canMakeFirestoreOperation(operation = 'read') {
    const usage = this.getDailyUsage();
    const limits = this.limits.firestore;

    if (operation === 'read') {
      return usage.firestore.reads < limits.dailyReads;
    } else {
      return usage.firestore.writes < limits.dailyWrites;
    }
  }

  // Firestore művelet rögzítése
  recordFirestoreOperation(operation = 'read') {
    const usage = this.getDailyUsage();
    
    if (operation === 'read') {
      usage.firestore.reads++;
    } else {
      usage.firestore.writes++;
    }
    
    this.saveUsage(usage);
  }

  // Function hívás ellenőrzése
  canMakeFunctionCall() {
    const usage = this.getDailyUsage();
    return usage.functions.calls < this.limits.functions.dailyCalls;
  }

  // Function hívás rögzítése
  recordFunctionCall() {
    const usage = this.getDailyUsage();
    usage.functions.calls++;
    this.saveUsage(usage);
  }

  // Használati statisztikák lekérése
  getUsageStats() {
    const usage = this.getDailyUsage();
    const limits = this.limits;

    const stats = {
      weather: {
        automatic: {
          used: usage.weather.automaticCalls,
          limit: limits.weather.dailyAutomaticCalls,
          remaining: limits.weather.dailyAutomaticCalls - usage.weather.automaticCalls
        },
        manual: {
          used: usage.weather.manualCalls,
          limit: limits.weather.manualCallsPerDay,
          remaining: limits.weather.manualCallsPerDay - usage.weather.manualCalls
        }
      },
      notifications: {
        total: {
          used: usage.notifications.sent,
          limit: limits.notifications.dailyLimit,
          remaining: limits.notifications.dailyLimit - usage.notifications.sent
        },
        eventReminders: {
          used: usage.notifications.eventReminders,
          limit: limits.notifications.eventReminders,
          remaining: limits.notifications.eventReminders - usage.notifications.eventReminders
        },
        weatherAlerts: {
          used: usage.notifications.weatherAlerts,
          limit: limits.notifications.weatherAlerts,
          remaining: limits.notifications.weatherAlerts - usage.notifications.weatherAlerts
        }
      },
      firestore: {
        reads: {
          used: usage.firestore.reads,
          limit: limits.firestore.dailyReads,
          remaining: limits.firestore.dailyReads - usage.firestore.reads
        },
        writes: {
          used: usage.firestore.writes,
          limit: limits.firestore.dailyWrites,
          remaining: limits.firestore.dailyWrites - usage.firestore.writes
        }
      },
      functions: {
        used: usage.functions.calls,
        limit: limits.functions.dailyCalls,
        remaining: limits.functions.dailyCalls - usage.functions.calls
      }
    };
    
    return stats;
  }
}

// Hook a használati korlátok kezeléséhez
export const useUsageLimits = (userId, userPlan = 'FREE') => {
  const tracker = new UsageTracker(userId, userPlan);
  
  const getUsageStats = () => {
    return tracker.getUsageStats();
  };
  
  return {
    tracker,
    canMakeWeatherCall: (isAutomatic) => tracker.canMakeWeatherCall(isAutomatic),
    recordWeatherCall: (isAutomatic) => tracker.recordWeatherCall(isAutomatic),
    canSendNotification: (type) => tracker.canSendNotification(type),
    recordNotificationSent: (type) => tracker.recordNotificationSent(type),
    canMakeFirestoreOperation: (operation) => tracker.canMakeFirestoreOperation(operation),
    recordFirestoreOperation: (operation) => tracker.recordFirestoreOperation(operation),
    canMakeFunctionCall: () => tracker.canMakeFunctionCall(),
    recordFunctionCall: () => tracker.recordFunctionCall(),
    getUsageStats
  };
};
