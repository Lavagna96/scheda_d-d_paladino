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
  var ARMOR_OPTIONS = [
    { id: '', label: 'Nessuna armatura' },
    { id: 'cuoio-borchiato', label: 'Cuoio Borchiato' },
    { id: 'mezza-piastra', label: 'Mezza Piastra' },
    { id: 'cotta-maglia', label: 'Cotta di Maglia' },
    { id: 'piastre', label: 'Piastre' }
  ];
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
    var draft = {
      armorId: (ch.armor && ch.armor.id) || '',
      shield: !!(ch.armor && ch.armor.shield),
      weaponName: (ch.weapon && ch.weapon.name) || '',
      weaponDie: (ch.weapon && ch.weapon.die) || '1d8',
      weaponType: (ch.weapon && ch.weapon.type) || '',
      weaponMastery: (ch.weapon && ch.weapon.mastery) || '',
      fightingStyle: ch.fightingStyle || 'nessuno'
    };

    openSheet('Modifica · Equipaggiamento');

    var armorSelect = buildSelect(ARMOR_OPTIONS, draft.armorId, 'edit-armor-select');
    armorSelect.addEventListener('change', function () {
      draft.armorId = armorSelect.value;
    });
    bodyEl.appendChild(buildField('Armatura', armorSelect, 'edit-armor-select'));

    var shieldField = el('div', 'edit-field');
    shieldField.appendChild(el('span', 'edit-label', 'Scudo'));
    var shieldChip = el('button', 'chip', 'Scudo equipaggiato');
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

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = draft.weaponName;
    nameInput.addEventListener('input', function () {
      draft.weaponName = nameInput.value;
    });
    bodyEl.appendChild(buildField('Nome arma', nameInput, 'edit-weapon-name'));

    var dieOptions = WEAPON_DICE.map(function (d) { return { id: d, label: d }; });
    var dieSelect = buildSelect(dieOptions, draft.weaponDie, 'edit-weapon-die');
    dieSelect.addEventListener('change', function () {
      draft.weaponDie = dieSelect.value;
    });
    bodyEl.appendChild(buildField('Dado danni', dieSelect, 'edit-weapon-die'));

    var typeInput = document.createElement('input');
    typeInput.type = 'text';
    typeInput.className = 'edit-input';
    typeInput.value = draft.weaponType;
    typeInput.addEventListener('input', function () {
      draft.weaponType = typeInput.value;
    });
    bodyEl.appendChild(buildField('Tipo di danno', typeInput, 'edit-weapon-type'));

    var masteryInput = document.createElement('input');
    masteryInput.type = 'text';
    masteryInput.className = 'edit-input';
    masteryInput.value = draft.weaponMastery;
    masteryInput.addEventListener('input', function () {
      draft.weaponMastery = masteryInput.value;
    });
    bodyEl.appendChild(buildField('Maestria', masteryInput, 'edit-weapon-mastery'));

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
        character.weapon.name = draft.weaponName;
        character.weapon.die = draft.weaponDie;
        character.weapon.type = draft.weaponType;
        character.weapon.mastery = draft.weaponMastery;
        character.fightingStyle = draft.fightingStyle;
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
