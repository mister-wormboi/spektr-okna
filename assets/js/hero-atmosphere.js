(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const canObserve = typeof window.IntersectionObserver === 'function';
  let visible = false;
  let suspended = false;

  function update() {
    const permitted = canObserve && !reduced.matches && !connection?.saveData;
    hero.classList.toggle('is-atmosphere-active', permitted && visible && !document.hidden && !suspended);
  }

  const observer = canObserve ? new window.IntersectionObserver(entries => {
    const entry = entries.find(item => item.target === hero);
    if (!entry) return;
    visible = entry.isIntersecting && entry.intersectionRatio > 0;
    update();
  }, { threshold: [0, 0.01] }) : null;

  document.addEventListener('visibilitychange', update);
  if (reduced.addEventListener) reduced.addEventListener('change', update);
  else reduced.addListener(update);
  connection?.addEventListener?.('change', update);

  // Freeze before leaving; a restored page waits for a fresh visibility sample.
  window.addEventListener('pagehide', () => {
    suspended = true;
    visible = false;
    observer?.disconnect();
    update();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    observer?.observe(hero);
    update();
  });

  update();
  observer?.observe(hero);
})();
