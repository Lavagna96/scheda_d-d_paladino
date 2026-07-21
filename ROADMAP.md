# Roadmap — Da scheda Paladino ad app multi-account

> **Questo file è il registro di avanzamento tra sessioni.**
> Regola di manutenzione: a ogni step completato aggiornare la casella `[ ]` → `[x]`,
> la sezione "Dove siamo" e il "Prossimo passo". Le decisioni prese vanno
> annotate nella sezione "Decisioni" con la data.

---

## Dove siamo

- **Ultimo aggiornamento:** 2026-07-21
- **Stato:** Fasi 0, 1, 2, 3 (editing + step 3.5 oggetti magici) tutte
  **committate e DEPLOYATE** su GitHub Pages, ultimo commit `f91dc85`.
  Login e Face ID già collaudati da Andrea su iPhone reale (con relativo
  fix del cancello di login su rete lenta, commit `ae3ef6e`).
- **Prossimo passo:** **Fase 4 — Level Up Paladino**, ora espansa in 9 step
  su 3 blocchi (dati del manuale + sync DB → fondamenta nella scheda →
  flusso di level-up). Da aprire risolvendo le 3 Decisioni aperte qui sotto
  (PF al level up, livello impostabile o solo incrementabile, ambito
  sottoclassi), poi step 4.1 (privilegi per livello 1→20 dal PHB).
  Nota: le nuove sezioni del manuale (privilegi per livello, sottoclassi,
  talenti) vanno salvate anche su Firestore come già razze/classi/incantesimi
  (step 4.4). Collaudo residuo mai confermato: sync multi-device tra due
  dispositivi con lo stesso account.

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
      console pulita). Cache busting `?v=58`. **In attesa di commit + deploy.**
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
      identico, console pulita). Cache busting `?v=60`. **In attesa di commit + deploy.**
      Il subagente ha esaurito il limite di sessione a fine lavoro: dati completati e
      verificati direttamente in sessione (bump versione + cache).
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
      **VERIFICA REALE ANCORA DA FARE (serve Andrea):** dopo il deploy, login sul sito
      live → il sync parte (versione locale 15 > remota); poi confermare nella console
      Firebase che esista `manuals/5.5/feats` con le 17 voci. Se NON compaiono, la
      **regola Firestore** per i manuali non è attiva: aggiungere in Console → Firestore
      → Regole `match /manuals/{document=**} { allow read, write: if request.auth != null; }`.
      Il sync fallisce in silenzio (catch), quindi l'app funziona comunque dal file locale.

**Blocco B — Fondamenta nella scheda**

- [ ] 4.5 **Tratti derivati dal manuale** (refactor-ponte, gemello-prosa della Fase 0).
      La lista dei privilegi mostrata nella scheda oggi è statica in `config.js`
      (`FEATURES`, specifica di Tharion): farla nascere da manuale + personaggio
      = privilegi di classe fino al livello + privilegi di sottoclasse fino al livello
      + tratti di specie (gating per livello, es. Volo Draconico dal 5° del Dragonide)
      + talenti presi + oggetti custom (Fase 3.5). **Verifica di non-regressione
      obbligatoria**: i Tratti di Tharion devono rendere IDENTICI a prima (confronto
      screenshot), come fu per i numeri nella Fase 0.4.
- [ ] 4.6 **Scelte di livello nello stato del personaggio**. Nuovi campi in
      `state.character` per registrare, e rendere riproducibili, le scelte: `subclassId`,
      `feats[]`, distribuzione degli ASI, PF guadagnati per livello (o la regola PF
      scelta). Migrazione dello stato attuale di Tharion (già liv. 7, Devozione, Duello,
      Lama Vincolante come modifier) senza perdere nulla. Decidere la forma esatta prima
      di scrivere.

**Blocco C — Il level-up**

- [ ] 4.7 **UX del level-up** — bottom sheet/wizard che al passaggio di livello mostra
      i guadagni automatici e guida le scelte (subclasse al 3; ASI +2 / +1+1 vs talento;
      PF secondo la regola scelta; nuovo Stile al 2; conteggi incantesimi/trucchetti).
      3 proposte con preview prima di implementare.
- [ ] 4.8 **Applicazione atomica** del level-up: applica il passaggio N→N+1 allo stato in
      un colpo solo, il motore ricalcola tutti i derivati, sync cloud. Gestire anche il
      caso "correzione" se si decide che il livello è impostabile e non solo incrementabile
      (vedi Decisioni aperte).
- [ ] 4.9 **Test**: percorso reale 7→8 di Tharion (verifica che PF, competenza,
      Imposizione, slot, nuovi privilegi si aggiornino coerentemente) + simulazione 1→20
      a tavolino. Commit + deploy finale della fase.

### Fase 5 — Estensioni future (backlog, non pianificate in dettaglio)

- [ ] Level up per le altre 11 classi (il motore e la UX di Fase 4 devono già nascere generici).
- [ ] Creazione guidata di un personaggio nuovo da zero (qualsiasi classe/specie del manuale).
- [ ] Multiclasse (esplicitamente fuori scope per ora).

---

## Decisioni aperte

Nessuna al momento: le tre della Fase 4 sono state risolte (vedi "Decisioni
prese (Fase 4)").

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
