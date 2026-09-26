(() => {
  const section = document.querySelector('.reviews');
  const cards = [...section.querySelectorAll('.review-card')];
  if (cards.length < 2) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.createElement('div');
  controls.className = 'review-controls';
  const selector = document.createElement('div');
  selector.className = 'review-selector';
  selector.setAttribute('role', 'group');
  selector.setAttribute('aria-label', 'Выбор отзыва');
  let current = 0;
  let animation;
  const dots = cards.map((card, index) => {
    card.id = `review-${index + 1}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'review-dot';
    button.textContent = String(index + 1).padStart(2, '0');
    button.setAttribute('aria-label', `Отзыв: ${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', card.id);
    button.addEventListener('click', () => show(index));
    selector.append(button);
    return button;
  });
  const announcement = document.createElement('span');
  announcement.className = 'review-announcement';
  announcement.setAttribute('role', 'status');
  function show(index, initial = false) {
    const next = (index + cards.length) % cards.length;
    if (next === current && !initial) return;
    const direction = index < current ? -1 : 1;
    animation?.cancel();
    current = next;
    cards.forEach((card, i) => {
      card.classList.toggle('is-current', i === current);
      card.setAttribute('aria-hidden', String(i !== current));
      card.inert = i !== current;
      dots[i].setAttribute('aria-pressed', String(i === current));
    });
    if (!initial) {
      announcement.textContent = `Отзыв ${current + 1} из ${cards.length}. ${cards[current].querySelector('h3').textContent}`;
      if (!reduced.matches) animation = cards[current].animate([
        { opacity: 0, transform: `translateX(${direction * 14}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 380, easing: 'cubic-bezier(.2,.7,.3,1)' });
    }
  }
  controls.append(selector);
  [['←', 'Предыдущий отзыв', -1], ['→', 'Следующий отзыв', 1]].forEach(([symbol, label, step]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'review-arrow';
    button.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => show(current + step));
    controls.append(button);
  });
  controls.append(announcement);
  section.querySelector('.wrap').append(controls);
  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : current + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  reduced.addEventListener('change', () => animation?.cancel());
  section.classList.add('is-slider');
  show(0, true);
})();
