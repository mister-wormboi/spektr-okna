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
    lastNear = index;
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
  let exhibitModule;
  let preparation = Promise.resolve();
  const idle = () => new Promise(resolve => {
    if ('requestIdleCallback' in window) requestIdleCallback(resolve, {timeout:700});
    else setTimeout(resolve, 32);
  });
  let lastNear = 0;
  const compact = matchMedia('(max-width: 900px)').matches || navigator.connection?.saveData;
  function trim() {
    cards.forEach((card, index) => {
      if (!card.classList.contains('is-near') && (compact || Math.abs(index - lastNear) > 1)) dispose(card);
    });
  }
  const loadExhibit = () => exhibitModule ||= import('./window-inside-3d.js?v=20261112-studio-surface');

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
    delete card.dataset.rotating;
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
    if (card.hidden || card.dataset.initialized) return;
    card.dataset.initialized = 'true';
    card.querySelector('.inside-scene').classList.add('is-revealed');
    card.setAttribute('aria-busy', 'true');
    try {
      const { createInsideExhibit } = await loadExhibit();
      const task = preparation.then(async () => {
        await idle();
        while (cards.some(item => item.dataset.rotating === 'true')) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!card.classList.contains('is-near')) { delete card.dataset.initialized; return null; }
        const exhibit = createInsideExhibit(card);
        await exhibit.ready;
        if (card.hidden) { exhibit.destroy(); delete card.dataset.initialized; return null; }
        return exhibit;
      });
      preparation = task.catch(() => {});
      const exhibit = await task;
      if (!exhibit) return;
      exhibits.set(card, exhibit);
      exhibit.update();
      trim();
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
        card.classList.toggle('is-near', entry.isIntersecting && !card.hidden);
        if (entry.isIntersecting && !card.hidden) { lastNear = cards.indexOf(card); initialize(card); }
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
