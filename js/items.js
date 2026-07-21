(function () {
  /*
   * Reliquie / oggetti magici creati dall'utente (Step 3.5). Ogni oggetto ha
   * una lista di effetti che il motore somma automaticamente (vedi modSum in
   * js/engine.js, character.items è un array SEPARATO da character.modifiers,
   * che resta intatto) e, opzionalmente, un numero di usi giornalieri che
   * genera una res-card dinamica nella tab Risorse.
   *
   * Stesso pattern "overlay gemello" di js/edit-sheet.js: bozza locale
   * finché non si preme Salva, chiudere con ✕/tap-fuori scarta tutto.
   */

  /* Etichette per esteso (mai sigle) dei soli 8 effetti supportati dal motore */
  var EFFECT_OPTIONS = [
    { id: 'attacco', label: 'Colpire con le armi' },
    { id: 'danni', label: 'Danni con le armi' },
    { id: 'cd-inc', label: 'Difficoltà degli incantesimi' },
    { id: 'att-inc', label: 'Colpire con gli incantesimi' },
    { id: 'ca', label: 'Classe Armatura' },
    { id: 'ts', label: 'Tiri Salvezza' },
    { id: 'iniziativa', label: 'Iniziativa' },
    { id: 'pf-max', label: 'Punti Ferita massimi' }
  ];

  function effectLabel(target) {
    var found = null;
    EFFECT_OPTIONS.forEach(function (o) {
      if (o.id === target) {
        found = o.label;
      }
    });

    return found || target;
  }

  /* Icone (stesso stile minimale a tratto di js/sheet.js: viewBox 24x24,
     stroke corrente, tratto 2). 'sword' e 'shield' sono gli stessi path di
     IC_SWORD/IC_SHIELD in js/sheet.js; le altre 6 sono disegnate ex novo. */
  var SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONS = {
    sword: '<path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"/><path d="M6.5 11.5l6 6"/>',
    shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',
    ring: '<circle cx="12" cy="15" r="5"/><path d="M8.5 10.5l3.5 -6.5l3.5 6.5z"/>',
    amulet: '<path d="M5 4c0 4.5 3 7 7 7s7 -2.5 7 -7"/><circle cx="12" cy="16" r="4"/>',
    cloak: '<path d="M9 8.5a3 3 0 0 1 6 0"/><path d="M7.5 8.5l-3 12h15l-3 -12"/>',
    wand: '<path d="M4.5 19.5l9 -9"/><path d="M17 3l1.2 2.3l2.3 1.2l-2.3 1.2l-1.2 2.3l-1.2 -2.3l-2.3 -1.2l2.3 -1.2z"/>',
    potion: '<path d="M10 3h4"/><path d="M11 3v3.5l-4.3 6.8a3.3 3.3 0 0 0 2.8 5h5a3.3 3.3 0 0 0 2.8 -5l-4.3 -6.8v-3.5"/>',
    tome: '<path d="M4 5a2 2 0 0 1 2 -2h6v18H6a2 2 0 0 1 -2 -2z"/>' +
      '<path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6"/>'
  };
  var ICON_IDS = ['sword', 'shield', 'ring', 'amulet', 'cloak', 'wand', 'potion', 'tome'];

  function iconSvg(id) {
    return '<svg ' + SVG_ATTRS + '>' + (ICONS[id] || ICONS.ring) + '</svg>';
  }

  var overlay, titleEl, bodyEl;

  /* ---------- helper DOM (stessi di js/edit-sheet.js, copiati qui: sono
     piccoli generatori generici, non vale la pena condividerli tra script
     separati non-modulo) ---------- */

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

  function buildSelect(options, selectedValue) {
    var select = document.createElement('select');
    select.className = 'edit-select';
    options.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === selectedValue) {
        o.selected = true;
      }
      select.appendChild(o);
    });

    return select;
  }

  function buildField(labelText, inputEl, id) {
    var field = el('div', 'edit-field');
    var label = el('label', 'edit-label', labelText);
    if (id) {
      inputEl.id = id;
      label.setAttribute('for', id);
    }
    field.appendChild(label);
    field.appendChild(inputEl);

    return field;
  }

  /* ---------- apertura / chiusura del bottom sheet di editing ---------- */

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = ''; // scarta qualunque bozza non salvata
  }

  /* ---------- applica + rerender (lista Tratti + res-card + stats/sheet) ---------- */

  function commitState(mutate) {
    var state = window.AppStorage.getState();
    mutate(state.character);
    window.AppStorage.saveState(state, true); // persiste subito + sync cloud (meccanismo esistente)
    render(); // ricrea le card PRIMA che stats/sheet le cerchino nel DOM
    if (window.AppStats && window.AppStats.render) {
      window.AppStats.render();
    }
    if (window.AppSheet && window.AppSheet.render) {
      window.AppSheet.render();
    }
  }

  /* ---------- sezione icona ---------- */

  function buildIconPicker(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Icona'));
    var row = el('div', 'icon-pick-row');
    var buttons = {};
    ICON_IDS.forEach(function (id) {
      var btn = el('button', 'icon-pick' + (draft.icon === id ? ' on' : ''));
      btn.type = 'button';
      btn.innerHTML = iconSvg(id);
      btn.setAttribute('aria-label', 'Icona ' + id);
      btn.addEventListener('click', function () {
        draft.icon = id;
        ICON_IDS.forEach(function (otherId) {
          buttons[otherId].classList.toggle('on', otherId === id);
        });
      });
      buttons[id] = btn;
      row.appendChild(btn);
    });
    wrap.appendChild(row);

    return wrap;
  }

  /* ---------- sezione effetti (righe ripetibili) ---------- */

  function buildEffectsSection(draft) {
    var section = el('div');
    section.appendChild(el('div', 'edit-section-label', 'Effetti'));
    var list = el('div', 'effects-list');
    section.appendChild(list);

    function renderRows() {
      list.innerHTML = '';
      draft.effects.forEach(function (eff, idx) {
        var row = el('div', 'effect-row');

        var select = buildSelect(EFFECT_OPTIONS, eff.target);
        select.addEventListener('change', function () {
          eff.target = select.value;
        });
        row.appendChild(select);

        var stepper = el('div', 'edit-stepper');
        var minus = el('button', 'stepper-btn minus', '−');
        minus.type = 'button';
        minus.setAttribute('aria-label', 'Diminuisci valore effetto');
        var valEl = el('span', 'edit-stat-score', window.AppEngine.formatMod(eff.value));
        var plus = el('button', 'stepper-btn plus', '+');
        plus.type = 'button';
        plus.setAttribute('aria-label', 'Aumenta valore effetto');
        minus.addEventListener('click', function () {
          eff.value = Math.max(-10, eff.value - 1);
          valEl.textContent = window.AppEngine.formatMod(eff.value);
        });
        plus.addEventListener('click', function () {
          eff.value = Math.min(10, eff.value + 1);
          valEl.textContent = window.AppEngine.formatMod(eff.value);
        });
        stepper.appendChild(minus);
        stepper.appendChild(valEl);
        stepper.appendChild(plus);
        row.appendChild(stepper);

        var removeBtn = el('button', 'effect-remove-btn', '✕');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Rimuovi questo effetto');
        removeBtn.addEventListener('click', function () {
          draft.effects.splice(idx, 1);
          renderRows();
        });
        row.appendChild(removeBtn);

        list.appendChild(row);
      });
    }
    renderRows();

    var addBtn = el('button', 'effect-add-btn', '+ Aggiungi effetto');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      draft.effects.push({ target: EFFECT_OPTIONS[0].id, value: 1 });
      renderRows();
    });
    section.appendChild(addBtn);

    return section;
  }

  /* ---------- sezione usi limitati ---------- */

  function buildUsesSection(draft) {
    var wrap = el('div');

    var toggleField = el('div', 'edit-field');
    toggleField.appendChild(el('span', 'edit-label', 'Usi limitati'));
    var toggle = el('button', 'chip' + (draft.usesMax > 0 ? ' on' : ''), 'Usi limitati (al giorno)');
    toggle.type = 'button';
    toggleField.appendChild(toggle);
    wrap.appendChild(toggleField);

    var usesField = el('div', 'edit-field');
    usesField.appendChild(el('label', 'edit-label', 'Numero di usi'));
    var stepper = el('div', 'edit-stepper');
    var minus = el('button', 'stepper-btn minus', '−');
    minus.type = 'button';
    var localUses = draft.usesMax > 0 ? draft.usesMax : 1;
    var valEl = el('span', 'edit-stat-score', String(localUses));
    var plus = el('button', 'stepper-btn plus', '+');
    plus.type = 'button';

    function refreshVisibility() {
      usesField.classList.toggle('hidden', draft.usesMax <= 0);
    }
    refreshVisibility();

    minus.addEventListener('click', function () {
      localUses = Math.max(1, localUses - 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    plus.addEventListener('click', function () {
      localUses = Math.min(20, localUses + 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    stepper.appendChild(minus);
    stepper.appendChild(valEl);
    stepper.appendChild(plus);
    usesField.appendChild(stepper);
    wrap.appendChild(usesField);

    toggle.addEventListener('click', function () {
      var isOn = toggle.classList.toggle('on');
      draft.usesMax = isOn ? localUses : 0;
      refreshVisibility();
    });

    return wrap;
  }

  /* ---------- bottom sheet "Nuova Reliquia" / modifica ---------- */

  function buildItemSheet(existingItem) {
    var isEdit = !!existingItem;
    var draft = isEdit ? {
      id: existingItem.id,
      name: existingItem.name || '',
      desc: existingItem.desc || '',
      icon: existingItem.icon || 'ring',
      effects: (existingItem.effects || []).map(function (e) {
        return { target: e.target, value: e.value };
      }),
      usesMax: existingItem.usesMax || 0
    } : {
      id: null, name: '', desc: '', icon: 'ring', effects: [], usesMax: 0
    };

    openSheet(isEdit ? 'Modifica reliquia' : 'Nuova reliquia');

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = draft.name;
    nameInput.addEventListener('input', function () {
      draft.name = nameInput.value;
    });
    bodyEl.appendChild(buildField('Nome', nameInput, 'item-name-input'));

    var descInput = document.createElement('textarea');
    descInput.className = 'edit-input item-desc-input';
    descInput.rows = 3;
    descInput.value = draft.desc;
    descInput.addEventListener('input', function () {
      draft.desc = descInput.value;
    });
    bodyEl.appendChild(buildField('Descrizione', descInput, 'item-desc-input'));

    bodyEl.appendChild(buildIconPicker(draft));
    bodyEl.appendChild(buildEffectsSection(draft));
    bodyEl.appendChild(buildUsesSection(draft));

    var errorEl = el('p', 'item-form-error');
    bodyEl.appendChild(errorEl);

    var saveBtn = el('button', 'save-btn', 'Salva');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', function () {
      if (!draft.name.trim()) {
        errorEl.textContent = 'Serve un nome per la reliquia.';

        return;
      }
      commitState(function (character) {
        character.items = character.items || [];
        if (isEdit) {
          var idx = -1;
          character.items.forEach(function (it, i) {
            if (it.id === draft.id) {
              idx = i;
            }
          });
          if (idx !== -1) {
            character.items[idx] = {
              id: draft.id, name: draft.name.trim(), desc: draft.desc,
              icon: draft.icon, effects: draft.effects, usesMax: draft.usesMax
            };
          }
        } else {
          character.items.push({
            id: 'itm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            name: draft.name.trim(), desc: draft.desc,
            icon: draft.icon, effects: draft.effects, usesMax: draft.usesMax
          });
        }
      });
      closeSheet();
    });
    bodyEl.appendChild(saveBtn);

    if (isEdit) {
      var deleteBtn = el('button', 'delete-btn', 'Elimina');
      deleteBtn.type = 'button';
      deleteBtn.addEventListener('click', function () {
        if (!confirm('Eliminare "' + draft.name + '"? L\'azione non si può annullare.')) {
          return;
        }
        commitState(function (character) {
          character.items = (character.items || []).filter(function (it) {
            return it.id !== draft.id;
          });
        });
        closeSheet();
      });
      bodyEl.appendChild(deleteBtn);
    }
  }

  /* ---------- render: lista Tratti ---------- */

  function renderTraitsList() {
    var list = document.getElementById('custom-items-list');
    if (!list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var items = ch.items || [];
    list.innerHTML = '';
    items.forEach(function (item) {
      var card = el('div', 'item-card');

      var head = el('div', 'feat-head');
      var icWrap = el('span', 'item-ic');
      icWrap.innerHTML = iconSvg(item.icon);
      head.appendChild(icWrap);
      head.appendChild(el('span', 'ft', item.name));
      card.appendChild(head);

      if (item.desc) {
        card.appendChild(el('div', 'fd', item.desc));
      }

      if ((item.effects || []).length) {
        var tags = el('div', 'item-tags');
        item.effects.forEach(function (eff) {
          tags.appendChild(el('span', 'tag', window.AppEngine.formatMod(eff.value) + ' ' + effectLabel(eff.target)));
        });
        card.appendChild(tags);
      }

      card.addEventListener('click', function () {
        buildItemSheet(item);
      });

      list.appendChild(card);
    });
  }

  /* ---------- render: res-card per gli oggetti con usi limitati ---------- */

  function buildResourceCard(item) {
    var card = document.createElement('div');
    card.className = 'res-card';
    card.setAttribute('data-key', 'item-' + item.id);
    card.setAttribute('data-max', item.usesMax);

    var med = el('span', 'rc-med');
    med.setAttribute('aria-hidden', 'true');
    med.innerHTML = iconSvg(item.icon);
    card.appendChild(med);

    var info = el('div', 'rc-info');
    info.appendChild(el('span', 'rc-name', item.name));
    info.appendChild(el('span', 'rc-ctx', 'usi limitati'));
    info.appendChild(el('div', 'segbar'));
    card.appendChild(info);

    card.appendChild(el('span', 'rc-count'));

    return card;
  }

  function renderResourceCards() {
    var sec = document.getElementById('custom-items-res-sec');
    if (!sec) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var items = (ch.items || []).filter(function (it) {
      return it.usesMax > 0;
    });

    Array.prototype.slice.call(sec.querySelectorAll('.res-card')).forEach(function (c) {
      c.remove();
    });

    items.forEach(function (item) {
      var card = buildResourceCard(item);
      sec.appendChild(card);
      if (window.AppSheet && window.AppSheet.renderResourceCard) {
        window.AppSheet.renderResourceCard(card); // aggancia subito il tocco (usi ± come le altre res-card)
      }
    });

    sec.classList.toggle('hidden', items.length === 0);
  }

  function render() {
    renderTraitsList();
    renderResourceCards();
  }

  /* ---------- avvio ---------- */

  function init() {
    overlay = document.getElementById('item-sheet-overlay');
    titleEl = document.getElementById('item-sheet-title');
    bodyEl = document.getElementById('item-sheet-body');
    if (!overlay || !titleEl || !bodyEl) {
      return;
    }
    var closeBtn = document.getElementById('item-sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    // tap fuori dal foglio: chiude e scarta (nessuno stato è stato scritto)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    var addBtn = document.getElementById('item-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        buildItemSheet(null);
      });
    }
    render();
  }

  window.AppItems = {
    init: init,
    render: render
  };
})();
