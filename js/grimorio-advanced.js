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

  var RESET_LABELS = {
    short: 'Riposo breve', 'short-full': 'Riposo breve',
    long: 'Riposo lungo', day: '1 al giorno'
  };

  // Risorse calcolate da js/engine.js senza un campo `name` proprio (i dati
  // di classResources hanno già il loro nome: qui solo le manciata pushate
  // "a mano" in derive() — vedi Dadi Ferita/Incanalare/Soffio/Volo).
  var KNOWN_RESOURCE_NAMES = {
    cd: 'Incanalare Divinità',
    hd: 'Dadi Ferita',
    breath: 'Soffio del Drago',
    flight: 'Volo Draconico'
  };

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

  // Chiave interna (mai mostrata: l'utente ragiona solo sul Nome). Generata
  // una volta e mai più toccata, così non cambia riaprendo il pannello.
  function makeResourceKey() {
    return 'res-' + Math.random().toString(36).slice(2, 8);
  }

  function newResourceDraft() {
    return { key: makeResourceKey(), name: '', max: 1, ctx: '', resetOn: 'long', auto: false };
  }

  // Riga compatta sotto il nome quando la card è chiusa: usi, descrizione,
  // recupero in un colpo d'occhio senza dover aprire nulla.
  function resourceHint(resource) {
    var parts = [String(resource.max == null ? 1 : resource.max)];
    if (resource.ctx) {
      parts.push(resource.ctx);
    }
    parts.push(RESET_LABELS[resource.resetOn] || RESET_LABELS.long);

    return parts.join(' · ');
  }

  /* Stessa fisarmonica di .item-editor-acc (css/components/items.css, già
     usata per gli effetti degli oggetti): chiusa mostra solo nome + riepilogo,
     un tocco la apre. Con 6+ risorse (classe + specie + personalizzate) tutte
     spalancate insieme erano un muro da scorrere all'infinito.
     Niente `onChange` sui campi: ricostruire la lista a ogni tasto premuto
     toglieva il focus all'input a ogni carattere (bug "non funziona bene");
     i campi mutano il resource in place, solo Rimuovi tocca la lista. */
  function buildResourceEditor(resource, index, onRemove, opts) {
    opts = opts || {};
    var acc = el('div', 'item-editor-acc');
    if (opts.open) {
      acc.classList.add('open');
    }

    var head = el('div', 'item-editor-acc-head');
    var arrow = el('span', 'item-editor-acc-arrow', opts.open ? '▾' : '▸');
    head.appendChild(arrow);

    var titleWrap = el('span', 'item-editor-acc-title');
    var nameEl = el('span', null, resource.name || ('Risorsa ' + (index + 1)));
    titleWrap.appendChild(nameEl);
    var hintEl = el('span', 'item-editor-acc-hint', resourceHint(resource));
    titleWrap.appendChild(hintEl);
    head.appendChild(titleWrap);

    if (resource.auto) {
      head.appendChild(el('span', 'grim-resource-hint', 'dalla classe'));
    }
    var rm = el('button', 'grim-resource-remove', '✕');
    rm.type = 'button';
    rm.setAttribute('aria-label', 'Rimuovi risorsa');
    rm.addEventListener('click', function (e) {
      e.stopPropagation();
      onRemove();
    });
    head.appendChild(rm);

    var body = el('div', 'item-editor-acc-body');
    if (!opts.open) {
      body.classList.add('hidden');
    }

    head.addEventListener('click', function () {
      var open = acc.classList.toggle('open');
      body.classList.toggle('hidden', !open);
      arrow.textContent = open ? '▾' : '▸';
    });

    function refreshHint() {
      hintEl.textContent = resourceHint(resource);
    }

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = resource.name || '';
    nameInput.placeholder = 'es. Scudo magico';
    nameInput.addEventListener('input', function () {
      resource.name = nameInput.value;
      nameEl.textContent = nameInput.value.trim() || ('Risorsa ' + (index + 1));
    });
    var nameField = el('div', 'edit-field');
    nameField.appendChild(el('label', 'edit-label', 'Nome'));
    nameField.appendChild(nameInput);
    body.appendChild(nameField);

    var maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.min = '0';
    maxInput.inputMode = 'numeric';
    maxInput.className = 'edit-input';
    maxInput.value = String(resource.max == null ? 1 : resource.max);
    maxInput.addEventListener('input', function () {
      resource.max = Math.max(0, parseInt(maxInput.value, 10) || 0);
      refreshHint();
    });
    var maxField = el('div', 'edit-field');
    maxField.appendChild(el('label', 'edit-label', 'Usi massimi'));
    maxField.appendChild(maxInput);
    body.appendChild(maxField);

    var ctxInput = document.createElement('input');
    ctxInput.type = 'text';
    ctxInput.className = 'edit-input';
    ctxInput.value = resource.ctx || '';
    ctxInput.placeholder = 'es. +5 CA · reazione';
    ctxInput.addEventListener('input', function () {
      resource.ctx = ctxInput.value;
      refreshHint();
    });
    var ctxField = el('div', 'edit-field');
    ctxField.appendChild(el('label', 'edit-label', 'Descrizione breve'));
    ctxField.appendChild(ctxInput);
    body.appendChild(ctxField);

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
      refreshHint();
    });
    var resetField = el('div', 'edit-field');
    resetField.appendChild(el('label', 'edit-label', 'Recupero'));
    resetField.appendChild(resetSelect);
    body.appendChild(resetField);

    acc.appendChild(head);
    acc.appendChild(body);

    return acc;
  }

  /* Un gruppo di card modificabili (usato sia per "Dalla classe e specie"
     che per "Personalizzate"): stesso editor, stesso Rimuovi. Le prime hanno
     `onRemove` che le segna come nascoste invece di limitarsi a toglierle
     dall'array — altrimenti al render successivo il motore le ricalcolerebbe
     comunque da capo (sono un derivato di classe/livello, non uno stato). */
  function buildResourceGroup(title, note, resources, onRemove, addLabel) {
    bodyEl.appendChild(el('div', 'edit-section-label', title));
    bodyEl.appendChild(el('p', 'note', note));

    var host = el('div', 'grim-resources-list');
    bodyEl.appendChild(host);

    // La nuova risorsa nasce aperta (ci si scrive subito dentro), le altre
    // restano come sono state lasciate — riaprirle tutte a ogni Rimuovi/
    // Aggiungi sarebbe fastidioso quanto non poterle mai chiudere.
    var openIndex = -1;

    function rerender() {
      host.innerHTML = '';
      resources.forEach(function (resource, index) {
        host.appendChild(buildResourceEditor(resource, index, function () {
          var removed = resources.splice(index, 1)[0];
          if (onRemove) {
            onRemove(removed);
          }
          openIndex = -1;
          rerender();
        }, { open: index === openIndex }));
      });
      openIndex = -1;
    }
    rerender();

    if (addLabel) {
      var addBtn = el('button', 'item-add-btn', addLabel);
      addBtn.type = 'button';
      addBtn.addEventListener('click', function () {
        resources.push(newResourceDraft());
        openIndex = resources.length - 1;
        rerender();
      });
      bodyEl.appendChild(addBtn);
    }
  }

  function openAdvanced() {
    var state = window.AppStorage.getState();
    var ch = state.character;
    var customKeys = {};
    (ch.extraResources || []).forEach(function (r) { customKeys[r.key] = true; });
    // Stessa esclusione di 'sl*'/'item-*' di js/stats.js: slot incantesimi e
    // usi oggetto si gestiscono altrove (Grimorio, Oggetti), non qui.
    var autoResources = (window.AppEngine.getView().resources || [])
      .filter(function (r) {
        return r.key.indexOf('sl') !== 0 && r.key.indexOf('item-') !== 0 && !customKeys[r.key];
      })
      .map(function (r) {
        return {
          key: r.key,
          name: r.name || KNOWN_RESOURCE_NAMES[r.key] || r.key,
          max: r.max,
          ctx: r.ctx || '',
          resetOn: r.resetOn || 'long',
          auto: true
        };
      });

    var customResources = (ch.extraResources || []).map(function (r) {
      return {
        key: r.key || makeResourceKey(),
        name: r.name || '',
        max: r.max == null ? 1 : r.max,
        ctx: r.ctx || '',
        resetOn: r.resetOn || 'long',
        auto: false
      };
    });

    var newlyHiddenKeys = [];

    openSheet('Risorse personalizzate');

    if (autoResources.length) {
      buildResourceGroup(
        'Dalla classe e specie',
        'Calcolate da classe, livello e specie: puoi modificarle o rimuoverle come le altre.',
        autoResources,
        function (removed) { newlyHiddenKeys.push(removed.key); },
        null
      );
    }

    buildResourceGroup(
      'Personalizzate',
      'Aggiungine quante ti servono: usi speciali, oggetti di casa, incantesimi gratuiti.',
      customResources,
      null,
      '+ Nuova risorsa'
    );

    addSaveButton(function () {
      commit(function (next) {
        // Una risorsa senza nome è una riga aggiunta e poi abbandonata: si
        // scarta da sola invece di salvare un fantasma senza etichetta.
        next.character.extraResources = autoResources.concat(customResources)
          .filter(function (r) { return (r.name || '').trim(); })
          .map(function (r) {
            return {
              key: r.key,
              name: r.name.trim(),
              max: r.max,
              ctx: r.ctx || '',
              resetOn: r.resetOn || 'long'
            };
          });
        next.character.hiddenResourceKeys = (next.character.hiddenResourceKeys || [])
          .concat(newlyHiddenKeys);
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
    var resourcesBtn = document.getElementById('edit-resources-btn');
    if (resourcesBtn) {
      resourcesBtn.addEventListener('click', openAdvanced);
    }
  }

  window.AppGrimorioAdvanced = {
    init: init,
    open: openAdvanced
  };
})();
