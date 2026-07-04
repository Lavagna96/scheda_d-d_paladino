(function () {
  var cfg = window.APP_CONFIG;

  function render() {
    var ch = cfg.CHARACTER;
    var nameEl = document.getElementById('header-name');
    var classEl = document.getElementById('header-class');
    var metaEl = document.getElementById('header-meta');
    if (nameEl) {
      nameEl.textContent = ch.name;
    }
    if (classEl) {
      classEl.textContent = 'Paladino · Livello 7';
    }
    if (metaEl) {
      metaEl.textContent = ch.classLine.split('·')[0].trim();
    }
  }

  function bindAvatarModal() {
    var btn = document.getElementById('avatar-btn');
    var modal = document.getElementById('avatar-modal');
    var closeBtn = document.getElementById('avatar-modal-close');
    if (!btn || !modal) {
      return;
    }

    function open() {
      modal.classList.remove('hidden');
    }

    function close() {
      modal.classList.add('hidden');
    }

    btn.addEventListener('click', open);
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
    // tap sullo sfondo (fuori dalla cornice) chiude
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        close();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        close();
      }
    });
  }

  function init() {
    render();
    bindAvatarModal();
  }

  window.AppHeader = {
    init: init,
    render: render
  };
})();
