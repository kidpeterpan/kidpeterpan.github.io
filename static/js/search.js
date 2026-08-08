(function () {
  'use strict';

  var toggle = document.getElementById('search-toggle');
  var dialog = document.getElementById('search-dialog');
  var mount = document.getElementById('search-mount');
  var closeBtn = document.getElementById('search-close');

  if (!toggle || !dialog || !mount || !closeBtn) return;

  var ui = null;

  function loadCSS() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/pagefind/pagefind-ui.css';
    document.head.appendChild(link);
  }

  function loadJS() {
    return new Promise(function (resolve, reject) {
      if (window.PagefindUI) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = '/pagefind/pagefind-ui.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initUI() {
    if (ui) return Promise.resolve();
    loadCSS();
    return loadJS().then(function () {
      ui = new window.PagefindUI({
        element: mount,
        debounceTimeoutMs: 100,
        baseUrl: '/'
      });
      var input = mount.querySelector('input.pagefind-ui__search-input');
      if (input) input.focus();
    });
  }

  toggle.addEventListener('click', function () {
    toggle.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    initUI().catch(function () {
      mount.innerHTML = '<p class="pagefind-ui__message">Search index is not available yet.</p>';
    });
  });

  closeBtn.addEventListener('click', function () {
    dialog.close();
  });

  dialog.addEventListener('close', function () {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });

  dialog.addEventListener('cancel', function (event) {
    event.preventDefault();
    dialog.close();
  });
})();
