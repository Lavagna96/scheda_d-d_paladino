(function () {
  /*
   * Wizard di creazione personaggio (Fase 5, Blocco 5.B):
   * - b1   (fatto): scaffold — macchina a stati dei passi e navigazione.
   * - b2.1 (fatto): contenuto reale dei passi Specie e Classe, con stato in
   *   bozza condiviso `draft`.
   * - b2.2 (fatto): contenuto reale del passo Punteggi — point-buy, array
   *   standard e manuale (dati PHB 2024 p.37).
   * - b2.3 (fatto): contenuto reale del passo Competenze — Tiri Salvezza
   *   fissi della classe (di sola lettura) + scelta delle competenze di
   *   abilità (CLASS_SKILLS, PHB 2024).
   * - b2.4 (fatto): contenuto reale del passo Equipaggiamento — armatura,
   *   scudo e arma, con default sensati per classe (equip. iniziale del PHB
   *   2024, opzione A) tutti modificabili; NIENTE stile di combattimento
   *   (per il Paladino è una scelta di livello 2, il Barbaro non lo prende
   *   mai → arriva col level-up).
   * - b2.5 (fatto): contenuto reale del passo finale Sottoclasse/Incantesimi —
   *   a livello 1 nessuna classe sceglie la sottoclasse (tutte al livello 3:
   *   solo una nota informativa); per i caster, selettore incantesimi dal
   *   catalogo del manuale filtrato per classe e livello (Paladino: 2 di
   *   livello 1, nessun cantrip). Generico via casterType / cantripsByLevel /
   *   preparedByLevel; i non-caster (Barbaro) non hanno nulla da scegliere.
   * - b3   (qui): generazione vera del personaggio. "Crea personaggio"
   *   costruisce uno stato pulito dal draft (buildStateFromDraft, nessun
   *   residuo di Tharion, pool al massimo di livello 1), lo salva via
   *   AppCloud.createCharacter (localStorage + nuovo doc Firestore) e torna
   *   in dashboard dove compare la nuova card.
   * - b4 (5.B.3): la scheda del nuovo personaggio si apre pulita — merge
   *   neutro in storage.js, incantesimi fissi dai dati di classe/sottoclasse,
   *   niente destriero prima del 5° livello.
   * Pattern "Mago a schermo intero" (5.B.1): una vista a schermo intero, un
   * passo per volta.
   *
   * Vista pilotata dalla stessa macchina a stati sul <body> di
   * js/dashboard.js/css/components/dashboard.css: open() passa da
   * body.in-dashboard a body.in-create, close() torna indietro.
   */

  var STEPS = [
    { id: 'specie', title: 'Specie' },
    { id: 'classe', title: 'Classe' },
    // Il background sta PRIMA dei punteggi come nel manuale (prima l'origine,
    // poi le caratteristiche): i suoi +2/+1 si vedono mentre si distribuiscono
    // i punti, che è il momento in cui servono (5.B.4, alternativa A).
    { id: 'background', title: 'Background' },
    { id: 'punteggi', title: 'Punteggi' },
    { id: 'competenze', title: 'Competenze' },
    { id: 'equipaggiamento', title: 'Equipaggiamento' },
    { id: 'finale', title: 'Sottoclasse e Incantesimi' }
  ];

  var stepIndex = 0; // passo corrente, 0-based

  // Stato in bozza del personaggio in creazione: vive solo mentre il wizard
  // è aperto e viene azzerato a ogni open() (vedi sotto). I passi non ancora
  // implementati (b2.4+) non hanno ancora un campo dedicato qui.
  var draft = {
    name: '', speciesId: null, classId: null,
    scoreMethod: 'pointbuy',
    abilities: { FOR: 8, DES: 8, COS: 8, INT: 8, SAG: 8, CAR: 8 },
    profSkills: [],
    /* Background (5.B.4): id scelto, come si distribuiscono i suoi aumenti di
       caratteristica (`bonusMode` '2-1' oppure '1-1-1', con quali punteggi
       prendono il +2 e il +1), lo strumento quando il background lo fa
       scegliere, e quale dei suoi due pacchetti di equipaggiamento si prende. */
    backgroundId: null,
    bgBonusMode: '2-1', bgPlus2: null, bgPlus1: null,
    bgTool: '', bgPack: 'a',
    // Iniziato alla Magia (Accolito, Guida, Studioso): 2 trucchetti e 1
    // incantesimo di 1° livello dalla lista di classe indicata dal background.
    miCantrips: [], miSpells: [],
    // Equipaggiamento (b2.4): impostato in modo pigro dai default di classe
    // quando si entra nel passo (ensureEquipDraft); equipForClass ricorda per
    // quale classe è stato riempito, così cambiando classe si riparte dal kit
    // giusto.
    equip: null, equipForClass: null,
    // Maestrie scelte (id di armi dal catalogo): il PHB le dà al livello 1 alle
    // classi marziali — due tipi di arma per Paladino e Barbaro.
    masteries: [],
    // Incantesimi scelti nel passo finale (b2.5): id dal catalogo del manuale.
    // Vuoti per i non-caster; per il Paladino solo preparedSpells (2 di liv. 1).
    cantrips: [], preparedSpells: []
  };

  var progressFillEl, stepNumEl, stepTitleEl, stepBodyEl, backBtn, nextBtn, footerNoteEl;

  // Riscrive il riepilogo del background nel passo Punteggi; null fuori da
  // quel passo (lo imposta renderPunteggi, lo azzera render()).
  var bgRecapRefresh = null;

  // Ordine e etichette delle 6 caratteristiche: stessa convenzione di
  // js/levelup.js e js/edit-sheet.js.
  var ABILITY_ORDER = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
  var ABILITY_LABELS = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };

  // Point-buy (PHB 2024 p.37): 27 punti totali; costo per punteggio 8-15.
  var POINT_BUY_BUDGET = 27;
  var POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

  // Array standard (PHB 2024 p.37): 6 valori fissi da assegnare uno a testa.
  var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

  // Array consigliato per classe (PHB 2024 p.37), ordine FOR,DES,COS,INT,SAG,CAR:
  // è sempre una permutazione di STANDARD_ARRAY (costo 27 in point-buy "per
  // costruzione").
  var RECOMMENDED_ARRAYS = {
    barbaro:   { FOR: 15, DES: 13, COS: 14, INT: 10, SAG: 12, CAR: 8 },
    bardo:     { FOR: 8,  DES: 14, COS: 12, INT: 13, SAG: 10, CAR: 15 },
    chierico:  { FOR: 14, DES: 8,  COS: 13, INT: 10, SAG: 15, CAR: 12 },
    druido:    { FOR: 8,  DES: 12, COS: 14, INT: 13, SAG: 15, CAR: 10 },
    guerriero: { FOR: 15, DES: 14, COS: 13, INT: 8,  SAG: 10, CAR: 12 },
    monaco:    { FOR: 12, DES: 15, COS: 13, INT: 10, SAG: 14, CAR: 8 },
    paladino:  { FOR: 15, DES: 10, COS: 13, INT: 8,  SAG: 12, CAR: 14 },
    ranger:    { FOR: 12, DES: 15, COS: 13, INT: 8,  SAG: 14, CAR: 10 },
    ladro:     { FOR: 12, DES: 15, COS: 13, INT: 14, SAG: 10, CAR: 8 },
    stregone:  { FOR: 10, DES: 13, COS: 14, INT: 8,  SAG: 12, CAR: 15 },
    warlock:   { FOR: 8,  DES: 14, COS: 13, INT: 12, SAG: 10, CAR: 15 },
    mago:      { FOR: 8,  DES: 12, COS: 13, INT: 15, SAG: 14, CAR: 10 }
  };

  // Costo cumulativo point-buy di un punteggio e totale punti già spesi
  // secondo draft.abilities (helper condivisi da validazione e render).
  function pointBuyCost(score) {
    return POINT_BUY_COST[score] || 0;
  }

  function pointBuyUsed() {
    var total = 0;
    ABILITY_ORDER.forEach(function (k) {
      total += pointBuyCost(draft.abilities[k]);
    });

    return total;
  }

  // Competenze di abilità della classe, PHB 2024 (Barbaro p.50, Paladino
  // p.108). Le altre classi useranno un fallback finché non saranno modellate.
  var CLASS_SKILLS = {
    barbaro: { count: 2, from: ['addestrare-animali', 'atletica', 'intimidire', 'natura', 'percezione', 'sopravvivenza'] },
    paladino: { count: 2, from: ['atletica', 'intuizione', 'intimidire', 'medicina', 'persuasione', 'religione'] }
  };

  // Competenze disponibili per una classe: usa CLASS_SKILLS se già
  // modellata; altrimenti fallback "scegli 2 fra tutte le 18 abilità" (id
  // presi da window.AppEngine.SKILLS) finché la classe non avrà una voce
  // dedicata.
  function classSkillsFor(classId) {
    if (CLASS_SKILLS[classId]) {
      return CLASS_SKILLS[classId];
    }
    var allIds = (window.AppEngine && window.AppEngine.SKILLS)
      ? window.AppEngine.SKILLS.map(function (s) { return s.id; })
      : [];

    return { count: 2, from: allIds };
  }

  /* ---------- background (5.B.4) ---------- */

  function bgById(id) {
    return ((window.MANUAL_55.backgrounds || {})[id]) || null;
  }

  function currentBg() {
    return bgById(draft.backgroundId);
  }

  // Aumenti di caratteristica del background come mappa {FOR: 0, DES: 2, …}.
  // Il PHB: +2 a uno e +1 a un altro fra i tre elencati, oppure +1 a tutti e
  // tre. Senza background (o con la distribuzione incompleta) è tutto a zero.
  function bgBonusMap() {
    var out = { FOR: 0, DES: 0, COS: 0, INT: 0, SAG: 0, CAR: 0 };
    var bg = currentBg();
    if (!bg) {
      return out;
    }
    if (draft.bgBonusMode === '1-1-1') {
      bg.abilities.forEach(function (k) { out[k] = 1; });

      return out;
    }
    if (draft.bgPlus2) { out[draft.bgPlus2] = 2; }
    if (draft.bgPlus1) { out[draft.bgPlus1] = 1; }

    return out;
  }

  // Competenze in abilità che arrivano dal background: sono già acquisite, non
  // si scelgono, e il passo Competenze le toglie dalla lista della classe.
  function bgSkills() {
    var bg = currentBg();

    return bg ? bg.skills.slice() : [];
  }

  // Il background dà Iniziato alla Magia? In quel caso servono anche i suoi
  // incantesimi, presi dalla lista di classe indicata (`featList`).
  function magicInitiateList() {
    var bg = currentBg();

    return (bg && bg.featId === 'iniziato-alla-magia' && bg.featList) || null;
  }

  function bgValid() {
    var bg = currentBg();
    if (!bg) {
      return false;
    }
    if (bg.toolChoice && !draft.bgTool.trim()) {
      return false;
    }
    if (magicInitiateList() && (draft.miCantrips.length !== 2 || draft.miSpells.length !== 1)) {
      return false;
    }
    if (draft.bgBonusMode === '1-1-1') {
      return true;
    }

    return !!draft.bgPlus2 && !!draft.bgPlus1 && draft.bgPlus2 !== draft.bgPlus1;
  }

  /* Equipaggiamento: in creazione si sceglie SOLO fra i due pacchetti del
     manuale (A o B), come si fa al tavolo aprendo il PHB; la personalizzazione
     — il master che ti fa partire con qualcosa in più — si fa dopo, nella
     scheda (decisione 5.B.5). I pacchetti stanno nei dati
     (`klass.startingEquipment`), qui non c'è più nessuna lista di armature né
     campi liberi per nome/dado/tipo dell'arma. */

  function packsFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};

    return klass.startingEquipment || null;
  }

  function weaponById(id) {
    var found = null;
    (window.MANUAL_55.weapons || []).forEach(function (w) {
      if (w.id === id) {
        found = w;
      }
    });

    return found;
  }

  // Draft dell'equipaggiamento: solo la lettera del pacchetto scelto. Le classi
  // senza pacchetto nei dati (non ancora giocabili) restano senza nulla.
  function defaultEquipFor(classId) {
    return { pack: packsFor(classId) ? 'a' : '' };
  }

  // Armi su cui la classe può scegliere la maestria: quelle in cui è competente
  // (klass.weaponProf: 'sem' semplici, 'gue' da guerra). Senza il dato le
  // consideriamo tutte, per non bloccare le classi non ancora rifinite.
  function masteryChoicesFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};
    var prof = klass.weaponProf || ['sem', 'gue'];

    return (window.MANUAL_55.weapons || []).filter(function (w) {
      return prof.indexOf(w.cat.split('-')[0]) !== -1;
    });
  }

  // Quante maestrie sceglie questa classe al livello di creazione (0 = nessuna,
  // es. una classe senza Maestria nelle Armi).
  function masteryCountFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};

    return (klass.weaponMastery || [])[CREATE_LEVEL] || 0;
  }

  // Livello di partenza fisso in creazione (decisione 5.B): 1. Gli indici
  // cantripsByLevel/preparedByLevel nel manuale sono per livello (0 inutilizzato).
  var CREATE_LEVEL = 1;

  // Incantesimi di una classe a un dato livello di incantesimo, dal catalogo
  // del manuale (window.MANUAL_55.spells, con tag `classes` e `level`),
  // ordinati per nome. Usato dal passo finale (b2.5) per i caster.
  function classSpellsAt(classId, spellLevel) {
    var all = (window.MANUAL_55 && window.MANUAL_55.spells) || [];

    return all.filter(function (s) {
      return s.classes && s.classes.indexOf(classId) !== -1 && s.level === spellLevel;
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name, 'it');
    });
  }

  /* ---------- helper DOM ---------- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) {
      node.className = cls;
    }
    if (text != null) {
      node.textContent = text;
    }

    return node;
  }

  // Tile selezionabile (specie o classe): nome in evidenza + riga piccola
  // opzionale (taglia/velocità per le specie, caratteristica primaria per le
  // classi). Marcata "on" se corrisponde già alla selezione nel draft.
  function buildTile(name, meta, isSelected) {
    var tile = el('button', 'create-tile' + (isSelected ? ' on' : ''));
    tile.appendChild(el('span', 'create-tile-name', name));
    if (meta) {
      tile.appendChild(el('span', 'create-tile-meta', meta));
    }

    return tile;
  }

  /* ---------- validazione ---------- */

  function stepValid() {
    var step = STEPS[stepIndex];
    if (step.id === 'specie') {
      return !!draft.speciesId && draft.name.trim().length > 0;
    }
    if (step.id === 'classe') {
      return !!draft.classId;
    }
    if (step.id === 'background') {
      return bgValid();
    }
    if (step.id === 'punteggi') {
      return scoresValid();
    }
    if (step.id === 'competenze') {
      return draft.profSkills.length === classSkillsFor(draft.classId).count;
    }
    if (step.id === 'finale') {
      return finaleValid();
    }

    // Equipaggiamento: serve un pacchetto scelto e tutte le maestrie assegnate
    // (chi non ne ha ne deve scegliere 0, quindi passa comunque).
    return equipValid();
  }

  function equipValid() {
    ensureEquipDraft();
    var packOk = !packsFor(draft.classId) || !!draft.equip.pack;

    return packOk && draft.masteries.length === masteryCountFor(draft.classId);
  }

  // Validità del passo finale (b2.5): i non-caster non hanno nulla da
  // scegliere (sempre valido); i caster devono aver scelto il numero esatto
  // di cantrip e di incantesimi preparati previsti al livello 1 (stesso
  // vincolo "esattamente N" delle competenze). La sottoclasse non entra: a
  // livello 1 nessuna classe la sceglie. Il Math.min protegge il caso (oggi
  // teorico) in cui il catalogo avesse meno incantesimi del dovuto.
  function finaleValid() {
    var klass = (window.MANUAL_55 && window.MANUAL_55.classes[draft.classId]) || {};
    if (!klass.casterType || klass.casterType === 'none') {
      return true;
    }
    var needCantrips = Math.min(
      (klass.cantripsByLevel && klass.cantripsByLevel[CREATE_LEVEL]) || 0,
      classSpellsAt(draft.classId, 0).length
    );
    var needPrepared = Math.min(
      (klass.preparedByLevel && klass.preparedByLevel[CREATE_LEVEL]) || 0,
      classSpellsAt(draft.classId, 1).length
    );

    return (draft.cantrips || []).length === needCantrips &&
           (draft.preparedSpells || []).length === needPrepared;
  }

  // Validità del passo Punteggi: dipende dal metodo in draft.scoreMethod.
  function scoresValid() {
    if (draft.scoreMethod === 'array') {
      // Valido solo quando tutti e 6 i valori dell'array sono assegnati.
      return ABILITY_ORDER.every(function (k) {
        return !!draft.abilities[k];
      });
    }
    if (draft.scoreMethod === 'pointbuy') {
      var inRange = ABILITY_ORDER.every(function (k) {
        var v = draft.abilities[k];
        return v >= 8 && v <= 15;
      });

      /* I 27 punti vanno spesi TUTTI: prima bastava non sforare, così si
         arrivava in fondo con tutti 8 e un personaggio storpio senza un solo
         avviso (5.B.4). Lasciarne indietro non avvantaggia nessuno. */
      return inRange && pointBuyUsed() === POINT_BUY_BUDGET;
    }

    return true; // manuale: ha sempre un valore, nessun budget da rispettare
  }

  /* ---------- passi: Specie e Classe (b2.1) ---------- */

  function renderSpecie(container) {
    // Campo nome personaggio.
    var label = el('label', 'create-label', 'Nome del personaggio');
    label.setAttribute('for', 'create-name-input');
    container.appendChild(label);

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'create-name-input';
    input.className = 'create-in';
    input.value = draft.name;
    input.addEventListener('input', function () {
      draft.name = input.value;
      updateNav();
    });
    container.appendChild(input);

    // Lista tile: una per specie del manuale (window.MANUAL_55.species).
    var list = el('div', 'create-tile-list');
    container.appendChild(list);

    Object.keys(window.MANUAL_55.species).forEach(function (id) {
      var sp = window.MANUAL_55.species[id];
      var meta = sp.size || '';
      if (sp.speedM) {
        meta += (meta ? ' · ' : '') + sp.speedM.toLocaleString('it-IT') + ' m';
      }
      var tile = buildTile(sp.name, meta, id === draft.speciesId);

      tile.addEventListener('click', function () {
        draft.speciesId = id;
        list.querySelectorAll('.create-tile').forEach(function (t) {
          t.classList.toggle('on', t === tile);
        });
        updateNav();
      });

      list.appendChild(tile);
    });
  }

  function renderClasse(container) {
    // Lista tile: una per classe del manuale (window.MANUAL_55.classes). Non
    // filtrare: oggi solo Paladino e Barbaro hanno dati 1→20 completi, ma
    // vanno mostrate comunque tutte (il "non ancora giocabile" si gestisce
    // in un altro step).
    var list = el('div', 'create-tile-list');
    container.appendChild(list);

    Object.keys(window.MANUAL_55.classes).forEach(function (id) {
      var kl = window.MANUAL_55.classes[id];
      var tile = buildTile(kl.name, kl.primaryAbility, id === draft.classId);

      tile.addEventListener('click', function () {
        draft.classId = id;
        list.querySelectorAll('.create-tile').forEach(function (t) {
          t.classList.toggle('on', t === tile);
        });
        updateNav();
      });

      list.appendChild(tile);
    });
  }

  /* ---------- passo: Punteggi (b2.2) ---------- */

  // Reimposta draft.abilities in modo coerente quando cambia il metodo di
  // generazione, così i valori restano sempre nel dominio del metodo attivo:
  // - pointbuy: riparte sempre da tutti 8 (base del point-buy, 0 punti spesi);
  // - array: tutti "non assegnati" (null) finché il giocatore non sceglie;
  // - manuale: mantiene i valori correnti se già numeri validi (3-20),
  //   altrimenti (es. arrivando da "array" con caselle ancora vuote) parte
  //   da 10.
  function resetAbilitiesForMethod(method) {
    if (method === 'pointbuy') {
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = 8; });
    } else if (method === 'array') {
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = null; });
    } else {
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        if (typeof v !== 'number' || v < 3 || v > 20) {
          draft.abilities[k] = 10;
        }
      });
    }
  }

  // Testo del modificatore per un punteggio, da mostrare come aiuto accanto
  // al valore. Usa window.AppEngine se disponibile (coerente col resto
  // dell'app), altrimenti calcola inline la stessa formula del PHB.
  function abilityModText(score) {
    if (score == null) {
      return ''; // caratteristica non ancora assegnata (Array standard)
    }
    var mod = (window.AppEngine && window.AppEngine.abilityMod)
      ? window.AppEngine.abilityMod(score)
      : Math.floor((score - 10) / 2);

    return (window.AppEngine && window.AppEngine.formatMod)
      ? window.AppEngine.formatMod(mod)
      : (mod >= 0 ? '+' : '−') + Math.abs(mod);
  }

  // Sezione Point-buy: stepper −/+ per caratteristica (8-15), contatore
  // punti live e pulsante "Consigliati per la classe".
  function buildPointBuySection() {
    var wrap = el('div');
    var counterEl = el('div', 'create-points-counter');
    wrap.appendChild(counterEl);

    var list = el('div', 'edit-stat-list');
    var scoreEls = {}, modEls = {}, plusBtns = {}, minusBtns = {};

    function refresh() {
      var used = pointBuyUsed();
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        scoreEls[k].textContent = String(v);
        modEls[k].textContent = abilityModText(v);

        var costUp = pointBuyCost(v + 1) - pointBuyCost(v);
        var disablePlus = v >= 15 || (used + costUp) > POINT_BUY_BUDGET;
        plusBtns[k].disabled = disablePlus;
        plusBtns[k].classList.toggle('is-disabled', disablePlus);

        var disableMinus = v <= 8;
        minusBtns[k].disabled = disableMinus;
        minusBtns[k].classList.toggle('is-disabled', disableMinus);
      });
      counterEl.textContent = 'Punti: ' + used + ' / ' + POINT_BUY_BUDGET;
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var stepper = el('div', 'edit-stepper');
      var minus = el('button', 'stepper-btn minus', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[k]);
      var vals = el('div', 'edit-stat-vals');
      var scoreEl = el('span', 'edit-stat-score', String(draft.abilities[k]));
      var modEl = el('span', 'edit-stat-mod', abilityModText(draft.abilities[k]));
      vals.appendChild(scoreEl);
      vals.appendChild(modEl);
      var plus = el('button', 'stepper-btn plus', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[k]);

      minus.addEventListener('click', function () {
        if (draft.abilities[k] > 8) {
          draft.abilities[k]--;
          refresh();
        }
      });
      plus.addEventListener('click', function () {
        var used = pointBuyUsed();
        var costUp = pointBuyCost(draft.abilities[k] + 1) - pointBuyCost(draft.abilities[k]);
        if (draft.abilities[k] < 15 && (used + costUp) <= POINT_BUY_BUDGET) {
          draft.abilities[k]++;
          refresh();
        }
      });

      stepper.appendChild(minus);
      stepper.appendChild(vals);
      stepper.appendChild(plus);
      row.appendChild(stepper);
      list.appendChild(row);

      scoreEls[k] = scoreEl;
      modEls[k] = modEl;
      plusBtns[k] = plus;
      minusBtns[k] = minus;
    });
    wrap.appendChild(list);

    var recBtn = el('button', 'create-suggest-btn', 'Consigliati per la classe');
    recBtn.type = 'button';
    recBtn.addEventListener('click', function () {
      var rec = RECOMMENDED_ARRAYS[draft.classId];
      if (!rec) {
        return; // difensivo: il passo Classe garantisce già un classId valido
      }
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = rec[k]; });
      refresh();
    });
    wrap.appendChild(recBtn);

    refresh();

    return wrap;
  }

  // Sezione Array standard: un <select> per caratteristica con i valori
  // [15,14,13,12,10,8]; ogni valore è utilizzabile una sola volta, quindi le
  // opzioni si ricalcolano su tutte le select a ogni scelta.
  function buildArraySection() {
    var wrap = el('div');
    var list = el('div', 'edit-stat-list');
    var selects = {}, modEls = {};

    function usedValues() {
      var used = [];
      ABILITY_ORDER.forEach(function (k) {
        if (draft.abilities[k] != null) {
          used.push(draft.abilities[k]);
        }
      });

      return used;
    }

    function rebuildOptions() {
      var used = usedValues();
      ABILITY_ORDER.forEach(function (k) {
        var select = selects[k];
        var current = draft.abilities[k];
        select.textContent = ''; // svuota (nessun dato: solo reset opzioni)

        var emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '—';
        select.appendChild(emptyOpt);

        STANDARD_ARRAY.forEach(function (val) {
          // Un valore già scelto per un'ALTRA caratteristica sparisce dalle
          // altre select; resta disponibile nella propria (altrimenti la
          // selezione corrente sparirebbe dalla sua stessa lista).
          if (used.indexOf(val) !== -1 && val !== current) {
            return;
          }
          var opt = document.createElement('option');
          opt.value = String(val);
          opt.textContent = String(val);
          select.appendChild(opt);
        });

        select.value = current != null ? String(current) : '';
        modEls[k].textContent = abilityModText(current);
      });
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var vals = el('div', 'create-array-vals');
      var select = document.createElement('select');
      select.className = 'edit-select';
      select.setAttribute('aria-label', ABILITY_LABELS[k]);
      select.addEventListener('change', function () {
        draft.abilities[k] = select.value ? parseInt(select.value, 10) : null;
        rebuildOptions();
      });
      var modEl = el('span', 'edit-stat-mod', '');

      vals.appendChild(select);
      vals.appendChild(modEl);
      row.appendChild(vals);
      list.appendChild(row);

      selects[k] = select;
      modEls[k] = modEl;
    });
    wrap.appendChild(list);

    var recBtn = el('button', 'create-suggest-btn', 'Consigliati per la classe');
    recBtn.type = 'button';
    recBtn.addEventListener('click', function () {
      var rec = RECOMMENDED_ARRAYS[draft.classId];
      if (!rec) {
        return;
      }
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = rec[k]; });
      rebuildOptions();
    });
    wrap.appendChild(recBtn);

    rebuildOptions();

    return wrap;
  }

  // Sezione Manuale: stepper −/+ liberi, range 3-20, nessun budget.
  function buildManualSection() {
    var wrap = el('div');
    var list = el('div', 'edit-stat-list');
    var scoreEls = {}, modEls = {}, plusBtns = {}, minusBtns = {};

    function refresh() {
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        scoreEls[k].textContent = String(v);
        modEls[k].textContent = abilityModText(v);

        var disableMinus = v <= 3;
        minusBtns[k].disabled = disableMinus;
        minusBtns[k].classList.toggle('is-disabled', disableMinus);

        var disablePlus = v >= 20;
        plusBtns[k].disabled = disablePlus;
        plusBtns[k].classList.toggle('is-disabled', disablePlus);
      });
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var stepper = el('div', 'edit-stepper');
      var minus = el('button', 'stepper-btn minus', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[k]);
      var vals = el('div', 'edit-stat-vals');
      var scoreEl = el('span', 'edit-stat-score', String(draft.abilities[k]));
      var modEl = el('span', 'edit-stat-mod', abilityModText(draft.abilities[k]));
      vals.appendChild(scoreEl);
      vals.appendChild(modEl);
      var plus = el('button', 'stepper-btn plus', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[k]);

      minus.addEventListener('click', function () {
        if (draft.abilities[k] > 3) {
          draft.abilities[k]--;
          refresh();
        }
      });
      plus.addEventListener('click', function () {
        if (draft.abilities[k] < 20) {
          draft.abilities[k]++;
          refresh();
        }
      });

      stepper.appendChild(minus);
      stepper.appendChild(vals);
      stepper.appendChild(plus);
      row.appendChild(stepper);
      list.appendChild(row);

      scoreEls[k] = scoreEl;
      modEls[k] = modEl;
      plusBtns[k] = plus;
      minusBtns[k] = minus;
    });
    wrap.appendChild(list);

    refresh();

    return wrap;
  }

  function renderBackground(container) {
    var manual = window.MANUAL_55;
    var all = manual.backgrounds || {};

    container.appendChild(el('div', 'create-saves-line',
      'Da dove vieni: dà due competenze, uno strumento, un talento d\'origine e gli aumenti di caratteristica.'));

    var chipRow = el('div', 'chip-row');
    container.appendChild(chipRow);
    var detail = el('div');
    container.appendChild(detail);

    function renderDetail() {
      detail.textContent = '';
      var bg = currentBg();
      if (!bg) {
        return;
      }
      var feat = (manual.originFeats || {})[bg.featId] || {};
      var skillLabels = bg.skills.map(function (id) {
        var s = (window.AppEngine.SKILLS || []).filter(function (x) { return x.id === id; })[0];

        return s ? s.label : id;
      });

      detail.appendChild(el('div', 'edit-section-label', 'Cosa ti dà'));
      detail.appendChild(el('div', 'create-pack-line',
        'Competenze: ' + skillLabels.join(', ')));
      detail.appendChild(el('div', 'create-pack-line',
        'Strumenti: ' + (bg.tool || bg.toolChoice + ' (a scelta)')));
      detail.appendChild(el('div', 'create-pack-line',
        'Talento: ' + feat.name + (bg.featNote ? ' — ' + bg.featNote : '')));
      if (feat.desc) {
        detail.appendChild(el('div', 'create-saves-line', feat.desc));
      }

      // Strumento da scegliere (es. "uno a scelta fra gli strumenti da
      // artigiano"): campo libero, il catalogo degli strumenti non c'è ancora.
      if (bg.toolChoice) {
        var toolIn = document.createElement('input');
        toolIn.type = 'text';
        toolIn.className = 'create-in';
        toolIn.value = draft.bgTool;
        toolIn.placeholder = bg.toolChoice + ' — quale?';
        toolIn.addEventListener('input', function () {
          draft.bgTool = toolIn.value;
          updateNav();
        });
        detail.appendChild(el('div', 'edit-section-label', 'Quale ' + bg.toolChoice.toLowerCase() + '?'));
        detail.appendChild(toolIn);
      }

      /* Iniziato alla Magia è l'unico talento d'origine che chiede altre
         scelte: 2 trucchetti e 1 incantesimo di 1° livello dalla lista della
         classe indicata dal background (Chierico, Druido o Mago). */
      var miList = magicInitiateList();
      if (miList) {
        var nomeLista = (window.MANUAL_55.classes[miList] || {}).name || miList;
        buildSpellPicker(detail, 'Trucchetti del ' + nomeLista + ' — scegline 2',
          classSpellsAt(miList, 0), 2, 'miCantrips');
        buildSpellPicker(detail, 'Incantesimo di 1° livello del ' + nomeLista + ' — scegline 1',
          classSpellsAt(miList, 1), 1, 'miSpells');
      } else {
        draft.miCantrips = [];
        draft.miSpells = [];
      }

      // Aumenti di caratteristica: +2 e +1, oppure +1 a tutte e tre.
      detail.appendChild(el('div', 'edit-section-label', 'Aumenti di caratteristica'));
      var modeRow = el('div', 'chip-row');
      [{ id: '2-1', label: '+2 e +1' }, { id: '1-1-1', label: '+1 a tutte e tre' }].forEach(function (m) {
        var chip = el('button', 'chip' + (draft.bgBonusMode === m.id ? ' on' : ''), m.label);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          draft.bgBonusMode = m.id;
          renderDetail();
          updateNav();
        });
        modeRow.appendChild(chip);
      });
      detail.appendChild(modeRow);

      if (draft.bgBonusMode === '2-1') {
        [{ key: 'bgPlus2', label: 'Chi prende +2' }, { key: 'bgPlus1', label: 'Chi prende +1' }].forEach(function (slot) {
          detail.appendChild(el('div', 'create-label', slot.label));
          var row = el('div', 'chip-row');
          bg.abilities.forEach(function (k) {
            var chip = el('button', 'chip' + (draft[slot.key] === k ? ' on' : ''), ABILITY_LABELS[k]);
            chip.type = 'button';
            chip.addEventListener('click', function () {
              // Un punteggio non può prendere sia il +2 sia il +1: scegliendolo
              // qui, si libera dall'altro slot.
              var other = slot.key === 'bgPlus2' ? 'bgPlus1' : 'bgPlus2';
              if (draft[other] === k) {
                draft[other] = null;
              }
              draft[slot.key] = draft[slot.key] === k ? null : k;
              renderDetail();
              updateNav();
            });
            row.appendChild(chip);
          });
          detail.appendChild(row);
        });
      } else {
        detail.appendChild(el('div', 'create-saves-line',
          '+1 a ' + bg.abilities.map(function (k) { return ABILITY_LABELS[k]; }).join(', ') + '.'));
      }
    }

    Object.keys(all).forEach(function (id) {
      var chip = el('button', 'chip' + (draft.backgroundId === id ? ' on' : ''), all[id].name);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        if (draft.backgroundId === id) {
          return;
        }
        draft.backgroundId = id;
        // Cambiando background le scelte precedenti non valgono più.
        draft.bgPlus2 = null;
        draft.bgPlus1 = null;
        draft.bgTool = '';
        render();
      });
      chipRow.appendChild(chip);
    });

    renderDetail();
    updateNav();
  }

  function renderPunteggi(container) {
    /* Riepilogo del background in cima: i suoi aumenti si vedono mentre si
       distribuiscono i punti — è il motivo per cui questo passo viene dopo. */
    var bg = currentBg();
    if (bg) {
      var recap = el('div', 'create-bg-recap');
      recap.appendChild(el('div', 'create-bg-recap-title', bg.name));
      var righe = el('div');
      recap.appendChild(righe);
      container.appendChild(recap);

      /* Si riscrive a ogni modifica dei punteggi (updateNav la richiama):
         altrimenti resterebbe ferma ai valori di partenza e non servirebbe a
         nulla — il punto di questo passo è vedere il totale mentre distribuisci. */
      bgRecapRefresh = function () {
        var bonus = bgBonusMap();
        righe.textContent = '';
        bg.abilities.forEach(function (k) {
          var b = bonus[k];
          var base = draft.abilities[k];
          righe.appendChild(el('div', 'create-pack-line',
            ABILITY_LABELS[k] + ': ' + (base == null ? '—' : base) +
            (b && base != null ? ' + ' + b + ' = ' + (base + b) : (b ? ' + ' + b : ' (nessun aumento)'))));
        });
      };
      bgRecapRefresh();
    }

    // Selettore di metodo: 3 chip (riuso .chip/.chip-row di edit-sheet.css).
    // Il click cambia draft.scoreMethod, reimposta draft.abilities in modo
    // coerente (resetAbilitiesForMethod) e ridisegna solo la sezione sotto.
    var METHODS = [
      { id: 'pointbuy', label: 'Point-buy' },
      { id: 'array', label: 'Array standard' },
      { id: 'manual', label: 'Manuale' }
    ];

    var methodRow = el('div', 'chip-row create-method-row');
    var sectionWrap = el('div');

    function renderSection() {
      sectionWrap.textContent = ''; // svuota: si ricostruisce con createElement
      if (draft.scoreMethod === 'pointbuy') {
        sectionWrap.appendChild(buildPointBuySection());
      } else if (draft.scoreMethod === 'array') {
        sectionWrap.appendChild(buildArraySection());
      } else {
        sectionWrap.appendChild(buildManualSection());
      }
    }

    function renderChips() {
      methodRow.textContent = '';
      METHODS.forEach(function (m) {
        var chip = el('button', 'chip' + (draft.scoreMethod === m.id ? ' on' : ''), m.label);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          if (draft.scoreMethod === m.id) {
            return;
          }
          draft.scoreMethod = m.id;
          resetAbilitiesForMethod(m.id);
          renderChips();
          renderSection();
        });
        methodRow.appendChild(chip);
      });
    }

    renderChips();
    container.appendChild(methodRow);
    container.appendChild(sectionWrap);
    renderSection();
  }

  /* ---------- passo: Competenze (b2.3) ---------- */

  function renderCompetenze(container) {
    var klass = window.MANUAL_55.classes[draft.classId] || {};

    // Riga di sola lettura: Tiri Salvezza fissi della classe (non si
    // scelgono in questo passo, sono mostrati solo per riferimento).
    var savesLabels = (klass.saves || []).map(function (k) { return ABILITY_LABELS[k]; });
    container.appendChild(el('div', 'create-saves-line',
      'Tiri Salvezza (dalla classe): ' + savesLabels.join(', ')));

    var skillsDef = classSkillsFor(draft.classId);
    var allSkills = (window.AppEngine && window.AppEngine.SKILLS) || [];
    var fromBg = bgSkills();

    function labelOf(id) {
      var s = allSkills.filter(function (x) { return x.id === id; })[0];

      return s ? s.label : id;
    }

    /* Competenze già arrivate dal background: il PHB dice che non si prende
       due volte la stessa, quindi spariscono dalla lista della classe (e il
       numero da scegliere non cambia: si sceglie fra le rimanenti). */
    if (fromBg.length) {
      container.appendChild(el('div', 'create-saves-line',
        'Dal background: ' + fromBg.map(labelOf).join(', ') + ' — già tue, non si ripetono qui sotto.'));
    }

    var disponibili = skillsDef.from.filter(function (id) {
      return fromBg.indexOf(id) === -1;
    });

    // Se si torna qui dopo aver cambiato classe o background, scarta le
    // competenze non più selezionabili.
    draft.profSkills = draft.profSkills.filter(function (id) {
      return disponibili.indexOf(id) !== -1;
    });

    container.appendChild(el('div', 'edit-section-label', 'Scegli ' + skillsDef.count + ' competenze'));

    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);

    var chipRow = el('div', 'chip-row');
    container.appendChild(chipRow);

    var chipEls = {};

    function refresh() {
      var n = draft.profSkills.length;
      var atCap = n >= skillsDef.count;
      counterEl.textContent = n + ' / ' + skillsDef.count;

      disponibili.forEach(function (id) {
        var chip = chipEls[id];
        var isOn = draft.profSkills.indexOf(id) !== -1;
        chip.classList.toggle('on', isOn);
        var disable = atCap && !isOn;
        chip.disabled = disable;
        chip.classList.toggle('is-disabled', disable);
      });
      updateNav();
    }

    disponibili.forEach(function (id) {
      var match = allSkills.filter(function (s) { return s.id === id; })[0];
      var chip = el('button', 'chip', match ? match.label : id);
      chip.type = 'button';

      chip.addEventListener('click', function () {
        var idx = draft.profSkills.indexOf(id);
        if (idx !== -1) {
          draft.profSkills.splice(idx, 1);
        } else if (draft.profSkills.length < skillsDef.count) {
          draft.profSkills.push(id);
        }
        refresh();
      });

      chipEls[id] = chip;
      chipRow.appendChild(chip);
    });

    refresh();
  }

  /* ---------- passo: Equipaggiamento (b2.4) ---------- */

  // Imposta l'equipaggiamento in bozza ai default della classe la prima volta
  // che si entra nel passo e ogni volta che la classe è cambiata da quando
  // erano stati impostati (stesso spirito dell'auto-correzione delle
  // competenze al cambio classe: cambiare classe rimette il kit di quella
  // classe). Se la classe non è cambiata, conserva le modifiche manuali.
  function ensureEquipDraft() {
    if (!draft.equip || draft.equipForClass !== draft.classId) {
      draft.equip = defaultEquipFor(draft.classId);
      draft.equipForClass = draft.classId;
    }
  }

  // Riga di dettaglio dentro la card di un pacchetto: "Cotta di Maglia — CA 16".
  function packLine(text) {
    return el('div', 'create-pack-line', text);
  }

  // Card selezionabile di un pacchetto (A o B), col contenuto in chiaro.
  function packCard(letter, pack, selected, onPick) {
    var card = el('button', 'create-pack' + (selected ? ' on' : ''));
    card.type = 'button';
    card.appendChild(el('div', 'create-pack-title', letter.toUpperCase() + ' · ' + pack.label));

    if (pack.armorId) {
      card.appendChild(packLine(window.AppEngine.armorLabel(pack.armorId)));
    }
    if (pack.shield) {
      var sh = window.MANUAL_55.shield || { name: 'Scudo', ac: 2 };
      card.appendChild(packLine(sh.name + ' — CA +' + sh.ac));
    }
    var w = pack.weaponId ? weaponById(pack.weaponId) : null;
    if (w) {
      card.appendChild(packLine(w.name + ' — ' + w.die + ' ' + w.dmg));
    }
    (pack.extra || []).forEach(function (it) {
      card.appendChild(packLine((it.qty > 1 ? it.qty + ' × ' : '') + it.name));
    });
    var mo = (pack.coins || {}).mo || 0;
    if (mo) {
      card.appendChild(packLine(mo + ' monete d\'oro'));
    }
    if (!pack.armorId && !pack.weaponId) {
      card.appendChild(packLine('Nessun equipaggiamento: te lo compri col master.'));
    }

    card.addEventListener('click', function () { onPick(letter); });

    return card;
  }

  function renderEquipaggiamento(container) {
    ensureEquipDraft();
    var eq = draft.equip;
    var packs = packsFor(draft.classId);

    if (!packs) {
      container.appendChild(el('div', 'create-saves-line',
        'Per questa classe l\'equipaggiamento iniziale non è ancora nei dati del manuale: si parte senza nulla e si aggiunge dalla scheda.'));
    } else {
      container.appendChild(el('div', 'edit-section-label', 'Equipaggiamento iniziale'));
      container.appendChild(el('div', 'create-saves-line',
        'Le due opzioni del manuale. Quello che il master ti concede in più lo aggiungi dopo, dalla scheda.'));

      var cardRow = el('div', 'create-pack-row');
      ['a', 'b'].forEach(function (letter) {
        if (!packs[letter]) {
          return;
        }
        cardRow.appendChild(packCard(letter, packs[letter], eq.pack === letter, function (picked) {
          eq.pack = picked;
          render(); // ridisegna: cambia la card selezionata
        }));
      });
      container.appendChild(cardRow);
    }

    /* Secondo pacchetto: quello del background. Il PHB ne dà uno per la classe
       e uno per l'origine, e si sceglie A o B in entrambi (5.B.4). */
    var bg = currentBg();
    if (bg) {
      container.appendChild(el('div', 'edit-section-label', 'Dal background — ' + bg.name));
      var bgRow = el('div', 'create-pack-row');
      ['a', 'b'].forEach(function (letter) {
        var pack = bg.equipment[letter];
        if (!pack) {
          return;
        }
        var card = el('button', 'create-pack' + (draft.bgPack === letter ? ' on' : ''));
        card.type = 'button';
        card.appendChild(el('div', 'create-pack-title',
          letter.toUpperCase() + ' · ' + (pack.label || 'Solo monete')));
        (pack.items || []).forEach(function (it) {
          card.appendChild(el('div', 'create-pack-line', it));
        });
        var bgMo = (pack.coins || {}).mo || 0;
        if (bgMo) {
          card.appendChild(el('div', 'create-pack-line', bgMo + ' monete d\'oro'));
        }
        card.addEventListener('click', function () {
          draft.bgPack = letter;
          render();
        });
        bgRow.appendChild(card);
      });
      container.appendChild(bgRow);
    }

    // Maestria nelle armi: scelta vera fra le armi in cui la classe è
    // competente, non più un campo di testo facoltativo (5.B.5).
    var count = masteryCountFor(draft.classId);
    if (count > 0) {
      var choices = masteryChoicesFor(draft.classId).map(function (w) {
        return { id: w.id, name: w.name + ' · ' + w.mastery };
      });
      buildSpellPicker(container, 'Maestria nelle armi — scegline ' + count,
        choices, count, 'masteries');
    }
  }

  /* ---------- passo finale: Sottoclasse e Incantesimi (b2.5) ---------- */

  // Selettore a chip di `count` incantesimi tra `spells` (voci del catalogo del
  // manuale), che scrive gli id scelti in draft[draftKey]. Stessa meccanica dei
  // chip competenza (cap a count, contatore, stato disabilitato al tetto);
  // scarta le selezioni non più valide se la lista cambia (cambio classe).
  function buildSpellPicker(container, title, spells, count, draftKey) {
    var validIds = spells.map(function (s) { return s.id; });
    draft[draftKey] = (draft[draftKey] || []).filter(function (id) {
      return validIds.indexOf(id) !== -1;
    });

    container.appendChild(el('div', 'edit-section-label', title));
    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);
    var chipRow = el('div', 'chip-row');
    container.appendChild(chipRow);

    var chipEls = {};

    function refresh() {
      var n = draft[draftKey].length;
      var atCap = n >= count;
      counterEl.textContent = n + ' / ' + count;
      spells.forEach(function (s) {
        var chip = chipEls[s.id];
        var isOn = draft[draftKey].indexOf(s.id) !== -1;
        chip.classList.toggle('on', isOn);
        var disable = atCap && !isOn;
        chip.disabled = disable;
        chip.classList.toggle('is-disabled', disable);
      });
      updateNav();
    }

    spells.forEach(function (s) {
      var chip = el('button', 'chip', s.name);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        var idx = draft[draftKey].indexOf(s.id);
        if (idx !== -1) {
          draft[draftKey].splice(idx, 1);
        } else if (draft[draftKey].length < count) {
          draft[draftKey].push(s.id);
        }
        refresh();
      });
      chipEls[s.id] = chip;
      chipRow.appendChild(chip);
    });

    refresh();
  }

  function renderFinale(container) {
    var klass = window.MANUAL_55.classes[draft.classId] || {};

    // Nota sottoclasse: a livello 1 nessuna classe la sceglie (tutte al 3).
    container.appendChild(el('div', 'create-saves-line',
      'La sottoclasse si sceglie al livello 3, non alla creazione.'));

    var isCaster = klass.casterType && klass.casterType !== 'none';
    if (!isCaster) {
      // Non-caster (es. Barbaro): niente incantesimi al livello 1. Ripulisco
      // eventuali scelte rimaste da una classe caster selezionata prima.
      draft.cantrips = [];
      draft.preparedSpells = [];
      container.appendChild(el('div', 'create-saves-line',
        'Questa classe non lancia incantesimi al livello 1: non c’è altro da scegliere qui.'));
      updateNav();

      return;
    }

    var needCantrips = (klass.cantripsByLevel && klass.cantripsByLevel[CREATE_LEVEL]) || 0;
    var needPrepared = (klass.preparedByLevel && klass.preparedByLevel[CREATE_LEVEL]) || 0;

    /* Quello che il talento d'origine ha già dato non si può riprendere qui:
       gli incantesimi da talento non contano fra i preparabili, quindi
       sceglierli di nuovo sarebbe solo uno spreco (e un doppione a video). */
    var giaAvuti = (draft.miCantrips || []).concat(draft.miSpells || []);
    function senzaGiaAvuti(list) {
      return list.filter(function (s) { return giaAvuti.indexOf(s.id) === -1; });
    }

    if (giaAvuti.length) {
      container.appendChild(el('div', 'create-saves-line',
        'Dal talento d\'origine hai già: ' + giaAvuti.map(function (id) {
          var s = (window.MANUAL_55.spells || []).filter(function (x) { return x.id === id; })[0];

          return s ? s.name : id;
        }).join(', ') + '.'));
    }

    if (needCantrips > 0) {
      buildSpellPicker(container, 'Trucchetti (scegline ' + needCantrips + ')',
        senzaGiaAvuti(classSpellsAt(draft.classId, 0)), needCantrips, 'cantrips');
    } else {
      draft.cantrips = [];
    }

    if (needPrepared > 0) {
      buildSpellPicker(container, 'Incantesimi preparati di 1° livello (scegline ' + needPrepared + ')',
        senzaGiaAvuti(classSpellsAt(draft.classId, 1)), needPrepared, 'preparedSpells');
    } else {
      draft.preparedSpells = [];
    }

    updateNav();
  }

  /* ---------- generazione del personaggio (b3) ---------- */

  // Id del nuovo personaggio: slug dal nome (senza accenti/simboli) + suffisso
  // casuale breve, per non collidere con documenti esistenti (es.
  // tharion-velnar) né tra personaggi con lo stesso nome.
  function makeCharId(name) {
    var slug = (name || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
    if (!slug) { slug = 'eroe'; }

    return slug + '-' + Math.random().toString(36).slice(2, 6);
  }

  // Oggetto `character` (fatti base) dal draft + dati di classe/specie del
  // manuale. Parte da zero: nessun residuo di Tharion. Sottoclasse assente
  // (si sceglie al livello 3) e stile di combattimento 'nessuno' (arriva col
  // level-up); i TS competenti sono quelli fissi della classe.
  // Punteggi finali = quelli del passo Punteggi + gli aumenti del background.
  function finalAbilities() {
    var bonus = bgBonusMap();
    var out = {};
    ABILITY_ORDER.forEach(function (k) {
      out[k] = (draft.abilities[k] || 0) + bonus[k];
    });

    return out;
  }

  function buildCharacter() {
    var manual = window.MANUAL_55;
    var klass = manual.classes[draft.classId] || {};
    var species = manual.species[draft.speciesId] || {};
    var pack = chosenPack();
    var bg = currentBg();

    var armor = { shield: !!(pack && pack.shield) };
    if (pack && pack.armorId) { armor.id = pack.armorId; }

    /* Arma impugnata: quella del pacchetto, con dado e tipo di danno presi dal
       catalogo invece che digitati a mano. La maestria è quella scelta nel
       passo, se riguarda proprio quest'arma (le altre restano privilegi del
       personaggio, non proprietà dell'arma in mano). */
    var w = pack && pack.weaponId ? weaponById(pack.weaponId) : null;
    var mastery = (w && draft.masteries.indexOf(w.id) !== -1) ? w.mastery : '';

    return {
      name: (draft.name || '').trim(),
      classId: draft.classId,
      subclassId: null,
      subclassName: '',
      level: CREATE_LEVEL,
      speciesId: draft.speciesId,
      speciesLabel: species.name || '',
      avatar: '✦',
      // Punteggi finali: quelli distribuiti nel passo Punteggi più gli aumenti
      // del background (5.B.4).
      abilities: finalAbilities(),
      backgroundId: draft.backgroundId,
      backgroundName: bg ? bg.name : '',
      profSaves: (klass.saves || []).slice(),
      // Competenze: quelle scelte dalla classe più le due del background.
      profSkills: (draft.profSkills || []).concat(bgSkills()),
      profTools: bg ? [bg.tool || draft.bgTool.trim()].filter(Boolean) : [],
      fightingStyle: 'nessuno',
      armor: armor,
      weapon: {
        name: w ? w.name : '', die: w ? w.die : '1d8',
        type: w ? w.dmg : '', mastery: mastery
      },
      // Maestrie possedute (id di armi): il personaggio le sa usare anche se
      // in mano ha un'altra arma.
      weaponMasteries: (draft.masteries || []).slice(),
      // Talento d'origine: lo dà il background e vale dal livello 1.
      feats: bg ? [{ id: bg.featId, level: 1, source: 'background' }] : [],
      modifiers: [], extraResources: [], items: [], levelChoices: {}
    };
  }

  // Pacchetto scelto (o null: classe senza pacchetti nei dati).
  function chosenPack() {
    var packs = packsFor(draft.classId);
    var letter = (draft.equip || {}).pack;

    return (packs && letter && packs[letter]) || null;
  }

  /* Roba del pacchetto che finisce nella sacca personale: le armi di scorta
     (giavellotti, asce da lancio) col loro peso dal catalogo, e i kit. Il peso
     dei kit non è nel PHB, resta 0 (vedi Debiti aperti nella ROADMAP). */
  function packInventory() {
    var pack = chosenPack();
    var lista = ((pack && pack.extra) || []).map(function (it) {
      var w = it.weaponId ? weaponById(it.weaponId) : null;

      return {
        name: it.name,
        desc: it.desc || (w ? w.die + ' ' + w.dmg + ' · ' + w.mastery : ''),
        qty: it.qty || 1,
        // peso proprio dell'oggetto, oppure quello dell'arma dal catalogo
        weight: it.weight != null ? it.weight : (w ? w.weight : 0)
      };
    });

    /* Roba del background: nel PHB è un elenco di oggetti comuni senza pesi
       nella riga del background, quindi entra con peso 0 — meglio averla in
       lista che non averla (vedi Debiti aperti). */
    var bgPack = bgChosenPack();
    ((bgPack && bgPack.items) || []).forEach(function (name) {
      lista.push({ name: name, desc: 'Dal background', qty: 1, weight: 0 });
    });

    /* Se classe e background danno la stessa identica cosa — il simbolo sacro
       del Paladino Accolito — resta una sola voce: due righe uguali nella sacca
       sono solo confusione. Vince quella con la quantità maggiore. */
    var unici = [];
    lista.forEach(function (it) {
      var gia = unici.filter(function (x) { return x.name === it.name; })[0];
      if (!gia) {
        unici.push(it);
      } else if ((it.qty || 1) > (gia.qty || 1)) {
        gia.qty = it.qty;
        gia.weight = it.weight;
      }
    });

    return unici;
  }

  function bgChosenPack() {
    var bg = currentBg();

    return (bg && bg.equipment[draft.bgPack]) || null;
  }

  // Stato completo e pulito del nuovo personaggio. I pool correnti partono al
  // massimo del livello 1 (ricavati dal motore: PF pieni, Imposizione piena
  // per il Paladino, nessun destriero); monete ed equipaggiamento sono quelli
  // del pacchetto scelto (5.B.5), diario vuoto. Gli incantesimi scelti
  // finiscono nel grimorio.
  function buildStateFromDraft() {
    var character = buildCharacter();
    var poolMax = (window.AppEngine.derive(character).poolMax) || {};
    // Monete: si sommano quelle del pacchetto di classe e quelle del background.
    var classCoins = (chosenPack() || {}).coins || {};
    var bgCoins = (bgChosenPack() || {}).coins || {};
    var packCoins = {
      mp: (classCoins.mp || 0) + (bgCoins.mp || 0),
      mo: (classCoins.mo || 0) + (bgCoins.mo || 0),
      ma: (classCoins.ma || 0) + (bgCoins.ma || 0),
      mr: (classCoins.mr || 0) + (bgCoins.mr || 0)
    };

    return {
      version: 3,
      character: character,
      pools: { hp: poolMax.hp || 0, loh: poolMax.loh || 0, steedhp: 0, tempHp: 0 },
      spent: {},
      coins: {
        mp: packCoins.mp || 0, mo: packCoins.mo || 0,
        ma: packCoins.ma || 0, mr: packCoins.mr || 0
      },
      steed: { name: '' },
      treasury: {
        carryMax: (character.abilities.FOR || 10) * 15, // capacità PHB = FOR × 15
        partyItems: [], personalItems: packInventory()
      },
      diary: { sessions: [], png: [], quests: { active: [], completed: [] } },
      inspiration: false,
      deathSaves: { success: 0, fail: 0 },
      grimoire: {
        prepared: (draft.preparedSpells || []).slice(),
        // I trucchetti del talento si sommano a quelli eventuali della classe.
        cantrips: (draft.cantrips || []).concat(draft.miCantrips || []),
        /* `always` = incantesimi che il personaggio ha sempre pronti per via di
           un talento, senza contare verso quelli preparabili. Oggi ci finisce
           quello di Iniziato alla Magia. */
        always: (draft.miSpells || []).slice()
      }
    };
  }

  // "Crea personaggio" (ultimo passo): genera lo stato dal draft, torna alla
  // dashboard e delega a AppCloud la persistenza (localStorage + Firestore) e
  // il refresh della lista. Non cambia il personaggio attivo: nel nuovo si
  // entra dalla dashboard, come per gli altri.
  function finishCreation() {
    if (!finaleValid()) {
      return;
    }
    var id = makeCharId(draft.name);
    var state = buildStateFromDraft();
    close();
    if (window.AppCloud && window.AppCloud.createCharacter) {
      window.AppCloud.createCharacter(id, state);
    }
  }

  /* ---------- render ---------- */

  function render() {
    var step = STEPS[stepIndex];
    bgRecapRefresh = null; // il riepilogo appartiene al solo passo Punteggi

    if (progressFillEl) {
      progressFillEl.style.width = ((stepIndex + 1) / STEPS.length * 100) + '%';
    }
    if (stepNumEl) {
      stepNumEl.textContent = 'Passo ' + (stepIndex + 1) + ' di ' + STEPS.length;
    }
    if (stepTitleEl) {
      stepTitleEl.textContent = step.title;
    }
    if (stepBodyEl) {
      stepBodyEl.innerHTML = '';
      if (step.id === 'specie') {
        stepBodyEl.classList.add('has-fields');
        renderSpecie(stepBodyEl);
      } else if (step.id === 'classe') {
        stepBodyEl.classList.add('has-fields');
        renderClasse(stepBodyEl);
      } else if (step.id === 'background') {
        stepBodyEl.classList.add('has-fields');
        renderBackground(stepBodyEl);
      } else if (step.id === 'punteggi') {
        stepBodyEl.classList.add('has-fields');
        renderPunteggi(stepBodyEl);
      } else if (step.id === 'competenze') {
        stepBodyEl.classList.add('has-fields');
        renderCompetenze(stepBodyEl);
      } else if (step.id === 'equipaggiamento') {
        stepBodyEl.classList.add('has-fields');
        renderEquipaggiamento(stepBodyEl);
      } else if (step.id === 'finale') {
        stepBodyEl.classList.add('has-fields');
        renderFinale(stepBodyEl);
      } else {
        // Difensivo: tutti i 6 passi hanno ora un contenuto reale, questo ramo
        // non dovrebbe mai scattare.
        stepBodyEl.classList.remove('has-fields');
        stepBodyEl.textContent = '';
      }
    }
    updateNav();
  }

  // Bottone "Avanti"/"Crea personaggio" e nota in calce: separata da
  // render() perché va richiamata anche dagli input/tile dei passi, senza
  // ridisegnare tutto il corpo del passo (che perderebbe focus/selezione).
  function updateNav() {
    var isLast = stepIndex === STEPS.length - 1;

    // Le sezioni dei punteggi chiamano updateNav a ogni modifica: è il punto
    // giusto per tenere allineato il riepilogo del background.
    if (bgRecapRefresh) {
      bgRecapRefresh();
    }

    if (nextBtn) {
      nextBtn.textContent = isLast ? 'Crea personaggio' : 'Avanti →';
      // Il bottone dipende sempre dalla validità del passo corrente; all'ultimo
      // passo stepValid() = finaleValid() e il click genera il personaggio (b3).
      nextBtn.disabled = !stepValid();
      nextBtn.classList.toggle('is-disabled', nextBtn.disabled);
    }
    if (footerNoteEl) {
      footerNoteEl.textContent = '';
      footerNoteEl.classList.add('hidden');
    }
  }

  /* ---------- navigazione ---------- */

  function next() {
    if (nextBtn && nextBtn.disabled) {
      return; // passo non valido
    }
    if (stepIndex >= STEPS.length - 1) {
      finishCreation(); // ultimo passo: "Crea personaggio" genera il personaggio
      return;
    }
    stepIndex = Math.min(STEPS.length - 1, stepIndex + 1);
    render();
  }

  function back() {
    if (stepIndex <= 0) {
      close(); // Indietro al passo 0 esce dal wizard e torna alla dashboard
      return;
    }
    stepIndex = Math.max(0, stepIndex - 1);
    render();
  }

  /* ---------- apertura / chiusura ---------- */

  function open() {
    stepIndex = 0;
    draft = {
      name: '', speciesId: null, classId: null,
      scoreMethod: 'pointbuy',
      abilities: { FOR: 8, DES: 8, COS: 8, INT: 8, SAG: 8, CAR: 8 },
      profSkills: [],
      backgroundId: null,
      bgBonusMode: '2-1', bgPlus2: null, bgPlus1: null,
      bgTool: '', bgPack: 'a',
      miCantrips: [], miSpells: [],
      equip: null, equipForClass: null, masteries: [],
      cantrips: [], preparedSpells: []
    };
    document.body.classList.remove('in-dashboard');
    document.body.classList.add('in-create');
    render();
  }

  function close() {
    document.body.classList.remove('in-create');
    document.body.classList.add('in-dashboard');
    stepIndex = 0;
  }

  /* ---------- avvio ---------- */

  function init() {
    progressFillEl = document.getElementById('create-progress-fill');
    stepNumEl = document.getElementById('create-step-num');
    stepTitleEl = document.getElementById('create-step-title');
    stepBodyEl = document.getElementById('create-step-body');
    backBtn = document.getElementById('create-back');
    nextBtn = document.getElementById('create-next');
    footerNoteEl = document.getElementById('create-footer-note');
    var cancelBtn = document.getElementById('create-cancel');

    if (!stepBodyEl || !backBtn || !nextBtn) {
      return;
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', close);
    }
    backBtn.addEventListener('click', back);
    nextBtn.addEventListener('click', next);
  }

  window.AppCreate = {
    init: init,
    open: open
  };
})();
