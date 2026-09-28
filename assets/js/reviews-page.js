/* Progressive enhancement: all reviews are readable without JavaScript. */
(() => {
  const grid = document.querySelector('#reviewGrid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.review-card')];
  const tools = document.querySelector('.review-tools');
  const filters = [...document.querySelectorAll('[data-topic]')];
  const status = document.querySelector('#reviewStatus');
  const pagination = document.querySelector('.review-pagination');
  const more = document.querySelector('#loadMoreReviews');
  const empty = document.querySelector('.review-empty');
  const reset = document.querySelector('#resetReviews');
  const pageSize = 6;
  let limit = pageSize;
  let topic = 'all';
  const entries = cards.map(card => ({
    card,
    topics: card.dataset.topics.split(' ')
  }));

  function render(focusNew = false) {
    const matches = entries.filter(entry =>
      topic === 'all' || entry.topics.includes(topic)
    );
    const previouslyVisible = new Set(cards.filter(card => !card.hidden));
    const visible = new Set(matches.slice(0, limit).map(entry => entry.card));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      [...visible].forEach((card, i) => {
        card.getAnimations().forEach(animation => animation.cancel());
        card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, delay: i * 45, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.3,1)' });
      });
    }
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    status.textContent = matches.length
      ? 'Показано отзывов: ' + visible.size
      : 'В этой теме пока нет отзывов';
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

  filters.forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.topic;
    limit = pageSize;
    render();
  }));
  more.addEventListener('click', () => { limit += pageSize; render(true); });
  reset.addEventListener('click', () => {
    topic = 'all';
    limit = pageSize;
    render();
    filters[0].focus();
  });
  render();
  tools.hidden = false;
})();
