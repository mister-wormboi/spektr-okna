/* CSS handles the folding; one observer switches state without a scroll loop. */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const menu = header.querySelector('#headerMenu');
  const toggle = header.querySelector('.header-menu-toggle');
  if (!menu || !toggle) return;
  const mobile = window.matchMedia('(max-width: 900px)');
  let open = false;

  function setOpen(value, restoreFocus = false) {
    open = mobile.matches && value;
    if (!open && restoreFocus) toggle.focus();
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.inert = mobile.matches && !open;
    header.classList.toggle('is-menu-open', open);
  }

  toggle.hidden = false;
  header.classList.add('is-enhanced');
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false, open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false, true); }
  });
  document.addEventListener('pointerdown', event => {
    if (open && !header.contains(event.target)) setOpen(false, menu.contains(document.activeElement));
  });
  document.addEventListener('focusin', event => {
    if (open && !header.contains(event.target)) setOpen(false);
  });
  const resize = () => setOpen(false, mobile.matches && menu.contains(document.activeElement));
  if (mobile.addEventListener) mobile.addEventListener('change', resize);
  else mobile.addListener(resize);

  if ('IntersectionObserver' in window) {
    const sentinel = document.createElement('span');
    sentinel.className = 'header-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    header.before(sentinel);
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(sentinel);
  }
})();

/* Reading progress */
(() => {
  let bar = document.querySelector('.reading-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span></span>';
    document.body.prepend(bar);
  }
  if (document.body.classList.contains('home-page')) return;
  const fill = bar.querySelector('span');
  const nativeProgress = window.CSS?.supports?.('animation-timeline: scroll()');
  if (nativeProgress) return;
  let queued = false;
  let pageHeight = 1;
  function draw() {
    queued = false;
    if (!document.hidden) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / pageHeight))})`;
  }
  function requestDraw() {
    if (!queued && !document.hidden) { queued = true; requestAnimationFrame(draw); }
  }
  function measure() {
    pageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    requestDraw();
  }
  addEventListener('scroll', requestDraw, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  measure();
})();
