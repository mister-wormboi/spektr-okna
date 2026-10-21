(() => {
  const hero = document.querySelector('.hero-cinema');
  const video = hero?.querySelector('video');
  const toggle = hero?.querySelector('.hero-video-toggle');
  const header = document.querySelector('.site-header');
  if (!video) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let manual = null;
  let visible = false;
  let failed = false;
  let loaded = document.readyState === 'complete';
  const wantsPlayback = () => manual ?? !(reduced.matches || connection?.saveData);
  function update() {
    if (failed) return;
    if (!visible || document.hidden || !wantsPlayback()) { video.pause(); return; }
    if (!loaded && manual !== true) return;
    if (!video.hasAttribute('src')) { video.src = video.dataset.src; video.muted = true; }
    video.play().catch(() => {}); // If autoplay is unavailable, keep the poster.
  }
  function reflect() {
    toggle?.classList.toggle('is-playing', !video.paused);
    toggle?.setAttribute('aria-label', video.paused ? 'Воспроизвести видео' : 'Приостановить видео');
  }
  if (toggle) toggle.hidden = false;
  toggle?.addEventListener('click', () => { manual = video.paused; update(); });
  video.addEventListener('playing', () => {
    if (!visible || document.hidden || !wantsPlayback()) { video.pause(); return; }
    hero.classList.add('is-video-ready');
    reflect();
  });
  video.addEventListener('pause', reflect);
  video.addEventListener('error', () => { failed = true; hero.classList.remove('is-video-ready'); if (toggle) toggle.hidden = true; });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('load', () => { loaded = true; update(); }, { once: true });
  reduced.addEventListener('change', () => { manual = null; update(); });
  connection?.addEventListener('change', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      header?.classList.toggle('is-over-hero', visible);
      update();
    }, { threshold: 0, rootMargin: '-84px 0px 0px' }).observe(hero);
  } else { visible = true; update(); }
})();
