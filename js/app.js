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

  function bindStandaloneViewportFix() {
    // iOS standalone: al lancio la webview a volte è più corta dello schermo
    // e il menu fisso resta sollevato con un vuoto sotto. Finora la correzione
    // avveniva per caso con lo zoom della tastiera; qui forziamo lo stesso
    // ricalcolo ritoccando il meta viewport, senza zoom.
    if (!navigator.standalone) {
      return;
    }
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      return;
    }
    var content = meta.getAttribute('content');

    function kick() {
      if (Math.abs(window.innerHeight - screen.height) <= 2) {
        return; // altezza già corretta
      }
      meta.setAttribute('content', content.replace('initial-scale=1.0', 'initial-scale=1.0001'));
      requestAnimationFrame(function () {
        meta.setAttribute('content', content);
        window.scrollTo(0, 0);
      });
    }

    [0, 150, 600, 1500].forEach(function (delay) {
      setTimeout(kick, delay);
    });
    window.addEventListener('pageshow', kick);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        setTimeout(kick, 100);
      }
    });
  }

  function init() {
    bindViewportGuard();
    bindStandaloneViewportFix();
    bindNav();
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
