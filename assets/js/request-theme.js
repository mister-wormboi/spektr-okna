/* Load only the chosen palette; keep an edited form intact when the site theme changes. */
(() => {
  const host = document.querySelector('[data-themed-request]');
  if (!host) return;
  const variants = [...host.querySelectorAll('[data-request-theme]')];
  const note = host.querySelector('[data-request-theme-note]');
  const loaded = new Set();
  let active;
  let edited = false;
  let ready = !('IntersectionObserver' in window);

  function update() {
    if (!ready) return;
    const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    if (edited) {
      note.hidden = active.dataset.requestTheme === theme;
      return;
    }
    active = variants.find(variant => variant.dataset.requestTheme === theme);
    variants.forEach(variant => { variant.hidden = variant !== active; });
    if (loaded.has(theme)) return;
    loaded.add(theme);
    const source = active.querySelector('template').content.querySelector('script');
    const script = document.createElement('script');
    for (const attribute of source.attributes) script.setAttribute(attribute.name, attribute.value);
    script.textContent = source.textContent;
    active.append(script);
  }

  function preserveInput(event) {
    if (event.isTrusted && active?.contains(event.target)) edited = true;
  }
  host.addEventListener('input', preserveInput, true);
  host.addEventListener('change', preserveInput, true);
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (ready) update();
  else {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      ready = true;
      update();
    }, { rootMargin: '400px' });
    observer.observe(host);
  }
})();
