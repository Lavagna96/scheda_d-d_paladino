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
   */

  var LS_ENABLED = 'app-faceid';
  var LS_CRED = 'app-faceid-cred';

  var _unlocked = false; // già sbloccato in questa sessione di pagina?

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
    return isEnabled() && !_unlocked;
  }

  /* ---------- attivazione / disattivazione ---------- */

  function enable(uid, email) {
    if (!isSupported()) {
      return Promise.reject(new Error('WebAuthn non supportato su questo dispositivo.'));
    }
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
          residentKey: 'discouraged'
        },
        timeout: 60000
      }
    }).then(function (credential) {
      localStorage.setItem(LS_CRED, bufToBase64Url(credential.rawId));
      localStorage.setItem(LS_ENABLED, '1');
      _unlocked = true;
    });
  }

  function disable() {
    localStorage.removeItem(LS_ENABLED);
    localStorage.removeItem(LS_CRED);
  }

  /* ---------- sblocco ---------- */

  function unlock() {
    if (!isSupported() || !isEnabled()) {
      return Promise.resolve(false);
    }
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

      return true;
    }).catch(function () {
      return false; // annullato o fallito: niente eccezione, solo esito negativo
    });
  }

  window.AppFaceId = {
    isSupported: isSupported,
    checkPlatformAuthenticator: checkPlatformAuthenticator,
    isEnabled: isEnabled,
    shouldLock: shouldLock,
    enable: enable,
    disable: disable,
    unlock: unlock
  };
})();
