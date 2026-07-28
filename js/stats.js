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

  /* Nota attacchi costruita dai dati reali del personaggio (niente più testo
     fisso di Tharion): bonus magici all'arma, stile di combattimento, Arma Sacra
     dove applicabile. Stringa vuota → la nota viene nascosta. */
  function buildAttackNote(view, ch) {
    var parts = [];
    var atkBonus = 0;
    (ch.modifiers || []).forEach(function (m) { if (m.target === 'attacco') { atkBonus += m.value; } });
    (ch.items || []).forEach(function (it) {
      (it.effects || []).forEach(function (e) { if (e.target === 'attacco') { atkBonus += e.value; } });
    });
    if (atkBonus > 0) { parts.push('Colpire e danni includono i bonus magici dell\'arma (+' + atkBonus + ').'); }
    /* Le note valgono solo quando il bonus si applica DAVVERO (stesse
       condizioni di engine.js): Duellante serve un'arma da mischia a una
       mano, Difesa un'armatura indosso. Prima comparivano sempre, anche con
       un arco in mano o senz'armatura — il numero nella riga Colpire/Danni
       era già corretto, solo la nota mentiva. */
    var hasArmorForNote = !!(ch.armor && ch.armor.id && ch.armor.id !== 'nessuna');
    if (ch.fightingStyle === 'duello' && !(ch.weapon || {}).ranged && !(ch.weapon || {}).twoHanded) {
      parts.push('Stile Duellante +2 ai danni.');
    }
    if (ch.fightingStyle === 'difesa' && hasArmorForNote) { parts.push('Stile Difesa +1 alla CA.'); }
    if (view.sacredWeaponBonus > 0) {
      parts.push('Con Arma Sacra: ' + view.sacredWeaponText + ' al colpire (→ ' +
        window.AppEngine.formatMod(view.weapon.hit + view.sacredWeaponBonus) + ') e danni Radiosi.');
    }
    /* Danno da Furia (Barbaro): tabella per livello nei dati, mai mostrata da
       nessuna parte finora — il giocatore doveva ricordarsela a memoria. È un
       bonus che si applica solo con attacchi basati sulla Forza mentre la
       Furia è attiva (stato transitorio, non tracciato nello stato salvato),
       quindi resta una nota informativa e non un numero già sommato sopra. */
    var klass = (window.MANUAL_55.classes || {})[ch.classId] || {};
    var rageBonus = (klass.rageDamage || [])[view.level];
    if (rageBonus) {
      parts.push('In Furia: +' + rageBonus + ' danni con attacchi basati sulla Forza.');
    }
    /* Attacco Furtivo (Ladro): stessa idea della nota Furia — un bonus a
       tabella (klass.sneakAttackD6) mai mostrato altrove, che si applica solo
       una volta per turno con un'arma Accurata o a distanza e vantaggio (o un
       alleato adiacente al bersaglio), quindi resta informativo. */
    var sneakDice = (klass.sneakAttackD6 || [])[view.level];
    if (sneakDice) {
      parts.push('Attacco Furtivo: +' + sneakDice + 'd6 una volta per turno (arma Accurata o a distanza, con vantaggio o un alleato adiacente al bersaglio).');
    }
    /* Arti Marziali (Monaco): il dado sostituisce il danno normale del colpo
       senz'armi o di un'arma da Monaco, qualunque cosa sia nella riga Arma
       sopra — informativo per lo stesso motivo delle altre due note. */
    var martialDie = (klass.martialArtsDie || [])[view.level];
    if (martialDie) {
      parts.push('Arti Marziali: ' + martialDie + ' al posto del danno normale del colpo senz\'armi o di un\'arma da Monaco, con Destrezza al posto della Forza se preferisci.');
    }

    return parts.join(' ');
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
      var mastery = (ch.weapon && ch.weapon.mastery) || '';
      mastEl.textContent = mastery ? 'Maestria: ' + mastery : '';
      mastEl.classList.toggle('hidden', !mastery);
    }

    // Maestrie possedute (scelte alla creazione): il personaggio le sa usare
    // anche se in mano ha un'altra arma, quindi vanno dette a parte.
    var ownedEl = document.getElementById('atk-masteries');
    if (ownedEl) {
      var owned = (ch.weaponMasteries || []).map(function (id) {
        var w = null;
        (window.MANUAL_55.weapons || []).forEach(function (x) {
          if (x.id === id) {
            w = x;
          }
        });

        return w ? w.name + ' (' + w.mastery + ')' : id;
      });
      ownedEl.textContent = owned.length ? 'Maestrie nelle armi: ' + owned.join(', ') : '';
      ownedEl.classList.toggle('hidden', !owned.length);
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

    // "Attacco Extra: N colpi": generico da klass.extraAttacks[livello] (colpi
    // oltre al primo). Il Guerriero arriva a 4 colpi totali, non solo 2 come
    // Paladino/Barbaro, quindi il numero va calcolato invece di un semplice
    // mostra/nascondi a soglia fissa.
    var manual = window.MANUAL_55 || { classes: {} };
    var extraHits = ((manual.classes[view.classId] || {}).extraAttacks || [])[view.level] || 0;
    var extraEl = document.getElementById('atk-extra');
    if (extraEl) {
      var totalHits = 1 + extraHits;
      extraEl.textContent = 'Attacco Extra: ' + totalHits + ' colpi';
      extraEl.classList.toggle('hidden', totalHits < 2);
    }

    var note = buildAttackNote(view, ch);
    setText('atk-note', note);
    var noteEl = document.getElementById('atk-note');
    if (noteEl) { noteEl.classList.toggle('hidden', !note); }
  }

  function render() {
    var view = window.AppEngine.getView();
    renderAbilities(view);
    renderSaves(view);
    renderSkills(view);
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
