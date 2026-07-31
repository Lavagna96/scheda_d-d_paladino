# Roadmap — Da scheda Paladino ad app multi-account

> **Questo file è il registro di avanzamento tra sessioni.**
> Regola di manutenzione: a ogni step completato aggiornare la casella `[ ]` → `[x]`,
> la sezione "Dove siamo" e il "Prossimo passo". Le decisioni prese vanno
> annotate nella sezione "Decisioni" con la data.

---

## Dove siamo

- **Ultimo aggiornamento:** 2026-07-31
- **Stato:** **Fasi 0, 1, 2, 3 e 4 tutte COMPLETE, committate e DEPLOYATE** su
  GitHub Pages. L'intera visione originale (login, dashboard multi-personaggio,
  editing, oggetti magici, level-up guidato per il Paladino) è realizzata e
  funzionante. Login e Face ID collaudati da Andrea su iPhone reale.
  **Fase 5, Blocco 5.C COMPLETO: tutte e 11 le classi** (Barbaro, Guerriero,
  Ladro, Monaco, Ranger, Chierico, Druido, Bardo, Stregone, Mago, Warlock)
  hanno privilegi 1→20, almeno 1 sottoclasse, level-up e creazione da zero.
  Il **restyling visivo del wizard di creazione** (tutti e 8 i passi: Specie,
  Classe, Background, Punteggi, Competenze, Equipaggiamento,
  Sottoclasse/Incantesimi, Identità), dal commit `994a181` (`?v=105`) al
  commit `0b3b595` (Identità a scorrimento, `?v=114`), **è confermato
  DEPLOYATO** (verificato il 2026-07-30: `origin/main` allineato a `HEAD`,
  sito live serve `?v=114` e contiene `buildSegmentedRow` — la roadmap non
  era stata aggiornata dopo il deploy avvenuto a fine sessione 2026-07-29).
- **Prossimo passo:** Guerriero (2/3), Ladro (2/3), Monaco (4/4) e Ranger
  (4/4) fatti nelle sessioni precedenti risultano tutti **committati**
  (verificato il 2026-07-31 con `git log`/`git fetch`: `origin/main` arriva
  fino ad `a1d8ce3`, Monaco — Guerriero/Ladro inclusi — e l'Actions relativo
  è verde; solo il commit Ranger `1536078` restava locale, mai pushato).
  **Chierico ora 4/4 (completo!)**, committato in locale (`9df2c17`, non
  ancora deployato): aggiunti Dominio della Luce, Dominio dell'Inganno e
  Dominio della Guerra (Vita era già fatto) — dati da PHB p.72-76, manuale
  `version` 43→44, cache busting `?v=122`. Un solo incantesimo nuovo nel
  catalogo, **Manto del Crociato** (Crusader's Mantle, mancava per il
  Dominio della Guerra); tutti gli altri 20 incantesimi dei tre domini
  esistevano già nel catalogo (riusati da altre classi) e hanno solo
  ricevuto il tag `'chierico'` in `classes` (stesso criterio già in uso per
  Aura di Vita/Guardia della Morte del Dominio della Vita). Verificato in
  locale: Tratti di un Chierico Dominio della Guerra livello 9 corretti,
  Grimorio con tutti gli 8 incantesimi FISSI del dominio, level-up 2→3 con
  le 4 card Dominio e conferma bloccata finché non se ne sceglie una,
  Tharion invariato, console pulita.
  **Druido ora 3/4** (Luna era già fatto), committato in locale (`10ca780`,
  non ancora deployato): aggiunti Circolo del Mare e Circolo delle Stelle
  (PHB p.86-88), manuale `version` 44→45, cache busting `?v=123`. Nessuna
  risorsa nuova (come i Domini del Chierico): le abilità "X volte pari al
  modificatore di Saggezza" restano descrittive, riusando Forma Selvatica
  già tracciata per le trasformazioni (Ira del Mare, Forma Stellare). 5
  incantesimi esistenti hanno ricevuto il tag `'druido'` (Raggio di Gelo,
  Frantumare, Fulmine, Tenere Mostri, Dardo di Guida); nessun incantesimo
  nuovo nel catalogo. Verificato in locale: Druido Circolo delle Stelle
  livello 10 con Tratti e Grimorio corretti, level-up 2→3 con 3 card
  (Terra correttamente assente), Tharion invariato, console pulita.
  **Circolo della Terra rimandato** (quarto e ultimo del Druido): nel PHB
  richiede una scelta di tipo di terreno (arido/polare/temperato/tropicale)
  da poter cambiare a ogni riposo lungo, con una tabella di incantesimi
  diversa per ciascun tipo — un picker "sotto-scelta dentro la sottoclasse"
  che non esiste ancora nell'app (stessa natura di problema del Cavaliere
  Occulto/Truffatore Arcano). **Deciso con Andrea (2026-07-31): rimandare**,
  si continua con le altre classi.
  **Bardo ora 3/4** (Sapienza era già fatto), committato in locale
  (`ad48d6f`, non ancora deployato): aggiunti Collegio dell'Incanto e
  Collegio del Valore (PHB p.62-66), manuale `version` 45→46, cache busting
  `?v=124`. Incanto è descrittivo come la Sapienza (riusa solo Ispirazione
  Bardica, incantesimi sempre preparati Ammaliare Persone/Immagine
  Speculare al 3° e Comando al 6°, nessuno nuovo nel catalogo). **Valore dà
  davvero Attacco Extra al 6°**, primo caso di privilegio di sottoclasse
  (non di classe) che cambia il numero di colpi: `stats.js` ora legge il
  massimo tra `klass.extraAttacks` e `subclass.extraAttacks` (prima leggeva
  solo la classe), e `engine.js` espone `subclassId` nella view derivata
  (mancava, serviva per il lookup). Verificato: un Bardo Valore di livello 6
  mostra "Attacco Extra: 2 colpi"; **non-regressione doppia** sul cambio di
  motore condiviso — Tharion (Paladino, niente Attacco Extra) e un Guerriero
  di livello 11 (3 colpi, dalla sola tabella di classe) invariati; level-up
  2→3 mostra le 3 card Collegio (Danza correttamente assente); console
  pulita in ogni prova.
  **Collegio della Danza rimandato** (quarto del Bardo): dà una CA
  alternativa a DUE caratteristiche insieme (10+DES+CAR, mai vista finora —
  `unarmoredDefense` di classe supporta solo una) e trasforma i Colpi
  Senz'Armi in un'arma vera (dado Ispirazione + Destrezza al posto del
  danno normale) — una scelta di UX (come mostrarlo nella tabella Attacchi)
  da discutere con Andrea, stessa natura di problema di Circolo della
  Terra/Cavaliere Occulto/Truffatore Arcano.
  **Stregone ora 3/4** (Aberrante era già fatto), committato in locale
  (`c879b5a`, non ancora deployato): aggiunte Stregoneria Meccanica e Magia
  Selvaggia (PHB p.145-148), manuale `version` 46→47, cache busting `?v=125`.
  Entrambe descrittive, riusano solo Punti Stregoneria/Magia Innata già
  tracciati: Meccanica ha incantesimi sempre preparati (8, tutti già nel
  catalogo, solo tag `'stregone'` aggiunto a 8 di essi — Dissolvi Magie ce
  l'aveva già); Magia Selvaggia **non ha incantesimi di sottoclasse** (come
  Sapienza/Valore del Bardo) e la sua Tabella di Impennata (d100) è
  **volutamente non riportata**: il privilegio descrive il meccanismo (tira
  1d20 dopo un incantesimo con slot, con un 20 tiri sulla tabella) senza
  copiare le 100 righe, che restano al Master come già oggi per altri
  dettagli di regia — coerente con la regola di NON riportare testo
  integrale del manuale. Verificato: Tratti/Grimorio di uno Stregone
  Meccanica livello 9 corretti, level-up 2→3 con le 3 card (Draconica
  correttamente assente), Tharion invariato, console pulita.
  **Stregoneria Draconica rimandata** (quarta e ultima dello Stregone):
  Resilienza Draconica dà **due** cose mai viste insieme — PF massimi che
  scalano per LIVELLO DI SOTTOCLASSE (+3 al 3°, poi +1 per ogni livello da
  stregone, non solo la classe) e la stessa CA a due caratteristiche
  (10+DES+CAR) del Collegio della Danza del Bardo. Stessa natura di
  problema, da discutere con Andrea insieme agli altri.
  **Mago ora 3/4** (Divinazione era già fatto), committato (`32f0e48`):
  aggiunte Tradizione dell'Evocazione e Tradizione dell'Illusione (PHB
  p.171-174), manuale `version` 47→48, cache busting `?v=126`. **Rivalutato
  rispetto alla nota precedente**: "danno extra di Evocazione" e "cantrip
  bonus di Illusione" sembravano richiedere lavoro nel motore, ma sono in
  realtà descrizioni pure — l'app non calcola i danni degli incantesimi
  (a differenza degli attacchi con arma), quindi restano prosa come ogni
  altro "+INT a un tiro danni"/"impara un trucchetto in più" già visto. Le
  due tradizioni condividono con Divinazione il privilegio "Sapiente"
  (incantesimi scelti liberamente dalla propria scuola, non una lista
  fissa — niente `spellsByLevel` per questo). **Creature Fantasmatiche**
  dell'Illusionista (6°) è invece un vero grant fisso (Evocare Bestia +
  Evocare Folletto sempre preparati): modellato con `spellsByLevel`, stesso
  trattamento delle altre classi — Evocare Bestia ha ricevuto il tag
  `'mago'` (Evocare Folletto ce l'aveva già). Verificato: Tratti/Grimorio di
  un Mago Illusionista livello 10 corretti (entrambi gli incantesimi FISSI
  ai livelli giusti), level-up 2→3 con le 3 card (Abiurazione correttamente
  assente), Tharion invariato, console pulita.
  **Tradizione dell'Abiurazione rimandata** (quarta e ultima del Mago):
  il Baluardo Arcano è un vero scudo con PF propri (2× livello + mod.
  Intelligenza) che assorbe danno al posto del personaggio e si rigenera
  lanciando incantesimi di Abiurazione — un tipo di risorsa mai visto
  (non "N usi" ma un pool di PF con assorbimento/rigenerazione), unico vero
  blocco di architettura fra le quattro tradizioni del Mago.
  **Warlock ora 4/4 (completo!)** (Grande Antico era già fatto), committato
  (`c0e9202` — da un'altra sessione in parallelo su questa stessa cartella,
  che ha ripreso fedelmente questo lavoro appena finito di verificare):
  aggiunti Patto del Fatato, Patto del Celestiale e Patto dell'Immondo (PHB
  p.157-163), manuale `version` 48→49, cache busting `?v=127`. **Rivalutata
  la nota precedente** (che
  dava per bloccati tutti e tre): Passi del Fatato (Fatato) e Fortuna del
  Signore Oscuro (Immondo) sono "X volte pari al mod. Carisma, riposo
  lungo" — lo stesso pattern lasciato descrittivo in ogni classe di questa
  sessione, nessuna risorsa nuova. **Solo Luce Guaritrice (Celestiale)**
  era un vero pool (dadi da d6, il cui numero scala per LIVELLO — 1+livello
  — non per modificatore), ma **la soluzione esisteva già nel motore**: il
  filtro `subclass` su `classResources` (già usato da Dadi Superiorità/
  Energia Psionica del Guerriero) permette di dichiarare una risorsa che
  vale solo per una sottoclasse specifica. Aggiunta come `healingLight` nei
  `classResources` del Warlock con `subclass: 'celestiale'`, stesso
  `kind:'uses'` con `byLevel` — **zero righe di codice nuove nel motore**.
  L'errore nella nota precedente era pensare che le risorse di sottoclasse
  non fossero supportate: lo sono da quando sono stati modellati Maestro di
  Battaglia/Combattente Psionico del Guerriero, semplicemente non ci si era
  accorti che si applicava anche qui. 30 incantesimi esistenti hanno
  ricevuto il tag `'warlock'` (2 ce l'avevano già); nessun incantesimo
  nuovo nel catalogo. Verificato in locale: Risorse di un Warlock
  Celestiale livello 9 mostrano "Luce Guaritrice 10/10" (1+9, corretto);
  Tratti con Luce Guaritrice (3°) e Anima Radiosa (6°) nell'ordine giusto;
  Grimorio con Cura Ferite/Dardo di Guida FISSI; level-up 2→3 con le 4 card
  Patto, scelta Celestiale applicata senza errori; **doppia
  non-regressione**: Tharion invariato e un Guerriero Maestro di Battaglia
  di prova mostra ancora "Dadi Superiorità 5/5, d8 cad." a livello 7 (il
  filtro `subclass` non è stato toccato, solo riusato) e "Attacco Extra: 2
  colpi"; console pulita in ogni prova.
  Restano da completare: le due sottoclassi rimandate del Guerriero/Ladro
  (incantatore legato alla SOTTOCLASSE con lista del Mago), Circolo della
  Terra (Druido), Collegio della Danza (Bardo), Stregoneria Draconica
  (Stregone) e Tradizione dell'Abiurazione (Mago) sopra (cinque problemi di
  architettura/UX distinti — due sono in realtà la STESSA cosa, la CA a due
  caratteristiche, ricorsa in Danza e Draconica: vale la pena risolverla
  una volta sola per entrambe quando se ne parla con Andrea). Con Warlock
  completo, **tutte e 11 le classi hanno almeno 3 sottoclassi su 4**, e 6 di
  esse (Paladino, Barbaro, Monaco, Ranger, Chierico, Warlock) sono già a
  4/4 complete. Oltre ai collaudi cloud sotto.
  **Nota di sessione (2026-07-31):** un'altra sessione Claude Code stava
  lavorando in parallelo sulla stessa cartella e ha committato di sua
  iniziativa sia il lavoro sul Warlock di cui sopra (`c0e9202`, ripreso
  fedelmente) sia una funzionalità indipendente non tracciata qui
  (`24c1024 feat(oggetti)`, sposta la creazione reliquie dai Tratti alla
  tab Oggetti). Locale a 8 commit avanti su `origin/main`, nessuno pushato:
  da verificare/deployare quando le sessioni in corso saranno concluse.
  Restano in coda due collaudi cloud mai confermati (richiedono Andrea, non
  automatizzabili da sessione): sync multi-device tra due dispositivi con lo
  stesso account, e la verifica nella console Firebase che `manuals/5.5/feats`
  sia arrivato su Firestore (step 4.4 — il sync fallisce in silenzio se la
  regola non è deployata).

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
- [x] 3.6 **Creazione oggetti spostata dai Tratti alla tab Oggetti di
      Tesoreria** — FATTO (2026-07-31, commit `24c1024`, `?v=127`). La
      lista/pulsante "Nuova Reliquia" (prima nei Tratti, senza un vero
      motivo per starci) ora vive nella tab Oggetti di Tesoreria, che
      diventa la prima sotto-tab (prima era l'ultima). Solo spostamento di
      markup + riordino sotto-tab, nessuna logica toccata.
- [x] 3.7 **Card degli oggetti custom in stile "vetrina reliquie" +
      sintonizzazione** — FATTO (2026-07-31, commit `81c889e`, `?v=128`,
      scelto da Andrea tra 3 alternative con preview — vedi Decisioni). Le
      card create dall'utente condividono ora lo stesso markup di Lama
      Vincolante/Scudo Magico (`.relic-acc`/`.relic-card`/`.relic-rarity`
      di `treasury.css`) invece del vecchio stile `.item-card` semplice.
      Nuovi campi: **rarità** (5 livelli, badge colorato) e **arte** scelta
      da galleria di medaglioni o foto caricata (ritagliata in cerchio via
      `FileReader`). Nuova **sintonizzazione**: un oggetto può richiederla
      (`requiresAttunement`), in tal caso nasce non sintonizzato
      (`attuned:false`) — arte/nome smorzati, effetti non contati in
      `modSum`/risorse (`js/engine.js`) finché non lo sintonizzi dalla
      gemma sulla testata dell'accordion; **massimo 3 sintonizzati insieme**
      (`MAX_ATTUNED`). Retrocompatibilità con oggetti salvati prima del
      redesign (fallback `itemArtOf`/`itemRarityOf`/`itemRequiresAttunementOf`/
      `itemAttunedOf` in `js/items.js`). Verificato con un harness HTML
      isolato che carica i moduli reali con dati finti (il gate di login
      impediva il test diretto in app).
- [x] 3.8 **8 arti preimpostate ridisegnate come illustrazioni vere** —
      FATTO (2026-07-31, commit `47a8378`, `?v=129`). Le icone piatte a
      tratto sono sostituite da 8 illustrazioni disegnate a mano nella
      stessa tecnica di Lama Vincolante/Scudo Magico (glow radiale,
      gradienti multipli, gemma con riflesso) — `PRESET_ART` in
      `js/items.js`. Spada e Scudo riusano **esattamente** l'arte delle due
      reliquie storiche (stessi path/gradienti); le altre 6 (anello,
      amuleto, mantello, bacchetta, pozione, tomo) sono originali, scelte
      tra alternative con preview (vedi Decisioni) — amuleto e mantello
      hanno avuto un secondo giro dopo un riferimento visivo mandato da
      Andrea (non copiato, solo composizione: cappuccio, drappeggio, fodera
      visibile, collare lavorato).
- [ ] 3.9 **Estensione degli effetti che un oggetto custom può modificare**
      — IN CORSO (avviato 2026-07-31, Tranche 1 fatta lo stesso giorno,
      Tranche 2 non ancora iniziata). L'app non tira mai i dadi:
      "vantaggio" è sempre e solo una nota testuale (già vero oggi per
      Scudo Magico: "Vantaggio ai tiri di iniziativa" è testo nella lista
      effetti, non un modificatore), non un calcolo — questo abbassa molto
      la difficoltà reale di gran parte della lista sotto (vedi Decisioni
      per il dettaglio completo e il confronto col compendio
      dungeonedraghi.it usato come riferimento). Tre tranche:
  - [x] 3.9.a **Tranche 1 (facile, priorità alta)** — FATTO (2026-07-31,
        `?v=130`, non ancora committato/deployato a fine sessione). Nuovo
        effetto a **testo libero** (`{ text: '...' }` invece di
        `{ target, value }`) nella scheda di creazione, accanto a quelli
        numerici — pulsante separato "+ Aggiungi testo libero", riga con un
        semplice `<input>` al posto di select+stepper; `modSum` lo ignora da
        solo (non ha `target` da confrontare, nessuna modifica al motore
        necessaria); righe vuote scartate al salvataggio. Nuovi bersagli
        numerici **Velocità** (`engine.js`, riga `speedM`) e **Percezione
        passiva** (`engine.js`, riga `passivePerception`), un rigo ciascuno
        (`+ modSum(ch, 'velocita'/'pp')`). Verificato con un harness che
        carica i moduli reali (`config.js`+`manual-55.js`+`engine.js`+
        `storage.js`+`items.js`) e lo stato di default (Tharion): velocità
        base 9 m → 12 m con un oggetto di test a +3 sintonizzato; percezione
        passiva base 13 → 18 con un oggetto di test a +5; **ricreati per
        prova Lama Vincolante e Scudo Magico** dalla funzionalità (bersagli
        numerici per i +1 a colpire/danni/incantesimi, testo libero per
        "Vantaggio contro Spaventato, Prono, Spinto" e "Vantaggio ai tiri di
        iniziativa") — bullet indistinguibile da quelli delle due reliquie
        vere. Nessun errore console in nessuno stato provato.
  - [ ] 3.9.b **Tranche 2 (media)**:
    - [x] **Resistenze & Immunità con tag strutturati** — FATTO
          (2026-07-31, `?v=131`, scelta la variante **A** tra 3 alternative
          con preview — chip preimpostate — invece di tag libero o di un
          prefisso riconosciuto nel testo libero già esistente, per non
          rischiare varianti tipo "Fuoco"/"fuoco" che non si aggregano).
          Nuovi campi `item.resistances`/`item.immunities` (array di
          stringhe), scelti da due gruppi di chip nella scheda di
          creazione: "Resistenza a" coi 13 tipi di danno del PHB 2024,
          "Immunità a" con gli stessi 13 più le 6 condizioni più comuni
          (una resistenza a una condizione non esiste nelle regole, da qui
          la lista più corta per le resistenze). Nuova card "Resistenze &
          Immunità" in Caratteristiche (`index.html`, nascosta se vuota),
          renderizzata da `renderResistances()` in `js/stats.js`: raccoglie
          i tag da tutti gli oggetti **attivi** (stesso criterio di
          sintonizzazione di `modSum`), un tag per fonte con il nome
          dell'oggetto a fianco, nessun merge tra oggetti diversi.
          Verificato con harness che carica l'app reale per intero
          (`config`+`manual-55`+`engine`+`storage`+`stats`+`items.js`) sui
          dati di default: due oggetti sintonizzati mostrano i loro tag,
          un terzo oggetto con la stessa resistenza ma **non** sintonizzato
          resta escluso, come atteso. Nessun errore console.
    - [ ] **Competenza extra concessa dall'oggetto** (abilità o TS) — non
          ancora iniziata: tocca la logica di competenze in `stats.js`,
          più delicata perché interagisce con le competenze di classe già
          esistenti.
    - [x] **Sensi strutturati** (Scurovisione N m, Vista Cieca...) — FATTO
          (2026-07-31, `?v=132`, fatta prima della competenza extra perché
          più semplice/meno rischiosa, stesso impianto delle chip appena
          fatto per resistenze/immunità). Nuovo campo `item.senses` (array
          di `{ type, rangeM }`), 4 sensi del PHB 2024 (Scurovisione, Vista
          Cieca, Vista Vera, Percezione del Tremore) in righe ripetibili
          (select + stepper in metri, stesso pattern della sezione
          Effetti). **Differenza importante da resistenze/immunità**: un
          senso non si somma tra oggetti — nelle regole vale il raggio
          migliore, non tutti insieme — quindi `renderSenses()` in
          `js/stats.js` fa dedup per tipo tenendo il massimo (e la fonte
          che lo fornisce), invece di elencare ogni fonte come per le
          resistenze. Nuova card "Sensi" in Caratteristiche (nascosta se
          vuota). Verificato con harness: due oggetti con Scurovisione a
          18 m e 36 m → in card resta solo "Scurovisione 36 m" con la
          fonte giusta; un terzo oggetto non sintonizzato resta escluso.
          Nessun errore console.
  - [ ] 3.9.c **In sospeso, da valutare se ha senso**: incantesimi
        lanciabili dall'oggetto integrati col Grimorio (grosso lavoro per
        un caso d'uso raro); cambio del tipo di danno dell'arma; effetti a
        livelli/tier che si sbloccano (il meccanismo di Lama Vincolante);
        trigger narrativi condizionali ("quando colpisci un nemico
        Maledetto, danni extra") — probabilmente da lasciare per sempre
        solo testo descrittivo, non ha senso modellarli uno per uno.

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
      - **Equipaggiamento** — alternativa **B** ("raggruppate per Maestria")
        tra 3 con preview: le card dei pacchetti A/B (classe e background)
        restavano già ben fatte, il punto debole era sotto — "Maestria
        nelle Armi" con una classe competente in tutto (es. Paladino, 38
        armi) era un'unica fila lunghissima, stesso problema già risolto
        per le Competenze col Bardo. Qui il raggruppamento non è per
        categoria (l'alternativa A avrebbe comunque lasciato gruppi da
        ~10 armi) ma per **maestria** (Vex, Sap, Nick…), con la descrizione
        reale di ognuna dal manuale (`weaponMasteries[m].desc`) — 8 gruppi
        piccoli invece di una fila di 38, e si impara cosa fa l'arma mentre
        si sceglie. Nuova `buildMasteryPicker()` in create.js (sostituisce
        la chiamata a `buildSpellPicker` generica per questo solo picker) +
        `.mastery-group/-head/-desc` in create.css. Verificato: Paladino
        (38 armi, 8 gruppi) → Ascia bipenne (Cleave) + Falcione (Graze)
        selezionate, cap corretto (37/39 chip disabilitate), console pulita,
        avanzamento a Sottoclasse/Incantesimi regolare. `?v=110`.
      - **Sottoclasse e Incantesimi** — alternativa **C** ("righe con
        descrizione a comparsa") tra 3 con preview: qui raggruppare non
        bastava (già provato due volte). Il problema è diverso — un Bardo
        sceglie 4 preparati fra 23 nomi, ma a differenza di un'abilità o
        un'arma il nome di un incantesimo ("Sussurri Dissonanti") non dice
        cosa fa, si scopriva solo dopo in scheda. Ogni riga si tocca per
        aprire/leggere la descrizione reale (stesso meccanismo già approvato
        per il Background, bg-row/bg-row-body) e ha una spunta separata per
        scegliere — si può leggere senza scegliere.
        `buildSpellPicker()` (condivisa da questo passo e dai due picker di
        Iniziato alla Magia nel Background) ora sceglie da sola righe
        espandibili o chip piatte a seconda che gli elementi abbiano un
        campo `desc` (incantesimi veri) o no (caratteristiche/competenze/
        lingue, restano chip): nessuna firma di funzione cambiata, zero
        tocchi agli altri 6 call site non-incantesimo. Nuove
        `.spell-list/-row/-head/-check/-name/-meta/-chevron/-desc` in
        create.css. **Bug trovato e corretto in sessione**: il tag del
        tempo di lancio tagliava solo al primo "·", ma per le Reazioni il
        grilletto sta tra parentesi PRIMA del primo "·" (es. "Reazione (a
        una caduta tua...)"), quindi restava lunghissimo e sovrapposto al
        nome — tagliato anche al primo "(". Verificato: Bardo (36 righe fra
        trucchetti e preparati) → espandere "Amici" ne mostra la
        descrizione reale senza selezionarlo, selezionare 2 trucchetti
        disabilita gli altri 11 lasciando intatta la sezione preparati
        (0/4), la riga resta espansa dopo il refresh; Chierico → stesso
        meccanismo nel picker di Iniziato alla Magia del Background (24
        righe, 2 trucchetti + 1 preparato scelti correttamente); "Piuma
        Cadente" (Reazione) mostra ora solo "Reazione", non più il
        grilletto per esteso. Console pulita in ogni prova. `?v=112`.
      - **Identità (Allineamento)** — FATTO (2026-07-29). Iniziato con 3
        alternative con preview (righe di chip invariate con piccoli tocchi
        mirati), ma Andrea ha chiesto uno stile diverso durante la
        discussione: un **controllo a scorrimento** (segmented control) con
        un rettangolo dorato che scivola sopra Legge/Morale, ispirato a uno
        screenshot mostrato in chat (interfaccia di un altro prodotto — solo
        l'idea del cursore ripresa, non il suo stile a pergamena) e poi
        esteso su richiesta per supportare anche il **trascinamento**, non
        solo il tocco diretto. **Rimosso di proposito l'avviso statico**
        sulle combinazioni Malvagio ("verificate col Master…"): l'utente
        sceglie liberamente, nessuna opzione ha un trattamento diverso dalle
        altre. Nuova `buildSegmentedRow()` in create.js (sostituisce
        `buildSingleChoiceRow`, rimossa) + `.seg-track/-highlight/-opt` in
        create.css.
        **Bug trovato e corretto in sessione**: `track.setPointerCapture()`
        veniva chiamato PRIMA di registrare la scelta — se la capture
        falliva (succede con alcuni pointer id non standard), l'intero
        gestore si interrompeva e il tocco non selezionava nulla. Risolto
        mettendo la capture in un try/catch che non blocca il resto: il
        tocco sceglie comunque, nel peggiore dei casi il trascinamento fuori
        dal binario è solo meno fluido. Verificato: tocco diretto su
        "Legale" e "Malvagio" seleziona entrambi correttamente (stesso
        trattamento visivo, nessun colore diverso), il riepilogo si aggiorna
        ("Allineamento: Legale Malvagio"), tornare sul passo con una scelta
        già fatta la mostra subito senza ripartire da vuoto, "Crea
        personaggio" si abilita al completamento. Console pulita. `?v=114`.
      **Con questo il restyling visivo dei 7 passi del wizard (Specie →
      Identità) è completo.**

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
   → **Sottoclassi mancanti, 2 di 3 fatte (2026-07-30, manuale `version`
     39→40)**: **Maestro di Battaglia** (p.93-95 del PDF) e **Combattente
     Psionico** (p.98-99) aggiunte — resta **Cavaliere Occulto**, rimandato
     perché richiede un incantatore legato alla SOTTOCLASSE (non alla classe,
     che qui è `casterType:'none'`) con una propria tabella di slot (un
     "terzo" di incantatore, diverso da full/half/pact) e la lista
     incantesimi del Mago invece che una propria — architettura non ancora
     supportata dal motore, servirà un passo a parte.
     - **Bug di fuga tra sottoclasse trovato e chiuso, non solo del
       Guerriero**: `classResources` viveva solo a livello di CLASSE, mai di
       sottoclasse — esattamente il difetto già presente (poi corretto il
       2026-07-30, vedi "Bug risolti") per l'Arma Sacra del Paladino. Qui però
       diventava concreto subito: i Dadi Superiorità del Maestro di Battaglia
       sarebbero comparsi anche a un Campione. Aggiunto un filtro `subclass`
       generico in `engine.js` (una risorsa con quel campo compare solo se
       `character.subclassId` combacia): **Dadi Superiorità** (Maestro di
       Battaglia, 4d8→5d8 al 7°→6d8 al 15°, dado d8→d10 al 10°→d12 al 18°) e
       **Dadi di Energia Psionica** (Combattente Psionico, 4d6 al 3°→6d8 al
       5°→8d8 al 9°→8d10 all'11°→10d10 al 13°→12d12 al 17°) usano entrambe il
       filtro. Nuovo `dieByLevel` generico in `engine.js` (il dado del
       singolo uso cresce col livello, mostrato nella card come "d8 cad." —
       stesso principio di 'hd', generalizzato).
     - **Meccanica nuova: Manovre**. Catalogo top-level `manual.maneuvers`
       (tutte e 20 del PHB — qui non serviva una selezione curata come per
       Metamagia/Invocazioni, la lista del Maestro di Battaglia è già di per
       sé completa). `choicePoints.maneuvers` nella stessa forma {level,
       count} di Competenza/Metamagia/Invocazioni, ma con un `subclass` in
       più: a differenza di quelle (di CLASSE), le Manovre sono la PRIMA
       scelta di questo tipo legata a una sottoclasse, e il livello in cui si
       impara (3°) è lo STESSO in cui si sceglie la sottoclasse nella stessa
       schermata — quindi il picker non può sapere subito se serve, deve
       aspettare la scelta. Risolto con un contenitore dinamico
       (`refreshManeuverSection()` in `levelup.js`, richiamata dal click
       sulla riga di Sottoclasse) che mostra "Manovre — scegline N" solo se
       la sottoclasse scelta è Maestro di Battaglia, vuoto per le altre.
       Nuovo campo `character.maneuverIds`.
     - **Verifica end-to-end**: Guerriero iniettato a livello 2, level-up
       simulato a 3 — cliccando "Campione" nessuna sezione Manovre compare;
       cliccando "Maestro di Battaglia" compare subito "Manovre — scegline
       3" con le 20 righe, 3 scelte e salvate correttamente; a Risorse
       compare "Dadi Superiorità — d8 cad. — 4/4"; passando lo stesso
       personaggio a sottoclasse Combattente Psionico, "Dadi Superiorità"
       sparisce e compare "Dadi di Energia Psionica — d6 cad. — 4/4" (prova
       diretta che il filtro `subclass` funziona in entrambe le direzioni).
       Tharion (Paladino) verificato invariato con `AppEngine.derive` sui
       dati puri di `config.js` (CA 20, CD 15, PF 60, Imposizione 35).
       Console pulita in ogni prova. Cache busting `?v=118`.
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
   → **Sottoclassi mancanti, 2 di 3 fatte (2026-07-30, manuale `version`
     40→41)**: **Assassino** (p.134 del PDF) e **Spadanima** (p.135)
     aggiunte — resta **Truffatore Arcano** (p.132), rimandato come il
     Cavaliere Occulto del Guerriero: incantatore legato alla SOTTOCLASSE con
     lista incantesimi del Mago, stessa architettura non ancora supportata.
     Assassino è tutto narrativo (nessuna risorsa dedicata). Spadanima ha i
     **Dadi di Energia Psionica** (stessa tabella del Combattente Psionico
     del Guerriero: 4d6 al 3°→6d8 al 5°→8d8 al 9°→8d10 all'11°→10d10 al
     13°→12d12 al 17° — coincidenza del PHB, non duplicazione: sono due
     classi diverse, ognuna con la propria copia dei dati), col filtro
     `subclass` già introdotto per il Guerriero (nessun codice nuovo nel
     motore, solo dati). Verificato: Ladro iniettato a livello 2, level-up a
     3 con scelta fra le 3 sottoclassi (Truffatore Arcano assente dalla
     lista); scegliendo Spadanima compare "Dadi di Energia Psionica" a
     Risorse col dado giusto per livello; scegliendo Assassino nessuna
     risorsa indesiderata. Tharion (Paladino) e Guerriero (Blocco 5.C
     precedente) verificati invariati. Console pulita. Cache busting `?v=119`.
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
   → **Sottoclassi mancanti, tutte e 3 fatte in un colpo solo (2026-07-30,
     manuale `version` 41→42)**: **Guerriero della Misericordia**,
     **Guerriero dell'Ombra** e **Guerriero degli Elementi** (PHB p.104-106)
     completano le 4 del Monaco insieme a Mano Aperta. La più semplice delle
     "quattro rimanenti" viste finora: tutte e tre usano solo i Punti Focus
     già tracciati dalla classe, **nessun filtro `subclass` per
     classResources necessario** (a differenza di Guerriero/Ladro) — quindi
     fatte tutte insieme invece che una alla volta. "Shadowy Figments"
     (Ombra) e "Manipulate Elements" (Elementi) — un trucchetto sempre noto
     con Saggezza come caratteristica — restano descrittivi in prosa: il
     Monaco non è un incantatore, non c'è un grimorio a cui agganciarli.
     Verificato: Monaco iniettato a livello 2, level-up a 3 con le 4
     sottoclassi tutte a scelta, scegliendo Ombra la card "Arti dell'Ombra"
     compare in Tratti (e "Passo Ombroso", privilegio del 6°, correttamente
     assente a livello 3); Punti Focus identici (6/6 a livello 6) per tutte e
     4 le sottoclassi, nessuna risorsa spuria. Tharion (Paladino) verificato
     invariato. Console pulita. Cache busting `?v=120`.
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
   → **Sottoclassi mancanti, tutte e 3 fatte (2026-07-30, manuale `version`
     42→43)**: **Domatore di Bestie**, **Vagabondo Fatato** e **Cercatore
     d'Ombre** (PHB p.122-127) completano le 4 del Ranger insieme a
     Cacciatore. Domatore di Bestie resta descrittivo in prosa: il Compagno
     Primordiale è un vero secondo statblock da tracciare (come il Destriero
     del Paladino, ma un sistema dedicato per una seconda classe è un lavoro
     a parte) — stessa scelta di semplicità già fatta altrove per meccaniche
     fuori dalla portata di una scheda a personaggio singolo.
     - **Meccanica riusata, non nuova**: Colpo Terrificante (Cercatore
       d'Ombre, dal 3°) e Passo Fatato Libero (Vagabondo Fatato, dal 15°)
       sono risorse scalate sul modificatore di Saggezza — stesso principio
       dell'Ispirazione Bardica — ma **con un `from`** (il Passo Fatato
       Libero non esiste prima del 15°). `resMax()` in `engine.js` non
       supportava `from` insieme ad `abilityMod` (l'Ispirazione Bardica è
       attiva dal 1°, non serviva): aggiunto, generico, nessuna regressione
       per Ispirazione Bardica (nessun `from` = comportamento identico).
     - **Meccanica nuova nel motore: bonus di sottoclasse all'Iniziativa**.
       Il Cercatore d'Ombre somma il modificatore di Saggezza ai tiri di
       iniziativa — il primo bonus di sottoclasse che non è su TS/danni/CA
       ma sul tiro di iniziativa stesso. Aggiunto `CLASS_BONUSES.ranger.
       gloomInit` (stesso registry già usato per Arma Sacra/Aura di
       Protezione) e la riga `initiative` in `derive()` ora lo somma, filtrato
       per sottoclasse.
     - **Verifica end-to-end**: Ranger di prova a livello 3 — level-up con
       le 4 sottoclassi a scelta, scegliendo Cercatore d'Ombre: "Colpo
       Terrificante 3/3" a Risorse (SAG 16 → mod 3), iniziativa **+6** in
       header (DES +3 + SAG +3, prima sarebbe stata +3 senza il bonus);
       Cacciatore (nessun bonus) resta a sola iniziativa da Destrezza, nessuna
       risorsa spuria. Tharion (Paladino) verificato invariato in tutto,
       inclusa l'iniziativa (−1, DES 8, il ramo `gloomInit` non lo tocca).
       Console pulita. Cache busting `?v=121`.
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
   → **Completato con gli altri 3 Domini (2026-07-31), `?v=122`, manuale
     `version` 43→44.** Il Chierico ne ha 4 nel PHB (Vita, Luce, Inganno,
     Guerra); mancavano gli altri tre. Aggiunti ai dati:
     - **Dominio della Luce** (p.73-74): Irradiare l'Alba + Bagliore di
       Guardia a 3, Bagliore di Guardia Migliorato a 6, Corona di Luce a 17;
       incantesimi Mani Ardenti/Fuoco Fatuo/Raggio Infuocato/Vedere
       l'Invisibile, Luce Diurna/Palla di Fuoco, Occhio Arcano/Muro di
       Fuoco, Colonna di Fiamma/Scrutare.
     - **Dominio dell'Inganno** (p.74-75): Benedizione dell'Ingannatore +
       Invocare Duplicità a 3, Trasposizione dell'Ingannatore a 6, Duplicità
       Migliorata a 17; incantesimi Ammaliare Persone/Travisamento/
       Invisibilità/Passo senza Tracce, Motivo Ipnotico/Non Individuazione,
       Confusione/Porta Dimensionale, Dominare Persona/Modificare Memoria.
     - **Dominio della Guerra** (p.75-76): Colpo Guidato + Sacerdote di
       Guerra a 3, Benedizione del Dio della Guerra a 6, Avatar di Battaglia
       a 17; incantesimi Dardo di Guida/Arma Magica/Scudo della Fede/Arma
       Spirituale, Manto del Crociato/Guardiani Spirituali, Scudo di
       Fuoco/Libertà di Movimento, Tenere Mostri/Colpo del Vento d'Acciaio.
     Nessuna risorsa nuova in nessuno dei tre: le abilità "X volte pari al
     modificatore di Saggezza" restano descrittive in prosa, stesso
     trattamento già dato a Vita (Preservare la Vita) e alle altre classi.
     **Un solo incantesimo nuovo nel catalogo**: Manto del Crociato
     (Crusader's Mantle, PHB p.74 — mancava, serviva solo qui), riassunto
     originale con `classes: ['paladino', 'chierico']` (è anche uno
     spell di classe del Paladino, non solo un dono del Dominio). Tutti gli
     altri 20 incantesimi dei tre domini esistevano già nel catalogo
     (condivisi con Bardo/Stregone/Mago/Druido/Ranger/Warlock/Paladino) e
     hanno ricevuto solo il tag `'chierico'` aggiunto a `classes`, stesso
     criterio già usato per Aura di Vita/Guardia della Morte nel Dominio
     della Vita (un Dominio dà accesso a un incantesimo anche se non è
     nella lista base del Chierico). **Bug evitato, non introdotto**: prima
     di aggiungere ogni incantesimo ho controllato il catalogo esistente
     per nome/descrizione — 5 dei "nuovi" spell previsti (Burning Hands,
     Scorching Ray, Flame Strike, Disguise Self, Hold Monster) esistevano
     già sotto traduzioni diverse da quelle attese (Mani Ardenti, Raggio
     Infuocato, Colonna di Fiamma — quest'ultima già taggata `chierico` da
     prima —, Travisamento, Tenere Mostri): evitati 5 doppioni.
     Verificato in locale: Chierico di prova livello 9 Dominio della Guerra
     — Tratti mostrano Colpo Guidato/Sacerdote di Guerra (liv. 3) e
     Benedizione del Dio della Guerra (liv. 6) nell'ordine giusto (Avatar di
     Battaglia liv. 17 correttamente assente); Grimorio mostra tutti gli 8
     incantesimi del dominio come FISSI nelle rispettive schede di livello,
     inclusa Manto del Crociato con meta corretta; level-up 2→3 mostra le 4
     card Dominio (Vita/Luce/Inganno/Guerra) con "Conferma" bloccato finché
     non se ne sceglie una, scegliendo Guerra applica livello 3 e PF
     17→24; Tharion (Paladino) verificato invariato (CA 20, PF 60). Console
     pulita in ogni prova.
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
   → **Completato con Mare e Stelle (2026-07-31), `?v=123`, manuale
     `version` 44→45.** Il Druido ne ha 4 nel PHB (Terra, Luna, Mare,
     Stelle); Luna c'era già. Aggiunti ai dati:
     - **Circolo del Mare** (p.86-87): Ira del Mare a 3 (spende un uso di
       Forma Selvatica per un'Emanazione di spruzzi oceanici, danno Freddo
       + spinta), Affinità Acquatica a 6 (Emanazione più grande + velocità
       di nuoto), Nato dalla Tempesta a 10 (velocità di volo + resistenze
       mentre attiva), Dono Oceanico a 14 (Emanazione su un alleato);
       incantesimi Nube di Nebbia/Raffica di Vento/Raggio di Gelo/
       Frantumare/Onda Tonante, Fulmine/Respirare in Acqua, Controllare
       Acqua/Tempesta di Ghiaccio, Evocare Elementale/Tenere Mostri.
     - **Circolo delle Stelle** (p.87-88): Mappa Stellare a 3 (Guida e
       Dardo di Guida sempre preparati, lanci gratis di Dardo di Guida pari
       al mod. Saggezza), Forma Stellare a 3 (spende un uso di Forma
       Selvatica per una forma luminosa con 3 costellazioni a scelta:
       Arciere/Calice/Drago), Presagio Cosmico a 6 (reazione fausta/infausta
       pari al mod. Saggezza), Costellazioni Scintillanti a 10 (potenzia le
       3 costellazioni), Piena di Stelle a 14 (resistenza fisica). Nota: a
       differenza degli altri circoli, le Stelle non hanno una tabella di
       incantesimi che sale con il livello — solo i due fissi di Mappa
       Stellare al 3°, l'unico caso del genere fra tutte le sottoclassi
       modellate finora.
     Nessuna risorsa nuova in nessuno dei due, come già per i Domini del
     Chierico: le abilità "X volte pari al modificatore di Saggezza"
     restano descrittive in prosa, e le trasformazioni (Ira del Mare, Forma
     Stellare) riusano semplicemente un uso di Forma Selvatica già
     tracciata, stesso principio del Passo Lunare/Passo Ombroso di altre
     sottoclassi. **Nessun incantesimo nuovo nel catalogo**: tutti e 11 gli
     incantesimi dei due circoli esistevano già (condivisi con
     Ranger/Stregone/Mago/Bardo/Chierico); 5 di questi (Raggio di Gelo,
     Frantumare, Fulmine, Tenere Mostri, Dardo di Guida) hanno ricevuto solo
     il tag `'druido'` aggiunto a `classes`.
     **Circolo della Terra deliberatamente rimandato**: richiede una scelta
     di tipo di terreno (arido/polare/temperato/tropicale) ricalcolabile a
     ogni riposo lungo, con una tabella di incantesimi diversa per tipo — un
     meccanismo di "sotto-scelta dentro la sottoclasse" che l'app non ha
     ancora (i tre circoli fatti finora, come i quattro Domini del Chierico,
     hanno tutti un'unica tabella fissa). Stessa natura di problema del
     Cavaliere Occulto/Truffatore Arcano rimandati: serve una decisione di
     design con Andrea (dove vive il picker, se va davvero ricalcolato ogni
     riposo lungo o scelto una volta) prima di modellarlo.
     Verificato in locale: Tratti di un Druido Circolo delle Stelle livello
     10 mostrano Mappa Stellare/Forma Stellare (3°), Presagio Cosmico (6°) e
     Costellazioni Scintillanti (10°) nell'ordine giusto (Piena di Stelle,
     14°, correttamente assente); Grimorio mostra Guida e Dardo di Guida
     FISSI; level-up 2→3 mostra le 3 card Circolo (Luna/Mare/Stelle, Terra
     correttamente assente) con "Conferma" bloccato finché non se ne
     sceglie una; Tharion (Paladino) verificato invariato (CA 20, PF 60).
     Console pulita in ogni prova.
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
   → **Completato con Incanto e Valore (2026-07-31), `?v=124`, manuale
     `version` 45→46.** Il Bardo ne ha 4 nel PHB (Danza, Incanto, Sapienza,
     Valore); Sapienza c'era già. Aggiunti ai dati:
     - **Collegio dell'Incanto** (p.62-63): Magia Ammaliante + Manto
       d'Ispirazione a 3, Manto della Maestà a 6, Maestà Incrollabile a 14;
       incantesimi sempre preparati Ammaliare Persone/Immagine Speculare al
       3° e Comando al 6° (tutti e tre già nel catalogo con `bardo` in
       `classes`, nessun tag da aggiungere). Descrittivo come la Sapienza:
       l'idea iniziale che avesse bisogno di "risorse dedicate nuove" era
       sbagliata — ogni abilità è "1/riposo lungo, ripristinabile spendendo
       Ispirazione Bardica o uno slot", stessa prosa già usata per
       Recupero Arcano del Mago, nessuna card nuova.
     - **Collegio del Valore** (p.65-66): Ispirazione in Combattimento +
       Addestramento Marziale a 3, **Attacco Extra a 6**, Magia da Battaglia
       a 14. Nessun incantesimo di dominio (come la Sapienza).
     **Unico vero cambio al motore di questa sessione**: Attacco Extra dato
     da una SOTTOCLASSE (non dalla classe) non era mai capitato — la card
     "Attacco Extra: N colpi" in `stats.js:338` leggeva solo
     `klass.extraAttacks[livello]`. Ora legge il **massimo** fra
     `klass.extraAttacks` e il nuovo `subclass.extraAttacks` (`[0×6, 1×15]`
     per Valore, flat dal 6° in poi, senza ulteriori soglie come
     Guerriero/Barbaro). Per poterlo leggere serviva anche `subclassId`
     nella view derivata — mancava del tutto in `engine.js` (l'oggetto
     restituito da `derive()` aveva solo `classId`), aggiunto come singolo
     campo. Cambio piccolo ma è la prima volta in questa serie di sessioni
     che si tocca `stats.js`/`engine.js` invece dei soli dati: **verificato
     con doppia non-regressione** oltre al test diretto — un Bardo Valore
     di prova a livello 6 mostra "Attacco Extra: 2 colpi"; Tharion
     (Paladino, che non ha Attacco Extra) invariato; un Guerriero di prova a
     livello 11 mostra ancora "3 colpi" (dalla sola tabella di classe, la
     sottoclasse Guerriero non ne ha una propria) — il `Math.max` non altera
     nessuna classe che aveva già l'Attacco Extra solo di classe.
     **Collegio della Danza rimandato** (quarto e ultimo del Bardo): dà CA
     alternativa a **due** caratteristiche insieme (10+DES+CAR — finora
     `unarmoredDefense` di classe ne supporta solo una, es. COS per Barbaro)
     e trasforma i Colpi Senz'Armi in un'arma vera con dado Ispirazione +
     Destrezza al posto del danno normale: non solo dati, richiede una
     scelta di UX su come mostrarlo nella tabella Attacchi, da discutere con
     Andrea (stessa natura di problema di Circolo della Terra/Cavaliere
     Occulto/Truffatore Arcano — **deciso di rimandare anche questo,
     2026-07-31**).
     Verificato in locale: Tratti di un Bardo Collegio del Valore livello 6
     mostrano Ispirazione in Combattimento/Addestramento Marziale (3°) e
     Attacco Extra (6°) nell'ordine giusto; level-up 2→3 mostra le 3 card
     Collegio (Danza correttamente assente); Tharion e un Guerriero di prova
     invariati come sopra; console pulita in ogni prova.
9. [x] **Stregone** (full) — Punti Stregoneria, Metamagia.
   → **Fatto (2026-07-30, manuale `version` 36→37)**: privilegi 1→20 dal PDF
   (p.138-141), sottoclasse **Stregoneria Aberrante** (p.144, la più semplice
   delle 4 — Meccanica/Draconica/Magia Selvaggia in seguito: Draconica
   richiederebbe CA senz'armatura e PF max per-livello a scala di sottoclasse,
   non solo di classe, Magia Selvaggia una tabella d100), equipaggiamento
   iniziale (Lancia + 2 Pugnali + Focus Arcano + Kit dell'esploratore
   sotterraneo, oppure 50 MO), competenze di classe in `CLASS_SKILLS`
   (create.js).
   - **Punti Stregoneria e Magia Innata**: entrambi `classResources` di tipo
     `kind:'uses'` — stessa idea dei Punti Focus del Monaco (un pool speso in
     quantità variabile, click-decremento a 1 comunque corretto). Zero codice
     nuovo nel motore: la tabella `sorceryPoints` esisteva già nei dati base
     della classe (verificata contro il PDF, combacia cifra per cifra).
   - **Meccanica nuova: Metamagia**. Prima non esisteva un modo per
     rappresentare "scegli N opzioni da un catalogo, ai livelli 2/10/17".
     Nuovo catalogo top-level `manual.metamagic` (10 opzioni, PHB p.141-142,
     nomi tradotti liberamente) + `choicePoints.metamagic` nella stessa forma
     `{level,count}` già usata da Competenza (Ladro/Bardo/Ranger). Nuova
     sezione `buildMetamagicSection()` in `levelup.js`, gemella di
     `buildExpertiseSection()` (righe cliccabili come i talenti, cap a
     `count`, disabilitazione cross-opzione): nessuna astrazione nuova,
     stesso pattern già collaudato. Nuovo campo `character.metamagicIds`
     (default `[]` in `BASE_CHARACTER`, storage.js).
   - **Verifica end-to-end**: creazione di un Stregone Umano/Soldato da zero
     nel wizard reale (Punteggi: riga "Attacca con Carisma · TS: Costituzione,
     Carisma" corretta; Competenze: Arcano/Inganno/Intuizione/Intimidire/
     Persuasione/Religione raggruppate per caratteristica governante, Atletica
     e Intimidire escluse perché già dal background; Equipaggiamento: card A
     col Kit dello Stregone, nessun picker di Maestria — corretto, la classe
     non ce l'ha; Incantesimi: "Trucchetti (scegline 4)" + "Incantesimi
     preparati di 1° livello (scegline 2)", nota "la sottoclasse si sceglie al
     livello 3"). Personaggio generato: PF 9 = 1d6+COS, "Senza armatura" in
     CA, nessuna card Punti Stregoneria a Risorse (0 finché non si arriva al
     2° livello — corretto). Level-up 1→2 simulato: guadagni "PF 9→16",
     "Punti Stregoneria 0→2", "Slot Incantesimi 2→3", "Incantesimi Preparati
     2→4", sezione "Metamagia — scegline 2" con le 10 opzioni, scelte
     Incantesimo Sottile + Gemellato applicate e salvate in `metamagicIds`/
     `levelChoices`, card "Punti Stregoneria 2/2" comparsa da sola a Risorse
     accanto a "Magia Innata 2/2". Tharion (Paladino) verificato invariato
     dopo ogni prova (CA 20, CD 15, PF 60, Imposizione 35, TS CAR +9).
     Console pulita in ogni prova. Cache busting `?v=115`.
   → **Completato con Meccanica e Magia Selvaggia (2026-07-31), `?v=125`,
     manuale `version` 46→47.** Lo Stregone ne ha 4 nel PHB (Aberrante,
     Draconica, Meccanica, Magia Selvaggia); Aberrante c'era già. Aggiunte:
     - **Stregoneria Meccanica** (p.145-146): Ripristinare l'Equilibrio +
       Manifestazioni dell'Ordine a 3, Baluardo della Legge a 6, Trance
       dell'Ordine a 14, Cavalcata Meccanica a 18; incantesimi sempre
       preparati Aiuto/Allarme/Ristorare Inferiore/Protezione dal Male e dal
       Bene, Dissolvi Magie/Protezione dall'Energia, Libertà di
       Movimento/Evocare Costrutto, Ristorare Superiore/Muro di Forza — tutti
       e 8 già nel catalogo (7 hanno ricevuto solo il tag `'stregone'`,
       Dissolvi Magie ce l'aveva già).
     - **Magia Selvaggia** (p.147-148): Impennata di Magia Selvaggia + Maree
       del Caos a 3, Piegare la Sorte a 6, Caos Controllato a 14, Impennata
       Domata a 18. **Nessun incantesimo di sottoclasse** (come Sapienza/
       Valore del Bardo — non tutte le sottoclassi ne hanno uno). **La
       Tabella di Impennata di Magia Selvaggia (d100) non è stata
       riportata**: i privilegi descrivono il meccanismo (tira 1d20 dopo
       un incantesimo lanciato con slot; con un 20, consulta la tabella per
       un effetto casuale) senza trascrivere le 100 righe — sarebbe stato
       l'unico punto in tutto il manuale dati a riportare un blocco così
       ampio di testo originale del PHB, contro la regola del progetto di
       usare solo riassunti (il Master la consulta dal libro, come già
       oggi per altri dettagli di regia non modellati).
     Nessuna risorsa nuova in nessuna delle due: entrambe riusano solo Punti
     Stregoneria/Magia Innata già tracciati, stesso principio dei Domini del
     Chierico e dei Circoli del Druido.
     **Stregoneria Draconica deliberatamente rimandata**: Resilienza
     Draconica dà PF massimi che aumentano di sottoclasse per livello (+3 al
     3°, poi +1 per ogni livello da stregone — mai vista, un bonus PF che
     scala con il livello ma vive nella sottoclasse, non nella classe) E
     una CA senz'armatura a **due** caratteristiche insieme (10+DES+CAR) —
     la stessa esatta meccanica già rimandata per il Collegio della Danza
     del Bardo. Le due ricorrenze della stessa CA a due caratteristiche
     rendono più sensato risolverla una volta sola quando se ne parla con
     Andrea, invece che due implementazioni separate.
     Verificato in locale: Tratti di uno Stregone Meccanica livello 9
     mostrano Ripristinare l'Equilibrio/Manifestazioni dell'Ordine (3°) e
     Baluardo della Legge (6°) nell'ordine giusto; Grimorio mostra tutti e 8
     gli incantesimi FISSI del sottotipo; level-up 2→3 mostra le 3 card
     Origine (Draconica correttamente assente); Tharion invariato; console
     pulita in ogni prova.
10. [x] **Mago** (full) — libro incantesimi, Recupero Arcano, Tradizione.
    → **Fatto (2026-07-30, manuale `version` 37→38)**: privilegi 1→20 dal PDF
    (p.164-166, dati base già presenti e verificati cifra per cifra —
    incluso il salto 19→21 negli Incantesimi Preparati al 15°→16°, confermato
    due volte con estrazioni diverse del PDF), sottoclasse **Tradizione della
    Divinazione** (p.171 — la più semplice delle 4: Abiurazione, Evocazione e
    Illusione condividono lo stesso privilegio d'apertura "Sapiente" che
    aggiunge liberamente incantesimi al libro a ogni nuovo livello di slot,
    ma le altre tre aggiungono anche una meccanica propria — Ward di HP per
    l'Abiurazione, danno extra per l'Evocazione, cantrip bonus per
    l'Illusione — rimandate a quando servirà il motore nuovo; Divinazione è
    tutta narrativa, incluso Sapiente stesso, trattato come la Furia del
    Barbaro: descrittivo, non tracciato nello stato), equipaggiamento
    iniziale (Bastone Ferrato — che è anche il Focus Arcano, un solo oggetto
    — + 2 Pugnali + Veste + Libro degli Incantesimi + Kit dello studioso,
    oppure 55 MO), competenze di classe in `CLASS_SKILLS` (create.js).
    - **Recupero Arcano**: `classResources` di tipo `kind:'uses'`, stesso
      principio del Metabolismo Sbalorditivo del Monaco — zero codice nuovo.
    - **Studioso** (Expertise a 1 sola abilità, non 2 come Ladro/Bardo/
      Ranger): riusa lo `choicePoints.expertise` generico esistente con
      `count: 1`, nessuna modifica al picker. **Semplificazione dichiarata**:
      il PHB restringe la scelta a sei abilità specifiche (esclude Intuizione
      anche se è competenza di classe del Mago); il picker qui non applica
      quella lista ristretta, stesso genere di scelta già accettato altrove
      (es. Maestria nelle Armi del Barbaro senza Vex/Rallentare).
    - **Nessuna meccanica nuova nel motore**: il libro degli incantesimi
      (spellbook separato dai preparati) non è modellato — il wizard usa lo
      stesso meccanismo generico "N incantesimi preparati" già in uso per
      tutte le classi, senza distinguere "conosciuti nel libro" da
      "preparati". Semplificazione dichiarata, stessa scelta implicita già
      fatta per ogni altro incantatore finora.
    - **Verifica end-to-end**: creazione di un Mago Umano/Studioso da zero
      nel wizard reale (Punteggi: "Attacca con Intelligenza · TS:
      Intelligenza, Saggezza"; Competenze: Indagare/Storia/Intuizione/
      Medicina/Natura/Religione raggruppate per caratteristica, Arcano e
      Storia escluse perché dal background; Equipaggiamento: card A col Kit
      del Mago, Bastone Ferrato + 2 Pugnali, nessun picker di maestria;
      Incantesimi: "Trucchetti (scegline 3)" + "Incantesimi preparati di 1°
      livello (scegline 4)"; picker di Iniziato alla Magia nel Background già
      pescava dalla lista del Mago). Personaggio generato: PF 7 = 1d6+COS,
      grimorio con 5 trucchetti (3 scelti + 2 dal talento) e 4 preparati + 1
      sempre pronto (Allarme, rituale). Level-up 1→2 simulato: guadagni "PF
      7→12", "Slot Incantesimi 2→3", "Incantesimi Preparati 4→5", sezione
      "Competenza — scegline 1" con le 4 abilità competenti, Arcano scelto e
      salvato in `expertiseSkills`, card "Recupero Arcano 1/1" a Risorse.
      Tharion (Paladino) verificato invariato dopo ogni prova (CA 20, CD 15,
      PF 60, Imposizione 35). Console pulita in ogni prova. Cache busting
      `?v=116`.
    → **Completato con Evocazione e Illusione (2026-07-31), `?v=126`,
      manuale `version` 47→48.** Il Mago ne ha 4 nel PHB (Abiurazione,
      Divinazione, Evocazione, Illusione); Divinazione c'era già. Aggiunte:
      - **Tradizione dell'Evocazione** (p.172-173): Sapiente dell'Evocazione
        + Trucchetto Potente a 3, Scolpire gli Incantesimi a 6, Evocazione
        Potenziata a 10, Sovraccarico a 14.
      - **Tradizione dell'Illusione** (p.173-174): Sapiente dell'Illusione +
        Illusioni Migliorate a 3, Creature Fantasmatiche a 6, Io Illusorio a
        10, Realtà Illusoria a 14.
      **Rivalutata la nota precedente** (che le dava per bloccate come
      l'Abiurazione): "Evocazione Potenziata" (+INT a un tiro danni di un
      incantesimo di Evocazione) e "Illusioni Migliorate" (trucchetto
      Illusione Minore extra, gratis) sembravano richiedere lavoro nel
      motore, ma non è così — l'app non calcola i danni degli incantesimi
      come fa per gli attacchi con arma (sono testo nella scheda
      dell'incantesimo, non un numero derivato), quindi questi privilegi
      restano prosa esattamente come "Incantesimi Potenti" del Dominio della
      Luce o qualunque altro "+mod. a un tiro"/"impara un trucchetto in
      più" già modellato. Le due tradizioni condividono con Divinazione il
      privilegio "Sapiente" (scelta libera dalla propria scuola, non una
      lista fissa — nessun `spellsByLevel` per quello). **Creature
      Fantasmatiche dell'Illusionista è invece un vero grant fisso**
      (Evocare Bestia + Evocare Folletto sempre preparati dal 6°): a
      differenza del Sapiente, questo è stato modellato con `spellsByLevel`
      come le altre classi, per coerenza (mostra FISSO nel Grimorio). Tag
      `'mago'` aggiunto a Evocare Bestia (Evocare Folletto ce l'aveva già).
      **Tradizione dell'Abiurazione confermata bloccata**: il Baluardo
      Arcano è un vero scudo con PF propri (2× livello + mod. Intelligenza)
      che assorbe danno al posto del personaggio e si rigenera lanciando
      incantesimi di Abiurazione — un tipo di risorsa mai visto (pool di PF
      con assorbimento/rigenerazione, non "N usi"), l'unico blocco di
      architettura reale fra le quattro tradizioni.
      Verificato in locale: Tratti di un Mago Illusionista livello 10
      mostrano Sapiente dell'Illusione/Illusioni Migliorate (3°), Creature
      Fantasmatiche (6°) e Io Illusorio (10°) nell'ordine giusto (Realtà
      Illusoria, 14°, correttamente assente); Grimorio mostra Evocare
      Bestia (2° liv.) ed Evocare Folletto (3° liv.) FISSI; level-up 2→3
      mostra le 3 card Tradizione (Abiurazione correttamente assente);
      Tharion invariato; console pulita in ogni prova.
11. [x] **Warlock** (pact) — slot pact (già in tabella), Invocazioni, Suppliche, Patto.
    → **Fatto (2026-07-30, manuale `version` 38→39)**: privilegi 1→20 dal PDF
    (p.152-156), sottoclasse **Patto del Grande Antico** (p.166-167 — la più
    semplice delle 4: Fatato/Celestiale/Immondo hanno tutte un privilegio al
    3° scalato sul modificatore di Carisma — Passi del Fatato, Luce
    Guaritrice, Fortuna del Reietto — che richiederebbe una risorsa di
    SOTTOCLASSE, non ancora supportata dal motore, che ha solo risorse di
    classe: aggiungerla lì varrebbe per qualunque patrono, sbagliato, stesso
    tipo di svista già presente per l'Arma Sacra del Paladino (poi corretta
    il 2026-07-30, vedi "Bug risolti") — fuori scope qui. Grande Antico è invece tutto
    narrativo, stesso trattamento di Divinatore/Aberrante), equipaggiamento
    iniziale (Cuoio + Falcetto + 2 Pugnali + Focus Arcano + Libro + Kit dello
    studioso, oppure 100 MO), competenze di classe in `CLASS_SKILLS`.
    - **Bug vero trovato e chiuso, non solo del Warlock**: gli slot Patto
      Magico non venivano proprio calcolati. `engine.js` leggeva sempre
      `manual.slotTables[klass.casterType]`, ma per `casterType:'pact'` quella
      chiave non esiste — esistono due tabelle piatte a parte (`pactSlots`,
      `pactSlotLevel`, già nei dati da prima, mai lette da nessuna parte del
      codice). Un Warlock aveva quindi zero slot e zero card "Slot
      Incantesimi" a Grimorio. Corretto con un ramo dedicato che costruisce
      un array sparso (un solo indice valorizzato, dato che il Patto ha
      SEMPRE un unico livello di slot condiviso) — le card irrilevanti
      restano nascoste da sole, stesso meccanismo generico già in uso.
    - **Meccanica nuova: Invocazioni Occulte**. La tabella `invocations` del
      manuale è un TOTALE per livello (1,3,3,3,5,5,6...), non "nuove per
      livello": riscritta come `choicePoints.invocations` nella stessa forma
      {level,count} di Competenza/Metamagia (differenze: +1 al 1°, +2 al 2°,
      +2 al 5°, +1 ciascuno a 7/9/12/15/18 = 10 totali al 20°). Nuovo
      catalogo top-level `manual.invocations`: 14 voci curate (su ~30 nel
      PHB — stesso principio dei 17 Talenti iniziali), prerequisiti come
      testo informativo non validato (stesso trattamento dei prerequisiti
      dei Talenti). Nuova `buildInvocationSection()` in `levelup.js`, gemella
      di Metamagia; **in più**, a differenza di Competenza/Metamagia,
      l'Invocazione parte già al 1° livello — serviva anche un picker nel
      wizard di CREAZIONE (mai servito prima): nuovo `buildInvocationPicker()`
      + `invocationEntryFor()` in `create.js`, stesso `buildSpellPicker`
      condiviso (righe espandibili, essendoci `desc`). Nuovo campo
      `character.invocationIds` (default `[]` in `BASE_CHARACTER`).
    - **Contatto col Patrono**: `classResources` di tipo `kind:'uses'` dal 9°
      livello, stesso principio del Metabolismo Sbalorditivo del Monaco.
    - **Verifica end-to-end**: creazione di un Warlock Umano/Ciarlatano da
      zero nel wizard reale (Punteggi: "Attacca con Carisma · TS: Saggezza,
      Carisma"; Competenze: 7 abilità raggruppate, Inganno e Rapidità di Mano
      escluse dal background; Equipaggiamento: card A col Kit del Warlock,
      Cuoio + Falcetto; Sottoclasse/Incantesimi: "Invocazioni Occulte —
      scegline 1" PRIMA di trucchetti/preparati, 14 righe espandibili, Patto
      della Lama scelto con la descrizione reale visibile). Personaggio
      generato: PF 10 = 1d8+COS, grimorio 2 trucchetti + 2 preparati;
      **Grimorio→Slot Incantesimi mostra UNA SOLA card "Slot 1° livello —
      1/1"** (prova diretta che il bug degli slot Patto è risolto: prima
      sarebbe stata vuota). Level-up 1→2 simulato: guadagni "PF 10→17", "Slot
      Incantesimi 1→2", sezione "Invocazioni Occulte — scegline 2" con le 13
      rimanenti (Patto della Lama esclusa, già posseduta), Esplosione
      Agonizzante + Vista del Diavolo scelte e salvate in `invocationIds`.
      Tharion (Paladino) verificato invariato dopo ogni prova (CA 20, CD 15,
      PF 60, Imposizione 35, slot [4,3] — il ramo 'pact' nuovo non lo tocca,
      lui resta su 'half'). Console pulita in ogni prova. Cache busting
      `?v=117`.
    → **Completato con Fatato, Celestiale e Immondo (2026-07-31), `?v=127`,
      manuale `version` 48→49 — Warlock ora 4/4, primo patto completo.** La
      nota precedente dava per bloccati tutti e tre i patroni mancanti per
      via di un privilegio al 3° scalato sul mod. Carisma; **rivalutando sul
      PHB effettivo**:
      - **Patto del Fatato** (p.157-158): Passi del Fatato a 3, Fuga
        Nebbiosa a 6, Difese Ammalianti a 10, Magia Ammaliante a 14.
      - **Patto del Celestiale** (p.159-160): Luce Guaritrice a 3, Anima
        Radiosa a 6, Resilienza Celestiale a 10, Vendetta Ardente a 14.
      - **Patto dell'Immondo** (p.161-162): Benedizione/Fortuna del Signore
        Oscuro a 3/6, Resilienza Infernale a 10, Scaraventare all'Inferno
        a 14.
      Passi del Fatato e Fortuna del Signore Oscuro sono in realtà "X volte
      pari al mod. Carisma, riposo lungo" — lo stesso pattern lasciato
      descrittivo per ogni altra classe di questa serie di sessioni
      (Bagliore di Guardia del Chierico, Ripristinare l'Equilibrio dello
      Stregone…): nessuna risorsa nuova, la nota li aveva scambiati per un
      problema quando non lo erano.
      **Solo Luce Guaritrice era un vero pool** (dadi da d6 il cui numero
      scala per LIVELLO — 1+livello — non per modificatore), ma **la
      soluzione esisteva già nel motore**: `classResources` supporta da
      tempo un filtro `subclass` (introdotto per Dadi Superiorità/Energia
      Psionica del Guerriero, Blocco 5.C step Guerriero) che rende una
      risorsa valida solo per una sottoclasse specifica invece che per
      l'intera classe. Aggiunta `healingLight` ai `classResources` del
      Warlock con `subclass: 'celestiale'`, `kind:'uses'` e `byLevel`
      `[1+livello]` — **zero righe di motore nuove**, la nota precedente
      semplicemente non si era accorta che il filtro esistesse già (era
      stato scritto per un'altra classe nella stessa sessione in cui è nata
      la nota). 30 incantesimi esistenti hanno ricevuto il tag `'warlock'`
      (2 ce l'avevano già — Passo nella Nebbia e Suggestione); nessun
      incantesimo nuovo nel catalogo.
      Verificato in locale: Risorse di un Warlock Celestiale livello 9
      mostrano "Luce Guaritrice 10/10"; Tratti con Luce Guaritrice (3°) e
      Anima Radiosa (6°) nell'ordine giusto; Grimorio con Cura Ferite/Dardo
      di Guida FISSI; level-up 2→3 mostra le 4 card Patto (tutte e quattro,
      nessuna rimandata per il Warlock), scelta Celestiale applicata senza
      errori. **Doppia non-regressione** sul riuso del filtro `subclass`:
      Tharion invariato e un Guerriero Maestro di Battaglia di prova a
      livello 7 mostra ancora "Dadi Superiorità 5/5, d8 cad." e "Attacco
      Extra: 2 colpi" — il filtro non è stato toccato, solo riletto da una
      seconda classe. Console pulita in ogni prova.
    **Con questo, tutte e 11 le classi del Blocco 5.C sono complete: la
    Fase 5 ha ora tutte le classi giocabili a livello di scheda, level-up e
    creazione da zero (ognuna con almeno 1 sottoclasse). Restano da
    completare, in futuro e senza fretta: le sottoclassi mancanti di ogni
    classe (Paladino e Barbaro sono già a 4/4; le altre 9 classi hanno solo
    la prima sottoclasse modellata), e i meccanismi di sottoclasse rimandati
    per limiti del motore attuale (risorse scalate su una caratteristica ma
    specifiche di UNA sola sottoclasse, non dell'intera classe).**

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

## Decisioni prese (step 3.6-3.9)

- 2026-07-31 — **Stile delle card oggetti custom (3.7)**: 3 alternative con
  preview (A "Card Reliquia" identica a Lama Vincolante/Scudo Magico, B
  "Galleria" a griglia stile carte da gioco, C "Lista con ritratto" righe
  compatte) — scelta la **A**, massima coerenza visiva con le due reliquie
  storiche anche se più ingombrante con tanti oggetti.
- 2026-07-31 — **UX della sintonizzazione**: 3 varianti interattive con
  preview (1 pulsante dentro la card espansa, 2 dashboard di 3 slot fissi
  in cima, 3 gemma sulla testata dell'accordion) — scelta la **3**, la più
  rapida da toccare; corretto un dettaglio di allineamento segnalato da
  Andrea (la gemma va comunque riservata come spazio invisibile per gli
  oggetti che non richiedono sintonizzazione, altrimenti i medaglioni della
  lista non restano allineati in colonna).
- 2026-07-31 — **Arte delle 8 icone preimpostate (3.8)**: primo giro con
  icone a tratto semplice dentro un medaglione generico — Andrea le ha
  respinte ("icone stilizzate che quasi non si capiscono"), chiedendo la
  stessa tecnica di Lama Vincolante/Scudo Magico per tutte. Rifatte come
  illustrazioni vere; per Spada e Scudo confermato di riusare *esattamente*
  l'arte esistente invece di generarne di nuove. Mantello e Amuleto hanno
  avuto un terzo giro dopo un'immagine di riferimento mandata da Andrea (un
  mantello con cappuccio intero, non un semplice fermaglio): tra 3
  alternative ciascuno, scelte la **B** per entrambi (fermaglio raffinato
  per il mantello — non il cappuccio intero A, giudicato eccessivo per un
  oggetto tra tanti — e medaglione runico per l'amuleto).
- 2026-07-31 — **Perché la Tranche 1 di 3.9 è "facile"**: l'app è una
  scheda, non un motore di gioco — non tira mai dadi. Effetti come
  "vantaggio" non richiedono nessun calcolo, solo essere leggibili sulla
  card: da qui la scelta di aggiungere un effetto a **testo libero** invece
  di modellare "vantaggio"/"resistenza"/"immunità" come bersagli
  strutturati con logica dedicata (che servirebbe SOLO a stamparli come
  testo comunque, dato che nulla nel motore ne fa uso in un tiro). I due
  nuovi bersagli numerici (Velocità, Percezione passiva) sono stati
  scelti per la Tranche 1 perché il punto d'aggancio in `engine.js` è già
  lì, un solo rigo ciascuno (`speedM`/`passivePerception` già calcolati,
  manca solo la somma `modSum`). Riferimento usato per capire quali
  effetti servono davvero: i 76 oggetti "non comuni" del compendio
  dungeonedraghi.it/compendio/oggetti-magici, più i due oggetti reali di
  Andrea (Lama Vincolante, Scudo Magico) come caso di prova concreto.
- 2026-07-31 — **Resistenze & Immunità, come inserirle (3.9.b)**: qui
  invece il testo libero non bastava (a differenza del "vantaggio" della
  Tranche 1) perché serve **aggregare** i tag in una card dedicata, e il
  testo libero non si presta ad essere raggruppato in modo affidabile. 3
  alternative con preview (A chip preimpostate, B tag libero con
  suggerimenti, C prefisso riconosciuto tipo "Resistenza:" dentro il testo
  libero già esistente) — scelta la **A**: zero rischio di varianti
  ("Fuoco"/"fuoco") che romperebbero l'aggregazione, a costo di un po' di
  UI in più nella scheda di creazione.

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
- [x] ~~**Arma Sacra del Paladino trapelava a tutte le sottoclassi**~~ — FATTO
      (2026-07-30, commit `dc7fe27`, sessione spawnata da qui con
      `spawn_task`). Trovato mentre si aggiungeva il filtro `subclass` per le
      risorse di sottoclasse del Guerriero (Blocco 5.C): `CLASS_BONUSES.
      paladino.sacredWeapon` in `engine.js` non aveva mai controllato
      `character.subclassId`, quindi un Paladino con Gloria/Antichi/Vendetta
      vedeva comunque la nota "Con Arma Sacra: +N al colpire..." pur non
      avendo quel privilegio (solo Devozione lo dà). Corretto con lo stesso
      principio del filtro `subclass` di `classResources`: `sacredWeapon` ora
      ha `subclass: 'devozione'` e `derive()` lo azzera se non combacia.
      Tharion (Devozione) verificato invariato.

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

- 2026-07-30 — **Arma Sacra trapelava a Paladini non-Devozione.** Segnalato
  da Andrea: era da tempo annotato "segnalato a parte, fuori scope" (vedi
  Blocco 5.C sulle sottoclassi del Guerriero e nota sul Warlock/patti).
  `CLASS_BONUSES.paladino.sacredWeapon` in `engine.js` si applicava a
  QUALSIASI `classId==='paladino'`, ma Arma Sacra è un privilegio esclusivo
  del Giuramento di Devozione (`manual-55.js`,
  `classes.paladino.subclasses.devozione`) — un Gloria/Antichi/Vendetta non
  dovrebbe mai vederlo, eppure la nota "Con Arma Sacra: +N al colpire…" in
  `stats.js` (`buildAttackNote`) compariva comunque per qualunque paladino
  con CAR positivo.
  **Fix**: stesso principio del filtro `subclass` già usato per
  `classResources` (Blocco 5.C, Dadi Superiorità/Energia Psionica) ma
  applicato ai `CLASS_BONUSES`: aggiunto `subclass: 'devozione'` alla def di
  `sacredWeapon`, e in `engine.js` (dove si calcola `sacredWeaponBonus`) il
  bonus si azzera se `swDef.subclass !== ch.subclassId`. Verificato: Tharion
  (Devozione) invariato — CA 20, +8/1d8+7, Arma Sacra +3, nota presente; un
  Paladino di prova con `subclassId: 'gloria'` (clone dello stato via
  `AppEngine.derive`, senza toccare i dati reali) ha `sacredWeaponBonus: 0` e
  la nota sparisce. Console pulita.

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
