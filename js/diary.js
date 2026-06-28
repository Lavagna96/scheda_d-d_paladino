(function () {
  function uid() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function renderSessions() {
    var container = document.getElementById('sessions-accordion');
    if (!container) {
      return;
    }
    var state = window.AppStorage.getState();
    var sessions = state.diary.sessions;
    container.innerHTML = '';
    if (sessions.length === 0) {
      container.innerHTML = '<p class="diary-empty">Nessuna cronaca. Tocca + per aggiungere una sessione.</p>';

      return;
    }
    sessions.forEach(function (session, i) {
      var item = document.createElement('div');
      item.className = 'accordion-item' + (i === 0 ? ' open' : '');
      item.innerHTML =
        '<div class="accordion-header">' +
          '<input class="session-title-input" value="' + escapeAttr(session.title || 'Sessione') + '" aria-label="Titolo sessione">' +
          '<span class="accordion-chevron">▼</span>' +
        '</div>' +
        '<div class="accordion-body">' +
          '<textarea class="session-textarea" aria-label="Note sessione">' + escapeHtml(session.body || '') + '</textarea>' +
        '</div>';

      var header = item.querySelector('.accordion-header');
      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('session-title-input')) {
          return;
        }
        item.classList.toggle('open');
      });

      var titleInp = item.querySelector('.session-title-input');
      titleInp.addEventListener('input', function () {
        session.title = titleInp.value;
        window.AppStorage.saveState(state);
      });
      titleInp.addEventListener('click', function (e) { e.stopPropagation(); });

      var textarea = item.querySelector('.session-textarea');
      textarea.addEventListener('input', function () {
        session.body = textarea.value;
        window.AppStorage.saveState(state);
      });

      container.appendChild(item);
    });
  }

  function renderPng() {
    var container = document.getElementById('png-list');
    if (!container) {
      return;
    }
    var state = window.AppStorage.getState();
    var list = state.diary.png.slice().sort(function (a, b) {
      return (a.name || '').localeCompare(b.name || '', 'it');
    });
    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = '<p class="diary-empty">Nessun PNG registrato.</p>';

      return;
    }
    list.forEach(function (entry) {
      var idx = state.diary.png.indexOf(entry);
      var row = document.createElement('div');
      row.className = 'edit-row';
      var main = document.createElement('div');
      main.className = 'edit-main';
      var nameEl = document.createElement('div');
      nameEl.className = 'edit-name';
      nameEl.contentEditable = 'true';
      nameEl.setAttribute('data-ph', 'Nome');
      nameEl.textContent = entry.name || '';
      var noteEl = document.createElement('div');
      noteEl.className = 'edit-desc';
      noteEl.contentEditable = 'true';
      noteEl.setAttribute('data-ph', 'Note');
      noteEl.textContent = entry.notes || '';
      var meta = document.createElement('div');
      meta.className = 'edit-meta';
      var typeSel = document.createElement('select');
      typeSel.className = 'png-type';
      ['PNG', 'Fazione', 'Città'].forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (entry.type === t) {
          opt.selected = true;
        }
        typeSel.appendChild(opt);
      });
      meta.appendChild(typeSel);
      main.appendChild(nameEl);
      main.appendChild(noteEl);
      main.appendChild(meta);

      var del = document.createElement('button');
      del.className = 'edit-del';
      del.type = 'button';
      del.innerHTML = '✕';
      del.setAttribute('aria-label', 'Elimina');

      typeSel.addEventListener('change', function () {
        entry.type = typeSel.value;
        window.AppStorage.saveState(state);
      });
      nameEl.addEventListener('input', function () {
        entry.name = nameEl.textContent;
        window.AppStorage.saveState(state);
      });
      noteEl.addEventListener('input', function () {
        entry.notes = noteEl.textContent;
        window.AppStorage.saveState(state);
      });
      del.addEventListener('click', function () {
        state.diary.png.splice(idx, 1);
        window.AppStorage.saveState(state);
        renderPng();
      });

      row.appendChild(main);
      row.appendChild(del);
      container.appendChild(row);
    });
  }

  function renderQuestList(containerId, arr, completed) {
    var container = document.getElementById(containerId);
    if (!container) {
      return;
    }
    container.innerHTML = '';
    if (arr.length === 0) {
      container.innerHTML = '<p class="diary-empty">Nessuna missione.</p>';

      return;
    }
    var state = window.AppStorage.getState();
    arr.forEach(function (quest, i) {
      var row = document.createElement('div');
      row.className = 'edit-row quest-edit-row';
      var check = document.createElement('button');
      check.type = 'button';
      check.className = 'quest-check' + (completed ? ' checked' : '');
      check.textContent = completed ? '✓' : '';
      check.setAttribute('aria-label', completed ? 'Segna attiva' : 'Segna completata');
      var main = document.createElement('div');
      main.className = 'edit-main';
      var text = document.createElement('div');
      text.className = 'edit-name';
      text.contentEditable = 'true';
      text.setAttribute('data-ph', 'Descrizione missione');
      text.textContent = quest.text || '';
      main.appendChild(text);
      var del = document.createElement('button');
      del.className = 'edit-del';
      del.type = 'button';
      del.innerHTML = '✕';
      del.setAttribute('aria-label', 'Elimina');

      check.addEventListener('click', function () {
        var removed = arr.splice(i, 1)[0];
        if (completed) {
          state.diary.quests.active.push(removed);
        } else {
          state.diary.quests.completed.push(removed);
        }
        window.AppStorage.saveState(state);
        renderQuests();
      });
      text.addEventListener('input', function () {
        quest.text = text.textContent;
        window.AppStorage.saveState(state);
      });
      del.addEventListener('click', function () {
        arr.splice(i, 1);
        window.AppStorage.saveState(state);
        renderQuests();
      });

      row.appendChild(check);
      row.appendChild(main);
      row.appendChild(del);
      container.appendChild(row);
    });
  }

  function renderQuests() {
    var state = window.AppStorage.getState();
    renderQuestList('quest-active', state.diary.quests.active, false);
    renderQuestList('quest-completed', state.diary.quests.completed, true);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function addSession() {
    var state = window.AppStorage.getState();
    state.diary.sessions.unshift({
      id: uid(),
      title: 'Sessione ' + (state.diary.sessions.length + 1),
      body: ''
    });
    window.AppStorage.saveState(state);
    renderSessions();
  }

  function addPng() {
    var state = window.AppStorage.getState();
    state.diary.png.push({ name: '', type: 'PNG', notes: '' });
    window.AppStorage.saveState(state);
    renderPng();
    var rows = document.querySelectorAll('#png-list .edit-name');
    var last = rows[rows.length - 1];
    if (last) {
      last.focus();
    }
  }

  function addQuest() {
    var state = window.AppStorage.getState();
    state.diary.quests.active.push({ id: uid(), text: '' });
    window.AppStorage.saveState(state);
    renderQuests();
  }

  function render() {
    renderSessions();
    renderPng();
    renderQuests();
  }

  function init() {
    render();
  }

  window.AppDiary = {
    init: init,
    render: render,
    addSession: addSession,
    addPng: addPng,
    addQuest: addQuest
  };
})();
