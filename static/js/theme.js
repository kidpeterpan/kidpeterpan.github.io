// Theme toggle — persisted in localStorage, applied early via inline snippet in <head>.
(function () {
  function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('mha-theme', t); } catch (e) {}
  }
  // Load reveal: hide before first paint, release shortly after.
  document.documentElement.classList.add('anim-pre');
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      document.documentElement.classList.remove('anim-pre');
    }, 60);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
})();
