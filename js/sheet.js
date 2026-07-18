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

  function addTempHp(n) {
    var state = window.AppStorage.getState();
    state.pools.tempHp = (state.pools.tempHp || 0) + n;
    window.AppStorage.saveState(state);
    renderHp();
  }

  var SVG_ATTRS = 'class="hp-ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC_SWORD = '<svg ' + SVG_ATTRS + '><path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"/><path d="M6.5 11.5l6 6"/></svg>';
  var IC_HEART_PLUS = '<svg ' + SVG_ATTRS + '><path d="M12 20l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.566"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>';
  var IC_SHIELD = '<svg ' + SVG_ATTRS + '><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/></svg>';

  var MODE_META = {
    dmg: { ic: IC_SWORD, title: 'Segna danno', apply: 'Applica danno' },
    heal: { ic: IC_HEART_PLUS, title: 'Cura', apply: 'Applica cura' },
    temp: { ic: IC_SHIELD, title: 'PF temporanei', apply: 'Aggiungi temporanei' }
  };

  var hpModalMode = 'dmg';
  /* 'hp' = personaggio, 'steedhp' = destriero: stesso popup per entrambi */
  var hpModalTarget = 'hp';

  function hpModalEls() {
    return {
      modal: document.getElementById('hp-modal'),
      input: document.getElementById('hp-modal-input'),
      cur: document.getElementById('hp-modal-cur'),
      next: document.getElementById('hp-modal-next'),
      max: document.getElementById('hp-modal-max'),
      ic: document.getElementById('hp-modal-ic'),
      titletext: document.getElementById('hp-modal-titletext'),
      apply: document.getElementById('hp-modal-apply'),
      temprow: document.getElementById('hp-modal-temprow'),
      temptext: document.getElementById('hp-modal-temptext'),
      toggle: document.getElementById('hp-modal-temp-toggle')
    };
  }

  function updateHpModalPreview() {
    var e = hpModalEls();
    if (!e.modal) {
      return;
    }
    var state = window.AppStorage.getState();
    var hp = state.pools[hpModalTarget];
    var temp = hpModalTarget === 'hp' ? (state.pools.tempHp || 0) : 0;
    var maxHp = cfg.POOLMAX[hpModalTarget];
    var n = Math.max(0, parseInt(e.input.value, 10) || 0);

    if (hpModalMode === 'temp') {
      e.cur.textContent = temp;
      e.next.textContent = temp + n;
      e.max.classList.add('hidden');
      e.temprow.classList.add('hidden');

      return;
    }

    e.max.classList.remove('hidden');
    e.max.textContent = '/ ' + maxHp;
    e.cur.textContent = hp;

    if (hpModalMode === 'dmg') {
      var absorbed = Math.min(temp, n);
      var toHp = n - absorbed;
      e.next.textContent = Math.max(0, hp - toHp);
      if (temp > 0 && n > 0) {
        e.temprow.classList.remove('hidden');
        e.temptext.textContent = 'assorbe ' + absorbed + ' di ' + temp + ' PF temporanei';
      } else {
        e.temprow.classList.add('hidden');
      }
    } else {
      e.next.textContent = Math.min(maxHp, hp + n);
      e.temprow.classList.add('hidden');
    }
  }

  function setHpModalMode(mode) {
    var e = hpModalEls();
    if (!e.modal) {
      return;
    }
    hpModalMode = mode;
    var meta = MODE_META[mode];
    e.modal.setAttribute('data-mode', mode);
    e.ic.innerHTML = meta.ic;
    e.titletext.textContent = meta.title + (hpModalTarget === 'steedhp' ? ' — Destriero' : '');
    e.apply.textContent = meta.apply;
    e.input.value = '';
    if (mode === 'heal' && hpModalTarget === 'hp') {
      e.toggle.textContent = '＋ PF temporanei';
      e.toggle.classList.remove('hidden');
    } else if (mode === 'temp') {
      e.toggle.textContent = '← Torna a cura';
      e.toggle.classList.remove('hidden');
    } else {
      e.toggle.classList.add('hidden');
    }
    updateHpModalPreview();
  }

  function openHpModal(mode, target) {
    var e = hpModalEls();
    if (!e.modal) {
      return;
    }
    hpModalTarget = target || 'hp';
    setHpModalMode(mode);
    e.modal.classList.remove('hidden');
    setTimeout(function () { e.input.focus(); }, 60);
  }

  function closeHpModal() {
    var modal = document.getElementById('hp-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function applyHpModal() {
    var e = hpModalEls();
    var n = Math.max(0, parseInt(e.input.value, 10) || 0);
    if (n > 0) {
      if (hpModalTarget === 'steedhp') {
        adjustPool('steedhp', hpModalMode === 'dmg' ? -n : n);
      } else if (hpModalMode === 'dmg') {
        applyHpChange(-n);
      } else if (hpModalMode === 'heal') {
        applyHpChange(n);
      } else {
        addTempHp(n);
      }
    }
    closeHpModal();
  }

  function bindHpControls() {
    var dmgOpen = document.getElementById('hp-dmg-open');
    var healOpen = document.getElementById('hp-heal-open');
    if (dmgOpen && !dmgOpen._bound) {
      dmgOpen._bound = true;
      dmgOpen.addEventListener('click', function () { openHpModal('dmg'); });
    }
    if (healOpen && !healOpen._bound) {
      healOpen._bound = true;
      healOpen.addEventListener('click', function () { openHpModal('heal'); });
    }
    var steedDmg = document.getElementById('steed-dmg-open');
    var steedHeal = document.getElementById('steed-heal-open');
    if (steedDmg && !steedDmg._bound) {
      steedDmg._bound = true;
      steedDmg.addEventListener('click', function () { openHpModal('dmg', 'steedhp'); });
    }
    if (steedHeal && !steedHeal._bound) {
      steedHeal._bound = true;
      steedHeal.addEventListener('click', function () { openHpModal('heal', 'steedhp'); });
    }

    var e = hpModalEls();
    if (!e.modal || e.modal._bound) {
      return;
    }
    e.modal._bound = true;
    e.modal.addEventListener('click', function (ev) {
      if (ev.target === e.modal) {
        closeHpModal();
      }
    });
    document.getElementById('hp-modal-close').addEventListener('click', closeHpModal);
    e.input.addEventListener('input', updateHpModalPreview);
    e.apply.addEventListener('click', applyHpModal);
    e.toggle.addEventListener('click', function () {
      setHpModalMode(hpModalMode === 'temp' ? 'heal' : 'temp');
      e.input.focus();
    });
    e.modal.querySelectorAll('.hp-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var add = parseInt(chip.getAttribute('data-add'), 10);
        e.input.value = (parseInt(e.input.value, 10) || 0) + add;
        updateHpModalPreview();
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !e.modal.classList.contains('hidden')) {
        closeHpModal();
      }
    });
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
