import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isInstallable, installApp } = usePWAInstall();
    
    const handleTryApp = () => {
        // Átirányítás a PWA-ra
        navigate('/app');
    };

    const handleLearnMore = () => {
        // Görgetés a funkciók szekcióhoz
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    };

    const handleInstallApp = async () => {
        const success = await installApp();
        if (success) {
            console.log('PWA installation successful');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <i className="fas fa-calendar-alt text-3xl text-blue-600 mr-3"></i>
                            <h1 className="text-2xl font-bold text-gray-900">Család Háló</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLearnMore}
                                className="text-gray-600 hover:text-gray-900 font-medium transition duration-200"
                            >
                                Funkciók
                            </button>
                            {isInstallable && (
                                <button
                                    onClick={handleInstallApp}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 mr-2"
                                    title="Telepítés asztali gépre"
                                >
                                    <i className="fas fa-download mr-2"></i>
                                    Telepítés
                                </button>
                            )}
                            <button
                                onClick={handleTryApp}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Kipróbálom
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                                         <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                         Családi naptár
                         <span className="block text-blue-600">egyszerűen</span>
                     </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Szervezd a családod heti rutinjait, iskolai eseményeit és különóráit 
                        egy helyen. Gyerekeknek játékos, szülőknek praktikus.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleTryApp}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                        >
                            <i className="fas fa-rocket mr-2"></i>
                            Ingyenesen Kipróbálom
                        </button>
                        <button
                            onClick={handleLearnMore}
                            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="fas fa-info-circle mr-2"></i>
                            Több Információ
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
                                                 Miért a Család Háló?
                    </h2>
                    
                                         <div className="grid md:grid-cols-4 gap-8">
                         {/* Feature 1 */}
                         <div className="text-center p-6">
                             <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <i className="fas fa-users text-2xl text-blue-600"></i>
                             </div>
                             <h3 className="text-xl font-semibold text-gray-900 mb-3">Családi Közösség</h3>
                             <p className="text-gray-600">
                                 Hívd meg más családokat, szervezz közös programokat és építs közösséget.
                             </p>
                         </div>

                         {/* Feature 2 */}
                         <div className="text-center p-6">
                             <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <i className="fas fa-trophy text-2xl text-green-600"></i>
                             </div>
                             <h3 className="text-xl font-semibold text-gray-900 mb-3">Játékos Funkciók</h3>
                             <p className="text-gray-600">
                                 Jelvények, kihívások és pontszámok a gyerekek számára, hogy élvezetes legyen a használat.
                             </p>
                         </div>

                         {/* Feature 3 - Értesítések & Biztonság */}
                         <div className="text-center p-6">
                             <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <i className="fas fa-bell text-2xl text-red-600"></i>
                             </div>
                             <h3 className="text-xl font-semibold text-gray-900 mb-3">Értesítések & Biztonság</h3>
                             <p className="text-gray-600">
                                 Telefonon értesítést kapsz, ha egy gyerekért el kell menned - soha ne maradjon egyedül!
                             </p>
                         </div>

                         {/* Feature 4 */}
                         <div className="text-center p-6">
                             <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <i className="fas fa-mobile-alt text-2xl text-purple-600"></i>
                             </div>
                             <h3 className="text-xl font-semibold text-gray-900 mb-3">Mindenhol Elérhető</h3>
                             <p className="text-gray-600">
                                 PWA technológia - használd böngészőből vagy telepítsd ikonként a telefonodra.
                             </p>
                         </div>
                     </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
                        Hogyan Működik?
                    </h2>
                    
                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                1
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Regisztráció</h3>
                            <p className="text-gray-600">Hozz létre egy ingyenes fiókot</p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                2
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Család Létrehozása</h3>
                            <p className="text-gray-600">Add hozzá a családtagjaidat</p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                3
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Események</h3>
                            <p className="text-gray-600">Tervezd meg a heti rutinokat</p>
                        </div>

                        {/* Step 4 */}
                        <div className="text-center">
                            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                4
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Megosztás</h3>
                            <p className="text-gray-600">Hívd meg baráti családokat</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Készen Állsz a Családi Szervezésre?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                                                 Csatlakozz több ezer családhoz, akik már használják a Család Hálót
                    </p>
                    <button
                        onClick={handleTryApp}
                        className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 rounded-lg text-xl font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        <i className="fas fa-play mr-2"></i>
                        Kezdj El Most
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <i className="fas fa-calendar-alt text-2xl text-blue-400 mr-2"></i>
                                                                 <span className="text-xl font-bold">Család Háló</span>
                            </div>
                            <p className="text-gray-400">
                                A családi naptár alkalmazás, amely egyszerűvé teszi a mindennapi szervezést.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Funkciók</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>Családi naptár</li>
                                <li>Esemény kezelés</li>
                                <li>Család meghívás</li>
                                <li>Jelvény rendszer</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Támogatás</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>Segítség</li>
                                <li>Kapcsolat</li>
                                <li>FAQ</li>
                                <li>Visszajelzés</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Kövess Minket</h3>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                                    <i className="fab fa-facebook text-2xl"></i>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                                    <i className="fab fa-twitter text-2xl"></i>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                                    <i className="fab fa-instagram text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                                                 <p>&copy; 2024 Család Háló. Minden jog fenntartva.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
