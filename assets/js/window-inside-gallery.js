(() => {
  const cards = [...document.querySelectorAll('[data-gallery-model]')];
  let exhibitModule;
  const loadExhibit = () => exhibitModule ||= import('./window-inside-3d.js?v=20261110-scene-pacing');

  async function initialize(card) {
    if (card.dataset.initialized) return;
    card.dataset.initialized = 'true';
    card.querySelector('.inside-scene').classList.add('is-revealed');
    card.setAttribute('aria-busy', 'true');
    try {
      const { createInsideExhibit } = await loadExhibit();
      const exhibit = await createInsideExhibit(card);
      exhibit.update();
    } catch (error) {
      card.classList.add('is-unavailable');
      card.querySelector('.inside-scene')?.classList.add('is-unavailable');
      card.querySelector('.inside-status').textContent = 'Не удалось загрузить 3D-модель. Обновите страницу, чтобы попробовать снова.';
      console.error('Inside gallery model:', error);
    } finally {
      card.removeAttribute('aria-busy');
    }
  }

  if ('IntersectionObserver' in window) {
    const pending = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        pending.unobserve(entry.target);
        initialize(entry.target);
      });
    }, { rootMargin: '350px 0px' });
    cards.forEach(card => pending.observe(card));
  } else {
    cards.forEach(initialize);
  }

  const journey = document.querySelector('.inside-journey');
  const root = document.documentElement;
  let progressFrame = 0;
  function updateContentProgress() {
    progressFrame = 0;
    const start = journey.offsetTop + journey.offsetHeight;
    const distance = Math.max(1, root.scrollHeight - innerHeight - start);
    const progress = Math.max(0, Math.min(1, (scrollY - start) / distance));
    root.style.setProperty('--content-progress', progress.toFixed(4));
    document.body.classList.toggle('is-outside-journey', scrollY >= start - innerHeight * .2);
  }
  function requestProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateContentProgress);
  }
  addEventListener('scroll', requestProgress, { passive: true });
  addEventListener('resize', requestProgress);
  updateContentProgress();
})();
