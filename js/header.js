(function () {
  function render() {
    var view = window.AppEngine.getView();
    var nameEl = document.getElementById('header-name');
    var classEl = document.getElementById('header-class');
    var metaEl = document.getElementById('header-meta');
    if (nameEl) {
      nameEl.textContent = view.name;
    }
    if (classEl) {
      classEl.textContent = view.headerLine;
    }
    if (metaEl) {
      metaEl.textContent = view.speciesLabel;
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
