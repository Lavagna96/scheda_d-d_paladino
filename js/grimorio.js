(function () {
  var cfg = window.APP_CONFIG;
  var activeLevel = '1';

  function getChaMod() {
    var cha = cfg.ABILITIES.filter(function (a) { return a.name === 'CAR'; })[0];

    return cha ? cha.mod : '+0';
  }

  function renderGrimStats() {
    var ch = cfg.CHARACTER;
    var dcEl = document.getElementById('grim-dc');
    var atkEl = document.getElementById('grim-atk');
    var chaEl = document.getElementById('grim-cha');
    if (dcEl) {
      dcEl.textContent = ch.spellDc;
    }
    if (atkEl) {
      atkEl.textContent = (ch.spellAttack >= 0 ? '+' : '') + ch.spellAttack;
    }
    if (chaEl) {
      chaEl.textContent = getChaMod();
    }
  }

  function renderSlots() {
    if (!window.AppSheet || !window.AppSheet.renderResourceCard) {
      return;
    }
    document.querySelectorAll('#view-grimorio .res-card').forEach(function (card) {
      window.AppSheet.renderResourceCard(card);
    });
  }

  function renderSpellCards() {
    var container = document.getElementById('spell-list-container');
    if (!container) {
      return;
    }
    container.innerHTML = '';
    var groups = { '0': [], '1': [], '2': [], '3': [] };
    cfg.SPELLS.forEach(function (spell) {
      var lvlKey = spell.level >= 3 ? '3' : String(spell.level);
      groups[lvlKey].push(spell);
    });

    Object.keys(groups).forEach(function (lvlKey) {
      if (groups[lvlKey].length === 0 && lvlKey !== activeLevel) {
        return;
      }
      var group = document.createElement('div');
      group.className = 'spell-level-group' + (lvlKey === activeLevel ? '' : ' hidden');
      group.setAttribute('data-level-group', lvlKey);

      if (lvlKey === '0' && groups[lvlKey].length === 0) {
        var empty = document.createElement('p');
        empty.className = 'note';
        empty.textContent = 'Nessun trucchetto per questo personaggio.';
        group.appendChild(empty);
      }

      groups[lvlKey].forEach(function (spell) {
        var card = document.createElement('article');
        card.className = 'spellcard pressable';
        card.id = 'spell-' + spell.id;
        card.setAttribute('data-detail-title', spell.name);
        card.setAttribute('data-detail-body', spell.desc);
        card.innerHTML =
          '<div class="sc-head">' +
            '<span class="sc-name">' + spell.name + (spell.always ? ' ★' : '') + '</span>' +
            '<span class="sc-lvl">' + spell.level + '° · ' + spell.school + '</span>' +
          '</div>' +
          '<div class="sc-meta">' + spell.meta.replace(/CONC/g, '<span class="conc">CONC</span>') + '</div>' +
          '<p class="sc-desc">' + spell.desc + '</p>';
        group.appendChild(card);
      });
      container.appendChild(group);
    });
  }

  function bindLevelTabs() {
    document.querySelectorAll('.level-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        activeLevel = tab.getAttribute('data-level');
        document.querySelectorAll('.level-tab').forEach(function (t) {
          t.classList.toggle('active', t === tab);
        });
        document.querySelectorAll('.spell-level-group').forEach(function (g) {
          g.classList.toggle('hidden', g.getAttribute('data-level-group') !== activeLevel);
        });
      });
    });
  }

  function bindSearch() {
    var input = document.getElementById('spell-search');
    if (!input) {
      return;
    }
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      document.querySelectorAll('.spellcard').forEach(function (card) {
        var name = (card.querySelector('.sc-name') || {}).textContent || '';
        card.classList.toggle('hidden', q.length > 0 && name.toLowerCase().indexOf(q) === -1);
      });
    });
  }

  function render() {
    renderGrimStats();
    renderSpellCards();
    renderSlots();
  }

  function init() {
    render();
    bindLevelTabs();
    bindSearch();
  }

  window.AppGrimorio = {
    init: init,
    render: render,
    renderSlots: renderSlots
  };
})();
