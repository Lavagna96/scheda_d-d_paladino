# Roadmap — Da scheda Paladino ad app multi-account

> **Questo file è il registro di avanzamento tra sessioni.**
> Regola di manutenzione: a ogni step completato aggiornare la casella `[ ]` → `[x]`,
> la sezione "Dove siamo" e il "Prossimo passo". Le decisioni prese vanno
> annotate nella sezione "Decisioni" con la data.

---

## Dove siamo

- **Ultimo aggiornamento:** 2026-07-29
- **Stato:** **Fasi 0, 1, 2, 3 e 4 tutte COMPLETE, committate e DEPLOYATE** su
  GitHub Pages. L'intera visione originale (login, dashboard multi-personaggio,
  editing, oggetti magici, level-up guidato per il Paladino) è realizzata e
  funzionante. Login e Face ID collaudati da Andrea su iPhone reale.
  **Fase 5 in corso, Blocco 5.C (le classi una alla volta):** 8 classi su 11
  complete (Barbaro, Guerriero, Ladro, Monaco, Ranger, Chierico, Druido,
  Bardo) — restano **Stregone, Mago, Warlock**.
- **Prossimo passo:** ultimo commit `44007d6` (bump cache `?v=103`) **deployato
  e verificato live** (curl conferma `?v=103` servito). Sessione del
  2026-07-29 fuori sequenza rispetto al Blocco 5.C, tre feature testate da
  Andrea e già in produzione:
  - `77aef7a` — scelte di ascendenza/retaggio per Dragonide, Elfo, Goliath,
    Tiefling e Gnomo nel wizard di creazione (prima erano solo testo, senza
    incidere sulla scheda).
  - `221081a` — background "Personalizzato" nel passo Background (scelta
    libera coerente col PHB p.38) + nuovo passo finale **Identità**
    (allineamento e lingue, mostrati in Tratti).
  - `fd18699` — dashboard: swipe-to-delete in stile iOS sulle card + toggle
    griglia/elenco a righe con preferenza ricordata sul dispositivo.
  Riverificando i "Debiti aperti" il 2026-07-29 sono emerse 2 voci già chiuse
  ma mai marcate (point-buy 27 punti, trucchetti in creazione — vedi sezione
  debiti) e chiuso per davvero l'hardcode `classId === 'paladino'` in
  `renderGains()`/`poolMax` (`engine.js`+`levelup.js`, cache `?v=104`, non
  ancora deployato — committare quando Andrea conferma).
  **Prossimo lavoro da scegliere:** riprendere il Blocco 5.C con **Stregone**
  (9° classe, Punti Stregoneria + Metamagia), oppure i collaudi cloud mai
  confermati sotto.
  Restano in coda due collaudi cloud mai confermati: sync multi-device tra
  due dispositivi con lo stesso account, e la verifica nella console Firebase che
  `manuals/5.5/feats` sia arrivato su Firestore (step 4.4, dopo un deploy — il
  sync fallisce in silenzio se la regola non è deployata).

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
      → **Rifinitura 2026-07-27 (`?v=69`): Conditional UI (autofill passkey).**
      L'auto-scan apriva il foglio modale in mezzo allo schermo appena si
      atterrava sul lucchetto; ora `cloud.js` chiama
      `AppFaceId.watchConditional()`, che non apre nulla e resta in ascolto:
      iOS propone la passkey con Face ID **sopra la tastiera** quando si tocca
      il campo `#lg-unlock` (`autocomplete="username webauthn"`). Il medaglione
      resta la riserva (annulla l'ascolto e fa la `get()` modale) per iOS senza
      autofill. Perché l'autofill veda la passkey serve una credenziale
      *discoverable*: `enable()` ora usa `residentKey: 'required'` e segna
      `app-faceid-discoverable`; **le credenziali create prima vanno
      riattivate** (Account → Disattiva/Attiva), altrimenti resta solo il
      medaglione — è il motivo per cui il campo si mostra solo se
      `canUseConditional()` è vera. Aggiunto anche `app-faceid-uid`: con
      `allowCredentials` vuoto la passkey la sceglie l'utente, quindi si
      controlla che lo `userHandle` sia l'uid giusto. Resta un **lucchetto
      locale, non autenticazione**: la challenge è generata dal client e
      nessuno verifica l'assertion (Firebase Auth non ha WebAuthn nativo; una
      login vera richiederebbe una Cloud Function che emette un custom token).
      Verificato in locale (gating corretto nei 4 casi, layout del campo,
      console pulita). → **Collaudato da Andrea su iPhone il 2026-07-27
      (deploy `62c9b46`): funziona.** La Conditional UI regge anche in PWA
      standalone da home screen, che era il punto incerto.
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
      → **Completato con gli altri 3 giuramenti (2026-07-27), `?v=85`,
      `manual.version` 27→28.** Il Paladino ne ha 4 nel PHB (Devozione, Gloria,
      Antichi, Vendetta); mancavano gli altri tre, e il wizard di level-up
      auto-assegnava la sottoclasse quando ce n'era una sola — con 4 non poteva
      più farlo da solo. Aggiunti ai dati:
      - **Giuramento di Gloria** (p.113-114 PDF): tenets, `spellsByLevel` (Dardo
        di Guida/Eroismo, Potenziare Capacità/Arma Magica, Accelerare/Protezione
        dall'Energia, Costrizione/Libertà di Movimento, Ricordo
        Leggendario/Presenza Regale di Yolande), `features` (Punizione
        Ispiratrice + Atleta Impareggiabile a 3, Aura di Alacrità a 7, Difesa
        Gloriosa a 15, Leggenda Vivente a 20).
      - **Giuramento degli Antichi** (p.114-115): Ira della Natura a 3, Aura
        Arcana a 7 (resistenza Necrotico/Psichico/Radioso), Sentinella
        Immortale a 15, Campione degli Antichi a 20; incantesimi da natura
        (Colpo Intrappolante, Passo Fatato, Raggio Lunare, Tempesta di
        Ghiaccio, Passo dell'Albero…).
      - **Giuramento di Vendetta** (p.115-116): Voto di Inimicizia a 3,
        Vendicatore Instancabile a 7, Anima della Vendetta a 15, Angelo
        Vendicatore a 20; incantesimi da caccia/controllo (Maledizione,
        Tenere Persone, Bandire, Tenere Mostri…).
      **10 incantesimi nuovi nel catalogo** per coprire le tre tabelle (Dardo di
      Guida, Colpo Intrappolante, Potenziare Capacità, Tenere Persone, Passo
      Fatato, Raggio Lunare, Bandire, Ricordo Leggendario, Tenere Mostri, Passo
      dell'Albero), riassunti originali dal PDF, con `classes` = la lista reale
      del PHB (niente 'paladino' aggiunto artificialmente dove il paladino la
      riceve solo dal giuramento — stesso criterio già usato per Devozione).
      **Bug trovato e corretto nello stesso giro**: avevo creato un incantesimo
      duplicato per Libertà di Movimento (`liberta-movimento`, aggiunto da me
      il 2026-07-27 per Devozione) quando ne esisteva già uno (`liberta-di-movimento`,
      precedente, usato da Bardo/Chierico/Druido/Ranger) — e quello preesistente
      aveva pure una clausola di potenziamento ("+1 bersaglio per ogni slot oltre
      il 4°") che non appartiene affatto a questo incantesimo nel PHB 2024 (l'ho
      verificata riga per riga: è un artefatto di estrazione a due colonne, il
      testo apparteneva a un incantesimo diverso). Rimosso il duplicato, tolta
      la clausola sbagliata, aggiornato il riferimento del giuramento di
      Devozione sull'id corretto.
      **Level-up: la sezione Sottoclasse ora sceglie davvero.** `buildSubclassAutoRow`
      → `buildSubclassSection` in `levelup.js`: con 1 sola sottoclasse resta
      l'assegnazione automatica di sempre (riga di sola lettura); con più di 1
      mostra una card per giuramento (nome + precetti, stesso pattern a righe
      cliccabili di `buildFeatSection`) e blocca "Conferma" finché non se ne
      sceglie una. Verificato: un paladino di livello 2 che sale a 3 vede le
      4 card con i precetti, "Conferma" disabilitato finché non clicchi,
      scegliendo Gloria diventa `subclassId: 'gloria'` e la scheda mostra da
      subito Punizione Ispiratrice/Atleta Impareggiabile nei Tratti e Dardo di
      Guida/Eroismo come fissi nel grimorio; Tharion (livello 7, già Devozione)
      non vede affatto la sezione Sottoclasse salendo a 8 (si chiede solo al
      3°) ed è rimasto identico in tutto — CA 20, CD 15, PF 60, Imposizione 35,
      stesso grimorio. Console pulita in ogni prova.
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

- [x] 5.B.1 UX del flusso a passi — DECISA (2026-07-23): tra 3 proposte con
      preview (artifact:
      https://claude.ai/code/artifact/2fb67a1c-9854-4156-a085-db93ed537e49),
      scelta la **A — Mago a schermo intero** (un passo per schermata, barra di
      avanzamento, Avanti/Indietro). Livello di partenza **1 fisso**; punteggi
      con **tutti e tre i metodi** (point-buy default, array standard, manuale).
      Flusso: specie → classe → punteggi → competenze → equipaggiamento →
      sottoclasse/incantesimi se dovuti.
- [x] 5.B.2 Genera un `character` valido e **vuoto** (nessun residuo Tharion) →
      nuovo documento Firestore → compare in dashboard. FATTO (2026-07-24, vedi
      *Avanzamento 5.B → b3*); **collaudato da Andrea il 2026-07-27**: paladino
      "Prova" creato da iPhone, documento presente su Firestore, card in
      dashboard. Stato esportato verificato campo per campo contro il PHB
      (TS SAG+CAR, 2 abilità dalla lista, PF 11 = D10+COS, Imposizione 5,
      2 incantesimi di 1° e nessun trucchetto, carico 225 = FOR×15).
- [x] 5.B.3 Ripulire i globali di Tharion — FATTO (2026-07-27, *b4*). Più ampio
      di com'era scritto: la causa dei residui non era solo `config.js` ma il
      **merge conservativo** di `storage.js`.
- [x] 5.B.4 Passo **Background** nel wizard — FATTO (2026-07-27, manuale
      `version: 24`, `?v=79`). Scelta l'**alternativa A** fra 3 con preview: il
      background sta *prima* dei Punteggi, come nel manuale, così i suoi
      aumenti si vedono mentre si distribuiscono i punti. Il wizard passa a
      **7 passi**.
      Nei dati: i **16 background** del PHB (pag. 177-184 del PDF) con le tre
      caratteristiche, il talento d'origine, le 2 competenze, lo strumento
      (fisso o da scegliere) e l'equipaggiamento A/B; i **10 talenti d'origine**
      con riassunti originali in italiano.
      Nel wizard: schermata Background con le 16 scelte, il dettaglio di cosa
      dà, la distribuzione **+2/+1 oppure +1/+1/+1** (un punteggio non può
      prendere entrambi) e il campo per lo strumento quando è a scelta. Il
      passo Punteggi mostra in cima un riepilogo che **si aggiorna a ogni
      modifica** (base + bonus = totale). Il passo Competenze toglie dalla
      lista di classe le due già date dal background, come vuole il PHB. Il
      passo Equipaggiamento ha ora **due pacchetti**, quello di classe e quello
      del background, e le monete si sommano.
      Nel personaggio generato: punteggi finali coi bonus applicati,
      `backgroundId`/`backgroundName`, `profTools` (campo nuovo), il talento
      d'origine in `feats` con `source: 'background'`, competenze di classe +
      background, inventario e monete dei due pacchetti.
      **Chiuso anche il debito del point-buy**: i 27 punti ora vanno spesi
      tutti, prima bastava non sforare.
      Verificato in locale (Paladino Dragonide Accolito, array standard): SAG
      10+1=11 e CAR 8+2=10 nel riepilogo aggiornato dal vivo, 4 competenze
      (Atletica e Intimidire scelte + Intuizione e Religione dal background,
      sparite dalla lista), strumenti da calligrafo, talento Iniziato alla
      Magia, 17 MO (9 dalla classe + 8 dal background), PF 11, sacca coi due
      pacchetti; Tharion invariato (CA 20, CD 15, PF 60, nessun background);
      console pulita.
      → **Iniziato alla Magia completo (2026-07-27, manuale `version: 25`,
      `?v=81`):** era l'unico talento d'origine che chiede altre scelte, e il
      wizard lo salvava senza farle fare. Ora i tre background che lo danno
      (Accolito → Chierico, Guida → Druido, Studioso → Mago) hanno `featList`
      nei dati, e il passo Background mostra i selettori per **2 trucchetti e 1
      incantesimo di 1° livello** da quella lista; senza, non si va avanti.
      I trucchetti finiscono in `grimoire.cantrips`, l'incantesimo nel nuovo
      `grimoire.always` (sempre pronto per via di un talento, non conta fra i
      preparabili) — il grimorio legge entrambi e li mostra come FISSI.
      Il passo finale **toglie dalle scelte** quello che il talento ha già dato
      (con una riga che lo dice), e il grimorio non ripete un incantesimo già
      fisso fra i preparati: prendendo Comando dal talento non compare due
      volte.
      **Doppioni nella sacca fusi** (richiesta di Andrea): se classe e
      background danno la stessa identica cosa — il simbolo sacro del Paladino
      Accolito — resta una voce sola.
      Verificato in locale: Accolito con Fiamma Sacra, Luce e Comando dal
      talento → grimorio con 2 trucchetti FISSI e Comando FISSO al 1° livello
      accanto ai 2 preparati scelti, Comando sparito dalle scelte del passo
      finale, sacca a 7 voci invece di 8; Tharion invariato (CA 20, CD 15, PF
      60, grimorio con gli stessi fissi e preparati); console pulita.
- [x] 5.B.5 Equipaggiamento dai **pacchetti del manuale** + catalogo armi
      (decisione 2026-07-27, alternativa B di 3 con preview). Oggi arma, dado,
      tipo e maestria sono campi di testo liberi e le armature solo nomi: si
      passa alla scelta A/B del PHB (Paladino: cotta di maglia, scudo, spada
      lunga, 6 giavellotti, simbolo sacro, kit del sacerdote, 9 MO — oppure
      150 MO; Barbaro: ascia bipenne, 4 asce da lancio, kit dell'esploratore,
      15 MO — oppure 75 MO), tabella armi del PHB nei dati (nome, dado, tipo,
      proprietà, **maestria**, peso, costo) e CA mostrata accanto a ogni
      armatura. La personalizzazione (master che concede di più) si fa dopo,
      nella scheda, con lo stesso catalogo. **Nomi delle maestrie in inglese**
      come già oggi (`mastery: 'Vex'`): il PDF è in inglese e non c'è una fonte
      italiana ufficiale. L'acquisto a budget con l'opzione B (negozio coi
      prezzi del cap. 6) resta un punto separato, più avanti.
      → **Dati FATTI (2026-07-27), manuale `version: 21`:** `weapons` (38 armi,
      dalla tabella di pag. 214 del PDF: id, nome, categoria semplice/da guerra
      × mischia/distanza, dado, tipo di danno, proprietà, maestria, peso,
      costo in MO), `weaponMasteries` (le 8 proprietà con riassunto originale in
      italiano, nomi in inglese) e `armors` (12 armature di pag. 218 con CA,
      tetto DES, requisito di Forza, furtività, peso, costo) + `shield`.
      `engine.js` non ha più la sua tabellina di 4 armature: legge dai dati e
      espone `armorLabel(id)` → "Cotta di Maglia — CA 16", "Cuoio Borchiato —
      CA 12 + DES". Verificato: Tharion invariato (CA 20 Piastre + Scudo, CD
      15), console pulita. **I nomi italiani delle armi sono una traduzione
      mia** (il PDF è in inglese): da rivedere con Andrea se al tavolo usa
      termini diversi.
      → **Wizard FATTO (2026-07-27), `?v=74`.** Il passo Equipaggiamento non ha
      più select e campi liberi: due card coi pacchetti del manuale, contenuto
      in chiaro (armatura con la sua CA, scudo +2, arma col dado, le scorte, le
      monete) e sotto il selettore della **Maestria nelle armi** — chip
      "Spada lunga · Sap" fra tutte le armi in cui la classe è competente
      (`weaponProf`), con il conteggio giusto da `weaponMastery[1]` = 2 per
      Paladino e Barbaro. `stepValid` ora chiede pacchetto scelto + maestrie
      complete. Nei dati sono entrati `startingEquipment` (A/B), `weaponProf` e
      `weaponMastery` del Paladino (fisso a 2: la sua tabella dei privilegi non
      ha la colonna Maestria). `buildStateFromDraft` prende arma, dado e tipo di
      danno dal catalogo, mette **le monete del pacchetto** (9 MO o 150 MO per
      il Paladino) e **le scorte nella sacca** col peso vero, e salva in
      `character.weaponMasteries` le armi di cui il PG sa usare la maestria.
      Verificato in locale: Paladino pacchetto A → cotta di maglia + scudo,
      spada lunga 1d8 tagl. con maestria Sap, 6 giavellotti da 2 lb nella sacca,
      9 MO; Barbaro pacchetto B → nessuna arma né armatura, 75 MO, sacca vuota,
      maestrie comunque salvate; cambio di classe che rifà le card e azzera le
      maestrie non più valide; Tharion invariato (CA 20, CD 15, PF 60, "Maestria:
      Vex"); console pulita.
      → **Editor della scheda FATTO (2026-07-27), `?v=75`.** `edit-sheet.js` non
      ha più la lista di 4 armature né i campi liberi per l'arma: armatura da un
      menu con tutte e 12 le voci del manuale e la CA accanto ("Piastre — CA
      18"), scudo che dice "CA +2", arma dal catalogo (dado, tipo di danno e
      maestria arrivano da soli, con una riga di riepilogo che mostra anche le
      proprietà). Resta l'opzione **"Personalizzata…"**, che riapre i campi
      liberi: è l'unico modo per le armi fuori catalogo — la Spada lunga ✦
      (magica) di Tharion si riapre proprio così, coi suoi valori intatti.
      Verificato in locale il giro completo: catalogo → Ascia bipenne salva
      1d12 tagl. Cleave e la scheda mostra "Maestria: Cleave"; cambio armatura →
      CA ricalcolata (Cuoio Borchiato + Scudo = 13 con DES −1); riaprendo
      l'editor l'arma è già selezionata; ritorno a "Personalizzata…" → Tharion
      di nuovo CA 20 / CD 15 con la sua spada magica. Console pulita.
      **Con questo 5.B.5 è chiuso.**

- [ ] **Restyling visivo del wizard di creazione** — avviato 2026-07-29, fuori
      sequenza rispetto al Blocco 5.C (una richiesta di Andrea prima di
      riprendere le classi): passo dopo passo, verifica se lo step attuale ha
      qualcosa da migliorare e, in caso, 3 alternative con preview prima di
      implementare (regola CLAUDE.md). Introdotto `buildPickRow()` in
      `create.js` — riga generica con blasone SVG + tratto distintivo reale
      da teaser, sostituisce il vecchio `buildTile`/`.create-tile` (rimossi,
      inutilizzati altrove). Fatti finora:
      - **Specie** — alternativa **B** (lista arricchita) tra 3 con preview:
        blasone per specie + un tratto meccanico reale (es. Elfo → "Trance —
        mediti invece di dormire"), preso da `window.MANUAL_55.species`.
        `?v=105`.
      - **Classe** — alternativa **A** ("coerente con la Specie") tra 3 con
        preview: stessa grammatica visiva, blasone + tratto (es. Barbaro →
        "Furia — resistenza ai danni fisici") più due chip Dado Vita/tipo di
        incantatore. Nessun segnale per le 3 classi non ancora modellate
        1→20 (Stregone/Mago/Warlock) — l'opzione B lo proponeva, scartata.
        `?v=106`.
      - **Background** — alternativa **B** ("righe con anteprima + accordion")
        tra 3 con preview: qui il "tratto singolo" di Specie/Classe non basta
        (un background dà 4 cose diverse: competenze, strumento, talento,
        aumenti), quindi niente blasoni nuovi — ogni riga mostra già le 2
        competenze e il talento in anteprima (es. Accolito → "Intuizione,
        Religione · Iniziato alla Magia") senza dover toccare nulla; il tocco
        apre solo il dettaglio della riga scelta (nuovo contenitore
        `.bg-row-body`), non un lungo pannello comune a tutte. Tutta la
        logica interna invariata (spell picker Iniziato alla Magia, aumenti
        di caratteristica, accordion del Personalizzato): cambia solo dove il
        loro contenitore viene appeso. Verificato: Accolito → trucchetto
        scelto sopravvive al refresh parziale, Soldato → strumento a scelta +
        aumenti FOR+2/COS+1 propagati al recap di Punteggi, Personalizzato →
        accordion intatto (Caratteristiche si apre di default), console
        pulita in ogni prova. `?v=107`.
      - **Punteggi** — alternativa **C** ("riepilogo fisso, righe invariate")
        tra 3 con preview: le 6 righe caratteristica (stepper/select, per
        tutti e 3 i metodi) restano identiche, si aggiunge solo una striscia
        sopra il selettore di metodo — "Attacca con Forza, Carisma · TS:
        Saggezza, Carisma" per il Paladino — con lo stesso dato reale delle
        altre due opzioni scartate (A: tag inline; B: card col modificatore
        in grande), preso da `klass.primaryAbility` (stringa libera, si cerca
        ogni codice a 3 lettere al suo interno: "FOR o DES" → entrambe) e
        `klass.saves` (già un array). Nuovo `.punteggi-recap` in create.css.
        Verificato: Paladino → riga corretta, Guerriero/Mago/Ladro/Monaco →
        parsing corretto anche coi primaryAbility multipli ("DES e SAG" →
        entrambe), stepper Point-buy invariato (contatore 0→1 dopo un
        click), console pulita. `?v=108`.
      - **Competenze** — alternativa **B** ("raggruppate per caratteristica")
        tra 3 con preview: Tiri Salvezza e competenze dal background
        diventano badge di sola lettura (coerenti con le chip, non più testo
        piatto); le competenze rimanenti si dividono in mini-gruppi per
        caratteristica governante (dato reale `skill.abil`, nessuna
        competenza inventata). Poco visibile col Paladino (2-3 gruppi
        minuscoli), ma decisivo col Bardo (le 18 competenze del gioco,
        nessuna lista ristretta) — verificato **entrambi i casi** nella
        preview prima di scegliere. Nuove `.competenze-ro-label/-row/-badge`
        e `.competenze-group/-head` in create.css; `chipEls` resta piatto
        (una sola mappa id→chip attraverso tutti i gruppi), cap/disabilitazione
        cross-gruppo invariati. Verificato: Paladino 2/2 con Religione+Medicina
        disabilita le altre 2 nei rispettivi gruppi; passaggio a Bardo (18
        competenze su 6 gruppi, Atletica/Intimidire dal background escluse)
        conserva le selezioni ancora valide (2/3), console pulita in ogni
        prova. `?v=109`.
      Restano da valutare uno alla volta: Equipaggiamento,
      Sottoclasse/Incantesimi, Identità.

> *Avanzamento 5.B:* **b1 (shell vista + navigazione) FATTO (2026-07-23).** Nuovi
> `js/create.js` (`window.AppCreate`, macchina a stati dei 6 passi, corpi
> segnaposto) e `css/components/create.css` (vista `#view-create` pilotata da
> `body.in-create`, come la dashboard); slot "Nuovo personaggio" della dashboard
> ora cliccabile; `init` agganciato in `app.js`. Cache `?v=66→67`. Implementato
> dal subagente `implementatore` (bloccatosi in fase di verifica per un timeout
> del browser); revisione + controprova completate in sessione: navigazione/
> barra/Indietro/Annulla OK, ultimo passo "Crea personaggio" disabilitato
> (generazione = b3), console pulita, Tharion e viste esistenti invariati.
>
> **b2.1 FATTO (2026-07-23):** passi **Specie** (campo nome + 10 specie del
> manuale) e **Classe** (12 classi) con stato `draft` condiviso e validazione di
> "Avanti" (Specie richiede nome + specie; Classe richiede la classe). Tile
> selezionabili (`<button>`), selezione e nome persistono tornando indietro; i
> passi ancora segnaposto restano tali (`.has-fields` tolta, nessun artefatto).
> `js/create.js` + `css/components/create.css`; nessun cache bump (resta `?v=67`).
> Implementato dal subagente (sola verifica statica); controprova nel browser
> fatta in sessione (flusso, validazione, persistenza, console pulita, Tharion
> invariato).
>
> **b2.2 FATTO (2026-07-23):** passo **Punteggi** coi 3 metodi — Point-buy (27
> punti, costi PHB 2024 p.37), Array standard (assegnazione dei 6 valori senza
> doppioni), Manuale (libero 3–20) — con pulsante "Consigliati per la classe"
> (array consigliati p.37), modificatori live e validazione di "Avanti" per
> metodo. Riusa stepper/select di `edit-sheet`. Verificato nel browser (costi e
> tetto 15, de-dup array, switch metodo, Tharion invariato, console pulita);
> nessun cache bump (`?v=67`).
>
> **b2.3 FATTO (2026-07-23):** passo **Competenze** — TS fissi della classe in
> sola lettura + scelta di N competenze di abilità (Barbaro/Paladino coi dati
> PHB verificati p.50/p.108; fallback "2 tra 18" per le altre classi), cap a N,
> validazione di "Avanti", auto-correzione al cambio classe. Costante
> `CLASS_SKILLS` in `create.js`, nessun tocco al manuale, `?v=67`. Verificato nel
> browser.
>
> **b2.4 FATTO (2026-07-24):** passo **Equipaggiamento** — armatura (5 opzioni),
> scudo (toggle) e arma (nome/dado/tipo/maestria), con **default sensati per
> classe** dall'equip. iniziale del PHB 2024 opzione A (Barbaro p.49 → Ascia
> bipenne 1d12, nessuna armatura perché usa la Difesa senza armatura; Paladino
> p.107 → Cotta di Maglia + Scudo + Spada lunga 1d8), tutti modificabili; kit
> neutro per le classi non ancora modellate. **Niente stile di combattimento**
> (non è una scelta di livello 1: il Paladino l'ha al livello 2, il Barbaro mai
> → arriva col level-up), quindi in creazione `fightingStyle` resta 'nessuno'.
> Auto-reset ai default al cambio classe, ma conservazione delle modifiche
> manuali a classe invariata. `CLASS_EQUIP`/`defaultEquipFor` in `create.js`,
> `.create-field` in `create.css`, nessun tocco al manuale.
> **Bug preesistente trovato e corretto** (introdotto nel commento del b2.2): la
> stringa `.edit-stat-*` seguita da `/.edit-stepper` conteneva un `*/` che
> chiudeva in anticipo il commento in testa a `create.css`, facendo scartare al
> parser CSS l'intera regola `.create-view` → il wizard rendeva come riga
> orizzontale invece che a schermo intero (mai deployato: il create è tutto
> locale). Corretto il commento (bilancio `/* */` ora 12/12), `.create-view` ora
> applica `flex-direction: column`. Verificato nel browser: default per
> Paladino/Barbaro/Mago, persistenza a classe invariata, reset al cambio classe,
> layout a schermo pieno, console pulita, Tharion invariato (CA 20, CD 15,
> stato reale non toccato dal wizard). `?v=67`.
>
> **b2.5 FATTO (2026-07-24):** passo finale **Sottoclasse e Incantesimi**. A
> livello 1 **nessuna classe sceglie la sottoclasse** (tutte al livello 3, dato
> `choicePoints.subclass:3`) → solo nota informativa, niente selettore. Per i
> **caster**, selettore incantesimi a chip (stesso pattern delle competenze:
> cap al numero dovuto, contatore, auto-scarto al cambio classe) alimentato dal
> **catalogo del manuale** (`MANUAL_55.spells`, filtrato per `classes` e
> `level`, ordinato per nome): il **Paladino** sceglie **2 incantesimi di 1°
> livello** tra i 16 della sua lista, **senza cantrip** (coerente col 2024). I
> **non-caster** (Barbaro) vedono la nota "nessun incantesimo al livello 1".
> Generico via `casterType` + `cantripsByLevel`/`preparedByLevel` (pronto per i
> full caster futuri, che avranno anche i cantrip). Le scelte vivono in
> `draft.cantrips`/`draft.preparedSpells` (le userà il b3); `finaleValid()`
> (esattamente N, come le competenze) è pronta a sbloccare "Crea personaggio"
> nel b3. Solo `create.js`, nessun nuovo CSS (riusa i chip), nessun tocco al
> manuale, `?v=67`. Verificato nel browser (Paladino 2/16 con cap e contatore,
> Barbaro senza selettore, azzeramento al cambio classe, layout a schermo pieno,
> console pulita, Tharion invariato CA 20/CD 15 e grimorio intatto).
> **Con b2.5 tutto il contenuto dei 6 passi del wizard è completo.**
>
> **b3 FATTO (2026-07-24):** generazione vera del personaggio (5.B.2). "Crea
> personaggio" (ultimo passo, ora abilitato quando gli incantesimi sono completi
> via `finaleValid()`) costruisce uno stato pulito dal draft
> (`buildStateFromDraft` in `create.js`): `character` coi fatti base (nome,
> classe, livello 1, specie, punteggi, TS fissi di classe, competenze,
> armatura/scudo/arma, sottoclasse assente, stile 'nessuno'), pool correnti al
> massimo di livello 1 dal motore (PF pieni, Imposizione piena per il Paladino,
> nessun destriero), 0 monete e inventario/diario vuoti (partenza minimale,
> decisione 5.B), grimorio con gli incantesimi scelti. **Nessun residuo di
> Tharion.** Id = slug del nome (accenti/simboli normalizzati) + suffisso casuale
> anti-collisione (es. `auriel-di-citta-9ien`). Nuovo metodo
> `AppCloud.createCharacter(id, state)` (`cloud.js`): salva in locale
> (`char-<id>-state`), scrive il doc `users/{uid}/characters/{id}` e ricarica la
> dashboard; **non cambia il personaggio attivo** (nel nuovo si entra dalla
> dashboard, come per gli altri). Verificato in locale (con mock del metodo
> cloud): stato completo e corretto per Paladino (2 incantesimi, PF 11 /
> Imposizione 5) e Barbaro (senz'armatura, PF 14, grimorio vuoto, Crea abilitato
> subito), card dashboard resa ("Classe · Specie", Lv. 1, emblema), gating del
> bottone, console pulita, Tharion invariato (CA 20 / CD 15, stato non toccato).
> **Da collaudare da loggati** (non testabile in locale senza login): la
> scrittura Firestore reale e la comparsa della card dopo "Crea" — il codice
> ricalca il sync esistente (`pushNow`/`loadDashboard`). **Collaudato da Andrea
> il 2026-07-27: documento presente su Firestore e card in dashboard.**
>
> **b4 FATTO (2026-07-27):** la scheda di un personaggio nuovo si apre pulita
> (5.B.3). Il JSON del paladino "Prova" ha mostrato che i residui non venivano
> dal wizard ma da **due punti di render/merge** che davano per scontato
> Tharion:
> - **`storage.js`** — `mergeCharacter` fondeva ogni stato salvato su
>   `cfg.DEFAULT_STATE.character`, cioè la scheda di Tharion: ogni chiave non
>   dichiarata veniva ereditata (a "Prova" erano arrivati `steedSlotLevel: 2` e
>   `initiativeNote: 'vant. iniziativa'`). Ora c'è uno **scheletro neutro**
>   (`BASE_CHARACTER`/`BASE_STATE`): la scheda storica si fonde sui suoi
>   default, chiunque altro sul neutro (`defaultsFor(id)`). Corretto anche il
>   fallback di `loadState` quando manca lo stato locale, che restituiva
>   Tharion in blocco.
> - **destriero fantasma** — `engine.js` calcolava `steedhp = 5 + 10 × (…|| 2)`
>   per chiunque e `sheet.js` disegnava la card senza condizioni: un paladino di
>   1° livello aveva una barra "Destriero 0/25". Ora il motore espone
>   `hasSteed` (dalla risorsa `steedfree`, cioè Destriero Fedele dal 5°), i PF
>   sono 0 senza destriero e `app.js` toglie la tab Cavalcatura dalla barra e
>   dallo swipe (`availableViews`).
> - **grimorio** — `cfg.SPELLS` (gli 8 incantesimi fissi di Tharion, mostrati a
>   chiunque) sostituito dai dati: nuove tabelle `spellsByLevel` sulla classe
>   (Punizione Divina dal 2°, Trova Destriero dal 5°) e sulla sottoclasse
>   (giuramento di Devozione: 3°/5°/9°/13°/17°, formato `{id, name}` con
>   `id: null` per gli incantesimi non ancora nel catalogo), più i trucchetti
>   del personaggio in `grimoire.cantrips` — che finalmente vengono letti.
>   Manuale a `version: 20`.
> - **maestria e ritratto** — `Maestria: Vex` era scritta fissa nell'HTML e
>   `avatar.jpg` era hardcoded: ogni personaggio nuovo si apriva con l'arma e
>   la faccia di Tharion. Ora la maestria viene da `weapon.mastery` (e sparisce
>   se vuota) e i ritratti stanno in `character.portrait`/`portraitFull`, nei
>   default di Tharion; chi non ne ha mostra l'emblema ✦.
> - via da `config.js` le costanti morte `SWORD_TIERS` e `FEATURES` (nessun
>   consumatore) e `STEED` (conteneva solo un nome di default).
>
> Verificato in locale: **Tharion invariato** (CA 20, CD 15, att.inc +7, PF 60,
> Imposizione 35, destriero 25, tutte e 5 le tab, ritratto e "Maestria: Vex" al
> loro posto, grimorio con gli stessi 8 fissi divisi per livello — trucchetti
> Luce/Dardo di Fuoco compresi); paladino di 1° livello **pulito** (nessun campo
> residuo, `hasSteed` false, niente tab Cavalcatura, emblema ✦, niente maestria,
> monete e inventario a zero, CA 18 = cotta di maglia + scudo); console pulita.
> Cache busting `?v=71`. *Prossimo:* **5.B.5** (equipaggiamento dai pacchetti
> del manuale + catalogo armi con le maestrie).

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

1. [x] **Barbaro** (no caster) — Furia, Difesa Senz'Armatura. Porta con sé il Blocco 5.A.
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
   `version` 18→19. *step c3 FATTO (2026-07-22):* sezione attacchi generica
   (`stats.js`) — riga Soffio solo per Dragonidi, "Attacco Extra" dai
   `choicePoints`, nota costruita dai dati reali (bonus arma/stile/Arma Sacra);
   unica deviazione dichiarata su Tharion: la 1ª frase della nota ("spada +1" →
   "bonus magici dell'arma (+1)"). *step c4 FATTO (2026-07-22):* wizard di level-up generico
   (`levelup.js`) — i guadagni delle risorse di classe (Furia 2→3…) compaiono
   dai dati (`classResources`); Tharion 7→8 invariato (PF/Imposizione/Dadi/ASI).
   Cache bump `?v=65→66`. **Barbaro completo a livello scheda e level-up**; per
   crearne uno serve solo il blocco condiviso **5.B (creazione da zero)**.
   → **Chiuso davvero (2026-07-27, `?v=84`)**: con 5.B ormai completo (background,
   equipaggiamento, maestrie), ho riverificato il Barbaro allo stesso standard
   con cui avevo appena controllato il Paladino:
   - **Tabelle numeriche esatte contro il PHB** (pag. 51): `rages` (Furie),
     `rageDamage` e `weaponMastery` per tutti i 20 livelli tornano cifra per
     cifra con la tabella Barbarian Features.
   - **Testo dei 20 livelli di privilegi verificato a campione** contro il PDF,
     compresi i dettagli fini (Furia Persistente termina solo se **Privi di
     Sensi**, non semplicemente Incapacitati — distinzione che il manuale fa
     e i dati rispettano; Colpo Brutale Migliorato: dadi e doppio effetto
     corretti a 13/17).
   - **Un buco vero trovato e chiuso**: il bonus Danno da Furia (tabella
     `rageDamage`) non compariva **da nessuna parte** nella scheda — un
     giocatore doveva ricordarselo a memoria, a differenza del Paladino che ha
     la nota dell'Arma Sacra sotto gli Attacchi. Aggiunta la stessa nota
     generica in `buildAttackNote` (`stats.js`): "In Furia: +N danni con
     attacchi basati sulla Forza", letta da `klass.rageDamage[livello]` — non
     hardcoded su `classId==='barbaro'`, quindi vale per qualunque classe futura
     con la stessa tabella. Verificato: +2 al 1° livello, +3 al 9°; Tharion
     (Paladino, nessun `rageDamage`) non mostra la riga, le altre note (bonus
     arma, Stile Duellante, Arma Sacra) restano intatte.
   - **Giro completo del wizard rifatto da zero** con un Barbaro Soldato
     (Goliath), background con strumento a scelta (Set da gioco): confermato
     che `bgValid()` blocca davvero "Avanti" finché il campo "Quale Set da
     gioco?" non è compilato — nessuna correzione necessaria, verifica riuscita.
     Generato:
     punteggi con bonus applicati (FOR 15+2=17, COS 13+1=14), 4 competenze senza
     doppioni, talento Attaccante Selvaggio (corretto per il background
     Soldato), ascia bipenne con maestria Cleave, seconda maestria (Lancia),
     pacchetto di classe + pacchetto del background sommati nella sacca (9
     voci, pesi tutti valorizzati), 29 MO, PF 14. Console pulita.
   - **Gap poi chiuso lo stesso giorno**: il Barbaro ha nel PHB 4 Cammini
     (Berserker, Cuore Selvaggio, Albero del Mondo, Zelota), ne era modellato
     solo uno. → **Completati anche gli altri 3 (2026-07-27), `?v=87`, manuale
     `version` 28→29**, stesso trattamento appena dato ai 4 giuramenti del
     Paladino — il nuovo `buildSubclassSection` di `levelup.js` non ha
     richiesto NESSUNA modifica: gli bastava trovare più di una voce in
     `subclasses` per smettere di auto-assegnare e mostrare il picker vero.
     Aggiunti ai dati (PHB p.54-56 del PDF): **Cuore Selvaggio** (Chi Parla
     agli Animali + Furia della Natura Selvaggia a 3, Aspetto della Natura
     Selvaggia a 6, Chi Parla alla Natura a 10, Potere della Natura Selvaggia
     a 14 — i tre rituali di lancio restano in prosa, il Barbaro non è
     incantatore e non serve agganciarli al grimorio), **Albero del Mondo**
     (Vitalità dell'Albero a 3, Rami dell'Albero a 6, Radici Percotenti a 10,
     Viaggiare lungo l'Albero a 14), **Zelota** (Furia Divina + Guerriero
     degli Dèi a 3, Concentrazione Fanatica a 6, Presenza Zelante a 10, Furia
     degli Dèi a 14). Aggiunta anche una riga di richiamo tematico a tutti e
     4 i Cammini (compreso il Berserker, che non l'aveva) per coerenza nel
     picker, riusando lo stesso campo `tenets` del Paladino anche se qui non
     sono precetti in senso proprio.
     **Bug di test, non di prodotto**: durante la verifica il pannello di
     level-up non si apriva per il Barbaro iniettato via localStorage — non
     era un bug nel codice ma una corsa fra il mio script di test e
     `AppLevelUp.init()` (il bottone non aveva ancora il listener agganciato
     quando lo clickavo). Confermato chiamando `init()` di nuovo a mano prima
     del click; verificato che il codice reale, in un caricamento normale
     dell'app, non ha questo problema (Tharion apre il pannello al primo
     click, senza reinizializzazioni). Verificato: un Barbaro di livello 2 che
     sale a 3 vede le 4 card (Berserker/Cuore Selvaggio/Albero del
     Mondo/Zelota) coi richiami tematici, sceglie Zelota e la scheda mostra
     subito Furia Divina e Guerriero degli Dèi nei Tratti; Tharion (Paladino)
     non è minimamente toccato da un cambiamento pensato per un'altra classe.
     Console pulita in ogni prova.
2. [x] **Guerriero** (no caster) — stili extra, ASI a 6/14, attacchi extra multipli, Azione Impetuosa, Recuperare Energie.
   → **Fatto (2026-07-27, `?v=88`, manuale `version` 29→30)**: privilegi 1→20 dal
   PDF (p.90-91), sottoclasse **Campione** (p.93, la più semplice delle 4 —
   Maestro di Battaglia, Cavaliere Occulto e Combattente Psionico restano da
   fare, stesso trattamento già dato a Paladino/Barbaro), equipaggiamento
   iniziale (3 opzioni A/B/C — la spada d'ordinanza è lo Spadone, con
   Flagello aggiunto al catalogo armi perché mancava), competenze di classe
   in `CLASS_SKILLS` (create.js).
   - **Attacchi extra generalizzati**: il Guerriero arriva a 4 colpi (2 extra
     attacchi a 11°, 3 a 20°), non 2 come Paladino/Barbaro — la vecchia soglia
     singola `choicePoints.extraAttack` non bastava più. Sostituita con una
     tabella `extraAttacks[livello]` per classe (colpi oltre al primo), letta
     da `stats.js` per calcolare "Attacco Extra: N colpi"; Paladino e Barbaro
     migrati alla stessa tabella (restano fermi a 1, cioè 2 colpi totali).
   - **Riposo breve generalizzato**: `shortRest()` in `sheet.js` era hardcoded
     solo su Channel Divinity (`state.spent.cd -= 1`). Il Guerriero ha DUE
     risorse che si ricaricano al riposo breve (Recuperare Energie, Azione
     Impetuosa) — generalizzato a "recupera 1 uso di ogni risorsa con
     `resetOn:'short'`", aggiunto lo stesso flag alla card di Channel Divinity
     (prima non ce l'aveva, funzionava solo per l'hardcode). Verificato: CD
     2/2 → spendi 1 → riposo breve → torna 2/2 (invariato); Guerriero con
     Recuperare Energie e Azione Impetuosa entrambe spese → riposo breve →
     tornano su di 1 ciascuna; Indomabile (riposo lungo) resta intoccato dal
     riposo breve; riposo lungo azzera tutto come prima.
   - **Bug di creazione trovato e chiuso**: il wizard mostrava solo le opzioni
     A/B dell'equipaggiamento di classe (`['a', 'b'].forEach(...)` hardcoded
     in `create.js`) — invisibile finché tutte le classi modellate ne avevano
     solo 2, ma il Guerriero ne ha 3 (C = 155 mo, nessun oggetto). Generalizzato
     a `Object.keys(packs)`, verificato che la card C ora compare.
   - **Bug di creazione più serio, trovato e chiuso**: lo Stile di
     Combattimento del Guerriero si sceglie al **1° livello** (Paladino lo
     sceglie al 2°), ma il wizard di creazione non aveva NESSUN passo per
     sceglierlo — scriveva sempre `fightingStyle: 'nessuno'`, e il level-up
     lo richiede solo quando `choicePoints.fightingStyle === livello`
     raggiunto salendo, cosa che non succede mai per il livello 1 (è il
     livello di partenza, non di arrivo di un level-up). Un Guerriero appena
     creato restava quindi permanentemente senza stile finché non lo si
     correggeva a mano dalla scheda. Aggiunto un picker (stessi 2 stili con
     bonus meccanico di `levelup.js`: Duello, Difesa) nel passo finale del
     wizard, mostrato solo quando `choicePoints.fightingStyle === CREATE_LEVEL
     (1)` — quindi non tocca Paladino/Barbaro. Verificato: passo bloccato
     finché non si sceglie, personaggio creato con `fightingStyle: 'difesa'`.
   - **Verifica end-to-end**: Guerriero di prova iniettato a livello 11
     (Campione) — privilegi di classe e sottoclasse tutti presenti in Tratti
     nell'ordine giusto, Recuperare Energie 4/4, Azione Impetuosa 1/1,
     Indomabile 1/1 nelle sezioni giuste, "Attacco Extra: 3 colpi" corretto.
     Giro completo del wizard da zero (Umano, Guerriero, Soldato con Set da
     gioco, punteggi consigliati FOR 17/COS 14 col bonus del background,
     competenze Acrobazia+Percezione senza doppioni col background, pacchetto
     A, 3 maestrie, Stile Difesa): personaggio salvato con tutti i campi
     corretti. Tharion (Paladino) verificato invariato dopo ogni modifica
     (CA 20, PF 60, Attacco Extra 2 colpi, Channel Divinity ancora 2/2 dopo
     riposo breve). Console pulita in ogni prova.
3. [x] **Ladro** (no caster) — Attacco Furtivo, Competenza (doppio PB), Elusione.
   → **Fatto (2026-07-28, `?v=89`, manuale `version` 30→31)**: privilegi 1→20
   dal PDF (p.128-130), sottoclasse **Ladro Esperto** (p.136, la più semplice
   delle 4 — Assassino, Spadanima e Truffatore Arcano restano da fare),
   equipaggiamento iniziale, competenze di classe in `CLASS_SKILLS`.
   - **Meccanica nuova nel motore: Competenza (Espero)**. Prima serviva un
     posto per "raddoppia il bonus di competenza su un'abilità" — non
     esisteva proprio (`ch.expertiseSkills`, sommato in `engine.js` solo se
     la skill è già competente). Wizard di creazione: picker nel passo finale
     quando `choicePoints.expertise` include il livello di creazione (il
     Ladro lo dà al 1°); level-up: stesso picker generico al livello giusto
     (il Ladro lo ridà al 6°, altre 2 in più). Verificato: Ladro con
     Espero su Furtività e Rapidità di Mano → +12 invece di +8 (DES+4, doppio
     PB+4+4), le altre abilità competenti restano a bonus singolo.
   - **Bug vero trovato e chiuso: le armi Agili (finesse) e a distanza non
     usavano mai Destrezza**. Il motore (`engine.js`) sa scegliere FOR o DES
     in base ai flag `weapon.finesse`/`weapon.ranged`, ma NESSUN punto
     dell'app li aveva mai scritti — non il wizard di creazione, non
     l'editor equipaggiamento, non lo stato di default di Tharion (la sua
     Spada lunga è un'arma personalizzata, quindi il buco è sempre rimasto
     invisibile: un personaggio FOR come un Paladino non se ne accorge).
     Per un Ladro DES è invece uno sbaglio pesante: con Spada Corta (Accurata)
     il "Colpire" veniva calcolato sulla Forza, sbagliato di netto. Chiuso
     derivando `finesse`/`ranged` dal catalogo (`props` contiene 'Accurata' →
     agile, categoria contiene 'dist' → a distanza) sia in `create.js` che in
     `edit-sheet.js`, ogni volta che si sceglie un'arma dal catalogo (le armi
     personalizzate mantengono quello che avevano). Verificato: Ladro DES 18
     con Spada Corta, livello 9 → Colpire +8 (prima +4), Danni 1d6+4 (prima
     +0); Tharion (Spada lunga, Forza) invariato.
   - **Competenza nelle armi ristretta correttamente**: il Ladro non è
     competente con TUTTE le armi da guerra (niente Ascia bipenne), solo
     quelle Accurate o Leggere. La `weaponProf` esistente (solo prefissi
     'sem'/'gue') non poteva esprimerlo; aggiunto il token `'gue-finesse'`
     al filtro condiviso da `create.js` ed `edit-sheet.js` (controlla
     `props` per 'Accurata'/'Leggera' quando il prefisso è 'gue'). Verificato
     nel wizard: la lista Maestria mostra tutte le armi semplici più
     Stocco/Scimitarra/Spada corta/Frusta/Balestra a mano, non Spadone o
     Ascia bipenne.
   - **Bug di creazione minore, stesso genere di quello del Guerriero**:
     `renderEquipaggiamento` in `create.js` già generalizzato per la classe,
     ma non serviva altro qui (il Ladro ha solo 2 opzioni A/B, non 3 come il
     Guerriero).
   - **Verifica end-to-end**: Ladro di prova iniettato a livello 9 (Ladro
     Esperto) — privilegi di classe e sottoclasse tutti presenti in Tratti
     nell'ordine giusto, nota "Attacco Furtivo: +5d6…" sotto gli Attacchi
     (stessa idea della nota Furia del Barbaro, letta da
     `klass.sneakAttackD6[livello]`), nessuna card Risorse indesiderata (il
     Ladro non ha risorse di classe). Giro completo del wizard da zero
     (Elfo, Ladro, Criminale, punteggi consigliati, 4 competenze di classe +
     2 dal background senza doppioni, pacchetto A, 2 maestrie filtrate,
     Competenza su Furtività + Rapidità di Mano): personaggio salvato con
     tutti i campi corretti, incluso `weapon.finesse: true` derivato da solo.
     Tharion (Paladino) verificato invariato dopo ogni modifica. Console
     pulita in ogni prova.
   - **Debito segnalato e poi chiuso lo stesso giorno**: la card Abilità
     mostrava solo 9 delle 18 abilità, scritte a mano per Tharion, con i
     pallini di competenza/Espero mai dinamici per nessun personaggio.
     Segnalato con `spawn_task` invece di un fix silenzioso in mezzo al
     lavoro sul Ladro (è un cambiamento di layout, meritava una proposta);
     l'utente ha chiesto 3 alternative con preview (elenco completo delle
     18 sempre visibile, competenti raggruppate in cima, oppure compatta con
     "Mostra tutte") — mockup pubblicato come artifact, scelta l'**Alternativa
     2** ("Competenti" in cima, poi "Altre abilità", stesso linguaggio visivo
     delle sezioni Riposo breve/lungo della scheda Risorse).
     → **Fatto (`?v=91`)**: `index.html` non ha più le 9 righe fisse, solo un
     contenitore (`#skills-list`) riempito da `js/stats.js` `renderSkills()`
     a ogni render, con le 18 abilità di `window.AppEngine.SKILLS` divise fra
     "Competenti" e "Altre abilità"; nuove classi `.skill-group-head/-label/
     -line` in `stats.css` (stesso stile di `.card-title.sec`, in scala più
     piccola). Anche i Tiri Salvezza, stesso bug: righe già tutte presenti ma
     pallino fisso su SAG/CAR di Tharion, ora dinamico allo stesso modo.
     **Bug trovato durante il collaudo**: l'attributo nativo `hidden` sul
     pallino perdeva contro la regola `.skill-dot { display: inline-block }`
     (uno stile d'autore batte sempre lo user-agent, qualunque specificità) —
     tutti i pallini restavano visibili. Aggiunta `.skill-dot[hidden] {
     display: none }` per ridichiararlo esplicitamente. Verificato: Tharion
     invariato (Atletica/Intimidire/Percezione/Persuasione in "Competenti",
     le altre 14 sotto, tutte le 18 presenti); un Ladro di prova con Espero su
     Furtività e Rapidità di Mano mostra il doppio pallino e +10 invece di
     +7/+3 sulle altre competenti. Console pulita in ogni prova.
4. [x] **Monaco** (no caster) — Punti Focus, Arti Marziali, Difesa Senz'Armatura (SAG).
   → **Fatto (2026-07-28, `?v=92`, manuale `version` 31→32)**: privilegi 1→20
   dal PDF (p.100-103), sottoclasse **Guerriero della Mano Aperta** (p.106,
   la più semplice delle 4 — Misericordia, Ombra ed Elementi restano da
   fare), equipaggiamento iniziale, competenze di classe. Le tre tabelle
   numeriche (Dado Arti Marziali, Punti Focus, Movimento senza Armatura)
   erano già nello stub, corrette ma completamente morte — nessun punto del
   motore le leggeva.
   - **Riposo breve "pieno" generalizzato**: i Punti Focus del PHB tornano
     TUTTI al riposo breve, non 1 solo come Recuperare Energie/Azione
     Impetuosa del Guerriero. `shortRest()` (`sheet.js`) e la sezione visiva
     (`SECTION_BY_RESET` in `stats.js`) capiscono ora anche `resetOn:
     'short-full'` accanto al vecchio `'short'` (parziale), senza toccare il
     comportamento delle risorse esistenti. Verificato: Punti Focus spesi a
     3/11 → riposo breve → tornano 11/11 in un colpo solo.
   - **Difesa senza Armatura ristretta correttamente**: a differenza del
     Barbaro (che la mantiene anche con lo scudo, lo dice il PHB), il Monaco
     la perde impugnando uno scudo. Aggiunto il flag `unarmoredDefenseNoShield`
     letto da `engine.js`: con lo scudo il Monaco perde il bonus di Saggezza
     alla CA ma non lo scudo stesso (sommato comunque). Verificato: senza
     scudo CA 10+DES+SAG, con lo scudo CA 10+DES soltanto (+2 dello scudo).
   - **Nota "Arti Marziali" sotto gli Attacchi**, stessa idea delle note
     Furia/Attacco Furtivo: il dado (`klass.martialArtsDie[livello]`)
     sostituisce il danno normale del colpo senz'armi o di un'arma da
     Monaco, qualunque arma sia nella riga sopra.
   - **Velocità calcolata ma non ancora mostrata da nessuna parte**: la
     scheda non ha mai avuto una vista per la velocità del personaggio (solo
     quella della cavalcatura). Aggiunto `view.speedM` in `engine.js`
     (specie + bonus di Movimento senza Armatura quando pertinente, con lo
     stesso vincolo "niente scudo" del punto sopra) così il dato esiste ed è
     corretto, ma resta da decidere DOVE mostrarlo — segnalato con
     `spawn_task` invece di infilare una nuova card nella scheda senza
     proposta. Verificato: Halfling Monaco livello 11 senza scudo 9+6=15 m,
     con lo scudo torna a 9 m.
   - **Verifica end-to-end**: Monaco di prova iniettato a livello 11 (Mano
     Aperta) — CA 17 (10+DES+SAG), Attacco Extra 2 colpi, nota Arti Marziali
     "d10" corretta, Punti Focus 11/11 nella sezione Riposo breve, Metabolismo
     Sbalorditivo 1/1 in Riposo lungo, tutti i privilegi di classe e
     sottoclasse in Tratti nell'ordine giusto. Giro completo del wizard da
     zero (Halfling, Monaco, Eremita, punteggi consigliati, 2 competenze di
         classe + 2 dal background senza doppioni, pacchetto A senza
     maestrie da scegliere): personaggio creato con `armor.id` assente (il
     Monaco non ha armatura, a differenza di tutte le altre classi finora),
     arma Lancia non agile (corretto, non è Leggera). Tharion (Paladino)
     verificato invariato dopo ogni modifica. Console pulita in ogni prova.
5. [x] **Ranger** (half-caster) — riusa gli slot half del Paladino; incantesimi noti, Nemico Prescelto.
   → **Fatto (2026-07-28, `?v=94`, manuale `version` 32→33)**: privilegi 1→20
   dal PDF (p.118-120), sottoclasse **Cacciatore** (p.126, la più semplice
   delle 4 — Domatore di Bestie, Vagabondo Fatato e Cercatore d'Ombre restano
   da fare), equipaggiamento iniziale, competenze di classe. Le tabelle
   `favoredEnemy`/`preparedByLevel`/`slotLevelByLevel` erano già corrette
   nello stub (progressione da mezzo incantatore, identica al Paladino).
   - **Marchio del Cacciatore gratis** modellato come Punizione
     Divina/Evoca Destriero gratis del Paladino: `classResources.
     huntersMarkFree` letto da `favoredEnemy[livello]`, incantesimo sempre
     preparato via `spellsByLevel[1]`.
   - **Competenza generalizzata per un conteggio variabile**: il Ladro dà
     sempre 2 abilità, ma il Ranger ne dà 1 sola al 2° livello (Esploratore
     Provetto) e 2 al 9° (Competenza) — `choicePoints.expertise` è passato da
     un array di livelli a un array di `{level, count}`, con create.js e
     levelup.js aggiornati per leggere il conteggio giusto invece del 2
     fisso. Il Ladro (già in produzione) è stato migrato alla stessa forma;
     verificato che i suoi due picker (1° e 6° livello, sempre 2) restano
     identici.
   - **Bug vero trovato e chiuso: un incantesimo "sempre preparato" dal 1°
     livello poteva essere scelto di nuovo come preparato normale**. Il
     Paladino non se ne accorgeva (i suoi due incantesimi gratuiti arrivano
     dal 2° livello, dopo la creazione), ma il Ranger dà Marchio del
     Cacciatore già al 1°: senza filtro comparirebbe anche fra gli
     incantesimi preparabili nel wizard, sprecando una scelta su un
     doppione. Esclusi in `create.js` (renderFinale) gli id in
     `klass.spellsByLevel[CREATE_LEVEL]`, con una riga dedicata ("Sempre
     preparato dalla classe: …") accanto a quella già esistente per Iniziato
     alla Magia.
   - **Bug vero trovato e chiuso: l'etichetta e il titolo del Grimorio erano
     fissi su "Carisma"/"Tharion Velnar"**. Il valore numerico della card
     era già corretto e generico (`view.spellAbilityModText`), ma la scritta
     accanto restava sempre "Carisma" — invisibile finché tutti i caster
     avevano CAR come caratteristica (Paladino); per un Ranger (Saggezza) la
     card mostrava un\'etichetta sbagliata. Aggiunto `id="grim-cha-label"` e
     `id="grim-char-name"` in `index.html`, valorizzati in `grimorio.js`
     leggendo l\'etichetta giusta da `view.saves` (stessa italianizzazione
     già usata per i Tiri Salvezza) e il nome vero del personaggio.
     Verificato: Ranger di prova → "Saggezza" e "Grimorio — Test Ranger";
     Tharion invariato ("Carisma", "Grimorio — Tharion Velnar").
   - **Velocità (stesso debito del Monaco)**: Marcia Spedita (+10 piedi
     mentre non si indossa un'armatura Pesante) richiede una condizione
     diversa da quella del Monaco (qualunque armatura tranne quella Pesante,
     non "nessuna armatura"). Generalizzato `speedBonusM`/`speedBonusGate`
     in `engine.js` (rinominato da `unarmoredMovementM`, che restava
     specifico del Monaco): `'unarmored'` (default, niente armatura né
     scudo) oppure `'notHeavy'` (Ranger). Ancora non mostrata da nessuna
     parte — stesso `spawn_task` già aperto per il Monaco.
   - **Verifica end-to-end**: Ranger di prova a livello 9 (Cacciatore, arco
     lungo) — Colpire/CD Incantesimi/slot corretti, Marchio del Cacciatore
     gratis 4/4, Espero su Furtività (+12 invece di +8), velocità 12 m con
     armatura leggera (9 base + 3 di Marcia Spedita, sbloccata dal livello
     6). Giro completo del wizard da zero (Elfo, Ranger, Guida con Iniziato
     alla Magia — lista del Druido, punteggi consigliati, 3 competenze di
     classe + 2 dal background senza doppioni, pacchetto A, 2 maestrie,
     incantesimi preparati senza il doppione di Marchio del Cacciatore):
     personaggio creato con tutti i campi corretti. Tharion (Paladino)
     verificato invariato dopo ogni modifica. Console pulita in ogni prova.
6. [x] **Chierico** (full) — Incanalare Divinità (campo già esiste), Dominio.
   → **Fatto (2026-07-28, `?v=97`, manuale `version` 33→34)**: prima classe a
   incantatore pieno. Privilegi 1→20 dal PDF (p.68-71), sottoclasse
   **Dominio della Vita** (p.72-73, il più semplice dei quattro — Luce,
   Inganno e Guerra restano da fare), equipaggiamento iniziale, competenze
   di classe. Le tabelle numeriche (Incanalare Divinità, Trucchetti,
   Preparati, slot) erano già corrette nello stub.
   - **`klass.channelDivinity` è generico da tempo**: la card "Incanalare
     Divinità" in `engine.js`/`stats.js` era già scritta per qualunque classe
     con quella tabella (usata finora solo dal Paladino) — bastava
     aggiungerla al Chierico senza toccare il motore.
   - **Bug vero trovato e chiuso: l'etichetta della card era fissa in
     inglese ("Channel Divinity")**, invisibile finché solo il Paladino la
     usava. Tradotta in "Incanalare Divinità" in `index.html` (l'unico punto
     dove compare, la card è condivisa fra le classi).
   - **3 incantesimi duplicati nel catalogo, trovati con un controllo
     sistematico per nome** (lo stesso bug già chiuso una volta questa
     sessione per "Libertà di Movimento" — question mi ha spinto a
     controllare TUTTO il catalogo invece di aspettare il prossimo
     incidente): `dardo-guida` = doppione di `dardo-di-guida`,
     `faro-di-speranza` = doppione di `faro-speranza`, `guardiano-della-fede`
     = doppione di `guardiano-fede` (quest'ultimo aveva anche la scuola
     sbagliata, 'Evocazione' invece di 'Convocazione' — corretta). Rimossi i
     3 doppioni (mai referenziati altrove), verificato con uno script che
     confronta i nomi su tutti i 407→405 incantesimi: zero doppioni residui.
   - **Verifica end-to-end**: Chierico di prova a livello 7 (Dominio della
     Vita) — CA/PF/slot/Incanalare Divinità corretti, tutti i privilegi di
     classe e sottoclasse in Tratti nell'ordine giusto, Grimorio con titolo
     ed etichetta "Saggezza" corretti. Giro completo del wizard da zero
     (Nano, Chierico, Eremita, punteggi consigliati, 2 competenze di classe +
     2 dal background senza doppioni, pacchetto A, 3 trucchetti + 4
     incantesimi preparati, "Dardo di Guida" presente una sola volta dopo la
     pulizia): personaggio creato con tutti i campi corretti. Tharion
     (Paladino, che usa `faro-speranza`/`guardiano-fede` nel giuramento di
     Vendetta/Gloria) verificato invariato. Console pulita in ogni prova.
7. [x] **Druido** (full) — Forma Selvatica, Circolo.
   → **Fatto (2026-07-28, `?v=98`, manuale `version` 34→35)**: privilegi 1→20
   dal PDF (p.79-89), sottoclasse **Circolo della Luna** (p.85-86, la più
   semplice delle quattro da modellare — Terra richiederebbe un picker di
   terreno da rifare a ogni riposo lungo, Mare e Stelle risorse nuove; la
   Luna invece ha solo incantesimi sempre preparati per livello, come il
   Dominio della Vita del Chierico), equipaggiamento iniziale, competenze di
   classe. Le tabelle numeriche (Forma Selvatica, Trucchetti, Preparati,
   slot) erano già corrette nello stub.
   - **Forma Selvatica generica da subito**: nessuna modifica al motore,
     bastava dichiarare `classResources.wildshape` con lo stesso pattern già
     usato da Recuperare Energie/Azione Impetuosa del Guerriero (1 uso
     recuperato al riposo breve, tutti al riposo lungo) — la card dinamica,
     `shortRest()` e la sezione Risorse la trattano come qualunque altra
     risorsa senza sapere che è la "Forma Selvatica" del Druido.
   - **Niente Maestria nelle Armi** (come il Chierico): solo `weaponProf:
     ['sem']`, nessuna colonna dedicata nella tabella dei privilegi.
   - **Ordine Primordiale (scelta di ruolo al 1°, come l'Ordine Divino del
     Chierico) lasciato descrittivo**: stesso trattamento già dato a scelte
     simili senza un aggancio meccanico nel motore (es. "Mente Sfuggente"
     del Ladro) — nessun nuovo picker nel wizard per questo.
   - **Verifica end-to-end**: Druido di prova iniettato a livello 14 (Circolo
     della Luna) — CA/PF/slot corretti, Forma Selvatica 3/3, tutti i
     privilegi di classe e sottoclasse in Tratti nell'ordine giusto,
     Grimorio con etichetta "Saggezza" e "Cura Ferite"/"Raggio di Luna"
     marcati FISSO ai livelli giusti. Giro completo del wizard da zero (Elfo,
     Druido, Guida con Iniziato alla Magia — lista del Druido, punteggi
     consigliati SAG 15+2/COS 14+1, 2 competenze di classe + 2 dal
     background senza doppioni, pacchetto A, 2 trucchetti + 4 incantesimi
     preparati oltre a Cura Ferite già fisso dal talento): personaggio
     creato con tutti i campi corretti (PF 10, CA 14 cuoio+scudo). Level-up
     1→3 a tavolino: guadagni automatici (PF, Dadi Ferita, Forma Selvatica,
     slot, preparati) tutti corretti, sottoclasse Circolo della Luna
     auto-assegnata al 3° livello (unica opzione modellata, nessun picker
     necessario) con "Forme Circolari" comparsa subito nei Tratti. Riposo
     breve testato: Forma Selvatica 0/2 → 1/2 (recupera esattamente 1 uso,
     non tutti). Tharion (Paladino) verificato invariato dopo ogni prova
     (CA 20, PF 60, CD 15, Aura +3). Console pulita in ogni prova.
   - **Bug pre-esistente trovato, non di questa classe**: la card "Lama
     Vincolante" nella tab Tratti (`index.html`) è HTML statico, non
     condizionale — compare per QUALUNQUE personaggio, non solo per Tharion.
     Segnalato con `spawn_task` invece di un fix silenzioso fuori scope.
8. [x] **Bardo** (full) — Ispirazione Bardica, Collegio.
   → **Fatto (2026-07-28, `?v=100`, manuale `version` 35→36)**: privilegi 1→20
   dal PDF (p.59-61), sottoclasse **Collegio della Sapienza** (p.64, il più
   semplice dei quattro da modellare — Danza vorrebbe una CA a due
   caratteristiche mai vista finora, Valore dà Attacco Extra che nel motore
   è una tabella di classe non condizionabile per sottoclasse, Incanto ha
   risorse dedicate nuove; la Sapienza resta descrittiva, riusando solo
   Ispirazione Bardica), equipaggiamento iniziale (kit + Strumento Musicale
   a scelta), competenze di classe (unica classe con "scegli 3 fra tutte le
   18", non una lista ristretta). Le tabelle numeriche (Dado Bardico,
   Trucchetti, Preparati, slot) erano già corrette nello stub.
   - **Meccanica nuova nel motore: risorsa scalata da una caratteristica**.
     Ispirazione Bardica non è una tabella per livello come tutte le risorse
     viste finora (Furia, Punti Focus, Forma Selvatica…): sono usi pari al
     modificatore di Carisma (minimo 1). `resMax()` in `engine.js` ora
     accetta anche `abilityMod`/`min` oltre a `byLevel`/`byLevelRef`/`max`,
     stesso principio già usato da `CLASS_BONUSES` per i bonus (Aura di
     Protezione, Arma Sacra) ma applicato per la prima volta a un NUMERO DI
     USI. Verificato: CAR 18 → 4 usi, CAR 10 → 1 uso (minimo).
   - **Meccanica nuova nel motore: recupero che "migliora" con il livello**.
     Ispirazione Bardica si recupera solo al riposo lungo fino al 4°
     livello; dal 5° (Fonte d'Ispirazione) anche al riposo breve, per
     intero. Aggiunto `resetOnAt: {level, value}` ai `classResources`
     (generico, non legato al Bardo) che sostituisce `resetOn` dal livello
     indicato in poi. **Il wizard di level-up ha mostrato il cambiamento da
     solo**: salendo dal 4° al 5° livello la card "Nuovi privilegi" ha
     incluso "Fonte d'Ispirazione" e la sezione Risorse ha spostato da sola
     Ispirazione Bardica da "Riposo Lungo" a "Riposo Breve" — nessuna riga
     di codice nuova in `levelup.js`, generalizzava già tutto.
   - **Niente Maestria nelle Armi** (come Chierico e Druido): solo
     `weaponProf: ['sem']`.
   - **Bug pre-esistenti trovati, non di questa classe** (stesso pattern
     della card "Lama Vincolante" già chiusa questa sessione): la card
     "Punizione Divina" nella tab Info/Comb e il promemoria "Punizione
     Divina = az. bonus…" nel Grimorio sono entrambi HTML statico —
     compaiono per QUALUNQUE personaggio, non solo per un Paladino (trovato
     con un Bardo di prova, che non ha nulla a che fare con Punizione
     Divina). Segnalati con `spawn_task` invece di un fix silenzioso fuori
     scope.
   - **Verifica end-to-end**: Bardo di prova iniettato a livello 9 (Collegio
     della Sapienza, CAR 18) — CD/attacco/etichetta "Carisma" corretti,
     Ispirazione Bardica 4/4 in Riposo Breve (short-full già attivo dal
     5°), tutti i privilegi di classe e sottoclasse in Tratti nell'ordine
     giusto. Test dedicato del recupero: a livello 1 (CAR comunque 18)
     Ispirazione Bardica resta in Riposo Lungo e un riposo breve non la
     tocca; un riposo lungo la recupera per intero. Giro completo del
     wizard da zero (Tiefling, Bardo, Intrattenitore con strumento "Liuto"
     a scelta, punteggi consigliati DES 14+1/CAR 15+2, 3 competenze di
     classe + 2 dal background senza doppioni, pacchetto A + pacchetto del
     background, 2 trucchetti + 4 incantesimi preparati): personaggio
     creato con tutti i campi corretti (Pugnale con `finesse:true` derivato
     da solo, PF 9, 30 MO). Level-up 1→5 a tavolino: Competenza (Espero) al
     2° con picker sulle 5 abilità competenti, sottoclasse Collegio della
     Sapienza auto-assegnata al 3° (unica opzione modellata), ASI al 4°
     (CAR 17→18, Ispirazione Bardica 3→4 mostrato live nel picker mentre si
     alzava CAR), Fonte d'Ispirazione al 5° col cambio di sezione delle
     risorse confermato. Tharion (Paladino) verificato invariato dopo ogni
     prova (CA 20, PF 60, CD 15, Aura +3, +8 all'arma). Console pulita in
     ogni prova.
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

- 2026-07-23 — Blocco 5.B (creazione), decisioni prima dell'implementazione:
  **livello di partenza 1 fisso** (poi si sale col wizard), **punteggi con tutti
  e tre i metodi** (point-buy default / array standard / manuale), **UX A —
  Mago a schermo intero** (tra 3 proposte con preview). Implementazione a
  sotto-step: b1 shell vista + navigazione, b2 contenuto dei passi, b3
  generazione + salvataggio del personaggio (nuovo doc Firestore), b4 pulizia
  dei residui di Tharion in `config.js` (STEED/SWORD_TIERS/FEATURES/SPELLS).

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

## Debiti aperti (trovati strada facendo)

*Obiettivo dichiarato da Andrea (2026-07-27): arrivare ad avere **tutto
completo di tutto**. Qui finisce ogni cosa incompleta che incontro mentre
lavoro su altro, così non si perde. Non sono bug urgenti: sono pezzi mancanti.*

- [x] ~~**4 incantesimi del giuramento non sono nel catalogo**~~ — FATTO
      (2026-07-27, manuale `version: 22`): Faro di Speranza, Libertà di
      Movimento, Guardiano della Fede e Colpo Infuocato sono entrati nel
      catalogo con riassunti originali in italiano dal PDF. `classes` resta
      quella vera (Chierico e compagnia): non sono sulla lista del Paladino, gli
      arrivano solo dal giuramento, quindi non deve poterli *scegliere*.
      Verificato: tutte e 10 le voci di `devozione.spellsByLevel` (3→17) ora si
      aprono.
- [x] ~~**Statblock del destriero scritto fisso nell'HTML**~~ — FATTO
      (2026-07-27, manuale `version: 26`, `?v=82`). Il blocco viveva in
      `index.html` coi numeri di Tharion — CA 12, +7 al colpire, CD 15,
      competenza +3, 1d8+2 — mostrati identici a chiunque. Ora `findSteed` sta
      nei dati (statblock del Destriero Ultraterreno, PDF pag. 272) e
      `sheet.js` lo rende calcolando quel che scala: **CA = 10 + livello dello
      slot**, PF, danno dello Schianto `1d8 + livello`, cura del Celestiale
      `2d8 + livello`, CD dello Sguardo Maligno = la **tua** CD incantesimi,
      bonus al colpire = il **tuo** attacco con incantesimi, bonus di
      competenza = il tuo, e la nota sul volo che sparisce quando lo slot è di
      4° o superiore. Verificato: per Tharion i valori restano identici a prima
      (CA 12, +3, +7, 1d8+2, 2d8+2, CD 15); per un paladino di 9° con slot di
      4° e CAR 18 diventano CA 14, +4, +9, 1d8+4, CD 17 e volo senza nota.
      Console pulita.
- [x] ~~**Nome del file di export sempre `tharion-velnar-backup.json`**~~ —
      FATTO (2026-07-27): il nome segue il personaggio attivo
      (`prova-backup.json`), slug con accenti e simboli normalizzati.
- [x] ~~**Trucchetti scelti in creazione**~~ — FATTO: collaudato davvero con
      Druido (2026-07-27) e Bardo (2026-07-28), entrambi creati da zero col
      wizard scegliendo trucchetti + incantesimi preparati.
- [x] ~~**`spellsByLevel` delle sottoclassi non-Devozione**~~ — per il Paladino
      FATTO (2026-07-27): i 4 giuramenti sono tutti modellati (vedi 4.2). Resta
      da fare **solo per le classi future** — Barbaro ha ancora 1 solo Cammino
      dei 4 del PHB (Berserker), e ogni nuova classe del Blocco 5.C partirà
      allo stesso modo (1 sottoclasse, le altre dopo).
- [x] ~~**Point-buy: si può passare senza spendere i 27 punti**~~ — in realtà
      già FATTO nello stesso giro del 5.B.4 (2026-07-27): `scoresValid()` in
      `create.js` richiede `pointBuyUsed() === POINT_BUY_BUDGET` (27 punti
      esatti, non solo ≤27), col commento che lo dichiara. Questa voce era
      rimasta per errore dopo il fix — trovato riverificando il codice il
      2026-07-29.
- [x] ~~**Peso degli oggetti che arrivano dal background**~~ — FATTO
      (2026-07-27, manuale `version: 27`): la roba dei pacchetti dei background
      entrava in sacca con `weight: 0`, falsando il carico trasportato. Ora c'è
      `gearWeights` nel manuale, con il peso totale di ognuna delle 45 voci
      (tabella dell'equipaggiamento a pag. 222 e schede degli strumenti a pag.
      219-220 del PDF); le voci a cui il PHB non dà un peso — pergamena,
      profumo, munizioni — o che dipendono dalla forma scelta — set da gioco,
      strumento musicale, strumenti da artigiano — sono a `null`, cioè 0
      **dichiarato**, non dimenticato. Verificato: Barbaro Contadino → sacca da
      93 lb su 255 di capacità (kit dell'esploratore 55, pentola 10, strumenti
      da carpentiere 6, pala 5, abiti 4, kit da guaritore 3, falcetto 2, 4 asce
      da lancio da 2).
- [x] ~~**Peso dei kit non pesato**~~ — FATTO (2026-07-27): il peso c'era
      eccome, nella tabella dell'equipaggiamento (PDF pag. 222) e non nella
      descrizione dei kit — Kit del sacerdote 29 lb, Kit dell'esploratore
      55 lb. Il simbolo sacro è "variabile" secondo la forma: vale l'amuleto
      (1 lb).
- [x] ~~**`weaponMasteries` del personaggio non è ancora mostrato**~~ — FATTO
      (2026-07-27): riga sotto la tabella Attacchi, "Maestrie nelle armi: Spada
      lunga (Sap), Giavellotto (Slow)", nascosta per chi non ne ha.
      Le maestrie si assegnano dall'editor (Modifica · Equipaggiamento): tanti
      selettori quanti ne concede la classe a quel livello, fra le armi in cui
      è competente. Serviva perché i personaggi nati prima del wizard — cioè
      Tharion — non ne avevano nessuna registrata. **Quali siano le sue due
      resta una scelta di Andrea**: il manuale ovviamente non lo dice.
- [x] ~~**Barbaro: solo 1 Cammino su 4**~~ — FATTO (2026-07-27): tutti e 4 i
      Cammini modellati, vedi nota sotto "1. Barbaro" in Blocco 5.C. Il picker
      del level-up li ha presi senza bisogno di alcuna modifica al codice.
- [x] ~~**`renderGains()` ha un hardcode `classId === 'paladino'`**~~ — FATTO
      (2026-07-29). In `engine.js`, `poolMax` non ha più `loh` cablato: un
      loop su `classRes` con `kind === 'pool'` (stesso principio già usato per
      `kind:'uses'`) aggiunge qualunque risorsa a riserva con la sua chiave —
      oggi solo Imposizione delle Mani, ma vale per qualunque classe futura.
      In `levelup.js`, `renderGains()` ha lo stesso loop generico al posto del
      controllo su `character.classId`, con etichetta presa da `classRes[key].name`.
      Verificato in console col motore reale: Tharion 7→8 produce identica la
      riga "Imposizione delle Mani: 35 → 40" (PF 60→68, CA 20, CD 15
      invariati); un Barbaro (nessuna risorsa `pool`) deriva senza errori e
      senza righe spurie (`poolMax` resta `hp`/`steedhp`/`tempHp`). Cache
      busting `?v=104`.

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

- 2026-07-28 — **Stile Duellante si applicava anche con archi e spadoni.**
  Trovato lavorando sul Ranger: `js/engine.js` sommava il +2 ai danni di
  `fightingStyle === 'duello'` senza controllare l'arma, mentre lo Stile
  Difesa aveva già il controllo giusto (richiede un'armatura). Il PHB lo
  richiede su un'arma da mischia impugnata a una mano.
  **Fix**: nuovo flag `weapon.twoHanded` derivato dal catalogo (props
  contiene 'A due mani'), come già fatto per `finesse`/`ranged`; il bonus
  ora richiede `!weapon.ranged && !weapon.twoHanded`. Corretta anche la nota
  sotto gli Attacchi (`stats.js`), che prima compariva sempre per entrambi
  gli stili — ora Duellante controlla l'arma e Difesa l'armatura indosso,
  stesse condizioni del calcolo numerico. Verificato: Tharion (Spada lunga,
  non a due mani) invariato; un test con Arco lungo + Stile Duello perde
  correttamente sia il bonus che la nota dopo il fix. Cache busting `?v=96`.

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
