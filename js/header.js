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

    /* Ritratto (Fase 2 + 5.B.3): viene sempre dal personaggio — quello caricato
       dall'utente, oppure i jpg di Tharion che ora stanno nei suoi default.
       Chi non ne ha uno resta con l'emblema ✦ sotto, invece di ereditare la
       faccia di Tharion dall'HTML statico. */
    var ch = window.AppStorage.getState().character;
    var avatarImg = document.querySelector('.avatar-img');
    if (avatarImg) {
      if (ch.portrait) {
        avatarImg.src = ch.portrait;
        avatarImg.style.display = ''; // toglie l'eventuale display:none dell'onerror
        avatarImg.alt = 'Ritratto di ' + (ch.name || 'personaggio');
      } else {
        avatarImg.style.display = 'none';
      }
    }
    var fullImg = document.getElementById('avatar-full-img');
    if (fullImg) {
      var full = ch.portrait ? (ch.portraitFull || ch.portrait) : '';
      fullImg.src = full;
      fullImg.style.display = full ? '' : 'none';
      fullImg.alt = 'Ritratto di ' + (ch.name || 'personaggio');
    }
    var afcName = document.querySelector('.afc-name');
    if (afcName) {
      afcName.textContent = ch.name || 'Personaggio';
    }
    var afcSub = document.querySelector('.afc-sub');
    if (afcSub) {
      afcSub.textContent = view.classLine || '—';
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
