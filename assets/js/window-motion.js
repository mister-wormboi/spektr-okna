/* Both window views share one document-timeline timestamp. */
(() => {
  const targets = [...document.querySelectorAll('.window-3d-viewport, .window-stage')];
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set();
  const seen = new Set();
  let current = null;
  window.SpektrWindowMotion = {
    duration: 1800,
    stagger: 100,
    easing: 'cubic-bezier(.22, 1, .36, 1)',
    subscribe(listener) {
      listeners.add(listener);
      if (current) listener(current);
      return () => listeners.delete(listener);
    },
  };
  const observer = new IntersectionObserver(entries => {
    let start = false;
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < .3 || seen.has(entry.target)) return;
      seen.add(entry.target);
      observer.unobserve(entry.target);
      start = true;
    });
    if (start && !motion.matches && !document.hidden) {
      current = { startTime: document.timeline.currentTime };
      listeners.forEach(listener => listener(current));
    }
    if (seen.size === targets.length) observer.disconnect();
  }, { threshold: .3 });
  targets.forEach(target => observer.observe(target));
})();
