/*
 * Sincronizzazione cloud (Firebase Auth + Firestore).
 *
 * - Senza FIREBASE_CONFIG l'app resta in solo-locale: questo modulo esce subito.
 * - localStorage rimane la fonte immediata; il cloud è un mirror con
 *   last-write-wins basato su state.lastModifiedMs.
 * - Documento: users/{uid}/characters/tharion-velnar (pronto per il multi-PG).
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  doc, getDoc, setDoc, onSnapshot, serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(function () {
  var config = window.FIREBASE_CONFIG;
  var CHAR_ID = 'tharion-velnar';
  var PUSH_DEBOUNCE_MS = 1500;

  var accountBtn = document.getElementById('opt-account');

  if (!config) {
    return; // cloud non configurato: app in solo-locale
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
    return doc(db, 'users', user.uid, 'characters', CHAR_ID);
  }

  function setSyncStatus(label) {
    lastSyncLabel = label;
    var el = document.getElementById('acc-sync-status');
    if (el) {
      el.textContent = label;
    }
  }

  function rerenderAll() {
    ['AppHeader', 'AppSheet', 'AppGrimorio', 'AppTreasury', 'AppDiary', 'AppInspiration']
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
   * (manuals/5.5 + sottocollezioni spells/classes/species). Il file locale
   * js/manual-55.js è la fonte di verità: se la sua versione è più nuova
   * di quella nel documento radice, tutto viene (ri)caricato in un batch.
   * Richiede nelle regole Firestore: match /manuals/{document=**}
   * { allow read, write: if request.auth != null; }
   */
  function plain(obj) {
    return JSON.parse(JSON.stringify(obj));
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
      var batch = writeBatch(db);
      manual.spells.forEach(function (spell) {
        batch.set(doc(db, 'manuals', '5.5', 'spells', spell.id), plain(spell));
      });
      Object.keys(manual.classes).forEach(function (id) {
        batch.set(doc(db, 'manuals', '5.5', 'classes', id), plain(manual.classes[id]));
      });
      Object.keys(manual.species).forEach(function (id) {
        batch.set(doc(db, 'manuals', '5.5', 'species', id), plain(manual.species[id]));
      });
      batch.set(rootRef, {
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

      return batch.commit();
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
    var gear = document.getElementById('header-options');
    if (gear) {
      gear.classList.toggle('cloud-on', !!user);
    }
    setSyncStatus(lastSyncLabel);
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
  }

  /* ---------- avvio ---------- */

  onAuthStateChanged(auth, function (u) {
    user = u;
    if (user) {
      setSyncStatus('Connessione…');
      watchDoc();
      syncManual();
    } else {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      setSyncStatus('Non connesso');
    }
    refreshAccountUi();
  });

  bindUi();

  window.AppCloud = {
    enabled: true,
    schedulePush: schedulePush,
    getUser: function () { return user; }
  };
})();
