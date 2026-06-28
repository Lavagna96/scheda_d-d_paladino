(function () {
  var cfg = window.APP_CONFIG;

  function render() {
    var ch = cfg.CHARACTER;
    var nameEl = document.getElementById('header-name');
    var metaEl = document.getElementById('header-meta');
    if (nameEl) {
      nameEl.textContent = ch.name + ' — Paladino Lv.7';
    }
    if (metaEl) {
      metaEl.textContent = ch.classLine.split('·')[0].trim();
    }
  }

  function init() {
    render();
  }

  window.AppHeader = {
    init: init,
    render: render
  };
})();
