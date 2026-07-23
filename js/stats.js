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
      var v = row.querySelector('.v');
      if (v) {
        v.textContent = s.text;
      }
    });
    setText('ts-aura-note', 'Aura ' + view.aura.text + ' inclusa');
  }

  function renderSkills(view) {
    document.querySelectorAll('[data-skill]').forEach(function (row) {
      var sk = view.skills[row.getAttribute('data-skill')];
      if (!sk) {
        return;
      }
      var v = row.querySelector('.v');
      if (v) {
        v.textContent = sk.text;
      }
    });
    setText('skill-passive-perception', view.passivePerception);
  }

  /* Icona generica per le risorse di classe generate dinamicamente (che non
     hanno una card statica in index.html), es. la Furia del Barbaro. */
  function classResIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.6-2.2 1.2-2.8C8.5 10 8.8 6.5 12 3z"/></svg>';
  }

  var SECTION_BY_RESET = { short: '.res-sec-short', long: '.res-sec-long', day: '.res-sec-day' };

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
    if (ch.fightingStyle === 'duello') { parts.push('Stile Duellante +2 ai danni.'); }
    if (ch.fightingStyle === 'difesa') { parts.push('Stile Difesa +1 alla CA.'); }
    if (view.sacredWeaponBonus > 0) {
      parts.push('Con Arma Sacra: ' + view.sacredWeaponText + ' al colpire (→ ' +
        window.AppEngine.formatMod(view.weapon.hit + view.sacredWeaponBonus) + ') e danni Radiosi.');
    }

    return parts.join(' ');
  }

  function renderAttacks(view) {
    var ch = window.AppStorage.getState().character;
    setText('atk-weapon-name', view.weapon.name);
    setText('atk-weapon-hit', view.weapon.hitText);
    setText('atk-weapon-dmg', view.weapon.dmgText);

    // Riga Soffio: solo per chi ha quell'attacco (Dragonide → risorsa 'breath').
    var hasBreath = view.resources.some(function (r) { return r.key === 'breath'; });
    var breathHit = document.getElementById('atk-breath-hit');
    var breathRow = breathHit ? breathHit.closest('tr') : null;
    if (breathRow) { breathRow.classList.toggle('hidden', !hasBreath); }
    if (hasBreath) {
      setText('atk-breath-hit', 'TS DES ' + view.breath.dc);
      setText('atk-breath-dmg', view.breath.dice + ' fuoco');
    }

    // "Attacco Extra: N colpi": solo se la classe lo concede a questo livello.
    var manual = window.MANUAL_55 || { classes: {} };
    var cp = (manual.classes[view.classId] || {}).choicePoints || {};
    var extraEl = document.getElementById('atk-extra');
    if (extraEl) { extraEl.classList.toggle('hidden', !(cp.extraAttack && view.level >= cp.extraAttack)); }

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
