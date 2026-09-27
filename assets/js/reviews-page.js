/* Progressive enhancement: all reviews are readable without JavaScript. */
(() => {
  const grid = document.querySelector('#reviewGrid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.review-card')];
  const tools = document.querySelector('.review-tools');
  const search = document.querySelector('#reviewSearch');
  const filters = [...document.querySelectorAll('[data-topic]')];
  const status = document.querySelector('#reviewStatus');
  const pagination = document.querySelector('.review-pagination');
  const more = document.querySelector('#loadMoreReviews');
  const empty = document.querySelector('.review-empty');
  const reset = document.querySelector('#resetReviews');
  const pageSize = 6;
  let limit = pageSize;
  let topic = 'all';
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
  const entries = cards.map(card => ({
    card,
    text: normalize(card.querySelector('h3').textContent + ' ' + card.querySelector('p').textContent),
    topics: card.dataset.topics.split(' ')
  }));

  function render(focusNew = false) {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    const matches = entries.filter(entry =>
      (topic === 'all' || entry.topics.includes(topic)) &&
      words.every(word => entry.text.includes(word))
    );
    const previouslyVisible = new Set(cards.filter(card => !card.hidden));
    const visible = new Set(matches.slice(0, limit).map(entry => entry.card));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    status.textContent = matches.length
      ? 'Показано ' + visible.size + ' из ' + matches.length + ' · всего в подборке ' + cards.length
      : 'По вашему запросу ничего не найдено';
    empty.hidden = matches.length > 0;
    pagination.hidden = visible.size >= matches.length;
    more.textContent = 'Показать ещё (' + Math.min(pageSize, matches.length - visible.size) + ')';
    if (focusNew) {
      const next = matches.find(entry => visible.has(entry.card) && !previouslyVisible.has(entry.card));
      if (next) {
        next.card.tabIndex = -1;
        next.card.focus({ preventScroll: true });
        next.card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    }
  }

  search.addEventListener('input', () => { limit = pageSize; render(); });
  filters.forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.topic;
    limit = pageSize;
    render();
  }));
  more.addEventListener('click', () => { limit += pageSize; render(true); });
  reset.addEventListener('click', () => {
    search.value = '';
    topic = 'all';
    limit = pageSize;
    render();
    search.focus();
  });
  render();
  tools.hidden = false;
})();
