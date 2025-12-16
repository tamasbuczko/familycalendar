import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext.jsx';
import LandingPage from './components/LandingPage.jsx';
import AuthScreen from './components/auth/AuthScreen.jsx';
import FamilySetupScreen from './components/family/FamilySetupScreen.jsx';
import CalendarApp from './components/calendar/CalendarApp.jsx';
import RecurringEventsPage from './components/calendar/RecurringEventsPage.jsx';
import TemplatesPage from './components/calendar/TemplatesPage.jsx';
import { signOut } from 'firebase/auth';

// Fő alkalmazás komponens
function App() {
    return (
        <FirebaseProvider>
            <Router>
                <div className="min-h-screen bg-gray-100 font-inter antialiased">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/app/*" element={<AppRoutes />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </FirebaseProvider>
    );
}

function AppRoutes() {
    const { auth, userId, userFamilyId } = useFirebase();
    const navigate = useNavigate();

    const handleLogout = async () => {
        console.log("AppRoutes: handleLogout called");
        try {
            await signOut(auth);
            console.log("AppRoutes: User logged out successfully.");
            // Kijelentkezés után a landing page-re irányít
            navigate('/');
        } catch (error) {
            console.error("AppRoutes: Logout error:", error);
        }
    };

    // Ha nincs felhasználó, jelenítsen meg bejelentkező képernyőt
    if (!userId) {
        return <AuthScreen />;
    }

    // Ha nincs családi azonosító, jelenítsen meg család beállító képernyőt
    // (Ez csak akkor történik meg, ha a felhasználó nem a hibrid regisztrációval jött létre)
    if (!userFamilyId) {
        return <FamilySetupScreen onLogout={handleLogout} />;
    }

    // Ha minden rendben van, jelenítsen meg a naptár alkalmazást vagy az ismétlődő események oldalt
    // A hibrid regisztráció után automatikusan itt landol a felhasználó
    return (
        <Routes>
            <Route path="/" element={<CalendarApp onLogout={handleLogout} />} />
            <Route path="/recurring-events" element={<RecurringEventsPage onLogout={handleLogout} />} />
            <Route path="/templates" element={<TemplatesPage onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}

export default App;
