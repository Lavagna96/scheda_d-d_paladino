(function () {
  // Cassetto (drawer) di navigazione condiviso fra scheda e dashboard: un
  // solo modulo che apre/chiude #app-menu, richiamato sia dall'hamburger
  // in header (js/app.js) sia da quello in dashboard (js/cloud.js). Ogni
  // voce del menu chiude il drawer da sola nel proprio handler applicativo,
  // qui c'è solo l'apertura/chiusura generica.

  function open() {
    var menu = document.getElementById('app-menu');
    var overlay = document.getElementById('app-menu-overlay');
    if (!menu) {
      return;
    }
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  function close() {
    var menu = document.getElementById('app-menu');
    var overlay = document.getElementById('app-menu-overlay');
    if (!menu) {
      return;
    }
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    if (overlay) {
      // "hidden" ha display:none (utility globale): se la aggiungiamo
      // subito la dissolvenza dell'overlay (transition: opacity) non si
      // vede mai. Aspettiamo la durata della transizione prima di nasconderlo.
      setTimeout(function () {
        overlay.classList.add('hidden');
      }, 250);
    }
  }

  function isOpen() {
    var menu = document.getElementById('app-menu');
    return !!menu && menu.classList.contains('open');
  }

  function toggle() {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  }

  /* ---------- trascinamento a mano libera (swipe) ---------- */

  // Durante lo swipe (dashboard o bordo sinistro della scheda) il cassetto
  // segue il dito invece di comparire di scatto solo al rilascio: altrimenti
  // non è chiaro se il gesto sta facendo qualcosa. dragTo si chiama ad ogni
  // touchmove con l'avanzamento 0..1, dragEnd al rilascio per completare
  // l'apertura o tornare indietro con l'animazione CSS normale.
  function dragTo(progress) {
    var menu = document.getElementById('app-menu');
    var overlay = document.getElementById('app-menu-overlay');
    if (!menu) {
      return;
    }
    progress = Math.max(0, Math.min(1, progress));
    menu.style.transition = 'none';
    menu.style.transform = 'translateX(' + (progress - 1) * 100 + '%)';
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.transition = 'none';
      overlay.style.opacity = String(progress);
      overlay.style.pointerEvents = progress > 0 ? 'auto' : 'none';
    }
  }

  function dragEnd(shouldOpen) {
    var menu = document.getElementById('app-menu');
    var overlay = document.getElementById('app-menu-overlay');
    if (!menu) {
      return;
    }
    if (shouldOpen) {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
    } else {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    }
    // Riattiva la transizione CSS e solo DOPO toglie i valori inline del
    // drag: il reflow in mezzo fa sì che l'animazione riparta dalla
    // posizione attuale del dito invece di saltare di scatto.
    menu.style.transition = '';
    void menu.offsetWidth;
    menu.style.transform = '';
    if (overlay) {
      overlay.style.transition = '';
      void overlay.offsetWidth;
      overlay.style.opacity = '';
      overlay.style.pointerEvents = '';
      if (shouldOpen) {
        overlay.classList.remove('hidden');
      } else {
        setTimeout(function () {
          overlay.classList.add('hidden');
        }, 250);
      }
    }
  }

  /* ---------- swipe per chiudere ---------- */

  // Trascinare il cassetto verso sinistra mentre è aperto lo richiude,
  // seguendo il dito come l'apertura. Il tap sui bottoni resta intatto: si
  // aggancia al gesto orizzontale solo se il trascinamento supera la soglia
  // (come le altre swipe del progetto), altrimenti lo scroll verticale della
  // lista voci e il click restano liberi.
  function bindSwipeClose() {
    var menu = document.getElementById('app-menu');
    if (!menu) {
      return;
    }
    var DRAG_DISTANCE = 130;
    var startX = 0, startY = 0, tracking = false, dragging = false;

    menu.addEventListener('touchstart', function (e) {
      if (!isOpen() || e.touches.length !== 1) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      dragging = false;
    }, { passive: true });

    menu.addEventListener('touchmove', function (e) {
      if (!tracking) {
        return;
      }
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          tracking = false; // scroll verticale della lista voci: lascialo fare

          return;
        }
        if (dx < -12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          dragging = true;
        } else {
          return;
        }
      }
      if (e.cancelable) {
        e.preventDefault();
      }
      dragTo(1 + dx / DRAG_DISTANCE);
    }, { passive: false });

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
      dragEnd(dx > -(DRAG_DISTANCE * 0.4));
    }

    menu.addEventListener('touchend', finish);
    menu.addEventListener('touchcancel', finish);
  }

  function init() {
    var overlay = document.getElementById('app-menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', close);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
      }
    });
    bindSwipeClose();
  }

  window.AppMenu = {
    open: open,
    close: close,
    toggle: toggle,
    init: init,
    dragTo: dragTo,
    dragEnd: dragEnd
  };
})();
