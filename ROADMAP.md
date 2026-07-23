# Roadmap — Da scheda Paladino ad app multi-account

> **Questo file è il registro di avanzamento tra sessioni.**
> Regola di manutenzione: a ogni step completato aggiornare la casella `[ ]` → `[x]`,
> la sezione "Dove siamo" e il "Prossimo passo". Le decisioni prese vanno
> annotate nella sezione "Decisioni" con la data.

---

## Dove siamo

- **Ultimo aggiornamento:** 2026-07-22
- **Stato:** **Fasi 0, 1, 2, 3 e 4 tutte COMPLETE, committate e DEPLOYATE** su
  GitHub Pages, ultimo commit `ace8167` (wizard di level-up, che chiude la
  Fase 4). L'intera visione originale (login, dashboard multi-personaggio,
  editing, oggetti magici, level-up guidato per il Paladino) è realizzata e
  funzionante. Login e Face ID collaudati da Andrea su iPhone reale.
  **La Fase 5 è ora pianificata in dettaglio (2026-07-22):** vedi la sua
  sezione qui sotto e "Decisioni prese (Fase 5)".
- **Prossimo passo:** iniziare il **Blocco 5.A** (generalizzazione di motore e
  wizard) insieme alla **1ª classe nuova, il Barbaro**, tenendo il Paladino
  come test di non-regressione. Restano in coda due collaudi mai confermati
  esplicitamente: sync multi-device tra due dispositivi con lo stesso account,
  e la verifica nella console Firebase che `manuals/5.5/feats` sia arrivato
  davvero su Firestore (step 4.4 — il sync fallisce in silenzio se la regola
  non è deployata, vedi quello step per la riga di regola da aggiungere).

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
      reali. Committato e deployato (`0f902fe`, run Pages verde, live
      verificato con curl: `edit-sheet.js?v=55` servito).
- [x] 3.5 **Oggetti speciali/magici della campagna creabili da interfaccia** — FATTO
      (2026-07-21, via subagente Sonnet, verificato due volte). Nuovo array
      `state.character.items` (nome, descrizione, icona SVG da un pool di 8,
      elenco di effetti per esteso con stepper, usi limitati opzionali).
      Compaiono tra i Tratti in "Reliquie & Oggetti Magici"; con usi limitati
      diventano una vera res-card in Risorse → "Oggetti", stessa meccanica di
      "Scudo magico". `character.modifiers`/Lama Vincolante intatti, fuori
      scope. Verificato in browser: non-regressione (items:[] → CA/TS/CD
      invariati), creazione con 2 effetti (CA 20→21, TS CAR/FOR +1 ciascuno),
      res-card con usi limitati funzionante al tocco, modifica ed eliminazione
      (tornano esattamente al valore base). Cache busting `?v=57`.
      Committato e deployato (`f91dc85`, run Pages verde, live verificato).
      Sotto, il testo originale della specifica per riferimento:
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
*Il punto 4 della visione, la fase più grande. Dipende dalle Fasi 0 e 3.*
*Per ora SOLO Paladino, ma dati e UX vanno pensati generici (altre classi in Fase 5).*

Struttura in 3 blocchi: prima i **dati del manuale** (+ sync a DB), poi le
**fondamenta nella scheda**, infine il **flusso di level-up** vero e proprio.
Ogni step si chiude con verifica e (dove tocca file) commit + deploy, come il resto.

**Blocco A — Dati del manuale (nuove sezioni, tutte da salvare anche su Firestore)**

- [x] 4.1 **Privilegi per livello del Paladino 1→20** in `manual-55.js` — FATTO
      (2026-07-21, dati estratti dal PDF dal coordinatore, integrati dal subagente).
      Aggiunte `classes.paladino.levelFeatures` (mappa 1→20 di privilegi in prosa,
      italiano originale) e `choicePoints` (fightingStyle:2, subclass:3,
      subclassFeatureLevels:[3,7,15,20], asi:[4,8,12,16], epicBoon:19, extraAttack:5).
      `manual.version` 12→13. Tabelle numeriche esistenti intatte. Verificato due
      volte (struttura 1→20 con 13/17 vuoti + non-regressione: Tharion identico,
      console pulita). Cache busting `?v=58`. Committato e deployato (`929a40e`).
      Nota per 4.5: il sync a Firestore di questi dati scatta da solo (version 13 >
      remota) perché `syncManual` serializza l'intero documento classe.
- [x] 4.2 **Giuramento di Devozione** modellato (2026-07-21). Aggiunto
      `classes.paladino.subclasses.devozione` (annidato → si sincronizza col
      documento classe): `name`, `tenets`, `spellsByLevel` (incantesimi sempre
      preparati a 3/5/9/13/17) e `features` (Arma Sacra 3, Aura di Devozione 7,
      Punizione di Protezione 15, Nimbo Sacro 20). `manual.version` 13→14. Altre
      sottoclassi in seguito come puri dati. Verificato (struttura + Tharion
      identico, console pulita). Cache busting `?v=59`. Committato e deployato.
- [x] 4.3 **Catalogo talenti** — FATTO (2026-07-21). Nuova sezione top-level `feats`
      in `manual-55.js` (mappa per id come classes/species): 17 voci curate e
      verificate sul PHB — 10 Stili di Combattimento, 6 Talenti generali (liv. 4+:
      Aumento di Caratteristica con flag `asi:true`, Maestro d'Armi Pesanti, Maestro
      d'Aste, Sentinella, Incantatore di Guerra, Condottiero Ispiratore), 1 Dono Epico
      (Vista Autentica). Catalogo iniziale estendibile. `manual.version` 14→15. Nota:
      "Robusto"/"Attaccante Selvaggio" scartati (talenti di Origine, non selezionabili
      agli ASI). Ogni voce: name/category/prereq/desc. Verificato (17 voci, Tharion
      identico, console pulita). Cache busting `?v=60`. Committato e deployato
      (`6a969be`). Il subagente ha esaurito il limite di sessione a fine lavoro:
      dati completati e verificati direttamente in sessione (bump versione + cache).
- [x] 4.4 **Sync Firestore delle nuove sezioni** — FATTO nel codice (2026-07-21, in
      sessione diretta perché il subagente aveva esaurito il limite). `syncManual()`
      in `cloud.js`: i talenti diventano la sottocollezione `manuals/5.5/feats/{id}`
      (privilegi per livello e sottoclassi viaggiano già dentro i documenti classe,
      annidati → sincronizzati con quelli). **Refactor importante colto al volo**: il
      manuale ha ~393 incantesimi, quindi un singolo batch (ora 432 scritture)
      sfiorava il limite Firestore di 500 → riscritto in blocchi da 400 committati in
      sequenza, con la versione radice scritta per ultima a parte (avanza solo a sync
      completato; un blocco fallito viene ritentato). Verificato: modulo si inizializza
      senza errori, AppCloud attivo, login OK, console pulita. Cache busting `?v=61`.
      Committato e deployato (`57a4534`).
      **VERIFICA REALE ANCORA DA FARE (serve Andrea):** dopo il deploy, login sul sito
      live → il sync parte (versione locale 15 > remota); poi confermare nella console
      Firebase che esista `manuals/5.5/feats` con le 17 voci. Se NON compaiono, la
      **regola Firestore** per i manuali non è attiva: aggiungere in Console → Firestore
      → Regole `match /manuals/{document=**} { allow read, write: if request.auth != null; }`.
      Il sync fallisce in silenzio (catch), quindi l'app funziona comunque dal file locale.

**Blocco B — Fondamenta nella scheda**

- [x] 4.5 **Tratti derivati dal manuale** — FATTO (2026-07-21). Le due card statiche
      dei Tratti sono ora generate da `js/traits.js` a partire da
      `classes[classId].levelFeatures` + `subclasses[subclassId].features` +
      `species[speciesId].traits`, filtrati per livello e per un flag di curatela
      `trait: false` aggiunto nel manuale (esclude ciò che ha già una card altrove:
      Imposizione Mani, Incantesimi, Stile di Combattimento, Punizione del Paladino,
      Incanalare Divinità, Sottoclasse del Paladino, ASI, Attacco Extra, Privilegio di
      Sottoclasse generico, Dono Epico, Ascendenza Draconica). `species.dragonide`
      ha anche `minLevel: 5` su Volo Draconico. Aggiunto `character.subclassId:
      'devozione'` (piccolo assaggio anticipato dello step 4.6, necessario qui).
      Le due card storicamente dinamiche (Aura di Protezione, Arma Sacra) restano
      calcolate col valore reale (stessa formula di prima, spostata da `stats.js`
      — rimossa `renderFeatures` — a `traits.js`); le altre usano il riassunto del
      manuale così com'è. **Uniche due deviazioni dal testo precedente, dichiarate
      e approvate**: "Maestria nelle Armi" perde il dettaglio "Vex/Rallentare"
      (non c'è nello stato un dato per una seconda arma) e le altre card hanno
      testo più lungo/generico del manuale invece delle frasi ad hoc scritte a
      mano. Verificato **due volte** (subagente + controprova indipendente in
      sessione): diff di `manual-55.js` conferma SOLO flag aggiunti, zero testo
      alterato; le 6 card di classe e le 4 di specie attese sono esattamente
      quelle previste, in più le due card dinamiche mostrano il testo letteralmente
      identico a prima; test live CAR 16→18 aggiorna "Aura di Protezione" a "+4
      (CAR)..." SENZA reload, poi ripristinato; Lama Vincolante e Reliquie intatte
      e funzionanti; console pulita. Cache busting `?v=62`. Committato e deployato
      (`6412d97`, run Pages verde, live verificato).
- [x] 4.6 **Scelte di livello nello stato del personaggio** — FATTO (2026-07-21,
      fatto direttamente, micro-ritocco). `subclassId` era già stato aggiunto in 4.5.
      Aggiunti a `DEFAULT_STATE.character`: `feats: []` (talenti presi, `{id, level}`,
      id da `manual.feats`) e `levelChoices: {}` (mappa livello → scelta fatta:
      `{type:'asi', abilityDeltas:{...}}` oppure `{type:'feat', featId:'...'}`).
      **Niente migrazione storica per Tharion**: i suoi punteggi attuali sono già il
      risultato finale di scelte mai tracciate finora — non c'è nulla da ricostruire
      a ritroso, i campi partono vuoti e si popolano dal prossimo level-up in poi
      (la migrazione automatica esistente in `storage.js` li aggiunge già di default
      via merge, nessun codice di migrazione nuovo necessario). PF non richiedono
      alcun campo: restano una formula pura nel motore (media fissa), nessuno storico
      da salvare. Verificato: campi presenti, non-regressione confermata (CA 20,
      PF 60, TS CAR +9), console pulita. Cache busting `?v=63`. Committato e
      deployato (`de7aea7`, run Pages verde).

**Blocco C — Il level-up**

- [x] 4.7 **UX del level-up decisa** (2026-07-21): tra 3 proposte con preview
      (artifact: https://claude.ai/code/artifact/daceb757-d26b-4079-ac3f-97c893491779),
      scelta la **A — Sheet unico a sezioni** (stesso pattern dei bottom sheet già
      usati per editing/reliquie: guadagni automatici in alto, poi la scelta con
      un interruttore, poi stepper/catalogo sotto).
      **Da conservare per il futuro** (Fase 5, altre classi): il modello **C —
      Checklist con progresso** (righe "✓ fatto" per i guadagni automatici + righe
      toccabili per ogni scelta ancora aperta, barra "N di M completati") non è
      stato scartato per demerito: è pensato apposta per i livelli con **più
      scelte simultanee** (es. una classe che al livello X ha contemporaneamente
      sottoclasse + incantesimi + ASI). Il Paladino non ha mai più di una scelta
      per livello, quindi oggi non serve — ma quando si adatteranno altre classi
      con livelli "affollati", riconsiderare C invece di forzare A a fare troppo
      in una sola sezione lunga.
- [x] 4.8 **Applicazione atomica** — FATTO (2026-07-21), implementato insieme al 4.7
      (un wizard senza applicazione reale non si sarebbe potuto testare). Nuovo
      `js/levelup.js`: bottone "Sali di Livello" nell'header, bottom sheet con
      guadagni automatici ricalcolati DAL VIVO (`AppEngine.derive` su una bozza
      di personaggio, mai sullo stato reale), sezione ASI-o-Talento con budget
      vincolato (max 2 punti, max +2 su una sola caratteristica, tetto 20),
      catalogo talenti (17 voci) selezionabile, righe di sola lettura per
      sottoclasse/dono epico quando c'è una sola opzione disponibile (nota nel
      codice su dove inserire un picker se in futuro le opzioni diventano più
      di una). Conferma: livello + eventuali abilità/talento applicati,
      `levelChoices`/`feats` registrati, **PF correnti aumentati della stessa
      quantità del tetto** (non solo il tetto — regola vera del PHB, include il
      bonus retroattivo di Costituzione se scelta come ASI), Imposizione delle
      Mani lascia i PF correnti invariati (solo il tetto sale). Livello
      impostabile SOLO tramite wizard, incrementale di +1 (nessun campo diretto,
      come deciso).
      **Verificato DUE volte** (subagente + controprova indipendente approfondita
      in sessione, incluso un giro di debug che ha isolato un falso allarme:
      un mio click via coordinate non era arrivato a segno, non un bug
      dell'app — confermato ripetendo il test con click diretti sugli elementi
      reali). Percorso 7→8 reale di Tharion: guadagni esatti "PF 60→68",
      "Imposizione 35→40", "Dadi Ferita 7d10→8d10", nessun'altra riga; bonus
      retroattivo di Costituzione confermato a parte (COS+2 con Tharion→ PF
      60→76, verificato sia con `AppEngine.derive` diretto sia dentro il
      wizard reale); conferma con CAR+2 → level 8, CAR 18, PF correnti 68,
      Imposizione max 40/correnti 35, header e Aura di Protezione ("+4 CAR")
      aggiornati senza reload; annulla scarta tutto; percorso Talento (livello
      11→12 simulato) → Sentinella scelto, `feats`/`levelChoices` corretti;
      riga Dono Epico auto-selezionata al 18→19, non bloccante; console pulita
      in tutta la sessione; stato di Tharion ripristinato esattamente ai valori
      reali (livello 7, CAR 16, feats/levelChoices vuoti) a fine test.
      Cache busting `?v=64`. Committato e deployato (`ace8167`, run Pages
      verde, live verificato).
- [ ] 4.9 **Test**: simulazione 1→20 a tavolino (percorso 7→8 reale già fatto nel 4.8).
      Commit + deploy finale della fase — sarà lo stesso commit del 4.7/4.8, dato che
      sono stati implementati e verificati insieme.

### Fase 5 — Tutte le classi + creazione di un personaggio da zero

*Il punto 1 (level-up altre classi) e il punto 2 (creazione da zero) della
visione. Il multiclasse (punto 3) è trattato a parte nella Fase 6, dopo questa.*

**Approccio deciso (2026-07-22):** verticale, una classe alla volta **dalla
più semplice ma tutte**, ognuna portata end-to-end come è oggi il Paladino
(dati manuale → motore → tratti → level-up → creabile), con verifica e commit
**per classe**. Il **Paladino è il modello di riferimento** già completo: resta
invariato e fa da test di non-regressione a ogni passo.

**Stato di genericità del codice (verificato il 2026-07-22):**

| Pezzo | Generico? | Nota |
|---|---|---|
| `manual-55.js` dati base 12 classi | ✅ | hitDie/saves/casterType/spellAbility per tutte; slotTables full/half/pact condivise |
| `manual-55.js` progressione 1→20 | ❌ | Solo Paladino ha levelFeatures/choicePoints/subclasses; le altre 11 solo dati base |
| `engine.js` numeri base | ✅ | mod, PB, TS, abilità, CA, slot, PF, CD/att. incantesimi derivati da `klass.*` |
| `engine.js` privilegi | ❌ | `isPaladin` cabla Aura/Imposizione/Smite/Destriero; Arma Sacra fissa; attacco arma su FOR fisso |
| `traits.js` | ✅ | card dal manuale via template `{{...}}` + 2 formule speciali Paladino |
| `levelup.js` | ⚠️ | choicePoints/ASI generici; stili hardcoded, niente scelte multiple/incantesimi/competenze |
| `config.js` DEFAULT_STATE + STEED/SWORD_TIERS/FEATURES/SPELLS | ❌ | ancora interamente Tharion |
| Creazione nuovo PG | ❌ | segnaposto "presto" nella dashboard |

**Blocco 5.A — Generalizzazione motore + wizard**
*(una volta sola, guidata dalla 1ª classe nuova; Paladino invariato e verificato a ogni step)*

- [x] 5.A.1 Motore **dati-driven** per risorse/bonus di classe — FATTO
      (2026-07-22). `paladino.classResources` nel manuale (Imposizione Mani come
      `pool` con tabella 1→20; Punizione/Destriero gratis come `uses` con
      `from`/`max`) + registry `CLASS_BONUSES` in `engine.js` per i bonus che
      scalano con una caratteristica (Aura di Protezione, Arma Sacra). `isPaladin`
      eliminato del tutto; nuovo helper `resMax()`. Verificato: Tharion
      byte-identico (CA 20, TS CAR +9/SAG +6, CD 15, att.inc +7, PF 60,
      Imposizione 35, Aura +3/3m, +8/1d8+7, Arma Sacra +3, ordine risorse
      invariato), console pulita, sintassi OK. Cache busting `?v=65`. Committato
      in locale (deploy rimandato).
- [x] 5.A.2 CA senza armatura **alternativa** come dato di classe — MECCANICA
      FATTA (2026-07-22) in `engine.js` (ramo senza armatura: `10 + DES +
      mod[klass.unarmoredDefense]`). Il dato `unarmoredDefense:'COS'` del Barbaro
      (e `'SAG'` del Monaco) entra con verifica sul PDF nel rispettivo step di
      classe. Testato in memoria: Barbaro COS → CA 15 (17 con scudo).
- [x] 5.A.3 Abilità d'attacco arma (FOR vs DES) — FATTO (2026-07-22). In
      `engine.js`: a distanza (`w.ranged`) → DES; agile (`w.finesse`) → la
      migliore tra FOR e DES; altrimenti FOR. Tharion (spada, FOR) invariato
      (+8); testato agile DES>FOR → DES, agile FOR>DES → FOR, distanza → DES.
- [ ] 5.A.4 Wizard: stili di combattimento dal manuale, guadagni automatici
      generici (via il `classId==='paladino'`), label risorse generiche.
- [ ] 5.A.5 Render (`stats`/`sheet`): label risorse e card 100% dal manuale,
      zero stringhe Paladino residue.

**Blocco 5.B — Creazione di un personaggio da zero**
*(il punto 2; parte quando esistono ≥2 classi generiche, così il selettore ha senso)*

- [ ] 5.B.1 UX del flusso a passi (3 proposte + preview): specie → classe →
      punteggi → competenze → equipaggiamento → sottoclasse/incantesimi se dovuti.
- [ ] 5.B.2 Genera un `character` valido e **vuoto** (nessun residuo Tharion) →
      nuovo documento Firestore → compare in dashboard.
- [ ] 5.B.3 Ripulire `config.js`: STEED/SWORD_TIERS/FEATURES/SPELLS da globali
      di Tharion a dati del personaggio.

**Blocco 5.C — Le classi, una alla volta**
*(stesso pacchetto ripetibile, dati dal PDF PHB 2024 locale, riassunti IT originali — mai testo integrale)*

Pacchetto di 5 step per **ogni** classe:
- **n.1** Privilegi 1→20 dal PDF → `levelFeatures`, `choicePoints`, flag `trait`.
- **n.2** Meccaniche uniche nel motore (risorse/bonus specifici).
- **n.3** Almeno 1 sottoclasse come dati (le altre dopo).
- **n.4** Incantesimi se caster (noti/preparati/cantrip) + scelta nel wizard/creazione.
- **n.5** Verifica (creazione liv 1 + level-up 1→20 a tavolino + Paladino non
  regredito) → sync Firestore → commit/deploy.

Ordine (dalla più semplice; le meccaniche sono i "titoli" per dimensionare il
lavoro, l'inventario esatto va verificato sul PDF quando ci si arriva):

1. [ ] **Barbaro** (no caster) — Furia, Difesa Senz'Armatura. Porta con sé il Blocco 5.A.
   → *step b FATTO (2026-07-22):* privilegi 1→20 dal PDF (p.50-52, riassunti IT),
   `classResources.furia` (via `byLevelRef:'rages'`, nessuna duplicazione),
   `unarmoredDefense:'COS'`, `choicePoints`. Verificato con `derive` (Furia
   2/3/5/6 ai liv 1/5/12/20, CA 15 senz'armatura, Tharion invariato), manuale
   `version` 16→17. *step c1 FATTO (2026-07-22):* sottoclasse **Cammino del
   Berserker** come dati (p.53; Frenesia/Furia Cieca/Ritorsione/Presenza
   Intimidatoria a 3/6/10/14; `version` 17→18). *step c2 FATTO (2026-07-22):*
   tab Risorse generica (`stats.js`) — res-card non pertinenti nascoste, Furia
   generata dinamicamente nella sezione giusta, sezioni vuote e `loh-card`
   (Imposizione) condizionali; il motore passa `name`/`resetOn` con la risorsa.
   Paladino invariato (verificato con Barbaro iniettato + ripristino identico),
   `version` 18→19. *Restano:* sezione attacchi (Soffio/nota) generica, wizard
   di level-up generico, poi creazione (5.B).
2. [ ] **Guerriero** (no caster) — stili extra, ASI a 6/14, attacchi extra multipli, Azione Impetuosa, Recuperare Energie.
3. [ ] **Ladro** (no caster) — Attacco Furtivo, Competenza (doppio PB), Elusione.
4. [ ] **Monaco** (no caster) — Punti Focus, Arti Marziali, Difesa Senz'Armatura (SAG).
5. [ ] **Ranger** (half-caster) — riusa gli slot half del Paladino; incantesimi noti, Nemico Prescelto.
6. [ ] **Chierico** (full) — Incanalare Divinità (campo già esiste), Dominio.
7. [ ] **Druido** (full) — Forma Selvatica, Circolo.
8. [ ] **Bardo** (full) — Ispirazione Bardica, Collegio.
9. [ ] **Stregone** (full) — Punti Stregoneria, Metamagia.
10. [ ] **Mago** (full) — libro incantesimi, Recupero Arcano, Tradizione.
11. [ ] **Warlock** (pact) — slot pact (già in tabella), Invocazioni, Suppliche, Patto.

**Sequenza dei blocchi:** 5.A + Barbaro insieme → 5.B creazione → poi 5.C dalla 2 alla 11.

### Fase 6 — Multiclasse (backlog, dopo la Fase 5)

*Esplicitamente fuori scope per ora: si affronta solo a Fase 5 completata.*
Moltiplica la complessità di motore e wizard (slot da incantatore combinati,
requisiti di punteggio minimo per entrare/uscire, privilegi presi da più classi,
un solo bonus di competenza condiviso) e va pianificata in dettaglio a suo tempo,
come è stato fatto per la Fase 5.

- [ ] Multiclasse secondo le regole del PHB 2024 (da dettagliare quando si arriva).

---

## Decisioni aperte

Della **Fase 5** (da sciogliere al blocco giusto; raccomandazione già annotata):

1. **Creazione, livello di partenza** — livello 1 fisso (poi si sale col wizard)
   vs livello arbitrario. → *Racc: livello 1*, riusa tutto il level-up.
2. **Metodo punteggi** — point-buy / standard array / manuale. → *Racc: offrirli
   tutti e 3, default point-buy.*
3. **Meccaniche uniche: quanto dati-driven** vs codice per classe. → *Racc:
   dati-driven per risorse/bonus numerici; codice minimo solo per le formule
   davvero peculiari (es. Forma Selvatica).*
4. **Wizard su livelli "affollati"** — adottare il modello **C "checklist con
   progresso"** (previsto e messo da parte in 4.7) quando una classe ha più
   scelte nello stesso livello, invece di forzare lo sheet unico.

## Decisioni prese (Fase 5)

- 2026-07-22 — Pianificazione Fase 5 (analisi del codice + scelte di Andrea):
  - **Approccio verticale**: una classe alla volta, portata end-to-end come il
    Paladino, con verifica e commit per classe (scartati "orizzontale — prima
    tutta l'infrastruttura" e "solo dati manuale").
  - **Ampiezza**: tutte le 11 classi mancanti, ma **una alla volta dalle più
    semplici**, in step ben divisi.
  - **Paladino = riferimento** già completo, non una pilota da rifare: fa da
    modello e da test di non-regressione a ogni passo.
  - **Ordine per complessità crescente**: Barbaro → Guerriero → Ladro → Monaco
    → Ranger → Chierico → Druido → Bardo → Stregone → Mago → Warlock (no-caster
    prima, poi half, poi full, poi pact).
  - **Multiclasse** spostata a una **Fase 6** dedicata dopo la Fase 5 (resta
    fuori scope per ora, non più elencata dentro la Fase 5).

- 2026-07-22 — Blocco 5.A, schema risorse/bonus di classe: scelto lo **schema C
  (ibrido)** tra 3 proposte — i numeri che dipendono solo dal livello vivono come
  dati nel manuale (`classResources`), lo scaling da caratteristiche/logica nel
  motore (`CLASS_BONUSES`). Coerente con la Fase 0 (formule in `engine.js`) e
  interamente serializzabile su Firestore.

- 2026-07-22 — Workflow commit: **un commit per ogni step** (in locale), per uno
  storico granulare e più facile da analizzare (git bisect/blame). Il deploy
  (push) resta da chiedere a parte, come da CLAUDE.md.

## Decisioni prese (Fase 4)

- 2026-07-21 — Fase 4 espansa in 9 step su 3 blocchi. Scelte di Andrea prima
  di iniziare:
  - **PF al level up: media fissa** (+6 + mod COS a livello; coerente con come
    è compilato Tharion oggi, nessuna casualità).
  - **Livello: solo incrementabile di +1** col wizard guidato (niente campo di
    impostazione diretta per ora; si potrà aggiungere in seguito).
  - **Sottoclassi: solo Devozione** modellata in questa fase; gli altri
    Giuramenti si aggiungono in seguito come puri dati.

## Decisioni prese (step 3.5)

- 2026-07-21 — UX del modulo "Nuova Reliquia": tra 6 proposte con preview
  (A-C poi D-F dopo che Andrea ha segnalato le sigle poco chiare nella prima
  tornata), scelta la **B pura**: elenco di righe ripetibili (parte vuoto,
  "+ Aggiungi effetto" per ognuna), ogni riga = menu a tendina con
  l'effetto **per esteso** (non sigle) + stepper −/+ per il valore +
  rimozione riga. Gli 8 effetti possibili (unici che il motore sa gestire,
  dalla Fase 0): Colpire con le armi, Danni con le armi, Difficoltà degli
  incantesimi, Colpire con gli incantesimi, Classe Armatura, Tiri Salvezza,
  Iniziativa, Punti Ferita massimi. Icone: pool di 8 SVG in stile coerente
  con quelle già in `sheet.js` (spada, scudo, anello, amuleto, mantello,
  bastone, pozione, tomo). Usi limitati opzionali → diventano una res-card
  vera nella tab Risorse, esattamente come l'attuale "Scudo magico".
  La Lama Vincolante esistente resta com'è (fuori scope, nessuna migrazione).

## Bug risolti

- 2026-07-21 — **Schermata nera all'apertura su rete lenta.** Segnalato da
  Andrea: a volte l'app resta nera, poi dopo un po' appare "Impossibile
  contattare il server", e toccare "Entra" non fa nulla — finché non
  funziona da solo dopo un'attesa. Causa: `js/cloud.js` è un modulo che
  importa Firebase da un CDN esterno (gstatic.com); finché quell'import non
  finisce di scaricarsi, i bottoni del login sono visibili ma SENZA alcun
  gestore agganciato (`bindLoginUi()` non è ancora girato) — su rete lenta
  restano cliccabili nel vuoto per diversi secondi. Il vecchio paracadute
  di 8s in `app.js` mostrava un messaggio fuorviante ("riapri l'app") che
  non risolveva nulla, dato che bastava aspettare.
  **Fix**: nuova classe `body.login-not-ready` (tolta da `cloud.js` solo
  quando i bottoni sono davvero agganciati) che li mostra visibilmente
  disattivati con un messaggio onesto ("Connessione al server…", poi
  "Connessione lenta: il pulsante si attiva appena pronto…" dopo 8s) invece
  di farli sembrare rotti; aggiunto `<link rel="preconnect">` verso
  gstatic.com per velocizzare il caricamento. Verificato in locale
  simulando la rete lenta: stato disattivato reso correttamente, sblocco
  regolare a bind avvenuto, console pulita. Cache busting `?v=56`.
  Committato e deployato (`ae3ef6e`, run Pages verde, live verificato).

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
