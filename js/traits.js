(function () {
  /*
   * Privilegi di classe/sottoclasse e tratti di specie (Step 4.5): le due
   * card statiche "Privilegi di Classe & Aure" e "Tratti <Specie>" diventano
   * derivate da js/manual-55.js (classes[...].levelFeatures/subclasses,
   * species[...].traits) + i fatti base del personaggio, invece di HTML
   * scritto a mano. Curatela dei privilegi "già mostrati altrove" via il
   * flag `trait: false` sui dati del manuale (vedi Step 4.1).
   *
   * Le card generate riusano ESATTAMENTE il markup/CSS di quelle statiche di
   * prima (.feat.pressable + data-detail-title/data-detail-body): restano
   * agganciate al bottom sheet di sola lettura esistente (js/bottom-sheet.js,
   * long press) senza bisogno di codice nuovo per l'interazione.
   */

  var FD_MAX = 90;
  var FD_TRUNCATE_AT = 87;

  /* ---------- piccolo motore di sostituzione segnaposto ----------
     {{chiave}} -> ctx[chiave]; se la chiave manca il segnaposto resta
     invariato (mai un errore). Chiavi piatte, niente path annidati. */
  function fillTemplate(str, ctx) {
    if (!str) {
      return str;
    }

    return str.replace(/\{\{(\w[\w-]*)\}\}/g, function (match, key) {
      return (ctx && ctx[key] !== undefined) ? String(ctx[key]) : match;
    });
  }

  function buildTemplateCtx(view, character) {
    return {
      mod_car: window.AppEngine.formatMod(view.mods.CAR),
      aura_bonus: view.aura.text,
      aura_range_m: view.aura.rangeM,
      sacred_weapon_bonus: view.sacredWeaponText,
      prof_bonus: view.profBonus,
      level: character.level
    };
  }

  function truncateFd(str) {
    if (str && str.length > FD_MAX) {
      return str.slice(0, FD_TRUNCATE_AT) + '…';
    }

    return str;
  }

  /* ---------- costruzione di una card a partire da una voce del manuale ---------- */

  function buildCard(entry, group, ctx, view) {
    var detailBody = fillTemplate(entry.desc, ctx);
    var fd;
    if (entry.name === 'Aura di Protezione') {
      // Stessa formula esatta della vecchia renderFeatures in js/stats.js
      fd = view.aura.text + ' (CAR) a tutti i TS per te e alleati entro ' + view.aura.rangeM + ' m.';
    } else if (entry.name === 'Arma Sacra') {
      fd = view.sacredWeaponText + ' colpire, danni Radiosi, luce 6 m per 10 min.';
    } else {
      fd = truncateFd(fillTemplate(entry.desc, ctx));
    }

    return { name: entry.name, fd: fd, detailBody: detailBody, group: group };
  }

  /* ---------- raccolta delle card applicabili al personaggio ---------- */

  function collectTraitCards(character, level) {
    var manual = window.MANUAL_55 || { classes: {}, species: {} };
    var view = window.AppEngine.getView();
    var ctx = buildTemplateCtx(view, character);
    var cards = [];

    var klass = manual.classes[character.classId];

    if (klass && klass.levelFeatures) {
      for (var lvl = 1; lvl <= level; lvl++) {
        (klass.levelFeatures[lvl] || []).forEach(function (entry) {
          if (entry.trait !== false) {
            cards.push(buildCard(entry, 'class', ctx, view));
          }
        });
      }
    }

    if (klass && character.subclassId && klass.subclasses && klass.subclasses[character.subclassId]) {
      var sub = klass.subclasses[character.subclassId];
      for (var slvl = 1; slvl <= level; slvl++) {
        (sub.features[slvl] || []).forEach(function (entry) {
          cards.push(buildCard(entry, 'class', ctx, view));
        });
      }
    }

    var species = manual.species[character.speciesId];
    if (species && species.traits) {
      species.traits.forEach(function (entry) {
        if (entry.trait !== false && (!entry.minLevel || level >= entry.minLevel)) {
          cards.push(buildCard(entry, 'species', ctx, view));
        }
      });
    }

    return cards;
  }

  /* ---------- DOM ---------- */

  function buildFeatEl(card) {
    var div = document.createElement('div');
    div.className = 'feat pressable';
    div.setAttribute('data-detail-title', card.name);
    div.setAttribute('data-detail-body', card.detailBody);

    var head = document.createElement('div');
    head.className = 'feat-head';
    var ft = document.createElement('span');
    ft.className = 'ft';
    ft.textContent = card.name;
    head.appendChild(ft);
    div.appendChild(head);

    var fd = document.createElement('div');
    fd.className = 'fd';
    fd.textContent = card.fd;
    div.appendChild(fd);

    return div;
  }

  function render() {
    var character = window.AppStorage.getState().character;
    var cards = collectTraitCards(character, character.level);

    var classList = document.getElementById('class-traits-list');
    if (classList) {
      classList.innerHTML = '';
      cards.filter(function (c) { return c.group === 'class'; })
        .forEach(function (c) { classList.appendChild(buildFeatEl(c)); });
    }

    var speciesList = document.getElementById('species-traits-list');
    if (speciesList) {
      speciesList.innerHTML = '';
      cards.filter(function (c) { return c.group === 'species'; })
        .forEach(function (c) { speciesList.appendChild(buildFeatEl(c)); });
    }

    var speciesTitleEl = document.getElementById('species-traits-title');
    if (speciesTitleEl) {
      var manual = window.MANUAL_55 || { species: {} };
      var species = manual.species[character.speciesId];
      speciesTitleEl.textContent = 'Tratti ' + (character.speciesLabel || (species && species.name) || '');
    }
  }

  window.AppTraits = {
    init: render,
    render: render
  };
})();
