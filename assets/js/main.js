(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canReveal = !reducedMotion && 'IntersectionObserver' in window;
  function prepareReveal(element, index) {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 65}ms`);
    if (!canReveal) element.classList.add('is-visible');
  }

  const revealSelector = [
    '.calculator-section .call-panel', '.calculator-section .calculator',
    '.home-catalog .section-heading', '.home-category-card', '.home-catalog .catalog-more',
    '.project-examples .section-heading', '.project-examples-note', '.solutions-more',
    '.reviews-heading', '.reviews-grid', '.guides-heading', '.guides details',
    '.home-office-card', '.site-footer .footer-inner > *',
  ].join(',');
  const revealItems = [...document.querySelectorAll(revealSelector)];

  revealItems.forEach((element, index) => {
    const cardIndex = element.matches('.home-category-card, .home-office-card')
      ? [...element.parentElement.children].indexOf(element)
      : index % 6;
    prepareReveal(element, cardIndex);
    if (element.matches('.call-panel')) element.classList.add('reveal-left');
    if (element.matches('.calculator')) element.classList.add('reveal-right');
  });

  if (!canReveal) {
    revealItems.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px' });
  revealItems.forEach((element) => revealObserver.observe(element));
})();
