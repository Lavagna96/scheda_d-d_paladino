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
  version: 48,

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
      weaponMastery: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      // Un solo Attacco Extra per tutta la progressione (mai un 3° colpo): stessa
      // tabella generica letta da stats.js per il Guerriero, che invece scala.
      extraAttacks: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      weaponProf: ['sem', 'gue'],
      unarmoredDefense: 'COS', // CA senza armatura = 10 + DES + COS (Blocco 5.A.2)
      /* Equipaggiamento iniziale (PHB, opzioni A e B). Niente armatura: il
         Barbaro usa la Difesa senza Armatura, ed è addestrato solo a leggere e
         medie. */
      startingEquipment: {
        a: {
          label: 'Kit del barbaro',
          armorId: '', shield: false, weaponId: 'ascia-bipenne',
          extra: [
            { name: 'Ascia da lancio', qty: 4, weaponId: 'ascia-da-lancio' },
            { name: 'Kit dell\'esploratore', qty: 1, weight: 55, desc: 'Zaino, giaciglio, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 15 }
        },
        b: { label: '75 monete d\'oro', coins: { mo: 75 } }
      },
      classResources: {
        furia: { name: 'Furia', kind: 'uses', byLevelRef: 'rages', resetOn: 'long' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 10, 14],
        asi: [4, 8, 12, 16], epicBoon: 19
      },
      /* Privilegi per livello 1→20 (Fase 5, step Barbaro): riassunti originali in
         italiano, verificati sul PHB 2024 (PDF locale, p.50-52). trait:false =
         già mostrato altrove (risorsa Furia a parte, o scelta gestita dal wizard). */
      levelFeatures: {
        1: [
          { name: 'Furia', desc: 'Come azione bonus (se non indossi armatura pesante) entri in Furia, per un numero di usi pari alla colonna Furie; ne recuperi uno col riposo breve e tutti col riposo lungo. Mentre è attiva: resistenza ai danni contundenti, perforanti e taglienti; bonus ai danni quando attacchi con la Forza; vantaggio a prove e TS di Forza; non puoi concentrarti né lanciare incantesimi. Dura fino alla fine del tuo prossimo turno e la prolunghi (fino a 10 minuti) attaccando, forzando un TS o con un\'azione bonus.' },
          { name: 'Difesa senza Armatura', desc: 'Quando non indossi alcuna armatura, la tua CA base è 10 + modificatore di Destrezza + modificatore di Costituzione. Puoi comunque impugnare uno scudo.' },
          { name: 'Maestria nelle Armi', desc: 'Puoi usare la proprietà di maestria di due tipi di arma da mischia Semplici o da Guerra a tua scelta; col crescere del livello aumentano i tipi utilizzabili. Al riposo lungo puoi cambiare le armi scelte.' }
        ],
        2: [
          { name: 'Percezione del Pericolo', desc: 'Hai vantaggio ai tiri salvezza di Destrezza, a meno che tu non sia Incapacitato.' },
          { name: 'Attacco Sconsiderato', desc: 'Al primo attacco del tuo turno puoi decidere di attaccare in modo sconsiderato: ottieni vantaggio ai tiri per colpire basati sulla Forza fino all\'inizio del tuo prossimo turno, ma nel frattempo gli attacchi contro di te hanno vantaggio.' }
        ],
        3: [
          { name: 'Sottoclasse del Barbaro', trait: false, desc: 'Scegli un Cammino (Berserker, Cuore Selvaggio, Albero del Mondo o Zelota). Ottieni i suoi privilegi al tuo livello da barbaro o inferiore.' },
          { name: 'Conoscenza Primordiale', desc: 'Ottieni competenza in un\'altra abilità dalla lista del barbaro. Inoltre, mentre sei in Furia, puoi effettuare come prove di Forza le prove di Acrobazia, Intimidire, Percezione, Furtività o Sopravvivenza.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Attacco Extra', trait: false, desc: 'Puoi attaccare due volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' },
          { name: 'Movimento Veloce', desc: 'La tua velocità aumenta di 3 metri quando non indossi armatura pesante.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo Cammino (dipende dalla sottoclasse scelta).' }
        ],
        7: [
          { name: 'Istinto Ferino', desc: 'Hai vantaggio ai tiri di iniziativa.' },
          { name: 'Balzo Istintivo', desc: 'Come parte dell\'azione bonus con cui entri in Furia, puoi muoverti fino a metà della tua velocità.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Colpo Brutale', desc: 'Se usi Attacco Sconsiderato, puoi rinunciare al vantaggio su un tiro per colpire basato sulla Forza: se colpisci, infliggi 1d10 danni extra dello stesso tipo e applichi un effetto di Colpo Brutale (Colpo Forzato: spingi il bersaglio di 4,5 m; Colpo Menomante: ne riduci la velocità di 4,5 m).' }
        ],
        10: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Cammino.' }
        ],
        11: [
          { name: 'Furia Implacabile', desc: 'Se scendi a 0 PF mentre sei in Furia e non muori sul colpo, puoi fare un TS di Costituzione CD 10: se lo superi, i tuoi PF diventano pari al doppio del tuo livello da barbaro. La CD sale di 5 a ogni uso successivo e si azzera dopo un riposo breve o lungo.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Colpo Brutale Migliorato', desc: 'Nuovi effetti di Colpo Brutale: Colpo Stordente (il bersaglio ha svantaggio al prossimo TS e non può fare attacchi di opportunità) e Colpo Devastante (il prossimo attacco di un\'altra creatura contro il bersaglio ha +5).' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Cammino.' }
        ],
        15: [
          { name: 'Furia Persistente', desc: 'Quando tiri l\'iniziativa puoi recuperare tutti gli usi di Furia (una volta per riposo lungo). Inoltre la Furia dura 10 minuti senza bisogno di mantenerla e termina solo se sei Privo di Sensi o indossi armatura pesante.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Colpo Brutale Migliorato', desc: 'I danni extra del Colpo Brutale salgono a 2d10 e puoi applicare due effetti di Colpo Brutale diversi con lo stesso colpo.' }
        ],
        18: [
          { name: 'Potenza Indomabile', desc: 'Se il totale di una prova o TS di Forza è inferiore al tuo punteggio di Forza, puoi usare il punteggio al posto del totale.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono dell\'Offesa Irresistibile) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Campione Primordiale', desc: 'Incarni la potenza primordiale: i tuoi punteggi di Forza e Costituzione aumentano di 4, fino a un massimo di 25.' }
        ]
      },
      /* Sottoclassi del Barbaro (Fase 5, step Barbaro): per ora il Cammino del
         Berserker come dati (PHB 2024, p.53); gli altri Cammini in seguito.
         Il Barbaro non è incantatore, quindi niente incantesimi di sottoclasse. */
      subclasses: {
        berserker: {
          name: 'Cammino del Berserker',
          // Riga di richiamo mostrata nel picker del level-up (stesso ruolo dei
          // tenets del Paladino, ma i Cammini del Barbaro non hanno precetti:
          // qui c'è solo il tema del Cammino, non un giuramento).
          tenets: 'Incanala la Furia in una violenza pura.',
          features: {
            3: [
              { name: 'Frenesia', desc: 'Se usi Attacco Sconsiderato mentre sei in Furia, infliggi danni extra al primo bersaglio che colpisci nel turno con un attacco basato sulla Forza: tira un numero di d6 pari al tuo bonus ai danni da Furia e sommali. Il tipo di danno è quello dell\'arma o del colpo senz\'armi usato.' }
            ],
            6: [
              { name: 'Furia Cieca', desc: 'Mentre sei in Furia sei immune alle condizioni Affascinato e Spaventato. Se sei già Affascinato o Spaventato quando entri in Furia, quella condizione termina su di te.' }
            ],
            10: [
              { name: 'Ritorsione', desc: 'Quando subisci danni da una creatura entro 1,5 metri da te, puoi usare una reazione per fare un attacco in mischia contro di essa (con un\'arma o un colpo senz\'armi).' }
            ],
            14: [
              { name: 'Presenza Intimidatoria', desc: 'Azione bonus: ogni creatura a tua scelta entro un\'Emanazione di 9 metri da te deve superare un TS di Saggezza (CD 8 + modificatore di Forza + bonus di competenza) o è Spaventata per 1 minuto, ripetendo il TS alla fine di ogni suo turno. Dopo l\'uso devi finire un riposo lungo per riusarla, oppure puoi spendere un uso di Furia (nessuna azione) per ripristinarla.' }
            ]
          }
        },
        /* Cuore Selvaggio, Albero del Mondo e Zelota (PHB 2024, p.54-56 del
           PDF): completano i 4 Cammini del Barbaro — prima c'era solo
           Berserker. Il Barbaro non è incantatore: dove un Cammino dà accesso
           a un incantesimo (rituale, senza slot), il nome resta in prosa nella
           descrizione — nessun aggancio al grimorio, non serve. */
        'cuore-selvaggio': {
          name: 'Cammino del Cuore Selvaggio',
          tenets: 'Cammina in comunione col mondo animale.',
          features: {
            3: [
              { name: 'Chi Parla agli Animali', desc: 'Puoi lanciare Sensi Bestiali e Parlare con gli Animali, ma solo come rituali; la Saggezza è la tua caratteristica da incantatore per loro.' },
              { name: 'Furia della Natura Selvaggia', desc: 'Ogni volta che attivi la Furia, scegli uno di questi effetti finché dura. Orso: resistenza a tutti i tipi di danno tranne Forza, Necrotico e Psichico. Aquila: puoi Disimpegnarti e Scattare come parte dell\'azione bonus con cui entri in Furia, e in seguito farle entrambe con una sola azione bonus. Lupo: i tuoi alleati hanno vantaggio ad attaccare un tuo nemico entro 1,5 m da te.' }
            ],
            6: [
              { name: 'Aspetto della Natura Selvaggia', desc: 'Scegli uno di questi effetti; puoi cambiarlo a ogni riposo lungo. Gufo: hai (o migliori di 18 m) Scurovisione fino a 18 m. Pantera: velocità di scalata pari alla tua velocità. Salmone: velocità di nuoto pari alla tua velocità.' }
            ],
            10: [
              { name: 'Chi Parla alla Natura', desc: 'Puoi lanciare Comunione con la Natura, ma solo come rituale; la Saggezza è la tua caratteristica da incantatore per esso.' }
            ],
            14: [
              { name: 'Potere della Natura Selvaggia', desc: 'Ogni volta che attivi la Furia, scegli uno di questi effetti finché dura. Falco: velocità di volo pari alla tua velocità, se non indossi armatura. Leone: i nemici entro 1,5 m da te hanno svantaggio ad attaccare chiunque non sia te o un altro barbaro con questo stesso effetto attivo. Ariete: un colpo in mischia contro una creatura Grande o più piccola può renderla Prona.' }
            ]
          }
        },
        'albero-del-mondo': {
          name: 'Cammino dell\'Albero del Mondo',
          tenets: 'Segui le radici e i rami del multiverso.',
          features: {
            3: [
              { name: 'Vitalità dell\'Albero', desc: 'Quando attivi la Furia, ottieni PF temporanei pari al tuo livello da barbaro. Inoltre, a inizio di ogni tuo turno mentre sei in Furia, puoi scegliere un\'altra creatura entro 3 m: tira un numero di d6 pari al tuo bonus ai danni da Furia e dalle come PF temporanei. I PF temporanei residui svaniscono quando la Furia finisce.' }
            ],
            6: [
              { name: 'Rami dell\'Albero', desc: 'Quando una creatura a vista comincia il turno entro 9 m da te mentre sei in Furia, puoi usare una reazione per evocarle attorno rami spettrali: TS Forza (CD 8 + modificatore di Forza + bonus di competenza) o viene teletrasportata in uno spazio libero a vista entro 1,5 m da te; dopo, puoi ridurne a 0 la velocità fino alla fine del turno.' }
            ],
            10: [
              { name: 'Radici Percotenti', desc: 'Nel tuo turno, la portata delle armi da mischia Pesanti o Versatili che impugni aumenta di 3 m. Colpendo con una di queste puoi attivare la proprietà di maestria Spinta o Rovesciare oltre a un\'altra maestria che stai già usando con quell\'arma.' }
            ],
            14: [
              { name: 'Viaggiare lungo l\'Albero', desc: 'Quando attivi la Furia, e con un\'azione bonus mentre dura, puoi teletrasportarti fino a 18 m in uno spazio libero a vista. Una volta per Furia puoi estendere la portata a 45 m e portare con te fino a 6 creature volontarie entro 3 m, che arrivano in spazi liberi entro 3 m dalla tua destinazione.' }
            ]
          }
        },
        zelota: {
          name: 'Cammino dello Zelota',
          tenets: 'Va in Furia in unione estatica con un dio.',
          features: {
            3: [
              { name: 'Furia Divina', desc: 'A ogni tuo turno mentre sei in Furia, la prima creatura che colpisci con un\'arma o un colpo senz\'armi subisce danni extra pari a 1d6 più metà del tuo livello da barbaro (arrotondato per difetto), Necrotici o Radiosi a tua scelta.' },
              { name: 'Guerriero degli Dèi', desc: 'Hai una riserva di quattro d12 da spendere per guarire: con un\'azione bonus ne tiri alcuni e recuperi PF pari al totale. La riserva si ricarica del tutto al riposo lungo, e il suo massimo sale a 5 dadi al 6° livello, 6 al 12° e 7 al 17°.' }
            ],
            6: [
              { name: 'Concentrazione Fanatica', desc: 'Una volta per Furia attiva, se fallisci un TS puoi ripeterlo con un bonus pari al tuo bonus ai danni da Furia, tenendo il nuovo risultato.' }
            ],
            10: [
              { name: 'Presenza Zelante', desc: 'Azione bonus: fino a dieci creature a tua scelta entro 18 m ottengono vantaggio ai tiri per colpire e ai TS fino all\'inizio del tuo prossimo turno. Dopo l\'uso serve un riposo lungo per riusarla, oppure puoi spendere un uso di Furia (nessuna azione) per ripristinarla.' }
            ],
            14: [
              { name: 'Furia degli Dèi', desc: 'Quando attivi la Furia, puoi assumere per 1 minuto (o finché non scendi a 0 PF) la forma di un guerriero divino; una volta per riposo lungo. In quella forma ottieni Volo (velocità di volo pari alla tua, puoi librarti), Resistenza (ai danni Necrotici, Psichici e Radiosi) e Rivivificazione (con una reazione, spendendo un uso di Furia, puoi impedire a una creatura entro 9 m di scendere a 0 PF portandola invece a un numero di PF pari al tuo livello da barbaro).' }
            ]
          }
        }
      }
    },
    bardo: {
      name: 'Bardo', hitDie: 'd8', primaryAbility: 'CAR', saves: ['DES', 'CAR'],
      casterType: 'full', spellAbility: 'CAR',
      bardicDie: [null, 'd6', 'd6', 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12', 'd12', 'd12'],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
      // Niente Maestria nelle Armi (nessuna colonna dedicata, come Chierico
      // e Druido): solo armi semplici.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit del bardo',
          armorId: 'cuoio', shield: false, weaponId: 'pugnale',
          extra: [
            { name: 'Pugnale', qty: 1, weaponId: 'pugnale' },
            { name: 'Strumento Musicale (a scelta)', qty: 1, weight: 2, desc: 'Strumento a scelta tra quelli in cui sei competente; funge anche da focus per gli incantesimi da bardo.' },
            { name: 'Kit del giullare', qty: 1, weight: 58, desc: 'Zaino, giaciglio, campanella, lanterna cieca, 3 costumi, specchio, 8 fiaschette d\'olio, razioni per 9 giorni, acciarino, otre.' }
          ],
          coins: { mo: 19 }
        },
        b: { label: '90 monete d\'oro', coins: { mo: 90 } }
      },
      classResources: {
        // Ispirazione Bardica: usi = mod CAR (minimo 1), non una tabella per
        // livello — il motore la scala da resMax()/abilityMod (nuovo, prima
        // esistevano solo tabelle per livello). Solo riposo lungo fino al 4°
        // livello; dal 5° (Fonte d'Ispirazione) anche il riposo breve la
        // recupera per intero, come i Punti Focus del Monaco.
        inspiration: {
          name: 'Ispirazione Bardica', kind: 'uses', abilityMod: 'CAR', min: 1,
          resetOn: 'long', resetOnAt: { level: 5, value: 'short-full' }
        }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 14],
        asi: [4, 8, 12, 16], epicBoon: 19,
        // Competenza: 2 abilità al 2° livello, altre 2 al 9° — stessa forma
        // {level,count} già usata da Ladro/Ranger.
        expertise: [{ level: 2, count: 2 }, { level: 9, count: 2 }]
      },
      /* Privilegi 1→20 (PHB 2024 p.59-61 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (Competenza/sottoclasse
         dal wizard/picker, ASI/Dono Epico dal level-up). Ai livelli 11/13/15/17
         il PHB non ha un privilegio nuovo, solo i numeri delle tabelle
         (Trucchetti/Preparati/slot) che salgono da soli — nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Ispirazione Bardica', desc: 'Come azione bonus doni un dado Ispirazione Bardica (d6) a una creatura entro 18 m che ti vede o sente; una volta nella prossima ora, se fallisce una Prova del d20, può tirare il dado e sommarlo al risultato. Il dado cresce col livello (colonna Dado Bardico: d8 dal 5°, d10 dal 10°, d12 dal 15°). Puoi donarlo un numero di volte pari al modificatore di Carisma (minimo 1); recuperi tutti gli usi al riposo lungo.' },
          { name: 'Incantesimi', desc: 'Impari a incanalare la magia attraverso la tua arte. Conosci due trucchetti da bardo e prepari incantesimi di 1° livello o superiore (4 all\'inizio) usando il Carisma come caratteristica da incantatore; puoi sostituire un trucchetto o un incantesimo preparato ogni volta che sali di livello da bardo.' }
        ],
        2: [
          { name: 'Competenza', trait: false, desc: 'Ottieni Competenza (bonus di competenza raddoppiato) in due delle tue abilità in cui sei già competente. Ne ottieni altre due al 9° livello.' },
          { name: 'Tuttofare', desc: 'Sommi metà del tuo bonus di competenza (per difetto) a qualunque prova di caratteristica che usi un\'abilità in cui non sei già competente e che non applichi già il bonus di competenza.' }
        ],
        3: [
          { name: 'Sottoclasse del Bardo', trait: false, desc: 'Scegli un Collegio (della Danza, dell\'Incanto, della Sapienza o del Valore). Ottieni i suoi privilegi al tuo livello da bardo o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Fonte d\'Ispirazione', desc: 'Recuperi tutti gli usi spesi di Ispirazione Bardica al riposo breve o lungo, non solo a quello lungo. Inoltre puoi spendere uno slot incantesimo (senza azione) per recuperare un uso di Ispirazione Bardica.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo Collegio.' }
        ],
        7: [
          { name: 'Contro-Incanto', desc: 'Con una reazione, se tu o una creatura entro 9 m fallite un TS contro un effetto che applica Affascinato o Spaventato, puoi far ripetere il tiro con vantaggio.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Competenza', trait: false, desc: 'Ottieni Competenza in altre due abilità in cui sei già competente.' }
        ],
        10: [
          { name: 'Segreti Magici', desc: 'Ogni volta che il numero della colonna Incantesimi Preparati aumenta (compreso questo livello), puoi scegliere uno dei tuoi nuovi incantesimi preparati anche dalle liste di Chierico, Druido o Mago: conta come incantesimo da bardo per te. Puoi sostituirlo con un altro delle stesse liste ogni volta che sali di livello da bardo.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Collegio.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        18: [
          { name: 'Ispirazione Superiore', desc: 'Quando tiri Iniziativa, se hai meno di due usi di Ispirazione Bardica ne recuperi finché non arrivi ad averne due.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Richiamo degli Incantesimi) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Parole della Creazione', desc: 'Hai sempre preparati gli incantesimi Parola di Potere: Guarigione e Parola di Potere: Morte. Quando lanci uno dei due, puoi colpire anche una seconda creatura entro 3 m dal primo bersaglio.' }
        ]
      },
      /* Collegi del Bardo: Sapienza, Incanto e Valore fatti (PHB p.62-66).
         Incanto è descrittivo come la Sapienza (riusa solo Ispirazione
         Bardica). Valore dà davvero Attacco Extra al 6°: `extraAttacks` qui
         sotto è letto da `stats.js` in aggiunta alla tabella di classe
         (nessuna classe Bardo ne ha una propria), stesso principio già usato
         per generalizzare Guerriero/Barbaro/Paladino/Ranger. Danza resta
         fuori: dà una CA alternativa a DUE caratteristiche (DES+CAR, mai
         vista finora — `unarmoredDefense` di classe supporta solo una) e
         trasforma i Colpi Senz'Armi in un'arma vera e propria (dado
         Ispirazione + Destrezza al posto del danno normale), una scelta di
         UX (come mostrarlo nella tabella Attacchi) da discutere con Andrea. */
      subclasses: {
        sapienza: {
          name: 'Collegio della Sapienza',
          tenets: 'Raccoglie incantesimi e segreti da fonti diverse, condividendo il sapere in biblioteche e università.',
          features: {
            3: [
              { name: 'Competenze Bonus', desc: 'Ottieni competenza in tre abilità a tua scelta.' },
              { name: 'Parole Taglienti', desc: 'Con una reazione, quando una creatura entro 18 m che vedi supera una prova di caratteristica, un tiro per colpire o un tiro per i danni, spendi un uso di Ispirazione Bardica: tiri il dado e lo sottrai dal risultato, potendo trasformare un successo in un fallimento.' }
            ],
            6: [
              { name: 'Scoperte Magiche', desc: 'Impari due incantesimi a scelta dalle liste di Chierico, Druido o Mago (anche in combinazione), di livello per cui hai slot o trucchetti. Li hai sempre preparati e puoi sostituirli ogni volta che sali di livello da bardo.' }
            ],
            14: [
              { name: 'Abilità Impareggiabile', desc: 'Quando fallisci una prova di caratteristica o un tiro per colpire, puoi spendere un uso di Ispirazione Bardica: tiri il dado e lo sommi al risultato, potendo trasformare il fallimento in un successo. Con un fallimento, l\'uso non si consuma.' }
            ]
          }
        },
        incanto: {
          name: 'Collegio dell\'Incanto',
          tenets: 'Intreccia la magia ammaliante delle Fate in canzoni e racconti, tra bellezza e terrore.',
          spellsByLevel: {
            3: [
              { id: 'ammaliare-persone', name: 'Ammaliare Persone' },
              { id: 'immagine-speculare', name: 'Immagine Speculare' }
            ],
            6: [
              { id: 'comando', name: 'Comando' }
            ]
          },
          features: {
            3: [
              { name: 'Magia Ammaliante', desc: 'Subito dopo aver lanciato un incantesimo di Incantamento o Illusione con uno slot, puoi far fare a una creatura che vedi entro 18 m un TS Saggezza: se fallisce, ha la condizione Affascinato o Spaventata (a tua scelta) per 1 minuto, ripetendo il TS alla fine di ogni suo turno. Puoi usarlo una volta per riposo lungo; puoi ripristinare l\'uso spendendo un uso di Ispirazione Bardica (nessuna azione).' },
              { name: 'Manto d\'Ispirazione', desc: 'Come azione bonus, spendi un uso di Ispirazione Bardica e tira il dado: un numero di creature a tua scelta entro 18 m pari al tuo modificatore di Carisma (minimo 1) ottiene PF temporanei pari al doppio del numero tirato, e ciascuna può usare la reazione per muoversi fino alla propria velocità senza subire attacchi di opportunità.' }
            ],
            6: [
              { name: 'Manto della Maestà', desc: 'Come azione bonus, lanci Comando senza spendere uno slot e assumi per 1 minuto un aspetto ultraterreno: mentre dura, puoi rilanciarlo come azione bonus senza slot, e le creature Affascinate da te falliscono automaticamente il TS contro il Comando lanciato così. Puoi usarlo una volta per riposo lungo; puoi ripristinare l\'uso spendendo uno slot di 3° livello o superiore (nessuna azione).' }
            ],
            14: [
              { name: 'Maestà Incrollabile', desc: 'Come azione bonus, assumi per 1 minuto (finché non sei Incapacitato) una presenza maestosa: la prima volta in un turno che una creatura ti colpisce con un tiro per colpire, deve superare un TS Carisma o l\'attacco manca invece di colpire. Puoi usarlo una volta per riposo breve o lungo.' }
            ]
          }
        },
        valore: {
          name: 'Collegio del Valore',
          tenets: 'Canta le gesta degli eroi antichi per ispirare nuove generazioni al valore.',
          extraAttacks: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          features: {
            3: [
              { name: 'Ispirazione in Combattimento', desc: 'Una creatura che ha un dado Ispirazione Bardica ricevuto da te può usarlo per uno di due effetti. Difesa: quando subisce un attacco, con una reazione tira il dado e lo somma alla propria CA contro quel colpo. Offesa: subito dopo un colpo a segno, tira il dado e lo somma al danno inflitto.' },
              { name: 'Addestramento Marziale', desc: 'Ottieni competenza con le armi da guerra e addestramento con l\'armatura media e gli scudi. Puoi inoltre usare un\'arma semplice o da guerra come focus per gli incantesimi da bardo.' }
            ],
            6: [
              { name: 'Attacco Extra', desc: 'Puoi attaccare due volte, invece di una, quando prendi l\'azione Attacco nel tuo turno. Puoi anche lanciare, al posto di uno di quei due attacchi, un trucchetto con tempo di lancio di un\'azione.' }
            ],
            14: [
              { name: 'Magia da Battaglia', desc: 'Dopo aver lanciato un incantesimo con tempo di lancio di un\'azione, puoi fare un attacco con un\'arma come azione bonus.' }
            ]
          }
        }
      }
    },
    chierico: {
      name: 'Chierico', hitDie: 'd8', primaryAbility: 'SAG', saves: ['SAG', 'CAR'],
      casterType: 'full', spellAbility: 'SAG',
      channelDivinity: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4],
      cantripsByLevel: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
      // Niente Maestria nelle Armi (nessuna colonna dedicata in tabella, a
      // differenza di Barbaro/Guerriero): solo armi semplici.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit del chierico',
          armorId: 'camicia-maglia', shield: true, weaponId: 'mazza',
          extra: [
            { name: 'Simbolo sacro', qty: 1, weight: 1, desc: 'Focus per gli incantesimi da chierico.' },
            { name: 'Kit del sacerdote', qty: 1, weight: 29, desc: 'Zaino, coperta, acqua santa, lampada, razioni per 7 giorni, veste, acciarino.' }
          ],
          coins: { mo: 7 }
        },
        b: { label: '110 monete d\'oro', coins: { mo: 110 } }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 17],
        asi: [4, 8, 12, 16], epicBoon: 19
      },
      /* Privilegi 1→20 (PHB 2024 p.68-71 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse dal
         picker, ASI/Dono Epico dal level-up). Ai livelli 9/11/13/15/18 il
         PHB non ha un privilegio nuovo, solo i numeri delle tabelle (Incanalare/
         Trucchetti/Preparati) che salgono da soli — nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Incantesimi', desc: 'Impari a incanalare la magia divina tramite preghiera e meditazione. Conosci tre trucchetti da chierico e prepari incantesimi di 1° livello o superiore (4 all\'inizio) usando la Saggezza come caratteristica da incantatore; puoi cambiare la lista a ogni riposo lungo.' },
          { name: 'Ordine Divino', desc: 'Scegli un ruolo sacro. Protettore: ottieni competenza con le armi da guerra e addestramento con l\'armatura pesante. Taumaturgo: conosci un trucchetto in più dalla lista del chierico, e ottieni un bonus (pari al tuo modificatore di Saggezza, minimo +1) alle prove di Intelligenza (Arcano o Religione).' }
        ],
        2: [
          { name: 'Incanalare Divinità', desc: 'Canalizzi energia divina per alimentare due effetti: Scintilla Divina (azione magica: tiri 1d8 + Saggezza e o curi una creatura entro 9 m di quel totale, o la costringi a un TS di Costituzione subendo danni Necrotici o Radiosi pari al totale, metà con un successo; il dado sale a 2d8 al 7°, 3d8 al 13°, 4d8 al 18°) e Scacciare i Non Morti (azione magica: ogni Non Morto scelto entro 9 m fa un TS di Saggezza o è Spaventato e Incapacitato per 1 minuto, cercando di allontanarsi da te). Puoi usarla due volte; ne recuperi un uso al riposo breve e tutti al riposo lungo.' }
        ],
        3: [
          { name: 'Sottoclasse del Chierico', trait: false, desc: 'Scegli un Dominio (Vita, Luce, Inganno o Guerra). Ottieni i suoi privilegi al tuo livello da chierico o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Bruciare i Non Morti', desc: 'Quando usi Scacciare i Non Morti, tiri un numero di d8 pari al tuo modificatore di Saggezza (minimo 1d8) e sommi i risultati: ogni Non Morto che fallisce il TS subisce danni Radiosi pari a quel totale, senza interrompere l\'effetto di paura.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo Dominio.' }
        ],
        7: [
          { name: 'Colpi Benedetti', desc: 'Scegli un\'opzione. Colpo Divino: una volta per turno, quando colpisci con un\'arma, infliggi 1d8 danni extra Necrotici o Radiosi a tua scelta. Incantesimi Potenti: sommi il tuo modificatore di Saggezza ai danni dei tuoi trucchetti da chierico.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        10: [
          { name: 'Intervento Divino', desc: 'Come azione magica scegli un incantesimo da chierico di 5° livello o inferiore che non richieda una reazione: lo lanci senza spendere uno slot né componenti materiali. Serve un riposo lungo per riusarlo.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        14: [
          { name: 'Colpi Benedetti Migliorati', desc: 'L\'opzione scelta per Colpi Benedetti migliora. Colpo Divino: il danno extra sale a 2d8. Incantesimi Potenti: quando un tuo trucchetto infligge danno, puoi anche dare PF temporanei (pari al doppio del tuo modificatore di Saggezza) a te o a un\'altra creatura entro 18 m.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio del tuo Dominio.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Fato) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Intervento Divino Maggiore', desc: 'Quando usi Intervento Divino, puoi scegliere Desiderio come incantesimo: se lo fai, non puoi riusare Intervento Divino finché non fai 2d4 riposi lunghi.' }
        ]
      },
      /* I 4 Domini del Chierico (PHB p.72-76): Vita, Luce, Inganno e Guerra.
         Nessuno introduce risorse nuove oltre a Incanalare Divinità già
         tracciata — le "X volte pari al modificatore di Saggezza" restano
         descrittive in prosa, stesso trattamento già dato alle altre classi. */
      subclasses: {
        vita: {
          name: 'Dominio della Vita',
          tenets: 'Allevia le ferite del mondo con la forza vitale che sostiene ogni cosa.',
          spellsByLevel: {
            3: [
              { id: 'aiuto', name: 'Aiuto' },
              { id: 'benedizione', name: 'Benedizione' },
              { id: 'cura-ferite', name: 'Cura Ferite' },
              { id: 'ristorare-inferiore', name: 'Ristorare Inferiore' }
            ],
            5: [
              { id: 'parola-curativa-di-massa', name: 'Parola Curativa di Massa' },
              { id: 'rivivificare', name: 'Rivivificare' }
            ],
            7: [
              { id: 'aura-vita', name: 'Aura di Vita' },
              { id: 'guardia-della-morte', name: 'Guardia della Morte' }
            ],
            9: [
              { id: 'ristorare-superiore', name: 'Ristorare Superiore' },
              { id: 'cura-ferite-di-massa', name: 'Cura Ferite di Massa' }
            ]
          },
          features: {
            3: [
              { name: 'Discepolo della Vita', desc: 'Quando un incantesimo lanciato con uno slot restituisce PF a una creatura, quella creatura ne recupera altri 2 più il livello dello slot, nel turno in cui lanci l\'incantesimo.' },
              { name: 'Preservare la Vita', desc: 'Come azione magica, presenti il tuo simbolo sacro e spendi un uso di Incanalare Divinità per guarire PF pari a cinque volte il tuo livello da chierico, da dividere fra le creature Sanguinanti entro 9 m (te compreso); nessuna può superare la metà dei propri PF massimi.' }
            ],
            6: [
              { name: 'Guaritore Benedetto', desc: 'Subito dopo aver lanciato con uno slot un incantesimo che restituisce PF ad altri, recuperi anche tu PF pari a 2 più il livello dello slot.' }
            ],
            17: [
              { name: 'Guarigione Suprema', desc: 'Quando dovresti tirare uno o più dadi per restituire PF con un incantesimo o con Incanalare Divinità, usa invece il massimo possibile per ciascun dado.' }
            ]
          }
        },
        luce: {
          name: 'Dominio della Luce',
          tenets: 'Porta luce per bandire le tenebre, svelare la verità e bruciare le menzogne.',
          spellsByLevel: {
            3: [
              { id: 'mani-ardenti', name: 'Mani Ardenti' },
              { id: 'fuoco-fatuo', name: 'Fuoco Fatuo' },
              { id: 'raggio-infuocato', name: 'Raggio Infuocato' },
              { id: 'vedere-l-invisibile', name: 'Vedere l\'Invisibile' }
            ],
            5: [
              { id: 'luce-diurna', name: 'Luce Diurna' },
              { id: 'palla-di-fuoco', name: 'Palla di Fuoco' }
            ],
            7: [
              { id: 'occhio-arcano', name: 'Occhio Arcano' },
              { id: 'muro-di-fuoco', name: 'Muro di Fuoco' }
            ],
            9: [
              { id: 'colonna-di-fiamma', name: 'Colonna di Fiamma' },
              { id: 'scrutare', name: 'Scrutare' }
            ]
          },
          features: {
            3: [
              { name: 'Irradiare l\'Alba', desc: 'Come azione magica, presenti il tuo simbolo sacro e spendi un uso di Incanalare Divinità per emettere un lampo di luce in un\'Emanazione di 9 m da te: ogni Oscurità magica nell\'area si dissolve e ogni creatura scelta al suo interno fa un TS Costituzione, subendo 2d10 danni Radiosi più il tuo livello da chierico se fallisce, o metà se supera.' },
              { name: 'Bagliore di Guardia', desc: 'Quando una creatura che vedi entro 9 m fa un tiro per colpire, puoi usare la reazione per imporgli svantaggio, facendo divampare la luce prima che colpisca o manchi. Puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1); recuperi tutti gli usi al riposo lungo.' }
            ],
            6: [
              { name: 'Bagliore di Guardia Migliorato', desc: 'Recuperi tutti gli usi di Bagliore di Guardia anche al riposo breve. Inoltre, ogni volta che lo usi, puoi dare al bersaglio dell\'attacco scatenante PF temporanei pari a 2d6 più il tuo modificatore di Saggezza.' }
            ],
            17: [
              { name: 'Corona di Luce', desc: 'Come azione magica, emetti per 1 minuto (finché non la dissolvi, nessuna azione richiesta) un\'aura di luce solare: Luce Intensa in un raggio di 18 m e Luce Fioca per altri 9 m. I nemici nella Luce Intensa hanno svantaggio ai TS contro Irradiare l\'Alba e contro incantesimi che infliggono danni da Fuoco o Radiosi. Puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1), recuperandoli tutti al riposo lungo.' }
            ]
          }
        },
        inganno: {
          name: 'Dominio dell\'Inganno',
          tenets: 'Semina il caos e sfida l\'autorità con inganni, illusioni e furtività, punzecchiando l\'orgoglio dei potenti.',
          spellsByLevel: {
            3: [
              { id: 'ammaliare-persone', name: 'Ammaliare Persone' },
              { id: 'travisamento', name: 'Travisamento' },
              { id: 'invisibilita', name: 'Invisibilità' },
              { id: 'passo-senza-tracce', name: 'Passo senza Tracce' }
            ],
            5: [
              { id: 'motivo-ipnotico', name: 'Motivo Ipnotico' },
              { id: 'non-individuazione', name: 'Non Individuazione' }
            ],
            7: [
              { id: 'confusione', name: 'Confusione' },
              { id: 'porta-dimensionale', name: 'Porta Dimensionale' }
            ],
            9: [
              { id: 'dominare-persona', name: 'Dominare Persona' },
              { id: 'modificare-memoria', name: 'Modificare Memoria' }
            ]
          },
          features: {
            3: [
              { name: 'Benedizione dell\'Ingannatore', desc: 'Come azione magica, scegli te stesso o una creatura volontaria entro 9 m per avere vantaggio alle prove di Destrezza (Furtività). L\'effetto dura finché non finisci un riposo lungo o non lo usi di nuovo.' },
              { name: 'Invocare Duplicità', desc: 'Come azione bonus, spendi un uso di Incanalare Divinità per creare un\'illusione visiva perfetta di te stesso in uno spazio libero che vedi entro 9 m; dura 1 minuto (finché non la dissolvi o vieni Incapacitato). Finché dura: lanci incantesimi come se fossi nello spazio dell\'illusione, pur usando i tuoi sensi reali; hai vantaggio agli attacchi contro una creatura entro 1,5 m sia da te sia dall\'illusione; con un\'azione bonus puoi spostare l\'illusione fino a 9 m.' }
            ],
            6: [
              { name: 'Trasposizione dell\'Ingannatore', desc: 'Ogni volta che usi l\'azione bonus per creare o spostare l\'illusione di Invocare Duplicità, puoi teletrasportarti scambiando il posto con essa.' }
            ],
            17: [
              { name: 'Duplicità Migliorata', desc: 'L\'illusione di Invocare Duplicità diventa più potente: tu e i tuoi alleati avete vantaggio agli attacchi contro una creatura entro 1,5 m dall\'illusione, e quando l\'illusione termina, tu o una creatura a tua scelta entro 1,5 m da essa recupera PF pari al tuo livello da chierico.' }
            ]
          }
        },
        guerra: {
          name: 'Dominio della Guerra',
          tenets: 'Ispira valore in battaglia e offri atti di guerra come preghiere alla tua divinità.',
          spellsByLevel: {
            3: [
              { id: 'dardo-di-guida', name: 'Dardo di Guida' },
              { id: 'arma-magica', name: 'Arma Magica' },
              { id: 'scudo-della-fede', name: 'Scudo della Fede' },
              { id: 'arma-spirituale', name: 'Arma Spirituale' }
            ],
            5: [
              { id: 'manto-del-crociato', name: 'Manto del Crociato' },
              { id: 'guardiani-spirituali', name: 'Guardiani Spirituali' }
            ],
            7: [
              { id: 'scudo-di-fuoco', name: 'Scudo di Fuoco' },
              { id: 'liberta-di-movimento', name: 'Libertà di Movimento' }
            ],
            9: [
              { id: 'tenere-mostri', name: 'Tenere Mostri' },
              { id: 'vento-d-acciaio', name: 'Colpo del Vento d\'Acciaio' }
            ]
          },
          features: {
            3: [
              { name: 'Colpo Guidato', desc: 'Quando tu o una creatura entro 9 m manca un tiro per colpire, puoi spendere un uso di Incanalare Divinità per dare a quel tiro un bonus di +10, rendendolo potenzialmente un successo. Se lo usi a favore di un\'altra creatura devi farlo con una reazione.' },
              { name: 'Sacerdote di Guerra', desc: 'Come azione bonus, puoi fare un attacco con un\'arma o un Colpo Senz\'Armi. Puoi usare questa azione bonus un numero di volte pari al tuo modificatore di Saggezza (minimo 1); recuperi tutti gli usi al riposo breve o lungo.' }
            ],
            6: [
              { name: 'Benedizione del Dio della Guerra', desc: 'Puoi spendere un uso di Incanalare Divinità per lanciare Scudo della Fede o Arma Spirituale senza spendere uno slot. Lanciato così, l\'incantesimo non richiede concentrazione ma dura 1 minuto, terminando prima se lo rilanci, se sei Incapacitato o se muori.' }
            ],
            17: [
              { name: 'Avatar di Battaglia', desc: 'Ottieni resistenza ai danni Contundenti, Perforanti e Taglienti.' }
            ]
          }
        }
      }
    },
    druido: {
      name: 'Druido', hitDie: 'd8', primaryAbility: 'SAG', saves: ['INT', 'SAG'],
      casterType: 'full', spellAbility: 'SAG',
      wildShape: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
      // Niente Maestria nelle Armi (nessuna colonna dedicata, come Chierico):
      // solo armi semplici.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit del druido',
          armorId: 'cuoio', shield: true, weaponId: 'falcetto',
          extra: [
            { name: 'Focus Druidico (Bastone)', qty: 1, weaponId: 'bastone-ferrato', desc: 'Bastone che funge anche da focus per gli incantesimi da druido.' },
            { name: 'Kit da erborista', qty: 1, weight: 3, desc: 'Per identificare piante, distillare veleni e mescolare pozioni.' },
            { name: 'Kit dell\'esploratore', qty: 1, weight: 55, desc: 'Zaino, giaciglio, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 9 }
        },
        b: { label: '50 monete d\'oro', coins: { mo: 50 } }
      },
      classResources: {
        // Torna 1 uso al riposo breve, tutti al riposo lungo — stesso pattern
        // di Recuperare Energie/Azione Impetuosa del Guerriero.
        wildshape: { name: 'Forma Selvatica', kind: 'uses', byLevelRef: 'wildShape', resetOn: 'short' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 10, 14],
        asi: [4, 8, 12, 16], epicBoon: 19
      },
      /* Privilegi 1→20 (PHB 2024 p.79-89 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse dal
         picker, ASI/Dono Epico dal level-up). Ai livelli 9/11/13/16(numeri)/17
         il PHB non ha un privilegio nuovo, solo i numeri delle tabelle
         (Forma Selvatica/Trucchetti/Preparati/slot) che salgono da soli —
         nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Incantesimi', desc: 'Impari a incanalare la magia primordiale della natura. Conosci due trucchetti da druido e prepari incantesimi di 1° livello o superiore (4 all\'inizio) usando la Saggezza come caratteristica da incantatore; puoi sostituire un trucchetto o cambiare la lista dei preparati a ogni riposo lungo.' },
          { name: 'Druidico', desc: 'Conosci il Druidico, il linguaggio segreto dei druidi, e hai sempre preparato l\'incantesimo Parlare con gli Animali. Puoi lasciare messaggi nascosti che solo chi conosce il Druidico nota automaticamente; gli altri li notano con una prova di Intelligenza (Indagare) CD 15, ma non li decifrano senza magia.' },
          { name: 'Ordine Primordiale', desc: 'Scegli un ruolo sacro. Sapiente: conosci un trucchetto in più dalla lista del druido e ottieni un bonus (pari al tuo modificatore di Saggezza, minimo +1) alle prove di Intelligenza (Arcano o Natura). Guardiano: ottieni competenza con le armi da guerra e addestramento con l\'armatura media.' }
        ],
        2: [
          { name: 'Forma Selvatica', desc: 'Come azione bonus assumi la forma di una Bestia che conosci, restando trasformato per metà del tuo livello da druido in ore o finché non riusi questo privilegio, non sei Incapacitato o non muori; puoi tornare alla forma normale prima, sempre come azione bonus. Puoi usarla due volte; recuperi un uso al riposo breve e tutti al riposo lungo (gli usi crescono col livello, colonna Forma Selvatica). Conosci quattro forme fra le Bestie di GS massimo 1/4 senza Velocità di volo (consigliati Ratto, Cavallo da sella, Ragno, Lupo); il numero di forme note e il GS massimo crescono col livello, e dall\'8° puoi assumere forme con Velocità di volo. In forma ottieni PF temporanei pari al tuo livello da druido, mantieni le tue caratteristiche mentali, privilegi, competenze e linguaggi ma usi le statistiche della Bestia per il resto; non puoi lanciare incantesimi, ma trasformarti non interrompe la Concentrazione.' },
          { name: 'Compagno Selvatico', desc: 'Come azione magica, spendendo uno slot incantesimo o un uso di Forma Selvatica, evochi uno spirito della natura lanciando Trova Famiglio senza componenti materiali; il famiglio è di tipo Fatato e sparisce al riposo lungo.' }
        ],
        3: [
          { name: 'Sottoclasse del Druido', trait: false, desc: 'Scegli un Circolo (della Terra, della Luna, del Mare o delle Stelle). Ottieni i suoi privilegi al tuo livello da druido o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Resurgenza Selvatica', desc: 'Una volta per turno, se non hai usi di Forma Selvatica, puoi spendere uno slot incantesimo (senza azione) per ottenerne uno. Puoi anche spendere un uso di Forma Selvatica (senza azione) per ottenere uno slot di 1° livello, ma solo una volta prima di un riposo lungo.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo Circolo.' }
        ],
        7: [
          { name: 'Furia Elementale', desc: 'Scegli un\'opzione. Incanti Potenti: sommi il modificatore di Saggezza ai danni dei tuoi trucchetti da druido. Colpo Primordiale: una volta per turno, quando colpisci con un\'arma o con un attacco in Forma Selvatica, infliggi 1d8 danni extra Freddo, Fuoco, Fulmine o Tuono a tua scelta.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        10: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Circolo.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Circolo.' }
        ],
        15: [
          { name: 'Furia Elementale Migliorata', desc: 'L\'opzione scelta per Furia Elementale migliora. Incanti Potenti: quando lanci un trucchetto da druido con gittata di 3 m o superiore, la gittata aumenta di 90 m. Colpo Primordiale: il danno extra sale a 2d8.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        18: [
          { name: 'Incantesimi in Forma Selvatica', desc: 'Mentre sei in Forma Selvatica puoi lanciare incantesimi, tranne quelli con una componente materiale che ha un costo indicato o che la consuma.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Viaggio Dimensionale) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Arcidruido', desc: 'La vitalità della natura ti scorre dentro. Forma Selvatica Perenne: quando tiri Iniziativa senza usi di Forma Selvatica, ne recuperi uno. Mago della Natura: puoi convertire usi di Forma Selvatica in uno slot incantesimo (senza azione), con ogni uso che vale 2 livelli di slot; una sola volta prima di un riposo lungo. Longevità: invecchi molto più lentamente (un anno ogni dieci che passano).' }
        ]
      },
      /* Circoli del Druido: Luna, Mare e Stelle fatti (PHB p.85-88) — tutti e
         tre solo incantesimi sempre preparati + abilità descrittive ("X
         volte pari al modificatore di Saggezza"), nessuna risorsa nuova
         oltre a Forma Selvatica già tracciata, stesso trattamento dato ai
         Domini del Chierico. Circolo della Terra resta fuori: richiede una
         scelta di tipo di terreno (arido/polare/temperato/tropicale) da
         poter cambiare a ogni riposo lungo, con incantesimi diversi per
         tipo — un picker che non esiste ancora nell'app, da discutere con
         Andrea prima di modellarlo (stessa natura di problema del Cavaliere
         Occulto/Truffatore Arcano rimandati). */
      subclasses: {
        luna: {
          name: 'Circolo della Luna',
          tenets: 'Trae la sua magia dalla luna per trasformarsi e vegliare sui luoghi selvaggi.',
          spellsByLevel: {
            3: [
              { id: 'cura-ferite', name: 'Cura Ferite' },
              { id: 'raggio-di-luna', name: 'Raggio di Luna' },
              { id: 'scintilla-stellare', name: 'Scintilla Stellare' }
            ],
            5: [
              { id: 'evocare-animali', name: 'Evocare Animali' }
            ],
            7: [
              { id: 'fonte-di-luce-lunare', name: 'Fonte di Luce Lunare' }
            ],
            9: [
              { id: 'cura-ferite-di-massa', name: 'Cura Ferite di Massa' }
            ]
          },
          features: {
            3: [
              { name: 'Forme Circolari', desc: 'Quando assumi una Forma Selvatica, il GS massimo delle forme che puoi assumere sale al tuo livello da druido diviso 3 (per difetto), ben oltre il limite base della classe. Finché resti in forma la tua CA è 13 + il tuo modificatore di Saggezza, se più alta di quella della Bestia, e ottieni PF temporanei pari al triplo del tuo livello da druido.' }
            ],
            6: [
              { name: 'Forme Circolari Migliorate', desc: 'In Forma Selvatica, ogni tuo attacco può infliggere danni Radiosi al posto del tipo normale (scegli a ogni colpo), e sommi il modificatore di Saggezza ai tiri salvezza su Costituzione.' }
            ],
            10: [
              { name: 'Passo Lunare', desc: 'Come azione bonus ti teletrasporti fino a 9 m in uno spazio libero che vedi, con vantaggio al prossimo tiro per colpire prima della fine del turno. Puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1); recuperi tutti gli usi al riposo lungo, oppure ne recuperi uno spendendo uno slot di 2° livello o superiore.' }
            ],
            14: [
              { name: 'Forma Lunare', desc: 'Una volta per turno, quando colpisci con un attacco in Forma Selvatica, puoi infliggere 2d10 danni Radiosi extra. Inoltre, quando usi Passo Lunare puoi teletrasportare con te anche una creatura volontaria entro 3 m.' }
            ]
          }
        },
        mare: {
          name: 'Circolo del Mare',
          tenets: 'Diventa tutt\'uno con le maree e le tempeste, canalizzando la furia dell\'oceano.',
          spellsByLevel: {
            3: [
              { id: 'nube-di-nebbia', name: 'Nube di Nebbia' },
              { id: 'raffica-di-vento', name: 'Raffica di Vento' },
              { id: 'raggio-di-gelo', name: 'Raggio di Gelo' },
              { id: 'frantumare', name: 'Frantumare' },
              { id: 'onda-tonante', name: 'Onda Tonante' }
            ],
            5: [
              { id: 'fulmine', name: 'Fulmine' },
              { id: 'respirare-in-acqua', name: 'Respirare in Acqua' }
            ],
            7: [
              { id: 'controllare-acqua', name: 'Controllare Acqua' },
              { id: 'tempesta-di-ghiaccio', name: 'Tempesta di Ghiaccio' }
            ],
            9: [
              { id: 'evocare-elementale', name: 'Evocare Elementale' },
              { id: 'tenere-mostri', name: 'Tenere Mostri' }
            ]
          },
          features: {
            3: [
              { name: 'Ira del Mare', desc: 'Come azione bonus, spendi un uso di Forma Selvatica per manifestare per 10 minuti un\'Emanazione di 1,5 m di spruzzi oceanici attorno a te (finché non la dissolvi, la rimanifesti o sei Incapacitato). Quando la manifesti, e poi come azione bonus nei turni successivi, scegli una creatura nell\'Emanazione: fa un TS Costituzione o subisce danni da Freddo (un numero di d6 pari al tuo modificatore di Saggezza, minimo 1) e viene spinta fino a 4,5 m se non più grande di Grande.' }
            ],
            6: [
              { name: 'Affinità Acquatica', desc: 'L\'Emanazione di Ira del Mare cresce a 3 m di raggio. Ottieni inoltre una velocità di nuoto pari alla tua velocità.' }
            ],
            10: [
              { name: 'Nato dalla Tempesta', desc: 'Finché Ira del Mare è attiva, ottieni anche una velocità di volo pari alla tua velocità e resistenza ai danni da Freddo, Fulmine e Tuono.' }
            ],
            14: [
              { name: 'Dono Oceanico', desc: 'Puoi manifestare l\'Emanazione di Ira del Mare attorno a una creatura volontaria entro 18 m invece che su te stesso, che ne usa la tua CD e il tuo modificatore di Saggezza; spendendo due usi di Forma Selvatica puoi averla attorno a entrambi contemporaneamente.' }
            ]
          }
        },
        stelle: {
          name: 'Circolo delle Stelle',
          tenets: 'Insegue i segreti nascosti tra le costellazioni per imbrigliare i poteri del cosmo.',
          spellsByLevel: {
            3: [
              { id: 'guida', name: 'Guida' },
              { id: 'dardo-di-guida', name: 'Dardo di Guida' }
            ]
          },
          features: {
            3: [
              { name: 'Mappa Stellare', desc: 'Crei una piccola mappa celeste che usi come focus per gli incantesimi da druido: mentre la tieni hai sempre preparati Guida e Dardo di Guida, e puoi lanciare Dardo di Guida senza spendere uno slot un numero di volte pari al tuo modificatore di Saggezza (minimo 1), recuperando tutti gli usi al riposo lungo. Se la perdi, una cerimonia di un\'ora durante un riposo la ricrea.' },
              { name: 'Forma Stellare', desc: 'Come azione bonus, spendi un uso di Forma Selvatica per assumere per 10 minuti una forma stellare (finché non la dissolvi, la riusi o sei Incapacitato): mantieni le tue statistiche ma emetti Luce Intensa in 3 m e Fioca per altri 3 m, e scegli una costellazione con un beneficio finché dura. Arciere: come azione bonus scagli una freccia luminosa contro una creatura entro 18 m, 1d8 + Saggezza danni Radiosi se colpisci. Calice: quando lanci un incantesimo con uno slot che restituisce PF, tu o un\'altra creatura entro 9 m ne recuperate altri 1d8 + Saggezza. Drago: puoi trattare un tiro di 9 o meno come 10 per prove di Intelligenza, Saggezza o TS di Costituzione per mantenere la concentrazione.' }
            ],
            6: [
              { name: 'Presagio Cosmico', desc: 'Al termine di un riposo lungo, consulti la Mappa Stellare e tiri un dado: fino al prossimo riposo lungo ottieni una reazione speciale, usabile un numero di volte pari al tuo modificatore di Saggezza (minimo 1). Fausto (pari): quando vedi una creatura entro 9 m fare una Prova, tiri 1d6 e lo sommi al risultato. Infausto (dispari): stesso innesco, ma sottrai 1d6 dal risultato.' }
            ],
            10: [
              { name: 'Costellazioni Scintillanti', desc: 'In Forma Stellare, Arciere e Calice salgono a 2d8; mentre Drago è attivo ottieni anche una velocità di volo di 6 m e puoi planare. Puoi inoltre cambiare costellazione all\'inizio di ogni tuo turno.' }
            ],
            14: [
              { name: 'Piena di Stelle', desc: 'In Forma Stellare diventi parzialmente incorporeo, ottenendo resistenza ai danni Contundenti, Perforanti e Taglienti.' }
            ]
          }
        }
      }
    },
    guerriero: {
      name: 'Guerriero', hitDie: 'd10', primaryAbility: 'FOR o DES', saves: ['FOR', 'COS'],
      casterType: 'none',
      secondWind: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      weaponMastery: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6],
      weaponProf: ['sem', 'gue'],
      /* Azione Impetuosa: 1 uso da 2° livello, 2 usi da 17°. Indomabile: 1 uso
         da 9°, 2 da 13°, 3 da 17°. Attacchi extra oltre al primo: 1 da 5°
         (2 colpi), 2 da 11° (3 colpi), 3 da 20° (4 colpi) — generico, letto da
         stats.js al posto della vecchia soglia singola choicePoints.extraAttack
         (bastava per Paladino/Barbaro, che restano fermi a 2 colpi). */
      actionSurgeUses: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
      indomitableUses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
      extraAttacks: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3],
      startingEquipment: {
        a: {
          label: 'Kit del guerriero',
          armorId: 'cotta-maglia', shield: false, weaponId: 'spadone',
          extra: [
            { name: 'Flagello', qty: 1, weaponId: 'flagello' },
            { name: 'Giavellotto', qty: 8, weaponId: 'giavellotto' },
            { name: 'Kit del perlustratore', qty: 1, weight: 55, desc: 'Zaino, tribbie, piede di porco, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 4 }
        },
        b: {
          label: 'Armatura leggera e armi da lancio',
          armorId: 'cuoio-borchiato', shield: false, weaponId: 'scimitarra',
          extra: [
            { name: 'Spada corta', qty: 1, weaponId: 'spada-corta' },
            { name: 'Arco lungo', qty: 1, weaponId: 'arco-lungo' },
            { name: 'Frecce', qty: 20, weight: 1, desc: 'In una faretra.' },
            { name: 'Kit del perlustratore', qty: 1, weight: 55, desc: 'Zaino, tribbie, piede di porco, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 11 }
        },
        c: { label: '155 monete d\'oro', coins: { mo: 155 } }
      },
      classResources: {
        secondwind: { name: 'Recuperare Energie', kind: 'uses', byLevelRef: 'secondWind', resetOn: 'short' },
        actionsurge: { name: 'Azione Impetuosa', kind: 'uses', byLevelRef: 'actionSurgeUses', resetOn: 'short' },
        indomitable: { name: 'Indomabile', kind: 'uses', byLevelRef: 'indomitableUses', resetOn: 'long' },
        // Dadi Superiorità (Maestro di Battaglia) e Dadi di Energia Psionica
        // (Combattente Psionico): risorse di SOTTOCLASSE (`subclass`, Blocco
        // 5.C step Guerriero — nuovo filtro in engine.js, altrimenti
        // trapelerebbero anche a Campione/Cavaliere Occulto). dieByLevel =
        // il dado del singolo uso cresce col livello (generico, letto da
        // engine.js per il testo della card).
        superiority: {
          name: 'Dadi Superiorità', kind: 'uses', subclass: 'maestro-di-battaglia', resetOn: 'short',
          byLevel: [0, 0, 0, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6],
          dieByLevel: [null, null, null, 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12']
        },
        psionicEnergy: {
          name: 'Dadi di Energia Psionica', kind: 'uses', subclass: 'combattente-psionico', resetOn: 'short',
          byLevel: [0, 0, 0, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12],
          dieByLevel: [null, null, null, 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12']
        }
      },
      choicePoints: {
        fightingStyle: 1,
        subclass: 3, subclassFeatureLevels: [3, 7, 10, 15, 18],
        asi: [4, 6, 8, 12, 14, 16],
        epicBoon: 19,
        // Manovre (Maestro di Battaglia): 3 al 3°, +2 al 7°/10°/15° (9 totali
        // al 15°) — stessa forma {level,count} di Competenza/Metamagia/
        // Invocazioni più un `subclass` (di SOTTOCLASSE, non di classe: un
        // Campione/Cavaliere Occulto/Combattente Psionico non le vede mai),
        // nuovo picker in js/levelup.js.
        maneuvers: [
          { level: 3, count: 3, subclass: 'maestro-di-battaglia' },
          { level: 7, count: 2, subclass: 'maestro-di-battaglia' },
          { level: 10, count: 2, subclass: 'maestro-di-battaglia' },
          { level: 15, count: 2, subclass: 'maestro-di-battaglia' }
        ]
      },
      /* Privilegi 1→20 (PHB 2024 p.90-91 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (Stile di Combattimento
         dal wizard, sottoclasse dal picker, ASI/Dono Epico dal level-up). */
      levelFeatures: {
        1: [
          { name: 'Stile di Combattimento', trait: false, desc: 'Ottieni un talento di Stile di Combattimento a tua scelta (consigliato: Difesa). Puoi sostituirlo con un altro Stile di Combattimento ogni volta che sali di livello da guerriero.' },
          { name: 'Recuperare Energie', desc: 'Come azione bonus, recuperi PF pari a 1d10 + il tuo livello da guerriero. Puoi usarlo un numero di volte pari alla colonna Recuperare Energie; ne recuperi uno al riposo breve e tutti al riposo lungo.' },
          { name: 'Maestria nelle Armi', desc: 'Puoi usare la proprietà di maestria di tre tipi di arma Semplice o da Guerra a tua scelta; col crescere del livello aumentano i tipi utilizzabili. Al riposo lungo puoi cambiare le armi scelte.' }
        ],
        2: [
          { name: 'Azione Impetuosa', desc: 'Nel tuo turno puoi intraprendere un\'azione aggiuntiva (tranne l\'azione Magia). Dopo l\'uso serve un riposo breve o lungo per riusarla; dal 17° livello puoi usarla due volte prima di un riposo, ma non due volte nello stesso turno.' },
          { name: 'Mente Tattica', desc: 'Quando fallisci una prova di caratteristica, puoi spendere un uso di Recuperare Energie: invece di curarti, tiri 1d10 e lo sommi alla prova, trasformandola magari in un successo. Se fallisce comunque, l\'uso non viene consumato.' }
        ],
        3: [
          { name: 'Sottoclasse del Guerriero', trait: false, desc: 'Scegli una specializzazione (Maestro di Battaglia, Campione, Cavaliere Occulto o Combattente Psionico). Ottieni i suoi privilegi al tuo livello da guerriero o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Attacco Extra', trait: false, desc: 'Puoi attaccare due volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' },
          { name: 'Spostamento Tattico', desc: 'Ogni volta che attivi Recuperare Energie con un\'azione bonus, puoi muoverti fino a metà della tua velocità senza provocare attacchi di opportunità.' }
        ],
        6: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        7: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua specializzazione.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Indomabile', desc: 'Se fallisci un tiro salvezza, puoi ripeterlo con un bonus pari al tuo livello da guerriero. Devi tenere il nuovo risultato e non puoi riusare questo privilegio finché non finisci un riposo lungo.' },
          { name: 'Maestro Tattico', desc: 'Quando attacchi con un\'arma di cui puoi usare la maestria, puoi sostituire quella proprietà con Spinta, Fiaccare o Rallentare per quell\'attacco.' }
        ],
        10: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua specializzazione.' }
        ],
        11: [
          { name: 'Due Attacchi Extra', desc: 'Puoi attaccare tre volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Indomabile', desc: 'Puoi usare questo privilegio due volte prima di un riposo lungo.' },
          { name: 'Attacchi Studiati', desc: 'Se manchi un tiro per colpire contro una creatura, hai vantaggio al prossimo tiro per colpire contro di lei prima della fine del tuo prossimo turno.' }
        ],
        14: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        15: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua specializzazione.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Azione Impetuosa Migliorata', desc: 'Puoi usare Azione Impetuosa due volte prima di un riposo (mai due volte nello stesso turno).' },
          { name: 'Indomabile', desc: 'Puoi usare questo privilegio tre volte prima di un riposo lungo.' }
        ],
        18: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio della tua specializzazione.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono della Prodezza in Combattimento) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Tre Attacchi Extra', desc: 'Puoi attaccare quattro volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' }
        ]
      },
      /* Sottoclassi del Guerriero: per ora solo Campione (PHB p.93), la più
         semplice delle quattro (nessuna risorsa dedicata) — Maestro di
         Battaglia, Cavaliere Occulto e Combattente Psionico si aggiungono in
         seguito, stesso trattamento già dato alle sottoclassi di Paladino e
         Barbaro. */
      subclasses: {
        campione: {
          name: 'Campione',
          tenets: 'Insegue l\'eccellenza fisica e la vittoria a ogni costo.',
          features: {
            3: [
              { name: 'Critico Migliorato', desc: 'I tuoi tiri per colpire con armi e attacchi senz\'armi segnano un Colpo Critico anche con un 19 sul d20, oltre che con un 20.' },
              { name: 'Atleta Impareggiabile', desc: 'Hai vantaggio alle prove di iniziativa e alle prove di Forza (Atletica). Inoltre, subito dopo aver segnato un Colpo Critico, puoi muoverti fino a metà della tua velocità senza provocare attacchi di opportunità.' }
            ],
            7: [
              { name: 'Stile di Combattimento Aggiuntivo', desc: 'Ottieni un altro talento di Stile di Combattimento a tua scelta.' }
            ],
            10: [
              { name: 'Guerriero Eroico', desc: 'In combattimento puoi darti Ispirazione Eroica ogni volta che inizi il tuo turno senza averla già.' }
            ],
            15: [
              { name: 'Critico Superiore', desc: 'I tuoi tiri per colpire con armi e attacchi senz\'armi segnano un Colpo Critico con 18-20 sul d20.' }
            ],
            18: [
              { name: 'Sopravvissuto', desc: 'Hai vantaggio ai tiri salvezza contro la morte, e se ottieni 18-20 su uno di essi ne hai il beneficio come se fosse un 20 naturale. Inoltre, a inizio di ogni tuo turno recuperi 5 + il tuo modificatore di Costituzione PF se sei Sanguinante e hai almeno 1 PF.' }
            ]
          }
        },
        /* Maestro di Battaglia e Combattente Psionico (PHB 2024, p.93 e
           p.98-99 del PDF): completano 3 delle 4 specializzazioni del
           Guerriero — resta Cavaliere Occulto, rimandato perché richiede un
           incantatore legato alla SOTTOCLASSE (non alla classe, che qui è
           'none') con una propria lista di slot (un "terzo" di incantatore,
           diverso da full/half/pact) e una lista incantesimi presa dal Mago
           invece che dalla propria classe — architettura non ancora
           supportata, da affrontare a parte. */
        'maestro-di-battaglia': {
          name: 'Maestro di Battaglia',
          tenets: 'Studia l\'arte della battaglia e tramanda tecniche marziali sofisticate.',
          features: {
            3: [
              { name: 'Superiorità in Combattimento', desc: 'Impari 3 manovre a tua scelta (vedi elenco a parte), alimentate dai Dadi Superiorità (vedi Risorse): puoi usarne una sola per attacco. Ne impari altre due ai livelli 7, 10 e 15, e ogni volta puoi anche sostituirne una che già conosci. Se una manovra richiede un TS, la CD è 8 + il tuo bonus di competenza + il tuo modificatore di Forza o Destrezza (a scelta).' },
              { name: 'Studente di Guerra', desc: 'Ottieni competenza in un tipo di Strumenti da Artigiano a tua scelta e in un\'abilità a scelta fra quelle disponibili al Guerriero al 1° livello.' }
            ],
            7: [
              { name: 'Conosci il Nemico', desc: 'Come azione bonus, scopri se una creatura che vedi entro 9 m ha Immunità, Resistenze o Vulnerabilità e quali sono. Una volta per riposo lungo; puoi ripristinarne l\'uso spendendo un Dado Superiorità (nessuna azione).' }
            ],
            10: [
              { name: 'Superiorità in Combattimento Migliorata', desc: 'Il tuo Dado Superiorità diventa un d10.' }
            ],
            15: [
              { name: 'Instancabile', desc: 'Una volta per turno, quando usi una manovra, puoi tirare 1d8 e usare il risultato al posto di spendere un Dado Superiorità.' }
            ],
            18: [
              { name: 'Superiorità in Combattimento Suprema', desc: 'Il tuo Dado Superiorità diventa un d12.' }
            ]
          }
        },
        'combattente-psionico': {
          name: 'Combattente Psionico',
          tenets: 'Risveglia il potere della mente per potenziare il proprio vigore fisico.',
          features: {
            3: [
              { name: 'Potere Psionico', desc: 'Ottieni i Dadi di Energia Psionica (vedi Risorse), che alimentano tre poteri. Campo Protettivo: reazione quando tu o un\'altra creatura che vedi entro 9 m subite danni, spendi un dado e riduci il danno del risultato più il tuo modificatore di Intelligenza (minimo 1). Colpo Psionico: una volta per turno, subito dopo aver colpito con un\'arma infliggendole danno, spendi un dado per infliggere danni da Forza extra pari al risultato più il modificatore di Intelligenza. Movimento Telecinetico: come azione magica, sposti un oggetto libero Grande o più piccolo o una creatura consenziente fino a 9 m entro 9 m da te; una volta per riposo breve o lungo, oppure spendendo un dado (nessuna azione) per ripristinarne l\'uso.' }
            ],
            7: [
              { name: 'Esperto Telecinetico', desc: 'Balzo Psi-Potenziato: come azione bonus, ottieni una velocità di volo pari al doppio della tua fino alla fine del turno; una volta per riposo breve o lungo, oppure spendendo un Dado di Energia Psionica per ripristinarne l\'uso. Spinta Telecinetica: quando infliggi danno con Colpo Psionico, il bersaglio fa un TS di Forza (CD 8 + modificatore di Intelligenza + bonus di competenza) o cade Prono oppure viene spostato fino a 3 m in orizzontale, a tua scelta.' }
            ],
            10: [
              { name: 'Mente Protetta', desc: 'Hai resistenza ai danni Psichici. Inoltre, se inizi il turno Affascinato o Spaventato, puoi spendere un Dado di Energia Psionica (nessuna azione) per porre fine a ogni effetto su di te che applica quelle condizioni.' }
            ],
            15: [
              { name: 'Baluardo di Forza', desc: 'Come azione bonus, scegli creature (te compreso) entro 9 m, fino a un numero pari al tuo modificatore di Intelligenza (minimo 1): hanno Copertura Parziale per 1 minuto o finché non sei Incapacitato. Una volta per riposo lungo, oppure spendendo un Dado di Energia Psionica per ripristinarne l\'uso.' }
            ],
            18: [
              { name: 'Maestro Telecinetico', desc: 'Hai sempre preparato Telecinesi e puoi lanciarlo senza slot né componenti (Intelligenza come caratteristica da incantatore per esso); mentre lo mantieni in concentrazione, incluso il turno in cui lo lanci, puoi attaccare con un\'arma come azione bonus. Una volta lanciato così, serve un riposo lungo per rifarlo, a meno di spendere un Dado di Energia Psionica per ripristinarne l\'uso.' }
            ]
          }
        }
      }
    },
    ladro: {
      name: 'Ladro', hitDie: 'd8', primaryAbility: 'DES', saves: ['DES', 'INT'],
      casterType: 'none',
      sneakAttackD6: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
      // Niente colonna Maestria nelle Armi nella tabella dei privilegi (PHB
      // p.129): resta fissa a 2 tipi per tutta la progressione, come il
      // Paladino — a differenza di Barbaro e Guerriero.
      weaponMastery: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      // 'gue-finesse' = solo le armi da guerra Accurate o Leggere (il Ladro
      // non è competente con TUTTE le armi da guerra come Paladino/Barbaro/
      // Guerriero, es. niente Ascia bipenne): vedi il filtro dedicato in
      // create.js/edit-sheet.js.
      weaponProf: ['sem', 'gue-finesse'],
      startingEquipment: {
        a: {
          label: 'Kit del ladro',
          armorId: 'cuoio', shield: false, weaponId: 'spada-corta',
          extra: [
            { name: 'Pugnale', qty: 2, weaponId: 'pugnale' },
            { name: 'Arco corto', qty: 1, weaponId: 'arco-corto' },
            { name: 'Frecce', qty: 20, weight: 1, desc: 'In una faretra.' },
            { name: 'Strumenti da scasso', qty: 1, weight: 1, desc: 'Per scassinare serrature e disinnescare trappole.' },
            { name: 'Kit dello scassinatore', qty: 1, weight: 42, desc: 'Zaino, biglie di ferro, campanella, 10 candele, piede di porco, lanterna cieca, 7 fiaschette d\'olio, razioni per 5 giorni, corda, acciarino, otre.' }
          ],
          coins: { mo: 8 }
        },
        b: { label: '100 monete d\'oro', coins: { mo: 100 } }
      },
      // Dadi di Energia Psionica dello Spadanima: risorsa di SOTTOCLASSE
      // (filtro già introdotto per il Guerriero), stessa tabella del
      // Combattente Psionico — coincidenza del PHB, non duplicazione: sono
      // due classi diverse, ognuna con la propria copia dei dati.
      classResources: {
        psionicEnergy: {
          name: 'Dadi di Energia Psionica', kind: 'uses', subclass: 'spadanima', resetOn: 'short',
          byLevel: [0, 0, 0, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12],
          dieByLevel: [null, null, null, 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12']
        }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 9, 13, 17],
        asi: [4, 8, 10, 12, 16], epicBoon: 19,
        // Competenza: 2 abilità al 1° livello, altre 2 al 6° ({level,count}
        // invece di un semplice array di livelli: il Ranger ne dà solo 1 al
        // 2° livello, non sempre 2 — vedi create.js/levelup.js).
        expertise: [{ level: 1, count: 2 }, { level: 6, count: 2 }]
      },
      /* Privilegi 1→20 (PHB 2024 p.128-130 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (Competenza dal
         wizard, sottoclasse dal picker, ASI/Dono Epico dal level-up). */
      levelFeatures: {
        1: [
          { name: 'Competenza', trait: false, desc: 'Ottieni Competenza (bonus di competenza raddoppiato) in due delle tue abilità in cui sei già competente. Ne ottieni altre due al 6° livello.' },
          { name: 'Attacco Furtivo', desc: 'Una volta per turno, infliggi danni extra (dado nella colonna Attacco Furtivo) a un bersaglio colpito con un\'arma Accurata o a distanza, se hai vantaggio al tiro oppure un alleato (non Incapacitato) è entro 1,5 m dal bersaglio e tu non hai svantaggio.' },
          { name: 'Gergo Ladresco', desc: 'Conosci il Gergo Ladresco e un\'altra lingua a scelta.' },
          { name: 'Maestria nelle Armi', desc: 'Puoi usare la proprietà di maestria di due tipi di arma a tua scelta fra quelle in cui sei competente. Al riposo lungo puoi cambiare le armi scelte.' }
        ],
        2: [
          { name: 'Azione Scaltra', desc: 'Come azione bonus nel tuo turno puoi Scattare, Disimpegnarti o Nasconderti.' }
        ],
        3: [
          { name: 'Sottoclasse del Ladro', trait: false, desc: 'Scegli una specializzazione (Ladro Esperto, Assassino, Spadanima o Truffatore Arcano). Ottieni i suoi privilegi al tuo livello da ladro o inferiore.' },
          { name: 'Mira Ferma', desc: 'Come azione bonus ottieni vantaggio al prossimo tiro per colpire di questo turno, ma solo se non ti sei mosso in questo turno; dopo l\'uso la tua velocità è 0 fino alla fine del turno.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Colpo Scaltro', desc: 'Quando infliggi danno da Attacco Furtivo puoi rinunciare a uno o più dadi per aggiungere un effetto: Veleno (rinuncia 1d6, TS Costituzione o il bersaglio è Avvelenato 1 minuto, serve un Kit da avvelenatore), Sgambetto (rinuncia 1d6, TS Destrezza o il bersaglio Grande o più piccolo cade Prono), Ritirata (rinuncia 1d6, ti muovi fino a metà velocità senza provocare attacchi di opportunità).' },
          { name: 'Schivata Prodigiosa', desc: 'Quando un attaccante che vedi ti colpisce, puoi usare una reazione per dimezzare (per difetto) i danni subiti.' }
        ],
        6: [
          { name: 'Competenza', trait: false, desc: 'Ottieni Competenza in altre due abilità in cui sei già competente.' }
        ],
        7: [
          { name: 'Schivare', desc: 'Se un effetto ti concede un TS di Destrezza per dimezzare i danni, con un successo non subisci nulla e con un fallimento solo metà; non funziona se sei Incapacitato.' },
          { name: 'Talento Affidabile', desc: 'Nelle prove che usano un\'abilità o uno strumento in cui sei competente, un risultato di 9 o meno sul d20 vale come 10.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua specializzazione.' }
        ],
        10: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        11: [
          { name: 'Colpo Scaltro Migliorato', desc: 'Puoi usare fino a due effetti di Colpo Scaltro sullo stesso Attacco Furtivo, pagando il costo in dadi di ciascuno.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua specializzazione.' }
        ],
        14: [
          { name: 'Colpi Subdoli', desc: 'Nuovi effetti di Colpo Scaltro: Stordire (rinuncia 2d6, TS Costituzione o il bersaglio può solo muoversi o agire, non entrambi, al suo prossimo turno), Fuori Combattito (rinuncia 6d6, TS Costituzione o il bersaglio è Privo di Sensi 1 minuto o finché subisce danni), Offuscare (rinuncia 3d6, TS Destrezza o il bersaglio è Accecato fino alla fine del suo prossimo turno).' }
        ],
        15: [
          { name: 'Mente Sfuggente', desc: 'Ottieni competenza nei tiri salvezza su Saggezza e Carisma.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio della tua specializzazione.' }
        ],
        18: [
          { name: 'Elusivo', desc: 'Nessun tiro per colpire contro di te può avere vantaggio, a meno che tu non sia Incapacitato.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono dello Spirito Notturno) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Colpo di Fortuna', desc: 'Se fallisci una Prova del d20, puoi trasformare il tiro in un 20. Dopo l\'uso serve un riposo breve o lungo per riusarlo.' }
        ]
      },
      /* Sottoclassi del Ladro: Ladro Esperto (PHB p.136), Assassino (p.134) e
         Spadanima (p.135) — resta **Truffatore Arcano** (p.132), rimandato
         come il Cavaliere Occulto del Guerriero: incantatore legato alla
         SOTTOCLASSE con lista incantesimi del Mago, architettura non ancora
         supportata dal motore. */
      subclasses: {
        esperto: {
          name: 'Ladro Esperto',
          tenets: 'Cerca tesori e rovine come l\'avventuriero per eccellenza.',
          features: {
            3: [
              { name: 'Mani Svelte', desc: 'Come azione bonus: una prova di Destrezza (Rapidità di Mano) per scassinare una serratura, disinnescare una trappola o rubare da una tasca con gli Strumenti da Scasso, oppure l\'azione Utilizzare (anche per un oggetto magico che di norma richiederebbe l\'azione Magia).' },
              { name: 'Scalatore Provetto', desc: 'Ottieni velocità di scalata pari alla tua velocità, e calcoli la distanza di salto con la Destrezza invece della Forza.' }
            ],
            9: [
              { name: 'Furtività Suprema', desc: 'Nuovo effetto di Colpo Scaltro: Attacco Furtivo (rinuncia 1d6) — se sei Invisibile per esserti Nascosto, l\'attacco non toglie quella condizione se finisci il turno dietro copertura Tre Quarti o Totale.' }
            ],
            13: [
              { name: 'Uso di Congegni Magici', desc: 'Puoi tenere sintonia con fino a quattro oggetti magici insieme. Quando un oggetto magico consuma cariche, tira 1d6: con un 6 non consumi la carica. Puoi usare qualunque Pergamena di Incantesimo (con l\'Intelligenza come caratteristica); trucchetti e incantesimi di 1° livello riescono sempre, quelli di livello superiore richiedono una prova di Intelligenza (Arcano) CD 10 + livello, e la pergamena si distrugge se fallisci.' }
            ],
            17: [
              { name: 'Riflessi da Ladro', desc: 'Nel primo round di ogni combattimento agisci due volte: un turno alla tua Iniziativa normale, l\'altro all\'Iniziativa meno 10.' }
            ]
          }
        },
        assassino: {
          name: 'Assassino',
          tenets: 'Pratica la cupa arte della morte con discrezione e precisione chirurgica.',
          features: {
            3: [
              { name: 'Assassinio', desc: 'Hai vantaggio ai tiri di iniziativa. Inoltre, durante il primo round di ogni combattimento hai vantaggio ai tiri per colpire contro ogni creatura che non ha ancora agito quel round; se il tuo Attacco Furtivo colpisce un bersaglio in quel round, infligge danni extra (dello stesso tipo dell\'arma) pari al tuo livello da ladro.' },
              { name: 'Strumenti dell\'Assassino', desc: 'Ottieni un Kit da travestimento e un Kit da avvelenatore, con relativa competenza.' }
            ],
            9: [
              { name: 'Competenza da Infiltrazione', desc: 'Imitazione Magistrale: dopo almeno un\'ora di studio, imiti perfettamente il modo di parlare o la calligrafia di una persona (o entrambi). Mira Vagante: la tua velocità non si azzera più usando Mira Ferma.' }
            ],
            13: [
              { name: 'Armi Avvelenate', desc: 'Quando usi l\'effetto Veleno del Colpo Scaltro, il bersaglio che fallisce il TS subisce anche 2d6 danni da Veleno — un danno che ignora la resistenza al Veleno.' }
            ],
            17: [
              { name: 'Colpo Mortale', desc: 'Se colpisci con il tuo Attacco Furtivo nel primo round di un combattimento, il bersaglio supera un TS di Costituzione (CD 8 + il tuo modificatore di Destrezza + il bonus di competenza) o subisce danno raddoppiato da quell\'attacco.' }
            ]
          }
        },
        spadanima: {
          name: 'Spadanima',
          tenets: 'Colpisce con la mente, tagliando ostacoli fisici e psichici.',
          features: {
            3: [
              { name: 'Potere Psionico', desc: 'Ottieni i Dadi di Energia Psionica (vedi Risorse), che alimentano due poteri. Astuzia Rafforzata dalla Psiche: se fallisci una prova di abilità o strumento in cui sei competente, tiri un dado e lo sommi alla prova, trasformandola magari in un successo (consumato solo se il nuovo tiro riesce; la prima volta dopo un riposo lungo è gratuita). Sussurri Psichici: come azione magica, stabilisci un legame telepatico con creature a tua scelta (fino al tuo bonus di competenza), per un numero di ore pari al risultato di un dado.' },
              { name: 'Lame Psichiche', desc: 'Quando compi l\'azione di Attacco o un attacco di opportunità, puoi manifestare in una mano libera una Lama Psichica e attaccare con essa: arma semplice da mischia, 1d6 danni Psichici + il modificatore usato per colpire, proprietà Accurata e Lanciabile (18/36 m), maestria Vex gratuita (non conta nel numero di proprietà usabili). Svanisce subito dopo l\'attacco. Se l\'altra mano è libera, puoi attaccare con una seconda lama (1d4) come azione bonus.' }
            ],
            9: [
              { name: 'Lame dell\'Anima', desc: 'Colpo che Cerca: se manchi con una Lama Psichica, tiri un Dado di Energia Psionica e lo sommi al tiro per colpire, magari trasformandolo in un successo. Teletrasporto Psichico: come azione bonus, manifesti una lama, spendi un dado e la lanci fino a 3 m per ogni punto del risultato in uno spazio libero che vedi, poi ti teletrasporti lì e la lama svanisce.' }
            ],
            13: [
              { name: 'Velo Psichico', desc: 'Come azione magica, ottieni la condizione Invisibile per 1 ora o finché non la termini (nessuna azione); l\'invisibilità finisce prima se infliggi danno o forzi un TS. Una volta per riposo lungo, oppure spendendo un Dado di Energia Psionica per ripristinarne l\'uso.' }
            ],
            17: [
              { name: 'Frantumare la Mente', desc: 'Quando infliggi danno da Attacco Furtivo con una Lama Psichica, il bersaglio supera un TS di Saggezza (CD 8 + il tuo modificatore di Destrezza + il bonus di competenza) o ha la condizione Stordito per 1 minuto, ripetendo il TS alla fine di ogni suo turno. Una volta per riposo lungo, oppure spendendo tre Dadi di Energia Psionica per ripristinarne l\'uso.' }
            ]
          }
        }
      }
    },
    mago: {
      name: 'Mago', hitDie: 'd6', primaryAbility: 'INT', saves: ['INT', 'SAG'],
      casterType: 'full', spellAbility: 'INT',
      cantripsByLevel: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      preparedByLevel: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
      // Niente Maestria nelle Armi (nessuna colonna dedicata, come Bardo/
      // Chierico/Druido/Stregone): solo armi semplici.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit del mago',
          // Il Focus Arcano di partenza del Mago è proprio il Bastone Ferrato
          // impugnato (PHB: "Arcane Focus (Quarterstaff)"): un solo oggetto,
          // niente riga doppia in più — stesso principio del Focus Druidico.
          armorId: '', shield: false, weaponId: 'bastone-ferrato',
          extra: [
            { name: 'Pugnale', qty: 2, weaponId: 'pugnale' },
            { name: 'Veste', qty: 1, weight: 4 },
            { name: 'Libro degli Incantesimi', qty: 1, weight: 3, desc: 'Contiene i 6 incantesimi di 1° livello scelti alla creazione; nuove pagine si aggiungono salendo di livello da mago.' },
            { name: 'Kit dello studioso', qty: 1, weight: 22, desc: 'Zaino, libro, inchiostro, penna, lampada, 10 fiaschette d\'olio, 10 fogli di pergamena, acciarino.' }
          ],
          coins: { mo: 5 }
        },
        b: { label: '55 monete d\'oro', coins: { mo: 55 } }
      },
      // Recupero Arcano: 1 uso per riposo lungo, stesso principio del
      // Metabolismo Sbalorditivo del Monaco — nessun codice nuovo nel motore.
      classResources: {
        arcaneRecovery: { name: 'Recupero Arcano', kind: 'uses', max: 1, resetOn: 'long' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 10, 14],
        asi: [4, 8, 12, 16], epicBoon: 19,
        // Studioso: UNA sola abilità con Competenza al 2° livello (non due
        // come Ladro/Bardo/Ranger) — stesso picker generico, `count: 1`.
        // Semplificazione dichiarata: il PHB restringe la scelta a sei
        // abilità specifiche (Arcano/Storia/Indagare/Medicina/Natura/
        // Religione, esclude Intuizione anche se è fra le competenze di
        // classe); il picker qui non applica quella lista ristretta.
        expertise: [{ level: 2, count: 1 }]
      },
      /* Privilegi 1→20 (PHB 2024 p.164-166 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse/ASI/Dono
         Epico dal level-up, Studioso dal picker di Competenza). Ai livelli
         7/9/11/13/15/17 il PHB non ha un privilegio nuovo, solo i numeri
         delle tabelle (Trucchetti/Preparati/slot) che salgono da soli —
         nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Incantesimi', desc: 'L\'Intelligenza è la tua caratteristica da incantatore. Conosci 3 trucchetti da mago; il tuo libro degli incantesimi parte con 6 incantesimi di 1° livello a scelta e ne prepari 4 dal libro (il numero cresce col livello). Puoi sostituire un trucchetto a ogni riposo lungo e aggiungere 2 incantesimi al libro ogni volta che sali di livello da mago. Puoi usare un Focus Arcano o il libro stesso come focus.' },
          { name: 'Adepto dei Rituali', desc: 'Puoi lanciare come rituale qualunque incantesimo con il descrittore Rituale presente nel tuo libro degli incantesimi, anche senza averlo preparato, purché tu legga dal libro.' },
          { name: 'Recupero Arcano', desc: 'Al termine di un riposo breve, puoi studiare il libro degli incantesimi per recuperare slot già usati, per un totale di livelli pari alla metà del tuo livello da mago (arrotondato per eccesso), nessuno slot di 6° livello o superiore. Puoi usare questo privilegio una sola volta tra un riposo lungo e l\'altro.' }
        ],
        2: [
          { name: 'Studioso', trait: false, desc: 'Scegli una fra Arcano, Storia, Indagare, Medicina, Natura o Religione (in cui sei già competente): ottieni Competenza (bonus di competenza raddoppiato) in quell\'abilità.' }
        ],
        3: [
          { name: 'Sottoclasse del Mago', trait: false, desc: 'Scegli una tradizione arcana (Abiurazione, Divinazione, Evocazione o Illusione). Ottieni i suoi privilegi al tuo livello da mago o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Memorizzare Incantesimo', desc: 'Al termine di un riposo breve, puoi studiare il libro degli incantesimi e sostituire uno degli incantesimi di 1° livello o superiore che hai preparato con un altro incantesimo del libro dello stesso tipo.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua tradizione arcana.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        10: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua tradizione arcana.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua tradizione arcana.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        18: [
          { name: 'Maestria negli Incantesimi', desc: 'Scegli un incantesimo di 1° e uno di 2° livello dal tuo libro con tempo di lancio di un\'azione: li hai sempre preparati e puoi lanciarli al loro livello più basso senza spendere uno slot. Per lanciarli a un livello superiore devi comunque spendere uno slot.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Richiamo degli Incantesimi) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Incantesimi della Firma', desc: 'Scegli due incantesimi di 3° livello dal tuo libro come incantesimi della firma: li hai sempre preparati e puoi lanciare ciascuno una volta al 3° livello senza spendere uno slot (di nuovo dopo un riposo breve o lungo); per lanciarli a un livello superiore devi spendere uno slot.' }
        ]
      },
      /* Sottoclassi del Mago: Divinazione, Evocazione e Illusione fatte (PHB
         2024 p.171-174). Tutte e tre condividono lo stesso privilegio
         d'apertura "Sapiente" (incantesimi extra scelti liberamente nel
         libro dalla propria scuola, non una lista fissa come i giuramenti
         del Paladino o Stregoneria Aberrante — niente `spellsByLevel`
         qui, resta descrittivo). Rivalutato rispetto alla nota precedente:
         "danno extra di Evocazione" (Evocazione Potenziata, +INT a un tiro
         danni) e "cantrip bonus di Illusione" (Illusioni Migliorate) sono
         in realtà descrizioni pure — l'app non calcola i danni degli
         incantesimi come fa per gli attacchi con arma, quindi restano prosa
         come ogni altro privilegio "aggiungi X al danno"/"impara un
         trucchetto in più" già visto altrove. **Abiurazione resta fuori**:
         il Baluardo Arcano è un vero e proprio scudo con PF propri (2×
         livello + mod. Intelligenza) che assorbe danno al posto tuo e si
         rigenera lanciando incantesimi di Abiurazione — un tipo di risorsa
         mai visto (non "N usi", ma un pool di PF con logica di
         assorbimento/rigenerazione), l'unico vero blocco di architettura
         fra le quattro tradizioni. */
      subclasses: {
        divinatore: {
          name: 'Tradizione della Divinazione',
          tenets: 'Squarcia i veli di spazio, tempo e coscienza per svelare i segreti del multiverso.',
          features: {
            3: [
              { name: 'Sapiente della Divinazione', desc: 'Scegli due incantesimi da mago della scuola di Divinazione, non superiori al 2° livello, e aggiungili gratis al tuo libro degli incantesimi. Inoltre, ogni volta che accedi a un nuovo livello di slot in questa classe, puoi aggiungere gratis al libro un altro incantesimo da mago della scuola di Divinazione di quel livello o inferiore.' },
              { name: 'Presagio', desc: 'Al termine di un riposo lungo, tira due d20 e annotane i risultati: puoi sostituire con uno di essi qualunque Prova del d20 tua o di una creatura che vedi, decidendo prima di tirare (una sola sostituzione a turno). Ogni risultato annotato si usa una sola volta e quelli non usati si perdono al riposo lungo successivo.' }
            ],
            6: [
              { name: 'Divinazione Esperta', desc: 'Quando lanci un incantesimo di Divinazione con uno slot di 2° livello o superiore, recuperi uno slot già speso di livello inferiore a quello usato (mai di 6° livello o superiore).' }
            ],
            10: [
              { name: 'Il Terzo Occhio', desc: 'Azione bonus: scegli un beneficio finché non inizi un riposo breve o lungo (una sola volta tra un riposo e l\'altro) — Scurovisione fino a 36 m; Comprensione Superiore (leggi qualunque lingua); oppure lanci Scorgere l\'Invisibile senza spendere uno slot.' }
            ],
            14: [
              { name: 'Presagio Maggiore', desc: 'Tiri tre d20, invece di due, per il privilegio Presagio.' }
            ]
          }
        },
        evocatore: {
          name: 'Tradizione dell\'Evocazione',
          tenets: 'Studia la magia che scatena effetti elementali esplosivi: gelo pungente, fiamma ardente, tuono rombante, fulmine crepitante, acido corrosivo.',
          features: {
            3: [
              { name: 'Sapiente dell\'Evocazione', desc: 'Scegli due incantesimi da mago della scuola di Evocazione, non superiori al 2° livello, e aggiungili gratis al tuo libro degli incantesimi. Inoltre, ogni volta che accedi a un nuovo livello di slot in questa classe, puoi aggiungere gratis al libro un altro incantesimo da mago della scuola di Evocazione di quel livello o inferiore.' },
              { name: 'Trucchetto Potente', desc: 'Quando lanci un trucchetto di danno contro una creatura e manchi il tiro per colpire, o la creatura supera il TS contro di esso, infligge comunque metà del danno del trucchetto (se previsto) ma nessun altro effetto aggiuntivo.' }
            ],
            6: [
              { name: 'Scolpire gli Incantesimi', desc: 'Quando lanci un incantesimo di Evocazione che colpisce altre creature che vedi, puoi scegliere un numero di esse pari a 1 più il livello dell\'incantesimo: quelle creature superano automaticamente il TS contro l\'incantesimo e non subiscono danno se normalmente ne subirebbero metà con un successo.' }
            ],
            10: [
              { name: 'Evocazione Potenziata', desc: 'Ogni volta che lanci un incantesimo da mago della scuola di Evocazione, puoi sommare il tuo modificatore di Intelligenza a uno dei tiri per i danni di quell\'incantesimo.' }
            ],
            14: [
              { name: 'Sovraccarico', desc: 'Quando lanci un incantesimo da mago con uno slot di livello 1-5 che infligge danno, puoi infliggere il danno massimo con quell\'incantesimo nel turno in cui lo lanci. La prima volta che lo fai in un riposo lungo non subisci alcun effetto avverso; ogni volta successiva prima del prossimo riposo lungo, subito dopo aver lanciato l\'incantesimo subisci 2d12 danni Necrotici per livello dello slot (che ignorano resistenza e immunità), con il danno per livello che aumenta di 1d12 a ogni uso ulteriore.' }
            ]
          }
        },
        illusionista: {
          name: 'Tradizione dell\'Illusione',
          tenets: 'Intreccia sottili incantesimi d\'inganno che rendono reale l\'impossibile.',
          spellsByLevel: {
            6: [
              { id: 'evocare-bestia', name: 'Evocare Bestia' },
              { id: 'evocare-folletto', name: 'Evocare Folletto' }
            ]
          },
          features: {
            3: [
              { name: 'Sapiente dell\'Illusione', desc: 'Scegli due incantesimi da mago della scuola di Illusione, non superiori al 2° livello, e aggiungili gratis al tuo libro degli incantesimi. Inoltre, ogni volta che accedi a un nuovo livello di slot in questa classe, puoi aggiungere gratis al libro un altro incantesimo da mago della scuola di Illusione di quel livello o inferiore.' },
              { name: 'Illusioni Migliorate', desc: 'Lanci gli incantesimi di Illusione senza componente Verbale, e se hanno una gittata di almeno 3 m la gittata aumenta di 18 m. Conosci inoltre il trucchetto Illusione Minore (se lo conosci già, impari un altro trucchetto da mago a scelta) senza che conti fra i tuoi trucchetti conosciuti; puoi crearne sia il suono sia l\'immagine con un solo lancio e lanciarlo come azione bonus.' }
            ],
            6: [
              { name: 'Creature Fantasmatiche', desc: 'Hai sempre preparati Evocare Bestia ed Evocare Folletto. Quando lanci uno dei due puoi cambiarne la scuola in Illusione, facendo apparire spettrale la creatura evocata: lanciato così senza spendere uno slot, la creatura ha metà dei PF. Una volta lanciato senza slot uno dei due, serve un riposo lungo per rifarlo.' }
            ],
            10: [
              { name: 'Io Illusorio', desc: 'Quando una creatura ti colpisce con un tiro per colpire, puoi usare la reazione per interporre un duplicato illusorio di te stesso fra l\'attaccante e te: l\'attacco manca automaticamente, poi l\'illusione svanisce. Puoi usarlo una volta per riposo breve o lungo; puoi ripristinarlo spendendo uno slot di 2° livello o superiore (nessuna azione).' }
            ],
            14: [
              { name: 'Realtà Illusoria', desc: 'Quando lanci un incantesimo di Illusione con uno slot, puoi scegliere un oggetto inanimato e non magico che fa parte dell\'illusione e renderlo reale (azione bonus nei turni successivi, finché l\'incantesimo dura): resta reale per 1 minuto, durante il quale non può infliggere danni né dare condizioni.' }
            ]
          }
        }
      }
    },
    monaco: {
      name: 'Monaco', hitDie: 'd8', primaryAbility: 'DES e SAG', saves: ['FOR', 'DES'],
      casterType: 'none',
      martialArtsDie: [null, 'd6', 'd6', 'd6', 'd6', 'd8', 'd8', 'd8', 'd8', 'd8', 'd8', 'd10', 'd10', 'd10', 'd10', 'd10', 'd10', 'd12', 'd12', 'd12', 'd12'],
      focusPoints: [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      // Rinominato da unarmoredMovementM (era specifico del nome, non del
      // gate): stessa tabella, letta da klass.speedBonusM in engine.js.
      speedBonusM: [0, 0, 3, 3, 3, 3, 4.5, 4.5, 4.5, 4.5, 6, 6, 6, 6, 7.5, 7.5, 7.5, 7.5, 9, 9, 9],
      unarmoredDefense: 'SAG',
      // A differenza del Barbaro, il Monaco perde il bonus di CA (e quello di
      // velocità, letto da js/engine.js) se impugna uno scudo — lo dice il PHB.
      unarmoredDefenseNoShield: true,
      extraAttacks: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      startingEquipment: {
        a: {
          label: 'Kit del monaco',
          armorId: '', shield: false, weaponId: 'lancia',
          extra: [
            { name: 'Pugnale', qty: 5, weaponId: 'pugnale' },
            { name: 'Strumenti da Artigiano o Strumento Musicale', qty: 1, weight: 5, desc: 'A scelta, coerenti con la competenza scelta al 1° livello.' },
            { name: 'Kit dell\'esploratore', qty: 1, weight: 55, desc: 'Zaino, giaciglio, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 11 }
        },
        b: { label: '50 monete d\'oro', coins: { mo: 50 } }
      },
      classResources: {
        // Torna TUTTO al riposo breve (non solo 1 uso, a differenza di
        // Recuperare Energie/Azione Impetuosa del Guerriero): 'short-full'.
        focus: { name: 'Punti Focus', kind: 'uses', byLevelRef: 'focusPoints', resetOn: 'short-full' },
        // Si attiva tirando l'iniziativa (non simulata dall'app): resta un
        // usa/spunta manuale, come la Furia del Barbaro non è "on/off".
        uncannyMetabolism: { name: 'Metabolismo Sbalorditivo', kind: 'uses', max: 1, from: 2, resetOn: 'long' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 11, 17],
        asi: [4, 8, 12, 16], epicBoon: 19
      },
      /* Privilegi 1→20 (PHB 2024 p.100-103 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse dal
         picker, ASI/Dono Epico dal level-up); "Aumento..." al 14° livello
         (competenza in tutti i TS) resta descrittivo, come già per "Mente
         Sfuggente" del Ladro — l'utente aggiorna a mano i TS dalla scheda. */
      levelFeatures: {
        1: [
          { name: 'Arti Marziali', desc: 'Puoi tirare il Dado Arti Marziali al posto del danno normale di un colpo senz\'armi o di un\'arma da Monaco (le armi semplici da mischia e quelle da guerra Leggere), e puoi usare la Destrezza al posto della Forza per colpire e per i danni con questi attacchi. Puoi anche fare un colpo senz\'armi come azione bonus.' },
          { name: 'Difesa senza Armatura', desc: 'Quando non indossi armatura né impugni uno scudo, la tua CA base è 10 + modificatore di Destrezza + modificatore di Saggezza.' }
        ],
        2: [
          { name: 'Focus del Monaco', desc: 'Hai una riserva di Punti Focus (colonna omonima) da spendere per alimentare privilegi come Raffica di Colpi (1 punto: due colpi senz\'armi come azione bonus), Difesa Paziente (1 punto: Disimpegnarsi e Schivare come azione bonus) e Passo del Vento (1 punto: Disimpegnarsi e Scattare come azione bonus, gittata di salto raddoppiata). Un punto speso non si può riusare finché non fai un riposo, breve o lungo, dopo il quale li recuperi tutti.' },
          { name: 'Movimento senza Armatura', desc: 'La tua velocità aumenta (colonna Movimento senza Armatura) quando non indossi armatura né impugni uno scudo.' },
          { name: 'Metabolismo Sbalorditivo', desc: 'Quando tiri l\'Iniziativa, puoi recuperare tutti i Punti Focus spesi: se lo fai, tiri anche il tuo Dado Arti Marziali e recuperi PF pari al risultato più il tuo livello da monaco. Dopo l\'uso serve un riposo lungo per riusarlo.' }
        ],
        3: [
          { name: 'Deviare Attacchi', desc: 'Quando un attacco che infligge danni Contundenti, Perforanti o Taglienti ti colpisce, puoi usare una reazione per ridurne i danni di 1d10 + il tuo modificatore di Destrezza + il tuo livello da monaco. Se lo riduci a 0, puoi spendere 1 Punto Focus per rimandare parte della forza a un bersaglio vicino, che con un fallimento a un TS di Destrezza subisce danni pari a due Dadi Arti Marziali + Destrezza.' },
          { name: 'Sottoclasse del Monaco', trait: false, desc: 'Scegli una specializzazione (Guerriero della Mano Aperta, Guerriero della Misericordia, Guerriero dell\'Ombra o Guerriero degli Elementi). Ottieni i suoi privilegi al tuo livello da monaco o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' },
          { name: 'Caduta Lenta', desc: 'Puoi usare una reazione quando cadi per ridurre i danni della caduta di un ammontare pari a cinque volte il tuo livello da monaco.' }
        ],
        5: [
          { name: 'Attacco Extra', trait: false, desc: 'Puoi attaccare due volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' },
          { name: 'Colpo Stordente', desc: 'Una volta per turno, quando colpisci una creatura con un\'arma da Monaco o un colpo senz\'armi, puoi spendere 1 Punto Focus per tentare di stordirla: TS di Costituzione o è Stordita fino all\'inizio del tuo prossimo turno; con un successo la sua velocità è dimezzata e il prossimo tiro per colpire contro di lei ha vantaggio fino ad allora.' }
        ],
        6: [
          { name: 'Colpi Potenziati', desc: 'Quando infliggi danno con un colpo senz\'armi, puoi scegliere che sia di tipo Forza invece del tipo normale.' },
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua specializzazione.' }
        ],
        7: [
          { name: 'Schivare', desc: 'Se un effetto ti concede un TS di Destrezza per dimezzare i danni, con un successo non subisci nulla e con un fallimento solo metà; non funziona se sei Incapacitato.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Movimento Acrobatico', desc: 'Quando non indossi armatura né impugni uno scudo, puoi muoverti lungo superfici verticali e sopra i liquidi nel tuo turno senza cadere durante quel movimento.' }
        ],
        10: [
          { name: 'Focus Superiore', desc: 'Raffica di Colpi, Difesa Paziente e Passo del Vento migliorano: Raffica di Colpi fa tre colpi senz\'armi invece di due; Difesa Paziente dà anche PF temporanei pari a due Dadi Arti Marziali; Passo del Vento può portare con te una creatura consenziente Grande o più piccola entro 1,5 m.' },
          { name: 'Auto-Guarigione', desc: 'Alla fine di ogni tuo turno puoi toglierti di dosso una fra Affascinato, Spaventato o Avvelenato. Inoltre digiunare non ti dà più livelli di Sfinimento.' }
        ],
        11: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua specializzazione.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Deviare Energia', desc: 'Puoi usare Deviare Attacchi anche contro attacchi di qualunque tipo di danno, non solo Contundente, Perforante o Tagliente.' }
        ],
        14: [
          { name: 'Sopravvissuto Disciplinato', desc: 'La tua disciplina fisica e mentale ti dà competenza in tutti i tiri salvezza. Inoltre, quando fallisci un TS, puoi spendere 1 Punto Focus per ripeterlo, tenendo il nuovo risultato.' }
        ],
        15: [
          { name: 'Focus Perfetto', desc: 'Quando tiri l\'Iniziativa e non usi Metabolismo Sbalorditivo, recuperi Punti Focus spesi finché non arrivi a 4, se ne avevi 3 o meno.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio della tua specializzazione.' }
        ],
        18: [
          { name: 'Difesa Superiore', desc: 'A inizio del tuo turno puoi spendere 3 Punti Focus per proteggerti per 1 minuto (o finché non sei Incapacitato): in quel tempo hai Resistenza a tutti i danni tranne quelli di tipo Forza.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono dell\'Offesa Irresistibile) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Corpo e Mente', desc: 'I tuoi punteggi di Destrezza e Saggezza aumentano di 4, fino a un massimo di 25.' }
        ]
      },
      /* Sottoclassi del Monaco: tutte e 4 fatte (PHB p.104-106) — Misericordia,
         Ombra ed Elementi si aggiungono a Mano Aperta. Nessuna richiede una
         risorsa nuova: usano tutte i Punti Focus già tracciati dalla classe
         (a differenza di Guerriero/Ladro, qui non serviva il filtro
         `subclass` per classResources). Shadowy Figments/Manipulate Elements
         (un trucchetto sempre noto, Saggezza come caratteristica) restano
         descrittivi in prosa: il Monaco non è un incantatore
         (`casterType:'none'`), non c'è un grimorio a cui agganciarli. */
      subclasses: {
        'mano-aperta': {
          name: 'Guerriero della Mano Aperta',
          tenets: 'Padroneggia le tecniche di combattimento a mani nude.',
          features: {
            3: [
              { name: 'Tecnica della Mano Aperta', desc: 'Quando colpisci un bersaglio con un attacco di Raffica di Colpi, puoi imporgli uno di questi effetti: Confondere (non può fare attacchi di opportunità fino all\'inizio del suo prossimo turno), Spingere (TS Forza o è spinto fino a 4,5 m) oppure Ribaltare (TS Destrezza o cade Prono).' }
            ],
            6: [
              { name: 'Totalità del Corpo', desc: 'Come azione bonus tiri il tuo Dado Arti Marziali e recuperi PF pari al risultato più il tuo modificatore di Saggezza (minimo 1). Puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1), tutti recuperati al riposo lungo.' }
            ],
            11: [
              { name: 'Passo Spedito', desc: 'Quando usi un\'azione bonus diversa da Passo del Vento, puoi usare anche Passo del Vento subito dopo, senza costo aggiuntivo.' }
            ],
            17: [
              { name: 'Palmo Tremante', desc: 'Quando colpisci con un colpo senz\'armi, puoi spendere 4 Punti Focus per innescare vibrazioni letali nel bersaglio, che durano finché non le fai terminare con un\'azione (o rinunciando a un attacco durante l\'azione di Attacco): il bersaglio deve allora superare un TS di Costituzione o subire 10d12 danni da Forza (metà con un successo).' }
            ]
          }
        },
        misericordia: {
          name: 'Guerriero della Misericordia',
          tenets: 'Manipola le forze della vita e della morte, tra guaritori itineranti e portatori di fine.',
          features: {
            3: [
              { name: 'Mano del Dolore', desc: 'Una volta per turno, quando colpisci con un colpo senz\'armi infliggendo danno, puoi spendere 1 Punto Focus per infliggere danni Necrotici extra pari a un tiro del tuo Dado Arti Marziali più il tuo modificatore di Saggezza.' },
              { name: 'Mano della Guarigione', desc: 'Come azione magica, spendi 1 Punto Focus per toccare una creatura e ridarle PF pari a un tiro del tuo Dado Arti Marziali più il tuo modificatore di Saggezza. Puoi sostituire uno dei colpi di Raffica di Colpi con questo effetto senza spendere il Punto Focus per la cura.' },
              { name: 'Strumenti della Misericordia', desc: 'Ottieni competenza in Intuizione e Medicina e con il Kit da Erborista.' }
            ],
            6: [
              { name: 'Tocco del Medico', desc: 'Mano del Dolore dà anche la condizione Avvelenato fino alla fine del tuo prossimo turno. Mano della Guarigione toglie anche una fra Accecato, Assordato, Paralizzato, Avvelenato o Stordito dalla creatura curata.' }
            ],
            11: [
              { name: 'Raffica di Guarigione e Dolore', desc: 'Con Raffica di Colpi puoi sostituire ogni colpo con Mano della Guarigione senza spendere Punti Focus per la cura; inoltre puoi usare Mano del Dolore senza spendere il Punto Focus su un colpo di Raffica di Colpi (resta comunque una volta per turno). Puoi farlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1), tutte recuperate al riposo lungo.' }
            ],
            17: [
              { name: 'Mano della Misericordia Suprema', desc: 'Come azione magica, spendi 5 Punti Focus e tocchi il cadavere di una creatura morta nelle ultime 24 ore: torna in vita con PF pari a 4d10 + il tuo modificatore di Saggezza, guarita da Accecato/Assordato/Paralizzato/Avvelenato/Stordito se ne era affetta. Una volta per riposo lungo.' }
            ]
          }
        },
        ombra: {
          name: 'Guerriero dell\'Ombra',
          tenets: 'Pratica furtività e inganno attingendo al potere del Piano Ombra.',
          features: {
            3: [
              { name: 'Arti dell\'Ombra', desc: 'Oscurità: spendi 1 Punto Focus per lanciare Oscurità senza componenti, vedendoci dentro l\'area; puoi spostarla entro 18 m da te a inizio di ogni tuo turno. Scurovisione: ottieni Scurovisione fino a 18 m (aumentata di 18 m se già presente). Figure d\'Ombra: conosci Illusione Minore, con la Saggezza come caratteristica da incantatore.' }
            ],
            6: [
              { name: 'Passo Ombroso', desc: 'Mentre sei interamente in Luce Fioca o Oscurità, come azione bonus ti teletrasporti fino a 18 m in uno spazio che vedi, anch\'esso in Luce Fioca o Oscurità: hai poi vantaggio al prossimo attacco in mischia entro la fine del turno.' }
            ],
            11: [
              { name: 'Passo Ombroso Migliorato', desc: 'Usando Passo Ombroso puoi spendere 1 Punto Focus per togliere il requisito di partire e arrivare in Luce Fioca o Oscurità, e fare subito dopo un colpo senz\'armi come parte dell\'azione bonus.' }
            ],
            17: [
              { name: 'Manto d\'Ombre', desc: 'Come azione magica, mentre sei interamente in Luce Fioca o Oscurità, spendi 3 Punti Focus per avvolgerti d\'ombre per 1 minuto (finché non sei Incapacitato o finisci il turno in Luce Intensa): ottieni Invisibile, ti muovi attraverso spazi occupati come terreno difficile (rientrando nell\'ultimo spazio libero se finisci il turno lì dentro), e usi Raffica di Colpi senza spendere Punti Focus.' }
            ]
          }
        },
        elementi: {
          name: 'Guerriero degli Elementi',
          tenets: 'Attinge al potere dei Piani Elementali per colpire e dominare il campo di battaglia.',
          features: {
            3: [
              { name: 'Sintonia Elementale', desc: 'A inizio del tuo turno, spendi 1 Punto Focus per infonderti di energia elementale per 10 minuti (finché non sei Incapacitato). Portata: i tuoi colpi senz\'armi hanno 3 m di portata in più. Colpi Elementali: un colpo senz\'armi che va a segno può infliggere danno Acido, Freddo, Fuoco, Fulmine o Tuono invece del tipo normale; se lo fai, il bersaglio fa un TS di Forza o viene spostato fino a 3 m verso o lontano da te.' },
              { name: 'Manipolare gli Elementi', desc: 'Conosci Elementalismo, con la Saggezza come caratteristica da incantatore.' }
            ],
            6: [
              { name: 'Scoppio Elementale', desc: 'Come azione magica, spendi 2 Punti Focus per far esplodere energia elementale in una Sfera di 6 m di raggio entro 36 m: scegli Acido, Freddo, Fuoco, Fulmine o Tuono. Ogni creatura nella sfera fa un TS di Destrezza, subendo danni pari a tre tiri del tuo Dado Arti Marziali (metà con un successo).' }
            ],
            11: [
              { name: 'Incedere degli Elementi', desc: 'Mentre la tua Sintonia Elementale è attiva, hai anche velocità di volo e di nuoto pari alla tua velocità normale.' }
            ],
            17: [
              { name: 'Massima Espressione Elementale', desc: 'Mentre la tua Sintonia Elementale è attiva: ottieni resistenza a un tipo di danno a scelta fra Acido, Freddo, Fuoco, Fulmine o Tuono (cambiabile a inizio di ogni tuo turno); usando Passo del Vento, la tua velocità aumenta di 6 m fino alla fine del turno e ogni creatura in cui entri entro 1,5 m subisce un tiro del tuo Dado Arti Marziali del tipo scelto (una volta a testa per turno); una volta per turno, un colpo senz\'armi a segno infligge danni extra pari a un tiro del Dado Arti Marziali.' }
            ]
          }
        }
      }
    },
    paladino: {
      name: 'Paladino', hitDie: 'd10', primaryAbility: 'FOR e CAR', saves: ['SAG', 'CAR'],
      casterType: 'half', spellAbility: 'CAR',
      channelDivinity: [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
      /* Risorse di classe dati-driven (Blocco 5.A, schema C): i valori che
         dipendono SOLO dal livello vivono qui come dati (serializzabili →
         Firestore); i bonus che scalano con una caratteristica stanno nel
         registry CLASS_BONUSES di js/engine.js. 'pool' = riserva spendibile
         (come i PF), 'uses' = res-card a ricarica. */
      /* Competenza nelle armi ('sem' = semplici, 'gue' = da guerra) e numero di
         tipi di arma di cui puoi usare la maestria, per livello. Il PHB dà al
         Paladino la Maestria nelle Armi al 1° su DUE tipi e non prevede
         aumenti (la sua tabella dei privilegi non ha la colonna Maestria,
         a differenza di Barbaro e Guerriero). */
      weaponProf: ['sem', 'gue'],
      weaponMastery: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      extraAttacks: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      /* Equipaggiamento iniziale: le due opzioni del PHB, senza vie di mezzo.
         La personalizzazione (master che concede altro) si fa dopo, nella
         scheda (decisione 5.B.5). `extra` = roba che finisce nell'inventario. */
      startingEquipment: {
        a: {
          label: 'Kit del paladino',
          armorId: 'cotta-maglia', shield: true, weaponId: 'spada-lunga',
          extra: [
            { name: 'Giavellotto', qty: 6, weaponId: 'giavellotto' },
            // Il PHB dà il simbolo sacro come "peso variabile" secondo la forma
            // (amuleto 1 lb, emblema su stoffa/scudo senza peso, reliquiario
            // 2 lb): qui vale l'amuleto.
            { name: 'Simbolo sacro', qty: 1, weight: 1, desc: 'Focus per gli incantesimi da paladino.' },
            { name: 'Kit del sacerdote', qty: 1, weight: 29, desc: 'Zaino, coperta, acqua santa, lampada, razioni per 7 giorni, veste, acciarino.' }
          ],
          coins: { mo: 9 }
        },
        b: { label: '150 monete d\'oro', coins: { mo: 150 } }
      },
      /* Incantesimi che la CLASSE tiene sempre preparati, dal livello indicato
         (PHB 2024: Punizione Divina dal 2° con Punizione del Paladino, Trova
         Destriero dal 5° con Destriero Fedele). Non contano verso il numero di
         incantesimi preparabili. Stesso formato di subclasses.spellsByLevel. */
      spellsByLevel: {
        2: [{ id: 'punizione-divina', name: 'Punizione Divina' }],
        5: [{ id: 'trova-destriero', name: 'Trova Destriero' }]
      },
      classResources: {
        loh: { name: 'Imposizione delle Mani', kind: 'pool',
               byLevel: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100] },
        smitefree: { name: 'Punizione Divina (gratis)', kind: 'uses', from: 2, max: 1 },
        steedfree: { name: 'Evoca Destriero (gratis)', kind: 'uses', from: 5, max: 1 }
      },
      /* Privilegi per livello (Step 4.1, per il futuro wizard di Level Up —
         Step 4.5): riassunti originali in italiano, verificati sul PHB 2024.
         Non ancora consumati da nessuna vista della scheda. */
      levelFeatures: {
        1: [
          { name: 'Imposizione delle Mani', trait: false, desc: 'Riserva di cura pari a 5 × il tuo livello da paladino, che si ricarica al riposo lungo. Azione bonus: tocchi una creatura (anche te stesso) e le ridai PF attinti dalla riserva. Puoi spendere 5 PF della riserva per rimuovere la condizione Avvelenato.' },
          { name: 'Incantesimi', trait: false, desc: 'Lanci incantesimi da paladino usando il Carisma. Prepari una lista di incantesimi il cui numero cresce col livello (colonna Incantesimi preparati). Sei un incantatore a metà.' },
          { name: 'Maestria nelle Armi', desc: 'Puoi usare la proprietà di maestria di due tipi di arma con cui sei competente. Al riposo lungo puoi cambiare le armi scelte.' }
        ],
        2: [
          { name: 'Stile di Combattimento', trait: false, desc: 'Ottieni un talento di Stile di Combattimento a tua scelta (in alternativa, Guerriero Benedetto: impari due trucchetti da chierico, con Carisma come caratteristica).' },
          { name: 'Punizione del Paladino', trait: false, desc: 'Hai sempre preparato l\'incantesimo Punizione Divina. Inoltre puoi lanciarlo una volta senza spendere uno slot; recuperi quest\'uso al riposo lungo.' }
        ],
        3: [
          { name: 'Incanalare Divinità', trait: false, desc: 'Incanali energia divina per alimentare effetti magici. Parti con l\'effetto Percezione Divina; altri privilegi ne aggiungono altri. Hai 2 usi (3 dall\'11° livello), ne recuperi uno al riposo breve e tutti al riposo lungo.' },
          { name: 'Percezione Divina', desc: 'Effetto di Incanalare Divinità. Azione bonus: per 10 minuti percepisci Celestiali, Immondi e Non Morti entro 18 m (posizione e tipo), e i luoghi o oggetti consacrati o profanati nello stesso raggio.' },
          { name: 'Sottoclasse del Paladino', trait: false, desc: 'Scegli un Giuramento (Devozione, Gloria, Antichi o Vendetta). Ottieni i suoi privilegi al tuo livello da paladino o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1 ciascuno, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Attacco Extra', trait: false, desc: 'Puoi attaccare due volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' },
          { name: 'Destriero Fedele', desc: 'Hai sempre preparato l\'incantesimo Trova Destriero. Puoi lanciarlo anche una volta senza spendere uno slot; recuperi quest\'uso al riposo lungo.' }
        ],
        6: [
          { name: 'Aura di Protezione', desc: 'Emani un\'aura protettiva entro 3 m. Tu e i tuoi alleati nell\'aura ricevete a tutti i tiri salvezza un bonus pari al tuo modificatore di Carisma (minimo +1). L\'aura è inattiva se hai la condizione Incapacitato.' }
        ],
        7: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo Giuramento (dipende dalla sottoclasse scelta).' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Scacciare i Nemici', desc: 'Azione Magica, spendendo un uso di Incanalare Divinità: bersagli un numero di creature pari al tuo modificatore di Carisma (minimo 1) che vedi entro 18 m. Ognuna fa un TS Saggezza o è Spaventata per 1 minuto (o finché non subisce danni). Mentre è Spaventata così, nel suo turno può fare solo una cosa tra muoversi, compiere un\'azione o un\'azione bonus.' }
        ],
        10: [
          { name: 'Aura di Coraggio', desc: 'Tu e i tuoi alleati siete immuni alla condizione Spaventato mentre siete nella tua Aura di Protezione. Se un alleato Spaventato entra nell\'aura, la condizione non ha effetto su di lui finché resta.' }
        ],
        11: [
          { name: 'Colpi Radiosi', desc: 'Quando colpisci un bersaglio con un tiro per colpire usando un\'arma da mischia o un colpo senz\'armi, infliggi 1d8 danni Radiosi aggiuntivi.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [],
        14: [
          { name: 'Tocco Ristoratore', desc: 'Quando usi Imposizione delle Mani su una creatura, puoi anche rimuovere una o più di queste condizioni: Accecato, Affascinato, Assordato, Spaventato, Paralizzato, Stordito. Spendi 5 PF della riserva per ciascuna condizione rimossa (questi PF non curano anche i PF della creatura).' }
        ],
        15: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo Giuramento.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [],
        18: [
          { name: 'Espansione dell\'Aura', desc: 'La tua Aura di Protezione diventa un\'emanazione di 9 m.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico a scelta (o un altro talento per cui sei idoneo). È consigliato il Dono della Vista Autentica.' }
        ],
        20: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni il privilegio finale del tuo Giuramento.' }
        ]
      },
      /* Livelli che richiedono una scelta dell'utente: per il futuro wizard
         di Level Up (Step 4.5). Niente array annidati dentro array (limite
         Firestore): solo array di numeri dentro la mappa. */
      choicePoints: {
        fightingStyle: 2,
        subclass: 3,
        subclassFeatureLevels: [3, 7, 15, 20],
        asi: [4, 8, 12, 16],
        epicBoon: 19
      },
      /* Sottoclassi (Giuramenti) — Step 4.2: per ora solo Devozione (scelta
         dell'utente), le altre si aggiungono in seguito. Riassunti originali
         in italiano, verificati sul PHB 2024. Non ancora consumati da
         nessuna vista della scheda. */
      subclasses: {
        devozione: {
          name: 'Giuramento di Devozione',
          tenets: 'Che la tua parola sia una promessa. · Proteggi i deboli e non temere mai di agire. · Che le tue gesta onorevoli siano d\'esempio.',
          /* Incantesimi sempre preparati garantiti dal giuramento (PHB 2024,
             tabella "Oath of Devotion Spells"). Il grimorio li pesca da qui
             (5.B.3): `id` aggancia il catalogo `spells`, `name` resta per
             mostrarli comunque; `id: null` = incantesimo non ancora nel
             catalogo, quindi elencabile ma non apribile. */
          spellsByLevel: {
            3: [
              { id: 'protezione-mal-bene', name: 'Protezione dal Male e dal Bene' },
              { id: 'scudo-della-fede', name: 'Scudo della Fede' }
            ],
            5: [
              { id: 'aiuto', name: 'Aiuto' },
              { id: 'zona-di-verita', name: 'Zona di Verità' }
            ],
            9: [
              { id: 'faro-speranza', name: 'Faro di Speranza' },
              { id: 'dissolvi-magie', name: 'Dissolvi Magie' }
            ],
            13: [
              { id: 'liberta-di-movimento', name: 'Libertà di Movimento' },
              { id: 'guardiano-fede', name: 'Guardiano della Fede' }
            ],
            17: [
              { id: 'comunione', name: 'Comunione' },
              { id: 'colpo-infuocato', name: 'Colpo Infuocato' }
            ]
          },
          features: {
            3: [
              { name: 'Arma Sacra', desc: 'Quando compi l\'azione di Attacco, puoi spendere un uso di Incanalare Divinità per infondere energia positiva in un\'arma da mischia che impugni. Per 10 minuti (o finché non riusi questo privilegio), aggiungi il tuo modificatore di Carisma ai tiri per colpire con quell\'arma (minimo +1) e a ogni colpo scegli se infliggere il tipo di danno normale o danni Radiosi. L\'arma emette luce intensa entro 6 m e luce fioca per altri 6 m. Puoi terminare l\'effetto in anticipo (nessuna azione); termina anche se smetti di impugnare l\'arma.' }
            ],
            7: [
              { name: 'Aura di Devozione', desc: 'Tu e i tuoi alleati siete immuni alla condizione Affascinato mentre siete nella tua Aura di Protezione. Se un alleato Affascinato entra nell\'aura, la condizione non ha effetto su di lui finché vi resta.' }
            ],
            15: [
              { name: 'Punizione di Protezione', desc: 'Quando lanci Punizione Divina, tu e i tuoi alleati avete Copertura Parziale mentre siete nella tua Aura di Protezione. L\'aura conferisce questo beneficio fino all\'inizio del tuo prossimo turno.' }
            ],
            20: [
              { name: 'Nimbo Sacro', desc: 'Azione bonus: infondi la tua Aura di Protezione di potere sacro per 10 minuti o finché non la termini (nessuna azione). Una volta usato, devi finire un riposo lungo prima di riusarlo, oppure puoi ripristinarne l\'uso spendendo uno slot di 5° livello. Benefici: Salvaguardia Sacra (vantaggio ai tiri salvezza imposti da Immondi o Non Morti); Danni Radiosi (un nemico che inizia il turno nell\'aura subisce danni Radiosi pari al tuo modificatore di Carisma più il tuo bonus di competenza); Luce Solare (l\'aura è piena di luce intensa considerata luce solare).' }
            ]
          }
        },
        /* Giuramenti di Gloria, degli Antichi e di Vendetta (PHB 2024, p.113-116
           del PDF): completano le 4 sottoclassi del Paladino — prima c'era solo
           Devozione. Stessa struttura: `tenets`, `spellsByLevel` (sempre
           preparati a 3/5/9/13/17, letti dal grimorio) e `features` (privilegi
           di sottoclasse ai livelli di `choicePoints.subclassFeatureLevels` =
           [3,7,15,20]). Riassunti originali in italiano. */
        gloria: {
          name: 'Giuramento di Gloria',
          tenets: 'Fatti conoscere per le tue gesta. · Affronta le difficoltà con coraggio. · Ispira gli altri a puntare alla gloria.',
          spellsByLevel: {
            3: [
              { id: 'dardo-di-guida', name: 'Dardo di Guida' },
              { id: 'eroismo', name: 'Eroismo' }
            ],
            5: [
              { id: 'potenziare-capacita', name: 'Potenziare Capacità' },
              { id: 'arma-magica', name: 'Arma Magica' }
            ],
            9: [
              { id: 'accelerare', name: 'Accelerare' },
              { id: 'protezione-dall-energia', name: 'Protezione dall\'Energia' }
            ],
            13: [
              { id: 'costrizione', name: 'Costrizione' },
              { id: 'liberta-di-movimento', name: 'Libertà di Movimento' }
            ],
            17: [
              { id: 'ricordo-leggendario', name: 'Ricordo Leggendario' },
              { id: 'presenza-regale-di-yolande', name: 'Presenza Regale di Yolande' }
            ]
          },
          features: {
            3: [
              { name: 'Punizione Ispiratrice', desc: 'Subito dopo aver lanciato Punizione Divina, puoi spendere un uso di Incanalare Divinità per distribuire PF temporanei (2d8 + il tuo livello da paladino, divisi come vuoi) fra le creature a tua scelta entro 9 m, te compreso.' },
              { name: 'Atleta Impareggiabile', desc: 'Azione bonus: spendi un uso di Incanalare Divinità per un\'ora di vantaggio alle prove di Forza (Atletica) e Destrezza (Acrobazia), con salti in lungo e in alto più lunghi di 3 m (il movimento extra si paga come sempre).' }
            ],
            7: [
              { name: 'Aura di Alacrità', desc: 'La tua velocità aumenta di 3 m. Inoltre, quando un alleato entra per la prima volta nel turno nella tua Aura di Protezione, o vi comincia il turno, la sua velocità aumenta di 3 m fino alla fine del suo turno successivo.' }
            ],
            15: [
              { name: 'Difesa Gloriosa', desc: 'Con una reazione, quando tu o un\'altra creatura a vista entro 3 m siete colpiti da un attacco, dai al bersaglio un bonus alla CA (il tuo modificatore di Carisma, minimo +1) contro quell\'attacco: se lo manca, puoi attaccare l\'attaccante con un\'arma se è a portata. Usi pari al modificatore di Carisma (minimo 1), tutti recuperati al riposo lungo.' }
            ],
            20: [
              { name: 'Leggenda Vivente', desc: 'Azione bonus: per 10 minuti (o finché non termini l\'effetto), ottieni Carismatico (vantaggio a tutte le prove di Carisma), Ririlancio del Tiro Salvezza (con una reazione, ritiri un TS fallito e tieni il nuovo risultato) e Colpo Infallibile (una volta per turno trasformi in un colpo un attacco con arma che ha mancato). Una volta usato, serve un riposo lungo per riusarlo, oppure uno slot di 5° livello per ripristinarlo.' }
            ]
          }
        },
        antichi: {
          name: 'Giuramento degli Antichi',
          tenets: 'Ravviva la luce della speranza. · Proteggi la vita. · Gioisci nell\'arte e nella risata.',
          spellsByLevel: {
            3: [
              { id: 'colpo-intrappolante', name: 'Colpo Intrappolante' },
              { id: 'parlare-con-gli-animali', name: 'Parlare con gli Animali' }
            ],
            5: [
              { id: 'passo-fatato', name: 'Passo Fatato' },
              { id: 'raggio-lunare', name: 'Raggio Lunare' }
            ],
            9: [
              { id: 'crescita-delle-piante', name: 'Crescita delle Piante' },
              { id: 'protezione-dall-energia', name: 'Protezione dall\'Energia' }
            ],
            13: [
              { id: 'tempesta-di-ghiaccio', name: 'Tempesta di Ghiaccio' },
              { id: 'pelle-di-pietra', name: 'Pelle di Pietra' }
            ],
            17: [
              { id: 'comunione-con-la-natura', name: 'Comunione con la Natura' },
              { id: 'passo-dellalbero', name: 'Passo dell\'Albero' }
            ]
          },
          features: {
            3: [
              { name: 'Ira della Natura', desc: 'Con un\'azione magica, spendi un uso di Incanalare Divinità per evocare viticci spettrali: le creature a tua scelta entro 4,5 m fanno un TS Forza o restano Trattenute per 1 minuto, ripetendo il TS alla fine di ogni loro turno.' }
            ],
            7: [
              { name: 'Aura Arcana', desc: 'Tu e i tuoi alleati avete resistenza ai danni Necrotici, Psichici e Radiosi mentre siete nella tua Aura di Protezione.' }
            ],
            15: [
              { name: 'Sentinella Immortale', desc: 'Se scendi a 0 PF senza morire sul colpo, puoi restare a 1 PF invece e recuperarne un numero pari al triplo del tuo livello da paladino; una volta per riposo lungo. Inoltre non invecchi più magicamente e smetti di invecchiare a vista.' }
            ],
            20: [
              { name: 'Campione degli Antichi', desc: 'Azione bonus: per 1 minuto (o finché non termini l\'effetto), ottieni Sfida alla Sfida (i nemici nell\'aura hanno svantaggio ai TS contro i tuoi incantesimi e le tue opzioni di Incanalare Divinità), Rigenerazione (recuperi 10 PF a inizio di ogni tuo turno) e Incantesimi Rapidi (puoi lanciare come azione bonus un incantesimo che normalmente richiede un\'azione). Una volta usato, serve un riposo lungo per riusarlo, oppure uno slot di 5° livello per ripristinarlo.' }
            ]
          }
        },
        vendetta: {
          name: 'Giuramento di Vendetta',
          tenets: 'Non mostrare pietà ai malvagi. · Combatti l\'ingiustizia e le sue cause. · Aiuta chi è colpito dall\'ingiustizia.',
          spellsByLevel: {
            3: [
              { id: 'maledizione', name: 'Maledizione' },
              { id: 'marchio-del-cacciatore', name: 'Marchio del Cacciatore' }
            ],
            5: [
              { id: 'tenere-persone', name: 'Tenere Persone' },
              { id: 'passo-fatato', name: 'Passo Fatato' }
            ],
            9: [
              { id: 'accelerare', name: 'Accelerare' },
              { id: 'protezione-dall-energia', name: 'Protezione dall\'Energia' }
            ],
            13: [
              { id: 'bandire', name: 'Bandire' },
              { id: 'porta-dimensionale', name: 'Porta Dimensionale' }
            ],
            17: [
              { id: 'tenere-mostri', name: 'Tenere Mostri' },
              { id: 'scrutare', name: 'Scrutare' }
            ]
          },
          features: {
            3: [
              { name: 'Voto di Inimicizia', desc: 'Quando compi l\'azione di Attacco, puoi spendere un uso di Incanalare Divinità per giurare inimicizia a una creatura a vista entro 9 m: per 1 minuto (o finché non riusi questo privilegio) hai vantaggio ai tiri per colpire contro di lei. Se scende a 0 PF prima che il voto finisca, puoi trasferirlo a un\'altra creatura entro 9 m (nessuna azione).' }
            ],
            7: [
              { name: 'Vendicatore Instancabile', desc: 'Quando colpisci con un attacco di opportunità, puoi ridurre a 0 la velocità del bersaglio fino alla fine del turno e poi muoverti fino a metà della tua velocità come parte della stessa reazione, senza provocare attacchi di opportunità.' }
            ],
            15: [
              { name: 'Anima della Vendetta', desc: 'Subito dopo che una creatura sotto il tuo Voto di Inimicizia colpisce o manca con un attacco, puoi usare una reazione per attaccarla in mischia se è a portata.' }
            ],
            20: [
              { name: 'Angelo Vendicatore', desc: 'Azione bonus: per 10 minuti (o finché non termini l\'effetto), ottieni Volo (velocità di volo 18 m, puoi librarti) e Aura Terrificante (un nemico che inizia il turno nella tua Aura di Protezione fa un TS Saggezza o è Spaventato per 1 minuto o finché non subisce danni; gli attacchi contro chi è Spaventato così hanno vantaggio). Una volta usato, serve un riposo lungo per riusarlo, oppure uno slot di 5° livello per ripristinarlo.' }
            ]
          }
        }
      }
    },
    ranger: {
      name: 'Ranger', hitDie: 'd10', primaryAbility: 'DES e SAG', saves: ['FOR', 'DES'],
      casterType: 'half', spellAbility: 'SAG',
      favoredEnemy: [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
      // Nessuna colonna Maestria nella tabella dei privilegi (p.119): fissa a
      // 2 tipi per tutta la progressione, come Paladino e Ladro.
      weaponMastery: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      weaponProf: ['sem', 'gue'],
      extraAttacks: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      // Marcia Spedita (livello 6): +10 piedi di velocità mentre non indossi
      // un'armatura Pesante (non "niente armatura", come il Monaco — da qui
      // il gate diverso letto in engine.js).
      speedBonusM: [0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      speedBonusGate: 'notHeavy',
      startingEquipment: {
        a: {
          label: 'Kit del ranger',
          armorId: 'cuoio-borchiato', shield: false, weaponId: 'scimitarra',
          extra: [
            { name: 'Spada corta', qty: 1, weaponId: 'spada-corta' },
            { name: 'Arco lungo', qty: 1, weaponId: 'arco-lungo' },
            { name: 'Frecce', qty: 20, weight: 1, desc: 'In una faretra.' },
            { name: 'Focus Druidico', qty: 1, weight: 0, desc: 'Un rametto di vischio, per gli incantesimi da ranger.' },
            { name: 'Kit dell\'esploratore', qty: 1, weight: 55, desc: 'Zaino, giaciglio, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 7 }
        },
        b: { label: '150 monete d\'oro', coins: { mo: 150 } }
      },
      classResources: {
        // Come Punizione Divina/Evoca Destriero gratis del Paladino: Marchio
        // del Cacciatore lanciabile senza slot, tante volte quante la
        // colonna Nemico Prescelto.
        huntersMarkFree: { name: 'Marchio del Cacciatore (gratis)', kind: 'uses', byLevelRef: 'favoredEnemy', resetOn: 'long' },
        // Colpo Terrificante (Cercatore d'Ombre, dal 3°) e Passo Fatato
        // Libero (Vagabondo Fatato, dal 15°): entrambi scalati sul
        // modificatore di Saggezza (come l'Ispirazione Bardica), risorsa di
        // SOTTOCLASSE — stesso filtro già in uso per Guerriero/Ladro.
        dreadfulStrike: {
          name: 'Colpo Terrificante', kind: 'uses', subclass: 'cercatore-ombre',
          abilityMod: 'SAG', min: 1, from: 3, resetOn: 'long'
        },
        mistyWanderer: {
          name: 'Passo Fatato Libero', kind: 'uses', subclass: 'vagabondo-fatato',
          abilityMod: 'SAG', min: 1, from: 15, resetOn: 'long'
        }
      },
      choicePoints: {
        fightingStyle: 2,
        subclass: 3, subclassFeatureLevels: [3, 7, 11, 15],
        asi: [4, 8, 12, 16], epicBoon: 19,
        // Competenza: solo 1 abilità al 2° livello (Esploratore Provetto),
        // 2 in più al 9° (Competenza) — non sempre 2 come per il Ladro.
        expertise: [{ level: 2, count: 1 }, { level: 9, count: 2 }]
      },
      /* Incantesimo sempre preparato dalla classe (PHB 2024: Marchio del
         Cacciatore dal 1° livello, gratis grazie a Nemico Prescelto). Stesso
         formato di subclasses.spellsByLevel. */
      spellsByLevel: {
        1: [{ id: 'marchio-del-cacciatore', name: 'Marchio del Cacciatore' }]
      },
      /* Privilegi 1→20 (PHB 2024 p.118-120 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (Stile di
         Combattimento/Competenza dal wizard, sottoclasse dal picker,
         ASI/Dono Epico dal level-up). */
      levelFeatures: {
        1: [
          { name: 'Incantesimi', desc: 'Impari a incanalare l\'essenza magica della natura. Prepari incantesimi da ranger di 1° livello o superiore (2 all\'inizio) usando la Saggezza come caratteristica da incantatore; puoi cambiarne uno a ogni riposo lungo.' },
          { name: 'Nemico Prescelto', desc: 'Hai sempre preparato Marchio del Cacciatore e puoi lanciarlo senza spendere uno slot un numero di volte pari alla colonna Nemico Prescelto; recuperi tutti gli usi con un riposo lungo.' },
          { name: 'Maestria nelle Armi', desc: 'Puoi usare la proprietà di maestria di due tipi di arma a tua scelta fra quelle in cui sei competente. Al riposo lungo puoi cambiare le armi scelte.' }
        ],
        2: [
          { name: 'Esploratore Provetto', trait: false, desc: 'Ottieni Competenza in un\'abilità in cui sei già competente, e impari due lingue a tua scelta.' },
          { name: 'Stile di Combattimento', trait: false, desc: 'Ottieni un talento di Stile di Combattimento a tua scelta (in alternativa, Guerriero Druidico: impari due trucchetti da druido, con Saggezza come caratteristica).' }
        ],
        3: [
          { name: 'Sottoclasse del Ranger', trait: false, desc: 'Scegli una specializzazione (Cacciatore, Vagabondo Fatato, Cercatore d\'Ombre o Domatore di Bestie). Ottieni i suoi privilegi al tuo livello da ranger o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Attacco Extra', trait: false, desc: 'Puoi attaccare due volte, invece di una, ogni volta che compi l\'azione di Attacco nel tuo turno.' }
        ],
        6: [
          { name: 'Marcia Spedita', desc: 'La tua velocità aumenta di 3 metri mentre non indossi un\'armatura Pesante. Ottieni anche velocità di scalata e di nuoto pari alla tua velocità.' }
        ],
        7: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua specializzazione.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Competenza', trait: false, desc: 'Ottieni Competenza in altre due abilità in cui sei già competente.' }
        ],
        10: [
          { name: 'Instancabile', desc: 'Come azione magica puoi darti PF temporanei pari a 1d8 + il tuo modificatore di Saggezza (minimo 1); puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1), tutti recuperati al riposo lungo. Inoltre, a ogni riposo breve, il tuo livello di Sfinimento (se ne hai uno) scende di 1.' }
        ],
        11: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua specializzazione.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Cacciatore Implacabile', desc: 'Subire danni non può più interrompere la tua concentrazione su Marchio del Cacciatore.' }
        ],
        14: [
          { name: 'Velo della Natura', desc: 'Come azione bonus puoi diventare Invisibile fino alla fine del tuo prossimo turno. Puoi usarlo un numero di volte pari al tuo modificatore di Saggezza (minimo 1), tutti recuperati al riposo lungo.' }
        ],
        15: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio della tua specializzazione.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Cacciatore Preciso', desc: 'Hai vantaggio ai tiri per colpire contro la creatura attualmente marcata dal tuo Marchio del Cacciatore.' }
        ],
        18: [
          { name: 'Sensi Selvatici', desc: 'Ottieni Scorgimento (Blindsight) entro 9 metri.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Viaggio Dimensionale) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Flagello dei Nemici', desc: 'Il dado del danno extra di Marchio del Cacciatore diventa 1d10 invece di 1d6.' }
        ]
      },
      /* Sottoclassi del Ranger: tutte e 4 fatte (PHB p.122-127). Domatore di
         Bestie (Compagno Primordiale) resta descrittivo in prosa: è un vero
         e proprio secondo statblock da tracciare (come il Destriero del
         Paladino, ma un sistema dedicato per una seconda classe sarebbe un
         lavoro a parte, non solo dati) — stessa scelta di semplicità già
         fatta per meccaniche fuori dalla portata di una scheda a personaggio
         singolo. Vagabondo Fatato e Cercatore d'Ombre invece hanno risorse
         scalate su Saggezza (Colpo Terrificante, Passo Fatato Libero) e il
         Cercatore d'Ombre ha anche un bonus di sottoclasse all'Iniziativa
         (CLASS_BONUSES.ranger.gloomInit in engine.js) — entrambi riusano
         meccanismi generici già esistenti (resMax con abilityMod+from,
         filtro subclass), zero nuove astrazioni. */
      subclasses: {
        cacciatore: {
          name: 'Cacciatore',
          tenets: 'Proteggi la natura e le persone dalla distruzione.',
          features: {
            3: [
              { name: 'Sapienza del Cacciatore', desc: 'Finché una creatura è marcata dal tuo Marchio del Cacciatore, sai se ha Immunità, Resistenze o Vulnerabilità, e quali.' },
              { name: 'Preda del Cacciatore', desc: 'Scegli una fra due opzioni (la cambi a ogni riposo breve o lungo). Ammazzagiganti: una volta per turno, se colpisci con un\'arma un bersaglio che non è al massimo dei PF, infliggi 1d8 danni extra. Spezzabranco: una volta per turno, dopo un attacco con un\'arma, puoi attaccare di nuovo con la stessa arma un\'altra creatura entro 1,5 m dal primo bersaglio, nella gittata dell\'arma e non ancora attaccata questo turno.' }
            ],
            7: [
              { name: 'Tattiche Difensive', desc: 'Scegli una fra due opzioni (la cambi a ogni riposo breve o lungo). Sfuggire alla Torma: gli attacchi di opportunità contro di te hanno svantaggio. Difesa dai Multiattacchi: quando una creatura ti colpisce con un attacco, ha svantaggio contro tutti gli altri tuoi attacchi questo turno.' }
            ],
            11: [
              { name: 'Preda Superiore del Cacciatore', desc: 'Una volta per turno, quando infliggi danno a una creatura marcata dal tuo Marchio del Cacciatore, puoi infliggere anche il danno extra dell\'incantesimo a un\'altra creatura che vedi entro 9 m dalla prima.' }
            ],
            15: [
              { name: 'Difesa Superiore del Cacciatore', desc: 'Quando subisci danno, puoi usare una reazione per darti Resistenza a quel tipo di danno (e a ogni altro danno dello stesso tipo) fino alla fine del turno corrente.' }
            ]
          }
        },
        'domatore-di-bestie': {
          name: 'Domatore di Bestie',
          tenets: 'Forma un legame mistico con una bestia primordiale.',
          features: {
            3: [
              { name: 'Compagno Primordiale', desc: 'Evochi una bestia primordiale al tuo fianco (statblock Bestia di Terra, di Mare o di Cielo, a scelta): agisce nel tuo turno, ti è amichevole e obbedisce ai tuoi comandi. In combattimento puoi comandarla con un\'azione bonus per farle usare un\'azione del suo statblock (altrimenti si limita a Schivare), oppure rinunciare a un tuo attacco per farle usare l\'azione Colpo della Bestia. Se muore, puoi restituirle la vita toccandola entro un\'ora (azione magica, spendi uno slot) o evocarne una nuova al riposo lungo.' }
            ],
            7: [
              { name: 'Addestramento Eccezionale', desc: 'Con l\'azione bonus di comando puoi anche far Scattare, Disimpegnare, Schivare o Aiutare la bestia. Inoltre, quando colpisce infliggendo danno, può infliggere danno da Forza invece del tipo normale.' }
            ],
            11: [
              { name: 'Furia Bestiale', desc: 'La bestia può usare due volte l\'azione Colpo della Bestia quando gliela comandi. Inoltre, la prima volta ogni turno che colpisce una creatura sotto l\'effetto del tuo Marchio del Cacciatore, infligge anche il danno da Forza extra di quell\'incantesimo.' }
            ],
            15: [
              { name: 'Incantesimi Condivisi', desc: 'Quando lanci un incantesimo su te stesso, puoi farne beneficiare anche la tua bestia se è entro 9 m da te.' }
            ]
          }
        },
        'vagabondo-fatato': {
          name: 'Vagabondo Fatato',
          tenets: 'Porta il riso e il furore del Regno Fatato ovunque tu vada.',
          spellsByLevel: {
            3: [{ id: 'ammaliare-persone', name: 'Ammaliare Persone' }],
            5: [{ id: 'passo-fatato', name: 'Passo Fatato' }],
            9: [{ id: 'evocare-folletto', name: 'Evocare Folletto' }],
            13: [{ id: 'porta-dimensionale', name: 'Porta Dimensionale' }],
            17: [{ id: 'sviare', name: 'Sviare' }]
          },
          features: {
            3: [
              { name: 'Colpi Terribili', desc: 'Quando colpisci una creatura con un\'arma, puoi infliggerle 1d4 danni Psichici extra (1d6 dal 11° livello), una volta per turno.' },
              { name: 'Clamore Ultraterreno', desc: 'Ottieni un bonus (il tuo modificatore di Saggezza, minimo +1) alle prove di Carisma, e competenza in una fra Inganno, Intrattenere o Persuasione. Possiedi anche una benedizione fatata minore (scelta o casuale fra sei effetti scenici, es. farfalle illusorie, fiori tra i capelli).' }
            ],
            6: [
              { name: 'Torsione Ammaliante', desc: 'Hai vantaggio ai TS per evitare o terminare Affascinato e Spaventato. Inoltre, quando tu o una creatura che vedi entro 36 m superate uno di quei TS, puoi usare una reazione per forzarne un\'altra entro 36 m a un TS di Saggezza: con un fallimento diventa Affascinata o Spaventata (a scelta) per 1 minuto, ripetendo il TS a ogni suo turno.' }
            ],
            11: [
              { name: 'Rinforzi Fatati', desc: 'Puoi lanciare Evocare Folletto senza componenti materiali, e una volta senza spendere uno slot (di nuovo dopo un riposo lungo); lanciandolo così puoi anche togliergli il bisogno di Concentrazione, ma la durata scende a 1 minuto.' }
            ],
            15: [
              { name: 'Vagabondo Nebbioso', desc: 'Puoi lanciare Passo Fatato senza spendere uno slot, un numero di volte pari al tuo modificatore di Saggezza (minimo 1, vedi Risorse); portando con te, se vuoi, una creatura consenziente entro 1,5 m.' }
            ]
          }
        },
        'cercatore-ombre': {
          name: 'Cercatore d\'Ombre',
          tenets: 'Attinge alla magia del Piano Ombra per colpire chi si annida nel buio.',
          spellsByLevel: {
            3: [{ id: 'travisamento', name: 'Travisamento' }],
            5: [{ id: 'trucco-della-corda', name: 'Trucco della Corda' }],
            9: [{ id: 'paura', name: 'Paura' }],
            13: [{ id: 'invisibilita-superiore', name: 'Invisibilità Superiore' }],
            17: [{ id: 'parvenza', name: 'Parvenza' }]
          },
          features: {
            3: [
              { name: 'Imboscata Temibile', desc: 'Balzo dell\'Imboscatore: a inizio del tuo primo turno di ogni combattimento, la tua velocità aumenta di 3 m fino alla fine di quel turno. Colpo Terrificante: quando colpisci con un\'arma, puoi infliggere 2d6 danni Psichici extra (vedi Risorse per gli usi), una volta per turno. Bonus di Iniziativa: sommi il tuo modificatore di Saggezza ai tiri di iniziativa.' },
              { name: 'Vista Ombrosa', desc: 'Ottieni Scurovisione fino a 18 m (aumentata di 18 m se già presente). Inoltre, mentre sei interamente nell\'Oscurità, sei Invisibile alle creature che si affidano alla Scurovisione per vederti in quel buio.' }
            ],
            7: [
              { name: 'Mente di Ferro', desc: 'Ottieni competenza nei TS di Saggezza; se ce l\'hai già, ottieni invece competenza nei TS di Intelligenza o Carisma, a scelta.' }
            ],
            11: [
              { name: 'Raffica del Cacciatore Furtivo', desc: 'Il danno Psichico di Colpo Terrificante sale a 2d8. Inoltre, usando quell\'effetto puoi aggiungere: Colpo Improvviso (un altro attacco con la stessa arma contro una creatura diversa entro 1,5 m dal primo bersaglio e a portata) oppure Paura di Massa (TS Saggezza per il bersaglio e ogni creatura entro 3 m, con un fallimento diventano Spaventate fino all\'inizio del tuo prossimo turno).' }
            ],
            15: [
              { name: 'Schivata Ombrosa', desc: 'Quando una creatura fa un tiro per colpire contro di te, puoi usare una reazione per imporgli svantaggio; che colpisca o manchi, poi ti teletrasporti fino a 9 m in uno spazio libero che vedi.' }
            ]
          }
        }
      }
    },
    stregone: {
      name: 'Stregone', hitDie: 'd6', primaryAbility: 'CAR', saves: ['COS', 'CAR'],
      casterType: 'full', spellAbility: 'CAR',
      sorceryPoints: [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      cantripsByLevel: [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      preparedByLevel: [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
      // Niente Maestria nelle Armi (nessuna colonna dedicata, come Bardo/
      // Chierico/Druido): solo armi semplici.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit dello stregone',
          armorId: '', shield: false, weaponId: 'lancia',
          extra: [
            { name: 'Pugnale', qty: 2, weaponId: 'pugnale' },
            { name: 'Focus Arcano (cristallo)', qty: 1, weight: 1, desc: 'Funge da focus per gli incantesimi da stregone.' },
            { name: 'Kit dell\'esploratore sotterraneo', qty: 1, weight: 55, desc: 'Zaino, tagliole, piede di porco, 2 fiaschette d\'olio, razioni per 10 giorni, corda, acciarino, 10 torce, otre.' }
          ],
          coins: { mo: 28 }
        },
        b: { label: '50 monete d\'oro', coins: { mo: 50 } }
      },
      // Punti Stregoneria e Magia Innata (Blocco 5.C, step Stregone): entrambi
      // 'uses' generici, stesso principio di Furia/Punti Focus — nessun
      // codice nuovo nel motore. I Punti Stregoneria si spendono in quantità
      // variabile (creare slot, Metamagia): come i Punti Focus del Monaco,
      // il click-decremento a 1 dell'interfaccia resta comunque corretto,
      // il giocatore clicca N volte per spendere N punti.
      classResources: {
        sorcery: { name: 'Punti Stregoneria', kind: 'uses', byLevelRef: 'sorceryPoints', resetOn: 'long' },
        innateSorcery: { name: 'Magia Innata', kind: 'uses', max: 2, resetOn: 'long' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 14, 18],
        asi: [4, 8, 12, 16], epicBoon: 19,
        // Metamagia: 2 opzioni al 2° livello, altre 2 al 10° e al 17° —
        // stessa forma {level,count} già usata da Competenza (Ladro/Bardo/
        // Ranger), nuovo picker generico in js/levelup.js.
        metamagic: [{ level: 2, count: 2 }, { level: 10, count: 2 }, { level: 17, count: 2 }]
      },
      /* Privilegi 1→20 (PHB 2024 p.138-141 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse/ASI/Dono
         Epico dal level-up, Metamagia dal picker dedicato). Ai livelli
         9/11/13/15 il PHB non ha un privilegio nuovo, solo i numeri delle
         tabelle (Punti Stregoneria/Preparati/slot) che salgono da soli —
         nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Incantesimi', desc: 'Il Carisma è la tua caratteristica da incantatore: conosci 4 trucchetti da stregone e prepari 2 incantesimi di 1° livello o superiore. Il numero di trucchetti e preparati cresce col livello; puoi sostituirne uno ogni volta che sali di livello da stregone. Puoi usare un Focus Arcano come focus per i tuoi incantesimi.' },
          { name: 'Magia Innata', desc: 'Come azione bonus, per 1 minuto la CD dei tuoi incantesimi da stregone aumenta di 1 e hai vantaggio ai tiri per colpire con essi. Puoi usarla due volte; recuperi tutti gli usi al riposo lungo.' }
        ],
        2: [
          { name: 'Fonte di Magia', desc: 'Ottieni i Punti Stregoneria (vedi Risorse). Puoi spenderli per creare uno slot incantesimo (azione bonus: 2 punti per uno slot di 1°, 3 per il 2°, 5 per il 3°, 6 per il 4°, 7 per il 5°, mai oltre il 5°; lo slot svanisce al riposo lungo) oppure convertire uno slot inutilizzato in Punti Stregoneria pari al suo livello (nessuna azione).' },
          { name: 'Metamagia', trait: false, desc: 'Scegli due opzioni di Metamagia: le usi spendendo Punti Stregoneria per modificare gli incantesimi che lanci (una sola per incantesimo, salvo indicazione diversa). Puoi sostituirne una ogni volta che sali di livello da stregone.' }
        ],
        3: [
          { name: 'Sottoclasse dello Stregone', trait: false, desc: 'Scegli un\'origine (Stregoneria Aberrante, Meccanica, Draconica o della Magia Selvaggia). Ottieni i suoi privilegi al tuo livello da stregone o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        5: [
          { name: 'Restauro Stregonesco', desc: 'Al termine di un riposo breve, recuperi Punti Stregoneria già spesi fino a un numero pari alla metà del tuo livello da stregone (arrotondato per difetto). Puoi usare questo privilegio una sola volta tra un riposo lungo e l\'altro.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio della tua origine.' }
        ],
        7: [
          { name: 'Stregoneria Incarnata', desc: 'Se hai esaurito gli usi di Magia Innata, puoi comunque attivarla spendendo 2 Punti Stregoneria. Inoltre, mentre è attiva, puoi applicare fino a due opzioni di Metamagia sullo stesso incantesimo.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        10: [
          { name: 'Metamagia', trait: false, desc: 'Ottieni altre due opzioni di Metamagia a tua scelta.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio della tua origine.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Metamagia', trait: false, desc: 'Ottieni altre due opzioni di Metamagia, per un totale di sei.' }
        ],
        18: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni l\'ultimo privilegio della tua origine.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Viaggio Dimensionale) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Apoteosi Arcana', desc: 'Mentre Magia Innata è attiva, puoi usare un\'opzione di Metamagia su ciascuno dei tuoi turni senza spendere Punti Stregoneria.' }
        ]
      },
      /* Sottoclassi dello Stregone: Aberrante, Meccanica e Magia Selvaggia
         fatte (PHB 2024 p.144-148) — tutte descrittive, riusano solo Punti
         Stregoneria/Magia Innata già tracciati. Draconica resta fuori:
         Resilienza Draconica dà +3 PF max al 3° e +1 per ogni livello da
         stregone successivo (una scala PER-LIVELLO di SOTTOCLASSE sui PF
         massimi, mai vista finora) E una CA senz'armatura a DUE
         caratteristiche insieme (10+DES+CAR, stesso problema del Collegio
         della Danza del Bardo) — due architetture nuove insieme, da
         discutere con Andrea. Lo Stregone non ha Maestria nelle Armi né
         stile di combattimento. */
      subclasses: {
        aberrante: {
          name: 'Stregoneria Aberrante',
          tenets: 'Un\'influenza aliena ha toccato la tua mente, donandoti poteri psionici.',
          spellsByLevel: {
            3: [
              { id: 'braccia-di-hadar', name: 'Braccia di Hadar' },
              { id: 'placare-le-emozioni', name: 'Placare le Emozioni' },
              { id: 'individuazione-dei-pensieri', name: 'Individuazione dei Pensieri' },
              { id: 'sussurri-dissonanti', name: 'Sussurri Dissonanti' },
              { id: 'scheggia-mentale', name: 'Scheggia Mentale' }
            ],
            5: [
              { id: 'fame-di-hadar', name: 'Fame di Hadar' },
              { id: 'inviare', name: 'Inviare' }
            ],
            7: [
              { id: 'tentacoli-neri-di-evard', name: 'Tentacoli Neri di Evard' },
              { id: 'evocare-aberrazione', name: 'Evocare Aberrazione' }
            ],
            9: [
              { id: 'legame-telepatico-di-rary', name: 'Legame Telepatico di Rary' },
              { id: 'telecinesi', name: 'Telecinesi' }
            ]
          },
          features: {
            3: [
              { name: 'Incantesimi Psionici', desc: 'Quando raggiungi i livelli da stregone indicati, hai sempre preparati gli incantesimi elencati (non contano nel numero di incantesimi preparabili).' },
              { name: 'Favella Telepatica', desc: 'Come azione bonus, scegli una creatura che vedi entro 9 m: per un numero di minuti pari al tuo livello da stregone potete comunicare telepaticamente entro un raggio in miglia pari al tuo modificatore di Carisma (minimo 1), purché entrambi conosciate mentalmente una lingua in comune.' }
            ],
            6: [
              { name: 'Stregoneria Psionica', desc: 'Puoi lanciare un incantesimo del privilegio Incantesimi Psionici spendendo Punti Stregoneria pari al suo livello invece di uno slot: in tal caso non richiede componenti Verbali né Somatiche, e Materiali solo se consumati o con un costo indicato.' },
              { name: 'Difese Psichiche', desc: 'Hai resistenza ai danni Psichici e vantaggio ai TS per evitare o terminare le condizioni Affascinato e Spaventato.' }
            ],
            14: [
              { name: 'Rivelazione nella Carne', desc: 'Come azione bonus, spendi 1 o più Punti Stregoneria per alterare il tuo corpo per 10 minuti: per ogni punto speso scegli un beneficio (velocità di nuoto doppia e respirazione acquatica; velocità di volo pari alla tua e planata; scorgere l\'Invisibile entro 18 m; muoverti attraverso spazi larghi 2,5 cm e liberarti da restrizioni non magiche o dalla condizione Afferrato spendendo 1,5 m di movimento).' }
            ],
            18: [
              { name: 'Implosione Deformante', desc: 'Come azione magica, ti teletrasporti in uno spazio libero a vista entro 36 m: ogni creatura entro 9 m dallo spazio lasciato fa un TS di Forza o subisce 3d10 danni da Forza ed è trascinata verso quello spazio (metà danni con successo). Una volta usato serve un riposo lungo per riusarlo, oppure spendi 5 Punti Stregoneria (nessuna azione) per ripristinarlo.' }
            ]
          }
        },
        meccanica: {
          name: 'Stregoneria Meccanica',
          tenets: 'Incanala le forze cosmiche dell\'Ordine, in sintonia con l\'efficienza meccanica del piano di Meccanus.',
          spellsByLevel: {
            3: [
              { id: 'aiuto', name: 'Aiuto' },
              { id: 'allarme', name: 'Allarme' },
              { id: 'ristorare-inferiore', name: 'Ristorare Inferiore' },
              { id: 'protezione-mal-bene', name: 'Protezione dal Male e dal Bene' }
            ],
            5: [
              { id: 'dissolvi-magie', name: 'Dissolvi Magie' },
              { id: 'protezione-dall-energia', name: 'Protezione dall\'Energia' }
            ],
            7: [
              { id: 'liberta-di-movimento', name: 'Libertà di Movimento' },
              { id: 'evocare-costrutto', name: 'Evocare Costrutto' }
            ],
            9: [
              { id: 'ristorare-superiore', name: 'Ristorare Superiore' },
              { id: 'muro-di-forza', name: 'Muro di Forza' }
            ]
          },
          features: {
            3: [
              { name: 'Ripristinare l\'Equilibrio', desc: 'Quando una creatura che vedi entro 18 m sta per tirare un d20 con vantaggio o svantaggio, puoi usare la reazione per impedire che il tiro sia influenzato da vantaggio o svantaggio. Puoi usarlo un numero di volte pari al tuo modificatore di Carisma (minimo 1), recuperando tutti gli usi al riposo lungo.' },
              { name: 'Manifestazioni dell\'Ordine', desc: 'Mentre lanci un tuo incantesimo da stregone, la tua connessione con l\'ordine si manifesta con un dettaglio a scelta o casuale: ingranaggi spettrali fluttuanti, lancette d\'orologio negli occhi, pelle con riflessi ottonati, equazioni ed elementi geometrici sovrapposti al corpo, il focus arcano che assume la forma di un meccanismo in miniatura, oppure un ticchettio di ingranaggi udibile a te e a chi è colpito dalla magia.' }
            ],
            6: [
              { name: 'Baluardo della Legge', desc: 'Come azione magica, spendi da 1 a 5 Punti Stregoneria per creare uno scudo scintillante su te stesso o un\'altra creatura entro 9 m: rappresentato da altrettanti d8, quando il bersaglio subisce danno può spenderne alcuni, tirarli e ridurre il danno subito del totale. Dura finché non finisci un riposo lungo o non riusi il privilegio.' }
            ],
            14: [
              { name: 'Trance dell\'Ordine', desc: 'Come azione bonus, entri per 1 minuto in uno stato di calcolo cosmico: i tiri per colpire contro di te non possono avere vantaggio, e su ogni Prova del d20 puoi trattare un risultato di 9 o meno come un 10. Puoi usarlo una volta per riposo lungo; puoi ripristinarlo spendendo 5 Punti Stregoneria (nessuna azione).' }
            ],
            18: [
              { name: 'Cavalcata Meccanica', desc: 'Come azione magica, evochi spiriti dell\'ordine (dall\'aspetto di modroni o altri Costrutti a tua scelta) in un Cubo di 9 m originato da te: intangibili e invulnerabili, prima di svanire curano fino a 100 PF da dividere fra le creature scelte nel cubo, riparano istantaneamente gli oggetti danneggiati al suo interno e dissolvono ogni incantesimo di 6° livello o inferiore su creature e oggetti scelti al suo interno. Puoi usarlo una volta per riposo lungo; puoi ripristinarlo spendendo 7 Punti Stregoneria (nessuna azione).' }
            ]
          }
        },
        selvaggia: {
          name: 'Magia Selvaggia',
          tenets: 'Scatena la magia caotica delle forze primordiali che sottendono l\'ordine della creazione.',
          features: {
            3: [
              { name: 'Impennata di Magia Selvaggia', desc: 'Una volta per turno, subito dopo aver lanciato un incantesimo da stregone con uno slot, puoi tirare 1d20: con un 20 tiri sulla Tabella di Impennata di Magia Selvaggia (d100, consultata dal Master) per un effetto magico casuale. Se l\'effetto è un incantesimo, è troppo selvaggio per essere modificato dalla Metamagia.' },
              { name: 'Maree del Caos', desc: 'Puoi manipolare il caos per ottenere vantaggio su una Prova del d20 prima di tirare il dado. Dopo l\'uso devi lanciare un incantesimo da stregone con uno slot o finire un riposo lungo prima di poterlo riusare; se lanci l\'incantesimo prima del riposo lungo, tiri automaticamente sulla Tabella di Impennata di Magia Selvaggia.' }
            ],
            6: [
              { name: 'Piegare la Sorte', desc: 'Subito dopo che una creatura che vedi tira il d20 per una Prova, puoi usare la reazione e spendere 1 Punto Stregoneria per tirare 1d4 e applicare il risultato come bonus o penalità (a tua scelta) al tiro.' }
            ],
            14: [
              { name: 'Caos Controllato', desc: 'Ogni volta che tiri sulla Tabella di Impennata di Magia Selvaggia, puoi tirare due volte e scegliere quale dei due risultati usare.' }
            ],
            18: [
              { name: 'Impennata Domata', desc: 'Subito dopo aver lanciato un incantesimo da stregone con uno slot, puoi scegliere un effetto a tua scelta dalla Tabella di Impennata di Magia Selvaggia (tranne l\'ultima riga) invece di tirare, effettuando comunque i tiri richiesti dall\'effetto scelto. Puoi usarlo una volta per riposo lungo.' }
            ]
          }
        }
      }
    },
    warlock: {
      name: 'Warlock', hitDie: 'd8', primaryAbility: 'CAR', saves: ['SAG', 'CAR'],
      casterType: 'pact', spellAbility: 'CAR',
      invocations: [0, 1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10],
      cantripsByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      preparedByLevel: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
      slotLevelByLevel: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      // Niente Maestria nelle Armi (nessuna colonna dedicata): solo armi
      // semplici. Armor Training del PHB è "Light armor" — non modellato
      // come restrizione (l'editor equipaggiamento non filtra per classe
      // per nessuna classe finora), solo il default del pacchetto A.
      weaponProf: ['sem'],
      startingEquipment: {
        a: {
          label: 'Kit del warlock',
          armorId: 'cuoio', shield: false, weaponId: 'falcetto',
          extra: [
            { name: 'Pugnale', qty: 2, weaponId: 'pugnale' },
            { name: 'Focus Arcano (globo)', qty: 1, weight: 3 },
            { name: 'Libro (conoscenze occulte)', qty: 1, weight: 5, desc: 'Contiene i tuoi appunti sui segreti strappati al tuo patrono.' },
            { name: 'Kit dello studioso', qty: 1, weight: 22, desc: 'Zaino, libro, inchiostro, penna, lampada, 10 fiaschette d\'olio, 10 fogli di pergamena, acciarino.' }
          ],
          coins: { mo: 15 }
        },
        b: { label: '100 monete d\'oro', coins: { mo: 100 } }
      },
      // Contatto col Patrono: 1 uso dal 9° livello, stesso principio del
      // Metabolismo Sbalorditivo del Monaco — nessun codice nuovo nel motore.
      classResources: {
        contactPatron: { name: 'Contatto col Patrono', kind: 'uses', max: 1, from: 9, resetOn: 'long' }
      },
      choicePoints: {
        subclass: 3, subclassFeatureLevels: [3, 6, 10, 14],
        asi: [4, 8, 12, 16], epicBoon: 19,
        // Invocazioni Occulte: la tabella `invocations` è un TOTALE per
        // livello (non "nuove per livello" come Metamagia/Competenza), quindi
        // qui la riscrivo come differenze — stessa forma {level,count} già
        // usata da Espero/Metamagia, il picker non deve sapere la differenza.
        // 1(+1) 2(+2) 5(+2) 7(+1) 9(+1) 12(+1) 15(+1) 18(+1) = 10 totali al 20°.
        invocations: [
          { level: 1, count: 1 }, { level: 2, count: 2 }, { level: 5, count: 2 },
          { level: 7, count: 1 }, { level: 9, count: 1 }, { level: 12, count: 1 },
          { level: 15, count: 1 }, { level: 18, count: 1 }
        ]
      },
      /* Privilegi 1→20 (PHB 2024 p.152-156 del PDF): riassunti originali in
         italiano. trait:false = scelta gestita altrove (sottoclasse/ASI/Dono
         Epico dal level-up, Invocazioni dal picker dedicato). Ai livelli
         5/7/18 il PHB non ha un privilegio nuovo, solo i numeri delle
         tabelle (Invocazioni/Trucchetti/Preparati) che salgono da soli —
         nessuna voce qui. */
      levelFeatures: {
        1: [
          { name: 'Invocazioni Occulte', trait: false, desc: 'Impari un\'Invocazione Occulta a tua scelta dall\'elenco a parte. Altre se ne aggiungono ai livelli indicati nella tabella e puoi sempre sostituirne una salendo di livello da warlock (non se è prerequisito di un\'altra invocazione che hai).' },
          { name: 'Magia del Patto', desc: 'Il Carisma è la tua caratteristica da incantatore. Conosci 2 trucchetti da warlock e prepari 2 incantesimi di 1° livello o superiore, ma tutti i tuoi slot sono sempre dello stesso livello (indicato nella colonna Livello Slot): pochi, ma sempre al livello più alto disponibile. Recuperi tutti gli slot spesi con un riposo breve o lungo. Puoi usare un Focus Arcano come focus.' }
        ],
        2: [
          { name: 'Astuzia Magica', desc: 'Puoi eseguire un rito esoterico per 1 minuto: al termine, recuperi slot di Magia del Patto già spesi, non più della metà del tuo massimo (arrotondato per eccesso). Puoi usare questo privilegio una sola volta tra un riposo lungo e l\'altro.' }
        ],
        3: [
          { name: 'Sottoclasse del Warlock', trait: false, desc: 'Scegli un patrono (Fatato, Celestiale, Immondo o Grande Antico). Ottieni i suoi privilegi al tuo livello da warlock o inferiore.' }
        ],
        4: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni il talento Aumento di Caratteristica (aumenti un punteggio di 2, oppure due punteggi di 1, fino a un massimo di 20) oppure un altro talento per cui sei idoneo.' }
        ],
        6: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un privilegio del tuo patrono.' }
        ],
        8: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        9: [
          { name: 'Contatto col Patrono', desc: 'Hai sempre preparato Contattare Altro Piano e puoi lanciarlo senza spendere uno slot per contattare il tuo patrono, riuscendo automaticamente al TS dell\'incantesimo. Puoi farlo una sola volta tra un riposo lungo e l\'altro.' }
        ],
        10: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo patrono.' }
        ],
        11: [
          { name: 'Arcano Mistico (6° livello)', desc: 'Il tuo patrono ti svela un arcano: scegli un incantesimo da warlock di 6° livello. Puoi lanciarlo una volta senza spendere uno slot; serve un riposo lungo per rifarlo. Puoi sostituirlo con un altro dello stesso livello salendo di livello da warlock.' }
        ],
        12: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        13: [
          { name: 'Arcano Mistico (7° livello)', desc: 'Come l\'Arcano Mistico del 11° livello, ma con un incantesimo di 7° livello.' }
        ],
        14: [
          { name: 'Privilegio di Sottoclasse', trait: false, desc: 'Ottieni un altro privilegio del tuo patrono.' }
        ],
        15: [
          { name: 'Arcano Mistico (8° livello)', desc: 'Come l\'Arcano Mistico precedente, ma con un incantesimo di 8° livello.' }
        ],
        16: [
          { name: 'Aumento dei Punteggi di Caratteristica', trait: false, desc: 'Ottieni di nuovo il talento Aumento di Caratteristica oppure un altro talento per cui sei idoneo.' }
        ],
        17: [
          { name: 'Arcano Mistico (9° livello)', desc: 'Come l\'Arcano Mistico precedente, ma con un incantesimo di 9° livello. Recuperi tutti gli usi di Arcano Mistico al riposo lungo.' }
        ],
        19: [
          { name: 'Dono Epico', trait: false, desc: 'Ottieni un talento Dono Epico (consigliato: Dono del Destino) oppure un altro talento per cui sei idoneo.' }
        ],
        20: [
          { name: 'Maestro Occulto', desc: 'Quando usi Astuzia Magica, recuperi TUTTI gli slot di Magia del Patto spesi, non solo la metà.' }
        ]
      },
      /* Sottoclassi del Warlock: per ora Patto del Grande Antico come dati
         (PHB 2024, p.166-167 del PDF, la più semplice delle 4 — Fatato,
         Celestiale e Immondo hanno tutte un privilegio al 3° livello scalato
         sul modificatore di Carisma (Passi del Fatato, Luce Guaritrice,
         Fortuna del Reietto) che richiederebbe una risorsa specifica di
         SOTTOCLASSE — meccanica che il motore non supporta ancora (solo
         risorse di CLASSE in classResources/CLASS_BONUSES: aggiungerla lì
         varrebbe per qualunque patrono, sbagliato). Grande Antico invece è
         tutto narrativo (telepatia, cambio tipo di danno, incantesimi
         sempre preparati) — stesso trattamento di Divinatore/Aberrante. */
      subclasses: {
        'grande-antico': {
          name: 'Patto del Grande Antico',
          tenets: 'Hai legato la tua magia a un essere alieno e incomprensibile, sepolto oltre i confini della realtà conosciuta.',
          spellsByLevel: {
            3: [
              { id: 'individuazione-dei-pensieri', name: 'Individuazione dei Pensieri' },
              { id: 'sussurri-dissonanti', name: 'Sussurri Dissonanti' },
              { id: 'forza-fantasmatica', name: 'Forza Fantasmatica' },
              { id: 'risata-orrenda-di-tasha', name: 'Risata Orrenda di Tasha' }
            ],
            5: [
              { id: 'chiaroveggenza', name: 'Chiaroveggenza' },
              { id: 'fame-di-hadar', name: 'Fame di Hadar' }
            ],
            7: [
              { id: 'confusione', name: 'Confusione' },
              { id: 'evocare-aberrazione', name: 'Evocare Aberrazione' }
            ],
            9: [
              { id: 'modificare-memoria', name: 'Modificare Memoria' },
              { id: 'telecinesi', name: 'Telecinesi' }
            ]
          },
          features: {
            3: [
              { name: 'Mente Risvegliata', desc: 'Azione bonus: scegli una creatura che vedi entro 9 m. Per un numero di minuti pari al tuo livello da warlock potete comunicare telepaticamente entro un raggio in miglia pari al tuo modificatore di Carisma (minimo 1), purché entrambi conosciate mentalmente una lingua in comune.' },
              { name: 'Incantesimi Psichici', desc: 'Quando lanci un incantesimo da warlock che infligge danni, puoi cambiarne il tipo in Psichico. Inoltre, se l\'incantesimo è di Incantamento o Illusione, puoi lanciarlo senza componenti Verbali né Somatiche.' }
            ],
            6: [
              { name: 'Combattente Chiaroveggente', desc: 'Quando formi un legame telepatico con Mente Risvegliata, puoi forzare quella creatura a un TS di Saggezza (CD dei tuoi incantesimi): se fallisce, ha svantaggio ad attaccarti e tu hai vantaggio ad attaccarla per la durata del legame. Una volta usato, serve un riposo breve o lungo per riusarlo, oppure puoi spendere uno slot di Magia del Patto (nessuna azione) per ripristinarlo.' }
            ],
            10: [
              { name: 'Maledizione Occulta', desc: 'Hai sempre preparato Maledizione. Quando la lanci e scegli la caratteristica del bersaglio, quella creatura ha anche svantaggio ai TS di quella caratteristica per la durata dell\'incantesimo.' },
              { name: 'Scudo del Pensiero', desc: 'I tuoi pensieri non possono essere letti con la telepatia o mezzi simili a meno che tu non lo permetta. Hai anche resistenza ai danni Psichici, e quando una creatura ti infligge danni Psichici subisce essa stessa la stessa quantità di danno.' }
            ],
            14: [
              { name: 'Progenie Asservita', desc: 'Quando lanci Evocare Aberrazione, puoi renderlo privo del bisogno di Concentrazione: la durata diventa 1 minuto e l\'Aberrazione evocata ottiene PF temporanei pari al tuo livello da warlock più il modificatore di Carisma. Inoltre, la prima volta ogni turno che colpisce una creatura sotto l\'effetto della tua Maledizione, infligge danni Psichici extra pari al danno bonus di quell\'incantesimo.' }
            ]
          }
        }
      }
    }
  },

  /* Ascendenze draconiche (PHB 2024, tabella "Draconic Ancestors" p.186-187):
     scelta al livello 1 dal Dragonide (Blocco 5.B, step Specie), determina il
     tipo di danno di Soffio e Resistenza al Danno — vedi js/create.js
     (renderAncestry), js/engine.js (breath.damageType) e js/traits.js
     ({{dragon_ancestor}}/{{dragon_damage}}). */
  dragonAncestors: {
    nero: { name: 'Nero', dmg: 'Acido' },
    blu: { name: 'Blu', dmg: 'Fulmine' },
    ottone: { name: 'Ottone', dmg: 'Fuoco' },
    bronzo: { name: 'Bronzo', dmg: 'Fulmine' },
    rame: { name: 'Rame', dmg: 'Acido' },
    oro: { name: 'Oro', dmg: 'Fuoco' },
    verde: { name: 'Verde', dmg: 'Veleno' },
    argento: { name: 'Argento', dmg: 'Freddo' },
    rosso: { name: 'Rosso', dmg: 'Fuoco' },
    bianco: { name: 'Bianco', dmg: 'Freddo' }
  },

  /* Retaggio Elfico (PHB 2024, tabella "Elven Lineages" p.189-190): scelto al
     livello 1 dall'Elfo, determina trucchetto, scurovisione ed eventuale
     bonus di velocità (Elfo dei Boschi), più un incantesimo sempre preparato
     ai livelli 3 e 5 (1 lancio gratis a riposo lungo). Vedi js/create.js
     (renderElfLineage), js/engine.js (speedM) e js/traits.js. */
  elfLineages: {
    drow: { name: 'Drow', cantrip: 'Luci Danzanti', darkvisionM: 36, level3: 'Fuoco Fatuo', level5: 'Oscurità' },
    alto: { name: 'Elfo Alto', cantrip: 'Prestidigitazione (sostituibile a ogni riposo lungo)', darkvisionM: 18, level3: 'Individuazione del Magico', level5: 'Passo nella Nebbia' },
    boschi: { name: 'Elfo dei Boschi', cantrip: 'Druidismo', darkvisionM: 18, speedBonusM: 1.5, level3: 'Incedere Spedito', level5: 'Passo senza Tracce' }
  },

  /* Ascendenza dei Giganti (PHB 2024, p.191-192): dono scelto al livello 1 dal
     Goliath, usi pari al bonus di competenza per riposo lungo (risorsa
     dinamica in js/engine.js, come la Furia del Barbaro). */
  goliathGifts: {
    nube: { name: 'Nube', desc: 'Azione bonus: ti teletrasporti fino a 9 m in uno spazio libero che vedi.' },
    fuoco: { name: 'Fuoco', desc: 'Quando colpisci con un attacco e infliggi danno, aggiungi 1d10 danni Fuoco.' },
    gelo: { name: 'Gelo', desc: 'Quando colpisci con un attacco e infliggi danno, aggiungi 1d6 danni Freddo e riduci la velocità del bersaglio di 3 m fino all\'inizio del tuo prossimo turno.' },
    colle: { name: 'Colle', desc: 'Quando colpisci con un attacco una creatura Grande o più piccola e infliggi danno, puoi renderla Prona.' },
    pietra: { name: 'Pietra', desc: 'Quando subisci danno, reazione: tiri 1d12 + mod. Costituzione e riduci il danno subito di quel totale.' },
    tempesta: { name: 'Tempesta', desc: 'Quando subisci danno da una creatura entro 18 m, reazione: le infliggi 1d8 danni Tuono.' }
  },

  /* Retaggio Infernale (PHB 2024, tabella "Fiendish Legacies" p.196): scelto
     al livello 1 dal Tiefling, dà resistenza a un tipo di danno e un
     trucchetto, più un incantesimo sempre preparato ai livelli 3 e 5 (1
     lancio gratis a riposo lungo). NOTA: nel PDF sorgente la cella
     dell'incantesimo di 5° livello del Retaggio Infernale risulta assente dal
     testo estratto (probabile difetto del file, non un dato omesso di
     proposito) — da verificare quando possibile, per ora resta null. */
  tieflingLegacies: {
    abissale: { name: 'Abissale', resist: 'Veleno', cantrip: 'Spruzzo di Veleno', level3: 'Raggio Nauseante', level5: 'Immobilizzare Persona' },
    ctonio: { name: 'Ctonio', resist: 'Necrotico', cantrip: 'Tocco Agghiacciante', level3: 'Falsa Vita', level5: 'Raggio di Indebolimento' },
    infernale: { name: 'Infernale', resist: 'Fuoco', cantrip: 'Dardo di Fuoco', level3: 'Rimprovero Infernale', level5: null }
  },

  /* Retaggio Gnomesco (PHB 2024, p.190-191): scelto al livello 1 dallo Gnomo.
     Gnomo dei Boschi ha in più un incantesimo sempre preparato con usi pari
     al bonus di competenza per riposo lungo (risorsa dinamica come il Dono
     del Goliath); Gnomo delle Rocce resta puramente descrittivo (congegni). */
  gnomeLineages: {
    boschi: { name: 'Gnomo dei Boschi', cantrip: 'Illusione Minore', preparedSpell: 'Parlare con gli Animali' },
    rocce: { name: 'Gnomo delle Rocce', cantrip: 'Riparare e Prestidigitazione', desc: 'Con Prestidigitazione (10 minuti) crei un piccolo congegno a orologeria (max 3 contemporaneamente).' }
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
        { name: 'Ascendenza Draconica', trait: false, desc: 'Drago progenitore: {{dragon_ancestor}}. Determina il tipo di danno di Soffio e Resistenza ({{dragon_damage}}).' },
        { name: 'Soffio', desc: 'Sostituisce un attacco dell\'azione Attacco: cono di 4,5 m o linea di 9 m; TS Destrezza (CD 8 + mod. Cos + bonus competenza), 1d10 danni {{dragon_damage}} (2d10 al livello 5, 3d10 all\'11, 4d10 al 17), dimezzati se superato. Usi pari al bonus di competenza per riposo lungo.' },
        { name: 'Resistenza al Danno', desc: 'Resistenza ai danni {{dragon_damage}}.' },
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Volo Draconico', minLevel: 5, desc: 'Dal livello 5, azione bonus: ali spettrali per 10 minuti, velocità di volo pari alla velocità. 1/riposo lungo.' }
      ]
    },
    elfo: {
      name: 'Elfo', size: 'Media', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '{{elf_darkvision}} metri.' },
        { name: 'Retaggio Elfico', desc: 'Retaggio: {{elf_lineage}}. Trucchetto: {{elf_cantrip}}.{{elf_higher_spell}}' },
        { name: 'Ascendenza Fatata', desc: 'Vantaggio ai TS per evitare o terminare Affascinato.' },
        { name: 'Sensi Acuti', desc: 'Competenza in {{elf_skill}}.' },
        { name: 'Trance', desc: 'Non dormi e la magia non può addormentarti; riposo lungo in 4 ore di meditazione.' }
      ]
    },
    gnomo: {
      name: 'Gnomo', size: 'Piccola', speedM: 9,
      traits: [
        { name: 'Scurovisione', desc: '18 metri.' },
        { name: 'Astuzia Gnomesca', desc: 'Vantaggio ai TS di Intelligenza, Saggezza e Carisma.' },
        { name: 'Retaggio Gnomesco', desc: 'Retaggio: {{gnome_lineage}}. Trucchetto/i: {{gnome_cantrip}}.{{gnome_extra}}' }
      ]
    },
    goliath: {
      name: 'Goliath', size: 'Media (2,1–2,4 m)', speedM: 10.5,
      traits: [
        { name: 'Ascendenza dei Giganti', desc: 'Dono: {{goliath_gift}}. {{goliath_gift_desc}} Usi pari al bonus di competenza per riposo lungo.' },
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
        { name: 'Retaggio Infernale', desc: 'Retaggio: {{tiefling_legacy}}. Resistenza ai danni {{tiefling_damage}}. Trucchetto: {{tiefling_cantrip}}.{{tiefling_higher_spell}}' },
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
    { id: 'dardo-di-guida', name: 'Dardo di Guida', level: 1, school: 'Evocazione',
      classes: ['chierico', 'druido'],
      meta: 'Azione · 36 m · 1 round · V, S',
      desc: 'Attacco con incantesimo a distanza: 4d6 danni radiosi se colpisci, e il prossimo tiro per colpire contro il bersaglio prima della fine del tuo turno successivo ha vantaggio. +1d6 per ogni slot oltre il 1°.' },
    { id: 'colpo-intrappolante', name: 'Colpo Intrappolante', level: 1, school: 'Convocazione',
      classes: ['ranger'],
      meta: 'Azione bonus (dopo un colpo con un\'arma) · Sé · 1 min CONC · V',
      desc: 'Sul bersaglio colpito spuntano viticci: TS Forza (vantaggio se Grande o più grande) o resta Trattenuto finché dura. Da Trattenuto subisce 1d6 perforanti a inizio di ogni suo turno; lui o un alleato a portata possono liberarlo con una prova di Forza (Atletica) CD pari alla tua CD incantesimi.' },
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
      classes: ['paladino', 'chierico', 'druido', 'warlock', 'mago', 'stregone'],
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
    { id: 'potenziare-capacita', name: 'Potenziare Capacità', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'chierico', 'druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M',
      desc: 'Tocchi una creatura e scegli una caratteristica: per la durata ha vantaggio alle prove di quella caratteristica. +1 bersaglio per ogni slot oltre il 2°, con caratteristica scelta a parte per ciascuno.' },
    { id: 'tenere-persone', name: 'Tenere Persone', level: 2, school: 'Incantamento',
      classes: ['bardo', 'chierico', 'druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M',
      desc: 'Un Umanoide a vista fa TS Saggezza o resta Paralizzato finché dura; ripete il TS alla fine di ogni suo turno. +1 bersaglio Umanoide per ogni slot oltre il 2°.' },
    { id: 'passo-fatato', name: 'Passo Fatato', level: 2, school: 'Convocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione bonus · Sé · Istantaneo · V',
      desc: 'Ti teletrasporti fino a 9 m in uno spazio libero a vista, avvolto in una bruma argentea.' },
    { id: 'raggio-lunare', name: 'Raggio Lunare', level: 2, school: 'Evocazione',
      classes: ['druido'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M',
      desc: 'Un cilindro di luce fioca (raggio 1,5 m, altezza 12 m) piomba entro gittata: chi vi si trova fa un TS Costituzione, 2d10 danni radiosi se fallisce o metà se riesce (si ripete a chi entra o comincia lì il turno, una volta a testa). Con un\'azione puoi spostare il cilindro fino a 18 m nei turni successivi.' },
    { id: 'aiuto', name: 'Aiuto', level: 2, school: 'Abiurazione',
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'stregone'],
      meta: 'Azione · 9 m · 8 ore · V, S, M',
      desc: 'Fino a 3 creature: i PF massimi e attuali aumentano di 5 per la durata. Con slot superiori, +5 per ogni livello oltre il 2°.' },
    { id: 'arma-magica', name: 'Arma Magica', level: 2, school: 'Trasmutazione',
      classes: ['paladino', 'ranger', 'stregone', 'mago', 'chierico'],
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
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'stregone'],
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
    /* Concessi sempre preparati dal Giuramento di Devozione (9°/13°/17°): non
       sono sulla lista del Paladino, quindi `classes` resta quella vera — un
       paladino non può sceglierli, se li ritrova dal giuramento. */
    { id: 'faro-speranza', name: 'Faro di Speranza', level: 3, school: 'Abiurazione',
      classes: ['chierico'],
      meta: 'Azione · 9 m · 1 min CONC · V, S',
      desc: 'Quante creature vuoi entro gittata ottengono vantaggio ai TS Saggezza e ai tiri salvezza contro morte, e recuperano il massimo dei PF possibili da ogni cura.' },
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
    { id: 'bandire', name: 'Bandire', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M',
      desc: 'Una creatura a vista fa TS Carisma o è trasportata per la durata in un demipiano innocuo (Incapacitata lì dentro); alla fine dell\'incantesimo torna nel suo spazio o nel più vicino libero. Se è una creatura extraplanare e l\'incantesimo dura un minuto intero, non torna: resta bandita nel suo piano d\'origine.' },
    { id: 'guardiano-fede', name: 'Guardiano della Fede', level: 4, school: 'Convocazione',
      classes: ['chierico'],
      meta: 'Azione · 9 m · 8 ore · V',
      desc: 'Un guardiano spettrale Grande e invulnerabile occupa uno spazio libero a vista. Il nemico che gli arriva entro 3 m per la prima volta nel turno, o vi comincia il turno, fa un TS Destrezza: 20 danni radiosi se fallisce, metà se riesce. Svanisce dopo aver inflitto 60 danni.' },
    { id: 'aura-purezza', name: 'Aura di Purezza', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé (aura 9 m) · 10 min CONC · V',
      desc: 'Gli alleati nell\'aura non possono essere Avvelenati, hanno resistenza ai danni da veleno e vantaggio ai TS contro Accecato, Assordato, Affascinato, Paralizzato, Pietrificato, Spaventato e Stordito.' },
    { id: 'aura-vita', name: 'Aura di Vita', level: 4, school: 'Abiurazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé (aura 9 m) · 10 min CONC · V',
      desc: 'Gli alleati nell\'aura hanno resistenza ai danni necrotici e i loro PF massimi non possono essere ridotti. Chi inizia il turno nell\'aura con 0 PF recupera 1 PF.' },
    { id: 'guardia-della-morte', name: 'Guardia della Morte', level: 4, school: 'Abiurazione',
      classes: ['chierico', 'paladino'],
      meta: 'Azione · Tocco · 8 ore · V, S',
      desc: 'La creatura toccata, la prima volta che scenderebbe a 0 PF prima che l\'incantesimo finisca, scende invece a 1 PF (e l\'incantesimo termina). È anche immune agli effetti che la ucciderebbero all\'istante senza infliggere danni.' },
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
    { id: 'ricordo-leggendario', name: 'Ricordo Leggendario', level: 5, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'mago'],
      meta: '10 minuti · Sé · Istantaneo · V, S, M (incenso e strisce d\'avorio, consumati)',
      desc: 'Nomini o descrivi una persona, un luogo o un oggetto famosi: ricevi un riassunto delle informazioni leggendarie che li riguardano, decise dal master.' },
    { id: 'tenere-mostri', name: 'Tenere Mostri', level: 5, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago', 'chierico', 'druido'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M',
      desc: 'Una creatura a vista fa TS Saggezza o resta Paralizzata finché dura; ripete il TS alla fine di ogni suo turno. +1 bersaglio per ogni slot oltre il 5°.' },
    { id: 'passo-dellalbero', name: 'Passo dell\'Albero', level: 5, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · Sé · 1 min CONC · V, S',
      desc: 'Puoi entrare in un albero vivo e spostarti all\'istante dentro un altro albero della stessa specie entro 150 m, di cui conosci la posizione; entrare in un albero costa 1,5 m di movimento.' },
    // Dal Giuramento di Devozione al 17° (vedi nota al 3° livello).
    { id: 'colpo-infuocato', name: 'Colpo Infuocato', level: 5, school: 'Invocazione',
      classes: ['chierico'],
      meta: 'Azione · 18 m · Istantaneo · V, S, M (un pizzico di zolfo)',
      desc: 'Una colonna di fuoco alta 12 m e con raggio 3 m piomba dall\'alto: chi è dentro fa un TS Destrezza e subisce 5d6 danni da fuoco più 5d6 radiosi, metà se riesce. +1d6 per tipo di danno per ogni slot oltre il 5°.' },
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
      classes: ['paladino', 'bardo', 'chierico', 'druido', 'ranger', 'stregone'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (polvere di diamante da 100 MO, consumata)',
      desc: 'Riduci di 1 il livello di Indebolimento della creatura toccata, oppure termina un effetto tra: Affascinato o Pietrificato, una maledizione (incluso il vincolo con un oggetto maledetto), una riduzione dei PF massimi o di un punteggio di caratteristica.' },
    { id: 'rianimare-morti', name: 'Rianimare Morti', level: 5, school: 'Negromanzia',
      classes: ['paladino', 'bardo', 'chierico'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (diamante da 500 MO, consumato)',
      desc: 'Riporta in vita una creatura morta da non più di 10 giorni con 1 PF. L\'anima deve essere libera e disposta a tornare. Malus −4 a tiri e TS che si riduce a ogni riposo lungo.' },

    /* ===== Ranger — incantesimi propri (non condivisi col Paladino) ===== */
    /* 1° livello */
    { id: 'allarme', name: 'Allarme', level: 1, school: 'Abiurazione',
      classes: ['ranger', 'mago', 'stregone'],
      meta: 'Azione o Rituale · 9 m · 8 ore · V, S, M (una campanella e filo d\'argento)',
      desc: 'Imposti un allarme su una porta, una finestra o un\'area fino a 6 m di lato. Se una creatura non esclusa la tocca o vi entra, scatta un segnale a scelta: udibile (rintocco per 10 secondi entro 18 m) o mentale (ti raggiunge entro 1,6 km e ti sveglia anche se dormi).' },
    { id: 'amicizia-con-gli-animali', name: 'Amicizia con gli Animali', level: 1, school: 'Incantamento',
      classes: ['bardo', 'druido', 'ranger'],
      meta: 'Azione · 9 m · 24 ore · V, S, M (un boccone di cibo)',
      desc: 'Una Bestia bersaglio fa TS Saggezza o è Affascinata per la durata. Se tu o un alleato le infliggete danno, l\'incantesimo termina subito. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'colpo-avviluppante', name: 'Colpo Avviluppante', level: 1, school: 'Convocazione',
      classes: ['ranger'],
      meta: 'Azione bonus (dopo un colpo in mischia) · Sé · 1 min CONC · V',
      desc: 'Vigne afferrano il bersaglio, che fa TS Forza (svantaggiato se Grande o più) o è Afferrato. Mentre Afferrato subisce 1d6 perforanti a inizio di ogni suo turno; può liberarsi con una prova di Atletica contro la tua CD. +1d6 per ogni slot oltre il 1°.' },
    { id: 'aggrovigliare', name: 'Aggrovigliare', level: 1, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · 27 m · 1 min CONC · V, S',
      desc: 'Piante rampicanti riempiono un\'area di 6 m di lato, rendendola Terreno Difficile. Le creature presenti fanno TS Forza o sono Afferrate; possono liberarsi con una prova di Atletica contro la tua CD.' },
    { id: 'nube-di-nebbia', name: 'Nube di Nebbia', level: 1, school: 'Convocazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 ora CONC · V, S',
      desc: 'Sfera di nebbia di 6 m di raggio, Fortemente Oscurata, finché dura o finché un vento forte (anche Raffica di Vento) non la disperde. +6 m di raggio per ogni slot oltre il 1°.' },
    { id: 'baccabuona', name: 'Baccabuona', level: 1, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · Sé · 24 ore · V, S, M (un rametto di vischio)',
      desc: 'Crei dieci bacche magiche: mangiarne una (azione bonus) cura 1 PF e sazia per un giorno. Le bacche non mangiate svaniscono alla fine della durata.' },
    { id: 'grandine-di-spine', name: 'Grandine di Spine', level: 1, school: 'Convocazione',
      classes: ['ranger'],
      meta: 'Azione bonus (subito dopo un attacco a distanza) · Sé · Istantaneo · V',
      desc: 'Una pioggia di spine scaturisce dalla tua arma o munizione. Il bersaglio e ogni creatura entro 1,5 m da esso fanno TS Destrezza, subendo 1d10 perforanti (metà se superano). +1d10 per ogni slot oltre il 1°.' },
    { id: 'marchio-del-cacciatore', name: 'Marchio del Cacciatore', level: 1, school: 'Divinazione',
      classes: ['ranger'],
      meta: 'Azione bonus · 27 m · 1 ora CONC · V',
      desc: 'Marchi una preda: ogni colpo contro di essa infligge +1d6 forza extra, e hai vantaggio nel rintracciarla. Se scende a 0 PF puoi spostare il marchio (azione bonus). Con slot di 3°-4° dura fino a 8 ore, con slot di 5°+ fino a 24 ore.' },
    { id: 'salto', name: 'Salto', level: 1, school: 'Trasmutazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione bonus · Tocco · 1 min · V, S, M (una zampa di cavalletta)',
      desc: 'La creatura toccata può saltare fino a 9 m spendendo 3 m di movimento, una volta per turno finché dura. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'falcata', name: 'Falcata', level: 1, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'ranger', 'mago'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (un pizzico di terra)',
      desc: 'La velocità della creatura toccata aumenta di 3 m finché dura. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'parlare-con-gli-animali', name: 'Parlare con gli Animali', level: 1, school: 'Divinazione',
      classes: ['bardo', 'druido', 'ranger', 'warlock'],
      meta: 'Azione o Rituale · Sé · 10 min · V, S',
      desc: 'Per la durata comprendi e comunichi verbalmente con le Bestie. La maggior parte sa poco oltre sopravvivenza e compagnia, ma può darti informazioni su luoghi e pericoli vicini percepiti nell\'ultimo giorno.' },

    /* 2° livello */
    { id: 'messaggero-animale', name: 'Messaggero Animale', level: 2, school: 'Incantamento',
      classes: ['bardo', 'druido', 'ranger'],
      meta: 'Azione o Rituale · 9 m · 24 ore · V, S, M (un boccone di cibo)',
      desc: 'Una piccola Bestia consegna un messaggio di massimo 25 parole a un destinatario descritto, percorrendo circa 40 km al giorno (80 se vola). Se non arriva prima della fine della durata, il messaggio va perso. +48 ore di durata per ogni slot oltre il 2°.' },
    { id: 'pelle-corticata', name: 'Pelle Corticata', level: 2, school: 'Trasmutazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione bonus · Tocco · 1 ora · V, S, M (una manciata di corteccia)',
      desc: 'La pelle della creatura toccata assume un aspetto corticato: la sua CA diventa 17 se era inferiore, finché dura.' },
    { id: 'sensi-bestiali', name: 'Sensi Bestiali', level: 2, school: 'Divinazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione o Rituale · Tocco · 1 ora CONC · S',
      desc: 'Percepisci attraverso i sensi di una Bestia volontaria toccata, inclusi eventuali sensi speciali, finché dura.' },
    { id: 'cordone-di-frecce', name: 'Cordone di Frecce', level: 2, school: 'Trasmutazione',
      classes: ['ranger'],
      meta: 'Azione · Tocco · 8 ore · V, S, M (una treccia ornamentale)',
      desc: 'Pianti fino a quattro frecce o quadrelli non magici nel terreno: se una creatura non esclusa entra entro 9 m o vi termina il turno, una munizione vola a colpirla (TS Destrezza, 2d4 perforanti se fallita) e si distrugge. Finisce quando le munizioni si esauriscono. +2 munizioni per ogni slot oltre il 2°.' },
    { id: 'scurovisione', name: 'Scurovisione', level: 2, school: 'Trasmutazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 8 ore · V, S, M (una carota essiccata)',
      desc: 'La creatura volontaria toccata ottiene Scurovisione 45 m per la durata.' },
    { id: 'potenziare-abilita', name: 'Potenziare Abilità', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'chierico', 'druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M (pelo o una piuma)',
      desc: 'La creatura toccata ha vantaggio alle prove con una caratteristica a scelta finché dura. +1 bersaglio (con caratteristica scelta a parte) per ogni slot oltre il 2°.' },
    { id: 'individuare-trappole', name: 'Individuare Trappole', level: 2, school: 'Divinazione',
      classes: ['chierico', 'druido', 'ranger'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Percepisci la presenza (non la posizione esatta) di ogni trappola in linea di vista entro gittata, incluse quelle magiche come Allarme o Glifo di Custodia, e ne apprendi la natura generale del pericolo.' },
    { id: 'raffica-di-vento', name: 'Raffica di Vento', level: 2, school: 'Evocazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S, M (un seme di legume)',
      desc: 'Una linea di vento forte lunga 18 m e larga 3 m si irradia da te. Le creature nella linea fanno TS Forza o sono spinte di 4,5 m; disperde gas/vapori e spegne fiamme non protette. Azione bonus per cambiare direzione nei turni successivi.' },
    { id: 'individuare-animali-o-piante', name: 'Individuare Animali o Piante', level: 2, school: 'Divinazione',
      classes: ['bardo', 'druido', 'ranger'],
      meta: 'Azione o Rituale · Sé · Istantaneo · V, S, M (pelo di segugio)',
      desc: 'Descrivi un tipo di Bestia, Pianta o pianta non magica: apprendi direzione e distanza dell\'esemplare più vicino entro 8 km, se presente.' },
    { id: 'passo-senza-tracce', name: 'Passo senza Tracce', level: 2, school: 'Abiurazione',
      classes: ['druido', 'ranger', 'chierico'],
      meta: 'Azione · Sé (emanazione 9 m) · 1 ora CONC · V, S, M (cenere di vischio bruciato)',
      desc: 'Un\'aura ti segue: tu e chi scegli entro l\'emanazione ottenete +10 alle prove di Furtività e non lasciate tracce, finché dura.' },
    { id: 'silenzio', name: 'Silenzio', level: 2, school: 'Illusione',
      classes: ['bardo', 'chierico', 'ranger'],
      meta: 'Azione o Rituale · 36 m · 10 min CONC · V, S',
      desc: 'Sfera di 6 m di raggio in cui nessun suono può nascere o propagarsi: chi vi è interamente dentro è immune al Tuono ed è Assordato; lanciare incantesimi con componente Verbale lì dentro è impossibile.' },
    { id: 'crescita-di-spuntoni', name: 'Crescita di Spuntoni', level: 2, school: 'Trasmutazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · 45 m · 10 min CONC · V, S, M (sette spine)',
      desc: 'Il terreno in una sfera di 6 m di raggio si ricopre di spuntoni: diventa Terreno Difficile e chi vi si muove attraverso subisce 2d4 perforanti ogni 1,5 m percorsi. Il terreno appare naturale finché non lo si individua con una prova di Percezione o Sopravvivenza.' },
    { id: 'evocare-bestia', name: 'Evocare Bestia', level: 2, school: 'Convocazione',
      classes: ['druido', 'ranger', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (piuma, ciuffo di pelo e coda di pesce in una ghianda dorata, 200+ MO)',
      desc: 'Evochi uno spirito bestiale (statistiche proprie) scegliendo l\'ambiente Aria, Terra o Mare: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },

    /* 3° livello */
    { id: 'evocare-animali', name: 'Evocare Animali', level: 3, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · 18 m · 10 min CONC · V, S',
      desc: 'Evochi un branco spettrale di animali (forma a scelta) che puoi muovere insieme a te. Vantaggio ai TS Forza mentre sei entro 1,5 m dal branco; le creature vicine fanno TS Destrezza o subiscono 3d10 taglienti (una volta a turno). +1d10 per ogni slot oltre il 3°.' },
    { id: 'raffica-evocata', name: 'Raffica Evocata', level: 3, school: 'Convocazione',
      classes: ['ranger'],
      meta: 'Azione · Sé · Istantaneo · V, S, M (un\'arma da mischia o a distanza, valore 1+ MR)',
      desc: 'Brandisci l\'arma e conjuri armi spettrali simili che si scagliano in un Cono di 18 m. Le creature scelte fanno TS Destrezza, subendo 5d8 forza (metà se superano). +1d8 per ogni slot oltre il 3°.' },
    { id: 'freccia-fulminante', name: 'Freccia Fulminante', level: 3, school: 'Trasmutazione',
      classes: ['ranger'],
      meta: 'Azione bonus (subito dopo un colpo o un fallimento a distanza) · Sé · Istantaneo · V, S',
      desc: 'L\'arma o munizione si trasforma in un fulmine: il bersaglio subisce 4d8 fulmine (metà se l\'attacco era un fallimento) invece del danno normale; le creature entro 3 m fanno TS Destrezza per 2d8 fulmine (metà se superano). +1d8 a entrambi gli effetti per ogni slot oltre il 3°.' },
    { id: 'fondersi-con-la-pietra', name: 'Fondersi con la Pietra', level: 3, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'ranger'],
      meta: 'Azione o Rituale · Tocco · 8 ore · V, S',
      desc: 'Ti fondi con una superficie di pietra abbastanza grande da contenerti: nulla della tua presenza resta visibile o rilevabile con mezzi non magici finché dura.' },
    { id: 'non-individuazione', name: 'Non Individuazione', level: 3, school: 'Abiurazione',
      classes: ['bardo', 'ranger', 'mago', 'chierico'],
      meta: 'Azione · Tocco · 8 ore · V, S, M (polvere di diamante da 25+ MO, consumata)',
      desc: 'Nascondi un bersaglio toccato (creatura, luogo o oggetto fino a 3 m di lato) dagli incantesimi di divinazione e dagli occhi magici per la durata.' },
    { id: 'crescita-delle-piante', name: 'Crescita delle Piante', level: 3, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'ranger'],
      meta: 'Azione (Rigoglio) o 8 ore (Arricchimento) · 45 m · Istantaneo · V, S',
      desc: 'Rigoglio: le piante in una sfera di 30 m di raggio diventano fitte e Terreno Difficile (puoi escludere aree a scelta). Arricchimento: le piante in 800 m di raggio danno il doppio del raccolto per 365 giorni (un solo utilizzo l\'anno per area).' },
    { id: 'protezione-dall-energia', name: 'Protezione dall\'Energia', level: 3, school: 'Abiurazione',
      classes: ['chierico', 'druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S',
      desc: 'La creatura volontaria toccata ottiene resistenza a un tipo di danno a scelta tra acido, freddo, fuoco, fulmine o tuono, finché dura.' },
    { id: 'parlare-con-le-piante', name: 'Parlare con le Piante', level: 3, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'ranger'],
      meta: 'Azione · Sé (emanazione 9 m) · 10 min · V, S',
      desc: 'Doni sentienza limitata alle piante nell\'emanazione: puoi interrogarle su eventi dell\'ultimo giorno e trasformare Terreno Difficile vegetale in normale (o viceversa) per la durata.' },
    { id: 'evocare-folletto', name: 'Evocare Folletto', level: 3, school: 'Convocazione',
      classes: ['druido', 'ranger', 'warlock', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (un fiore dorato, 300+ MO)',
      desc: 'Evochi uno spirito fatato (statistiche proprie) scegliendo l\'umore Furente, Gioioso o Beffardo: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },
    { id: 'respirare-in-acqua', name: 'Respirare in Acqua', level: 3, school: 'Trasmutazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione o Rituale · 9 m · 24 ore · V, S, M (una canna corta)',
      desc: 'Fino a dieci creature volontarie entro gittata possono respirare sott\'acqua per la durata, mantenendo anche la respirazione normale.' },
    { id: 'camminare-sull-acqua', name: 'Camminare sull\'Acqua', level: 3, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'ranger', 'stregone'],
      meta: 'Azione o Rituale · 9 m · 1 ora · V, S, M (un pezzo di sughero)',
      desc: 'Fino a dieci creature volontarie entro gittata possono muoversi su qualsiasi superficie liquida come se fosse terreno solido per la durata (azione bonus per passare da e verso il liquido).' },
    { id: 'muro-di-vento', name: 'Muro di Vento', level: 3, school: 'Evocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (un ventaglio e una piuma)',
      desc: 'Un muro di vento forte (fino a 15 m lungo, 4,5 m alto, in un percorso continuo) sorge dal terreno. Le creature nell\'area fanno TS Forza o subiscono 4d8 contundenti (metà se superano); tiene a bada gas e fumi, blocca creature volanti Piccole o più piccole, devia proiettili ordinari lanciati attraverso di esso e impedisce il passaggio a creature in forma gassosa.' },

    /* 4° livello */
    { id: 'evocare-creature-silvane', name: 'Evocare Creature Silvane', level: 4, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · Sé (emanazione 3 m) · 10 min CONC · V, S',
      desc: 'Spiriti della natura ti volteggiano attorno nell\'emanazione. Le creature che vi entrano o vi terminano il turno fanno TS Saggezza o subiscono 5d8 forza (metà se superano, una volta a turno). Azione bonus per Disimpegnarti per la durata. +1d8 per ogni slot oltre il 5°.' },
    { id: 'dominare-bestia', name: 'Dominare Bestia', level: 4, school: 'Incantamento',
      classes: ['druido', 'ranger', 'stregone'],
      meta: 'Azione · 18 m · 1 min CONC · V, S',
      desc: 'Una Bestia fa TS Saggezza (con vantaggio se in combattimento contro di te) o è Affascinata: le impartisci comandi telepatici finché dura. Ripete il TS ogni volta che subisce danno. Con slot di 5° dura 10 minuti, 6° un\'ora, 7°+ otto ore.' },
    { id: 'liberta-di-movimento', name: 'Libertà di Movimento', level: 4, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'druido', 'ranger', 'stregone'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (una cinghia di cuoio)',
      desc: 'La creatura toccata ignora il Terreno Difficile, non può subire riduzioni di velocità né Paralisi/Restrizione da magia, e ottiene velocità di nuoto pari alla sua. Può spendere 1,5 m di movimento per liberarsi automaticamente da manette o Afferramento non magici.' },
    { id: 'vite-afferrante', name: 'Vite Afferrante', level: 4, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione bonus · 18 m · 1 min CONC · V, S',
      desc: 'Convochi una vite che spunta da una superficie. Attacco con incantesimo in mischia contro una creatura entro 9 m dalla vite: se colpisci, 4d8 contundenti e la trascini fino a 9 m verso di essa, Afferrandola se non più grande di Enorme. Azione bonus per ripetere l\'attacco nei turni successivi. +1 creatura afferrabile per ogni slot oltre il 4°.' },
    { id: 'pelle-di-pietra', name: 'Pelle di Pietra', level: 4, school: 'Trasmutazione',
      classes: ['druido', 'ranger', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M (polvere di diamante da 100+ MO, consumata)',
      desc: 'La creatura volontaria toccata ottiene resistenza ai danni contundenti, perforanti e taglienti finché dura.' },
    { id: 'evocare-elementale', name: 'Evocare Elementale', level: 4, school: 'Convocazione',
      classes: ['druido', 'ranger', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (aria, un sasso, cenere e acqua in una fiala dorata, 400+ MO)',
      desc: 'Evochi uno spirito elementale (statistiche proprie) scegliendo Aria, Terra, Fuoco o Acqua: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },

    /* 5° livello */
    { id: 'comunione-con-la-natura', name: 'Comunione con la Natura', level: 5, school: 'Divinazione',
      classes: ['druido', 'ranger'],
      meta: '1 minuto o Rituale · Sé · Istantaneo · V, S',
      desc: 'Ti sintonizzi con gli spiriti della natura entro 4,8 km all\'aperto (90 m in ambienti sotterranei naturali). Scegli tre informazioni tra: insediamenti, portali, e posizione di una creatura ultraterrena di GS 10+.' },
    { id: 'scarica-evocata', name: 'Scarica Evocata', level: 5, school: 'Convocazione',
      classes: ['ranger'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (un\'arma da mischia o a distanza, valore 1+ MR)',
      desc: 'Brandisci l\'arma e scegli un punto entro gittata: centinaia di armi spettrali si abbattono in un Cilindro di 12 m di raggio e 6 m di altezza. Le creature scelte fanno TS Destrezza, subendo 8d8 forza (metà se superano).' },
    { id: 'vento-d-acciaio', name: 'Colpo del Vento d\'Acciaio', level: 5, school: 'Convocazione',
      classes: ['ranger', 'mago', 'chierico'],
      meta: 'Azione · 9 m · Istantaneo · S, M (un\'arma da mischia, valore 1+ MA)',
      desc: 'Ti sposti come il vento colpendo fino a cinque creature scelte entro gittata: attacco con incantesimo in mischia contro ciascuna, 6d10 forza a chi viene colpito. Poi ti teletrasporti entro 1,5 m da uno dei bersagli.' },
    { id: 'faretra-rapida', name: 'Faretra Rapida', level: 5, school: 'Trasmutazione',
      classes: ['ranger'],
      meta: 'Azione bonus · Sé · 1 min CONC · V, S, M (una faretra, valore 1+ MO)',
      desc: 'Finché dura, ogni azione bonus ti permette due attacchi extra con un\'arma che scaglia frecce o quadrelli: l\'incantesimo crea la munizione necessaria, che si disintegra subito dopo colpire o mancare.' },
    { id: 'passo-arboreo', name: 'Passo Arboreo', level: 5, school: 'Convocazione',
      classes: ['druido', 'ranger'],
      meta: 'Azione · Sé · 1 min CONC · V, S',
      desc: 'Puoi entrare in un albero e spostarti dentro un altro albero della stessa specie entro 150 m, spendendo 1,5 m di movimento per ciascun passaggio. Puoi farlo una sola volta per turno e devi terminare ogni turno fuori da un albero.' },

    /* ===== Warlock — trucchetti e 1°-2° livello (blocco 1) ===== */
    { id: 'guardia-della-lama', name: 'Guardia della Lama', level: 0, school: 'Abiurazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S',
      desc: 'Finché dura, ogni creatura che ti attacca sottrae 1d4 al tiro per colpire.' },
    { id: 'tocco-agghiacciante', name: 'Tocco Agghiacciante', level: 0, school: 'Negromanzia',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · Istantaneo · V, S',
      desc: 'Attacco con incantesimo in mischia: se colpisci, 1d10 necrotici e il bersaglio non può recuperare PF fino alla fine del tuo prossimo turno. Il danno sale a 2d10 al livello 5, 3d10 all\'11°, 4d10 al 17°.' },
    { id: 'raggio-occulto', name: 'Raggio Occulto', level: 0, school: 'Evocazione',
      classes: ['warlock'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Attacco con incantesimo a distanza: 1d10 forza se colpisci. Dal livello 5 lanci due raggi, dall\'11° tre, dal 17° quattro; ogni raggio ha un tiro per colpire separato e puoi dividerli su bersagli diversi.' },
    { id: 'amici', name: 'Amici', level: 0, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 3 m · 1 min CONC · S, M (trucco per il viso)',
      desc: 'Una creatura entro gittata fa TS Saggezza o è Affascinata finché dura (successo automatico se non è Umanoide, se ti sta combattendo, o se già bersaglio nelle ultime 24 ore).' },
    { id: 'mano-magica', name: 'Mano Magica', level: 0, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 min · V, S',
      desc: 'Una mano spettrale manipola oggetti, apre porte o contenitori non chiusi a chiave, o versa il contenuto di una fiala. Non può attaccare, attivare oggetti magici, né portare più di 4,5 kg. Azione magica nei turni successivi per muoverla fino a 9 m.' },
    { id: 'scheggia-mentale', name: 'Scheggia Mentale', level: 0, school: 'Incantamento',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 round · V',
      desc: 'Il bersaglio fa TS Intelligenza o subisce 1d6 psichici e sottrae 1d4 al suo prossimo TS entro la fine del tuo prossimo turno. Il danno sale a 2d6 al livello 5, 3d6 all\'11°, 4d6 al 17°.' },
    { id: 'illusione-minore', name: 'Illusione Minore', level: 0, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 min · S, M (un fiocco di lana)',
      desc: 'Crei un suono o l\'immagine di un oggetto entro gittata, finché dura o finché non lanci di nuovo l\'incantesimo. Una creatura che la esamina con un\'azione di Studio può smascherarla con una prova di Investigare contro la tua CD.' },
    { id: 'spruzzo-di-veleno', name: 'Spruzzo di Veleno', level: 0, school: 'Negromanzia',
      classes: ['druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Attacco con incantesimo a distanza: 1d12 veleno se colpisci. Il danno sale a 2d12 al livello 5, 3d12 all\'11°, 4d12 al 17°.' },
    { id: 'prestidigitazione', name: 'Prestidigitazione', level: 0, school: 'Trasmutazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 3 m · fino a 1 ora · V, S',
      desc: 'Crei uno tra vari piccoli effetti magici a scelta (scintille o odori innocui, accendere/spegnere una piccola fiamma, pulire o sporcare un oggetto, un piccolo segno colorato, un gingillo illusorio in mano). Puoi mantenerne fino a tre non istantanei attivi insieme.' },
    { id: 'schiocco-di-tuono', name: 'Schiocco di Tuono', level: 0, school: 'Evocazione',
      classes: ['bardo', 'druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé (emanazione 1,5 m) · Istantaneo · S',
      desc: 'Le creature nell\'emanazione fanno TS Costituzione o subiscono 1d6 tuono; il suono si sente fino a 30 m. Il danno sale a 2d6 al livello 5, 3d6 all\'11°, 4d6 al 17°.' },
    { id: 'rintocco-dei-morti', name: 'Rintocco dei Morti', level: 0, school: 'Negromanzia',
      classes: ['chierico', 'warlock', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Il bersaglio fa TS Saggezza o subisce 1d8 necrotici (1d12 se già ferito). Ai livelli 5/11/17 il dado aumenta (2d8 o 2d12, poi 3, poi 4).' },
    { id: 'vero-colpo', name: 'Vero Colpo', level: 0, school: 'Divinazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · Istantaneo · S, M (un\'arma con cui hai competenza, valore 1+ MR)',
      desc: 'Un solo attacco con l\'arma usata nel lancio, usando la tua caratteristica da incantatore invece di Forza o Destrezza; il danno può essere Radioso o quello normale dell\'arma. Ai livelli 5/11/17 aggiunge danno Radioso extra (1d6, poi 2d6, poi 3d6).' },

    { id: 'armatura-di-agathys', name: 'Armatura di Agathys', level: 1, school: 'Abiurazione',
      classes: ['warlock'],
      meta: 'Azione bonus · Sé · 1 ora · V, S, M (un frammento di vetro blu)',
      desc: 'Ottieni 5 PF temporanei. Finché dura, ogni creatura che ti colpisce in mischia subisce 5 danni da freddo. Termina prima se perdi tutti i PF temporanei. +5 PF temporanei e +5 danni per ogni slot oltre il 1°.' },
    { id: 'braccia-di-hadar', name: 'Braccia di Hadar', level: 1, school: 'Convocazione',
      classes: ['warlock'],
      meta: 'Azione · Sé (emanazione 3 m) · Istantaneo · V, S',
      desc: 'Tentacoli scaturiscono da te: le creature nell\'emanazione fanno TS Forza, subendo 2d6 necrotici (metà se superano) e non potendo usare reazioni fino al tuo prossimo turno. +1d6 per ogni slot oltre il 1°.' },
    { id: 'maledizione', name: 'Maledizione', level: 1, school: 'Incantamento',
      classes: ['bardo', 'chierico', 'warlock'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M (una goccia di sangue)',
      desc: 'Fino a tre creature fanno TS Carisma; chi fallisce sottrae 1d4 ai tiri per colpire e ai TS finché dura. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'ammaliare-persone', name: 'Ammaliare Persone', level: 1, school: 'Incantamento',
      classes: ['bardo', 'druido', 'stregone', 'warlock', 'mago', 'chierico'],
      meta: 'Azione · 9 m · 1 ora · V, S',
      desc: 'Un Umanoide fa TS Saggezza (con vantaggio se in combattimento con te) o è Affascinato finché dura o finché tu/alleati gli infliggete danno. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'comprendere-le-lingue', name: 'Comprendere le Lingue', level: 1, school: 'Divinazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione o Rituale · Sé · 1 ora · V, S, M (fuliggine e sale)',
      desc: 'Comprendi il significato letterale di qualsiasi lingua che senti o vedi segnata, incluse quelle scritte se tocchi il testo. Non decodifica simboli o messaggi in codice.' },
    { id: 'ritirata-veloce', name: 'Ritirata Veloce', level: 1, school: 'Trasmutazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione bonus · Sé · 10 min CONC · V, S',
      desc: 'Compi l\'azione Scatto, e finché dura puoi ripeterla come azione bonus in ogni turno successivo.' },
    { id: 'rimprovero-infernale', name: 'Rimprovero Infernale', level: 1, school: 'Evocazione',
      classes: ['warlock'],
      meta: 'Reazione (a un danno subito da una creatura vista entro 18 m) · 18 m · Istantaneo · V, S',
      desc: 'La creatura che ti ha danneggiato fa TS Destrezza, subendo 2d10 fuoco (metà se supera). +1d10 per ogni slot oltre il 1°.' },
    { id: 'fattura', name: 'Fattura', level: 1, school: 'Incantamento',
      classes: ['warlock'],
      meta: 'Azione bonus · 27 m · 1 ora CONC · V, S, M (occhio pietrificato di tritone)',
      desc: 'Maledici un bersaglio: ogni colpo gli infligge +1d6 necrotico extra, e ha svantaggio alle prove con una caratteristica a scelta. Se scende a 0 PF puoi spostare la maledizione (azione bonus). Con slot di 2° dura 4 ore, 3°-4° otto ore, 5°+ ventiquattro ore.' },
    { id: 'scrittura-illusoria', name: 'Scrittura Illusoria', level: 1, school: 'Illusione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: '1 minuto o Rituale · Tocco · 10 giorni · S, M (inchiostro da 10+ MO, consumato)',
      desc: 'Scrivi un testo che appare normale solo a te e a chi designi; per chiunque altro è uno script illeggibile (o puoi alterarne il significato apparente). Chi ha Vista Vera legge comunque il messaggio nascosto.' },
    { id: 'risata-orrenda-di-tasha', name: 'Risata Orrenda di Tasha', level: 1, school: 'Incantamento',
      classes: ['bardo', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M (una torta e una piuma)',
      desc: 'Il bersaglio fa TS Saggezza o è Prono e Incapace di Agire, ridendo senza controllo, finché dura. Ripete il TS (con vantaggio se scatenato da un danno) a fine turno e quando subisce danno; se supera, l\'incantesimo termina. +1 bersaglio per ogni slot oltre il 1°.' },
    { id: 'servitore-invisibile', name: 'Servitore Invisibile', level: 1, school: 'Convocazione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: 'Azione o Rituale · 18 m · 1 ora · V, S, M (spago e legno)',
      desc: 'Crei una forza invisibile e priva di mente (CA 10, 1 PF, For 2) che compie compiti semplici (portare oggetti, pulire, servire, versare) su tuo comando mentale: azione bonus per muoverla fino a 4,5 m. Termina a 0 PF.' },
    { id: 'dardo-stregato', name: 'Dardo Stregato', level: 1, school: 'Evocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un rametto colpito da un fulmine)',
      desc: 'Attacco con incantesimo a distanza: 2d12 fulmine se colpisci, poi un arco di energia resta sospeso. Nei turni successivi, azione bonus per infliggere automaticamente 1d12 fulmine, anche se il primo attacco mancò. Termina se il bersaglio esce dalla gittata o ha copertura totale. +1d12 al danno iniziale per ogni slot oltre il 1°.' },

    { id: 'nube-di-pugnali', name: 'Nube di Pugnali', level: 2, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (una scheggia di vetro)',
      desc: 'Pugnali roteanti riempiono un cubo di 1,5 m: chi vi entra o vi termina il turno subisce 4d4 taglienti (una volta a turno). Azione magica per teletrasportare il cubo fino a 9 m. +2d4 per ogni slot oltre il 2°.' },
    { id: 'corona-di-follia', name: 'Corona di Follia', level: 2, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S',
      desc: 'Una creatura (fallisce automaticamente se non è Umanoide) fa TS Saggezza o è Affascinata: una corona spettrale le appare in testa e, a ogni suo turno, deve attaccare in mischia la creatura più vicina a scelta tua (o agisce normalmente se non ne scegli una o nessuna è a portata). Ripete il TS a fine turno; devi mantenere il controllo con un\'azione magica ogni turno successivo, altrimenti l\'incantesimo termina.' },
    { id: 'oscurita', name: 'Oscurità', level: 2, school: 'Evocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, M (pelo di pipistrello e un pezzo di carbone)',
      desc: 'Oscurità magica riempie una sfera di 4,5 m di raggio (o un\'emanazione se lanciata su un oggetto non indossato): la Scurovisione non la penetra e la luce non magica non la illumina. Dissolve luce di livello 2 o inferiore che vi si sovrappone; coprire l\'oggetto sorgente con qualcosa di opaco blocca l\'effetto.' },
    { id: 'soggiogare', name: 'Soggiogare', level: 2, school: 'Incantamento',
      classes: ['bardo', 'warlock'],
      meta: 'Azione · 18 m · 1 min CONC · V, S',
      desc: 'Le creature scelte entro gittata fanno TS Saggezza (successo automatico se ti stanno già combattendo) o subiscono −10 alle prove di Percezione e alla Percezione passiva finché dura.' },
    { id: 'paralizzare-umanoide', name: 'Paralizzare Umanoide', level: 2, school: 'Incantamento',
      classes: ['bardo', 'chierico', 'druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un pezzo di ferro dritto)',
      desc: 'Un Umanoide fa TS Saggezza o è Paralizzato finché dura, ripetendo il TS a fine di ogni suo turno. +1 bersaglio per ogni slot oltre il 2°.' },
    { id: 'invisibilita', name: 'Invisibilità', level: 2, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago', 'chierico'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M (un ciglio in gomma arabica)',
      desc: 'La creatura toccata è Invisibile finché dura; termina subito dopo che attacca, infligge danno o lancia un incantesimo. +1 bersaglio per ogni slot oltre il 2°.' },
    { id: 'puntura-mentale', name: 'Puntura Mentale', level: 2, school: 'Divinazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 36 m · 1 ora CONC · S',
      desc: 'Il bersaglio fa TS Saggezza, subendo 3d8 psichici (metà se supera). Se fallisce, ne conosci sempre la posizione finché dura (stesso piano) e non può nascondersi da te né beneficiare dell\'Invisibilità contro di te. +1d8 per ogni slot oltre il 2°.' },
    { id: 'immagine-speculare', name: 'Immagine Speculare', level: 2, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · 1 min · V, S',
      desc: 'Tre duplicati illusori ti circondano, muovendosi e imitandoti. Se subisci un colpo, tiri 1d6 per ogni duplicato rimasto: con un 3+ un duplicato viene colpito al posto tuo e distrutto. Finisce quando tutti e tre sono distrutti; non inganna le creature Accecate o dotate di Vista Cieca o Vista Vera.' },
    { id: 'passo-nella-nebbia', name: 'Passo nella Nebbia', level: 2, school: 'Convocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione bonus · Sé · Istantaneo · V',
      desc: 'Avvolto da nebbia argentea, ti teletrasporti fino a 9 m in uno spazio libero che riesci a vedere.' },
    { id: 'raggio-di-indebolimento', name: 'Raggio di Indebolimento', level: 2, school: 'Negromanzia',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S',
      desc: 'Il bersaglio fa TS Costituzione. Se fallisce, ha svantaggio ai D20 Test basati su Forza e sottrae 1d8 ai tiri per i danni finché dura (ripete il TS a fine turno). Se supera, ha solo svantaggio al suo prossimo attacco.' },
    { id: 'scalare-come-ragno', name: 'Scalare come Ragno', level: 2, school: 'Trasmutazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M (una goccia di bitume e un ragno)',
      desc: 'La creatura volontaria toccata può muoversi su superfici verticali e soffitti senza usare le mani, con velocità di scalata pari alla sua, finché dura. +1 bersaglio per ogni slot oltre il 2°.' },
    { id: 'suggestione', name: 'Suggestione', level: 2, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 8 ore CONC · V, M (una goccia di miele)',
      desc: 'Suggerisci (max 25 parole) un\'attività plausibile e non dannosa a un bersaglio che ti capisce. Fa TS Saggezza o è Affascinato e la persegue finché dura o finché tu/alleati gli infliggete danno; se la completa prima, l\'incantesimo termina su di esso.' },

    /* ===== Warlock — 3°-9° livello (blocco 2, completa la classe) ===== */
    { id: 'contro-incantesimo', name: 'Contro Incantesimo', level: 3, school: 'Abiurazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Reazione (a una creatura vista entro 18 m che lancia un incantesimo con componente Verbale, Somatica o Materiale) · 18 m · Istantaneo · S',
      desc: 'Il lanciatore fa TS Costituzione contro la tua CD incantesimi: se fallisce, l\'incantesimo si dissolve senza effetto e l\'azione (o lo slot, se usato) è sprecata.' },
    { id: 'paura', name: 'Paura', level: 3, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé (cono 9 m) · 1 min CONC · V, S, M (una piuma bianca)',
      desc: 'Le creature nel cono fanno TS Saggezza o lasciano cadere ciò che tengono in mano e sono Spaventate finché dura. Una creatura Spaventata usa Scatto per allontanarsi da te ogni turno; se termina il turno senza linea di vista su di te, ripete il TS per liberarsi.' },
    { id: 'volare', name: 'Volare', level: 3, school: 'Trasmutazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · 10 min CONC · V, S, M (una piuma)',
      desc: 'La creatura volontaria toccata ottiene velocità di volo di 18 m e può librarsi, finché dura. Se è ancora in volo quando l\'incantesimo termina, cade (a meno che non possa fermare la caduta). +1 bersaglio per ogni slot oltre il 3°.' },
    { id: 'forma-gassosa', name: 'Forma Gassosa', level: 3, school: 'Trasmutazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · 1 ora CONC · V, S, M (un pezzo di garza)',
      desc: 'La creatura volontaria toccata si trasforma (con tutto ciò che indossa e porta) in una nube di nebbia: volo 3 m con librarsi come unico movimento, può entrare nello spazio di un\'altra creatura, resistenza a contundenti/perforanti/taglienti, immunità a Prono, vantaggio ai TS Forza/Destrezza/Costituzione. Non può parlare, manipolare oggetti, attaccare né lanciare incantesimi. Termina a 0 PF o con un\'azione magica. +1 bersaglio per ogni slot oltre il 3°.' },
    { id: 'fame-di-hadar', name: 'Fame di Hadar', level: 3, school: 'Convocazione',
      classes: ['warlock'],
      meta: 'Azione · 45 m · 1 min CONC · V, S, M (un tentacolo sottaceto)',
      desc: 'Apri un varco verso il Regno Remoto: una sfera di oscurità di 6 m di raggio appare, Terreno Difficile, piena di sussurri udibili a 9 m; nessuna luce la illumina e chi vi è interamente dentro è Accecato. Chi inizia il turno nell\'area subisce 2d6 freddo; chi lo termina lì fa TS Destrezza per 2d6 acido da tentacoli (metà se supera). +1d6 a un danno a scelta per ogni slot oltre il 3°.' },
    { id: 'motivo-ipnotico', name: 'Motivo Ipnotico', level: 3, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago', 'chierico'],
      meta: 'Azione · 36 m · 1 min CONC · S, M (un pizzico di coriandoli)',
      desc: 'Un motivo di colori intrecciati appare in un cubo di 9 m entro gittata. Chi lo vede fa TS Saggezza o è Affascinato (Incapace di Agire, velocità 0) finché dura. Termina per una creatura se subisce danno o se qualcuno la scuote con un\'azione.' },
    { id: 'immagine-maggiore', name: 'Immagine Maggiore', level: 3, school: 'Illusione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 36 m · 10 min CONC · V, S, M (un fiocco di lana)',
      desc: 'Crei l\'immagine (con suoni, odori e temperatura) di un oggetto, creatura o fenomeno fino a 6 m di lato, entro gittata; puoi spostarla con un\'azione magica e alterarne l\'aspetto in movimento. Non infligge danno né condizioni; l\'interazione fisica o una prova di Investigare contro la tua CD la smaschera. Con uno slot di 4°+ dura finché non viene dissolta, senza richiedere concentrazione.' },
    { id: 'evocare-non-morto', name: 'Evocare Non Morto', level: 3, school: 'Negromanzia',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (un teschio dorato, 300+ MO)',
      desc: 'Evochi uno spirito non morto (statistiche proprie) scegliendo la forma Spettrale, Putrida o Scheletrica: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },
    { id: 'lingue', name: 'Lingue', level: 3, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · 1 ora · V, M (uno ziggurat in miniatura)',
      desc: 'La creatura toccata comprende ogni lingua parlata o firmata che sente o vede per la durata; chiunque la ascolti comprende a sua volta ciò che dice o firma, purché conosca almeno una lingua.' },
    { id: 'tocco-vampirico', name: 'Tocco Vampirico', level: 3, school: 'Negromanzia',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S',
      desc: 'Attacco con incantesimo in mischia: se colpisci, 3d6 necrotici e recuperi PF pari alla metà del danno inflitto. Nei turni successivi puoi ripetere l\'attacco (azione magica) contro lo stesso bersaglio o uno diverso. +1d6 per ogni slot oltre il 3°.' },

    { id: 'piaga', name: 'Piaga', level: 4, school: 'Negromanzia',
      classes: ['druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Il bersaglio fa TS Costituzione (le creature Pianta falliscono automaticamente), subendo 8d8 necrotici (metà se supera). In alternativa puoi colpire una pianta non magica non senziente, che appassisce senza TS. +1d8 per ogni slot oltre il 4°.' },
    { id: 'ammaliare-mostro', name: 'Ammaliare Mostro', level: 4, school: 'Incantamento',
      classes: ['bardo', 'druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 ora · V, S',
      desc: 'Una creatura fa TS Saggezza (con vantaggio se in combattimento con te) o è Affascinata finché dura o finché tu/alleati gli infliggete danno; nel frattempo ti è Amichevole e, quando l\'incantesimo termina, sa di essere stata Affascinata. +1 bersaglio per ogni slot oltre il 4°.' },
    { id: 'porta-dimensionale', name: 'Porta Dimensionale', level: 4, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago', 'chierico'],
      meta: 'Azione · 150 m · Istantaneo · V',
      desc: 'Ti teletrasporti in un punto entro gittata (visto, immaginato o descritto per distanza e direzione), portando con te anche una creatura volontaria entro 1,5 m. Se tu o l\'altra creatura arrivereste in uno spazio occupato, entrambi subite 4d6 forza e il teletrasporto fallisce.' },
    { id: 'terreno-illusorio', name: 'Terreno Illusorio', level: 4, school: 'Illusione',
      classes: ['bardo', 'druido', 'warlock', 'mago'],
      meta: '10 minuti · 90 m · 24 ore · V, S, M (un fungo)',
      desc: 'Un terreno naturale in un cubo di 45 m appare, suona e odora come un altro tipo di terreno (es. un campo sembra una palude). Strutture, equipaggiamento e creature non cambiano. Il tatto rivela l\'inganno; una prova di Investigare contro la tua CD (azione di Studio) lo smaschera a vista.' },
    { id: 'evocare-aberrazione', name: 'Evocare Aberrazione', level: 4, school: 'Convocazione',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (un tentacolo sottaceto e un occhio in una fiala rivestita di platino, 400+ MO)',
      desc: 'Evochi uno spirito aberrante (statistiche proprie) scegliendo Beholderkin, Divoratore di Menti o Slaad: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },

    { id: 'contattare-altro-piano', name: 'Contattare Altro Piano', level: 5, school: 'Divinazione',
      classes: ['warlock', 'mago'],
      meta: '1 minuto o Rituale · Sé · 1 minuto · V',
      desc: 'Contatti mentalmente un\'entità ultraterrena: fai un TS Intelligenza CD 15. Se superi, puoi porre fino a cinque domande a cui il Master risponde con una parola (o una breve frase se necessario). Se fallisci, subisci 6d6 psichici e sei Incapace di Agire fino al prossimo riposo lungo (curabile con Ristorare Superiore).' },
    { id: 'sogno', name: 'Sogno', level: 5, school: 'Illusione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: '1 minuto · Speciale · 8 ore · V, S, M (una manciata di sabbia)',
      desc: 'Tu o un messaggero volontario toccato entrate in trance (Incapace di Agire, velocità 0) per contattare in sogno un bersaglio conosciuto sullo stesso piano, potendo conversare e plasmare l\'ambiente onirico finché dorme. Puoi rendere il messaggero terrificante: consegna un messaggio di massimo 10 parole, poi il bersaglio fa TS Saggezza o non trae beneficio dal riposo e subisce 3d6 psichici al risveglio.' },
    { id: 'paralizzare-mostro', name: 'Paralizzare Mostro', level: 5, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M (un pezzo di ferro dritto)',
      desc: 'Una creatura fa TS Saggezza o è Paralizzata finché dura, ripetendo il TS a fine di ogni suo turno. +1 bersaglio per ogni slot oltre il 5°.' },
    { id: 'tempesta-di-radiosita-di-jallarzi', name: 'Tempesta di Radiosità di Jallarzi', level: 5, school: 'Evocazione',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (un pizzico di fosforo)',
      desc: 'Una tempesta di luce e tuono riempie un Cilindro di 3 m di raggio e 12 m di altezza: chi vi si trova è Accecato e Assordato e non può lanciare incantesimi con componente Verbale. Alla comparsa (e quando una creatura vi entra o vi termina il turno) TS Costituzione, subendo 2d10 radiosi + 2d10 tuono (metà se supera, una volta a turno). +1d10 a ciascun danno per ogni slot oltre il 5°.' },
    { id: 'sviare', name: 'Sviare', level: 5, school: 'Illusione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: 'Azione · Sé · 1 ora CONC · S',
      desc: 'Diventi Invisibile mentre un tuo doppio illusorio appare al tuo posto; l\'invisibilità termina subito se attacchi, infliggi danno o lanci un incantesimo. Con un\'azione magica muovi il doppio (intangibile e invulnerabile) fino al doppio della tua velocità, facendolo gesticolare e parlare, e puoi vedere e sentire attraverso di esso.' },
    { id: 'vincolo-planare', name: 'Vincolo Planare', level: 5, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'druido', 'warlock', 'mago'],
      meta: '1 ora · 18 m · 24 ore · V, S, M (un gioiello da 1.000+ MO, consumato)',
      desc: 'Tenti di vincolare un Celestiale, un Elementale, un Folletto o un Immondo al tuo servizio: al termine del lancio fa TS Carisma o è vincolato a obbedire ai tuoi comandi per la durata. Con slot di 6° dura 10 giorni, 7° trenta giorni, 8° centottanta giorni, 9° trecentosessantasei giorni.' },
    { id: 'scrutare', name: 'Scrutare', level: 5, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'druido', 'warlock', 'mago'],
      meta: '10 minuti · Sé · 10 min CONC · V, S, M (un focus da 1.000+ MO: sfera di cristallo, specchio o fonte d\'acqua)',
      desc: 'Vedi e senti un bersaglio a scelta sullo stesso piano: fa un TS Saggezza modificato da quanto lo conosci e da un\'eventuale connessione fisica con esso (oggetto appartenuto, ciocca di capelli, ecc.); se fallisce, ottieni un sensore invisibile nei suoi pressi per la durata.' },
    { id: 'statica-sinaptica', name: 'Statica Sinaptica', level: 5, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Energia psichica erompe in una sfera di 6 m di raggio: le creature fanno TS Intelligenza, subendo 8d6 psichici (metà se superano). Chi fallisce ha pensieri confusi per 1 minuto: −1d6 a tiri per colpire, prove e TS Costituzione per mantenere la concentrazione (ripete il TS a fine turno per liberarsi).' },
    { id: 'cerchio-di-teletrasporto', name: 'Cerchio di Teletrasporto', level: 5, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: '1 minuto · 3 m · 1 round · V, M (inchiostri rari da 50+ MO, consumati)',
      desc: 'Disegni un cerchio di 1,5 m di raggio che collega la tua posizione a un cerchio di teletrasporto permanente a te noto: per 1 round si apre un portale che chiunque può attraversare per raggiungere l\'altro cerchio.' },

    { id: 'portale-arcano', name: 'Portale Arcano', level: 6, school: 'Convocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 150 m · 10 min CONC · V, S',
      desc: 'Crei due portali circolari collegati (uno entro gittata, uno entro 3 m da te), aperti su un solo lato a tua scelta: ciò che entra da un lato esce dall\'altro come se fossero adiacenti. Azione bonus per cambiare il lato aperto.' },
    { id: 'cerchio-di-morte', name: 'Cerchio di Morte', level: 6, school: 'Negromanzia',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (polvere di perla nera, 500+ MO)',
      desc: 'Energia negativa si propaga in una sfera di 18 m di raggio: le creature fanno TS Costituzione, subendo 8d8 necrotici (metà se superano). +2d8 per ogni slot oltre il 6°.' },
    { id: 'creare-non-morti', name: 'Creare Non Morti', level: 6, school: 'Negromanzia',
      classes: ['chierico', 'warlock', 'mago'],
      meta: '1 minuto · 3 m · Istantaneo · V, S, M (una pietra d\'onice nera da 150+ MO per ogni cadavere)',
      desc: 'Lanciabile solo di notte: fino a tre cadaveri Umanoidi Medi o Piccoli entro gittata diventano Ghoul sotto il tuo controllo. Azione bonus per comandarli mentalmente (entro 36 m); restano sotto controllo per 24 ore, rinnovabili rilanciando l\'incantesimo prima della scadenza.' },
    { id: 'morso-dell-occhio', name: 'Morso dell\'Occhio', level: 6, school: 'Negromanzia',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S',
      desc: 'I tuoi occhi diventano un vuoto nero: una creatura entro 18 m fa TS Saggezza o subisce uno tra tre effetti a scelta (Addormentato: Incosciente finché non subisce danno; Nel Panico: Spaventata, deve Scattare lontano da te; Malato: Avvelenato) finché dura. Azione magica nei turni successivi per bersagliare un\'altra creatura, purché non abbia già superato il TS contro questo lancio.' },
    { id: 'evocare-immondo', name: 'Evocare Immondo', level: 6, school: 'Convocazione',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (una fiala insanguinata, 600+ MO)',
      desc: 'Evochi uno spirito immondo (statistiche proprie) scegliendo Demone, Diavolo o Yugoloth: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi.' },
    { id: 'calderone-ribollente-di-tasha', name: 'Calderone Ribollente di Tasha', level: 6, school: 'Convocazione',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 1,5 m · 10 minuti · V, S, M (un mestolo dorato, 500+ MO)',
      desc: 'Convochi un calderone che duplica le proprietà di una pozione Comune o Non Comune a tua scelta: con un\'azione bonus tu o un alleato potete estrarne una pozione (fino a un numero pari al tuo modificatore da incantatore, minimo 1). Il calderone svanisce quando finiscono le pozioni o quando lanci di nuovo l\'incantesimo.' },
    { id: 'vista-vera', name: 'Vista Vera', level: 6, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (polvere di fungo, 25+ MO, consumata)',
      desc: 'La creatura volontaria toccata ottiene Vista Vera con raggio 36 m per la durata.' },

    { id: 'eterealita', name: 'Eterealità', level: 7, school: 'Convocazione',
      classes: ['bardo', 'chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Sé · fino a 8 ore · V, S',
      desc: 'Entri nelle regioni di confine del Piano Etereo, dove si sovrappone al tuo piano attuale. Puoi muoverti in ogni direzione (il movimento verticale costa il doppio), percepisci il piano lasciato (in grigio, fino a 18 m) e puoi interagire solo con creature e oggetti sul Piano Etereo. Termina istantaneamente se lo lanci mentre sei già sul Piano Etereo o su un piano che non vi confina. +3 bersagli volontari (entro 3 m) per ogni slot oltre il 7°.' },
    { id: 'dito-della-morte', name: 'Dito della Morte', level: 7, school: 'Negromanzia',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Il bersaglio fa TS Costituzione, subendo 7d8+30 necrotici (metà se supera). Un Umanoide ucciso da questo incantesimo risorge come uno Zombie ai tuoi ordini all\'inizio del tuo turno successivo.' },
    { id: 'gabbia-di-forza', name: 'Gabbia di Forza', level: 7, school: 'Evocazione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: 'Azione · 30 m · 1 ora CONC · V, S, M (polvere di rubino, 1.500+ MO, consumata)',
      desc: 'Una prigione invisibile e immobile di forza magica (gabbia fino a 6 m di lato, o scatola solida fino a 3 m) imprigiona le creature interamente al suo interno. Per uscire con teletrasporto o viaggio interplanare serve un TS Carisma superato; altrimenti il tentativo fallisce e lo spreca. Non può essere dissolta con Dissolvi Magie.' },
    { id: 'spostamento-di-piano', name: 'Spostamento di Piano', level: 7, school: 'Convocazione',
      classes: ['chierico', 'druido', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (un\'asta di metallo forcuta, 250+ MO, sintonizzata su un piano)',
      desc: 'Tu e fino a otto creature volontarie che vi tenete per mano venite trasportati su un altro piano di esistenza, in una destinazione generale a tua scelta. In alternativa, se conosci la sequenza di un cerchio di teletrasporto su un altro piano, puoi raggiungerlo direttamente.' },

    { id: 'frastornare', name: 'Frastornare', level: 8, school: 'Incantamento',
      classes: ['bardo', 'druido', 'warlock', 'mago'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (un portachiavi senza chiavi)',
      desc: 'Colpisci la mente di un bersaglio, che fa TS Intelligenza. In combattimento deve poi superare un TS Saggezza a inizio di ogni suo turno o è costretto a Schivare; ogni volta che gli infliggi danno subisce +1d8 necrotico extra. Con slot di 4° dura 10 minuti in concentrazione; con 5°+ non richiede concentrazione (8 ore con slot 5°-6°, 24 ore con 7°-8°); con slot di 9° dura finché non viene dissolto.' },
    { id: 'semipiano', name: 'Semipiano', level: 8, school: 'Convocazione',
      classes: ['stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 ora · S',
      desc: 'Crei una porta ombrosa su una superficie solida che conduce a un semipiano vuoto di 9 m per lato (legno o pietra, a scelta). Quando l\'incantesimo termina, la porta svanisce; oggetti e creature dentro restano, a meno che scelgano di uscire mentre la porta scompare (atterrando Proni). Puoi ricollegare la porta a un semipiano creato in precedenza.' },
    { id: 'dominare-mostro', name: 'Dominare Mostro', level: 8, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 ora CONC · V, S',
      desc: 'Una creatura fa TS Saggezza (con vantaggio se in combattimento con te) o è Affascinata per la durata; ripete il TS quando subisce danno. Hai un legame telepatico per impartirle comandi (nessuna azione richiesta); se non ne riceve, agisce proteggendosi. Con slot di 9° dura fino a 8 ore.' },
    { id: 'parlantina', name: 'Parlantina', level: 8, school: 'Incantamento',
      classes: ['bardo', 'warlock'],
      meta: 'Azione · Sé · 1 ora · V',
      desc: 'Finché dura, puoi sostituire il risultato di ogni prova di Carisma con un 15, e qualsiasi magia usata per verificare se menti indica che stai dicendo la verità.' },
    { id: 'parola-di-potere-stordire', name: 'Parola di Potere: Stordire', level: 8, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Travolgi la mente di un bersaglio: se ha 150 PF o meno è Stordito, altrimenti la sua velocità diventa 0 fino al tuo prossimo turno. Il bersaglio Stordito ripete un TS Costituzione a fine di ogni suo turno per liberarsi.' },

    { id: 'proiezione-astrale', name: 'Proiezione Astrale', level: 9, school: 'Negromanzia',
      classes: ['chierico', 'warlock', 'mago'],
      meta: '1 ora · 3 m · Finché non dissolto · V, S, M (per ogni bersaglio: un giacinto da 7.000+ MO e una barra d\'argento da 100+ MO, consumati)',
      desc: 'Tu e fino a otto creature volontarie proiettate il corpo astrale sul Piano Astrale; i corpi restano in animazione sospesa (Incoscienti, senza bisogno di cibo o aria). Un cordone d\'argento collega corpo e forma astrale: se viene reciso, entrambi muoiono. Se il corpo o la forma astrale di un bersaglio scende a 0 PF, l\'incantesimo termina per lui.' },
    { id: 'preveggenza', name: 'Preveggenza', level: 9, school: 'Divinazione',
      classes: ['bardo', 'druido', 'warlock', 'mago'],
      meta: '1 minuto · Tocco · 8 ore · V, S, M (una piuma di colibrì)',
      desc: 'La creatura volontaria toccata ottiene vantaggio a tutti i D20 Test per la durata, e le creature nemiche hanno svantaggio ad attaccarla. Termina prima se lo lanci di nuovo.' },
    { id: 'cancello', name: 'Cancello', level: 9, school: 'Convocazione',
      classes: ['chierico', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un diamante da 5.000+ MO)',
      desc: 'Convochi un portale circolare (3-6 m di diametro) che collega uno spazio libero entro gittata a un luogo preciso di un altro piano, visibile attraverso di esso. Il portale ha un fronte e un retro: attraversarlo dal fronte trasporta istantaneamente sull\'altro piano, nello spazio libero più vicino.' },
    { id: 'imprigionamento', name: 'Imprigionamento', level: 9, school: 'Abiurazione',
      classes: ['warlock', 'mago'],
      meta: '1 minuto · 9 m · Finché non dissolto · V, S, M (una statuetta del bersaglio, 5.000+ MO)',
      desc: 'Crei un vincolo magico per trattenere una creatura: fa TS Saggezza o è imprigionata (non deve respirare, mangiare né bere, e non invecchia; non individuabile con divinazioni né in grado di teletrasportarsi). Se supera, è immune per 24 ore. Scegli anche uno tra più effetti aggiuntivi (sepoltura in una sfera di forza, incatenamento al suolo, o un semipiano-prigione).' },
    { id: 'parola-di-potere-uccidere', name: 'Parola di Potere: Uccidere', level: 9, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'warlock', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Costringi una creatura vista entro gittata a morire: se ha 100 PF o meno, muore all\'istante. Altrimenti subisce 12d12 psichici.' },
    { id: 'vera-metamorfosi', name: 'Vera Metamorfosi', level: 9, school: 'Trasmutazione',
      classes: ['bardo', 'warlock', 'mago'],
      meta: 'Azione · 9 m · 1 ora CONC · V, S, M (una goccia di mercurio, gomma arabica e un filo di fumo)',
      desc: 'Una creatura o un oggetto non magico entro gittata si trasforma in un\'altra creatura o in un oggetto non magico (l\'oggetto trasformato non deve essere indossato né trasportato). La trasformazione dura finché mantieni la concentrazione per l\'intera durata, dopodiché diventa permanente.' },
    { id: 'orrore-illusorio', name: 'Orrore Illusorio', level: 9, school: 'Illusione',
      classes: ['warlock', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S',
      desc: 'Crei terrori illusori nella mente altrui: le creature scelte in una sfera di 9 m fanno TS Saggezza, subendo 10d10 psichici e diventando Spaventate per la durata (metà danno se superano). Chi resta Spaventato ripete il TS a fine turno, subendo 5d10 psichici se fallisce o liberandosi se supera.' },

    /* ===== Bardo — trucchetti e 1°-3° livello (blocco 1) ===== */
    { id: 'luci-danzanti', name: 'Luci Danzanti', level: 0, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (un po\' di fosforo)',
      desc: 'Crei fino a quattro luci delle dimensioni di una torcia (o le unisci in una forma vagamente umanoide), che emanano luce fioca in 3 m di raggio finché durano. Azione bonus per spostarle fino a 18 m; devono restare entro 6 m l\'una dall\'altra o svaniscono.' },
    { id: 'riparare', name: 'Riparare', level: 0, school: 'Trasmutazione',
      classes: ['bardo', 'chierico', 'druido', 'stregone', 'mago'],
      meta: '1 minuto · Tocco · Istantaneo · V, S, M (due calamite)',
      desc: 'Ripari una singola rottura o strappo su un oggetto toccato (non più grande di 30 cm), senza lasciare traccia del danno. Ripara fisicamente un oggetto magico, ma non ne ripristina la magia.' },
    { id: 'messaggio', name: 'Messaggio', level: 0, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 round · S, M (un filo di rame)',
      desc: 'Indichi una creatura entro gittata e sussurri un messaggio: solo lei lo sente e può risponderti bisbigliando. Funziona anche attraverso ostacoli solidi se conosci il bersaglio; bloccato da silenzio magico o 30 cm di pietra, metallo, legno, o un sottile foglio di piombo.' },
    { id: 'scintilla-stellare', name: 'Scintilla Stellare', level: 0, school: 'Evocazione',
      classes: ['bardo', 'druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Attacco con incantesimo a distanza: 1d8 radiosi se colpisci, e fino alla fine del tuo prossimo turno il bersaglio emette luce fioca in 3 m e non beneficia dell\'Invisibilità. Il danno sale a 2d8 al livello 5, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'scherno-crudele', name: 'Scherno Crudele', level: 0, school: 'Incantamento',
      classes: ['bardo'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Scagli una raffica di insulti incantati contro una creatura che vedi o senti: fa TS Saggezza o subisce 1d6 psichici e ha svantaggio al suo prossimo attacco entro la fine del suo prossimo turno. Il danno sale a 2d6 al livello 5, 3d6 all\'11°, 4d6 al 17°.' },

    { id: 'spruzzo-di-colori', name: 'Spruzzo di Colori', level: 1, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · Sé (cono 4,5 m) · Istantaneo · V, S, M (un pizzico di sabbia colorata)',
      desc: 'Lanci un abbagliante spruzzo di luci colorate: le creature nel cono fanno TS Costituzione o sono Accecate fino alla fine del tuo prossimo turno.' },
    { id: 'travisamento', name: 'Travisamento', level: 1, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · Sé · 1 ora · V, S',
      desc: 'Cambi il tuo aspetto (compresi abiti ed equipaggiamento) finché dura: puoi sembrare più alto o basso di 30 cm, più pesante o leggero, ma devi mantenere la stessa disposizione base degli arti. L\'illusione non regge all\'ispezione fisica.' },
    { id: 'sussurri-dissonanti', name: 'Sussurri Dissonanti', level: 1, school: 'Incantamento',
      classes: ['bardo'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Il bersaglio sente una melodia discordante nella mente e fa TS Saggezza, subendo 3d6 psichici (metà se supera) e dovendo usare la reazione, se disponibile, per allontanarsi il più possibile da te lungo il percorso più sicuro. +1d6 per ogni slot oltre il 1°.' },
    { id: 'fuoco-fatuo', name: 'Fuoco Fatuo', level: 1, school: 'Evocazione',
      classes: ['bardo', 'druido', 'chierico'],
      meta: 'Azione · 18 m · 1 min CONC · V',
      desc: 'Gli oggetti in un cubo di 6 m entro gittata si delineano di luce blu, verde o violetta; le creature nel cubo si delineano se falliscono un TS Destrezza. Finché dura, oggetti e creature delineati emettono luce fioca in 3 m e non beneficiano dell\'Invisibilità; chi li attacca ha vantaggio se li vede.' },
    { id: 'piuma-cadente', name: 'Piuma Cadente', level: 1, school: 'Trasmutazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Reazione (a una caduta tua o di una creatura vista entro 18 m) · 18 m · 1 min · V, M (una piccola piuma o un batuffolo di piumino)',
      desc: 'Fino a cinque creature che cadono rallentano a 18 m per round finché dura; chi atterra prima non subisce danno da caduta e l\'incantesimo termina per lei.' },
    { id: 'parola-curativa', name: 'Parola Curativa', level: 1, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'druido'],
      meta: 'Azione bonus · 18 m · Istantaneo · V',
      desc: 'Una creatura vista entro gittata recupera 2d4 + il tuo modificatore da incantatore PF. +2d4 per ogni slot oltre il 1°.' },
    { id: 'identificare', name: 'Identificare', level: 1, school: 'Divinazione',
      classes: ['bardo', 'mago'],
      meta: '1 minuto o Rituale · Tocco · Istantaneo · V, S, M (una perla da 100+ MO)',
      desc: 'Tocchi un oggetto per tutta la durata del lancio: se è magico ne apprendi le proprietà, come si usa, se richiede Sintonia e quante cariche ha, oltre a eventuali incantesimi attivi su di esso. Su una creatura toccata, apprendi quali incantesimi la stanno influenzando.' },
    { id: 'immagine-silente', name: 'Immagine Silente', level: 1, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, S, M (un fiocco di lana)',
      desc: 'Crei l\'immagine puramente visiva (senza suono) di un oggetto, creatura o fenomeno fino a 4,5 m di lato, entro gittata. Puoi spostarla con un\'azione magica alterandone l\'aspetto in movimento; l\'interazione fisica o una prova di Investigare contro la tua CD la smaschera.' },
    { id: 'sonno', name: 'Sonno', level: 1, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un pizzico di sabbia o petali di rosa)',
      desc: 'Le creature scelte in una sfera di 1,5 m entro gittata fanno TS Saggezza o sono Incapaci di Agire fino alla fine del loro prossimo turno, quando ripetono il TS: se falliscono di nuovo sono Incoscienti finché dura. Termina per chi subisce danno o viene scosso. Chi non dorme mai o è immune a Sfinimento supera automaticamente.' },
    { id: 'onda-tonante', name: 'Onda Tonante', level: 1, school: 'Evocazione',
      classes: ['bardo', 'druido', 'stregone', 'mago'],
      meta: 'Azione · Sé (cubo 4,5 m) · Istantaneo · V, S',
      desc: 'Le creature nel cubo fanno TS Costituzione, subendo 2d8 tuono e venendo spinte di 3 m (metà danno e niente spinta se superano); oggetti non fissati nel cubo vengono spinti allo stesso modo, e il boato è udibile a 90 m. +1d8 per ogni slot oltre il 1°.' },

    { id: 'cecita-sordita', name: 'Cecità/Sordità', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'chierico', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 min · V',
      desc: 'Il bersaglio fa TS Costituzione o è Accecato o Assordato (a tua scelta) finché dura, ripetendo il TS a fine di ogni suo turno per liberarsi. +1 bersaglio per ogni slot oltre il 2°.' },
    { id: 'placare-le-emozioni', name: 'Placare le Emozioni', level: 2, school: 'Incantamento',
      classes: ['bardo', 'chierico'],
      meta: 'Azione · 18 m · 1 min CONC · V, S',
      desc: 'Gli Umanoidi in una sfera di 6 m entro gittata fanno TS Carisma o subiscono uno tra due effetti a scelta: immunità ad Affascinato e Spaventato (sopprimendo condizioni già attive), oppure Indifferenza verso creature ostili a scelta (termina se subiscono danno o vedono un alleato colpito).' },
    { id: 'individuazione-dei-pensieri', name: 'Individuazione dei Pensieri', level: 2, school: 'Divinazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S, M (una moneta di rame)',
      desc: 'Attivi uno tra due effetti (azione magica per cambiarlo nei turni successivi): Percepire Pensieri, senti la presenza di menti pensanti entro 9 m; Leggere Pensieri, bersagli una creatura percepita e apprendi cosa ha in mente in quel momento (nulla se non conosce linguaggi né è telepatica). Bloccato da 30 cm di pietra/terra/legno, 2,5 cm di metallo o un sottile foglio di piombo.' },
    { id: 'crescere-rimpicciolire', name: 'Crescere/Rimpicciolire', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'stregone', 'mago'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M (un pizzico di ferro in polvere)',
      desc: 'Ingrandisci o rimpicciolisci una creatura o un oggetto visto entro gittata (un bersaglio non volontario può tentare un TS Costituzione per annullare l\'effetto). Ingrandire: taglia +1 categoria, vantaggio alle prove/TS di Forza, +1d4 danno con le armi. Rimpicciolire: taglia −1 categoria, svantaggio alle prove/TS di Forza, −1d4 danno (minimo 1).' },
    { id: 'arroventare-metallo', name: 'Arroventare Metallo', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'druido'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un pezzo di ferro e una fiamma)',
      desc: 'Un oggetto metallico manufatto entro gittata diventa incandescente: chi lo tocca subisce 2d8 fuoco e deve superare un TS Costituzione o lasciarlo cadere (se può). Azione bonus nei turni successivi per infliggere di nuovo il danno; chi lo indossa o impugna ha svantaggio ad attacchi e prove finché resta a contatto. +1d8 per ogni slot oltre il 2°.' },
    { id: 'scassinare', name: 'Scassinare', level: 2, school: 'Trasmutazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Un oggetto chiuso da una serratura mondana o bloccato/sbarrato entro gittata si sblocca (una sola serratura, se multiple). Se è chiuso da Serratura Arcana, quell\'incantesimo è soppresso per 10 minuti. Il lancio produce un forte "toc" udibile fino a 90 m.' },
    { id: 'bocca-magica', name: 'Bocca Magica', level: 2, school: 'Illusione',
      classes: ['bardo', 'mago'],
      meta: '1 minuto o Rituale · 9 m · Finché non dissolto · V, S, M (polvere di giada, 10+ MO, consumata)',
      desc: 'Impianti in un oggetto un messaggio di massimo 25 parole che viene pronunciato quando si verifica un innesco a tua scelta (visivo o udibile entro 9 m dall\'oggetto): una bocca magica appare e recita il messaggio con la tua voce. Puoi farla sparire dopo un solo utilizzo o farla ripetere ogni volta che l\'innesco si attiva.' },
    { id: 'forza-fantasmatica', name: 'Forza Fantasmatica', level: 2, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (un fiocco di lana)',
      desc: 'Il bersaglio fa TS Intelligenza o percepisce (da solo) un fenomeno illusorio fino a 3 m di lato con suoni e temperatura, che tratta come reale finché dura; può infliggere fino a 2d8 psichici per turno se rappresenta un pericolo. Una prova di Investigare contro la tua CD (azione di Studio) smaschera l\'illusione e termina l\'incantesimo.' },
    { id: 'vedere-l-invisibile', name: 'Vedere l\'Invisibile', level: 2, school: 'Divinazione',
      classes: ['bardo', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · Sé · 1 ora · V, S, M (un pizzico di talco)',
      desc: 'Per la durata vedi le creature e gli oggetti Invisibili come se fossero visibili, e puoi vedere nel Piano Etereo (le cose lì appaiono spettrali).' },
    { id: 'frantumare', name: 'Frantumare', level: 2, school: 'Evocazione',
      classes: ['bardo', 'stregone', 'mago', 'druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S, M (una scheggia di mica)',
      desc: 'Un rumore fragoroso erompe in una sfera di 3 m entro gittata: le creature fanno TS Costituzione, subendo 3d8 tuono (metà se superano); i Costrutti hanno svantaggio al TS. Colpisce anche oggetti non magici non indossati o trasportati nell\'area. +1d8 per ogni slot oltre il 2°.' },

    { id: 'gettare-maledizione', name: 'Gettare Maledizione', level: 3, school: 'Negromanzia',
      classes: ['bardo', 'chierico', 'mago'],
      meta: 'Azione · Tocco · 1 min CONC · V, S',
      desc: 'La creatura toccata fa TS Saggezza o è maledetta finché dura, subendo uno tra due effetti a scelta: svantaggio alle prove e ai TS con una caratteristica scelta, oppure svantaggio ai suoi attacchi contro di te.' },
    { id: 'chiaroveggenza', name: 'Chiaroveggenza', level: 3, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'stregone', 'mago'],
      meta: '10 minuti · 1,6 km · 10 min CONC · V, S, M (un focus da 100+ MO: un corno ingioiellato per udire o un occhio di vetro per vedere)',
      desc: 'Crei un sensore invisibile in un luogo familiare entro gittata: puoi vedere o sentire (a scelta al lancio) attraverso di esso come se fossi lì, cambiando senso con un\'azione bonus.' },
    { id: 'simulare-la-morte', name: 'Simulare la Morte', level: 3, school: 'Negromanzia',
      classes: ['bardo', 'chierico', 'druido', 'mago'],
      meta: 'Azione o Rituale · Tocco · 1 ora · V, S, M (un pizzico di terra da cimitero)',
      desc: 'La creatura volontaria toccata entra in uno stato catalettico indistinguibile dalla morte: è Accecata e Incapace di Agire con velocità 0, ha resistenza a tutti i danni tranne quello psichico e immunità ad Avvelenato, finché dura.' },
    { id: 'glifo-di-custodia', name: 'Glifo di Custodia', level: 3, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'mago'],
      meta: '1 ora · Tocco · Finché non dissolto o innescato · V, S, M (polvere di diamante, 200+ MO, consumata)',
      desc: 'Incidi un glifo su una superficie o dentro un contenitore chiudibile, che scatena un effetto magico (un incantesimo di livello pari o inferiore alla metà del tuo, oppure un\'esplosione elementale) quando un innesco a tua scelta si verifica.' },
    { id: 'capanna-di-leomund', name: 'Capanna di Leomund', level: 3, school: 'Evocazione',
      classes: ['bardo', 'mago'],
      meta: '1 minuto o Rituale · Sé · 8 ore · V, S, M (una perlina di cristallo)',
      desc: 'Un\'emanazione di 3 m appare intorno a te e resta immobile finché dura; creature e oggetti già dentro possono muoversi liberamente, tutti gli altri ne sono esclusi. Gli incantesimi di livello 3 o inferiore non possono attraversarla. L\'interno è confortevole e asciutto; puoi comandarne la luce (fioca o oscurità). Termina se la lasci o la lanci di nuovo.' },
    { id: 'parola-curativa-di-massa', name: 'Parola Curativa di Massa', level: 3, school: 'Abiurazione',
      classes: ['bardo', 'chierico'],
      meta: 'Azione bonus · 18 m · Istantaneo · V',
      desc: 'Fino a sei creature scelte entro gittata recuperano 2d4 + il tuo modificatore da incantatore PF. +1d4 per ogni slot oltre il 3°.' },
    { id: 'rivivificare', name: 'Rivivificare', level: 3, school: 'Necromanzia',
      classes: ['chierico', 'druido', 'paladino', 'ranger'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (un diamante da 300+ MO, consumato)',
      desc: 'Tocchi una creatura morta da non più di 1 minuto: torna in vita con 1 PF. Non funziona su chi è morto di vecchiaia né ripristina parti del corpo mancanti.' },
    { id: 'inviare', name: 'Inviare', level: 3, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'mago'],
      meta: 'Azione · Illimitata · Istantaneo · V, S, M (un filo di rame)',
      desc: 'Invii un messaggio di massimo 25 parole a una creatura che conosci o che ti è stata descritta da chi la conosce, ovunque si trovi (anche su un altro piano, con il 5% di probabilità che non arrivi): il bersaglio lo sente nella mente e può rispondere subito allo stesso modo. Chi lo riceve può bloccarti per 8 ore.' },
    { id: 'rallentare', name: 'Rallentare', level: 3, school: 'Trasmutazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (una goccia di melassa)',
      desc: 'Fino a sei creature scelte in un cubo di 12 m fanno TS Saggezza o sono rallentate finché dura: velocità dimezzata, −2 a CA e TS Destrezza, niente reazioni, solo un\'azione o un\'azione bonus per turno (non entrambe) e un solo attacco se attaccano; 25% di probabilità che un incantesimo con componente Somatica fallisca. Ripetono il TS a fine turno per liberarsi.' },
    { id: 'parlare-con-i-morti', name: 'Parlare con i Morti', level: 3, school: 'Negromanzia',
      classes: ['bardo', 'chierico', 'mago'],
      meta: 'Azione · 3 m · 10 minuti · V, S, M (incenso in combustione)',
      desc: 'Doni un simulacro di vita a un cadavere entro gittata, che può rispondere alle tue domande (deve avere una bocca; fallisce se era Non Morto in vita, o se già bersaglio di questo incantesimo negli ultimi 10 giorni).' },
    { id: 'nube-fetida', name: 'Nube Fetida', level: 3, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M (un uovo marcio)',
      desc: 'Una sfera di 6 m di raggio di gas nauseante e Fortemente Oscurante appare entro gittata, finché dura o finché un vento forte non la disperde. Chi inizia il turno nell\'area fa TS Costituzione o è Avvelenato fino alla fine del turno corrente (non può compiere azioni né azioni bonus mentre lo è).' },

    /* ===== Bardo — 4°-9° livello (blocco 2, completa la classe) ===== */
    { id: 'costrizione', name: 'Costrizione', level: 4, school: 'Incantamento',
      classes: ['bardo'],
      meta: 'Azione · 9 m · 1 min CONC · V, S',
      desc: 'Le creature scelte entro gittata fanno TS Saggezza o sono Affascinate finché dura.' },
    { id: 'confusione', name: 'Confusione', level: 4, school: 'Incantamento',
      classes: ['bardo', 'druido', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M (tre gusci di noce)',
      desc: 'Le creature in una sfera di 3 m entro gittata fanno TS Saggezza o, finché dura, non possono usare azioni bonus né reazioni e tirano 1d10 a ogni turno per determinare il proprio comportamento (muoversi a caso, restare ferme, attaccare la creatura più vicina, o agire normalmente).' },
    { id: 'fonte-di-luce-lunare', name: 'Fonte di Luce Lunare', level: 4, school: 'Evocazione',
      classes: ['bardo', 'druido'],
      meta: 'Azione · Sé · 10 min CONC · V, S',
      desc: 'Una luce fredda ti avvolge, emanando luce intensa in 6 m e fioca per altri 6 m. Finché dura hai resistenza ai danni radiosi e i tuoi attacchi in mischia infliggono +2d6 radiosi; con una reazione dopo aver subito danno da una creatura vista entro 18 m, puoi forzarla a un TS Costituzione o essere Accecata fino alla fine del tuo prossimo turno.' },
    { id: 'invisibilita-superiore', name: 'Invisibilità Superiore', level: 4, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 min CONC · V, S',
      desc: 'La creatura toccata è Invisibile finché dura, anche continuando ad attaccare o lanciare incantesimi (a differenza dell\'Invisibilità normale).' },
    { id: 'uccisore-fantasmatico', name: 'Uccisore Fantasmatico', level: 4, school: 'Illusione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S',
      desc: 'Attingi agli incubi di un bersaglio, creando un\'illusione delle sue paure più profonde visibile solo a lui: fa TS Saggezza, subendo 4d10 psichici e avendo svantaggio a prove e attacchi finché dura (metà danno e incantesimo terminato se supera). Ripete il TS a fine di ogni suo turno, subendo di nuovo il danno se fallisce o terminando l\'incantesimo se supera. +1d10 per ogni slot oltre il 4°.' },
    { id: 'mutare-forma', name: 'Mutare Forma', level: 4, school: 'Trasmutazione',
      classes: ['bardo', 'druido', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 1 ora CONC · V, S, M (un bozzolo di bruco)',
      desc: 'Il bersaglio fa TS Saggezza o si trasforma in una Bestia a tua scelta (GS pari o inferiore al suo) finché dura, mantenendo allineamento, personalità, tipo di creatura, PF e Dadi Vita ma sostituendo le altre statistiche; ottiene PF temporanei pari ai PF della forma bestiale e non può parlare né lanciare incantesimi. Il suo equipaggiamento si fonde con la nuova forma.' },

    { id: 'animare-oggetti', name: 'Animare Oggetti', level: 5, school: 'Trasmutazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S',
      desc: 'Fino a un numero di oggetti non magici non indossati/trasportati pari al tuo modificatore da incantatore (un Grande ne vale due, un Enorme tre) prendono vita e combattono al tuo comando, restando entro 150 m; se non ricevono ordini si limitano a Schivare. Le statistiche dell\'oggetto animato dipendono dalla sua taglia. Tornano oggetti inerti a 0 PF. +1 dado di danno da Colpo per ogni slot oltre il 5°.' },
    { id: 'risvegliare', name: 'Risvegliare', level: 5, school: 'Trasmutazione',
      classes: ['bardo', 'druido'],
      meta: '8 ore · Tocco · Istantaneo · V, S, M (un\'agata da 1.000+ MO, consumata)',
      desc: 'Doni Intelligenza 10 e la capacità di parlare una lingua che conosci a una Bestia, Pianta o pianta naturale toccata (Int 3 o meno); una pianta naturale diventa una creatura Pianta capace di muoversi. Il bersaglio risvegliato è Affascinato per 30 giorni o finché tu/alleati gli infliggete danno.' },
    { id: 'dominare-persona', name: 'Dominare Persona', level: 5, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · 18 m · 1 min CONC · V, S',
      desc: 'Un Umanoide fa TS Saggezza (con vantaggio se in combattimento con te) o è Affascinato per la durata; ripete il TS quando subisce danno. Hai un legame telepatico per impartirgli comandi (nessuna azione richiesta); se non ne riceve, agisce proteggendosi. Con slot di 6° dura 10 minuti, 7° un\'ora, 8°+ otto ore.' },
    { id: 'sapienza-leggendaria', name: 'Sapienza Leggendaria', level: 5, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'mago'],
      meta: '10 minuti · Sé · Istantaneo · V, S, M (incenso da 250+ MO, consumato, e quattro strisce d\'avorio da 50+ MO ciascuna)',
      desc: 'Nomina o descrivi una persona, un luogo o un oggetto famoso: apprendi un breve riassunto di ciò che ne sa il Master, tanto più preciso quanto più ne sai già. Se il soggetto non è realmente famoso, l\'incantesimo fallisce.' },
    { id: 'cura-ferite-di-massa', name: 'Cura Ferite di Massa', level: 5, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Un\'onda di energia curativa si propaga da un punto entro gittata: fino a sei creature scelte in una sfera di 9 m recuperano 5d8 + il tuo modificatore da incantatore PF. +1d8 per ogni slot oltre il 5°.' },
    { id: 'modificare-memoria', name: 'Modificare Memoria', level: 5, school: 'Incantamento',
      classes: ['bardo', 'mago', 'chierico'],
      meta: 'Azione · 9 m · 1 min CONC · V, S',
      desc: 'Il bersaglio fa TS Saggezza (con vantaggio se lo stai combattendo) o è Affascinato e Incapace di Agire, ignaro di ciò che lo circonda ma capace di sentire, finché dura; se subisce danno o è bersaglio di un altro incantesimo, la magia termina senza effetto. Mentre dura puoi alterare (eliminare, ripristinare o modificare) il suo ricordo di un evento vissuto nelle ultime 24 ore, durato al massimo 10 minuti, descrivendogli a voce il nuovo ricordo. Ristorare Superiore o Rimuovere Maledizione ripristinano la memoria vera. Con slot di 6° puoi risalire fino a 7 giorni fa, 7° trenta giorni, 8° trecentosessantacinque giorni, 9° qualsiasi momento del passato.' },
    { id: 'far-rivivere', name: 'Far Rivivere', level: 5, school: 'Negromanzia',
      classes: ['bardo', 'chierico', 'paladino'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (un diamante da 500+ MO, consumato)',
      desc: 'Riporti in vita, con un tocco, una creatura morta da non più di 10 giorni e non uccisa in età avanzata, curando ogni ferita mortale (ma non parti del corpo mancanti; fallisce se ne mancano di essenziali) e neutralizzando i veleni presenti al momento della morte. Il bersaglio torna con 1 PF ma con −4 ai D20 Test, riducibile di 1 a ogni riposo lungo.' },
    { id: 'legame-telepatico-di-rary', name: 'Legame Telepatico di Rary', level: 5, school: 'Divinazione',
      classes: ['bardo', 'mago'],
      meta: 'Azione o Rituale · 9 m · 1 ora · V, S, M (due uova)',
      desc: 'Fino a otto creature volontarie entro gittata sono collegate telepaticamente tra loro finché dura, potendo comunicare a qualsiasi distanza sullo stesso piano anche senza condividere una lingua (le creature incapaci di comunicare in alcuna lingua non sono interessate).' },
    { id: 'parvenza', name: 'Parvenza', level: 5, school: 'Illusione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 9 m · 8 ore · V, S',
      desc: 'Doni un aspetto illusorio alle creature scelte entro gittata (un bersaglio non volontario può tentare un TS Carisma per non essere affetto): puoi renderle più alte o basse di 30 cm, più pesanti o leggere, cambiandone corpo ed equipaggiamento (stessa disposizione base degli arti). Non regge all\'ispezione fisica; una prova di Investigare contro la tua CD (azione di Studio) smaschera il travestimento.' },
    { id: 'presenza-regale-di-yolande', name: 'Presenza Regale di Yolande', level: 5, school: 'Incantamento',
      classes: ['bardo', 'mago'],
      meta: 'Azione · Sé (emanazione 3 m) · 1 min CONC · V, S, M (una tiara in miniatura)',
      desc: 'Ti circondi di maestà ultraterrena nell\'emanazione. Le creature che vi entrano o vi terminano il turno fanno TS Saggezza o subiscono 4d6 psichici e cadono Prone, potendo essere spinte fino a 3 m (metà danno e niente altro effetto se superano, una volta a turno).' },

    { id: 'trovare-la-via', name: 'Trovare la Via', level: 6, school: 'Divinazione',
      classes: ['bardo', 'chierico', 'druido'],
      meta: '1 minuto · Sé · 1 giorno CONC · V, S, M (strumenti divinatori da 100+ MO, come carte o rune)',
      desc: 'Percepisci il percorso più diretto verso una destinazione familiare sullo stesso piano (fallisce per destinazioni mobili o generiche): finché dura sai sempre a che distanza e in che direzione si trova, e quale via prendere a ogni bivio.' },
    { id: 'guardie-e-sigilli', name: 'Guardie e Sigilli', level: 6, school: 'Abiurazione',
      classes: ['bardo', 'mago'],
      meta: '1 ora · Tocco · 24 ore · V, S, M (una verga d\'argento da 10+ MO)',
      desc: 'Proteggi fino a 230 m² di area (max 6 m di altezza) con più effetti insieme: nebbia nei corridoi (Fortemente Oscurati, rischio di disorientamento), porte sigillate come da Serratura Arcana (alcune camuffate come muro), ragnatele sulle scale, più un effetto magico aggiuntivo a scelta tra diversi incantesimi minori piazzati nell\'area. Dissolvi Magie non tocca l\'incantesimo nel suo insieme, ma può dissolvere i singoli effetti (l\'incantesimo termina se cadono tutti).' },
    { id: 'banchetto-degli-eroi', name: 'Banchetto degli Eroi', level: 6, school: 'Convocazione',
      classes: ['bardo', 'chierico', 'druido'],
      meta: '10 minuti · Sé · Istantaneo · V, S, M (una coppa ingemmata da 1.000+ MO, consumata)',
      desc: 'Convochi un banchetto per fino a dodici creature; consumarlo richiede 1 ora, dopo la quale chi vi ha preso parte ottiene per 24 ore: resistenza al veleno, immunità a Spaventato e Avvelenato, e +2d10 PF massimi (guadagnati anche come PF attuali).' },
    { id: 'suggestione-di-massa', name: 'Suggestione di Massa', level: 6, school: 'Incantamento',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 24 ore · V, M (la lingua di un serpente)',
      desc: 'Suggerisci (max 25 parole) un\'attività plausibile e non dannosa fino a dodici creature che ti capiscono entro gittata. Fanno TS Saggezza o sono Affascinate e la perseguono finché dura o finché tu/alleati infliggete loro danno; se la completano prima, l\'incantesimo termina su di esse.' },
    { id: 'danza-irresistibile-di-otto', name: 'Danza Irresistibile di Otto', level: 6, school: 'Incantamento',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 9 m · 1 min CONC · V',
      desc: 'Il bersaglio fa TS Saggezza. Se supera, balla comicamente fino alla fine del suo prossimo turno spendendo tutto il movimento per farlo. Se fallisce, è Affascinato finché dura: balla, spende tutto il movimento ballando, ha svantaggio ai TS Destrezza e agli attacchi mentre gli altri hanno vantaggio contro di lui; può usare un\'azione per riprendersi e ripetere il TS.' },
    { id: 'illusione-programmata', name: 'Illusione Programmata', level: 6, school: 'Illusione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 36 m · Finché non dissolta · V, S, M (polvere di giada, 25+ MO)',
      desc: 'Crei un\'illusione (fino a 9 m di lato, imprecettibile finché non attivata) che si mette in scena quando un innesco a tua scelta si verifica, con suoni e comportamento decisi al lancio, per una performance di massimo 5 minuti, poi resta dormiente per 10 minuti prima di potersi riattivare. L\'interazione fisica o una prova di Investigare contro la tua CD (azione di Studio) la smaschera.' },

    { id: 'miraggio-arcano', name: 'Miraggio Arcano', level: 7, school: 'Illusione',
      classes: ['bardo', 'druido', 'mago'],
      meta: '10 minuti · Vista · 10 giorni · V, S',
      desc: 'Un\'area fino a 1,6 km di lato appare, suona, odora e persino sembra al tatto come un altro tipo di terreno, incluse strutture aggiunte o alterate (non nasconde né aggiunge creature). Può trasformare terreno normale in Difficile o viceversa. La Vista Vera rivela il terreno reale, ma l\'illusione resta interagibile fisicamente.' },
    { id: 'magione-magnifica-di-mordenkainen', name: 'Magione Magnifica di Mordenkainen', level: 7, school: 'Convocazione',
      classes: ['bardo', 'mago'],
      meta: '1 minuto · 90 m · 24 ore · V, S, M (una porticina in miniatura da 15+ MO)',
      desc: 'Convochi una porta scintillante che conduce a una dimora extradimensionale arredata come preferisci (fino a 50 cubi di 3 m contigui), con cibo per un banchetto di nove portate per cento persone. Tu e chi designi potete entrare finché la porta resta aperta; puoi aprirla o chiuderla senza azione se sei entro 9 m.' },
    { id: 'spada-di-mordenkainen', name: 'Spada di Mordenkainen', level: 7, school: 'Evocazione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M (una spada in miniatura da 250+ MO)',
      desc: 'Crei una spada spettrale che fluttua entro gittata: alla comparsa fai un attacco con incantesimo in mischia contro un bersaglio entro 1,5 m da essa, infliggendo 4d12 + il tuo modificatore da incantatore forza se colpisci. Azione bonus nei turni successivi per spostarla fino a 9 m e ripetere l\'attacco.' },
    { id: 'parola-di-potere-fortificare', name: 'Parola di Potere: Fortificare', level: 7, school: 'Incantamento',
      classes: ['bardo', 'chierico'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Fortifichi fino a sei creature scelte entro gittata, distribuendo tra loro 120 PF temporanei a tua scelta.' },
    { id: 'spruzzo-prismatico', name: 'Spruzzo Prismatico', level: 7, school: 'Evocazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · Sé (cono 18 m) · Istantaneo · V, S',
      desc: 'Otto raggi di luce colorata scaturiscono da te nel cono: le creature fanno TS Destrezza, poi tiri 1d8 per ognuna per determinare quale colore la colpisce (rosso/arancio/giallo/verde/blu: 12d6 di un danno diverso, dimezzato se superano; indaco: Restrizione con TS Costituzione ripetuto, Pietrificazione dopo tre fallimenti; violetto: effetto speciale). Un\'ottava possibilità (8 su 8) non colpisce affatto.' },
    { id: 'proiettare-immagine', name: 'Proiettare Immagine', level: 7, school: 'Illusione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 800 km · 1 giorno CONC · V, S, M (una tua statuetta da 5+ MO)',
      desc: 'Crei una copia illusoria di te stesso, intangibile, in un luogo che hai già visto entro gittata; puoi vedere e sentire attraverso di essa e, con un\'azione magica, muoverla fino a 18 m facendola parlare e gesticolare come vuoi. Termina se subisce danno. L\'interazione fisica o una prova di Investigare contro la tua CD (azione di Studio) la smaschera.' },
    { id: 'rigenerare', name: 'Rigenerare', level: 7, school: 'Trasmutazione',
      classes: ['bardo', 'chierico', 'druido'],
      meta: '1 minuto · Tocco · 1 ora · V, S, M (una ruota di preghiera)',
      desc: 'La creatura toccata recupera subito 4d8+15 PF; finché dura recupera anche 1 PF a inizio di ogni suo turno, e gli arti recisi ricrescono in 2 minuti.' },
    { id: 'resurrezione', name: 'Resurrezione', level: 7, school: 'Negromanzia',
      classes: ['bardo', 'chierico'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (un diamante da 1.000+ MO, consumato)',
      desc: 'Riporti in vita, con un tocco, una creatura morta da non più di un secolo, non morta di vecchiaia né Non Morta: torna con tutti i PF, veleni neutralizzati, ferite chiuse e parti mancanti ristabilite. Il bersaglio ha −4 ai D20 Test, riducibile di 1 a ogni riposo lungo. Se la morte risale a 365+ giorni fa, tu non puoi lanciare incantesimi fino al prossimo riposo lungo e hai svantaggio ai D20 Test.' },
    { id: 'simbolo', name: 'Simbolo', level: 7, school: 'Abiurazione',
      classes: ['bardo', 'chierico', 'druido', 'mago'],
      meta: '1 minuto · Tocco · Finché non dissolto o innescato · V, S, M (polvere di diamante, 1.000+ MO, consumata)',
      desc: 'Incidi un glifo dannoso (fino a 3 m di diametro, quasi impercettibile) che si attiva con un innesco a tua scelta, colpendo le creature nella sfera di 18 m che si illumina alla comparsa con uno tra sei effetti scelti: Morte (10d10 necrotici, TS Costituzione), Discordia (litigano per 1 minuto, svantaggio ad attacchi e prove), Paura (Spaventate per 1 minuto), oppure Dolore, Sonno o Stordimento (altri effetti debilitanti). Ogni creatura è bersagliata una sola volta a turno.' },
    { id: 'teletrasporto', name: 'Teletrasporto', level: 7, school: 'Convocazione',
      classes: ['bardo', 'stregone', 'mago'],
      meta: 'Azione · 3 m · Istantaneo · V',
      desc: 'Trasporti istantaneamente te stesso e fino a otto creature volontarie viste entro gittata (o un singolo oggetto Grande o più piccolo) verso una destinazione nota sullo stesso piano. Quanto conosci bene la destinazione determina il rischio di un contrattempo (deviazione, area simile, o danno), stabilito dal Master con un tiro percentuale.' },

    { id: 'antipatia-simpatia', name: 'Antipatia/Simpatia', level: 8, school: 'Incantamento',
      classes: ['bardo', 'druido', 'mago'],
      meta: '1 ora · 18 m · 10 giorni · V, S, M (aceto e miele mescolati)',
      desc: 'Scegli se l\'incantesimo crea antipatia o simpatia verso un bersaglio Enorme o più piccolo, e specifichi un tipo di creatura (es. draghi rossi, goblin). Una creatura di quel tipo entro 36 m dal bersaglio fa TS Saggezza: se fallisce, con Antipatia è Spaventata e deve allontanarsi il più possibile; con Simpatia è Affascinata e deve avvicinarsi il più possibile. L\'effetto termina con un nuovo TS superato se la creatura resta oltre 36 m a fine turno (poi è immune per 1 minuto).' },
    { id: 'mente-impenetrabile', name: 'Mente Impenetrabile', level: 8, school: 'Abiurazione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · Tocco · 24 ore · V, S',
      desc: 'La creatura volontaria toccata ottiene immunità ai danni psichici e ad Affascinato, ed è immune a qualsiasi tentativo di percepirne emozioni o allineamento, leggerne la mente, localizzarla magicamente o osservarla/controllarla a distanza — nemmeno con Desiderio.' },

    { id: 'parola-di-potere-curare', name: 'Parola di Potere: Curare', level: 9, school: 'Incantamento',
      classes: ['bardo', 'chierico'],
      meta: 'Azione · 18 m · Istantaneo · V',
      desc: 'Un\'onda di energia curativa investe una creatura vista entro gittata: recupera tutti i PF, e se ha Affascinato, Spaventato, Paralizzato, Avvelenato o Stordito, la condizione termina; se è Prona può alzarsi con la reazione.' },
    { id: 'muro-prismatico', name: 'Muro Prismatico', level: 9, school: 'Abiurazione',
      classes: ['bardo', 'mago'],
      meta: 'Azione · 18 m · 10 minuti · V, S',
      desc: 'Un muro (fino a 27 m di lunghezza, 9 m di altezza) o un globo (fino a 9 m di diametro) di sette strati di luce colorata e opaca appare entro gittata, emanando luce intensa in 30 m e fioca per altri 30 m. Chi lo vede e si avvicina entro 6 m fa TS Costituzione o è Accecato per 1 minuto. Attraversarlo significa superare ogni strato in sequenza, ciascuno con un TS Destrezza e un effetto diverso (danno, condizioni, o blocco); ogni strato va distrutto singolarmente e in ordine per aprire un varco.' },

    /* ===== Chierico — incantesimi propri (non condivisi) ===== */
    { id: 'guida', name: 'Guida', level: 0, school: 'Divinazione',
      classes: ['chierico', 'druido'],
      meta: 'Azione · Tocco · 1 min CONC · V, S',
      desc: 'La creatura volontaria toccata aggiunge 1d4 a una prova di abilità a tua scelta finché dura.' },
    { id: 'resistere', name: 'Resistere', level: 0, school: 'Abiurazione',
      classes: ['chierico', 'druido'],
      meta: 'Azione · Tocco · 1 min CONC · V, S',
      desc: 'La creatura volontaria toccata sceglie un tipo di danno: la prima volta che lo subisce prima della fine dell\'incantesimo, riduce il danno totale di 1d4 (una sola volta per turno).' },
    { id: 'fiamma-sacra', name: 'Fiamma Sacra', level: 0, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Una radianza fiammeggiante scende sul bersaglio, che fa TS Destrezza (senza beneficio da Copertura Parziale o Tre Quarti) o subisce 1d8 radiosi. Il danno sale a 2d8 al livello 5, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'risparmiare-il-morente', name: 'Risparmiare il Morente', level: 0, school: 'Negromanzia',
      classes: ['chierico', 'druido'],
      meta: 'Azione · 4,5 m · Istantaneo · V, S',
      desc: 'Una creatura a 0 PF non ancora morta entro gittata diventa Stabile. La gittata raddoppia ai livelli 5 (9 m), 11 (18 m) e 17 (36 m).' },
    { id: 'taumaturgia', name: 'Taumaturgia', level: 0, school: 'Trasmutazione',
      classes: ['chierico'],
      meta: 'Azione · 9 m · fino a 1 min · V',
      desc: 'Manifesti un piccolo prodigio a scelta tra vari effetti minori (occhi alterati, voce tonante con vantaggio a Intimidire, fiamme che cambiano, una porta/finestra che si apre o chiude di scatto, un suono a distanza, tremori innocui). Puoi mantenerne fino a tre da 1 minuto attivi insieme.' },
    { id: 'parola-di-radiosita', name: 'Parola di Radiosità', level: 0, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione · Sé (emanazione 1,5 m) · Istantaneo · V, M (un gettone a forma di sole)',
      desc: 'Radiosità ardente erompe nell\'emanazione: le creature scelte fanno TS Costituzione o subiscono 1d6 radiosi. Il danno sale a 2d6 al livello 5, 3d6 all\'11°, 4d6 al 17°.' },

    { id: 'creare-o-distruggere-acqua', name: 'Creare o Distruggere Acqua', level: 1, school: 'Trasmutazione',
      classes: ['chierico', 'druido'],
      meta: 'Azione · 9 m · Istantaneo · V, S, M (un misto di acqua e sabbia)',
      desc: 'Crei fino a 40 litri d\'acqua pulita in un contenitore aperto (o come pioggia in un cubo di 9 m, spegnendo fiamme scoperte), oppure ne distruggi altrettanti o disperdi nebbia in un cubo di 9 m. +40 litri (o +1,5 m al cubo) per ogni slot oltre il 1°.' },
    { id: 'infliggere-ferite', name: 'Infliggere Ferite', level: 1, school: 'Negromanzia',
      classes: ['chierico'],
      meta: 'Azione · Tocco · Istantaneo · V, S',
      desc: 'La creatura toccata fa TS Costituzione, subendo 2d10 necrotici (metà se supera). +1d10 per ogni slot oltre il 1°.' },
    { id: 'santuario', name: 'Santuario', level: 1, school: 'Abiurazione',
      classes: ['chierico'],
      meta: 'Azione bonus · 9 m · 1 min · V, S, M (una scheggia di specchio)',
      desc: 'Proteggi una creatura entro gittata: finché dura, chi la bersaglia con un attacco o un incantesimo dannoso fa TS Saggezza o deve scegliere un altro bersaglio (o perdere l\'azione/incantesimo). Non protegge da aree d\'effetto. Termina se il bersaglio attacca, lancia un incantesimo o infligge danno.' },

    { id: 'presagio', name: 'Presagio', level: 2, school: 'Divinazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: '1 minuto o Rituale · Sé · Istantaneo · V, S, M (bastoncini, ossa, carte o altri strumenti divinatori, 25+ MO)',
      desc: 'Ricevi un presagio da un\'entità ultraterrena sull\'esito di un\'azione che intendi compiere entro 30 minuti: fausto, infausto, misto, o indifferente. Se lanci l\'incantesimo più volte prima di un riposo lungo, ogni lancio successivo al primo ha il 25% cumulativo di probabilità di non dare risposta.' },
    { id: 'fiamma-perpetua', name: 'Fiamma Perpetua', level: 2, school: 'Evocazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: 'Azione · Tocco · Finché non dissolta · V, S, M (polvere di rubino da 50+ MO, consumata)',
      desc: 'Una fiamma scaturisce da un oggetto toccato, emanando luce intensa in 6 m e fioca per altri 6 m: non genera calore né consuma combustibile e non può essere soffocata, solo coperta o nascosta.' },
    { id: 'arma-spirituale', name: 'Arma Spirituale', level: 2, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione bonus · 18 m · 1 min CONC · V, S',
      desc: 'Crei un\'arma spettrale fluttuante di forma a tua scelta: alla comparsa (e poi con un\'azione bonus nei turni successivi, spostandola fino a 6 m) attacco con incantesimo in mischia contro una creatura entro 1,5 m da essa, infliggendo 1d8 + il tuo modificatore da incantatore forza se colpisci. +1d8 per ogni slot oltre il 2°.' },
    { id: 'vincolo-di-protezione', name: 'Vincolo di Protezione', level: 2, school: 'Abiurazione',
      classes: ['chierico', 'paladino'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (due anelli di platino da 50+ MO ciascuno, indossati per la durata)',
      desc: 'Crei un legame mistico con una creatura volontaria toccata: finché resta entro 18 m ha +1 a CA e TS e resistenza a tutti i danni, ma ogni volta che subisce danno, tu subisci lo stesso ammontare. Termina se scendi a 0 PF, vi separate oltre 18 m, o viene lanciato di nuovo su uno dei due.' },

    { id: 'animare-i-morti', name: 'Animare i Morti', level: 3, school: 'Negromanzia',
      classes: ['chierico', 'mago'],
      meta: '1 minuto · 3 m · Istantaneo · V, S, M (una goccia di sangue, un pezzo di carne e polvere d\'ossa)',
      desc: 'Un cumulo di ossa o un cadavere Umanoide Medio o Piccolo entro gittata diventa Non Morto sotto il tuo controllo (Scheletro dalle ossa, Zombie dal cadavere), comandabile con un\'azione bonus entro 18 m. Resta sotto controllo per 24 ore, rinnovabili rilanciando l\'incantesimo. +2 creature controllate per ogni slot oltre il 3°.' },
    { id: 'guardiani-spirituali', name: 'Guardiani Spirituali', level: 3, school: 'Convocazione',
      classes: ['chierico'],
      meta: 'Azione · Sé (emanazione 4,5 m) · 10 min CONC · V, S, M (una pergamena di preghiera)',
      desc: 'Spiriti protettivi ti volteggiano attorno (angelici o fatati se buono/neutrale, infernali se malvagio). La velocità delle altre creature nell\'emanazione è dimezzata; chi vi entra o vi termina il turno fa TS Saggezza o subisce 3d8 radiosi (o necrotici, se sei malvagio), metà se supera, una volta a turno. Puoi escludere creature scelte alla comparsa. +1d8 per ogni slot oltre il 3°.' },
    { id: 'manto-del-crociato', name: 'Manto del Crociato', level: 3, school: 'Evocazione',
      classes: ['paladino', 'chierico'],
      meta: 'Azione · Sé (emanazione 9 m) · 1 min CONC · V',
      desc: 'Irradi un\'aura magica: finché dura, tu e i tuoi alleati nell\'emanazione infliggete 1d4 danni Radiosi extra quando colpite con un\'arma o un Colpo Senz\'Armi.' },
    { id: 'controllare-acqua', name: 'Controllare Acqua', level: 4, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: 'Azione · 90 m · 10 min CONC · V, S, M (un misto di acqua e polvere)',
      desc: 'Controlli l\'acqua in un cubo fino a 30 m di lato entro gittata, scegliendo un effetto (azione magica per ripeterlo o cambiarlo nei turni successivi): Alluvione (il livello sale fino a 6 m, o crea un\'onda che travolge veicoli), Dividere le Acque (apri una trincea larga con pareti d\'acqua ai lati), o Reindirizzare (fai scorrere l\'acqua nella direzione che scegli, anche controcorrente).' },
    { id: 'protezione-dalla-morte', name: 'Protezione dalla Morte', level: 4, school: 'Abiurazione',
      classes: ['chierico', 'paladino'],
      meta: 'Azione · Tocco · 8 ore · V, S',
      desc: 'La prima volta che la creatura toccata scenderebbe a 0 PF prima della fine dell\'incantesimo, resta invece a 1 PF e l\'incantesimo termina; nega anche un effetto che la ucciderebbe all\'istante senza infliggere danno.' },
    { id: 'divinazione', name: 'Divinazione', level: 4, school: 'Divinazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: 'Azione o Rituale · Sé · Istantaneo · V, S, M (incenso da 25+ MO, consumato)',
      desc: 'Ti metti in contatto con una divinità o i suoi servitori: poni una domanda su un obiettivo, evento o attività entro 7 giorni, ottenendo una risposta veritiera (spesso criptica). Se lanci l\'incantesimo più volte prima di un riposo lungo, ogni lancio successivo al primo ha il 25% cumulativo di probabilità di non dare risposta.' },
    { id: 'plasmare-pietra', name: 'Plasmare Pietra', level: 4, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: 'Azione · Tocco · Istantaneo · V, S, M (argilla morbida)',
      desc: 'Tocchi un oggetto di pietra Medio o più piccolo (o una sezione fino a 1,5 m) e lo plasmi nella forma che preferisci: un\'arma, una statua, un passaggio in un muro spesso 1,5 m, o una porta di pietra sigillata (fino a due cerniere e un chiavistello, senza dettagli meccanici fini).' },

    { id: 'comunione', name: 'Comunione', level: 5, school: 'Divinazione',
      classes: ['chierico'],
      meta: '1 minuto o Rituale · Sé · 1 minuto · V, S, M (incenso)',
      desc: 'Contatti la tua divinità o un suo tramite e poni fino a tre domande a cui si risponde con sì o no, ricevendo una risposta corretta (o "non chiaro" se va oltre la conoscenza divina). Se lanci l\'incantesimo più volte prima di un riposo lungo, ogni lancio successivo al primo ha il 25% cumulativo di probabilità di non dare risposta.' },
    { id: 'contagio', name: 'Contagio', level: 5, school: 'Negromanzia',
      classes: ['chierico', 'druido'],
      meta: 'Azione · Tocco · 7 giorni · V, S',
      desc: 'Il tuo tocco infligge un contagio magico: il bersaglio fa TS Costituzione o subisce 11d8 necrotici ed è Avvelenato, con svantaggio ai TS con una caratteristica scelta finché dura. Ripete il TS a fine di ogni suo turno: 3 successi terminano l\'incantesimo, 3 fallimenti lo fissano per 7 giorni interi.' },
    { id: 'colonna-di-fiamma', name: 'Colonna di Fiamma', level: 5, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione · 18 m · Istantaneo · V, S, M (un pizzico di zolfo)',
      desc: 'Una colonna verticale di fuoco brillante si abbatte in un Cilindro di 3 m di raggio e 12 m di altezza: le creature fanno TS Destrezza, subendo 5d6 fuoco + 5d6 radiosi (metà se superano). +1d6 a entrambi i danni per ogni slot oltre il 5°.' },
    { id: 'consacrare', name: 'Consacrare', level: 5, school: 'Abiurazione',
      classes: ['chierico'],
      meta: '24 ore · Tocco · Finché non dissolto · V, S, M (incenso da 1.000+ MO, consumato)',
      desc: 'Consacri un\'area fino a 18 m di raggio con potere sacro o profano: scegli tipi di creature (Aberrazioni, Celestiali, Elementali, Folletti, Immondi o Non Morti) che non possono entrarvi volontariamente né mantenervi il controllo su chi vi si trova, e aggiungi un effetto extra a scelta (luce intensa permanente, oscurità permanente, protezione dal teletrasporto, terrore per certi tipi, o impossibilità di creare Non Morti dai cadaveri sepolti).' },
    { id: 'piaga-di-insetti', name: 'Piaga di Insetti', level: 5, school: 'Convocazione',
      classes: ['chierico', 'druido', 'stregone'],
      meta: 'Azione · 90 m · 10 min CONC · V, S, M (una locusta)',
      desc: 'Locuste sciamanti riempiono una sfera di 6 m di raggio (Terreno Difficile, Leggermente Oscurante): alla comparsa, e per chiunque vi entri o vi termini il turno, TS Costituzione per 4d10 perforanti (metà se supera, una volta a turno). +1d10 per ogni slot oltre il 5°.' },

    { id: 'barriera-di-lame', name: 'Barriera di Lame', level: 6, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione · 27 m · 10 min CONC · V, S',
      desc: 'Un muro di lame roteanti (fino a 30 m di lunghezza e 6 m di altezza, o ad anello fino a 18 m di diametro, 1,5 m di spessore) appare entro gittata, offrendo copertura tre quarti e rendendo il suo spazio Terreno Difficile. Chi vi si trova, entra o vi termina il turno fa TS Destrezza, subendo 6d10 forza (metà se supera, una volta a turno).' },
    { id: 'interdizione', name: 'Interdizione', level: 6, school: 'Abiurazione',
      classes: ['chierico'],
      meta: '10 minuti o Rituale · Tocco · 1 giorno · V, S, M (polvere di rubino da 1.000+ MO)',
      desc: 'Proteggi fino a 3.700 m² di superficie (altezza 9 m) da viaggi magici: nessuno può teletrasportarsi o usare portali per entrarvi, ed è bloccato l\'accesso da altri piani (Astrale, Etereo, Feywild, Ombra). Puoi anche far infliggere 5d10 radiosi o necrotici (a scelta) a tipi di creature scelti (Aberrazioni, Celestiali, Elementali, Folletti, Immondi, Non Morti) che vi entrano o vi terminano il turno.' },
    { id: 'ferire', name: 'Ferire', level: 6, school: 'Negromanzia',
      classes: ['chierico'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Scateni magia virulenta su un bersaglio: fa TS Costituzione, subendo 14d6 necrotici e riducendo i suoi PF massimi di un pari ammontare (metà danno e nessuna riduzione se supera). Non può ridurre i PF massimi sotto 1.' },
    { id: 'curare', name: 'Curare', level: 6, school: 'Abiurazione',
      classes: ['chierico', 'druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Energia positiva attraversa il bersaglio, che recupera 70 PF e viene liberato da Accecato, Assordato e Avvelenato. +10 PF per ogni slot oltre il 6°.' },
    { id: 'alleato-planare', name: 'Alleato Planare', level: 6, school: 'Convocazione',
      classes: ['chierico'],
      meta: '10 minuti · 18 m · Istantaneo · V, S',
      desc: 'Supplichi un\'entità ultraterrena conosciuta (una divinità, un principe demoniaco, o un altro essere di potere cosmico) per un aiuto: al termine del lancio, la creatura inviata fa TS Carisma o è vincolata al tuo servizio per la durata concordata (in genere in cambio di un pagamento negoziato). Con slot di 6° dura 10 giorni, 7° trenta giorni, 8° centottanta giorni, 9° trecentosessantasei giorni.' },
    { id: 'raggio-di-sole', name: 'Raggio di Sole', level: 6, school: 'Evocazione',
      classes: ['chierico', 'druido', 'stregone', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S, M (una lente d\'ingrandimento)',
      desc: 'Lanci un raggio di sole in una linea larga 1,5 m e lunga 18 m: le creature fanno TS Costituzione, subendo 6d8 radiosi e restando Accecate fino al tuo prossimo turno (metà danno se superano). Azione magica per creare una nuova linea nei turni successivi. Finché dura, una scintilla di luce splende sopra di te, emanando luce intensa in 9 m e fioca per altri 9 m (è luce solare).' },
    { id: 'parola-di-richiamo', name: 'Parola di Richiamo', level: 6, school: 'Convocazione',
      classes: ['chierico'],
      meta: 'Azione · 1,5 m · Istantaneo · V',
      desc: 'Tu e fino a cinque creature volontarie entro 1,5 m vi teletrasportate in un santuario designato in precedenza (lanciando questo stesso incantesimo lì). Senza un santuario già designato, l\'incantesimo non ha effetto.' },

    { id: 'convocare-celestiale', name: 'Convocare Celestiale', level: 7, school: 'Convocazione',
      classes: ['chierico'],
      meta: 'Azione · 27 m · 10 min CONC · V, S',
      desc: 'Diverso da Evoca Celestiale: convochi uno spirito dai Piani Superiori, una colonna di luce in un Cilindro di 3 m di raggio e 12 m di altezza. Puoi far bagnare le creature al suo interno in Luce Curativa (4d12 + il tuo modificatore da incantatore PF) o Luce Ardente (TS Destrezza, 6d12 radiosi, metà se supera). Azione magica per spostare il Cilindro fino a 9 m. +1d12 a entrambi gli effetti per ogni slot oltre il 7°.' },
    { id: 'parola-divina', name: 'Parola Divina', level: 7, school: 'Evocazione',
      classes: ['chierico'],
      meta: 'Azione bonus · 9 m · Istantaneo · V',
      desc: 'Pronunci una parola imbevuta di potere dai Piani Superiori: le creature scelte entro gittata fanno TS Carisma; chi ha 50 PF o meno e fallisce subisce un effetto che peggiora quanto più è ferito (da Assordato per 1 minuto fino alla morte istantanea sotto i 20 PF). Celestiali, Elementali, Folletti e Immondi che falliscono vengono anche rimandati al loro piano d\'origine per 24 ore.' },
    { id: 'tempesta-di-fuoco', name: 'Tempesta di Fuoco', level: 7, school: 'Evocazione',
      classes: ['chierico', 'druido', 'stregone'],
      meta: 'Azione · 45 m · Istantaneo · V, S',
      desc: 'Una tempesta di fuoco divampa in un\'area di dieci cubi di 3 m contigui a tua scelta entro gittata: le creature fanno TS Destrezza, subendo 7d10 fuoco (metà se superano). Gli oggetti infiammabili non indossati/trasportati nell\'area iniziano a bruciare.' },

    { id: 'campo-antimagico', name: 'Campo Antimagico', level: 8, school: 'Abiurazione',
      classes: ['chierico', 'mago'],
      meta: 'Azione · Sé (emanazione 3 m) · 1 ora CONC · V, S, M (limatura di ferro)',
      desc: 'Un\'aura antimagica ti circonda: nessuno può lanciare incantesimi, compiere azioni magiche o creare effetti magici al suo interno, né agire su ciò che vi si trova dentro dall\'esterno; gli oggetti magici perdono le proprietà, il teletrasporto e il viaggio planare sono bloccati, e gli incantesimi in corso vengono soppressi (il tempo trascorso conta comunque per la loro durata). Dissolvi Magie non ha effetto sull\'aura.' },
    { id: 'controllare-il-clima', name: 'Controllare il Clima', level: 8, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'mago'],
      meta: '10 minuti · Sé · 8 ore CONC · V, S, M (incenso in combustione)',
      desc: 'Prendi il controllo del meteo entro 8 km per la durata (devi essere all\'aperto): puoi cambiare precipitazioni, temperatura e vento, con le nuove condizioni che si stabiliscono in 10-100 minuti; puoi poi modificarle di nuovo. Il meteo torna gradualmente normale quando l\'incantesimo finisce.' },
    { id: 'terremoto', name: 'Terremoto', level: 8, school: 'Trasmutazione',
      classes: ['chierico', 'druido', 'stregone'],
      meta: 'Azione · 150 m · 1 min CONC · V, S, M (una roccia frantumata)',
      desc: 'Un intenso tremore scuote un\'area circolare di 30 m di raggio (Terreno Difficile) entro gittata: al lancio e a fine di ogni tuo turno, le creature a terra nell\'area fanno TS Destrezza o cadono Prone e perdono la concentrazione. Puoi anche aprire crepacci nel terreno (i personaggi rischiano di cadervi) o infliggere 50 danni contundenti alle strutture a contatto col suolo (che collassano a 0 PF).' },
    { id: 'aura-sacra', name: 'Aura Sacra', level: 8, school: 'Abiurazione',
      classes: ['chierico'],
      meta: 'Azione · Sé (emanazione 9 m) · 1 min CONC · V, S, M (un reliquiario da 1.000+ MO)',
      desc: 'Emani un\'aura nell\'emanazione: le creature scelte hanno vantaggio a tutti i TS, mentre le altre hanno svantaggio ad attaccarle; inoltre, quando un Immondo o un Non Morto colpisce una creatura protetta con un attacco in mischia, deve superare un TS Costituzione o essere Accecato fino alla fine del suo prossimo turno.' },
    { id: 'esplosione-solare', name: 'Esplosione Solare', level: 8, school: 'Evocazione',
      classes: ['chierico', 'druido', 'stregone', 'mago'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (un pezzo di pietra solare)',
      desc: 'Luce solare brillante lampeggia in una sfera di 18 m di raggio entro gittata: le creature fanno TS Costituzione, subendo 12d6 radiosi ed essendo Accecate per 1 minuto (metà danno senza accecamento se superano); chi resta Accecato ripete il TS a fine turno per liberarsi. Dissolve l\'Oscurità magica presente nell\'area.' },

    { id: 'cura-di-massa', name: 'Cura di Massa', level: 9, school: 'Abiurazione',
      classes: ['chierico'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Un flusso di energia curativa si propaga da te: ripristini fino a 700 PF, distribuiti come preferisci tra le creature scelte entro gittata, liberandole anche da Accecato, Assordato e Avvelenato.' },
    { id: 'vera-resurrezione', name: 'Vera Resurrezione', level: 9, school: 'Negromanzia',
      classes: ['chierico', 'druido'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (diamanti da 25.000+ MO, consumati)',
      desc: 'Riporti in vita, con un tocco, una creatura morta da non più di 200 anni e non deceduta per vecchiaia: torna con tutti i PF, ferite chiuse, veleni e contagi neutralizzati, maledizioni sciolte e organi o arti mancanti ripristinati (se era Non Morta, torna alla forma originale). Se il corpo non esiste più, puoi pronunciarne il nome per farla apparire comunque entro 3 m da te.' },

    /* ===== Druido — incantesimi mancanti ===== */
    { id: 'magia-druidica', name: 'Magia Druidica', level: 0, school: 'Trasmutazione',
      classes: ['druido'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Sussurrando agli spiriti della natura crei uno tra: previsione del meteo delle prossime 24 ore in una scenetta sensoria di 1 round; sboccio istantaneo di un fiore, un baccello o una gemma; un effetto sensoriale innocuo (foglie che cadono, una brezza, un odore) in un cubo di 1,5 m; oppure accendi o spegni una candela, una torcia o un piccolo falò.' },
    { id: 'elementalismo', name: 'Elementalismo', level: 0, school: 'Trasmutazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 9 m · Istantaneo · V, S',
      desc: 'Controlli gli elementi creando un piccolo effetto a scelta in un cubo di 1,5 m: una brezza che smuove polvere e chiude porte non trattenute; un velo di terra o sabbia (anche per scrivere una parola); un fumo colorato e profumato che può accendere fiamme; una spruzzata d\'acqua rinfrescante o una tazza d\'acqua pulita; oppure dai una forma rozza a terra, sabbia, fuoco, fumo, nebbia o acqua per 1 ora.' },
    { id: 'produrre-fiamma', name: 'Produrre Fiamma', level: 0, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione bonus · Sé · 10 minuti · V, S',
      desc: 'Una fiamma tremolante appare nella tua mano, senza scaldare né incendiare nulla, emanando luce intensa in 6 m e fioca per altri 6 m finché dura. Con un\'azione magica puoi scagliarla contro una creatura o un oggetto entro 18 m: attacco con incantesimo a distanza, 1d8 fuoco se colpisci. Il danno sale a 2d8 al 5° livello, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'sferza-di-spine', name: 'Sferza di Spine', level: 0, school: 'Trasmutazione',
      classes: ['druido'],
      meta: 'Azione · 9 m · Istantaneo · V, S, M (uno stelo di pianta spinosa)',
      desc: 'Crei una frusta di rovi che scatta contro una creatura entro gittata: attacco con incantesimo in mischia, 1d6 perforanti se colpisci e, se il bersaglio è Grande o più piccolo, lo trascini fino a 3 m verso di te. Il danno sale a 2d6 al 5° livello, 3d6 all\'11°, 4d6 al 17°.' },
    { id: 'randello-magico', name: 'Randello Magico', level: 0, school: 'Trasmutazione',
      classes: ['druido'],
      meta: 'Azione bonus · Sé · 1 minuto · V, S, M (vischio)',
      desc: 'Un Bastone o un Randello che impugni si imbeve di potere naturale: per la durata, negli attacchi in mischia con quell\'arma puoi usare la tua caratteristica da incantatore al posto della Forza per colpire e per il danno, e il dado di danno dell\'arma diventa 1d8 (forza o il tipo normale dell\'arma, a scelta). L\'incantesimo finisce prima se lo rilanci o se lasci l\'arma. Il dado sale a 1d10 al 5° livello, 1d12 all\'11°, 2d6 al 17°.' },

    /* 1° livello */
    { id: 'lama-di-ghiaccio', name: 'Lama di Ghiaccio', level: 1, school: 'Convocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · S, M (una goccia d\'acqua o un pezzo di ghiaccio)',
      desc: 'Crei una scheggia di ghiaccio e la scagli contro una creatura entro gittata: attacco con incantesimo a distanza, 1d10 perforanti se colpisci. Che tu colpisca o manchi, la scheggia poi esplode: il bersaglio e ogni creatura entro 1,5 m fanno TS Destrezza o subiscono 2d6 freddo. +1d6 freddo per ogni slot oltre il 1°.' },

    /* 2° livello */
    { id: 'lama-fiammeggiante', name: 'Lama Fiammeggiante', level: 2, school: 'Evocazione',
      classes: ['druido', 'stregone'],
      meta: 'Azione bonus · Sé · 10 min CONC · V, S, M (una foglia di sommacco)',
      desc: 'Evochi nella mano libera una lama di fuoco simile a una scimitarra, che sparisce se la lasci (puoi rievocarla con un\'altra azione bonus). Con un\'azione magica attacchi in mischia: se colpisci, 3d6 fuoco più il modificatore da incantatore. Emana luce intensa in 3 m e fioca per altri 3 m. +1d6 per ogni slot oltre il 2°.' },
    { id: 'sfera-fiammeggiante', name: 'Sfera Fiammeggiante', level: 2, school: 'Convocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (una pallina di cera)',
      desc: 'Crei una sfera di fuoco di 1,5 m di diametro in uno spazio libero entro gittata: le creature che finiscono il turno entro 1,5 m fanno TS Destrezza o subiscono 2d6 fuoco (metà se superano). Azione bonus per farla rotolare fino a 9 m, anche oltre ostacoli bassi o piccole fosse; se entra nello spazio di una creatura, questa fa il TS e la sfera si ferma per il turno. Incendia oggetti infiammabili non indossati e fa luce intensa in 6 m e fioca per altri 6 m. +1d6 per ogni slot oltre il 2°.' },
    { id: 'raggio-di-luna', name: 'Raggio di Luna', level: 2, school: 'Evocazione',
      classes: ['druido'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (una foglia di baccello di luna)',
      desc: 'Un raggio di luce argentea scende in un Cilindro di 1,5 m di raggio e 12 m di altezza, riempiendolo di luce fioca. Al comparire e con un\'azione magica per spostarlo fino a 18 m nei turni successivi, le creature nel Cilindro fanno TS Costituzione: se falliscono, 2d10 radiosi e, se erano trasformate da un incantesimo come Metamorfosi, tornano alla forma vera restando bloccate finché non escono dal Cilindro (metà danno senza effetto se superano).' },

    /* 3° livello */
    { id: 'invocare-fulmine', name: 'Invocare Fulmine', level: 3, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 36 m · 10 min CONC · V, S',
      desc: 'Una nuvola temporalesca appare sopra di te, un Cilindro alto 3 m con raggio di 18 m. Al lancio e con un\'azione magica nei turni successivi scagli un fulmine su un punto sotto la nuvola: le creature entro 1,5 m fanno TS Destrezza o subiscono 3d10 fulmine (metà se superano). Se sei all\'aperto durante un temporale, prendi il controllo di quello reale e il danno sale di 1d10. +1d10 per ogni slot oltre il 3°.' },
    { id: 'tempesta-di-nevischio', name: 'Tempesta di Nevischio', level: 3, school: 'Convocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 45 m · 1 min CONC · V, S, M (un piccolo ombrello)',
      desc: 'Nevischio cade in un Cilindro di 6 m di raggio e 12 m di altezza entro gittata, fortemente oscurato e con fiamme scoperte spente all\'interno. Il terreno diventa Terreno Difficile; chi vi entra o inizia il turno lì fa TS Destrezza o cade Prono e perde la concentrazione.' },

    /* 4° livello */
    { id: 'convocare-elementali-minori', name: 'Convocare Elementali Minori', level: 4, school: 'Convocazione',
      classes: ['druido', 'mago'],
      meta: 'Azione · Sé (emanazione 4,5 m) · 10 min CONC · V, S',
      desc: 'Diverso da Evocare Elementale: spiriti elementali ti volteggiano attorno nell\'emanazione. Finché dura, ogni tuo attacco che colpisce una creatura nell\'emanazione infligge 2d8 danni extra a scelta tra acido, freddo, fuoco o fulmine, e il terreno nell\'emanazione è Terreno Difficile per i nemici. +2d8 per ogni slot oltre il 4°.' },
    { id: 'scudo-di-fuoco', name: 'Scudo di Fuoco', level: 4, school: 'Evocazione',
      classes: ['druido', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · Sé · 10 minuti · V, S, M (un po\' di fosforo o una lucciola)',
      desc: 'Fiamme evanescenti ti avvolgono per la durata, emanando luce intensa in 3 m e fioca per altri 3 m. Scegli uno scudo caldo (resistenza al freddo) o uno scudo freddo (resistenza al fuoco). Quando una creatura entro 1,5 m ti colpisce in mischia, lo scudo erompe infliggendole 2d8 fuoco (scudo caldo) o 2d8 freddo (scudo freddo).' },
    { id: 'insetto-gigante', name: 'Insetto Gigante', level: 4, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 18 m · 10 min CONC · V, S',
      desc: 'Evochi un centopiedi, un ragno o una vespa gigante (statistiche proprie, scalano col livello dello slot) in uno spazio libero entro gittata. La creatura è tua alleata, condivide la tua iniziativa agendo subito dopo di te, e obbedisce ai comandi verbali senza bisogno di azione da parte tua; senza ordini si Disimpegna e si muove per evitare pericoli. Sparisce a 0 PF o alla fine dell\'incantesimo.' },
    { id: 'tempesta-di-ghiaccio', name: 'Tempesta di Ghiaccio', level: 4, school: 'Evocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 90 m · Istantaneo · V, S, M (un guanto)',
      desc: 'Grandine cade in un Cilindro di 6 m di raggio e 12 m di altezza entro gittata: le creature fanno TS Destrezza, subendo 2d10 contundenti e 4d6 freddo se falliscono (metà se superano). La grandine rende il terreno Terreno Difficile fino alla fine del tuo prossimo turno. +1d10 contundenti per ogni slot oltre il 4°.' },
    { id: 'muro-di-fuoco', name: 'Muro di Fuoco', level: 4, school: 'Evocazione',
      classes: ['druido', 'stregone', 'mago', 'chierico'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (un pezzetto di carbone)',
      desc: 'Crei un muro di fuoco opaco su una superficie solida entro gittata: fino a 18 m di lunghezza, 6 m di altezza e 30 cm di spessore, oppure ad anello con diametro fino a 6 m. Al comparire, le creature nell\'area fanno TS Destrezza o subiscono 5d8 fuoco (metà se superano). Un lato, scelto da te, infligge 5d8 fuoco a chi finisce il turno entro 3 m di esso o dentro il muro (anche entrandovi per la prima volta in un turno).' },

    /* 5° livello */
    { id: 'guscio-antivita', name: 'Guscio Antivita', level: 5, school: 'Abiurazione',
      classes: ['druido'],
      meta: 'Azione · Sé (emanazione 3 m) · 1 ora CONC · V, S',
      desc: 'Un\'aura si estende da te in un\'emanazione di 3 m per la durata, impedendo il passaggio a creature che non siano Costrutti o Non Morti (chi è dentro può comunque lanciare incantesimi o attaccare a distanza attraverso la barriera). Se ti muovi forzando una creatura protetta ad attraversare la barriera, l\'incantesimo finisce.' },
    { id: 'cono-di-gelo', name: 'Cono di Gelo', level: 5, school: 'Evocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · Sé · Istantaneo · V, S, M (un piccolo cono di cristallo o vetro)',
      desc: 'Scateni una raffica d\'aria gelida: le creature in un Cono di 18 m originato da te fanno TS Costituzione, subendo 8d8 freddo se falliscono (metà se superano). Una creatura uccisa da questo incantesimo diventa una statua di ghiaccio finché non si scioglie. +1d8 per ogni slot oltre il 5°.' },
    { id: 'convocare-elementale', name: 'Convocare Elementale', level: 5, school: 'Convocazione',
      classes: ['druido', 'mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, S',
      desc: 'Diverso da Evocare Elementale (che evoca uno spirito con statistiche proprie): convochi uno spirito Grande e intangibile dai Piani Elementali, scegliendo aria (fulmine), terra (tuono), fuoco (fuoco) o acqua (freddo). Le creature che entrano nel suo spazio o iniziano il turno entro 1,5 m fanno TS Destrezza o subiscono 8d8 danni del tipo scelto restando Trattenute (poi ripetono il TS a inizio turno, con 4d8 in caso di fallimento). +2d8 per ogni slot oltre il 5°.' },
    { id: 'reincarnare', name: 'Reincarnare', level: 5, school: 'Negromanzia',
      classes: ['druido'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (oli rari da 1.000+ MO, consumati)',
      desc: 'Tocchi un Umanoide morto (o un suo resto) da non più di 10 giorni: l\'incantesimo forma un nuovo corpo e vi richiama l\'anima. Tiri un d10 su una tabella di specie casuali (o il DM ne sceglie un\'altra giocabile) per determinare l\'aspetto del nuovo corpo; personalità e memoria del bersaglio restano intatte.' },
    { id: 'muro-di-pietra', name: 'Muro di Pietra', level: 5, school: 'Evocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 10 min CONC · V, S, M (un cubo di granito)',
      desc: 'Un muro non magico di pietra solida sorge in un punto entro gittata, spesso 15 cm e composto da pannelli contigui di 3x3 m (oppure pannelli più sottili di 3x6 m). Se il muro attraversa lo spazio di una creatura al comparire, questa viene spinta di lato; se resterebbe intrappolata su tutti i lati, può fare un TS Destrezza per usare la Reazione e spostarsi fuori dal muro. Con concentrazione mantenuta per l\'intera durata, il muro diventa permanente.' },

    /* 6° livello */
    { id: 'convocare-folletto', name: 'Convocare Folletto', level: 6, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Diverso da Evocare Folletto (che evoca uno spirito con statistiche proprie): convochi uno spirito fatato Medio da Feywild in uno spazio libero entro gittata. Attacco con incantesimo in mischia contro una creatura a tua scelta: 3d12 psichici se colpisci, con la creatura Spaventata fino alla fine del suo prossimo turno. Nei turni successivi puoi teletrasportare lo spirito fino a 9 m con un\'azione bonus prima di attaccare di nuovo.' },
    { id: 'carne-in-pietra', name: 'Carne in Pietra', level: 6, school: 'Trasmutazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 18 m · 1 min CONC · V, S, M (una piuma di cocatrice)',
      desc: 'Tenti di pietrificare una creatura che vedi entro gittata: TS Costituzione, con Restrizione in caso di fallimento (velocità 0 se supera). A ogni fine turno il bersaglio Trattenuto ripete il TS: con tre successi l\'incantesimo finisce, con tre fallimenti diventa Pietrificato per la durata (permanente se mantieni la concentrazione fino in fondo).' },
    { id: 'spostare-la-terra', name: 'Spostare la Terra', level: 6, school: 'Trasmutazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 36 m · 2 ore CONC · V, S, M (una pala in miniatura)',
      desc: 'Scegli un\'area di terreno non più larga di 12 m di lato entro gittata: per la durata puoi rimodellare terra, sabbia o argilla a piacere (alzare o abbassare il livello, scavare trincee, erigere muri o pilastri), con effetti che si completano in 10 minuti e non intrappolano né feriscono le creature. Non funziona su pietra naturale o costruzioni in muratura.' },
    { id: 'trasporto-vegetale', name: 'Trasporto Vegetale', level: 6, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 3 m · 1 minuto · V, S',
      desc: 'Crei un collegamento magico tra una pianta inanimata Grande o più grande entro gittata e un\'altra pianta, a qualunque distanza sullo stesso piano, che devi aver già visto o toccato: per la durata, chiunque può entrare nella prima ed uscire dalla seconda usando movimento normale.' },
    { id: 'muro-di-rovi', name: 'Muro di Rovi', level: 6, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 36 m · 10 min CONC · V, S, M (una manciata di spine)',
      desc: 'Crei un muro di rovi intricati e spinosi su una superficie solida entro gittata, fino a 18 m di lunghezza, 3 m di altezza e 1,5 m di spessore (o ad anello con diametro di 6 m); blocca la linea di vista. Al comparire, le creature nell\'area fanno TS Destrezza o subiscono 7d8 perforanti (metà se superano). Attraversarlo costa 4 volte il movimento normale e infligge, la prima volta per turno, altri 7d8 taglienti con TS Destrezza (metà se superano). +1d8 a entrambi i danni per ogni slot oltre il 6°.' },
    { id: 'cammino-del-vento', name: 'Cammino del Vento', level: 6, school: 'Trasmutazione',
      classes: ['druido'],
      meta: '1 minuto · 9 m · 8 ore · V, S, M (una candela)',
      desc: 'Tu e fino a dieci creature volontarie entro gittata assumete forma gassosa per la durata, simili a nuvole di vapore: Velocità di Volo di 90 m con capacità di planare, immunità alla condizione Prono e resistenza a contundenti, perforanti e taglienti. In questa forma potete solo Scattare o compiere un\'azione magica per iniziare a tornare normali (1 minuto, durante cui siete Storditi).' },

    /* 7° livello */
    { id: 'inversione-di-gravita', name: 'Inversione di Gravità', level: 7, school: 'Trasmutazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 30 m · 1 min CONC · V, S, M (una calamita e limatura di ferro)',
      desc: 'Inverti la gravità in un Cilindro di 15 m di raggio e 30 m di altezza entro gittata: creature e oggetti non ancorati cadono verso l\'alto fino alla sommità (un TS Destrezza permette di aggrapparsi a un appiglio fisso per evitare la caduta). Chi urta un soffitto o un ostacolo subisce danno come in una caduta normale; alla fine dell\'incantesimo tutto ricade verso il basso.' },

    /* 8° livello */
    { id: 'forme-animali', name: 'Forme Animali', level: 8, school: 'Trasmutazione',
      classes: ['druido'],
      meta: 'Azione · 9 m · 24 ore · V, S',
      desc: 'Un numero a scelta di creature volontarie entro gittata si trasforma in una Bestia Grande o più piccola di GS 4 o inferiore (forma diversa per ciascuna, a tua scelta); con un\'azione magica nei turni successivi puoi ritrasformarle. Ogni bersaglio mantiene tipo, PF, allineamento e le proprie caratteristiche mentali, ottiene PF temporanei pari a quelli della Bestia, e non può lanciare incantesimi nella nuova forma; l\'equipaggiamento si fonde con essa.' },
    { id: 'nube-incendiaria', name: 'Nube Incendiaria', level: 8, school: 'Convocazione',
      classes: ['druido', 'stregone', 'mago'],
      meta: 'Azione · 45 m · 1 min CONC · V, S',
      desc: 'Una nube vorticosa di braci e fumo riempie una Sfera di 6 m di raggio entro gittata, fortemente oscurata, finché dura o finché un forte vento non la disperde. Al comparire e ogni volta che una creatura vi entra o vi termina il turno, fa TS Destrezza o subisce 10d8 fuoco (metà se supera, una volta a turno). La nube si sposta di 3 m in una direzione a tua scelta a inizio di ogni tuo turno.' },
    { id: 'tsunami', name: 'Tsunami', level: 8, school: 'Convocazione',
      classes: ['druido'],
      meta: '1 minuto · 1,6 km · 6 round CONC · V, S',
      desc: 'Un muro d\'acqua alto fino a 90 m, largo fino a 90 m e spesso 15 m sorge in un punto entro gittata. Al comparire, le creature nell\'area fanno TS Forza o subiscono 6d10 contundenti (metà se superano). A inizio di ogni tuo turno il muro avanza di 15 m infliggendo danno a chi travolge; a ogni fine turno la sua altezza cala di 15 m e il danno di 1d10, finché non si esaurisce.' },

    /* 9° livello */
    { id: 'cambiaforma', name: 'Cambiaforma', level: 9, school: 'Trasmutazione',
      classes: ['druido', 'mago'],
      meta: 'Azione · Sé · 1 ora CONC · V, S, M (un cerchietto di giada da 1.500+ MO)',
      desc: 'Diverso da Mutare Forma (livello 4, forma altrui e più limitata): ti trasformi tu stesso in un\'altra creatura per la durata, o finché non ne scegli una nuova con un\'azione magica. La forma deve avere GS non superiore al tuo livello, deve essere di un tipo che hai già visto e non può essere un Costrutto o un Non Morto. Ottieni PF temporanei pari a quelli della forma; mantieni allineamento, personalità, caratteristiche mentali, PF veri, competenze e le tue eventuali capacità di lancio incantesimi.' },
    { id: 'tempesta-di-vendetta', name: 'Tempesta di Vendetta', level: 9, school: 'Convocazione',
      classes: ['druido'],
      meta: 'Azione · 1,6 km · 1 min CONC · V, S',
      desc: 'Una tempesta turbinante si forma su un\'area con raggio di 90 m entro gittata: al comparire le creature sotto la nube fanno TS Costituzione o subiscono 2d6 tuono restando Assordate per la durata. Nei turni successivi la tempesta cambia effetto: pioggia acida (4d6 acido), sei fulmini mirati (TS Destrezza, 10d6 fulmine), grandine (2d6 contundenti), poi raffiche e pioggia gelata che rendono l\'area Terreno Difficile e oscurata e impediscono attacchi a distanza.' },

    /* ===== Stregone — incantesimi mancanti ===== */
    { id: 'spruzzo-acido', name: 'Spruzzo Acido', level: 0, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Crei una bolla acida in un punto entro gittata, che esplode in una Sfera di 1,5 m di raggio: le creature nella Sfera fanno TS Destrezza o subiscono 1d6 acido. Il danno sale a 2d6 al 5° livello, 3d6 all\'11°, 4d6 al 17°.' },
    { id: 'dardo-di-fuoco', name: 'Dardo di Fuoco', level: 0, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Scagli una scintilla di fuoco contro una creatura o un oggetto entro gittata: attacco con incantesimo a distanza, 1d10 fuoco se colpisci (l\'oggetto infiammabile non indossato prende fuoco). Il danno sale a 2d10 al 5° livello, 3d10 all\'11°, 4d10 al 17°.' },
    { id: 'luce', name: 'Luce', level: 0, school: 'Evocazione',
      classes: ['bardo', 'chierico', 'stregone', 'mago'],
      meta: 'Azione · Tocco · 1 ora · V, M (una lucciola o del muschio fosforescente)',
      desc: 'Tocchi un oggetto Grande o più piccolo non indossato né trasportato da altri: finché dura, emana luce intensa in 6 m e fioca per altri 6 m (colore a scelta). Coprirlo con qualcosa di opaco blocca la luce; l\'incantesimo finisce se lo rilanci.' },
    { id: 'raggio-di-gelo', name: 'Raggio di Gelo', level: 0, school: 'Evocazione',
      classes: ['stregone', 'mago', 'druido'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Un raggio gelido color bianco-blu sfreccia verso una creatura entro gittata: attacco con incantesimo a distanza, 1d8 freddo se colpisci e la sua velocità si riduce di 3 m fino al tuo prossimo turno. Il danno sale a 2d8 al 5° livello, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'presa-elettrizzante', name: 'Presa Elettrizzante', level: 0, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Tocco · Istantaneo · V, S',
      desc: 'Un fulmine scaturisce da te verso una creatura che tenti di toccare: attacco con incantesimo in mischia, 1d8 fulmine se colpisci e il bersaglio non può fare Attacchi di Opportunità fino al tuo prossimo turno. Il danno sale a 2d8 al 5° livello, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'scoppio-stregonesco', name: 'Scoppio Stregonesco', level: 0, school: 'Evocazione',
      classes: ['stregone'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Scagli energia stregonesca contro una creatura o un oggetto entro gittata: attacco a distanza, 1d8 di un tipo a scelta tra acido, freddo, fuoco, fulmine, veleno, psichico o tuono se colpisci. Se il dado esce 8, puoi tirarne un altro e sommarlo (fino a un numero di d8 aggiuntivi pari al tuo modificatore da incantatore). Il danno base sale a 2d8 al 5° livello, 3d8 all\'11°, 4d8 al 17°.' },
    { id: 'mani-ardenti', name: 'Mani Ardenti', level: 1, school: 'Evocazione',
      classes: ['stregone', 'mago', 'chierico'],
      meta: 'Azione · Sé · Istantaneo · V, S',
      desc: 'Un sottile lenzuolo di fiamme erompe da te in un Cono di 4,5 m: le creature fanno TS Destrezza o subiscono 3d6 fuoco (metà se superano); gli oggetti infiammabili non indossati prendono fuoco. +1d6 per ogni slot oltre il 1°.' },
    { id: 'sfera-cromatica', name: 'Sfera Cromatica', level: 1, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 27 m · Istantaneo · V, S, M (un diamante da 50+ MO)',
      desc: 'Scagli una sfera di energia contro un bersaglio entro gittata, scegliendo acido, freddo, fuoco, fulmine, veleno o tuono: attacco con incantesimo a distanza, 3d8 danni del tipo scelto se colpisci. Se due o più dadi mostrano lo stesso numero, la sfera rimbalza su un altro bersaglio entro 9 m con un nuovo attacco e tiro danni (solo con slot di 2° livello o superiore).' },
    { id: 'falsa-vita', name: 'Falsa Vita', level: 1, school: 'Negromanzia',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · Istantaneo · V, S, M (una goccia di alcol)',
      desc: 'Ottieni 2d4 + 4 PF temporanei. +5 PF temporanei per ogni slot oltre il 1°.' },
    { id: 'untare', name: 'Untare', level: 1, school: 'Convocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · 1 minuto · V, S, M (cotenna di maiale o burro)',
      desc: 'Del grasso non infiammabile ricopre il terreno in un\'area di 3 m di lato centrata su un punto entro gittata, rendendola Terreno Difficile per la durata. Al comparire e per chiunque vi entri o vi termini il turno, TS Destrezza o condizione Prono.' },
    { id: 'armatura-del-mago', name: 'Armatura del Mago', level: 1, school: 'Abiurazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Tocco · 8 ore · V, S, M (un pezzo di cuoio conciato)',
      desc: 'Tocchi una creatura volontaria che non indossa armatura: finché dura, la sua CA base diventa 13 più il modificatore di Destrezza. Finisce prima se il bersaglio indossa un\'armatura.' },
    { id: 'dardo-incantato', name: 'Dardo Incantato', level: 1, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Crei tre dardi luminosi di forza magica: colpiscono automaticamente (nessun tiro per colpire) una o più creature a tua scelta entro gittata, 1d4+1 forza ciascuno, tutti simultaneamente. +1 dardo per ogni slot oltre il 1°.' },
    { id: 'raggio-nauseante', name: 'Raggio Nauseante', level: 1, school: 'Negromanzia',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V, S',
      desc: 'Scagli un raggio verdastro contro una creatura entro gittata: attacco con incantesimo a distanza, 2d8 veleno se colpisci e resta Avvelenata fino alla fine del tuo prossimo turno. +1d8 per ogni slot oltre il 1°.' },
    { id: 'scudo', name: 'Scudo', level: 1, school: 'Abiurazione',
      classes: ['stregone', 'mago'],
      meta: 'Reazione (se colpito da un attacco o bersaglio di Dardo Incantato) · Sé · 1 round · V, S',
      desc: 'Una barriera invisibile di forza magica ti protegge: fino all\'inizio del tuo prossimo turno ottieni +5 alla CA (anche contro l\'attacco che ha innescato la reazione) e non subisci danno da Dardo Incantato.' },
    { id: 'alterare-se', name: 'Alterare Sé', level: 2, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · 1 ora CONC · V, S',
      desc: 'Alteri la tua forma fisica scegliendo un\'opzione tra: Adattamento Acquatico (branchie e membrane, respiri sott\'acqua e ottieni Velocità di Nuoto pari alla tua), Cambiare Aspetto (modifichi il tuo aspetto a piacere, anche come un\'altra specie, senza cambiare taglia né statistiche), o Armi Naturali (artigli, zanne, corna o zoccoli che infliggono 1d6 del danno indicato e usano la tua caratteristica da incantatore per colpire e per il danno). Con un\'azione magica puoi cambiare opzione durante la durata.' },
    { id: 'vigore-arcano', name: 'Vigore Arcano', level: 2, school: 'Abiurazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione bonus · Sé · Istantaneo · V, S',
      desc: 'Attingi alla tua forza vitale per guarirti: tiri uno o due Dadi Vita non spesi e recuperi PF pari al totale più il modificatore da incantatore; quei dadi vengono spesi. +1 Dado Vita utilizzabile per ogni slot oltre il 2°.' },
    { id: 'sfocatura', name: 'Sfocatura', level: 2, school: 'Illusione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V',
      desc: 'Il tuo corpo diventa sfocato: finché dura, ogni creatura ha svantaggio agli attacchi contro di te, a meno che non ti percepisca con Scurovisione Cieca o Vista Vera.' },
    { id: 'soffio-di-drago', name: 'Soffio di Drago', level: 2, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione bonus · Tocco · 1 min CONC · V, S, M (un peperoncino piccante)',
      desc: 'Tocchi una creatura volontaria e scegli acido, freddo, fuoco, fulmine o veleno: finché dura, il bersaglio può usare un\'azione magica per esalare un Cono di 4,5 m; le creature nell\'area fanno TS Destrezza o subiscono 3d6 danni del tipo scelto (metà se superano). +1d6 per ogni slot oltre il 2°.' },
    { id: 'levitazione', name: 'Levitazione', level: 2, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, S, M (una molla di metallo)',
      desc: 'Una creatura o un oggetto libero a tua scelta entro gittata si solleva verticalmente fino a 6 m e resta sospeso per la durata (fino a 225 kg; una creatura non volontaria può resistere con TS Costituzione). Il bersaglio si muove solo spingendosi o tirandosi contro superfici fisse a portata; puoi cambiarne l\'altezza a comando.' },
    { id: 'raggio-infuocato', name: 'Raggio Infuocato', level: 2, school: 'Evocazione',
      classes: ['stregone', 'mago', 'chierico'],
      meta: 'Azione · 36 m · Istantaneo · V, S',
      desc: 'Scagli tre raggi fiammeggianti contro uno o più bersagli entro gittata: attacco con incantesimo a distanza per ciascuno, 2d6 fuoco se colpisci. +1 raggio per ogni slot oltre il 2°.' },
    { id: 'ragnatela', name: 'Ragnatela', level: 2, school: 'Convocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · 1 ora CONC · V, S, M (un po\' di ragnatela)',
      desc: 'Crei una massa di ragnatela appiccicosa che riempie un Cubo di 6 m entro gittata (Terreno Difficile, leggermente oscurato); se non è ancorata a superfici solide collassa e l\'incantesimo finisce al tuo prossimo turno. Chi entra o inizia il turno nella ragnatela fa TS Destrezza o resta Trattenuto (liberabile con una prova di Forza (Atletica) contro la tua CD). È infiammabile: un cubo di 1,5 m esposto al fuoco brucia in un round, infliggendo 2d4 fuoco a chi vi inizia il turno.' },
    { id: 'sfarfallio', name: 'Sfarfallio', level: 3, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · 1 minuto · V, S',
      desc: 'Tiri 1d6 a fine di ogni tuo turno per la durata: con 4-6 svanisci dal piano e appari sul Piano Etereo (finché non torni o l\'incantesimo termina), percependo il tuo piano d\'origine in tonalità di grigio entro 18 m; puoi interagire solo con creature sull\'Etereo. Torni all\'inizio del turno successivo o alla fine dell\'incantesimo, in uno spazio libero entro 3 m da dove eri.' },
    { id: 'palla-di-fuoco', name: 'Palla di Fuoco', level: 3, school: 'Evocazione',
      classes: ['stregone', 'mago', 'chierico'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (una pallina di guano di pipistrello e zolfo)',
      desc: 'Un lampo scocca da te fino a un punto entro gittata ed esplode in una Sfera di 6 m di raggio: le creature fanno TS Destrezza o subiscono 8d6 fuoco (metà se superano); gli oggetti infiammabili non indossati prendono fuoco. +1d6 per ogni slot oltre il 3°.' },
    { id: 'accelerare', name: 'Accelerare', level: 3, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M (una scaglia di radice di liquirizia)',
      desc: 'Una creatura volontaria entro gittata raddoppia la Velocità, ottiene +2 alla CA, vantaggio ai TS di Destrezza e un\'azione aggiuntiva ogni turno (solo Attacco singolo, Scatto, Disimpegno, Nascondersi o Utilizzare). Alla fine dell\'incantesimo il bersaglio è Incapacitato con Velocità 0 fino alla fine del turno successivo.' },
    { id: 'fulmine', name: 'Fulmine', level: 3, school: 'Evocazione',
      classes: ['stregone', 'mago', 'druido'],
      meta: 'Azione · Sé · Istantaneo · V, S, M (un po\' di pelo e un\'asta di cristallo)',
      desc: 'Una scarica fulminea forma una Linea di 30 m per 1,5 m nella direzione che scegli: le creature nella Linea fanno TS Destrezza o subiscono 8d6 fulmine (metà se superano). +1d6 per ogni slot oltre il 3°.' },
    { id: 'sfera-vetriolica', name: 'Sfera Vetriolica', level: 4, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (una goccia di bile)',
      desc: 'Una sfera incandescente di acido di 30 cm di diametro sfreccia verso un punto entro gittata ed esplode in una Sfera di 6 m di raggio: le creature fanno TS Destrezza, subendo 10d4 acido (e altri 5d4 alla fine del turno successivo) se falliscono, o solo il danno iniziale dimezzato se superano. +2d4 al danno iniziale per ogni slot oltre il 4°.' },
    { id: 'mano-di-bigby', name: 'Mano di Bigby', level: 5, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 36 m · 1 min CONC · V, S, M (un guscio d\'uovo e un guanto)',
      desc: 'Crei una Grande mano scintillante di energia magica in uno spazio libero entro gittata, che si muove ai tuoi comandi (CA 20, PF pari al tuo massimo). Al lancio e con un\'azione bonus nei turni successivi, la sposti fino a 18 m e scegli un effetto: Pugno Chiuso (attacco in mischia, 4d8 forza), Mano Spingente (TS Forza o spinta fino a 1,5 m + 1,5 m per 5 punti di modificatore da incantatore), Mano Afferrante (TS Destrezza o Afferramento, poi puoi stritolare per 4d6 contundenti + modificatore), Mano Interposta (mezza copertura contro attacchi dalla sua direzione, Terreno Difficile per i nemici nel suo spazio). +2d8 al Pugno e +2d6 alla Mano Afferrante per ogni slot oltre il 5°.' },
    { id: 'nube-letale', name: 'Nube Letale', level: 5, school: 'Convocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 36 m · 10 min CONC · V, S',
      desc: 'Crei una Sfera di 6 m di raggio di nebbia verde-gialla entro gittata (fortemente oscurata), che dura finché un vento forte non la disperde. Le creature al suo interno fanno TS Costituzione, subendo 5d8 veleno se falliscono (metà se superano); il TS si ripete anche quando la Sfera si sposta nel loro spazio o vi entrano.' },
    { id: 'creazione', name: 'Creazione', level: 5, school: 'Illusione',
      classes: ['stregone', 'mago'],
      meta: '1 minuto · 9 m · Speciale · V, S, M (un pennello)',
      desc: 'Estrai frammenti d\'ombra dal Piano Ombra per creare un oggetto vegetale o minerale entro gittata (non più grande di un Cubo di 1,5 m, di una forma e materiale che hai già visto). La durata dipende dal materiale: da 1 minuto (adamantio o mithral) a 24 ore (materia vegetale). Usarlo come componente materiale di un altro incantesimo fa fallire quest\'ultimo. +1,5 m al Cubo per ogni slot oltre il 5°.' },
    { id: 'telecinesi', name: 'Telecinesi', level: 5, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, S',
      desc: 'Al lancio e con un\'azione magica nei turni successivi, eserciti la tua volontà su una creatura o un oggetto Enorme o più piccolo entro gittata: una creatura fa TS Forza o viene spostata fino a 9 m (Trattenuta se sollevata, cade se non ripeti l\'effetto); un oggetto non indossato si sposta automaticamente fino a 9 m, oppure se è impugnato il portatore fa TS Forza o te lo strappa di mano.' },
    { id: 'catena-di-fulmini', name: 'Catena di Fulmini', level: 6, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 45 m · Istantaneo · V, S, M (tre spilli d\'argento)',
      desc: 'Lanci un fulmine contro un bersaglio entro gittata; altri tre fulmini saltano verso altrettanti bersagli a tua scelta entro 9 m dal primo. Ogni bersaglio fa TS Destrezza, subendo 10d8 fulmine se fallisce (metà se supera). +1 fulmine aggiuntivo per ogni slot oltre il 6°.' },
    { id: 'disintegrare', name: 'Disintegrare', level: 6, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 18 m · Istantaneo · V, S, M (una calamita e polvere)',
      desc: 'Lanci un raggio verde contro un bersaglio entro gittata (creatura, oggetto non magico o costrutto di forza magica): TS Destrezza, con 10d6+40 forza se fallisce, riducendolo in polvere se arriva a 0 PF (rianimabile solo con Vera Resurrezione o Desiderio). Distrugge automaticamente oggetti non magici Grandi o più piccoli.' },
    { id: 'sfera-di-invulnerabilita', name: 'Sfera di Invulnerabilità', level: 6, school: 'Abiurazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · 1 min CONC · V, S, M (una perlina di vetro)',
      desc: 'Una barriera immobile e scintillante appare in un\'emanazione di 3 m attorno a te per la durata: gli incantesimi di livello 5 o inferiore lanciati da fuori non hanno effetto su ciò che è dentro (possono comunque avere bersagli dentro, ma senza effetto). +1 livello bloccato per ogni slot oltre il 6°.' },
    { id: 'sfera-congelante-di-otiluke', name: 'Sfera Congelante di Otiluke', level: 6, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 90 m · Istantaneo · V, S, M (una sfera di cristallo in miniatura)',
      desc: 'Un globo gelido sfreccia da te fino a un punto entro gittata, dove esplode in una Sfera di 18 m di raggio: le creature fanno TS Costituzione, subendo 10d6 freddo se falliscono (metà se superano).' },
    { id: 'palla-di-fuoco-ritardata', name: 'Palla di Fuoco Ritardata', level: 7, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 45 m · 1 min CONC · V, S, M (una pallina di guano di pipistrello e zolfo)',
      desc: 'Un raggio di luce gialla condensa in una sfera incandescente in un punto entro gittata, che esplode alla fine dell\'incantesimo in una Sfera di 6 m di raggio: le creature fanno TS Destrezza, subendo fuoco pari al danno accumulato se falliscono (metà se superano). Il danno base è 12d6 e aumenta di 1d6 ogni volta che il tuo turno finisce senza che l\'incantesimo sia terminato. Se una creatura tocca la sfera prima che esploda, fa TS Destrezza: se fallisce l\'incantesimo termina subito; se supera può lanciarla fino a 12 m (l\'incantesimo termina comunque se colpisce una creatura o un ostacolo).' },
    { id: 'pioggia-di-meteore', name: 'Pioggia di Meteore', level: 9, school: 'Evocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · 1,6 km · Istantaneo · V, S',
      desc: 'Sfere fiammeggianti precipitano su quattro punti a tua scelta entro gittata: le creature in ciascuna Sfera di 12 m di raggio fanno TS Destrezza, subendo 20d6 fuoco e 20d6 contundenti se falliscono (metà se superano; chi è colpito da più sfere subisce l\'effetto una sola volta). Anche gli oggetti non indossati nell\'area subiscono il danno e possono incendiarsi.' },
    { id: 'fermare-il-tempo', name: 'Fermare il Tempo', level: 9, school: 'Trasmutazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · Istantaneo · V',
      desc: 'Fermi brevemente il flusso del tempo per tutti tranne te: nessun tempo passa per le altre creature mentre tu agisci per 1d4+1 turni consecutivi, muovendoti e compiendo azioni normalmente. L\'incantesimo finisce se una tua azione o un effetto che crei influenza una creatura diversa da te (o un oggetto indossato/trasportato da altri) oppure se ti allontani più di 300 m dal punto di lancio.' },
    { id: 'desiderio', name: 'Desiderio', level: 9, school: 'Convocazione',
      classes: ['stregone', 'mago'],
      meta: 'Azione · Sé · Istantaneo · V',
      desc: 'Il più potente incantesimo che un mortale possa lanciare: nel suo uso base duplica qualsiasi altro incantesimo di livello 8 o inferiore senza bisogno dei suoi requisiti (comprese componenti costose). In alternativa puoi creare uno tra questi effetti: Creazione di Oggetti (un oggetto non magico fino a 25.000 MO), Salute Istantanea (fino a venti creature recuperano tutti i PF e si liberano degli effetti di Ristorare Superiore), Resistenza (fino a dieci creature ottengono resistenza permanente a un tipo di danno), Immunità Magica (fino a dieci creature immuni per 8 ore a un incantesimo o effetto), o Nuovo Talento (sostituisci uno dei tuoi talenti con un altro per cui sei idoneo). Un uso improprio o eccessivo rischia di logorare per sempre la tua capacità di lanciarlo di nuovo.' },

    /* ===== Mago — incantesimi mancanti ===== */
    { id: 'trova-famiglio', name: 'Trova Famiglio', level: 1, school: 'Convocazione',
      classes: ['mago'],
      meta: '1 ora o Rituale · 3 m · Istantaneo · V, S, M (incenso in combustione da 10+ MO, consumato)',
      desc: 'Ottieni un famiglio, uno spirito che assume una forma animale a tua scelta (Pipistrello, Gatto, Rana, Falco, Lucertola, Polpo, Gufo, Ratto, Corvo, Ragno, Donnola o un\'altra Bestia di GS 0), che appare come un Celestiale, un Folletto o un Immondo. Agisce autonomamente ma obbedisce ai comandi; entro 30 m puoi comunicare telepaticamente con lui e, con un\'azione bonus, vedere e sentire attraverso i suoi sensi fino al tuo prossimo turno. Può anche recapitare i tuoi incantesimi da tocco entro 30 m usando la sua Reazione. In combattimento tira la propria Iniziativa e non può attaccare.' },
    { id: 'disco-fluttuante-di-tenser', name: 'Disco Fluttuante di Tenser', level: 1, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione o Rituale · 9 m · 1 ora · V, S, M (una goccia di mercurio)',
      desc: 'Crei un disco orizzontale di forza, 90 cm di diametro, che fluttua a 90 cm da terra in uno spazio libero entro gittata e può reggere fino a 225 kg (oltre, l\'incantesimo finisce e tutto cade). È immobile finché resti entro 6 m; oltre ti segue restando a 6 m da te, superando dislivelli minori ma non di 3 m o più. Finisce se ti allontani più di 30 m da esso.' },
    { id: 'serratura-arcana', name: 'Serratura Arcana', level: 2, school: 'Abiurazione',
      classes: ['mago'],
      meta: 'Azione · Tocco · Fino a dissoluzione · V, S, M (polvere d\'oro da 25+ MO, consumata)',
      desc: 'Tocchi una porta, una finestra, un cancello, un contenitore o un\'anta chiusi e li chiudi magicamente a chiave: non possono essere aperti con mezzi non magici. Tu e le creature che designi potete aprirli comunque; puoi anche impostare una parola d\'ordine che, pronunciata entro 1,5 m, li sblocca per 1 minuto.' },
    { id: 'freccia-acida-di-melf', name: 'Freccia Acida di Melf', level: 2, school: 'Evocazione',
      classes: ['mago'],
      meta: 'Azione · 27 m · Istantaneo · V, S, M (polvere di rabarbaro)',
      desc: 'Una freccia verde scintillante sfreccia verso un bersaglio entro gittata ed esplode in una spruzzata d\'acido: attacco con incantesimo a distanza, 4d4 acido se colpisci più altri 2d4 alla fine del turno successivo (se manchi, solo metà del danno iniziale). +1d4 a entrambi i danni per ogni slot oltre il 2°.' },
    { id: 'aura-magica-di-nystul', name: 'Aura Magica di Nystul', level: 2, school: 'Illusione',
      classes: ['mago'],
      meta: 'Azione · Tocco · 24 ore · V, S, M (un piccolo quadrato di seta)',
      desc: 'Con un tocco, poni un\'illusione su una creatura volontaria o un oggetto non indossato: una creatura ottiene l\'effetto Maschera (appare a incantesimi e magie come un tipo di creatura diverso da scelta), un oggetto ottiene Falsa Aura (appare magico se non lo è, non magico se lo è, o di una scuola di magia a tua scelta a rilevazioni come Individuazione del Magico). Ripetendo l\'incantesimo sullo stesso bersaglio per 30 giorni consecutivi, l\'illusione dura finché non viene dissolta.' },
    { id: 'trucco-della-corda', name: 'Trucco della Corda', level: 2, school: 'Trasmutazione',
      classes: ['mago'],
      meta: 'Azione · Tocco · 1 ora · V, S, M (un pezzo di corda)',
      desc: 'Tocchi una corda: un\'estremità si solleva finché non pende perpendicolare al suolo o raggiunge un soffitto, aprendo all\'estremità superiore un portale invisibile verso uno spazio extradimensionale che dura finché l\'incantesimo non finisce. Lo spazio, raggiungibile arrampicandosi sulla corda (che può essere issata dentro), ospita fino a otto creature Medie o più piccole; nulla può attraversare la barriera dall\'esterno, ma chi è dentro vede fuori attraverso il portale. Tutto ciò che resta dentro cade fuori quando l\'incantesimo finisce.' },
    { id: 'destriero-fantasma', name: 'Destriero Fantasma', level: 3, school: 'Illusione',
      classes: ['mago'],
      meta: '1 minuto o Rituale · 9 m · 1 ora · V, S',
      desc: 'Una creatura Grande, quasi reale e simile a un cavallo appare in uno spazio libero entro gittata (aspetto a tua scelta, equipaggiata con sella, morso e briglie che svaniscono se allontanate più di 3 m dal destriero). Tu o una creatura a tua scelta potete cavalcarlo per la durata: usa le statistiche del Cavallo da Sella ma con Velocità di 30 m e può percorrere 21 km in un\'ora. Alla fine svanisce gradualmente, dando 1 minuto per smontare; l\'incantesimo finisce prima se il destriero subisce danno.' },
    { id: 'occhio-arcano', name: 'Occhio Arcano', level: 4, school: 'Divinazione',
      classes: ['mago', 'chierico'],
      meta: 'Azione · 9 m · 1 ora CONC · V, S, M (un po\' di pelo di pipistrello)',
      desc: 'Crei un occhio invisibile e invulnerabile che fluttua entro gittata per la durata: ricevi mentalmente le sue informazioni visive (visione in ogni direzione, Scurovisione fino a 9 m). Con un\'azione bonus lo sposti fino a 9 m; le barriere solide bloccano il suo movimento, ma può passare attraverso aperture larghe anche solo 2,5 cm.' },
    { id: 'tentacoli-neri-di-evard', name: 'Tentacoli Neri di Evard', level: 4, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione · 27 m · 1 min CONC · V, S, M (un tentacolo)',
      desc: 'Tentacoli d\'ebano contorti riempiono un\'area di 6 m di lato sul terreno entro gittata, rendendola Terreno Difficile per la durata. Le creature nell\'area fanno TS Forza o subiscono 3d6 contundenti restando Trattenute finché dura (il TS si ripete entrando nell\'area o terminandovi il turno, una volta a turno); una creatura Trattenuta può usare un\'azione per una prova di Forza (Atletica) contro la tua CD e liberarsi.' },
    { id: 'fabbricare', name: 'Fabbricare', level: 4, school: 'Trasmutazione',
      classes: ['mago'],
      meta: '10 minuti · 36 m · Istantaneo · V, S',
      desc: 'Converti materie prime in prodotti dello stesso materiale (es. un ponte di legno da un gruppo di alberi, una corda da canapa, vestiti da lino o lana) che puoi vedere entro gittata: fino a un oggetto Grande (un Cubo di 3 m o otto Cubi da 1,5 m connessi), o Medio se lavori metallo, pietra o altri minerali. Non puoi creare creature, oggetti magici, né armi o armature che richiedano competenza con Strumenti da Artigiano specifici che non possiedi.' },
    { id: 'forziere-segreto-di-leomund', name: 'Forziere Segreto di Leomund', level: 4, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione · Tocco · Fino a dissoluzione · V, S, M (un forziere da 90x60x60 cm di materiali rari da 5.000+ MO, e una replica minuscola dello stesso materiale da 50+ MO)',
      desc: 'Nascondi un forziere e il suo contenuto (fino a 0,34 m³) sul Piano Etereo, toccando sia il forziere sia la replica in miniatura. Mentre resta sul Piano Etereo, con un\'azione magica puoi toccare la replica e richiamarlo in uno spazio libero entro 1,5 m da te, oppure rimandarlo indietro allo stesso modo. Dopo 60 giorni c\'è una probabilità cumulativa del 5% al giorno che l\'incantesimo finisca; finisce anche se lo rilanci o se la replica viene distrutta.' },
    { id: 'segugio-fedele-di-mordenkainen', name: 'Segugio Fedele di Mordenkainen', level: 4, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione · 9 m · 8 ore · V, S, M (un fischietto d\'argento)',
      desc: 'Convochi un segugio spettrale invisibile a tutti tranne te, intangibile e invulnerabile, in uno spazio libero entro gittata: resta per la durata o finché non vi allontanate più di 90 m. Se una creatura Piccola o più grande si avvicina entro 9 m senza pronunciare la parola d\'ordine che scegli, il segugio abbaia rumorosamente (ha Vista Vera fino a 9 m). A inizio di ogni tuo turno tenta di mordere un nemico entro 1,5 m: TS Destrezza o 4d8 forza. Con un\'azione magica nei turni successivi lo sposti fino a 9 m.' },
    { id: 'santuario-privato-di-mordenkainen', name: 'Santuario Privato di Mordenkainen', level: 4, school: 'Abiurazione',
      classes: ['mago'],
      meta: '10 minuti · 36 m · 24 ore · V, S, M (un sottile foglio di piombo)',
      desc: 'Rendi magicamente sicura un\'area entro gittata, un Cubo da 1,5 m fino a 30 m di lato, per la durata. Scegli una o più proprietà: il suono non attraversa il confine; il confine appare buio e nebbioso bloccando la vista (anche Scurovisione); i sensori di Divinazione non possono entrarvi né attraversarlo; le creature dentro non possono essere bersaglio di incantesimi di Divinazione; nulla può teletrasportarsi dentro o fuori; il viaggio planare è bloccato. Lanciandolo nello stesso punto ogni giorno per 365 giorni, diventa permanente.' },
    { id: 'sfera-elastica-di-otiluke', name: 'Sfera Elastica di Otiluke', level: 4, school: 'Abiurazione',
      classes: ['mago'],
      meta: 'Azione · 9 m · 1 min CONC · V, S, M (una sfera di vetro)',
      desc: 'Una sfera scintillante racchiude una creatura o un oggetto Grande o più piccolo entro gittata (una creatura non volontaria fa TS Destrezza o resta racchiusa per la durata). Nulla può attraversare la barriera in nessuna direzione, né energia né effetti; la sfera è immune a ogni danno e protegge ciò che contiene da attacchi esterni (e viceversa). È leggera e puoi farla rotolare spingendola dall\'interno o spostarla dall\'esterno. Un incantesimo Disintegrare mirato alla sfera la distrugge senza danneggiare il contenuto.' },
    { id: 'evocare-costrutto', name: 'Evocare Costrutto', level: 4, school: 'Convocazione',
      classes: ['mago', 'stregone'],
      meta: 'Azione · 27 m · 1 ora CONC · V, S, M (una cassaforte da 400+ MO)',
      desc: 'Evochi lo spirito di un Costrutto (statistiche proprie) scegliendo Argilla, Metallo o Pietra: assomiglia a una statua animata del materiale scelto. Combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi verbali senza bisogno di azione da parte tua; senza ordini si Disimpegna e si muove per evitare pericoli.' },
    { id: 'passamuro', name: 'Passamuro', level: 5, school: 'Trasmutazione',
      classes: ['mago'],
      meta: 'Azione · 9 m · 1 ora · V, S, M (un pizzico di semi di sesamo)',
      desc: 'Un passaggio appare su una superficie di legno, gesso o pietra entro gittata e dura per la durata: scegli le dimensioni dell\'apertura, fino a 1,5 m di larghezza, 2,4 m di altezza e 6 m di profondità, senza destabilizzare la struttura circostante. Quando l\'apertura scompare, chi si trova ancora nel passaggio viene espulso in sicurezza nello spazio libero più vicino.' },
    { id: 'evocare-drago', name: 'Evocare Drago', level: 5, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione · 18 m · 1 ora CONC · V, S, M (un oggetto con l\'immagine di un drago inciso, da 500+ MO)',
      desc: 'Evochi uno spirito Draconico (statistiche proprie) in uno spazio libero entro gittata: combatte al tuo fianco condividendo la tua iniziativa e obbedendo ai tuoi comandi verbali senza bisogno di azione da parte tua; senza ordini si Disimpegna e si muove per evitare pericoli. Sparisce a 0 PF o alla fine dell\'incantesimo.' },
    { id: 'muro-di-forza', name: 'Muro di Forza', level: 5, school: 'Evocazione',
      classes: ['mago', 'stregone'],
      meta: 'Azione · 36 m · 10 min CONC · V, S, M (un frammento di vetro)',
      desc: 'Un muro invisibile di forza pura appare in un punto entro gittata, in qualsiasi orientamento (orizzontale, verticale o inclinato, libero o appoggiato). Puoi formarlo a cupola o globo con raggio fino a 3 m, o come dieci pannelli piani di 3x3 m contigui; è spesso 6 mm e dura per la durata. Nulla può attraversarlo fisicamente: è immune a ogni danno, non dissolvibile con Dissolvi Magie (solo Disintegrare lo distrugge all\'istante) e si estende sul Piano Etereo bloccando anche il viaggio etereo.' },
    { id: 'contingenza', name: 'Contingenza', level: 6, school: 'Abiurazione',
      classes: ['mago'],
      meta: '10 minuti · Sé · 10 giorni · V, S, M (una statuetta di te stesso tempestata di gemme, 1.500+ MO)',
      desc: 'Scegli un incantesimo di livello 5 o inferiore che sai lanciare, con tempo di lancio di un\'azione e che possa avere te come bersaglio: lo lanci come parte di questo incantesimo (consumando entrambi gli slot) senza che abbia effetto subito. Ha effetto solo quando si verifica un innesco che descrivi al lancio, e allora agisce immediatamente su di te soltanto, dopodiché Contingenza finisce. Puoi avere solo una Contingenza attiva alla volta; lanciarla di nuovo termina la precedente, così come la perdita del componente materiale.' },
    { id: 'richiamo-istantaneo-di-drawmij', name: 'Richiamo Istantaneo di Drawmij', level: 6, school: 'Convocazione',
      classes: ['mago'],
      meta: '1 minuto o Rituale · Tocco · Fino a dissoluzione · V, S, M (uno zaffiro da 1.000+ MO)',
      desc: 'Tocchi lo zaffiro usato nel lancio e un oggetto di massimo 4,5 kg e 1,8 m di lunghezza: l\'incantesimo lascia un marchio invisibile sull\'oggetto e incide invisibilmente il suo nome sullo zaffiro (serve uno zaffiro diverso per ogni lancio). In seguito, con un\'azione magica, puoi pronunciare il nome dell\'oggetto e frantumare lo zaffiro: l\'oggetto appare istantaneamente nella tua mano da qualsiasi distanza fisica o planare, e l\'incantesimo finisce. Se un\'altra creatura lo tiene o lo trasporta, frantumare lo zaffiro non lo trasporta ma ti rivela chi è quella creatura e dove si trova.' },
    { id: 'barattolo-magico', name: 'Barattolo Magico', level: 6, school: 'Negromanzia',
      classes: ['mago'],
      meta: '1 minuto · Sé · Fino a dissoluzione · V, S, M (una gemma, un cristallo o un reliquiario da 500+ MO)',
      desc: 'Il tuo corpo cade in uno stato catatonico mentre la tua anima lo lascia ed entra nel contenitore usato come componente materiale: percepisci i dintorni come se fossi nello spazio del contenitore, ma non puoi muoverti né usare Reazioni. Puoi solo proiettare la tua anima fino a 30 m fuori dal contenitore, tornando al tuo corpo (terminando l\'incantesimo) oppure tentando di possedere un Umanoide entro 30 m che vedi (non protetto da Protezione dal Male e dal Bene o Cerchio Magico): fa TS Carisma, e se fallisce la tua anima entra nel suo corpo mentre la sua resta intrappolata nel contenitore.' },
    { id: 'muro-di-ghiaccio', name: 'Muro di Ghiaccio', level: 6, school: 'Evocazione',
      classes: ['mago'],
      meta: 'Azione · 36 m · 10 min CONC · V, S, M (un pezzo di quarzo)',
      desc: 'Crei un muro di ghiaccio su una superficie solida entro gittata: a cupola o globo di raggio fino a 3 m, oppure dieci pannelli di 3x3 m contigui, spesso 30 cm per la durata. Se attraversa lo spazio di una creatura al comparire, questa viene spinta di lato e fa TS Destrezza, subendo 10d6 freddo se fallisce (metà se supera). È un oggetto distruttibile (CA 12, 30 PF per sezione di 3 m, immune a freddo/veleno/psichico, vulnerabile al fuoco): distruggere una sezione lascia una lastra d\'aria gelida che infligge 5d6 freddo a chi l\'attraversa per la prima volta in un turno.' },
    { id: 'sequestro', name: 'Sequestro', level: 7, school: 'Trasmutazione',
      classes: ['mago'],
      meta: 'Azione · Tocco · Fino a dissoluzione · V, S, M (polvere di gemme da 5.000+ MO, consumata)',
      desc: 'Con un tocco, sequestri magicamente un oggetto o una creatura volontaria: per la durata il bersaglio è Invisibile e non può essere bersaglio di Divinazioni né rilevato o osservato a distanza con la magia. Se è una creatura, entra in animazione sospesa (Incosciente, non invecchia, non ha bisogno di cibo, acqua o aria). Puoi fissare una condizione per terminare l\'incantesimo in anticipo (deve verificarsi o essere visibile entro 1,6 km dal bersaglio); finisce anche se il bersaglio subisce danno.' },
    { id: 'simulacro', name: 'Simulacro', level: 7, school: 'Illusione',
      classes: ['mago'],
      meta: '12 ore · Tocco · Fino a dissoluzione · V, S, M (rubino in polvere da 1.500+ MO, consumato)',
      desc: 'Crei un simulacro di una Bestia o un Umanoide entro 3 m da te per l\'intera durata del lancio, usando neve o ghiaccio delle stesse dimensioni della creatura: diventa una copia che usa le statistiche dell\'originale ma è un Costrutto, ha metà dei PF massimi e non può lanciare questo incantesimo. È Amichevole verso di te e chi designi, agisce nel tuo turno e obbedisce ai comandi, ma non guadagna livelli né riposa. Se danneggiato, si ripara solo durante un tuo riposo lungo spendendo componenti (100 MO a PF) restando entro 1,5 m da te. A 0 PF torna neve e si scioglie; lanciando di nuovo l\'incantesimo, ogni simulacro precedente viene distrutto.' },
    { id: 'clone', name: 'Clone', level: 8, school: 'Negromanzia',
      classes: ['mago'],
      meta: '1 ora · Tocco · Istantaneo · V, S, M (un diamante da 1.000+ MO, consumato, e un contenitore sigillabile da 2.000+ MO abbastanza grande da contenere la creatura clonata)',
      desc: 'Tocchi una creatura (o almeno 2,5 cm³ della sua carne): un duplicato inerte si forma nel contenitore e completa la crescita dopo 120 giorni (scegli l\'età). Resta inerte indefinitamente finché il contenitore non viene disturbato. Se l\'originale muore dopo che il clone è completo, la sua anima vi si trasferisce se libera e disposta: il clone è fisicamente identico, con la stessa personalità, memorie e abilità, ma senza l\'equipaggiamento originale (i resti dell\'originale diventano inerti e non rianimabili).' },
    { id: 'labirinto', name: 'Labirinto', level: 8, school: 'Convocazione',
      classes: ['mago'],
      meta: 'Azione · 18 m · 10 min CONC · V, S',
      desc: 'Bandisci una creatura che vedi entro gittata in un semipiano labirintico: vi resta per la durata o finché non fugge. Con un\'azione di studio può tentare una prova di Intelligenza (Indagare) CD 20 per fuggire; in caso di successo, l\'incantesimo finisce. Alla fine dell\'incantesimo, il bersaglio riappare nello spazio che aveva lasciato o nel più vicino spazio libero.' },
    { id: 'telepatia', name: 'Telepatia', level: 8, school: 'Divinazione',
      classes: ['mago'],
      meta: 'Azione · Illimitata · 24 ore · V, S, M (un paio di anelli d\'argento collegati)',
      desc: 'Crei un legame telepatico tra te e una creatura volontaria che conosci, ovunque si trovi sullo stesso piano di esistenza (finisce se non siete più sullo stesso piano). Finché dura, potete scambiarvi istantaneamente parole, immagini, suoni e altri messaggi sensoriali attraverso il legame, e il bersaglio ti riconosce come l\'entità con cui comunica; l\'incantesimo gli permette di comprendere il significato di ciò che invii.' }
  ],

  /* Catalogo talenti (Step 4.3) — mappa per id, come classes/species.
     Selezione curata ed estendibile, riassunti originali in italiano,
     verificati sul PHB 2024. Non ancora consumati da nessuna vista/motore
     (il sync verso Firestore è lo Step 4.4, separato). */
  /* Proprietà di maestria (PHB 2024, "Mastery Properties"). I NOMI restano in
     inglese come già nell'app (`weapon.mastery: 'Vex'`): il manuale di
     riferimento è in inglese e non c'è una fonte italiana ufficiale da seguire
     (decisione 2026-07-27). Le descrizioni sono riassunti originali in
     italiano. Si sbloccano solo con un privilegio tipo Maestria nelle Armi. */
  /* Armature (PHB 2024, cap. 6). Erano 4 sole, scritte in `engine.js`; ora
     stanno nei dati con CA, requisito di Forza, furtivita, peso e costo, cosi
     il wizard e l editor della scheda possono mostrare quanto vale davvero
     un armatura invece del solo nome (5.B.5).
     dexCap: null = bonus DES pieno (leggere), un numero = tetto al bonus
     (medie), 0 = il modificatore DES non si applica (pesanti). Gli id delle
     quattro gia in uso non cambiano: stanno negli stati salvati. */
  armors: [
    { id: 'imbottita', name: 'Imbottita', cat: 'leggera', baseAc: 11, dexCap: null, stealth: false, weight: 8, cost: 5 },
    { id: 'cuoio', name: 'Cuoio', cat: 'leggera', baseAc: 11, dexCap: null, stealth: true, weight: 10, cost: 10 },
    { id: 'cuoio-borchiato', name: 'Cuoio Borchiato', cat: 'leggera', baseAc: 12, dexCap: null, stealth: true, weight: 13, cost: 45 },
    { id: 'pelle', name: 'Pelle', cat: 'media', baseAc: 12, dexCap: 2, stealth: true, weight: 12, cost: 10 },
    { id: 'camicia-maglia', name: 'Camicia di Maglia', cat: 'media', baseAc: 13, dexCap: 2, stealth: true, weight: 20, cost: 50 },
    { id: 'scaglie', name: 'Corazza a Scaglie', cat: 'media', baseAc: 14, dexCap: 2, stealth: false, weight: 45, cost: 50 },
    { id: 'corazza', name: 'Corazza di Piastre', cat: 'media', baseAc: 14, dexCap: 2, stealth: true, weight: 20, cost: 400 },
    { id: 'mezza-piastra', name: 'Mezza Piastra', cat: 'media', baseAc: 15, dexCap: 2, stealth: false, weight: 40, cost: 750 },
    { id: 'anelli', name: 'Cotta ad Anelli', cat: 'pesante', baseAc: 14, dexCap: 0, stealth: false, weight: 40, cost: 30 },
    { id: 'cotta-maglia', name: 'Cotta di Maglia', cat: 'pesante', baseAc: 16, dexCap: 0, stealth: false, strReq: 13, weight: 55, cost: 75 },
    { id: 'strisce', name: 'Corazza a Strisce', cat: 'pesante', baseAc: 17, dexCap: 0, stealth: false, strReq: 15, weight: 60, cost: 200 },
    { id: 'piastre', name: 'Piastre', cat: 'pesante', baseAc: 18, dexCap: 0, stealth: false, strReq: 15, weight: 65, cost: 1500 }
  ],

  shield: { name: 'Scudo', ac: 2, weight: 6, cost: 10 },

  /* Talenti d'origine (PHB 2024, cap. 5): li dà il background, uno fisso
     ciascuno, e valgono dal livello 1. Riassunti originali in italiano.
     `needsChoice` segnala quelli che chiedono ancora qualcosa all'utente —
     oggi solo Iniziato alla Magia, che vuole 2 trucchetti e 1 incantesimo di
     1° livello dalla lista indicata (5.B.4: la scelta arriva col passo). */
  originFeats: {
    allerta: { name: 'Allerta',
      desc: 'Aggiungi il bonus di competenza all\'iniziativa. Inoltre, tirata l\'iniziativa, puoi scambiare il tuo risultato con quello di un alleato consenziente.' },
    artigiano: { name: 'Artigiano',
      desc: 'Competenza con tre tipi di strumenti da artigiano a scelta. Compri oggetti non magici con il 20% di sconto e, con un riposo lungo, puoi fabbricare un oggetto semplice fra quelli elencati dal talento.' },
    guaritore: { name: 'Guaritore',
      desc: 'Con un\'azione Utilizza spendi una carica del kit da guaritore per far recuperare a una creatura entro 1,5 m il suo dado vita + il modificatore di Costituzione in PF. Quando tiri i dadi per curare, ogni 1 va ritirato una volta.' },
    fortunato: { name: 'Fortunato',
      desc: 'Hai punti Fortuna pari al tuo bonus di competenza, che recuperi col riposo lungo. Spendendone uno puoi darti vantaggio a un tiro per colpire, una prova o un TS, oppure svantaggio a chi attacca te.' },
    'iniziato-alla-magia': { name: 'Iniziato alla Magia', needsChoice: true,
      desc: 'Impari 2 trucchetti e 1 incantesimo di 1° livello dalla lista della classe indicata dal background. L\'incantesimo lo lanci gratis una volta a riposo lungo, oppure spendendo slot se ne hai. La caratteristica da incantatore è quella della lista scelta.' },
    musicista: { name: 'Musicista',
      desc: 'Competenza con tre strumenti musicali a scelta. Dopo un riposo dai ispirazione a un numero di alleati che ti hanno sentito suonare pari al tuo bonus di competenza.' },
    'attaccante-selvaggio': { name: 'Attaccante Selvaggio',
      desc: 'Una volta per turno, quando colpisci con un\'arma, puoi ritirare i dadi dei danni e usare il risultato che preferisci.' },
    esperto: { name: 'Esperto',
      desc: 'Ottieni competenza in tre elementi a scelta fra abilità e strumenti.' },
    rissaiolo: { name: 'Rissaiolo',
      desc: 'Competenza con gli attrezzi da improvvisare come armi. I tuoi colpi senz\'armi infliggono 1d4 contundenti e, quando colpisci con un colpo senz\'armi o un\'arma improvvisata, una volta per turno puoi spingere il bersaglio di 1,5 m.' },
    tenace: { name: 'Tenace',
      desc: 'I tuoi punti ferita massimi aumentano di 2 per livello, ora e a ogni livello successivo.' }
  },

  /* I 16 background del PHB 2024 (pag. 177-184 del PDF). Ognuno dà: tre
     caratteristiche su cui distribuire +2 e +1 (oppure +1/+1/+1), un talento
     d'origine, due competenze in abilità, una competenza in strumenti e un
     equipaggiamento A/B. `tool` è una stringa fissa; `toolChoice` indica invece
     una famiglia da cui scegliere. Riassunti e nomi in italiano. */
  /* Destriero Ultraterreno (incantesimo Trova Destriero, PHB 2024 — statblock
     a pag. 272 del PDF). Era scritto fisso in index.html coi numeri di
     Tharion: CA 12, +7 al colpire, CD 15, bonus competenza +3. Quasi tutto
     scala col livello dello slot usato per evocarlo, e attacco/CD sono quelli
     di chi lo evoca — quindi vive qui e la scheda lo calcola. */
  findSteed: {
    name: 'Destriero Ultraterreno',
    acBase: 10,        // CA = acBase + livello dello slot
    hpBase: 5, hpPerLevel: 10,
    speed: '18 m',
    flySpeed: '18 m',
    flyFromSlot: 4,    // il volo richiede uno slot di 4° o superiore
    passivePerception: 11,
    telepathy: '1,6 km',
    abilities: { FOR: 18, DES: 12, COS: 14, INT: 6, SAG: 12, CAR: 8 },
    slam: {
      name: 'Schianto Ultraterreno',
      desc: 'Attacco da mischia, portata 1,5 m. Il bonus al colpire è il tuo bonus di attacco con incantesimi; i danni sono 1d8 + il livello dello slot, del tipo dato dalla forma.'
    },
    lifeBond: {
      name: 'Legame Vitale',
      desc: 'Quando recuperi PF da un incantesimo di 1° livello o superiore e il destriero è entro 1,5 m, recupera i tuoi stessi PF. In combattimento condivide la tua iniziativa ed è una cavalcatura controllata.'
    },
    forms: [
      { id: 'celestiale', name: 'Celestiale', damage: 'Radioso', tagClass: 'g',
        action: 'Tocco Guaritore',
        desc: 'Azione bonus, ricarica al riposo lungo: una creatura entro 1,5 m recupera 2d8 + il livello dello slot PF.' },
      { id: 'folletto', name: 'Folletto (Fey)', damage: 'Psichico', tagClass: '',
        action: 'Passo Fatato',
        desc: 'Azione bonus, ricarica al riposo lungo: il destriero si teletrasporta, con te in sella, in uno spazio libero entro 18 m.' },
      { id: 'immondo', name: 'Immondo (Fiend)', damage: 'Necrotico', tagClass: 'c',
        action: 'Sguardo Maligno',
        desc: 'Azione bonus, ricarica al riposo lungo: una creatura entro 18 m che il destriero vede fa un TS Saggezza contro la tua CD incantesimi, o è Spaventata fino alla fine del tuo prossimo turno.' }
    ]
  },

  /* Peso degli oggetti comuni che arrivano dai pacchetti dei background, in
     libbre (PHB 2024: tabella dell'equipaggiamento a pag. 222 e voci degli
     strumenti a pag. 219-220). Le chiavi sono i nomi esatti usati in
     `backgrounds[*].equipment`, e il valore è il peso TOTALE di quella voce —
     "2 Borse" pesa per due. Senza questi, la roba del background entrava in
     sacca con peso 0 e il carico trasportato era sbagliato.
     `null` = il manuale non gli dà un peso (pergamena, profumo, munizioni) o
     dipende dalla forma scelta (set da gioco, strumento musicale, strumenti da
     artigiano): restano a 0 dichiaratamente, non per dimenticanza. */
  gearWeights: {
    'Abiti da viaggio': 4,
    'Abiti eleganti': 6,
    'Arco corto': 2,
    'Arnesi da scasso': 1,
    'Balestra leggera': 5,
    'Bastone ferrato': 4,
    'Corda': 5,
    'Costume': 4,
    '2 Costumi': 8,
    '2 Borse': 2,
    '2 Pugnali': 2,
    'Pugnale': 1,
    'Falcetto': 2,
    'Faretra': 1,
    'Giaciglio': 7,
    'Kit da erborista': 3,
    'Kit da falsario': 5,
    'Kit da guaritore': 3,
    'Lampada': 1,
    'Lancia': 3,
    'Lanterna schermata': 2,
    'Libro di filosofia': 5,
    'Libro di preghiere': 5,
    'Libro di storia': 5,
    'Manette': 6,
    'Olio (3 fiaschette)': 3,
    'Pala': 5,
    'Pentola di ferro': 10,
    'Piede di porco': 5,
    'Simbolo sacro': 1,
    'Specchio': 0.5,
    'Strumenti da calligrafo': 5,
    'Strumenti da carpentiere': 6,
    'Strumenti da cartografo': 6,
    'Strumenti da navigatore': 2,
    'Tenda': 20,
    'Veste': 4,
    '20 Dardi': null,
    '20 Frecce': null,
    'Pergamena (8 fogli)': null,
    'Pergamena (10 fogli)': null,
    'Pergamena (12 fogli)': null,
    'Profumo': null,
    'Set da gioco': null,
    'Strumenti da artigiano': null,
    'Strumento musicale': null
  },

  backgrounds: {
    accolito: { name: 'Accolito', abilities: ['INT', 'SAG', 'CAR'], featId: 'iniziato-alla-magia',
      featNote: 'lista del Chierico', featList: 'chierico', skills: ['intuizione', 'religione'],
      tool: 'Strumenti da calligrafo',
      equipment: { a: { label: 'Kit del tempio', items: ['Strumenti da calligrafo', 'Libro di preghiere', 'Simbolo sacro', 'Pergamena (10 fogli)', 'Veste'], coins: { mo: 8 } }, b: { coins: { mo: 50 } } } },
    artigiano: { name: 'Artigiano', abilities: ['FOR', 'DES', 'INT'], featId: 'artigiano',
      skills: ['indagare', 'persuasione'],
      toolChoice: 'Strumenti da artigiano',
      equipment: { a: { label: 'Kit della bottega', items: ['Strumenti da artigiano', '2 Borse', 'Abiti da viaggio'], coins: { mo: 32 } }, b: { coins: { mo: 50 } } } },
    ciarlatano: { name: 'Ciarlatano', abilities: ['DES', 'COS', 'CAR'], featId: 'esperto',
      skills: ['inganno', 'rapidita-di-mano'],
      tool: 'Kit da falsario',
      equipment: { a: { label: 'Kit del truffatore', items: ['Kit da falsario', 'Costume', 'Abiti eleganti'], coins: { mo: 15 } }, b: { coins: { mo: 50 } } } },
    criminale: { name: 'Criminale', abilities: ['DES', 'COS', 'INT'], featId: 'allerta',
      skills: ['rapidita-di-mano', 'furtivita'],
      tool: 'Arnesi da scasso',
      equipment: { a: { label: 'Kit del ladro', items: ['2 Pugnali', 'Arnesi da scasso', 'Piede di porco', '2 Borse', 'Abiti da viaggio'], coins: { mo: 16 } }, b: { coins: { mo: 50 } } } },
    intrattenitore: { name: 'Intrattenitore', abilities: ['FOR', 'DES', 'CAR'], featId: 'musicista',
      skills: ['acrobazia', 'intrattenere'],
      toolChoice: 'Strumento musicale',
      equipment: { a: { label: 'Kit del palco', items: ['Strumento musicale', '2 Costumi', 'Specchio', 'Profumo', 'Abiti da viaggio'], coins: { mo: 11 } }, b: { coins: { mo: 50 } } } },
    contadino: { name: 'Contadino', abilities: ['FOR', 'COS', 'SAG'], featId: 'tenace',
      skills: ['addestrare-animali', 'natura'],
      tool: 'Strumenti da carpentiere',
      equipment: { a: { label: 'Kit del campo', items: ['Falcetto', 'Strumenti da carpentiere', 'Kit da guaritore', 'Pentola di ferro', 'Pala', 'Abiti da viaggio'], coins: { mo: 30 } }, b: { coins: { mo: 50 } } } },
    guardia: { name: 'Guardia', abilities: ['FOR', 'INT', 'SAG'], featId: 'allerta',
      skills: ['atletica', 'percezione'],
      toolChoice: 'Set da gioco',
      equipment: { a: { label: 'Kit della torre', items: ['Lancia', 'Balestra leggera', '20 Dardi', 'Set da gioco', 'Lanterna schermata', 'Manette', 'Faretra', 'Abiti da viaggio'], coins: { mo: 12 } }, b: { coins: { mo: 50 } } } },
    guida: { name: 'Guida', abilities: ['DES', 'COS', 'SAG'], featId: 'iniziato-alla-magia',
      featNote: 'lista del Druido', featList: 'druido', skills: ['furtivita', 'sopravvivenza'],
      tool: 'Strumenti da cartografo',
      equipment: { a: { label: 'Kit del sentiero', items: ['Arco corto', '20 Frecce', 'Strumenti da cartografo', 'Giaciglio', 'Faretra', 'Tenda', 'Abiti da viaggio'], coins: { mo: 3 } }, b: { coins: { mo: 50 } } } },
    eremita: { name: 'Eremita', abilities: ['COS', 'SAG', 'CAR'], featId: 'guaritore',
      skills: ['medicina', 'religione'],
      tool: 'Kit da erborista',
      equipment: { a: { label: 'Kit del rifugio', items: ['Bastone ferrato', 'Kit da erborista', 'Giaciglio', 'Libro di filosofia', 'Lampada', 'Olio (3 fiaschette)', 'Abiti da viaggio'], coins: { mo: 16 } }, b: { coins: { mo: 50 } } } },
    mercante: { name: 'Mercante', abilities: ['COS', 'INT', 'CAR'], featId: 'fortunato',
      skills: ['addestrare-animali', 'persuasione'],
      tool: 'Strumenti da navigatore',
      equipment: { a: { label: 'Kit della carovana', items: ['Strumenti da navigatore', '2 Borse', 'Abiti da viaggio'], coins: { mo: 22 } }, b: { coins: { mo: 50 } } } },
    nobile: { name: 'Nobile', abilities: ['FOR', 'INT', 'CAR'], featId: 'esperto',
      skills: ['storia', 'persuasione'],
      toolChoice: 'Set da gioco',
      equipment: { a: { label: 'Kit di corte', items: ['Set da gioco', 'Abiti eleganti', 'Profumo'], coins: { mo: 29 } }, b: { coins: { mo: 50 } } } },
    studioso: { name: 'Studioso', abilities: ['COS', 'INT', 'SAG'], featId: 'iniziato-alla-magia',
      featNote: 'lista del Mago', featList: 'mago', skills: ['arcano', 'storia'],
      tool: 'Strumenti da calligrafo',
      equipment: { a: { label: 'Kit dello scriptorium', items: ['Bastone ferrato', 'Strumenti da calligrafo', 'Libro di storia', 'Pergamena (8 fogli)', 'Veste'], coins: { mo: 8 } }, b: { coins: { mo: 50 } } } },
    marinaio: { name: 'Marinaio', abilities: ['FOR', 'DES', 'SAG'], featId: 'rissaiolo',
      skills: ['acrobazia', 'percezione'],
      tool: 'Strumenti da navigatore',
      equipment: { a: { label: 'Kit di bordo', items: ['Pugnale', 'Strumenti da navigatore', 'Corda', 'Abiti da viaggio'], coins: { mo: 20 } }, b: { coins: { mo: 50 } } } },
    scriba: { name: 'Scriba', abilities: ['DES', 'INT', 'SAG'], featId: 'esperto',
      skills: ['indagare', 'percezione'],
      tool: 'Strumenti da calligrafo',
      equipment: { a: { label: 'Kit dello scriba', items: ['Strumenti da calligrafo', 'Abiti eleganti', 'Lampada', 'Olio (3 fiaschette)', 'Pergamena (12 fogli)'], coins: { mo: 23 } }, b: { coins: { mo: 50 } } } },
    soldato: { name: 'Soldato', abilities: ['FOR', 'DES', 'COS'], featId: 'attaccante-selvaggio',
      skills: ['atletica', 'intimidire'],
      toolChoice: 'Set da gioco',
      equipment: { a: { label: 'Kit della compagnia', items: ['Lancia', 'Arco corto', '20 Frecce', 'Set da gioco', 'Kit da guaritore', 'Faretra', 'Abiti da viaggio'], coins: { mo: 14 } }, b: { coins: { mo: 50 } } } },
    vagabondo: { name: 'Vagabondo', abilities: ['DES', 'SAG', 'CAR'], featId: 'fortunato',
      skills: ['intuizione', 'furtivita'],
      tool: 'Arnesi da scasso',
      equipment: { a: { label: 'Kit della strada', items: ['2 Pugnali', 'Arnesi da scasso', 'Set da gioco', 'Giaciglio', '2 Borse', 'Abiti da viaggio'], coins: { mo: 16 } }, b: { coins: { mo: 50 } } } }
  },

  weaponMasteries: {
    Cleave: { name: 'Cleave', desc: 'Colpendo in mischia puoi fare un secondo attacco contro un altro nemico entro 1,5 m dal primo e a portata; il secondo non somma il tuo modificatore ai danni (se non è negativo). Una volta per turno.' },
    Graze: { name: 'Graze', desc: 'Se manchi il bersaglio, gli infliggi comunque danni pari al modificatore di caratteristica usato per l attacco, dello stesso tipo dell arma.' },
    Nick: { name: 'Nick', desc: 'L attacco extra della proprietà Leggera lo fai dentro l azione di Attacco invece che con l azione bonus. Una volta per turno.' },
    Push: { name: 'Push', desc: 'Colpendo una creatura Grande o più piccola puoi spingerla fino a 3 m in linea retta lontano da te.' },
    Sap: { name: 'Sap', desc: 'La creatura colpita ha svantaggio al suo prossimo tiro per colpire, fino all inizio del tuo turno successivo.' },
    Slow: { name: 'Slow', desc: 'Se colpisci e infliggi danni, la velocità del bersaglio cala di 3 m fino all inizio del tuo turno successivo; più colpi non sommano la riduzione.' },
    Topple: { name: 'Topple', desc: 'Colpendo, il bersaglio fa un TS Costituzione (CD 8 + il modificatore usato per l attacco + il tuo bonus di competenza): se fallisce cade Prono.' },
    Vex: { name: 'Vex', desc: 'Se colpisci e infliggi danni, hai vantaggio al tuo prossimo tiro per colpire contro quella creatura, entro la fine del tuo turno successivo.' }
  },

  /* Tabella delle armi (PHB 2024, cap. 6). Serve al passo Equipaggiamento e
     alla scelta della Maestria in creazione, e all editor della scheda: prima
     arma, dado, tipo e maestria erano campi di testo liberi (5.B.5).
     cat: 'sem-mis' | 'sem-dist' | 'gue-mis' | 'gue-dist' (semplice/da guerra,
     mischia/distanza) — la competenza di classe si esprime su queste.
     cost = in monete d oro (0.1 = 1 MA, 0.05 = 5 MR); weight in libbre. */
  weapons: [
    { id: 'clava', name: 'Clava', cat: 'sem-mis', die: '1d4', dmg: 'cont.', props: ['Leggera'], mastery: 'Slow', weight: 2, cost: 0.1 },
    { id: 'pugnale', name: 'Pugnale', cat: 'sem-mis', die: '1d4', dmg: 'perf.', props: ['Accurata', 'Leggera', 'Lanciabile (6/18 m)'], mastery: 'Nick', weight: 1, cost: 2 },
    { id: 'randello', name: 'Randello', cat: 'sem-mis', die: '1d8', dmg: 'cont.', props: ['A due mani'], mastery: 'Push', weight: 10, cost: 0.2 },
    { id: 'ascia-da-lancio', name: 'Ascia da lancio', cat: 'sem-mis', die: '1d6', dmg: 'tagl.', props: ['Leggera', 'Lanciabile (6/18 m)'], mastery: 'Vex', weight: 2, cost: 5 },
    { id: 'giavellotto', name: 'Giavellotto', cat: 'sem-mis', die: '1d6', dmg: 'perf.', props: ['Lanciabile (9/36 m)'], mastery: 'Slow', weight: 2, cost: 0.5 },
    { id: 'martello-leggero', name: 'Martello leggero', cat: 'sem-mis', die: '1d4', dmg: 'cont.', props: ['Leggera', 'Lanciabile (6/18 m)'], mastery: 'Nick', weight: 2, cost: 2 },
    { id: 'mazza', name: 'Mazza', cat: 'sem-mis', die: '1d6', dmg: 'cont.', props: [], mastery: 'Sap', weight: 4, cost: 5 },
    { id: 'bastone-ferrato', name: 'Bastone ferrato', cat: 'sem-mis', die: '1d6', dmg: 'cont.', props: ['Versatile (1d8)'], mastery: 'Topple', weight: 4, cost: 0.2 },
    { id: 'falcetto', name: 'Falcetto', cat: 'sem-mis', die: '1d4', dmg: 'tagl.', props: ['Leggera'], mastery: 'Nick', weight: 2, cost: 1 },
    { id: 'lancia', name: 'Lancia', cat: 'sem-mis', die: '1d6', dmg: 'perf.', props: ['Lanciabile (6/18 m)', 'Versatile (1d8)'], mastery: 'Sap', weight: 3, cost: 1 },
    { id: 'dardo', name: 'Dardo', cat: 'sem-dist', die: '1d4', dmg: 'perf.', props: ['Accurata', 'Lanciabile (6/18 m)'], mastery: 'Vex', weight: 0.25, cost: 0.05 },
    { id: 'balestra-leggera', name: 'Balestra leggera', cat: 'sem-dist', die: '1d8', dmg: 'perf.', props: ['Munizioni (24/96 m)', 'Ricarica', 'A due mani'], mastery: 'Slow', weight: 5, cost: 25 },
    { id: 'arco-corto', name: 'Arco corto', cat: 'sem-dist', die: '1d6', dmg: 'perf.', props: ['Munizioni (24/96 m)', 'A due mani'], mastery: 'Vex', weight: 2, cost: 25 },
    { id: 'fionda', name: 'Fionda', cat: 'sem-dist', die: '1d4', dmg: 'cont.', props: ['Munizioni (9/36 m)'], mastery: 'Slow', weight: 0, cost: 0.1 },
    { id: 'ascia-da-battaglia', name: 'Ascia da battaglia', cat: 'gue-mis', die: '1d8', dmg: 'tagl.', props: ['Versatile (1d10)'], mastery: 'Topple', weight: 4, cost: 10 },
    { id: 'mazzafrusto', name: 'Mazzafrusto', cat: 'gue-mis', die: '1d8', dmg: 'cont.', props: [], mastery: 'Sap', weight: 2, cost: 10 },
    { id: 'flagello', name: 'Flagello', cat: 'gue-mis', die: '1d8', dmg: 'cont.', props: [], mastery: 'Sap', weight: 2, cost: 10 },
    { id: 'falcione', name: 'Falcione', cat: 'gue-mis', die: '1d10', dmg: 'tagl.', props: ['Pesante', 'Portata', 'A due mani'], mastery: 'Graze', weight: 6, cost: 20 },
    { id: 'ascia-bipenne', name: 'Ascia bipenne', cat: 'gue-mis', die: '1d12', dmg: 'tagl.', props: ['Pesante', 'A due mani'], mastery: 'Cleave', weight: 7, cost: 30 },
    { id: 'spadone', name: 'Spadone', cat: 'gue-mis', die: '2d6', dmg: 'tagl.', props: ['Pesante', 'A due mani'], mastery: 'Graze', weight: 6, cost: 50 },
    { id: 'alabarda', name: 'Alabarda', cat: 'gue-mis', die: '1d10', dmg: 'tagl.', props: ['Pesante', 'Portata', 'A due mani'], mastery: 'Cleave', weight: 6, cost: 20 },
    { id: 'lancia-da-cavaliere', name: 'Lancia da cavaliere', cat: 'gue-mis', die: '1d10', dmg: 'perf.', props: ['Pesante', 'Portata', 'A due mani (se non sei in sella)'], mastery: 'Topple', weight: 6, cost: 10 },
    { id: 'spada-lunga', name: 'Spada lunga', cat: 'gue-mis', die: '1d8', dmg: 'tagl.', props: ['Versatile (1d10)'], mastery: 'Sap', weight: 3, cost: 15 },
    { id: 'maglio', name: 'Maglio', cat: 'gue-mis', die: '2d6', dmg: 'cont.', props: ['Pesante', 'A due mani'], mastery: 'Topple', weight: 10, cost: 10 },
    { id: 'stella-del-mattino', name: 'Stella del mattino', cat: 'gue-mis', die: '1d8', dmg: 'perf.', props: [], mastery: 'Sap', weight: 4, cost: 15 },
    { id: 'picca', name: 'Picca', cat: 'gue-mis', die: '1d10', dmg: 'perf.', props: ['Pesante', 'Portata', 'A due mani'], mastery: 'Push', weight: 18, cost: 5 },
    { id: 'stocco', name: 'Stocco', cat: 'gue-mis', die: '1d8', dmg: 'perf.', props: ['Accurata'], mastery: 'Vex', weight: 2, cost: 25 },
    { id: 'scimitarra', name: 'Scimitarra', cat: 'gue-mis', die: '1d6', dmg: 'tagl.', props: ['Accurata', 'Leggera'], mastery: 'Nick', weight: 3, cost: 25 },
    { id: 'spada-corta', name: 'Spada corta', cat: 'gue-mis', die: '1d6', dmg: 'perf.', props: ['Accurata', 'Leggera'], mastery: 'Vex', weight: 2, cost: 10 },
    { id: 'tridente', name: 'Tridente', cat: 'gue-mis', die: '1d8', dmg: 'perf.', props: ['Lanciabile (6/18 m)', 'Versatile (1d10)'], mastery: 'Topple', weight: 4, cost: 5 },
    { id: 'martello-da-guerra', name: 'Martello da guerra', cat: 'gue-mis', die: '1d8', dmg: 'cont.', props: ['Versatile (1d10)'], mastery: 'Push', weight: 5, cost: 15 },
    { id: 'piccone-da-guerra', name: 'Piccone da guerra', cat: 'gue-mis', die: '1d8', dmg: 'perf.', props: ['Versatile (1d10)'], mastery: 'Sap', weight: 2, cost: 5 },
    { id: 'frusta', name: 'Frusta', cat: 'gue-mis', die: '1d4', dmg: 'tagl.', props: ['Accurata', 'Portata'], mastery: 'Slow', weight: 3, cost: 2 },
    { id: 'cerbottana', name: 'Cerbottana', cat: 'gue-dist', die: '1', dmg: 'perf.', props: ['Munizioni (7,5/30 m)', 'Ricarica'], mastery: 'Vex', weight: 1, cost: 10 },
    { id: 'balestra-a-mano', name: 'Balestra a mano', cat: 'gue-dist', die: '1d6', dmg: 'perf.', props: ['Munizioni (9/36 m)', 'Leggera', 'Ricarica'], mastery: 'Vex', weight: 3, cost: 75 },
    { id: 'balestra-pesante', name: 'Balestra pesante', cat: 'gue-dist', die: '1d10', dmg: 'perf.', props: ['Munizioni (30/120 m)', 'Pesante', 'Ricarica', 'A due mani'], mastery: 'Push', weight: 18, cost: 50 },
    { id: 'arco-lungo', name: 'Arco lungo', cat: 'gue-dist', die: '1d8', dmg: 'perf.', props: ['Munizioni (45/180 m)', 'Pesante', 'A due mani'], mastery: 'Slow', weight: 2, cost: 50 },
    { id: 'moschetto', name: 'Moschetto', cat: 'gue-dist', die: '1d12', dmg: 'perf.', props: ['Munizioni (12/36 m)', 'Ricarica', 'A due mani'], mastery: 'Slow', weight: 10, cost: 500 },
    { id: 'pistola', name: 'Pistola', cat: 'gue-dist', die: '1d10', dmg: 'perf.', props: ['Munizioni (9/27 m)', 'Ricarica'], mastery: 'Vex', weight: 3, cost: 250 }
  ],

  feats: {
    'stile-difesa': {
      name: 'Difesa', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Mentre indossi un\'armatura (leggera, media o pesante), ottieni +1 alla Classe Armatura.'
    },
    'stile-duello': {
      name: 'Duello', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando impugni un\'arma da mischia in una mano e nessun\'altra arma, ottieni +2 ai tiri per i danni con quell\'arma.'
    },
    'stile-arma-grande': {
      name: 'Combattere con Arma Grande', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando tiri i danni di un attacco con un\'arma da mischia impugnata a due mani, puoi trattare come 3 ogni 1 o 2 ottenuto sui dadi del danno. L\'arma deve avere la proprietà A Due Mani o Versatile.'
    },
    'stile-protezione': {
      name: 'Protezione', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando una creatura che vedi attacca un bersaglio diverso da te entro 1,5 m, puoi usare una reazione per interporre lo scudo (se lo impugni) e imporre svantaggio al tiro per colpire.'
    },
    'stile-tiro': {
      name: 'Tiro', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Ottieni +2 ai tiri per colpire con le armi a distanza.'
    },
    'stile-cieca': {
      name: 'Combattere alla Cieca', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Hai Vista Cieca con una portata di 3 m.'
    },
    'stile-intercettazione': {
      name: 'Intercettazione', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando una creatura che vedi colpisce con un attacco un\'altra creatura entro 1,5 m da te, puoi usare una reazione per ridurre quel danno di 1d10 + il tuo bonus di competenza (devi impugnare uno scudo o un\'arma semplice o da guerra).'
    },
    'stile-arma-lancio': {
      name: 'Combattere con Arma da Lancio', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando colpisci con un attacco a distanza usando un\'arma con la proprietà Da Lancio, ottieni +2 al tiro per i danni.'
    },
    'stile-due-armi': {
      name: 'Combattere con Due Armi', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Quando fai un attacco extra grazie a un\'arma con la proprietà Leggera, puoi aggiungere il tuo modificatore di caratteristica al danno di quell\'attacco.'
    },
    'stile-senzarmi': {
      name: 'Combattere Senz\'Armi', category: 'stile', prereq: 'Talento di Stile di Combattimento',
      desc: 'Con un colpo senz\'armi puoi infliggere 1d6 danni contundenti (1d8 se non impugni armi né scudo). All\'inizio di ogni tuo turno puoi infliggere 1d4 contundenti a una creatura che tieni in presa.'
    },
    'aumento-caratteristica': {
      name: 'Aumento di Caratteristica', category: 'generale', prereq: 'Livello 4+', asi: true,
      desc: 'Aumenti un punteggio di caratteristica a scelta di 2, oppure due punteggi a scelta di 1 ciascuno. Non puoi superare 20 con questo talento.'
    },
    'maestro-armi-pesanti': {
      name: 'Maestro d\'Armi Pesanti', category: 'generale', prereq: 'Livello 4+, Forza 13+',
      desc: 'Aumenti Forza di 1 (max 20). Quando colpisci con un\'arma con la proprietà Pesante durante l\'azione di Attacco, infliggi danni extra pari al tuo bonus di competenza. Inoltre, subito dopo un colpo critico o dopo aver ridotto una creatura a 0 PF con un\'arma da mischia, puoi fare un attacco in mischia come azione bonus.'
    },
    'maestro-aste': {
      name: 'Maestro d\'Aste', category: 'generale', prereq: 'Livello 4+, Forza o Destrezza 13+',
      desc: 'Aumenti Forza o Destrezza di 1 (max 20). Subito dopo l\'azione di Attacco con un bastone ferrato, una lancia o un\'arma con proprietà Pesante e Portata, puoi usare un\'azione bonus per un attacco in mischia con l\'estremità opposta dell\'arma (danno d4). Inoltre una creatura che entra nella tua portata provoca un attacco di opportunità.'
    },
    sentinella: {
      name: 'Sentinella', category: 'generale', prereq: 'Livello 4+, Forza o Destrezza 13+',
      desc: 'Aumenti Forza o Destrezza di 1 (max 20). Quando una creatura entro 1,5 m compie l\'azione Disimpegno o colpisce un bersaglio diverso da te, puoi fare un attacco di opportunità contro di essa; quando la colpisci con un attacco di opportunità, la sua velocità diventa 0 per il resto del turno.'
    },
    'incantatore-guerra': {
      name: 'Incantatore di Guerra', category: 'generale', prereq: 'Livello 4+, tratto da incantatore',
      desc: 'Aumenti Intelligenza, Saggezza o Carisma di 1 (max 20). Hai vantaggio ai tiri salvezza su Costituzione per mantenere la concentrazione, puoi eseguire le componenti somatiche anche con armi o uno scudo nelle mani, e puoi lanciare un incantesimo come reazione al posto di un attacco di opportunità.'
    },
    'condottiero-ispiratore': {
      name: 'Condottiero Ispiratore', category: 'generale', prereq: 'Livello 4+, Saggezza o Carisma 13+',
      desc: 'Aumenti Saggezza o Carisma di 1 (max 20). Al termine di un riposo breve o lungo puoi tenere un discorso, un canto o una danza ispiratori: fino a sei creature che ti sentono e vedono ottengono punti ferita temporanei.'
    },
    'dono-vista-autentica': {
      name: 'Dono della Vista Autentica', category: 'dono-epico', prereq: 'Livello 19+',
      desc: 'Aumenti un punteggio di caratteristica a scelta di 1 (fino a un massimo di 30). Ottieni Vista Autentica con una portata di 18 m.'
    }
  },

  /* Opzioni di Metamagia dello Stregone (Blocco 5.C, step Stregone, PHB 2024
     p.141-142 del PDF): catalogo top-level come `feats`, scelto dal nuovo
     picker generico in js/levelup.js (choicePoints.metamagic, stessa forma
     {level,count} di Competenza). Riassunti originali in italiano, nomi delle
     opzioni tradotti liberamente (nessuna fonte italiana ufficiale). */
  metamagic: {
    'incantesimo-accurato': {
      name: 'Incantesimo Accurato', cost: '1 Punto Stregoneria',
      desc: 'Quando lanci un incantesimo che impone un tiro salvezza a più creature, spendi 1 Punto Stregoneria e scegline un numero pari al tuo modificatore di Carisma (minimo 1): quelle creature superano automaticamente il tiro salvezza e non subiscono danni se normalmente ne prenderebbero la metà con un successo.'
    },
    'incantesimo-distante': {
      name: 'Incantesimo Distante', cost: '1 Punto Stregoneria',
      desc: 'Se l\'incantesimo ha una gittata di almeno 1,5 m, spendi 1 Punto Stregoneria per raddoppiarla; se ha gittata Contatto, puoi invece portarla a 9 m.'
    },
    'incantesimo-potenziato': {
      name: 'Incantesimo Potenziato', cost: '1 Punto Stregoneria',
      desc: 'Quando tiri i danni di un incantesimo, spendi 1 Punto Stregoneria per ritirare un numero di dadi pari al tuo modificatore di Carisma (minimo 1) e tieni i nuovi risultati. Puoi usarlo anche insieme a un\'altra opzione di Metamagia già usata sullo stesso incantesimo.'
    },
    'incantesimo-esteso': {
      name: 'Incantesimo Esteso', cost: '1 Punto Stregoneria',
      desc: 'Se l\'incantesimo dura almeno 1 minuto, spendi 1 Punto Stregoneria per raddoppiarne la durata (fino a 24 ore). Se richiede Concentrazione, hai vantaggio ai tiri salvezza per mantenerla.'
    },
    'incantesimo-amplificato': {
      name: 'Incantesimo Amplificato', cost: '2 Punti Stregoneria',
      desc: 'Quando lanci un incantesimo che impone un tiro salvezza, spendi 2 Punti Stregoneria per dare svantaggio a un bersaglio nel tiro salvezza contro quell\'incantesimo.'
    },
    'incantesimo-accelerato': {
      name: 'Incantesimo Accelerato', cost: '2 Punti Stregoneria',
      desc: 'Se il tempo di lancio è un\'azione, spendi 2 Punti Stregoneria per lanciarlo come azione bonus. Non puoi farlo se hai già lanciato un incantesimo di 1° livello o superiore in questo turno, né potrai lanciarne un altro dopo su questo stesso turno.'
    },
    'incantesimo-cercante': {
      name: 'Incantesimo Cercante', cost: '1 Punto Stregoneria',
      desc: 'Se un tiro per colpire dell\'incantesimo fallisce, spendi 1 Punto Stregoneria per ritirare il d20 e tieni il nuovo risultato. Puoi usarlo anche se hai già usato un\'altra opzione di Metamagia sullo stesso incantesimo.'
    },
    'incantesimo-sottile': {
      name: 'Incantesimo Sottile', cost: '1 Punto Stregoneria',
      desc: 'Spendi 1 Punto Stregoneria per lanciare l\'incantesimo senza componenti Verbali o Somatiche, e senza componenti Materiali salvo quelle consumate dall\'incantesimo o con un costo indicato.'
    },
    'incantesimo-trasmutato': {
      name: 'Incantesimo Trasmutato', cost: '1 Punto Stregoneria',
      desc: 'Se l\'incantesimo infligge danni Acido, Freddo, Fuoco, Fulmine, Veleno o Tuono, spendi 1 Punto Stregoneria per cambiarne il tipo con uno degli altri cinque.'
    },
    'incantesimo-gemellato': {
      name: 'Incantesimo Gemellato', cost: '1 Punto Stregoneria',
      desc: 'Se l\'incantesimo può colpire una sola creatura e potrebbe colpirne un\'altra con uno slot di livello superiore, spendi 1 Punto Stregoneria per aumentarne di 1 il livello effettivo e colpire un secondo bersaglio con lo stesso incantesimo.'
    }
  },

  /* Invocazioni Occulte del Warlock (Blocco 5.C, step Warlock, PHB 2024
     p.153-156 del PDF): catalogo top-level come `feats`/`metamagic`, scelto
     dal nuovo picker generico in js/levelup.js (choicePoints.invocations,
     stessa forma {level,count}). Selezione curata di 14 (su circa 30 nel
     PHB — stesso principio dei 17 Talenti iniziali, "catalogo estendibile"):
     i prerequisiti sono testo informativo, non validati dal picker (stesso
     trattamento già in uso per i prerequisiti dei Talenti). Riassunti
     originali in italiano, nomi tradotti liberamente. */
  invocations: {
    'esplosione-agonizzante': {
      name: 'Esplosione Agonizzante', prereq: 'Livello 2+, un trucchetto da warlock che infligge danni',
      desc: 'Scegli uno dei tuoi trucchetti da warlock che infligge danni: aggiungi il tuo modificatore di Carisma ai tiri per i danni di quel trucchetto.'
    },
    'armatura-delle-ombre': {
      name: 'Armatura delle Ombre',
      desc: 'Puoi lanciare Armatura del Mago su te stesso senza spendere uno slot incantesimo.'
    },
    'vista-del-diavolo': {
      name: 'Vista del Diavolo', prereq: 'Livello 2+',
      desc: 'Vedi normalmente nella Luce Fioca e nell\'Oscurità, magica o non, entro 36 m da te.'
    },
    'mente-occulta': {
      name: 'Mente Occulta',
      desc: 'Hai vantaggio ai tiri salvezza di Costituzione per mantenere la concentrazione su un incantesimo.'
    },
    'vigore-infernale': {
      name: 'Vigore Infernale', prereq: 'Livello 2+',
      desc: 'Puoi lanciare Falsa Vita su te stesso senza spendere uno slot incantesimo, ottenendo sempre il massimo dei PF temporanei possibile dal dado.'
    },
    'maschera-dai-mille-volti': {
      name: 'Maschera dai Mille Volti',
      desc: 'Puoi lanciare Traveste te Stesso senza spendere uno slot incantesimo.'
    },
    'visioni-nebbiose': {
      name: 'Visioni Nebbiose', prereq: 'Livello 2+',
      desc: 'Puoi lanciare Immagine Silente senza spendere uno slot incantesimo.'
    },
    'patto-della-lama': {
      name: 'Patto della Lama',
      desc: 'Come azione bonus, evochi nella tua mano un\'arma da mischia Semplice o Marziale a tua scelta con cui crei un legame (oppure crei un legame con un\'arma magica che tocchi): finché dura il legame, sei competente con essa e puoi usarla come Focus per gli incantesimi; puoi usare il Carisma al posto di Forza o Destrezza per colpire e per i danni, e puoi farle infliggere danni Necrotici, Psichici o Radiosi al posto del tipo normale.'
    },
    'patto-della-catena': {
      name: 'Patto della Catena',
      desc: 'Impari l\'incantesimo Trova Famiglio e puoi lanciarlo come azione magica senza spendere uno slot, scegliendo anche fra alcune forme speciali oltre a quelle normali. Inoltre, quando compi l\'azione di Attacco, puoi rinunciare a uno dei tuoi attacchi per far attaccare il famiglio con la sua reazione.'
    },
    'patto-del-tomo': {
      name: 'Patto del Tomo',
      desc: 'Al termine di un riposo breve o lungo, evochi un Libro delle Ombre: scegli 3 trucchetti e 2 incantesimi di 1° livello con il descrittore Rituale da qualunque lista di classe (non già preparati altrove). Finché tieni il libro con te, li hai sempre preparati e contano come incantesimi da warlock; puoi usare il libro come Focus.'
    },
    'esplosione-repellente': {
      name: 'Esplosione Repellente', prereq: 'Livello 2+, un trucchetto da warlock con tiro per colpire',
      desc: 'Scegli uno dei tuoi trucchetti da warlock che richiede un tiro per colpire: quando colpisci una creatura Grande o più piccola, puoi spingerla fino a 3 m in linea retta lontano da te.'
    },
    'lama-assetata': {
      name: 'Lama Assetata', prereq: 'Livello 5+, Invocazione Patto della Lama',
      desc: 'Ottieni l\'Attacco Extra, ma solo con l\'arma del tuo Patto della Lama: puoi attaccare due volte, invece di una, quando compi l\'azione di Attacco con quell\'arma.'
    },
    'sguardo-delle-due-menti': {
      name: 'Sguardo delle Due Menti', prereq: 'Livello 5+',
      desc: 'Azione bonus: tocchi una creatura consenziente e percepisci attraverso i suoi sensi fino alla fine del tuo prossimo turno; puoi mantenere il collegamento con un\'altra azione bonus nei turni successivi, finché restate sullo stesso piano di esistenza.'
    },
    'vista-della-strega': {
      name: 'Vista della Strega', prereq: 'Livello 15+',
      desc: 'Ottieni Vista Autentica con una portata di 9 m.'
    }
  },

  /* Manovre del Maestro di Battaglia (Guerriero, sottoclassi mancanti — PHB
     2024 p.93-95 del PDF): catalogo top-level come `feats`/`metamagic`,
     scelto dal picker generico in js/levelup.js (choicePoints.maneuvers,
     stessa forma {level,count}). Tutte e 20 le manovre del PHB (a differenza
     di Metamagia/Invocazioni non è una selezione curata: la lista del
     Maestro di Battaglia è già di per sé completa e gestibile). Ogni manovra
     costa 1 Dado Superiorità, sommato di norma ai danni dell'attacco che la
     attiva — il costo non è ripetuto in ogni riassunto, resta implicito
     salvo eccezioni (Tattiche = prova, non danno). Riassunti originali in
     italiano. */
  maneuvers: {
    imboscata: {
      name: 'Imboscata',
      desc: 'Quando fai una prova di Destrezza (Furtività) o un tiro di iniziativa, spendi un Dado Superiorità e sommalo al tiro (a meno che tu non sia Incapacitato).'
    },
    'scambio-di-posizione': {
      name: 'Scambio di Posizione',
      desc: 'Entro 1,5 m da una creatura consenziente (non Incapacitata) nel tuo turno, spendi un Dado Superiorità e scambia posto con essa spendendo almeno 1,5 m di movimento, senza provocare attacchi di opportunità; tu o lei ottenete un bonus alla CA pari al risultato del dado fino all\'inizio del tuo prossimo turno.'
    },
    'colpo-del-comandante': {
      name: 'Colpo del Comandante',
      desc: 'Quando compi l\'azione di Attacco, rinuncia a uno dei tuoi attacchi e spendi un Dado Superiorità: un alleato consenziente che ti vede o sente può usare la sua reazione per attaccare con un\'arma o un colpo senz\'armi, sommando il dado ai danni se colpisce.'
    },
    'presenza-autorevole': {
      name: 'Presenza Autorevole',
      desc: 'Quando fai una prova di Carisma (Intimidire, Intrattenere o Persuasione), spendi un Dado Superiorità e sommalo alla prova.'
    },
    'attacco-di-disarmo': {
      name: 'Attacco di Disarmo',
      desc: 'Quando colpisci una creatura con un attacco, spendi un Dado Superiorità (sommandolo ai danni): la creatura supera un TS di Forza o lascia cadere un oggetto a sua scelta che impugna, nel suo spazio.'
    },
    'attacco-distraente': {
      name: 'Attacco Distraente',
      desc: 'Quando colpisci una creatura con un attacco, spendi un Dado Superiorità (sommandolo ai danni): il prossimo tiro per colpire contro quel bersaglio da parte di un\'altra creatura ha vantaggio, se effettuato prima dell\'inizio del tuo prossimo turno.'
    },
    'gioco-di-gambe-elusivo': {
      name: 'Gioco di Gambe Elusivo',
      desc: 'Come azione bonus, spendi un Dado Superiorità e compi l\'azione Disimpegnarti; sommi anche il risultato del dado alla tua CA fino all\'inizio del tuo prossimo turno.'
    },
    finta: {
      name: 'Finta',
      desc: 'Come azione bonus, spendi un Dado Superiorità per fintare contro una creatura entro 1,5 m: hai vantaggio al tuo prossimo tiro per colpire contro di essa in questo turno, e se colpisci sommi il dado ai danni.'
    },
    'attacco-provocante': {
      name: 'Attacco Provocante',
      desc: 'Quando colpisci una creatura con un attacco, spendi un Dado Superiorità (sommandolo ai danni): la creatura supera un TS di Saggezza o ha svantaggio ai tiri per colpire contro bersagli diversi da te fino alla fine del tuo prossimo turno.'
    },
    'attacco-fulmineo': {
      name: 'Attacco Fulmineo',
      desc: 'Come azione bonus, spendi un Dado Superiorità e compi l\'azione Scattare. Se ti muovi almeno 1,5 m in linea retta subito prima di colpire in mischia come parte dell\'azione di Attacco in questo turno, sommi il dado ai danni.'
    },
    'attacco-di-manovra': {
      name: 'Attacco di Manovra',
      desc: 'Quando colpisci una creatura con un attacco, spendi un Dado Superiorità (sommandolo ai danni) e scegli un alleato consenziente che ti vede o sente: può usare la sua reazione per muoversi fino a metà della sua velocità senza provocare attacchi di opportunità dal bersaglio del tuo attacco.'
    },
    'attacco-minaccioso': {
      name: 'Attacco Minaccioso',
      desc: 'Quando colpisci una creatura con un attacco, spendi un Dado Superiorità (sommandolo ai danni): la creatura supera un TS di Saggezza o ha la condizione Spaventato fino alla fine del tuo prossimo turno.'
    },
    parata: {
      name: 'Parata',
      desc: 'Quando un\'altra creatura ti infligge danni con un attacco in mischia, puoi usare una reazione e spendere un Dado Superiorità per ridurre il danno subito del risultato del dado più il tuo modificatore di Forza o Destrezza (a tua scelta).'
    },
    'attacco-di-precisione': {
      name: 'Attacco di Precisione',
      desc: 'Quando manchi con un tiro per colpire, spendi un Dado Superiorità, tiralo e sommalo al tiro per colpire: potresti trasformarlo in un successo.'
    },
    'attacco-sospingente': {
      name: 'Attacco Sospingente',
      desc: 'Quando colpisci una creatura con un\'arma o un colpo senz\'armi, spendi un Dado Superiorità (sommandolo ai danni): se il bersaglio è Grande o più piccolo, supera un TS di Forza o viene spinto fino a 4,5 m in linea retta lontano da te.'
    },
    incoraggiamento: {
      name: 'Incoraggiamento',
      desc: 'Come azione bonus, spendi un Dado Superiorità: un alleato a tua scelta entro 9 m che ti vede o sente ottiene PF temporanei pari al risultato del dado più la metà (per difetto) del tuo livello da guerriero.'
    },
    risposta: {
      name: 'Risposta',
      desc: 'Quando una creatura ti manca con un attacco in mischia, puoi usare una reazione e spendere un Dado Superiorità per attaccarla in mischia con un\'arma o un colpo senz\'armi: se colpisci, sommi il dado ai danni.'
    },
    'attacco-ad-ampio-raggio': {
      name: 'Attacco ad Ampio Raggio',
      desc: 'Quando colpisci una creatura in mischia con un\'arma o un colpo senz\'armi, spendi un Dado Superiorità e scegli un\'altra creatura entro 1,5 m dal bersaglio originale e a portata: se il tiro per colpire colpirebbe anche lei, subisce danni (dello stesso tipo) pari al risultato del dado.'
    },
    'valutazione-tattica': {
      name: 'Valutazione Tattica',
      desc: 'Quando fai una prova di Intelligenza (Storia o Indagare) o di Saggezza (Intuizione), spendi un Dado Superiorità e sommalo alla prova.'
    },
    'attacco-di-sgambetto': {
      name: 'Attacco di Sgambetto',
      desc: 'Quando colpisci una creatura con un\'arma o un colpo senz\'armi, spendi un Dado Superiorità (sommandolo ai danni): se il bersaglio è Grande o più piccolo, supera un TS di Forza o cade Prono.'
    }
  }
};
