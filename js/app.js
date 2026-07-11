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

  function animatePanelIn(panel, dir) {
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
    // Swipe orizzontale su mobile tra le sotto-tab della vista attiva:
    // il pannello segue il dito e al rilascio la pagina scivola avanti o
    // indietro. Il menu in basso resta solo al click. Escludiamo i
    // controlli che gestiscono già il drag/scroll orizzontale.
    var main = document.getElementById('main-content');
    if (!main) {
      return;
    }
    var startX = 0;
    var startY = 0;
    var tracking = false;
    var following = false;
    var ctx = null;

    function goTo(tabList, targetIdx) {
      tabList[targetIdx].click();
      tabList[targetIdx].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    function endFollow(snapBack) {
      if (!ctx || !ctx.panel) {
        return;
      }
      var p = ctx.panel;
      p.classList.remove('swipe-follow');
      if (snapBack) {
        p.classList.add('swipe-reset');
        p.style.transform = '';
        setTimeout(function () { p.classList.remove('swipe-reset'); }, 260);
      } else {
        p.style.transform = '';
      }
    }

    main.addEventListener('touchstart', function (e) {
      tracking = false;
      following = false;
      ctx = null;
      if (e.touches.length !== 1) {
        return;
      }
      var t = e.target;
      if (t.closest && t.closest('.loh-bar-track, .subtabs, input, textarea, select, [contenteditable="true"]')) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
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
          following = true;
          ctx.panel.classList.add('swipe-follow');
        } else {
          return;
        }
      }
      // segue il dito; se non c'è una tab in quella direzione fa elastico
      var hasNeighbor = dx < 0 ? ctx.idx < ctx.tabs.length - 1 : ctx.idx > 0;
      var damp = hasNeighbor ? 0.9 : 0.25;
      ctx.panel.style.transform = 'translateX(' + Math.round(dx * damp) + 'px)';
    }, { passive: true });

    main.addEventListener('touchend', function (e) {
      if (!tracking) {
        return;
      }
      tracking = false;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      var horizontal = Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5;
      if (following) {
        var target = ctx.idx + (dx < 0 ? 1 : -1);
        if (horizontal && target >= 0 && target < ctx.tabs.length) {
          endFollow(false);
          goTo(ctx.tabs, target);
        } else {
          endFollow(true);
        }
      } else if (horizontal) {
        var c = getSubtabContext();
        if (c && c.idx >= 0) {
          var t2 = c.idx + (dx < 0 ? 1 : -1);
          if (t2 >= 0 && t2 < c.tabs.length) {
            goTo(c.tabs, t2);
          }
        }
      }
      following = false;
      ctx = null;
    }, { passive: true });

    main.addEventListener('touchcancel', function () {
      if (following) {
        endFollow(true);
      }
      tracking = false;
      following = false;
      ctx = null;
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
