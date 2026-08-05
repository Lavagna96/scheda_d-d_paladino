(function () {
  /*
   * Equipaggiamento (redesign 3.8): schermata unica per gli 8 slot del
   * personaggio (Testa, Torso, Arma, Scudo, Mani, Piedi, Anello, Amuleto).
   * Prima erano sparsi in punti diversi e scollegati (matita "Modifica
   * equipaggiamento" in Attacchi per armatura/scudo/arma base, toggle
   * "Equipaggiato" per armi/scudi-oggetto nella vetrina Tesoreria) — con un
   * bug reale come conseguenza: uno scudo "base" via toggle in Equipaggiamento
   * e uno scudo-oggetto in Tesoreria potevano risultare entrambi "attivi"
   * senza che l'utente se ne accorgesse. Qui c'è un solo posto, un solo stato
   * coerente per slot: selezionare un'opzione sgancia sempre ogni altra
   * fonte già attiva in quello slot (oggetto o fatto base), mai due insieme.
   *
   * Torso/Arma/Scudo hanno anche un'opzione "base" (senza oggetto, sui fatti
   * character.armor/character.weapon di sempre — invariati). Testa/Mani/
   * Piedi/Anello/Amuleto esistono solo come oggetto (character.items, kind
   * 'helmet'/'gloves'/'boots'/'ring'/'amulet' — js/items.js): "Vuoto" è il
   * loro stato naturale finché non si equipaggia qualcosa. La priorità
   * oggetto-sopra-base (quando un oggetto è equipaggiato E sintonizzato) vive
   * in js/engine.js, invariata per weapon/shield ed estesa qui ad armor.
   *
   * Sintonizzazione (redesign 3.8.1): stesso meccanismo ✦ già in Tesoreria
   * (js/items.js: MAX_ATTUNED, attunedCount, canAttune — esportati da lì,
   * nessuna logica duplicata qui). Contatore in cima (stesso criterio di
   * visibilità di buildAttuneCounter in Tesoreria: solo se ALMENO UN oggetto
   * del personaggio richiede sintonizzazione, non solo quelli equipaggiati —
   * è un tetto globale sul personaggio, non per-slot) + sezione sotto la
   * griglia con solo gli oggetti EQUIPAGGIATI in uno degli 8 slot che la
   * richiedono (quelli senza requiresAttunement sono già sempre attivi, non
   * compaiono). Tesoreria resta invariata: stessa funzione sottostante,
   * zero cambi visivi/comportamentali là.
   */

  var SLOTS = [
    { id: 'testa', kind: 'helmet', label: 'Testa' },
    { id: 'torso', kind: 'armor', label: 'Torso', hasBase: true },
    { id: 'arma', kind: 'weapon', label: 'Arma', hasBase: true },
    { id: 'scudo', kind: 'shield', label: 'Scudo', hasBase: true },
    { id: 'mani', kind: 'gloves', label: 'Mani' },
    { id: 'piedi', kind: 'boots', label: 'Piedi' },
    { id: 'anello', kind: 'ring', label: 'Anello' },
    { id: 'amuleto', kind: 'amulet', label: 'Amuleto' }
  ];

  /* Icone piccole (stesso stile a tratto minimale di js/items.js/js/sheet.js:
     viewBox 24x24, stroke corrente, tratto 2) — qui servono solo come chip
     nella card-slot e nella riga d'opzione del bottom sheet, non sono le
     illustrazioni elaborate del medaglione reliquia (quelle restano solo in
     js/items.js, non se ne aggiungono di nuove qui). */
  var SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var SLOT_ICONS = {
    helmet: '<path d="M4 13a8 8 0 0 1 16 0v3H4z"/><path d="M4 16h16"/><path d="M9 16v2a3 3 0 0 0 6 0v-2"/>',
    armor: '<path d="M8 3l4 1.6L16 3l1 4-2 1v9a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V8L7 7z"/>',
    weapon: '<path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"/><path d="M6.5 11.5l6 6"/>',
    shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',
    gloves: '<path d="M7 21v-8a2 2 0 0 1 4 0v2M11 13v-3a1.6 1.6 0 0 1 3.2 0v3M14.2 13v-2a1.6 1.6 0 0 1 3.2 0v4' +
      'a5 5 0 0 1-5 5H9a4 4 0 0 1-4-4v-3l-1-3 1.6-.8L7 13"/>',
    boots: '<path d="M9 3v9l-5 4v2h16v-3c0-2-2-3-4-3h-3V3z"/>',
    ring: '<circle cx="12" cy="15" r="5"/><path d="M8.5 10.5l3.5 -6.5l3.5 6.5z"/>',
    amulet: '<path d="M5 4c0 4.5 3 7 7 7s7 -2.5 7 -7"/><circle cx="12" cy="16" r="4"/>'
  };

  function slotIconSvg(kind) {
    return '<svg ' + SVG_ATTRS + '>' + (SLOT_ICONS[kind] || SLOT_ICONS.ring) + '</svg>';
  }

  var PICK_CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 L10 18 L20 6"/></svg>';

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

  /* ---------- apertura / chiusura del bottom sheet (stesso pattern gemello
     di js/edit-sheet.js e js/items.js: overlay tutto suo, chiudere scarta) ---------- */

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = '';
  }

  /* ---------- applica + rerender ---------- */

  function commitState(mutate) {
    var state = window.AppStorage.getState();
    mutate(state.character);
    window.AppStorage.saveState(state, true); // persiste subito + sync cloud
    render();
    if (window.AppStats && window.AppStats.render) {
      window.AppStats.render();
    }
    if (window.AppTraits && window.AppTraits.render) {
      window.AppTraits.render(); // Aura di Protezione dipende da armatura/scudo
    }
    if (window.AppSheet && window.AppSheet.render) {
      window.AppSheet.render();
    }
    if (window.AppItems && window.AppItems.render) {
      window.AppItems.render(); // Tesoreria: le reliquie riflettono l'equip/disequip
    }
  }

  function weaponById(id) {
    var found = null;
    (window.MANUAL_55.weapons || []).forEach(function (w) {
      if (w.id === id) {
        found = w;
      }
    });

    return found;
  }

  function defaultShieldAcBonus() {
    return ((window.MANUAL_55 && window.MANUAL_55.shield) || {}).ac || 2;
  }

  /* window.AppItems.getEquippedItemOfKind è filtrato su itemEffectsActive
     (equipaggiato E sintonizzato/non-sintonizzabile) — giusto per l'engine
     (CA/attacco non devono contare un oggetto ancora da sintonizzare), ma
     SBAGLIATO qui: questa schermata gestisce equip/disequip come stato
     fisico, la sintonizzazione è un concetto separato (sezione dedicata più
     sotto). Con il filtro attivo un oggetto equipaggiato-ma-non-sintonizzato
     sparirebbe dalla card e dal radio del bottom sheet, e la sezione
     "Oggetti sintonizzati indossati" — che esiste apposta per sintonizzare
     ciò che è già equipaggiato — non lo mostrerebbe mai (bug: nessun modo di
     sintonizzarlo). Qui serve lo stato grezzo `equipped`, non quello attivo. */
  function equippedItemOfKindRaw(ch, kind) {
    var found = null;
    window.AppItems.itemsOfKind(ch, kind).forEach(function (it) {
      if (it.equipped) {
        found = it;
      }
    });

    return found;
  }

  /* ---------- opzioni per slot (radio, selezione singola) ----------
     item = oggetto magico di quel kind (character.items); base-* = fatto
     "base" da manuale (solo Torso/Arma/Scudo); none = "Nessuno", sempre
     presente. Ogni opzione porta `kind` per l'icona di ripiego nella riga. */

  function buildOptionsForSlot(slot, ch) {
    var equippedItem = equippedItemOfKindRaw(ch, slot.kind);
    var opts = [];

    window.AppItems.itemsOfKind(ch, slot.kind).forEach(function (it) {
      opts.push({
        type: 'item',
        kind: slot.kind,
        id: it.id,
        name: it.name,
        rarity: window.AppItems.itemRarityOf(it),
        art: window.AppItems.itemArtOf(it),
        selected: !!equippedItem && equippedItem.id === it.id
      });
    });

    // Le opzioni "base" (manuale) restano SEMPRE elencate, anche quando è un
    // oggetto ad essere attivo — selezionarle sgancia l'oggetto (vedi
    // selectOption). Nessuna base risulta "on" mentre un oggetto è attivo:
    // solo l'oggetto conta come stato corrente dello slot in quel momento.
    if (slot.hasBase) {
      if (slot.kind === 'armor') {
        (window.MANUAL_55.armors || []).forEach(function (a) {
          opts.push({
            type: 'base-armor', kind: 'armor', id: a.id,
            name: window.AppEngine.armorLabel(a.id),
            selected: !equippedItem && (ch.armor || {}).id === a.id
          });
        });
      } else if (slot.kind === 'shield') {
        opts.push({
          type: 'base-shield', kind: 'shield', id: 'shield',
          name: 'Scudo · CA +' + defaultShieldAcBonus(),
          selected: !equippedItem && !!(ch.armor || {}).shield
        });
      } else if (slot.kind === 'weapon') {
        (window.MANUAL_55.weapons || []).forEach(function (w) {
          opts.push({
            type: 'base-weapon', kind: 'weapon', id: w.id,
            name: w.name + ' — ' + w.die + ' ' + w.dmg,
            selected: !equippedItem && (ch.weapon || {}).name === w.name
          });
        });
      }
    }

    var anySelected = opts.some(function (o) { return o.selected; });
    opts.push({ type: 'none', kind: slot.kind, id: '', name: 'Nessuno', selected: !anySelected });

    return opts;
  }

  function selectOption(slot, opt) {
    commitState(function (character) {
      // 1) sgancia SEMPRE l'eventuale oggetto già equipaggiato in questo slot:
      // un oggetto batte sempre il fatto base in js/engine.js, quindi anche
      // scegliendo un'opzione base o "Nessuno" va spento per primo, altrimenti
      // resterebbe lui a decidere silenziosamente CA/attacco.
      window.AppItems.equipItemOfKind(character, slot.kind, null);

      if (opt.type === 'item') {
        window.AppItems.equipItemOfKind(character, slot.kind, opt.id);

        return;
      }
      if (opt.type === 'base-armor') {
        character.armor = character.armor || {};
        character.armor.id = opt.id;

        return;
      }
      if (opt.type === 'base-shield') {
        character.armor = character.armor || {};
        character.armor.shield = true;

        return;
      }
      if (opt.type === 'base-weapon') {
        var w = weaponById(opt.id);
        if (!w) {
          return;
        }
        character.weapon = character.weapon || {};
        character.weapon.name = w.name;
        character.weapon.die = w.die;
        character.weapon.type = w.dmg;
        character.weapon.mastery = w.mastery;
        character.weapon.finesse = (w.props || []).indexOf('Accurata') !== -1;
        character.weapon.ranged = w.cat.indexOf('dist') !== -1;
        character.weapon.twoHanded = (w.props || []).indexOf('A due mani') !== -1;

        return;
      }
      // "Nessuno": per Torso/Arma/Scudo pulisce anche il fatto base (l'oggetto
      // è già stato sganciato sopra). Per gli altri 5 slot non c'è nessun
      // fatto base da pulire: sganciare l'oggetto (già fatto) basta.
      if (slot.kind === 'armor') {
        character.armor = character.armor || {};
        character.armor.id = '';
      } else if (slot.kind === 'shield') {
        character.armor = character.armor || {};
        character.armor.shield = false;
      } else if (slot.kind === 'weapon') {
        character.weapon = { name: '', die: '1d8', type: '', mastery: '', finesse: false, ranged: false, twoHanded: false };
      }
    });
    closeSheet();
  }

  function buildOptionRow(slot, opt) {
    var row = el('button', 'pick-row equip-pick-row' + (opt.selected ? ' on' : ''));
    row.type = 'button';

    var badge = el('span', 'pick-badge');
    badge.innerHTML = opt.art ? window.AppItems.medallionSvg(opt.art, 30) : slotIconSvg(opt.kind);
    row.appendChild(badge);

    var body = el('div', 'pick-body');
    var top = el('div', 'pick-top');
    top.appendChild(el('span', 'pick-name', opt.name));
    if (opt.rarity) {
      top.appendChild(el('span', 'pick-meta', window.AppItems.rarityLabel(opt.rarity)));
    }
    body.appendChild(top);
    row.appendChild(body);

    var check = el('span', 'pick-check');
    check.innerHTML = PICK_CHECK_SVG;
    row.appendChild(check);

    row.addEventListener('click', function () {
      selectOption(slot, opt);
    });

    return row;
  }

  function openSlotSheet(slot) {
    var ch = window.AppStorage.getState().character;
    openSheet(slot.label);
    var list = el('div', 'pick-list equip-pick-list');
    buildOptionsForSlot(slot, ch).forEach(function (opt) {
      list.appendChild(buildOptionRow(slot, opt));
    });
    bodyEl.appendChild(list);
  }

  /* ---------- card-slot (griglia 2 colonne, tab Scheda) ---------- */

  function manualArmorName(id) {
    var found = null;
    (window.MANUAL_55.armors || []).forEach(function (a) {
      if (a.id === id) {
        found = a;
      }
    });

    return found ? found.name : '';
  }

  // Cosa mostra la card per questo slot: nome (oggetto o base) + rarità SOLO
  // se occupato da un oggetto magico (l'equipaggiamento base non ha rarità,
  // bordo neutro — vedi css/components/equip.css .equip-slot-card).
  function slotDisplay(slot, ch) {
    var item = equippedItemOfKindRaw(ch, slot.kind);
    if (item) {
      return { name: item.name, rarity: window.AppItems.itemRarityOf(item) };
    }
    if (slot.kind === 'armor' && (ch.armor || {}).id) {
      return { name: manualArmorName(ch.armor.id), rarity: null };
    }
    if (slot.kind === 'shield' && (ch.armor || {}).shield) {
      return { name: 'Scudo', rarity: null };
    }
    if (slot.kind === 'weapon' && (ch.weapon || {}).name) {
      return { name: ch.weapon.name, rarity: null };
    }

    return { name: '', rarity: null };
  }

  function renderPortrait(ch) {
    var wrap = document.getElementById('equip-portrait');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    if (ch.portrait) {
      var img = document.createElement('img');
      img.className = 'equip-portrait-img';
      img.src = ch.portrait;
      img.alt = 'Ritratto di ' + (ch.name || 'personaggio');
      wrap.appendChild(img);
    } else {
      wrap.appendChild(el('span', 'equip-portrait-fallback', '✦'));
    }
  }

  /* ---------- sintonizzazione (redesign 3.8.1, riusa js/items.js) ---------- */

  // Stesso criterio di visibilità di buildAttuneCounter in Tesoreria: il
  // tetto di 3 è globale sul personaggio, non sugli 8 slot — compare se
  // ALMENO UN oggetto (equipaggiato o no) lo richiede.
  function renderAttuneCounter(ch) {
    var wrap = document.getElementById('equip-attune-counter-wrap');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    var anyAttunement = (ch.items || []).some(function (it) {
      return it.requiresAttunement;
    });
    if (!anyAttunement) {
      return;
    }
    var counter = el('div', 'attune-counter');
    counter.appendChild(el('span', 'attune-counter-label', '✦ Sintonizzazione'));
    var dots = el('span', 'attune-dots');
    dots.setAttribute('aria-hidden', 'true');
    var count = window.AppItems.attunedCount(ch);
    for (var i = 0; i < window.AppItems.MAX_ATTUNED; i++) {
      dots.appendChild(el('span', 'attune-dot' + (i < count ? ' filled' : '')));
    }
    counter.appendChild(dots);
    counter.appendChild(el('span', 'attune-counter-count', count + '/' + window.AppItems.MAX_ATTUNED));
    wrap.appendChild(counter);
  }

  // Righe [nome + slot] + pillola ✦ Sintonizzato/Sintonizza per ogni oggetto
  // EQUIPAGGIATO (in uno degli 8 slot) che richiede sintonizzazione — quelli
  // senza requiresAttunement sono già sempre attivi, non compaiono qui.
  function toggleAttunement(item, attuned) {
    commitState(function (character) {
      if (attuned) {
        (character.items || []).forEach(function (it) {
          if (it.id === item.id) {
            it.attuned = false;
          }
        });
      } else if (window.AppItems.canAttune(window.AppStorage.getState().character, item)) {
        (character.items || []).forEach(function (it) {
          if (it.id === item.id) {
            it.attuned = true;
          }
        });
      }
    });
  }

  function buildAttunedRow(ch, slot, item) {
    var row = el('div', 'equip-attune-row');
    var body = el('div', 'equip-attune-row-body');
    body.appendChild(el('span', 'equip-attune-row-name', item.name));
    body.appendChild(el('span', 'equip-attune-row-slot', slot.label));
    row.appendChild(body);

    var attuned = !!item.attuned;
    var pill = el('button', 'equip-attune-pill' + (attuned ? ' on' : ''),
      attuned ? '✦ Sintonizzato' : '✦ Sintonizza');
    pill.type = 'button';
    if (!attuned && !window.AppItems.canAttune(ch, item)) {
      pill.title = 'Slot pieni';
    }
    pill.addEventListener('click', function () {
      toggleAttunement(item, attuned);
    });
    row.appendChild(pill);

    return row;
  }

  function renderAttunedList(ch) {
    var card = document.getElementById('equip-attuned-card');
    var list = document.getElementById('equip-attuned-list');
    if (!card || !list) {
      return;
    }
    list.innerHTML = '';
    var rows = [];
    SLOTS.forEach(function (slot) {
      var item = equippedItemOfKindRaw(ch, slot.kind);
      if (item && item.requiresAttunement) {
        rows.push({ slot: slot, item: item });
      }
    });
    card.classList.toggle('hidden', rows.length === 0);
    rows.forEach(function (r) {
      list.appendChild(buildAttunedRow(ch, r.slot, r.item));
    });
  }

  function render() {
    var grid = document.getElementById('equip-grid');
    if (!grid) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    renderPortrait(ch);
    renderAttuneCounter(ch);

    grid.innerHTML = '';
    SLOTS.forEach(function (slot) {
      var info = slotDisplay(slot, ch);
      var card = el('button', 'equip-slot-card' + (info.rarity ? ' rarity-' + info.rarity : ''));
      card.type = 'button';
      card.setAttribute('aria-label', slot.label + ': ' + (info.name || 'Vuoto'));

      var icon = el('span', 'equip-slot-icon');
      icon.innerHTML = slotIconSvg(slot.kind);
      card.appendChild(icon);

      var body = el('span', 'equip-slot-body');
      body.appendChild(el('span', 'equip-slot-label', slot.label));
      body.appendChild(info.name
        ? el('span', 'equip-slot-name', info.name)
        : el('span', 'equip-slot-name equip-slot-empty', 'Vuoto'));
      card.appendChild(body);

      card.addEventListener('click', function () {
        openSlotSheet(slot);
      });
      grid.appendChild(card);
    });

    renderAttunedList(ch);
  }

  function init() {
    overlay = document.getElementById('equip-sheet-overlay');
    titleEl = document.getElementById('equip-sheet-title');
    bodyEl = document.getElementById('equip-sheet-body');
    if (!overlay || !titleEl || !bodyEl) {
      return;
    }
    var closeBtn = document.getElementById('equip-sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    // tap fuori dal foglio: chiude senza applicare nulla (la selezione è già
    // stata applicata al tap sull'opzione, qui non c'è un draft da scartare)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    render();
  }

  window.AppEquip = {
    init: init,
    render: render
  };
})();
