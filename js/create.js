(function () {
  /*
   * Wizard di creazione personaggio (Fase 5, Blocco 5.B):
   * - b1   (fatto): scaffold — macchina a stati dei passi e navigazione.
   * - b2.1 (qui): contenuto reale dei passi Specie e Classe, con stato in
   *   bozza condiviso `draft`; gli altri passi (Punteggi, Competenze,
   *   Equipaggiamento, Sottoclasse/Incantesimi) restano segnaposto, in
   *   arrivo nel prossimo sotto-step (b2.2+).
   * - b3   (in arrivo): generazione vera del personaggio.
   * Pattern "Mago a schermo intero" (5.B.1): una vista a schermo intero, un
   * passo per volta.
   *
   * Vista pilotata dalla stessa macchina a stati sul <body> di
   * js/dashboard.js/css/components/dashboard.css: open() passa da
   * body.in-dashboard a body.in-create, close() torna indietro.
   */

  var STEPS = [
    { id: 'specie', title: 'Specie' },
    { id: 'classe', title: 'Classe' },
    { id: 'punteggi', title: 'Punteggi' },
    { id: 'competenze', title: 'Competenze' },
    { id: 'equipaggiamento', title: 'Equipaggiamento' },
    { id: 'finale', title: 'Sottoclasse e Incantesimi' }
  ];

  var stepIndex = 0; // passo corrente, 0-based

  // Stato in bozza del personaggio in creazione: vive solo mentre il wizard
  // è aperto e viene azzerato a ogni open() (vedi sotto). I passi non ancora
  // implementati (b2.2+) non hanno ancora un campo dedicato qui.
  var draft = { name: '', speciesId: null, classId: null };

  var progressFillEl, stepNumEl, stepTitleEl, stepBodyEl, backBtn, nextBtn, footerNoteEl;

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

  // Tile selezionabile (specie o classe): nome in evidenza + riga piccola
  // opzionale (taglia/velocità per le specie, caratteristica primaria per le
  // classi). Marcata "on" se corrisponde già alla selezione nel draft.
  function buildTile(name, meta, isSelected) {
    var tile = el('button', 'create-tile' + (isSelected ? ' on' : ''));
    tile.appendChild(el('span', 'create-tile-name', name));
    if (meta) {
      tile.appendChild(el('span', 'create-tile-meta', meta));
    }

    return tile;
  }

  /* ---------- validazione ---------- */

  function stepValid() {
    var step = STEPS[stepIndex];
    if (step.id === 'specie') {
      return !!draft.speciesId && draft.name.trim().length > 0;
    }
    if (step.id === 'classe') {
      return !!draft.classId;
    }

    return true; // passi ancora segnaposto: nessun vincolo (b2.2+)
  }

  /* ---------- passi: Specie e Classe (b2.1) ---------- */

  function renderSpecie(container) {
    // Campo nome personaggio.
    var label = el('label', 'create-label', 'Nome del personaggio');
    label.setAttribute('for', 'create-name-input');
    container.appendChild(label);

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'create-name-input';
    input.className = 'create-in';
    input.value = draft.name;
    input.addEventListener('input', function () {
      draft.name = input.value;
      updateNav();
    });
    container.appendChild(input);

    // Lista tile: una per specie del manuale (window.MANUAL_55.species).
    var list = el('div', 'create-tile-list');
    container.appendChild(list);

    Object.keys(window.MANUAL_55.species).forEach(function (id) {
      var sp = window.MANUAL_55.species[id];
      var meta = sp.size || '';
      if (sp.speedM) {
        meta += (meta ? ' · ' : '') + sp.speedM.toLocaleString('it-IT') + ' m';
      }
      var tile = buildTile(sp.name, meta, id === draft.speciesId);

      tile.addEventListener('click', function () {
        draft.speciesId = id;
        list.querySelectorAll('.create-tile').forEach(function (t) {
          t.classList.toggle('on', t === tile);
        });
        updateNav();
      });

      list.appendChild(tile);
    });
  }

  function renderClasse(container) {
    // Lista tile: una per classe del manuale (window.MANUAL_55.classes). Non
    // filtrare: oggi solo Paladino e Barbaro hanno dati 1→20 completi, ma
    // vanno mostrate comunque tutte (il "non ancora giocabile" si gestisce
    // in un altro step).
    var list = el('div', 'create-tile-list');
    container.appendChild(list);

    Object.keys(window.MANUAL_55.classes).forEach(function (id) {
      var kl = window.MANUAL_55.classes[id];
      var tile = buildTile(kl.name, kl.primaryAbility, id === draft.classId);

      tile.addEventListener('click', function () {
        draft.classId = id;
        list.querySelectorAll('.create-tile').forEach(function (t) {
          t.classList.toggle('on', t === tile);
        });
        updateNav();
      });

      list.appendChild(tile);
    });
  }

  /* ---------- render ---------- */

  function render() {
    var step = STEPS[stepIndex];

    if (progressFillEl) {
      progressFillEl.style.width = ((stepIndex + 1) / STEPS.length * 100) + '%';
    }
    if (stepNumEl) {
      stepNumEl.textContent = 'Passo ' + (stepIndex + 1) + ' di ' + STEPS.length;
    }
    if (stepTitleEl) {
      stepTitleEl.textContent = step.title;
    }
    if (stepBodyEl) {
      stepBodyEl.innerHTML = '';
      if (step.id === 'specie') {
        stepBodyEl.classList.add('has-fields');
        renderSpecie(stepBodyEl);
      } else if (step.id === 'classe') {
        stepBodyEl.classList.add('has-fields');
        renderClasse(stepBodyEl);
      } else {
        // Segnaposto: il contenuto reale degli altri passi arriva nel
        // prossimo sotto-step (b2.2+).
        stepBodyEl.classList.remove('has-fields');
        stepBodyEl.textContent = 'Contenuto del passo "' + step.title + '" — in arrivo (step b2).';
      }
    }
    updateNav();
  }

  // Bottone "Avanti"/"Crea personaggio" e nota in calce: separata da
  // render() perché va richiamata anche dagli input/tile dei passi, senza
  // ridisegnare tutto il corpo del passo (che perderebbe focus/selezione).
  function updateNav() {
    var isLast = stepIndex === STEPS.length - 1;

    if (nextBtn) {
      nextBtn.textContent = isLast ? 'Crea personaggio' : 'Avanti →';
      // La generazione vera arriva nel b3: all'ultimo passo il bottone resta
      // disabilitato; negli altri dipende dalla validità del passo corrente.
      nextBtn.disabled = isLast ? true : !stepValid();
      nextBtn.classList.toggle('is-disabled', nextBtn.disabled);
    }
    if (footerNoteEl) {
      footerNoteEl.textContent = isLast ? 'generazione in arrivo (b3)' : '';
      footerNoteEl.classList.toggle('hidden', !isLast);
    }
  }

  /* ---------- navigazione ---------- */

  function next() {
    if (nextBtn && nextBtn.disabled) {
      return; // passo non valido, oppure ultimo passo (bottone disabilitato)
    }
    if (stepIndex >= STEPS.length - 1) {
      return; // ultimo passo: "Crea personaggio" è disabilitato, nessuna azione
    }
    stepIndex = Math.min(STEPS.length - 1, stepIndex + 1);
    render();
  }

  function back() {
    if (stepIndex <= 0) {
      close(); // Indietro al passo 0 esce dal wizard e torna alla dashboard
      return;
    }
    stepIndex = Math.max(0, stepIndex - 1);
    render();
  }

  /* ---------- apertura / chiusura ---------- */

  function open() {
    stepIndex = 0;
    draft = { name: '', speciesId: null, classId: null };
    document.body.classList.remove('in-dashboard');
    document.body.classList.add('in-create');
    render();
  }

  function close() {
    document.body.classList.remove('in-create');
    document.body.classList.add('in-dashboard');
    stepIndex = 0;
  }

  /* ---------- avvio ---------- */

  function init() {
    progressFillEl = document.getElementById('create-progress-fill');
    stepNumEl = document.getElementById('create-step-num');
    stepTitleEl = document.getElementById('create-step-title');
    stepBodyEl = document.getElementById('create-step-body');
    backBtn = document.getElementById('create-back');
    nextBtn = document.getElementById('create-next');
    footerNoteEl = document.getElementById('create-footer-note');
    var cancelBtn = document.getElementById('create-cancel');

    if (!stepBodyEl || !backBtn || !nextBtn) {
      return;
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', close);
    }
    backBtn.addEventListener('click', back);
    nextBtn.addEventListener('click', next);
  }

  window.AppCreate = {
    init: init,
    open: open
  };
})();
