(function () {
  /*
   * Wizard di creazione personaggio (Fase 5, Blocco 5.B):
   * - b1   (fatto): scaffold — macchina a stati dei passi e navigazione.
   * - b2.1 (fatto): contenuto reale dei passi Specie e Classe, con stato in
   *   bozza condiviso `draft`.
   * - b2.2 (fatto): contenuto reale del passo Punteggi — point-buy, array
   *   standard e manuale (dati PHB 2024 p.37).
   * - b2.3 (fatto): contenuto reale del passo Competenze — Tiri Salvezza
   *   fissi della classe (di sola lettura) + scelta delle competenze di
   *   abilità (CLASS_SKILLS, PHB 2024).
   * - b2.4 (fatto): contenuto reale del passo Equipaggiamento — armatura,
   *   scudo e arma, con default sensati per classe (equip. iniziale del PHB
   *   2024, opzione A) tutti modificabili; NIENTE stile di combattimento
   *   (per il Paladino è una scelta di livello 2, il Barbaro non lo prende
   *   mai → arriva col level-up).
   * - b2.5 (fatto): contenuto reale del passo finale Sottoclasse/Incantesimi —
   *   a livello 1 nessuna classe sceglie la sottoclasse (tutte al livello 3:
   *   solo una nota informativa); per i caster, selettore incantesimi dal
   *   catalogo del manuale filtrato per classe e livello (Paladino: 2 di
   *   livello 1, nessun cantrip). Generico via casterType / cantripsByLevel /
   *   preparedByLevel; i non-caster (Barbaro) non hanno nulla da scegliere.
   * - b3   (qui): generazione vera del personaggio. "Crea personaggio"
   *   costruisce uno stato pulito dal draft (buildStateFromDraft, nessun
   *   residuo di Tharion, pool al massimo di livello 1), lo salva via
   *   AppCloud.createCharacter (localStorage + nuovo doc Firestore) e torna
   *   in dashboard dove compare la nuova card.
   * - b4 (5.B.3): la scheda del nuovo personaggio si apre pulita — merge
   *   neutro in storage.js, incantesimi fissi dai dati di classe/sottoclasse,
   *   niente destriero prima del 5° livello.
   * Pattern "Mago a schermo intero" (5.B.1): una vista a schermo intero, un
   * passo per volta.
   *
   * Vista pilotata dalla stessa macchina a stati sul <body> di
   * js/dashboard.js/css/components/dashboard.css: open() passa da
   * body.in-dashboard a body.in-create, close() torna indietro.
   */

  var STEPS = [
    { id: 'specie', title: 'Specie' },
    { id: 'classe', title: 'Classe' },
    // Il background sta PRIMA dei punteggi come nel manuale (prima l'origine,
    // poi le caratteristiche): i suoi +2/+1 si vedono mentre si distribuiscono
    // i punti, che è il momento in cui servono (5.B.4, alternativa A).
    { id: 'background', title: 'Background' },
    { id: 'punteggi', title: 'Punteggi' },
    { id: 'competenze', title: 'Competenze' },
    { id: 'equipaggiamento', title: 'Equipaggiamento' },
    { id: 'finale', title: 'Sottoclasse e Incantesimi' },
    // Ultimo passo: nessuna dipendenza dagli altri, per questo sta in coda.
    { id: 'identita', title: 'Identità' }
  ];

  var stepIndex = 0; // passo corrente, 0-based

  // Stato in bozza del personaggio in creazione: vive solo mentre il wizard
  // è aperto e viene azzerato a ogni open() (vedi sotto). I passi non ancora
  // implementati (b2.4+) non hanno ancora un campo dedicato qui.
  var draft = {
    name: '', speciesId: null, classId: null,
    // Scelte legate alla specie (5.B.6), una per ogni specie che ne prevede
    // una nel manuale — vedi SPECIES_REQUIRED_CHOICE e renderSpeciesChoice.
    dragonAncestryId: null, elfLineageId: null, elfSkillId: null,
    goliathGiftId: null, tieflingLegacyId: null, gnomeLineageId: null,
    scoreMethod: 'pointbuy',
    abilities: { FOR: 8, DES: 8, COS: 8, INT: 8, SAG: 8, CAR: 8 },
    profSkills: [],
    /* Background (5.B.4): id scelto, come si distribuiscono i suoi aumenti di
       caratteristica (`bonusMode` '2-1' oppure '1-1-1', con quali punteggi
       prendono il +2 e il +1), lo strumento quando il background lo fa
       scegliere, e quale dei suoi due pacchetti di equipaggiamento si prende. */
    backgroundId: null,
    bgBonusMode: '2-1', bgPlus2: null, bgPlus1: null,
    bgTool: '', bgPack: 'a',
    // Iniziato alla Magia (Accolito, Guida, Studioso): 2 trucchetti e 1
    // incantesimo di 1° livello dalla lista di classe indicata dal background.
    miCantrips: [], miSpells: [],
    // Background Personalizzato (house rule del tavolo, non è nel PHB): stesse
    // scelte dei 16 background ufficiali ma tutte libere invece che fissate
    // dal manuale — vedi customBg().
    customAbilities: [], customFeatId: null, customFeatList: null,
    customSkills: [], customKitBgId: null,
    // Equipaggiamento (b2.4): impostato in modo pigro dai default di classe
    // quando si entra nel passo (ensureEquipDraft); equipForClass ricorda per
    // quale classe è stato riempito, così cambiando classe si riparte dal kit
    // giusto.
    equip: null, equipForClass: null,
    // Maestrie scelte (id di armi dal catalogo): il PHB le dà al livello 1 alle
    // classi marziali — due tipi di arma per Paladino e Barbaro.
    masteries: [],
    // Incantesimi scelti nel passo finale (b2.5): id dal catalogo del manuale.
    // Vuoti per i non-caster; per il Paladino solo preparedSpells (2 di liv. 1).
    cantrips: [], preparedSpells: [],
    // Stile di Combattimento: solo per le classi che lo danno al livello 1
    // (choicePoints.fightingStyle === 1, es. Guerriero); le altre lo scelgono
    // al level-up.
    fightingStyleId: null,
    // Competenza: solo per le classi che la danno al livello 1 (Ladro).
    expertiseSkills: [],
    // Identità (passo finale): allineamento su due assi e le 2 lingue scelte
    // oltre al Comune (già dato di default, non tracciato qui).
    alignmentLaw: null, alignmentMorality: null, languages: []
  };

  var progressFillEl, stepNumEl, stepTitleEl, stepBodyEl, backBtn, nextBtn, footerNoteEl;

  // Riscrive il riepilogo del background nel passo Punteggi; null fuori da
  // quel passo (lo imposta renderPunteggi, lo azzera render()).
  var bgRecapRefresh = null;

  // Quale sezione dell'accordion del background Personalizzato è aperta: solo
  // stato di UI, non entra nel draft del personaggio (stessa idea di
  // bgRecapRefresh sopra). Senza questo, ogni scelta dentro una sezione
  // ridisegna l'intero accordion e lo farebbe ripartire sempre dalla prima.
  var customOpenSectionId = 'caratteristiche';

  // Ordine e etichette delle 6 caratteristiche: stessa convenzione di
  // js/levelup.js e js/edit-sheet.js.
  var ABILITY_ORDER = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
  var ABILITY_LABELS = {
    FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione',
    INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma'
  };

  // Stesse due opzioni con bonus meccanico di js/levelup.js (le uniche lette
  // altrove nel motore): qui serve solo quando la classe dà lo Stile già al
  // livello 1 (il Guerriero) invece che a un livello successivo, gestito dal
  // level-up. Duplicata invece di condivisa: i due file non hanno un modulo
  // comune da cui importare.
  var FIGHTING_STYLES = [
    { id: 'nessuno', label: 'Nessuno' },
    { id: 'duello', label: 'Duello (+2 danni, arma a una mano)' },
    { id: 'difesa', label: 'Difesa (+1 CA, con armatura)' }
  ];

  // Lingue Standard del PHB 2024 (passo Identità), Comune escluso perché è
  // già dato di default a tutti. Scope volutamente limitato alla regola base:
  // niente lingue bonus di classe (Gergo Ladresco, Esploratore Provetto…),
  // privilegi non ancora modellati nel motore.
  var STANDARD_LANGUAGES = [
    { id: 'lingua-segni', name: 'Lingua dei Segni Comune' },
    { id: 'draconico', name: 'Draconico' },
    { id: 'nanico', name: 'Nanico' },
    { id: 'elfico', name: 'Elfico' },
    { id: 'gigante', name: 'Gigante' },
    { id: 'gnomesco', name: 'Gnomesco' },
    { id: 'goblin', name: 'Goblin' },
    { id: 'halfling', name: 'Halfling' },
    { id: 'orchesco', name: 'Orchesco' }
  ];

  // Point-buy (PHB 2024 p.37): 27 punti totali; costo per punteggio 8-15.
  var POINT_BUY_BUDGET = 27;
  var POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

  // Array standard (PHB 2024 p.37): 6 valori fissi da assegnare uno a testa.
  var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

  // Array consigliato per classe (PHB 2024 p.37), ordine FOR,DES,COS,INT,SAG,CAR:
  // è sempre una permutazione di STANDARD_ARRAY (costo 27 in point-buy "per
  // costruzione").
  var RECOMMENDED_ARRAYS = {
    barbaro:   { FOR: 15, DES: 13, COS: 14, INT: 10, SAG: 12, CAR: 8 },
    bardo:     { FOR: 8,  DES: 14, COS: 12, INT: 13, SAG: 10, CAR: 15 },
    chierico:  { FOR: 14, DES: 8,  COS: 13, INT: 10, SAG: 15, CAR: 12 },
    druido:    { FOR: 8,  DES: 12, COS: 14, INT: 13, SAG: 15, CAR: 10 },
    guerriero: { FOR: 15, DES: 14, COS: 13, INT: 8,  SAG: 10, CAR: 12 },
    monaco:    { FOR: 12, DES: 15, COS: 13, INT: 10, SAG: 14, CAR: 8 },
    paladino:  { FOR: 15, DES: 10, COS: 13, INT: 8,  SAG: 12, CAR: 14 },
    ranger:    { FOR: 12, DES: 15, COS: 13, INT: 8,  SAG: 14, CAR: 10 },
    ladro:     { FOR: 12, DES: 15, COS: 13, INT: 14, SAG: 10, CAR: 8 },
    stregone:  { FOR: 10, DES: 13, COS: 14, INT: 8,  SAG: 12, CAR: 15 },
    warlock:   { FOR: 8,  DES: 14, COS: 13, INT: 12, SAG: 10, CAR: 15 },
    mago:      { FOR: 8,  DES: 12, COS: 13, INT: 15, SAG: 14, CAR: 10 }
  };

  // Costo cumulativo point-buy di un punteggio e totale punti già spesi
  // secondo draft.abilities (helper condivisi da validazione e render).
  function pointBuyCost(score) {
    return POINT_BUY_COST[score] || 0;
  }

  function pointBuyUsed() {
    var total = 0;
    ABILITY_ORDER.forEach(function (k) {
      total += pointBuyCost(draft.abilities[k]);
    });

    return total;
  }

  // Competenze di abilità della classe, PHB 2024 (Barbaro p.50, Paladino
  // p.108). Le altre classi useranno un fallback finché non saranno modellate.
  var CLASS_SKILLS = {
    barbaro: { count: 2, from: ['addestrare-animali', 'atletica', 'intimidire', 'natura', 'percezione', 'sopravvivenza'] },
    // Unica classe con "scegli 3 fra tutte le 18" (PHB p.58): nessuna lista
    // ristretta come le altre classi.
    bardo: { count: 3, from: ['acrobazia', 'addestrare-animali', 'arcano', 'atletica', 'furtivita', 'indagare', 'inganno', 'intimidire', 'intrattenere', 'intuizione', 'medicina', 'natura', 'percezione', 'persuasione', 'rapidita-di-mano', 'religione', 'sopravvivenza', 'storia'] },
    chierico: { count: 2, from: ['storia', 'intuizione', 'medicina', 'persuasione', 'religione'] },
    druido: { count: 2, from: ['arcano', 'addestrare-animali', 'intuizione', 'medicina', 'natura', 'percezione', 'religione', 'sopravvivenza'] },
    guerriero: { count: 2, from: ['acrobazia', 'addestrare-animali', 'atletica', 'storia', 'intuizione', 'intimidire', 'persuasione', 'percezione', 'sopravvivenza'] },
    ladro: { count: 4, from: ['acrobazia', 'atletica', 'inganno', 'intuizione', 'intimidire', 'indagare', 'percezione', 'persuasione', 'rapidita-di-mano', 'furtivita'] },
    monaco: { count: 2, from: ['acrobazia', 'atletica', 'storia', 'intuizione', 'religione', 'furtivita'] },
    paladino: { count: 2, from: ['atletica', 'intuizione', 'intimidire', 'medicina', 'persuasione', 'religione'] },
    ranger: { count: 3, from: ['addestrare-animali', 'atletica', 'intuizione', 'indagare', 'natura', 'percezione', 'furtivita', 'sopravvivenza'] }
  };

  // Competenze disponibili per una classe: usa CLASS_SKILLS se già
  // modellata; altrimenti fallback "scegli 2 fra tutte le 18 abilità" (id
  // presi da window.AppEngine.SKILLS) finché la classe non avrà una voce
  // dedicata.
  function classSkillsFor(classId) {
    if (CLASS_SKILLS[classId]) {
      return CLASS_SKILLS[classId];
    }
    var allIds = (window.AppEngine && window.AppEngine.SKILLS)
      ? window.AppEngine.SKILLS.map(function (s) { return s.id; })
      : [];

    return { count: 2, from: allIds };
  }

  /* ---------- background (5.B.4) ---------- */

  // Background Personalizzato: costruito al volo dalle scelte del draft, con
  // la STESSA forma di un background del manuale, così tutto il resto del
  // file (bgBonusMap, bgSkills, magicInitiateList, buildCharacter…) continua
  // a funzionare senza saperne nulla.
  function customBg() {
    var out = {
      name: 'Personalizzato',
      abilities: (draft.customAbilities || []).slice(),
      featId: draft.customFeatId,
      skills: (draft.customSkills || []).slice(),
      toolChoice: 'Strumento',
      equipment: { b: { coins: { mo: 50 } } }
    };
    if (draft.customFeatId === 'iniziato-alla-magia' && draft.customFeatList) {
      out.featList = draft.customFeatList;
      var listName = (window.MANUAL_55.classes[draft.customFeatList] || {}).name || '';
      out.featNote = listName ? ('lista del ' + listName) : '';
    }
    // draft.customKitBgId punta sempre a un id reale (mai a 'personalizzato'):
    // si legge diretto da window.MANUAL_55.backgrounds, mai da bgById, per non
    // rischiare ricorsione.
    if (draft.customKitBgId) {
      var source = (window.MANUAL_55.backgrounds || {})[draft.customKitBgId];
      if (source && source.equipment && source.equipment.a) {
        out.equipment.a = source.equipment.a;
      }
    }

    return out;
  }

  function bgById(id) {
    if (id === 'personalizzato') {
      return customBg();
    }

    return ((window.MANUAL_55.backgrounds || {})[id]) || null;
  }

  function currentBg() {
    return bgById(draft.backgroundId);
  }

  // Aumenti di caratteristica del background come mappa {FOR: 0, DES: 2, …}.
  // Il PHB: +2 a uno e +1 a un altro fra i tre elencati, oppure +1 a tutti e
  // tre. Senza background (o con la distribuzione incompleta) è tutto a zero.
  function bgBonusMap() {
    var out = { FOR: 0, DES: 0, COS: 0, INT: 0, SAG: 0, CAR: 0 };
    var bg = currentBg();
    if (!bg) {
      return out;
    }
    if (draft.bgBonusMode === '1-1-1') {
      bg.abilities.forEach(function (k) { out[k] = 1; });

      return out;
    }
    if (draft.bgPlus2) { out[draft.bgPlus2] = 2; }
    if (draft.bgPlus1) { out[draft.bgPlus1] = 1; }

    return out;
  }

  // Competenze in abilità che arrivano dal background: sono già acquisite, non
  // si scelgono, e il passo Competenze le toglie dalla lista della classe.
  function bgSkills() {
    var bg = currentBg();

    return bg ? bg.skills.slice() : [];
  }

  // Il background dà Iniziato alla Magia? In quel caso servono anche i suoi
  // incantesimi, presi dalla lista di classe indicata (`featList`).
  function magicInitiateList() {
    var bg = currentBg();

    return (bg && bg.featId === 'iniziato-alla-magia' && bg.featList) || null;
  }

  function bgValid() {
    var bg = currentBg();
    if (!bg) {
      return false;
    }
    if (draft.backgroundId === 'personalizzato') {
      if (draft.customAbilities.length !== 3) { return false; }
      if (!draft.customFeatId) { return false; }
      if (draft.customFeatId === 'iniziato-alla-magia' && !draft.customFeatList) { return false; }
      if (draft.customSkills.length !== 2) { return false; }
    }
    if (bg.toolChoice && !draft.bgTool.trim()) {
      return false;
    }
    if (magicInitiateList() && (draft.miCantrips.length !== 2 || draft.miSpells.length !== 1)) {
      return false;
    }
    if (draft.bgBonusMode === '1-1-1') {
      return true;
    }

    return !!draft.bgPlus2 && !!draft.bgPlus1 && draft.bgPlus2 !== draft.bgPlus1;
  }

  /* Equipaggiamento: in creazione si sceglie SOLO fra i due pacchetti del
     manuale (A o B), come si fa al tavolo aprendo il PHB; la personalizzazione
     — il master che ti fa partire con qualcosa in più — si fa dopo, nella
     scheda (decisione 5.B.5). I pacchetti stanno nei dati
     (`klass.startingEquipment`), qui non c'è più nessuna lista di armature né
     campi liberi per nome/dado/tipo dell'arma. */

  function packsFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};

    return klass.startingEquipment || null;
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

  // Draft dell'equipaggiamento: solo la lettera del pacchetto scelto. Le classi
  // senza pacchetto nei dati (non ancora giocabili) restano senza nulla.
  function defaultEquipFor(classId) {
    return { pack: packsFor(classId) ? 'a' : '' };
  }

  // Armi su cui la classe può scegliere la maestria: quelle in cui è competente
  // (klass.weaponProf: 'sem' semplici, 'gue' da guerra, 'gue-finesse' solo le
  // da guerra Accurate o Leggere — il Ladro non è competente con TUTTE le
  // armi da guerra, solo quelle). Senza il dato le consideriamo tutte, per
  // non bloccare le classi non ancora rifinite.
  function masteryChoicesFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};
    var prof = klass.weaponProf || ['sem', 'gue'];

    return (window.MANUAL_55.weapons || []).filter(function (w) {
      var cat = w.cat.split('-')[0];
      if (prof.indexOf(cat) !== -1) {
        return true;
      }
      if (cat === 'gue' && prof.indexOf('gue-finesse') !== -1) {
        return (w.props || []).indexOf('Accurata') !== -1 || (w.props || []).indexOf('Leggera') !== -1;
      }

      return false;
    });
  }

  // Quante maestrie sceglie questa classe al livello di creazione (0 = nessuna,
  // es. una classe senza Maestria nelle Armi).
  function masteryCountFor(classId) {
    var klass = (window.MANUAL_55.classes || {})[classId] || {};

    return (klass.weaponMastery || [])[CREATE_LEVEL] || 0;
  }

  // Livello di partenza fisso in creazione (decisione 5.B): 1. Gli indici
  // cantripsByLevel/preparedByLevel nel manuale sono per livello (0 inutilizzato).
  var CREATE_LEVEL = 1;

  // Incantesimi di una classe a un dato livello di incantesimo, dal catalogo
  // del manuale (window.MANUAL_55.spells, con tag `classes` e `level`),
  // ordinati per nome. Usato dal passo finale (b2.5) per i caster.
  function classSpellsAt(classId, spellLevel) {
    var all = (window.MANUAL_55 && window.MANUAL_55.spells) || [];

    return all.filter(function (s) {
      return s.classes && s.classes.indexOf(classId) !== -1 && s.level === spellLevel;
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name, 'it');
    });
  }

  /* ---------- helper DOM ---------- */

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

  /* ---------- validazione ---------- */

  function stepValid() {
    var step = STEPS[stepIndex];
    if (step.id === 'specie') {
      var requiredFields = SPECIES_REQUIRED_CHOICE[draft.speciesId] || [];
      var choicesOk = requiredFields.every(function (f) { return !!draft[f]; });

      return !!draft.speciesId && draft.name.trim().length > 0 && choicesOk;
    }
    if (step.id === 'classe') {
      return !!draft.classId;
    }
    if (step.id === 'background') {
      return bgValid();
    }
    if (step.id === 'punteggi') {
      return scoresValid();
    }
    if (step.id === 'competenze') {
      return draft.profSkills.length === classSkillsFor(draft.classId).count;
    }
    if (step.id === 'finale') {
      return finaleValid();
    }
    if (step.id === 'identita') {
      return !!draft.alignmentLaw && !!draft.alignmentMorality && (draft.languages || []).length === 2;
    }

    // Equipaggiamento: serve un pacchetto scelto e tutte le maestrie assegnate
    // (chi non ne ha ne deve scegliere 0, quindi passa comunque).
    return equipValid();
  }

  function equipValid() {
    ensureEquipDraft();
    var packOk = !packsFor(draft.classId) || !!draft.equip.pack;

    return packOk && draft.masteries.length === masteryCountFor(draft.classId);
  }

  // Validità del passo finale (b2.5): i non-caster non hanno nulla da
  // scegliere (sempre valido); i caster devono aver scelto il numero esatto
  // di cantrip e di incantesimi preparati previsti al livello 1 (stesso
  // vincolo "esattamente N" delle competenze). La sottoclasse non entra: a
  // livello 1 nessuna classe la sceglie. Il Math.min protegge il caso (oggi
  // teorico) in cui il catalogo avesse meno incantesimi del dovuto.
  // Voce di choicePoints.expertise per un dato livello: {level, count} — il
  // conteggio non è sempre 2 (il Ranger ne dà 1 sola al 2° livello con Esploratore
  // Provetto, 2 al 9° con Competenza), quindi ogni voce porta il proprio numero.
  function expertiseEntryFor(cp, level) {
    var found = null;
    ((cp && cp.expertise) || []).forEach(function (e) {
      if (e.level === level) {
        found = e;
      }
    });

    return found;
  }

  function finaleValid() {
    var klass = (window.MANUAL_55 && window.MANUAL_55.classes[draft.classId]) || {};
    var cp = klass.choicePoints || {};
    // Stile di Combattimento: solo le classi che lo danno già al livello 1
    // (Guerriero) lo scelgono qui; le altre lo scelgono al level-up.
    var styleOk = cp.fightingStyle !== CREATE_LEVEL || !!draft.fightingStyleId;
    // Competenza (Ladro, Ranger): stesso discorso, solo se la classe la dà al 1°.
    var expertiseEntry = expertiseEntryFor(cp, CREATE_LEVEL);
    var expertiseOk = !expertiseEntry || (draft.expertiseSkills || []).length === expertiseEntry.count;
    if (!klass.casterType || klass.casterType === 'none') {
      return styleOk && expertiseOk;
    }
    var needCantrips = Math.min(
      (klass.cantripsByLevel && klass.cantripsByLevel[CREATE_LEVEL]) || 0,
      classSpellsAt(draft.classId, 0).length
    );
    var needPrepared = Math.min(
      (klass.preparedByLevel && klass.preparedByLevel[CREATE_LEVEL]) || 0,
      classSpellsAt(draft.classId, 1).length
    );

    return styleOk && expertiseOk && (draft.cantrips || []).length === needCantrips &&
           (draft.preparedSpells || []).length === needPrepared;
  }

  // Validità del passo Punteggi: dipende dal metodo in draft.scoreMethod.
  function scoresValid() {
    if (draft.scoreMethod === 'array') {
      // Valido solo quando tutti e 6 i valori dell'array sono assegnati.
      return ABILITY_ORDER.every(function (k) {
        return !!draft.abilities[k];
      });
    }
    if (draft.scoreMethod === 'pointbuy') {
      var inRange = ABILITY_ORDER.every(function (k) {
        var v = draft.abilities[k];
        return v >= 8 && v <= 15;
      });

      /* I 27 punti vanno spesi TUTTI: prima bastava non sforare, così si
         arrivava in fondo con tutti 8 e un personaggio storpio senza un solo
         avviso (5.B.4). Lasciarne indietro non avvantaggia nessuno. */
      return inRange && pointBuyUsed() === POINT_BUY_BUDGET;
    }

    return true; // manuale: ha sempre un valore, nessun budget da rispettare
  }

  /* ---------- passi: Specie e Classe (b2.1) ---------- */

  /* Riga arricchita per gli step a scelta singola del wizard (restyling
     2026-07-29): blasone SVG (stesso stile a tratto di js/items.js: viewBox
     24x24, stroke corrente) + un tratto distintivo vero come teaser, non
     solo un dato secco. buildPickRow() è generico (usato da Specie con
     alternativa B e poi da Classe con l'alternativa A, "coerente con la
     Specie"); ogni step ha solo la propria mappa di icone/teaser e un thin
     wrapper. Sostituiva il vecchio buildTile()/.create-tile (rimossi: nessun
     altro step li usava più dopo questo restyling). */
  var PICK_ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var PICK_CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 L10 18 L20 6"/></svg>';

  // Riga selezionabile: blasone + nome/meta (o chip) + tratto teaser + spunta
  // a destra quando selezionata. opts: { icon, name, meta, chips, teaser, isSelected }
  // — meta è un testo singolo (Specie: taglia/velocità), chips un array di
  // stringhe corte (Classe: Dado Vita, tipo di incantatore); usare l'uno o
  // l'altro, non entrambi.
  function buildPickRow(opts) {
    var row = el('button', 'pick-row' + (opts.isSelected ? ' on' : ''));

    var badge = el('span', 'pick-badge');
    badge.innerHTML = '<svg class="pick-icon" ' + PICK_ICON_ATTRS + '>' + opts.icon + '</svg>';
    row.appendChild(badge);

    var body = el('div', 'pick-body');
    var top = el('div', 'pick-top');
    top.appendChild(el('span', 'pick-name', opts.name));
    if (opts.chips) {
      var chipsWrap = el('span', 'pick-chips');
      opts.chips.forEach(function (c) {
        chipsWrap.appendChild(el('span', 'pick-chip', c));
      });
      top.appendChild(chipsWrap);
    } else if (opts.meta) {
      top.appendChild(el('span', 'pick-meta', opts.meta));
    }
    body.appendChild(top);

    if (opts.teaser) {
      var traitLine = el('div', 'pick-trait');
      traitLine.innerHTML = '<b>' + opts.teaser.trait + '</b> — ' + opts.teaser.desc;
      body.appendChild(traitLine);
    }
    row.appendChild(body);

    var check = el('span', 'pick-check');
    check.innerHTML = PICK_CHECK_SVG;
    row.appendChild(check);

    return row;
  }

  var SPECIES_ICONS = {
    aasimar: '<ellipse cx="12" cy="7" rx="6" ry="2.6"/><path d="M8 16 L10 10 M16 16 L14 10 M12 17 L12 10"/>',
    dragonide: '<path d="M3 13 L11 9 L16 6 L21 8 L16 10 L18 13 L13 13 L11 17 L8 13 Z"/>' +
      '<circle cx="14" cy="9" r="0.6" fill="currentColor"/>',
    elfo: '<path d="M12 3 C 19 6, 19 15, 12 21 C 5 15, 5 6, 12 3 Z"/><path d="M12 4 L12 20"/>',
    gnomo: '<circle cx="12" cy="12" r="3.4"/><path d="M12 4 L12 7 M12 17 L12 20 M4 12 L7 12 M17 12 L20 12 ' +
      'M6.3 6.3 L8.4 8.4 M15.6 15.6 L17.7 17.7 M6.3 17.7 L8.4 15.6 M15.6 8.4 L17.7 6.3"/>',
    goliath: '<path d="M3 18 L9 7 L13 13 L16 9 L21 18 Z"/>' +
      '<path d="M9 7 L11 10.5 L7 10.5 Z" fill="currentColor" stroke="none"/>',
    halfling: '<circle cx="9" cy="9" r="3.2"/><circle cx="15" cy="9" r="3.2"/>' +
      '<circle cx="9" cy="15" r="3.2"/><circle cx="15" cy="15" r="3.2"/><path d="M12 12 L12 20"/>',
    nano: '<path d="M5 5 L11 11 M9 3 L15 9 L12 12 L6 6 Z"/><path d="M11 11 L4 18 L6 20 L13 13"/>',
    orco: '<path d="M6 5 C 4 10, 5 15, 9 18"/><path d="M18 5 C 20 10, 19 15, 15 18"/>',
    tiefling: '<path d="M9 18 C 6 14, 7 7, 4 4"/><path d="M15 18 C 18 14, 17 7, 20 4"/>',
    umano: '<path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z"/>'
  };
  // Tratto distintivo per riga (nome del tratto + una riga di sapore), preso
  // dal primo tratto meccanicamente saliente di ogni specie in manual-55.js
  // (scurovisione esclusa: comune a troppe specie per distinguerle).
  var SPECIES_TEASER = {
    aasimar: { trait: 'Resistenza Celestiale', desc: 'resisti ai danni necrotici e radiosi' },
    dragonide: { trait: 'Soffio', desc: 'cono o linea di danno del drago progenitore' },
    elfo: { trait: 'Trance', desc: 'mediti invece di dormire, bastano 4 ore' },
    gnomo: { trait: 'Astuzia Gnomesca', desc: 'vantaggio ai TS mentali' },
    goliath: { trait: 'Ascendenza dei Giganti', desc: 'un dono ancestrale a scelta' },
    halfling: { trait: 'Fortuna', desc: 'puoi ritirare un 1 naturale' },
    nano: { trait: 'Robustezza Nanica', desc: '+1 PF massimi a ogni livello' },
    orco: { trait: 'Tenacia Implacabile', desc: 'resti a 1 PF invece di cadere' },
    tiefling: { trait: 'Retaggio Infernale', desc: 'resistenza e un trucchetto a scelta' },
    umano: { trait: 'Versatile', desc: 'un talento di Origine a scelta' }
  };

  // Riga specie: blasone + nome/taglia-velocità + tratto teaser + spunta a
  // destra quando selezionata (thin wrapper su buildPickRow).
  function buildSpeciesRow(sp, id, isSelected) {
    var meta = sp.size || '';
    if (sp.speedM) {
      meta += (meta ? ' · ' : '') + sp.speedM.toLocaleString('it-IT') + ' m';
    }

    return buildPickRow({
      icon: SPECIES_ICONS[id] || '',
      name: sp.name,
      meta: meta,
      teaser: SPECIES_TEASER[id],
      isSelected: isSelected
    });
  }

  /* Icone e tratto distintivo per lo step Classe (restyling 2026-07-29,
     alternativa A: stessa grammatica visiva della Specie). Il tratto è la
     meccanica che identifica ogni classe (risorsa di classe se i dati ce
     l'hanno già — Furia, Ispirazione Bardica… — altrimenti il privilegio
     noto del PHB anche per le 3 classi non ancora modellate 1→20, Stregone/
     Mago/Warlock: sono comunque scelte valide nel wizard oggi). */
  var CLASS_ICONS = {
    barbaro: '<path d="M12 3 L12 21"/><path d="M12 6 C 6 4, 4 8, 6 11 C 9 10, 11 8, 12 6 Z"/>',
    bardo: '<circle cx="7" cy="17" r="2.4"/><path d="M9.4 17 L9.4 5 L16 7 L16 12"/>',
    chierico: '<circle cx="12" cy="12" r="3.6"/><path d="M12 4 L12 6.2 M12 17.8 L12 20 M4 12 L6.2 12 ' +
      'M17.8 12 L20 12 M6.5 6.5 L8 8 M16 16 L17.5 17.5 M6.5 17.5 L8 16 M16 8 L17.5 6.5"/>',
    druido: '<ellipse cx="12" cy="16" rx="4.2" ry="3.4"/><ellipse cx="7" cy="9.5" rx="1.6" ry="2.1"/>' +
      '<ellipse cx="11.2" cy="7.3" rx="1.6" ry="2.1"/><ellipse cx="16" cy="9.5" rx="1.6" ry="2.1"/>',
    guerriero: '<path d="M4 20 L11 13 M4 13 L11 20"/><path d="M13 11 L20 4 M13 4 L20 11"/><circle cx="12" cy="12" r="1"/>',
    ladro: '<path d="M12 3 L12 15"/><path d="M8 7 L16 7"/><path d="M12 15 L9 20 L12 18 L15 20 Z"/>',
    mago: '<path d="M4 5a2 2 0 0 1 2 -2h6v18H6a2 2 0 0 1 -2 -2z"/>' +
      '<path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6"/>',
    monaco: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.8"/>',
    paladino: '<path d="M12 3 C 15 5, 17 5, 19 4 C 19 12, 17 17, 12 20 C 7 17, 5 12, 5 4 C 7 5, 9 5, 12 3 Z"/>' +
      '<path d="M9.5 6.5 L12 4.5 L14.5 6.5"/>',
    ranger: '<path d="M7 3 C 4 8, 4 16, 7 21"/><path d="M7 12 L19 12"/><path d="M15.5 8.5 L19 12 L15.5 15.5"/>',
    stregone: '<circle cx="12" cy="15" r="1.6"/><path d="M12 13 C 10 9, 13 6, 11 3"/>' +
      '<path d="M12 13 C 14.5 10.5, 13.5 7.5, 16 5.5"/>',
    warlock: '<circle cx="8" cy="8" r="3.4"/><path d="M10.4 10.4 L20 20 M17 17 L19.5 14.5 M14.2 14.2 L16.5 11.9"/>'
  };
  var CLASS_TEASER = {
    barbaro: { trait: 'Furia', desc: 'resistenza ai danni fisici, bonus quando colpisci' },
    bardo: { trait: 'Ispirazione Bardica', desc: 'un dado da regalare per migliorare un tiro alleato' },
    chierico: { trait: 'Incanalare Divinità', desc: 'energia divina per effetti speciali' },
    druido: { trait: 'Forma Selvatica', desc: 'ti trasformi in una bestia' },
    guerriero: { trait: 'Attacchi Extra', desc: 'colpisce più volte di chiunque altro' },
    ladro: { trait: 'Attacco Furtivo', desc: 'danni extra quando colpisci di sorpresa' },
    mago: { trait: 'Libro degli Incantesimi', desc: 'il repertorio più vasto, un incantesimo per ogni occasione' },
    monaco: { trait: 'Punti Focus', desc: 'arti marziali, colpisci più volte senz\'armi' },
    paladino: { trait: 'Imposizione delle Mani', desc: 'guerriero sacro, cura con le mani e Punizione Divina' },
    ranger: { trait: 'Marchio del Cacciatore', desc: 'esploratore e cacciatore, metà incantatore' },
    stregone: { trait: 'Punti Stregoneria', desc: 'magia nel sangue, plasmata con la Metamagia' },
    warlock: { trait: 'Patto', desc: 'magia da un patto con un\'entità, pochi slot ma potenti' }
  };
  // Abbreviazione del tipo di incantatore per il chip (nessuna per 'none':
  // niente da mostrare per le classi senza magia, come oggi il Barbaro).
  var CASTER_CHIP = { full: 'Pieno', half: 'Mezzo', pact: 'Patto' };

  // Riga classe: blasone + nome/Dado Vita/tipo incantatore + tratto teaser +
  // spunta a destra quando selezionata (thin wrapper su buildPickRow).
  function buildClassRow(kl, id, isSelected) {
    var chips = [kl.hitDie];
    if (CASTER_CHIP[kl.casterType]) {
      chips.push(CASTER_CHIP[kl.casterType]);
    }

    return buildPickRow({
      icon: CLASS_ICONS[id] || '',
      name: kl.name,
      chips: chips,
      teaser: CLASS_TEASER[id],
      isSelected: isSelected
    });
  }

  function renderSpecie(container) {
    // Campo nome personaggio.
    var label = el('label', 'create-label', 'Nome del personaggio');
    label.setAttribute('for', 'create-name-input');
    container.appendChild(label);

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'create-name-input';
    input.className = 'create-in';
    input.value = draft.name;
    input.addEventListener('input', function () {
      draft.name = input.value;
      updateNav();
    });
    container.appendChild(input);

    // Lista arricchita: una riga per specie del manuale (window.MANUAL_55.species).
    var list = el('div', 'pick-list');
    container.appendChild(list);

    var choiceBox = el('div');
    container.appendChild(choiceBox);

    // Campi del draft da azzerare quando si cambia specie (nessuna scelta
    // di una specie precedente resta valida per quella nuova).
    var SPECIES_CHOICE_FIELDS = ['dragonAncestryId', 'elfLineageId', 'elfSkillId',
      'goliathGiftId', 'tieflingLegacyId', 'gnomeLineageId'];

    Object.keys(window.MANUAL_55.species).forEach(function (id) {
      var sp = window.MANUAL_55.species[id];
      var row = buildSpeciesRow(sp, id, id === draft.speciesId);

      row.addEventListener('click', function () {
        if (draft.speciesId !== id) {
          SPECIES_CHOICE_FIELDS.forEach(function (f) { draft[f] = null; });
        }
        draft.speciesId = id;
        list.querySelectorAll('.pick-row').forEach(function (t) {
          t.classList.toggle('on', t === row);
        });
        renderSpeciesChoice();
        updateNav();
      });

      list.appendChild(row);
    });

    // Select generico "scegli tra le chiavi di una tabella del manuale":
    // usato per ascendenza draconica, retaggio elfico/gnomesco, dono del
    // Goliath e retaggio infernale — stessa UI (menu a tendina), stesso
    // comportamento (nessuna preselezione, valore in draft[field]).
    function appendChoiceSelect(labelText, table, getOptionLabel, field) {
      choiceBox.appendChild(el('div', 'create-label', labelText));
      var select = document.createElement('select');
      select.className = 'edit-select';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— scegli —';
      select.appendChild(placeholder);
      Object.keys(table).forEach(function (id) {
        var opt = document.createElement('option');
        opt.value = id;
        opt.textContent = getOptionLabel(table[id]);
        if (draft[field] === id) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      select.addEventListener('change', function () {
        draft[field] = select.value || null;
        updateNav();
      });
      choiceBox.appendChild(select);
    }

    // Scelte legate alla specie (5.B.6): ognuna determina un tipo di danno,
    // una velocità o una risorsa che poi si riflette davvero in scheda
    // (js/engine.js, js/stats.js) e nelle descrizioni dei tratti
    // (js/traits.js), non solo testo informativo.
    function renderSpeciesChoice() {
      choiceBox.textContent = '';
      var manual = window.MANUAL_55;

      if (draft.speciesId === 'dragonide') {
        appendChoiceSelect('Ascendenza draconica', manual.dragonAncestors || {},
          function (a) { return a.name + ' — ' + a.dmg; }, 'dragonAncestryId');
      } else if (draft.speciesId === 'elfo') {
        appendChoiceSelect('Retaggio Elfico', manual.elfLineages || {},
          function (l) { return l.name; }, 'elfLineageId');
        appendChoiceSelect('Sensi Acuti — competenza', {
          intuizione: { label: 'Intuizione' }, percezione: { label: 'Percezione' },
          sopravvivenza: { label: 'Sopravvivenza' }
        }, function (s) { return s.label; }, 'elfSkillId');
      } else if (draft.speciesId === 'goliath') {
        appendChoiceSelect('Dono dell\'Ascendenza dei Giganti', manual.goliathGifts || {},
          function (g) { return g.name; }, 'goliathGiftId');
      } else if (draft.speciesId === 'tiefling') {
        appendChoiceSelect('Retaggio Infernale', manual.tieflingLegacies || {},
          function (l) { return l.name + ' — resistenza ' + l.resist; }, 'tieflingLegacyId');
      } else if (draft.speciesId === 'gnomo') {
        appendChoiceSelect('Retaggio Gnomesco', manual.gnomeLineages || {},
          function (l) { return l.name; }, 'gnomeLineageId');
      }
    }

    renderSpeciesChoice();
  }

  // Le specie con una scelta obbligatoria allo step Specie (5.B.6): id del
  // campo draft richiesto, o due campi per l'Elfo (retaggio + Sensi Acuti).
  var SPECIES_REQUIRED_CHOICE = {
    dragonide: ['dragonAncestryId'],
    elfo: ['elfLineageId', 'elfSkillId'],
    goliath: ['goliathGiftId'],
    tiefling: ['tieflingLegacyId'],
    gnomo: ['gnomeLineageId']
  };

  function renderClasse(container) {
    // Lista arricchita (restyling 2026-07-29, alternativa A: stessa
    // grammatica visiva della Specie): una riga per classe del manuale
    // (window.MANUAL_55.classes). Non filtrare: oggi solo 8 delle 12 hanno
    // dati 1→20 completi (Stregone/Mago/Warlock ancora da fare nel Blocco
    // 5.C), ma vanno mostrate comunque tutte — nessun segnale "in arrivo"
    // in questa alternativa (era l'opzione B, scartata).
    var list = el('div', 'pick-list');
    container.appendChild(list);

    Object.keys(window.MANUAL_55.classes).forEach(function (id) {
      var kl = window.MANUAL_55.classes[id];
      var row = buildClassRow(kl, id, id === draft.classId);

      row.addEventListener('click', function () {
        draft.classId = id;
        list.querySelectorAll('.pick-row').forEach(function (t) {
          t.classList.toggle('on', t === row);
        });
        updateNav();
      });

      list.appendChild(row);
    });
  }

  /* ---------- passo: Punteggi (b2.2) ---------- */

  // Reimposta draft.abilities in modo coerente quando cambia il metodo di
  // generazione, così i valori restano sempre nel dominio del metodo attivo:
  // - pointbuy: riparte sempre da tutti 8 (base del point-buy, 0 punti spesi);
  // - array: tutti "non assegnati" (null) finché il giocatore non sceglie;
  // - manuale: mantiene i valori correnti se già numeri validi (3-20),
  //   altrimenti (es. arrivando da "array" con caselle ancora vuote) parte
  //   da 10.
  function resetAbilitiesForMethod(method) {
    if (method === 'pointbuy') {
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = 8; });
    } else if (method === 'array') {
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = null; });
    } else {
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        if (typeof v !== 'number' || v < 3 || v > 20) {
          draft.abilities[k] = 10;
        }
      });
    }
  }

  // Testo del modificatore per un punteggio, da mostrare come aiuto accanto
  // al valore. Usa window.AppEngine se disponibile (coerente col resto
  // dell'app), altrimenti calcola inline la stessa formula del PHB.
  function abilityModText(score) {
    if (score == null) {
      return ''; // caratteristica non ancora assegnata (Array standard)
    }
    var mod = (window.AppEngine && window.AppEngine.abilityMod)
      ? window.AppEngine.abilityMod(score)
      : Math.floor((score - 10) / 2);

    return (window.AppEngine && window.AppEngine.formatMod)
      ? window.AppEngine.formatMod(mod)
      : (mod >= 0 ? '+' : '−') + Math.abs(mod);
  }

  // Sezione Point-buy: stepper −/+ per caratteristica (8-15), contatore
  // punti live e pulsante "Consigliati per la classe".
  function buildPointBuySection() {
    var wrap = el('div');
    var counterEl = el('div', 'create-points-counter');
    wrap.appendChild(counterEl);

    var list = el('div', 'edit-stat-list');
    var scoreEls = {}, modEls = {}, plusBtns = {}, minusBtns = {};

    function refresh() {
      var used = pointBuyUsed();
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        scoreEls[k].textContent = String(v);
        modEls[k].textContent = abilityModText(v);

        var costUp = pointBuyCost(v + 1) - pointBuyCost(v);
        var disablePlus = v >= 15 || (used + costUp) > POINT_BUY_BUDGET;
        plusBtns[k].disabled = disablePlus;
        plusBtns[k].classList.toggle('is-disabled', disablePlus);

        var disableMinus = v <= 8;
        minusBtns[k].disabled = disableMinus;
        minusBtns[k].classList.toggle('is-disabled', disableMinus);
      });
      counterEl.textContent = 'Punti: ' + used + ' / ' + POINT_BUY_BUDGET;
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var stepper = el('div', 'edit-stepper');
      var minus = el('button', 'stepper-btn minus', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[k]);
      var vals = el('div', 'edit-stat-vals');
      var scoreEl = el('span', 'edit-stat-score', String(draft.abilities[k]));
      var modEl = el('span', 'edit-stat-mod', abilityModText(draft.abilities[k]));
      vals.appendChild(scoreEl);
      vals.appendChild(modEl);
      var plus = el('button', 'stepper-btn plus', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[k]);

      minus.addEventListener('click', function () {
        if (draft.abilities[k] > 8) {
          draft.abilities[k]--;
          refresh();
        }
      });
      plus.addEventListener('click', function () {
        var used = pointBuyUsed();
        var costUp = pointBuyCost(draft.abilities[k] + 1) - pointBuyCost(draft.abilities[k]);
        if (draft.abilities[k] < 15 && (used + costUp) <= POINT_BUY_BUDGET) {
          draft.abilities[k]++;
          refresh();
        }
      });

      stepper.appendChild(minus);
      stepper.appendChild(vals);
      stepper.appendChild(plus);
      row.appendChild(stepper);
      list.appendChild(row);

      scoreEls[k] = scoreEl;
      modEls[k] = modEl;
      plusBtns[k] = plus;
      minusBtns[k] = minus;
    });
    wrap.appendChild(list);

    var recBtn = el('button', 'create-suggest-btn', 'Consigliati per la classe');
    recBtn.type = 'button';
    recBtn.addEventListener('click', function () {
      var rec = RECOMMENDED_ARRAYS[draft.classId];
      if (!rec) {
        return; // difensivo: il passo Classe garantisce già un classId valido
      }
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = rec[k]; });
      refresh();
    });
    wrap.appendChild(recBtn);

    refresh();

    return wrap;
  }

  // Sezione Array standard: un <select> per caratteristica con i valori
  // [15,14,13,12,10,8]; ogni valore è utilizzabile una sola volta, quindi le
  // opzioni si ricalcolano su tutte le select a ogni scelta.
  function buildArraySection() {
    var wrap = el('div');
    var list = el('div', 'edit-stat-list');
    var selects = {}, modEls = {};

    function usedValues() {
      var used = [];
      ABILITY_ORDER.forEach(function (k) {
        if (draft.abilities[k] != null) {
          used.push(draft.abilities[k]);
        }
      });

      return used;
    }

    function rebuildOptions() {
      var used = usedValues();
      ABILITY_ORDER.forEach(function (k) {
        var select = selects[k];
        var current = draft.abilities[k];
        select.textContent = ''; // svuota (nessun dato: solo reset opzioni)

        var emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '—';
        select.appendChild(emptyOpt);

        STANDARD_ARRAY.forEach(function (val) {
          // Un valore già scelto per un'ALTRA caratteristica sparisce dalle
          // altre select; resta disponibile nella propria (altrimenti la
          // selezione corrente sparirebbe dalla sua stessa lista).
          if (used.indexOf(val) !== -1 && val !== current) {
            return;
          }
          var opt = document.createElement('option');
          opt.value = String(val);
          opt.textContent = String(val);
          select.appendChild(opt);
        });

        select.value = current != null ? String(current) : '';
        modEls[k].textContent = abilityModText(current);
      });
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var vals = el('div', 'create-array-vals');
      var select = document.createElement('select');
      select.className = 'edit-select';
      select.setAttribute('aria-label', ABILITY_LABELS[k]);
      select.addEventListener('change', function () {
        draft.abilities[k] = select.value ? parseInt(select.value, 10) : null;
        rebuildOptions();
      });
      var modEl = el('span', 'edit-stat-mod', '');

      vals.appendChild(select);
      vals.appendChild(modEl);
      row.appendChild(vals);
      list.appendChild(row);

      selects[k] = select;
      modEls[k] = modEl;
    });
    wrap.appendChild(list);

    var recBtn = el('button', 'create-suggest-btn', 'Consigliati per la classe');
    recBtn.type = 'button';
    recBtn.addEventListener('click', function () {
      var rec = RECOMMENDED_ARRAYS[draft.classId];
      if (!rec) {
        return;
      }
      ABILITY_ORDER.forEach(function (k) { draft.abilities[k] = rec[k]; });
      rebuildOptions();
    });
    wrap.appendChild(recBtn);

    rebuildOptions();

    return wrap;
  }

  // Sezione Manuale: stepper −/+ liberi, range 3-20, nessun budget.
  function buildManualSection() {
    var wrap = el('div');
    var list = el('div', 'edit-stat-list');
    var scoreEls = {}, modEls = {}, plusBtns = {}, minusBtns = {};

    function refresh() {
      ABILITY_ORDER.forEach(function (k) {
        var v = draft.abilities[k];
        scoreEls[k].textContent = String(v);
        modEls[k].textContent = abilityModText(v);

        var disableMinus = v <= 3;
        minusBtns[k].disabled = disableMinus;
        minusBtns[k].classList.toggle('is-disabled', disableMinus);

        var disablePlus = v >= 20;
        plusBtns[k].disabled = disablePlus;
        plusBtns[k].classList.toggle('is-disabled', disablePlus);
      });
      updateNav();
    }

    ABILITY_ORDER.forEach(function (k) {
      var row = el('div', 'edit-stat-row');
      row.appendChild(el('span', 'edit-stat-label', ABILITY_LABELS[k]));

      var stepper = el('div', 'edit-stepper');
      var minus = el('button', 'stepper-btn minus', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuisci ' + ABILITY_LABELS[k]);
      var vals = el('div', 'edit-stat-vals');
      var scoreEl = el('span', 'edit-stat-score', String(draft.abilities[k]));
      var modEl = el('span', 'edit-stat-mod', abilityModText(draft.abilities[k]));
      vals.appendChild(scoreEl);
      vals.appendChild(modEl);
      var plus = el('button', 'stepper-btn plus', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumenta ' + ABILITY_LABELS[k]);

      minus.addEventListener('click', function () {
        if (draft.abilities[k] > 3) {
          draft.abilities[k]--;
          refresh();
        }
      });
      plus.addEventListener('click', function () {
        if (draft.abilities[k] < 20) {
          draft.abilities[k]++;
          refresh();
        }
      });

      stepper.appendChild(minus);
      stepper.appendChild(vals);
      stepper.appendChild(plus);
      row.appendChild(stepper);
      list.appendChild(row);

      scoreEls[k] = scoreEl;
      modEls[k] = modEl;
      plusBtns[k] = plus;
      minusBtns[k] = minus;
    });
    wrap.appendChild(list);

    refresh();

    return wrap;
  }

  // Azzera tutte le scelte legate al background precedente, sia quelle dei 16
  // background fissi (bonus caratteristica, strumento, Iniziato alla Magia)
  // sia quelle esclusive del Personalizzato: cambiare background — incluso
  // andare verso o venire da "Personalizzato" — riparte sempre pulito.
  function resetBgChoices() {
    draft.bgPlus2 = null;
    draft.bgPlus1 = null;
    draft.bgTool = '';
    draft.miCantrips = [];
    draft.miSpells = [];
    draft.customAbilities = [];
    draft.customFeatId = null;
    draft.customFeatList = null;
    draft.customSkills = [];
    draft.customKitBgId = null;
  }

  function renderBackground(container) {
    var manual = window.MANUAL_55;
    var all = manual.backgrounds || {};

    container.appendChild(el('div', 'create-saves-line',
      'Da dove vieni: dà due competenze, uno strumento, un talento d\'origine e gli aumenti di caratteristica.'));

    // Lista arricchita (restyling 2026-07-29, alternativa B tra 3 con
    // preview): ogni riga mostra già competenze e talento in anteprima senza
    // dover toccare nulla; il tocco apre solo il dettaglio della riga scelta
    // (bg-row-body, sotto), non un lungo scroll comune a tutte. Niente icone
    // nuove: a differenza di Specie/Classe un background dà 4 cose diverse
    // (competenze, strumento, talento, aumenti), non un tratto singolo che
    // un blasone possa rappresentare da solo.
    var list = el('div', 'bg-list');
    container.appendChild(list);
    // Contenitore del dettaglio: uno solo, appeso di volta in volta dentro la
    // riga selezionata (sempre e solo una, come per Specie/Classe) — build
    // completo su renderBackground(), tutta la logica sotto resta invariata.
    var detail = el('div', 'bg-row-body');

    // Blocco aumenti di caratteristica (+2 e +1, oppure +1 a tutte e tre):
    // condiviso fra il pannello piatto dei 16 background reali e la sezione 1
    // dell'accordion del Personalizzato — cambia solo `bg.abilities`, da cui
    // pesca le caratteristiche disponibili.
    function renderAbilityBonusBlock(box, bg) {
      box.appendChild(el('div', 'edit-section-label', 'Aumenti di caratteristica'));
      var modeRow = el('div', 'chip-row');
      [{ id: '2-1', label: '+2 e +1' }, { id: '1-1-1', label: '+1 a tutte e tre' }].forEach(function (m) {
        var chip = el('button', 'chip' + (draft.bgBonusMode === m.id ? ' on' : ''), m.label);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          draft.bgBonusMode = m.id;
          renderDetail();
          updateNav();
        });
        modeRow.appendChild(chip);
      });
      box.appendChild(modeRow);

      if (draft.bgBonusMode === '2-1') {
        [{ key: 'bgPlus2', label: 'Chi prende +2' }, { key: 'bgPlus1', label: 'Chi prende +1' }].forEach(function (slot) {
          box.appendChild(el('div', 'create-label', slot.label));
          var row = el('div', 'chip-row');
          bg.abilities.forEach(function (k) {
            var chip = el('button', 'chip' + (draft[slot.key] === k ? ' on' : ''), ABILITY_LABELS[k]);
            chip.type = 'button';
            chip.addEventListener('click', function () {
              // Un punteggio non può prendere sia il +2 sia il +1: scegliendolo
              // qui, si libera dall'altro slot.
              var other = slot.key === 'bgPlus2' ? 'bgPlus1' : 'bgPlus2';
              if (draft[other] === k) {
                draft[other] = null;
              }
              draft[slot.key] = draft[slot.key] === k ? null : k;
              renderDetail();
              updateNav();
            });
            row.appendChild(chip);
          });
          box.appendChild(row);
        });
      } else {
        box.appendChild(el('div', 'create-saves-line',
          '+1 a ' + bg.abilities.map(function (k) { return ABILITY_LABELS[k]; }).join(', ') + '.'));
      }
    }

    // Riga di header di una sezione dell'accordion: titolo (con ✓ se la
    // sezione è già completa) + freccia, contenuto nel body. Stesso markup di
    // js/diary.js (accordion-item/-header/-chevron/-body). `sectionId` è la
    // chiave con cui si confronta customOpenSectionId — apre questa sezione
    // se combacia, e il click sull'header aggiorna quella variabile invece di
    // limitarsi a un toggle locale: così sopravvive al redraw completo che
    // segue quasi ogni scelta nell'accordion.
    function addAccordionSection(accordion, sectionId, title, doneFn, buildFn) {
      var isOpen = customOpenSectionId === sectionId;
      var item = el('div', 'accordion-item' + (isOpen ? ' open' : ''));
      var header = el('div', 'accordion-header');
      var h3 = document.createElement('h3');
      h3.textContent = (doneFn() ? '✓ ' : '') + title;
      header.appendChild(h3);
      header.appendChild(el('span', 'accordion-chevron', '▼'));
      header.addEventListener('click', function () {
        item.classList.toggle('open');
        customOpenSectionId = item.classList.contains('open') ? sectionId : null;
      });
      var body = el('div', 'accordion-body');
      buildFn(body);

      item.appendChild(header);
      item.appendChild(body);
      accordion.appendChild(item);
    }

    /* Background Personalizzato (house rule del tavolo, non è nel PHB): stessi
       tasselli meccanici dei 16 background ufficiali — 3 caratteristiche, un
       talento d'origine, 2 competenze, uno strumento, un pacchetto o 50 mo —
       ma tutti a scelta libera. UI ad accordion invece del pannello piatto:
       troppe scelte indipendenti per stare tutte in fila. */
    function renderCustomBackground(box, manual) {
      // Stessa pulizia del pannello piatto (sotto, in renderDetail): se il
      // talento scelto non è più Iniziato alla Magia, i trucchetti/incantesimo
      // presi in precedenza non devono restare orfani nel grimorio.
      if (draft.customFeatId !== 'iniziato-alla-magia') {
        draft.miCantrips = [];
        draft.miSpells = [];
      }

      var accordion = el('div', 'accordion');
      box.appendChild(accordion);

      // 1. Caratteristiche: scegline 3 fra le 6, poi distribuisci gli aumenti.
      addAccordionSection(accordion, 'caratteristiche', 'Caratteristiche', function () {
        if (draft.customAbilities.length !== 3) {
          return false;
        }
        if (draft.bgBonusMode === '1-1-1') {
          return true;
        }

        return !!draft.bgPlus2 && !!draft.bgPlus1 && draft.bgPlus2 !== draft.bgPlus1;
      }, function (body) {
        buildSpellPicker(body, 'Scegline 3', ABILITY_ORDER.map(function (k) {
          return { id: k, name: ABILITY_LABELS[k] };
        }), 3, 'customAbilities', renderDetail);
        if (draft.customAbilities.length === 3) {
          renderAbilityBonusBlock(body, { abilities: draft.customAbilities });
        }
      });

      // 2. Talento d'origine: selezione singola fra tutti e 10 del manuale.
      addAccordionSection(accordion, 'talento', 'Talento d\'origine', function () {
        if (!draft.customFeatId) {
          return false;
        }
        if (draft.customFeatId !== 'iniziato-alla-magia') {
          return true;
        }

        return !!draft.customFeatList && draft.miCantrips.length === 2 && draft.miSpells.length === 1;
      }, function (body) {
        var feats = manual.originFeats || {};
        var row = el('div', 'chip-row');
        Object.keys(feats).forEach(function (id) {
          var chip = el('button', 'chip' + (draft.customFeatId === id ? ' on' : ''), feats[id].name);
          chip.type = 'button';
          chip.addEventListener('click', function () {
            if (draft.customFeatId !== id) {
              draft.customFeatList = null;
            }
            draft.customFeatId = id;
            renderDetail();
            updateNav();
          });
          row.appendChild(chip);
        });
        body.appendChild(row);

        var chosen = feats[draft.customFeatId];
        if (chosen && chosen.desc) {
          body.appendChild(el('div', 'create-saves-line', chosen.desc));
        }

        if (draft.customFeatId === 'iniziato-alla-magia') {
          var listRow = el('div', 'chip-row');
          ['chierico', 'druido', 'mago'].forEach(function (cid) {
            var nome = (manual.classes[cid] || {}).name || cid;
            var chip = el('button', 'chip' + (draft.customFeatList === cid ? ' on' : ''), nome);
            chip.type = 'button';
            chip.addEventListener('click', function () {
              draft.customFeatList = cid;
              renderDetail();
              updateNav();
            });
            listRow.appendChild(chip);
          });
          body.appendChild(el('div', 'create-label', 'Lista incantesimi'));
          body.appendChild(listRow);

          if (draft.customFeatList) {
            var nomeLista = (manual.classes[draft.customFeatList] || {}).name || draft.customFeatList;
            buildSpellPicker(body, 'Trucchetti del ' + nomeLista + ' — scegline 2',
              classSpellsAt(draft.customFeatList, 0), 2, 'miCantrips', renderDetail);
            buildSpellPicker(body, 'Incantesimo di 1° livello del ' + nomeLista + ' — scegline 1',
              classSpellsAt(draft.customFeatList, 1), 1, 'miSpells', renderDetail);
          }
        }
      });

      // 3. Competenze: scegline 2 fra tutte le 18 abilità.
      addAccordionSection(accordion, 'competenze', 'Competenze', function () {
        return draft.customSkills.length === 2;
      }, function (body) {
        var items = (window.AppEngine.SKILLS || []).map(function (s) {
          return { id: s.id, name: s.label };
        });
        buildSpellPicker(body, 'Scegline 2', items, 2, 'customSkills', renderDetail);
      });

      // 4. Strumento: campo libero, come per i background reali con toolChoice.
      addAccordionSection(accordion, 'strumento', 'Strumento', function () {
        return !!draft.bgTool.trim();
      }, function (body) {
        var toolIn = document.createElement('input');
        toolIn.type = 'text';
        toolIn.className = 'create-in';
        toolIn.value = draft.bgTool;
        toolIn.placeholder = 'Quale strumento?';
        toolIn.addEventListener('input', function () {
          draft.bgTool = toolIn.value;
          updateNav();
        });
        // Niente redraw a ogni tasto (perderebbe il focus): solo quando si
        // esce dal campo, per aggiornare il segno di spunta dell'header.
        toolIn.addEventListener('blur', function () {
          renderDetail();
        });
        body.appendChild(toolIn);
      });

      // 5. Equipaggiamento: o i 50 mo di default, o il pacchetto A preso in
      // prestito da uno dei 16 background reali.
      addAccordionSection(accordion, 'equipaggiamento', 'Equipaggiamento', function () {
        return true; // facoltativo: senza scelta restano comunque i 50 mo
      }, function (body) {
        var row = el('div', 'chip-row');
        Object.keys(all).forEach(function (id) {
          var chip = el('button', 'chip' + (draft.customKitBgId === id ? ' on' : ''), all[id].name);
          chip.type = 'button';
          chip.addEventListener('click', function () {
            draft.customKitBgId = draft.customKitBgId === id ? null : id;
            renderDetail();
            updateNav();
          });
          row.appendChild(chip);
        });
        body.appendChild(row);

        var source = draft.customKitBgId ? all[draft.customKitBgId] : null;
        var pack = source && source.equipment && source.equipment.a;
        if (pack) {
          body.appendChild(el('div', 'create-pack-title', 'A · ' + (pack.label || '')));
          (pack.items || []).forEach(function (it) {
            body.appendChild(el('div', 'create-pack-line', it));
          });
          var mo = (pack.coins || {}).mo || 0;
          if (mo) {
            body.appendChild(el('div', 'create-pack-line', mo + ' monete d\'oro'));
          }
        }
        body.appendChild(el('div', 'create-saves-line',
          'Se non scegli nulla qui, nel passo Equipaggiamento avrai solo l\'opzione da 50 mo.'));
      });
    }

    function renderDetail() {
      detail.textContent = '';
      if (draft.backgroundId === 'personalizzato') {
        renderCustomBackground(detail, manual);

        return;
      }
      var bg = currentBg();
      if (!bg) {
        return;
      }
      var feat = (manual.originFeats || {})[bg.featId] || {};
      var skillLabels = bg.skills.map(function (id) {
        var s = (window.AppEngine.SKILLS || []).filter(function (x) { return x.id === id; })[0];

        return s ? s.label : id;
      });

      detail.appendChild(el('div', 'edit-section-label', 'Cosa ti dà'));
      detail.appendChild(el('div', 'create-pack-line',
        'Competenze: ' + skillLabels.join(', ')));
      detail.appendChild(el('div', 'create-pack-line',
        'Strumenti: ' + (bg.tool || bg.toolChoice + ' (a scelta)')));
      detail.appendChild(el('div', 'create-pack-line',
        'Talento: ' + feat.name + (bg.featNote ? ' — ' + bg.featNote : '')));
      if (feat.desc) {
        detail.appendChild(el('div', 'create-saves-line', feat.desc));
      }

      // Strumento da scegliere (es. "uno a scelta fra gli strumenti da
      // artigiano"): campo libero, il catalogo degli strumenti non c'è ancora.
      if (bg.toolChoice) {
        var toolIn = document.createElement('input');
        toolIn.type = 'text';
        toolIn.className = 'create-in';
        toolIn.value = draft.bgTool;
        toolIn.placeholder = bg.toolChoice + ' — quale?';
        toolIn.addEventListener('input', function () {
          draft.bgTool = toolIn.value;
          updateNav();
        });
        detail.appendChild(el('div', 'edit-section-label', 'Quale ' + bg.toolChoice.toLowerCase() + '?'));
        detail.appendChild(toolIn);
      }

      /* Iniziato alla Magia è l'unico talento d'origine che chiede altre
         scelte: 2 trucchetti e 1 incantesimo di 1° livello dalla lista della
         classe indicata dal background (Chierico, Druido o Mago). */
      var miList = magicInitiateList();
      if (miList) {
        var nomeLista = (window.MANUAL_55.classes[miList] || {}).name || miList;
        buildSpellPicker(detail, 'Trucchetti del ' + nomeLista + ' — scegline 2',
          classSpellsAt(miList, 0), 2, 'miCantrips');
        buildSpellPicker(detail, 'Incantesimo di 1° livello del ' + nomeLista + ' — scegline 1',
          classSpellsAt(miList, 1), 1, 'miSpells');
      } else {
        draft.miCantrips = [];
        draft.miSpells = [];
      }

      renderAbilityBonusBlock(detail, bg);
    }

    // Riga: nome + chevron + anteprima (competenze e talento, sempre
    // visibili) sopra; il dettaglio (renderDetail/renderCustomBackground)
    // entra solo nella riga aperta, cioè quella già selezionata — qui non
    // c'è un concetto di "aperta ma non scelta": un background è sempre
    // scelto o non lo è, stesso modello dati di prima (draft.backgroundId).
    function buildBgRow(id, bg, isCustom) {
      var isOn = draft.backgroundId === id;
      var row = el('div', 'bg-row' + (isCustom ? ' bg-row-custom' : '') + (isOn ? ' on' : ''));

      var head = el('div', 'bg-row-head');
      head.appendChild(el('span', 'bg-row-name', isCustom ? '+ Personalizzato' : bg.name));
      head.appendChild(el('span', 'bg-row-chevron', '▼'));
      row.appendChild(head);

      var previewText;
      if (isCustom) {
        previewText = 'Tutto a scelta libera';
      } else {
        var skillLabels = bg.skills.map(function (sid) {
          var s = (window.AppEngine.SKILLS || []).filter(function (x) { return x.id === sid; })[0];

          return s ? s.label : sid;
        });
        var feat = (manual.originFeats || {})[bg.featId] || {};
        previewText = skillLabels.join(', ') + ' · ' + (feat.name || '');
      }
      var preview = el('div', 'bg-row-preview');
      preview.textContent = previewText;
      row.appendChild(preview);

      head.addEventListener('click', function () {
        if (draft.backgroundId === id) {
          return;
        }
        draft.backgroundId = id;
        resetBgChoices();
        if (isCustom) {
          // A differenza dei 16 background reali (che hanno sempre sia 'a'
          // sia 'b'), customBg() garantisce solo 'b' (i 50 mo) finché non si
          // sceglie un pacchetto in prestito: il default 'a' del draft
          // lascerebbe silenziosamente senza equipaggiamento chi non tocca
          // questo passo.
          draft.bgPack = 'b';
          customOpenSectionId = 'caratteristiche';
        }
        render();
      });

      if (isOn) {
        row.appendChild(detail);
        renderDetail();
      }

      return row;
    }

    Object.keys(all).forEach(function (id) {
      list.appendChild(buildBgRow(id, all[id], false));
    });
    // Riga finale, visivamente distinta (bordo tratteggiato, .bg-row-custom):
    // il background house rule del tavolo, non nel PHB.
    list.appendChild(buildBgRow('personalizzato', null, true));

    updateNav();
  }

  function renderPunteggi(container) {
    /* Riepilogo del background in cima: i suoi aumenti si vedono mentre si
       distribuiscono i punti — è il motivo per cui questo passo viene dopo. */
    var bg = currentBg();
    if (bg) {
      var recap = el('div', 'create-bg-recap');
      recap.appendChild(el('div', 'create-bg-recap-title', bg.name));
      var righe = el('div');
      recap.appendChild(righe);
      container.appendChild(recap);

      /* Si riscrive a ogni modifica dei punteggi (updateNav la richiama):
         altrimenti resterebbe ferma ai valori di partenza e non servirebbe a
         nulla — il punto di questo passo è vedere il totale mentre distribuisci. */
      bgRecapRefresh = function () {
        var bonus = bgBonusMap();
        righe.textContent = '';
        bg.abilities.forEach(function (k) {
          var b = bonus[k];
          var base = draft.abilities[k];
          righe.appendChild(el('div', 'create-pack-line',
            ABILITY_LABELS[k] + ': ' + (base == null ? '—' : base) +
            (b && base != null ? ' + ' + b + ' = ' + (base + b) : (b ? ' + ' + b : ' (nessun aumento)'))));
        });
      };
      bgRecapRefresh();
    }

    /* Riepilogo fisso delle caratteristiche che contano per la classe scelta
       (restyling 2026-07-29, alternativa C tra 3 con preview): le 6 righe
       sotto restano identiche a prima, si aggiunge solo questa striscia.
       "Attacca con" viene da klass.primaryAbility — stringa libera nei dati
       (es. "FOR e CAR"), qui si cerca ogni codice a 3 lettere al suo
       interno; "TS" viene da klass.saves, già un array pulito. */
    var klass = window.MANUAL_55.classes[draft.classId] || {};
    var atkAbilities = ABILITY_ORDER.filter(function (k) {
      return (klass.primaryAbility || '').indexOf(k) !== -1;
    });
    var savesAbilities = klass.saves || [];
    if (atkAbilities.length || savesAbilities.length) {
      var miniRecap = el('div', 'punteggi-recap');
      if (atkAbilities.length) {
        var atkLine = el('span');
        atkLine.innerHTML = 'Attacca con <b>' +
          atkAbilities.map(function (k) { return ABILITY_LABELS[k]; }).join(', ') + '</b>';
        miniRecap.appendChild(atkLine);
      }
      if (savesAbilities.length) {
        var tsLine = el('span');
        tsLine.innerHTML = 'TS: <b>' +
          savesAbilities.map(function (k) { return ABILITY_LABELS[k]; }).join(', ') + '</b>';
        miniRecap.appendChild(tsLine);
      }
      container.appendChild(miniRecap);
    }

    // Selettore di metodo: 3 chip (riuso .chip/.chip-row di edit-sheet.css).
    // Il click cambia draft.scoreMethod, reimposta draft.abilities in modo
    // coerente (resetAbilitiesForMethod) e ridisegna solo la sezione sotto.
    var METHODS = [
      { id: 'pointbuy', label: 'Point-buy' },
      { id: 'array', label: 'Array standard' },
      { id: 'manual', label: 'Manuale' }
    ];

    var methodRow = el('div', 'chip-row create-method-row');
    var sectionWrap = el('div');

    function renderSection() {
      sectionWrap.textContent = ''; // svuota: si ricostruisce con createElement
      if (draft.scoreMethod === 'pointbuy') {
        sectionWrap.appendChild(buildPointBuySection());
      } else if (draft.scoreMethod === 'array') {
        sectionWrap.appendChild(buildArraySection());
      } else {
        sectionWrap.appendChild(buildManualSection());
      }
    }

    function renderChips() {
      methodRow.textContent = '';
      METHODS.forEach(function (m) {
        var chip = el('button', 'chip' + (draft.scoreMethod === m.id ? ' on' : ''), m.label);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          if (draft.scoreMethod === m.id) {
            return;
          }
          draft.scoreMethod = m.id;
          resetAbilitiesForMethod(m.id);
          renderChips();
          renderSection();
        });
        methodRow.appendChild(chip);
      });
    }

    renderChips();
    container.appendChild(methodRow);
    container.appendChild(sectionWrap);
    renderSection();
  }

  /* ---------- passo: Competenze (b2.3) ---------- */

  function renderCompetenze(container) {
    var klass = window.MANUAL_55.classes[draft.classId] || {};

    // Riga di sola lettura: Tiri Salvezza fissi della classe (non si
    // scelgono in questo passo, sono mostrati solo per riferimento). Badge
    // invece di testo piatto (restyling 2026-07-29), coerenti con le chip
    // sotto.
    var savesLabels = (klass.saves || []).map(function (k) { return ABILITY_LABELS[k]; });
    container.appendChild(el('div', 'competenze-ro-label', 'Tiri Salvezza (dalla classe)'));
    var savesRow = el('div', 'competenze-ro-row');
    savesLabels.forEach(function (l) { savesRow.appendChild(el('span', 'competenze-ro-badge', l)); });
    container.appendChild(savesRow);

    var skillsDef = classSkillsFor(draft.classId);
    var allSkills = (window.AppEngine && window.AppEngine.SKILLS) || [];
    var fromBg = bgSkills();

    function skillOf(id) {
      return allSkills.filter(function (x) { return x.id === id; })[0];
    }

    /* Competenze già arrivate dal background: il PHB dice che non si prende
       due volte la stessa, quindi spariscono dalla lista della classe (e il
       numero da scegliere non cambia: si sceglie fra le rimanenti). Badge
       come i Tiri Salvezza sopra. */
    if (fromBg.length) {
      container.appendChild(el('div', 'competenze-ro-label', 'Dal background (già tue)'));
      var bgRow = el('div', 'competenze-ro-row');
      fromBg.forEach(function (id) {
        var s = skillOf(id);
        bgRow.appendChild(el('span', 'competenze-ro-badge', s ? s.label : id));
      });
      container.appendChild(bgRow);
    }

    var disponibili = skillsDef.from.filter(function (id) {
      return fromBg.indexOf(id) === -1;
    });

    // Se si torna qui dopo aver cambiato classe o background, scarta le
    // competenze non più selezionabili.
    draft.profSkills = draft.profSkills.filter(function (id) {
      return disponibili.indexOf(id) !== -1;
    });

    container.appendChild(el('div', 'edit-section-label', 'Scegli ' + skillsDef.count + ' competenze'));

    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);

    var chipEls = {};

    function refresh() {
      var n = draft.profSkills.length;
      var atCap = n >= skillsDef.count;
      counterEl.textContent = n + ' / ' + skillsDef.count;

      disponibili.forEach(function (id) {
        var chip = chipEls[id];
        var isOn = draft.profSkills.indexOf(id) !== -1;
        chip.classList.toggle('on', isOn);
        var disable = atCap && !isOn;
        chip.disabled = disable;
        chip.classList.toggle('is-disabled', disable);
      });
      updateNav();
    }

    function buildChip(id) {
      var match = skillOf(id);
      var chip = el('button', 'chip', match ? match.label : id);
      chip.type = 'button';

      chip.addEventListener('click', function () {
        var idx = draft.profSkills.indexOf(id);
        if (idx !== -1) {
          draft.profSkills.splice(idx, 1);
        } else if (draft.profSkills.length < skillsDef.count) {
          draft.profSkills.push(id);
        }
        refresh();
      });

      chipEls[id] = chip;

      return chip;
    }

    /* Raggruppate per caratteristica governante (restyling 2026-07-29,
       alternativa B tra 3 con preview): con poche competenze rimanenti
       (es. Paladino) sono 2-3 gruppi minuscoli, ma con classi che scelgono
       fra tutte e 18 (es. Bardo) aiuta davvero a orientarsi invece di
       scorrere una fila unica lunghissima. Dato reale (skill.abil), nessuna
       competenza inventata: solo raggruppata. */
    var byAbil = {};
    disponibili.forEach(function (id) {
      var s = skillOf(id);
      var abil = s ? s.abil : '?';
      (byAbil[abil] = byAbil[abil] || []).push(id);
    });
    ABILITY_ORDER.filter(function (k) { return byAbil[k]; }).forEach(function (k) {
      var group = el('div', 'competenze-group');
      group.appendChild(el('div', 'competenze-group-head', ABILITY_LABELS[k]));
      var row = el('div', 'chip-row');
      byAbil[k].forEach(function (id) { row.appendChild(buildChip(id)); });
      group.appendChild(row);
      container.appendChild(group);
    });

    refresh();
  }

  /* ---------- passo: Equipaggiamento (b2.4) ---------- */

  // Imposta l'equipaggiamento in bozza ai default della classe la prima volta
  // che si entra nel passo e ogni volta che la classe è cambiata da quando
  // erano stati impostati (stesso spirito dell'auto-correzione delle
  // competenze al cambio classe: cambiare classe rimette il kit di quella
  // classe). Se la classe non è cambiata, conserva le modifiche manuali.
  function ensureEquipDraft() {
    if (!draft.equip || draft.equipForClass !== draft.classId) {
      draft.equip = defaultEquipFor(draft.classId);
      draft.equipForClass = draft.classId;
    }
  }

  // Riga di dettaglio dentro la card di un pacchetto: "Cotta di Maglia — CA 16".
  function packLine(text) {
    return el('div', 'create-pack-line', text);
  }

  // Card selezionabile di un pacchetto (A o B), col contenuto in chiaro.
  function packCard(letter, pack, selected, onPick) {
    var card = el('button', 'create-pack' + (selected ? ' on' : ''));
    card.type = 'button';
    card.appendChild(el('div', 'create-pack-title', letter.toUpperCase() + ' · ' + pack.label));

    if (pack.armorId) {
      card.appendChild(packLine(window.AppEngine.armorLabel(pack.armorId)));
    }
    if (pack.shield) {
      var sh = window.MANUAL_55.shield || { name: 'Scudo', ac: 2 };
      card.appendChild(packLine(sh.name + ' — CA +' + sh.ac));
    }
    var w = pack.weaponId ? weaponById(pack.weaponId) : null;
    if (w) {
      card.appendChild(packLine(w.name + ' — ' + w.die + ' ' + w.dmg));
    }
    (pack.extra || []).forEach(function (it) {
      card.appendChild(packLine((it.qty > 1 ? it.qty + ' × ' : '') + it.name));
    });
    var mo = (pack.coins || {}).mo || 0;
    if (mo) {
      card.appendChild(packLine(mo + ' monete d\'oro'));
    }
    if (!pack.armorId && !pack.weaponId) {
      card.appendChild(packLine('Nessun equipaggiamento: te lo compri col master.'));
    }

    card.addEventListener('click', function () { onPick(letter); });

    return card;
  }

  function renderEquipaggiamento(container) {
    ensureEquipDraft();
    var eq = draft.equip;
    var packs = packsFor(draft.classId);

    if (!packs) {
      container.appendChild(el('div', 'create-saves-line',
        'Per questa classe l\'equipaggiamento iniziale non è ancora nei dati del manuale: si parte senza nulla e si aggiunge dalla scheda.'));
    } else {
      container.appendChild(el('div', 'edit-section-label', 'Equipaggiamento iniziale'));
      container.appendChild(el('div', 'create-saves-line',
        'Le opzioni del manuale. Quello che il master ti concede in più lo aggiungi dopo, dalla scheda.'));

      var cardRow = el('div', 'create-pack-row');
      // Lettere in ordine (a, b, c…): non fisso a due, il Guerriero ne ha 3
      // (A e B con oggetti, C solo monete).
      Object.keys(packs).sort().forEach(function (letter) {
        cardRow.appendChild(packCard(letter, packs[letter], eq.pack === letter, function (picked) {
          eq.pack = picked;
          render(); // ridisegna: cambia la card selezionata
        }));
      });
      container.appendChild(cardRow);
    }

    /* Secondo pacchetto: quello del background. Il PHB ne dà uno per la classe
       e uno per l'origine, e si sceglie A o B in entrambi (5.B.4). */
    var bg = currentBg();
    if (bg) {
      container.appendChild(el('div', 'edit-section-label', 'Dal background — ' + bg.name));
      var bgRow = el('div', 'create-pack-row');
      ['a', 'b'].forEach(function (letter) {
        var pack = bg.equipment[letter];
        if (!pack) {
          return;
        }
        var card = el('button', 'create-pack' + (draft.bgPack === letter ? ' on' : ''));
        card.type = 'button';
        card.appendChild(el('div', 'create-pack-title',
          letter.toUpperCase() + ' · ' + (pack.label || 'Solo monete')));
        (pack.items || []).forEach(function (it) {
          card.appendChild(el('div', 'create-pack-line', it));
        });
        var bgMo = (pack.coins || {}).mo || 0;
        if (bgMo) {
          card.appendChild(el('div', 'create-pack-line', bgMo + ' monete d\'oro'));
        }
        card.addEventListener('click', function () {
          draft.bgPack = letter;
          render();
        });
        bgRow.appendChild(card);
      });
      container.appendChild(bgRow);
    }

    // Maestria nelle armi: scelta vera fra le armi in cui la classe è
    // competente, non più un campo di testo facoltativo (5.B.5). Raggruppata
    // per maestria (restyling 2026-07-29): vedi buildMasteryPicker.
    var count = masteryCountFor(draft.classId);
    if (count > 0) {
      buildMasteryPicker(container, count);
    }
  }

  /* Maestria nelle armi raggruppata per effetto (restyling 2026-07-29,
     alternativa B tra 3 con preview): una classe competente con tutte le
     armi (es. il Paladino, 38 voci) avrebbe una fila unica lunghissima —
     stesso problema già risolto per le Competenze (renderCompetenze),
     stessa soluzione, ma qui si raggruppa per la maestria stessa (Vex,
     Sap…) invece che per categoria: la A tra le 3 preview avrebbe comunque
     lasciato gruppi da ~10 armi, mentre la maestria dà 8 gruppi piccoli e
     insegna cosa fa l'arma mentre si sceglie (desc reale dal manuale). */
  function buildMasteryPicker(container, count) {
    var weapons = masteryChoicesFor(draft.classId);
    var validIds = weapons.map(function (w) { return w.id; });
    draft.masteries = (draft.masteries || []).filter(function (id) {
      return validIds.indexOf(id) !== -1;
    });

    container.appendChild(el('div', 'edit-section-label', 'Maestria nelle armi — scegline ' + count));
    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);

    var chipEls = {};

    function refresh() {
      var n = draft.masteries.length;
      var atCap = n >= count;
      counterEl.textContent = n + ' / ' + count;
      weapons.forEach(function (w) {
        var chip = chipEls[w.id];
        var isOn = draft.masteries.indexOf(w.id) !== -1;
        chip.classList.toggle('on', isOn);
        var disable = atCap && !isOn;
        chip.disabled = disable;
        chip.classList.toggle('is-disabled', disable);
      });
      updateNav();
    }

    function buildChip(w) {
      var chip = el('button', 'chip', w.name);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        var idx = draft.masteries.indexOf(w.id);
        if (idx !== -1) {
          draft.masteries.splice(idx, 1);
        } else if (draft.masteries.length < count) {
          draft.masteries.push(w.id);
        }
        refresh();
      });
      chipEls[w.id] = chip;

      return chip;
    }

    var byMastery = {};
    weapons.forEach(function (w) {
      (byMastery[w.mastery] = byMastery[w.mastery] || []).push(w);
    });
    var masteryDefs = window.MANUAL_55.weaponMasteries || {};
    Object.keys(masteryDefs).filter(function (m) { return byMastery[m]; }).forEach(function (m) {
      var group = el('div', 'mastery-group');
      group.appendChild(el('div', 'mastery-group-head', m));
      group.appendChild(el('div', 'mastery-group-desc', masteryDefs[m].desc));
      var row = el('div', 'chip-row');
      byMastery[m].forEach(function (w) { row.appendChild(buildChip(w)); });
      group.appendChild(row);
      container.appendChild(group);
    });

    refresh();
  }

  /* ---------- passo finale: Sottoclasse e Incantesimi (b2.5) ---------- */

  // Selettore di `count` elementi tra `spells`, che scrive gli id scelti in
  // draft[draftKey] (cap al tetto, contatore, stato disabilitato); scarta le
  // selezioni non più valide se la lista cambia (cambio classe). `onChange`
  // (opzionale) è richiamato dopo ogni click, oltre al refresh interno: serve
  // al background Personalizzato, dove una scelta qui dentro fa comparire
  // altra UI sotto (es. il blocco aumenti caratteristica dopo la terza
  // caratteristica scelta).
  //
  // Righe con descrizione a comparsa invece di chip piatte (restyling
  // 2026-07-29, alternativa C tra 3 con preview) quando gli elementi sono
  // incantesimi veri, riconosciuti dal campo `desc` (assente per
  // caratteristiche/competenze/lingue, che restano chip semplici): il nome
  // di un incantesimo da solo spesso non basta a decidere ("Sussurri
  // Dissonanti" non dice cosa fa), si tocca la riga per leggerlo prima di
  // spuntarlo — la spunta è un elemento separato apposta, per poter leggere
  // senza scegliere. Stesso meccanismo a righe già approvato per il
  // Background (bg-row/bg-row-body).
  function buildSpellPicker(container, title, spells, count, draftKey, onChange) {
    var validIds = spells.map(function (s) { return s.id; });
    draft[draftKey] = (draft[draftKey] || []).filter(function (id) {
      return validIds.indexOf(id) !== -1;
    });

    container.appendChild(el('div', 'edit-section-label', title));
    var counterEl = el('div', 'create-points-counter');
    container.appendChild(counterEl);

    var controls = {}; // id -> { setOn(bool), setDisabled(bool) }
    var disabledIds = {}; // id -> bool: le righe non sono <button>, il blocco è manuale

    function refresh() {
      var n = draft[draftKey].length;
      var atCap = n >= count;
      counterEl.textContent = n + ' / ' + count;
      spells.forEach(function (s) {
        var isOn = draft[draftKey].indexOf(s.id) !== -1;
        var disable = atCap && !isOn;
        controls[s.id].setOn(isOn);
        controls[s.id].setDisabled(disable);
        disabledIds[s.id] = disable;
      });
      updateNav();
    }

    function toggle(id) {
      if (disabledIds[id]) {
        return;
      }
      var idx = draft[draftKey].indexOf(id);
      if (idx !== -1) {
        draft[draftKey].splice(idx, 1);
      } else if (draft[draftKey].length < count) {
        draft[draftKey].push(id);
      }
      refresh();
      // Solo sul click, non sul refresh iniziale qui sotto: onChange rifà
      // renderDetail(), che ricostruisce anche questo stesso picker — se
      // scattasse anche al primo refresh() andrebbe in ricorsione infinita.
      if (onChange) {
        onChange();
      }
    }

    var isSpellList = spells.length > 0 && !!spells[0].desc;

    if (isSpellList) {
      var list = el('div', 'spell-list');
      container.appendChild(list);

      spells.forEach(function (s) {
        var row = el('div', 'spell-row');
        var head = el('div', 'spell-row-head');

        var nameWrap = el('span', 'spell-row-name-wrap');
        var check = el('span', 'spell-row-check');
        nameWrap.appendChild(check);
        nameWrap.appendChild(el('span', 'spell-row-name', s.name));
        head.appendChild(nameWrap);

        var metaWrap = el('span', 'spell-row-meta-wrap');
        // Solo il tempo di lancio (es. "Azione", "Reazione"): il primo
        // segmento di meta a volte include tra parentesi il grilletto della
        // Reazione (es. "Reazione (a una caduta...)"), troppo lungo per la
        // riga — si taglia anche lì, non solo al primo "·".
        metaWrap.appendChild(el('span', 'spell-row-meta',
          (s.meta || '').split('·')[0].split('(')[0].trim()));
        metaWrap.appendChild(el('span', 'spell-row-chevron', '▼'));
        head.appendChild(metaWrap);

        row.appendChild(head);
        row.appendChild(el('div', 'spell-row-desc', s.desc));
        list.appendChild(row);

        head.addEventListener('click', function () {
          row.classList.toggle('expanded');
        });
        check.addEventListener('click', function (e) {
          e.stopPropagation(); // non deve anche aprire/chiudere la riga
          toggle(s.id);
        });

        controls[s.id] = {
          setOn: function (isOn) { row.classList.toggle('on', isOn); },
          setDisabled: function (isDisabled) { row.classList.toggle('is-disabled', isDisabled); }
        };
      });
    } else {
      var chipRow = el('div', 'chip-row');
      container.appendChild(chipRow);

      spells.forEach(function (s) {
        var chip = el('button', 'chip', s.name);
        chip.type = 'button';
        chip.addEventListener('click', function () { toggle(s.id); });
        chipRow.appendChild(chip);

        controls[s.id] = {
          setOn: function (isOn) { chip.classList.toggle('on', isOn); },
          setDisabled: function (isDisabled) {
            chip.disabled = isDisabled;
            chip.classList.toggle('is-disabled', isDisabled);
          }
        };
      });
    }

    refresh();
  }

  // Chip dello Stile di Combattimento (solo classi con choicePoints.fightingStyle
  // === CREATE_LEVEL, es. Guerriero): stessa UI a chip degli altri picker qui.
  function buildFightingStylePicker(container) {
    container.appendChild(el('div', 'edit-section-label', 'Stile di Combattimento'));
    var row = el('div', 'chip-row');
    var chipEls = {};
    FIGHTING_STYLES.forEach(function (opt) {
      var chip = el('button', 'chip' + (draft.fightingStyleId === opt.id ? ' on' : ''), opt.label);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        draft.fightingStyleId = opt.id;
        Object.keys(chipEls).forEach(function (id) {
          chipEls[id].classList.toggle('on', id === opt.id);
        });
        updateNav();
      });
      chipEls[opt.id] = chip;
      row.appendChild(chip);
    });
    container.appendChild(row);
  }

  // Chip di Competenza (Espero, Ladro dal 1° livello): solo fra le abilità in
  // cui il personaggio è già competente (classe + background), conta esatta
  // come i picker di incantesimi. `count` viene da choicePoints.expertise:
  // sempre 2 nel PHB, sia al 1° che al 6° livello.
  function buildExpertisePicker(container, count) {
    var eligible = (draft.profSkills || []).concat(bgSkills());
    draft.expertiseSkills = (draft.expertiseSkills || []).filter(function (id) {
      return eligible.indexOf(id) !== -1;
    });
    var skillsById = {};
    (window.AppEngine.SKILLS || []).forEach(function (s) { skillsById[s.id] = s; });
    var options = eligible.map(function (id) {
      return { id: id, name: (skillsById[id] || {}).label || id };
    });
    buildSpellPicker(container, 'Competenza — scegline ' + count, options, count, 'expertiseSkills');
  }

  function renderFinale(container) {
    var klass = window.MANUAL_55.classes[draft.classId] || {};

    // Nota sottoclasse: a livello 1 nessuna classe la sceglie (tutte al 3).
    container.appendChild(el('div', 'create-saves-line',
      'La sottoclasse si sceglie al livello 3, non alla creazione.'));

    if ((klass.choicePoints || {}).fightingStyle === CREATE_LEVEL) {
      buildFightingStylePicker(container);
    }
    var expertiseEntry = expertiseEntryFor(klass.choicePoints, CREATE_LEVEL);
    if (expertiseEntry) {
      buildExpertisePicker(container, expertiseEntry.count);
    }

    var isCaster = klass.casterType && klass.casterType !== 'none';
    if (!isCaster) {
      // Non-caster (es. Barbaro): niente incantesimi al livello 1. Ripulisco
      // eventuali scelte rimaste da una classe caster selezionata prima.
      draft.cantrips = [];
      draft.preparedSpells = [];
      container.appendChild(el('div', 'create-saves-line',
        'Questa classe non lancia incantesimi al livello 1: non c’è altro da scegliere qui.'));
      updateNav();

      return;
    }

    var needCantrips = (klass.cantripsByLevel && klass.cantripsByLevel[CREATE_LEVEL]) || 0;
    var needPrepared = (klass.preparedByLevel && klass.preparedByLevel[CREATE_LEVEL]) || 0;

    /* Quello che il talento d'origine ha già dato non si può riprendere qui:
       gli incantesimi da talento non contano fra i preparabili, quindi
       sceglierli di nuovo sarebbe solo uno spreco (e un doppione a video). */
    var miGia = (draft.miCantrips || []).concat(draft.miSpells || []);
    /* Stesso discorso per gli incantesimi che la CLASSE tiene sempre
       preparati fin dal 1° livello (klass.spellsByLevel[1], es. Marchio del
       Cacciatore del Ranger dato da Nemico Prescelto): senza escluderli,
       comparivano anche fra i preparabili normali — uno spreco della scelta
       e un doppione, visto che il personaggio li ha comunque gratis. Il
       Paladino non ne risente: i suoi (Punizione Divina, Trova Destriero)
       arrivano dal 2° livello, dopo il livello di creazione. */
    var classFreeIds = ((klass.spellsByLevel || {})[CREATE_LEVEL] || []).map(function (s) { return s.id; });
    var giaAvuti = miGia.concat(classFreeIds);
    function senzaGiaAvuti(list) {
      return list.filter(function (s) { return giaAvuti.indexOf(s.id) === -1; });
    }
    function spellNames(ids) {
      return ids.map(function (id) {
        var s = (window.MANUAL_55.spells || []).filter(function (x) { return x.id === id; })[0];

        return s ? s.name : id;
      }).join(', ');
    }

    if (miGia.length) {
      container.appendChild(el('div', 'create-saves-line',
        'Dal talento d\'origine hai già: ' + spellNames(miGia) + '.'));
    }
    if (classFreeIds.length) {
      container.appendChild(el('div', 'create-saves-line',
        'Sempre preparato dalla classe: ' + spellNames(classFreeIds) + '.'));
    }

    if (needCantrips > 0) {
      buildSpellPicker(container, 'Trucchetti (scegline ' + needCantrips + ')',
        senzaGiaAvuti(classSpellsAt(draft.classId, 0)), needCantrips, 'cantrips');
    } else {
      draft.cantrips = [];
    }

    if (needPrepared > 0) {
      buildSpellPicker(container, 'Incantesimi preparati di 1° livello (scegline ' + needPrepared + ')',
        senzaGiaAvuti(classSpellsAt(draft.classId, 1)), needPrepared, 'preparedSpells');
    } else {
      draft.preparedSpells = [];
    }

    updateNav();
  }

  /* ---------- passo: Identità (Allineamento e Lingue) ---------- */

  var ALIGNMENT_LAW = ['Legale', 'Neutrale', 'Caotico'];
  var ALIGNMENT_MORALITY = ['Buono', 'Neutrale', 'Malvagio'];

  // Combinazione scelta come stringa, con la dicitura tradizionale "Neutrale
  // Puro" per il caso Neutrale/Neutrale; vuota finché la scelta non è completa.
  // Condivisa fra il riepilogo qui sotto e buildCharacter().
  function computeAlignment() {
    if (!draft.alignmentLaw || !draft.alignmentMorality) {
      return '';
    }
    if (draft.alignmentLaw === 'Neutrale' && draft.alignmentMorality === 'Neutrale') {
      return 'Neutrale Puro';
    }

    return draft.alignmentLaw + ' ' + draft.alignmentMorality;
  }

  /* Controllo a 3 stati con trascinamento e tocco diretto (restyling
     2026-07-29, scelto tra alternative con preview, poi esteso su richiesta
     di Andrea per il trascinamento oltre al tocco). Il rettangolo segue il
     dito in continuo durante il trascinamento, aggiornando la scelta appena
     passa sopra un'altra opzione, e scatta esattamente in posizione al
     rilascio; un tocco secco è solo un trascinamento senza movimento, stesso
     percorso di codice. Sostituisce buildSingleChoiceRow (rimossa, non
     usata altrove) solo per Legge/Morale — nessun avviso su nessuna
     combinazione, libera scelta dell'utente. */
  function buildSegmentedRow(container, title, options, draftKey, onChange) {
    container.appendChild(el('div', 'create-label', title));

    var track = el('div', 'seg-track');
    var highlight = el('div', 'seg-highlight');
    track.appendChild(highlight);
    var optEls = options.map(function (label) {
      var opt = el('div', 'seg-opt', label);
      track.appendChild(opt);

      return opt;
    });
    container.appendChild(track);

    var current = options.indexOf(draft[draftKey]); // -1 se non ancora scelto

    function applyIndex(i) {
      if (i === current) {
        return;
      }
      current = i;
      optEls.forEach(function (o, j) { o.classList.toggle('on', j === i); });
      draft[draftKey] = options[i];
      onChange();
    }

    function indexFromClientX(clientX) {
      var rect = track.getBoundingClientRect();
      var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

      return Math.min(options.length - 1, Math.floor(ratio * options.length));
    }

    // Segue il dito in modo continuo (non a scatti tra le 3 posizioni),
    // restando dentro il binario: la larghezza è quella reale di un'opzione.
    function followClientX(clientX) {
      var rect = track.getBoundingClientRect();
      var w = optEls[0].offsetWidth;
      var half = w / 2;
      var x = Math.min(rect.width - half, Math.max(half, clientX - rect.left));
      highlight.style.width = w + 'px';
      highlight.style.left = (x - half) + 'px';
    }

    function snapTo(i) {
      highlight.style.left = optEls[i].offsetLeft + 'px';
      highlight.style.width = optEls[i].offsetWidth + 'px';
    }

    track.addEventListener('pointerdown', function (e) {
      // La selezione al tocco non deve dipendere dalla pointer capture: se
      // fallisse (capita con alcuni pointer id sintetici/non standard), il
      // trascinamento fuori dal binario resta meno fluido ma il tocco
      // sceglie comunque l'opzione giusta.
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignorato di proposito, vedi commento sopra
      }
      applyIndex(indexFromClientX(e.clientX));
      followClientX(e.clientX);

      function move(ev) {
        applyIndex(indexFromClientX(ev.clientX));
        followClientX(ev.clientX);
      }
      function up(ev) {
        applyIndex(indexFromClientX(ev.clientX));
        snapTo(current);
        track.removeEventListener('pointermove', move);
        track.removeEventListener('pointerup', up);
      }
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', up);
    });

    // Tornando su questo passo con una scelta già fatta, mostrala subito
    // (spunta + rettangolo in posizione) invece di ripartire da vuoto.
    if (current !== -1) {
      optEls[current].classList.add('on');
      snapTo(current);
    }
  }

  function renderIdentita(container) {
    container.appendChild(el('div', 'edit-section-label', 'Allineamento'));

    var recap = el('div', 'create-saves-line', '');

    function refreshRecap() {
      var val = computeAlignment();
      recap.textContent = val ? ('Allineamento: ' + val) : 'Scegli legge e morale.';
      updateNav();
    }

    buildSegmentedRow(container, 'Legge', ALIGNMENT_LAW, 'alignmentLaw', refreshRecap);
    buildSegmentedRow(container, 'Morale', ALIGNMENT_MORALITY, 'alignmentMorality', refreshRecap);
    container.appendChild(recap);
    refreshRecap();

    container.appendChild(el('div', 'edit-section-label', 'Lingue'));
    container.appendChild(el('span', 'chip on', 'Comune ✓'));
    buildSpellPicker(container, 'Scegline altre 2 dalle Lingue Standard', STANDARD_LANGUAGES, 2, 'languages');
  }

  /* ---------- generazione del personaggio (b3) ---------- */

  // Id del nuovo personaggio: slug dal nome (senza accenti/simboli) + suffisso
  // casuale breve, per non collidere con documenti esistenti (es.
  // tharion-velnar) né tra personaggi con lo stesso nome.
  function makeCharId(name) {
    var slug = (name || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
    if (!slug) { slug = 'eroe'; }

    return slug + '-' + Math.random().toString(36).slice(2, 6);
  }

  // Oggetto `character` (fatti base) dal draft + dati di classe/specie del
  // manuale. Parte da zero: nessun residuo di Tharion. Sottoclasse assente
  // (si sceglie al livello 3) e stile di combattimento 'nessuno' (arriva col
  // level-up); i TS competenti sono quelli fissi della classe.
  // Punteggi finali = quelli del passo Punteggi + gli aumenti del background.
  function finalAbilities() {
    var bonus = bgBonusMap();
    var out = {};
    ABILITY_ORDER.forEach(function (k) {
      out[k] = (draft.abilities[k] || 0) + bonus[k];
    });

    return out;
  }

  function buildCharacter() {
    var manual = window.MANUAL_55;
    var klass = manual.classes[draft.classId] || {};
    var species = manual.species[draft.speciesId] || {};
    var pack = chosenPack();
    var bg = currentBg();

    var armor = { shield: !!(pack && pack.shield) };
    if (pack && pack.armorId) { armor.id = pack.armorId; }

    /* Arma impugnata: quella del pacchetto, con dado e tipo di danno presi dal
       catalogo invece che digitati a mano. La maestria è quella scelta nel
       passo, se riguarda proprio quest'arma (le altre restano privilegi del
       personaggio, non proprietà dell'arma in mano). */
    var w = pack && pack.weaponId ? weaponById(pack.weaponId) : null;
    var mastery = (w && draft.masteries.indexOf(w.id) !== -1) ? w.mastery : '';

    return {
      name: (draft.name || '').trim(),
      classId: draft.classId,
      subclassId: null,
      subclassName: '',
      level: CREATE_LEVEL,
      speciesId: draft.speciesId,
      speciesLabel: species.name || '',
      // Scelte legate alla specie (5.B.6): ognuna vale solo per la specie a
      // cui appartiene, mai riportata da una scelta precedente.
      dragonAncestryId: draft.speciesId === 'dragonide' ? draft.dragonAncestryId : null,
      elfLineageId: draft.speciesId === 'elfo' ? draft.elfLineageId : null,
      elfSkillId: draft.speciesId === 'elfo' ? draft.elfSkillId : null,
      goliathGiftId: draft.speciesId === 'goliath' ? draft.goliathGiftId : null,
      tieflingLegacyId: draft.speciesId === 'tiefling' ? draft.tieflingLegacyId : null,
      gnomeLineageId: draft.speciesId === 'gnomo' ? draft.gnomeLineageId : null,
      avatar: '✦',
      // Punteggi finali: quelli distribuiti nel passo Punteggi più gli aumenti
      // del background (5.B.4).
      abilities: finalAbilities(),
      backgroundId: draft.backgroundId,
      backgroundName: bg ? bg.name : '',
      profSaves: (klass.saves || []).slice(),
      // Competenze: quelle scelte dalla classe, le due del background, e —
      // per l'Elfo — l'abilità di Sensi Acuti (Intuizione/Percezione/
      // Sopravvivenza), senza doppioni se già competente per un'altra via.
      profSkills: (draft.profSkills || []).concat(bgSkills())
        .concat(draft.speciesId === 'elfo' && draft.elfSkillId ? [draft.elfSkillId] : [])
        .filter(function (id, i, arr) { return arr.indexOf(id) === i; }),
      profTools: bg ? [bg.tool || draft.bgTool.trim()].filter(Boolean) : [],
      // Competenza (Ladro, Ranger): solo se la classe la dà al livello 1.
      expertiseSkills: expertiseEntryFor(klass.choicePoints, CREATE_LEVEL)
        ? (draft.expertiseSkills || []).slice() : [],
      fightingStyle: ((klass.choicePoints || {}).fightingStyle === CREATE_LEVEL && draft.fightingStyleId) || 'nessuno',
      armor: armor,
      // Abilità d'attacco (Blocco 5.A.3, letta da js/engine.js): Accurata →
      // agile (finesse), 'dist' nella categoria → a distanza. Senza questi due
      // flag il motore presume sempre Forza, sbagliato per un Ladro DES.
      // 'A due mani' esclude lo Stile Duellante (serve un'arma a una mano).
      weapon: {
        name: w ? w.name : '', die: w ? w.die : '1d8',
        type: w ? w.dmg : '', mastery: mastery,
        finesse: w ? (w.props || []).indexOf('Accurata') !== -1 : false,
        ranged: w ? w.cat.indexOf('dist') !== -1 : false,
        twoHanded: w ? (w.props || []).indexOf('A due mani') !== -1 : false
      },
      // Maestrie possedute (id di armi): il personaggio le sa usare anche se
      // in mano ha un'altra arma.
      weaponMasteries: (draft.masteries || []).slice(),
      // Talento d'origine: lo dà il background e vale dal livello 1.
      feats: bg ? [{ id: bg.featId, level: 1, source: 'background' }] : [],
      // Identità (passo finale): allineamento come stringa già combinata
      // ("Neutrale Puro" per Neutrale/Neutrale) e lingue col Comune davanti.
      alignment: computeAlignment(),
      languages: ['Comune'].concat((draft.languages || []).map(function (id) {
        var l = STANDARD_LANGUAGES.filter(function (x) { return x.id === id; })[0];

        return l ? l.name : id;
      })),
      modifiers: [], extraResources: [], items: [], levelChoices: {}
    };
  }

  // Pacchetto scelto (o null: classe senza pacchetti nei dati).
  function chosenPack() {
    var packs = packsFor(draft.classId);
    var letter = (draft.equip || {}).pack;

    return (packs && letter && packs[letter]) || null;
  }

  /* Roba del pacchetto che finisce nella sacca personale: le armi di scorta
     (giavellotti, asce da lancio) col loro peso dal catalogo, e i kit. Il peso
     dei kit non è nel PHB, resta 0 (vedi Debiti aperti nella ROADMAP). */
  function packInventory() {
    var pack = chosenPack();
    var lista = ((pack && pack.extra) || []).map(function (it) {
      var w = it.weaponId ? weaponById(it.weaponId) : null;

      return {
        name: it.name,
        desc: it.desc || (w ? w.die + ' ' + w.dmg + ' · ' + w.mastery : ''),
        qty: it.qty || 1,
        // peso proprio dell'oggetto, oppure quello dell'arma dal catalogo
        weight: it.weight != null ? it.weight : (w ? w.weight : 0)
      };
    });

    /* Roba del background: nel PHB è un elenco di oggetti comuni senza pesi
       nella riga del background, quindi entra con peso 0 — meglio averla in
       lista che non averla (vedi Debiti aperti). */
    var bgPack = bgChosenPack();
    var pesi = window.MANUAL_55.gearWeights || {};
    ((bgPack && bgPack.items) || []).forEach(function (name) {
      lista.push({
        name: name,
        desc: 'Dal background',
        qty: 1,
        // Peso dalla tabella dell'equipaggiamento; 0 per le voci a cui il
        // manuale non dà un peso o che dipendono dalla forma scelta.
        weight: pesi[name] || 0
      });
    });

    /* Se classe e background danno la stessa identica cosa — il simbolo sacro
       del Paladino Accolito — resta una sola voce: due righe uguali nella sacca
       sono solo confusione. Vince quella con la quantità maggiore. */
    var unici = [];
    lista.forEach(function (it) {
      var gia = unici.filter(function (x) { return x.name === it.name; })[0];
      if (!gia) {
        unici.push(it);
      } else if ((it.qty || 1) > (gia.qty || 1)) {
        gia.qty = it.qty;
        gia.weight = it.weight;
      }
    });

    return unici;
  }

  function bgChosenPack() {
    var bg = currentBg();

    return (bg && bg.equipment[draft.bgPack]) || null;
  }

  // Stato completo e pulito del nuovo personaggio. I pool correnti partono al
  // massimo del livello 1 (ricavati dal motore: PF pieni, Imposizione piena
  // per il Paladino, nessun destriero); monete ed equipaggiamento sono quelli
  // del pacchetto scelto (5.B.5), diario vuoto. Gli incantesimi scelti
  // finiscono nel grimorio.
  function buildStateFromDraft() {
    var character = buildCharacter();
    var poolMax = (window.AppEngine.derive(character).poolMax) || {};
    // Monete: si sommano quelle del pacchetto di classe e quelle del background.
    var classCoins = (chosenPack() || {}).coins || {};
    var bgCoins = (bgChosenPack() || {}).coins || {};
    var packCoins = {
      mp: (classCoins.mp || 0) + (bgCoins.mp || 0),
      mo: (classCoins.mo || 0) + (bgCoins.mo || 0),
      ma: (classCoins.ma || 0) + (bgCoins.ma || 0),
      mr: (classCoins.mr || 0) + (bgCoins.mr || 0)
    };

    return {
      version: 3,
      character: character,
      pools: { hp: poolMax.hp || 0, loh: poolMax.loh || 0, steedhp: 0, tempHp: 0 },
      spent: {},
      coins: {
        mp: packCoins.mp || 0, mo: packCoins.mo || 0,
        ma: packCoins.ma || 0, mr: packCoins.mr || 0
      },
      steed: { name: '' },
      treasury: {
        carryMax: (character.abilities.FOR || 10) * 15, // capacità PHB = FOR × 15
        partyItems: [], personalItems: packInventory()
      },
      diary: { sessions: [], png: [], quests: { active: [], completed: [] } },
      inspiration: false,
      deathSaves: { success: 0, fail: 0 },
      grimoire: {
        prepared: (draft.preparedSpells || []).slice(),
        // I trucchetti del talento si sommano a quelli eventuali della classe.
        cantrips: (draft.cantrips || []).concat(draft.miCantrips || []),
        /* `always` = incantesimi che il personaggio ha sempre pronti per via di
           un talento, senza contare verso quelli preparabili. Oggi ci finisce
           quello di Iniziato alla Magia. */
        always: (draft.miSpells || []).slice()
      }
    };
  }

  // "Crea personaggio" (ultimo passo): genera lo stato dal draft, torna alla
  // dashboard e delega a AppCloud la persistenza (localStorage + Firestore) e
  // il refresh della lista. Non cambia il personaggio attivo: nel nuovo si
  // entra dalla dashboard, come per gli altri.
  function finishCreation() {
    if (!finaleValid()) {
      return;
    }
    var id = makeCharId(draft.name);
    var state = buildStateFromDraft();
    close();
    if (window.AppCloud && window.AppCloud.createCharacter) {
      window.AppCloud.createCharacter(id, state);
    }
  }

  /* ---------- render ---------- */

  function render() {
    var step = STEPS[stepIndex];
    bgRecapRefresh = null; // il riepilogo appartiene al solo passo Punteggi

    if (progressFillEl) {
      progressFillEl.style.width = ((stepIndex + 1) / STEPS.length * 100) + '%';
    }
    if (stepNumEl) {
      stepNumEl.textContent = 'Passo ' + (stepIndex + 1) + ' di ' + STEPS.length;
    }
    if (stepTitleEl) {
      stepTitleEl.textContent = step.title;
    }
    if (stepBodyEl) {
      stepBodyEl.innerHTML = '';
      if (step.id === 'specie') {
        stepBodyEl.classList.add('has-fields');
        renderSpecie(stepBodyEl);
      } else if (step.id === 'classe') {
        stepBodyEl.classList.add('has-fields');
        renderClasse(stepBodyEl);
      } else if (step.id === 'background') {
        stepBodyEl.classList.add('has-fields');
        renderBackground(stepBodyEl);
      } else if (step.id === 'punteggi') {
        stepBodyEl.classList.add('has-fields');
        renderPunteggi(stepBodyEl);
      } else if (step.id === 'competenze') {
        stepBodyEl.classList.add('has-fields');
        renderCompetenze(stepBodyEl);
      } else if (step.id === 'equipaggiamento') {
        stepBodyEl.classList.add('has-fields');
        renderEquipaggiamento(stepBodyEl);
      } else if (step.id === 'finale') {
        stepBodyEl.classList.add('has-fields');
        renderFinale(stepBodyEl);
      } else if (step.id === 'identita') {
        stepBodyEl.classList.add('has-fields');
        renderIdentita(stepBodyEl);
      } else {
        // Difensivo: tutti i passi hanno ora un contenuto reale, questo ramo
        // non dovrebbe mai scattare.
        stepBodyEl.classList.remove('has-fields');
        stepBodyEl.textContent = '';
      }
    }
    updateNav();
  }

  // Bottone "Avanti"/"Crea personaggio" e nota in calce: separata da
  // render() perché va richiamata anche dagli input/tile dei passi, senza
  // ridisegnare tutto il corpo del passo (che perderebbe focus/selezione).
  function updateNav() {
    var isLast = stepIndex === STEPS.length - 1;

    // Le sezioni dei punteggi chiamano updateNav a ogni modifica: è il punto
    // giusto per tenere allineato il riepilogo del background.
    if (bgRecapRefresh) {
      bgRecapRefresh();
    }

    if (nextBtn) {
      nextBtn.textContent = isLast ? 'Crea personaggio' : 'Avanti →';
      // Il bottone dipende sempre dalla validità del passo corrente; all'ultimo
      // passo stepValid() = finaleValid() e il click genera il personaggio (b3).
      nextBtn.disabled = !stepValid();
      nextBtn.classList.toggle('is-disabled', nextBtn.disabled);
    }
    if (footerNoteEl) {
      footerNoteEl.textContent = '';
      footerNoteEl.classList.add('hidden');
    }
  }

  /* ---------- navigazione ---------- */

  function next() {
    if (nextBtn && nextBtn.disabled) {
      return; // passo non valido
    }
    if (stepIndex >= STEPS.length - 1) {
      finishCreation(); // ultimo passo: "Crea personaggio" genera il personaggio
      return;
    }
    stepIndex = Math.min(STEPS.length - 1, stepIndex + 1);
    render();
  }

  function back() {
    if (stepIndex <= 0) {
      close(); // Indietro al passo 0 esce dal wizard e torna alla dashboard
      return;
    }
    stepIndex = Math.max(0, stepIndex - 1);
    render();
  }

  /* ---------- apertura / chiusura ---------- */

  function open() {
    stepIndex = 0;
    customOpenSectionId = 'caratteristiche';
    draft = {
      name: '', speciesId: null, classId: null,
      dragonAncestryId: null, elfLineageId: null, elfSkillId: null,
      goliathGiftId: null, tieflingLegacyId: null, gnomeLineageId: null,
      scoreMethod: 'pointbuy',
      abilities: { FOR: 8, DES: 8, COS: 8, INT: 8, SAG: 8, CAR: 8 },
      profSkills: [],
      backgroundId: null,
      bgBonusMode: '2-1', bgPlus2: null, bgPlus1: null,
      bgTool: '', bgPack: 'a',
      miCantrips: [], miSpells: [],
      customAbilities: [], customFeatId: null, customFeatList: null,
      customSkills: [], customKitBgId: null,
      equip: null, equipForClass: null, masteries: [],
      cantrips: [], preparedSpells: [],
      fightingStyleId: null, expertiseSkills: [],
      alignmentLaw: null, alignmentMorality: null, languages: []
    };
    document.body.classList.remove('in-dashboard');
    document.body.classList.add('in-create');
    render();
  }

  function close() {
    document.body.classList.remove('in-create');
    document.body.classList.add('in-dashboard');
    stepIndex = 0;
  }

  /* ---------- avvio ---------- */

  function init() {
    progressFillEl = document.getElementById('create-progress-fill');
    stepNumEl = document.getElementById('create-step-num');
    stepTitleEl = document.getElementById('create-step-title');
    stepBodyEl = document.getElementById('create-step-body');
    backBtn = document.getElementById('create-back');
    nextBtn = document.getElementById('create-next');
    footerNoteEl = document.getElementById('create-footer-note');
    var cancelBtn = document.getElementById('create-cancel');

    if (!stepBodyEl || !backBtn || !nextBtn) {
      return;
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', close);
    }
    backBtn.addEventListener('click', back);
    nextBtn.addEventListener('click', next);
  }

  window.AppCreate = {
    init: init,
    open: open
  };
})();
