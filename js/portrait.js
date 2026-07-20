(function () {
  /*
   * Ritratti personaggio (Fase 2): l'immagine viene ridimensionata lato
   * client e salvata come data URL dentro state.character.portrait, così
   * viaggia insieme al resto della scheda (localStorage + Firestore) senza
   * bisogno di storage esterno.
   */

  var MAX_SIDE = 900;
  var MAX_CHARS = 700000; // ~700 KB di data URL: soglia prudente per Firestore

  function loadImage(fileOrBlob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  }

  function drawToDataUrl(img, maxSide, quality) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    var scale = Math.min(1, maxSide / Math.max(w, h));
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
  }

  function resizeToDataUrl(fileOrBlob) {
    return loadImage(fileOrBlob).then(function (img) {
      var out = drawToDataUrl(img, MAX_SIDE, 0.8);
      if (out.length > MAX_CHARS) {
        out = drawToDataUrl(img, MAX_SIDE, 0.6);
      }
      if (out.length > MAX_CHARS) {
        out = drawToDataUrl(img, 700, 0.6);
      }

      return out;
    });
  }

  function setPortrait(dataUrl) {
    var state = window.AppStorage.getState();
    state.character.portrait = dataUrl;
    window.AppStorage.saveState(state, true);
    // AppHeader.render() applica il nuovo ritratto sia all'avatar dell'header
    // sia all'immagine dentro il modal a schermo intero.
    if (window.AppHeader && window.AppHeader.render) {
      window.AppHeader.render();
    }
  }

  /* Il ritratto storico di Tharion viveva come file statico (avatar-full.jpg):
     la prima volta che gira con lo stato nuovo lo importa come data URL,
     così anche lui passa dal meccanismo unico dei ritratti. Silenziosa in
     caso di errore (nessun avatar legacy, offline, ecc.). */
  function migrateLegacy() {
    try {
      var activeId = localStorage.getItem('app-active-char') || 'tharion-velnar';
      if (activeId !== 'tharion-velnar') {
        return;
      }
      var state = window.AppStorage.getState();
      if (state.character && state.character.portrait) {
        return;
      }
      fetch('avatar-full.jpg').then(function (res) {
        if (!res.ok) {
          throw new Error('avatar legacy assente');
        }

        return res.blob();
      }).then(function (blob) {
        return resizeToDataUrl(blob);
      }).then(function (dataUrl) {
        setPortrait(dataUrl);
      }).catch(function () { /* nessun avatar legacy: ignora */ });
    } catch (e) { /* ignore */ }
  }

  function bindUi() {
    var btn = document.getElementById('avatar-change');
    var input = document.getElementById('avatar-file');
    if (!btn || !input) {
      return;
    }
    btn.addEventListener('click', function () {
      input.click();
    });
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) {
        return;
      }
      resizeToDataUrl(file).then(function (dataUrl) {
        setPortrait(dataUrl);
      }).catch(function () { /* immagine non valida: ignora */ });
    });
  }

  bindUi();
  migrateLegacy();

  window.AppPortrait = {
    resizeToDataUrl: resizeToDataUrl,
    setPortrait: setPortrait,
    migrateLegacy: migrateLegacy
  };
})();
