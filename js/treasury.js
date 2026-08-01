(function () {
  function fmt(n) {
    return n.toLocaleString('it-IT');
  }

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
        var n = parseInt(inp.value, 10);
        var s = window.AppStorage.getState();
        s.coins[k] = isNaN(n) || n < 0 ? 0 : n;
        window.AppStorage.saveState(s);
        renderCoins();
      });
    });
  }

  function renderItemList(containerId, arr, namePh, descPh) {
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
      var row = document.createElement('div');
      row.className = 'edit-row';
      var main = document.createElement('div');
      main.className = 'edit-main';
      var nameEl = document.createElement('div');
      nameEl.className = 'edit-name';
      nameEl.contentEditable = 'true';
      nameEl.setAttribute('data-ph', namePh);
      nameEl.textContent = it.name || '';
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
      main.appendChild(nameEl);
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

  function addItem(type) {
    var s = window.AppStorage.getState();
    var item = { name: '', desc: '', qty: 1, weight: 0.5 };
    if (type === 'personal') {
      s.treasury.personalItems.push(item);
    } else {
      s.treasury.partyItems.push(item);
    }
    window.AppStorage.saveState(s);
    render();
    var listId = type === 'personal' ? 'personal-list' : 'party-list';
    var rows = document.querySelectorAll('#' + listId + ' .edit-name');
    var last = rows[rows.length - 1];
    if (last) {
      last.focus();
    }
  }

  function render() {
    var s = window.AppStorage.getState();
    renderItemList('party-list', s.treasury.partyItems, 'Nome oggetto', 'Descrizione / valore');
    renderItemList('personal-list', s.treasury.personalItems, 'Nome pozione', 'Effetto / note');
    bindCoins();
    renderCoins();
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
  }

  window.AppTreasury = {
    init: init,
    render: render,
    addItem: addItem,
    renderCarryBar: renderCarryBar,
    computeCarryBreakdown: computeCarryBreakdown
  };
})();
