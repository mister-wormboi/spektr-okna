(() => {
  const counters = [...document.querySelectorAll('[data-article-views]')];
  if (!counters.length || typeof fetch !== 'function') return;
  const current = document.querySelector('[data-article-view]');
  const format = new Intl.NumberFormat('ru-RU');
  function display(slug, value) {
    if (!Number.isSafeInteger(value) || value < 0) return;
    counters.filter(node => node.dataset.articleViews === slug).forEach(node => {
      const count = node.querySelector('[data-view-count]');
      if (!count) return;
      count.textContent = format.format(value);
      node.setAttribute('aria-label', `Просмотры: ${format.format(value)}`);
      node.setAttribute('title', `Просмотры: ${format.format(value)}`);
      node.hidden = false;
    });
  }
  async function update() {
    // A page open counts once; card impressions and browser history restoration do not.
    if (current) {
      try {
        const response = await fetch(`/api/article-views/${encodeURIComponent(current.dataset.articleView)}`, {
          method: 'POST', credentials: 'same-origin', cache: 'no-store', keepalive: true,
        });
        if (response.ok) {
          const result = await response.json();
          display(result.slug, result.views);
        }
      } catch { /* Keep the visible icon and unavailable placeholder. */ }
    }
    try {
      const response = await fetch('/api/article-views', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      if (!result.views || typeof result.views !== 'object') return;
      Object.entries(result.views).forEach(([slug, count]) => display(slug, count));
    } catch { /* Do not replace stored totals with invented local values. */ }
  }
  if (current && document.visibilityState !== 'visible') {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      update();
    };
    document.addEventListener('visibilitychange', onVisible);
  } else update();
})();
