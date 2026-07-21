window.APP_CONFIG = {
  STORAGE_KEY: 'tharion-velnar-v2',
  STORAGE_KEY_V1: 'tharion-velnar-sheet',
  INSPIRATION_KEY: 'tharion-insp',

  /* I valori derivati (mod, TS, CD, CA, PF max, risorse…) NON vivono più qui:
     li calcola js/engine.js dai fatti base in DEFAULT_STATE.character. */

  STEED: {
    defaultName: 'Destriero Ultraterreno',
    ac: 12,
    speed: '18 m',
    prof: '+3',
    abilities: [
      { name: 'FOR', mod: '+4', score: 18 },
      { name: 'DES', mod: '+1', score: 12 },
      { name: 'COS', mod: '+2', score: 14 },
      { name: 'INT', mod: '−2', score: 6 },
      { name: 'SAG', mod: '+1', score: 12 },
      { name: 'CAR', mod: '−1', score: 8 }
    ],
    actions: [
      {
        title: 'Schianto Ultraterreno',
        summary: 'Azione · +7 al colpire · 1d8+2 danni',
        detail: 'Schianto Ultraterreno (azione): +7 al colpire (tuo mod. d\'attacco incantesimi), portata 1,5 m, 1d8+2 danni (tipo secondo la forma). Con slot più alti: Schianto = 1d8 + livello slot.'
      },
      {
        title: 'Legame Vitale',
        summary: 'Cura condivisa · iniziativa condivisa',
        detail: 'Quando recuperi PF da un incantesimo (liv. 1+) e il destriero è entro 1,5 m, recupera i tuoi stessi PF. Combattimento: condivide la tua iniziativa, è una cavalcatura controllata. Scompare a 0 PF o se muori.'
      }
    ],
    forms: [
      {
        name: 'Celestiale',
        tag: 'Radioso',
        tagClass: 'g',
        detail: 'Tocco Guaritore (az. bonus, ricarica: riposo lungo): una creatura entro 1,5 m recupera 2d8+2 PF.'
      },
      {
        name: 'Folletto (Fey)',
        tag: 'Psichico',
        tagClass: '',
        detail: 'Passo Fatato (az. bonus, ricarica: riposo lungo): il destriero si teletrasporta (con te in sella) in uno spazio libero entro 18 m.'
      },
      {
        name: 'Immondo (Fiend)',
        tag: 'Necrotico',
        tagClass: 'c',
        detail: 'Sguardo Maligno (az. bonus, ricarica: riposo lungo): una creatura entro 18 m fa TS Saggezza CD 15 o è Spaventata fino alla fine del tuo prossimo turno.'
      }
    ],
    note: 'PP 11 · Telepatia con te (1,6 km). Volo 18 m solo con slot di 4°+. Con slot più alti: CA = 10 + livello slot · PF max = 5 + 10 × livello.'
  },

  SWORD_TIERS: [
    {
      level: 'Livello I',
      name: 'Sentinella',
      active: true,
      text: 'La lama si illumina quando ti trovi vicino alle Vesti Purpuree. Allarme e rivelatore della loro presenza.'
    },
    {
      level: 'Livello II',
      name: 'Ascesa',
      active: true,
      text: '+1 a incantesimi (colpire e CD) · +1 a colpire · +1 ai danni. Vantaggio ai TS per resistere a Spaventato, essere gettato Prono o Spinto.'
    }
  ],

  FEATURES: [
    {
      title: 'Aura di Protezione',
      tag: '3 m',
      tagClass: 'g',
      detail: 'Tu e gli alleati nell\'aura +3 (CAR) a tutti i TS.'
    },
    {
      title: 'Aura di Devozione',
      tag: '3 m',
      tagClass: 'g',
      detail: 'Tu e gli alleati nell\'aura siete immuni ad Affascinato.'
    },
    {
      title: 'Destriero Fedele',
      detail: 'Trova Destriero sempre preparata; 1 lancio gratis/riposo lungo.'
    },
    {
      title: 'Maestria nelle Armi',
      detail: 'Vex (spada) e Rallentare (giavellotto).'
    },
    {
      title: 'Soffio (Fuoco)',
      tag: '3 usi/rip. lungo',
      tagClass: 'c',
      detail: 'In sostituzione di un attacco: cono 4,5 m o linea 9 m. TS DES CD 13, 2d10 fuoco (metà se supera).'
    },
    {
      title: 'Resistenza al Danno',
      detail: 'Resistenza ai danni da Fuoco.'
    },
    {
      title: 'Volo Draconico',
      tag: '1/rip. lungo',
      tagClass: 'c',
      detail: 'Az. bonus: ali spettrali, velocità di volo 9 m per 10 min.'
    },
    {
      title: 'Scurovisione',
      detail: '18 metri.'
    },
    {
      title: 'Arma Sacra',
      tag: 'azione attacco',
      tagClass: 'g',
      detail: 'Per 10 min aggiungi +3 (CAR) al colpire con un\'arma da mischia e infliggi danni Radiosi a scelta; emana luce intensa (6 m).'
    },
    {
      title: 'Percezione Divina',
      tag: 'azione bonus',
      detail: 'Per 10 min localizzi Celestiali, Immondi e Non Morti entro 18 m e luoghi consacrati/profanati.'
    }
  ],

  SPELLS: [
    { id: 'luce', name: 'Luce', level: 0, school: 'Evocazione', always: true,
      meta: 'Azione · Tocco · 1 ora · V, M',
      desc: 'Un oggetto toccato (max 3 m di lato) emette luce intensa in un raggio di 6 m e luce fioca per altri 6 m. Colore a scelta. Se l\'oggetto è tenuto o indossato da una creatura ostile, questa lo evita con un TS Destrezza. A volontà, senza slot.' },
    { id: 'dardo-di-fuoco', name: 'Dardo di Fuoco (Fire Bolt)', level: 0, school: 'Evocazione', always: true,
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Scagli un dardo di fiamma: attacco con incantesimo a distanza, 2d10 danni da fuoco (al tuo livello). Un oggetto infiammabile colpito prende fuoco se non è indossato o trasportato. A volontà, senza slot.' },
    { id: 'punizione-divina', name: 'Punizione Divina', level: 1, school: 'Evocazione', always: true,
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · Istantaneo · V',
      desc: 'Il bersaglio subisce 2d8 radiosi extra dal colpo; +1d8 contro Immondi e Non Morti. Con slot di 2° livello diventa 3d8. Gratis 1 volta a riposo lungo senza spendere slot.' },
    { id: 'protezione-mal-bene', name: 'Protezione dal Male e dal Bene', level: 1, school: 'Abiurazione', always: true,
      meta: 'Azione · Tocco · 10 min CONC · V, S, M (acqua santa, consumata)',
      desc: 'Una creatura volontaria è protetta da Aberrazioni, Celestiali, Elementali, Folletti, Immondi e Non Morti: questi hanno svantaggio ad attaccarla, e lei non può essere posseduta né resa Affascinata o Spaventata da loro (vantaggio ai TS se già soggetta).' },
    { id: 'scudo-della-fede', name: 'Scudo della Fede', level: 1, school: 'Abiurazione', always: true,
      meta: 'Azione bonus · 18 m · 10 min CONC · V, S, M',
      desc: 'Una creatura a scelta entro gittata ottiene +2 alla CA per tutta la durata.' },
    { id: 'trova-destriero', name: 'Trova Destriero', level: 2, school: 'Evocazione', always: true,
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Evochi un destriero ultraterreno fedele (Grande e cavalcabile). Scegli il tipo: Celestiale, Folletto o Immondo. Sostituisce un destriero precedente. Gratis 1/riposo lungo.' },
    { id: 'aiuto', name: 'Aiuto', level: 2, school: 'Abiurazione', always: true,
      meta: 'Azione · 9 m · 8 ore · V, S, M',
      desc: 'Fino a 3 creature: i PF massimi e attuali aumentano di 5 per la durata. Con slot superiori, +5 per ogni livello oltre il 2°.' },
    { id: 'zona-di-verita', name: 'Zona di Verità', level: 2, school: 'Incantamento', always: true,
      meta: 'Azione · 18 m · 10 min · V, S',
      desc: 'Sfera di raggio 4,5 m. Chi entra o inizia il turno nell\'area fa TS Carisma (CD 15): se fallisce non può mentire deliberatamente. Sai chi supera o fallisce il tiro.' }
  ],

  DEFAULT_STATE: {
    version: 3,
    character: {
      name: 'Tharion Velnar',
      classId: 'paladino',
      subclassName: 'Devozione',
      level: 7,
      speciesId: 'dragonide',
      speciesLabel: 'Dragonide d\'Oro',
      avatar: '✦',
      abilities: { FOR: 18, DES: 8, COS: 14, INT: 10, SAG: 10, CAR: 16 },
      profSaves: ['SAG', 'CAR'],
      profSkills: ['atletica', 'intimidire', 'persuasione', 'percezione'],
      fightingStyle: 'duello',
      armor: { id: 'piastre', shield: true },
      weapon: { name: 'Spada lunga ✦ (magica)', die: '1d8', type: 'tagl.', mastery: 'Vex' },
      steedSlotLevel: 2,
      initiativeNote: 'vant. iniziativa',
      modifiers: [
        { source: 'Lama Vincolante — Ascesa (Liv. II)', target: 'attacco', value: 1 },
        { source: 'Lama Vincolante — Ascesa (Liv. II)', target: 'danni', value: 1 },
        { source: 'Lama Vincolante — Ascesa (Liv. II)', target: 'cd-inc', value: 1 },
        { source: 'Lama Vincolante — Ascesa (Liv. II)', target: 'att-inc', value: 1 }
      ],
      extraResources: [
        { key: 'shield', max: 1 }
      ],
      items: [] // reliquie/oggetti magici creati dall'utente (Step 3.5) — js/items.js
    },
    pools: { loh: 35, hp: 60, steedhp: 25, tempHp: 0 },
    spent: {},
    coins: { mp: 10, mo: 4696, ma: 250, mr: 928 },
    steed: { name: 'Destriero Ultraterreno' },
    treasury: {
      carryMax: 280,
      partyItems: [
        { name: 'Statuetta — testa di drago nero', desc: "Oggetto d'arte; valore da stimare/vendere.", qty: 1, weight: 2 },
        { name: 'Rotolo di velluto', desc: 'Stoffa pregiata da rivendere.', qty: 25, weight: 0.5 },
        { name: 'Gemma piccola e chiara', desc: '1 pietra limpida; valore da stimare.', qty: 1, weight: 0.1 },
        { name: 'Tesoro della cassa (culto del drago)', desc: '≈ 3.000 MO di valore complessivo.', qty: 1, weight: 15 },
        { name: 'Tunica del Mago Rosso di Thay', desc: 'Scuola di Invocazione (effetto da confermare col Master).', qty: 1, weight: 1 }
      ],
      personalItems: [
        { name: 'Pozione di Cura', desc: 'Recupera 2d4+2 PF', qty: 1, weight: 0.5 }
      ]
    },
    diary: {
      sessions: [],
      png: [],
      quests: { active: [], completed: [] }
    },
    inspiration: false,
    deathSaves: { success: 0, fail: 0 },
    grimoire: {
      prepared: [
        'benedizione', 'cura-ferite', 'comando', 'punizione-collerica',
        'punizione-ardente', 'punizione-radiosa', 'ristorare-inferiore'
      ]
    }
  }
};
