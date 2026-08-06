(function () {
  function fmt(n) {
    return n.toLocaleString('it-IT');
  }

  /* Categoria per riga di Zaino/Bottino Party (Step: chip categoria invece di
     due schede separate "solo pozioni"/"solo oggetti generici" — un tap sul
     chip fa scorrere le 3 categorie, così qualunque riga può diventare
     pozione, oggetto o denaro senza cambiare form). */
  var ITEM_KINDS = {
    pozione: { icon: '🧪', label: 'Pozione' },
    oggetto: { icon: '🎒', label: 'Oggetto' },
    denaro: { icon: '💰', label: 'Denaro' }
  };
  var KIND_ORDER = ['pozione', 'oggetto', 'denaro'];
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

  function renderItemList(containerId, arr, namePh, descPh, defaultKind) {
    var list = document.getElementById(containerId);
    if (!list) {
      return;
    }
    list.innerHTML = '';
    arr.forEach(function (it, i) {
      if (it.qty == null) {
        it.qty = 1;
      }
      if (it.weight == null) {
        it.weight = 0.5;
      }
      if (!it.kind || !ITEM_KINDS[it.kind]) {
        it.kind = defaultKind;
      }
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
      var kindPill = document.createElement('button');
      kindPill.type = 'button';
      kindPill.className = 'cat-pill';
      kindPill.setAttribute('aria-label', 'Cambia categoria');
      function renderKindPill() {
        var k = ITEM_KINDS[it.kind];
        kindPill.textContent = k.icon + ' ' + k.label;
      }
      renderKindPill();
      kindPill.addEventListener('click', function () {
        var idx = KIND_ORDER.indexOf(it.kind);
        it.kind = KIND_ORDER[(idx + 1) % KIND_ORDER.length];
        renderKindPill();
        window.AppStorage.saveState(window.AppStorage.getState());
      });
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

      var del = document.createElement('button');
      del.className = 'edit-del';
      del.type = 'button';
      del.innerHTML = '✕';
      del.setAttribute('aria-label', 'Elimina');
      del.addEventListener('click', function () {
        arr.splice(i, 1);
        window.AppStorage.saveState(window.AppStorage.getState());
        render();
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

      row.appendChild(main);
      row.appendChild(qtyWrap);
      row.appendChild(del);
      list.appendChild(row);
    });
    renderCarryBar();
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

  /* Modale "Aggiungi oggetto" (Zaino e Bottino Party, Step: popup di scelta
     categoria + form dedicato invece della riga vuota generica — le pozioni
     hanno il loro form, il denaro il suo con selettore moneta e peso
     calcolato in automatico, l'oggetto resta il form generico di prima). */
  var itemAddTarget = 'personal';
  var itemAddCoin = 'mo';

  function itemAddEls() {
    return {
      modal: document.getElementById('item-add-modal'),
      stepChoice: document.getElementById('item-add-step-choice'),
      stepPozione: document.getElementById('item-add-step-pozione'),
      stepOggetto: document.getElementById('item-add-step-oggetto'),
      stepDenaro: document.getElementById('item-add-step-denaro')
    };
  }

  function showItemAddStep(step) {
    var e = itemAddEls();
    [e.stepChoice, e.stepPozione, e.stepOggetto, e.stepDenaro].forEach(function (s) {
      if (s) {
        s.classList.toggle('hidden', s !== step);
      }
    });
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
    ['ia-poz-nome', 'ia-poz-effetto', 'ia-ogg-nome', 'ia-ogg-desc'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.value = '';
      }
    });
    ['ia-poz-qty', 'ia-ogg-qty', 'ia-den-qty'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.value = 1;
      }
    });
    ['ia-poz-peso', 'ia-ogg-peso'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.value = 0.5;
      }
    });
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
    resetItemAddForms();
    showItemAddStep(e.stepChoice);
    e.modal.classList.remove('hidden');
  }

  function closeItemAddModal() {
    var modal = document.getElementById('item-add-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function bindItemAddModal() {
    var e = itemAddEls();
    if (!e.modal || e.modal._bound) {
      return;
    }
    e.modal._bound = true;

    e.modal.querySelectorAll('.item-choice-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-kind');
        if (kind === 'pozione') {
          showItemAddStep(e.stepPozione);
        } else if (kind === 'oggetto') {
          showItemAddStep(e.stepOggetto);
        } else if (kind === 'denaro') {
          showItemAddStep(e.stepDenaro);
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

    document.getElementById('ia-poz-add').addEventListener('click', function () {
      var nome = document.getElementById('ia-poz-nome').value.trim() || 'Pozione di Cura';
      var effetto = document.getElementById('ia-poz-effetto').value.trim();
      var qty = Math.max(1, parseInt(document.getElementById('ia-poz-qty').value, 10) || 1);
      var peso = Math.max(0, parseFloat(document.getElementById('ia-poz-peso').value) || 0);
      pushNewItem({ name: nome, desc: effetto, qty: qty, weight: peso, kind: 'pozione' });
      closeItemAddModal();
    });

    document.getElementById('ia-ogg-add').addEventListener('click', function () {
      var nome = document.getElementById('ia-ogg-nome').value.trim() || 'Oggetto';
      var desc = document.getElementById('ia-ogg-desc').value.trim();
      var qty = Math.max(1, parseInt(document.getElementById('ia-ogg-qty').value, 10) || 1);
      var peso = Math.max(0, parseFloat(document.getElementById('ia-ogg-peso').value) || 0);
      pushNewItem({ name: nome, desc: desc, qty: qty, weight: peso, kind: 'oggetto' });
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
    var s = window.AppStorage.getState();
    renderItemList('party-list', s.treasury.partyItems, 'Nome oggetto', 'Descrizione / valore', 'oggetto');
    renderItemList('personal-list', s.treasury.personalItems, 'Nome pozione', 'Effetto / note', 'pozione');
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
  }

  window.AppTreasury = {
    init: init,
    render: render,
    openItemAddModal: openItemAddModal,
    renderCarryBar: renderCarryBar,
    computeCarryBreakdown: computeCarryBreakdown
  };
})();
