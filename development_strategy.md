# Development Strategy - Család Háló Alkalmazás

## Áttekintés

Ez a dokumentum a fejlesztési folyamatot kis, egymásra épülő lépésekre bontja. Minden lépés egy konkrét, tesztelhető funkciót ad hozzá, és az előző lépésekre épül.

**Fontos változás**: A regisztrációs rendszert hibrid modellre terveztük át, ahol a család egységesen jelenik meg kifelé, belül pedig mindenkinek személyes élménye van.

---

## 🚀 **Phase 1: Foundation & Landing (0-2 hét)**

### **1.1 Landing Page (1. hét)** ✅ **KÉSZ**
**Cél**: Meglévő felhasználók és új érdeklődők számára
**Deliverable**: Egyszerű, információs weboldal

**Funkciók:**
- [x] Családi naptár bemutatása
- [x] Funkciók listázása
- [x] "Kipróbálom" gomb (átirányít a PWA-ra)
- [x] Responsive design
- [x] SEO optimalizálás

**Technológia:**
- React + TailwindCSS ✅
- Vercel/Netlify hosting ✅
- Google Analytics

**Következő lépés**: 1.2 - PWA Alapok

---

### **1.2 PWA Alapok (1. hét)** ✅ **KÉSZ**
**Cél**: Telepíthető webes alkalmazás
**Deliverable**: PWA konfiguráció

**Funkciók:**
- [x] Service Worker implementálása
- [x] Web App Manifest
- [x] Offline támogatás alapok
- [x] "Telepítés" prompt

**Technológia:**
- Workbox (Google) ✅
- PWA Builder eszközök ✅

**Következő lépés**: 1.3 - Hibrid Felhasználói Regisztráció

---

### **1.3 Hibrid Felhasználói Regisztráció (1-2 hét)** 🔄 **ÁTTERVEZVE**
**Cél**: Hibrid regisztrációs rendszer a család alapítói regisztrációval
**Deliverable**: Átstrukturált regisztrációs rendszer

**Funkciók:**
- [x] Email + jelszó regisztráció (alap)
- [x] Google/Facebook OAuth (alap)
- [x] Email verifikáció (alap)
- [x] Jelszó visszaállítás (alap)
- [ ] **ÚJ**: Család alapítói regisztráció (név, város, gyerekek száma)
- [ ] **ÚJ**: Admin jogosultságok kezelése
- [ ] **ÚJ**: Családi profil létrehozása regisztrációkor

**Technológia:**
- Firebase Auth ✅
- Firestore: families collection (új struktúra)
- React state management

**Következő lépés**: 1.4 - Családtag Meghívási Rendszer

---

### **1.4 Családtag Meghívási Rendszer (1 hét)** 🚧 **FEJLESZTÉS ALATT**
**Cél**: Családtagok meghívása e-mail, QR kód vagy guest profilok segítségével
**Deliverable**: Meghívási rendszer és guest profil kezelés

**Funkciók:**
- [x] **ÚJ**: Admin meghívó funkció (UI kész)
- [x] **ÚJ**: E-mail meghívók küldése (alapfunkció kész)
- [ ] QR kód generálás
- [ ] Meghívó linkek kezelése
- [x] **ÚJ**: Guest profil létrehozása gyerekeknek (alapfunkció kész)

**Technológia:**
- Firebase Functions (email küldés) - tervezett
- QR kód generálás - tervezett
- Firestore: invitations collection ✅

**Következő lépés**: 2.1 - Családtag Profil Kezelés

---

## 🏠 **Phase 2: Core Family Features (3-5 hét)**

### **2.1 Családtag Profil Kezelés (1 hét)** 🔄 **ÁTTERVEZVE**
**Cél**: Családtagok profiljainak kezelése és testreszabása
**Deliverable**: Profil kezelő rendszer

**Funkciók:**
- [x] Családtagok hozzáadása (alap)
- [x] Családtagok szerkesztése (alap)
- [x] Családtagok törlése (alap)
- [ ] **ÚJ**: Avatar kezelés (fénykép, emoji, állatka)
- [ ] **ÚJ**: Szerep beállítása (szülő, gyerek, nagyszülő)
- [ ] **ÚJ**: Guest profilok gyerekeknek
- [ ] **ÚJ**: Személyes értesítési beállítások

**Technológia:**
- Firestore: family_members collection (bővített)
- Firebase Storage (avatar képek)
- React avatar komponensek

**Következő lépés**: 2.2 - Naptár Alapok

---

### **2.2 Naptár Alapok (1 hét)** ✅ **KÉSZ**
**Cél**: Egyszerű esemény kezelés
**Deliverable**: Alap naptár funkciók

**Funkciók:**
- [x] Esemény létrehozása
- [x] Esemény szerkesztése
- [x] Esemény törlése
- [x] Napi/heti nézet
- [x] Ismétlődő események
- [x] Esemény státuszok (aktív, lemondott)

**Technológia:**
- Firestore: events collection ✅
- React Calendar komponens ✅

**Következő lépés**: 2.3 - Családtag Hozzárendelés

---

### **2.3 Családtag Hozzárendelés (1 hét)** 🔄 **RÉSZLEGESEN KÉSZ**
**Cél**: Események hozzárendelése családtagokhoz
**Deliverable**: Esemény-családtag kapcsolat

**Funkciók:**
- [x] Esemény hozzárendelése családtagnak (alap)
- [ ] **FEJLESZTENDŐ**: Családtag esemény listája
- [ ] **FEJLESZTENDŐ**: Szűrés családtag szerint
- [ ] **FEJLESZTENDŐ**: Családtag profil nézet
- [ ] **ÚJ**: Személyes naptár nézet minden családtagnak

**Technológia:**
- Firestore: event assignments ✅
- React filtering (fejlesztendő)
- Személyes naptár komponensek

**Következő lépés**: 3.1 - Értesítések

---

## 🔔 **Phase 3: Notifications & Sharing (5-7 hét)**

### **3.1 Értesítések (1 hét)**
**Cél**: Felhasználók értesítése eseményekről
**Deliverable**: Értesítési rendszer

**Funkciók:**
- [ ] Email értesítések
- [ ] Push notifications (böngésző)
- [ ] Értesítési beállítások
- [ ] Időzített emlékeztetők
- [ ] **ÚJ**: Személyes értesítési preferenciák

**Technológia:**
- Firebase Cloud Messaging
- EmailJS vagy Firebase Functions
- Firestore: notification_preferences

**Következő lépés**: 3.2 - Család Meghívás

---

### **3.2 Család Meghívás (1 hét)**
**Cél**: Más családok meghívása
**Deliverable**: Meghívási rendszer

**Funkciók:**
- [ ] Meghívó link generálása
- [ ] Meghívó elfogadása
- [ ] Családok közötti kapcsolat
- [ ] Meghívó kezelés

**Technológia:**
- Firestore: invitations collection
- Unique invitation codes

**Következő lépés**: 3.3 - Közös Naptárak

---

### **3.3 Közös Naptárak (1 hét)**
**Cél**: Családok közötti esemény megosztás
**Deliverable**: Megosztott naptár funkció

**Funkciók:**
- [ ] Közös események létrehozása
- [ ] Esemény megosztás
- [ ] Közös naptár nézet
- [ ] Megosztási jogosultságok

**Technológia:**
- Firestore: shared_events collection
- React permissions

**Következő lépés**: 4.1 - Gamifikáció

---

## 🎮 **Phase 4: Engagement & Growth (7-9 hét)**

### **4.1 Gamifikáció (1 hét)**
**Cél**: Gyerekek bevonása és engagement növelése
**Deliverable**: Jelvény és kihívás rendszer

**Funkciók:**
- [ ] Jelvények gyerekeknek
- [ ] Napi kihívások
- [ ] Pontszám rendszer
- [ ] Családi ranglisták

**Technológia:**
- Firestore: achievements, challenges collections
- React gamification components

**Következő lépés**: 4.2 - Analytics Dashboard

---

### **4.2 Analytics Dashboard (1 hét)**
**Cél**: Felhasználói viselkedés követése
**Deliverable**: Admin dashboard

**Funkciók:**
- [ ] Felhasználói metrikák
- [ ] Esemény statisztikák
- [ ] Engagement mérőszámok
- [ ] Növekedési trendek

**Technológia:**
- Firebase Analytics
- Custom dashboard React komponensek

**Következő lépés**: 5.1 - Marketplace Alapok

---

## 🛍️ **Phase 5: Monetization (9-11 hét)**

### **5.1 Marketplace Alapok (1 hét)**
**Cél**: Külső szolgáltatók integrálása
**Deliverable**: Marketplace keretrendszer

**Funkciók:**
- [ ] Szolgáltató regisztráció
- [ ] Program ajánlások
- [ ] Szűrés és keresés
- [ ] Alap marketplace UI

**Technológia:**
- Firestore: providers, programs collections
- React marketplace components

**Következő lépés**: 5.2 - Prémium Funkciók

---

### **5.2 Prémium Funkciók (1 hét)**
**Cél**: Fizetős funkciók bevezetése
**Deliverable**: Prémium rendszer

**Funkciók:**
- [ ] Prémium előfizetés
- [ ] Extra értesítések
- [ ] Kiterjesztett naptár nézetek
- [ ] Fizetési integráció

**Technológia:**
- Stripe vagy PayPal
- Firebase subscription management

**Következő lépés**: 6.1 - Mobile App

---

## 📱 **Phase 6: Mobile & Advanced (11-13 hét)**

### **6.1 Mobile App (2 hét)**
**Cél**: Natív mobil alkalmazás
**Deliverable**: React Native app

**Funkciók:**
- [ ] React Native port
- [ ] Push notifications
- [ ] Offline sync
- [ ] App store deployment

**Technológia:**
- React Native
- Expo vagy bare React Native
- App Store / Google Play

**Következő lépés**: 6.2 - AI & Automation

---

### **6.2 AI & Automation (1 hét)**
**Cél**: Intelligens esemény javaslatok
**Deliverable**: AI-powered features

**Funkciók:**
- [ ] Esemény javaslatok
- [ ] Automatikus időzítés
- [ ] Intelligens kategorizálás
- [ ] Trend elemzés

**Technológia:**
- OpenAI API vagy TensorFlow.js
- Firebase ML

---

## 📊 **Success Metrics & Milestones**

### **Phase 1 végén:**
- [x] Landing page működik
- [x] PWA telepíthető
- [x] Alap regisztráció működik
- [ ] **ÚJ**: Hibrid regisztráció működik
- [ ] **ÚJ**: Családtag meghívások működnek

### **Phase 2 végén:**
- [x] Családok létrehozhatók
- [x] Alap naptár működik
- [ ] **ÚJ**: Családtag profilok testreszabhatók
- [ ] **ÚJ**: Személyes naptár nézetek működnek
- [ ] 10 teszt felhasználó

### **Phase 3 végén:**
- [ ] Értesítések működnek
- [ ] Meghívások működnek
- [ ] 50 teszt felhasználó

### **Phase 4 végén:**
- [ ] Gamifikáció működik
- [ ] Analytics dashboard
- [ ] 100 teszt felhasználó

### **Phase 5 végén:**
- [ ] Marketplace működik
- [ ] Prémium funkciók
- [ ] 500 teszt felhasználó

### **Phase 6 végén:**
- [ ] Mobile app működik
- [ ] AI funkciók
- [ ] 1000+ felhasználó

---

## 🎯 **Következő Lépés: Hibrid Regisztráció Átstrukturálása**

**Most a 1.3-as lépésnél tartunk: Hibrid Felhasználói Regisztráció átstrukturálása**

**Mit kell csinálni:**
1. **Család alapítói regisztráció** - Család név, város, gyerekek száma megadása
2. **Admin jogosultságok** - A regisztráló admin lesz
3. **Családi profil létrehozása** - Automatikus család létrehozás regisztrációkor
4. **Regisztrációs folyamat módosítása** - Egy lépésben család + felhasználó

**Jelenlegi állapot:**
- ✅ Alap regisztráció működik
- ✅ Firebase Auth működik
- ✅ Családtagok kezelése működik
- 🔄 **ÁTTERVEZENDŐ**: Regisztrációs folyamat hibrid modellre

**Szeretnéd, hogy kezdjük el a hibrid regisztráció implementálását?**

---

*Utoljára frissítve: 2024 - Hibrid regisztrációs modell áttervezés*
