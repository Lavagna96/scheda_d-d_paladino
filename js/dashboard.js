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
      if (window.AppCloud && window.AppCloud.deleteCharacter) {
        window.AppCloud.deleteCharacter(item.id);
      }
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
      // swipe successivo continua da dov'è, non salta.
      var base = wrap.classList.contains('open') ? -REVEAL_WIDTH : 0;
      dx = Math.max(-REVEAL_WIDTH, Math.min(0, base + deltaX));
      inner.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: false });

    function settle() {
      var wasDragging = dragging;
      tracking = false;
      inner.style.transition = '';
      inner.style.transform = '';
      if (!wasDragging) {
        return;
      }
      dragging = false;
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
    // Mostra l'icona della vista in cui si andrebbe cliccando, non quella
    // corrente (pattern comune per i toggle a icona singola).
    btn.textContent = currentLayout() === 'list' ? '▦' : '☰';
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

  var layoutBtn = document.getElementById('dash-layout-toggle');
  if (layoutBtn) {
    layoutBtn.addEventListener('click', toggleLayout);
  }

  window.AppDashboard = {
    render: render,
    showError: showError
  };
})();
