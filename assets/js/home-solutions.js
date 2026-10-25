(() => {
  const marquee = document.querySelector('.home-solutions-marquee');
  const track = marquee?.querySelector('.solutions-gallery-track, .photo-marquee-track');
  if (!track || !('IntersectionObserver' in window)) return;
  // Preserve native lazy loading and manual scrolling in data-saving mode.
  if (window.navigator?.connection?.saveData) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const originals = [...track.children];
  let visible = false, ready = false, preparing = false;
  let preparedCount = 0;
  const clones = [];
  // Decode in small batches between rendering tasks rather than asking the
  // browser to decompress the entire photo strip in the same scroll frame.
  const yieldToBrowser = () => new Promise(resolve => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 500 });
    else setTimeout(resolve, 16);
  });

  function syncClones() {
    const viewportWidth = marquee.getBoundingClientRect().width;
    let covered = 0;
    let count = 0;
    // At the loop boundary only one viewport of the repeated sequence is visible.
    // Retain one extra photo as a buffer, including when the viewport is resized.
    for (const item of originals) {
      covered += item.getBoundingClientRect().width;
      count++;
      if (covered >= viewportWidth) { count = Math.min(originals.length, count + 1); break; }
    }
    while (clones.length < count) {
      const clone = originals[clones.length].cloneNode(true);
      clone.dataset.clone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      track.append(clone);
      clones.push(clone);
    }
    while (clones.length > count) clones.pop().remove();
  }

  function update() {
    track.classList.toggle('is-running', ready && visible && !document.hidden && !motion.matches);
    marquee.classList.toggle('is-animated', ready && !motion.matches);
  }
  function measure() {
    if (!ready || motion.matches) return;
    syncClones();
    const clone = track.querySelector('[data-clone]');
    if (!clone || motion.matches) return;
    const distance = clone.getBoundingClientRect().left - originals[0].getBoundingClientRect().left;
    track.style.setProperty('--loop-distance', distance + 'px');
    track.style.setProperty('--loop-duration', distance / 32 + 's');
  }
  async function prepare() {
    if (preparing || ready || motion.matches) return;
    preparing = true;
    for (let index = preparedCount; index < originals.length; index += 2) {
      await yieldToBrowser();
      if (!visible || document.hidden || motion.matches) { preparing = false; return; }
      await Promise.all(originals.slice(index, index + 2).map(async item => {
        const img = item.querySelector('img');
        img.loading = 'eager';
        try { await img.decode(); } catch { /* Keep navigation usable if an image fails. */ }
      }));
      preparedCount = index + 2;
    }
    ready = true;
    syncClones();
    update();
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(marquee);
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) prepare();
    update();
  }).observe(marquee);
  document.addEventListener('visibilitychange', () => { if (visible && !document.hidden) prepare(); update(); });
  motion.addEventListener('change', () => { if (visible) prepare(); update(); measure(); });
})();
