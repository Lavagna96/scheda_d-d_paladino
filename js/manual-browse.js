(function () {
  // Consultazione a sola lettura di sezioni del Manuale 5.5 diverse dagli
  // Incantesimi (che restano in grimorio.js, hanno bisogno dei chip di
  // classe). Stesso pattern visivo (righe .gloss-row, tocco → dettaglio nel
  // bottom sheet): un solo modal generico #browse-modal, alimentato da una
  // funzione per "kind" che normalizza i dati del manuale in gruppi di righe.
  // Pensato per crescere: Specie e Background si aggiungono come nuove voci
  // di SOURCES, zero markup/CSS nuovo.

  function featsData() {
    var manual = window.MANUAL_55 || { feats: {} };
    var CATS = [
      { key: 'stile', label: 'Stili di Combattimento' },
      { key: 'generale', label: 'Generali' },
      { key: 'dono-epico', label: 'Doni Epici' }
    ];
    var groups = CATS.map(function (c) { return { label: c.label, key: c.key, rows: [] }; });
    Object.keys(manual.feats || {}).forEach(function (id) {
      var f = manual.feats[id];
      var group = groups.filter(function (g) { return g.key === f.category; })[0];
      if (!group) {
        return;
      }
      group.rows.push({ name: f.name, sub: f.prereq || '', body: f.desc });
    });

    return {
      title: 'Manuale 5.5 — Talenti',
      hint: 'Tocca un talento per leggere i dettagli',
      groups: groups.filter(function (g) { return g.rows.length > 0; })
    };
  }

  var SOURCES = { talenti: featsData };

  function row(item) {
    var el = document.createElement('div');
    el.className = 'gloss-row';
    el.innerHTML =
      '<span class="gloss-lvl-dot" aria-hidden="true">&#9679;</span>' +
      '<div class="gloss-info">' +
        '<span class="gloss-name">' + item.name + '</span>' +
        (item.sub ? '<span class="gloss-sub">' + item.sub + '</span>' : '') +
      '</div>';
    el.addEventListener('click', function () {
      if (window.AppBottomSheet) {
        window.AppBottomSheet.open(item.name, '<p>' + item.body + '</p>');
      }
    });

    return el;
  }

  function render(kind) {
    var list = document.getElementById('browse-list');
    var title = document.getElementById('browse-title');
    var hint = document.getElementById('browse-hint');
    var getData = SOURCES[kind];
    if (!list || !getData) {
      return;
    }
    var data = getData();
    if (title) {
      title.textContent = data.title;
    }
    if (hint) {
      hint.textContent = data.hint;
    }
    list.innerHTML = '';
    data.groups.forEach(function (g) {
      var head = document.createElement('div');
      head.className = 'gloss-sec';
      head.textContent = g.label;
      list.appendChild(head);
      g.rows.forEach(function (r) { list.appendChild(row(r)); });
    });
  }

  function open(kind) {
    var modal = document.getElementById('browse-modal');
    if (!modal || !SOURCES[kind]) {
      return;
    }
    render(kind);
    modal.classList.remove('hidden');
  }

  function close() {
    var modal = document.getElementById('browse-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function init() {
    var closeBtn = document.getElementById('browse-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
  }

  window.AppManualBrowse = { init: init, open: open, close: close };
})();
