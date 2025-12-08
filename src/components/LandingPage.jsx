import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import QRCode from './ui/QRCode';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isInstallable, installApp } = usePWAInstall();
    
    const handleTryApp = () => {
        navigate('/app');
    };

    const handleLearnMore = () => {
        document.getElementById('hogyan').scrollIntoView({ behavior: 'smooth' });
    };

    const handleInstallApp = async () => {
        const success = await installApp();
        if (success) {
            console.log('PWA installation successful');
        }
    };

    const getQRUrl = () => {
        return window.location.origin + '/app';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                .gradient-bg {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .card-hover:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }
                
                .blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(60px);
                    opacity: 0.3;
                    animation: blob 7s infinite;
                }
                
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                .pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                .feature-icon {
                    transition: all 0.3s ease;
                }
                
                .feature-card:hover .feature-icon {
                    transform: scale(1.1) rotate(5deg);
                }
                
                .cta-button {
                    position: relative;
                    overflow: hidden;
                }
                
                .cta-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s;
                }
                
                .cta-button:hover::before {
                    left: 100%;
                }
            `}</style>
            
            {/* Navigation */}
            <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Család Háló</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#funkciok" onClick={(e) => { e.preventDefault(); document.getElementById('funkciok')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-600 hover:text-purple-600 transition">Funkciók</a>
                            <a href="#hogyan" onClick={(e) => { e.preventDefault(); handleLearnMore(); }} className="text-gray-600 hover:text-purple-600 transition">Hogyan működik</a>
                            <a href="#arak" onClick={(e) => { e.preventDefault(); document.getElementById('arak')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-600 hover:text-purple-600 transition">Árak</a>
                            <button onClick={handleTryApp} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                                Bejelentkezés
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="blob w-72 h-72 bg-purple-400 top-0 right-0"></div>
                <div className="blob w-96 h-96 bg-blue-400 bottom-0 left-0" style={{animationDelay: '2s'}}></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full">
                                <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                                <span className="text-purple-700 font-semibold text-sm">A családi élet új korszaka</span>
                            </div>
                            
                            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                                A családi naptár,<br/>
                                <span className="gradient-text">amit a gyerekeid is szeretnek</span>
                            </h1>
                            
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Végre nyugalom a családi életben. Minden esemény egy helyen, mindenki tudja, mi vár rá. 
                                És a legjobb? <strong>A gyerekek pontokat gyűjtenek</strong> minden teljesített feladatért! 🎮
                            </p>
                            
                            <div className="flex flex-col lg:flex-row gap-8 items-center">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={handleTryApp} className="cta-button gradient-bg text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                                        Kezdd el most ingyen! 🚀
                                    </button>
                                    <button onClick={handleLearnMore} className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg border-2 border-gray-200 hover:border-purple-600 transition">
                                        Nézd meg, hogyan működik
                                    </button>
                                </div>
                                
                                {/* QR Code Section */}
                                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                        Telefonról is elérhető
                                    </h3>
                                    <QRCode 
                                        url={getQRUrl()} 
                                        size={180}
                                        className=""
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-8 pt-4">
                                <div className="flex -space-x-2">
                                    <img src="https://i.pravatar.cc/40?img=1" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                    <img src="https://i.pravatar.cc/40?img=2" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                    <img src="https://i.pravatar.cc/40?img=3" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                    <img src="https://i.pravatar.cc/40?img=4" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                        +500
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-900 font-semibold">Már 500+ család használja</p>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-yellow-400">★★★★★</span>
                                        <span className="text-gray-600 text-sm ml-2">4.9/5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative animate-float">
                            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-gray-900">Ma, Okt 13</h3>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                <span className="text-purple-600 text-xs">☀️</span>
                                            </div>
                                            <span className="text-gray-600 font-semibold">22°C</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-purple-600">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                                                        ⚽
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Foci edzés - Péter</p>
                                                        <p className="text-sm text-gray-600">16:00 - 17:30</p>
                                                    </div>
                                                </div>
                                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">+10 pont</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-blue-600">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                                        🎹
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Zongora óra - Anna</p>
                                                        <p className="text-sm text-gray-600">17:00 - 18:00</p>
                                                    </div>
                                                </div>
                                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">+10 pont</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl border-l-4 border-pink-600">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center text-white">
                                                    🍕
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Családi vacsora</p>
                                                    <p className="text-sm text-gray-600">19:00</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-purple-600">12</p>
                                            <p className="text-xs text-gray-600">Heti program</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-green-600">95%</p>
                                            <p className="text-xs text-gray-600">Teljesítve</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-orange-600">340</p>
                                            <p className="text-xs text-gray-600">Pontok</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 pulse-slow">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                                        🏆
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Hétfői Bajnok!</p>
                                        <p className="text-sm text-gray-600">Új jelvény!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="funkciok" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900">
                            Miért imádják a <span className="gradient-text">családok?</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Mert végre minden egy helyen van. És mert a gyerekek játszanak, miközben tanulnak rendben tartani az életüket.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="feature-card card-hover bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200">
                            <div className="feature-icon w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                🎮
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Gamifikáció gyerekeknek</h3>
                            <p className="text-gray-600">Pontgyűjtés, jelvények, családi kihívások. A gyerekek játszanak, te pedig végre nyugodt vagy.</p>
                        </div>
                        
                        <div className="feature-card card-hover bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
                            <div className="feature-icon w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                ⚡
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligens értesítések</h3>
                            <p className="text-gray-600">Eső riasztás edzés előtt? Check. Emlékeztető 30 perccel előtte? Check. Automatikus, okos.</p>
                        </div>
                        
                        <div className="feature-card card-hover bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
                            <div className="feature-icon w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                👨‍👩‍👧‍👦
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Egy család, egy naptár</h3>
                            <p className="text-gray-600">Anya, apa, gyerekek, nagyszülők. Mindenki látja, ki mikor hol van. Végre.</p>
                        </div>
                        
                        <div className="feature-card card-hover bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200">
                            <div className="feature-icon w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                📱
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Offline is működik</h3>
                            <p className="text-gray-600">Nincs net? Nincs gond. PWA technológia, telepítsd és használd bármikor, bárhol.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="hogyan" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900">
                            Hogyan <span className="gradient-text">működik?</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            3 lépésben kész vagy. Komolyan.
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="relative">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                <div className="absolute -top-6 left-8 w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                    1
                                </div>
                                <div className="pt-6 space-y-4">
                                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                                        👤
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Regisztrálj</h3>
                                    <p className="text-gray-600">Hozd létre a családodat. Email, jelszó, kész. 30 másodperc.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                <div className="absolute -top-6 left-8 w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                    2
                                </div>
                                <div className="pt-6 space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                                        👨‍👩‍👧‍👦
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Hívd meg a családot</h3>
                                    <p className="text-gray-600">Küldj meghívót emailben vagy add meg nekik a családi kódot.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                <div className="absolute -top-6 left-8 w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                    3
                                </div>
                                <div className="pt-6 space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
                                        📅
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Kezdd el használni!</h3>
                                    <p className="text-gray-600">Adj hozzá eseményeket, hívd meg a gyerekeket és élvezd a nyugalmat.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="arak" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900">
                            Válaszd ki a <span className="gradient-text">csomagodat</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Kezdj ingyenesen. Bővíts, amikor készen állsz.
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-300 transition">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Ingyenes</h3>
                                    <div className="mt-4">
                                        <span className="text-5xl font-black text-gray-900">0 Ft</span>
                                        <span className="text-gray-600">/hó</span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-3">
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">1 család, max 5 tag</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">50 esemény/hó</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Alap értesítések</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">1 gyerek profil</span>
                                    </li>
                                </ul>
                                
                                <button onClick={handleTryApp} className="w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-200 transition">
                                    Kezdd el most!
                                </button>
                            </div>
                        </div>
                        
                        {/* Premium Plan */}
                        <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 transform scale-105 shadow-2xl">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                                LEGNÉPSZERŰBB
                            </div>
                            
                            <div className="space-y-6 text-white">
                                <div>
                                    <h3 className="text-2xl font-bold">Prémium</h3>
                                    <div className="mt-4">
                                        <span className="text-5xl font-black">2.990 Ft</span>
                                        <span className="text-purple-200">/hó</span>
                                    </div>
                                    <p className="text-purple-200 text-sm mt-2">vagy 29.990 Ft/év (2 hónap ingyen)</p>
                                </div>
                                
                                <ul className="space-y-3">
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Korlátlan családtag</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Korlátlan események</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Időjárás riasztások</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Gamifikáció & jelvények</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Korlátlan gyerek profil</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span>Prioritásos support</span>
                                    </li>
                                </ul>
                                
                                <button onClick={handleTryApp} className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold hover:bg-purple-50 transition">
                                    Próbáld ki 14 napig ingyen!
                                </button>
                            </div>
                        </div>
                        
                        {/* Plus Plan */}
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-300 transition">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Plus</h3>
                                    <div className="mt-4">
                                        <span className="text-5xl font-black text-gray-900">4.990 Ft</span>
                                        <span className="text-gray-600">/hó</span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-3">
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Minden Prémium funkció +</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Több család kezelés</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Marketplace hozzáférés</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Családközi megosztás</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-gray-600">Exportálás & statisztikák</span>
                                    </li>
                                </ul>
                                
                                <button onClick={handleTryApp} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                                    Kezdd el most!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Testimonials */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900">
                            Mit mondanak a <span className="gradient-text">családok?</span>
                        </h2>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-1 mb-4">
                                <span className="text-yellow-400">★★★★★</span>
                            </div>
                            <p className="text-gray-600 mb-6 italic">"Végre nem kérdezi a lányom minden reggel, hogy mikor van torna. Megnézi az appban, és kész. Plusz imádja a pontgyűjtést!"</p>
                            <div className="flex items-center space-x-3">
                                <img src="https://i.pravatar.cc/50?img=5" className="w-12 h-12 rounded-full" alt="Kata" />
                                <div>
                                    <p className="font-bold text-gray-900">Kovács Kata</p>
                                    <p className="text-sm text-gray-600">2 gyermek anyukája</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-1 mb-4">
                                <span className="text-yellow-400">★★★★★</span>
                            </div>
                            <p className="text-gray-600 mb-6 italic">"Az iskola eseményeit is beleírjuk, így a nagyszülők is tudják, mikor van szülői értekezlet. Csodás!"</p>
                            <div className="flex items-center space-x-3">
                                <img src="https://i.pravatar.cc/50?img=8" className="w-12 h-12 rounded-full" alt="Péter" />
                                <div>
                                    <p className="font-bold text-gray-900">Nagy Péter</p>
                                    <p className="text-sm text-gray-600">3 gyermek apukája</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-1 mb-4">
                                <span className="text-yellow-400">★★★★★</span>
                            </div>
                            <p className="text-gray-600 mb-6 italic">"Elváltunk, de így is tudom, mikor van a fiam nálam és mikor az anyjánál. Tiszta, átlátható, konfliktus mentes."</p>
                            <div className="flex items-center space-x-3">
                                <img src="https://i.pravatar.cc/50?img=12" className="w-12 h-12 rounded-full" alt="András" />
                                <div>
                                    <p className="font-bold text-gray-900">Szabó András</p>
                                    <p className="text-sm text-gray-600">1 gyermek apukája</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 relative overflow-hidden">
                <div className="blob w-96 h-96 bg-purple-400 top-0 right-0 opacity-20"></div>
                <div className="blob w-96 h-96 bg-blue-400 bottom-0 left-0 opacity-20" style={{animationDelay: '2s'}}></div>
                
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                        Készen állsz a nyugodt családi életre?
                    </h2>
                    <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
                        Csatlakozz a 500+ magyar családhoz, akik már használják a Család Hálót. Ingyenes, gyors, egyszerű.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button onClick={handleTryApp} className="cta-button bg-white text-purple-600 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                            Kezdd el most ingyen! 🚀
                        </button>
                        <button onClick={handleTryApp} className="border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition">
                            Nézd meg a demót
                        </button>
                    </div>
                    
                    <p className="text-purple-200 mt-8 text-sm">
                        ✅ Nincs bankkártya szükséges  •  ✅ 14 napos ingyenes próba  •  ✅ Bármikor lemondható
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <span className="text-xl font-bold text-white">Család Háló</span>
                            </div>
                            <p className="text-sm">A családi naptár, amit a gyerekeid is szeretnek használni.</p>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-bold mb-4">Termék</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#funkciok" onClick={(e) => { e.preventDefault(); document.getElementById('funkciok')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition">Funkciók</a></li>
                                <li><a href="#arak" onClick={(e) => { e.preventDefault(); document.getElementById('arak')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition">Árak</a></li>
                                <li><a href="#" className="hover:text-white transition">Gyakori kérdések</a></li>
                                <li><a href="#" className="hover:text-white transition">Demó</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-bold mb-4">Vállalat</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Rólunk</a></li>
                                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition">Karrier</a></li>
                                <li><a href="#" className="hover:text-white transition">Kapcsolat</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-bold mb-4">Közösség</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Facebook Csoport</a></li>
                                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                                <li><a href="#" className="hover:text-white transition">Support</a></li>
                                <li><a href="#" className="hover:text-white transition">ÁSZF</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
                        <p>&copy; 2024 Család Háló. Minden jog fenntartva.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
