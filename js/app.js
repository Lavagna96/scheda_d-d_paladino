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

  function initSubTabs(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    var tabs = container.querySelectorAll('.subtab');
    var panels = container.querySelectorAll('.subpanel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-subtab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-subpanel') === target);
        });
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

  function navigateSubtabs(dir) {
    var view = document.getElementById('view-' + currentView);
    if (!view) {
      return;
    }
    var tabs = view.querySelectorAll('.subtabs .subtab');
    if (!tabs.length) {
      return;
    }
    var idx = -1;
    tabs.forEach(function (t, i) {
      if (t.classList.contains('active')) {
        idx = i;
      }
    });
    var next = idx + dir;
    if (idx < 0 || next < 0 || next >= tabs.length) {
      return;
    }
    tabs[next].click();
    tabs[next].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  function bindSwipeTabs() {
    // Swipe orizzontale su mobile per passare tra le sotto-tab della vista
    // attiva. Il menu in basso resta solo al click. Escludiamo i controlli
    // che gestiscono già il drag/scroll orizzontale.
    var main = document.getElementById('main-content');
    if (!main) {
      return;
    }
    var startX = 0;
    var startY = 0;
    var tracking = false;

    main.addEventListener('touchstart', function (e) {
      tracking = false;
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

    main.addEventListener('touchend', function (e) {
      if (!tracking) {
        return;
      }
      tracking = false;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8) {
        return;
      }
      navigateSubtabs(dx < 0 ? 1 : -1);
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
