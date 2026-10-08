(() => {
  const marquee = document.querySelector('.home-solutions-marquee');
  const track = marquee?.querySelector('.solutions-gallery-track');
  if (!track || !('IntersectionObserver' in window)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const originals = [...track.children];
  let visible = false, ready = false, preparing = false, paused = false;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'solutions-motion-toggle';
  toggle.hidden = true;
  toggle.setAttribute('aria-label', 'Приостановить движение фотографий');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'Ⅱ';
  marquee.append(toggle);

  function update() {
    track.classList.toggle('is-running', ready && visible && !document.hidden && !motion.matches && !paused);
    marquee.classList.toggle('is-animated', ready && !motion.matches);
    toggle.hidden = !ready || motion.matches;
  }
  function measure() {
    const clone = track.querySelector('[data-clone]');
    if (!clone || motion.matches) return;
    const distance = clone.getBoundingClientRect().left - originals[0].getBoundingClientRect().left;
    track.style.setProperty('--loop-distance', distance + 'px');
    track.style.setProperty('--loop-duration', distance / 32 + 's');
  }
  async function prepare() {
    if (preparing || ready || motion.matches) return;
    preparing = true;
    await Promise.all(originals.map(async item => {
      const img = item.querySelector('img');
      img.loading = 'eager';
      try { await img.decode(); } catch { /* Keep navigation usable if an image fails. */ }
    }));
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.dataset.clone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      track.append(clone);
    });
    ready = true;
    update();
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(marquee);
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) prepare();
    update();
  }).observe(marquee);
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Продолжить движение фотографий' : 'Приостановить движение фотографий');
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    update();
  });
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', () => { if (visible) prepare(); update(); measure(); });
})();
