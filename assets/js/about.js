(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let revealObserver;
  // Content is visible by default. Each entrance runs once, without scroll handlers.
  if ('IntersectionObserver' in window && !reduced.matches) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (reduced.matches || typeof entry.target.animate !== 'function') return;
        const animation = entry.target.animate([
          { opacity: .65, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        animations.add(animation);
        const release = () => animations.delete(animation);
        animation.onfinish = release;
        animation.oncancel = release;
      });
    }, { threshold: .12 });
    document.querySelectorAll('.about-section-heading, .principles article, .solution-card, .process-intro, .process-steps, .about-invitation').forEach(element => revealObserver.observe(element));
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) animations.forEach(animation => animation.cancel());
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      revealObserver?.disconnect();
      animations.forEach(animation => animation.cancel());
    }
  });
})();
/* Page scroll controls real footage; the video never plays on its own. */
(() => {
  const video = document.querySelector('.about-video');
  if (!video) return;
  const desktop = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  const fps = 24;
  let range = 1;
  let duration = 0;
  let frame = 0;
  let enabled = false;
  let failed = false;
  function render() {
    frame = 0;
    if (!enabled || failed || document.hidden || !duration || video.seeking || video.readyState < 2) return;
    const progress = Math.max(0, Math.min(1, window.scrollY / range));
    const target = Math.min(duration - 1 / fps, Math.floor(progress * duration * fps) / fps);
    if (Math.abs(video.currentTime - target) >= 1 / (fps * 2)) video.currentTime = Math.max(0, target);
  }
  function schedule() {
    if (enabled && !frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  // No geometry measurements occur in the scroll handler or decoder callbacks.
  function measure() {
    range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    schedule();
  }
  function configure() {
    const next = desktop.matches && !reduced.matches && !saveData && !failed;
    if (next === enabled) return;
    enabled = next;
    video.pause();
    if (enabled) {
      window.addEventListener('scroll', schedule, { passive: true });
      if (!video.getAttribute('src')) { video.src = video.dataset.videoSrc; video.load(); }
      if (video.readyState >= 2) video.classList.add('is-ready');
      measure();
    } else {
      window.removeEventListener('scroll', schedule);
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      video.classList.remove('is-ready');
    }
  }
  video.addEventListener('loadedmetadata', () => {
    duration = Number.isFinite(video.duration) && video.duration > 1 / fps ? video.duration : 0;
    measure();
  });
  video.addEventListener('loadeddata', () => {
    if (enabled) video.classList.add('is-ready');
    schedule();
  });
  video.addEventListener('seeked', schedule);
  video.addEventListener('canplay', schedule);
  video.addEventListener('error', () => { failed = true; configure(); });
  window.addEventListener('resize', measure, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
  }
  desktop.addEventListener('change', configure);
  reduced.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else if (!document.hidden) measure();
  });
  configure();
})();
