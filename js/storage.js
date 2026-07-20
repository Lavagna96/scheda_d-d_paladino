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
     migrazione dalla vecchia chiave legacy). */
  function fromSavedV2(parsed) {
    var next = getDefaultState();
    next = Object.assign(next, parsed);
    next.version = 3;
    next.character = mergeCharacter(getDefaultState().character, parsed.character);
    next.pools = Object.assign(getDefaultState().pools, parsed.pools || {});
    next.coins = Object.assign(getDefaultState().coins, parsed.coins || {});
    next.steed = Object.assign(getDefaultState().steed, parsed.steed || {});
    next.treasury = Object.assign(getDefaultState().treasury, parsed.treasury || {});
    next.diary = Object.assign(getDefaultState().diary, parsed.diary || {});
    if (parsed.diary && parsed.diary.quests) {
      next.diary.quests = Object.assign({ active: [], completed: [] }, parsed.diary.quests);
    }
    if (parsed.inspiration != null) {
      next.inspiration = parsed.inspiration;
    }
    if (parsed.deathSaves) {
      next.deathSaves = Object.assign(getDefaultState().deathSaves, parsed.deathSaves);
    }
    next.grimoire = Object.assign(getDefaultState().grimoire, parsed.grimoire || {});

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
          return fromSavedV2(parsedOwn);
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
            var migrated = fromSavedV2(parsed);
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

    var next = getDefaultState();
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
