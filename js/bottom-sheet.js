(function () {
  var LONG_PRESS_MS = 500;
  var pressTimer = null;
  var pressTarget = null;

  function open(title, body) {
    var overlay = document.getElementById('bottom-sheet-overlay');
    var titleEl = document.getElementById('sheet-title');
    var bodyEl = document.getElementById('sheet-body');
    if (!overlay) {
      return;
    }
    titleEl.textContent = title || '';
    bodyEl.innerHTML = body || '';
    overlay.classList.remove('hidden');
  }

  function close() {
    var overlay = document.getElementById('bottom-sheet-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  function getDetail(el) {
    var title = el.getAttribute('data-detail-title');
    var body = el.getAttribute('data-detail-body');
    if (title && body) {
      return { title: title, body: body };
    }
    var ft = el.querySelector('.ft');
    var fd = el.querySelector('.fd');
    if (ft && fd) {
      return { title: ft.textContent, body: fd.innerHTML };
    }
    var actionTitle = el.querySelector('.action-title');
    if (actionTitle) {
      return {
        title: actionTitle.textContent,
        body: el.getAttribute('data-detail-body') || el.querySelector('p').innerHTML
      };
    }
    var scName = el.querySelector('.sc-name');
    var scDesc = el.querySelector('.sc-desc');
    if (scName && scDesc) {
      return { title: scName.textContent, body: scDesc.innerHTML };
    }

    return null;
  }

  function bindLongPress() {
    document.addEventListener('touchstart', function (e) {
      var el = e.target.closest('.pressable, .feat, .action-card, .spellcard');
      if (!el) {
        return;
      }
      pressTarget = el;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        var detail = getDetail(pressTarget);
        if (detail) {
          open(detail.title, detail.body);
        }
        pressTarget = null;
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('touchmove', function () {
      clearTimeout(pressTimer);
      pressTarget = null;
    }, { passive: true });

    document.addEventListener('touchend', function () {
      clearTimeout(pressTimer);
      pressTarget = null;
    }, { passive: true });

    document.addEventListener('click', function (e) {
      var info = e.target.closest('.detail-info');
      if (info) {
        var el = info.closest('.pressable, .feat, .action-card');
        if (el) {
          var detail = getDetail(el);
          if (detail) {
            open(detail.title, detail.body);
          }
        }
      }
    });
  }

  function init() {
    var overlay = document.getElementById('bottom-sheet-overlay');
    var closeBtn = document.getElementById('sheet-close');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          close();
        }
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
    bindLongPress();
  }

  window.AppBottomSheet = {
    init: init,
    open: open,
    close: close
  };
})();
