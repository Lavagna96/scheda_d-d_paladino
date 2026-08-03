(function () {
  function render() {
    var view = window.AppEngine.getView();
    var nameEl = document.getElementById('header-name');
    var classBadge = document.getElementById('header-badge-class');
    var levelBadge = document.getElementById('header-badge-level');
    var speciesBadge = document.getElementById('header-badge-species');
    if (nameEl) {
      nameEl.textContent = view.name;
    }
    if (classBadge) {
      classBadge.textContent = view.className;
    }
    if (levelBadge) {
      levelBadge.textContent = 'Livello ' + view.level;
    }
    if (speciesBadge) {
      speciesBadge.textContent = view.speciesLabel;
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
    var afcNameInput = document.getElementById('avatar-name-input');
    // Non tocca il valore mentre l'utente ci sta scrivendo dentro: un render
    // esterno (es. da un'altra scheda dello stesso stato) non deve rimangiarsi
    // il carattere appena digitato.
    if (afcNameInput && document.activeElement !== afcNameInput) {
      afcNameInput.value = ch.name || 'Personaggio';
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

  // Stesso schema di steed-name-input (js/sheet.js, bindSteedName): salva a
  // ogni tasto, senza pop-up o matita dedicati.
  function bindNameEdit() {
    var input = document.getElementById('avatar-name-input');
    if (!input) {
      return;
    }
    input.addEventListener('input', function () {
      var state = window.AppStorage.getState();
      state.character.name = input.value;
      window.AppStorage.saveState(state);
      var nameEl = document.getElementById('header-name');
      if (nameEl) {
        nameEl.textContent = input.value || 'Personaggio';
      }
    });
  }

  function init() {
    render();
    bindAvatarModal();
    bindNameEdit();
  }

  window.AppHeader = {
    init: init,
    render: render
  };
})();
