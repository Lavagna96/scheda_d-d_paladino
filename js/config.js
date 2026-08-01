window.APP_CONFIG = {
  STORAGE_KEY: 'tharion-velnar-v2',
  STORAGE_KEY_V1: 'tharion-velnar-sheet',
  INSPIRATION_KEY: 'tharion-insp',

  /* I valori derivati (mod, TS, CD, CA, PF max, risorse…) NON vivono più qui:
     li calcola js/engine.js dai fatti base in DEFAULT_STATE.character.

     Via anche le vecchie costanti globali di Tharion (5.B.3): SPELLS è
     diventata `grimoire.cantrips` + le tabelle `spellsByLevel` di classe e
     sottoclasse nel manuale; STEED conteneva solo un nome di default ormai
     inutile; SWORD_TIERS e FEATURES non le leggeva più nessuno. */






  DEFAULT_STATE: {
    version: 3,
    character: {
      name: 'Tharion Velnar',
      classId: 'paladino',
      subclassId: 'devozione', // aggancia i dati della sottoclasse dal manuale (Step 4.5 / 4.6)
      subclassName: 'Devozione',
      level: 7,
      speciesId: 'dragonide',
      speciesLabel: 'Dragonide d\'Oro',
      dragonAncestryId: 'oro',
      avatar: '✦',
      /* Ritratti di Tharion: stanno nei SUOI default, non più fissi nell'HTML,
         altrimenti ogni personaggio nuovo si apriva con la sua faccia (5.B.3).
         Chi non ha un ritratto mostra l'emblema ✦. */
      portrait: 'avatar.jpg',
      portraitFull: 'avatar-full.jpg',
      abilities: { FOR: 18, DES: 8, COS: 14, INT: 10, SAG: 10, CAR: 16 },
      profSaves: ['SAG', 'CAR'],
      profSkills: ['atletica', 'intimidire', 'persuasione', 'percezione'],
      fightingStyle: 'duello',
      armor: { id: 'piastre', shield: true },
      weapon: { name: 'Spada lunga ✦ (magica)', die: '1d8', type: 'tagl.', mastery: 'Vex' },
      steedSlotLevel: 2,
      initiativeNote: 'vant. iniziativa',
      modifiers: [],
      extraResources: [
        { key: 'shield', max: 1 }
      ],
      items: [], // reliquie/oggetti magici creati dall'utente (Step 3.5) — js/items.js

      /* Scelte di livello (Step 4.6). Non serve migrare uno storico per
         Tharion: i suoi punteggi attuali sono già il risultato finale delle
         scelte fatte finora (mai tracciate), non c'è nulla da ricostruire —
         questi campi partono vuoti e si popolano dal prossimo level-up in poi. */
      feats: [], // talenti presi: [{ id: 'sentinella', level: 4 }, ...] — id da manual.feats
      levelChoices: {} // livello -> scelta fatta lì: { type: 'asi', abilityDeltas: {CAR:2} } oppure { type: 'feat', featId: 'sentinella' }
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
      ],
      /* Trucchetti suoi (non vengono dalla classe: il Paladino non ne ha).
         Stanno qui e non più nella vecchia lista globale SPELLS, così il
         grimorio li mostra a Tharion e a nessun altro (5.B.3). */
      cantrips: ['luce', 'dardo-di-fuoco']
    }
  }
};
