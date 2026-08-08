/*
 * Sincronizzazione cloud (Firebase Auth + Firestore).
 *
 * - Senza FIREBASE_CONFIG l'app resta in solo-locale: questo modulo esce subito.
 * - localStorage rimane la fonte immediata; il cloud è un mirror con
 *   last-write-wins basato su state.lastModifiedMs.
 * - Documento: users/{uid}/characters/{id} — un documento per personaggio
 *   (Fase 2: dashboard multi-personaggio, id attivo in 'app-active-char').
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  doc, getDoc, getDocs, getDocsFromCache, collection, setDoc, deleteDoc, onSnapshot,
  serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(function () {
  var config = window.FIREBASE_CONFIG;
  var PUSH_DEBOUNCE_MS = 1500;

  function charId() {
    if (window.AppStorage && window.AppStorage.activeCharId) {
      return window.AppStorage.activeCharId();
    }

    return localStorage.getItem('app-active-char');
  }

  function isDeletedCharacter(id) {
    return window.AppStorage && window.AppStorage.isCharacterDeleted
      && window.AppStorage.isCharacterDeleted(id);
  }

  /* Cancello d'ingresso (Fase 1) + lucchetto Face ID (Step 1.3): stati sul
     body — vedi css/components/login.css */
  function setAuthPhase(phase) {
    var b = document.body;
    b.classList.remove('auth-checking', 'auth-out', 'auth-in', 'auth-locked');
    b.classList.add(phase);
  }

  if (!config) {
    setAuthPhase('auth-in'); // cloud non configurato: app in solo-locale, niente gate
    document.body.classList.remove('login-not-ready');
    setTimeout(function () {
      if (window.AppDashboard && window.AppDashboard.bootShell) {
        window.AppDashboard.bootShell();
      }
    }, 0);
    window.AppCloud = {
      enabled: false,
      schedulePush: function () {}
    };

    return;
  }

  var app = initializeApp(config);
  var auth = getAuth(app);
  var db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
  });

  var user = null;
  var unsubscribeDoc = null;
  var pushTimer = null;
  var applyingRemote = false;
  var lastSyncLabel = 'In attesa…';

  /* ---------- helpers ---------- */

  function charRef() {
    return doc(db, 'users', user.uid, 'characters', charId());
  }

  function setSyncStatus(label) {
    lastSyncLabel = label;
    var el = document.getElementById('app-menu-sync');
    if (el) {
      el.textContent = label;
    }
  }

  function rerenderAll() {
    ['AppHeader', 'AppStats', 'AppTraits', 'AppSheet', 'AppItems', 'AppLevelUp', 'AppGrimorio', 'AppTreasury', 'AppDiary', 'AppInspiration']
      .forEach(function (name) {
        if (window[name] && window[name].render) {
          try { window[name].render(); } catch (e) { /* ignore */ }
        }
      });
  }

  function errorMessage(err) {
    var code = (err && err.code) || '';
    var map = {
      'auth/invalid-email': 'Email non valida.',
      'auth/missing-password': 'Inserisci la password.',
      'auth/invalid-credential': 'Email o password errati.',
      'auth/wrong-password': 'Email o password errati.',
      'auth/user-not-found': 'Nessun account con questa email.',
      'auth/email-already-in-use': 'Esiste già un account con questa email.',
      'auth/weak-password': 'Password troppo corta (minimo 6 caratteri).',
      'auth/too-many-requests': 'Troppi tentativi: riprova tra qualche minuto.',
      'auth/network-request-failed': 'Nessuna connessione: riprova quando sei online.'
    };

    return map[code] || 'Errore: ' + (code || (err && err.message) || 'sconosciuto');
  }

  /* ---------- sync ---------- */

  function pushNow() {
    if (!user) {
      return;
    }
    var id = charId();
    if (!id || isDeletedCharacter(id)) {
      return;
    }
    var state = window.AppStorage.getState();
    setSyncStatus('Salvataggio…');
    setDoc(charRef(), {
      state: JSON.parse(JSON.stringify(state)),
      updatedAt: serverTimestamp()
    }).then(function () {
      setSyncStatus('Sincronizzata ✓');
    }).catch(function () {
      setSyncStatus('Offline: sincronizzo appena torni in rete');
    });
  }

  function schedulePush() {
    if (!user || applyingRemote) {
      return;
    }
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
  }

  function applyRemote(remoteState) {
    applyingRemote = true;
    window.__applyingRemoteState = true; // evita il ri-timbro di lastModifiedMs
    try {
      window.AppStorage.saveState(
        window.AppStorage.mergeImportedState(remoteState),
        true
      );
      rerenderAll();
    } finally {
      applyingRemote = false;
      window.__applyingRemoteState = false;
    }
  }

  /*
   * Manuale 5.5: mantiene su Firestore una copia del manuale
   * (manuals/5.5 + sottocollezioni spells/classes/species/feats). Il file
   * locale js/manual-55.js è la fonte di verità: se la sua versione è più
   * nuova di quella nel documento radice, tutto viene (ri)caricato.
   * I privilegi per livello e le sottoclassi viaggiano dentro i documenti
   * classe (annidati), quindi si sincronizzano con quelli; i talenti sono
   * una sottocollezione a sé (feats), come classes/species.
   * Richiede nelle regole Firestore: match /manuals/{document=**}
   * { allow read, write: if request.auth != null; }
   */
  function plain(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* Il manuale ha ~400 incantesimi: un singolo batch sfiorerebbe il limite
     Firestore di 500 scritture. Suddividiamo in blocchi (margine a 400) e li
     committiamo in sequenza. La versione radice va scritta DOPO, a parte:
     così avanza solo a sync completato e, se un blocco fallisce, resta
     indietro e il prossimo accesso ritenta l'intero caricamento. */
  var SYNC_CHUNK = 400;

  function commitInChunks(writes) {
    var chunks = [];
    for (var i = 0; i < writes.length; i += SYNC_CHUNK) {
      chunks.push(writes.slice(i, i + SYNC_CHUNK));
    }

    return chunks.reduce(function (prev, chunk) {
      return prev.then(function () {
        var batch = writeBatch(db);
        chunk.forEach(function (w) { batch.set(w.ref, w.data); });

        return batch.commit();
      });
    }, Promise.resolve());
  }

  /* Firestore non accetta array annidati: le tabelle slot (array di array)
     diventano mappe indicizzate per livello di classe. */
  function slotTableAsMap(table) {
    var map = {};
    table.forEach(function (slots, level) {
      if (slots) {
        map[String(level)] = slots;
      }
    });

    return map;
  }

  function syncManual() {
    var manual = window.MANUAL_55;
    if (!user || !manual) {
      return;
    }
    var rootRef = doc(db, 'manuals', '5.5');
    getDoc(rootRef).then(function (snap) {
      var remoteVersion = snap.exists() ? (snap.data().version || 0) : 0;
      if (manual.version <= remoteVersion) {
        return;
      }
      var writes = [];
      manual.spells.forEach(function (spell) {
        writes.push({ ref: doc(db, 'manuals', '5.5', 'spells', spell.id), data: plain(spell) });
      });
      Object.keys(manual.classes).forEach(function (id) {
        writes.push({ ref: doc(db, 'manuals', '5.5', 'classes', id), data: plain(manual.classes[id]) });
      });
      Object.keys(manual.species).forEach(function (id) {
        writes.push({ ref: doc(db, 'manuals', '5.5', 'species', id), data: plain(manual.species[id]) });
      });
      Object.keys(manual.feats || {}).forEach(function (id) {
        writes.push({ ref: doc(db, 'manuals', '5.5', 'feats', id), data: plain(manual.feats[id]) });
      });

      // Prima tutti i dati (in blocchi), poi la versione radice a parte.
      return commitInChunks(writes).then(function () {
        var rootBatch = writeBatch(db);
        rootBatch.set(rootRef, {
          version: manual.version,
          name: 'Player\'s Handbook 2024 (5.5)',
          slotTables: {
            full: slotTableAsMap(manual.slotTables.full),
            half: slotTableAsMap(manual.slotTables.half),
            pactSlots: plain(manual.slotTables.pactSlots),
            pactSlotLevel: plain(manual.slotTables.pactSlotLevel)
          },
          updatedAt: serverTimestamp()
        });

        return rootBatch.commit();
      });
    }).catch(function () { /* regole non aggiornate o offline: ignora */ });
  }

  function watchDoc() {
    if (unsubscribeDoc) {
      unsubscribeDoc();
    }
    var id = charId();
    if (!id || isDeletedCharacter(id)) {
      return;
    }
    unsubscribeDoc = onSnapshot(charRef(), function (snap) {
      if (snap.metadata.hasPendingWrites) {
        return; // eco delle nostre stesse scritture
      }
      if (!snap.exists()) {
        /* Primo upload: stato in locale ma doc assente. Dopo un'eliminazione
           dalla dashboard la chiave locale è già stata rimossa: non fare push
           (altrimenti watchDoc ricreerebbe il personaggio da AppStorage in RAM). */
        if (isDeletedCharacter(charId())) {
          return;
        }
        try {
          if (localStorage.getItem('char-' + charId() + '-state')) {
            pushNow();
          }
        } catch (e) { /* ignore */ }

        return;
      }
      var remote = snap.data().state;
      var local = window.AppStorage.getState();
      var localMs = local.lastModifiedMs || 0;
      var remoteMs = (remote && remote.lastModifiedMs) || 0;
      if (remoteMs > localMs) {
        applyRemote(remote);
        setSyncStatus('Sincronizzata ✓');
      } else if (localMs > remoteMs) {
        schedulePush(); // modifiche locali più recenti (es. fatte offline)
      } else {
        setSyncStatus('Sincronizzata ✓');
      }
    }, function () {
      setSyncStatus('Errore di lettura dal cloud');
    });
  }

  /* ---------- dashboard multi-personaggio (Fase 2) ---------- */

  function dashboardItemsFromSnap(snap) {
    var byId = {};
    snap.forEach(function (d) {
      if (isDeletedCharacter(d.id)) {
        return;
      }
      var data = d.data();
      if (data && data.state && window.AppStorage.dashboardItemFromCharacter) {
        byId[d.id] = window.AppStorage.dashboardItemFromCharacter(data.state.character, d.id);
      }
    });
    (window.AppStorage.listCharactersForDashboard() || []).forEach(function (item) {
      if (!byId[item.id]) {
        byId[item.id] = item;
      }
    });

    return Object.keys(byId).map(function (k) { return byId[k]; });
  }

  /* Con la navigazione interna (niente reload) la dashboard si riapre molto
     più spesso: leggere prima dalla cache locale di Firestore la mostra
     all'istante, poi il fetch dal server (in parallelo) la riallinea appena
     arriva, senza far aspettare un giro di rete ad ogni "I tuoi personaggi". */
  function loadDashboard() {
    if (!window.AppDashboard) {
      return;
    }
    var col = collection(db, 'users', user.uid, 'characters');

    getDocsFromCache(col).then(function (snap) {
      if (!snap.empty) {
        window.AppDashboard.render(dashboardItemsFromSnap(snap), onSelectCharacter);
      }
    }).catch(function () { /* niente cache locale ancora: si aspetta la rete */ });

    getDocs(col).then(function (snap) {
      window.AppDashboard.render(dashboardItemsFromSnap(snap), onSelectCharacter);
    }).catch(function () {
      var items = window.AppStorage.listCharactersForDashboard() || [];
      window.AppDashboard.render(items, onSelectCharacter);
      window.AppDashboard.showError('Impossibile aggiornare la lista dal cloud');
    });
  }

  function onSelectCharacter(id) {
    if (window.AppDashboard && window.AppDashboard.selectCharacter) {
      window.AppDashboard.selectCharacter(id);
    }
  }

  /* Crea un nuovo personaggio (dal wizard di creazione, js/create.js): salva
     subito lo stato in locale sotto la sua chiave, scrive il documento
     Firestore e — a scrittura conclusa — ricarica la lista della dashboard così
     la nuova card compare. NON cambia il personaggio attivo: nel nuovo si entra
     dalla dashboard, come per gli altri. Offline lo stato resta in locale
     (comparirà al prossimo sync). */
  function createCharacter(id, state) {
    try {
      localStorage.setItem('char-' + id + '-state', JSON.stringify(state));
    } catch (e) { /* ignore */ }

    if (!user) {
      // Caso difensivo: il wizard si raggiunge solo da loggati. Lo stato è già
      // in locale; loadDashboard richiederebbe user.uid, quindi non la chiamo.
      return Promise.resolve();
    }

    return setDoc(doc(db, 'users', user.uid, 'characters', id), {
      state: JSON.parse(JSON.stringify(state)),
      updatedAt: serverTimestamp()
    }).then(function () {
      loadDashboard();
    }).catch(function () {
      loadDashboard();
    });
  }

  function reassignActiveCharacter(deletedId) {
    if (!user) {
      return Promise.resolve();
    }

    return getDocs(collection(db, 'users', user.uid, 'characters')).then(function (snap) {
      var nextId = null;
      snap.forEach(function (d) {
        if (d.id !== deletedId && !isDeletedCharacter(d.id) && !nextId) {
          nextId = d.id;
        }
      });
      if (nextId) {
        localStorage.setItem('app-active-char', nextId);
      }
    });
  }

  /* Elimina un personaggio (swipe-to-delete dalla dashboard, js/dashboard.js):
     stato locale rimosso subito, doc Firestore cancellato, poi la dashboard
     si ricarica da sé — non serve un caso speciale per "era l'ultimo
     personaggio": la lista vuota resta comunque con lo slot "+ Nuovo
     personaggio" per ripartire. */
  function deleteCharacter(id) {
    var wasActive = charId() === id;

    if (window.AppStorage && window.AppStorage.purgeCharacter) {
      window.AppStorage.purgeCharacter(id);
    } else {
      localStorage.removeItem('char-' + id + '-state');
      if (localStorage.getItem('app-active-char') === id) {
        localStorage.removeItem('app-active-char');
      }
    }

    function finishDelete() {
      var chain = wasActive ? reassignActiveCharacter(id) : Promise.resolve();

      return chain.then(function () {
        watchDoc();
        loadDashboard();
      });
    }

    if (!user) {
      return finishDelete();
    }

    return deleteDoc(doc(db, 'users', user.uid, 'characters', id)).then(function () {
      return finishDelete();
    }).catch(function () {
      window.AppDashboard.showError('Eliminazione non riuscita: riprova quando sei online.');
      watchDoc();
      loadDashboard();
    });
  }

  /* Dopo l'autenticazione (ed eventuale sblocco Face ID) si atterra sempre
     sulla dashboard, TRANNE quando arriva da lì una scelta già fatta
     (sessionStorage 'app-skip-dashboard', impostato da onSelectCharacter
     e dal reload di ritorno dal lucchetto). */
  function enterApp() {
    setAuthPhase('auth-in');
    if (sessionStorage.getItem('app-skip-dashboard') === '1') {
      sessionStorage.removeItem('app-skip-dashboard');
      if (charId()) {
        document.body.classList.remove('in-dashboard');

        return;
      }
    }
    document.body.classList.add('in-dashboard');
    loadDashboard();
  }

  /* ---------- UI account ---------- */

  function show(el, visible) {
    if (el) {
      el.classList.toggle('hidden', !visible);
    }
  }

  function refreshAccountUi() {
    var dashUserEl = document.getElementById('dash-user');
    if (dashUserEl && user) {
      dashUserEl.textContent = user.email;
    }
    var menuEmailEl = document.getElementById('app-menu-email');
    if (menuEmailEl) {
      menuEmailEl.textContent = user ? user.email : '—';
    }
    var settingsEmailEl = document.getElementById('menu-settings-email');
    if (settingsEmailEl) {
      settingsEmailEl.textContent = user ? user.email : '—';
    }
    setSyncStatus(lastSyncLabel);
    updateFaceIdBtnLabel();
  }

  function updateFaceIdBtnLabel() {
    var btn = document.getElementById('menu-faceid');
    if (!btn || btn.classList.contains('hidden')) {
      return;
    }
    btn.textContent = window.AppFaceId && AppFaceId.isEnabled()
      ? 'Disattiva sblocco con Face ID'
      : 'Attiva sblocco con Face ID';
  }

  /* ---------- vista di login ---------- */

  function setLoginError(msg) {
    var el = document.getElementById('lg-error');
    if (el) {
      el.textContent = msg || '';
    }
  }

  function bindLoginUi() {
    var email = document.getElementById('lg-email');
    var pass = document.getElementById('lg-pass');
    if (!email || !pass) {
      return;
    }

    document.getElementById('lg-login').addEventListener('click', function () {
      setLoginError('');
      signInWithEmailAndPassword(auth, email.value.trim(), pass.value)
        .catch(function (err) { setLoginError(errorMessage(err)); });
    });

    document.getElementById('lg-register').addEventListener('click', function () {
      setLoginError('');
      createUserWithEmailAndPassword(auth, email.value.trim(), pass.value)
        .catch(function (err) { setLoginError(errorMessage(err)); });
    });

    document.getElementById('lg-forgot').addEventListener('click', function () {
      setLoginError('');
      if (!email.value.trim()) {
        setLoginError('Scrivi la tua email qui sopra, poi ripremi.');

        return;
      }
      sendPasswordResetEmail(auth, email.value.trim()).then(function () {
        setLoginError('Email di recupero inviata ✓');
      }).catch(function (err) { setLoginError(errorMessage(err)); });
    });

    pass.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        document.getElementById('lg-login').click();
      }
    });

    // Campo dell'autofill passkey: si mostra solo se la Conditional UI è
    // davvero disponibile, altrimenti sarebbe una casella inerte e resta il
    // solo medaglione.
    var unlockField = document.getElementById('lg-unlock');
    if (unlockField && window.AppFaceId) {
      AppFaceId.canUseConditional().then(function (ok) {
        show(unlockField, ok);
      });
    }

    var faceidBtn = document.getElementById('lg-faceid');
    if (faceidBtn) {
      faceidBtn.addEventListener('click', function () {
        setLoginError('');
        window.AppFaceId.cancelConditional(); // libera la richiesta in attesa
        window.AppFaceId.unlock().then(function (ok) {
          if (ok) {
            enterApp();
          } else {
            setLoginError('Sblocco non riuscito: riprova.');
          }
        });
      });
    }

    var lockLogoutBtn = document.getElementById('lg-lock-logout');
    if (lockLogoutBtn) {
      lockLogoutBtn.addEventListener('click', function () {
        // Solo logout: il Face ID resta attivo, serve al prossimo accesso.
        if (window.AppFaceId) {
          AppFaceId.cancelConditional(); // niente ascolto appeso sulla schermata di login
        }
        signOut(auth);
      });
    }
  }

  function bindUi() {
    var dashGear = document.getElementById('dash-gear');
    if (dashGear) {
      dashGear.addEventListener('click', function () {
        window.AppMenu.toggle();
      });
    }
    var optDashboard = document.getElementById('menu-dashboard');
    if (optDashboard) {
      show(optDashboard, true);
      optDashboard.addEventListener('click', function () {
        if (window.AppMenu) {
          window.AppMenu.close();
        }
        // Niente reload: si stacca l'ascolto sul personaggio corrente e si
        // torna alla dashboard mostrandola subito con l'ultima lista nota
        // (loadDashboard la riallinea dal cloud appena pronta).
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        document.body.classList.add('in-dashboard');
        loadDashboard();
      });
    }

    var menuLogout = document.getElementById('menu-logout');
    if (menuLogout) {
      menuLogout.addEventListener('click', function () {
        if (window.AppMenu) {
          window.AppMenu.close();
        }
        signOut(auth);
      });
    }

    var faceidBtn = document.getElementById('menu-faceid');
    if (faceidBtn && window.AppFaceId && AppFaceId.isSupported()) {
      AppFaceId.checkPlatformAuthenticator().then(function (hasAuthenticator) {
        if (hasAuthenticator) {
          show(faceidBtn, true);
          updateFaceIdBtnLabel();
        }
      });
      faceidBtn.addEventListener('click', function () {
        if (AppFaceId.isEnabled()) {
          AppFaceId.disable();
          updateFaceIdBtnLabel();
        } else {
          AppFaceId.enable(user.uid, user.email).then(function () {
            updateFaceIdBtnLabel();
          }).catch(function (err) {
            alert('Face ID non attivato: ' + ((err && err.message) || 'errore sconosciuto'));
          });
        }
      });
    }
  }

  /* ---------- avvio ---------- */

  onAuthStateChanged(auth, function (u) {
    user = u;
    if (user) {
      if (window.AppFaceId && AppFaceId.shouldLock()) {
        // Se onAuthStateChanged si ripete (es. refresh del token) e siamo
        // già in lucchetto, non ripartire con un altro auto-scan.
        var giaBloccato = document.body.classList.contains('auth-locked');
        setAuthPhase('auth-locked');
        if (!giaBloccato) {
          // Niente unlock() automatica: all'atterraggio nessun foglio nativo
          // in mezzo allo schermo. Si resta in ascolto dell'autofill (la
          // passkey compare sopra la tastiera toccando #lg-unlock); il
          // medaglione #lg-faceid è la riserva quando l'autofill non c'è.
          AppFaceId.watchConditional().then(function (ok) {
            if (ok) {
              enterApp();
            }
          });
        }
      } else {
        enterApp();
      }
      setLoginError('');
      var passEl = document.getElementById('lg-pass');
      if (passEl) {
        passEl.value = '';
      }
      setSyncStatus('Connessione…');
      watchDoc();
      syncManual();
    } else {
      setAuthPhase('auth-out');
      document.body.classList.remove('in-dashboard'); // logout: fuori anche dalla dashboard
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      setSyncStatus('Non connesso');
    }
    refreshAccountUi();
  });

  bindUi();
  bindLoginUi();
  // Da qui in poi i bottoni del login hanno davvero un gestore agganciato:
  // qualunque messaggio di attesa mostrato nel frattempo va tolto (vedi
  // body.login-not-ready in login.css e il paracadute in app.js).
  document.body.classList.remove('login-not-ready');

  window.AppCloud = {
    enabled: true,
    schedulePush: schedulePush,
    createCharacter: createCharacter,
    deleteCharacter: deleteCharacter,
    watchActiveCharacter: watchDoc,
    getUser: function () { return user; }
  };
})();
