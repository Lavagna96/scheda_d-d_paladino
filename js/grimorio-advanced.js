(function () {
  /*
   * Risorse personalizzate (extraResources): per personaggi nati prima del
   * wizard o con regole di casa — nessun vincolo di classe/background.
   *
   * Dal redesign 3.11 questo file gestisce SOLO le risorse: la scelta di
   * incantesimi liberi (prima "trucchetti", qui sotto) è passata al picker
   * "tutte le classi" in js/grimorio.js (stesso stile del Glossario, chip
   * di classe come il Manuale), raggiungibile dalla matitina del Grimorio.
   * Questo pannello resta raggiungibile dal link in fondo a quel picker.
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

  function newResourceDraft() {
    return { key: '', name: '', max: 1, ctx: '', resetOn: 'long' };
  }

  function buildResourceEditor(draft, resource, index, onChange) {
    var box = el('div', 'grim-resource-block');
    box.appendChild(el('div', 'edit-section-label', 'Risorsa ' + (index + 1)));

    var keyField = el('div', 'edit-field');
    keyField.appendChild(el('label', 'edit-label', 'Chiave'));
    var keyInput = document.createElement('input');
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
    var draft = {
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

    openSheet('Risorse personalizzate');
    buildResourcesSection(draft);

    addSaveButton(function () {
      commit(function (next) {
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
    // Il pulsante grim-advanced-btn (matitina) ora apre il picker "tutte le
    // classi" in js/grimorio.js, non più questo pannello — vedi il link
    // "Risorse personalizzate" dentro quel picker per arrivare qui.
  }

  window.AppGrimorioAdvanced = {
    init: init,
    open: openAdvanced
  };
})();
