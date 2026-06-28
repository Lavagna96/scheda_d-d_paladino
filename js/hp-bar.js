(function () {
  function renderHpBar(val, max, txtId, fillId, maxId) {
    var pct = Math.max(0, Math.min(100, val / max * 100));
    var txt = document.getElementById(txtId);
    if (txt) {
      txt.textContent = val;
      txt.classList.remove('mid', 'low');
      if (pct <= 10) {
        txt.classList.add('low');
      } else if (pct <= 50) {
        txt.classList.add('mid');
      }
    }
    var maxEl = maxId ? document.getElementById(maxId) : null;
    if (maxEl) {
      maxEl.textContent = ' / ' + max;
    }
    var fill = document.getElementById(fillId);
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.remove('mid', 'low');
      if (pct <= 10) {
        fill.classList.add('low');
      } else if (pct <= 50) {
        fill.classList.add('mid');
      }
    }
  }

  function applyFromInput(poolKey, inputId, sign) {
    var inp = document.getElementById(inputId);
    if (!inp || !window.AppSheet) {
      return;
    }
    var n = parseInt(inp.value, 10);
    if (!isNaN(n) && n !== 0) {
      window.AppSheet.adjustPool(poolKey, sign * Math.abs(n));
    }
    inp.value = '';
  }

  window.AppHpBar = {
    render: renderHpBar,
    applyFromInput: applyFromInput
  };
})();
