(function () {
  function render() {
    var state = window.AppStorage.getState();
    var badge = document.getElementById('insp-badge');
    if (!badge) {
      return;
    }
    badge.textContent = state.inspiration ? '★' : '☆';
    badge.classList.toggle('active', state.inspiration);
    badge.title = state.inspiration ? 'Ispirazione attiva' : 'Nessuna ispirazione';
  }

  function toggle() {
    var state = window.AppStorage.getState();
    state.inspiration = !state.inspiration;
    window.AppStorage.saveState(state, true);
    render();
  }

  function init() {
    render();
    var badge = document.getElementById('insp-badge');
    if (badge) {
      badge.addEventListener('click', toggle);
    }
  }

  window.AppInspiration = {
    init: init,
    render: render,
    toggle: toggle
  };
})();
