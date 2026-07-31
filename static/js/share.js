// Share button — native Web Share API where supported, otherwise the
// static fallback links (X/Facebook/LinkedIn) + copy-link stay visible.
(function () {
  function showStatus(el, text, ms) {
    if (!el) return;
    el.textContent = text;
    clearTimeout(el._shareTimer);
    el._shareTimer = setTimeout(function () {
      el.textContent = '';
    }, ms);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var row = document.querySelector('.share-row');
    if (!row) return;

    var title = row.dataset.shareTitle || document.title;
    var url = row.dataset.shareUrl || window.location.href;
    var nativeBtn = row.querySelector('.share-native');
    var copyBtn = row.querySelector('.share-copy');
    var status = row.querySelector('.share-status');

    if (nativeBtn && typeof navigator.share === 'function') {
      row.classList.add('has-native-share');
      nativeBtn.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).catch(function (err) {
          if (err && err.name === 'AbortError') return;
        });
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          showStatus(status, url, 6000);
          return;
        }
        navigator.clipboard.writeText(url).then(function () {
          showStatus(status, 'Copied!', 2000);
        }).catch(function () {
          showStatus(status, url, 6000);
        });
      });
    }
  });
})();
