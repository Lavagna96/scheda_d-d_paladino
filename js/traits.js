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

  // Frase dell'incantesimo di livello 3/5 sempre preparato (Elfo/Tiefling):
  // solo le clausole già sbloccate al livello corrente, mai un incantesimo
  // che il personaggio non ha ancora imparato. `level5` può mancare dal dato
  // (vedi tieflingLegacies.infernale, cella assente nel PDF sorgente): in tal
  // caso, se il livello lo richiederebbe, lo segnala invece di inventarlo.
  function higherSpellText(entry, level) {
    if (!entry) {
      return '';
    }
    var parts = [];
    if (level >= 3 && entry.level3) {
      parts.push(entry.level3 + ' (dal 3° livello)');
    }
    if (level >= 5) {
      if (entry.level5) {
        parts.push(entry.level5 + ' (dal 5°)');
      } else if (entry.level5 === null) {
        parts.push('incantesimo di 5° livello da verificare sul manuale');
      }
    }
    if (!parts.length) {
      return ' Ai livelli 3 e 5 impari un incantesimo sempre preparato (1 lancio gratis a riposo lungo).';
    }

    return ' Incantesimo sempre preparato: ' + parts.join(', ') + ' (1 lancio gratis a riposo lungo ciascuno).';
  }

  var ELF_SKILL_LABELS = { intuizione: 'Intuizione', percezione: 'Percezione', sopravvivenza: 'Sopravvivenza' };

  function buildTemplateCtx(view, character) {
    var manual = window.MANUAL_55 || {};
    var level = character.level;

    var dragonAncestor = (manual.dragonAncestors || {})[character.dragonAncestryId];
    var elfLineage = (manual.elfLineages || {})[character.elfLineageId];
    var goliathGift = (manual.goliathGifts || {})[character.goliathGiftId];
    var tieflingLegacy = (manual.tieflingLegacies || {})[character.tieflingLegacyId];
    var gnomeLineage = (manual.gnomeLineages || {})[character.gnomeLineageId];

    var gnomeExtra = '';
    if (gnomeLineage && character.gnomeLineageId === 'boschi') {
      gnomeExtra = ' Incantesimo sempre preparato: ' + gnomeLineage.preparedSpell +
        ' (usi pari al bonus di competenza per riposo lungo).';
    } else if (gnomeLineage && gnomeLineage.desc) {
      gnomeExtra = ' ' + gnomeLineage.desc;
    }

    return {
      mod_car: window.AppEngine.formatMod(view.mods.CAR),
      aura_bonus: view.aura.text,
      aura_range_m: view.aura.rangeM,
      sacred_weapon_bonus: view.sacredWeaponText,
      prof_bonus: view.profBonus,
      level: level,

      dragon_ancestor: dragonAncestor ? dragonAncestor.name : 'non scelta',
      dragon_damage: dragonAncestor ? dragonAncestor.dmg.toLowerCase() : 'del tipo scelto',

      elf_lineage: elfLineage ? elfLineage.name : 'non scelto',
      elf_cantrip: elfLineage ? elfLineage.cantrip : 'nessuno',
      elf_darkvision: elfLineage ? elfLineage.darkvisionM : 18,
      elf_higher_spell: higherSpellText(elfLineage, level),
      elf_skill: character.elfSkillId ? ELF_SKILL_LABELS[character.elfSkillId] : 'Intuizione, Percezione o Sopravvivenza (a scelta)',

      goliath_gift: goliathGift ? goliathGift.name : 'non scelto',
      goliath_gift_desc: goliathGift ? goliathGift.desc : '',

      tiefling_legacy: tieflingLegacy ? tieflingLegacy.name : 'non scelto',
      tiefling_damage: tieflingLegacy ? tieflingLegacy.resist.toLowerCase() : 'del tipo scelto',
      tiefling_cantrip: tieflingLegacy ? tieflingLegacy.cantrip : 'nessuno',
      tiefling_higher_spell: higherSpellText(tieflingLegacy, level),

      gnome_lineage: gnomeLineage ? gnomeLineage.name : 'non scelto',
      gnome_cantrip: gnomeLineage ? gnomeLineage.cantrip : 'nessuno',
      gnome_extra: gnomeExtra
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

    /* Allineamento e lingue (passo Identità della creazione, 5.B.7): campi
       assenti sui personaggi creati prima di questa funzionalità, quindi con
       un trattino di fallback invece di restare vuoti. */
    var alignEl = document.getElementById('identity-alignment');
    if (alignEl) {
      alignEl.textContent = character.alignment || '—';
    }
    var langEl = document.getElementById('identity-languages');
    if (langEl) {
      langEl.textContent = (character.languages || []).length ? character.languages.join(', ') : '—';
    }

    /* Card "Lama Vincolante": HTML statico pensato per Tharion, mai reso
       condizionale — compariva per QUALUNQUE personaggio, anche uno senza
       quell'oggetto (trovato testando il Druido). Visibile solo se il
       personaggio ha davvero i modifiers della spada (character.modifiers,
       source 'Lama Vincolante...'), stesso principio di hasSteed/grimoire
       già usato per gli altri residui di Tharion (5.B.3). */
    var swordCard = document.getElementById('lama-vincolante-card');
    if (swordCard) {
      var hasSword = (character.modifiers || []).some(function (m) {
        return (m.source || '').indexOf('Lama Vincolante') === 0;
      });
      swordCard.classList.toggle('hidden', !hasSword);
    }
  }

  window.AppTraits = {
    init: render,
    render: render
  };
})();
