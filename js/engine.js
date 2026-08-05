/*
 * Motore di derivazione (Fase 0 della roadmap).
 *
 * Modello "fatti base + modificatori": lo stato persistito contiene solo i
 * fatti base del personaggio (state.character) più una lista generica
 * modifiers = [{ source, target, value }]; le formule del PHB 2024 vivono
 * qui in codice e producono tutti i valori derivati della scheda.
 *
 * Bersagli riconosciuti per i modificatori:
 *   'attacco', 'danni', 'cd-inc', 'att-inc', 'ca', 'iniziativa', 'ts', 'pf-max',
 *   'velocita', 'pp' (Percezione passiva — Step 3.9.a)
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

  /* Armatura indossata: il dato viene da `MANUAL_55.armors` (5.B.5, prima era
     una tabellina di 4 voci qui dentro). `dexCap: null` nei dati significa
     bonus DES pieno (armature leggere) e qui diventa Infinity; un numero è il
     tetto al bonus DES positivo (medie); 0 = il mod DES non si applica affatto
     (pesanti — vedi nota nel calcolo di ac più sotto). */
  function armorById(id) {
    var list = (window.MANUAL_55 && window.MANUAL_55.armors) || [];
    var found = null;
    list.forEach(function (a) {
      if (a.id === id) {
        found = a;
      }
    });
    if (!found) {
      return null;
    }

    return {
      label: found.name,
      baseAc: found.baseAc,
      dexCap: found.dexCap === null ? Infinity : found.dexCap
    };
  }

  /* Bonus/valori di classe che scalano con una caratteristica o hanno logica:
     vivono nel motore (Fase 0: le formule del PHB stanno qui), NON nei dati.
     Le tabelle puramente per-livello stanno invece in klass.classResources
     (js/manual-55.js). ability = punteggio da cui scala; min = pavimento. */
  var CLASS_BONUSES = {
    paladino: {
      aura: { from: 6, target: 'ts', ability: 'CAR', min: 1 },  // Aura di Protezione
      sacredWeapon: { ability: 'CAR', min: 1, subclass: 'devozione' } // Arma Sacra (solo Devozione)
    },
    ranger: {
      // Bonus di Iniziativa del Cercatore d'Ombre (mod Saggezza): il primo
      // bonus di sottoclasse non su 'ts'/'attacco' ecc. ma sull'iniziativa —
      // stesso filtro subclass già in uso, letto a parte più sotto.
      gloomInit: { ability: 'SAG', min: 0, subclass: 'cercatore-ombre' }
    }
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

  /* Competenza extra concessa da un oggetto custom (Step 3.9.b, terza
     parte): stesso principio di modSum, un oggetto conta solo se attivo
     (itemEffectsActive di js/items.js, o il fallback se items.js non è
     ancora caricato). MAI scritto dentro ch.profSkills/ch.profSaves — quei
     due restano solo i fatti base (classe/background/level-up), la
     competenza da oggetto è un OR calcolato qui, sparisce da sola se
     l'oggetto viene rimosso o dis-sintonizzato. `field` è 'profSkills' o
     'profSaves', `id` l'id abilità o la sigla caratteristica (FOR/DES/...). */
  function itemGrantsProf(ch, field, id) {
    var granted = false;
    (ch.items || []).forEach(function (item) {
      if (granted) {
        return;
      }
      var active = window.AppItems && window.AppItems.itemEffectsActive
        ? window.AppItems.itemEffectsActive(item)
        : (!item.requiresAttunement || item.attuned);
      if (active && (item[field] || []).indexOf(id) !== -1) {
        granted = true;
      }
    });

    return granted;
  }

  function modSum(ch, target) {
    var total = 0;
    (ch.modifiers || []).forEach(function (m) {
      if (m.target === target) {
        total += m.value;
      }
    });
    /* Reliquie/oggetti magici creati dall'utente (Step 3.5): stessa somma
       additiva dei modifiers "di sistema", ma da un array separato — vedi
       character.items in js/items.js. character.modifiers resta intatto. */
    (ch.items || []).forEach(function (item) {
      if (window.AppItems && window.AppItems.itemEffectsActive) {
        if (!window.AppItems.itemEffectsActive(item)) {
          return;
        }
      } else if (item.requiresAttunement && !item.attuned) {
        return;
      }
      // Effetti a testo libero (Step 3.9.a) non hanno `target`: il confronto
      // sotto li scarta da solo, nessun controllo esplicito necessario.
      (item.effects || []).forEach(function (eff) {
        if (eff.target === target) {
          total += Number(eff.value) || 0;
        }
      });
    });

    return total;
  }

  /* Colpire/Danni di UN'arma qualunque con le statistiche del personaggio
     (Blocco 5.A.3, estratta allo Step 3.9.e): usata sia per l'arma
     equipaggiata in getView() sia dal selettore "Aggiungi attacco → Da
     un'arma" (js/edit-sheet.js), che compila una volta i campi liberi con i
     numeri giusti invece di farli ricalcolare a memoria. */
  function computeWeaponAttack(ch, mods, pb, w) {
    var wAbil = w.ranged ? 'DES'
      : (w.finesse && mods.DES > mods.FOR) ? 'DES'
      : 'FOR';
    var hit = mods[wAbil] + pb + modSum(ch, 'attacco');
    var duelloOk = ch.fightingStyle === 'duello' && !w.ranged && !w.twoHanded;
    var dmgBonus = mods[wAbil] + modSum(ch, 'danni') + (duelloOk ? 2 : 0);

    return {
      hit: hit,
      hitText: fmt(hit),
      dmgText: (w.die || '1d8') + (dmgBonus ? fmt(dmgBonus) : '') + ' ' + (w.type || '')
    };
  }

  function breathDice(level) {
    if (level >= 17) { return '4d10'; }
    if (level >= 11) { return '3d10'; }
    if (level >= 5) { return '2d10'; }

    return '1d10';
  }

  /* Max di una risorsa di classe dai dati (klass.classResources): tabella
     byLevel oppure { from, max } costante, oppure scalata da una
     caratteristica (es. Ispirazione Bardica = mod CAR, minimo `min`) — stesso
     principio di CLASS_BONUSES ma per un NUMERO DI USI invece che un bonus.
     Ritorna 0 se non attiva al livello. */
  function resMax(def, level, klass, mods) {
    if (!def) { return 0; }
    /* byLevel = tabella propria; byLevelRef = nome di una tabella già presente
       sulla classe (es. 'rages' del Barbaro), per non duplicare i numeri. */
    var table = def.byLevel || (def.byLevelRef && klass && klass[def.byLevelRef]);
    if (table) { return table[level] || 0; }
    if (def.abilityMod && mods) {
      // from: la risorsa scalata da caratteristica può comunque partire da un
      // certo livello (es. Passo Fatato Libero del Vagabondo Fatato, dal 15°
      // — a differenza dell'Ispirazione Bardica, sempre attiva dal 1°).
      if (def.from && level < def.from) { return 0; }

      return Math.max(def.min || 0, mods[def.abilityMod] || 0);
    }
    if (typeof def.max === 'number') {
      return (def.from && level < def.from) ? 0 : def.max;
    }

    return 0;
  }

  function derive(ch) {
    var manual = window.MANUAL_55 || { classes: {}, slotTables: {} };
    var klass = manual.classes[ch.classId] || {};
    var pb = profBonus(ch.level);

    var mods = {};
    ABILITY_ORDER.forEach(function (k) {
      mods[k] = abilityMod(ch.abilities[k]);
    });

    var classRes = klass.classResources || {};
    var bonuses = CLASS_BONUSES[ch.classId] || {};
    var auraDef = bonuses.aura;
    var auraBonus = (auraDef && ch.level >= auraDef.from)
      ? Math.max(auraDef.min || 0, mods[auraDef.ability]) : 0;
    var auraRangeM = ch.level >= 18 ? 9 : 3;

    var abilities = ABILITY_ORDER.map(function (k) {
      return { key: k, score: ch.abilities[k], mod: mods[k], modText: fmt(mods[k]) };
    });

    var saves = ABILITY_ORDER.map(function (k) {
      var prof = (ch.profSaves || []).indexOf(k) !== -1 || itemGrantsProf(ch, 'profSaves', k);
      var total = mods[k] + (prof ? pb : 0) + auraBonus + modSum(ch, 'ts');

      return { key: k, label: ABILITY_LABELS[k], prof: prof, total: total, text: fmt(total) };
    });

    var skills = {};
    SKILLS.forEach(function (sk) {
      var prof = (ch.profSkills || []).indexOf(sk.id) !== -1 || itemGrantsProf(ch, 'profSkills', sk.id);
      // Competenza (Ladro, dal 1° livello): raddoppia il bonus di competenza
      // su un'abilità già competente — non si applica da sola senza prof.
      var expertise = prof && (ch.expertiseSkills || []).indexOf(sk.id) !== -1;
      var total = mods[sk.abil] + (prof ? pb : 0) + (expertise ? pb : 0);
      skills[sk.id] = {
        id: sk.id, label: sk.label, abil: sk.abil,
        abilShort: sk.abil.charAt(0) + sk.abil.slice(1).toLowerCase(),
        prof: prof, expertise: expertise, total: total, text: fmt(total)
      };
    });
    var passivePerception = 10 + skills.percezione.total + modSum(ch, 'pp');

    /* Armatura (Step 3.8, schermata unica Equipaggiamento): stesso schema già
       usato per lo scudo qui sotto — un oggetto kind:'armor' equipaggiato E
       sintonizzato (activeEquippedArmorProfile già filtra su questo) ha
       priorità sul fatto base ch.armor.id, che resta il ripiego quando nessun
       oggetto è attivo (e quindi lo stato di ogni personaggio esistente prima
       di questo redesign, che non può avere oggetti kind:'armor'). */
    var armorItemProfile = window.AppItems && window.AppItems.activeEquippedArmorProfile
      && window.AppItems.activeEquippedArmorProfile(ch);
    var armor = armorItemProfile
      ? {
        label: armorItemProfile.name || 'Armatura',
        baseAc: armorItemProfile.baseAc,
        dexCap: armorItemProfile.dexCap === null ? Infinity : armorItemProfile.dexCap
      }
      : armorById((ch.armor || {}).id);
    var hasArmor = !!armor;
    var shieldFromItem = window.AppItems && window.AppItems.characterHasEquippedShield
      && window.AppItems.characterHasEquippedShield(ch);
    var hasShield = !!(ch.armor && ch.armor.shield) || shieldFromItem;
    var ac;
    if (armor) {
      /* dexCap 0 = armatura pesante: il PHB dice che il mod DES "non si
         applica", non che è limitato a 0 — quindi qui non va usato
         Math.min(mods.DES, 0), che sottrarrebbe un mod DES negativo. */
      var armorDexBonus;
      if (armor.dexCap === Infinity) {
        armorDexBonus = mods.DES;
      } else if (armor.dexCap === 0) {
        armorDexBonus = 0;
      } else {
        armorDexBonus = Math.min(mods.DES, armor.dexCap);
      }
      ac = armor.baseAc + armorDexBonus;
    } else {
      /* CA senza armatura alternativa (Blocco 5.A.2): alcune classi sostituiscono
         la formula base con 10 + DES + una loro caratteristica (Barbaro: COS,
         Monaco: SAG). Il dato vive in klass.unarmoredDefense (js/manual-55.js).
         Il Barbaro la mantiene anche con lo scudo in mano (lo dice il PHB), il
         Monaco no (`unarmoredDefenseNoShield`): con lo scudo perde il bonus di
         SAG ma non lo scudo stesso, sommato comunque più sotto. */
      var udApplies = !klass.unarmoredDefenseNoShield || !hasShield;
      ac = 10 + mods.DES + (klass.unarmoredDefense && udApplies ? mods[klass.unarmoredDefense] : 0);
    }
    var defenseBonus = (ch.fightingStyle === 'difesa' && hasArmor) ? 1 : 0;
    var defaultShieldAc = ((window.MANUAL_55 && window.MANUAL_55.shield) || {}).ac || 2;
    var shieldAcAdd = 0;
    if (shieldFromItem) {
      shieldAcAdd = window.AppItems.activeEquippedShieldBonus(ch) || defaultShieldAc;
    } else if (ch.armor && ch.armor.shield) {
      shieldAcAdd = defaultShieldAc;
    }
    ac += shieldAcAdd + defenseBonus + modSum(ch, 'ca');
    var acNote = (armor ? armor.label : 'Senza armatura') +
                 (hasShield ? ' + Scudo' : '');

    /* Velocità: due condizioni diverse secondo la classe: 'unarmored'
       (default, Monaco) = niente armatura né scudo; 'notHeavy' (Ranger,
       Marcia Spedita) = qualunque armatura tranne quella Pesante. L'Elfo dei
       Boschi aggiunge 1,5 m dal suo Retaggio Elfico (js/create.js, scelta
       specie). */
    var species = manual.species[ch.speciesId] || {};
    var elfLineage = (manual.elfLineages || {})[ch.elfLineageId];
    var speedGateOk = klass.speedBonusGate === 'notHeavy'
      ? (!armor || armor.cat !== 'pesante')
      : (!hasArmor && !hasShield);
    var speedBonus = (speedGateOk && klass.speedBonusM) ? (klass.speedBonusM[ch.level] || 0) : 0;
    var speedM = (species.speedM || 9) + speedBonus + (elfLineage ? (elfLineage.speedBonusM || 0) : 0) +
      modSum(ch, 'velocita');

    // Bonus di sottoclasse all'iniziativa (Cercatore d'Ombre): stesso filtro
    // subclass già in uso per classResources/sacredWeapon.
    var initBonusDef = bonuses.gloomInit;
    var initBonus = (initBonusDef && initBonusDef.subclass === ch.subclassId)
      ? Math.max(initBonusDef.min || 0, mods[initBonusDef.ability]) : 0;
    var initiative = mods.DES + modSum(ch, 'iniziativa') + initBonus;

    var spellAbility = klass.spellAbility || 'CAR';
    var spellDc = 8 + pb + mods[spellAbility] + modSum(ch, 'cd-inc');
    var spellAttack = pb + mods[spellAbility] + modSum(ch, 'att-inc');

    /* PF massimi: dado pieno al 1° livello, media fissa dai successivi */
    var die = parseInt((klass.hitDie || 'd8').slice(1), 10);
    var hpMax = die + mods.COS + (ch.level - 1) * (die / 2 + 1 + mods.COS) +
                modSum(ch, 'pf-max');

    /* Destriero (5.B.3): esiste solo se la classe lo concede a questo livello
       — per il Paladino è Destriero Fedele, che dà Trova Destriero sempre
       preparato dal 5° (risorsa `steedfree` nei dati). Prima la card e i PF si
       calcolavano per chiunque, così un paladino di 1° livello si ritrovava un
       destriero fantasma da 25 PF. */
    var steedRes = classRes.steedfree;
    var hasSteed = !!(steedRes && ch.level >= (steedRes.from || 1));
    var poolMax = {
      hp: hpMax,
      steedhp: hasSteed ? 5 + 10 * (ch.steedSlotLevel || 2) : 0,
      tempHp: 0
    };
    /* Risorse di classe "a riserva" (es. Imposizione delle Mani) dai dati,
       nessun nome di classe cablato: qualunque classe con kind:'pool' nei
       suoi classResources entra qui con la sua chiave. */
    Object.keys(classRes).forEach(function (key) {
      if (classRes[key].kind === 'pool') {
        poolMax[key] = resMax(classRes[key], ch.level, klass, mods);
      }
    });

    /* Slot da incantatore: full/half sono tabelle per livello con un numero
       di slot per OGNI livello di incantesimo (colonne 1..9). Il Patto
       Magico del Warlock è diverso — tutti gli slot condividono lo STESSO
       livello (`pactSlotLevel`), che sale col personaggio mentre il numero
       di slot (`pactSlots`) resta basso: niente riga in `slotTables` per
       'pact', due tabelle piatte a parte. Uso un array sparso (un solo
       indice valorizzato) così le card sl1..sl9 pertinenti restano
       generiche: resta vuoto agli indici non usati, `forEach` li salta. */
    var slots;
    if (klass.casterType === 'pact') {
      var pactCount = (manual.slotTables.pactSlots || [])[ch.level] || 0;
      var pactLevel = (manual.slotTables.pactSlotLevel || [])[ch.level] || 0;
      slots = [];
      if (pactCount > 0 && pactLevel > 0) {
        slots[pactLevel - 1] = pactCount;
      }
    } else {
      slots = (manual.slotTables[klass.casterType] || [])[ch.level] || [];
    }

    // Tipo di danno del Soffio/Resistenza: dall'ascendenza draconica scelta
    // alla creazione (js/create.js); 'fuoco' come ripiego per personaggi
    // creati prima di questa scelta (Blocco 5.B).
    var dragonAncestor = (manual.dragonAncestors || {})[ch.dragonAncestryId];
    var breath = {
      dc: 8 + mods.COS + pb,
      dice: breathDice(ch.level),
      uses: pb,
      damageType: dragonAncestor ? dragonAncestor.dmg.toLowerCase() : 'fuoco'
    };

    var resources = [];
    if (klass.channelDivinity && klass.channelDivinity[ch.level]) {
      resources.push({ key: 'cd', max: klass.channelDivinity[ch.level], resetOn: 'short' });
    }
    resources.push({ key: 'hd', max: ch.level, ctx: ch.level + (klass.hitDie || 'd8') });
    if (ch.speciesId === 'dragonide') {
      resources.push({ key: 'breath', max: breath.uses, ctx: breath.dice + ' ' + breath.damageType });
      if (ch.level >= 5) {
        resources.push({ key: 'flight', max: 1 });
      }
    }
    /* Dono dell'Ascendenza dei Giganti (Goliath) e incantesimo sempre
       preparato dello Gnomo dei Boschi: stesso schema del Soffio, card
       dinamica (js/stats.js) perché il nome/testo dipende dalla scelta fatta
       alla creazione (js/create.js). */
    if (ch.speciesId === 'goliath') {
      var goliathGift = (manual.goliathGifts || {})[ch.goliathGiftId];
      if (goliathGift) {
        resources.push({ key: 'goliathGift', max: pb, resetOn: 'long',
          name: 'Dono: ' + goliathGift.name, ctx: goliathGift.desc });
      }
    }
    if (ch.speciesId === 'gnomo' && ch.gnomeLineageId === 'boschi') {
      var gnomeLineage = (manual.gnomeLineages || {})[ch.gnomeLineageId];
      resources.push({ key: 'gnomeSpeak', max: pb, resetOn: 'long',
        name: gnomeLineage.preparedSpell, ctx: 'usi senza slot' });
    }
    /* Risorse di classe a "usi" (res-card) dai dati, nell'ordine dichiarato;
       i 'pool' (es. Imposizione delle Mani) non sono res-card: vanno in poolMax. */
    Object.keys(classRes).forEach(function (key) {
      var def = classRes[key];
      // subclass: risorsa specifica di UNA sottoclasse (es. Dadi Superiorità
      // del Maestro di Battaglia), non dell'intera classe — altrimenti
      // trapelerebbe anche a Campione/Cavaliere Occulto/Combattente Psionico.
      // Senza questo filtro andrebbe in classResources solo ciò che vale per
      // ogni sottoclasse (finora sempre stato così, quindi nessuna voce
      // esistente lo usa e nessuna regressione).
      if (def.subclass && def.subclass !== ch.subclassId) {
        return;
      }
      if (def.kind === 'uses') {
        var max = resMax(def, ch.level, klass, mods);
        if (max > 0) {
          /* resetOnAt: la risorsa "migliora" il proprio recupero da un certo
             livello (es. Ispirazione Bardica: solo riposo lungo fino al 4°,
             poi anche breve dal 5° con Fonte d'Ispirazione) — generico, non
             legato al Bardo in particolare. */
          var resetOn = (def.resetOnAt && ch.level >= def.resetOnAt.level)
            ? def.resetOnAt.value : def.resetOn;
          // dieByLevel: il dado del "singolo uso" cresce col livello (es. il
          // Dado Superiorità del Maestro di Battaglia: d8 → d10 → d12) —
          // stesso principio di 'hd' (dado ferita + livello), generalizzato.
          var dieCtx = def.dieByLevel && def.dieByLevel[ch.level];
          resources.push({ key: key, max: max, name: def.name, resetOn: resetOn,
            ctx: dieCtx ? dieCtx + ' cad.' : undefined });
        }
      }
    });
    // Risorse di classe/specie rimosse dal pannello "Risorse personalizzate"
    // (js/grimorio-advanced.js): non richiedibili di nuovo qui, restano
    // nascoste anche dopo un salire di livello finché non si aggiunge di
    // nuovo una risorsa con la stessa chiave.
    if (ch.hiddenResourceKeys && ch.hiddenResourceKeys.length) {
      resources = resources.filter(function (r) {
        return ch.hiddenResourceKeys.indexOf(r.key) === -1;
      });
    }
    slots.forEach(function (n, i) {
      resources.push({ key: 'sl' + (i + 1), max: n });
    });
    // Sovrascrive in posto invece di accodare: da "Risorse personalizzate"
    // si può modificare anche una risorsa di classe (stessa chiave), e senza
    // questo sarebbe apparsa due volte per le risorse senza card statica in
    // index.html (es. Furia del Barbaro).
    (ch.extraResources || []).forEach(function (r) {
      var entry = {
        key: r.key,
        max: r.max,
        name: r.name || r.key,
        ctx: r.ctx || '',
        resetOn: r.resetOn || 'long'
      };
      var existingIdx = -1;
      for (var ri = 0; ri < resources.length; ri++) {
        if (resources[ri].key === r.key) {
          existingIdx = ri;
          break;
        }
      }
      if (existingIdx !== -1) {
        resources[existingIdx] = entry;
      } else {
        resources.push(entry);
      }
    });
    (ch.items || []).forEach(function (item) {
      // Idem: un oggetto non sintonizzato non genera/consuma usi giornalieri.
      var attunedOk = !item.requiresAttunement || item.attuned;
      if (item.usesMax > 0 && attunedOk) {
        resources.push({ key: 'item-' + item.id, max: item.usesMax, name: item.name, ctx: 'usi limitati' });
      }
    });

    var w = (window.AppItems && window.AppItems.activeEquippedWeaponProfile)
      ? (window.AppItems.activeEquippedWeaponProfile(ch) || ch.weapon || {})
      : (ch.weapon || {});
    var weaponAttack = computeWeaponAttack(ch, mods, pb, w);
    var swDef = bonuses.sacredWeapon;
    // Come il filtro subclass di classResources: un bonus con .subclass vale
    // solo per QUELLA sottoclasse, altrimenti Arma Sacra trapelerebbe anche a
    // Gloria/Antichi/Vendetta (privilegio esclusivo di Devozione).
    if (swDef && swDef.subclass && swDef.subclass !== ch.subclassId) {
      swDef = null;
    }
    var sacredWeaponBonus = swDef ? Math.max(swDef.min || 0, mods[swDef.ability]) : 0;

    return {
      name: ch.name,
      level: ch.level,
      classId: ch.classId,
      subclassId: ch.subclassId,
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
      speedM: speedM,
      initiative: initiative,
      initiativeText: fmt(initiative),
      initiativeNote: ch.initiativeNote || '',
      hasSteed: hasSteed,
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
        hit: weaponAttack.hit,
        hitText: weaponAttack.hitText,
        dmgText: weaponAttack.dmgText
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

  /* Etichetta di un'armatura con quanto vale davvero, per i menu di scelta:
     "Cotta di Maglia — CA 16", "Cuoio Borchiato — CA 12 + DES" (5.B.5). */
  function armorLabel(id) {
    var a = armorById(id);
    if (!a) {
      return 'Nessuna armatura';
    }
    var ca = 'CA ' + a.baseAc;
    if (a.dexCap === Infinity) {
      ca += ' + DES';
    } else if (a.dexCap > 0) {
      ca += ' + DES (max ' + a.dexCap + ')';
    }

    return a.label + ' — ' + ca;
  }

  window.AppEngine = {
    derive: derive,
    getView: getView,
    abilityMod: abilityMod,
    profBonus: profBonus,
    formatMod: fmt,
    armorLabel: armorLabel,
    computeWeaponAttack: computeWeaponAttack,
    SKILLS: SKILLS
  };
})();
