// Theme toggle — persisted in localStorage, applied early via inline snippet in <head>.
(function () {
  function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function syncToggle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var dark = currentTheme() === 'dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    var name = btn.querySelector('.pal-name');
    if (name) name.textContent = (dark ? btn.dataset.palDark : btn.dataset.palLight) || name.textContent;
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('mha-theme', t); } catch (e) {}
    syncToggle();
  }
  // Load reveal: hide before first paint, release shortly after.
  document.documentElement.classList.add('anim-pre');
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      document.documentElement.classList.remove('anim-pre');
      document.documentElement.classList.add('is-loaded');
    }, 60);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    syncToggle();
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
})();
