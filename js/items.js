(function () {
  /*
   * Reliquie / oggetti magici creati dall'utente (Step 3.5, redesign 3.6). Ogni
   * oggetto ha una lista di effetti che il motore somma automaticamente (vedi
   * modSum in js/engine.js, character.items è un array SEPARATO da
   * character.modifiers, che resta intatto) e, opzionalmente, un numero di usi
   * giornalieri che genera una res-card dinamica nella tab Risorse.
   *
   * Dal redesign 3.6 le card create dall'utente condividono il markup/CSS
   * delle due reliquie storiche hardcoded in index.html (Lama Vincolante,
   * Scudo Magico: classi .relic-acc/.relic-card/.relic-rarity definite in
   * css/components/treasury.css) invece dello stile .item-card precedente.
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

  /* Le 5 rarità D&D usate per il badge .relic-rarity (stesso componente delle
     due reliquie storiche: qui solo le varianti aggiuntive per gli oggetti
     creati dall'utente, vedi css/components/treasury.css). */
  var RARITY_OPTIONS = [
    { id: 'comune', label: 'Comune' },
    { id: 'non-comune', label: 'Non comune' },
    { id: 'raro', label: 'Raro' },
    { id: 'molto-raro', label: 'Molto raro' },
    { id: 'leggendario', label: 'Leggendario' }
  ];

  function rarityLabel(id) {
    var found = null;
    RARITY_OPTIONS.forEach(function (o) {
      if (o.id === id) {
        found = o.label;
      }
    });

    return found || id;
  }

  /* Sintonizzazione (Step 3.6): al massimo 3 oggetti attivi insieme */
  var MAX_ATTUNED = 3;

  function attunedCount(ch) {
    return (ch.items || []).filter(function (it) {
      return it.requiresAttunement && it.attuned;
    }).length;
  }

  function canAttune(ch, item) {
    return item.requiresAttunement && !item.attuned && attunedCount(ch) < MAX_ATTUNED;
  }

  /* ---------- fallback di lettura per item salvati prima del redesign 3.6 ---------- */

  function itemArtOf(item) {
    return item.art || { type: 'preset', value: item.icon || 'ring' };
  }

  function itemRarityOf(item) {
    return item.rarity || 'non-comune';
  }

  function itemRequiresAttunementOf(item) {
    return !!item.requiresAttunement;
  }

  function itemAttunedOf(item) {
    return item.attuned !== false;
  }

  /* Icone (stesso stile minimale a tratto di js/sheet.js: viewBox 24x24,
     stroke corrente, tratto 2). 'sword' e 'shield' sono gli stessi path di
     IC_SWORD/IC_SHIELD in js/sheet.js; le altre 6 sono disegnate ex novo.
     Sono i path centrali usati dentro il medaglione generato da
     medallionSvg() qui sotto, non più mostrate piatte 20x20 come prima del
     redesign 3.6. */
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

  /* ---------- medaglione (arte procedurale o foto caricata) ----------
     Stesso trattamento visivo delle arti "hero" di Lama Vincolante/Scudo
     Magico (glow radiale dorato + anello con gradiente oro) ma generato da
     un template comune per le 8 icone preimpostate, oppure da una foto
     caricata dall'utente (art.type === 'image', art.value è una data: URL).
     id univoci per <svg>: su Safari iOS più oggetti in lista con lo stesso id
     di gradient/clipPath confliggono tra loro (bug reale, non teorico). */
  var medallionUid = 0;

  function medallionSvg(art, size) {
    size = size || 100;
    var id = 'med' + (medallionUid++);
    if (art.type === 'image') {
      return '<svg class="medallion" viewBox="0 0 100 100" width="' + size + '" height="' + size + '">' +
        '<defs><clipPath id="clip' + id + '"><circle cx="50" cy="50" r="40"/></clipPath>' +
        '<linearGradient id="ring' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8c96a"/><stop offset="50%" stop-color="#c9a443"/><stop offset="100%" stop-color="#8a6820"/></linearGradient></defs>' +
        '<image href="' + art.value + '" x="10" y="10" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip' + id + ')"/>' +
        '<circle cx="50" cy="50" r="40" fill="none" stroke="url(#ring' + id + ')" stroke-width="2.5"/></svg>';
    }
    var gem = art.value || 'ring';

    return '<svg class="medallion" viewBox="0 0 100 100" width="' + size + '" height="' + size + '">' +
      '<defs><radialGradient id="glow' + id + '" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="rgba(201,164,67,0.35)"/><stop offset="70%" stop-color="rgba(201,164,67,0.08)"/><stop offset="100%" stop-color="rgba(201,164,67,0)"/></radialGradient>' +
      '<linearGradient id="ring' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8c96a"/><stop offset="50%" stop-color="#c9a443"/><stop offset="100%" stop-color="#8a6820"/></linearGradient></defs>' +
      '<circle cx="50" cy="50" r="48" fill="url(#glow' + id + ')"/>' +
      '<circle cx="50" cy="50" r="40" fill="#242220" stroke="url(#ring' + id + ')" stroke-width="2.5"/>' +
      '<g transform="translate(50 50) scale(2.6) translate(-12 -12)" stroke="#c9a443" stroke-width="0.8" fill="none" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[gem] || ICONS.ring) + '</g></svg>';
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

  /* ---------- sezione arte (galleria di medaglioni preimpostati + upload foto) ---------- */

  function buildArtGrid(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Arte'));
    var grid = el('div', 'art-grid');
    var tiles = {};
    var uploadTile;

    function refresh() {
      ICON_IDS.forEach(function (id) {
        tiles[id].classList.toggle('on', draft.art.type === 'preset' && draft.art.value === id);
      });
      var isImage = draft.art.type === 'image';
      uploadTile.classList.toggle('on', isImage);
      uploadTile.classList.toggle('has-image', isImage);
      uploadTile.style.backgroundImage = isImage ? 'url(' + draft.art.value + ')' : '';
    }

    ICON_IDS.forEach(function (id) {
      var tile = el('button', 'art-tile');
      tile.type = 'button';
      tile.innerHTML = medallionSvg({ type: 'preset', value: id }, 40);
      tile.setAttribute('aria-label', 'Arte ' + id);
      tile.addEventListener('click', function () {
        draft.art = { type: 'preset', value: id };
        refresh();
      });
      tiles[id] = tile;
      grid.appendChild(tile);
    });

    uploadTile = el('button', 'art-tile upload');
    uploadTile.type = 'button';
    var uploadInner = el('span', 'art-tile-upload-inner');
    uploadInner.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/>' +
      '<path d="M6 10l6 -6l6 6"/><path d="M4 20h16"/></svg><span>Carica foto</span>';
    uploadTile.appendChild(uploadInner);

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'art-tile-file';
    fileInput.setAttribute('aria-label', 'Carica una foto per questa reliquia');
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        draft.art = { type: 'image', value: reader.result };
        refresh();
      };
      reader.readAsDataURL(file);
    });
    uploadTile.appendChild(fileInput);
    grid.appendChild(uploadTile);

    refresh();
    wrap.appendChild(grid);

    return wrap;
  }

  /* ---------- sezione rarità (chip selezionabili, singola scelta) ---------- */

  function buildRaritySection(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Rarità'));
    var row = el('div', 'chip-row');
    var chips = {};
    RARITY_OPTIONS.forEach(function (opt) {
      var chip = el('button', 'chip rarity-chip' + (draft.rarity === opt.id ? ' on' : ''), opt.label);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        draft.rarity = opt.id;
        RARITY_OPTIONS.forEach(function (o) {
          chips[o.id].classList.toggle('on', o.id === opt.id);
        });
      });
      chips[opt.id] = chip;
      row.appendChild(chip);
    });
    wrap.appendChild(row);

    return wrap;
  }

  /* ---------- sezione sintonizzazione (solo il requisito: attuned/dis-attuned
     si gestisce SOLO dalla lista, mai da questa scheda, vedi head-gem sotto) ---------- */

  function buildAttunementSection(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Sintonizzazione'));
    var toggle = el('button', 'chip' + (draft.requiresAttunement ? ' on' : ''), 'Richiede sintonizzazione');
    toggle.type = 'button';
    toggle.addEventListener('click', function () {
      draft.requiresAttunement = toggle.classList.toggle('on');
    });
    wrap.appendChild(toggle);

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
      art: itemArtOf(existingItem),
      rarity: itemRarityOf(existingItem),
      effects: (existingItem.effects || []).map(function (e) {
        return { target: e.target, value: e.value };
      }),
      usesMax: existingItem.usesMax || 0,
      requiresAttunement: itemRequiresAttunementOf(existingItem),
      // attuned NON è editabile da questa scheda (si gestisce solo dalla
      // lista, vedi head-gem in renderTraitsList): la bozza lo porta con sé
      // solo per riscriverlo invariato al salvataggio.
      attuned: itemAttunedOf(existingItem)
    } : {
      id: null, name: '', desc: '', art: { type: 'preset', value: 'ring' }, rarity: 'non-comune',
      effects: [], usesMax: 0, requiresAttunement: false
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

    bodyEl.appendChild(buildArtGrid(draft));
    bodyEl.appendChild(buildRaritySection(draft));
    bodyEl.appendChild(buildEffectsSection(draft));
    bodyEl.appendChild(buildUsesSection(draft));
    bodyEl.appendChild(buildAttunementSection(draft));

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
              art: draft.art, rarity: draft.rarity, effects: draft.effects, usesMax: draft.usesMax,
              requiresAttunement: draft.requiresAttunement, attuned: draft.attuned
            };
          }
        } else {
          character.items.push({
            id: 'itm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            name: draft.name.trim(), desc: draft.desc,
            art: draft.art, rarity: draft.rarity, effects: draft.effects, usesMax: draft.usesMax,
            requiresAttunement: draft.requiresAttunement,
            // Un oggetto nuovo che richiede sintonizzazione entra in collezione
            // ma non è subito attivo/equipaggiato: va sintonizzato a mano dalla
            // lista (gemma sulla testata dell'accordion).
            attuned: !draft.requiresAttunement
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

  /* ---------- render: contatore sintonizzazione (sopra la lista, solo se
     almeno un oggetto la richiede) ---------- */

  function buildAttuneCounter(ch) {
    var wrap = el('div', 'attune-counter');
    wrap.appendChild(el('span', 'attune-counter-label', '✦ Sintonizzazione'));
    var dots = el('span', 'attune-dots');
    dots.setAttribute('aria-hidden', 'true');
    var count = attunedCount(ch);
    for (var i = 0; i < MAX_ATTUNED; i++) {
      dots.appendChild(el('span', 'attune-dot' + (i < count ? ' filled' : '')));
    }
    wrap.appendChild(dots);
    wrap.appendChild(el('span', 'attune-counter-count', count + '/' + MAX_ATTUNED));

    return wrap;
  }

  /* ---------- render: lista Reliquie (accordion identico alla vetrina
     hardcoded di Lama Vincolante/Scudo Magico, vedi index.html e
     css/components/treasury.css) ---------- */

  function renderTraitsList() {
    var list = document.getElementById('custom-items-list');
    if (!list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var items = ch.items || [];
    list.innerHTML = '';

    var anyAttunement = items.some(function (it) {
      return itemRequiresAttunementOf(it);
    });
    if (anyAttunement) {
      list.appendChild(buildAttuneCounter(ch));
    }

    items.forEach(function (item) {
      var art = itemArtOf(item);
      var rarity = itemRarityOf(item);
      var requiresAttunement = itemRequiresAttunementOf(item);
      var attuned = itemAttunedOf(item);

      var acc = el('div', 'relic-acc' + (requiresAttunement && !attuned ? ' dim' : ''));

      var head = el('button', 'relic-acc-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', 'false');

      if (requiresAttunement) {
        var gem = el('button', 'head-gem' + (attuned ? ' on' : ''), '✦');
        gem.type = 'button';
        gem.setAttribute('aria-label', attuned ? 'Dis-sintonizza' : 'Sintonizza');
        if (!attuned && !canAttune(ch, item)) {
          gem.title = 'Slot pieni';
        }
        gem.addEventListener('click', function (e) {
          e.stopPropagation();
          if (attuned) {
            commitState(function (character) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.attuned = false;
                }
              });
            });
          } else if (canAttune(ch, item)) {
            commitState(function (character) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.attuned = true;
                }
              });
            });
          }
        });
        head.appendChild(gem);
      } else {
        var spacer = el('span', 'head-gem spacer', '✦');
        spacer.setAttribute('aria-hidden', 'true');
        head.appendChild(spacer);
      }

      var medSm = el('span', 'medal-sm');
      medSm.innerHTML = medallionSvg(art, 30);
      head.appendChild(medSm);

      head.appendChild(el('span', 'relic-acc-name', item.name));
      head.appendChild(el('span', 'relic-rarity ' + rarity, rarityLabel(rarity)));
      head.appendChild(el('span', 'relic-acc-arrow', '▾'));

      head.addEventListener('click', function () {
        var isOpen = acc.classList.toggle('open');
        head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      var body = el('div', 'relic-acc-body');
      var card = el('div', 'relic-card');

      var artWrap = el('div', 'relic-art relic-art-big');
      artWrap.innerHTML = medallionSvg(art, 132);
      card.appendChild(artWrap);

      var headRow = el('div', 'relic-head');
      headRow.appendChild(el('h3', 'relic-name', item.name));
      headRow.appendChild(el('span', 'relic-rarity ' + rarity, rarityLabel(rarity)));
      card.appendChild(headRow);

      if (item.desc) {
        card.appendChild(el('p', 'relic-type', item.desc));
      }

      if (requiresAttunement) {
        card.appendChild(el('div', 'attune-badge ' + (attuned ? 'on' : 'off'),
          attuned ? '✓ Sintonizzato' : 'Non sintonizzato'));
      }

      if ((item.effects || []).length) {
        var ul = el('ul', 'relic-effects');
        item.effects.forEach(function (eff) {
          ul.appendChild(el('li', null, window.AppEngine.formatMod(eff.value) + ' ' + effectLabel(eff.target)));
        });
        card.appendChild(ul);
      }

      // Non c'è più un click diretto sulla card (l'intera testata apre/chiude
      // l'accordion, come le due reliquie storiche): la modifica resta
      // raggiungibile toccando il corpo espanso.
      card.appendChild(el('p', 'relic-note', 'Tocca per modificare'));
      card.addEventListener('click', function () {
        buildItemSheet(item);
      });

      body.appendChild(card);
      acc.appendChild(head);
      acc.appendChild(body);
      list.appendChild(acc);
    });
  }

  /* ---------- render: res-card per gli oggetti con usi limitati ---------- */

  function buildResourceCard(item) {
    var card = document.createElement('div');
    card.className = 'res-card';
    card.setAttribute('data-key', 'item-' + item.id);
    card.setAttribute('data-max', item.usesMax);

    var art = itemArtOf(item);
    var iconId = art.type === 'preset' ? art.value : 'ring';

    var med = el('span', 'rc-med');
    med.setAttribute('aria-hidden', 'true');
    med.innerHTML = iconSvg(iconId);
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
      // Un oggetto non sintonizzato non genera/consuma usi giornalieri
      // (stesso principio di modSum/computeResources in js/engine.js).
      return it.usesMax > 0 && (!it.requiresAttunement || it.attuned);
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
