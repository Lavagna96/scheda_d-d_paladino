(function () {
  var cfg = window.APP_CONFIG;
  var activeLevel = '1';

  /* ---------- dati ---------- */

  function getManualClass() {
    var manual = window.MANUAL_55;
    var classId = cfg.CHARACTER.classId;

    return (manual && manual.classes && manual.classes[classId]) || null;
  }

  function getManualSpell(id) {
    var manual = window.MANUAL_55;
    if (!manual) {
      return null;
    }

    return manual.spells.filter(function (s) { return s.id === id; })[0] || null;
  }

  function getClassSpells(classId) {
    var manual = window.MANUAL_55;
    if (!manual) {
      return [];
    }

    return manual.spells.filter(function (s) {
      return s.classes.indexOf(classId) >= 0;
    });
  }

  function getFixedIds() {
    return cfg.SPELLS.map(function (s) { return s.id; });
  }

  function getPreparedIds() {
    var state = window.AppStorage.getState();

    return (state.grimoire && state.grimoire.prepared) || [];
  }

  function getMaxPrepared() {
    var klass = getManualClass();
    if (!klass) {
      return 0;
    }

    return klass.preparedByLevel[cfg.CHARACTER.level] || 0;
  }

  function getMaxSlotLevel() {
    var klass = getManualClass();
    if (!klass) {
      return 2;
    }

    return klass.slotLevelByLevel[cfg.CHARACTER.level] || 0;
  }

  /* Tutti gli incantesimi da mostrare nel grimorio: fissi + preparati scelti */
  function getBookSpells() {
    var list = cfg.SPELLS.map(function (s) {
      return Object.assign({}, s, { fixed: true });
    });
    getPreparedIds().forEach(function (id) {
      var spell = getManualSpell(id);
      if (spell) {
        list.push(Object.assign({}, spell, { fixed: false }));
      }
    });

    return list;
  }

  function getChaMod() {
    var cha = cfg.ABILITIES.filter(function (a) { return a.name === 'CAR'; })[0];

    return cha ? cha.mod : '+0';
  }

  /* ---------- render statistiche ---------- */

  function renderGrimStats() {
    var ch = cfg.CHARACTER;
    var dcEl = document.getElementById('grim-dc');
    var atkEl = document.getElementById('grim-atk');
    var chaEl = document.getElementById('grim-cha');
    if (dcEl) {
      dcEl.textContent = ch.spellDc;
    }
    if (atkEl) {
      atkEl.textContent = (ch.spellAttack >= 0 ? '+' : '') + ch.spellAttack;
    }
    if (chaEl) {
      chaEl.textContent = getChaMod();
    }
    renderPrepCounter();
  }

  function renderPrepCounter() {
    var el = document.getElementById('grim-prep');
    if (!el) {
      return;
    }
    var count = getPreparedIds().length;
    var max = getMaxPrepared();
    el.textContent = count + '/' + max;
    el.parentElement.classList.toggle('over', count > max);
  }

  function renderSlots() {
    if (!window.AppSheet || !window.AppSheet.renderResourceCard) {
      return;
    }
    document.querySelectorAll('#view-grimorio .res-card').forEach(function (card) {
      window.AppSheet.renderResourceCard(card);
    });
  }

  /* ---------- dettaglio in bottom-sheet ---------- */

  /* Evidenzia le parole chiave della descrizione: dadi e bonus (oro),
     tiri salvezza (azzurro), condizioni (rosso). */
  function highlightKeywords(text) {
    return text
      .replace(/(\d+d\d+(?:\s*\+\s*\d+)?)/g, '<b class="kw">$1</b>')
      .replace(/(TS (?:Forza|Destrezza|Costituzione|Intelligenza|Saggezza|Carisma))/g,
        '<span class="kw-save">$1</span>')
      .replace(/\b(Accecat[oaie]|Assordat[oaie]|Affascinat[oaie]|Avvelenat[oaie]|Avvelenamento|Paralizzat[oaie]|Pietrificat[oaie]|Pron[oaie]|Spaventat[oaie]|Stordit[oaie]|Inabile|Esiliat[oaie]|Indebolimento|Possedut[oaie])\b/g,
        '<span class="kw-cond">$1</span>')
      .replace(/([+−]\d+(?!d))/g, '<b class="kw">$1</b>')
      .replace(/(\d+(?:,\d+)?\s*(?:m|PF|MO)\b)/g, '<b class="kw">$1</b>');
  }

  function detailBody(spell) {
    var meta = spell.meta.replace(/CONC/g, '<span class="conc">CONC</span>');

    return '<p class="sc-meta">' + (spell.level === 0 ? 'Trucchetto' : spell.level + '° livello') +
      ' · ' + spell.school + '</p>' +
      '<p class="sc-meta">' + meta + '</p>' +
      '<p class="sheet-desc">' + highlightKeywords(spell.desc) + '</p>';
  }

  function openDetail(spell) {
    if (window.AppBottomSheet) {
      window.AppBottomSheet.open(spell.name, detailBody(spell));
    }
  }

  /* ---------- lista del grimorio ---------- */

  function renderSpellCards() {
    var container = document.getElementById('spell-list-container');
    if (!container) {
      return;
    }
    container.innerHTML = '';
    var groups = { '0': [], '1': [], '2': [], '3': [] };
    getBookSpells().forEach(function (spell) {
      var lvlKey = spell.level >= 3 ? '3' : String(spell.level);
      groups[lvlKey].push(spell);
    });

    Object.keys(groups).forEach(function (lvlKey) {
      /* fissi prima, poi scelti; a parità, ordine alfabetico */
      groups[lvlKey].sort(function (a, b) {
        if (a.fixed !== b.fixed) {
          return a.fixed ? -1 : 1;
        }

        return a.name.localeCompare(b.name, 'it');
      });

      var group = document.createElement('div');
      group.className = 'spell-level-group' + (lvlKey === activeLevel ? '' : ' hidden');
      group.setAttribute('data-level-group', lvlKey);

      if (groups[lvlKey].length === 0) {
        var empty = document.createElement('p');
        empty.className = 'note';
        empty.textContent = lvlKey === '0'
          ? 'Nessun trucchetto per questo personaggio.'
          : 'Nessun incantesimo preparato di questo livello.';
        group.appendChild(empty);
      }

      groups[lvlKey].forEach(function (spell) {
        var card = document.createElement('article');
        card.className = 'spellcard spellcard-compact pressable';
        card.id = 'spell-' + spell.id;
        card.setAttribute('data-detail-title', spell.name);
        card.setAttribute('data-detail-body', detailBody(spell));
        var badge = spell.fixed
          ? '<span class="sc-badge sc-badge-fixed">★ Fisso</span>'
          : '<span class="sc-badge sc-badge-chosen">✦ Scelto</span>';
        card.innerHTML =
          '<div class="sc-head">' +
            '<span class="sc-name">' + spell.name + '</span>' + badge +
          '</div>' +
          '<div class="sc-meta">' +
            (spell.level === 0 ? 'Trucchetto' : spell.level + '°') + ' · ' + spell.school + ' · ' +
            spell.meta.replace(/CONC/g, '<span class="conc">CONC</span>') +
          '</div>';
        card.addEventListener('click', function () {
          openDetail(spell);
        });
        group.appendChild(card);
      });
      container.appendChild(group);
    });
  }

  function bindLevelTabs() {
    document.querySelectorAll('.level-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        activeLevel = tab.getAttribute('data-level');
        document.querySelectorAll('.level-tab').forEach(function (t) {
          t.classList.toggle('active', t === tab);
        });
        document.querySelectorAll('.spell-level-group').forEach(function (g) {
          g.classList.toggle('hidden', g.getAttribute('data-level-group') !== activeLevel);
        });
      });
    });
  }

  function bindSearch() {
    var input = document.getElementById('spell-search');
    if (!input) {
      return;
    }
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      document.querySelectorAll('#spell-list-container .spellcard').forEach(function (card) {
        var name = (card.querySelector('.sc-name') || {}).textContent || '';
        card.classList.toggle('hidden', q.length > 0 && name.toLowerCase().indexOf(q) === -1);
      });
    });
  }

  /* ---------- glossario (scelta dei preparati) ---------- */

  function togglePrepared(id) {
    var state = window.AppStorage.getState();
    if (!state.grimoire) {
      state.grimoire = { prepared: [] };
    }
    var prepared = state.grimoire.prepared;
    var idx = prepared.indexOf(id);
    if (idx >= 0) {
      prepared.splice(idx, 1);
    } else {
      if (prepared.length >= getMaxPrepared()) {
        return false; // limite raggiunto: prima rimuovi un incantesimo
      }
      prepared.push(id);
    }
    window.AppStorage.saveState(state);

    return true;
  }

  function renderGlossCount() {
    var el = document.getElementById('gloss-count');
    if (el) {
      var count = getPreparedIds().length;
      var max = getMaxPrepared();
      el.textContent = count + '/' + max;
      el.classList.toggle('full', count >= max);
    }
  }

  function spellRow(spell, opts) {
    var row = document.createElement('div');
    row.className = 'gloss-row';
    var left;
    if (opts.mode === 'pick') {
      if (opts.fixed) {
        row.classList.add('locked');
        left = '<span class="gloss-check locked" aria-hidden="true">★</span>';
      } else if (opts.prepared) {
        row.classList.add('on');
        left = '<button type="button" class="gloss-check on" aria-label="Rimuovi ' + spell.name + '">✓</button>';
      } else {
        left = '<button type="button" class="gloss-check" aria-label="Prepara ' + spell.name + '"></button>';
      }
    } else {
      left = '<span class="gloss-lvl-dot" aria-hidden="true">' + spell.level + '°</span>';
    }
    row.innerHTML =
      left +
      '<div class="gloss-info">' +
        '<span class="gloss-name">' + spell.name + '</span>' +
        '<span class="gloss-sub">' + spell.school + ' · ' +
          spell.meta.replace(/CONC/g, '<span class="conc">CONC</span>') + '</span>' +
      '</div>' +
      (opts.fixed ? '<span class="gloss-tag">sempre</span>' : '');

    /* tocco sulla riga = leggi la descrizione (in ogni modalità) */
    row.addEventListener('click', function () {
      openDetail(spell);
    });

    /* tocco sul quadratino = prepara/rimuovi */
    var check = row.querySelector('button.gloss-check');
    if (check) {
      check.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!togglePrepared(spell.id)) {
          var cnt = document.getElementById('gloss-count');
          if (cnt) {
            cnt.classList.remove('shake');
            void cnt.offsetWidth; // riavvia l'animazione
            cnt.classList.add('shake');
          }

          return;
        }
        renderGlossList();
        renderGlossCount();
        render(); // grimorio subito aggiornato dietro al glossario
      });
    }

    return row;
  }

  function renderGlossList() {
    var list = document.getElementById('gloss-list');
    var klass = getManualClass();
    if (!list || !klass) {
      return;
    }
    list.innerHTML = '';
    var maxLvl = getMaxSlotLevel();
    var fixedIds = getFixedIds();
    var preparedIds = getPreparedIds();
    var classSpells = getClassSpells(cfg.CHARACTER.classId);
    for (var lvl = 1; lvl <= maxLvl; lvl++) {
      (function (level) {
        var spells = classSpells.filter(function (s) { return s.level === level; });
        if (spells.length === 0) {
          return;
        }
        var head = document.createElement('div');
        head.className = 'gloss-sec';
        head.textContent = level + '° livello';
        list.appendChild(head);
        spells.forEach(function (spell) {
          list.appendChild(spellRow(spell, {
            mode: 'pick',
            fixed: fixedIds.indexOf(spell.id) >= 0,
            prepared: preparedIds.indexOf(spell.id) >= 0
          }));
        });
      })(lvl);
    }
  }

  function openGloss() {
    var modal = document.getElementById('gloss-modal');
    var klass = getManualClass();
    if (!modal || !klass) {
      return;
    }
    var title = document.getElementById('gloss-title');
    if (title) {
      title.textContent = 'Glossario del ' + klass.name;
    }
    var hint = document.getElementById('gloss-hint');
    if (hint) {
      hint.textContent = 'Fino al ' + getMaxSlotLevel() + '° livello · quadratino per preparare o rimuovere · tocca il nome per i dettagli';
    }
    renderGlossList();
    renderGlossCount();
    modal.classList.remove('hidden');
  }

  function closeGloss() {
    var modal = document.getElementById('gloss-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /* ---------- manuale 5.5 (consultazione) ---------- */

  var manualClassId = null;

  function renderManualList() {
    var list = document.getElementById('manual-list');
    var chips = document.getElementById('manual-classes');
    var manual = window.MANUAL_55;
    if (!list || !manual) {
      return;
    }
    if (!manualClassId) {
      manualClassId = cfg.CHARACTER.classId;
    }
    if (chips) {
      chips.innerHTML = '';
      Object.keys(manual.classes).forEach(function (classId) {
        if (getClassSpells(classId).length === 0) {
          return; // classe senza incantesimi caricati: niente chip
        }
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'manual-chip' + (classId === manualClassId ? ' active' : '');
        chip.textContent = manual.classes[classId].name;
        chip.addEventListener('click', function () {
          manualClassId = classId;
          renderManualList();
        });
        chips.appendChild(chip);
      });
      var active = chips.querySelector('.manual-chip.active');
      if (active) {
        chips.scrollLeft = Math.max(0, active.offsetLeft - chips.clientWidth / 2 + active.offsetWidth / 2);
      }
    }
    list.innerHTML = '';
    var spells = getClassSpells(manualClassId);
    var levels = [];
    spells.forEach(function (s) {
      if (levels.indexOf(s.level) === -1) {
        levels.push(s.level);
      }
    });
    levels.sort(function (a, b) { return a - b; });
    levels.forEach(function (lvl) {
      var head = document.createElement('div');
      head.className = 'gloss-sec';
      head.textContent = lvl + '° livello';
      list.appendChild(head);
      spells.filter(function (s) { return s.level === lvl; }).forEach(function (spell) {
        list.appendChild(spellRow(spell, { mode: 'read' }));
      });
    });
  }

  function openManual() {
    var modal = document.getElementById('manual-modal');
    if (!modal) {
      return;
    }
    modal.classList.remove('hidden');
    renderManualList(); // dopo l'apertura: serve il pannello visibile per centrare la chip attiva
  }

  function closeManual() {
    var modal = document.getElementById('manual-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function bindModals() {
    var glossOpen = document.getElementById('grim-gloss-open');
    if (glossOpen) {
      glossOpen.addEventListener('click', openGloss);
    }
    var glossClose = document.getElementById('gloss-close');
    if (glossClose) {
      glossClose.addEventListener('click', closeGloss);
    }
    var manualClose = document.getElementById('manual-close');
    if (manualClose) {
      manualClose.addEventListener('click', closeManual);
    }
  }

  /* ---------- api ---------- */

  function render() {
    renderGrimStats();
    renderSpellCards();
    renderSlots();
  }

  function init() {
    render();
    bindLevelTabs();
    bindSearch();
    bindModals();
  }

  window.AppGrimorio = {
    init: init,
    render: render,
    renderSlots: renderSlots,
    openManual: openManual
  };
})();
