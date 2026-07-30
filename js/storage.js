(function () {
  var cfg = window.APP_CONFIG;
  var state = null;
  var persistTimer = null;

  /* Fase 2 (dashboard multi-personaggio): ogni personaggio ha la sua chiave
     'char-<id>-state'. Il personaggio attivo è in 'app-active-char'
     (localStorage), impostato dalla dashboard prima di ricaricare la pagina. */
  var ACTIVE_CHAR_KEY = 'app-active-char';
  var DEFAULT_CHAR_ID = 'tharion-velnar';

  function activeCharId() {
    return localStorage.getItem(ACTIVE_CHAR_KEY) || DEFAULT_CHAR_ID;
  }

  function charStateKey(id) {
    return 'char-' + id + '-state';
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getDefaultState() {
    return deepClone(cfg.DEFAULT_STATE);
  }

  /* Scheletro NEUTRO di uno stato (5.B.3). `cfg.DEFAULT_STATE` è la scheda di
     Tharion: usarlo come base del merge per un personaggio qualsiasi gli
     regalava i campi che non dichiara (è così che a un paladino di 1° livello
     appena creato sono finiti addosso `initiativeNote: 'vant. iniziativa'` e il
     destriero). Da qui in poi la scheda storica si fonde sui propri default,
     tutti gli altri su questo scheletro: nessun dato di Tharion può colare. */
  var BASE_CHARACTER = {
    name: '',
    classId: '',
    subclassId: null,
    subclassName: '',
    level: 1,
    speciesId: '',
    speciesLabel: '',
    dragonAncestryId: null,
    elfLineageId: null,
    elfSkillId: null,
    goliathGiftId: null,
    tieflingLegacyId: null,
    gnomeLineageId: null,
    avatar: '✦',
    abilities: { FOR: 10, DES: 10, COS: 10, INT: 10, SAG: 10, CAR: 10 },
    profSaves: [],
    profSkills: [],
    // Competenza (doppio bonus di competenza) su alcune abilità già competenti
    // — Espero del Ladro (id delle abilità, sottoinsieme di profSkills).
    expertiseSkills: [],
    fightingStyle: 'nessuno',
    armor: { id: '', shield: false },
    weapon: { name: '', die: '1d8', type: '', mastery: '', finesse: false, ranged: false, twoHanded: false },
    initiativeNote: '',
    modifiers: [],
    extraResources: [],
    items: [],
    feats: [],
    // Opzioni di Metamagia conosciute (Stregone): [id, ...] — id da manual.metamagic.
    metamagicIds: [],
    // Invocazioni Occulte conosciute (Warlock): [id, ...] — id da manual.invocations.
    invocationIds: [],
    // Manovre conosciute (Guerriero, Maestro di Battaglia): [id, ...] — id da manual.maneuvers.
    maneuverIds: [],
    levelChoices: {}
  };

  var BASE_STATE = {
    version: 3,
    character: BASE_CHARACTER,
    pools: { loh: 0, hp: 0, steedhp: 0, tempHp: 0 },
    spent: {},
    coins: { mp: 0, mo: 0, ma: 0, mr: 0 },
    steed: { name: '' },
    treasury: { carryMax: 150, partyItems: [], personalItems: [] },
    diary: { sessions: [], png: [], quests: { active: [], completed: [] } },
    inspiration: false,
    deathSaves: { success: 0, fail: 0 },
    grimoire: { prepared: [], cantrips: [], always: [] }
  };

  function getBaseState() {
    return deepClone(BASE_STATE);
  }

  // Default su cui fondere uno stato salvato: la scheda storica sui suoi,
  // chiunque altro sullo scheletro neutro.
  function defaultsFor(id) {
    return id === DEFAULT_CHAR_ID ? getDefaultState() : getBaseState();
  }

  function migrateV1(raw) {
    var next = getDefaultState();
    if (raw.pools) {
      next.pools = Object.assign({}, next.pools, raw.pools);
      if (raw.pools.tempHp == null) {
        next.pools.tempHp = 0;
      }
    }
    if (raw.spent) {
      next.spent = Object.assign({}, raw.spent);
    }
    if (raw.coins) {
      next.coins = Object.assign({}, next.coins);
    }
    if (typeof raw.notes === 'string' && raw.notes.trim()) {
      next.diary.sessions.push({
        id: 'migrated-' + Date.now(),
        title: 'Note migrate',
        body: raw.notes
      });
    }
    if (Array.isArray(raw.potions)) {
      next.treasury.personalItems = raw.potions.map(function (it) {
        return {
          name: it.name || '',
          desc: (it.desc != null ? it.desc : it.effect) || '',
          qty: it.qty == null ? 1 : it.qty,
          weight: it.weight == null ? 0.5 : it.weight
        };
      });
    }
    if (Array.isArray(raw.items)) {
      next.treasury.partyItems = raw.items.map(function (it) {
        return {
          name: it.name || '',
          desc: (it.desc != null ? it.desc : it.effect) || '',
          qty: it.qty == null ? 1 : it.qty,
          weight: it.weight == null ? 1 : it.weight
        };
      });
    }
    try {
      if (localStorage.getItem(cfg.INSPIRATION_KEY) === '1') {
        next.inspiration = true;
      }
    } catch (e) { /* ignore */ }

    return next;
  }

  /* v3: i fatti base del personaggio entrano nello stato (state.character).
     Merge conservativo sui default: gli oggetti annidati si integrano campo
     per campo, gli array (competenze, modificatori…) vincono se presenti. */
  function mergeCharacter(def, saved) {
    if (!saved) {
      return def;
    }
    var out = Object.assign({}, def, saved);
    out.abilities = Object.assign({}, def.abilities, saved.abilities || {});
    out.armor = Object.assign({}, def.armor, saved.armor || {});
    out.weapon = Object.assign({}, def.weapon, saved.weapon || {});

    return out;
  }

  /* Adatta un oggetto salvato in formato v2/v3 allo stato corrente,
     integrando i campi mancanti con i default (stessa logica di sempre,
     estratta per essere riusata sia dalla chiave per-personaggio sia dalla
     migrazione dalla vecchia chiave legacy). `def` sono i default su cui
     fondere: la scheda di Tharion per la sua, lo scheletro neutro per tutti
     gli altri (vedi defaultsFor). */
  function fromSavedV2(parsed, def) {
    var base = def || getDefaultState();
    var next = deepClone(base);
    next = Object.assign(next, parsed);
    next.version = 3;
    next.character = mergeCharacter(base.character, parsed.character);
    next.pools = Object.assign(deepClone(base.pools), parsed.pools || {});
    next.coins = Object.assign(deepClone(base.coins), parsed.coins || {});
    next.steed = Object.assign(deepClone(base.steed), parsed.steed || {});
    next.treasury = Object.assign(deepClone(base.treasury), parsed.treasury || {});
    next.diary = Object.assign(deepClone(base.diary), parsed.diary || {});
    if (parsed.diary && parsed.diary.quests) {
      next.diary.quests = Object.assign({ active: [], completed: [] }, parsed.diary.quests);
    }
    if (parsed.inspiration != null) {
      next.inspiration = parsed.inspiration;
    }
    if (parsed.deathSaves) {
      next.deathSaves = Object.assign(deepClone(base.deathSaves), parsed.deathSaves);
    }
    next.grimoire = Object.assign(deepClone(base.grimoire), parsed.grimoire || {});

    return next;
  }

  function loadState() {
    var id = activeCharId();
    var key = charStateKey(id);

    try {
      var own = localStorage.getItem(key);
      if (own) {
        var parsedOwn = JSON.parse(own);
        if (parsedOwn && (parsedOwn.version === 2 || parsedOwn.version === 3)) {
          return fromSavedV2(parsedOwn, defaultsFor(id));
        }
      }
    } catch (e) { /* ignore */ }

    /* Migrazione dalle chiavi legacy: solo per il personaggio storico
       (Tharion), solo quando non esiste ancora una chiave per-personaggio. */
    if (id === DEFAULT_CHAR_ID) {
      try {
        var v2 = localStorage.getItem(cfg.STORAGE_KEY);
        if (v2) {
          var parsed = JSON.parse(v2);
          if (parsed && (parsed.version === 2 || parsed.version === 3)) {
            var migrated = fromSavedV2(parsed, getDefaultState());
            saveState(migrated, true);

            return migrated;
          }
        }
      } catch (e) { /* ignore */ }

      try {
        var v1 = localStorage.getItem(cfg.STORAGE_KEY_V1);
        if (v1) {
          var fromV1 = migrateV1(JSON.parse(v1));
          saveState(fromV1, true);

          return fromV1;
        }
      } catch (e) { /* ignore */ }
    }

    // Nessuno stato salvato: la scheda storica parte dai suoi default, un
    // personaggio qualsiasi (es. doc cloud non ancora sceso in locale) parte
    // vuoto — mai dalla scheda di Tharion.
    var next = defaultsFor(id);
    try {
      if (localStorage.getItem(cfg.INSPIRATION_KEY) === '1') {
        next.inspiration = true;
      }
    } catch (e) { /* ignore */ }

    return next;
  }

  function notifyCloud() {
    if (window.AppCloud && window.AppCloud.schedulePush) {
      window.AppCloud.schedulePush();
    }
  }

  function saveState(data, immediate) {
    state = data;
    if (!window.__applyingRemoteState) {
      state.lastModifiedMs = Date.now();
    }
    var key = charStateKey(activeCharId());
    if (immediate) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(cfg.INSPIRATION_KEY, state.inspiration ? '1' : '0');
      } catch (e) { /* ignore */ }
      notifyCloud();

      return;
    }
    clearTimeout(persistTimer);
    persistTimer = setTimeout(function () {
      try {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(cfg.INSPIRATION_KEY, state.inspiration ? '1' : '0');
      } catch (e) { /* ignore */ }
      notifyCloud();
    }, 200);
  }

  function getState() {
    if (!state) {
      state = loadState();
    }

    return state;
  }

  function updateState(partial) {
    var current = getState();
    Object.keys(partial).forEach(function (key) {
      current[key] = partial[key];
    });
    saveState(current);
  }

  function resetState() {
    state = getDefaultState();
    saveState(state, true);
  }

  window.AppStorage = {
    getState: getState,
    updateState: updateState,
    saveState: saveState,
    resetState: resetState,
    getDefaultState: getDefaultState,
    migrateV1: migrateV1
  };
})();
