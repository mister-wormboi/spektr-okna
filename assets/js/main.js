(() => {
  const homeCatalog = document.querySelector('#cards');
  const searchInput = document.querySelector('#homeCatalogSearch');
  const sortSelect = document.querySelector('#homeCatalogSort');
  const count = document.querySelector('#homeCatalogCount');
  const filters = [...document.querySelectorAll('[data-home-group]')];
  const products = window.SPEKTR_CATALOG || [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canReveal = !reducedMotion && 'IntersectionObserver' in window;
  let revealObserver = null;
  let activeGroup = 'all';

  function renderCatalog() {
    if (!homeCatalog || !window.renderSpektrCatalogCard) return;
    const matching = window.selectCatalogItems(products, {
      group: activeGroup,
      query: searchInput?.value || '',
      sort: sortSelect?.value || 'default',
    });

    const shown = matching.slice(0, 4);
    homeCatalog.querySelectorAll('.card').forEach(card => revealObserver?.unobserve(card));
    homeCatalog.replaceChildren(...shown.map((item, index) => window.renderSpektrCatalogCard(item, index)));
    homeCatalog.querySelectorAll('.card').forEach((card, index) => {
      card.classList.remove('card-enter');
      card.classList.add('reveal');
      card.style.setProperty('--reveal-delay', `${index * 55}ms`);
      if (!canReveal) card.classList.add('is-visible');
      else revealObserver?.observe(card);
    });
    if (!shown.length) {
      const empty = document.createElement('p');
      empty.className = 'catalog-empty';
      empty.textContent = 'Ничего не найдено. Попробуйте изменить запрос.';
      homeCatalog.append(empty);
    }
    if (count) count.textContent = matching.length > shown.length
      ? `Показаны ${shown.length} из ${matching.length} позиций — весь список в каталоге.`
      : `Показано позиций: ${shown.length}`;
  }

  filters.forEach((button) => button.addEventListener('click', () => {
    activeGroup = button.dataset.homeGroup;
    filters.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderCatalog();
  }));
  searchInput?.addEventListener('input', renderCatalog);
  sortSelect?.addEventListener('change', renderCatalog);
  renderCatalog();

  const revealSelector = [
    '.benefits-strip > div',
    '.calculator-section .call-panel', '.calculator-section .calculator',
    '.home-catalog .section-heading', '.home-catalog-tabs', '.home-catalog-tools', '.home-catalog .catalog-note', '.home-catalog .card', '.home-catalog-count', '.home-catalog .catalog-more',
    '.project-examples .section-heading', '.project-example', '.project-examples-note', '.solutions-more',
    '.reviews-heading', '.review-card', '.reviews-bottom', '.guides-heading', '.guides details',
    '.home-contact-copy', '.home-office-card', '.site-footer .footer-inner > *',
  ].join(',');
  const revealItems = [...document.querySelectorAll(revealSelector)];

  revealItems.forEach((element, index) => {
    element.classList.add('reveal');
    if (element.matches('.call-panel, .home-contact-copy')) element.classList.add('reveal-left');
    if (element.matches('.calculator')) element.classList.add('reveal-right');
    element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 65}ms`);
  });

  if (!canReveal) {
    revealItems.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px' });
  revealItems.forEach((element) => revealObserver.observe(element));
})();
