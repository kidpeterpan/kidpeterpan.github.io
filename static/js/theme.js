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
      document.documentElement.classList.add('is-loaded');
    }, 60);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  // Scroll-to-top button: stays hidden until scrolled past the hero, so it
  // doesn't sit on top of the hero copy or the first post on small screens.
  document.addEventListener('DOMContentLoaded', function () {
    var toTop = document.querySelector('.to-top');
    if (!toTop) return;
    var ticking = false;
    function update() {
      toTop.classList.toggle('is-visible', window.scrollY > 480);
      ticking = false;
    }
    update();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  });
})();
