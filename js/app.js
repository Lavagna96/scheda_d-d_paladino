(function () {
  var cfg = window.APP_CONFIG;
  var currentView = 'scheda';
  var NAV_ORDER = ['scheda', 'grimorio', 'cavalcatura', 'tesoreria', 'diario'];
  var IND_EASE = 'transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1), width 0.26s cubic-bezier(0.22, 0.61, 0.36, 1)';

  // Riporta il documento a x=0/y=0 se qualcosa (rubber-band iOS, uno
  // scrollIntoView che risale agli antenati, ecc.) l'ha spostato: senza
  // questo la pagina resta permanentemente disassata verso un lato.
  function resetDocScroll() {
    var ae = document.activeElement;
    var typing = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
    if (typing) {
      return;
    }
    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement.scrollLeft !== 0) {
      document.documentElement.scrollLeft = 0;
    }
    if (document.body.scrollLeft !== 0) {
      document.body.scrollLeft = 0;
    }
  }

  // Centra la tab attiva dentro la sua barra scorrevole SENZA usare
  // scrollIntoView: quando la barra non ha nulla da scorrere (ci sta già
  // tutta), scrollIntoView può risalire a un antenato (anche con
  // overflow:hidden, che resta comunque uno scroll-container valido per lo
  // scroll programmatico) e spostare quello invece — da cui il bug del
  // documento disassato.
  function centerSubtabInBar(bar, tab) {
    if (!bar || !tab) {
      return;
    }
    var target = tab.offsetLeft + tab.offsetWidth / 2 - bar.clientWidth / 2;
    bar.scrollLeft = Math.max(0, Math.min(bar.scrollWidth - bar.clientWidth, target));
  }

  function subIndicator(bar) {
    if (!bar) {
      return null;
    }
    var ind = bar.querySelector('.subtab-ind');
    if (!ind) {
      ind = document.createElement('span');
      ind.className = 'subtab-ind';
      ind.setAttribute('aria-hidden', 'true');
      bar.insertBefore(ind, bar.firstChild);
    }

    return ind;
  }

  // segna con litClass gli elementi coperti dall'indicatore per più di un
  // terzo della loro larghezza, così il contrasto regge anche a metà corsa
  function applyCoverage(items, litClass, left, width) {
    var right = left + width;
    items.forEach(function (t) {
      var tl = t.offsetLeft;
      var overlap = Math.max(0, Math.min(right, tl + t.offsetWidth) - Math.max(left, tl));
      t.classList.toggle(litClass, t.offsetWidth > 0 && overlap / t.offsetWidth > 0.33);
    });
  }

  function applyGoldCoverage(bar, left, width) {
    applyCoverage([].slice.call(bar.querySelectorAll('.subtab, .level-tab')), 'on-gold', left, width);
  }

  // Sistema di tab di una vista: le sotto-tab classiche oppure, nel
  // grimorio, le tab dei livelli incantesimo (stesse meccaniche di swipe).
  function viewTabSystem(view) {
    if (!view) {
      return null;
    }
    var bar = view.querySelector('.subtabs');
    if (bar) {
      return { kind: 'sub', bar: bar, tabs: [].slice.call(bar.querySelectorAll('.subtab')) };
    }
    bar = view.querySelector('.level-tabs');
    if (bar) {
      return { kind: 'level', bar: bar, tabs: [].slice.call(bar.querySelectorAll('.level-tab')) };
    }

    return null;
  }

  function activePanelOf(view, kind) {
    return kind === 'level'
      ? view.querySelector('.spell-level-group:not(.hidden)')
      : view.querySelector('.subpanel.active');
  }

  // ----- indicatore scorrevole del menu principale (in basso) -----
  function navLinks() {
    return [].slice.call(document.querySelectorAll('#bottom-nav .nav-link[data-view]'));
  }

  function navLinkFor(view) {
    return document.querySelector('#bottom-nav .nav-link[data-view="' + view + '"]');
  }

  function navIndicator() {
    var bar = document.getElementById('bottom-nav');
    if (!bar) {
      return null;
    }
    var ind = bar.querySelector('.nav-ind');
    if (!ind) {
      ind = document.createElement('span');
      ind.className = 'nav-ind';
      ind.setAttribute('aria-hidden', 'true');
      bar.insertBefore(ind, bar.firstChild);
    }

    return ind;
  }

  function moveNavIndicator(link, animate) {
    if (!link || !link.offsetWidth) {
      return;
    }
    var ind = navIndicator();
    ind.style.transition = animate ? IND_EASE : 'none';
    ind.style.top = link.offsetTop + 'px';
    ind.style.height = link.offsetHeight + 'px';
    ind.style.width = link.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    applyCoverage(navLinks(), 'nav-lit', link.offsetLeft, link.offsetWidth);
  }

  function lerpNavIndicator(fromLink, toLink, p) {
    if (!fromLink || !fromLink.offsetWidth) {
      return;
    }
    var ind = navIndicator();
    var l = fromLink.offsetLeft;
    var w = fromLink.offsetWidth;
    if (toLink && toLink.offsetWidth) {
      l += (toLink.offsetLeft - fromLink.offsetLeft) * p;
      w += (toLink.offsetWidth - fromLink.offsetWidth) * p;
    }
    ind.style.transition = 'none';
    ind.style.top = fromLink.offsetTop + 'px';
    ind.style.height = fromLink.offsetHeight + 'px';
    ind.style.width = w + 'px';
    ind.style.transform = 'translateX(' + l + 'px)';
    applyCoverage(navLinks(), 'nav-lit', l, w);
  }

  function moveSubIndicator(bar, tab, animate) {
    if (!bar || !tab || !tab.offsetWidth) {
      return;
    }
    var ind = subIndicator(bar);
    ind.style.transition = animate ? IND_EASE : 'none';
    ind.style.top = tab.offsetTop + 'px';
    ind.style.height = tab.offsetHeight + 'px';
    ind.style.width = tab.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    applyGoldCoverage(bar, tab.offsetLeft, tab.offsetWidth);
  }

  // Durante il trascinamento l'indicatore interpola tra la tab attuale e
  // quella di destinazione (p = 0..1), muovendosi in sincrono con la pagina.
  function lerpSubIndicator(bar, fromTab, toTab, p) {
    if (!bar || !fromTab || !fromTab.offsetWidth) {
      return;
    }
    var ind = subIndicator(bar);
    var l = fromTab.offsetLeft;
    var w = fromTab.offsetWidth;
    if (toTab && toTab.offsetWidth) {
      l += (toTab.offsetLeft - fromTab.offsetLeft) * p;
      w += (toTab.offsetWidth - fromTab.offsetWidth) * p;
    }
    ind.style.transition = 'none';
    ind.style.top = fromTab.offsetTop + 'px';
    ind.style.height = fromTab.offsetHeight + 'px';
    ind.style.width = w + 'px';
    ind.style.transform = 'translateX(' + l + 'px)';
    applyGoldCoverage(bar, l, w);
  }

  function repositionActiveIndicator(view, animate) {
    var sys = viewTabSystem(view);
    if (sys) {
      moveSubIndicator(sys.bar, sys.bar.querySelector('.subtab.active, .level-tab.active'), animate);
    }
  }

  function currentSubtabBar() {
    var sys = viewTabSystem(document.getElementById('view-' + currentView));

    return sys ? sys.bar : null;
  }

  function showView(viewId, animateNav) {
    currentView = viewId;
    document.querySelectorAll('.view-panel').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'view-' + viewId);
    });
    document.querySelectorAll('#bottom-nav .nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });
    moveNavIndicator(navLinkFor(viewId), animateNav !== false);
    document.getElementById('main-content').scrollTop = 0;
    // la barra ora è visibile: l'indicatore va posizionato sulla tab attiva
    repositionActiveIndicator(document.getElementById('view-' + viewId), false);
    if (viewId === 'cavalcatura' && window.AppSheet && window.AppSheet.renderSteedHp) {
      window.AppSheet.renderSteedHp();
    }
    updateFab();
    resetDocScroll();
  }

  var suppressSlideAnim = false;

  function animatePanelIn(panel, dir) {
    if (suppressSlideAnim) {
      suppressSlideAnim = false;

      return;
    }
    if (!panel || !dir) {
      return;
    }
    var cls = dir > 0 ? 'slide-in-right' : 'slide-in-left';
    panel.classList.remove('slide-in-right', 'slide-in-left');
    // rimuove eventuale transform residuo da un'animazione precedente mai
    // conclusa, altrimenti la pagina resta bloccata a metà scorrimento
    panel.style.transform = '';
    void panel.offsetWidth;
    panel.classList.add(cls);
    var cleaned = false;
    function cleanup() {
      if (cleaned) {
        return;
      }
      cleaned = true;
      panel.classList.remove(cls);
    }
    panel.addEventListener('animationend', cleanup, { once: true });
    // rete di sicurezza: se l'evento animationend non arriva (tap ripetuti,
    // animazioni ridotte di sistema, ecc.) la classe va rimossa comunque
    setTimeout(cleanup, 350);
  }

  function initSubTabs(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    var tabs = container.querySelectorAll('.subtab');
    var panels = container.querySelectorAll('.subpanel');
    tabs.forEach(function (tab, tabIdx) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-subtab');
        var oldIdx = -1;
        tabs.forEach(function (t, i) {
          if (t.classList.contains('active')) {
            oldIdx = i;
          }
        });
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        var activePanel = null;
        panels.forEach(function (p) {
          var on = p.getAttribute('data-subpanel') === target;
          p.classList.toggle('active', on);
          if (on) {
            activePanel = p;
          }
        });
        moveSubIndicator(container.querySelector('.subtabs'), tab, true);
        if (oldIdx !== -1 && oldIdx !== tabIdx) {
          // ogni nuova pagina riparte dall'inizio
          var mc = document.getElementById('main-content');
          if (mc) {
            mc.scrollTop = 0;
          }
          animatePanelIn(activePanel, tabIdx > oldIdx ? 1 : -1);
        }
        updateFab();
        resetDocScroll();
      });
    });
    repositionActiveIndicator(container, false);
  }

  function getActiveSubtab(viewId) {
    var panel = document.getElementById('view-' + viewId);
    if (!panel) {
      return null;
    }
    var active = panel.querySelector('.subtab.active');

    return active ? active.getAttribute('data-subtab') : null;
  }

  function updateFab() {
    var fab = document.getElementById('global-fab');
    if (!fab) {
      return;
    }
    var sub = getActiveSubtab(currentView);
    var show = (currentView === 'tesoreria' && (sub === 'party' || sub === 'sacca'))
      || (currentView === 'diario' && (sub === 'cronache' || sub === 'png' || sub === 'quest'));

    fab.classList.toggle('hidden', !show);
    fab.setAttribute('data-context', currentView + '-' + (sub || ''));
  }

  function getSwipeContext(startTarget) {
    var view = document.getElementById('view-' + currentView);
    if (!view) {
      return null;
    }
    var sys = viewTabSystem(view);
    if (sys && sys.kind === 'level') {
      // Nel grimorio lo swipe cambia livello solo se il gesto parte
      // dall'elenco incantesimi; più in su (slot, ricerca, glossario,
      // promemoria) si comporta come le viste senza sotto-tab e cambia
      // sezione, perché lì "sotto" non c'è altro livello da scorrere.
      var spellList = view.querySelector('.spell-list');
      if (!spellList || !startTarget || !spellList.contains(startTarget)) {
        sys = null;
      }
    }
    var tabs = sys ? sys.tabs : [];
    var idx = 0;
    tabs.forEach(function (t, i) {
      if (t.classList.contains('active')) {
        idx = i;
      }
    });

    // panel è la sotto-pagina attiva (null per le viste senza tab)
    return {
      view: view,
      tabs: tabs,
      idx: idx,
      kind: sys ? sys.kind : null,
      panel: sys ? activePanelOf(view, sys.kind) : null
    };
  }

  function adjacentView(dir) {
    var j = NAV_ORDER.indexOf(currentView) + dir;

    return (j >= 0 && j < NAV_ORDER.length) ? NAV_ORDER[j] : null;
  }

  function activeSubtabIndex(view) {
    var sys = viewTabSystem(view);
    var idx = 0;
    (sys ? sys.tabs : []).forEach(function (t, i) {
      if (t.classList.contains('active')) {
        idx = i;
      }
    });

    return idx;
  }

  var suppressLevelFx = false;

  function setActiveSubtab(view, idx) {
    var sys = viewTabSystem(view);
    if (!sys || !sys.tabs.length) {
      return null;
    }
    idx = Math.max(0, Math.min(sys.tabs.length - 1, idx));
    var tab = sys.tabs[idx];
    if (sys.kind === 'level') {
      // il click fa sincronizzare gruppi e stato interno al grimorio;
      // niente animazioni: è un posizionamento programmatico
      suppressLevelFx = true;
      tab.click();
      suppressLevelFx = false;
    } else {
      var name = tab.getAttribute('data-subtab');
      sys.tabs.forEach(function (t, i) { t.classList.toggle('active', i === idx); });
      view.querySelectorAll('.subpanel').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-subpanel') === name);
      });
    }

    return tab;
  }

  function bindSwipeTabs() {
    // Swipe orizzontale stile Telegram: le pagine sono affiancate e quella
    // adiacente entra attaccata mentre trascini. Se sei in fondo (o in cima)
    // ai sotto-menu, il gesto porta alla sezione successiva/precedente del
    // menu principale, facendo scorrere l'intera sezione e l'evidenziazione
    // del menu in basso in sincrono. Escludiamo i controlli che gestiscono
    // già il drag/scroll orizzontale.
    var main = document.getElementById('main-content');
    if (!main) {
      return;
    }
    var startX = 0;
    var startY = 0;
    var startT = 0;
    var tracking = false;
    var following = false;
    var animating = false;
    var ctx = null;
    var panelW = 0;
    var neighbor = null;       // elemento che entra (sotto-pagina o sezione)
    var outEl = null;          // elemento che esce
    var neighborDir = 0;
    var neighborKind = null;   // 'sub' | 'view'
    var neighborIsLevel = false; // il vicino è un gruppo .spell-level-group (usa .hidden, non solo display)
    var viewPrevIdx = 0;       // sotto-tab della sezione di destinazione (per annullare)
    var startTarget = null;    // elemento toccato all'avvio: decide se il grimorio scorre i livelli o cambia sezione

    function clearStyles(p) {
      if (!p) {
        return;
      }
      p.classList.remove('swipe-follow', 'swipe-anim', 'view-swiping');
      ['display', 'position', 'top', 'left', 'width', 'minHeight',
        'transform', 'transition', 'zIndex', 'boxShadow', 'filter'].forEach(function (k) {
        p.style[k] = '';
      });
    }

    function teardown() {
      if (neighborKind === 'view' && neighbor) {
        setActiveSubtab(neighbor, viewPrevIdx);
        clearStyles(neighbor);
        neighbor.classList.add('hidden');
      } else {
        if (neighborIsLevel && neighbor) {
          // .hidden ha display:none !important: senza toglierla il gruppo
          // che entra resta invisibile per tutto il drag (niente sovrapposizione)
          neighbor.classList.add('hidden');
        }
        clearStyles(neighbor);
      }
      clearStyles(outEl);
      neighbor = null;
      outEl = null;
      neighborDir = 0;
      neighborKind = null;
      neighborIsLevel = false;
    }

    function setupSub(dir) {
      var tab = ctx.tabs[ctx.idx + dir];
      var np = ctx.kind === 'level'
        ? ctx.view.querySelector('.spell-level-group[data-level-group="' + tab.getAttribute('data-level') + '"]')
        : ctx.view.querySelector('.subpanel[data-subpanel="' + tab.getAttribute('data-subtab') + '"]');
      if (!np) {
        return;
      }
      outEl = ctx.panel;
      panelW = ctx.panel.offsetWidth || main.clientWidth;
      outEl.classList.add('swipe-follow');
      outEl.style.minHeight = main.clientHeight + 'px';
      var mainRect = main.getBoundingClientRect();
      var hostRect = ctx.panel.parentElement.getBoundingClientRect();
      var visTop = Math.max(ctx.panel.offsetTop, Math.round(mainRect.top - hostRect.top));
      if (ctx.kind === 'level') {
        // .hidden (display:none !important) batte lo style inline sotto:
        // va tolta esplicitamente, non basta impostare display:block
        np.classList.remove('hidden');
      }
      neighborIsLevel = ctx.kind === 'level';
      np.classList.add('swipe-follow');
      np.style.display = 'block';
      np.style.position = 'absolute';
      np.style.top = visTop + 'px';
      np.style.left = '0';
      np.style.width = '100%';
      np.style.minHeight = main.clientHeight + 'px';
      np.style.zIndex = '2';
      np.style.boxShadow = (dir > 0 ? '-14px' : '14px') + ' 0 26px rgba(0, 0, 0, 0.55)';
      np.style.transform = 'translateX(' + (dir > 0 ? panelW : -panelW) + 'px)';
      neighbor = np;
      neighborDir = dir;
      neighborKind = 'sub';
    }

    function setupView(dir) {
      var tvName = adjacentView(dir);
      if (!tvName) {
        return;
      }
      var tv = document.getElementById('view-' + tvName);
      if (!tv) {
        return;
      }
      outEl = ctx.view;
      panelW = outEl.offsetWidth || main.clientWidth;
      tv.classList.remove('hidden');
      tv.classList.add('view-swiping');
      tv.style.position = 'absolute';
      // in cima al viewport corrente, rispettando il margine della vista
      tv.style.top = (main.scrollTop + outEl.offsetTop) + 'px';
      tv.style.left = outEl.offsetLeft + 'px';
      tv.style.width = outEl.offsetWidth + 'px';
      tv.style.minHeight = main.clientHeight + 'px';
      tv.style.zIndex = '2';
      tv.style.boxShadow = (dir > 0 ? '-14px' : '14px') + ' 0 26px rgba(0, 0, 0, 0.55)';
      tv.style.transform = 'translateX(' + (dir > 0 ? panelW : -panelW) + 'px)';
      // atterra sulla prima sotto-tab se vai avanti, sull'ultima se torni
      viewPrevIdx = activeSubtabIndex(tv);
      var landing = setActiveSubtab(tv, dir > 0 ? 0 : 9999);
      if (landing) {
        var landingSys = viewTabSystem(tv);
        moveSubIndicator(landingSys && landingSys.bar, landing, false);
      }
      outEl.classList.add('view-swiping');
      neighbor = tv;
      neighborDir = dir;
      neighborKind = 'view';
    }

    function showNeighbor(dir) {
      var subTgt = ctx.idx + dir;
      if (ctx.tabs.length && subTgt >= 0 && subTgt < ctx.tabs.length) {
        setupSub(dir);
      } else {
        setupView(dir);
      }
    }

    function elasticEl() {
      return ctx.panel || ctx.view;
    }

    function finish(commit) {
      animating = true;
      var dir = neighborDir;
      var kind = neighborKind;
      var nb = neighbor;
      var out = outEl;
      var ctxRef = ctx;
      var wasLevel = neighborIsLevel;
      var doCommit = commit && !!nb;

      if (kind === 'sub') {
        var subFinal = doCommit ? ctxRef.idx + dir : ctxRef.idx;
        moveSubIndicator(currentSubtabBar(), ctxRef.tabs[subFinal], true);
      } else if (kind === 'view') {
        moveNavIndicator(navLinkFor(doCommit ? adjacentView(dir) : currentView), true);
      }

      if (nb) {
        out.classList.add('swipe-anim');
        nb.classList.add('swipe-anim');
        if (doCommit) {
          out.style.transform = 'translateX(' + Math.round((dir > 0 ? -1 : 1) * panelW * 0.3) + 'px)';
          out.style.filter = 'brightness(0.55)';
          nb.style.transform = 'translateX(0px)';
        } else {
          out.style.transform = 'translateX(0px)';
          out.style.filter = '';
          nb.style.transform = 'translateX(' + (dir > 0 ? panelW : -panelW) + 'px)';
        }
      } else {
        var el = elasticEl();
        el.style.transition = 'transform 0.2s ease-out';
        el.style.transform = 'translateX(0px)';
        el.style.filter = '';
      }

      setTimeout(function () {
        if (kind === 'view') {
          if (doCommit) {
            var target = adjacentView(dir);
            clearStyles(out);
            clearStyles(nb);
            showView(target, true);
          } else {
            if (nb) {
              setActiveSubtab(nb, viewPrevIdx);
              clearStyles(nb);
              nb.classList.add('hidden');
            }
            clearStyles(out);
          }
        } else {
          clearStyles(out);
          clearStyles(nb);
          clearStyles(elasticEl());
          if (doCommit) {
            var tgt = ctxRef.idx + dir;
            suppressSlideAnim = true;
            ctxRef.tabs[tgt].click();
            centerSubtabInBar(currentSubtabBar(), ctxRef.tabs[tgt]);
          } else if (wasLevel && nb) {
            // swipe annullato: il vicino non è più visibile, torna nascosto
            nb.classList.add('hidden');
          }
        }
        neighbor = null;
        outEl = null;
        neighborDir = 0;
        neighborKind = null;
        neighborIsLevel = false;
        animating = false;
        resetDocScroll();
      }, 250);
    }

    main.addEventListener('touchstart', function (e) {
      tracking = false;
      following = false;
      if (animating || e.touches.length !== 1) {
        return;
      }
      ctx = null;
      var t = e.target;
      if (t.closest && t.closest('.loh-bar-track, .subtabs, .level-tabs')) {
        return;
      }
      // Campi di testo: lo swipe parte anche sopra input e textarea,
      // ma non mentre ne stai modificando uno (cursore/selezione attivi).
      var ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)
        && (t === ae || ae.contains(t))) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      startTarget = t;
      tracking = true;
    }, { passive: true });

    main.addEventListener('touchmove', function (e) {
      if (!tracking) {
        return;
      }
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (!following) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
          // gesto verticale: lasciamo lo scroll normale
          tracking = false;

          return;
        }
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          ctx = getSwipeContext(startTarget);
          if (!ctx) {
            tracking = false;

            return;
          }
          panelW = (ctx.panel ? ctx.panel.offsetWidth : ctx.view.offsetWidth) || main.clientWidth;
          following = true;
        } else {
          return;
        }
      }
      // swipe agganciato: la pagina non deve muoversi in verticale
      if (e.cancelable) {
        e.preventDefault();
      }
      var dir = dx < 0 ? 1 : -1;
      if (neighborDir !== dir) {
        teardown();
        showNeighbor(dir);
      }
      var prog = Math.min(1, Math.abs(dx) / panelW);
      if (neighbor) {
        neighbor.style.transform = 'translateX(' + Math.round((dir > 0 ? panelW : -panelW) + dx) + 'px)';
        outEl.style.transform = 'translateX(' + Math.round(dx * 0.3) + 'px)';
        outEl.style.filter = 'brightness(' + (1 - 0.45 * prog).toFixed(3) + ')';
        if (neighborKind === 'sub') {
          lerpSubIndicator(currentSubtabBar(), ctx.tabs[ctx.idx], ctx.tabs[ctx.idx + dir], prog);
        } else {
          lerpNavIndicator(navLinkFor(currentView), navLinkFor(adjacentView(dir)), prog);
        }
      } else {
        // nessun vicino (bordo estremo): effetto elastico
        var el = elasticEl();
        el.style.transform = 'translateX(' + Math.round(dx * 0.25) + 'px)';
        el.style.filter = '';
      }
    }, { passive: false });

    main.addEventListener('touchend', function (e) {
      if (!tracking) {
        return;
      }
      tracking = false;
      if (!following) {
        return;
      }
      following = false;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - startX;
      var dt = Date.now() - startT;
      // conferma se hai trascinato abbastanza o con un colpo rapido
      var commit = !!neighbor
        && (Math.abs(dx) >= panelW * 0.3 || (Math.abs(dx) >= 40 && dt < 250));
      finish(commit);
    }, { passive: true });

    main.addEventListener('touchcancel', function () {
      if (following) {
        following = false;
        finish(false);
      }
      tracking = false;
    }, { passive: true });
  }

  function initLevelTabs() {
    // Le tab dei livelli del grimorio: indicatore scorrevole e slide della
    // lista al tap, come le sotto-tab (il toggle dei gruppi lo fa il
    // grimorio nel suo listener, registrato prima di questo).
    var view = document.getElementById('view-grimorio');
    var sys = viewTabSystem(view);
    if (!sys || sys.kind !== 'level') {
      return;
    }
    var lastIdx = activeSubtabIndex(view);
    sys.tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        if (suppressLevelFx) {
          lastIdx = idx;

          return;
        }
        moveSubIndicator(sys.bar, tab, true);
        centerSubtabInBar(sys.bar, tab);
        if (idx !== lastIdx) {
          animatePanelIn(activePanelOf(view, 'level'), idx > lastIdx ? 1 : -1);
        }
        lastIdx = idx;
      });
    });
  }

  function bindNav() {
    document.querySelectorAll('#bottom-nav .nav-link[data-view]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showView(link.getAttribute('data-view'));
      });
    });
  }

  function bindOptions() {
    var btn = document.getElementById('header-options');
    var panel = document.getElementById('options-panel');
    if (!btn || !panel) {
      return;
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('hidden');
    });
    document.addEventListener('click', function () {
      panel.classList.add('hidden');
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    document.getElementById('opt-manual').addEventListener('click', function () {
      window.AppGrimorio.openManual();
      panel.classList.add('hidden');
    });

    document.getElementById('opt-reset').addEventListener('click', function () {
      if (confirm('Ripristinare tutti i dati ai valori iniziali?')) {
        window.AppStorage.resetState();
        window.AppHeader.render();
        window.AppSheet.render();
        window.AppGrimorio.render();
        window.AppTreasury.render();
        window.AppDiary.render();
        window.AppInspiration.render();
      }
      panel.classList.add('hidden');
    });

    document.getElementById('opt-export').addEventListener('click', function () {
      var data = JSON.stringify(window.AppStorage.getState(), null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tharion-velnar-backup.json';
      a.click();
      panel.classList.add('hidden');
    });

    document.getElementById('opt-import').addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = function () {
        var file = input.files[0];
        if (!file) {
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var parsed = JSON.parse(reader.result);
            window.AppStorage.saveState(Object.assign(window.AppStorage.getDefaultState(), parsed), true);
            window.AppHeader.render();
            window.AppSheet.render();
            window.AppGrimorio.render();
            window.AppTreasury.render();
            window.AppDiary.render();
            window.AppInspiration.render();
          } catch (err) {
            alert('File non valido.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
      panel.classList.add('hidden');
    });
  }

  function bindFab() {
    var fab = document.getElementById('global-fab');
    if (!fab) {
      return;
    }
    fab.addEventListener('click', function () {
      var ctx = fab.getAttribute('data-context') || '';
      if (ctx.indexOf('tesoreria') === 0) {
        window.AppTreasury.addItem(ctx.indexOf('sacca') >= 0 ? 'personal' : 'party');
      } else if (ctx.indexOf('diario-cronache') === 0) {
        window.AppDiary.addSession();
      } else if (ctx.indexOf('diario-png') === 0) {
        window.AppDiary.addPng();
      } else if (ctx.indexOf('diario-quest') === 0) {
        window.AppDiary.addQuest();
      }
    });
  }

  function bindViewportGuard() {
    // iOS standalone: quando la tastiera si apre il sistema trasla il
    // viewport per mostrare l'input e alla chiusura spesso non lo riporta
    // giù: la shell (e il menu fixed) resta sollevata con un vuoto sotto.
    // Riportiamo il pan a zero appena non c'è più un campo attivo.
    window.addEventListener('scroll', resetDocScroll, { passive: true });
    document.addEventListener('focusout', function () {
      setTimeout(resetDocScroll, 60);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        setTimeout(resetDocScroll, 60);
      });
    }
  }

  function bindViewportDebug() {
    // Diagnostica nascosta: 5 tap rapidi sul sigillo dell'header mostrano
    // le misure reali del viewport (per capire i problemi iOS standalone).
    var avatar = document.querySelector('.header-avatar');
    if (!avatar) {
      return;
    }
    var taps = 0;
    var timer = null;
    avatar.addEventListener('click', function () {
      taps += 1;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 800);
      if (taps < 5) {
        return;
      }
      taps = 0;
      var vv = window.visualViewport;
      alert(
        'innerH: ' + window.innerHeight +
        '\nscreenH: ' + screen.height +
        '\nvv.h: ' + (vv ? Math.round(vv.height) : '-') +
        '\nvv.top: ' + (vv ? Math.round(vv.offsetTop) : '-') +
        '\nscrollY: ' + window.scrollY +
        '\nsafeTop/Bot: ' + getComputedStyle(document.documentElement).getPropertyValue('--dbg-sat') + '/' +
        getComputedStyle(document.documentElement).getPropertyValue('--dbg-sab') +
        '\nstandalone: ' + !!navigator.standalone
      );
    });
    document.documentElement.style.setProperty('--dbg-sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--dbg-sab', 'env(safe-area-inset-bottom)');
  }

  /* Paracadute del cancello di login: se cloud.js (modulo Firebase da CDN)
     impiega troppo — rete lenta al primo avvio — mostra comunque il login
     invece di uno schermo vuoto. I bottoni restano disattivati (vedi
     body.login-not-ready in login.css) finché cloud.js non li aggancia
     davvero: bindLoginUi() toglie la classe a fine caricamento, qualunque
     sia il momento in cui il modulo finisce di arrivare dal CDN. */
  function bindAuthFallback() {
    setTimeout(function () {
      if (document.body.classList.contains('auth-checking')) {
        document.body.classList.remove('auth-checking');
        document.body.classList.add('auth-out');
      }
      if (document.body.classList.contains('login-not-ready')) {
        var status = document.getElementById('lg-status');
        if (status) {
          status.textContent = 'Connessione lenta: il pulsante si attiva appena pronto…';
        }
      }
    }, 8000);
  }

  function init() {
    bindAuthFallback();
    bindViewportGuard();
    bindViewportDebug();
    bindNav();
    bindSwipeTabs();
    initSubTabs('#view-scheda');
    initSubTabs('#view-tesoreria');
    initSubTabs('#view-diario');
    bindOptions();
    bindFab();
    showView('scheda');

    window.AppHeader.init();
    window.AppStats.init(); // prima di AppSheet: imposta i data-max delle res-card
    window.AppSheet.init();
    window.AppGrimorio.init();
    initLevelTabs();
    window.AppTreasury.init();
    window.AppDiary.init();
    window.AppInspiration.init();
    window.AppBottomSheet.init();
    window.AppEditSheet.init();

    moveNavIndicator(navLinkFor(currentView), false);

    // riallinea gli indicatori quando i font (larghezze diverse) o il resize
    // cambiano la geometria delle tab / del menu
    function realignIndicator() {
      repositionActiveIndicator(document.getElementById('view-' + currentView), false);
      moveNavIndicator(navLinkFor(currentView), false);
    }
    window.addEventListener('load', realignIndicator);
    window.addEventListener('resize', realignIndicator);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(realignIndicator);
    }
  }

  window.App = {
    showView: showView,
    initSubTabs: initSubTabs,
    init: init
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
