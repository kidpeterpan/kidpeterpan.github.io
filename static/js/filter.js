// Homepage behaviour: category dropdown + filter, section-card scroll reveal.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- category dropdown + filter ---------- */
  function initFilter() {
    var dd = document.querySelector('.dropdown');
    if (!dd) return;
    var trigger = dd.querySelector('.dd-trigger');
    var valueEl = dd.querySelector('.dd-value');
    var items = Array.prototype.slice.call(dd.querySelectorAll('.dd-item'));
    var rows = Array.prototype.slice.call(document.querySelectorAll('.post-row-wrap'));
    var countEl = document.querySelector('.result-count b');
    var emptyEl = document.querySelector('.empty-state');

    function close() {
      dd.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      var open = dd.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function apply(cat) {
      var shown = 0;
      rows.forEach(function (row) {
        var match = cat === 'all' || row.dataset.cat === cat;
        row.hidden = !match;
        row.classList.remove('filtering-in');
        if (match) {
          shown++;
          var idx = row.querySelector('.idx');
          if (idx) idx.textContent = String(shown).padStart(2, '0');
          if (!reduced) {
            // restart the entry animation
            void row.offsetWidth;
            row.style.animationDelay = Math.min(shown, 8) * 0.035 + 's';
            row.classList.add('filtering-in');
          }
        }
      });
      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.hidden = shown !== 0;
      items.forEach(function (it) {
        it.setAttribute('aria-selected', it.dataset.cat === cat ? 'true' : 'false');
      });
      if (valueEl) {
        var active = items.filter(function (i) { return i.dataset.cat === cat; })[0];
        valueEl.textContent = active ? active.querySelector('.dd-name').textContent : 'All';
      }
      try { history.replaceState(null, '', cat === 'all' ? location.pathname : '?cat=' + cat); } catch (e) {}
    }

    trigger.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });

    items.forEach(function (it) {
      it.addEventListener('click', function () {
        apply(it.dataset.cat);
        close();
      });
    });

    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    var initial = 'all';
    var fromUrl = false;
    try {
      var q = new URLSearchParams(location.search).get('cat');
      if (q && items.some(function (i) { return i.dataset.cat === q; })) { initial = q; fromUrl = true; }
    } catch (e) {}
    apply(initial);

    // Landing on a deep link (?cat=go) applies the filter far below the fold —
    // bring the list into view so the nav link visibly does something.
    if (fromUrl) {
      var bar = document.querySelector('.filter-bar');
      if (bar) {
        var target = Math.max(0, bar.offsetTop - 16);
        var jump = function () {
          window.scrollTo({ top: target, behavior: 'auto' });
          if (document.scrollingElement) document.scrollingElement.scrollTop = target;
        };
        requestAnimationFrame(jump);
        window.addEventListener('load', jump, { once: true });
        // Visible confirmation that the nav link did something, even if the
        // jump is suppressed (some embedded viewers block programmatic scroll).
        bar.classList.add('just-filtered');
        setTimeout(function () { bar.classList.remove('just-filtered'); }, 1400);
      }
    }
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.sr');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('shown'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('shown');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFilter();
    initReveal();
  });
})();
