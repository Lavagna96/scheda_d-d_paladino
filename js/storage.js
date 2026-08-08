(function () {
  var cfg = window.APP_CONFIG;
  var state = null;
  var persistTimer = null;

  /* Fase 2 (dashboard multi-personaggio): ogni personaggio ha la sua chiave
     'char-<id>-state'. Il personaggio attivo è in 'app-active-char'
     (localStorage), impostato dalla dashboard prima di ricaricare la pagina. */
  var ACTIVE_CHAR_KEY = 'app-active-char';
  var DELETED_CHARS_KEY = 'app-deleted-characters';

  function getDeletedCharacters() {
    try {
      var raw = localStorage.getItem(DELETED_CHARS_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function isCharacterDeleted(id) {
    return getDeletedCharacters().indexOf(id) !== -1;
  }

  function markCharacterDeleted(id) {
    var list = getDeletedCharacters();
    if (list.indexOf(id) !== -1) {
      return;
    }
    list.push(id);
    try {
      localStorage.setItem(DELETED_CHARS_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function activeCharId() {
    var explicit = localStorage.getItem(ACTIVE_CHAR_KEY);
    if (!explicit) {
      return null;
    }
    if (isCharacterDeleted(explicit)) {
      try {
        localStorage.removeItem(ACTIVE_CHAR_KEY);
      } catch (e) { /* ignore */ }

      return null;
    }

    return explicit;
  }

  function charStateKey(id) {
    return 'char-' + id + '-state';
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* Scheletro neutro di uno stato (5.B.3): base per merge, nuovi PG e import. */
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
    expertiseSkills: [],
    fightingStyle: 'nessuno',
    armor: { id: '', shield: false },
    weapon: { name: '', die: '1d8', type: '', mastery: '', finesse: false, ranged: false, twoHanded: false },
    initiativeNote: '',
    modifiers: [],
    extraResources: [],
    customAttacks: [],
    items: [],
    feats: [],
    metamagicIds: [],
    invocationIds: [],
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

  function characterClassName(classId) {
    var manual = window.MANUAL_55;
    if (manual && manual.classes && manual.classes[classId]) {
      return manual.classes[classId].name;
    }

    return classId || '';
  }

  function dashboardItemFromCharacter(ch, id) {
    ch = ch || {};

    return {
      id: id,
      name: ch.name || 'Senza nome',
      className: characterClassName(ch.classId),
      subclassName: ch.subclassName || '',
      level: ch.level || 1,
      speciesLabel: ch.speciesLabel || '',
      portrait: ch.portrait || '',
      avatar: ch.avatar || '✦'
    };
  }

  function listCharactersForDashboard() {
    var byId = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('char-') !== 0 || key.slice(-6) !== '-state') {
          continue;
        }
        var id = key.slice(5, -6);
        if (!id || isCharacterDeleted(id)) {
          continue;
        }
        try {
          var parsed = JSON.parse(localStorage.getItem(key));
          if (parsed && parsed.character) {
            byId[id] = dashboardItemFromCharacter(parsed.character, id);
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    return Object.keys(byId).map(function (k) { return byId[k]; });
  }

  function migrateV1(raw) {
    var next = getBaseState();
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
      next.coins = Object.assign({}, raw.coins);
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
    if (readInspirationFlag()) {
      next.inspiration = true;
    }

    return next;
  }

  function readInspirationFlag() {
    try {
      if (localStorage.getItem(cfg.INSPIRATION_KEY) === '1') {
        return true;
      }
      if (cfg.LEGACY_INSPIRATION_KEY && localStorage.getItem(cfg.LEGACY_INSPIRATION_KEY) === '1') {
        return true;
      }
    } catch (e) { /* ignore */ }

    return false;
  }

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

  function fromSavedV2(parsed, def) {
    var base = def || getBaseState();
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

  function mergeImportedState(parsed) {
    return fromSavedV2(parsed, getBaseState());
  }

  function tryLegacyMigration(id) {
    if (id !== cfg.LEGACY_CHAR_ID) {
      return null;
    }

    try {
      var v2 = localStorage.getItem(cfg.LEGACY_STORAGE_KEY);
      if (v2) {
        var parsed = JSON.parse(v2);
        if (parsed && (parsed.version === 2 || parsed.version === 3)) {
          return fromSavedV2(parsed, getBaseState());
        }
      }
    } catch (e) { /* ignore */ }

    try {
      var v1 = localStorage.getItem(cfg.LEGACY_STORAGE_KEY_V1);
      if (v1) {
        return migrateV1(JSON.parse(v1));
      }
    } catch (e) { /* ignore */ }

    return null;
  }

  function loadState() {
    var id = activeCharId();
    if (!id) {
      return getBaseState();
    }
    var key = charStateKey(id);

    try {
      var own = localStorage.getItem(key);
      if (own) {
        var parsedOwn = JSON.parse(own);
        if (parsedOwn && (parsedOwn.version === 2 || parsedOwn.version === 3)) {
          return fromSavedV2(parsedOwn, getBaseState());
        }
      }
    } catch (e) { /* ignore */ }

    if (isCharacterDeleted(id)) {
      return getBaseState();
    }

    var legacy = tryLegacyMigration(id);
    if (legacy) {
      saveState(legacy, true);

      return legacy;
    }

    var next = getBaseState();
    if (readInspirationFlag()) {
      next.inspiration = true;
    }

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
    var id = activeCharId();
    if (!id || isCharacterDeleted(id)) {
      return;
    }
    var key = charStateKey(id);
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

  /* Cambio personaggio attivo SENZA reload (dashboard ↔ scheda, Step
     navigazione interna): azzera la cache in RAM così il prossimo getState()
     rilegge da zero la chiave del personaggio appena scelto. */
  function switchActiveCharacter(id) {
    try {
      localStorage.setItem(ACTIVE_CHAR_KEY, id);
    } catch (e) { /* ignore */ }
    state = null;
  }

  function purgeCharacter(id) {
    markCharacterDeleted(id);
    try {
      localStorage.removeItem(charStateKey(id));
    } catch (e) { /* ignore */ }
    if (id === cfg.LEGACY_CHAR_ID) {
      try {
        localStorage.removeItem(cfg.LEGACY_STORAGE_KEY);
        localStorage.removeItem(cfg.LEGACY_STORAGE_KEY_V1);
      } catch (e) { /* ignore */ }
    }
    if (localStorage.getItem(ACTIVE_CHAR_KEY) === id) {
      try {
        localStorage.removeItem(ACTIVE_CHAR_KEY);
      } catch (e) { /* ignore */ }
      state = null;
    }
  }

  window.AppStorage = {
    getState: getState,
    updateState: updateState,
    saveState: saveState,
    getBaseState: getBaseState,
    mergeImportedState: mergeImportedState,
    migrateV1: migrateV1,
    activeCharId: activeCharId,
    switchActiveCharacter: switchActiveCharacter,
    isCharacterDeleted: isCharacterDeleted,
    purgeCharacter: purgeCharacter,
    listCharactersForDashboard: listCharactersForDashboard,
    dashboardItemFromCharacter: dashboardItemFromCharacter
  };
})();
