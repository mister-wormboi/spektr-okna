(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const progress = document.querySelector('.reading-progress span');
  let queued = false;
  let pageHeight = 1;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function draw() {
    queued = false;
    progress.style.transform = `scaleX(${clamp(window.scrollY / pageHeight, 0, 1)})`;
    if (reduced.matches) return;
    const heroBounds = hero.getBoundingClientRect();
    if (heroBounds.bottom > 0) hero.style.setProperty('--hero-shift', `${clamp(-heroBounds.top * .12, 0, 55)}px`);
  }
  function requestDraw() {
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  }
  function measure() {
    pageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    requestDraw();
  }
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  reduced.addEventListener('change', () => {
    hero.style.removeProperty('--hero-shift');
    priceAnimation?.cancel();
    requestDraw();
  });

  // Delegation also covers product cards replaced by the catalogue filters.
  document.querySelector('#cards').addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches) return;
    const body = event.target.closest('.card-body');
    if (!body) return;
    const bounds = body.getBoundingClientRect();
    body.style.setProperty('--light-x', `${event.clientX - bounds.left}px`);
    body.style.setProperty('--light-y', `${event.clientY - bounds.top}px`);
  }, { passive: true });

  const price = document.querySelector('#calcPrice');
  let priceAnimation;
  new MutationObserver(() => {
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
      if (!details.open || reduced.matches) return;
      animation = details.querySelector('p').animate([
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 350, easing: 'ease-out' });
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduced.matches) entry.target.animate([
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 650, delay: Number(entry.target.dataset.motionDelay), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
        observer.unobserve(entry.target);
      });
    }, { threshold: .4 });
    document.querySelectorAll('.benefits-strip > div').forEach((item, index) => {
      item.dataset.motionDelay = index * 90;
      observer.observe(item);
    });
  }
  measure();
})();
