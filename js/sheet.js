(function () {
  var cfg = window.APP_CONFIG;
  var DEATH_SAVE_MAX = 3;

  function formatMod(n) {
    if (n >= 0) {
      return '+' + n;
    }

    return '−' + Math.abs(n);
  }

  function ensureDeathSaves(state) {
    if (!state.deathSaves) {
      state.deathSaves = { success: 0, fail: 0 };
    }

    return state.deathSaves;
  }

  function resetDeathSaves() {
    var state = window.AppStorage.getState();
    state.deathSaves = { success: 0, fail: 0 };
    window.AppStorage.saveState(state);
    renderDeathSaves();
  }

  function renderDeathSaveBar(barId, field, barClass) {
    var bar = document.getElementById(barId);
    if (!bar) {
      return;
    }
    var state = window.AppStorage.getState();
    var ds = ensureDeathSaves(state);
    var count = Math.max(0, Math.min(DEATH_SAVE_MAX, ds[field] || 0));
    bar.innerHTML = '';
    bar.className = 'ds-pips ' + barClass;
    for (var i = 0; i < DEATH_SAVE_MAX; i++) {
      var pip = document.createElement('button');
      pip.type = 'button';
      pip.className = 'ds-pip' + (i < count ? ' filled' : '');
      pip.setAttribute('aria-label', (field === 'success' ? 'Successo ' : 'Fallimento ') + (i + 1));
      (function (idx) {
        pip.addEventListener('click', function () {
          var s = window.AppStorage.getState();
          var current = ensureDeathSaves(s);
          var next = current[field] === idx + 1 ? idx : idx + 1;
          current[field] = Math.max(0, Math.min(DEATH_SAVE_MAX, next));
          window.AppStorage.saveState(s);
          renderDeathSaves();
        });
      })(i);
      bar.appendChild(pip);
    }
  }

  function renderDeathSaves() {
    var state = window.AppStorage.getState();
    var ds = ensureDeathSaves(state);
    renderDeathSaveBar('ds-success-bar', 'success', 'ds-success');
    renderDeathSaveBar('ds-fail-bar', 'fail', 'ds-fail');
    var status = document.getElementById('death-status');
    if (!status) {
      return;
    }
    status.className = 'death-status';
    if (ds.success >= DEATH_SAVE_MAX) {
      status.textContent = 'Stabilizzato';
      status.classList.add('stable');
    } else if (ds.fail >= DEATH_SAVE_MAX) {
      status.textContent = 'Morte';
      status.classList.add('dead');
    } else {
      status.textContent = '';
    }
  }

  function renderCombatStats() {
    var ch = cfg.CHARACTER;
    var acEl = document.getElementById('combat-ac');
    var acNote = document.getElementById('combat-ac-note');
    var initEl = document.getElementById('combat-init');
    var initNote = document.getElementById('combat-init-note');
    if (acEl) {
      acEl.textContent = ch.ac;
    }
    if (acNote) {
      acNote.textContent = ch.acNote || '';
    }
    if (initEl) {
      initEl.textContent = formatMod(ch.initiative);
    }
    if (initNote) {
      initNote.textContent = ch.initiativeNote || '';
    }
  }

  function bindDeathSaves() {
    var resetBtn = document.getElementById('death-reset');
    if (resetBtn && !resetBtn._bound) {
      resetBtn._bound = true;
      resetBtn.addEventListener('click', resetDeathSaves);
    }
  }

  function renderUses(card) {
    var state = window.AppStorage.getState();
    var k = card.getAttribute('data-key');
    var max = +card.getAttribute('data-max');
    var sp = state.spent[k] || 0;
    var avail = Math.max(0, max - sp);
    var cnt = card.querySelector('.rc-count');
    if (cnt) {
      cnt.textContent = avail + ' / ' + max;
    }
    var bar = card.querySelector('.segbar');
    if (!bar) {
      return;
    }
    bar.innerHTML = '';
    for (var i = 0; i < max; i++) {
      var seg = document.createElement('div');
      seg.className = 'seg' + (i < avail ? '' : ' empty');
      (function (idx) {
        seg.addEventListener('click', function () {
          var cur = avail === idx + 1 ? idx : idx + 1;
          var s = window.AppStorage.getState();
          s.spent[k] = Math.max(0, max - cur);
          window.AppStorage.saveState(s);
          renderUses(card);
          if (window.AppGrimorio) {
            window.AppGrimorio.renderSlots();
          }
        });
      })(i);
      bar.appendChild(seg);
    }
  }

  function renderHp() {
    var state = window.AppStorage.getState();
    window.AppHpBar.render(state.pools.hp, cfg.POOLMAX.hp, 'pv-hp', 'hp-bar-fill', 'hp-max');
    renderTempHp(state.pools.tempHp || 0);
  }

  function renderTempHp(val) {
    var fill = document.getElementById('temp-hp-bar-fill');
    var txt = document.getElementById('pv-temp-hp');
    var wrap = document.getElementById('temp-hp-bar-wrap');
    var maxHp = cfg.POOLMAX.hp;
    var pct = val > 0 ? Math.max(0, Math.min(100, val / maxHp * 100)) : 0;
    if (txt) {
      txt.textContent = val;
    }
    if (fill) {
      fill.style.width = pct + '%';
    }
    if (wrap) {
      wrap.classList.toggle('hidden', val <= 0);
      wrap.setAttribute('aria-hidden', val <= 0 ? 'true' : 'false');
    }
  }

  function applyHpChange(delta) {
    var state = window.AppStorage.getState();
    if (delta < 0) {
      var remaining = Math.abs(delta);
      var temp = state.pools.tempHp || 0;
      if (temp > 0) {
        var fromTemp = Math.min(temp, remaining);
        state.pools.tempHp = temp - fromTemp;
        remaining -= fromTemp;
      }
      if (remaining > 0) {
        state.pools.hp = Math.max(0, state.pools.hp - remaining);
      }
    } else {
      state.pools.hp = Math.min(cfg.POOLMAX.hp, state.pools.hp + delta);
      if (state.pools.hp > 0) {
        ensureDeathSaves(state);
        state.deathSaves.success = 0;
        state.deathSaves.fail = 0;
      }
    }
    window.AppStorage.saveState(state);
    renderHp();
    renderDeathSaves();
  }

  function addTempHpFromInput() {
    var inp = document.getElementById('temp-hp-in');
    if (!inp) {
      return;
    }
    var n = parseInt(inp.value, 10);
    if (isNaN(n) || n <= 0) {
      return;
    }
    var state = window.AppStorage.getState();
    state.pools.tempHp = (state.pools.tempHp || 0) + n;
    window.AppStorage.saveState(state);
    renderHp();
    inp.value = '';
  }

  function bindHpControls() {
    var minus = document.getElementById('hp-minus');
    var plus = document.getElementById('hp-plus');
    var dmg = document.getElementById('hp-dmg');
    var heal = document.getElementById('hp-heal');
    var tempAdd = document.getElementById('temp-add');

    if (minus && !minus._bound) {
      minus._bound = true;
      minus.addEventListener('click', function () { applyHpChange(-1); });
    }
    if (plus && !plus._bound) {
      plus._bound = true;
      plus.addEventListener('click', function () { applyHpChange(1); });
    }
    if (dmg && !dmg._bound) {
      dmg._bound = true;
      dmg.addEventListener('click', function () {
        window.AppHpBar.applyFromInput('hp', 'hp-in', -1);
      });
    }
    if (heal && !heal._bound) {
      heal._bound = true;
      heal.addEventListener('click', function () {
        window.AppHpBar.applyFromInput('hp', 'hp-in', 1);
      });
    }
    if (tempAdd && !tempAdd._bound) {
      tempAdd._bound = true;
      tempAdd.addEventListener('click', addTempHpFromInput);
    }
  }

  function renderLoh() {
    var state = window.AppStorage.getState();
    var lv = document.getElementById('pv-loh');
    var lf = document.getElementById('loh-bar-fill');
    if (lv) {
      lv.textContent = state.pools.loh;
    }
    if (lf) {
      lf.style.width = Math.max(0, Math.min(100, state.pools.loh / cfg.POOLMAX.loh * 100)) + '%';
    }
  }

  function renderSteedHp() {
    var state = window.AppStorage.getState();
    window.AppHpBar.render(
      state.pools.steedhp,
      cfg.POOLMAX.steedhp,
      'pv-steedhp',
      'steed-bar-fill',
      'steed-hp-max'
    );
  }

  function bindLohBar() {
    var track = document.getElementById('loh-bar-track');
    if (!track || track._bound) {
      return;
    }
    track._bound = true;
    var active = false;
    var decided = false;
    var startX = 0;
    var startY = 0;
    var pid = null;

    function setFromX(clientX) {
      var r = track.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      var s = window.AppStorage.getState();
      s.pools.loh = Math.round(pct * cfg.POOLMAX.loh);
      window.AppStorage.saveState(s);
      renderLoh();
    }

    track.addEventListener('pointerdown', function (e) {
      active = true;
      decided = false;
      startX = e.clientX;
      startY = e.clientY;
      pid = e.pointerId;
    });
    track.addEventListener('pointermove', function (e) {
      if (!active) {
        return;
      }
      if (!decided) {
        var dx = Math.abs(e.clientX - startX);
        var dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) {
          return;
        }
        if (dy > dx) {
          active = false;

          return;
        }
        decided = true;
        try { track.setPointerCapture(pid); } catch (_) { /* ignore */ }
      }
      setFromX(e.clientX);
      e.preventDefault();
    });
    track.addEventListener('pointerup', function (e) {
      if (active && !decided) {
        setFromX(e.clientX);
      }
      active = false;
      decided = false;
    });
    track.addEventListener('pointercancel', function () {
      active = false;
      decided = false;
    });
  }

  function adjustPool(k, d) {
    var state = window.AppStorage.getState();
    if (k === 'hp') {
      applyHpChange(d);

      return;
    }
    state.pools[k] = Math.max(0, Math.min(cfg.POOLMAX[k], (state.pools[k] || 0) + d));
    window.AppStorage.saveState(state);
    if (k === 'steedhp') {
      renderSteedHp();

      return;
    }
    if (k === 'loh') {
      renderLoh();
    }
  }

  function applySteedHP(sign) {
    var inp = document.getElementById('steed-hp-in');
    var n = parseInt(inp.value, 10);
    if (!isNaN(n) && n !== 0) {
      adjustPool('steedhp', sign * Math.abs(n));
    }
    inp.value = '';
  }

  function shortRest() {
    var state = window.AppStorage.getState();
    state.spent.cd = Math.max(0, (state.spent.cd || 0) - 1);
    window.AppStorage.saveState(state);
    render();
    if (window.AppGrimorio) {
      window.AppGrimorio.renderSlots();
    }
  }

  function longRest() {
    var state = window.AppStorage.getState();
    state.spent = {};
    state.pools.loh = cfg.POOLMAX.loh;
    state.pools.hp = cfg.POOLMAX.hp;
    state.pools.steedhp = cfg.POOLMAX.steedhp;
    state.pools.tempHp = 0;
    state.deathSaves = { success: 0, fail: 0 };
    window.AppStorage.saveState(state);
    render();
    if (window.AppHeader) {
      window.AppHeader.render();
    }
    if (window.AppGrimorio) {
      window.AppGrimorio.renderSlots();
    }
  }

  function bindSteedName() {
    var inp = document.getElementById('steed-name');
    if (!inp || inp._bound) {
      return;
    }
    inp._bound = true;
    inp.addEventListener('input', function () {
      var s = window.AppStorage.getState();
      s.steed.name = inp.value;
      window.AppStorage.saveState(s);
    });
  }

  function renderResources() {
    renderCombatStats();
    renderDeathSaves();
    document.querySelectorAll('.res-card').forEach(renderUses);
    renderHp();
    renderLoh();
    renderSteedHp();
    var state = window.AppStorage.getState();
    var nameInp = document.getElementById('steed-name');
    if (nameInp && document.activeElement !== nameInp) {
      nameInp.value = state.steed.name || cfg.STEED.defaultName;
    }
  }

  function render() {
    renderResources();
    bindLohBar();
    bindSteedName();
  }

  function init() {
    bindHpControls();
    bindDeathSaves();
    render();
    document.getElementById('steed-minus').addEventListener('click', function () { adjustPool('steedhp', -1); });
    document.getElementById('steed-plus').addEventListener('click', function () { adjustPool('steedhp', 1); });
    document.getElementById('steed-dmg').addEventListener('click', function () { applySteedHP(-1); });
    document.getElementById('steed-heal').addEventListener('click', function () { applySteedHP(1); });
    document.getElementById('btn-short-rest').addEventListener('click', shortRest);
    document.getElementById('btn-long-rest').addEventListener('click', longRest);
    document.querySelectorAll('.loh-actions .pbtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        adjustPool('loh', parseInt(btn.getAttribute('data-delta'), 10));
      });
    });
  }

  window.AppSheet = {
    init: init,
    render: render,
    renderHp: renderHp,
    renderSteedHp: renderSteedHp,
    adjustPool: adjustPool,
    applyHpChange: applyHpChange,
    renderResourceCard: renderUses
  };
})();
