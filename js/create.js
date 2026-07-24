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
   * - b2.4 (qui): contenuto reale del passo Equipaggiamento — armatura,
   *   scudo e arma, con default sensati per classe (equip. iniziale del PHB
   *   2024, opzione A) tutti modificabili; NIENTE stile di combattimento
   *   (per il Paladino è una scelta di livello 2, il Barbaro non lo prende
   *   mai → arriva col level-up). Resta segnaposto solo Sottoclasse/
   *   Incantesimi, in arrivo nei prossimi sotto-step.
   * - b3   (in arrivo): generazione vera del personaggio.
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
    // Equipaggiamento (b2.4): impostato in modo pigro dai default di classe
    // quando si entra nel passo (ensureEquipDraft); equipForClass ricorda per
    // quale classe è stato riempito, così cambiando classe si riparte dal kit
    // giusto.
    equip: null, equipForClass: null
  };

  var progressFillEl, stepNumEl, stepTitleEl, stepBodyEl, backBtn, nextBtn, footerNoteEl;

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

  // Armature selezionabili (stesse di js/edit-sheet.js): id vuoto = nessuna
  // armatura → nel motore diventa la Difesa senza armatura se la classe ne ha
  // una (es. Barbaro/COS). WEAPON_DICE = stessi dadi danno dell'editor scheda.
  var ARMOR_OPTIONS = [
    { id: '', label: 'Nessuna armatura' },
    { id: 'cuoio-borchiato', label: 'Cuoio Borchiato' },
    { id: 'mezza-piastra', label: 'Mezza Piastra' },
    { id: 'cotta-maglia', label: 'Cotta di Maglia' },
    { id: 'piastre', label: 'Piastre' }
  ];
  var WEAPON_DICE = ['1d4', '1d6', '1d8', '1d10', '1d12', '2d6'];

  // Equipaggiamento iniziale sensato per classe: opzione A della lista
  // "Starting Equipment" del PHB 2024 (Barbaro p.49 → Ascia bipenne, nessuna
  // armatura perché usa la Difesa senza armatura; Paladino p.107 → Cotta di
  // Maglia + Scudo + Spada lunga a una mano, 1d8). Tutti i campi restano
  // modificabili nel passo; la maestria resta vuota (facoltativa). Le classi
  // non ancora giocabili usano il kit neutro di defaultEquipFor().
  var CLASS_EQUIP = {
    barbaro:  { armorId: '', shield: false, weaponName: 'Ascia bipenne', weaponDie: '1d12', weaponType: 'tagl.', weaponMastery: '' },
    paladino: { armorId: 'cotta-maglia', shield: true, weaponName: 'Spada lunga', weaponDie: '1d8', weaponType: 'tagl.', weaponMastery: '' }
  };

  // Copia FRESCA dei default per una classe (mai un riferimento a CLASS_EQUIP,
  // che verrebbe poi mutato dagli input del passo). Fallback neutro per le
  // classi senza preset dedicato.
  function defaultEquipFor(classId) {
    var p = CLASS_EQUIP[classId];
    if (p) {
      return {
        armorId: p.armorId, shield: p.shield,
        weaponName: p.weaponName, weaponDie: p.weaponDie,
        weaponType: p.weaponType, weaponMastery: p.weaponMastery
      };
    }

    return { armorId: '', shield: false, weaponName: '', weaponDie: '1d8', weaponType: '', weaponMastery: '' };
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
    if (step.id === 'punteggi') {
      return scoresValid();
    }
    if (step.id === 'competenze') {
      return draft.profSkills.length === classSkillsFor(draft.classId).count;
    }

    // Equipaggiamento: nessun vincolo (i default di classe riempiono già i
    // campi e tutto è modificabile). Passo finale ancora segnaposto.
    return true;
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
      // Di fatto sempre vero se gli stepper rispettano i vincoli (8-15,
      // costo entro budget), ma la verifica resta esplicita.
      var inRange = ABILITY_ORDER.every(function (k) {
        var v = draft.abilities[k];
        return v >= 8 && v <= 15;
      });

      return inRange && pointBuyUsed() <= POINT_BUY_BUDGET;
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

  function renderPunteggi(container) {
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

    // Se si torna qui dopo essere tornati indietro e aver cambiato classe,
    // scarta eventuali competenze scelte per la classe precedente che non
    // sono più tra quelle disponibili per la classe attuale.
    draft.profSkills = draft.profSkills.filter(function (id) {
      return skillsDef.from.indexOf(id) !== -1;
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

      skillsDef.from.forEach(function (id) {
        var chip = chipEls[id];
        var isOn = draft.profSkills.indexOf(id) !== -1;
        chip.classList.toggle('on', isOn);
        var disable = atCap && !isOn;
        chip.disabled = disable;
        chip.classList.toggle('is-disabled', disable);
      });
      updateNav();
    }

    skillsDef.from.forEach(function (id) {
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

  // Campo "etichetta + controllo" con la spaziatura uniforme del passo
  // (.create-field): usato sia per i <select> (armatura, dado) sia per gli
  // input di testo (nome arma, tipo, maestria).
  function equipField(labelText, controlEl) {
    var field = el('div', 'create-field');
    field.appendChild(el('label', 'create-label', labelText));
    field.appendChild(controlEl);

    return field;
  }

  function equipSelect(options, selectedValue, ariaLabel, onChange) {
    var select = document.createElement('select');
    select.className = 'edit-select';
    select.setAttribute('aria-label', ariaLabel);
    options.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === selectedValue) {
        o.selected = true;
      }
      select.appendChild(o);
    });
    select.addEventListener('change', function () { onChange(select.value); });

    return select;
  }

  function equipTextInput(value, onInput) {
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'create-in';
    input.value = value || '';
    input.addEventListener('input', function () { onInput(input.value); });

    return input;
  }

  function renderEquipaggiamento(container) {
    ensureEquipDraft();
    var eq = draft.equip;

    // Armatura.
    container.appendChild(equipField('Armatura',
      equipSelect(ARMOR_OPTIONS, eq.armorId, 'Armatura', function (v) { eq.armorId = v; })));

    // Scudo: chip on/off, indipendente dall'armatura (come nel motore: la
    // Difesa senza armatura ammette comunque lo scudo).
    var shieldChip = el('button', 'chip' + (eq.shield ? ' on' : ''), 'Scudo equipaggiato');
    shieldChip.type = 'button';
    shieldChip.addEventListener('click', function () {
      eq.shield = !eq.shield;
      shieldChip.classList.toggle('on', eq.shield);
    });
    container.appendChild(equipField('Scudo', shieldChip));

    // Arma.
    container.appendChild(el('div', 'edit-section-label', 'Arma'));
    container.appendChild(equipField('Nome',
      equipTextInput(eq.weaponName, function (v) { eq.weaponName = v; })));
    container.appendChild(equipField('Dado danni',
      equipSelect(WEAPON_DICE.map(function (d) { return { id: d, label: d }; }),
        eq.weaponDie, 'Dado danni', function (v) { eq.weaponDie = v; })));
    container.appendChild(equipField('Tipo di danno',
      equipTextInput(eq.weaponType, function (v) { eq.weaponType = v; })));
    container.appendChild(equipField('Maestria (facoltativa)',
      equipTextInput(eq.weaponMastery, function (v) { eq.weaponMastery = v; })));
  }

  /* ---------- render ---------- */

  function render() {
    var step = STEPS[stepIndex];

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
      } else if (step.id === 'punteggi') {
        stepBodyEl.classList.add('has-fields');
        renderPunteggi(stepBodyEl);
      } else if (step.id === 'competenze') {
        stepBodyEl.classList.add('has-fields');
        renderCompetenze(stepBodyEl);
      } else if (step.id === 'equipaggiamento') {
        stepBodyEl.classList.add('has-fields');
        renderEquipaggiamento(stepBodyEl);
      } else {
        // Segnaposto: resta solo il passo finale (Sottoclasse/Incantesimi);
        // la generazione vera del personaggio è il b3.
        stepBodyEl.classList.remove('has-fields');
        stepBodyEl.textContent = 'Contenuto del passo "' + step.title + '" — in arrivo.';
      }
    }
    updateNav();
  }

  // Bottone "Avanti"/"Crea personaggio" e nota in calce: separata da
  // render() perché va richiamata anche dagli input/tile dei passi, senza
  // ridisegnare tutto il corpo del passo (che perderebbe focus/selezione).
  function updateNav() {
    var isLast = stepIndex === STEPS.length - 1;

    if (nextBtn) {
      nextBtn.textContent = isLast ? 'Crea personaggio' : 'Avanti →';
      // La generazione vera arriva nel b3: all'ultimo passo il bottone resta
      // disabilitato; negli altri dipende dalla validità del passo corrente.
      nextBtn.disabled = isLast ? true : !stepValid();
      nextBtn.classList.toggle('is-disabled', nextBtn.disabled);
    }
    if (footerNoteEl) {
      footerNoteEl.textContent = isLast ? 'generazione in arrivo (b3)' : '';
      footerNoteEl.classList.toggle('hidden', !isLast);
    }
  }

  /* ---------- navigazione ---------- */

  function next() {
    if (nextBtn && nextBtn.disabled) {
      return; // passo non valido, oppure ultimo passo (bottone disabilitato)
    }
    if (stepIndex >= STEPS.length - 1) {
      return; // ultimo passo: "Crea personaggio" è disabilitato, nessuna azione
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
      equip: null, equipForClass: null
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
