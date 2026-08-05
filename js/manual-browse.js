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
      group.rows.push({ name: f.name, sub: f.prereq || '', body: '<p class="sheet-desc">' + f.desc + '</p>' });
    });

    return {
      title: 'Manuale 5.5 — Talenti',
      hint: 'Tocca un talento per leggere i dettagli',
      groups: groups.filter(function (g) { return g.rows.length > 0; })
    };
  }

  /* {{segnaposto}} nei tratti di specie (es. {{dragon_ancestor}}) dipendono
     da una scelta del giocatore che qui non esiste (nessun personaggio
     caricato): a differenza di js/traits.js — che li risolve sui dati REALI
     del personaggio — qui bastano dei testi generici "a scelta", stesso
     spirito dei fallback "non scelto/a" già usati altrove nell'app. */
  function fillTemplate(str, ctx) {
    if (!str) {
      return str;
    }

    return str.replace(/\{\{(\w[\w-]*)\}\}/g, function (match, key) {
      return (ctx && ctx[key] !== undefined) ? String(ctx[key]) : match;
    });
  }

  function speciesTemplateCtx() {
    var higherSpell = ' Ai livelli 3 e 5 impari un incantesimo sempre preparato (1 lancio gratis a riposo lungo).';

    return {
      dragon_ancestor: 'a scelta', dragon_damage: 'del tipo scelto',
      elf_lineage: 'a scelta', elf_cantrip: 'del retaggio scelto', elf_darkvision: 18,
      elf_higher_spell: higherSpell,
      elf_skill: 'Intuizione, Percezione o Sopravvivenza (a scelta)',
      goliath_gift: 'a scelta', goliath_gift_desc: '',
      tiefling_legacy: 'a scelta', tiefling_damage: 'del tipo scelto', tiefling_cantrip: 'del retaggio scelto',
      tiefling_higher_spell: higherSpell,
      gnome_lineage: 'a scelta', gnome_cantrip: 'del retaggio scelto', gnome_extra: ''
    };
  }

  function speciesData() {
    var manual = window.MANUAL_55 || { species: {} };
    var ctx = speciesTemplateCtx();
    var ids = Object.keys(manual.species || {}).sort(function (a, b) {
      return manual.species[a].name.localeCompare(manual.species[b].name, 'it');
    });
    var rows = ids.map(function (id) {
      var sp = manual.species[id];
      var sub = 'Taglia ' + sp.size + ' · Velocità ' + sp.speedM.toLocaleString('it-IT') + ' m';
      // A differenza di js/traits.js (che filtra trait:false per non
      // duplicare card già mostrate altrove nella scheda live), qui non c'è
      // una scheda: ogni tratto è contenuto vero del manuale, va mostrato
      // tutto (es. l'Ascendenza Draconica del Dragonide, trait:false lì
      // perché ridondante con un altro campo della scheda).
      var body = '<p class="sc-meta">' + sub + '</p>' +
        sp.traits.map(function (t) {
          return '<p class="sheet-desc"><b>' + t.name + '.</b> ' + fillTemplate(t.desc, ctx) + '</p>';
        }).join('');

      return { name: sp.name, sub: sub, body: body };
    });

    return {
      title: 'Manuale 5.5 — Specie',
      hint: 'Tocca una specie per leggere i tratti',
      groups: [{ label: 'Specie', rows: rows }]
    };
  }

  var ABIL_NAMES = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };

  function skillLabel(id) {
    var s = ((window.AppEngine && window.AppEngine.SKILLS) || []).filter(function (x) { return x.id === id; })[0];

    return s ? s.label : id;
  }

  function packLine(letter, pack) {
    if (!pack) {
      return '';
    }
    var parts = (pack.items || []).slice();
    var mo = (pack.coins || {}).mo || 0;
    if (mo) {
      parts.push(mo + ' mo');
    }

    return letter + ' · ' + (pack.label ? pack.label + ': ' : '') + parts.join(', ');
  }

  function backgroundsData() {
    var manual = window.MANUAL_55 || { backgrounds: {}, originFeats: {} };
    var ids = Object.keys(manual.backgrounds || {}).sort(function (a, b) {
      return manual.backgrounds[a].name.localeCompare(manual.backgrounds[b].name, 'it');
    });
    var rows = ids.map(function (id) {
      var bg = manual.backgrounds[id];
      var feat = (manual.originFeats || {})[bg.featId] || {};
      var skillNames = bg.skills.map(skillLabel);
      var abilNames = bg.abilities.map(function (a) { return ABIL_NAMES[a] || a; });
      var tool = bg.tool || (bg.toolChoice + ' (a scelta)');

      var body =
        '<p class="sheet-desc"><b>Punteggi.</b> ' + abilNames.join(', ') + ' (+2/+1 o +1/+1/+1).</p>' +
        '<p class="sheet-desc"><b>Competenze.</b> ' + skillNames.join(', ') + '.</p>' +
        '<p class="sheet-desc"><b>Strumenti.</b> ' + tool + '.</p>' +
        '<p class="sheet-desc"><b>Talento.</b> ' + feat.name + (bg.featNote ? ' — ' + bg.featNote : '') + '.' +
          (feat.desc ? ' ' + feat.desc : '') + '</p>' +
        '<p class="sc-meta">' + [packLine('A', bg.equipment.a), packLine('B', bg.equipment.b)].filter(Boolean).join(' &nbsp;·&nbsp; ') + '</p>';

      return { name: bg.name, sub: skillNames.join(', '), body: body };
    });

    return {
      title: 'Manuale 5.5 — Background',
      hint: 'Tocca un background per leggere cosa dà',
      groups: [{ label: 'Background', rows: rows }]
    };
  }

  function classesData() {
    var manual = window.MANUAL_55 || { classes: {} };
    var ids = Object.keys(manual.classes || {}).sort(function (a, b) {
      return manual.classes[a].name.localeCompare(manual.classes[b].name, 'it');
    });
    var rows = ids.map(function (id) {
      var k = manual.classes[id];
      var sub = 'Dado Vita ' + k.hitDie + ' · TS ' + k.saves.join('/');
      var body = '<p class="sc-meta">' + sub + '</p>';
      var levels = Object.keys(k.levelFeatures || {}).map(Number).sort(function (a, b) { return a - b; });
      levels.forEach(function (lvl) {
        body += '<div class="gloss-sec">' + lvl + '° livello</div>';
        k.levelFeatures[lvl].forEach(function (f) {
          body += '<p class="sheet-desc"><b>' + f.name + '.</b> ' + f.desc + '</p>';
        });
      });
      var subNames = Object.keys(k.subclasses || {}).map(function (s) { return k.subclasses[s].name; });
      if (subNames.length) {
        body += '<p class="sc-meta">Sottoclassi: ' + subNames.join(', ') + '</p>';
      }

      return { name: k.name, sub: sub, body: body };
    });

    return {
      title: 'Manuale 5.5 — Classi',
      hint: 'Tocca una classe per i privilegi 1→20',
      groups: [{ label: 'Classi', rows: rows }]
    };
  }

  var SOURCES = { talenti: featsData, specie: speciesData, background: backgroundsData, classi: classesData };

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
        window.AppBottomSheet.open(item.name, item.body);
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
