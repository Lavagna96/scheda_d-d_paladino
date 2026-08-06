/*
 * Renderer dei valori derivati (Fase 0): porta nell'HTML ciò che AppEngine
 * calcola dai fatti base. Le sezioni della scheda hanno data-abil / data-save /
 * data-skill; le res-card ricevono data-max e testi contestuali PRIMA che
 * AppSheet le renda (l'ordine di init in app.js garantisce questo).
 */
(function () {
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  function renderAbilities(view) {
    document.querySelectorAll('[data-abil]').forEach(function (card) {
      var a = null;
      view.abilities.forEach(function (x) {
        if (x.key === card.getAttribute('data-abil')) {
          a = x;
        }
      });
      if (!a) {
        return;
      }
      var mod = card.querySelector('.mod');
      var score = card.querySelector('.score');
      if (mod) {
        mod.textContent = a.modText;
      }
      if (score) {
        score.textContent = a.score;
      }
    });
  }

  /* Pallino di competenza (e il suo raddoppio per l'Espero, .master): righe
     statiche in index.html per i tiri salvezza, ma il pallino e il colore
     oro prima erano fissi su quelli di Tharion per ogni personaggio — qui
     diventano dati (v.prof). Nessun tiro salvezza dà mai Espero, quindi
     'master' non si usa in questa funzione. */
  function renderSaves(view) {
    document.querySelectorAll('[data-save]').forEach(function (row) {
      var s = null;
      view.saves.forEach(function (x) {
        if (x.key === row.getAttribute('data-save')) {
          s = x;
        }
      });
      if (!s) {
        return;
      }
      var lbl = row.querySelector('.lbl');
      var v = row.querySelector('.v');
      var dot = row.querySelector('.skill-dot');
      if (v) {
        v.textContent = s.text;
        v.classList.toggle('prof', s.prof);
      }
      if (lbl) {
        lbl.classList.toggle('prof', s.prof);
      }
      if (dot) {
        dot.hidden = !s.prof;
      }
    });
    setText('ts-aura-note', 'Aura ' + view.aura.text + ' inclusa');
  }

  /* Riga di un'abilità (Alternativa 2, 5.C Ladro): pallino singolo se
     competente, doppio (.master) se ha anche Espero — stesso markup delle
     righe statiche di prima, solo costruito dai dati invece che scritto a
     mano per Tharion. */
  function buildSkillRow(sk) {
    var row = document.createElement('div');
    row.className = 'stat-row';
    row.setAttribute('data-skill', sk.id);

    var lbl = document.createElement('span');
    lbl.className = sk.prof ? 'lbl prof' : 'lbl';
    var dot = document.createElement('span');
    dot.className = sk.expertise ? 'skill-dot master' : 'skill-dot';
    dot.hidden = !sk.prof;
    lbl.appendChild(dot);
    lbl.appendChild(document.createTextNode(sk.label + ' '));
    var dim = document.createElement('span');
    dim.className = 'dim';
    dim.textContent = '(' + sk.abilShort + ')';
    lbl.appendChild(dim);
    row.appendChild(lbl);

    var v = document.createElement('span');
    v.className = sk.prof ? 'v prof' : 'v';
    v.textContent = sk.text;
    row.appendChild(v);

    return row;
  }

  function buildSkillGroupHead(label) {
    var head = document.createElement('div');
    head.className = 'skill-group-head';
    var plaque = document.createElement('span');
    plaque.className = 'skill-group-label';
    plaque.textContent = label;
    var line = document.createElement('span');
    line.className = 'skill-group-line';
    head.appendChild(plaque);
    head.appendChild(line);

    return head;
  }

  /* Le 18 abilità del gioco (window.AppEngine.SKILLS) invece delle 9 fisse
     di prima: competenti in cima (targhetta "Competenti"), le altre sotto
     ("Altre abilità") — stesso linguaggio della scheda Risorse (Riposo
     breve/lungo). La lista si ricostruisce a ogni render: sono 18 righe,
     non serve una diff più furba. */
  function renderSkills(view) {
    var list = document.getElementById('skills-list');
    if (list) {
      list.innerHTML = '';
      var all = (window.AppEngine.SKILLS || []).map(function (s) { return view.skills[s.id]; }).filter(Boolean);
      var profSkills = all.filter(function (sk) { return sk.prof; });
      var restSkills = all.filter(function (sk) { return !sk.prof; });
      if (profSkills.length) {
        list.appendChild(buildSkillGroupHead('Competenti'));
        profSkills.forEach(function (sk) { list.appendChild(buildSkillRow(sk)); });
      }
      if (restSkills.length) {
        list.appendChild(buildSkillGroupHead('Altre abilità'));
        restSkills.forEach(function (sk) { list.appendChild(buildSkillRow(sk)); });
      }
    }
    setText('skill-passive-perception', view.passivePerception);
  }

  /* Resistenze & Immunità (Step 3.9.b): raccolte dagli oggetti custom
     attivi (stesso criterio di modSum/computeResources in engine.js — un
     oggetto che richiede sintonizzazione conta solo se sintonizzato). Un
     tag per fonte, niente merge tra oggetti diversi: la fonte resta
     leggibile. Card nascosta se non c'è nulla da mostrare. */
  function renderResistances() {
    var card = document.getElementById('resistances-card');
    var list = document.getElementById('resistances-list');
    if (!card || !list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var tags = [];
    (ch.items || []).forEach(function (it) {
      var active = !it.requiresAttunement || it.attuned !== false;
      if (!active) {
        return;
      }
      (it.resistances || []).forEach(function (r) {
        tags.push({ label: r, cls: 'res', prefix: 'Resistenza · ', source: it.name });
      });
      (it.immunities || []).forEach(function (r) {
        tags.push({ label: r, cls: 'imm', prefix: 'Immunità · ', source: it.name });
      });
    });
    list.innerHTML = '';
    tags.forEach(function (t) {
      var tag = document.createElement('span');
      tag.className = 'rimm-tag ' + t.cls;
      tag.textContent = t.prefix + t.label;
      var src = document.createElement('span');
      src.className = 'rimm-source';
      src.textContent = t.source;
      tag.appendChild(src);
      list.appendChild(tag);
    });
    card.classList.toggle('hidden', tags.length === 0);
  }

  /* Etichette dei 4 sensi (stessi id di SENSE_OPTIONS in js/items.js — non
     condivisi tra i due moduli, stesso principio già in uso: buildAttackChips
     qui sotto legge ch.items direttamente senza passare dagli helper di
     items.js). */
  var SENSE_LABELS = {
    scurovisione: 'Scurovisione', 'vista-cieca': 'Vista Cieca',
    'vista-vera': 'Vista Vera', 'percezione-tremore': 'Percezione del Tremore'
  };

  /* Sensi (Step 3.9.b, seconda parte): a differenza di resistenze/immunità
     un senso non si somma tra oggetti diversi — nelle regole vale il
     raggio migliore. Qui dedup per tipo, tenendo il raggio massimo e la
     fonte che lo fornisce. */
  function renderSenses() {
    var card = document.getElementById('senses-card');
    var list = document.getElementById('senses-list');
    if (!card || !list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var bestByType = {};
    (ch.items || []).forEach(function (it) {
      var active = !it.requiresAttunement || it.attuned !== false;
      if (!active) {
        return;
      }
      (it.senses || []).forEach(function (s) {
        if (!bestByType[s.type] || s.rangeM > bestByType[s.type].rangeM) {
          bestByType[s.type] = { rangeM: s.rangeM, source: it.name };
        }
      });
    });
    list.innerHTML = '';
    var types = Object.keys(bestByType);
    types.forEach(function (type) {
      var best = bestByType[type];
      var tag = document.createElement('span');
      tag.className = 'rimm-tag sense';
      tag.textContent = (SENSE_LABELS[type] || type) + ' ' + best.rangeM + ' m';
      var src = document.createElement('span');
      src.className = 'rimm-source';
      src.textContent = best.source;
      tag.appendChild(src);
      list.appendChild(tag);
    });
    card.classList.toggle('hidden', types.length === 0);
  }

  /* Categorie di effetti a testo libero (Step 3.9.c): l'icona è indovinata
     dalle parole chiave nel testo, non scelta a mano in fase di modifica —
     l'ordine conta, la prima regola che matcha vince (es. "svantaggio"
     prima di "vantaggio" perché la seconda parola è contenuta nella prima). */
  var ITEM_EFFECT_CATEGORIES = [
    {
      id: 'svantaggio', label: 'Svantaggio', test: /svantaggio/i,
      icon: '<path d="M17 10l-5 5-5-5M17 15l-5 5-5-5"/>'
    },
    {
      id: 'vantaggio', label: 'Vantaggio', test: /vantaggio/i,
      icon: '<path d="M7 14l5-5 5 5M7 9l5-5 5 5"/>'
    },
    {
      id: 'immunita', label: 'Immunità', test: /immun/i,
      icon: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'
    },
    {
      id: 'resistenza', label: 'Resistenza', test: /resistenz/i,
      icon: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>'
    },
    {
      id: 'allarme', label: 'Allarme', test: /allarme/i,
      icon: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
    },
    {
      id: 'sensi', label: 'Sensi', test: /scurovision|percezion|vist[ae]|sent[ei]|vede|senso|sensi/i,
      icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    },
    {
      id: 'movimento', label: 'Movimento', test: /veloc|movimento|volo|volare|nuoto|nuotare|scalare|arrampic/i,
      icon: '<path d="M4 20c9 0 15-6 15-15v-1h-1C9 4 4 10 4 19z"/><path d="M4 20L18 6"/>'
    },
    {
      id: 'iniziativa', label: 'Iniziativa', test: /iniziativa/i,
      icon: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>'
    }
  ];
  var ITEM_EFFECT_DEFAULT = {
    id: 'generico', label: 'Effetto',
    icon: '<path d="M12 2c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7z"/>'
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function classifyEffectText(text) {
    var found = null;
    ITEM_EFFECT_CATEGORIES.forEach(function (cat) {
      if (!found && cat.test.test(text)) {
        found = cat;
      }
    });

    return found || ITEM_EFFECT_DEFAULT;
  }

  /* Effetti a testo libero dagli oggetti custom attivi (Step 3.9.a, griglia
     a icone Step 3.9.c): stesso criterio di modSum/renderResistances —
     sintonizzazione richiesta = solo se sintonizzato. Mostrati in Scheda →
     Info/Comb per consultarli a tavolo senza aprire Tesoreria; il testo
     preciso sta nel foglio di dettaglio (tocco sulla tessera), la griglia
     resta compatta anche con molti oggetti attivi. */
  function renderItemTextEffects() {
    var card = document.getElementById('item-text-effects-card');
    var list = document.getElementById('item-text-effects-list');
    if (!card || !list) {
      return;
    }
    var ch = window.AppStorage.getState().character;
    var entries = [];
    (ch.items || []).forEach(function (it) {
      var active = !it.requiresAttunement || it.attuned !== false;
      if (!active) {
        return;
      }
      (it.effects || []).forEach(function (eff) {
        if (eff.text !== undefined && String(eff.text).trim()) {
          entries.push({ text: String(eff.text).trim(), source: it.name || 'Oggetto' });
        }
      });
    });
    list.innerHTML = '';
    entries.forEach(function (entry) {
      var cat = classifyEffectText(entry.text);
      var li = document.createElement('li');
      li.className = 'item-text-effect-tile';
      li.innerHTML =
        '<span class="item-text-effect-ic-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + cat.icon + '</svg></span>' +
        '<span class="item-text-effect-cat">' + cat.label + '</span>';
      var src = document.createElement('span');
      src.className = 'item-text-effect-src';
      src.textContent = entry.source;
      li.appendChild(src);
      li.addEventListener('click', function () {
        if (window.AppBottomSheet) {
          window.AppBottomSheet.open(cat.label, '<p>' + escapeHtml(entry.text) + '</p><p><b>Oggetto:</b> ' + escapeHtml(entry.source) + '</p>');
        }
      });
      list.appendChild(li);
    });
    card.classList.toggle('hidden', entries.length === 0);
  }

  /* Icona generica per le risorse di classe generate dinamicamente (che non
     hanno una card statica in index.html), es. la Furia del Barbaro. */
  function classResIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.6-2.2 1.2-2.8C8.5 10 8.8 6.5 12 3z"/></svg>';
  }

  // 'short-full' (Punti Focus del Monaco: torna TUTTO al riposo breve, non
  // solo 1 uso) sta comunque nella sezione visiva "Riposo breve".
  var SECTION_BY_RESET = { short: '.res-sec-short', 'short-full': '.res-sec-short', long: '.res-sec-long', day: '.res-sec-day' };

  function buildDynamicResCard(r) {
    var card = document.createElement('div');
    card.className = 'res-card';
    card.setAttribute('data-key', r.key);
    card.setAttribute('data-max', r.max);
    card.setAttribute('data-dynamic', '1');

    var med = document.createElement('span');
    med.className = 'rc-med';
    med.setAttribute('aria-hidden', 'true');
    med.innerHTML = classResIcon();
    card.appendChild(med);

    var info = document.createElement('div');
    info.className = 'rc-info';
    var name = document.createElement('span');
    name.className = 'rc-name';
    name.textContent = r.name || r.key;
    info.appendChild(name);
    var ctx = document.createElement('span');
    ctx.className = 'rc-ctx';
    ctx.textContent = r.ctx || 'usi';
    info.appendChild(ctx);
    info.appendChild(document.createElement('div')).className = 'segbar';
    card.appendChild(info);

    card.appendChild(document.createElement('span')).className = 'rc-count';

    return card;
  }

  /* Rendering generico delle risorse (Fase 5, step Barbaro): mostra/popola solo
     le card pertinenti alla classe del personaggio, nasconde le altre (così un
     Barbaro non vede Incanalare/Punizione/Destriero…), genera dinamicamente le
     risorse di classe senza card statica (es. Furia) e nasconde le sezioni
     rimaste vuote. Per il Paladino tutte le card sono pertinenti → invariato. */
  function renderResources(view) {
    var byKey = {};
    view.resources.forEach(function (r) { byKey[r.key] = r; });

    // via le card di classe generate in un render precedente (le rifaccio sotto)
    document.querySelectorAll('.res-card[data-dynamic]').forEach(function (c) { c.remove(); });

    // card statiche: popola+mostra se pertinenti, nascondi altrimenti.
    // (Le card degli oggetti 'item-*' le gestisce js/items.js: non le tocco.)
    document.querySelectorAll('.res-card[data-key]').forEach(function (card) {
      var key = card.getAttribute('data-key');
      if (key.indexOf('item-') === 0) { return; }
      var r = byKey[key];
      if (r) {
        card.classList.remove('hidden');
        card.setAttribute('data-max', r.max);
        if (r.ctx) {
          var ctx = card.querySelector('.rc-ctx');
          if (ctx) { ctx.textContent = r.ctx; }
        }
      } else {
        card.classList.add('hidden');
      }
    });

    // card dinamiche per le risorse di classe senza HTML statico (es. Furia).
    // Escludo slot ('sl*') e oggetti ('item-*'): hanno una gestione a parte.
    view.resources.forEach(function (r) {
      if (r.key.indexOf('item-') === 0 || r.key.indexOf('sl') === 0) { return; }
      if (document.querySelector('.res-card[data-key="' + r.key + '"]:not([data-dynamic])')) { return; }
      var sec = document.querySelector(SECTION_BY_RESET[r.resetOn] || SECTION_BY_RESET.long);
      if (!sec) { return; }
      var card = buildDynamicResCard(r);
      sec.appendChild(card);
      if (window.AppSheet && window.AppSheet.renderResourceCard) {
        window.AppSheet.renderResourceCard(card); // aggancia il tocco come le altre
      }
    });

    // nascondo le sezioni rimaste senza card visibili (la sezione oggetti la
    // gestisce js/items.js, la salto).
    document.querySelectorAll('.res-sec').forEach(function (sec) {
      if (sec.id === 'custom-items-res-sec') { return; }
      var hasVisible = Array.prototype.slice.call(sec.querySelectorAll('.res-card'))
        .some(function (c) { return !c.classList.contains('hidden'); });
      sec.classList.toggle('hidden', !hasVisible);
    });
  }

  /* Cerca un privilegio per nome nei dati di classe (livelli base) o, se non
     lo trova lì, nei privilegi di sottoclasse (prima la sottoclasse del
     personaggio, poi le altre come ripiego: alcuni testi come "Arma Sacra"
     sono per ora scritti su un solo Giuramento anche se validi per tutti —
     vedi commento su MANUAL_55.classes.paladino.subclasses.devozione). Serve
     a recuperare la descrizione ufficiale da mostrare nel bottom sheet senza
     duplicare i testi del manuale per ogni possibile provenienza. */
  function findFeatureByName(klass, subclassId, name) {
    var found = null;
    Object.keys(klass.levelFeatures || {}).forEach(function (lvl) {
      (klass.levelFeatures[lvl] || []).forEach(function (f) {
        if (f.name === name) { found = f; }
      });
    });
    if (found) { return found; }

    var subs = klass.subclasses || {};
    var order = (subclassId && subs[subclassId]) ? [subclassId] : [];
    Object.keys(subs).forEach(function (id) {
      if (order.indexOf(id) === -1) { order.push(id); }
    });
    order.forEach(function (id) {
      var feats = (subs[id] || {}).features || {};
      Object.keys(feats).forEach(function (lvl) {
        (feats[lvl] || []).forEach(function (f) {
          if (f.name === name) { found = f; }
        });
      });
    });

    return found;
  }

  /* Chip degli attacchi costruiti dai dati reali del personaggio (niente più
     testo fisso di Tharion): stile di combattimento, Arma Sacra, Furia,
     Attacco Furtivo, Arti Marziali dove applicabile. Ogni chip mostra il
     valore già calcolato per il personaggio (come i vecchi part di
     buildAttackNote) e al tocco apre la descrizione ufficiale del privilegio
     dal manuale. I bonus magici dell'arma sono già sommati nella riga
     Colpire/Danni sopra, senza bisogno di ripeterli qui. */
  function buildAttackChips(view, ch) {
    var chips = [];
    /* Le note valgono solo quando il bonus si applica DAVVERO (stesse
       condizioni di engine.js): Duellante serve un'arma da mischia a una
       mano, Difesa un'armatura indosso. Prima comparivano sempre, anche con
       un arco in mano o senz'armatura — il numero nella riga Colpire/Danni
       era già corretto, solo la nota mentiva. */
    var hasArmorForNote = !!(ch.armor && ch.armor.id && ch.armor.id !== 'nessuna');
    var equippedWeapon = (window.AppItems && window.AppItems.activeEquippedWeaponProfile)
      ? (window.AppItems.activeEquippedWeaponProfile(ch) || ch.weapon || {})
      : (ch.weapon || {});
    var feats = window.MANUAL_55.feats || {};
    var klass = (window.MANUAL_55.classes || {})[ch.classId] || {};

    if (ch.fightingStyle === 'duello' && !equippedWeapon.ranged && !equippedWeapon.twoHanded) {
      var duello = feats['stile-duello'];
      chips.push({ label: 'Duellante', detail: '+2 ai danni', title: 'Stile ' + (duello ? duello.name : 'Duellante'), desc: duello ? duello.desc : '' });
    }
    if (ch.fightingStyle === 'difesa' && hasArmorForNote) {
      var difesa = feats['stile-difesa'];
      chips.push({ label: 'Difesa', detail: '+1 alla CA', title: 'Stile ' + (difesa ? difesa.name : 'Difesa'), desc: difesa ? difesa.desc : '' });
    }
    if (view.sacredWeaponBonus > 0) {
      var armaSacra = findFeatureByName(klass, view.subclassId, 'Arma Sacra');
      chips.push({
        label: 'Arma Sacra',
        detail: view.sacredWeaponText + ' al colpire (→ ' + window.AppEngine.formatMod(view.weapon.hit + view.sacredWeaponBonus) + ')',
        title: 'Arma Sacra',
        desc: armaSacra ? armaSacra.desc : ''
      });
    }
    /* Danno da Furia (Barbaro): tabella per livello nei dati, mai mostrata da
       nessuna parte finora — il giocatore doveva ricordarsela a memoria. È un
       bonus che si applica solo con attacchi basati sulla Forza mentre la
       Furia è attiva (stato transitorio, non tracciato nello stato salvato),
       quindi resta un chip informativo e non un numero già sommato sopra. */
    var rageBonus = (klass.rageDamage || [])[view.level];
    if (rageBonus) {
      var furia = findFeatureByName(klass, view.subclassId, 'Furia');
      chips.push({ label: 'Furia', detail: '+' + rageBonus + ' danni (FOR)', title: 'Furia', desc: furia ? furia.desc : '' });
    }
    /* Attacco Furtivo (Ladro): stessa idea della nota Furia — un bonus a
       tabella (klass.sneakAttackD6) mai mostrato altrove, che si applica solo
       una volta per turno con un'arma Accurata o a distanza e vantaggio (o un
       alleato adiacente al bersaglio), quindi resta un chip informativo. */
    var sneakDice = (klass.sneakAttackD6 || [])[view.level];
    if (sneakDice) {
      var sneak = findFeatureByName(klass, view.subclassId, 'Attacco Furtivo');
      chips.push({ label: 'Attacco Furtivo', detail: '+' + sneakDice + 'd6', title: 'Attacco Furtivo', desc: sneak ? sneak.desc : '' });
    }
    /* Arti Marziali (Monaco): il dado sostituisce il danno normale del colpo
       senz'armi o di un'arma da Monaco, qualunque cosa sia nella riga Arma
       sopra — informativo per lo stesso motivo delle altre due note. */
    var martialDie = (klass.martialArtsDie || [])[view.level];
    if (martialDie) {
      var martial = findFeatureByName(klass, view.subclassId, 'Arti Marziali');
      chips.push({ label: 'Arti Marziali', detail: martialDie, title: 'Arti Marziali', desc: martial ? martial.desc : '' });
    }
    /* Punizione Divina (Paladino): prima una card a parte con 3 righe piene +
       una nota fissa (progressione dei dadi per livello di slot, bonus contro
       Immondi/Non Morti, gratuita 1/riposo lungo) — ora un solo chip qui, con
       tutto quel contenuto raccolto nella descrizione del bottom sheet invece
       di essere spalmato su più righe. */
    if (ch.classId === 'paladino') {
      var punizioneDivina = null;
      (window.MANUAL_55.spells || []).forEach(function (s) {
        if (s.id === 'punizione-divina') { punizioneDivina = s; }
      });
      var punizioneGratis = findFeatureByName(klass, view.subclassId, 'Punizione del Paladino');
      var smiteDesc = [punizioneDivina ? punizioneDivina.desc : '', punizioneGratis ? punizioneGratis.desc : '']
        .filter(Boolean).join(' ');
      chips.push({ label: 'Punizione Divina', detail: 'Az. bonus, dopo un colpo', title: 'Punizione Divina', desc: smiteDesc });
    }

    return chips;
  }

  /* Riga di chip (stesso componente .mastery-chip ovunque venga usato: qui,
     nel gruppo con titolino sotto, e in origine per le maestrie): il tocco
     apre il bottom sheet con la descrizione ufficiale, se presente. */
  function buildChipRow(items) {
    var row = document.createElement('div');
    row.className = 'mastery-chip-row';
    items.forEach(function (it) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mastery-chip';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'mastery-chip-name';
      nameSpan.textContent = it.label;
      var detailSpan = document.createElement('span');
      detailSpan.className = 'mastery-chip-weapon';
      detailSpan.textContent = it.detail;
      chip.appendChild(nameSpan);
      chip.appendChild(detailSpan);
      chip.addEventListener('click', function () {
        if (it.desc && window.AppBottomSheet) {
          window.AppBottomSheet.open(it.title, '<p>' + escapeHtml(it.desc) + '</p>');
        }
      });
      row.appendChild(chip);
    });

    return row;
  }

  /* Un gruppo di chip con titolino (etichetta + filo dorato, come
     .skill-group-head nella lista abilità) per distinguere a colpo d'occhio
     le maestrie dallo stile/privilegi. Nessun gruppo → nessun elemento
     (niente titolo vuoto sopra il nulla). */
  function buildChipGroup(label, items) {
    if (!items.length) {
      return null;
    }
    var wrap = document.createElement('div');
    wrap.className = 'atk-chip-group';

    var head = document.createElement('div');
    head.className = 'skill-group-head';
    var plaque = document.createElement('span');
    plaque.className = 'skill-group-label';
    plaque.textContent = label;
    var line = document.createElement('span');
    line.className = 'skill-group-line';
    head.appendChild(plaque);
    head.appendChild(line);
    wrap.appendChild(head);
    wrap.appendChild(buildChipRow(items));

    return wrap;
  }

  function renderAttacks(view) {
    var ch = window.AppStorage.getState().character;
    setText('atk-weapon-name', view.weapon.name);
    setText('atk-weapon-hit', view.weapon.hitText);
    setText('atk-weapon-dmg', view.weapon.dmgText);

    // Maestria: era scritta fissa nell'HTML (quella di Tharion), quindi la
    // vedeva chiunque. Ora viene dall'arma del personaggio e sparisce se non
    // ne ha una (5.B.3).
    var mastEl = document.getElementById('atk-weapon-mastery');
    if (mastEl) {
      var mastery = view.weapon.mastery || '';
      mastEl.textContent = mastery ? 'Maestria: ' + mastery : '';
      mastEl.classList.toggle('hidden', !mastery);
    }

    // Due gruppi di chip sotto la tabella, con titolino a distinguerli:
    // "Maestrie" (armi che il personaggio sa usare, anche se non impugnate
    // ora) e "Stile & Privilegi" (bonus attivi da stile di combattimento e
    // privilegi di classe — ex nota fissa in fondo). Stesso componente chip
    // per entrambi, il tocco apre sempre la descrizione ufficiale.
    var groupsEl = document.getElementById('atk-chip-groups');
    if (groupsEl) {
      groupsEl.innerHTML = '';

      var masteryDefs = window.MANUAL_55.weaponMasteries || {};
      var masteryItems = (ch.weaponMasteries || []).map(function (id) {
        var w = null;
        (window.MANUAL_55.weapons || []).forEach(function (x) {
          if (x.id === id) {
            w = x;
          }
        });
        if (!w) {
          return null;
        }
        var def = masteryDefs[w.mastery];

        return { label: w.mastery, detail: w.name, title: def ? def.name : w.mastery, desc: def ? def.desc : '' };
      }).filter(Boolean);

      var masteryGroup = buildChipGroup('Maestrie', masteryItems);
      if (masteryGroup) { groupsEl.appendChild(masteryGroup); }

      var noteGroup = buildChipGroup('Stile & Privilegi', buildAttackChips(view, ch));
      if (noteGroup) { groupsEl.appendChild(noteGroup); }
    }

    // Riga Soffio: solo per chi ha quell'attacco (Dragonide → risorsa 'breath').
    var hasBreath = view.resources.some(function (r) { return r.key === 'breath'; });
    var breathHit = document.getElementById('atk-breath-hit');
    var breathRow = breathHit ? breathHit.closest('tr') : null;
    if (breathRow) { breathRow.classList.toggle('hidden', !hasBreath); }
    if (hasBreath) {
      setText('atk-breath-name', 'Soffio (' + view.breath.damageType.charAt(0).toUpperCase() +
        view.breath.damageType.slice(1) + ')');
      setText('atk-breath-hit', 'TS DES ' + view.breath.dc);
      setText('atk-breath-dmg', view.breath.dice + ' ' + view.breath.damageType);
    }

    // Righe personalizzate (Step 3.9.d): a differenza di arma/Soffio non sono
    // calcolate, l'utente le scrive e le toglie a mano dal foglio "Modifica ·
    // Attacchi" — utile per incantesimi da attacco, tratti usabili come
    // attacco, ecc. che con i livelli si accumulano e l'engine non copre.
    var tbody = document.querySelector('.combat-table tbody');
    if (tbody) {
      tbody.querySelectorAll('.custom-atk-row').forEach(function (row) { row.remove(); });
      (ch.customAttacks || []).forEach(function (atk) {
        var row = document.createElement('tr');
        row.className = 'custom-atk-row';
        var nameTd = document.createElement('td');
        var nameSpan = document.createElement('span');
        nameSpan.className = 'atk-name';
        nameSpan.textContent = atk.name || '—';
        nameTd.appendChild(nameSpan);
        var hitTd = document.createElement('td');
        hitTd.textContent = atk.hit || '—';
        var dmgTd = document.createElement('td');
        dmgTd.textContent = atk.dmg || '—';
        row.appendChild(nameTd);
        row.appendChild(hitTd);
        row.appendChild(dmgTd);
        tbody.appendChild(row);
      });
    }

    // "Attacco Extra: N colpi": generico da klass.extraAttacks[livello] (colpi
    // oltre al primo). Il Guerriero arriva a 4 colpi totali, non solo 2 come
    // Paladino/Barbaro, quindi il numero va calcolato invece di un semplice
    // mostra/nascondi a soglia fissa. Alcune sottoclassi (es. Collegio del
    // Valore del Bardo) danno Attacco Extra da sole anche se la classe base
    // non ce l'ha: si prende il massimo tra tabella di classe e di sottoclasse.
    var manual = window.MANUAL_55 || { classes: {} };
    var klass = manual.classes[view.classId] || {};
    var subclass = (klass.subclasses || {})[view.subclassId] || {};
    var extraHits = Math.max(
      (klass.extraAttacks || [])[view.level] || 0,
      (subclass.extraAttacks || [])[view.level] || 0
    );
    var extraEl = document.getElementById('atk-extra');
    if (extraEl) {
      var totalHits = 1 + extraHits;
      extraEl.textContent = 'Attacco Extra: ' + totalHits + ' colpi';
      extraEl.classList.toggle('hidden', totalHits < 2);
    }
  }

  function render() {
    var view = window.AppEngine.getView();
    renderAbilities(view);
    renderSaves(view);
    renderSkills(view);
    renderResistances();
    renderSenses();
    renderItemTextEffects();
    renderResources(view);
    renderAttacks(view);
    setText('loh-max', view.poolMax.loh);
    // La card Imposizione delle Mani (pool) compare solo se la classe ha quel pool.
    var lohCard = document.querySelector('.loh-card');
    if (lohCard) {
      lohCard.classList.toggle('hidden', !(view.poolMax.loh > 0));
    }
  }

  window.AppStats = {
    init: render,
    render: render
  };
})();
