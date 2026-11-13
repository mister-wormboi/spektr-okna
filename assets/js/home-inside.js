/* One lazy renderer, desktop scroll sequence, finite mobile playback. */
(() => {
  const host = document.querySelector('[data-home-inside]');
  if (!host) return;
  const section = host.closest('.home-inside');
  const panels = [...host.querySelectorAll('.inside-panel')];
  const studies = [...host.querySelectorAll('.inside-study')];
  const replay = host.querySelector('.home-inside-replay');
  const mobile = matchMedia('(max-width:760px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let exhibit, loading, visible = false, frame = 0, active = -1;
  let top = 0, distance = 1, elapsed = 0, lastTime = 0, finished = false;
  const duration = 12000;
  function paint(progress) {
    const position = Math.min(.9999, Math.max(0, progress)) * panels.length;
    const index = Math.floor(position);
    if (index !== active) {
      active = index;
      studies.forEach((study, i) => {
        study.classList.toggle('is-active', i === index);
        study.setAttribute('aria-hidden', String(i !== index));
      });
    }
    exhibit.scroll(panels[index], Math.min(1, position - index));
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(time) {
    frame = 0;
    if (!exhibit || !visible || document.hidden) return;
    if (mobile.matches) {
      if (lastTime) elapsed += Math.min(80, time - lastTime);
      lastTime = time;
      paint(elapsed / duration);
      if (elapsed < duration) frame = requestAnimationFrame(tick);
      else { finished = true; replay.hidden = false; }
    } else paint((scrollY - top) / distance);
  }
  function schedule() {
    if (!frame && exhibit && visible && !document.hidden && !(mobile.matches && finished)) frame = requestAnimationFrame(tick);
  }
  function measure() {
    top = host.getBoundingClientRect().top + scrollY;
    distance = Math.max(1, host.offsetHeight - innerHeight);
    stop(); schedule();
  }
  async function load() {
    if (loading || reduced.matches || navigator.connection?.saveData) return;
    loading = true;
    section.classList.add('is-enhancing');
    measure();
    section.setAttribute('aria-busy', 'true');
    try {
      const { createInsideExhibit } = await import('./window-inside-3d.js?v=20261114-home-intro');
      exhibit = createInsideExhibit(host);
      await exhibit.ready;
      paint(mobile.matches ? elapsed / duration : (scrollY - top) / distance);
      host.classList.remove('is-preparing');
      section.classList.add('is-ready');
      schedule();
    } catch (error) {
      exhibit?.destroy(); exhibit = null;
      console.warn('Home window exhibit:', error.message);
    } finally { section.classList.remove('is-enhancing'); section.removeAttribute('aria-busy'); measure(); }
  }
  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loader.disconnect(); load(); }
    }, { rootMargin:'350px' });
    loader.observe(host);
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) schedule(); else stop();
    }, { threshold:0 }).observe(host.querySelector('.inside-sticky'));
  } else { visible = true; load(); }
  replay.addEventListener('click', () => { elapsed = 0; finished = false; replay.hidden = true; stop(); schedule(); });
  addEventListener('scroll', () => { if (!mobile.matches) schedule(); }, { passive:true });
  addEventListener('resize', measure, { passive:true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else schedule(); });
  reduced.addEventListener('change', () => {
    stop();
    if (reduced.matches) { exhibit?.destroy(); exhibit = null; loading = false; section.classList.remove('is-ready'); }
    else load();
  });
  mobile.addEventListener('change', measure);
  measure();
})();
