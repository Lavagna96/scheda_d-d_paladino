/*
 * Motore di derivazione (Fase 0 della roadmap).
 *
 * Modello "fatti base + modificatori": lo stato persistito contiene solo i
 * fatti base del personaggio (state.character) più una lista generica
 * modifiers = [{ source, target, value }]; le formule del PHB 2024 vivono
 * qui in codice e producono tutti i valori derivati della scheda.
 *
 * Bersagli riconosciuti per i modificatori:
 *   'attacco', 'danni', 'cd-inc', 'att-inc', 'ca', 'iniziativa', 'ts', 'pf-max'
 *
 * Formule verificate sul PHB 2024 (PDF locale):
 *   mod = ⌊(punteggio − 10) / 2⌋ · competenza = ⌈livello/4⌉ + 1
 *   CD incantesimi = 8 + competenza + mod caratteristica da incantatore
 *   Aura di Protezione (Paladino 6+) = mod CAR (min +1) ai TS, 3 m (9 m al 18°)
 *   Imposizione delle Mani = 5 × livello da paladino
 *   Soffio del Dragonide: CD = 8 + mod COS + competenza; 1d10 (2d10 al 5°,
 *   3d10 all'11°, 4d10 al 17°); usi = bonus competenza; Volo Draconico dal 5°.
 */
(function () {
  var ABILITY_ORDER = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];

  var ABILITY_LABELS = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };

  var SKILLS = [
    { id: 'acrobazia', label: 'Acrobazia', abil: 'DES' },
    { id: 'addestrare-animali', label: 'Addestrare Animali', abil: 'SAG' },
    { id: 'arcano', label: 'Arcano', abil: 'INT' },
    { id: 'atletica', label: 'Atletica', abil: 'FOR' },
    { id: 'furtivita', label: 'Furtività', abil: 'DES' },
    { id: 'indagare', label: 'Indagare', abil: 'INT' },
    { id: 'inganno', label: 'Inganno', abil: 'CAR' },
    { id: 'intimidire', label: 'Intimidire', abil: 'CAR' },
    { id: 'intrattenere', label: 'Intrattenere', abil: 'CAR' },
    { id: 'intuizione', label: 'Intuizione', abil: 'SAG' },
    { id: 'medicina', label: 'Medicina', abil: 'SAG' },
    { id: 'natura', label: 'Natura', abil: 'INT' },
    { id: 'percezione', label: 'Percezione', abil: 'SAG' },
    { id: 'persuasione', label: 'Persuasione', abil: 'CAR' },
    { id: 'rapidita-di-mano', label: 'Rapidità di Mano', abil: 'DES' },
    { id: 'religione', label: 'Religione', abil: 'INT' },
    { id: 'sopravvivenza', label: 'Sopravvivenza', abil: 'SAG' },
    { id: 'storia', label: 'Storia', abil: 'INT' }
  ];

  /* CA base per armatura indossata (PHB 2024, cap. 6). Per ora solo quelle
     usate; si estende qui quando servono altre armature. */
  var ARMORS = {
    piastre: { label: 'Piastre', baseAc: 18, dexBonus: 'none' }
  };

  function abilityMod(score) {
    return Math.floor((score - 10) / 2);
  }

  function profBonus(level) {
    return Math.ceil(level / 4) + 1;
  }

  /* Segno meno tipografico U+2212, come nel resto dell'app */
  function fmt(n) {
    return (n >= 0 ? '+' : '−') + Math.abs(n);
  }

  function modSum(ch, target) {
    var total = 0;
    (ch.modifiers || []).forEach(function (m) {
      if (m.target === target) {
        total += m.value;
      }
    });

    return total;
  }

  function breathDice(level) {
    if (level >= 17) { return '4d10'; }
    if (level >= 11) { return '3d10'; }
    if (level >= 5) { return '2d10'; }

    return '1d10';
  }

  function derive(ch) {
    var manual = window.MANUAL_55 || { classes: {}, slotTables: {} };
    var klass = manual.classes[ch.classId] || {};
    var pb = profBonus(ch.level);

    var mods = {};
    ABILITY_ORDER.forEach(function (k) {
      mods[k] = abilityMod(ch.abilities[k]);
    });

    var isPaladin = ch.classId === 'paladino';
    var auraBonus = (isPaladin && ch.level >= 6) ? Math.max(1, mods.CAR) : 0;
    var auraRangeM = ch.level >= 18 ? 9 : 3;

    var abilities = ABILITY_ORDER.map(function (k) {
      return { key: k, score: ch.abilities[k], mod: mods[k], modText: fmt(mods[k]) };
    });

    var saves = ABILITY_ORDER.map(function (k) {
      var prof = (ch.profSaves || []).indexOf(k) !== -1;
      var total = mods[k] + (prof ? pb : 0) + auraBonus + modSum(ch, 'ts');

      return { key: k, label: ABILITY_LABELS[k], prof: prof, total: total, text: fmt(total) };
    });

    var skills = {};
    SKILLS.forEach(function (sk) {
      var prof = (ch.profSkills || []).indexOf(sk.id) !== -1;
      var total = mods[sk.abil] + (prof ? pb : 0);
      skills[sk.id] = {
        id: sk.id, label: sk.label, abil: sk.abil,
        abilShort: sk.abil.charAt(0) + sk.abil.slice(1).toLowerCase(),
        prof: prof, total: total, text: fmt(total)
      };
    });
    var passivePerception = 10 + skills.percezione.total;

    var armor = ARMORS[(ch.armor || {}).id];
    var ac = (armor ? armor.baseAc : 10 + mods.DES) +
             (ch.armor && ch.armor.shield ? 2 : 0) + modSum(ch, 'ca');
    var acNote = (armor ? armor.label : 'Senza armatura') +
                 (ch.armor && ch.armor.shield ? ' + Scudo' : '');

    var initiative = mods.DES + modSum(ch, 'iniziativa');

    var spellAbility = klass.spellAbility || 'CAR';
    var spellDc = 8 + pb + mods[spellAbility] + modSum(ch, 'cd-inc');
    var spellAttack = pb + mods[spellAbility] + modSum(ch, 'att-inc');

    /* PF massimi: dado pieno al 1° livello, media fissa dai successivi */
    var die = parseInt((klass.hitDie || 'd8').slice(1), 10);
    var hpMax = die + mods.COS + (ch.level - 1) * (die / 2 + 1 + mods.COS) +
                modSum(ch, 'pf-max');

    var poolMax = {
      hp: hpMax,
      loh: isPaladin ? 5 * ch.level : 0,
      steedhp: 5 + 10 * (ch.steedSlotLevel || 2),
      tempHp: 0
    };

    var slots = (manual.slotTables[klass.casterType] || [])[ch.level] || [];

    var breath = {
      dc: 8 + mods.COS + pb,
      dice: breathDice(ch.level),
      uses: pb
    };

    var resources = [];
    if (klass.channelDivinity && klass.channelDivinity[ch.level]) {
      resources.push({ key: 'cd', max: klass.channelDivinity[ch.level] });
    }
    resources.push({ key: 'hd', max: ch.level, ctx: ch.level + (klass.hitDie || 'd8') });
    if (ch.speciesId === 'dragonide') {
      resources.push({ key: 'breath', max: breath.uses, ctx: breath.dice + ' fuoco' });
      if (ch.level >= 5) {
        resources.push({ key: 'flight', max: 1 });
      }
    }
    if (isPaladin && ch.level >= 2) {
      resources.push({ key: 'smitefree', max: 1 });
    }
    if (isPaladin && ch.level >= 5) {
      resources.push({ key: 'steedfree', max: 1 });
    }
    slots.forEach(function (n, i) {
      resources.push({ key: 'sl' + (i + 1), max: n });
    });
    (ch.extraResources || []).forEach(function (r) {
      resources.push(r);
    });

    var w = ch.weapon || {};
    var weaponHit = mods.FOR + pb + modSum(ch, 'attacco');
    var weaponDmgBonus = mods.FOR + modSum(ch, 'danni') +
                         (ch.fightingStyle === 'duello' ? 2 : 0);
    var sacredWeaponBonus = Math.max(1, mods.CAR);

    return {
      name: ch.name,
      level: ch.level,
      classId: ch.classId,
      className: klass.name || ch.classId,
      classLine: ch.speciesLabel + ' · ' + (klass.name || ch.classId) + ' ' +
                 ch.level + ' · ' + ch.subclassName,
      headerLine: (klass.name || ch.classId) + ' · Livello ' + ch.level,
      speciesLabel: ch.speciesLabel,
      profBonus: pb,
      abilities: abilities,
      mods: mods,
      saves: saves,
      skills: skills,
      passivePerception: passivePerception,
      ac: ac,
      acNote: acNote,
      initiative: initiative,
      initiativeText: fmt(initiative),
      initiativeNote: ch.initiativeNote || '',
      spellDc: spellDc,
      spellAttack: spellAttack,
      spellAbilityModText: fmt(mods[spellAbility]),
      poolMax: poolMax,
      slots: slots,
      resources: resources,
      breath: breath,
      aura: { bonus: auraBonus, text: fmt(auraBonus), rangeM: auraRangeM },
      sacredWeaponBonus: sacredWeaponBonus,
      sacredWeaponText: fmt(sacredWeaponBonus),
      weapon: {
        name: w.name || '',
        mastery: w.mastery || '',
        hit: weaponHit,
        hitText: fmt(weaponHit),
        dmgText: (w.die || '1d8') + (weaponDmgBonus ? fmt(weaponDmgBonus) : '') +
                 ' ' + (w.type || '')
      },
      carryStr: ch.abilities.FOR
    };
  }

  var cache = null;
  var cacheKey = null;

  function getView() {
    var state = window.AppStorage.getState();
    var key = state.lastModifiedMs || 0;
    if (!cache || cacheKey !== key) {
      cache = derive(state.character);
      cacheKey = key;
    }

    return cache;
  }

  window.AppEngine = {
    derive: derive,
    getView: getView,
    abilityMod: abilityMod,
    profBonus: profBonus,
    formatMod: fmt,
    SKILLS: SKILLS
  };
})();
