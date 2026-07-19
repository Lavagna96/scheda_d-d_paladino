/*
 * Manuale 5.5 — dati locali (fonte di verità del repo).
 * Riassunti originali in italiano, verificati sul PDF ufficiale del
 * Player's Handbook 2024 — NON testo integrale (copyright).
 *
 * Struttura pensata per l'app multi-personaggio:
 * - spells:  incantesimi condivisi, ogni voce ha i tag `classes`
 * - classes: tratti base + tabelle di progressione (indice = livello, 0 inutilizzato)
 * - species: specie con i tratti riassunti
 * - slotTables: progressioni slot condivise (full/half caster, patto warlock)
 *
 * cloud.js carica tutto su Firestore (manuals/5.5/{spells|classes|species})
 * quando `version` locale è più nuova di quella remota.
 */
window.MANUAL_55 = {
  version: 3,

  slotTables: {
    /* slot per livello di classe: array di slot per livello incantesimo 1..9 */
    full: [null,
      [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
      [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
      [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
      [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
      [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]],
    half: [null,
      [2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3],
      [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3],
      [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
      [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]],
    /* warlock: numero di slot di patto e loro livello */
    pactSlots: [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
    pactSlotLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
  },

  classes: {
    barbaro: {
      name: 'Barbaro', hitDie: 'd12', primaryAbility: 'FOR', saves: ['FOR', 'COS'],
      casterType: 'none',
      rages: [0, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6],
      rageDamage: [0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
      weaponMastery: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
    },
    bardo: {
      name: 'Bardo', hitDie: 'd8', primaryAbility: 'CAR', saves: ['DES', 'CAR'],
      casterType: 'full', spellAbility: 'CAR',
      bardicDie: [null, 'd6', 'd6', 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12', 'd12', 'd12'],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    },
    chierico: {
      name: 'Chierico', hitDie: 'd8', primaryAbility: 'SAG', saves: ['SAG', 'CAR'],
      casterType: 'full', spellAbility: 'SAG',
      channelDivinity: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4],
      cantripsByLevel: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    },
    druido: {
      name: 'Druido', hitDie: 'd8', primaryAbility: 'SAG', saves: ['INT', 'SAG'],
      casterType: 'full', spellAbility: 'SAG',
      wildShape: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    },
    guerriero: {
      name: 'Guerriero', hitDie: 'd10', primaryAbility: 'FOR o DES', saves: ['FOR', 'COS'],
      casterType: 'none',
      secondWind: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      weaponMastery: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6]
    },
    ladro: {
      name: 'Ladro', hitDie: 'd8', primaryAbility: 'DES', saves: ['DES', 'INT'],
      casterType: 'none',
      sneakAttackD6: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]
    },
    mago: {
      name: 'Mago', hitDie: 'd6', primaryAbility: 'INT', saves: ['INT', 'SAG'],
      casterType: 'full', spellAbility: 'INT',
      cantripsByLevel: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    },
    monaco: {
      name: 'Monaco', hitDie: 'd8', primaryAbility: 'DES e SAG', saves: ['FOR', 'DES'],
      casterType: 'none',
      martialArtsDie: [null, 'd6', 'd6', 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12'],
      focusPoints: [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      unarmoredMovementM: [0, 0, 3, 3, 3, 3, 4.5, 4.5, 4.5, 4.5, 6, 6, 6, 6, 7.5, 7.5, 7.5, 7.5, 9, 9, 9]
    },
    paladino: {
      name: 'Paladino', hitDie: 'd10', primaryAbility: 'FOR e CAR', saves: ['SAG', 'CAR'],
      casterType: 'half', spellAbility: 'CAR',
      channelDivinity: [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]
    },
    ranger: {
      name: 'Ranger', hitDie: 'd10', primaryAbility: 'DES e SAG', saves: ['FOR', 'DES'],
      casterType: 'half', spellAbility: 'SAG',
      favoredEnemy: [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]
    },
    stregone: {
      name: 'Stregone', hitDie: 'd6', primaryAbility: 'CAR', saves: ['COS', 'CAR'],
      casterType: 'full', spellAbility: 'CAR',
      sorceryPoints: [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      cantripsByLevel: [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      preparedByLevel: [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
    },
    warlock: {
      name: 'Warlock', hitDie: 'd8', primaryAbility: 'CAR', saves: ['SAG', 'CAR'],
      casterType: 'pact', spellAbility: 'CAR',
      invocations: [0, 1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
    }
  },

  species: {
    aasimar: {
      name: 'Aasimar', size: 'Media o Piccola', speedM: 9,
      traits: [
        { name: 'Resistenza Celestiale', desc: 'Resistenza ai danni necrotici e radiosi.' },
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Mani Guaritrici', desc: 'Azione Magica: una creatura toccata recupera un numero di d4 pari al tuo bonus di competenza. 1/riposo lungo.' },
        { name: 'Portatore di Luce', desc: 'Conosci il trucchetto Luce (Carisma come caratteristica).' },
        { name: 'Rivelazione Celestiale', desc: 'Dal livello 3, azione bonus: trasformazione per 1 minuto (1/riposo lungo) a scelta tra Ali Celesti (volo pari alla velocità), Radiosità Interiore (luce e danni radiosi pari al bonus di competenza a chi è entro 3 m) o Sudario Necrotico (TS Carisma o Spaventato). 1 volta per turno infliggi danni extra pari al bonus di competenza.' }
      ]
    },
    dragonide: {
      name: 'Dragonide', size: 'Media', speedM: 9,
      traits: [
        { name: 'Ascendenza Draconica', desc: 'Scegli il drago progenitore: determina il tipo di danno di soffio e resistenza (es. Oro = fuoco).' },
        { name: 'Soffio', desc: 'Sostituisce un attacco dell\'azione Attacco: cono di 4,5 m o linea di 9 m; TS Destrezza (CD 8 + mod. Cos + bonus competenza), 1d10 danni del tipo dell\'ascendenza (2d10 al livello 5, 3d10 all\'11, 4d10 al 17), dimezzati se superato. Usi pari al bonus di competenza per riposo lungo.' },
        { name: 'Resistenza al Danno', desc: 'Resistenza al tipo di danno della tua ascendenza.' },
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Volo Draconico', desc: 'Dal livello 5, azione bonus: ali spettrali per 10 minuti, velocità di volo pari alla velocità. 1/riposo lungo.' }
      ]
    },
    elfo: {
      name: 'Elfo', size: 'Media', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Retaggio Elfico', desc: 'Scegli Drow (Luci Danzanti; scurovisione 36 m), Elfo Alto (Prestidigitazione, sostituibile a ogni riposo lungo) o Elfo dei Boschi (velocità 10,5 m; Druidismo). Ai livelli 3 e 5 impari un incantesimo sempre preparato, con 1 lancio gratis per riposo lungo.' },
        { name: 'Ascendenza Fatata', desc: 'Vantaggio ai TS per evitare o terminare Affascinato.' },
        { name: 'Sensi Acuti', desc: 'Competenza in Intuizione, Percezione o Sopravvivenza.' },
        { name: 'Trance', desc: 'Non dormi e la magia non può addormentarti; riposo lungo in 4 ore di meditazione.' }
      ]
    },
    gnomo: {
      name: 'Gnomo', size: 'Piccola', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Astuzia Gnomesca', desc: 'Vantaggio ai TS di Intelligenza, Saggezza e Carisma.' },
        { name: 'Retaggio Gnomesco', desc: 'Gnomo dei Boschi: Illusione Minore e Parlare con gli Animali sempre preparato (lanci gratis pari al bonus di competenza per riposo lungo). Gnomo delle Rocce: Riparare e Prestidigitazione, con cui crei piccoli congegni a orologeria (max 3).' }
      ]
    },
    goliath: {
      name: 'Goliath', size: 'Media (2,1–2,4 m)', speedM: 10.5,
      traits: [
        { name: 'Ascendenza dei Giganti', desc: 'Scegli un dono (usi pari al bonus di competenza per riposo lungo): Nube (teletrasporto 9 m, az. bonus), Fuoco (+1d10 fuoco a un colpo), Gelo (+1d6 freddo e −3 m di velocità), Colle (Prono a creatura Grande o inferiore colpita), Pietra (reazione: riduci il danno subito di 1d12 + mod. Cos), Tempesta (reazione: 1d8 tuono a chi ti danneggia entro 18 m).' },
        { name: 'Forma Grande', desc: 'Dal livello 5, azione bonus: diventi Grande per 10 minuti, vantaggio alle prove di Forza e +3 m di velocità. 1/riposo lungo.' },
        { name: 'Costituzione Possente', desc: 'Vantaggio ai TS per terminare Afferrato; conti come una taglia più grande per la capacità di carico.' }
      ]
    },
    halfling: {
      name: 'Halfling', size: 'Piccola', speedM: 9,
      traits: [
        { name: 'Coraggioso', desc: 'Vantaggio ai TS per evitare o terminare Spaventato.' },
        { name: 'Agilità Halfling', desc: 'Puoi muoverti nello spazio di creature di taglia superiore alla tua (senza fermartici).' },
        { name: 'Fortuna', desc: 'Quando esce 1 sul d20 di un D20 Test, ripeti il tiro e usa il nuovo risultato.' },
        { name: 'Furtività Naturale', desc: 'Puoi Nasconderti anche quando sei oscurato solo da una creatura di almeno una taglia più grande.' }
      ]
    },
    nano: {
      name: 'Nano', size: 'Media', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '36 metri.' },
        { name: 'Resilienza Nanica', desc: 'Resistenza ai danni da veleno e vantaggio ai TS per evitare o terminare Avvelenato.' },
        { name: 'Robustezza Nanica', desc: '+1 PF massimi, e +1 di nuovo a ogni livello.' },
        { name: 'Conoscenza della Pietra', desc: 'Azione bonus: Percezione Tellurica 18 m per 10 minuti mentre sei su pietra. Usi pari al bonus di competenza per riposo lungo.' }
      ]
    },
    orco: {
      name: 'Orco', size: 'Media', speedM: 9,
      traits: [
        { name: 'Scarica di Adrenalina', desc: 'Scatto come azione bonus, con PF temporanei pari al bonus di competenza. Usi pari al bonus di competenza per riposo breve o lungo.' },
        { name: 'Scurovisione', desc: '36 metri.' },
        { name: 'Tenacia Implacabile', desc: 'Quando scendi a 0 PF senza essere ucciso sul colpo, resti invece a 1 PF. 1/riposo lungo.' }
      ]
    },
    tiefling: {
      name: 'Tiefling', size: 'Media o Piccola', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Retaggio Infernale', desc: 'Scegli Abissale, Ctonio o Infernale: un trucchetto al livello 1, poi ai livelli 3 e 5 un incantesimo sempre preparato con 1 lancio gratis per riposo lungo.' },
        { name: 'Presenza Ultraterrena', desc: 'Conosci il trucchetto Taumaturgia.' }
      ]
    },
    umano: {
      name: 'Umano', size: 'Media o Piccola', speedM: 9,
      traits: [
        { name: 'Pieno di Risorse', desc: 'Ottieni Ispirazione Eroica a ogni riposo lungo.' },
        { name: 'Abile', desc: 'Competenza in un\'abilità a scelta.' },
        { name: 'Versatile', desc: 'Un talento di Origine a scelta.' }
      ]
    }
  },

  spells: [
    /* ===== 1° livello ===== */
    { id: 'benedizione', name: 'Benedizione', level: 1, school: 'Incantamento',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M',
      desc: 'Fino a 3 creature aggiungono 1d4 ai tiri per colpire e ai tiri salvezza finché dura. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'comando', name: 'Comando', level: 1, school: 'Incantamento',
      classes: ['paladino', 'bardo', 'chierico'],
      meta: 'Azione · 18 m · 1 round · V',
      desc: 'Un nemico che capisca una lingua fa TS Saggezza: se fallisce esegue un comando di una parola per il suo prossimo turno. Comandi tipici: Avanzare, Cadere, Fuggi, Rannicchiati, Vieni. Niente concentrazione. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'cura-ferite', name: 'Cura Ferite', level: 1, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · Tocco · Istantaneo · V, S',
      desc: 'La creatura toccata recupera 2d8 + mod. da incantatore PF. La cura aumenta di 2d8 per ogni slot oltre il 1°.' },
    { id: 'duello-obbligato', name: 'Duello Obbligato', level: 1, school: 'Incantamento',
      classes: ['paladino'],
      meta: 'Azione bonus · 9 m · 1 min CONC · V',
      desc: 'Una creatura fa TS Saggezza: se fallisce ha svantaggio agli attacchi contro chiunque non sia te e non può allontanarsi volontariamente oltre 9 m da te. Termina se attacchi un\'altra creatura o se un tuo alleato attacca o danneggia il bersaglio.' },
    { id: 'eroismo', name: 'Eroismo', level: 1, school: 'Incantamento',
      classes: ['paladino', 'bardo'],
      meta: 'Azione · Tocco · 1 min CONC · V, S',
      desc: 'Una creatura volontaria è immune a Spaventato e all\'inizio di ogni suo turno ottiene PF temporanei pari al tuo mod. da incantatore. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'favore-divino', name: 'Favore Divino', level: 1, school: 'Trasmutazione',
      classes: ['paladino'],
      meta: 'Azione bonus · Sé · 1 min · V, S',
      desc: 'I tuoi attacchi con arma infliggono +1d4 danni radiosi per tutta la durata. Niente concentrazione.' },
    { id: 'individuazione-bene-male', name: 'Individuazione del Bene e del Male', level: 1, school: 'Divinazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé · 10 min CONC · V, S',
      desc: 'Percepisci la presenza e la posizione di Aberrazioni, Celestiali, Elementali, Folletti, Immondi e Non Morti entro 9 m, e di luoghi consacrati o profanati.' },
    { id: 'individuazione-magico', name: 'Individuazione del Magico', level: 1, school: 'Divinazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · 10 min CONC · V, S · Rituale',
      desc: 'Percepisci la presenza di magia entro 9 m. Con un\'azione vedi l\'aura attorno a creature od oggetti magici e ne apprendi la scuola.' },
    { id: 'individuazione-veleni', name: 'Individuazione di Veleni e Malattie', level: 1, school: 'Divinazione',
      classes: ['paladino', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · Sé · 10 min CONC · V, S, M · Rituale',
      desc: 'Percepisci la presenza e la posizione di veleni, creature velenose e malattie entro 9 m, e ne identifichi il tipo.' },
    { id: 'protezione-mal-bene', name: 'Protezione dal Male e dal Bene', level: 1, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'mago'],
      meta: 'Azione · Tocco · 10 min CONC · V, S, M (acqua santa, consumata)',
      desc: 'Una creatura volontaria è protetta da Aberrazioni, Celestiali, Elementali, Folletti, Immondi e Non Morti: questi hanno svantaggio ad attaccarla, e lei non può essere posseduta né resa Affascinata o Spaventata da loro (vantaggio ai TS se già soggetta).' },
    { id: 'punizione-ardente', name: 'Punizione Ardente', level: 1, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · 1 min · V',
      desc: '+1d6 fuoco al colpo. Poi a inizio di ogni suo turno il bersaglio subisce 1d6 fuoco e fa TS Costituzione: se riesce, l\'incantesimo termina. Non richiede concentrazione. +1d6 per ogni slot oltre il 1°.' },
    { id: 'punizione-collerica', name: 'Punizione Collerica', level: 1, school: 'Negromanzia',
      classes: ['paladino'],
      meta: 'Az. bonus subito dopo aver colpito · Sé · 1 min · V',
      desc: '+1d6 necrotico al colpo. Il bersaglio fa TS Saggezza: se fallisce è Spaventato da te per tutta la durata (ripete il TS a fine di ogni suo turno). Nessuna concentrazione.' },
    { id: 'punizione-divina', name: 'Punizione Divina', level: 1, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · Istantaneo · V',
      desc: 'Il bersaglio subisce 2d8 radiosi extra dal colpo; +1d8 contro Immondi e Non Morti. +1d8 per ogni slot oltre il 1°.' },
    { id: 'punizione-tonante', name: 'Punizione Tonante', level: 1, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · Istantaneo · V',
      desc: '+2d6 tuono al colpo, udibile a 90 m. Il bersaglio fa TS Forza: se fallisce è spinto di 3 m e cade Prono. +1d6 per ogni slot oltre il 1°.' },
    { id: 'purificare-cibo', name: 'Purificare Cibo e Bevande', level: 1, school: 'Trasmutazione',
      classes: ['paladino', 'chierico', 'druido'],
      meta: 'Azione · 3 m · Istantaneo · V, S · Rituale',
      desc: 'Cibo e bevande non magici in una sfera di 1,5 m di raggio vengono purificati da veleni e malattie.' },
    { id: 'scudo-della-fede', name: 'Scudo della Fede', level: 1, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione bonus · 18 m · 10 min CONC · V, S, M',
      desc: 'Una creatura a scelta entro gittata ottiene +2 alla CA per tutta la durata.' },

    /* ===== 2° livello ===== */
    { id: 'aiuto', name: 'Aiuto', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · 9 m · 8 ore · V, S, M',
      desc: 'Fino a 3 creature: i PF massimi e attuali aumentano di 5 per la durata. Con slot superiori, +5 per ogni livello oltre il 2°.' },
    { id: 'arma-magica', name: 'Arma Magica', level: 2, school: 'Trasmutazione',
      classes: ['paladino', 'ranger', 'mago'],
      meta: 'Azione bonus · Tocco · 1 ora · V, S',
      desc: 'Un\'arma non magica diventa magica con +1 ai tiri per colpire e ai danni. Niente concentrazione. Con slot di 4° o superiore il bonus diventa +2.' },
    { id: 'individuazione-oggetto', name: 'Individuazione d\'Oggetto', level: 2, school: 'Divinazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'mago'],
      meta: 'Azione · Sé · 10 min CONC · V, S, M',
      desc: 'Percepisci la direzione di un oggetto che ti è familiare entro 300 m, anche in movimento. Bloccato da uno strato di piombo.' },
    { id: 'preghiera-guarigione', name: 'Preghiera di Guarigione', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: '10 minuti · 9 m · Istantaneo · V',
      desc: 'Fino a 5 creature recuperano 2d8 + mod. da incantatore PF e ottengono i benefici di un riposo breve. Una creatura non può beneficiarne di nuovo prima di un riposo lungo. +1d8 per ogni slot oltre il 2°.' },
    { id: 'protezione-veleno', name: 'Protezione dal Veleno', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · Tocco · 1 ora · V, S',
      desc: 'Neutralizzi un veleno presente nella creatura toccata. Per la durata ha vantaggio ai TS contro l\'Avvelenamento e resistenza ai danni da veleno.' },
    { id: 'punizione-radiosa', name: 'Punizione Radiosa', level: 2, school: 'Trasmutazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · 1 min CONC · V',
      desc: '+2d8 radiosi al colpo. Il bersaglio emana luce intensa: tutti gli attacchi contro di esso hanno vantaggio automatico. Quando l\'incantesimo termina, il bersaglio subisce altri 2d8 radiosi. +1d8 per ogni slot oltre il 2°.' },
    { id: 'quiete-perpetua', name: 'Quiete Perpetua', level: 2, school: 'Negromanzia',
      classes: ['paladino', 'chierico', 'mago'],
      meta: 'Azione · Tocco · 10 giorni · V, S, M · Rituale',
      desc: 'Un cadavere toccato non si decompone e non può diventare Non Morto per la durata. Prolunga il tempo utile per riportarlo in vita.' },
    { id: 'ristorare-inferiore', name: 'Ristorare Inferiore', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger'],
      meta: 'Azione bonus · Tocco · Istantaneo · V, S',
      desc: 'Rimuovi dalla creatura toccata una condizione tra: Accecato, Assordato, Paralizzato o Avvelenato.' },
    { id: 'trova-destriero', name: 'Trova Destriero', level: 2, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Evochi un destriero ultraterreno fedele (Grande e cavalcabile). Scegli il tipo: Celestiale, Folletto o Immondo. Sostituisce un destriero precedente.' },
    { id: 'vincolo-custodia', name: 'Vincolo di Custodia', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (due anelli)',
      desc: 'Leghi una creatura volontaria a te: finché resta entro 18 m ha +1 alla CA e ai TS e resistenza a tutti i danni, ma tu subisci un ammontare di danni pari a quelli che subisce lei.' },
    { id: 'zona-di-verita', name: 'Zona di Verità', level: 2, school: 'Incantamento',
      classes: ['paladino', 'bardo', 'chierico'],
      meta: 'Azione · 18 m · 10 min · V, S',
      desc: 'Sfera di raggio 4,5 m. Chi entra o inizia il turno nell\'area fa TS Carisma: se fallisce non può mentire deliberatamente. Sai chi supera o fallisce il tiro.' },

    /* ===== 3° livello ===== */
    { id: 'arma-elementale', name: 'Arma Elementale', level: 3, school: 'Trasmutazione',
      classes: ['paladino', 'druido', 'ranger'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S',
      desc: 'Un\'arma diventa magica: +1 ai tiri per colpire e +1d4 danni a scelta tra acido, freddo, fulmine, fuoco o tuono. Con slot di 5°-6°: +2 e +2d4.' },
    { id: 'aura-vitalita', name: 'Aura di Vitalità', level: 3, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'druido'],
      meta: 'Azione · Sé (aura 9 m) · 1 min CONC · V',
      desc: 'Per la durata, con un\'azione bonus una creatura a scelta nell\'aura (anche tu) recupera 2d6 PF.' },
    { id: 'cerchio-magico', name: 'Cerchio Magico', level: 3, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'warlock', 'mago'],
      meta: '1 minuto · 3 m · 1 ora · V, S, M (consumato)',
      desc: 'Cilindro di 3 m di raggio. Scegli uno o più tipi tra Celestiali, Elementali, Folletti, Immondi e Non Morti: non possono entrarci con mezzi non magici, hanno svantaggio agli attacchi contro chi sta dentro e non possono affascinare, spaventare o possedere chi è nel cerchio.' },
    { id: 'creare-cibo-acqua', name: 'Creare Cibo e Acqua', level: 3, school: 'Evocazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Crei cibo (insipido ma nutriente) e acqua sufficienti a sfamare 15 umanoidi o 5 destrieri per 24 ore.' },
    { id: 'dissolvi-magie', name: 'Dissolvi Magie', level: 3, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Termina gli incantesimi di 3° livello o inferiore su un bersaglio a scelta. Per ogni incantesimo di livello superiore, prova di caratteristica da incantatore CD 10 + livello dell\'incantesimo.' },
    { id: 'luce-diurna', name: 'Luce Diurna', level: 3, school: 'Evocazione',
      classes: ['paladino', 'chierico', 'druido', 'ranger', 'stregone'],
      meta: 'Azione · 18 m · 1 ora · V, S',
      desc: 'Sfera di luce intensa di 18 m di raggio (+18 m di luce fioca) da un punto o un oggetto. Dissolve l\'oscurità magica creata da incantesimi di 3° o inferiore.' },
    { id: 'punizione-accecante', name: 'Punizione Accecante', level: 3, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · Istantaneo · V',
      desc: '+3d8 radiosi al colpo. Il bersaglio fa TS Costituzione: se fallisce è Accecato per 1 minuto (ripete il TS a fine di ogni suo turno). +1d8 per ogni slot oltre il 3°.' },
    { id: 'rimuovere-maledizione', name: 'Rimuovere Maledizione', level: 3, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'warlock', 'mago'],
      meta: 'Azione · Tocco · Istantaneo · V, S',
      desc: 'Tutte le maledizioni sulla creatura toccata terminano. Su un oggetto maledetto, spezza il vincolo con il proprietario (la maledizione dell\'oggetto resta).' },
    { id: 'rianimare', name: 'Rianimare', level: 3, school: 'Negromanzia',
      classes: ['paladino', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (diamanti da 300 MO, consumati)',
      desc: 'Una creatura morta da non più di 1 minuto torna in vita con 1 PF. Non funziona su chi è morto di vecchiaia e non rigenera parti del corpo mancanti.' },

    /* ===== 4° livello ===== */
    { id: 'aura-purezza', name: 'Aura di Purezza', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé (aura 9 m) · 10 min CONC · V',
      desc: 'Gli alleati nell\'aura non possono essere Avvelenati, hanno resistenza ai danni da veleno e vantaggio ai TS contro Accecato, Assordato, Affascinato, Paralizzato, Pietrificato, Spaventato e Stordito.' },
    { id: 'aura-vita', name: 'Aura di Vita', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé (aura 9 m) · 10 min CONC · V',
      desc: 'Gli alleati nell\'aura hanno resistenza ai danni necrotici e i loro PF massimi non possono essere ridotti. Chi inizia il turno nell\'aura con 0 PF recupera 1 PF.' },
    { id: 'esilio', name: 'Esilio', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M',
      desc: 'Il bersaglio fa TS Carisma: se fallisce è esiliato in un semipiano innocuo, Inabile. Se è nativo di un altro piano e resti concentrato per l\'intera durata, non torna. +1 bersaglio per ogni slot oltre il 4°.' },
    { id: 'individuazione-creature', name: 'Individuazione di Creature', level: 4, school: 'Divinazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'mago'],
      meta: 'Azione · Sé · 1 ora CONC · V, S',
      desc: 'Percepisci la direzione di una creatura che ti è familiare entro 300 m, anche in movimento. Bloccato dall\'acqua corrente.' },
    { id: 'interdizione-morte', name: 'Interdizione alla Morte', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Tocco · 8 ore · V, S',
      desc: 'La prima volta che il bersaglio scenderebbe a 0 PF, resta invece a 1 PF e l\'incantesimo termina. Annulla anche un effetto che ucciderebbe all\'istante senza infliggere danni.' },
    { id: 'punizione-sbalorditiva', name: 'Punizione Sbalorditiva', level: 4, school: 'Incantamento',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · Istantaneo · V',
      desc: '+4d6 psichici al colpo. Il bersaglio fa TS Saggezza: se fallisce è Stordito fino alla fine del tuo prossimo turno. +1d6 per ogni slot oltre il 4°.' },

    /* ===== 5° livello ===== */
    { id: 'cerchio-potere', name: 'Cerchio di Potere', level: 5, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'mago'],
      meta: 'Azione · Sé (aura 9 m) · 10 min CONC · V',
      desc: 'Tu e gli alleati nell\'aura avete vantaggio ai TS contro incantesimi ed effetti magici; quando un TS riuscito dimezzerebbe il danno, lo annulla del tutto.' },
    { id: 'dissolvi-bene-male', name: 'Dissolvi il Bene e il Male', level: 5, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé · 1 min CONC · V, S, M',
      desc: 'Celestiali, Elementali, Folletti, Immondi e Non Morti hanno svantaggio agli attacchi contro di te. Puoi terminare l\'incantesimo per interrompere una possessione (Spezzare Incantamento) o rimandare la creatura al suo piano (Congedo, TS Carisma).' },
    { id: 'evoca-celestiale', name: 'Evoca Celestiale', level: 5, school: 'Evocazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (400 MO)',
      desc: 'Evochi uno spirito celestiale (forma di vendicatore o difensore) che agisce subito dopo di te e obbedisce ai tuoi ordini. Più potente con slot superiori.' },
    { id: 'geas', name: 'Geas', level: 5, school: 'Incantamento',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'mago'],
      meta: '1 minuto · 18 m · 30 giorni · V',
      desc: 'La creatura fa TS Saggezza: se fallisce è vincolata magicamente a un tuo comando. Subisce 5d10 psichici (max 1 volta al giorno) quando agisce in modo contrario alle tue istruzioni.' },
    { id: 'onda-distruttiva', name: 'Onda Distruttiva', level: 5, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione · Sé (raggio 9 m) · Istantaneo · V',
      desc: 'Energia divina esplode da te: le creature a scelta entro 9 m fanno TS Costituzione; se falliscono subiscono 5d6 tuono + 5d6 radiosi e cadono Prone (metà danni e niente Prono se superano).' },
    { id: 'punizione-esiliante', name: 'Punizione Esiliante', level: 5, school: 'Evocazione',
      classes: ['paladino'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · 1 min CONC · V',
      desc: '+5d10 forza al colpo. Se il colpo porta il bersaglio a meno di 50 PF, è esiliato in un semipiano innocuo (Inabile) finché ti concentri; se nativo di un altro piano, non torna.' },
    { id: 'ristorare-superiore', name: 'Ristorare Superiore', level: 5, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (polvere di diamante da 100 MO, consumata)',
      desc: 'Riduci di 1 il livello di Indebolimento della creatura toccata, oppure termina un effetto tra: Affascinato o Pietrificato, una maledizione (incluso il vincolo con un oggetto maledetto), una riduzione dei PF massimi o di un punteggio di caratteristica.' },
    { id: 'rianimare-morti', name: 'Rianimare Morti', level: 5, school: 'Negromanzia',
      classes: ['paladino', 'bardo', 'chierico'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (diamante da 500 MO, consumato)',
      desc: 'Riporta in vita una creatura morta da non più di 10 giorni con 1 PF. L\'anima deve essere libera e disposta a tornare. Malus −4 a tiri e TS che si riduce a ogni riposo lungo.' }
  ]
};
