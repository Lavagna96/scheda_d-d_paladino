(function () {
  /*
   * Reliquie / oggetti magici creati dall'utente (Step 3.5, redesign 3.6). Ogni
   * oggetto ha una lista di effetti che il motore somma automaticamente (vedi
   * modSum in js/engine.js, character.items è un array SEPARATO da
   * character.modifiers, che resta intatto) e, opzionalmente, un numero di usi
   * giornalieri che genera una res-card dinamica nella tab Risorse.
   *
   * Dal redesign 3.6 le card create dall'utente condividono il markup/CSS
   * delle due reliquie storiche hardcoded in index.html (Lama Vincolante,
   * Scudo Magico: classi .relic-acc/.relic-card/.relic-rarity definite in
   * css/components/treasury.css) invece dello stile .item-card precedente.
   *
   * Stesso pattern "overlay gemello" di js/edit-sheet.js: bozza locale
   * finché non si preme Salva, chiudere con ✕/tap-fuori scarta tutto.
   */

  /* Etichette per esteso (mai sigle) degli effetti numerici supportati dal
     motore. Velocità e Percezione passiva sono arrivate con lo Step 3.9.a:
     ganci diretti su una riga di engine.js ciascuna (speedM/passivePerception
     già calcolati, mancava solo la somma modSum). */
  var EFFECT_OPTIONS = [
    { id: 'attacco', label: 'Colpire con le armi' },
    { id: 'danni', label: 'Danni con le armi' },
    { id: 'cd-inc', label: 'Difficoltà degli incantesimi' },
    { id: 'att-inc', label: 'Colpire con gli incantesimi' },
    { id: 'ca', label: 'Classe Armatura' },
    { id: 'ts', label: 'Tiri Salvezza' },
    { id: 'iniziativa', label: 'Iniziativa' },
    { id: 'pf-max', label: 'Punti Ferita massimi' },
    { id: 'velocita', label: 'Velocità (m)' },
    { id: 'pp', label: 'Percezione passiva' }
  ];

  function effectLabel(target) {
    var found = null;
    EFFECT_OPTIONS.forEach(function (o) {
      if (o.id === target) {
        found = o.label;
      }
    });

    return found || target;
  }

  /* Sensi strutturati (Step 3.9.b, seconda parte): i 4 sensi speciali del
     PHB 2024. A differenza di resistenze/immunità, qui più oggetti con lo
     STESSO senso non si sommano — nelle regole un senso non "si accumula",
     vale il raggio migliore (vedi aggregazione in renderSenses,
     js/stats.js). Le specie che hanno già Scurovisione la mostrano come
     tratto testuale (invariato, fuori scope): questa sezione è solo per i
     sensi che un OGGETTO concede in più. */
  var SENSE_OPTIONS = [
    { id: 'scurovisione', label: 'Scurovisione' },
    { id: 'vista-cieca', label: 'Vista Cieca' },
    { id: 'vista-vera', label: 'Vista Vera' },
    { id: 'percezione-tremore', label: 'Percezione del Tremore' }
  ];

  function senseLabel(type) {
    var found = null;
    SENSE_OPTIONS.forEach(function (o) {
      if (o.id === type) {
        found = o.label;
      }
    });

    return found || type;
  }

  /* Le 5 rarità D&D usate per il badge .relic-rarity (stesso componente delle
     due reliquie storiche: qui solo le varianti aggiuntive per gli oggetti
     creati dall'utente, vedi css/components/treasury.css). */
  var RARITY_OPTIONS = [
    { id: 'comune', label: 'Comune' },
    { id: 'non-comune', label: 'Non comune' },
    { id: 'raro', label: 'Raro' },
    { id: 'molto-raro', label: 'Molto raro' },
    { id: 'leggendario', label: 'Leggendario' }
  ];

  function rarityLabel(id) {
    var found = null;
    RARITY_OPTIONS.forEach(function (o) {
      if (o.id === id) {
        found = o.label;
      }
    });

    return found || id;
  }

  /* Resistenze & Immunità (Step 3.9.b): tipi di danno ufficiali (PHB 2024)
     per "Resistenza a"; gli stessi più le condizioni più comuni per
     "Immunità a" (un'immunità a una condizione è normale — Spaventato,
     Paralizzato... — una "resistenza" a una condizione invece no, il PHB
     non la prevede: da qui la lista più corta per le resistenze). */
  var DAMAGE_TYPES = [
    'Contundente', 'Perforante', 'Tagliente', 'Acido', 'Freddo', 'Fuoco',
    'Forza', 'Fulmine', 'Necrotico', 'Veleno', 'Psichico', 'Radiante', 'Tuono'
  ];
  var CONDITIONS = ['Spaventato', 'Affascinato', 'Avvelenato', 'Prono', 'Stordito', 'Paralizzato'];

  /* Sintonizzazione (Step 3.6): al massimo 3 oggetti attivi insieme */
  var MAX_ATTUNED = 3;

  /* Sacca dimensionale: contenitore extradimensionale equipaggiabile.
     Monete e bottino party vanno qui (fino a 250 kg); lo zaino personale
     resta sempre sul personaggio. Peso fisso della sacca equipaggiata. */
  var DIMENSIONAL_BAG_CAPACITY_KG = 250;
  var DIMENSIONAL_BAG_SELF_KG = 7.5;

  function attunedCount(ch) {
    return (ch.items || []).filter(function (it) {
      return it.requiresAttunement && it.attuned;
    }).length;
  }

  function canAttune(ch, item) {
    return item.requiresAttunement && !item.attuned && attunedCount(ch) < MAX_ATTUNED;
  }

  /* ---------- fallback di lettura per item salvati prima del redesign 3.6 ---------- */

  function itemArtOf(item) {
    return item.art || { type: 'preset', value: item.icon || 'ring' };
  }

  function itemRarityOf(item) {
    return item.rarity || 'non-comune';
  }

  function itemRequiresAttunementOf(item) {
    return !!item.requiresAttunement;
  }

  function itemAttunedOf(item) {
    return item.attuned !== false;
  }

  function itemResistancesOf(item) {
    return item.resistances || [];
  }

  function itemImmunitiesOf(item) {
    return item.immunities || [];
  }

  function itemSensesOf(item) {
    return item.senses || [];
  }

  function itemKindOf(item) {
    return item.kind || null;
  }

  function isDimensionalBag(item) {
    if (itemKindOf(item) === 'dimensional-bag') {
      return true;
    }
    var art = itemArtOf(item);

    return art.type === 'preset' && art.value === 'bag';
  }

  function itemEquippedOf(item) {
    return !!item.equipped;
  }

  function getDimensionalBags(character) {
    return (character.items || []).filter(isDimensionalBag);
  }

  function getEquippedDimensionalBag(character) {
    var bags = getDimensionalBags(character);
    var equipped = null;
    bags.forEach(function (it) {
      if (itemEquippedOf(it)) {
        equipped = it;
      }
    });
    if (equipped) {
      return equipped;
    }
    // Compatibilità: una sacca sola conta come equipaggiata.
    if (bags.length === 1) {
      return bags[0];
    }

    return null;
  }

  function isBagActive(item, character) {
    var active = getEquippedDimensionalBag(character);

    return !!(active && active.id === item.id);
  }

  function normalizeDimensionalBags(character) {
    var changed = false;
    (character.items || []).forEach(function (it) {
      var art = itemArtOf(it);
      if (art.type === 'preset' && art.value === 'bag' && itemKindOf(it) !== 'dimensional-bag') {
        it.kind = 'dimensional-bag';
        changed = true;
      }
    });
    var bags = getDimensionalBags(character);
    if (bags.length && !bags.some(itemEquippedOf)) {
      bags.forEach(function (it, i) {
        it.equipped = i === 0;
      });
      changed = true;
    }

    return changed;
  }

  function equipDimensionalBag(character, itemId) {
    (character.items || []).forEach(function (it) {
      if (!isDimensionalBag(it)) {
        return;
      }
      it.equipped = it.id === itemId;
    });
  }

  function isWeaponItem(item) {
    if (itemKindOf(item) === 'weapon') {
      return true;
    }
    var art = itemArtOf(item);

    return art.type === 'preset' && art.value === 'sword';
  }

  function itemEffectsActive(item) {
    return !itemRequiresAttunementOf(item) || itemAttunedOf(item);
  }

  function weaponById(id) {
    var found = null;
    (window.MANUAL_55.weapons || []).forEach(function (w) {
      if (w.id === id) {
        found = w;
      }
    });

    return found;
  }

  function profileFromCatalogWeapon(w) {
    return {
      weaponId: w.id,
      name: w.name,
      die: w.die,
      type: w.dmg,
      mastery: w.mastery || '',
      finesse: (w.props || []).indexOf('Accurata') !== -1,
      ranged: w.cat.indexOf('dist') !== -1,
      twoHanded: (w.props || []).indexOf('A due mani') !== -1
    };
  }

  function weaponProfileOf(item) {
    if (item.weaponProfile) {
      return Object.assign({}, item.weaponProfile);
    }
    if (!isWeaponItem(item)) {
      return null;
    }

    return {
      weaponId: '',
      name: item.name || '',
      die: '1d8',
      type: 'tagl.',
      mastery: '',
      finesse: false,
      ranged: false,
      twoHanded: false
    };
  }

  function defaultWeaponProfileFromCharacter() {
    var w = window.AppStorage.getState().character.weapon || {};

    return {
      weaponId: '',
      name: w.name || '',
      die: w.die || '1d8',
      type: w.type || '',
      mastery: w.mastery || '',
      finesse: !!w.finesse,
      ranged: !!w.ranged,
      twoHanded: !!w.twoHanded
    };
  }

  function getEquippedWeaponItem(character) {
    var equipped = null;
    (character.items || []).forEach(function (it) {
      if (isWeaponItem(it) && itemEquippedOf(it) && itemEffectsActive(it)) {
        equipped = it;
      }
    });

    return equipped;
  }

  function activeEquippedWeaponProfile(character) {
    var item = getEquippedWeaponItem(character);
    if (!item) {
      return null;
    }

    return weaponProfileOf(item);
  }

  function equipWeaponItem(character, itemId) {
    (character.items || []).forEach(function (it) {
      if (!isWeaponItem(it)) {
        return;
      }
      it.equipped = it.id === itemId;
    });
  }

  function isWeaponEquipped(item, character) {
    var active = getEquippedWeaponItem(character);

    return !!(active && active.id === item.id);
  }

  /* Bonus della Lama Vincolante statica (config + HTML rimossi): togli i
     modifiers legacy dallo stato salvato così non si sommano alle reliquie
     create dall'utente in tab Oggetti. */
  function stripLegacyRelicModifiers(character) {
    var mods = character.modifiers || [];
    var next = mods.filter(function (m) {
      return (m.source || '').indexOf('Lama Vincolante') !== 0;
    });
    if (next.length === mods.length) {
      return false;
    }
    character.modifiers = next;

    return true;
  }

  function normalizeWeaponItems(character) {
    var changed = false;
    var weapons = (character.items || []).filter(isWeaponItem);
    var hasEquipped = weapons.some(itemEquippedOf);
    (character.items || []).forEach(function (it) {
      if (!isWeaponItem(it)) {
        return;
      }
      if (itemKindOf(it) !== 'weapon') {
        it.kind = 'weapon';
        changed = true;
      }
    });
    if (weapons.length && !hasEquipped) {
      weapons.forEach(function (it, i) {
        it.equipped = i === 0;
      });
      changed = true;
    }

    return changed;
  }

  function defaultShieldAcBonus() {
    return ((window.MANUAL_55 && window.MANUAL_55.shield) || {}).ac || 2;
  }

  function isShieldItem(item) {
    if (itemKindOf(item) === 'shield') {
      return true;
    }
    var art = itemArtOf(item);

    return art.type === 'preset' && art.value === 'shield';
  }

  function shieldProfileOf(item) {
    if (item.shieldProfile) {
      return Object.assign({}, item.shieldProfile);
    }
    if (!isShieldItem(item)) {
      return null;
    }

    return {
      name: item.name || '',
      acBonus: defaultShieldAcBonus()
    };
  }

  function defaultShieldProfileFromCharacter() {
    return {
      name: '',
      acBonus: defaultShieldAcBonus()
    };
  }

  function getEquippedShieldItem(character) {
    var equipped = null;
    (character.items || []).forEach(function (it) {
      if (isShieldItem(it) && itemEquippedOf(it) && itemEffectsActive(it)) {
        equipped = it;
      }
    });

    return equipped;
  }

  function activeEquippedShieldBonus(character) {
    var item = getEquippedShieldItem(character);
    if (!item) {
      return null;
    }

    return shieldProfileOf(item).acBonus;
  }

  function characterHasEquippedShield(character) {
    return !!getEquippedShieldItem(character);
  }

  function equipShieldItem(character, itemId) {
    (character.items || []).forEach(function (it) {
      if (!isShieldItem(it)) {
        return;
      }
      it.equipped = it.id === itemId;
    });
  }

  function isShieldEquipped(item, character) {
    var active = getEquippedShieldItem(character);

    return !!(active && active.id === item.id);
  }

  function normalizeShieldItems(character) {
    var changed = false;
    var shields = (character.items || []).filter(isShieldItem);
    var hasEquipped = shields.some(itemEquippedOf);
    (character.items || []).forEach(function (it) {
      if (!isShieldItem(it)) {
        return;
      }
      if (itemKindOf(it) !== 'shield') {
        it.kind = 'shield';
        changed = true;
      }
    });
    if (shields.length && !hasEquipped) {
      shields.forEach(function (it, i) {
        it.equipped = i === 0;
      });
      changed = true;
    }

    return changed;
  }

  /* Icone (stesso stile minimale a tratto di js/sheet.js: viewBox 24x24,
     stroke corrente, tratto 2). 'sword' e 'shield' sono gli stessi path di
     IC_SWORD/IC_SHIELD in js/sheet.js; le altre 6 sono disegnate ex novo.
     Sono i path centrali usati dentro il medaglione generato da
     medallionSvg() qui sotto, non più mostrate piatte 20x20 come prima del
     redesign 3.6. */
  var SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONS = {
    sword: '<path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"/><path d="M6.5 11.5l6 6"/>',
    shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',
    ring: '<circle cx="12" cy="15" r="5"/><path d="M8.5 10.5l3.5 -6.5l3.5 6.5z"/>',
    amulet: '<path d="M5 4c0 4.5 3 7 7 7s7 -2.5 7 -7"/><circle cx="12" cy="16" r="4"/>',
    cloak: '<path d="M9 8.5a3 3 0 0 1 6 0"/><path d="M7.5 8.5l-3 12h15l-3 -12"/>',
    wand: '<path d="M4.5 19.5l9 -9"/><path d="M17 3l1.2 2.3l2.3 1.2l-2.3 1.2l-1.2 2.3l-1.2 -2.3l-2.3 -1.2l2.3 -1.2z"/>',
    potion: '<path d="M10 3h4"/><path d="M11 3v3.5l-4.3 6.8a3.3 3.3 0 0 0 2.8 5h5a3.3 3.3 0 0 0 2.8 -5l-4.3 -6.8v-3.5"/>',
    tome: '<path d="M4 5a2 2 0 0 1 2 -2h6v18H6a2 2 0 0 1 -2 -2z"/>' +
      '<path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6"/>',
    bag: '<path d="M7 10h10l1 11h-12z"/><path d="M8 10v-2a4 4 0 0 1 8 0v2"/>' +
      '<path d="M6 10q6 -4 12 0"/><path d="M9 14h6"/>'
  };
  var ICON_IDS = ['sword', 'shield', 'ring', 'amulet', 'cloak', 'wand', 'potion', 'tome', 'bag'];

  var TYPE_LABELS = {
    sword: 'Arma',
    shield: 'Scudo',
    ring: 'Anello',
    amulet: 'Amuleto',
    cloak: 'Mantello',
    wand: 'Bacchetta',
    potion: 'Pozione',
    tome: 'Tomo',
    bag: 'Sacca dimensionale'
  };

  function iconSvg(id) {
    return '<svg ' + SVG_ATTRS + '>' + (ICONS[id] || ICONS.ring) + '</svg>';
  }

  /* ---------- medaglione (arte procedurale o foto caricata) ----------
     Dal redesign 3.7 le 8 arti preimpostate sono illustrazioni vere e
     proprie (non più icone a tratto ricolorate), disegnate a mano con la
     stessa tecnica di Lama Vincolante/Scudo Magico in index.html: glow
     radiale, gradienti multipli, gemma con riflesso. 'sword' e 'shield'
     sono ESATTAMENTE gli stessi path/gradienti delle due reliquie storiche
     (stesso identico risultato visivo, non una variante). Le altre 6 sono
     originali, con più livelli di dettaglio (sfaccettature, tessuto,
     venatura del legno...) — vedi PRESET_ART qui sotto. La foto caricata
     dall'utente (art.type === 'image') resta un semplice ritaglio circolare,
     invariata. id univoci per <svg>: su Safari iOS più oggetti in lista con
     lo stesso id di gradient/clipPath confliggono tra loro (bug reale). */
  var medallionUid = 0;

  function presetGold(id) {
    return '<linearGradient id="gold' + id + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#e8c96a"/><stop offset="50%" stop-color="#c9a443"/>' +
      '<stop offset="100%" stop-color="#8a6820"/></linearGradient>';
  }

  var PRESET_ART = {
    /* Spada: identica a Lama Vincolante (stesso path/gradienti, index.html) */
    sword: {
      body: function (id) {
        return '<circle cx="70" cy="72" r="64" fill="url(#glow' + id + ')"/>' +
          '<path d="M70 6 L78 24 L76 92 L64 92 L62 24 Z" fill="url(#blade' + id + ')" stroke="#39445a" stroke-width="1" stroke-linejoin="round"/>' +
          '<path d="M69 26 L71 26 L70.6 88 L69.4 88 Z" fill="rgba(255,255,255,0.5)"/>' +
          '<path d="M70 36 l3.2 5 -3.2 5 -3.2 -5 Z" fill="#c9a443" opacity="0.9"/>' +
          '<path d="M70 56 l3.2 5 -3.2 5 -3.2 -5 Z" fill="#c9a443" opacity="0.65"/>' +
          '<path d="M70 76 l2.6 4 -2.6 4 -2.6 -4 Z" fill="#c9a443" opacity="0.4"/>' +
          '<path d="M44 92 Q70 83 96 92 L96 100 Q70 91 44 100 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1" stroke-linejoin="round"/>' +
          '<rect x="65.5" y="99" width="9" height="26" rx="3.5" fill="#4a1420" stroke="#2e0c15" stroke-width="1"/>' +
          '<path d="M65.5 104 h9 M65.5 110 h9 M65.5 116 h9" stroke="#7a2438" stroke-width="1.4"/>' +
          '<circle cx="70" cy="132" r="8" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="2"/>' +
          '<ellipse cx="67" cy="129" rx="2.6" ry="1.6" fill="rgba(255,255,255,0.55)" transform="rotate(-24 67 129)"/>';
      },
      grad: function (id) {
        return '<linearGradient id="blade' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#e8eef5"/><stop offset="45%" stop-color="#aabccf"/><stop offset="100%" stop-color="#5d6f84"/></linearGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#ff8a9a"/><stop offset="45%" stop-color="#cc2440"/><stop offset="100%" stop-color="#660514"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="45%" r="52%"><stop offset="0%" stop-color="rgba(201,164,67,0.38)"/><stop offset="65%" stop-color="rgba(201,164,67,0.1)"/><stop offset="100%" stop-color="rgba(201,164,67,0)"/></radialGradient>';
      }
    },
    /* Scudo: identico a Scudo Magico (stesso path/gradienti, index.html) */
    shield: {
      body: function (id) {
        return '<circle cx="70" cy="74" r="64" fill="url(#glow' + id + ')"/>' +
          '<path d="M70 16 C88 26 104 28 112 26 C112 68 102 106 70 128 C38 106 28 68 28 26 C36 28 52 26 70 16 Z" fill="url(#steel' + id + ')" stroke="url(#gold' + id + ')" stroke-width="3.5" stroke-linejoin="round"/>' +
          '<path d="M70 26 C84 33 96 35 103 34 C102 66 94 96 70 114 C46 96 38 66 37 34 C44 35 56 33 70 26 Z" fill="none" stroke="rgba(201,164,67,0.35)" stroke-width="1.2"/>' +
          '<path d="M70 30 L70 110" stroke="rgba(201,164,67,0.4)" stroke-width="2"/>' +
          '<path d="M70 58 C60 52 50 54 44 48 C50 44 62 44 70 50 C78 44 90 44 96 48 C90 54 80 52 70 58 Z" fill="url(#gold' + id + ')" opacity="0.9"/>' +
          '<path d="M70 50 l7 10 -7 10 -7 -10 Z" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.6"/>' +
          '<circle cx="70" cy="21.5" r="2" fill="url(#gold' + id + ')"/><circle cx="41" cy="30" r="2" fill="url(#gold' + id + ')"/><circle cx="99" cy="30" r="2" fill="url(#gold' + id + ')"/>';
      },
      grad: function (id) {
        return '<linearGradient id="steel' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#39455c"/><stop offset="55%" stop-color="#242e40"/><stop offset="100%" stop-color="#141b28"/></linearGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#9fd0ff"/><stop offset="45%" stop-color="#3d7ab8"/><stop offset="100%" stop-color="#12304f"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="45%" r="52%"><stop offset="0%" stop-color="rgba(74,118,168,0.4)"/><stop offset="65%" stop-color="rgba(74,118,168,0.1)"/><stop offset="100%" stop-color="rgba(74,118,168,0)"/></radialGradient>';
      }
    },
    /* Anello: fascia con luce/ombra, gemma sfaccettata con artigli */
    ring: {
      body: function (id) {
        return '<circle cx="70" cy="92" r="60" fill="url(#glow' + id + ')"/>' +
          '<path d="M40 96 A30 14 0 0 1 100 96" fill="none" stroke="url(#bandBack' + id + ')" stroke-width="10" stroke-linecap="round"/>' +
          '<path d="M40 98 A30 14 0 0 0 100 98" fill="none" stroke="url(#bandFront' + id + ')" stroke-width="10" stroke-linecap="round"/>' +
          '<path d="M46 104 A24 10 0 0 0 94 104" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.4"/>' +
          '<path d="M50 92 l0 6 M58 88 l0 6 M82 88 l0 6 M90 92 l0 6" stroke="#6b5116" stroke-width="1.6" stroke-linecap="round"/>' +
          '<path d="M62 62 L78 62 L84 74 L70 92 L56 74 Z" fill="url(#pavilion' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.6" stroke-linejoin="round"/>' +
          '<path d="M62 62 L78 62 L70 74 Z" fill="url(#table' + id + ')"/>' +
          '<path d="M62 62 L70 74 L56 74 Z" fill="rgba(0,0,0,0.18)"/>' +
          '<path d="M78 62 L70 74 L84 74 Z" fill="rgba(255,255,255,0.14)"/>' +
          '<path d="M70 74 L70 92" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>' +
          '<path d="M58 60 Q70 50 82 60" fill="none" stroke="url(#gold' + id + ')" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M55 65 Q48 60 52 52" fill="none" stroke="url(#gold' + id + ')" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M85 65 Q92 60 88 52" fill="none" stroke="url(#gold' + id + ')" stroke-width="2.4" stroke-linecap="round"/>' +
          '<ellipse cx="65" cy="66" rx="3" ry="1.6" fill="rgba(255,255,255,0.6)" transform="rotate(-20 65 66)"/>';
      },
      grad: function (id) {
        return '<linearGradient id="bandBack' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6b5116"/><stop offset="50%" stop-color="#8a6820"/><stop offset="100%" stop-color="#6b5116"/></linearGradient>' +
          '<linearGradient id="bandFront' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#c9a443"/><stop offset="50%" stop-color="#f0d98a"/><stop offset="100%" stop-color="#c9a443"/></linearGradient>' +
          '<linearGradient id="table' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#eaf5ff"/><stop offset="100%" stop-color="#9fd0ff"/></linearGradient>' +
          '<linearGradient id="pavilion' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#9fd0ff"/><stop offset="55%" stop-color="#3d7ab8"/><stop offset="100%" stop-color="#12304f"/></linearGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="rgba(74,118,168,0.35)"/><stop offset="65%" stop-color="rgba(74,118,168,0.09)"/><stop offset="100%" stop-color="rgba(74,118,168,0)"/></radialGradient>';
      }
    },
    /* Amuleto: medaglione tondo inciso con runa a croce, catena a maglie */
    amulet: {
      body: function (id) {
        return '<circle cx="70" cy="78" r="60" fill="url(#glow' + id + ')"/>' +
          '<path d="M46 24 Q70 44 94 24" fill="none" stroke="url(#gold' + id + ')" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="70" cy="82" r="34" fill="url(#disc' + id + ')" stroke="url(#gold' + id + ')" stroke-width="3"/>' +
          '<circle cx="70" cy="82" r="34" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-dasharray="2 3"/>' +
          '<circle cx="70" cy="82" r="27" fill="none" stroke="url(#gold' + id + ')" stroke-width="1.2" opacity="0.6"/>' +
          '<path d="M70 66 L70 98 M60 74 L80 90 M80 74 L60 90" stroke="url(#gold' + id + ')" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="70" cy="82" r="5" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.4"/>' +
          '<ellipse cx="68" cy="80" rx="1.6" ry="1" fill="rgba(255,255,255,0.6)"/>';
      },
      grad: function (id) {
        return '<radialGradient id="disc' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#e8ddc8"/><stop offset="55%" stop-color="#a8927a"/><stop offset="100%" stop-color="#5c4c3a"/></radialGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#8fe8dc"/><stop offset="45%" stop-color="#2a8a7a"/><stop offset="100%" stop-color="#0e332c"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="rgba(42,138,122,0.3)"/><stop offset="65%" stop-color="rgba(42,138,122,0.07)"/><stop offset="100%" stop-color="rgba(42,138,122,0)"/></radialGradient>';
      }
    },
    /* Mantello: cappuccio con bordo di pelliccia, drappeggio, fermaglio ornato */
    cloak: {
      body: function (id) {
        return '<circle cx="70" cy="82" r="64" fill="url(#glow' + id + ')"/>' +
          '<path d="M54 54 Q24 78 20 132 Q34 126 44 116 Q40 88 54 54 Z" fill="url(#clothBack' + id + ')"/>' +
          '<path d="M86 54 Q116 78 120 132 Q106 126 96 116 Q100 88 86 54 Z" fill="url(#clothBack' + id + ')"/>' +
          '<path d="M58 52 Q34 76 30 124 Q50 114 62 98 Z" fill="url(#clothFront' + id + ')" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>' +
          '<path d="M82 52 Q106 76 110 124 Q90 114 78 98 Z" fill="url(#clothFront' + id + ')" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>' +
          '<path d="M40 92 Q50 86 58 92 M84 92 Q92 86 100 92 M36 104 Q46 98 54 104 M88 104 Q96 98 104 104" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.4" stroke-linecap="round"/>' +
          '<path d="M46 54 Q52 48 58 52 Q64 47 70 51 Q76 47 82 52 Q88 48 94 54" fill="none" stroke="url(#fur' + id + ')" stroke-width="5" stroke-linecap="round"/>' +
          '<circle cx="70" cy="46" r="17" fill="url(#steel' + id + ')" stroke="url(#gold' + id + ')" stroke-width="2.6"/>' +
          '<circle cx="70" cy="46" r="21" fill="none" stroke="url(#gold' + id + ')" stroke-width="1" opacity="0.5"/>' +
          '<path d="M70 30 l3.4 7 7.6 1.1 -5.5 5.4 1.3 7.5 -6.8 -3.6 -6.8 3.6 1.3 -7.5 -5.5 -5.4 7.6 -1.1 Z" fill="url(#gold' + id + ')" opacity="0.9"/>' +
          '<circle cx="70" cy="46" r="7.5" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.8"/>' +
          '<ellipse cx="67" cy="43.2" rx="2.3" ry="1.4" fill="rgba(255,255,255,0.55)" transform="rotate(-24 67 43.2)"/>';
      },
      grad: function (id) {
        return '<linearGradient id="clothBack' + id + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2a1620"/><stop offset="100%" stop-color="#150b10"/></linearGradient>' +
          '<linearGradient id="clothFront' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7a4f60"/><stop offset="55%" stop-color="#4a2c38"/><stop offset="100%" stop-color="#231219"/></linearGradient>' +
          '<linearGradient id="fur' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#e8ddc8"/><stop offset="50%" stop-color="#c9bda0"/><stop offset="100%" stop-color="#e8ddc8"/></linearGradient>' +
          '<linearGradient id="steel' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#39455c"/><stop offset="100%" stop-color="#141b28"/></linearGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#ffd98a"/><stop offset="45%" stop-color="#d68a2a"/><stop offset="100%" stop-color="#5c3a10"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="25%" r="52%"><stop offset="0%" stop-color="rgba(214,138,42,0.3)"/><stop offset="65%" stop-color="rgba(214,138,42,0.07)"/><stop offset="100%" stop-color="rgba(214,138,42,0)"/></radialGradient>';
      }
    },
    /* Bacchetta: fusto rastremato con venatura, impugnatura in cuoio, doppia stella */
    wand: {
      body: function (id) {
        return '<circle cx="70" cy="74" r="64" fill="url(#glow' + id + ')"/>' +
          '<path d="M32 118 L40 122 L100 40 L94 34 Z" fill="url(#wood' + id + ')" stroke="#2e2118" stroke-width="1" stroke-linejoin="round"/>' +
          '<path d="M42 112 Q48 108 52 100 M50 100 Q56 96 60 88 M58 88 Q64 84 68 76 M66 76 Q72 72 76 64" stroke="rgba(0,0,0,0.3)" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
          '<path d="M46 110 Q60 106 68 96" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none"/>' +
          '<path d="M28 124 L44 116 L48 122 L32 130 Z" fill="url(#grip' + id + ')" stroke="#2e2118" stroke-width="1"/>' +
          '<path d="M32 126 l4 -6 M36 129 l4 -6" stroke="#1a120c" stroke-width="1.2" stroke-linecap="round"/>' +
          '<circle cx="30" cy="127" r="6.5" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.8"/>' +
          '<ellipse cx="27.8" cy="124.8" rx="2" ry="1.2" fill="rgba(255,255,255,0.5)" transform="rotate(-24 27.8 124.8)"/>' +
          '<path d="M97 37 l5 -16 l5 11 l13 -3.5 l-9 9.5 l9 9.5 l-13 -3.5 l-5 11 l-5 -16 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1" stroke-linejoin="round"/>' +
          '<path d="M102 21 l2.6 -8 l2.6 5.6 l6.6 -1.8 l-4.6 4.8 l4.6 4.8 l-6.6 -1.8 l-2.6 5.6 l-2.6 -8 Z" fill="#fff" opacity="0.75"/>' +
          '<circle cx="102" cy="21" r="2.2" fill="#fff" opacity="0.9"/>' +
          '<circle cx="112" cy="30" r="1.4" fill="url(#gold' + id + ')"/><circle cx="118" cy="16" r="1.1" fill="url(#gold' + id + ')"/>';
      },
      grad: function (id) {
        return '<linearGradient id="wood' + id + '" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#5c4530"/><stop offset="45%" stop-color="#8a6a4a"/><stop offset="100%" stop-color="#b89468"/></linearGradient>' +
          '<linearGradient id="grip' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4a3220"/><stop offset="100%" stop-color="#2a1c12"/></linearGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#dcb8ff"/><stop offset="45%" stop-color="#8a5fd6"/><stop offset="100%" stop-color="#3a2159"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="65%" cy="25%" r="55%"><stop offset="0%" stop-color="rgba(201,164,67,0.35)"/><stop offset="65%" stop-color="rgba(201,164,67,0.09)"/><stop offset="100%" stop-color="rgba(201,164,67,0)"/></radialGradient>';
      }
    },
    /* Pozione: rifrazione del vetro, etichetta, sughero striato, bolle a più livelli */
    potion: {
      body: function (id) {
        return '<circle cx="70" cy="82" r="62" fill="url(#glow' + id + ')"/>' +
          '<rect x="63" y="14" width="14" height="18" rx="2.5" fill="url(#glass' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.4"/>' +
          '<rect x="60" y="7" width="20" height="10" rx="3" fill="url(#cork' + id + ')" stroke="#4a3220" stroke-width="0.8"/>' +
          '<path d="M62 9 h16 M62 12 h16 M62 15 h16" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>' +
          '<path d="M56 34 L84 34 L99 84 Q99 112 70 114 Q41 112 41 84 Z" fill="url(#glass' + id + ')" stroke="url(#gold' + id + ')" stroke-width="2.2"/>' +
          '<path d="M48 80 Q48 104 70 106 Q92 104 92 80 L92 86 Q92 108 70 110 Q48 108 48 86 Z" fill="url(#liquid' + id + ')"/>' +
          '<path d="M50 78 Q50 88 55 92" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" fill="none"/>' +
          '<ellipse cx="70" cy="80" rx="20" ry="4" fill="rgba(255,255,255,0.28)"/>' +
          '<circle cx="60" cy="92" r="3.4" fill="rgba(255,255,255,0.4)"/><circle cx="78" cy="98" r="2.2" fill="rgba(255,255,255,0.32)"/><circle cx="68" cy="102" r="1.6" fill="rgba(255,255,255,0.28)"/>' +
          '<ellipse cx="58" cy="50" rx="3.4" ry="12" fill="rgba(255,255,255,0.22)"/>' +
          '<ellipse cx="86" cy="60" rx="2" ry="9" fill="rgba(255,255,255,0.14)"/>' +
          '<path d="M84 40 Q92 44 91 52 L86 52 Q87 46 82 43 Z" fill="url(#label' + id + ')" stroke="#6b5116" stroke-width="0.8"/>';
      },
      grad: function (id) {
        return '<linearGradient id="glass' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3a4a44"/><stop offset="55%" stop-color="#202b26"/><stop offset="100%" stop-color="#0e1512"/></linearGradient>' +
          '<linearGradient id="cork' + id + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c9a26a"/><stop offset="100%" stop-color="#6b5116"/></linearGradient>' +
          '<linearGradient id="liquid' + id + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c8f5da"/><stop offset="50%" stop-color="#5fcf94"/><stop offset="100%" stop-color="#1f6b48"/></linearGradient>' +
          '<linearGradient id="label' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8c96a"/><stop offset="100%" stop-color="#a8842c"/></linearGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="55%" r="55%"><stop offset="0%" stop-color="rgba(61,148,112,0.32)"/><stop offset="65%" stop-color="rgba(61,148,112,0.08)"/><stop offset="100%" stop-color="rgba(61,148,112,0)"/></radialGradient>';
      }
    },
    /* Tomo: cuoio consumato, borchie d'angolo, fibbia, alone attorno alla gemma */
    tome: {
      body: function (id) {
        return '<circle cx="70" cy="80" r="64" fill="url(#glow' + id + ')"/>' +
          '<path d="M40 28 L100 28 Q110 28 110 40 L110 120 Q110 132 100 132 L40 132 Z" fill="url(#cover' + id + ')" stroke="url(#gold' + id + ')" stroke-width="2.6"/>' +
          '<path d="M55 30 Q90 50 60 130" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="10" opacity="0.6"/>' +
          '<path d="M100 28 Q110 28 110 40 L110 120 Q110 132 100 132" fill="none" stroke="rgba(245,238,220,0.9)" stroke-width="1.6"/>' +
          '<path d="M111 34 L111 126 M113.5 38 L113.5 122 M116 42 L116 118" stroke="rgba(230,220,195,0.6)" stroke-width="1"/>' +
          '<path d="M44 32 L44 128" stroke="url(#gold' + id + ')" stroke-width="5"/>' +
          '<path d="M40 28 L52 28 L52 40 L40 40 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1"/>' +
          '<path d="M88 28 L100 28 L100 40 L88 40 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1"/>' +
          '<path d="M40 120 L52 120 L52 132 L40 132 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1"/>' +
          '<path d="M88 120 L100 120 L100 132 L88 132 Z" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1"/>' +
          '<path d="M48 78 L92 62 L92 68 L48 84 Z" fill="url(#strap' + id + ')" opacity="0.92" stroke="#6b5116" stroke-width="0.8"/>' +
          '<rect x="64" y="66" width="12" height="9" rx="1.5" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="1"/>' +
          '<circle cx="74" cy="78" r="14" fill="url(#gem' + id + ')" stroke="url(#gold' + id + ')" stroke-width="2"/>' +
          '<circle cx="74" cy="78" r="18" fill="none" stroke="url(#gold' + id + ')" stroke-width="1" opacity="0.55"/>' +
          '<path d="M74 68 l3 8 8 1 -6 6 1 8 -6 -4 -6 4 1 -8 -6 -6 8 -1 Z" fill="url(#gold' + id + ')" opacity="0.85"/>' +
          '<ellipse cx="70" cy="73" rx="3" ry="1.8" fill="rgba(255,255,255,0.55)" transform="rotate(-22 70 73)"/>';
      },
      grad: function (id) {
        return '<linearGradient id="cover' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3a2b52"/><stop offset="60%" stop-color="#241a38"/><stop offset="100%" stop-color="#120c1e"/></linearGradient>' +
          '<linearGradient id="strap' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6b5116"/><stop offset="50%" stop-color="#a8842c"/><stop offset="100%" stop-color="#6b5116"/></linearGradient>' +
          '<radialGradient id="gem' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#8fe8dc"/><stop offset="45%" stop-color="#2a8a7a"/><stop offset="100%" stop-color="#0e332c"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="45%" r="52%"><stop offset="0%" stop-color="rgba(42,138,122,0.3)"/><stop offset="65%" stop-color="rgba(42,138,122,0.07)"/><stop offset="100%" stop-color="rgba(42,138,122,0)"/></radialGradient>';
      }
    },
    /* Sacca dimensionale: sacchetto di stoffa con cordino e apertura magica */
    bag: {
      body: function (id) {
        return '<circle cx="70" cy="82" r="60" fill="url(#glow' + id + ')"/>' +
          '<path d="M34 58 Q70 44 106 58 L112 108 Q108 132 70 136 Q32 132 28 108 Z" fill="url(#cloth' + id + ')" stroke="#4a3220" stroke-width="1.3" stroke-linejoin="round"/>' +
          '<path d="M36 62 Q70 50 104 62" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2.2"/>' +
          '<path d="M40 78 Q70 68 100 78" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="1.4"/>' +
          '<path d="M44 96 Q70 88 96 96" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1.2"/>' +
          '<path d="M48 112 Q70 106 92 112" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>' +
          '<path d="M32 58 Q70 38 108 58" fill="none" stroke="url(#gold' + id + ')" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M38 56 Q70 48 102 56 L100 62 Q70 54 40 62 Z" fill="url(#hem' + id + ')" stroke="#4a3220" stroke-width="0.8"/>' +
          '<ellipse cx="70" cy="56" rx="22" ry="5.5" fill="url(#rift' + id + ')" stroke="url(#gold' + id + ')" stroke-width="1.4"/>' +
          '<ellipse cx="70" cy="56" rx="14" ry="3.5" fill="url(#void' + id + ')"/>' +
          '<path d="M60 55 Q70 50 80 55" fill="none" stroke="rgba(143,232,220,0.75)" stroke-width="1.1"/>' +
          '<path d="M34 58 Q28 54 32 48 Q38 42 46 46" fill="none" stroke="url(#cord' + id + ')" stroke-width="2.2" stroke-linecap="round"/>' +
          '<path d="M106 58 Q112 54 108 48 Q102 42 94 46" fill="none" stroke="url(#cord' + id + ')" stroke-width="2.2" stroke-linecap="round"/>' +
          '<circle cx="32" cy="48" r="3" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="0.6"/>' +
          '<circle cx="108" cy="48" r="3" fill="url(#gold' + id + ')" stroke="#6b5116" stroke-width="0.6"/>' +
          '<path d="M58 44 Q70 36 82 44" fill="none" stroke="url(#cord' + id + ')" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M52 38 L88 38 L86 44 L54 44 Z" fill="url(#strap' + id + ')" stroke="#4a3220" stroke-width="0.8"/>' +
          '<path d="M66 38 L66 30 Q70 24 74 30 L74 38" fill="none" stroke="url(#cord' + id + ')" stroke-width="2" stroke-linecap="round"/>';
      },
      grad: function (id) {
        return '<linearGradient id="cloth' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a06838"/><stop offset="45%" stop-color="#7a4e28"/><stop offset="100%" stop-color="#4a2e18"/></linearGradient>' +
          '<linearGradient id="hem' + id + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#8a5a32"/><stop offset="100%" stop-color="#5c3a20"/></linearGradient>' +
          '<linearGradient id="cord' + id + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6b5116"/><stop offset="50%" stop-color="#c9a443"/><stop offset="100%" stop-color="#6b5116"/></linearGradient>' +
          '<linearGradient id="strap' + id + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#8a5a32"/><stop offset="100%" stop-color="#5c3a20"/></linearGradient>' +
          '<radialGradient id="rift' + id + '" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#b8fff4"/><stop offset="55%" stop-color="#2a8a7a"/><stop offset="100%" stop-color="#143830"/></radialGradient>' +
          '<radialGradient id="void' + id + '" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#0a1620"/><stop offset="100%" stop-color="#1a2840"/></radialGradient>' +
          '<radialGradient id="glow' + id + '" cx="50%" cy="42%" r="55%"><stop offset="0%" stop-color="rgba(42,138,122,0.35)"/><stop offset="65%" stop-color="rgba(42,138,122,0.09)"/><stop offset="100%" stop-color="rgba(42,138,122,0)"/></radialGradient>';
      }
    }
  };

  function medallionSvg(art, size) {
    size = size || 100;
    var id = 'med' + (medallionUid++);
    if (art.type === 'image') {
      return '<svg class="medallion" viewBox="0 0 100 100" width="' + size + '" height="' + size + '">' +
        '<defs><clipPath id="clip' + id + '"><circle cx="50" cy="50" r="40"/></clipPath>' +
        '<linearGradient id="ring' + id + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8c96a"/><stop offset="50%" stop-color="#c9a443"/><stop offset="100%" stop-color="#8a6820"/></linearGradient></defs>' +
        '<image href="' + art.value + '" x="10" y="10" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip' + id + ')"/>' +
        '<circle cx="50" cy="50" r="40" fill="none" stroke="url(#ring' + id + ')" stroke-width="2.5"/></svg>';
    }
    var preset = PRESET_ART[art.value] || PRESET_ART.ring;

    return '<svg class="medallion" viewBox="0 0 140 150" width="' + size + '" height="' + size + '">' +
      '<defs>' + presetGold(id) + preset.grad(id) + '</defs>' + preset.body(id) + '</svg>';
  }

  var overlay, titleEl, bodyEl;

  /* ---------- helper DOM (stessi di js/edit-sheet.js, copiati qui: sono
     piccoli generatori generici, non vale la pena condividerli tra script
     separati non-modulo) ---------- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) {
      node.className = cls;
    }
    if (text != null) {
      node.textContent = text;
    }

    return node;
  }

  function buildSelect(options, selectedValue) {
    var select = document.createElement('select');
    select.className = 'edit-select';
    options.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === selectedValue) {
        o.selected = true;
      }
      select.appendChild(o);
    });

    return select;
  }

  function buildField(labelText, inputEl, id) {
    var field = el('div', 'edit-field');
    var label = el('label', 'edit-label', labelText);
    if (id) {
      inputEl.id = id;
      label.setAttribute('for', id);
    }
    field.appendChild(label);
    field.appendChild(inputEl);

    return field;
  }

  /* ---------- apertura / chiusura del bottom sheet di editing ---------- */

  function openSheet(title) {
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    overlay.classList.remove('hidden');
  }

  function closeSheet() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = '';
    bodyEl.className = 'sheet-body';
    var sheetRoot = overlay.querySelector('.bottom-sheet');
    if (sheetRoot) {
      sheetRoot.classList.remove('item-editor-sheet-root');
    }
  }

  /* ---------- applica + rerender (lista Tratti + res-card + stats/sheet) ---------- */

  function commitState(mutate) {
    var state = window.AppStorage.getState();
    mutate(state.character);
    window.AppStorage.saveState(state, true); // persiste subito + sync cloud (meccanismo esistente)
    render(); // ricrea le card PRIMA che stats/sheet le cerchino nel DOM
    if (window.AppStats && window.AppStats.render) {
      window.AppStats.render();
    }
    if (window.AppSheet && window.AppSheet.render) {
      window.AppSheet.render();
    }
    if (window.AppTreasury && window.AppTreasury.renderCarryBar) {
      window.AppTreasury.renderCarryBar();
    }
  }

  /* ---------- sezione arte (galleria di medaglioni preimpostati + upload foto) ---------- */

  function buildArtGrid(draft, kindSync) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Arte'));
    var grid = el('div', 'art-grid');
    var tiles = {};
    var uploadTile;

    function refresh() {
      ICON_IDS.forEach(function (id) {
        tiles[id].classList.toggle('on', draft.art.type === 'preset' && draft.art.value === id);
      });
      var isImage = draft.art.type === 'image';
      uploadTile.classList.toggle('on', isImage);
      uploadTile.classList.toggle('has-image', isImage);
      uploadTile.style.backgroundImage = isImage ? 'url(' + draft.art.value + ')' : '';
    }

    ICON_IDS.forEach(function (id) {
      var tile = el('button', 'art-tile');
      tile.type = 'button';
      tile.innerHTML = medallionSvg({ type: 'preset', value: id }, 40);
      tile.setAttribute('aria-label', id === 'bag' ? 'Sacca dimensionale' : 'Arte ' + id);
      tile.addEventListener('click', function () {
        draft.art = { type: 'preset', value: id };
        if (id === 'bag') {
          draft.kind = 'dimensional-bag';
        }
        refresh();
        if (kindSync && kindSync.refreshKind) {
          kindSync.refreshKind();
        }
      });
      tiles[id] = tile;
      grid.appendChild(tile);
    });

    uploadTile = el('button', 'art-tile upload');
    uploadTile.type = 'button';
    var uploadInner = el('span', 'art-tile-upload-inner');
    uploadInner.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/>' +
      '<path d="M6 10l6 -6l6 6"/><path d="M4 20h16"/></svg><span>Carica foto</span>';
    uploadTile.appendChild(uploadInner);

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'art-tile-file';
    fileInput.setAttribute('aria-label', 'Carica una foto per questa reliquia');
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        draft.art = { type: 'image', value: reader.result };
        refresh();
      };
      reader.readAsDataURL(file);
    });
    uploadTile.appendChild(fileInput);
    grid.appendChild(uploadTile);

    refresh();
    wrap.appendChild(grid);

    return wrap;
  }

  /* ---------- sezione rarità (chip selezionabili, singola scelta) ---------- */

  function buildRaritySection(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Rarità'));
    var row = el('div', 'chip-row');
    var chips = {};
    RARITY_OPTIONS.forEach(function (opt) {
      var chip = el('button', 'chip rarity-chip' + (draft.rarity === opt.id ? ' on' : ''), opt.label);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        draft.rarity = opt.id;
        RARITY_OPTIONS.forEach(function (o) {
          chips[o.id].classList.toggle('on', o.id === opt.id);
        });
      });
      chips[opt.id] = chip;
      row.appendChild(chip);
    });
    wrap.appendChild(row);

    return wrap;
  }

  /* ---------- sezione sintonizzazione (solo il requisito: attuned/dis-attuned
     si gestisce SOLO dalla lista, mai da questa scheda, vedi head-gem sotto) ---------- */

  function buildAttunementSection(draft) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Sintonizzazione'));
    var toggle = el('button', 'chip' + (draft.requiresAttunement ? ' on' : ''), 'Richiede sintonizzazione');
    toggle.type = 'button';
    toggle.addEventListener('click', function () {
      draft.requiresAttunement = toggle.classList.toggle('on');
    });
    wrap.appendChild(toggle);

    return wrap;
  }

  function buildDimensionalBagSection(draft, kindSync) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', 'Tipo oggetto'));
    var toggle = el('button', 'chip' + (draft.kind === 'dimensional-bag' ? ' on' : ''), 'Sacca dimensionale');
    toggle.type = 'button';
    var hint = el('p', 'item-kind-hint hidden',
      'Capacità ' + DIMENSIONAL_BAG_CAPACITY_KG + ' kg (monete e bottino party). ' +
      'Peso equipaggiata ' + DIMENSIONAL_BAG_SELF_KG + ' kg. Lo zaino resta sulle spalle. ' +
      'Si equipaggia automaticamente al salvataggio.');
    function refreshKind() {
      var isBag = draft.kind === 'dimensional-bag';
      toggle.classList.toggle('on', isBag);
      hint.classList.toggle('hidden', !isBag);
    }
    if (kindSync) {
      kindSync.refreshKind = refreshKind;
    }
    toggle.addEventListener('click', function () {
      var isOn = toggle.classList.toggle('on');
      draft.kind = isOn ? 'dimensional-bag' : null;
      if (isOn && draft.art.type === 'preset' && draft.art.value !== 'bag') {
        draft.art = { type: 'preset', value: 'bag' };
      }
      refreshKind();
    });
    refreshKind();
    wrap.appendChild(toggle);
    wrap.appendChild(hint);

    return wrap;
  }

  /* ---------- sezione resistenze/immunità (Step 3.9.b): chip
     preimpostate multi-selezionabili, niente testo libero — evita
     duplicati tipo "Fuoco"/"fuoco" che non si aggregherebbero bene nella
     card "Resistenze & Immunità" (vedi renderResistances in js/stats.js). ---------- */

  function buildChipToggleGroup(labelText, options, selectedArr, extraOnClass) {
    var wrap = el('div', 'edit-field');
    wrap.appendChild(el('span', 'edit-label', labelText));
    var row = el('div', 'chip-row');
    options.forEach(function (name) {
      var on = selectedArr.indexOf(name) !== -1;
      var chip = el('button', 'chip' + (on ? ' on' + (extraOnClass ? ' ' + extraOnClass : '') : ''), name);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        var idx = selectedArr.indexOf(name);
        if (idx === -1) {
          selectedArr.push(name);
        } else {
          selectedArr.splice(idx, 1);
        }
        chip.classList.toggle('on');
        if (extraOnClass) {
          chip.classList.toggle(extraOnClass);
        }
      });
      row.appendChild(chip);
    });
    wrap.appendChild(row);

    return wrap;
  }

  function buildResistancesSection(draft) {
    var section = el('div', 'item-editor-resists');
    section.appendChild(buildMultiSelectDropdown('Resistenza a', DAMAGE_TYPES, draft.resistances));
    section.appendChild(buildMultiSelectDropdown('Immunità a', DAMAGE_TYPES.concat(CONDITIONS), draft.immunities));
    section.appendChild(buildSensesMultiSelect(draft));

    return section;
  }

  /* ---------- sezione sensi (righe ripetibili: tipo + raggio in metri) ----------
     Stesso pattern di riga di buildEffectsSection (select + stepper +
     rimuovi), ma senza il ramo testo libero: qui ha sempre senso un tipo +
     un numero. Il raggio non ha segno (mai un "−3 m" di Scurovisione), da
     qui niente window.AppEngine.formatMod, solo il numero. */

  function buildSensesSection(draft) {
    var section = el('div');
    section.appendChild(el('div', 'edit-section-label', 'Sensi'));
    var list = el('div', 'effects-list');
    section.appendChild(list);

    function renderRows() {
      list.innerHTML = '';
      draft.senses.forEach(function (sense, idx) {
        var row = el('div', 'effect-row');

        var select = buildSelect(SENSE_OPTIONS, sense.type);
        select.addEventListener('change', function () {
          sense.type = select.value;
        });
        row.appendChild(select);

        var stepper = el('div', 'edit-stepper');
        var minus = el('button', 'stepper-btn minus', '−');
        minus.type = 'button';
        minus.setAttribute('aria-label', 'Diminuisci raggio');
        var valEl = el('span', 'edit-stat-score', sense.rangeM + ' m');
        var plus = el('button', 'stepper-btn plus', '+');
        plus.type = 'button';
        plus.setAttribute('aria-label', 'Aumenta raggio');
        minus.addEventListener('click', function () {
          sense.rangeM = Math.max(1, sense.rangeM - 1);
          valEl.textContent = sense.rangeM + ' m';
        });
        plus.addEventListener('click', function () {
          sense.rangeM = Math.min(60, sense.rangeM + 1);
          valEl.textContent = sense.rangeM + ' m';
        });
        stepper.appendChild(minus);
        stepper.appendChild(valEl);
        stepper.appendChild(plus);
        row.appendChild(stepper);

        var removeBtn = el('button', 'effect-remove-btn', '✕');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Rimuovi questo senso');
        removeBtn.addEventListener('click', function () {
          draft.senses.splice(idx, 1);
          renderRows();
        });
        row.appendChild(removeBtn);

        list.appendChild(row);
      });
    }
    renderRows();

    var addBtn = el('button', 'effect-add-btn', '+ Aggiungi senso');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      draft.senses.push({ type: SENSE_OPTIONS[0].id, rangeM: 18 });
      renderRows();
    });
    section.appendChild(addBtn);

    return section;
  }

  /* ---------- sezione effetti (righe ripetibili) ---------- */

  function buildEffectsSection(draft, skipTitle, hooks) {
    hooks = hooks || {};
    var section = el('div');
    if (!skipTitle) {
      section.appendChild(el('div', 'edit-section-label', 'Effetti'));
    }
    var list = el('div', 'effects-list');
    section.appendChild(list);

    /* Un effetto è "a testo libero" (Step 3.9.a) se ha `text` invece di
       `target`/`value`: nessun calcolo, solo una riga stampata così com'è
       nella lista effetti della card (stesso posto di "Vantaggio ai tiri di
       iniziativa" già scritto a mano su Scudo Magico). modSum in engine.js
       lo ignora da solo, non avendo `target` da confrontare. */
    function isTextEffect(eff) {
      return eff.text !== undefined;
    }

    function renderRows() {
      list.innerHTML = '';
      draft.effects.forEach(function (eff, idx) {
        var row = el('div', 'item-effect-card');

        var removeBtn = el('button', 'item-effect-card-remove', '✕');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Rimuovi questo effetto');
        removeBtn.addEventListener('click', function () {
          draft.effects.splice(idx, 1);
          renderRows();
          if (draft.effects.length === 0 && hooks.onEmpty) {
            hooks.onEmpty();
          }
        });
        row.appendChild(removeBtn);

        if (isTextEffect(eff)) {
          var textInput = document.createElement('input');
          textInput.type = 'text';
          textInput.className = 'edit-input';
          textInput.placeholder = 'Descrivi l\'effetto…';
          textInput.value = eff.text;
          textInput.addEventListener('input', function () {
            eff.text = textInput.value;
          });
          row.appendChild(el('span', 'item-effect-card-tag', 'Testo'));
          row.appendChild(textInput);
        } else {
          row.appendChild(el('span', 'item-effect-card-tag', 'Bonus'));
          var select = buildSelect(EFFECT_OPTIONS, eff.target);
          select.addEventListener('change', function () {
            eff.target = select.value;
          });
          row.appendChild(select);

          var stepper = el('div', 'edit-stepper item-effect-stepper');
          var minus = el('button', 'stepper-btn minus', '−');
          minus.type = 'button';
          minus.setAttribute('aria-label', 'Diminuisci valore effetto');
          var valEl = el('span', 'edit-stat-score', window.AppEngine.formatMod(eff.value));
          var plus = el('button', 'stepper-btn plus', '+');
          plus.type = 'button';
          plus.setAttribute('aria-label', 'Aumenta valore effetto');
          minus.addEventListener('click', function () {
            eff.value = Math.max(-10, eff.value - 1);
            valEl.textContent = window.AppEngine.formatMod(eff.value);
          });
          plus.addEventListener('click', function () {
            eff.value = Math.min(10, eff.value + 1);
            valEl.textContent = window.AppEngine.formatMod(eff.value);
          });
          stepper.appendChild(minus);
          stepper.appendChild(valEl);
          stepper.appendChild(plus);
          row.appendChild(stepper);
        }

        list.appendChild(row);
      });
    }
    renderRows();

    if (!hooks.hideAddRow) {
      var addRow = el('div', 'effect-add-row');
      var addBtn = el('button', 'effect-add-btn', '+ Aggiungi effetto');
      addBtn.type = 'button';
      addBtn.addEventListener('click', function () {
        draft.effects.push({ target: EFFECT_OPTIONS[0].id, value: 1 });
        renderRows();
      });
      var addTextBtn = el('button', 'effect-add-btn effect-add-text-btn', '+ Aggiungi testo libero');
      addTextBtn.type = 'button';
      addTextBtn.addEventListener('click', function () {
        draft.effects.push({ text: '' });
        renderRows();
      });
      addRow.appendChild(addBtn);
      addRow.appendChild(addTextBtn);
      section.appendChild(addRow);
    }

    section.renderRows = renderRows;

    return section;
  }

  function buildUsesStepper(draft) {
    var usesField = el('div', 'edit-field');
    usesField.appendChild(el('label', 'edit-label', 'Usi al giorno'));
    var stepper = el('div', 'edit-stepper');
    var minus = el('button', 'stepper-btn minus', '−');
    minus.type = 'button';
    var localUses = draft.usesMax > 0 ? draft.usesMax : 1;
    var valEl = el('span', 'edit-stat-score', String(localUses));
    var plus = el('button', 'stepper-btn plus', '+');
    plus.type = 'button';
    minus.addEventListener('click', function () {
      localUses = Math.max(1, localUses - 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    plus.addEventListener('click', function () {
      localUses = Math.min(20, localUses + 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    stepper.appendChild(minus);
    stepper.appendChild(valEl);
    stepper.appendChild(plus);
    usesField.appendChild(stepper);

    return usesField;
  }

  /* ---------- sezione usi limitati ---------- */

  function buildUsesSection(draft) {
    var wrap = el('div');

    var toggleField = el('div', 'edit-field');
    toggleField.appendChild(el('span', 'edit-label', 'Usi limitati'));
    var toggle = el('button', 'chip' + (draft.usesMax > 0 ? ' on' : ''), 'Usi limitati (al giorno)');
    toggle.type = 'button';
    toggleField.appendChild(toggle);
    wrap.appendChild(toggleField);

    var usesField = el('div', 'edit-field');
    usesField.appendChild(el('label', 'edit-label', 'Numero di usi'));
    var stepper = el('div', 'edit-stepper');
    var minus = el('button', 'stepper-btn minus', '−');
    minus.type = 'button';
    var localUses = draft.usesMax > 0 ? draft.usesMax : 1;
    var valEl = el('span', 'edit-stat-score', String(localUses));
    var plus = el('button', 'stepper-btn plus', '+');
    plus.type = 'button';

    function refreshVisibility() {
      usesField.classList.toggle('hidden', draft.usesMax <= 0);
    }
    refreshVisibility();

    minus.addEventListener('click', function () {
      localUses = Math.max(1, localUses - 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    plus.addEventListener('click', function () {
      localUses = Math.min(20, localUses + 1);
      draft.usesMax = localUses;
      valEl.textContent = String(localUses);
    });
    stepper.appendChild(minus);
    stepper.appendChild(valEl);
    stepper.appendChild(plus);
    usesField.appendChild(stepper);
    wrap.appendChild(usesField);

    toggle.addEventListener('click', function () {
      var isOn = toggle.classList.toggle('on');
      draft.usesMax = isOn ? localUses : 0;
      refreshVisibility();
    });

    return wrap;
  }

  /* Scelte del menu inline "Aggiungi caratteristica" (sintonizzazione è sempre
     visibile nel form, non passa da qui). */
  var FEATURE_ADD_OPTIONS = [
    { id: 'resistances', block: 'resistances', label: 'Resistenze', hint: 'Riduce un tipo di danno', singleton: true },
    { id: 'immunities', block: 'immunities', label: 'Immunità', hint: 'Ignora danno o condizione', singleton: true },
    { id: 'senses', block: 'senses', label: 'Sensi', hint: 'Scurovisione, vista cieca…', singleton: true },
    { id: 'uses', block: 'uses', label: 'Usi al giorno', hint: 'Pozioni e cariche giornaliere', singleton: true }
  ];

  function initEnabledFeatureBlocks(draft) {
    var blocks = {};
    if (draft.resistances.length > 0) {
      blocks.resistances = true;
    }
    if (draft.immunities.length > 0) {
      blocks.immunities = true;
    }
    if (draft.senses.length > 0) {
      blocks.senses = true;
    }
    if (draft.usesMax > 0) {
      blocks.uses = true;
    }

    return blocks;
  }

  function buildFeatureBlockShell(title, onRemove) {
    var block = el('div', 'item-extra-block');
    var head = el('div', 'item-extra-block-head');
    head.appendChild(el('span', 'item-extra-block-title', title));
    var removeBtn = el('button', 'item-extra-block-remove');
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', 'Rimuovi ' + title);
    removeBtn.textContent = 'Rimuovi';
    removeBtn.addEventListener('click', onRemove);
    head.appendChild(removeBtn);
    var body = el('div', 'item-extra-block-body');
    block.appendChild(head);
    block.appendChild(body);

    return { block: block, body: body };
  }

  function renderItemFeatureBlocks(draft, enabledBlocks, container, rerender) {
    container.innerHTML = '';

    if (enabledBlocks.resistances) {
      var resShell = buildFeatureBlockShell('Resistenze', function () {
        draft.resistances = [];
        delete enabledBlocks.resistances;
        rerender();
      });
      resShell.body.appendChild(buildMultiSelectDropdown('Tipo di danno', DAMAGE_TYPES, draft.resistances));
      container.appendChild(resShell.block);
    }

    if (enabledBlocks.immunities) {
      var immShell = buildFeatureBlockShell('Immunità', function () {
        draft.immunities = [];
        delete enabledBlocks.immunities;
        rerender();
      });
      immShell.body.appendChild(
        buildMultiSelectDropdown('Danno o condizione', DAMAGE_TYPES.concat(CONDITIONS), draft.immunities)
      );
      container.appendChild(immShell.block);
    }

    if (enabledBlocks.senses) {
      var senShell = buildFeatureBlockShell('Sensi', function () {
        draft.senses = [];
        delete enabledBlocks.senses;
        rerender();
      });
      senShell.body.appendChild(buildSensesMultiSelect(draft, true));
      container.appendChild(senShell.block);
    }

    if (enabledBlocks.uses) {
      var useShell = buildFeatureBlockShell('Usi limitati', function () {
        draft.usesMax = 0;
        delete enabledBlocks.uses;
        rerender();
      });
      useShell.body.appendChild(buildUsesStepper(draft));
      container.appendChild(useShell.block);
    }
  }

  function availableFeatureOptions(enabledBlocks, filterIds) {
    return FEATURE_ADD_OPTIONS.filter(function (opt) {
      if (filterIds && filterIds.indexOf(opt.id) === -1) {
        return false;
      }
      if (opt.singleton && enabledBlocks[opt.block]) {
        return false;
      }

      return true;
    });
  }

  function applyFeatureAdd(featureId, draft, enabledBlocks) {
    if (featureId === 'effect-numeric') {
      enabledBlocks.effects = true;
      draft.effects.push({ target: EFFECT_OPTIONS[0].id, value: 1 });
    } else if (featureId === 'effect-text') {
      enabledBlocks.effects = true;
      draft.effects.push({ text: '' });
    } else if (featureId === 'resistances') {
      enabledBlocks.resistances = true;
    } else if (featureId === 'immunities') {
      enabledBlocks.immunities = true;
    } else if (featureId === 'senses') {
      enabledBlocks.senses = true;
    } else if (featureId === 'uses') {
      enabledBlocks.uses = true;
      if (draft.usesMax <= 0) {
        draft.usesMax = 1;
      }
    }
  }

  function buildFeatureAddSelect(draft, enabledBlocks, onPick) {
    var wrap = el('div', 'item-feature-add-select-wrap');
    wrap.appendChild(el('span', 'edit-label', 'Altre caratteristiche'));
    var select = document.createElement('select');
    select.className = 'edit-select item-feature-add-select';

    function populate() {
      var current = select.value;
      select.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Scegli cosa aggiungere…';
      select.appendChild(placeholder);
      availableFeatureOptions(enabledBlocks).forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.id;
        o.textContent = opt.label + ' — ' + opt.hint;
        select.appendChild(o);
      });
      select.disabled = select.options.length <= 1;
      if (current && select.querySelector('option[value="' + current + '"]')) {
        select.value = current;
      }
    }

    select.addEventListener('change', function () {
      if (!select.value) {
        return;
      }
      applyFeatureAdd(select.value, draft, enabledBlocks);
      select.value = '';
      populate();
      onPick();
    });

    wrap.populate = populate;
    wrap.appendChild(select);
    populate();

    return wrap;
  }

  function draftTypeId(draft) {
    if (draft.art.type === 'image') {
      return 'custom';
    }
    if (draft.art.type === 'preset') {
      return draft.art.value;
    }

    return 'ring';
  }

  function isBagDraft(draft) {
    return draft.kind === 'dimensional-bag' || draftTypeId(draft) === 'bag';
  }

  function isPotionDraft(draft) {
    return draftTypeId(draft) === 'potion';
  }

  function applyTypeToDraft(draft, typeId) {
    draft.art = { type: 'preset', value: typeId };
    if (typeId === 'bag') {
      draft.kind = 'dimensional-bag';
    } else if (typeId === 'sword') {
      draft.kind = 'weapon';
      if (!draft.weaponProfile) {
        draft.weaponProfile = defaultWeaponProfileFromCharacter();
      }
    } else if (typeId === 'shield') {
      draft.kind = 'shield';
      if (!draft.shieldProfile) {
        draft.shieldProfile = defaultShieldProfileFromCharacter();
      }
    } else {
      draft.kind = null;
    }
    if (typeId === 'potion' && draft.usesMax <= 0) {
      draft.usesMax = 1;
    }
  }

  function isWeaponDraft(draft) {
    return draft.kind === 'weapon' || draftTypeId(draft) === 'sword';
  }

  function isShieldDraft(draft) {
    return draft.kind === 'shield' || draftTypeId(draft) === 'shield';
  }

  function buildShieldProfileSection(draft) {
    if (!draft.shieldProfile) {
      draft.shieldProfile = defaultShieldProfileFromCharacter();
    }
    var profile = draft.shieldProfile;
    var section = el('div', 'item-shield-profile');
    section.appendChild(el('div', 'edit-section-label', 'Scudo in combattimento'));

    var stepper = el('div', 'edit-stepper');
    var minus = el('button', 'stepper-btn minus', '−');
    minus.type = 'button';
    var valEl = el('span', 'edit-stat-score', '+' + profile.acBonus);
    var plus = el('button', 'stepper-btn plus', '+');
    plus.type = 'button';
    minus.addEventListener('click', function () {
      profile.acBonus = Math.max(0, profile.acBonus - 1);
      valEl.textContent = '+' + profile.acBonus;
    });
    plus.addEventListener('click', function () {
      profile.acBonus = Math.min(5, profile.acBonus + 1);
      valEl.textContent = '+' + profile.acBonus;
    });
    stepper.appendChild(minus);
    stepper.appendChild(valEl);
    stepper.appendChild(plus);
    section.appendChild(buildField('Bonus CA', stepper, 'item-shield-ac'));

    section.refresh = function () {
      valEl.textContent = '+' + profile.acBonus;
    };

    return section;
  }

  function buildWeaponProfileSection(draft) {
    if (!draft.weaponProfile) {
      draft.weaponProfile = defaultWeaponProfileFromCharacter();
    }
    var profile = draft.weaponProfile;
    var section = el('div', 'item-weapon-profile');
    section.appendChild(el('div', 'edit-section-label', 'Arma in combattimento'));

    var options = [{ id: '', label: 'Personalizzata' }];
    (window.MANUAL_55.weapons || []).forEach(function (w) {
      options.push({ id: w.id, label: w.name + ' (' + w.die + ' ' + w.dmg + ')' });
    });
    var select = buildSelect(options, profile.weaponId || '', 'item-weapon-select');
    select.addEventListener('change', function () {
      var picked = weaponById(select.value);
      if (picked) {
        draft.weaponProfile = profileFromCatalogWeapon(picked);
      } else {
        profile.weaponId = '';
      }
      refresh();
    });
    section.appendChild(buildField('Dal manuale', select, 'item-weapon-catalog'));

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = profile.name || '';
    nameInput.placeholder = 'Nome mostrato in scheda';
    nameInput.addEventListener('input', function () {
      profile.name = nameInput.value;
    });
    section.appendChild(buildField('Nome', nameInput, 'item-weapon-name'));

    var dieInput = document.createElement('input');
    dieInput.type = 'text';
    dieInput.className = 'edit-input';
    dieInput.value = profile.die || '1d8';
    dieInput.addEventListener('input', function () {
      profile.die = dieInput.value;
    });
    section.appendChild(buildField('Dado danni', dieInput, 'item-weapon-die'));

    var typeInput = document.createElement('input');
    typeInput.type = 'text';
    typeInput.className = 'edit-input';
    typeInput.value = profile.type || '';
    typeInput.placeholder = 'tagl., perfor., cont., …';
    typeInput.addEventListener('input', function () {
      profile.type = typeInput.value;
    });
    section.appendChild(buildField('Tipo di danno', typeInput, 'item-weapon-type'));

    function refresh() {
      select.value = profile.weaponId || '';
      nameInput.value = profile.name || '';
      dieInput.value = profile.die || '1d8';
      typeInput.value = profile.type || '';
    }

    section.refresh = refresh;

    return section;
  }

  function buildEditorAccordion(title, contentBuilder, opts) {
    opts = opts || {};
    var acc = el('div', 'item-editor-acc');
    if (opts.open) {
      acc.classList.add('open');
    }
    if (opts.hidden) {
      acc.classList.add('hidden');
    }
    if (opts.id) {
      acc.setAttribute('data-acc-id', opts.id);
    }

    var head = el('button', 'item-editor-acc-head');
    head.type = 'button';
    head.appendChild(el('span', 'item-editor-acc-arrow', opts.open ? '▾' : '▸'));
    head.appendChild(el('span', 'item-editor-acc-title', title));
    if (opts.hint) {
      head.appendChild(el('span', 'item-editor-acc-hint', opts.hint));
    }

    var body = el('div', 'item-editor-acc-body');
    if (!opts.open) {
      body.classList.add('hidden');
    }
    contentBuilder(body);

    head.addEventListener('click', function () {
      var open = acc.classList.toggle('open');
      body.classList.toggle('hidden', !open);
      head.querySelector('.item-editor-acc-arrow').textContent = open ? '▾' : '▸';
    });

    acc.appendChild(head);
    acc.appendChild(body);

    return acc;
  }

  function defaultSenseRange(type) {
    var map = {
      scurovisione: 18,
      'vista-cieca': 10,
      'vista-vera': 36,
      'percezione-tremore': 18
    };

    return map[type] || 18;
  }

  var openMselPanels = [];

  function closeAllMselPanels(except) {
    openMselPanels.forEach(function (panel) {
      if (panel !== except) {
        panel.classList.add('hidden');
      }
    });
  }

  function bindMselPanel(panel, trigger) {
    openMselPanels.push(panel);
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = panel.classList.contains('hidden');
      closeAllMselPanels(willOpen ? panel : null);
      panel.classList.toggle('hidden', !willOpen);
    });
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  if (!window.__itemMselDocBound) {
    window.__itemMselDocBound = true;
    document.addEventListener('click', function () {
      closeAllMselPanels(null);
    });
  }

  function mselSummary(selected, emptyLabel) {
    if (!selected.length) {
      return emptyLabel || 'Nessuno';
    }
    if (selected.length <= 2) {
      return selected.join(', ');
    }

    return selected.length + ' selezionati';
  }

  function buildMultiSelectDropdown(labelText, options, selectedArr) {
    var wrap = el('div', 'edit-field item-msel-field');
    wrap.appendChild(el('span', 'edit-label', labelText));
    var dd = el('div', 'item-msel');
    var trigger = el('button', 'item-msel-trigger');
    trigger.type = 'button';
    var chev = el('span', 'item-msel-chev', '▾');
    var panel = el('div', 'item-msel-panel hidden');

    function refreshTrigger() {
      trigger.textContent = mselSummary(selectedArr, 'Nessuno');
      trigger.appendChild(chev);
    }

    options.forEach(function (name) {
      var row = el('label', 'item-msel-opt');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedArr.indexOf(name) !== -1;
      cb.addEventListener('change', function () {
        var idx = selectedArr.indexOf(name);
        if (cb.checked && idx === -1) {
          selectedArr.push(name);
        } else if (!cb.checked && idx !== -1) {
          selectedArr.splice(idx, 1);
        }
        refreshTrigger();
      });
      row.appendChild(cb);
      row.appendChild(document.createTextNode(name));
      panel.appendChild(row);
    });

    refreshTrigger();
    bindMselPanel(panel, trigger);
    dd.appendChild(trigger);
    dd.appendChild(panel);
    wrap.appendChild(dd);

    return wrap;
  }

  function buildSensesMultiSelect(draft, hideLabel) {
    var wrap = el('div', 'edit-field item-msel-field');
    if (!hideLabel) {
      wrap.appendChild(el('span', 'edit-label', 'Sensi'));
    }
    var dd = el('div', 'item-msel');
    var trigger = el('button', 'item-msel-trigger');
    trigger.type = 'button';
    var chev = el('span', 'item-msel-chev', '▾');
    var panel = el('div', 'item-msel-panel hidden');

    function selectedLabels() {
      return draft.senses.map(function (s) {
        return senseLabel(s.type);
      });
    }

    function refreshTrigger() {
      trigger.textContent = mselSummary(selectedLabels(), 'Nessuno');
      trigger.appendChild(chev);
    }

    SENSE_OPTIONS.forEach(function (opt) {
      var row = el('label', 'item-msel-opt');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = draft.senses.some(function (s) { return s.type === opt.id; });
      cb.addEventListener('change', function () {
        var idx = -1;
        draft.senses.forEach(function (s, i) {
          if (s.type === opt.id) {
            idx = i;
          }
        });
        if (cb.checked && idx === -1) {
          draft.senses.push({ type: opt.id, rangeM: defaultSenseRange(opt.id) });
        } else if (!cb.checked && idx !== -1) {
          draft.senses.splice(idx, 1);
        }
        refreshTrigger();
      });
      row.appendChild(cb);
      row.appendChild(document.createTextNode(opt.label));
      panel.appendChild(row);
    });

    refreshTrigger();
    bindMselPanel(panel, trigger);
    dd.appendChild(trigger);
    dd.appendChild(panel);
    wrap.appendChild(dd);

    return wrap;
  }

  function buildRarityDropdown(draft) {
    var wrap = el('div', 'edit-field item-editor-compact-field');
    wrap.appendChild(el('span', 'edit-label', 'Rarità'));
    var select = buildSelect(RARITY_OPTIONS, draft.rarity);
    select.addEventListener('change', function () {
      draft.rarity = select.value;
    });
    wrap.appendChild(select);

    return wrap;
  }

  function buildAttunementToggleRow(draft) {
    var field = el('div', 'edit-field item-attune-field');
    field.appendChild(el('span', 'edit-label', 'Sintonizzazione'));
    var row = el('div', 'item-attune-row');
    var toggle = el('label', 'item-toggle');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = draft.requiresAttunement;
    input.addEventListener('change', function () {
      draft.requiresAttunement = input.checked;
    });
    toggle.appendChild(input);
    toggle.appendChild(el('span', 'item-toggle-slider'));
    row.appendChild(toggle);
    row.appendChild(el('span', 'item-attune-text', 'Richiede sintonizzazione'));
    field.appendChild(row);

    return field;
  }

  function buildEditorEffectsPanel(draft) {
    var panel = el('div', 'item-effects-panel');
    var addMain = el('button', 'item-effects-add-main', '+ Aggiungi Effetto');
    addMain.type = 'button';
    var addMenu = el('div', 'item-effects-add-menu hidden');
    var addNum = el('button', 'item-effects-add-opt', 'Bonus numerico');
    addNum.type = 'button';
    var addText = el('button', 'item-effects-add-opt', 'Testo libero');
    addText.type = 'button';
    addMenu.appendChild(addNum);
    addMenu.appendChild(addText);

    var box = el('div', 'item-effects-box');
    var list = el('div', 'item-effects-list');

    function renderRows() {
      list.innerHTML = '';
      draft.effects.forEach(function (eff, idx) {
        var row = el('div', 'item-effect-line');
        var isText = eff.text !== undefined;

        if (isText) {
          row.classList.add('item-effect-line--text');
          row.appendChild(el('span', 'item-effect-info', 'i'));
          var textInput = document.createElement('input');
          textInput.type = 'text';
          textInput.className = 'item-effect-line-text';
          textInput.value = eff.text;
          textInput.placeholder = 'Descrivi l\'effetto…';
          textInput.addEventListener('input', function () {
            eff.text = textInput.value;
          });
          row.appendChild(textInput);
        } else {
          row.classList.add('item-effect-line--num');
          var select = buildSelect(EFFECT_OPTIONS, eff.target);
          select.className = 'edit-select item-effect-line-select';
          select.addEventListener('change', function () {
            eff.target = select.value;
          });
          row.appendChild(select);
          var stepper = el('div', 'edit-stepper item-effect-line-stepper');
          var minus = el('button', 'stepper-btn minus', '−');
          minus.type = 'button';
          var valEl = el('span', 'edit-stat-score', window.AppEngine.formatMod(eff.value));
          var plus = el('button', 'stepper-btn plus', '+');
          plus.type = 'button';
          minus.addEventListener('click', function () {
            eff.value = Math.max(-10, eff.value - 1);
            valEl.textContent = window.AppEngine.formatMod(eff.value);
          });
          plus.addEventListener('click', function () {
            eff.value = Math.min(10, eff.value + 1);
            valEl.textContent = window.AppEngine.formatMod(eff.value);
          });
          stepper.appendChild(minus);
          stepper.appendChild(valEl);
          stepper.appendChild(plus);
          row.appendChild(stepper);
        }

        var removeBtn = el('button', 'item-effect-line-remove', '✕');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Rimuovi effetto');
        removeBtn.addEventListener('click', function () {
          draft.effects.splice(idx, 1);
          renderRows();
        });
        row.appendChild(removeBtn);
        list.appendChild(row);
      });
    }

    addMain.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = addMenu.classList.contains('hidden');
      closeAllMselPanels(willOpen ? addMenu : null);
      addMenu.classList.toggle('hidden', !willOpen);
    });
    addNum.addEventListener('click', function () {
      draft.effects.push({ target: EFFECT_OPTIONS[0].id, value: 1 });
      addMenu.classList.add('hidden');
      renderRows();
    });
    addText.addEventListener('click', function () {
      draft.effects.push({ text: '' });
      addMenu.classList.add('hidden');
      renderRows();
    });

    var quickRow = el('div', 'item-effects-quick');
    var quickInput = document.createElement('input');
    quickInput.type = 'text';
    quickInput.className = 'item-effects-quick-input';
    quickInput.placeholder = 'Scegli un nuovo effetto o digita…';
    var quickBtn = el('button', 'item-effects-quick-btn', '+ Aggiungi');
    quickBtn.type = 'button';
    quickBtn.addEventListener('click', function () {
      var text = quickInput.value.trim();
      if (!text) {
        return;
      }
      draft.effects.push({ text: text });
      quickInput.value = '';
      renderRows();
    });
    quickRow.appendChild(el('span', 'item-effects-quick-plus', '+'));
    quickRow.appendChild(quickInput);
    quickRow.appendChild(quickBtn);

    addMenu.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    openMselPanels.push(addMenu);

    renderRows();
    panel.appendChild(addMain);
    panel.appendChild(addMenu);
    panel.appendChild(box);
    box.appendChild(list);
    box.appendChild(quickRow);
    panel.renderRows = renderRows;

    return panel;
  }

  function buildTypeHero(draft, onChange) {
    var wrap = el('div', 'item-type-hero-wrap');
    var hero = el('button', 'item-type-hero');
    hero.type = 'button';
    hero.setAttribute('aria-label', 'Cambia tipo reliquia');
    var medal = el('div', 'item-type-hero-medal');
    var label = el('span', 'item-type-hero-label');
    hero.appendChild(medal);
    hero.appendChild(label);

    var panelWrap = el('div', 'item-type-hero-panel hidden');
    var panel = el('div', 'item-type-panel');
    var hintEl = el('p', 'item-type-hint hidden');

    function refreshHero() {
      medal.classList.remove('has-photo');
      medal.style.backgroundImage = '';
      if (draft.art.type === 'image') {
        medal.classList.add('has-photo');
        medal.style.backgroundImage = 'url(' + draft.art.value + ')';
        medal.innerHTML = '';
        label.textContent = 'Foto personalizzata';
      } else {
        medal.innerHTML = medallionSvg(draft.art, 72);
        label.textContent = TYPE_LABELS[draftTypeId(draft)] || draftTypeId(draft);
      }
      var bag = isBagDraft(draft);
      hintEl.classList.toggle('hidden', !bag);
      if (bag) {
        hintEl.textContent = 'Sacca: ' + DIMENSIONAL_BAG_CAPACITY_KG + ' kg monete/bottino, ' +
          DIMENSIONAL_BAG_SELF_KG + ' kg sulle spalle.';
      }
    }

    ICON_IDS.forEach(function (id) {
      var opt = el('button', 'item-type-opt');
      opt.type = 'button';
      opt.innerHTML = medallionSvg({ type: 'preset', value: id }, 32);
      opt.appendChild(el('span', 'item-type-opt-label', TYPE_LABELS[id] || id));
      opt.addEventListener('click', function () {
        applyTypeToDraft(draft, id);
        refreshHero();
        panelWrap.classList.add('hidden');
        if (onChange) {
          onChange();
        }
      });
      panel.appendChild(opt);
    });

    var customOpt = el('button', 'item-type-opt item-type-opt-custom');
    customOpt.type = 'button';
    customOpt.innerHTML = '<span class="item-type-opt-upload" aria-hidden="true">📷</span>';
    customOpt.appendChild(el('span', 'item-type-opt-label', 'Foto'));
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'item-editor-type-file';
    fileInput.setAttribute('aria-label', 'Carica una foto per questa reliquia');
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        draft.art = { type: 'image', value: reader.result };
        draft.kind = null;
        refreshHero();
        panelWrap.classList.add('hidden');
        if (onChange) {
          onChange();
        }
      };
      reader.readAsDataURL(file);
    });
    customOpt.appendChild(fileInput);
    customOpt.addEventListener('click', function (e) {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });
    panel.appendChild(customOpt);

    hero.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = panelWrap.classList.contains('hidden');
      closeAllMselPanels(willOpen ? panelWrap : null);
      panelWrap.classList.toggle('hidden', !willOpen);
    });
    panelWrap.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    openMselPanels.push(panelWrap);

    refreshHero();
    panelWrap.appendChild(panel);
    wrap.appendChild(hero);
    wrap.appendChild(panelWrap);
    wrap.appendChild(hintEl);
    wrap.refreshHero = refreshHero;

    return wrap;
  }

  function buildTypeDropdown(draft, onChange) {
    var wrap = el('div', 'edit-field item-editor-type-field');
    wrap.appendChild(el('span', 'edit-label', 'Tipo'));
    var dd = el('div', 'item-msel item-type-msel');
    var trigger = el('button', 'item-msel-trigger item-type-trigger');
    trigger.type = 'button';
    var chev = el('span', 'item-msel-chev', '▾');
    var panel = el('div', 'item-msel-panel item-type-panel hidden');
    var hintEl = el('p', 'item-type-hint hidden');

    function refreshTrigger() {
      trigger.innerHTML = '';
      var iconWrap = el('span', 'item-type-trigger-icon');
      if (draft.art.type === 'image') {
        iconWrap.classList.add('has-photo');
        iconWrap.style.backgroundImage = 'url(' + draft.art.value + ')';
      } else {
        iconWrap.innerHTML = medallionSvg(draft.art, 28);
      }
      trigger.appendChild(iconWrap);
      var label = draft.art.type === 'image'
        ? 'Foto personalizzata'
        : (TYPE_LABELS[draftTypeId(draft)] || draftTypeId(draft));
      trigger.appendChild(el('span', 'item-type-trigger-label', label));
      trigger.appendChild(chev);
      var bag = isBagDraft(draft);
      hintEl.classList.toggle('hidden', !bag);
      if (bag) {
        hintEl.textContent = 'Sacca: ' + DIMENSIONAL_BAG_CAPACITY_KG + ' kg monete/bottino, ' +
          DIMENSIONAL_BAG_SELF_KG + ' kg sulle spalle.';
      }
    }

    ICON_IDS.forEach(function (id) {
      var opt = el('button', 'item-type-opt');
      opt.type = 'button';
      opt.setAttribute('data-type-id', id);
      opt.innerHTML = medallionSvg({ type: 'preset', value: id }, 32);
      opt.appendChild(el('span', 'item-type-opt-label', TYPE_LABELS[id] || id));
      opt.addEventListener('click', function () {
        applyTypeToDraft(draft, id);
        refreshTrigger();
        panel.classList.add('hidden');
        if (onChange) {
          onChange();
        }
      });
      panel.appendChild(opt);
    });

    var customOpt = el('button', 'item-type-opt item-type-opt-custom');
    customOpt.type = 'button';
    customOpt.setAttribute('data-type-id', 'custom');
    customOpt.innerHTML = '<span class="item-type-opt-upload" aria-hidden="true">📷</span>';
    customOpt.appendChild(el('span', 'item-type-opt-label', 'Foto'));
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'item-editor-type-file';
    fileInput.setAttribute('aria-label', 'Carica una foto per questa reliquia');
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        draft.art = { type: 'image', value: reader.result };
        draft.kind = null;
        refreshTrigger();
        panel.classList.add('hidden');
        if (onChange) {
          onChange();
        }
      };
      reader.readAsDataURL(file);
    });
    customOpt.appendChild(fileInput);
    customOpt.addEventListener('click', function (e) {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });
    panel.appendChild(customOpt);

    refreshTrigger();
    bindMselPanel(panel, trigger);
    dd.appendChild(trigger);
    dd.appendChild(panel);
    wrap.appendChild(dd);
    wrap.appendChild(hintEl);

    return wrap;
  }

  function refreshEditorTypeUi(draft, ui) {
    var bag = isBagDraft(draft);
    var weapon = isWeaponDraft(draft);
    var shield = isShieldDraft(draft);
    if (ui.typeHero && ui.typeHero.refreshHero) {
      ui.typeHero.refreshHero();
    }
    if (ui.weaponProfileSection) {
      ui.weaponProfileSection.classList.toggle('hidden', bag || !weapon);
      if (ui.weaponProfileSection.refresh) {
        ui.weaponProfileSection.refresh();
      }
    }
    if (ui.shieldProfileSection) {
      ui.shieldProfileSection.classList.toggle('hidden', bag || !shield);
      if (ui.shieldProfileSection.refresh) {
        ui.shieldProfileSection.refresh();
      }
    }
    if (ui.effectsPanel) {
      ui.effectsPanel.classList.toggle('hidden', bag);
      if (ui.effectsPanel.renderRows) {
        ui.effectsPanel.renderRows();
      }
    }
    if (ui.featuresWrap) {
      ui.featuresWrap.classList.toggle('hidden', bag);
    }
    if (ui.addSelectWrap) {
      ui.addSelectWrap.classList.toggle('hidden', bag);
    }
    if (ui.attuneWrap) {
      ui.attuneWrap.classList.toggle('hidden', bag);
    }
    if (bag) {
      return;
    }
    if (isPotionDraft(draft) && draft.usesMax > 0) {
      ui.enabledBlocks.uses = true;
      ui.renderFeatures();
    }
  }

  /* ---------- bottom sheet "Nuova Reliquia" / modifica ---------- */

  function buildItemSheet(existingItem) {
    var isEdit = !!existingItem;
    var draft = isEdit ? {
      id: existingItem.id,
      name: existingItem.name || '',
      desc: existingItem.desc || '',
      art: itemArtOf(existingItem),
      rarity: itemRarityOf(existingItem),
      effects: (existingItem.effects || []).map(function (e) {
        return e.text !== undefined ? { text: e.text } : { target: e.target, value: e.value };
      }),
      usesMax: existingItem.usesMax || 0,
      requiresAttunement: itemRequiresAttunementOf(existingItem),
      // attuned NON è editabile da questa scheda (si gestisce solo dalla
      // lista, vedi head-gem in renderTraitsList): la bozza lo porta con sé
      // solo per riscriverlo invariato al salvataggio.
      attuned: itemAttunedOf(existingItem),
      resistances: itemResistancesOf(existingItem).slice(),
      immunities: itemImmunitiesOf(existingItem).slice(),
      senses: itemSensesOf(existingItem).map(function (s) {
        return { type: s.type, rangeM: s.rangeM };
      }),
      kind: itemKindOf(existingItem) || (itemArtOf(existingItem).type === 'preset' && itemArtOf(existingItem).value === 'bag'
        ? 'dimensional-bag' : (isWeaponItem(existingItem) ? 'weapon' : (isShieldItem(existingItem) ? 'shield' : null))),
      equipped: itemEquippedOf(existingItem),
      weaponProfile: weaponProfileOf(existingItem),
      shieldProfile: shieldProfileOf(existingItem)
    } : {
      id: null, name: '', desc: '', art: { type: 'preset', value: 'ring' }, rarity: 'non-comune',
      effects: [], usesMax: 0, requiresAttunement: false, resistances: [], immunities: [], senses: [],
      kind: null, equipped: false, weaponProfile: null, shieldProfile: null
    };

    openSheet(isEdit ? 'Modifica reliquia' : 'Nuova reliquia');
    openMselPanels.length = 0;
    bodyEl.className = 'sheet-body item-editor-sheet-body';
    var sheetRoot = overlay.querySelector('.bottom-sheet');
    if (sheetRoot) {
      sheetRoot.classList.add('item-editor-sheet-root');
    }

    var form = el('div', 'item-editor-form');
    var main = el('div', 'item-editor-main');
    var ui = {};

    ui.typeHero = buildTypeHero(draft, function () {
      refreshEditorTypeUi(draft, ui);
    });
    main.appendChild(ui.typeHero);

    ui.weaponProfileSection = buildWeaponProfileSection(draft);
    main.appendChild(ui.weaponProfileSection);

    ui.shieldProfileSection = buildShieldProfileSection(draft);
    main.appendChild(ui.shieldProfileSection);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'edit-input';
    nameInput.value = draft.name;
    nameInput.placeholder = 'Nome reliquia';
    nameInput.addEventListener('input', function () {
      draft.name = nameInput.value;
    });
    main.appendChild(buildField('Nome', nameInput, 'item-name-input'));
    main.appendChild(buildRarityDropdown(draft));

    var descInput = document.createElement('textarea');
    descInput.className = 'edit-input item-desc-input';
    descInput.rows = 3;
    descInput.placeholder = 'Aggiungi una descrizione dettagliata…';
    descInput.value = draft.desc;
    descInput.addEventListener('input', function () {
      draft.desc = descInput.value;
    });
    main.appendChild(buildField('Descrizione', descInput));

    ui.attuneWrap = el('div', 'item-editor-attune-wrap');
    ui.attuneWrap.appendChild(buildAttunementToggleRow(draft));
    if (isBagDraft(draft)) {
      ui.attuneWrap.classList.add('hidden');
    }
    main.appendChild(ui.attuneWrap);

    ui.effectsPanel = buildEditorEffectsPanel(draft);
    if (isBagDraft(draft)) {
      ui.effectsPanel.classList.add('hidden');
    }
    main.appendChild(ui.effectsPanel);

    ui.enabledBlocks = initEnabledFeatureBlocks(draft);
    ui.featuresWrap = el('div', 'item-editor-features-wrap');
    ui.featuresEl = el('div', 'item-editor-features');
    ui.featuresWrap.appendChild(ui.featuresEl);

    ui.addSelectWrap = buildFeatureAddSelect(draft, ui.enabledBlocks, function () {
      ui.renderFeatures();
    });

    ui.renderFeatures = function () {
      renderItemFeatureBlocks(draft, ui.enabledBlocks, ui.featuresEl, ui.renderFeatures);
      ui.addSelectWrap.populate();
      var hasOpts = availableFeatureOptions(ui.enabledBlocks).length > 0;
      ui.addSelectWrap.classList.toggle('hidden', !hasOpts || isBagDraft(draft));
    };
    if (isBagDraft(draft)) {
      ui.featuresWrap.classList.add('hidden');
      ui.addSelectWrap.classList.add('hidden');
    }
    ui.renderFeatures();
    refreshEditorTypeUi(draft, ui);
    main.appendChild(ui.addSelectWrap);
    main.appendChild(ui.featuresWrap);

    var errorEl = el('p', 'item-form-error');
    form.appendChild(main);
    bodyEl.appendChild(form);

    var footer = el('div', 'item-editor-footer');
    footer.appendChild(errorEl);
    if (isEdit) {
      var deleteBtn = el('button', 'delete-btn', 'Elimina');
      deleteBtn.type = 'button';
      deleteBtn.addEventListener('click', function () {
        if (!confirm('Eliminare "' + draft.name + '"? L\'azione non si può annullare.')) {
          return;
        }
        commitState(function (character) {
          character.items = (character.items || []).filter(function (it) {
            return it.id !== draft.id;
          });
        });
        closeSheet();
      });
      footer.appendChild(deleteBtn);
    }

    var saveBtn = el('button', 'save-btn', 'Salva');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', function () {
      if (!draft.name.trim()) {
        errorEl.textContent = 'Serve un nome per la reliquia.';

        return;
      }
      draft.effects = draft.effects.filter(function (eff) {
        return eff.text === undefined || eff.text.trim() !== '';
      }).map(function (eff) {
        return eff.text !== undefined ? { text: eff.text.trim() } : { target: eff.target, value: Number(eff.value) || 0 };
      });
      var attuned = draft.attuned;
      if (!draft.requiresAttunement) {
        attuned = true;
      } else if (isEdit && !itemRequiresAttunementOf(existingItem)) {
        attuned = false;
      }
      var weaponProfile = isWeaponDraft(draft) ? draft.weaponProfile : null;
      var shieldProfile = isShieldDraft(draft) ? draft.shieldProfile : null;
      commitState(function (character) {
        character.items = character.items || [];
        var itemId = draft.id;
        var payload = {
          name: draft.name.trim(),
          desc: draft.desc,
          art: draft.art,
          rarity: draft.rarity,
          effects: draft.effects,
          usesMax: draft.usesMax,
          requiresAttunement: draft.requiresAttunement,
          attuned: attuned,
          resistances: draft.resistances,
          immunities: draft.immunities,
          senses: draft.senses,
          kind: draft.kind || null,
          weaponProfile: weaponProfile,
          shieldProfile: shieldProfile
        };
        if (isEdit) {
          var idx = -1;
          character.items.forEach(function (it, i) {
            if (it.id === draft.id) {
              idx = i;
            }
          });
          if (idx !== -1) {
            character.items[idx] = Object.assign({ id: draft.id, equipped: draft.equipped }, payload);
            itemId = draft.id;
          }
        } else {
          itemId = 'itm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          var shouldEquip = false;
          if (isWeaponDraft(draft) && !getEquippedWeaponItem(character)) {
            shouldEquip = true;
          }
          if (isShieldDraft(draft) && !getEquippedShieldItem(character)) {
            shouldEquip = true;
          }
          character.items.push(Object.assign({
            id: itemId,
            equipped: shouldEquip
          }, payload));
        }
        if (draft.kind === 'dimensional-bag') {
          equipDimensionalBag(character, itemId);
        }
        if (isWeaponDraft(draft)) {
          var savedWeapon = null;
          character.items.forEach(function (it) {
            if (it.id === itemId) {
              savedWeapon = it;
            }
          });
          if (savedWeapon && savedWeapon.equipped) {
            equipWeaponItem(character, itemId);
          }
        }
        if (isShieldDraft(draft)) {
          var savedShield = null;
          character.items.forEach(function (it) {
            if (it.id === itemId) {
              savedShield = it;
            }
          });
          if (savedShield && savedShield.equipped) {
            equipShieldItem(character, itemId);
          }
        }
        normalizeDimensionalBags(character);
        normalizeWeaponItems(character);
        normalizeShieldItems(character);
      });
      closeSheet();
    });
    footer.appendChild(saveBtn);
    bodyEl.appendChild(footer);

    refreshEditorTypeUi(draft, ui);
  }

  /* ---------- render: contatore sintonizzazione (sopra la lista, solo se
     almeno un oggetto la richiede) ---------- */

  function buildAttuneCounter(ch) {
    var wrap = el('div', 'attune-counter');
    wrap.appendChild(el('span', 'attune-counter-label', '✦ Sintonizzazione'));
    var dots = el('span', 'attune-dots');
    dots.setAttribute('aria-hidden', 'true');
    var count = attunedCount(ch);
    for (var i = 0; i < MAX_ATTUNED; i++) {
      dots.appendChild(el('span', 'attune-dot' + (i < count ? ' filled' : '')));
    }
    wrap.appendChild(dots);
    wrap.appendChild(el('span', 'attune-counter-count', count + '/' + MAX_ATTUNED));

    return wrap;
  }

  /* ---------- render: lista Reliquie (accordion identico alla vetrina
     hardcoded di Lama Vincolante/Scudo Magico, vedi index.html e
     css/components/treasury.css) ---------- */

  function renderTraitsList() {
    var list = document.getElementById('custom-items-list');
    if (!list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var items = ch.items || [];
    list.innerHTML = '';

    var anyAttunement = items.some(function (it) {
      return itemRequiresAttunementOf(it);
    });
    if (anyAttunement) {
      list.appendChild(buildAttuneCounter(ch));
    }

    items.forEach(function (item) {
      var art = itemArtOf(item);
      var rarity = itemRarityOf(item);
      var requiresAttunement = itemRequiresAttunementOf(item);
      var attuned = itemAttunedOf(item);
      var isBag = isDimensionalBag(item);
      var isWeapon = isWeaponItem(item);
      var isShield = isShieldItem(item);
      var equipped = isBag
        ? isBagActive(item, ch)
        : (isWeapon ? isWeaponEquipped(item, ch) : (isShield ? isShieldEquipped(item, ch) : false));

      var acc = el('div', 'relic-acc' + (requiresAttunement && !attuned ? ' dim' : ''));

      var head = el('button', 'relic-acc-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', 'false');

      if (isBag) {
        var bagBtn = el('button', 'head-bag' + (equipped ? ' on' : ''), '🎒');
        bagBtn.type = 'button';
        bagBtn.setAttribute('aria-label', equipped ? 'Togli dalle spalle' : 'Equipaggia');
        bagBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          commitState(function (character) {
            if (equipped) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.equipped = false;
                }
              });
            } else {
              equipDimensionalBag(character, item.id);
            }
          });
        });
        head.appendChild(bagBtn);
      } else if (isWeapon) {
        var weaponBtn = el('button', 'head-weapon' + (equipped ? ' on' : ''), '⚔');
        weaponBtn.type = 'button';
        weaponBtn.setAttribute('aria-label', equipped ? 'Riponi l\'arma' : 'Impugna');
        weaponBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          commitState(function (character) {
            if (equipped) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.equipped = false;
                }
              });
            } else if (itemEffectsActive(item)) {
              equipWeaponItem(character, item.id);
            }
          });
        });
        head.appendChild(weaponBtn);
      } else if (isShield) {
        var shieldBtn = el('button', 'head-shield' + (equipped ? ' on' : ''), '🛡');
        shieldBtn.type = 'button';
        shieldBtn.setAttribute('aria-label', equipped ? 'Riponi lo scudo' : 'Equipaggia scudo');
        shieldBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          commitState(function (character) {
            if (equipped) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.equipped = false;
                }
              });
            } else if (itemEffectsActive(item)) {
              equipShieldItem(character, item.id);
            }
          });
        });
        head.appendChild(shieldBtn);
      } else if (requiresAttunement) {
        var gem = el('button', 'head-gem' + (attuned ? ' on' : ''), '✦');
        gem.type = 'button';
        gem.setAttribute('aria-label', attuned ? 'Dis-sintonizza' : 'Sintonizza');
        if (!attuned && !canAttune(ch, item)) {
          gem.title = 'Slot pieni';
        }
        gem.addEventListener('click', function (e) {
          e.stopPropagation();
          if (attuned) {
            commitState(function (character) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.attuned = false;
                }
              });
            });
          } else if (canAttune(ch, item)) {
            commitState(function (character) {
              (character.items || []).forEach(function (it) {
                if (it.id === item.id) {
                  it.attuned = true;
                }
              });
            });
          }
        });
        head.appendChild(gem);
      } else {
        var spacer = el('span', 'head-gem spacer', '✦');
        spacer.setAttribute('aria-hidden', 'true');
        head.appendChild(spacer);
      }

      var medSm = el('span', 'medal-sm');
      medSm.innerHTML = medallionSvg(art, 30);
      head.appendChild(medSm);

      head.appendChild(el('span', 'relic-acc-name', item.name));
      head.appendChild(el('span', 'relic-rarity ' + rarity, rarityLabel(rarity)));
      head.appendChild(el('span', 'relic-acc-arrow', '▾'));

      head.addEventListener('click', function () {
        var isOpen = acc.classList.toggle('open');
        head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      var body = el('div', 'relic-acc-body');
      var card = el('div', 'relic-card');

      var artWrap = el('div', 'relic-art relic-art-big');
      artWrap.innerHTML = medallionSvg(art, 132);
      card.appendChild(artWrap);

      var headRow = el('div', 'relic-head');
      headRow.appendChild(el('h3', 'relic-name', item.name));
      headRow.appendChild(el('span', 'relic-rarity ' + rarity, rarityLabel(rarity)));
      card.appendChild(headRow);

      if (item.desc) {
        card.appendChild(el('p', 'relic-type', item.desc));
      }

      if (requiresAttunement) {
        card.appendChild(el('div', 'attune-badge ' + (attuned ? 'on' : 'off'),
          attuned ? '✓ Sintonizzato' : 'Non sintonizzato'));
      }

      if (isBag) {
        card.appendChild(el('div', 'bag-badge ' + (equipped ? 'on' : 'off'),
          equipped ? '✓ Equipaggiata · ' + DIMENSIONAL_BAG_SELF_KG + ' kg sulle spalle' : 'Non equipaggiata'));
        card.appendChild(el('p', 'relic-type',
          'Contenitore extradimensionale · ' + DIMENSIONAL_BAG_CAPACITY_KG + ' kg (monete e bottino party)'));
      } else if (isWeapon) {
        var profile = weaponProfileOf(item);
        card.appendChild(el('div', 'bag-badge ' + (equipped ? 'on' : 'off'),
          equipped ? '✓ Impugnata in combattimento' : 'Non impugnata · tocca ⚔ per equipaggiare'));
        if (profile) {
          card.appendChild(el('p', 'relic-type',
            (profile.die || '1d8') + ' ' + (profile.type || '') +
            (profile.mastery ? ' · ' + profile.mastery : '')));
        }
      } else if (isShield) {
        var shieldProfile = shieldProfileOf(item);
        card.appendChild(el('div', 'bag-badge ' + (equipped ? 'on' : 'off'),
          equipped ? '✓ Equipaggiato in combattimento' : 'Non equipaggiato · tocca 🛡 per equipaggiare'));
        if (shieldProfile) {
          card.appendChild(el('p', 'relic-type', 'CA +' + shieldProfile.acBonus));
        }
      }

      if ((item.effects || []).length) {
        var ul = el('ul', 'relic-effects');
        item.effects.forEach(function (eff) {
          var line = eff.text !== undefined
            ? eff.text
            : window.AppEngine.formatMod(eff.value) + ' ' + effectLabel(eff.target);
          ul.appendChild(el('li', null, line));
        });
        card.appendChild(ul);
      }

      // Non c'è più un click diretto sulla card (l'intera testata apre/chiude
      // l'accordion, come le due reliquie storiche): la modifica resta
      // raggiungibile toccando il corpo espanso.
      card.appendChild(el('p', 'relic-note', 'Tocca per modificare'));
      card.addEventListener('click', function () {
        buildItemSheet(item);
      });

      body.appendChild(card);
      acc.appendChild(head);
      acc.appendChild(body);
      list.appendChild(acc);
    });
  }

  /* ---------- render: res-card per gli oggetti con usi limitati ---------- */

  function buildResourceCard(item) {
    var card = document.createElement('div');
    card.className = 'res-card';
    card.setAttribute('data-key', 'item-' + item.id);
    card.setAttribute('data-max', item.usesMax);

    var art = itemArtOf(item);
    var iconId = art.type === 'preset' ? art.value : 'ring';

    var med = el('span', 'rc-med');
    med.setAttribute('aria-hidden', 'true');
    med.innerHTML = iconSvg(iconId);
    card.appendChild(med);

    var info = el('div', 'rc-info');
    info.appendChild(el('span', 'rc-name', item.name));
    info.appendChild(el('span', 'rc-ctx', 'usi limitati'));
    info.appendChild(el('div', 'segbar'));
    card.appendChild(info);

    card.appendChild(el('span', 'rc-count'));

    return card;
  }

  function renderResourceCards() {
    var sec = document.getElementById('custom-items-res-sec');
    if (!sec) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var items = (ch.items || []).filter(function (it) {
      // Un oggetto non sintonizzato non genera/consuma usi giornalieri
      // (stesso principio di modSum/computeResources in js/engine.js).
      return it.usesMax > 0 && (!it.requiresAttunement || it.attuned);
    });

    Array.prototype.slice.call(sec.querySelectorAll('.res-card')).forEach(function (c) {
      c.remove();
    });

    items.forEach(function (item) {
      var card = buildResourceCard(item);
      sec.appendChild(card);
      if (window.AppSheet && window.AppSheet.renderResourceCard) {
        window.AppSheet.renderResourceCard(card); // aggancia subito il tocco (usi ± come le altre res-card)
      }
    });

    sec.classList.toggle('hidden', items.length === 0);
  }

  function render() {
    renderTraitsList();
    renderResourceCards();
  }

  /* ---------- avvio ---------- */

  function init() {
    overlay = document.getElementById('item-sheet-overlay');
    titleEl = document.getElementById('item-sheet-title');
    bodyEl = document.getElementById('item-sheet-body');
    if (!overlay || !titleEl || !bodyEl) {
      return;
    }
    var closeBtn = document.getElementById('item-sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });
    var addBtn = document.getElementById('item-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        buildItemSheet(null);
      });
    }
    var state = window.AppStorage.getState();
    var changed = false;
    if (stripLegacyRelicModifiers(state.character)) {
      changed = true;
    }
    if (normalizeDimensionalBags(state.character)) {
      changed = true;
    }
    if (normalizeWeaponItems(state.character)) {
      changed = true;
    }
    if (normalizeShieldItems(state.character)) {
      changed = true;
    }
    if (changed) {
      window.AppStorage.saveState(state);
      if (window.AppStats && window.AppStats.render) {
        window.AppStats.render();
      }
    }
    render();
    if (window.AppTreasury && window.AppTreasury.renderCarryBar) {
      window.AppTreasury.renderCarryBar();
    }
  }

  window.AppItems = {
    init: init,
    render: render,
    isDimensionalBag: isDimensionalBag,
    getEquippedDimensionalBag: getEquippedDimensionalBag,
    isWeaponItem: isWeaponItem,
    activeEquippedWeaponProfile: activeEquippedWeaponProfile,
    isShieldItem: isShieldItem,
    characterHasEquippedShield: characterHasEquippedShield,
    activeEquippedShieldBonus: activeEquippedShieldBonus,
    itemEffectsActive: itemEffectsActive,
    DIMENSIONAL_BAG_CAPACITY_KG: DIMENSIONAL_BAG_CAPACITY_KG,
    DIMENSIONAL_BAG_SELF_KG: DIMENSIONAL_BAG_SELF_KG,
    medallionSvg: medallionSvg,
    ICON_IDS: ICON_IDS,
    TYPE_LABELS: TYPE_LABELS,
    RARITY_OPTIONS: RARITY_OPTIONS
  };
})();
