(function () {
  var cfg = window.APP_CONFIG;
  var state = null;
  var persistTimer = null;

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

  function loadState() {
    var next = getDefaultState();
    try {
      var v2 = localStorage.getItem(cfg.STORAGE_KEY);
      if (v2) {
        var parsed = JSON.parse(v2);
        if (parsed && parsed.version === 2) {
          next = Object.assign(next, parsed);
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
      }
    } catch (e) { /* ignore */ }

    try {
      var v1 = localStorage.getItem(cfg.STORAGE_KEY_V1);
      if (v1) {
        next = migrateV1(JSON.parse(v1));
        saveState(next, true);

        return next;
      }
    } catch (e) { /* ignore */ }

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
    if (immediate) {
      try {
        localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(cfg.INSPIRATION_KEY, state.inspiration ? '1' : '0');
      } catch (e) { /* ignore */ }
      notifyCloud();

      return;
    }
    clearTimeout(persistTimer);
    persistTimer = setTimeout(function () {
      try {
        localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(state));
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
