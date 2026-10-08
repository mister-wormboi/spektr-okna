(() => {
  const track = document.querySelector('[data-solutions-gallery] .solutions-gallery-track');
  if (!track) return;
  const links = [...track.querySelectorAll('a')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Reveal once, only when the photo enters the viewport.
  if ('IntersectionObserver' in window && !motion.matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-awaiting-reveal');
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.06 });
    links.forEach(link => {
      link.classList.add('is-awaiting-reveal');
      reveal.observe(link);
      link.addEventListener('focus', () => {
        link.classList.remove('is-awaiting-reveal');
        reveal.unobserve(link);
      }, { once: true });
    });
    motion.addEventListener('change', () => {
      if (!motion.matches) return;
      reveal.disconnect();
      links.forEach(link => link.classList.remove('is-awaiting-reveal'));
    });
  }
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'solutions-lightbox';
  dialog.setAttribute('aria-label', 'Просмотр фотографий решений');
  dialog.innerHTML = `
    <button class="solutions-lightbox-close" type="button" aria-label="Закрыть">×</button>
    <button class="solutions-lightbox-prev" type="button" aria-label="Предыдущая фотография">←</button>
    <img alt="" decoding="async">
    <button class="solutions-lightbox-next" type="button" aria-label="Следующая фотография">→</button>
    <span class="solutions-lightbox-count" aria-live="polite"></span>`;
  document.body.append(dialog);
  const preview = dialog.querySelector('img');
  const counter = dialog.querySelector('.solutions-lightbox-count');
  let currentIndex = 0, request = 0, opener;
  async function show(index) {
    currentIndex = (index + links.length) % links.length;
    const token = ++request;
    const link = links[currentIndex];
    const thumb = link.querySelector('img');
    preview.src = thumb.currentSrc || thumb.src;
    preview.alt = thumb.alt;
    counter.textContent = (currentIndex + 1) + ' / ' + links.length;
    if (!motion.matches && preview.animate) {
      preview.getAnimations().forEach(animation => animation.cancel());
      preview.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' });
    }
    // Full resolution is fetched on demand; stale requests cannot replace newer photos.
    const full = new Image();
    full.src = link.href;
    try {
      await full.decode();
      if (token === request && dialog.open) preview.src = full.src;
    } catch { /* Keep the preview if the full-size photo cannot load. */ }
  }
  track.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!links.includes(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener = link;
    dialog.showModal();
    document.body.classList.add('lightbox-open');
    show(links.indexOf(link));
  });
  dialog.querySelector('.solutions-lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.solutions-lightbox-prev').addEventListener('click', () => show(currentIndex - 1));
  dialog.querySelector('.solutions-lightbox-next').addEventListener('click', () => show(currentIndex + 1));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    request++;
    document.body.classList.remove('lightbox-open');
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  });
})();
