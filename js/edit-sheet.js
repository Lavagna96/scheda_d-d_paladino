(function () {
  /*
   * Editing dei fatti base della scheda (Fase 3): bottom sheet dedicati per
   * caratteristiche, competenze ed equipaggiamento. Livello e classe NON
   * sono editabili qui (arrivano con la Fase 4 - Level Up).
   *
   * Le modifiche vivono su una copia locale (draft) finché non si preme
   * "Salva": chiudere con ✕ o toccando fuori dal foglio non scrive nulla
   * nello stato, quindi le modifiche non salvate si scartano da sole.
   *
   * Riusa il markup/CSS del bottom sheet di sola lettura (css/bottom-sheet.css)
   * ma con un overlay gemello (#edit-sheet-overlay) tutto suo: quello di
   * js/bottom-sheet.js chiude semplicemente nascondendo l'overlay, qui invece
   * serve anche scartare il draft — più pulito avere due overlay indipendenti
   * che condividono le stesse classi CSS piuttosto che far convivere le due
   * logiche in un solo overlay.
   */

  var ABILITY_ORDER = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
  var ABILITY_LABELS = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };
  var WEAPON_DICE = ['1d4', '1d6', '1d8', '1d10', '1d12', '2d6'];

  /* Armature e armi vengono dal manuale (5.B.5): prima erano quattro nomi
     scritti qui e tre campi di testo liberi per l'arma. Qui è dove si
     personalizza — il master che ti fa partire con qualcosa in più, o la spada
     magica trovata in giro — quindi resta l'opzione "Personalizzata", che è
     l'unico modo per avere un'arma fuori catalogo (es. la Spada lunga ✦ di
     Tharion, che è magica e ha un nome suo). */
  var CUSTOM_WEAPON = '__custom__';

  // Allineamento e Lingue Standard: stesse costanti del passo Identità della
  // creazione personaggio (js/create.js), duplicate qui perché non esportate
  // (moduli indipendenti, come da convenzione del progetto).
  var ALIGNMENT_LAW = ['Legale', 'Neutrale', 'Caotico'];
  var ALIGNMENT_MORALITY = ['Buono', 'Neutrale', 'Malvagio'];
  var STANDARD_LANGUAGES = [
    { id: 'lingua-segni', name: 'Lingua dei Segni Comune' },
    { id: 'draconico', name: 'Draconico' },
    { id: 'nanico', name: 'Nanico' },
    { id: 'elfico', name: 'Elfico' },
    { id: 'gigante', name: 'Gigante' },
    { id: 'gnomesco', name: 'Gnomesco' },
    { id: 'goblin', name: 'Goblin' },
    { id: 'halfling', name: 'Halfling' },
    { id: 'orchesco', name: 'Orchesco' }
  ];

  function armorOptions() {
    var opts = [{ id: '', label: 'Nessuna armatura' }];
    (window.MANUAL_55.armors || []).forEach(function (a) {
      opts.push({ id: a.id, label: window.AppEngine.armorLabel(a.id) });
    });

    return opts;
  }

  function weaponOptions() {
    var opts = (window.MANUAL_55.weapons || []).map(function (w) {
      return { id: w.id, label: w.name + ' — ' + w.die + ' ' + w.dmg + ' · ' + w.mastery };
    });
    opts.push({ id: CUSTOM_WEAPON, label: 'Personalizzata…' });

    return opts;
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

  // Quante maestrie ha il personaggio al suo livello, dai dati di classe
  // (Paladino 2 fisse, Barbaro e Guerriero crescono). 0 = la classe non ha
  // Maestria nelle Armi e i selettori non compaiono.
  function masteryCountFor(ch) {
    var klass = ((window.MANUAL_55.classes || {})[ch.classId]) || {};

    return (klass.weaponMastery || [])[ch.level] || 0;
  }

  // Armi fra cui può scegliere: quelle in cui la classe è competente
  // ('gue-finesse' = solo le da guerra Accurate o Leggere, come il Ladro).
  function masteryChoices(ch) {
    var klass = ((window.MANUAL_55.classes || {})[ch.classId]) || {};
    var prof = klass.weaponProf || ['sem', 'gue'];

    return (window.MANUAL_55.weapons || []).filter(function (w) {
      var cat = w.cat.split('-')[0];
      if (prof.indexOf(cat) !== -1) {
        return true;
      }
      if (cat === 'gue' && prof.indexOf('gue-finesse') !== -1) {
        return (w.props || []).indexOf('Accurata') !== -1 || (w.props || []).indexOf('Leggera') !== -1;
      }

      return false;
    });
  }

  function weaponByName(name) {
    var found = null;
    (window.MANUAL_55.weapons || []).forEach(function (w) {
      if (w.name === name) {
        found = w;
      }
    });

    return found;
  }
  var FIGHTING_STYLES = [
    { id: 'nessuno', label: 'Nessuno' },
    { id: 'duello', label: 'Duello (+2 danni, arma a una mano)' },
    { id: 'difesa', label: 'Difesa (+1 CA, con armatura)' }
  ];

  var overlay, titleEl, bodyEl;

  /* ---------- helper DOM ---------- */

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

  function buildSelect(options, selectedValue, id) {
    var select = document.createElement('select');
    select.className = 'edit-select';
    if (id) {
      select.id = id;
    }
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

  /* ---------- apertura / chiusura ---------- */

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = ''; // scarta qualunque draft non salvato
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

  /* ---------- applica il draft allo stato + rerender ---------- */

  function commit(mutate) {
    var state = window.AppStorage.getState();
    mutate(state.character);
    window.AppStorage.saveState(state, true); // persiste subito + sync cloud (meccanismo esistente)
    if (window.AppStats && window.AppStats.render) {
      window.AppStats.render();
    }
    if (window.AppTraits && window.AppTraits.render) {
      window.AppTraits.render(); // Aura di Protezione/Arma Sacra dipendono da CAR/armatura/stile
    }
    if (window.AppSheet && window.AppSheet.render) {
      window.AppSheet.render();
    }
    if (window.AppHeader && window.AppHeader.render) {
      window.AppHeader.render();
    }
  }

  /* ---------- Sheet A: Caratteristiche + competenze ai Tiri Salvezza ---------- */

  function buildAbilitySheet() {
    var ch = window.AppStorage.getState().character;
    var draft = {
      abilities: Object.assign({}, ch.abilities),
      profSaves: (ch.profSaves || []).slice()
    };

    openSheet('Modifica · Caratteristiche');

    var list = el('div', 'edit-stat-list');

    ABILITY_ORDER.forEach(function (key) {
      var row = el('div', 'edit-stat-row');
      row.setAttribute('data-key', key);
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[key]));

      var stepper = el('div', 'edit-stepper');
      var minus = el('button', 'stepper-btn minus', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[key]);
      var vals = el('div', 'edit-stat-vals');
      var scoreEl = el('span', 'edit-stat-score', String(draft.abilities[key]));
      var modEl = el('span', 'edit-stat-mod',
        window.AppEngine.formatMod(window.AppEngine.abilityMod(draft.abilities[key])));
      vals.appendChild(scoreEl);
      vals.appendChild(modEl);
      var plus = el('button', 'stepper-btn plus', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[key]);

      function refresh() {
        scoreEl.textContent = draft.abilities[key];
        modEl.textContent = window.AppEngine.formatMod(window.AppEngine.abilityMod(draft.abilities[key]));
      }

      minus.addEventListener('click', function () {
        draft.abilities[key] = Math.max(1, draft.abilities[key] - 1);
        refresh();
      });
      plus.addEventListener('click', function () {
        draft.abilities[key] = Math.min(30, draft.abilities[key] + 1);
        refresh();
      });

      stepper.appendChild(minus);
      stepper.appendChild(vals);
      stepper.appendChild(plus);
      row.appendChild(stepper);
      list.appendChild(row);
    });
    bodyEl.appendChild(list);

    bodyEl.appendChild(el('div', 'edit-section-label', 'Competenze ai Tiri Salvezza'));
    var chipRow = el('div', 'chip-row');
    ABILITY_ORDER.forEach(function (key) {
      var chip = el('button', 'chip', ABILITY_LABELS[key]);
      chip.type = 'button';
      if (draft.profSaves.indexOf(key) !== -1) {
        chip.classList.add('on');
      }
      chip.addEventListener('click', function () {
        var idx = draft.profSaves.indexOf(key);
        if (idx === -1) {
          draft.profSaves.push(key);
        } else {
          draft.profSaves.splice(idx, 1);
        }
        chip.classList.toggle('on');
      });
      chipRow.appendChild(chip);
    });
    bodyEl.appendChild(chipRow);

    addSaveButton(function () {
      commit(function (character) {
        character.abilities = draft.abilities;
        character.profSaves = draft.profSaves;
      });
    });
  }

  /* ---------- Sheet B: competenze alle Abilità ---------- */

  function buildSkillsSheet() {
    var ch = window.AppStorage.getState().character;
    var draft = { profSkills: (ch.profSkills || []).slice() };

    openSheet('Modifica · Abilità');

    var chipRow = el('div', 'chip-row');
    window.AppEngine.SKILLS.forEach(function (sk) {
      var abilShort = sk.abil.charAt(0) + sk.abil.slice(1).toLowerCase();
      var chip = el('button', 'chip', sk.label + ' (' + abilShort + ')');
      chip.type = 'button';
      if (draft.profSkills.indexOf(sk.id) !== -1) {
        chip.classList.add('on');
      }
      chip.addEventListener('click', function () {
        var idx = draft.profSkills.indexOf(sk.id);
        if (idx === -1) {
          draft.profSkills.push(sk.id);
        } else {
          draft.profSkills.splice(idx, 1);
        }
        chip.classList.toggle('on');
      });
      chipRow.appendChild(chip);
    });
    bodyEl.appendChild(chipRow);

    addSaveButton(function () {
      commit(function (character) {
        character.profSkills = draft.profSkills;
      });
    });
  }

  /* ---------- Sheet C: Equipaggiamento ---------- */

  function buildEquipSheet() {
    var ch = window.AppStorage.getState().character;
    // Se l'arma attuale ha lo stesso nome di una del catalogo si riapre già
    // selezionata; altrimenti (arma magica, nome personale) resta su
    // "Personalizzata…" coi suoi valori.
    var known = weaponByName((ch.weapon && ch.weapon.name) || '');
    var draft = {
      armorId: (ch.armor && ch.armor.id) || '',
      shield: !!(ch.armor && ch.armor.shield),
      weaponId: known ? known.id : CUSTOM_WEAPON,
      weaponName: (ch.weapon && ch.weapon.name) || '',
      weaponDie: (ch.weapon && ch.weapon.die) || '1d8',
      weaponType: (ch.weapon && ch.weapon.type) || '',
      weaponMastery: (ch.weapon && ch.weapon.mastery) || '',
      masteries: (ch.weaponMasteries || []).slice(),
      fightingStyle: ch.fightingStyle || 'nessuno'
    };

    openSheet('Modifica · Equipaggiamento');

    var armorSelect = buildSelect(armorOptions(), draft.armorId, 'edit-armor-select');
    armorSelect.addEventListener('change', function () {
      draft.armorId = armorSelect.value;
    });
    bodyEl.appendChild(buildField('Armatura', armorSelect, 'edit-armor-select'));

    var shieldField = el('div', 'edit-field');
    shieldField.appendChild(el('span', 'edit-label', 'Scudo'));
    var shieldAc = ((window.MANUAL_55 && window.MANUAL_55.shield) || {}).ac || 2;
    var shieldChip = el('button', 'chip', 'Scudo equipaggiato · CA +' + shieldAc);
    shieldChip.type = 'button';
    if (draft.shield) {
      shieldChip.classList.add('on');
    }
    shieldChip.addEventListener('click', function () {
      draft.shield = !draft.shield;
      shieldChip.classList.toggle('on');
    });
    shieldField.appendChild(shieldChip);
    bodyEl.appendChild(shieldField);

    /* Arma: dal catalogo del manuale (dado, tipo di danno e maestria arrivano
       da soli) oppure "Personalizzata…", che riapre i campi liberi per le armi
       magiche o inventate al tavolo. */
    var weaponSelect = buildSelect(weaponOptions(), draft.weaponId, 'edit-weapon-select');
    bodyEl.appendChild(buildField('Arma', weaponSelect, 'edit-weapon-select'));

    var customBox = el('div', 'edit-custom-weapon');
    bodyEl.appendChild(customBox);

    function renderWeaponFields() {
      customBox.textContent = '';
      if (draft.weaponId !== CUSTOM_WEAPON) {
        var w = weaponById(draft.weaponId);
        if (w) {
          customBox.appendChild(el('div', 'edit-hint',
            w.die + ' ' + w.dmg + ' · maestria ' + w.mastery +
            (w.props.length ? ' · ' + w.props.join(', ') : '')));
        }

        return;
      }

      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'edit-input';
      nameInput.value = draft.weaponName;
      nameInput.addEventListener('input', function () {
        draft.weaponName = nameInput.value;
      });
      customBox.appendChild(buildField('Nome arma', nameInput, 'edit-weapon-name'));

      var dieOptions = WEAPON_DICE.map(function (d) { return { id: d, label: d }; });
      var dieSelect = buildSelect(dieOptions, draft.weaponDie, 'edit-weapon-die');
      dieSelect.addEventListener('change', function () {
        draft.weaponDie = dieSelect.value;
      });
      customBox.appendChild(buildField('Dado danni', dieSelect, 'edit-weapon-die'));

      var typeInput = document.createElement('input');
      typeInput.type = 'text';
      typeInput.className = 'edit-input';
      typeInput.value = draft.weaponType;
      typeInput.addEventListener('input', function () {
        draft.weaponType = typeInput.value;
      });
      customBox.appendChild(buildField('Tipo di danno', typeInput, 'edit-weapon-type'));

      var masteryInput = document.createElement('input');
      masteryInput.type = 'text';
      masteryInput.className = 'edit-input';
      masteryInput.value = draft.weaponMastery;
      masteryInput.addEventListener('input', function () {
        draft.weaponMastery = masteryInput.value;
      });
      customBox.appendChild(buildField('Maestria', masteryInput, 'edit-weapon-mastery'));
    }

    weaponSelect.addEventListener('change', function () {
      draft.weaponId = weaponSelect.value;
      renderWeaponFields();
    });
    renderWeaponFields();

    /* Maestria nelle armi: quante ne ha il personaggio lo dicono i dati di
       classe al suo livello. Il wizard le fa scegliere alla creazione, ma i
       personaggi nati prima (Tharion) non ne hanno nessuna registrata: qui si
       possono assegnare, e cambiare a ogni riposo lungo come dice il manuale. */
    var masterySelects = [];
    var masteryCount = masteryCountFor(ch);
    if (masteryCount > 0) {
      var choices = masteryChoices(ch);
      var opts = [{ id: '', label: '— nessuna —' }].concat(choices.map(function (w) {
        return { id: w.id, label: w.name + ' · ' + w.mastery };
      }));
      for (var i = 0; i < masteryCount; i++) {
        var sel = buildSelect(opts, draft.masteries[i] || '', 'edit-mastery-' + i);
        masterySelects.push(sel);
        bodyEl.appendChild(buildField('Maestria ' + (i + 1), sel, 'edit-mastery-' + i));
      }
    }

    var styleSelect = buildSelect(FIGHTING_STYLES, draft.fightingStyle, 'edit-fighting-style');
    styleSelect.addEventListener('change', function () {
      draft.fightingStyle = styleSelect.value;
    });
    bodyEl.appendChild(buildField('Stile di combattimento', styleSelect, 'edit-fighting-style'));

    addSaveButton(function () {
      commit(function (character) {
        character.armor = character.armor || {};
        if (draft.armorId) {
          character.armor.id = draft.armorId;
        } else {
          delete character.armor.id;
        }
        character.armor.shield = draft.shield;
        character.weapon = character.weapon || {};
        var picked = draft.weaponId !== CUSTOM_WEAPON ? weaponById(draft.weaponId) : null;
        if (picked) {
          character.weapon.name = picked.name;
          character.weapon.die = picked.die;
          character.weapon.type = picked.dmg;
          character.weapon.mastery = picked.mastery;
          // Abilità d'attacco (Blocco 5.A.3, letta da js/engine.js): Accurata
          // → agile (finesse), 'dist' nella categoria → a distanza. Presa dal
          // catalogo, non più persa quando si sceglie un'arma dal menu.
          // 'A due mani' esclude lo Stile Duellante (serve un'arma a una mano).
          character.weapon.finesse = (picked.props || []).indexOf('Accurata') !== -1;
          character.weapon.ranged = picked.cat.indexOf('dist') !== -1;
          character.weapon.twoHanded = (picked.props || []).indexOf('A due mani') !== -1;
        } else {
          character.weapon.name = draft.weaponName;
          character.weapon.die = draft.weaponDie;
          character.weapon.type = draft.weaponType;
          character.weapon.mastery = draft.weaponMastery;
          // Arma personalizzata: nessun dato di catalogo da cui derivarli,
          // restano quelli già impostati (es. una magica basata su un'arma
          // agile non deve perdere il flag risalvando).
        }
        // Maestrie: gli id scelti nei selettori, senza vuoti né doppioni.
        var chosen = [];
        masterySelects.forEach(function (sel) {
          if (sel.value && chosen.indexOf(sel.value) === -1) {
            chosen.push(sel.value);
          }
        });
        character.weaponMasteries = chosen;
        character.fightingStyle = draft.fightingStyle;
      });
    });
  }

  /* ---------- Sheet D: Identità (Allineamento e Lingue) ---------- */

  // Combinazione legge/morale -> stringa, con "Neutrale Puro" per il caso
  // Neutrale/Neutrale: stessa logica di js/create.js (computeAlignment).
  function parseAlignment(value) {
    if (value === 'Neutrale Puro') {
      return { law: 'Neutrale', morality: 'Neutrale' };
    }
    var parts = (value || '').split(' ');
    if (parts.length === 2 && ALIGNMENT_LAW.indexOf(parts[0]) !== -1 && ALIGNMENT_MORALITY.indexOf(parts[1]) !== -1) {
      return { law: parts[0], morality: parts[1] };
    }

    return { law: null, morality: null };
  }

  function combineAlignment(law, morality) {
    if (!law || !morality) {
      return '';
    }
    if (law === 'Neutrale' && morality === 'Neutrale') {
      return 'Neutrale Puro';
    }

    return law + ' ' + morality;
  }

  // Stesso controllo a 3 stati con trascinamento della creazione personaggio
  // (js/create.js, buildSegmentedRow), qui scritto su un draft locale invece
  // che sul draft di creazione: si applica allo stato solo al Salva.
  function buildSegmentedRow(container, title, options, current, onPick) {
    container.appendChild(el('div', 'create-label', title));

    var track = el('div', 'seg-track');
    var highlight = el('div', 'seg-highlight');
    track.appendChild(highlight);
    var optEls = options.map(function (label) {
      var opt = el('div', 'seg-opt', label);
      track.appendChild(opt);

      return opt;
    });
    container.appendChild(track);

    var index = options.indexOf(current); // -1 se non ancora scelto

    function snapTo(i) {
      highlight.style.left = optEls[i].offsetLeft + 'px';
      highlight.style.width = optEls[i].offsetWidth + 'px';
    }

    function applyIndex(i) {
      if (i === index) {
        return;
      }
      index = i;
      optEls.forEach(function (o, j) { o.classList.toggle('on', j === i); });
      onPick(options[i]);
    }

    function indexFromClientX(clientX) {
      var rect = track.getBoundingClientRect();
      var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

      return Math.min(options.length - 1, Math.floor(ratio * options.length));
    }

    function followClientX(clientX) {
      var rect = track.getBoundingClientRect();
      var w = optEls[0].offsetWidth;
      var half = w / 2;
      var x = Math.min(rect.width - half, Math.max(half, clientX - rect.left));
      highlight.style.width = w + 'px';
      highlight.style.left = (x - half) + 'px';
    }

    track.addEventListener('pointerdown', function (e) {
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignorato di proposito, vedi create.js buildSegmentedRow
      }
      applyIndex(indexFromClientX(e.clientX));
      followClientX(e.clientX);

      function move(ev) {
        applyIndex(indexFromClientX(ev.clientX));
        followClientX(ev.clientX);
      }
      function up(ev) {
        applyIndex(indexFromClientX(ev.clientX));
        snapTo(index);
        track.removeEventListener('pointermove', move);
        track.removeEventListener('pointerup', up);
      }
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', up);
    });

    if (index !== -1) {
      optEls[index].classList.add('on');
      snapTo(index);
    }
  }

  // Picker Lingue Standard a cap 2, stesso stile a chip disabilitati oltre il
  // limite della creazione (js/create.js, buildSpellPicker ramo non-incantesimi).
  function buildLanguagePicker(container, draft) {
    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);
    var chipRow = el('div', 'chip-row');
    container.appendChild(chipRow);
    var chipEls = {};

    function refresh() {
      counterEl.textContent = draft.languages.length + ' / 2';
      STANDARD_LANGUAGES.forEach(function (l) {
        var isOn = draft.languages.indexOf(l.id) !== -1;
        var disable = draft.languages.length >= 2 && !isOn;
        chipEls[l.id].classList.toggle('on', isOn);
        chipEls[l.id].disabled = disable;
        chipEls[l.id].classList.toggle('is-disabled', disable);
      });
    }

    STANDARD_LANGUAGES.forEach(function (l) {
      var chip = el('button', 'chip', l.name);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        var idx = draft.languages.indexOf(l.id);
        if (idx !== -1) {
          draft.languages.splice(idx, 1);
        } else if (draft.languages.length < 2) {
          draft.languages.push(l.id);
        }
        refresh();
      });
      chipEls[l.id] = chip;
      chipRow.appendChild(chip);
    });
    refresh();
  }

  function buildIdentitySheet() {
    var ch = window.AppStorage.getState().character;
    var parsedAlign = parseAlignment(ch.alignment);
    var existingLangNames = ch.languages || [];
    var draft = {
      alignmentLaw: parsedAlign.law,
      alignmentMorality: parsedAlign.morality,
      languages: STANDARD_LANGUAGES.filter(function (l) {
        return existingLangNames.indexOf(l.name) !== -1;
      }).map(function (l) { return l.id; })
    };

    openSheet('Modifica · Identità');

    bodyEl.appendChild(el('div', 'edit-section-label', 'Allineamento'));
    var recap = el('div', 'create-saves-line', '');

    function refreshRecap() {
      var val = combineAlignment(draft.alignmentLaw, draft.alignmentMorality);
      recap.textContent = val ? ('Allineamento: ' + val) : 'Scegli legge e morale.';
    }

    buildSegmentedRow(bodyEl, 'Legge', ALIGNMENT_LAW, draft.alignmentLaw, function (v) {
      draft.alignmentLaw = v;
      refreshRecap();
    });
    buildSegmentedRow(bodyEl, 'Morale', ALIGNMENT_MORALITY, draft.alignmentMorality, function (v) {
      draft.alignmentMorality = v;
      refreshRecap();
    });
    bodyEl.appendChild(recap);
    refreshRecap();

    bodyEl.appendChild(el('div', 'edit-section-label', 'Lingue'));
    bodyEl.appendChild(el('span', 'chip on', 'Comune ✓'));
    buildLanguagePicker(bodyEl, draft);

    addSaveButton(function () {
      commit(function (character) {
        var combined = combineAlignment(draft.alignmentLaw, draft.alignmentMorality);
        if (combined) {
          character.alignment = combined;
        }
        character.languages = ['Comune'].concat(draft.languages.map(function (id) {
          var l = STANDARD_LANGUAGES.filter(function (x) { return x.id === id; })[0];

          return l ? l.name : id;
        }));
      });
    });
  }

  /* ---------- bind ---------- */

  function bindTriggers() {
    var abilBtn = document.getElementById('edit-abilita-btn');
    if (abilBtn) {
      abilBtn.addEventListener('click', buildAbilitySheet);
    }
    var skillsBtn = document.getElementById('edit-skills-btn');
    if (skillsBtn) {
      skillsBtn.addEventListener('click', buildSkillsSheet);
    }
    var equipBtn = document.getElementById('edit-equip-btn');
    if (equipBtn) {
      equipBtn.addEventListener('click', buildEquipSheet);
    }
    var identityBtn = document.getElementById('edit-identity-btn');
    if (identityBtn) {
      identityBtn.addEventListener('click', buildIdentitySheet);
    }
  }

  function init() {
    overlay = document.getElementById('edit-sheet-overlay');
    titleEl = document.getElementById('edit-sheet-title');
    bodyEl = document.getElementById('edit-sheet-body');
    if (!overlay || !titleEl || !bodyEl) {
      return;
    }
    var closeBtn = document.getElementById('edit-sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    // tap fuori dal foglio: chiude e scarta (nessuno stato è stato scritto)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    bindTriggers();
  }

  window.AppEditSheet = {
    init: init
  };
})();
