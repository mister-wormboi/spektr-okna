/* A dimensionally aligned product illustration. All parts share one projection;
   only their assembly-axis offsets change, so every joint returns exactly home. */
(() => {
  const section = document.querySelector('.window-story');
  if (!section) return;
  const stage = section.querySelector('.window-stage');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const rectPath = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const ring = (x, y, w, h, b, depth, finish = 'pvc') => {
    const hole = rectPath(x + b, y + b, w - b * 2, h - b * 2);
    return `<path d="M${x + w} ${y}l${depth} ${-depth * .55}v${h}l${-depth} ${depth * .55}Z" fill="url(#ws-side)"/>
      <path d="M${x} ${y}l${depth} ${-depth * .55}h${w}l${-depth} ${depth * .55}Z" fill="#fff"/>
      <path d="${rectPath(x, y, w, h)}${hole}" fill="url(#ws-${finish})" fill-rule="evenodd" stroke="#adb4ae" stroke-width=".8"/>
      <path d="M${x + b} ${y + b}h${w - b * 2}v${h - b * 2}h${-w + b * 2}Z" fill="none" stroke="#69746e" stroke-width="2"/>
      <path d="${rectPath(x + 4, y + 4, w - 8, h - 8)}${rectPath(x + b - 4, y + b - 4, w - b * 2 + 8, h - b * 2 + 8)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1"/>
      <path d="M${x} ${y}l${b} ${b}M${x + w} ${y}l${-b} ${b}M${x} ${y + h}l${b} ${-b}M${x + w} ${y + h}l${-b} ${-b}" stroke="#b9c0b8" stroke-width=".7"/>`;
  };
  const glass = (x, y, w, h, offset) => `<g transform="translate(${offset} ${-offset * .55})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#ws-glass)" stroke="#789995" stroke-width="1.5"/>
    <path d="M${x + 3} ${y + h - 3}V${y + 3}H${x + w - 3}" fill="none" stroke="#eefcf8" stroke-width="2"/>
    <path d="M${x + 4} ${y + 14}l${w - 8} ${h * .18}v${h * .12}L${x + 4} ${y + h * .3}Z" fill="#fff" opacity=".2"/>
    <path d="M${x + w * .62} ${y + 3}h${w * .12}l${-w * .44} ${h - 6}h${-w * .12}Z" fill="#fff" opacity=".2"/>
  </g>`;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 580');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs>
    <linearGradient id="ws-pvc" x1="0" y1="0" x2=".85" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#fff"/><stop offset=".42" stop-color="#f0f1eb"/><stop offset=".75" stop-color="#dfe3db"/><stop offset="1" stop-color="#fbfcf7"/></linearGradient>
    <linearGradient id="ws-side"><stop stop-color="#a0aca1"/><stop offset=".3" stop-color="#c1c9bf"/><stop offset="1" stop-color="#87968b"/></linearGradient>
    <linearGradient id="ws-metal"><stop stop-color="#68796f"/><stop offset=".2" stop-color="#e5e9e2"/><stop offset=".45" stop-color="#99a69d"/><stop offset=".65" stop-color="#f7f9f4"/><stop offset="1" stop-color="#7e8d82"/></linearGradient>
    <linearGradient id="ws-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#abcac7" stop-opacity=".5"/><stop offset=".3" stop-color="#e9f3ed" stop-opacity=".16"/><stop offset=".65" stop-color="#87b2ab" stop-opacity=".26"/><stop offset="1" stop-color="#c4dad0" stop-opacity=".65"/></linearGradient>
    <radialGradient id="ws-shadow"><stop stop-color="#3b5241" stop-opacity=".24"/><stop offset="1" stop-color="#3b5241" stop-opacity="0"/></radialGradient>
    <filter id="ws-contact" x="-25%" y="-20%" width="160%" height="160%"><feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="#243f30" flood-opacity=".16"/></filter>
  </defs>
  <ellipse class="ws-ground" cx="500" cy="500" rx="215" ry="33" fill="url(#ws-shadow)"/>
  <g class="ws-guides" opacity="0" stroke="#738c77" stroke-width=".7" stroke-dasharray="3 6" fill="none">
    <path d="M215 104L767 182M175 427L727 505"/>
  </g>
  <g transform="translate(358 53) matrix(.94 .13 -.075 .94 0 0)">
    <g data-window-layer="0"><g filter="url(#ws-contact)">
      ${ring(0, 0, 300, 420, 25, 14)}
      <path d="M27 27H273V393H27Z" stroke="#47594e" stroke-width="4" fill="none"/>
      <path d="M30 30H270V390H30Z" stroke="#d0d6cd" stroke-width="2" fill="none"/>
      <rect x="278" y="78" width="9" height="34" rx="2" fill="url(#ws-metal)"/>
      <rect x="278" y="309" width="9" height="34" rx="2" fill="url(#ws-metal)"/>
      <path d="M63 409h20M217 409h20" stroke="#a0aaa1" stroke-width="2" stroke-linecap="round"/>
    </g></g>
    <g data-window-layer="1"><g filter="url(#ws-contact)">
      ${ring(21, 21, 258, 378, 24, 9)}
      <path d="M46 46H254V374H46Z" stroke="#3b4b42" stroke-width="4" fill="none"/>
      <path d="M24 59V365" stroke="url(#ws-metal)" stroke-width="3"/>
      <rect x="268" y="77" width="11" height="38" rx="3" fill="url(#ws-pvc)" stroke="#a7b2a6"/>
      <rect x="268" y="307" width="11" height="38" rx="3" fill="url(#ws-pvc)" stroke="#a7b2a6"/>
      <g fill="url(#ws-metal)" stroke="#718174" stroke-width=".6"><rect x="21" y="95" width="6" height="14" rx="1"/><rect x="21" y="308" width="6" height="14" rx="1"/></g>
      <rect x="28" y="181" width="13" height="47" rx="6" fill="url(#ws-pvc)" stroke="#a5afa3"/>
      <circle cx="34.5" cy="189" r="1.4" fill="#8b988b"/>
      <path d="M34 202v44q0 6 5 6h3q4 0 4-5v-40q0-7-7-9Z" fill="url(#ws-pvc)" stroke="#a5afa3" stroke-width=".8"/>
    </g></g>
    <g data-window-layer="2">
      ${glass(47, 47, 206, 326, 9)}
      ${ring(47, 47, 206, 326, 5, 7, 'metal')}
      <path d="M50 50H250V370H50Z" fill="none" stroke="#5c7066" stroke-width="2" stroke-dasharray="1 3"/>
      ${glass(47, 47, 206, 326, 0)}
    </g>
    <g data-window-layer="3"><g filter="url(#ws-contact)">
      ${ring(42, 42, 216, 336, 10, 4)}
      <path d="M53 53H247V367H53Z" fill="none" stroke="#455b4e" stroke-width="2"/>
    </g></g>
  </g>
  <g class="ws-labels" opacity="0">
    <g transform="translate(149 459)"><path d="M0 -38v19" stroke="#91a08e" fill="none"/><text class="window-svg-label-number">01</text><text y="20" class="window-svg-label">Рама</text></g>
    <g transform="translate(352 505)"><path d="M0 -38v19" stroke="#91a08e"/><text class="window-svg-label-number">02</text><text y="20" class="window-svg-label">Створка</text></g>
    <g transform="translate(613 60)"><text class="window-svg-label-number">03</text><text y="20" class="window-svg-label">Стеклопакет</text><path d="M18 30v46" stroke="#91a08e"/></g>
    <g transform="translate(793 515)"><path d="M0 -38v19" stroke="#91a08e"/><text class="window-svg-label-number">04</text><text y="20" class="window-svg-label">Штапик</text></g>
  </g>`;
  stage.replaceChildren(svg);
  section.classList.add('is-enhanced');

  const layers = [...svg.querySelectorAll('[data-window-layer]')];
  const labels = svg.querySelector('.ws-labels');
  const guides = svg.querySelector('.ws-guides');
  const shadow = svg.querySelector('.ws-ground');
  const progressBar = section.querySelector('.window-timeline span');
  const title = section.querySelector('.window-step-title');
  const copy = section.querySelector('.window-step-copy');
  const number = section.querySelector('.window-step-number');
  const steps = [
    ['Всё на своём месте', 'Рама, створка и стеклопакет работают как единое целое.'],
    ['Основа — в деталях', 'Рама держит конструкцию. Створка с фурнитурой отвечает за открывание и плотный прижим.'],
    ['Между вами и улицей', 'Стеклопакет пропускает свет. Уплотнители и штапик обеспечивают плотное прилегание.'],
    ['Снова одно целое', 'Каждая деталь возвращается на своё место. Окно готово впустить свет в ваш дом.'],
  ];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
  let frame = 0;
  let current = -1;
  let top = 0;
  let distance = 1;
  let visible = true;

  function render() {
    frame = 0;
    const p = motion.matches ? .5 : clamp((window.scrollY - top) / distance);
    // Hold both assembled endpoints and the exploded middle. No time-based drift:
    // scrolling backwards retraces exactly the same assembly path.
    const spread = smooth((p - .07) / .30) * (1 - smooth((p - .64) / .29));
    const offsets = [-205, -67, 94, 238];
    layers.forEach((layer, index) => {
      const x = offsets[index] * spread;
      layer.setAttribute('transform', `translate(${x.toFixed(3)} ${(x * .13).toFixed(3)})`);
    });
    labels.setAttribute('opacity', smooth((spread - .62) / .38).toFixed(3));
    guides.setAttribute('opacity', (spread * .45).toFixed(3));
    shadow.setAttribute('rx', String(215 + spread * 150));
    shadow.setAttribute('opacity', String(1 - spread * .3));
    progressBar.style.transform = `scaleX(${p})`;
    const step = p < .16 ? 0 : p < .44 ? 1 : p < .73 ? 2 : 3;
    if (step !== current) {
      current = step;
      number.textContent = `0${step + 1} / 04`;
      title.textContent = steps[step][0];
      copy.textContent = steps[step][1];
    }
  }
  function requestRender() { if (!frame && visible) frame = requestAnimationFrame(render); }
  function measure() {
    svg.setAttribute('viewBox', window.innerWidth <= 760 ? '100 -10 800 590' : '0 0 1000 580');
    top = section.getBoundingClientRect().top + window.scrollY;
    distance = Math.max(1, section.offsetHeight - section.querySelector('.window-story-sticky').offsetHeight);
    render();
  }
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  motion.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { measure(); requestRender(); }
    }, { rootMargin: '200px' }).observe(section);
  }
  measure();
})();
