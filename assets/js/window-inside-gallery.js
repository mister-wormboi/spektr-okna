(() => {
  const cards = [...document.querySelectorAll('[data-gallery-model]')];
  const tabs = [...document.querySelectorAll('.inside-model-tabs [role="tab"]')];
  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      cards[i].hidden = !active;
      cards[i].classList.toggle('is-near', active);
      if (!active) dispose(cards[i]);
    });
    initialize(cards[index]);
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next, true);
    });
  });
  const exhibits = new WeakMap();
  const pending = new WeakMap();
  const templates = new WeakMap(cards.map(card => [card, card.querySelector('.inside-panel').cloneNode(true)]));
  let exhibitModule;
  let preparation = Promise.resolve();
  const idle = () => new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(resolve, {timeout:700});
    else setTimeout(resolve, 32);
  });
  function trim() {
    cards.filter(card => card.hidden).forEach(dispose);
  }
  const loadExhibit = () => exhibitModule ||= import('./window-inside-3d.js?v=20261112-slider-row');

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
    const hadPending = pending.has(card);
    pending.delete(card);
    const exhibit = exhibits.get(card);
    if (!exhibit && !hadPending) return;
    delete card.dataset.rotating;
    exhibit?.destroy();
    exhibits.delete(card);
    card.querySelector('.inside-panel').replaceWith(templates.get(card).cloneNode(true));
    delete card.dataset.initialized;
    card.removeAttribute('aria-busy');
  }

  async function initialize(card) {
    if (card.hidden || card.dataset.initialized) return;
    card.dataset.initialized = 'true';
    const token = {};
    pending.set(card, token);
    const isCurrent = () => pending.get(card) === token && !card.hidden;
    card.querySelector('.inside-scene').classList.add('is-revealed');
    card.setAttribute('aria-busy', 'true');
    try {
      const { createInsideExhibit } = await loadExhibit();
      const task = preparation.then(async () => {
        await idle();
        if (!isCurrent() || !card.classList.contains('is-near')) return null;
        const exhibit = createInsideExhibit(card);
        try {
          await exhibit.ready;
        } catch (error) {
          exhibit.destroy();
          throw error;
        }
        if (!isCurrent()) { exhibit.destroy(); return null; }
        return exhibit;
      });
      preparation = task.catch(() => {});
      const exhibit = await task;
      if (!exhibit || !isCurrent()) { exhibit?.destroy(); return; }
      exhibits.set(card, exhibit);
      exhibit.update();
      trim();
    } catch (error) {
      if (!isCurrent()) return;
      card.classList.add('is-unavailable');
      card.querySelector('.inside-scene')?.classList.add('is-unavailable');
      card.querySelector('.inside-status').textContent = 'Не удалось загрузить 3D-модель. Обновите страницу, чтобы попробовать снова.';
      console.error('Inside gallery model:', error);
    } finally {
      if (pending.get(card) === token) {
        pending.delete(card);
        if (!exhibits.has(card)) delete card.dataset.initialized;
        card.removeAttribute('aria-busy');
      }
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        card.classList.toggle('is-near', entry.isIntersecting && !card.hidden);
        if (entry.isIntersecting && !card.hidden) { initialize(card); }
      });
      trim();
    }, { rootMargin: '350px 0px' });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => card.classList.add('is-near'));
    cards.forEach(initialize);
  }

  const journey = document.querySelector('.inside-journey');
  const root = document.documentElement;
  let progressFrame = 0;
  let contentStart = 0, contentDistance = 1;
  function measureProgress() {
    contentStart = journey.offsetTop + journey.offsetHeight;
    contentDistance = Math.max(1, root.scrollHeight - innerHeight - contentStart);
    requestProgress();
  }
  function updateContentProgress() {
    progressFrame = 0;
    const progress = Math.max(0, Math.min(1, (scrollY - contentStart) / contentDistance));
    root.style.setProperty('--content-progress', progress.toFixed(4));
    document.body.classList.toggle('is-outside-journey', scrollY >= contentStart - innerHeight * .95);
  }
  function requestProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateContentProgress);
  }
  addEventListener('scroll', requestProgress, { passive: true });
  addEventListener('resize', measureProgress);
  if ('ResizeObserver' in window) new ResizeObserver(measureProgress).observe(document.body);
  measureProgress();
})();
