(() => {
  const cards = [...document.querySelectorAll('[data-gallery-model]')];
  const exhibits = new WeakMap();
  let exhibitModule;
  const loadExhibit = () => exhibitModule ||= import('./window-inside-3d.js?v=20261111-disposable');

  cards.forEach(card => card.addEventListener('click', event => {
    const button = event.target.closest('button');
    const exhibit = exhibits.get(card);
    if (!exhibit || !button || (!button.hasAttribute('data-detail') && !button.dataset.mode)) return;
    const panel = button.closest('.inside-panel');
    if (button.hasAttribute('data-detail')) {
      const active = panel.classList.toggle('is-detail');
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? button.dataset.on : button.dataset.off;
    } else {
      panel.dataset.mode = button.dataset.mode;
      panel.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }
    exhibit.update(panel);
  }));

  function dispose(card) {
    const exhibit = exhibits.get(card);
    if (!exhibit) return;
    exhibit.destroy();
    exhibits.delete(card);
    const panel = card.querySelector('.inside-panel');
    const cleanPanel = panel.cloneNode(true);
    cleanPanel.classList.remove('is-detail');
    cleanPanel.querySelectorAll('.inside-view-tools,.inside-scrubber,.inside-inspector,.inside-scene-preview').forEach(element => element.remove());
    cleanPanel.querySelector('.inside-scene').classList.remove('has-3d', 'is-revealed', 'has-preview', 'is-unavailable');
    panel.replaceWith(cleanPanel);
    delete card.dataset.initialized;
    card.removeAttribute('aria-busy');
  }

  async function initialize(card) {
    if (card.dataset.initialized) return;
    card.dataset.initialized = 'true';
    card.querySelector('.inside-scene').classList.add('is-revealed');
    card.setAttribute('aria-busy', 'true');
    try {
      const { createInsideExhibit } = await loadExhibit();
      const exhibit = await createInsideExhibit(card);
      exhibits.set(card, exhibit);
      exhibit.update();
      if (!card.classList.contains('is-near')) dispose(card);
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
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        card.classList.toggle('is-near', entry.isIntersecting);
        if (entry.isIntersecting) initialize(card);
        else dispose(card);
      });
    }, { rootMargin: '350px 0px' });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => card.classList.add('is-near'));
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
    document.body.classList.toggle('is-outside-journey', scrollY >= start - innerHeight * .95);
  }
  function requestProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateContentProgress);
  }
  addEventListener('scroll', requestProgress, { passive: true });
  addEventListener('resize', requestProgress);
  updateContentProgress();
})();
