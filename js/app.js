(function () {
  var cfg = window.APP_CONFIG;
  var currentView = 'scheda';

  function showView(viewId) {
    currentView = viewId;
    document.querySelectorAll('.view-panel').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'view-' + viewId);
    });
    document.querySelectorAll('#bottom-nav .nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });
    document.getElementById('main-content').scrollTop = 0;
    if (viewId === 'cavalcatura' && window.AppSheet && window.AppSheet.renderSteedHp) {
      window.AppSheet.renderSteedHp();
    }
    updateFab();
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
    void panel.offsetWidth;
    panel.classList.add(cls);
    panel.addEventListener('animationend', function handler() {
      panel.classList.remove(cls);
      panel.removeEventListener('animationend', handler);
    });
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
        if (oldIdx !== -1 && oldIdx !== tabIdx) {
          // ogni nuova pagina riparte dall'inizio
          var mc = document.getElementById('main-content');
          if (mc) {
            mc.scrollTop = 0;
          }
          animatePanelIn(activePanel, tabIdx > oldIdx ? 1 : -1);
        }
        updateFab();
      });
    });
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

  function getSubtabContext() {
    var view = document.getElementById('view-' + currentView);
    if (!view) {
      return null;
    }
    var tabs = view.querySelectorAll('.subtabs .subtab');
    if (!tabs.length) {
      return null;
    }
    var idx = -1;
    tabs.forEach(function (t, i) {
      if (t.classList.contains('active')) {
        idx = i;
      }
    });
    var panel = view.querySelector('.subpanel.active');

    return { tabs: tabs, idx: idx, panel: panel };
  }

  function bindSwipeTabs() {
    // Swipe orizzontale su mobile tra le sotto-tab della vista attiva,
    // stile Telegram: le pagine sono affiancate, il pannello adiacente
    // entra attaccato a quello corrente mentre trascini (niente vuoto).
    // Il menu in basso resta solo al click. Escludiamo i controlli che
    // gestiscono già il drag/scroll orizzontale.
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
    var neighbor = null;
    var neighborDir = 0;
    var panelW = 0;

    function clearPanelStyles(p) {
      if (!p) {
        return;
      }
      p.classList.remove('swipe-follow', 'swipe-anim');
      p.style.display = '';
      p.style.position = '';
      p.style.top = '';
      p.style.left = '';
      p.style.width = '';
      p.style.transform = '';
      p.style.zIndex = '';
      p.style.boxShadow = '';
      p.style.filter = '';
    }

    function hideNeighbor() {
      clearPanelStyles(neighbor);
      neighbor = null;
      neighborDir = 0;
    }

    function showNeighbor(dir) {
      var targetIdx = ctx.idx + dir;
      if (targetIdx < 0 || targetIdx >= ctx.tabs.length) {
        return;
      }
      var view = document.getElementById('view-' + currentView);
      var name = ctx.tabs[targetIdx].getAttribute('data-subtab');
      var np = view ? view.querySelector('.subpanel[data-subpanel="' + name + '"]') : null;
      if (!np) {
        return;
      }
      // pannello adiacente sopra quello attivo, fuori schermo, con ombra
      // sul bordo d'ingresso (profondità stile iOS). Il suo inizio è
      // allineato alla parte visibile dello schermo: la nuova pagina si
      // vede sempre dall'inizio, non al livello di scroll della vecchia.
      var mainRect = main.getBoundingClientRect();
      var hostRect = ctx.panel.parentElement.getBoundingClientRect();
      var visTop = Math.max(ctx.panel.offsetTop, Math.round(mainRect.top - hostRect.top));
      np.classList.add('swipe-follow');
      np.style.display = 'block';
      np.style.position = 'absolute';
      np.style.top = visTop + 'px';
      np.style.left = '0';
      np.style.width = '100%';
      np.style.zIndex = '2';
      np.style.boxShadow = (dir > 0 ? '-14px' : '14px') + ' 0 26px rgba(0, 0, 0, 0.55)';
      np.style.transform = 'translateX(' + (dir > 0 ? panelW : -panelW) + 'px)';
      neighbor = np;
      neighborDir = dir;
    }

    function finish(commit) {
      animating = true;
      var active = ctx.panel;
      var nb = neighbor;
      var dir = neighborDir;
      var targetIdx = ctx.idx + dir;
      var tabsRef = ctx.tabs;
      active.classList.add('swipe-anim');
      if (nb) {
        nb.classList.add('swipe-anim');
      }
      if (commit && nb) {
        active.style.transform = 'translateX(' + Math.round((dir > 0 ? -1 : 1) * panelW * 0.3) + 'px)';
        active.style.filter = 'brightness(0.55)';
        nb.style.transform = 'translateX(0px)';
      } else {
        active.style.transform = 'translateX(0px)';
        active.style.filter = '';
        if (nb) {
          nb.style.transform = 'translateX(' + (dir > 0 ? panelW : -panelW) + 'px)';
        }
      }
      setTimeout(function () {
        clearPanelStyles(active);
        hideNeighbor();
        if (commit && targetIdx >= 0 && targetIdx < tabsRef.length) {
          suppressSlideAnim = true;
          tabsRef[targetIdx].click();
          tabsRef[targetIdx].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
        animating = false;
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
      if (t.closest && t.closest('.loh-bar-track, .subtabs')) {
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
          ctx = getSubtabContext();
          if (!ctx || !ctx.panel || ctx.idx < 0) {
            tracking = false;

            return;
          }
          panelW = ctx.panel.offsetWidth || main.clientWidth;
          following = true;
          ctx.panel.classList.add('swipe-follow');
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
        hideNeighbor();
        showNeighbor(dir);
      }
      if (neighbor) {
        // la pagina che entra segue il dito sopra quella attiva, che
        // scorre più lenta (parallasse) e si scurisce progressivamente
        var prog = Math.min(1, Math.abs(dx) / panelW);
        neighbor.style.transform = 'translateX(' + Math.round((dir > 0 ? panelW : -panelW) + dx) + 'px)';
        ctx.panel.style.transform = 'translateX(' + Math.round(dx * 0.3) + 'px)';
        ctx.panel.style.filter = 'brightness(' + (1 - 0.45 * prog).toFixed(3) + ')';
      } else {
        // nessuna tab in quella direzione: effetto elastico
        ctx.panel.style.transform = 'translateX(' + Math.round(dx * 0.25) + 'px)';
        ctx.panel.style.filter = '';
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
        finish(false);
      }
      tracking = false;
      following = false;
    }, { passive: true });
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
    function isTyping() {
      var ae = document.activeElement;

      return !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
    }

    function resetPan() {
      if (!isTyping() && (window.scrollY !== 0 || window.scrollX !== 0)) {
        window.scrollTo(0, 0);
      }
    }

    window.addEventListener('scroll', resetPan, { passive: true });
    document.addEventListener('focusout', function () {
      setTimeout(resetPan, 60);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        setTimeout(resetPan, 60);
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

  function init() {
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
    window.AppSheet.init();
    window.AppGrimorio.init();
    window.AppTreasury.init();
    window.AppDiary.init();
    window.AppInspiration.init();
    window.AppBottomSheet.init();
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
