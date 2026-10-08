(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const heroImage = document.querySelector('.hero-scene img');
  const progress = document.querySelector('.reading-progress span');
  if (heroImage) {
    const startZoom = () => heroImage.classList.add('is-ready');
    if (heroImage.decode) heroImage.decode().then(startZoom, () => {
      if (heroImage.complete && heroImage.naturalWidth) startZoom();
      else heroImage.addEventListener('load', startZoom, { once: true });
    });
    else if (heroImage.complete && heroImage.naturalWidth) startZoom();
    else heroImage.addEventListener('load', startZoom, { once: true });
  }
  let queued = false;
  let pageHeight = 1;
  let heroTop = 0;
  let heroHeight = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function draw() {
    queued = false;
    if (progress) progress.style.transform = `scaleX(${clamp(window.scrollY / pageHeight, 0, 1)})`;
    if (reduced.matches || !finePointer.matches) return;
    if (!hero) return;
    const heroVisible = window.scrollY < heroTop + heroHeight && window.scrollY + innerHeight > heroTop;
    hero.classList.toggle('is-in-view', heroVisible);
    if (heroVisible) {
      const heroProgress = clamp((innerHeight + window.scrollY - heroTop) / (innerHeight + heroHeight), 0, 1);
      hero.style.setProperty('--hero-shift', `${clamp(heroProgress * 36, 0, 36)}px`);
      hero.style.setProperty('--hero-scale', `${1.025 + heroProgress * .095}`);
    }
  }
  function requestDraw() {
    if (!queued && !document.hidden) { queued = true; requestAnimationFrame(draw); }
  }
  function measure() {
    pageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (hero && finePointer.matches && !reduced.matches) {
      const bounds = hero.getBoundingClientRect();
      heroTop = bounds.top + window.scrollY;
      heroHeight = bounds.height;
    }
    requestDraw();
  }
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  const updateMotion = () => {
    hero?.classList.remove('is-in-view');
    hero?.style.removeProperty('--hero-shift');
    hero?.style.removeProperty('--hero-scale');
    priceAnimation?.cancel();
    measure();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', updateMotion);
  else reduced.addListener(updateMotion);
  if (finePointer.addEventListener) finePointer.addEventListener('change', updateMotion);
  else finePointer.addListener(updateMotion);

  // Delegation also covers product cards replaced by the catalogue filters.
  let lightFrame = 0;
  let lightTarget;
  let lightX = 0;
  let lightY = 0;
  document.querySelector('#cards')?.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches) return;
    const body = event.target.closest('.card-body');
    if (!body) return;
    lightTarget = body;
    lightX = event.clientX;
    lightY = event.clientY;
    if (lightFrame) return;
    lightFrame = requestAnimationFrame(() => {
      lightFrame = 0;
      if (!lightTarget.isConnected || reduced.matches || document.hidden) return;
      const bounds = lightTarget.getBoundingClientRect();
      lightTarget.style.setProperty('--light-x', `${lightX - bounds.left}px`);
      lightTarget.style.setProperty('--light-y', `${lightY - bounds.top}px`);
    });
  }, { passive: true });

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
