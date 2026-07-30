(function () {
  /*
   * Wizard "Sali di Livello" (Step 4.7/4.8). Un solo bottom sheet a sezioni:
   * 1) guadagni automatici (ricalcolati dal vivo con AppEngine.derive su una
   *    copia di bozza del personaggio, mai sullo stato reale), 2) la scelta
   *    del livello se richiesta (ASI-o-Talento, stile di combattimento,
   *    sottoclasse/dono epico auto-selezionati quando c'è una sola opzione),
   *    3) bottone di conferma. Stesso pattern "overlay gemello" di
   *    js/edit-sheet.js e js/items.js: bozza locale finché non si preme
   *    "Conferma", chiudere con ✕/tap-fuori scarta tutto.
   */

  var ABILITY_ORDER = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
  var ABILITY_LABELS = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };
  var ASI_BUDGET = 2;
  var MAX_SCORE = 20;
  var FIGHTING_STYLES = [
    { id: 'nessuno', label: 'Nessuno' },
    { id: 'duello', label: 'Duello (+2 danni, arma a una mano)' },
    { id: 'difesa', label: 'Difesa (+1 CA, con armatura)' }
  ];

  var overlay, titleEl, bodyEl;

  /* ---------- helper generici (stessi di js/edit-sheet.js/js/items.js) ---------- */

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

  function truncate(str, max) {
    if (str && str.length > max) {
      return str.slice(0, max - 1) + '…';
    }

    return str || '';
  }

  /* ---------- apertura / chiusura ---------- */

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = ''; // scarta qualunque bozza non salvata
  }

  /* ---------- visibilità del bottone in header ---------- */

  function render() {
    var btn = document.getElementById('levelup-btn');
    if (!btn) {
      return;
    }
    var character = window.AppStorage.getState().character;
    btn.classList.toggle('hidden', character.level >= 20);
  }

  /* ---------- wizard ---------- */

  function openWizard() {
    var character = window.AppStorage.getState().character;
    var level = character.level;
    if (level >= 20) {
      return;
    }
    var nextLevel = level + 1;
    var manual = window.MANUAL_55 || { classes: {}, species: {}, feats: {} };
    var klass = manual.classes[character.classId] || {};
    var cp = klass.choicePoints || {};

    var needsAsi = (cp.asi || []).indexOf(nextLevel) !== -1;
    var needsStyle = cp.fightingStyle === nextLevel;
    var needsSubclass = cp.subclass === nextLevel;
    var needsEpicBoon = cp.epicBoon === nextLevel;
    // Competenza: quante in più a questo livello (non sempre 2 — il Ranger
    // ne dà 1 sola al 2° con Esploratore Provetto, 2 al 9° con Competenza).
    var expertiseEntry = null;
    (cp.expertise || []).forEach(function (e) { if (e.level === nextLevel) { expertiseEntry = e; } });
    var needsExpertise = !!expertiseEntry;
    var expertiseCount = expertiseEntry ? expertiseEntry.count : 0;

    // Metamagia (Stregone): stessa forma {level,count} di Competenza — quante
    // opzioni nuove a questo livello (2 al 2°, 2 al 10°, 2 al 17°).
    var metamagicEntry = null;
    (cp.metamagic || []).forEach(function (e) { if (e.level === nextLevel) { metamagicEntry = e; } });
    var needsMetamagic = !!metamagicEntry;
    var metamagicCount = metamagicEntry ? metamagicEntry.count : 0;

    // Invocazioni Occulte (Warlock): stessa forma {level,count}. Il livello 1
    // è gestito dal wizard di creazione (create.js), non arriva mai qui —
    // il level-up parte sempre da nextLevel >= 2.
    var invocationEntry = null;
    (cp.invocations || []).forEach(function (e) { if (e.level === nextLevel) { invocationEntry = e; } });
    var needsInvocation = !!invocationEntry;
    var invocationCount = invocationEntry ? invocationEntry.count : 0;

    /* bozza di scelte correnti (non ancora applicata allo stato) */
    var choice = {
      mode: null, // 'asi' | 'feat'
      pendingDeltas: { FOR: 0, DES: 0, COS: 0, INT: 0, SAG: 0, CAR: 0 },
      featId: null,
      styleId: character.fightingStyle || 'nessuno',
      expertiseIds: [],
      metamagicIds: [],
      invocationIds: []
    };
    var autoSubclassId = null;
    var autoEpicBoonId = null;
    choice.subclassId = null; // scelta vera quando la classe ha >1 sottoclasse

    var gainsContainer = null;
    var confirmBtn = null;

    /* ---------- bozza del personaggio con le scelte correnti applicate ---------- */

    function computeDraft() {
      var draft = JSON.parse(JSON.stringify(character));
      draft.level = nextLevel;
      if (choice.mode === 'asi') {
        ABILITY_ORDER.forEach(function (k) {
          draft.abilities[k] = character.abilities[k] + choice.pendingDeltas[k];
        });
      }
      if (needsStyle && choice.styleId) {
        draft.fightingStyle = choice.styleId;
      }

      return draft;
    }

    function budgetUsed() {
      var total = 0;
      ABILITY_ORDER.forEach(function (k) { total += choice.pendingDeltas[k]; });

      return total;
    }

    /* ---------- guadagni automatici ---------- */

    function findResourceMax(resources, key) {
      var found = 0;
      (resources || []).forEach(function (r) {
        if (r.key === key) {
          found = r.max;
        }
      });

      return found;
    }

    function collectNewPrivileges() {
      var names = [];
      ((klass.levelFeatures && klass.levelFeatures[nextLevel]) || []).forEach(function (f) {
        if (f.trait !== false) {
          names.push(f.name);
        }
      });
      if (character.subclassId && klass.subclasses && klass.subclasses[character.subclassId]) {
        var sub = klass.subclasses[character.subclassId];
        ((sub.features && sub.features[nextLevel]) || []).forEach(function (f) {
          names.push(f.name);
        });
      }
      var species = manual.species[character.speciesId];
      if (species && species.traits) {
        species.traits.forEach(function (t) {
          if (t.minLevel === nextLevel) {
            names.push(t.name);
          }
        });
      }

      return names;
    }

    function buildGainRow(label, before, after) {
      var row = el('div', 'levelup-gain-row');
      row.appendChild(el('span', 'levelup-gain-label', label));
      var val = el('span', 'levelup-gain-value');
      val.appendChild(el('span', 'levelup-gain-before', String(before)));
      val.appendChild(el('span', 'levelup-gain-arrow', ' → '));
      val.appendChild(el('span', 'levelup-gain-after', String(after)));
      row.appendChild(val);

      return row;
    }

    function renderGains() {
      if (!gainsContainer) {
        return;
      }
      gainsContainer.innerHTML = '';
      var draft = computeDraft();
      var viewBefore = window.AppEngine.derive(character);
      var viewAfter = window.AppEngine.derive(draft);
      var rows = 0;

      if (viewBefore.poolMax.hp !== viewAfter.poolMax.hp) {
        gainsContainer.appendChild(buildGainRow('Punti Ferita massimi', viewBefore.poolMax.hp, viewAfter.poolMax.hp));
        rows++;
      }
      var classRes = klass.classResources || {};
      /* Risorse di classe "a riserva" (es. Imposizione delle Mani) dai dati,
         stesso principio del loop "a usi" più sotto: nessun nome di classe
         cablato, vale per qualunque classe con kind:'pool'. */
      Object.keys(classRes).forEach(function (key) {
        if (classRes[key].kind !== 'pool') {
          return;
        }
        var pb = viewBefore.poolMax[key];
        var pa = viewAfter.poolMax[key];
        if (pb !== pa) {
          gainsContainer.appendChild(buildGainRow(classRes[key].name || key, pb, pa));
          rows++;
        }
      });
      var hitDie = klass.hitDie || '';
      gainsContainer.appendChild(buildGainRow('Dadi Ferita', level + hitDie, nextLevel + hitDie));
      rows++;

      var cdBefore = findResourceMax(viewBefore.resources, 'cd');
      var cdAfter = findResourceMax(viewAfter.resources, 'cd');
      if (cdBefore !== cdAfter) {
        gainsContainer.appendChild(buildGainRow('Incanalare Divinità', cdBefore, cdAfter));
        rows++;
      }

      /* Risorse di classe "a usi" dai dati (es. Furia del Barbaro): mostra i
         cambi di massimo, con il nome preso dal manuale (niente hardcoding). */
      Object.keys(classRes).forEach(function (key) {
        var def = classRes[key];
        if (def.kind !== 'uses') {
          return;
        }
        var rb = findResourceMax(viewBefore.resources, key);
        var ra = findResourceMax(viewAfter.resources, key);
        if (rb !== ra) {
          gainsContainer.appendChild(buildGainRow(def.name || key, rb, ra));
          rows++;
        }
      });

      var slotsBefore = (viewBefore.slots || []).join('/');
      var slotsAfter = (viewAfter.slots || []).join('/');
      if (slotsBefore !== slotsAfter) {
        gainsContainer.appendChild(buildGainRow('Slot Incantesimi', slotsBefore || '—', slotsAfter || '—'));
        rows++;
      }

      var prepBefore = (klass.preparedByLevel || [])[level];
      var prepAfter = (klass.preparedByLevel || [])[nextLevel];
      if (prepBefore !== prepAfter) {
        gainsContainer.appendChild(buildGainRow('Incantesimi Preparati', prepBefore, prepAfter));
        rows++;
      }

      if (rows === 0) {
        gainsContainer.appendChild(el('p', 'levelup-gain-row', 'Nessun guadagno numerico a questo livello.'));
      }

      var newPrivileges = collectNewPrivileges();
      if (newPrivileges.length) {
        gainsContainer.appendChild(el('p', 'levelup-new-feats', 'Nuovi privilegi: ' + newPrivileges.join(', ')));
      }
    }

    /* ---------- stato del bottone Conferma ---------- */

    function updateConfirmState() {
      if (!confirmBtn) {
        return;
      }
      var ok = true;
      if (needsAsi) {
        if (choice.mode === 'asi') {
          ok = budgetUsed() === ASI_BUDGET;
        } else if (choice.mode === 'feat') {
          ok = !!choice.featId;
        } else {
          ok = false;
        }
      }
      /* Sottoclasse: con una sola opzione è già assegnata (autoSubclassId);
         con più di una serve una scelta vera prima di poter confermare. */
      if (needsSubclass && Object.keys(klass.subclasses || {}).length > 1 && !choice.subclassId) {
        ok = false;
      }
      if (needsExpertise && choice.expertiseIds.length !== expertiseCount) {
        ok = false;
      }
      if (needsMetamagic && choice.metamagicIds.length !== metamagicCount) {
        ok = false;
      }
      if (needsInvocation && choice.invocationIds.length !== invocationCount) {
        ok = false;
      }
      confirmBtn.disabled = !ok;
      confirmBtn.classList.toggle('is-disabled', !ok);
    }

    /* ---------- sezione ASI-o-Talento ---------- */

    function buildAsiSection() {
      var list = el('div', 'edit-stat-list');
      var scoreEls = {}, plusBtns = {}, minusBtns = {};
      var remainingEl = el('p', 'levelup-remaining');

      function refresh() {
        ABILITY_ORDER.forEach(function (k) {
          var delta = choice.pendingDeltas[k];
          var newScore = character.abilities[k] + delta;
          scoreEls[k].textContent = delta > 0
            ? character.abilities[k] + ' → ' + newScore
            : String(character.abilities[k]);
          var used = budgetUsed();
          var disablePlus = used >= ASI_BUDGET || delta >= 2 || newScore >= MAX_SCORE;
          plusBtns[k].disabled = disablePlus;
          plusBtns[k].classList.toggle('is-disabled', disablePlus);
          var disableMinus = delta <= 0;
          minusBtns[k].disabled = disableMinus;
          minusBtns[k].classList.toggle('is-disabled', disableMinus);
        });
        remainingEl.textContent = 'Punti da assegnare: ' + (ASI_BUDGET - budgetUsed()) + ' rimasti';
        renderGains();
        updateConfirmState();
      }

      ABILITY_ORDER.forEach(function (k) {
        var row = el('div', 'edit-stat-row');
        row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

        var stepper = el('div', 'edit-stepper');
        var minus = el('button', 'stepper-btn minus', '−');
        minus.type = 'button';
        minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[k]);
        var scoreEl = el('span', 'edit-stat-score', String(character.abilities[k]));
        var plus = el('button', 'stepper-btn plus', '+');
        plus.type = 'button';
        plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[k]);

        minus.addEventListener('click', function () {
          if (choice.pendingDeltas[k] > 0) {
            choice.pendingDeltas[k]--;
            refresh();
          }
        });
        plus.addEventListener('click', function () {
          var used = budgetUsed();
          var newScore = character.abilities[k] + choice.pendingDeltas[k] + 1;
          if (used < ASI_BUDGET && choice.pendingDeltas[k] < 2 && newScore <= MAX_SCORE) {
            choice.pendingDeltas[k]++;
            refresh();
          }
        });

        stepper.appendChild(minus);
        stepper.appendChild(scoreEl);
        stepper.appendChild(plus);
        row.appendChild(stepper);
        list.appendChild(row);

        scoreEls[k] = scoreEl;
        plusBtns[k] = plus;
        minusBtns[k] = minus;
      });

      var wrap = el('div');
      wrap.appendChild(list);
      wrap.appendChild(remainingEl);
      refresh();

      return wrap;
    }

    function buildFeatSection() {
      var wrap = el('div');
      var list = el('div', 'levelup-feat-list');
      var manualFeats = manual.feats || {};
      var rowEls = {};

      Object.keys(manualFeats).forEach(function (id) {
        var f = manualFeats[id];
        var row = el('div', 'levelup-feat-row');
        row.appendChild(el('div', 'levelup-feat-name', f.name));
        if (f.prereq) {
          row.appendChild(el('div', 'levelup-feat-prereq', f.prereq));
        }
        row.appendChild(el('div', 'levelup-feat-desc', truncate(f.desc, 100)));

        row.addEventListener('click', function () {
          choice.featId = id;
          Object.keys(rowEls).forEach(function (otherId) {
            rowEls[otherId].classList.toggle('on', otherId === id);
          });
          updateConfirmState();
        });

        rowEls[id] = row;
        list.appendChild(row);
      });

      wrap.appendChild(list);

      return wrap;
    }

    function buildChoiceToggle(asiSection, featSection) {
      var wrap = el('div', 'choice-toggle');
      var btnAsi = el('button', 'choice-toggle-btn', 'Aumento di Caratteristica');
      btnAsi.type = 'button';
      var btnFeat = el('button', 'choice-toggle-btn', 'Talento');
      btnFeat.type = 'button';

      function selectMode(mode) {
        choice.mode = mode;
        btnAsi.classList.toggle('on', mode === 'asi');
        btnFeat.classList.toggle('on', mode === 'feat');
        asiSection.classList.toggle('hidden', mode !== 'asi');
        featSection.classList.toggle('hidden', mode !== 'feat');
        renderGains();
        updateConfirmState();
      }

      btnAsi.addEventListener('click', function () { selectMode('asi'); });
      btnFeat.addEventListener('click', function () { selectMode('feat'); });

      wrap.appendChild(btnAsi);
      wrap.appendChild(btnFeat);

      return wrap;
    }

    /* ---------- sezione stile di combattimento (solo livello 2) ---------- */

    function buildStyleSection() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Stile di Combattimento'));
      var row = el('div', 'chip-row');
      var chipEls = {};

      FIGHTING_STYLES.forEach(function (opt) {
        var chip = el('button', 'chip' + (choice.styleId === opt.id ? ' on' : ''), opt.label);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          choice.styleId = opt.id;
          Object.keys(chipEls).forEach(function (id) {
            chipEls[id].classList.toggle('on', id === opt.id);
          });
          renderGains();
        });
        chipEls[opt.id] = chip;
        row.appendChild(chip);
      });

      wrap.appendChild(row);

      return wrap;
    }

    /* ---------- sezione Competenza (quante dipende da expertiseCount) ---------- */

    function buildExpertiseSection() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Competenza — scegline ' + expertiseCount));
      var already = character.expertiseSkills || [];
      var eligible = (character.profSkills || []).filter(function (id) {
        return already.indexOf(id) === -1;
      });
      var skillsById = {};
      window.AppEngine.SKILLS.forEach(function (s) { skillsById[s.id] = s; });
      var row = el('div', 'chip-row');
      var chipEls = {};

      eligible.forEach(function (id) {
        var chip = el('button', 'chip', (skillsById[id] || {}).label || id);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          var idx = choice.expertiseIds.indexOf(id);
          if (idx !== -1) {
            choice.expertiseIds.splice(idx, 1);
          } else if (choice.expertiseIds.length < expertiseCount) {
            choice.expertiseIds.push(id);
          }
          Object.keys(chipEls).forEach(function (chipId) {
            var isOn = choice.expertiseIds.indexOf(chipId) !== -1;
            chipEls[chipId].classList.toggle('on', isOn);
            var disable = choice.expertiseIds.length >= expertiseCount && !isOn;
            chipEls[chipId].disabled = disable;
            chipEls[chipId].classList.toggle('is-disabled', disable);
          });
          updateConfirmState();
        });
        chipEls[id] = chip;
        row.appendChild(chip);
      });
      wrap.appendChild(row);

      return wrap;
    }

    /* ---------- sezione Metamagia (Stregone; quante dipende da metamagicCount) ---------- */

    function buildMetamagicSection() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Metamagia — scegline ' + metamagicCount));
      var already = character.metamagicIds || [];
      var manualMetamagic = manual.metamagic || {};
      var eligible = Object.keys(manualMetamagic).filter(function (id) {
        return already.indexOf(id) === -1;
      });
      var list = el('div', 'levelup-feat-list');
      var rowEls = {};

      eligible.forEach(function (id) {
        var m = manualMetamagic[id];
        var row = el('div', 'levelup-feat-row');
        row.appendChild(el('div', 'levelup-feat-name', m.name));
        if (m.cost) {
          row.appendChild(el('div', 'levelup-feat-prereq', m.cost));
        }
        row.appendChild(el('div', 'levelup-feat-desc', truncate(m.desc, 100)));

        row.addEventListener('click', function () {
          var idx = choice.metamagicIds.indexOf(id);
          if (idx !== -1) {
            choice.metamagicIds.splice(idx, 1);
          } else if (choice.metamagicIds.length < metamagicCount) {
            choice.metamagicIds.push(id);
          }
          Object.keys(rowEls).forEach(function (rowId) {
            var isOn = choice.metamagicIds.indexOf(rowId) !== -1;
            rowEls[rowId].classList.toggle('on', isOn);
            var disable = choice.metamagicIds.length >= metamagicCount && !isOn;
            rowEls[rowId].classList.toggle('is-disabled', disable);
          });
          updateConfirmState();
        });

        rowEls[id] = row;
        list.appendChild(row);
      });
      wrap.appendChild(list);

      return wrap;
    }

    /* ---------- sezione Invocazioni Occulte (Warlock; quante dipende da invocationCount) ---------- */

    function buildInvocationSection() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Invocazioni Occulte — scegline ' + invocationCount));
      var already = character.invocationIds || [];
      var manualInvocations = manual.invocations || {};
      var eligible = Object.keys(manualInvocations).filter(function (id) {
        return already.indexOf(id) === -1;
      });
      var list = el('div', 'levelup-feat-list');
      var rowEls = {};

      eligible.forEach(function (id) {
        var inv = manualInvocations[id];
        var row = el('div', 'levelup-feat-row');
        row.appendChild(el('div', 'levelup-feat-name', inv.name));
        if (inv.prereq) {
          row.appendChild(el('div', 'levelup-feat-prereq', inv.prereq));
        }
        row.appendChild(el('div', 'levelup-feat-desc', truncate(inv.desc, 100)));

        row.addEventListener('click', function () {
          var idx = choice.invocationIds.indexOf(id);
          if (idx !== -1) {
            choice.invocationIds.splice(idx, 1);
          } else if (choice.invocationIds.length < invocationCount) {
            choice.invocationIds.push(id);
          }
          Object.keys(rowEls).forEach(function (rowId) {
            var isOn = choice.invocationIds.indexOf(rowId) !== -1;
            rowEls[rowId].classList.toggle('on', isOn);
            var disable = choice.invocationIds.length >= invocationCount && !isOn;
            rowEls[rowId].classList.toggle('is-disabled', disable);
          });
          updateConfirmState();
        });

        rowEls[id] = row;
        list.appendChild(row);
      });
      wrap.appendChild(list);

      return wrap;
    }

    /* ---------- righe di sola lettura (1 sola opzione disponibile oggi) ---------- */

    /* Con una sola sottoclasse la si assegna da sola (riga di sola lettura);
       con più di una serve una scelta vera — stesso pattern di
       buildFeatSection: righe cliccabili, tenets/giuramento come descrizione,
       stato "on" su quella scelta. */
    function buildSubclassSection() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Sottoclasse'));
      var ids = Object.keys(klass.subclasses || {});

      if (ids.length <= 1) {
        autoSubclassId = ids[0] || null;
        if (autoSubclassId) {
          var sub = klass.subclasses[autoSubclassId];
          wrap.appendChild(el('div', 'levelup-auto-row', 'Sottoclasse: ' + sub.name));
        }

        return wrap;
      }

      var list = el('div', 'levelup-feat-list');
      var rowEls = {};

      ids.forEach(function (id) {
        var s = klass.subclasses[id];
        var row = el('div', 'levelup-feat-row');
        row.appendChild(el('div', 'levelup-feat-name', s.name));
        if (s.tenets) {
          row.appendChild(el('div', 'levelup-feat-desc', s.tenets));
        }

        row.addEventListener('click', function () {
          choice.subclassId = id;
          Object.keys(rowEls).forEach(function (otherId) {
            rowEls[otherId].classList.toggle('on', otherId === id);
          });
          updateConfirmState();
        });

        rowEls[id] = row;
        list.appendChild(row);
      });

      wrap.appendChild(list);

      return wrap;
    }

    function buildEpicBoonAutoRow() {
      var wrap = el('div');
      wrap.appendChild(el('div', 'edit-section-label', 'Dono Epico'));
      var boonIds = [];
      var manualFeats = manual.feats || {};
      Object.keys(manualFeats).forEach(function (id) {
        if (manualFeats[id].category === 'dono-epico') {
          boonIds.push(id);
        }
      });
      if (boonIds.length === 1) {
        autoEpicBoonId = boonIds[0];
        wrap.appendChild(el('div', 'levelup-auto-row', 'Dono Epico: ' + manualFeats[autoEpicBoonId].name));
      } else {
        // Stessa nota di buildSubclassAutoRow: con più di 1 dono epico serve un picker.
        wrap.appendChild(el('div', 'levelup-auto-row', 'Più doni epici disponibili: scelta non ancora gestita qui.'));
      }

      return wrap;
    }

    /* ---------- applicazione (Conferma) ---------- */

    function onConfirm() {
      if (confirmBtn.disabled) {
        return;
      }
      var state = window.AppStorage.getState();
      var ch = state.character;

      var viewBefore = window.AppEngine.derive(ch);
      var finalDraft = computeDraft();
      var viewAfter = window.AppEngine.derive(finalDraft);

      ch.level = nextLevel;
      ch.levelChoices = ch.levelChoices || {};
      var key = String(nextLevel);

      if (needsAsi && choice.mode === 'asi') {
        var appliedDeltas = {};
        ABILITY_ORDER.forEach(function (k) {
          if (choice.pendingDeltas[k] > 0) {
            ch.abilities[k] += choice.pendingDeltas[k];
            appliedDeltas[k] = choice.pendingDeltas[k];
          }
        });
        ch.levelChoices[key] = { type: 'asi', abilityDeltas: appliedDeltas };
      } else if (needsAsi && choice.mode === 'feat') {
        ch.feats = ch.feats || [];
        ch.feats.push({ id: choice.featId, level: nextLevel });
        ch.levelChoices[key] = { type: 'feat', featId: choice.featId };
      }

      if (needsStyle) {
        ch.fightingStyle = choice.styleId;
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].fightingStyle = choice.styleId;
      }

      if (needsExpertise) {
        ch.expertiseSkills = (ch.expertiseSkills || []).concat(choice.expertiseIds);
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].expertiseSkills = choice.expertiseIds.slice();
      }

      if (needsMetamagic) {
        ch.metamagicIds = (ch.metamagicIds || []).concat(choice.metamagicIds);
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].metamagicIds = choice.metamagicIds.slice();
      }

      if (needsInvocation) {
        ch.invocationIds = (ch.invocationIds || []).concat(choice.invocationIds);
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].invocationIds = choice.invocationIds.slice();
      }

      // Con più di una sottoclasse vince la scelta fatta nel picker; con una
      // sola resta l'assegnazione automatica di sempre.
      var chosenSubclassId = choice.subclassId || autoSubclassId;
      if (needsSubclass && chosenSubclassId) {
        if (!ch.subclassId) {
          ch.subclassId = chosenSubclassId;
        }
        if (!ch.subclassName) {
          ch.subclassName = klass.subclasses[chosenSubclassId].name;
        }
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].subclassId = chosenSubclassId;
      }

      if (needsEpicBoon && autoEpicBoonId) {
        ch.feats = ch.feats || [];
        ch.feats.push({ id: autoEpicBoonId, level: nextLevel });
        ch.levelChoices[key] = ch.levelChoices[key] || {};
        ch.levelChoices[key].epicBoonId = autoEpicBoonId;
      }

      var hpDelta = viewAfter.poolMax.hp - viewBefore.poolMax.hp;
      state.pools.hp += hpDelta; // i PF correnti salgono insieme al tetto, non solo il tetto

      window.AppStorage.saveState(state, true);

      if (window.AppHeader && window.AppHeader.render) {
        window.AppHeader.render();
      }
      if (window.AppStats && window.AppStats.render) {
        window.AppStats.render();
      }
      if (window.AppTraits && window.AppTraits.render) {
        window.AppTraits.render();
      }
      if (window.AppSheet && window.AppSheet.render) {
        window.AppSheet.render();
      }
      if (window.AppGrimorio && window.AppGrimorio.render) {
        window.AppGrimorio.render();
      }

      closeSheet();
      render(); // nasconde il bottone se il livello è ora 20
    }

    /* ---------- costruzione del foglio ---------- */

    openSheet('Sali di Livello');

    var badge = el('div', 'levelup-badge', 'Livello ' + level + ' → ' + nextLevel);
    bodyEl.appendChild(badge);

    bodyEl.appendChild(el('div', 'edit-section-label', 'Guadagni automatici'));
    gainsContainer = el('div', 'levelup-gains');
    bodyEl.appendChild(gainsContainer);

    if (needsAsi) {
      bodyEl.appendChild(el('div', 'edit-section-label', 'Aumento di Caratteristica o Talento'));
      var asiSection = buildAsiSection();
      var featSection = buildFeatSection();
      asiSection.classList.add('hidden');
      featSection.classList.add('hidden');
      bodyEl.appendChild(buildChoiceToggle(asiSection, featSection));
      bodyEl.appendChild(asiSection);
      bodyEl.appendChild(featSection);
    }

    if (needsStyle) {
      bodyEl.appendChild(buildStyleSection());
    }

    if (needsExpertise) {
      bodyEl.appendChild(buildExpertiseSection());
    }

    if (needsMetamagic) {
      bodyEl.appendChild(buildMetamagicSection());
    }

    if (needsInvocation) {
      bodyEl.appendChild(buildInvocationSection());
    }

    if (needsSubclass) {
      bodyEl.appendChild(buildSubclassSection());
    }

    if (needsEpicBoon) {
      bodyEl.appendChild(buildEpicBoonAutoRow());
    }

    confirmBtn = el('button', 'save-btn', 'Conferma Livello ' + nextLevel);
    confirmBtn.type = 'button';
    confirmBtn.addEventListener('click', onConfirm);
    bodyEl.appendChild(confirmBtn);

    renderGains();
    updateConfirmState();
  }

  /* ---------- avvio ---------- */

  function init() {
    overlay = document.getElementById('levelup-sheet-overlay');
    titleEl = document.getElementById('levelup-sheet-title');
    bodyEl = document.getElementById('levelup-sheet-body');
    if (!overlay || !titleEl || !bodyEl) {
      return;
    }
    var closeBtn = document.getElementById('levelup-sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    var btn = document.getElementById('levelup-btn');
    if (btn) {
      btn.addEventListener('click', openWizard);
    }
    render();
  }

  window.AppLevelUp = {
    init: init,
    render: render
  };
})();
