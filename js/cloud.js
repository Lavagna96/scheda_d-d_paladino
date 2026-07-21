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
  doc, getDoc, getDocs, collection, setDoc, onSnapshot, serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(function () {
  var config = window.FIREBASE_CONFIG;
  var DEFAULT_CHAR_ID = 'tharion-velnar';
  var PUSH_DEBOUNCE_MS = 1500;

  function charId() {
    return localStorage.getItem('app-active-char') || DEFAULT_CHAR_ID;
  }

  var accountBtn = document.getElementById('opt-account');

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
    var el = document.getElementById('acc-sync-status');
    if (el) {
      el.textContent = label;
    }
  }

  function rerenderAll() {
    ['AppHeader', 'AppStats', 'AppSheet', 'AppItems', 'AppGrimorio', 'AppTreasury', 'AppDiary', 'AppInspiration']
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
        Object.assign(window.AppStorage.getDefaultState(), remoteState),
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
    unsubscribeDoc = onSnapshot(charRef(), function (snap) {
      if (snap.metadata.hasPendingWrites) {
        return; // eco delle nostre stesse scritture
      }
      if (!snap.exists()) {
        pushNow(); // primo accesso: carica la scheda locale nel cloud

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

  function characterClassName(classId) {
    var manual = window.MANUAL_55;
    if (manual && manual.classes && manual.classes[classId]) {
      return manual.classes[classId].name;
    }

    return classId || '';
  }

  function dashboardItemFromCharacter(ch, id) {
    ch = ch || {};

    return {
      id: id,
      name: ch.name || 'Senza nome',
      className: characterClassName(ch.classId),
      subclassName: ch.subclassName || '',
      level: ch.level || 1,
      speciesLabel: ch.speciesLabel || '',
      portrait: ch.portrait || '',
      avatar: ch.avatar || '✦'
    };
  }

  function localDashboardItem() {
    var state = window.AppStorage.getState();

    return dashboardItemFromCharacter(state.character, charId());
  }

  function loadDashboard() {
    if (!window.AppDashboard) {
      return;
    }
    getDocs(collection(db, 'users', user.uid, 'characters')).then(function (snap) {
      var items = [];
      snap.forEach(function (d) {
        var data = d.data();
        if (data && data.state) {
          items.push(dashboardItemFromCharacter(data.state.character, d.id));
        }
      });
      if (items.length === 0) {
        items = [localDashboardItem()];
      }
      window.AppDashboard.render(items, onSelectCharacter);
    }).catch(function () {
      window.AppDashboard.render([localDashboardItem()], onSelectCharacter);
      window.AppDashboard.showError('Impossibile aggiornare la lista dal cloud');
    });
  }

  function onSelectCharacter(id) {
    localStorage.setItem('app-active-char', id);
    sessionStorage.setItem('app-skip-dashboard', '1');
    location.reload(); // stato pulito: scelta deliberata
  }

  /* Dopo l'autenticazione (ed eventuale sblocco Face ID) si atterra sempre
     sulla dashboard, TRANNE quando arriva da lì una scelta già fatta
     (sessionStorage 'app-skip-dashboard', impostato da onSelectCharacter
     e dal reload di ritorno dal lucchetto). */
  function enterApp() {
    if (sessionStorage.getItem('app-skip-dashboard') === '1') {
      sessionStorage.removeItem('app-skip-dashboard');
      document.body.classList.remove('in-dashboard');
      setAuthPhase('auth-in');

      return;
    }
    setAuthPhase('auth-in');
    document.body.classList.add('in-dashboard');
    loadDashboard();
  }

  /* ---------- UI account ---------- */

  function show(el, visible) {
    if (el) {
      el.classList.toggle('hidden', !visible);
    }
  }

  function setError(msg) {
    var el = document.getElementById('acc-error');
    if (el) {
      el.textContent = msg || '';
    }
  }

  function refreshAccountUi() {
    show(document.getElementById('account-logged-out'), !user);
    show(document.getElementById('account-logged-in'), !!user);
    var emailEl = document.getElementById('acc-user-email');
    if (emailEl && user) {
      emailEl.textContent = user.email;
    }
    var dashUserEl = document.getElementById('dash-user');
    if (dashUserEl && user) {
      dashUserEl.textContent = user.email;
    }
    var gear = document.getElementById('header-options');
    if (gear) {
      gear.classList.toggle('cloud-on', !!user);
    }
    setSyncStatus(lastSyncLabel);
    updateFaceIdBtnLabel();
  }

  function updateFaceIdBtnLabel() {
    var btn = document.getElementById('acc-faceid');
    if (!btn || btn.classList.contains('hidden')) {
      return;
    }
    btn.textContent = window.AppFaceId && AppFaceId.isEnabled()
      ? 'Disattiva sblocco con Face ID'
      : 'Attiva sblocco con Face ID';
  }

  function openModal() {
    setError('');
    refreshAccountUi();
    show(document.getElementById('account-modal'), true);
    document.getElementById('options-panel').classList.add('hidden');
  }

  function closeModal() {
    show(document.getElementById('account-modal'), false);
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

    var faceidBtn = document.getElementById('lg-faceid');
    if (faceidBtn) {
      faceidBtn.addEventListener('click', function () {
        setLoginError('');
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
        signOut(auth);
      });
    }
  }

  function bindUi() {
    show(accountBtn, true);
    accountBtn.addEventListener('click', openModal);
    document.getElementById('account-close').addEventListener('click', closeModal);
    var modal = document.getElementById('account-modal');
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    var dashGear = document.getElementById('dash-gear');
    if (dashGear) {
      dashGear.addEventListener('click', openModal);
    }
    var optDashboard = document.getElementById('opt-dashboard');
    if (optDashboard) {
      show(optDashboard, true);
      optDashboard.addEventListener('click', function () {
        location.reload(); // niente skip flag: si riatterra sulla dashboard
      });
    }

    document.getElementById('acc-login').addEventListener('click', function () {
      setError('');
      signInWithEmailAndPassword(auth,
        document.getElementById('acc-email').value.trim(),
        document.getElementById('acc-pass').value
      ).catch(function (err) { setError(errorMessage(err)); });
    });

    document.getElementById('acc-register').addEventListener('click', function () {
      setError('');
      createUserWithEmailAndPassword(auth,
        document.getElementById('acc-email').value.trim(),
        document.getElementById('acc-pass').value
      ).catch(function (err) { setError(errorMessage(err)); });
    });

    document.getElementById('acc-forgot').addEventListener('click', function () {
      setError('');
      var email = document.getElementById('acc-email').value.trim();
      if (!email) {
        setError('Scrivi la tua email qui sopra, poi ripremi.');

        return;
      }
      sendPasswordResetEmail(auth, email).then(function () {
        setError('Email di recupero inviata ✓');
      }).catch(function (err) { setError(errorMessage(err)); });
    });

    document.getElementById('acc-logout').addEventListener('click', function () {
      signOut(auth);
    });

    var faceidBtn = document.getElementById('acc-faceid');
    if (faceidBtn && window.AppFaceId && AppFaceId.isSupported()) {
      AppFaceId.checkPlatformAuthenticator().then(function (hasAuthenticator) {
        if (hasAuthenticator) {
          show(faceidBtn, true);
          updateFaceIdBtnLabel();
        }
      });
      faceidBtn.addEventListener('click', function () {
        setError('');
        if (AppFaceId.isEnabled()) {
          AppFaceId.disable();
          updateFaceIdBtnLabel();
        } else {
          AppFaceId.enable(user.uid, user.email).then(function () {
            updateFaceIdBtnLabel();
          }).catch(function (err) {
            setError('Face ID non attivato: ' + ((err && err.message) || 'errore sconosciuto'));
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
          AppFaceId.unlock().then(function (ok) {
            // Nessun messaggio d'errore qui: se iOS rifiuta la get() senza
            // gesto utente resta la riserva del medaglione #lg-faceid.
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
    getUser: function () { return user; }
  };
})();
