(function () {
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Stäng' : 'Meny';
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }
  var label = document.querySelector('.welcome-label');
  if (label && new URLSearchParams(location.search).get('label') === '1') label.hidden = false;
  var hero = document.querySelector('.hero');
  if (hero) {
    var v = new URLSearchParams(location.search).get('hero');
    if (v === 'a') { hero.classList.remove('hero--framed'); hero.classList.add('hero--bleed'); }
    if (new URLSearchParams(location.search).get('mobil') === 'hel') hero.classList.add('hero--full-mobile');
    var img = hero.querySelector('img');
    var missing = hero.querySelector('.hero-missing');
    function showMissing() { if (img) img.hidden = true; if (missing) missing.hidden = false; }
    if (img) {
      img.addEventListener('error', showMissing);
      if (img.complete && img.naturalWidth === 0) showMissing();
    }
  }
})();
