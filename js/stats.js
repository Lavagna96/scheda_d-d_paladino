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

  function renderResources(view) {
    view.resources.forEach(function (r) {
      var card = document.querySelector('.res-card[data-key="' + r.key + '"]');
      if (!card) {
        return;
      }
      card.setAttribute('data-max', r.max);
      if (r.ctx) {
        var ctx = card.querySelector('.rc-ctx');
        if (ctx) {
          ctx.textContent = r.ctx;
        }
      }
    });
  }

  function renderAttacks(view) {
    setText('atk-weapon-name', view.weapon.name);
    setText('atk-weapon-hit', view.weapon.hitText);
    setText('atk-weapon-dmg', view.weapon.dmgText);
    setText('atk-breath-hit', 'TS DES ' + view.breath.dc);
    setText('atk-breath-dmg', view.breath.dice + ' fuoco');
    setText('atk-note',
      'Colpire/danni includono spada +1. Stile Duellante +2 ai danni. ' +
      'Con Arma Sacra: ' + view.sacredWeaponText + ' al colpire (→ ' +
      window.AppEngine.formatMod(view.weapon.hit + view.sacredWeaponBonus) +
      ') e danni Radiosi.');
  }

  function renderFeatures(view) {
    var auraTxt = view.aura.text + ' (CAR) a tutti i TS per te e alleati entro ' +
                  view.aura.rangeM + ' m.';
    var prot = document.getElementById('feat-aura-prot');
    if (prot) {
      prot.setAttribute('data-detail-body',
        'Tu e gli alleati nell\'aura (' + view.aura.rangeM + ' m) ' +
        view.aura.text + ' (CAR) a tutti i TS.');
      var fd = prot.querySelector('.fd');
      if (fd) {
        fd.textContent = auraTxt;
      }
    }
    var sacred = document.getElementById('feat-arma-sacra');
    if (sacred) {
      sacred.setAttribute('data-detail-body',
        'Per 10 min ' + view.sacredWeaponText + ' (CAR) al colpire con arma ' +
        'da mischia, danni Radiosi a scelta, luce intensa 6 m.');
      var fd2 = sacred.querySelector('.fd');
      if (fd2) {
        fd2.textContent = view.sacredWeaponText +
          ' colpire, danni Radiosi, luce 6 m per 10 min.';
      }
    }
  }

  function render() {
    var view = window.AppEngine.getView();
    renderAbilities(view);
    renderSaves(view);
    renderSkills(view);
    renderResources(view);
    renderAttacks(view);
    renderFeatures(view);
    setText('loh-max', view.poolMax.loh);
  }

  window.AppStats = {
    init: render,
    render: render
  };
})();
