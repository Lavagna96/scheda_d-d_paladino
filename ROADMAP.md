# Roadmap — Da scheda Paladino ad app multi-account

> **Questo file è il registro di avanzamento tra sessioni.**
> Regola di manutenzione: a ogni step completato aggiornare la casella `[ ]` → `[x]`,
> la sezione "Dove siamo" e il "Prossimo passo". Le decisioni prese vanno
> annotate nella sezione "Decisioni" con la data.

---

## Dove siamo

- **Ultimo aggiornamento:** 2026-07-20
- **Stato:** Fase 0 + Fase 1 (login page e Face ID) **committate e
  DEPLOYATE** su GitHub Pages (`bf75403`, `5c6f2a5`, `95da6f6`; run Pages
  verde, live verificato con curl: `?v=52` servito). Login già provato da
  Andrea con credenziali vere in locale.
- **Prossimo passo:** commit + deploy della Fase 3 (con permesso), poi
  collaudo di Andrea su iPhone (editing reale + sync multi-device) e
  collaudo residuo della Fase 2 (step 2.5, mai confermato esplicitamente).
  A seguire: step **3.5** (oggetti magici della campagna creabili da
  interfaccia, già specificato in dettaglio più sotto) oppure direttamente
  **Fase 4** (Level Up Paladino) — da concordare con Andrea quale fare prima.

---

## Visione

Trasformare l'app da scheda singola di Tharion Velnar (Paladino 7) a:

1. **Login page** di atterraggio per tutti, con autenticazione anche via Face ID.
2. **Dashboard profilo** con la lista dei propri personaggi; click sul personaggio → si apre la scheda com'è oggi.
3. **Modifica dei valori della scheda** con persistenza su Firestore.
4. **Level up guidato** (popup/bottom sheet): mostra cosa guadagna la classe a quel livello e le scelte da fare (es. Paladino 7→8: +2 caratteristiche o talento). Prima solo Paladino, poi le altre classi.
5. (Futuro) Creazione di qualsiasi scheda prevista dal manuale.

Principio architetturale chiave (richiesto esplicitamente): **le formule del manuale
usano variabili** — se cambio Carisma, tutti i campi derivati dal Carisma
(TS, abilità, CD incantesimi, Aura di Protezione, Arma Sacra…) si ricalcolano da soli.

---

## Analisi dello stato attuale (fatta il 2026-07-19)

Cosa c'è già e cosa manca, verificato nel codice:

| Area | Stato | Note |
|---|---|---|
| Auth Firebase | ✅ c'è | Email+password in un modal (`js/cloud.js`), non una pagina di login |
| Percorso Firestore | ✅ semi-pronto | Già `users/{uid}/characters/{id}`, ma `CHAR_ID` è fisso a `tharion-velnar` |
| Sync stato | ✅ c'è | localStorage fonte immediata, cloud mirror last-write-wins |
| Manuale 5.5 | ⚠️ parziale | Tabelle di progressione per classe sì; **mancano** i privilegi per livello ("cosa guadagni al liv. N"), i talenti e la logica ASI |
| Valori scheda | ❌ hardcoded | `js/config.js`: caratteristiche, TS, abilità, attacchi, CA, CD sono **stringhe precalcolate** (`'+7'`), non derivate. Lo stato persistito copre solo risorse/inventario/diario/grimorio |
| Login page / dashboard | ❌ non esiste | App a pagina unica, si atterra dritti sulla scheda |
| Level up | ❌ non esiste | Livello fisso a 7 in config |

**Conseguenza importante:** i punti 3 e 4 della visione (modifica valori + level up)
richiedono prima di spostare i valori base della scheda dentro lo stato persistito
e di introdurre un **motore di derivazione** (le "formule"). Senza questo, ogni
modifica al Carisma andrebbe propagata a mano in decine di stringhe.

---

## Fasi

### Fase 0 — Fondamenta: modello dati + motore di formule
*Prerequisito tecnico per le fasi 3 e 4; invisibile all'utente ma cambia tutto sotto.*

- [x] 0.1 Definire il modello dati "fatti base" del personaggio da persistere:
      punteggi caratteristica, livello, classe/sottoclasse, specie, competenze
      (TS/abilità), equipaggiamento che influenza CA, bonus magici (es. spada +1).
      → Scelto il modello **B**: fatti base + lista `modifiers` generica
      (source/target/value); le formule standard del PHB vivono in `js/engine.js`.
- [x] 0.2 Creare `js/engine.js`: modulo puro che dai fatti base calcola i derivati —
      mod = ⌊(punteggio−10)/2⌋, bonus competenza dal livello, TS, abilità,
      percezione passiva, CD incantesimi = 8+comp+CAR, attacco incantesimi,
      attacchi arma, Aura di Protezione (=mod CAR), Imposizione delle Mani (=5×liv),
      slot dalla tabella half-caster, PF massimi. Formule verificate sul PHB 2024 (PDF locale).
      → Include anche il soffio/volo del Dragonide e le risorse (data-max) derivate.
- [x] 0.3 Migrare i renderer a leggere dal motore: nuovo `js/stats.js` (caratteristiche,
      TS, abilità, attacchi, risorse, privilegi con numeri da CAR) + aggiornati
      `sheet.js`, `header.js`, `grimorio.js`, `treasury.js`, `cloud.js`, `app.js`.
      I derivati duplicati sono stati RIMOSSI da `config.js` (restano solo fatti
      base in `DEFAULT_STATE.character` + dati statici: STEED, SPELLS, FEATURES…).
- [x] 0.4 Migrazione stato v2 → v3 in `storage.js` (merge conservativo di
      `character` sui default). Verificato nel browser: scheda **identica** a prima
      (AC 20, TS CAR +9, CD 15, +8/1d8+7, soffio TS DES 13/2d10, risorse, PF 60, ecc.)
      e test CAR 16→18: TS/CD/aura/Arma Sacra/Intimidire si aggiornano tutti da soli.
- [x] 0.5 Test locale completo (console pulita, valori verificati, screenshot);
      cache busting `?v=50`; commit autorizzato da Andrea il 2026-07-19.

### Fase 1 — Login page e Face ID
*Il punto 1 della visione.*

- [x] 1.1 Architettura decisa (2026-07-19): **SPA a viste** (login/dashboard/scheda
      nello stesso index.html), **Face ID = blocco biometrico locale** (approccio A,
      WebAuthn come lucchetto, sessione Firebase persistente sotto),
      **login obbligatorio** (niente modalità ospite).
- [x] 1.2 Login page di atterraggio implementata (design **A — Stemma araldico**,
      scelto tra 3 proposte con preview): vista `#view-login` in index.html +
      `css/components/login.css`; macchina a stati sul body
      (`auth-checking` → `auth-out`/`auth-in`) pilotata da `cloud.js`
      (che ora fa da cancello: login/registrazione/recupero nella vista,
      modal account solo per la gestione da loggati); paracadute di timeout
      in `app.js` se Firebase non carica. Cache busting `?v=51`.
      Verificato in locale: gate attivo, errori mostrati, stato autenticato
      simulato via classi CSS OK. **Da testare con credenziali vere e su
      iPhone (step 1.4). Titolo "Schede & Imprese" ancora segnaposto.**
- [x] 1.3 Face ID implementato (2026-07-20, via subagente Sonnet): nuovo
      `js/faceid.js` (WebAuthn platform authenticator, credenziale per
      dispositivo+origine in localStorage `app-faceid*`); quarta fase
      `auth-locked` nella macchina a stati; schermata lucchetto nella vista
      login ("Bentornato! Sblocca per entrare" + medaglione Face ID + "Non
      sei tu? Esci"); toggle Attiva/Disattiva nel modal Account (visibile
      solo se il dispositivo ha l'autenticatore). Cache busting `?v=52`.
      Verificato in locale (stato simulato, console pulita). **ATTENZIONE
      per il test reale: WebAuthn richiede un contesto sicuro — funziona su
      `localhost` (Mac → Touch ID) e su GitHub Pages (HTTPS → Face ID su
      iPhone), NON da iPhone via LAN `http://IP:5599`. Quindi il vero test
      Face ID su iPhone si fa dopo il deploy.**
      → Collaudato da Andrea su iPhone il 2026-07-20: funziona. Rifinitura
      richiesta e implementata (`?v=53`): **auto-scan** all'ingresso nel
      lucchetto (il medaglione resta come riserva) e **tolleranza 5 minuti**
      (`app-faceid-last-active` aggiornato su pagehide/visibilitychange e
      ogni 30 s in auth-in; lucchetto solo se inattivi > 5 min). Il foglio
      "Continua" di iOS non è eliminabile (UX di sistema WebAuthn).
- [ ] 1.4 Test su iPhone standalone (PWA): viewport, tastiera, safe-area. Commit.

### Fase 2 — Dashboard profilo e multi-personaggio
*Il punto 2 della visione.*

- [x] 2.1 `cloud.js` ristrutturato (2026-07-20, subagente Sonnet): via il `CHAR_ID`
      fisso → `app-active-char` in localStorage; lista da `getDocs` su
      `users/{uid}/characters` con fallback locale se il cloud non risponde;
      `enterApp()` unico punto che decide dashboard vs scheda (flag
      `app-skip-dashboard` in sessionStorage, selezione → reload pulito).
- [x] 2.2 Dashboard "Sala degli eroi rivista" implementata (`js/dashboard.js` +
      `css/components/dashboard.css` + `#view-dashboard`): card col ritratto,
      sigillo livello, riga classe·sottoclasse·specie, ENTRA; riserva a
      emblema; segnaposto "Nuovo personaggio — presto"; ingranaggio → modal
      account; ritorno dalla scheda con "I tuoi personaggi" nel pannello
      opzioni. **Ritratti**: `js/portrait.js` (resize canvas ≤900px, ≤~700KB),
      "Cambia ritratto" nel modal avatar, migrazione automatica di
      avatar-full.jpg nello stato di Tharion. Nome app "Schede & Imprese" su
      title/PWA/manifest. Cache busting `?v=54`.
- [x] 2.3 Chiavi localStorage per-personaggio (`char-<id>-state`) con migrazione
      dalle legacy `tharion-*` (verificata end-to-end, chiave legacy intatta).
- [x] 2.4 Il documento esistente `tharion-velnar` è il primo della lista (nessun
      rename necessario: l'id era già quello).
- [ ] 2.5 Collaudo di Andrea dopo il deploy: atterraggio in dashboard, selezione,
      ritorno alla dashboard, upload ritratto da iPhone, sync multi-device.
      **Se la lista non si carica** ("Impossibile aggiornare la lista dal
      cloud"): le regole Firestore devono permettere la lettura della
      collezione `users/{uid}/characters` (es. `match /users/{userId}/{document=**}`
      con `allow read, write: if request.auth.uid == userId`).

### Fase 3 — Modifica valori della scheda con persistenza
*Il punto 3 della visione. Dipende dalla Fase 0.*

- [x] 3.1 UX decisa (vedi Decisioni prese, 2026-07-21): bottom sheet per sezione,
      steppers a card per i numeri, chip per le competenze.
- [x] 3.2 Editing implementato (subagente Sonnet): nuovo `js/edit-sheet.js` +
      `css/components/edit-sheet.css`, 3 bottom sheet — Caratteristiche
      (6 punteggi con stepper + competenze TS), Abilità (18 competenze da
      `AppEngine.SKILLS`), Equipaggiamento (armatura/scudo/arma/stile).
      Icone matita sulle intestazioni delle sezioni corrispondenti. Bozza
      locale allo sheet: "Salva" applica, chiusura con ✕/tap-fuori scarta.
      **Esteso il motore** (`js/engine.js`): `ARMORS` ora ha 4 armature vere
      (Cuoio Borchiato, Mezza Piastra, Cotta di Maglia, Piastre) con le CA
      dal PHB 2024 (verificate: tabella Armor, pag. armi/armature), + stile
      di combattimento **Difesa** (+1 CA con armatura) accanto al Duello
      già esistente. Grande Arma/Protezione restano fuori scope (bonus non
      fissi, richiedono logica reroll/reazione). Livello e classe NON sono
      editabili (arriveranno con la Fase 4 Level Up). Cache busting `?v=55`.
- [x] 3.3 Persistenza già gratis via `AppStorage`→`AppCloud` (nessun codice nuovo
      necessario, come previsto).
- [x] 3.4 Verificato **due volte** (subagente + controprova indipendente in
      sessione): CA Tharion resta 20 con Piastre/Scudo/Duello dopo le modifiche
      al motore (no regressione); cambio armatura dall'interfaccia reale
      (select→Salva) ricalcola la CA per ogni opzione (Mezza Piastra → 16,
      confermato −1 DES applicato correttamente sotto il tetto +2, coerente
      col PHB); CAR 16→18 dallo sheet propaga a TS/CD/Aura/attacco
      incantesimi esattamente come nella Fase 0; chiusura senza Salva scarta
      la modifica. Stato di test ripulito, Tharion ripristinato ai valori
      reali. **In attesa di commit + deploy.**
- [ ] 3.5 **Oggetti speciali/magici della campagna creabili da interfaccia**
      (richiesto da Andrea il 2026-07-19): durante la campagna arriveranno nuovi
      oggetti unici (stile Lama Vincolante) e deve essere possibile aggiungerli
      direttamente dall'app, senza toccare il codice. Per ogni oggetto si sceglie:
      - nome e **descrizione** libera;
      - **cosa modifica**: uno o più bersagli della lista `modifiers` del motore
        (attacco, danni, CD/attacco incantesimi, CA, TS, iniziativa, PF max…)
        con relativo valore — il motore li somma già automaticamente;
      - **icona SVG scelta da un pool** predefinito che copre i casi principali
        (spada, scudo, anello, amuleto, mantello, bastone, pozione, tomo…);
      - eventuali usi limitati (es. 1/giorno) che diventano una res-card come
        l'attuale "Scudo magico".
      L'oggetto vive nello stato del personaggio (quindi sincronizzato su
      Firestore) e compare tra i Tratti con la sua icona e descrizione.

### Fase 4 — Level up Paladino
*Il punto 4 della visione. Dipende dalle Fasi 0 e 3.*

- [ ] 4.1 Estendere `manual-55.js` con i privilegi per livello del Paladino 1→20
      (dal PHB 2024 PDF, riassunti in italiano): cosa si guadagna a ogni livello,
      quali scelte comporta (ASI o talento ai liv. 4/8/12/16/19, sottoclasse al 3,
      nuovi slot, Aura 9 m al 18…).
- [ ] 4.2 Talenti: aggiungere al manuale almeno i talenti generali del PHB idonei
      al Paladino (prerequisito liv. 4+) in forma riassunta.
- [ ] 4.3 UX level-up: bottom sheet/wizard che al passaggio di livello mostra i
      guadagni automatici e guida le scelte (distribuzione +2/+1+1, o talento;
      tiro/media PF) — 3 proposte con preview.
- [ ] 4.4 Applicazione atomica del level-up allo stato + ricalcolo derivati + sync cloud.
- [ ] 4.5 Test del percorso 7→8 reale di Tharion e simulazione fino al 20. Commit.

### Fase 5 — Estensioni future (backlog, non pianificate in dettaglio)

- [ ] Level up per le altre 11 classi (il motore e la UX di Fase 4 devono già nascere generici).
- [ ] Creazione guidata di un personaggio nuovo da zero (qualsiasi classe/specie del manuale).
- [ ] Multiclasse (esplicitamente fuori scope per ora).

---

## Decisioni aperte (da discutere prima delle rispettive fasi)

1. **PF al level up:** regola del tiro del dado, della media fissa, o scelta dell'utente?
   (Nota: i PF attuali di Tharion seguono la media fissa.)
2. **Design della login page:** 3 proposte grafiche con preview da presentare (step 1.2).
3. Nota tecnica da confermare durante la 1.3: comportamento WebAuthn in PWA
   standalone su iOS recenti (atteso OK da iOS 16+).

## Decisioni prese

- 2026-07-21 — Fase 3, step 3.1: UX = **bottom sheet per sezione** con
  **steppers a card** (proposta A tra 3 con preview) per punteggi/numeri,
  chip per competenze. Ambito di questa prima passata: **punteggi +
  competenze (TS/abilità) + equipaggiamento** (armatura, scudo, arma, stile
  di combattimento). Livello e classe restano bloccati, si cambiano con la
  futura Fase 4 (Level Up). Verificato sul PHB 2024 (PDF locale): tabella
  armature complete, Stile di Combattimento Difesa (+1 CA) e Duello
  (+2 danni, già presente) hanno bonus fissi modellabili nel motore; Grande
  Arma e Protezione NO (richiedono logica di reroll/reazione, fuori scope
  per un editor di "fatti base" — restano da fare in futuro se richiesti).

- 2026-07-20 — Fase 2, architettura: dopo login/sblocco si atterra **sempre
  sulla dashboard**; in Fase 2 **solo lista e selezione** dei personaggi
  (creazione guidata in fase dedicata, segnaposto "presto" nella lista);
  **nome definitivo dell'app: "Schede & Imprese"** (non più segnaposto).
- 2026-07-20 — Fase 2, design dashboard: scelta la **B "Sala degli eroi"
  rivista coi ritratti veri** (card piena col ritratto, nome/classe su
  sfumatura, livello all'angolo; riserva a emblema dorato senza ritratto).
  **Ritratti**: salvati come immagine compressa (data URL ≤ ~700 KB) dentro
  `state.character.portrait` → sync Firestore col resto della scheda, niente
  Firebase Storage; upload con ridimensionamento client-side dal modal del
  ritratto ("Cambia ritratto"); migrazione automatica di avatar-full.jpg
  nello stato di Tharion al primo avvio.

- 2026-07-19 — Roadmap creata; si lavora una fase alla volta, con discussione,
  3 alternative con preview e approvazione prima di ogni implementazione (da CLAUDE.md).
- 2026-07-19 — Andrea ha scelto di partire dalla **Fase 0** (modello dati + motore
  di formule); l'ordine è 0 → 1 → 2 → 3 → 4.
- 2026-07-20 — Fase 1, step 1.2: tra le 3 proposte grafiche di login page
  (A stemma araldico, B tomo epico, C minimale — artifact con i mockup:
  https://claude.ai/code/artifact/74ae7912-b574-4d1d-9898-59af27ba27fa)
  Andrea ha scelto la **A — Stemma araldico**. Il titolo "Schede & Imprese"
  è un segnaposto da confermare.
- 2026-07-19 — Fase 1, step 1.1: scelte **SPA a viste**, **Face ID approccio A**
  (blocco biometrico locale via WebAuthn, sessione Firebase persistente) e
  **login obbligatorio** senza modalità ospite.
- 2026-07-19 — Fase 0 committata (`bf75403`), non ancora deployata.
- 2026-07-19 — Step 0.1: scelto il modello **B "fatti base + modificatori"**
  (vs A motore semplice e C formule dichiarative). Formule verificate sul PHB:
  Imposizione = 5×liv, Aura = mod CAR (min +1) ai TS, CD = 8+mod+comp,
  ASI ai liv. 4/8/12/16, Boon al 19. I numeri attuali di Tharion tornano tutti
  (TS CAR +9 = 3+3+3; attacco +8 = 4 FOR + 3 comp + 1 spada; danni +7 include
  +2 dello stile di combattimento Duello; CD soffio 13 = 8+2 COS+3 comp).

---

## Promemoria operativi (valgono per ogni fase)

- Testare in locale (config "scheda", porta 5599) prima di ogni proposta di deploy.
- Cache busting `?v=N` allineato tra `index.html` e `css/styles.css` a ogni tocco di CSS/JS.
- Regole di gioco SOLO dal PDF PHB 2024 locale; nell'app solo riassunti originali in italiano.
- Commit in italiano `tipo(scope): descrizione`, senza firme, solo con permesso esplicito.
