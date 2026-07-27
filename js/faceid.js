(function () {
  /*
   * Sblocco biometrico locale (Face ID / Touch ID) via WebAuthn.
   *
   * Approccio "lucchetto": la sessione Firebase resta persistente, questo
   * modulo NON fa autenticazione lato server. Serve solo a bloccare
   * l'apertura dell'app su QUESTO dispositivo finché non passa la verifica
   * biometrica locale. La credenziale creata è legata a dispositivo +
   * origine (localhost e github.io sono origini diverse: comportamento
   * atteso, va riattivata su ognuna).
   *
   * Due strade per lo sblocco, nell'ordine:
   * 1. Conditional UI (autofill): all'avvio l'app si mette in ascolto senza
   *    aprire nulla; iOS propone la passkey con Face ID sopra la tastiera
   *    quando l'utente tocca il campo #lg-unlock. Richiede una credenziale
   *    *discoverable* (residentKey 'required'), quindi vale solo per quelle
   *    create da questa versione in poi.
   * 2. Medaglione Face ID: la get() classica col foglio modale di sistema,
   *    riserva per iOS senza autofill o per le credenziali vecchie.
   * In nessuno dei due casi il popup nativo compare da solo all'atterraggio.
   */

  var LS_ENABLED = 'app-faceid';
  var LS_CRED = 'app-faceid-cred';
  var LS_UID = 'app-faceid-uid';
  var LS_DISCOVERABLE = 'app-faceid-discoverable'; // '1' = passkey buona per l'autofill
  var LS_LAST_ACTIVE = 'app-faceid-last-active';
  var GRACE_MS = 5 * 60 * 1000; // tolleranza: sotto i 5 minuti di inattività niente lucchetto

  var _unlocked = false; // già sbloccato in questa sessione di pagina?
  var conditionalAbort = null; // richiesta conditional in attesa (WebAuthn ne ammette una sola)

  /* ---------- helpers base64url <-> ArrayBuffer ---------- */

  function bufToBase64Url(buf) {
    var bytes = new Uint8Array(buf);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    var b64 = btoa(bin);

    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBuf(b64url) {
    var b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    var pad = b64.length % 4;
    if (pad) {
      b64 += '='.repeat(4 - pad);
    }
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /* ---------- tolleranza inattività (5 minuti) ---------- */

  // Ogni chiamata registra "l'app era viva in questo istante"; shouldLock()
  // confronta questo timestamp con l'ora attuale per decidere se il
  // lucchetto deve scattare oppure no (breve pausa = niente Face ID).
  function touchActivity() {
    localStorage.setItem(LS_LAST_ACTIVE, String(Date.now()));
  }

  function lastActiveMs() {
    var raw = parseInt(localStorage.getItem(LS_LAST_ACTIVE), 10);

    return isNaN(raw) ? 0 : raw; // assente/non numerico → 0: blocca per prudenza
  }

  function bindActivityTracking() {
    window.addEventListener('pagehide', touchActivity);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        touchActivity();
      }
    });
    // In primo piano e app sbloccata: aggiorna il timestamp ogni 30s così la
    // finestra di tolleranza riparte da quando l'utente ha smesso di usarla.
    setInterval(function () {
      if (document.body.classList.contains('auth-in')) {
        touchActivity();
      }
    }, 30000);
  }

  /* ---------- stato ---------- */

  function isSupported() {
    return !!window.PublicKeyCredential;
  }

  function checkPlatformAuthenticator() {
    if (!isSupported()) {
      return Promise.resolve(false);
    }

    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(function (ok) { return !!ok; })
      .catch(function () { return false; });
  }

  function isEnabled() {
    return localStorage.getItem(LS_ENABLED) === '1' && !!localStorage.getItem(LS_CRED);
  }

  function shouldLock() {
    return isEnabled() && !_unlocked && (Date.now() - lastActiveMs() > GRACE_MS);
  }

  /* ---------- attivazione / disattivazione ---------- */

  function enable(uid, email) {
    if (!isSupported()) {
      return Promise.reject(new Error('WebAuthn non supportato su questo dispositivo.'));
    }
    cancelConditional(); // una create() con una get() in attesa fallirebbe
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var userId = new TextEncoder().encode(uid);

    return navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: { name: 'Scheda D&D', id: location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          // Discoverable: condizione necessaria perché iOS offra la passkey
          // nella barra QuickType sopra la tastiera (Conditional UI).
          residentKey: 'required',
          requireResidentKey: true
        },
        timeout: 60000
      }
    }).then(function (credential) {
      localStorage.setItem(LS_CRED, bufToBase64Url(credential.rawId));
      localStorage.setItem(LS_UID, uid);
      localStorage.setItem(LS_DISCOVERABLE, '1');
      localStorage.setItem(LS_ENABLED, '1');
      _unlocked = true;
      touchActivity();
    });
  }

  function disable() {
    cancelConditional();
    localStorage.removeItem(LS_ENABLED);
    localStorage.removeItem(LS_CRED);
    localStorage.removeItem(LS_UID);
    localStorage.removeItem(LS_DISCOVERABLE);
  }

  /* ---------- sblocco con autofill (Conditional UI) ---------- */

  function isConditionalAvailable() {
    if (!isSupported() || !PublicKeyCredential.isConditionalMediationAvailable) {
      return Promise.resolve(false);
    }

    return PublicKeyCredential.isConditionalMediationAvailable()
      .then(function (ok) { return !!ok; })
      .catch(function () { return false; });
  }

  // Vero solo per le credenziali create come discoverable: quelle vecchie
  // (residentKey 'discouraged') non compaiono mai nella QuickType, per loro
  // resta il medaglione finché l'utente non riattiva lo sblocco.
  function canUseConditional() {
    if (!isEnabled() || localStorage.getItem(LS_DISCOVERABLE) !== '1') {
      return Promise.resolve(false);
    }

    return isConditionalAvailable();
  }

  // Chiude la richiesta in attesa: WebAuthn ne ammette una sola per volta,
  // quindi va annullata prima di ogni get()/create() col foglio modale.
  function cancelConditional() {
    if (conditionalAbort) {
      conditionalAbort.abort();
      conditionalAbort = null;
    }
  }

  // Con allowCredentials vuoto la passkey la sceglie l'utente: controllo che
  // lo userHandle sia l'uid con cui era stato attivato lo sblocco.
  function matchesAccount(credential) {
    var atteso = localStorage.getItem(LS_UID);
    var handle = credential && credential.response && credential.response.userHandle;
    if (!atteso || !handle) {
      return true; // credenziale senza uid salvato: non irrigidire lo sblocco
    }

    return new TextDecoder().decode(handle) === atteso;
  }

  // Mette l'app in ascolto: NON apre popup e non blocca nulla. La promise si
  // risolve true solo quando l'utente sceglie la passkey dalla QuickType.
  function watchConditional() {
    return canUseConditional().then(function (ok) {
      if (!ok) {
        return false;
      }
      cancelConditional();
      conditionalAbort = new AbortController();

      return navigator.credentials.get({
        mediation: 'conditional',
        signal: conditionalAbort.signal,
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: location.hostname,
          allowCredentials: [], // obbligatoriamente vuoto in conditional
          userVerification: 'required',
          timeout: 300000
        }
      }).then(function (credential) {
        conditionalAbort = null;
        if (!matchesAccount(credential)) {
          return false; // passkey di un altro account: non sblocca questa sessione
        }
        _unlocked = true;
        touchActivity();

        return true;
      }).catch(function () {
        conditionalAbort = null; // annullata, scaduta o rifiutata: nessun errore a video

        return false;
      });
    });
  }

  /* ---------- sblocco col medaglione (foglio modale) ---------- */

  function unlock() {
    if (!isSupported() || !isEnabled()) {
      return Promise.resolve(false);
    }
    cancelConditional(); // altrimenti la get() modale trova una richiesta pendente
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var credId = base64UrlToBuf(localStorage.getItem(LS_CRED));

    return navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [{ type: 'public-key', id: credId, transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000
      }
    }).then(function () {
      _unlocked = true;
      touchActivity();

      return true;
    }).catch(function () {
      return false; // annullato o fallito: niente eccezione, solo esito negativo
    });
  }

  bindActivityTracking();

  window.AppFaceId = {
    isSupported: isSupported,
    checkPlatformAuthenticator: checkPlatformAuthenticator,
    isEnabled: isEnabled,
    shouldLock: shouldLock,
    enable: enable,
    disable: disable,
    unlock: unlock,
    canUseConditional: canUseConditional,
    watchConditional: watchConditional,
    cancelConditional: cancelConditional
  };
})();
