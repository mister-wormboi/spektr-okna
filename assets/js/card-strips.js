/* Native swipe/scroll-snap; arrows enhance the same track without a carousel library. */
(() => {
  function initializeStrip(track) {
    const controls = document.querySelector(`[data-strip-controls="${track.id}"]`);
    if (!controls || !track.children.length) return;
    const cards = [...track.children];
    const previous = controls.querySelector('[data-strip-step="-1"]');
    const next = controls.querySelector('[data-strip-step="1"]');
    const position = controls.querySelector('.card-strip-position');
    const mobile = matchMedia('(max-width: 760px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let offsets = [];
    let index = 0;
    let frame = 0;

    function update() {
      frame = 0;
      if (!mobile.matches || !offsets.length) return;
      index = offsets.reduce((nearest, offset, i) =>
        Math.abs(offset - track.scrollLeft) < Math.abs(offsets[nearest] - track.scrollLeft) ? i : nearest, 0);
      if (offsets.at(-1) > 0 && track.scrollLeft >= offsets.at(-1) - 1) index = cards.length - 1;
      previous.disabled = index === 0;
      next.disabled = index === cards.length - 1;
      const text = `${index + 1} / ${cards.length}`;
      if (position.textContent !== text) position.textContent = text;
    }

    function measure() {
      if (!mobile.matches) return;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const start = cards[0]?.offsetLeft || 0;
      offsets = cards.map(card => Math.min(max, card.offsetLeft - start));
      update();
    }

    function goTo(target) {
      if (!mobile.matches) return;
      const direction = Math.sign(target - index);
      target = Math.max(0, Math.min(cards.length - 1, target));
      while (direction && target > 0 && target < cards.length - 1 && Math.abs(offsets[target] - track.scrollLeft) < 1) target += direction;
      index = target;
      track.scrollTo({ left: offsets[index], behavior: reduced.matches ? 'auto' : 'smooth' });
    }

    function configure() {
      controls.hidden = !mobile.matches;
      if (mobile.matches) {
        track.tabIndex = 0;
        measure();
      } else {
        track.removeAttribute('tabindex');
        track.scrollLeft = 0;
      }
    }

    previous.addEventListener('click', () => goTo(index - 1));
    next.addEventListener('click', () => goTo(index + 1));
    track.addEventListener('scroll', () => {
      if (mobile.matches && !frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    track.addEventListener('keydown', event => {
      if (!mobile.matches || event.target !== track) return;
      const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      goTo(target);
    });
    if (mobile.addEventListener) mobile.addEventListener('change', configure);
    else mobile.addListener(configure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
    else window.addEventListener('resize', measure, { passive: true });
    configure();
  }
  document.querySelectorAll('[data-card-strip]').forEach(initializeStrip);
})();
