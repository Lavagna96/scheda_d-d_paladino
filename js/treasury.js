(function () {
  function fmt(n) {
    return n.toLocaleString('it-IT');
  }

  /* Tassonomia estesa per riga di Zaino/Bottino Party (Step: 11 categorie
     fisse invece delle 3 originarie — la categoria si sceglie da una griglia
     nel popup "Nuovo oggetto" o si cambia in un secondo momento aprendo
     l'editor della riga, non più ciclando con un tap sulla pillola).
     'oggetto' resta l'id storico (era "Oggetto" 🎒) riusato come fallback
     "Varie" 📦: nessuna migrazione dati necessaria per i salvataggi esistenti. */
  var ITEM_KINDS = {
    pozione: { icon: '🧪', label: 'Pozione' },
    magico: { icon: '✨', label: 'Oggetto magico' },
    arma: { icon: '⚔️', label: 'Arma' },
    armatura: { icon: '🛡️', label: 'Armatura' },
    tesoro: { icon: '💎', label: 'Gioiello/Tesoro' },
    pergamena: { icon: '📜', label: 'Pergamena' },
    attrezzo: { icon: '🔧', label: 'Attrezzo' },
    munizioni: { icon: '🏹', label: 'Munizioni' },
    cibo: { icon: '🍖', label: 'Cibo/Provviste' },
    denaro: { icon: '💰', label: 'Denaro' },
    oggetto: { icon: '📦', label: 'Varie' }
  };
  var KIND_ORDER = ['pozione', 'magico', 'arma', 'armatura', 'tesoro', 'pergamena', 'attrezzo', 'munizioni', 'cibo', 'denaro', 'oggetto'];
  var COIN_FULL_LABELS = { mp: 'di Platino', mo: "d'Oro", ma: "d'Argento", mr: 'di Rame' };

  function coinTotalMO(coins) {
    return coins.mp * 10 + coins.mo + coins.ma / 10 + coins.mr / 100;
  }

  function coinWeightKg(coins) {
    var total = coins.mp + coins.mo + coins.ma + coins.mr;

    return total / 50 * 0.4536;
  }

  function itemsWeight(items) {
    return items.reduce(function (sum, it) {
      return sum + (it.weight || 0) * (it.qty || 1);
    }, 0);
  }

  function carryMaxKg() {
    // Formula ufficiale D&D 5e: capacità di carico = Forza × 15 libbre,
    // convertita in kg (1 lb ≈ 0,4536 kg).
    var str = window.AppEngine.getView().carryStr;

    return Math.round(str * 15 * 0.4536 * 10) / 10;
  }

  function bagConstants() {
    if (window.AppItems) {
      return {
        capacity: window.AppItems.DIMENSIONAL_BAG_CAPACITY_KG,
        self: window.AppItems.DIMENSIONAL_BAG_SELF_KG
      };
    }

    return { capacity: 250, self: 7.5 };
  }

  function getEquippedBag() {
    if (!window.AppItems || !window.AppItems.getEquippedDimensionalBag) {
      return null;
    }

    return window.AppItems.getEquippedDimensionalBag(window.AppStorage.getState().character);
  }

  function computeCarryBreakdown() {
    var state = window.AppStorage.getState();
    var coins = state.coins;
    var partyW = itemsWeight(state.treasury.partyItems);
    var personalW = itemsWeight(state.treasury.personalItems);
    var coinW = coinWeightKg(coins);
    var bag = getEquippedBag();
    var bagCfg = bagConstants();
    var max = carryMaxKg();

    if (!bag) {
      return {
        bagEquipped: false,
        coinW: coinW,
        partyW: partyW,
        personalW: personalW,
        bagStored: 0,
        bagOverflow: 0,
        bagSelf: 0,
        carryTotal: coinW + partyW + personalW,
        carryMax: max,
        bagCapacity: bagCfg.capacity
      };
    }

    var storeable = coinW + partyW;
    var bagStored = Math.min(storeable, bagCfg.capacity);
    var bagOverflow = Math.max(0, storeable - bagCfg.capacity);
    var carryTotal = bagCfg.self + personalW + bagOverflow;

    return {
      bagEquipped: true,
      coinW: coinW,
      partyW: partyW,
      personalW: personalW,
      bagStored: bagStored,
      bagOverflow: bagOverflow,
      bagSelf: bagCfg.self,
      carryTotal: carryTotal,
      carryMax: max,
      bagCapacity: bagCfg.capacity
    };
  }

  function renderCarryBar() {
    var bd = computeCarryBreakdown();
    var total = bd.carryTotal;
    var max = bd.carryMax;
    var pct = max > 0 ? Math.min(100, total / max * 100) : 0;
    var fill = document.getElementById('carry-bar-fill');
    var label = document.getElementById('carry-label-val');
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.remove('warning', 'danger');
      if (total > max) {
        fill.classList.add('danger');
      } else if (pct >= 80) {
        fill.classList.add('warning');
      }
    }
    if (label) {
      label.textContent = total.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        + ' / ' + max.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg';
    }

    var bagBlock = document.getElementById('bag-carry-block');
    if (bagBlock) {
      bagBlock.classList.toggle('hidden', !bd.bagEquipped);
    }
    if (bd.bagEquipped) {
      var bagFill = document.getElementById('bag-carry-bar-fill');
      var bagLabel = document.getElementById('bag-carry-label-val');
      var bagPct = bd.bagCapacity > 0 ? Math.min(100, bd.bagStored / bd.bagCapacity * 100) : 0;
      if (bagFill) {
        bagFill.style.width = bagPct + '%';
        bagFill.classList.remove('warning', 'danger');
        if (bd.bagStored > bd.bagCapacity) {
          bagFill.classList.add('danger');
        } else if (bagPct >= 80) {
          bagFill.classList.add('warning');
        }
      }
      if (bagLabel) {
        bagLabel.textContent = bd.bagStored.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          + ' / ' + bd.bagCapacity.toLocaleString('it-IT', { maximumFractionDigits: 0 }) + ' kg';
      }
    }

    var coinNote = document.getElementById('coin-bag-note');
    if (coinNote) {
      if (bd.bagEquipped && bd.coinW > 0) {
        var inBag = Math.min(bd.coinW, Math.max(0, bd.bagCapacity - Math.max(0, bd.bagStored - bd.coinW)));
        var onPerson = Math.max(0, bd.coinW - inBag);
        if (onPerson > 0.05) {
          coinNote.textContent = inBag.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg in sacca · '
            + onPerson.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg sulle spalle';
          coinNote.classList.remove('hidden');
        } else {
          coinNote.textContent = 'In sacca dimensionale';
          coinNote.classList.remove('hidden');
        }
      } else {
        coinNote.textContent = '';
        coinNote.classList.add('hidden');
      }
    }

    var partyNote = document.getElementById('party-bag-note');
    if (partyNote) {
      if (bd.bagEquipped && bd.partyW > 0) {
        var coinsInBag = Math.min(bd.coinW, bd.bagCapacity);
        var partyRoom = Math.max(0, bd.bagCapacity - coinsInBag);
        var partyInBag = Math.min(bd.partyW, partyRoom);
        var partyOnPerson = Math.max(0, bd.partyW - partyInBag);
        if (partyOnPerson > 0.05) {
          partyNote.textContent = partyInBag.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg in sacca · '
            + partyOnPerson.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg sulle spalle';
          partyNote.classList.remove('hidden');
        } else if (partyInBag > 0) {
          partyNote.textContent = 'In sacca dimensionale';
          partyNote.classList.remove('hidden');
        } else {
          partyNote.textContent = '';
          partyNote.classList.add('hidden');
        }
      } else {
        partyNote.textContent = '';
        partyNote.classList.add('hidden');
      }
    }
  }

  function renderCoins() {
    var state = window.AppStorage.getState();
    ['mp', 'mo', 'ma', 'mr'].forEach(function (k) {
      var inp = document.getElementById('coin-' + k);
      if (inp && document.activeElement !== inp) {
        inp.value = state.coins[k];
      }
    });
    var gp = coinTotalMO(state.coins);
    var kg = coinWeightKg(state.coins);
    var total = state.coins.mp + state.coins.mo + state.coins.ma + state.coins.mr;
    var v = document.getElementById('coin-value');
    var w = document.getElementById('coin-weight');
    if (v) {
      v.textContent = '≈ ' + fmt(Math.round(gp)) + ' MO';
    }
    if (w) {
      w.innerHTML = '≈ ' + kg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg (' + fmt(total) + ' monete)';
    }
    renderCarryBar();
  }

  function bindCoins() {
    ['mp', 'mo', 'ma', 'mr'].forEach(function (k) {
      var inp = document.getElementById('coin-' + k);
      if (!inp || inp._bound) {
        return;
      }
      inp._bound = true;
      inp.addEventListener('input', function () {
        /* Campo testo (non type=number) apposta: su iOS il tipo number
           rimette il cursore in fondo a ogni tocco, impedendo di editare le
           centinaia di un numero lungo senza cancellare tutto. Qui puliamo
           solo i caratteri non numerici, preservando la posizione del
           cursore invece di riscrivere sempre l'intero valore. */
        var pos = inp.selectionStart;
        var before = inp.value;
        var cleaned = before.replace(/[^0-9]/g, '');
        if (cleaned !== before) {
          var removed = before.length - cleaned.length;
          inp.value = cleaned;
          pos = Math.max(0, pos - removed);
          inp.setSelectionRange(pos, pos);
        }
        var n = parseInt(cleaned, 10);
        var s = window.AppStorage.getState();
        s.coins[k] = isNaN(n) || n < 0 ? 0 : n;
        window.AppStorage.saveState(s);
        renderCoins();
      });
    });
  }

  /* Stato UI (solo in memoria, non salvato) di ricerca/filtro per le due
     liste Bottino Party e Zaino (Step: toolbar ricerca + chip categoria). */
  var partyListState = { search: '', filterKind: 'all' };
  var personalListState = { search: '', filterKind: 'all' };

  /* Menu "⋯" per riga (Cambia categoria / Elimina): un solo popover aperto
     alla volta, richiuso al click fuori, su Escape, o quando se ne apre un
     altro. Le referenze diventano automaticamente obsolete quando la lista
     viene ricostruita da renderItemList (innerHTML = ''), per questo render()
     le azzera esplicitamente invece di lasciarle puntare a nodi staccati. */
  var openRowMenu = null;
  var openRowMenuRow = null;

  function closeOpenRowMenu() {
    if (openRowMenu) {
      openRowMenu.classList.add('hidden');
    }
    if (openRowMenuRow) {
      openRowMenuRow.classList.remove('row-menu-open');
    }
    openRowMenu = null;
    openRowMenuRow = null;
  }

  /* Popover in position:fixed (non absolute): #main-content scrolla con
     overflow-y:auto, che ritaglierebbe un popover absolute vicino al fondo
     della lista dietro alla bottom-nav fissa. Con fixed, la posizione va
     ricalcolata all'apertura (positionRowMenu) e il menu va richiuso se si
     scrolla, altrimenti resterebbe visivamente ancorato al punto sbagliato. */
  function positionRowMenu(btn, pop) {
    var rect = btn.getBoundingClientRect();
    pop.style.top = (rect.bottom + 6) + 'px';
    pop.style.right = (window.innerWidth - rect.right) + 'px';
  }

  function bindRowMenuDismiss() {
    if (bindRowMenuDismiss._bound) {
      return;
    }
    bindRowMenuDismiss._bound = true;
    document.addEventListener('click', closeOpenRowMenu);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        closeOpenRowMenu();
      }
    });
    var main = document.getElementById('main-content');
    if (main) {
      main.addEventListener('scroll', closeOpenRowMenu, true);
    }
  }

  function ensureItemDefaults(it, defaultKind) {
    if (it.qty == null) {
      it.qty = 1;
    }
    if (it.weight == null) {
      it.weight = 0.5;
    }
    if (it.value == null) {
      it.value = 0;
    }
    if (!it.kind || !ITEM_KINDS[it.kind]) {
      it.kind = defaultKind;
    }
  }

  /* Riga di una lista Bottino/Zaino. `i` è l'indice dell'oggetto nell'ARRAY
     ORIGINALE (non nell'elenco filtrato/raggruppato): qty +/- ed eliminazione
     devono continuare a colpire l'elemento giusto anche quando la lista
     visualizzata è filtrata o raggruppata per categoria. */
  function buildItemRow(it, i, arr, namePh, descPh) {
    var row = document.createElement('div');
    row.className = 'edit-row';
    var main = document.createElement('div');
    main.className = 'edit-main';
    var nameRow = document.createElement('div');
    nameRow.className = 'edit-name-row';
    var nameEl = document.createElement('div');
    nameEl.className = 'edit-name';
    nameEl.contentEditable = 'true';
    nameEl.setAttribute('data-ph', namePh);
    nameEl.textContent = it.name || '';
    var kindPill = document.createElement('span');
    kindPill.className = 'cat-pill';
    var k = ITEM_KINDS[it.kind];
    kindPill.textContent = k.icon + ' ' + k.label;
    nameRow.appendChild(nameEl);
    nameRow.appendChild(kindPill);
    var descEl = document.createElement('div');
    descEl.className = 'edit-desc';
    descEl.contentEditable = 'true';
    descEl.setAttribute('data-ph', descPh);
    descEl.textContent = it.desc || '';
    var meta = document.createElement('div');
    meta.className = 'edit-meta';
    meta.appendChild(document.createTextNode('Peso '));
    var weightInp = document.createElement('input');
    weightInp.type = 'number';
    weightInp.className = 'edit-weight';
    weightInp.min = '0';
    weightInp.step = '0.1';
    weightInp.value = it.weight;
    weightInp.setAttribute('aria-label', 'Peso kg');
    meta.appendChild(weightInp);
    meta.appendChild(document.createTextNode(' kg'));
    meta.appendChild(document.createTextNode(' · Valore '));
    var valueInp = document.createElement('input');
    valueInp.type = 'number';
    valueInp.className = 'edit-weight';
    valueInp.min = '0';
    valueInp.step = '1';
    valueInp.value = it.value;
    valueInp.setAttribute('aria-label', 'Valore MO');
    meta.appendChild(valueInp);
    meta.appendChild(document.createTextNode(' MO'));
    main.appendChild(nameRow);
    main.appendChild(descEl);
    main.appendChild(meta);

    var qtyWrap = document.createElement('div');
    qtyWrap.className = 'edit-qty';
    var minus = document.createElement('button');
    minus.className = 'qbtn';
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Diminuisci quantità');
    var qval = document.createElement('span');
    qval.className = 'qval';
    qval.textContent = '×' + it.qty;
    var plus = document.createElement('button');
    plus.className = 'qbtn';
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Aumenta quantità');
    minus.addEventListener('click', function () {
      it.qty = Math.max(0, it.qty - 1);
      qval.textContent = '×' + it.qty;
      window.AppStorage.saveState(window.AppStorage.getState());
      renderCarryBar();
    });
    plus.addEventListener('click', function () {
      it.qty = it.qty + 1;
      qval.textContent = '×' + it.qty;
      window.AppStorage.saveState(window.AppStorage.getState());
      renderCarryBar();
    });
    qtyWrap.appendChild(minus);
    qtyWrap.appendChild(qval);
    qtyWrap.appendChild(plus);

    var menuBtn = document.createElement('button');
    menuBtn.className = 'row-menu-btn';
    menuBtn.type = 'button';
    menuBtn.innerHTML = '⋯';
    menuBtn.setAttribute('aria-label', 'Altre azioni');

    var menuPop = document.createElement('div');
    menuPop.className = 'row-menu-pop hidden';

    var menuEditCat = document.createElement('button');
    menuEditCat.type = 'button';
    menuEditCat.className = 'row-menu-item';
    menuEditCat.innerHTML = '✎ Cambia categoria';
    menuEditCat.addEventListener('click', function (ev) {
      ev.stopPropagation();
      closeOpenRowMenu();
      openItemEditCategory(it);
    });

    var menuDel = document.createElement('button');
    menuDel.type = 'button';
    menuDel.className = 'row-menu-item danger';
    menuDel.innerHTML = '✕ Elimina';
    menuDel.addEventListener('click', function (ev) {
      ev.stopPropagation();
      closeOpenRowMenu();
      arr.splice(i, 1);
      window.AppStorage.saveState(window.AppStorage.getState());
      render();
    });

    menuPop.appendChild(menuEditCat);
    menuPop.appendChild(menuDel);

    menuBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var wasOpen = openRowMenu === menuPop;
      closeOpenRowMenu();
      if (!wasOpen) {
        positionRowMenu(menuBtn, menuPop);
        row.classList.add('row-menu-open');
        menuPop.classList.remove('hidden');
        openRowMenu = menuPop;
        openRowMenuRow = row;
      }
    });

    nameEl.addEventListener('input', function () {
      it.name = nameEl.textContent;
      window.AppStorage.saveState(window.AppStorage.getState());
    });
    descEl.addEventListener('input', function () {
      it.desc = descEl.textContent;
      window.AppStorage.saveState(window.AppStorage.getState());
    });
    weightInp.addEventListener('input', function () {
      var w = parseFloat(weightInp.value);
      it.weight = isNaN(w) || w < 0 ? 0 : w;
      window.AppStorage.saveState(window.AppStorage.getState());
      renderCarryBar();
    });
    valueInp.addEventListener('input', function () {
      var v = parseFloat(valueInp.value);
      it.value = isNaN(v) || v < 0 ? 0 : v;
      window.AppStorage.saveState(window.AppStorage.getState());
    });

    row.appendChild(main);
    row.appendChild(qtyWrap);
    row.appendChild(menuBtn);
    row.appendChild(menuPop);
    return row;
  }

  function renderItemList(containerId, arr, namePh, descPh, defaultKind, listState) {
    var list = document.getElementById(containerId);
    if (!list) {
      return;
    }
    arr.forEach(function (it) {
      ensureItemDefaults(it, defaultKind);
    });

    var search = listState.search;
    var filterKind = listState.filterKind;
    var filtered = [];
    arr.forEach(function (it, i) {
      if (filterKind !== 'all' && it.kind !== filterKind) {
        return;
      }
      if (search) {
        var hay = (it.name || '').toLowerCase() + ' ' + (it.desc || '').toLowerCase();
        if (hay.indexOf(search) === -1) {
          return;
        }
      }
      filtered.push({ it: it, i: i });
    });

    list.innerHTML = '';

    if (filterKind === 'all' && search === '') {
      // Nessun filtro attivo: raggruppa per categoria seguendo KIND_ORDER.
      KIND_ORDER.forEach(function (kind) {
        var group = filtered.filter(function (e) { return e.it.kind === kind; });
        if (group.length === 0) {
          return;
        }
        var head = document.createElement('div');
        head.className = 'loot-group-head';
        head.textContent = ITEM_KINDS[kind].icon + ' ' + ITEM_KINDS[kind].label + ' · ' + group.length;
        list.appendChild(head);
        group.forEach(function (e) {
          list.appendChild(buildItemRow(e.it, e.i, arr, namePh, descPh));
        });
      });
    } else {
      // Ricerca o filtro categoria attivi: lista piatta, senza header.
      filtered.forEach(function (e) {
        list.appendChild(buildItemRow(e.it, e.i, arr, namePh, descPh));
      });
    }

    renderCarryBar();
  }

  function renderFilterChips(containerId, arr, listState, onChange) {
    var wrap = document.getElementById(containerId);
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    var present = {};
    arr.forEach(function (it) {
      present[it.kind] = true;
    });
    var kinds = ['all'].concat(KIND_ORDER.filter(function (k) { return present[k]; }));
    kinds.forEach(function (k) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'loot-filter-chip' + (listState.filterKind === k ? ' active' : '');
      chip.textContent = k === 'all' ? 'Tutti' : (ITEM_KINDS[k].icon + ' ' + ITEM_KINDS[k].label);
      chip.addEventListener('click', function () {
        listState.filterKind = k;
        onChange();
      });
      wrap.appendChild(chip);
    });
  }

  function renderPartyList() {
    var s = window.AppStorage.getState();
    renderFilterChips('party-filters', s.treasury.partyItems, partyListState, renderPartyList);
    renderItemList('party-list', s.treasury.partyItems, 'Nome oggetto', 'Descrizione / valore', 'oggetto', partyListState);
  }

  function renderPersonalList() {
    var s = window.AppStorage.getState();
    renderFilterChips('personal-filters', s.treasury.personalItems, personalListState, renderPersonalList);
    renderItemList('personal-list', s.treasury.personalItems, 'Nome pozione', 'Effetto / note', 'pozione', personalListState);
  }

  function bindLootToolbars() {
    var partySearch = document.getElementById('party-search');
    if (partySearch && !partySearch._bound) {
      partySearch._bound = true;
      partySearch.addEventListener('input', function () {
        partyListState.search = partySearch.value.toLowerCase().trim();
        renderPartyList();
      });
    }
    var personalSearch = document.getElementById('personal-search');
    if (personalSearch && !personalSearch._bound) {
      personalSearch._bound = true;
      personalSearch.addEventListener('input', function () {
        personalListState.search = personalSearch.value.toLowerCase().trim();
        renderPersonalList();
      });
    }
  }

  function pushNewItem(item) {
    var s = window.AppStorage.getState();
    if (itemAddTarget === 'personal') {
      s.treasury.personalItems.push(item);
    } else {
      s.treasury.partyItems.push(item);
    }
    window.AppStorage.saveState(s);
    render();
  }

  /* Peso di una manciata di monete di un solo taglio: stessa formula di
     coinWeightKg (50 monete ≈ 0,4536 kg), qui su un conteggio singolo
     invece che sull'oggetto {mp,mo,ma,mr} della Cassa Comune. */
  function coinLumpWeight(qty) {
    return Math.round(qty / 50 * 0.4536 * 10) / 10;
  }

  /* Modale "Aggiungi oggetto" (Zaino e Bottino Party, Step: griglia di 11
     categorie al posto dei 3 bottoni impilati, un form generico condiviso
     al posto di due form quasi identici per pozione/oggetto — il denaro
     resta con selettore moneta e peso calcolato in automatico). Lo stesso
     modale, in "modalità modifica categoria" (itemEditingItem valorizzato),
     serve anche a cambiare la categoria di una riga già esistente: in quel
     caso mostra solo lo step di scelta e non apre mai un form. */
  var itemAddTarget = 'personal';
  var itemAddCoin = 'mo';
  var currentGenericKind = null;
  var itemEditingItem = null;

  var GENERIC_KIND_CONFIG = {
    pozione: { title: '🧪 Nuova pozione', addLabel: 'Aggiungi pozione', nomeLabel: 'Nome pozione', nomePh: 'Pozione di Cura', notaLabel: 'Effetto / note', notaPh: 'Recupera 2d4+2 PF' },
    magico: { title: '✨ Nuovo oggetto magico', addLabel: 'Aggiungi oggetto magico', nomeLabel: 'Nome oggetto', nomePh: 'Anello di Protezione', notaLabel: 'Proprietà / effetto', notaPh: '+1 CA, non identificato' },
    arma: { title: '⚔️ Nuova arma', addLabel: 'Aggiungi arma', nomeLabel: 'Nome arma', nomePh: 'Ascia bipenne nanica', notaLabel: 'Danno / note', notaPh: '1d12 tagliente, +1' },
    armatura: { title: '🛡️ Nuova armatura', addLabel: 'Aggiungi armatura', nomeLabel: 'Nome armatura', nomePh: 'Corazza di piastre', notaLabel: 'CA / note', notaPh: 'CA 18, pesante' },
    tesoro: { title: '💎 Nuovo gioiello/tesoro', addLabel: 'Aggiungi tesoro', nomeLabel: 'Nome', nomePh: 'Collana di giada intagliata', notaLabel: 'Descrizione', notaPh: 'Sembra preziosa' },
    pergamena: { title: '📜 Nuova pergamena', addLabel: 'Aggiungi pergamena', nomeLabel: 'Nome', nomePh: 'Pergamena di Individuazione', notaLabel: 'Incantesimo / effetto', notaPh: '2° livello, un uso' },
    attrezzo: { title: '🔧 Nuovo attrezzo', addLabel: 'Aggiungi attrezzo', nomeLabel: 'Nome', nomePh: 'Grimaldelli', notaLabel: 'Uso / note', notaPh: 'Servono per scassinare' },
    munizioni: { title: '🏹 Nuove munizioni', addLabel: 'Aggiungi munizioni', nomeLabel: 'Nome', nomePh: 'Frecce', notaLabel: 'Note', notaPh: '' },
    cibo: { title: '🍖 Nuovo cibo/provviste', addLabel: 'Aggiungi cibo', nomeLabel: 'Nome', nomePh: 'Razioni da viaggio', notaLabel: 'Note', notaPh: 'Durano 1 settimana' },
    oggetto: { title: '📦 Nuovo oggetto (Varie)', addLabel: 'Aggiungi oggetto', nomeLabel: 'Nome oggetto', nomePh: 'Torcia', notaLabel: 'Descrizione', notaPh: 'Dura 1 ora' }
  };

  function itemAddEls() {
    return {
      modal: document.getElementById('item-add-modal'),
      stepChoice: document.getElementById('item-add-step-choice'),
      stepGeneric: document.getElementById('item-add-step-generic'),
      stepDenaro: document.getElementById('item-add-step-denaro')
    };
  }

  function showItemAddStep(step) {
    var e = itemAddEls();
    [e.stepChoice, e.stepGeneric, e.stepDenaro].forEach(function (s) {
      if (s) {
        s.classList.toggle('hidden', s !== step);
      }
    });
  }

  function configureGenericStep(kind) {
    var cfg = GENERIC_KIND_CONFIG[kind];
    if (!cfg) {
      return;
    }
    currentGenericKind = kind;
    var title = document.getElementById('ia-gen-title');
    var nomeLabel = document.getElementById('ia-gen-nome-label');
    var nomeInp = document.getElementById('ia-gen-nome');
    var notaLabel = document.getElementById('ia-gen-nota-label');
    var notaInp = document.getElementById('ia-gen-nota');
    var addBtn = document.getElementById('ia-gen-add');
    if (title) { title.textContent = cfg.title; }
    if (nomeLabel) { nomeLabel.textContent = cfg.nomeLabel; }
    if (nomeInp) { nomeInp.placeholder = cfg.nomePh; }
    if (notaLabel) { notaLabel.textContent = cfg.notaLabel; }
    if (notaInp) { notaInp.placeholder = cfg.notaPh; }
    if (addBtn) { addBtn.textContent = cfg.addLabel; }
  }

  function selectItemCatCell(kind) {
    document.querySelectorAll('.item-cat-cell').forEach(function (cell) {
      cell.classList.toggle('sel', cell.getAttribute('data-kind') === kind);
    });
  }

  function openItemEditCategory(item) {
    var e = itemAddEls();
    if (!e.modal) {
      return;
    }
    itemEditingItem = { item: item };
    var title = document.getElementById('item-add-choice-title');
    if (title) {
      title.textContent = 'Cambia categoria';
    }
    selectItemCatCell(item.kind);
    showItemAddStep(e.stepChoice);
    e.modal.classList.remove('hidden');
  }

  function updateItemAddCoinSel() {
    var wrap = document.getElementById('ia-den-coin-sel');
    if (!wrap) {
      return;
    }
    wrap.querySelectorAll('.coin-sel-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-coin') === itemAddCoin);
    });
  }

  function updateDenaroWeightHint() {
    var qtyInp = document.getElementById('ia-den-qty');
    var hint = document.getElementById('ia-den-weight-hint');
    if (!qtyInp || !hint) {
      return;
    }
    var qty = Math.max(0, parseInt(qtyInp.value, 10) || 0);
    hint.textContent = 'Peso stimato: ≈ ' + coinLumpWeight(qty).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg';
  }

  function resetItemAddForms() {
    ['ia-gen-nome', 'ia-gen-nota'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.value = '';
      }
    });
    var qtyEl = document.getElementById('ia-gen-qty');
    if (qtyEl) {
      qtyEl.value = 1;
    }
    var pesoEl = document.getElementById('ia-gen-peso');
    if (pesoEl) {
      pesoEl.value = 0.5;
    }
    var valoreEl = document.getElementById('ia-gen-valore');
    if (valoreEl) {
      valoreEl.value = 0;
    }
    var denQty = document.getElementById('ia-den-qty');
    if (denQty) {
      denQty.value = 1;
    }
    itemAddCoin = 'mo';
    updateItemAddCoinSel();
    updateDenaroWeightHint();
  }

  function openItemAddModal(target) {
    var e = itemAddEls();
    if (!e.modal) {
      return;
    }
    itemAddTarget = target;
    itemEditingItem = null;
    var title = document.getElementById('item-add-choice-title');
    if (title) {
      title.textContent = 'Cosa aggiungi?';
    }
    selectItemCatCell(null);
    resetItemAddForms();
    showItemAddStep(e.stepChoice);
    e.modal.classList.remove('hidden');
  }

  function closeItemAddModal() {
    var modal = document.getElementById('item-add-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    itemEditingItem = null;
  }

  function bindItemAddModal() {
    var e = itemAddEls();
    if (!e.modal || e.modal._bound) {
      return;
    }
    e.modal._bound = true;

    e.modal.querySelectorAll('.item-cat-cell').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-kind');
        if (itemEditingItem) {
          // Modalità "cambia categoria" di una riga esistente: nessun form,
          // si applica subito la nuova categoria e si chiude il modale.
          itemEditingItem.item.kind = kind;
          window.AppStorage.saveState(window.AppStorage.getState());
          itemEditingItem = null;
          closeItemAddModal();
          render();
          return;
        }
        if (kind === 'denaro') {
          showItemAddStep(e.stepDenaro);
        } else {
          configureGenericStep(kind);
          showItemAddStep(e.stepGeneric);
        }
      });
    });
    e.modal.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showItemAddStep(e.stepChoice);
      });
    });
    e.modal.querySelectorAll('.sheet-close').forEach(function (btn) {
      btn.addEventListener('click', closeItemAddModal);
    });
    e.modal.addEventListener('click', function (ev) {
      if (ev.target === e.modal) {
        closeItemAddModal();
      }
    });

    document.getElementById('ia-gen-add').addEventListener('click', function () {
      var cfg = GENERIC_KIND_CONFIG[currentGenericKind] || GENERIC_KIND_CONFIG.oggetto;
      var nome = document.getElementById('ia-gen-nome').value.trim() || cfg.nomePh;
      var nota = document.getElementById('ia-gen-nota').value.trim();
      var qty = Math.max(1, parseInt(document.getElementById('ia-gen-qty').value, 10) || 1);
      var peso = Math.max(0, parseFloat(document.getElementById('ia-gen-peso').value) || 0);
      var valore = Math.max(0, parseFloat(document.getElementById('ia-gen-valore').value) || 0);
      pushNewItem({ name: nome, desc: nota, qty: qty, weight: peso, value: valore, kind: currentGenericKind });
      closeItemAddModal();
    });

    document.getElementById('ia-den-qty').addEventListener('input', updateDenaroWeightHint);
    document.getElementById('ia-den-coin-sel').querySelectorAll('.coin-sel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        itemAddCoin = btn.getAttribute('data-coin');
        updateItemAddCoinSel();
      });
    });
    document.getElementById('ia-den-add').addEventListener('click', function () {
      var qty = Math.max(1, parseInt(document.getElementById('ia-den-qty').value, 10) || 1);
      var weight = coinLumpWeight(qty);
      pushNewItem({
        name: fmt(qty) + ' Monete ' + COIN_FULL_LABELS[itemAddCoin],
        desc: '',
        qty: 1,
        weight: weight,
        kind: 'denaro'
      });
      closeItemAddModal();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !e.modal.classList.contains('hidden')) {
        closeItemAddModal();
      }
    });
  }

  function render() {
    openRowMenu = null;
    openRowMenuRow = null;
    bindLootToolbars();
    renderPartyList();
    renderPersonalList();
    bindCoins();
    renderCoins();
  }

  /* Modale unico Aggiungi/Togli monete (Step: stesso linguaggio del modale
     Danno/Cura dei PF in sheet.js — riusa le classi .hp-modal* così lo stile
     arriva gratis da combat.css, cambia solo l'accento colore via
     [data-mode="coin-add"/"coin-sub"]). Un solo punto d'ingresso con
     selettore MP/MO/MA/MR dentro, invece di 4 popup separati. */
  var COIN_KEYS = ['mp', 'mo', 'ma', 'mr'];
  var coinModalMode = 'add';
  var coinModalKind = 'mo';

  function coinModalEls() {
    return {
      modal: document.getElementById('coin-modal'),
      sel: document.getElementById('coin-modal-sel'),
      input: document.getElementById('coin-modal-input'),
      cur: document.getElementById('coin-modal-cur'),
      next: document.getElementById('coin-modal-next'),
      titletext: document.getElementById('coin-modal-titletext'),
      apply: document.getElementById('coin-modal-apply'),
      close: document.getElementById('coin-modal-close')
    };
  }

  function updateCoinModalPreview() {
    var e = coinModalEls();
    if (!e.modal) {
      return;
    }
    var state = window.AppStorage.getState();
    var cur = state.coins[coinModalKind] || 0;
    var n = Math.max(0, parseInt(e.input.value, 10) || 0);
    e.cur.textContent = fmt(cur);
    e.next.textContent = fmt(coinModalMode === 'add' ? cur + n : Math.max(0, cur - n));
  }

  function selectCoinKind(k) {
    coinModalKind = k;
    var e = coinModalEls();
    if (!e.sel) {
      return;
    }
    e.sel.querySelectorAll('.coin-sel-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-coin') === k);
    });
    updateCoinModalPreview();
  }

  function openCoinModal(mode) {
    var e = coinModalEls();
    if (!e.modal) {
      return;
    }
    coinModalMode = mode;
    e.modal.setAttribute('data-mode', mode === 'add' ? 'coin-add' : 'coin-sub');
    e.titletext.textContent = mode === 'add' ? 'Aggiungi monete' : 'Togli monete';
    e.apply.textContent = mode === 'add' ? 'Aggiungi' : 'Togli';
    e.input.value = '';
    selectCoinKind(coinModalKind);
    updateCoinModalPreview();
    e.modal.classList.remove('hidden');
    setTimeout(function () { e.input.focus(); }, 60);
  }

  function closeCoinModal() {
    var modal = document.getElementById('coin-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function applyCoinModal() {
    var e = coinModalEls();
    var n = Math.max(0, parseInt(e.input.value, 10) || 0);
    if (n > 0) {
      var s = window.AppStorage.getState();
      var cur = s.coins[coinModalKind] || 0;
      s.coins[coinModalKind] = coinModalMode === 'add' ? cur + n : Math.max(0, cur - n);
      window.AppStorage.saveState(s);
      renderCoins();
    }
    closeCoinModal();
  }

  function bindCoinModal() {
    var addOpen = document.getElementById('coin-add-open');
    var subOpen = document.getElementById('coin-sub-open');
    if (addOpen && !addOpen._bound) {
      addOpen._bound = true;
      addOpen.addEventListener('click', function () { openCoinModal('add'); });
    }
    if (subOpen && !subOpen._bound) {
      subOpen._bound = true;
      subOpen.addEventListener('click', function () { openCoinModal('sub'); });
    }

    var e = coinModalEls();
    if (!e.modal || e.modal._bound) {
      return;
    }
    e.modal._bound = true;
    e.modal.addEventListener('click', function (ev) {
      if (ev.target === e.modal) {
        closeCoinModal();
      }
    });
    e.close.addEventListener('click', closeCoinModal);
    e.input.addEventListener('input', updateCoinModalPreview);
    e.apply.addEventListener('click', applyCoinModal);
    e.sel.querySelectorAll('.coin-sel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectCoinKind(btn.getAttribute('data-coin'));
      });
    });
    e.modal.querySelectorAll('.hp-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var add = parseInt(chip.getAttribute('data-add'), 10);
        e.input.value = (parseInt(e.input.value, 10) || 0) + add;
        updateCoinModalPreview();
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !e.modal.classList.contains('hidden')) {
        closeCoinModal();
      }
    });
  }

  function bindRelicAccordions() {
    document.querySelectorAll('.relic-acc-head').forEach(function (head) {
      if (head._bound) {
        return;
      }
      head._bound = true;
      head.addEventListener('click', function () {
        var acc = head.parentElement;
        var open = acc.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function init() {
    render();
    bindRelicAccordions();
    bindCoinModal();
    bindItemAddModal();
    bindRowMenuDismiss();
  }

  window.AppTreasury = {
    init: init,
    render: render,
    openItemAddModal: openItemAddModal,
    renderCarryBar: renderCarryBar,
    computeCarryBreakdown: computeCarryBreakdown
  };
})();
