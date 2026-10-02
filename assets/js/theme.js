/* Runs in the head so the saved palette is applied before the page is painted. */
(() => {
  const key = 'spektr-theme';
  const root = document.documentElement;
  const valid = value => value === 'light' || value === 'dark';
  let theme = 'light';
  try {
    const saved = window.localStorage.getItem(key);
    if (valid(saved)) theme = saved;
  } catch { /* Private browsing or disabled storage: switching still works. */ }

  function apply(value) {
    theme = value;
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  }

  root.setAttribute('data-theme', theme);
  function initialize() {
    apply(theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        apply(theme === 'dark' ? 'light' : 'dark');
        try { window.localStorage.setItem(key, theme); } catch { /* Optional persistence. */ }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    if (event.newValue === null) apply('light');
    else if (valid(event.newValue)) apply(event.newValue);
  });
})();
