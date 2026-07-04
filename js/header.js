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

  function init() {
    render();
  }

  window.AppHeader = {
    init: init,
    render: render
  };
})();
