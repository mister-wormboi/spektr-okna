(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.querySelector('.reading-progress span');
  let queued = false;
  let pageHeight = 1;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function draw() {
    queued = false;
    if (document.hidden) return;
    if (progress) progress.style.transform = `scaleX(${clamp(window.scrollY / pageHeight, 0, 1)})`;
  }
  function requestDraw() {
    if (!queued && !document.hidden) { queued = true; requestAnimationFrame(draw); }
  }
  function measure() {
    pageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    requestDraw();
  }
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  const updateMotion = () => {
    priceAnimation?.cancel();
    measure();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', updateMotion);
  else reduced.addListener(updateMotion);

  const price = document.querySelector('#calcPrice');
  let priceAnimation;
  if (price && typeof price.animate === 'function') new MutationObserver(() => {
    if (reduced.matches) return;
    priceAnimation?.cancel();
    priceAnimation = price.animate([
      { opacity: .5, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }).observe(price, { childList: true });

  document.querySelectorAll('.guides details').forEach(details => {
    let animation;
    details.addEventListener('toggle', () => {
      animation?.cancel();
      const copy = details.querySelector('p');
      if (!details.open || reduced.matches || !copy || typeof copy.animate !== 'function') return;
      animation = copy.animate([
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 350, easing: 'ease-out' });
    });
  });

  measure();
})();
