(function () {
  /*
   * Wizard di creazione personaggio (Fase 5, Blocco 5.B, sotto-step b1):
   * SOLO lo scaffold — macchina a stati dei passi e navigazione. I corpi dei
   * passi sono segnaposto: il contenuto vero arriva nel b2, la generazione
   * (e il salvataggio del personaggio) nel b3. Pattern "Mago a schermo
   * intero" (5.B.1): una vista a schermo intero, un passo per volta.
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

  var progressFillEl, stepNumEl, stepTitleEl, stepBodyEl, backBtn, nextBtn, footerNoteEl;

  /* ---------- render ---------- */

  function render() {
    var step = STEPS[stepIndex];
    var isLast = stepIndex === STEPS.length - 1;

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
      // Segnaposto: il contenuto reale di ogni passo arriva nel sotto-step b2.
      stepBodyEl.textContent = 'Contenuto del passo "' + step.title + '" — in arrivo (step b2).';
    }
    // "Indietro" resta sempre cliccabile, anche al passo 0: lì chiude il
    // wizard invece di decrementare (vedi back()) — niente attributo
    // disabled, altrimenti quel click non arriverebbe mai.
    if (nextBtn) {
      nextBtn.textContent = isLast ? 'Crea personaggio' : 'Avanti →';
      // La generazione vera arriva nel b3: all'ultimo passo il bottone resta disabilitato.
      nextBtn.disabled = isLast;
      nextBtn.classList.toggle('is-disabled', isLast);
    }
    if (footerNoteEl) {
      footerNoteEl.textContent = isLast ? 'generazione in arrivo (b3)' : '';
      footerNoteEl.classList.toggle('hidden', !isLast);
    }
  }

  /* ---------- navigazione ---------- */

  function next() {
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
