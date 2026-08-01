(function () {
  /*
   * Migrazione ritratto da file statico legacy (avatar.jpg): se il personaggio
   * ha un path relativo come ritratto, lo importa una volta come data URL.
   */

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
    var MAX_SIDE = 900;
    var MAX_CHARS = 700000;

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
    state.character.portraitFull = dataUrl;
    window.AppStorage.saveState(state, true);
    if (window.AppHeader && window.AppHeader.render) {
      window.AppHeader.render();
    }
  }

  function isLegacyPortraitPath(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }
    if (value.indexOf('data:') === 0) {
      return false;
    }

    return value.indexOf('avatar') !== -1 && value.indexOf('.jpg') !== -1;
  }

  function migrateLegacyPortrait() {
    try {
      var id = window.AppStorage.activeCharId && window.AppStorage.activeCharId();
      if (!id) {
        return;
      }
      var state = window.AppStorage.getState();
      var portrait = state.character && state.character.portrait;
      if (!isLegacyPortraitPath(portrait)) {
        return;
      }
      fetch(portrait).then(function (res) {
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

  function init() {
    migrateLegacyPortrait();
    bindUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
