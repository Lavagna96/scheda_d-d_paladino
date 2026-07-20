(function () {
  /*
   * Dashboard multi-personaggio (Fase 2): lista dei personaggi dell'utente,
   * una card per ciascuno (ritratto o emblema di riserva), tap per entrare
   * nella scheda. Nessuna creazione qui: solo un segnaposto "presto
   * disponibile". Popolata da js/cloud.js via render(items, onSelect).
   */

  function classLine(item) {
    return [item.className, item.subclassName, item.speciesLabel]
      .filter(function (v) { return !!v; })
      .join(' · ');
  }

  function buildCard(item, onSelect) {
    var card = document.createElement('div');
    card.className = 'dash-card' + (item.portrait ? '' : ' no-portrait');
    if (item.portrait) {
      card.style.backgroundImage = 'url(' + item.portrait + ')';
    }

    var lvl = document.createElement('div');
    lvl.className = 'dash-lvl';
    lvl.textContent = 'Lv. ' + (item.level || 1);
    card.appendChild(lvl);

    if (!item.portrait) {
      var emblem = document.createElement('div');
      emblem.className = 'dash-emblem';
      emblem.textContent = item.avatar || '✦';
      card.appendChild(emblem);
    }

    var foot = document.createElement('div');
    foot.className = 'dash-foot';

    var name = document.createElement('div');
    name.className = 'dash-name';
    name.textContent = item.name || 'Senza nome';
    foot.appendChild(name);

    var line = document.createElement('div');
    line.className = 'dash-line';
    line.textContent = classLine(item);
    foot.appendChild(line);

    var enter = document.createElement('button');
    enter.type = 'button';
    enter.className = 'dash-enter';
    enter.textContent = 'Entra';
    foot.appendChild(enter);

    card.appendChild(foot);

    // Tutta la card è cliccabile (il bottone Entra non ha un handler suo:
    // il click ci arriva comunque per bubbling).
    card.addEventListener('click', function () {
      onSelect(item.id);
    });

    return card;
  }

  function render(items, onSelect) {
    var list = document.getElementById('dash-list');
    if (!list) {
      return;
    }
    list.innerHTML = '';
    (items || []).forEach(function (item) {
      list.appendChild(buildCard(item, onSelect));
    });

    var slot = document.createElement('div');
    slot.className = 'dash-slot';
    slot.textContent = '✦ Nuovo personaggio — presto disponibile';
    list.appendChild(slot);
  }

  function showError(msg) {
    var el = document.getElementById('dash-error');
    if (!el) {
      return;
    }
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  window.AppDashboard = {
    render: render,
    showError: showError
  };
})();
