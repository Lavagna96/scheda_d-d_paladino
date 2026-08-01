(function () {
  /*
   * Grimorio avanzato: trucchetti liberi e risorse custom (extraResources).
   * Per personaggi nati prima del wizard o con regole di casa — nessun vincolo
   * di classe/background.
   */

  var RESET_OPTIONS = [
    { id: 'short', label: 'Riposo breve' },
    { id: 'long', label: 'Riposo lungo' },
    { id: 'day', label: '1 al giorno' }
  ];

  var overlay, titleEl, bodyEl;

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

  function allCantripSpells() {
    var manual = window.MANUAL_55;
    if (!manual || !manual.spells) {
      return [];
    }

    return manual.spells.filter(function (s) { return s.level === 0; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'it'); });
  }

  function spellLabel(id) {
    var manual = window.MANUAL_55;
    if (!manual || !manual.spells) {
      return id;
    }
    var found = manual.spells.filter(function (s) { return s.id === id; })[0];

    return found ? found.name : id;
  }

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = '';
  }

  function addSaveButton(onSave) {
    var btn = el('button', 'save-btn', 'Salva');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      onSave();
      closeSheet();
    });
    bodyEl.appendChild(btn);
  }

  function commit(mutate) {
    var state = window.AppStorage.getState();
    mutate(state);
    window.AppStorage.saveState(state, true);
    if (window.AppGrimorio && window.AppGrimorio.render) {
      window.AppGrimorio.render();
    }
    if (window.AppStats && window.AppStats.render) {
      window.AppStats.render();
    }
    if (window.AppSheet && window.AppSheet.render) {
      window.AppSheet.render();
    }
  }

  function buildCantripSection(draft) {
    bodyEl.appendChild(el('div', 'edit-section-label', 'Trucchetti'));
    bodyEl.appendChild(el('p', 'note', 'Dal manuale o id personalizzato — senza limiti di classe.'));

    var chipRow = el('div', 'chip-row');
    var controls = {};

    function refreshCantripChips() {
      Object.keys(controls).forEach(function (id) {
        controls[id].setOn(draft.cantrips.indexOf(id) >= 0);
      });
    }

    function toggleCantrip(id) {
      var idx = draft.cantrips.indexOf(id);
      if (idx >= 0) {
        draft.cantrips.splice(idx, 1);
      } else {
        draft.cantrips.push(id);
      }
      refreshCantripChips();
      renderCustomCantripList(draft, customList);
    }

    allCantripSpells().forEach(function (spell) {
      var chip = el('button', 'chip', spell.name);
      chip.type = 'button';
      chip.addEventListener('click', function () { toggleCantrip(spell.id); });
      chipRow.appendChild(chip);
      controls[spell.id] = {
        setOn: function (on) { chip.classList.toggle('on', on); }
      };
    });
    bodyEl.appendChild(chipRow);

    var customList = el('div', 'grim-custom-cantrips');
    bodyEl.appendChild(customList);
    renderCustomCantripList(draft, customList, toggleCantrip);

    var addRow = el('div', 'edit-field');
    var customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'edit-input';
    customInput.placeholder = 'Id trucchetto libero (es. mio-trucchetto)';
    addRow.appendChild(el('label', 'edit-label', 'Aggiungi id personalizzato'));
    addRow.appendChild(customInput);
    var addBtn = el('button', 'chip', '+ Aggiungi');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      var id = (customInput.value || '').trim().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (!id || draft.cantrips.indexOf(id) >= 0) {
        return;
      }
      draft.cantrips.push(id);
      customInput.value = '';
      refreshCantripChips();
      renderCustomCantripList(draft, customList, toggleCantrip);
    });
    addRow.appendChild(addBtn);
    bodyEl.appendChild(addRow);

    refreshCantripChips();
  }

  function renderCustomCantripList(draft, container, toggleFn) {
    container.innerHTML = '';
    var customIds = draft.cantrips.filter(function (id) {
      return !allCantripSpells().some(function (s) { return s.id === id; });
    });
    if (!customIds.length) {
      return;
    }
    container.appendChild(el('div', 'edit-section-label', 'Id personalizzati'));
    customIds.forEach(function (id) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', spellLabel(id)));
      var rm = el('button', 'stepper-btn minus', '✕');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Rimuovi ' + id);
      rm.addEventListener('click', function () {
        var idx = draft.cantrips.indexOf(id);
        if (idx >= 0) {
          draft.cantrips.splice(idx, 1);
        }
        renderCustomCantripList(draft, container, toggleFn);
      });
      row.appendChild(rm);
      container.appendChild(row);
    });
  }

  function newResourceDraft() {
    return { key: '', name: '', max: 1, ctx: '', resetOn: 'long' };
  }

  function buildResourceEditor(draft, resource, index, onChange) {
    var box = el('div', 'grim-resource-block');
    box.appendChild(el('div', 'edit-section-label', 'Risorsa ' + (index + 1)));

    var keyField = el('div', 'edit-field');
    keyField.appendChild(el('label', 'edit-label', 'Chiave'));
    keyInput.type = 'text';
    keyInput.className = 'edit-input';
    keyInput.value = resource.key || '';
    keyInput.placeholder = 'chiave (es. shield)';
    keyInput.addEventListener('input', function () {
      resource.key = keyInput.value.trim();
      onChange();
    });
    keyField.appendChild(keyInput);
    box.appendChild(keyField);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = resource.name || '';
    nameInput.placeholder = 'Nome visualizzato';
    nameInput.addEventListener('input', function () {
      resource.name = nameInput.value;
      onChange();
    });
    var nameField = el('div', 'edit-field');
    nameField.appendChild(el('label', 'edit-label', 'Nome'));
    nameField.appendChild(nameInput);
    box.appendChild(nameField);

    var maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.min = '0';
    maxInput.className = 'edit-input';
    maxInput.value = String(resource.max == null ? 1 : resource.max);
    maxInput.addEventListener('input', function () {
      resource.max = Math.max(0, parseInt(maxInput.value, 10) || 0);
      onChange();
    });
    var maxField = el('div', 'edit-field');
    maxField.appendChild(el('label', 'edit-label', 'Usi massimi'));
    maxField.appendChild(maxInput);
    box.appendChild(maxField);

    var ctxInput = document.createElement('input');
    ctxInput.type = 'text';
    ctxInput.className = 'edit-input';
    ctxInput.value = resource.ctx || '';
    ctxInput.placeholder = 'es. +5 CA · reazione';
    ctxInput.addEventListener('input', function () {
      resource.ctx = ctxInput.value;
      onChange();
    });
    var ctxField = el('div', 'edit-field');
    ctxField.appendChild(el('label', 'edit-label', 'Descrizione breve'));
    ctxField.appendChild(ctxInput);
    box.appendChild(ctxField);

    var resetSelect = document.createElement('select');
    resetSelect.className = 'edit-select';
    RESET_OPTIONS.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if ((resource.resetOn || 'long') === opt.id) {
        o.selected = true;
      }
      resetSelect.appendChild(o);
    });
    resetSelect.addEventListener('change', function () {
      resource.resetOn = resetSelect.value;
      onChange();
    });
    var resetField = el('div', 'edit-field');
    resetField.appendChild(el('label', 'edit-label', 'Recupero'));
    resetField.appendChild(resetSelect);
    box.appendChild(resetField);

    var rm = el('button', 'chip', 'Rimuovi risorsa');
    rm.type = 'button';
    rm.addEventListener('click', function () {
      draft.resources.splice(index, 1);
      onChange();
    });
    box.appendChild(rm);

    return box;
  }

  function buildResourcesSection(draft) {
    bodyEl.appendChild(el('div', 'edit-section-label', 'Risorse personalizzate'));
    bodyEl.appendChild(el('p', 'note', 'Appaiono nella tab Risorse (es. Scudo magico, oggetti con usi).'));

    var resourcesHost = el('div', 'grim-resources-list');

    function rerenderResources() {
      resourcesHost.innerHTML = '';
      draft.resources.forEach(function (resource, index) {
        resourcesHost.appendChild(buildResourceEditor(draft, resource, index, rerenderResources));
      });
    }

    bodyEl.appendChild(resourcesHost);
    rerenderResources();

    var addBtn = el('button', 'chip', '+ Nuova risorsa');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      draft.resources.push(newResourceDraft());
      rerenderResources();
    });
    bodyEl.appendChild(addBtn);
  }

  function openAdvanced() {
    var state = window.AppStorage.getState();
    var grim = state.grimoire || {};
    var draft = {
      cantrips: (grim.cantrips || []).slice(),
      resources: (state.character.extraResources || []).map(function (r) {
        return {
          key: r.key || '',
          name: r.name || '',
          max: r.max == null ? 1 : r.max,
          ctx: r.ctx || '',
          resetOn: r.resetOn || 'long'
        };
      })
    };

    openSheet('Grimorio avanzato');
    buildCantripSection(draft);
    buildResourcesSection(draft);

    addSaveButton(function () {
      commit(function (next) {
        next.grimoire = next.grimoire || { prepared: [], cantrips: [], always: [] };
        next.grimoire.cantrips = draft.cantrips.filter(function (id, i, arr) {
          return id && arr.indexOf(id) === i;
        });
        next.character.extraResources = draft.resources
          .filter(function (r) { return r.key; })
          .map(function (r) {
            return {
              key: r.key,
              name: r.name || r.key,
              max: r.max,
              ctx: r.ctx || '',
              resetOn: r.resetOn || 'long'
            };
          });
      });
    });
  }

  function init() {
    overlay = document.getElementById('grim-advanced-overlay');
    titleEl = document.getElementById('grim-advanced-title');
    bodyEl = document.getElementById('grim-advanced-body');
    if (!overlay) {
      return;
    }
    var closeBtn = document.getElementById('grim-advanced-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    var btn = document.getElementById('grim-advanced-btn');
    if (btn) {
      btn.addEventListener('click', openAdvanced);
    }
  }

  window.AppGrimorioAdvanced = {
    init: init,
    open: openAdvanced
  };
})();
