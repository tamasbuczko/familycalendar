# Család Háló Alkalmazás Dokumentáció

## 1. Ötlet összefoglalása

Egy családi naptár-alkalmazás, amely segíti a szülőket a gyerekek napi rutinjának, iskolai eseményeinek és különóráinak nyomon követésében. Lehetőséget ad más családok meghívására, közös programok szervezésére és közösségépítésre. Gyerekeknek játékos funkciókat (jelvények, élmények) ad, szülőknek pedig praktikus eszköz a szervezéshez.

## 2. Technológiai stratégia

* **Kezdet**: Webes PWA (Progressive Web App) → böngészőből és telefonon is fut, telepíthető ikonként.
* **Később**: Natív Android + iOS alkalmazás a teljesítmény, offline és OS-integráció miatt.
* **Szinkronizáció**: valós idejű frissítések minden eszközön.

### 2.1 Technológiai stack részletek

* **Firebase vs. saját backend**: Firebase gyors indulást biztosít, valós idejű adatokat és push értesítéseket kezel. Saját backend nagyobb rugalmasságot és testreszabást ad, de hosszabb fejlesztési idő.
* **Adatbázis tervezés**: relational DB (PostgreSQL/MySQL) az események, családok, felhasználók tárolására; cache réteg (Redis) a gyors szinkronhoz.
* **API architektúra**: REST vagy GraphQL a frontend és backend kommunikációhoz; WebSocket/Firebase realtime az események azonnali frissítéséhez.

## 3. Felhasználói élmény és regisztráció

### 3.1 Hibrid Regisztrációs Modell

**Kulcs elv**: Itt dől el, mennyire lesz barátságos az app első élménye. A hibrid modell lehetővé teszi, hogy a család egységesen jelenjen meg kifelé, belül pedig mindenkinek személyes élménye legyen.

#### 🔑 Regisztráció folyamata

**1. Család alapítói regisztráció**
- Egy ember (pl. anya/apa) regisztrál először
- E-mail / Google / Facebook login
- Megadja a Család nevét (pl. „Budzkó család")
- Opcionálisan: város, gyerekek száma, érdeklődési körök
- ➡️ Ezzel létrejön a Család profil, és a regisztráló lesz az Admin

**2. Családtagok meghívása**
- Admin kap egy „meghívás" funkciót
- E-mail / telefon / QR kód
- Pl. „Hívd meg a párodat és a gyerekeidet"
- A meghívott:
  - Kap linket → Regisztrál (csatlakozik a családhoz)
  - Vagy: kap egy guest profilt (pl. gyerekeknek, akinek a szülő tölti ki a nevét, avatarját, de nincs saját jelszava → beléphet később, ha nagyobb lesz)

**3. Profil testreszabás**
- Minden felhasználó a saját fiókján belül beállíthat:
  - Avatar (pl. fénykép, emoji, állatka gyerekeknek)
  - Szerep a családban (szülő / gyerek / nagyszülő)
  - Saját értesítési beállítások
  - Saját naptár-szinkron (pl. Google Calendar, iCal import)

#### 🔐 Bejelentkezés folyamata

- Felhasználónként történik, nem családonként
- Belép e-mail/jelszóval vagy social loginnal
- A rendszer tudja, hogy melyik család(ok)hoz tartozik
- Ha valaki több családhoz tartozik (pl. elvált szülő gyereke) → választhat, melyik család naptárát akarja látni (mint Slackben több workspace)

#### 👨‍👩‍👧 Példa élményben

1. **Anna regisztrál** → „Kovács család" létrehozva
2. **Meghívja a férjét és 2 gyerekét**
3. **Férj e-mailből regisztrál** → saját profil
4. **Gyerekeknek Anna létrehoz gyors profilt** (név, avatar, születési év), később ők is beléphetnek
5. **Most már mindenki láthatja a közös naptárat** → de a saját színnel jelzett eseményeket is

#### 💡 A hibrid modell előnyei

- **Kifelé**: A család egységesen jelenik meg (pl. más családoknak)
- **Befelé**: Mindenkinek személyes élménye van
- **Skálázhatóság**: Könnyen bővíthető új családtagokkal
- **Flexibilitás**: Guest profilok gyerekeknek, teljes profilok felnőtteknek
- **Családi dinamika**: Admin jogosultságok, szerep-alapú hozzáférés

## 4. Bevételi modell

* **Ingyenes alapszolgáltatás** a gyors terjedésért.
* **Marketplace réteg**: programok, szolgáltatók (cirkusz, játszóház, étterem) hirdethetnek.
* **Prémium funkciók**: extra értesítések, offline mód, kiterjesztett naptárnézet.
* **Gamifikációs tartalmak**: jelvények, családi kihívások.

## 5. Különlegességek

* Gyerekeknek élmény (jelvények, kihívások).
* Szülőknek hasznosság (naptár, programok).
* Családok közötti meghívás és közös szervezés.
* Nyelvtanulási lehetőség: külföldi családokkal közös hét.

## 6. Versenykép elemzés

* **Fő versenytársak**: Google Calendar, Cozi, Family Wall.
* **Versenyelőnyünk**:

  * Közösségi élmény + meghívásos terjedés.
  * Gyerekek bevonása gamifikációval.
  * Marketplace + szolgáltató programok integrációja.
  * Nemzetközi csereprogram nyelvtanulás céljából.
* **Hiányosságok a versenytársaknál**:

  * Nem fókuszálnak a családokra és gyerekek bevonására.
  * Kevés interakció és gamifikáció.
  * Nincs integrált marketplace vagy nemzetközi csereprogram.

## 7. Felhasználói persona-ok

* **Család 1: Fiatal szülők 1-2 gyerekkel**

  * Probléma: kaotikus napi rutin kezelése.
* **Család 2: Többgyermekes család**

  * Probléma: különórák, iskolai események nyomon követése.
* **Család 3: Nyelvtanulásra nyitott családok**

  * Probléma: nyelvi és kulturális csere lehetőségek szervezése.

## 8. Kockázatelemzés

* **Adatvédelem és GDPR megfelelés**: titkosítás, szülői hozzájárulás, európai szerverek.
* **Technikai kihívások**: skálázás, offline mód, push értesítések stabilitása.

## 9. MVP definíció

* **Első verzió funkciók**:

  * Naptár események rögzítése és szinkronizálása.
  * Meghívások családtagokhoz és baráti családokhoz.
  * Értesítések.
  * PWA verzió.
* **Nice to have**: jelvények, marketplace, nemzetközi csereprogram.
* **Tesztelési terv**: alfa belső kör, béta meghívásos családokkal, visszajelzések alapján finomhangolás.

## 10. Mérőszámok és célok

* **Felhasználói növekedés**: 1000 aktív család 6 hónapon belül.
* **Engagement metrikák**: heti aktív felhasználók >50%, események száma/felhasználó, meghívások száma.
* **Bevételi célok**: marketplace bevétel 2. évben, prémium előfizetés 3. évben.

## 11. Fejlesztési ütemezés

* **Sprint tervek** (2 hét/sprint): naptár funkciók, szinkron, meghívások, PWA optimalizálás.
* **Milestone-ok**: MVP béta 3 hónap, publikus indulás 6 hónap, prémium funkciók 12 hónap.
* **Erőforrások**: 2 fejlesztő, 1 UX/UI designer, 1 PM, 1 marketinges.

## 12. Marketing stratégia

* **Terjesztés**: baráti meghívások, közösségi média, blogok és fórumok.
* **Csatornák**: Facebook, Instagram, Pinterest (szülői csoportok), hírlevelek, influencerek a családi tech területen.
* **Cél**: organikus növekedés meghívásokkal, később fizetett kampányok a prémium funkciókhoz.

---

## 13. Összegzés

Első lépésben PWA-ként indulunk a gyors terjedésért, majd natív appokkal bővítjük a funkciókat. Versenyelőnyünk a közösségi és gamifikált élmény, marketplace és nemzetközi csereprogram. A dokumentáció lefedi az MVP-t, kockázatokat, célokat, mérőszámokat, technológiát és marketinget.

**A hibrid regisztrációs modell kulcsfontosságú**: lehetővé teszi, hogy a család egységesen jelenjen meg kifelé, belül pedig mindenkinek személyes és testreszabott élménye legyen. Ez a megközelítés jelentősen javítja a felhasználói élményt és a családi dinamika kezelését.
