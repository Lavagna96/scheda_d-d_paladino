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

    // Ritratto personalizzato (Fase 2): se presente sovrascrive i jpg
    // statici, sia nell'avatar dell'header sia nel modal a schermo intero.
    var portrait = window.AppStorage.getState().character.portrait;
    if (portrait) {
      var avatarImg = document.querySelector('.avatar-img');
      if (avatarImg) {
        avatarImg.src = portrait;
        avatarImg.style.display = ''; // toglie l'eventuale display:none dell'onerror
      }
      var fullImg = document.getElementById('avatar-full-img');
      if (fullImg) {
        fullImg.src = portrait;
      }
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
