(function () {
  /*
   * Dashboard multi-personaggio (Fase 2): lista dei personaggi dell'utente,
   * una card per ciascuno (ritratto o emblema di riserva), tap per entrare
   * nella scheda. Lo slot "Nuovo personaggio" apre il wizard di creazione
   * (js/create.js, Fase 5 Blocco 5.B). Popolata da js/cloud.js via
   * render(items, onSelect).
   *
   * Swipe-to-delete + toggle griglia/righe: ogni riga (card o row) vive
   * dentro un wrapper .dash-swipe con un pulsante Elimina rivelato dallo
   * swipe (vedi buildSwipeItem); il layout attivo (griglia o righe) è una
   * preferenza solo-locale (localStorage), non un dato di gioco da
   * sincronizzare col cloud.
   */

  var REVEAL_WIDTH = 84; // larghezza del pulsante Elimina, px — stesso valore nel CSS
  var DISMISS_THRESHOLD = Math.round(REVEAL_WIDTH * 1.55); // ~130px: swipe oltre → elimina (stile Gmail)
  var LAYOUT_KEY = 'app-dashboard-layout';

  // Ultimi items/onSelect ricevuti da loadDashboard (js/cloud.js): servono
  // per ridisegnare la lista quando si cambia layout, dato che il toggle non
  // ha una sua fonte dati.
  var lastItems = null;
  var lastOnSelect = null;

  // Wrapper .dash-swipe attualmente aperto (rivelato): solo uno alla volta.
  var openSwipeWrap = null;

  function classLine(item) {
    return [item.className, item.subclassName, item.speciesLabel]
      .filter(function (v) { return !!v; })
      .join(' · ');
  }

  function currentLayout() {
    return localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'grid';
  }

  /* ---------- card (layout griglia, invariata nell'aspetto) ---------- */

  function buildCard(item) {
    var card = document.createElement('div');
    card.className = 'dash-card' + (item.portrait ? '' : ' no-portrait');
    if (item.portrait) {
      card.style.backgroundImage = 'url(' + item.portrait + ')';
    }

    var lvl = document.createElement('div');
    lvl.className = 'dash-lvl';
    lvl.textContent = 'Lv. ' + (item.level || 1);
    card.appendChild(lvl);

    if (!item.portrait) {
      var emblem = document.createElement('div');
      emblem.className = 'dash-emblem';
      emblem.textContent = item.avatar || '✦';
      card.appendChild(emblem);
    }

    var foot = document.createElement('div');
    foot.className = 'dash-foot';

    var name = document.createElement('div');
    name.className = 'dash-name';
    name.textContent = item.name || 'Senza nome';
    foot.appendChild(name);

    var line = document.createElement('div');
    line.className = 'dash-line';
    line.textContent = classLine(item);
    foot.appendChild(line);

    var enter = document.createElement('button');
    enter.type = 'button';
    enter.className = 'dash-enter';
    enter.textContent = 'Entra';
    foot.appendChild(enter);

    card.appendChild(foot);

    return card;
  }

  /* ---------- riga (layout compatto) ---------- */

  function buildRow(item) {
    var row = document.createElement('div');
    row.className = 'dash-row';

    var thumb = document.createElement('div');
    thumb.className = 'dash-row-thumb' + (item.portrait ? '' : ' no-portrait');
    if (item.portrait) {
      thumb.style.backgroundImage = 'url(' + item.portrait + ')';
    } else {
      thumb.textContent = item.avatar || '✦';
    }
    row.appendChild(thumb);

    var info = document.createElement('div');
    info.className = 'dash-row-info';
    var name = document.createElement('div');
    name.className = 'dash-row-name';
    name.textContent = item.name || 'Senza nome';
    info.appendChild(name);
    var line = document.createElement('div');
    line.className = 'dash-row-line';
    line.textContent = classLine(item);
    info.appendChild(line);
    row.appendChild(info);

    var lvl = document.createElement('div');
    lvl.className = 'dash-row-lvl';
    lvl.textContent = 'Lv. ' + (item.level || 1);
    row.appendChild(lvl);

    return row;
  }

  /* ---------- swipe-to-delete ---------- */

  function closeSwipe(wrap) {
    if (wrap) {
      wrap.classList.remove('open');
    }
    if (openSwipeWrap === wrap) {
      openSwipeWrap = null;
    }
  }

  function openSwipe(wrap) {
    if (openSwipeWrap && openSwipeWrap !== wrap) {
      closeSwipe(openSwipeWrap);
    }
    wrap.classList.add('open');
    openSwipeWrap = wrap;
  }

  function deleteCharacter(item) {
    if (window.AppCloud && window.AppCloud.deleteCharacter) {
      window.AppCloud.deleteCharacter(item.id);
    }
  }

  // Swipe lungo oltre DISMISS_THRESHOLD: anima l'uscita e elimina senza conferma
  // (il gesto vale come conferma, come in Gmail).
  function dismissSwipeItem(wrap, item, inner) {
    if (openSwipeWrap === wrap) {
      openSwipeWrap = null;
    }
    wrap.classList.add('dismissing');
    inner.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
    inner.style.transform = 'translateX(-' + wrap.offsetWidth + 'px)';
    inner.style.opacity = '0';
    window.setTimeout(function () {
      deleteCharacter(item);
    }, 240);
  }

  // Avvolge `inner` (una .dash-card o una .dash-row) in un wrapper .dash-swipe
  // con dietro un pulsante Elimina: swipe a sinistra per rivelarlo (stile
  // iOS). La discriminazione fra scroll verticale e swipe orizzontale ricalca
  // quella di js/app.js (righe ~632-660, cambio tab), ma scritta da zero: qui
  // serve trascinare un solo elemento, non animare un carosello di pannelli.
  function buildSwipeItem(item, onSelect, inner) {
    var wrap = document.createElement('div');
    wrap.className = 'dash-swipe';

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'dash-delete';
    del.textContent = 'Elimina';
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!confirm('Eliminare "' + (item.name || 'Senza nome') + '"? L\'azione non si può annullare.')) {
        return;
      }
      deleteCharacter(item);
    });
    wrap.appendChild(del);
    wrap.appendChild(inner);

    var startX = 0, startY = 0, dx = 0, tracking = false, dragging = false, moved = false;

    inner.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dx = 0;
      tracking = true;
      dragging = false;
      moved = false;
      inner.style.transition = 'none';
    }, { passive: true });

    inner.addEventListener('touchmove', function (e) {
      if (!tracking) {
        return;
      }
      var deltaX = e.touches[0].clientX - startX;
      var deltaY = e.touches[0].clientY - startY;
      if (!dragging) {
        if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
          tracking = false; // gesto verticale: lascia scorrere la pagina

          return;
        }
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          dragging = true;
          moved = true;
        } else {
          return;
        }
      }
      if (e.cancelable) {
        e.preventDefault();
      }
      // Se la riga era già aperta si parte da -REVEAL_WIDTH, non da 0: lo
      // swipe successivo continua da dov'è, non salta. Oltre REVEAL_WIDTH si
      // può trascinare fino a ~85% della larghezza (poi settle → elimina).
      var base = wrap.classList.contains('open') ? -REVEAL_WIDTH : 0;
      var maxDrag = -Math.round(wrap.offsetWidth * 0.85);
      dx = Math.max(maxDrag, Math.min(0, base + deltaX));
      inner.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: false });

    function settle() {
      var wasDragging = dragging;
      tracking = false;
      if (!wasDragging) {
        return;
      }
      dragging = false;
      if (dx <= -DISMISS_THRESHOLD) {
        dismissSwipeItem(wrap, item, inner);

        return;
      }
      inner.style.transition = '';
      inner.style.transform = '';
      if (dx <= -REVEAL_WIDTH / 2) {
        openSwipe(wrap);
      } else {
        closeSwipe(wrap);
      }
      /* Evita che il tap post-swipe resti bloccato da moved === true. */
      window.setTimeout(function () {
        moved = false;
      }, 320);
    }

    inner.addEventListener('touchend', settle);
    inner.addEventListener('touchcancel', settle);

    inner.addEventListener('click', function () {
      if (moved) {
        // Click "fantasma" alla fine di uno swipe, non un vero tap: ignoralo.
        moved = false;

        return;
      }
      if (wrap.classList.contains('open')) {
        closeSwipe(wrap);

        return;
      }
      onSelect(item.id);
    });

    return wrap;
  }

  /* ---------- toggle layout ---------- */

  function updateLayoutToggleIcon() {
    var btn = document.getElementById('dash-layout-toggle');
    if (!btn) {
      return;
    }
    // Etichetta testuale oltre al glifo: mostra la vista in cui si andrebbe
    // cliccando (non quella corrente), così il pulsante spiega da solo a
    // cosa serve invece di essere un'icona isolata poco chiara.
    btn.textContent = currentLayout() === 'list' ? '▦ Griglia' : '▤ Elenco';
  }

  function toggleLayout() {
    localStorage.setItem(LAYOUT_KEY, currentLayout() === 'list' ? 'grid' : 'list');
    render(lastItems, lastOnSelect);
  }

  /* ---------- render ---------- */

  function render(items, onSelect) {
    lastItems = items;
    lastOnSelect = onSelect;
    openSwipeWrap = null; // nuova lista: niente riga rimasta a metà swipe

    var list = document.getElementById('dash-list');
    if (!list) {
      return;
    }
    var mode = currentLayout();
    list.classList.toggle('mode-list', mode === 'list');
    list.innerHTML = '';
    (items || []).forEach(function (item) {
      var inner = mode === 'list' ? buildRow(item) : buildCard(item);
      list.appendChild(buildSwipeItem(item, onSelect, inner));
    });

    var slot = document.createElement('div');
    slot.className = 'dash-slot dash-slot-clickable';
    slot.textContent = '✦ Nuovo personaggio';
    slot.addEventListener('click', function () {
      if (window.AppCreate) {
        window.AppCreate.open();
      }
    });
    list.appendChild(slot);

    updateLayoutToggleIcon();
  }

  function showError(msg) {
    var el = document.getElementById('dash-error');
    if (!el) {
      return;
    }
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  /* Entra nel personaggio scelto SENZA reload: cambia la chiave attiva,
     mostra la scheda al posto della dashboard e la ridisegna da capo con i
     suoi dati (js/app.js). Se il cloud è attivo, riaggancia anche
     l'ascolto Firestore al documento del nuovo personaggio. */
  function selectCharacter(id) {
    window.AppStorage.switchActiveCharacter(id);
    document.body.classList.remove('in-dashboard');
    if (window.App && window.App.enterCharacterView) {
      window.App.enterCharacterView();
    }
    if (window.AppCloud && window.AppCloud.watchActiveCharacter) {
      window.AppCloud.watchActiveCharacter();
    }
  }

  /* Avvio senza personaggio attivo: mostra la dashboard (anche in solo-locale). */
  function bootShell() {
    if (document.body.classList.contains('auth-out') ||
        document.body.classList.contains('auth-checking') ||
        document.body.classList.contains('auth-locked')) {
      return;
    }
    if (sessionStorage.getItem('app-skip-dashboard') === '1') {
      sessionStorage.removeItem('app-skip-dashboard');
      if (window.AppStorage && window.AppStorage.activeCharId && window.AppStorage.activeCharId()) {
        document.body.classList.remove('in-dashboard');

        return;
      }
    }
    document.body.classList.add('in-dashboard');
    var items = window.AppStorage ? window.AppStorage.listCharactersForDashboard() : [];
    render(items, selectCharacter);
  }

  var layoutBtn = document.getElementById('dash-layout-toggle');
  if (layoutBtn) {
    layoutBtn.addEventListener('click', toggleLayout);
  }

  /* ---------- swipe per aprire il menu ---------- */

  // Swipe verso destra in un punto qualunque della dashboard (non solo sulle
  // righe dei personaggi, che gestiscono già il proprio swipe a sinistra per
  // eliminare): apre il menu senza dover toccare l'hamburger. Il gesto delle
  // righe risponde solo a trascinamenti verso sinistra (dx clampato a <= 0 in
  // openSwipe/closeSwipe sopra), quindi qui i due non si accavallano anche
  // se il tocco parte sopra una riga.
  (function bindMenuSwipe() {
    var view = document.getElementById('view-dashboard');
    if (!view) {
      return;
    }
    var EDGE_MENU_DRAG = 130; // px di trascinamento per aprire del tutto il menu
    var startX = 0, startY = 0, tracking = false, dragging = false;

    view.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      dragging = false;
    }, { passive: true });

    view.addEventListener('touchmove', function (e) {
      if (!tracking) {
        return;
      }
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          tracking = false; // gesto verticale: lascia scorrere la lista

          return;
        }
        if (dx > 12 && dx > Math.abs(dy) * 1.2) {
          dragging = true;
        } else {
          return;
        }
      }
      // Il cassetto segue il dito man mano che si trascina, non solo di
      // scatto al rilascio (altrimenti non si capisce se sta succedendo
      // qualcosa).
      if (window.AppMenu) {
        window.AppMenu.dragTo(dx / EDGE_MENU_DRAG);
      }
    }, { passive: true });

    function finish(e) {
      if (!tracking) {
        return;
      }
      tracking = false;
      if (!dragging) {
        return;
      }
      dragging = false;
      var touch = e.changedTouches && e.changedTouches[0];
      var dx = touch ? touch.clientX - startX : 0;
      if (window.AppMenu) {
        window.AppMenu.dragEnd(dx >= EDGE_MENU_DRAG * 0.4);
      }
    }

    view.addEventListener('touchend', finish);
    view.addEventListener('touchcancel', function (e) {
      finish(e);
    });
  })();

  window.AppDashboard = {
    render: render,
    showError: showError,
    selectCharacter: selectCharacter,
    bootShell: bootShell
  };
})();
