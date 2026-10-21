(() => {
  function openAnswer(hash) {
    const answer = document.getElementById(hash.slice(1));
    if (answer?.tagName !== 'DETAILS') return;
    answer.open = true;
    answer.classList.add('is-visible');
  }
  document.querySelectorAll('[data-faq-link]').forEach(link => {
    link.addEventListener('click', () => openAnswer(link.hash));
  });
  if (window.location.hash) openAnswer(window.location.hash);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = document.querySelectorAll('[data-reveal]');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: .12, rootMargin: '0px 0px -28px' });
  items.forEach(item => observer.observe(item));
})();
