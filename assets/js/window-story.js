/* Photographic window parts with finite transform animation and an image fallback. */
(() => {
  const section = document.querySelector('.window-story');
  if (!section) return;
  const stage = section.querySelector('.window-stage');
  if (!stage) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timing = window.SpektrWindowMotion;
  const svgNS = 'http://www.w3.org/2000/svg';
  const parts = [
    ['frame', 0, 0, 300, 470],
    ['sash', 21, 12, 258, 448],
    ['glass', 47, 42, 206, 400],
    ['bead', 42, 42, 216, 400]
  ];
  const assetBase = new URL('../window-parts/', document.currentScript.src);
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 580');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs>
    <radialGradient id="ws-shadow"><stop stop-color="#3b5241" stop-opacity=".24"/><stop offset="1" stop-color="#3b5241" stop-opacity="0"/></radialGradient>
    <marker id="ws-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L7 4L1 7" fill="none" stroke="var(--green)" stroke-width="1.2"/></marker>
  </defs>
  <ellipse class="ws-ground" cx="500" cy="500" rx="365" ry="33" opacity=".7" fill="url(#ws-shadow)"/>
  <g class="ws-guides" opacity="0" stroke="#738c77" stroke-width=".7" stroke-dasharray="3 6" fill="none">
    <path d="M215 104L767 182M175 427L727 505"/>
  </g>
  <g class="ws-projection" transform="translate(358 25)">
    ${parts.map(([name, x, y, width, height], index) => `<g data-window-layer="${index}"><image href="${new URL(name + '.webp', assetBase)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none"/></g>`).join('')}
  </g>
  <g class="window-connectors" stroke="var(--green)" stroke-opacity=".65" stroke-width="1" fill="none" marker-end="url(#ws-arrow)">
    <path d="M125 574V508L218 433"/>
    <path d="M375 574V500L364 433"/>
    <path d="M625 574V508L564 436"/>
    <path d="M875 574V522L756 448"/>
  </g>
  <g class="ws-mobile-labels" text-anchor="middle"><text x="160" y="350">1 · Рама</text><text x="480" y="350">2 · Створка</text><text x="160" y="730">3 · Стеклопакет</text><text x="480" y="730">4 · Штапик</text></g>`;
  // Decode the four lightweight rasters before replacing the static fallback.
  Promise.all(parts.map(([name]) => {
    const image = new Image();
    image.src = new URL(name + '.webp', assetBase).href;
    return image.decode();
  })).then(() => {
  stage.replaceChildren(svg);
  section.classList.add('is-enhanced');

  // Keep the mobile reveal observer alive so scrolling back replays the entrance.
  // Only opacity is animated: SVG attachment transforms remain untouched on iOS.
  if ('IntersectionObserver' in window) {
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)section.classList.remove('is-mobile-visible');
        else if(entry.intersectionRatio>=.15)section.classList.add('is-mobile-visible');
      });
    },{threshold:[0,.15]});
    revealObserver.observe(stage);
  } else section.classList.add('is-mobile-visible');

  animateWindow(section, stage, svg, [-205, -67, 94, 238]);
  const fallback = document.querySelector('.window-3d-fallback');
  if (fallback) {
    const viewport = fallback.closest('.window-3d-viewport');
    animateWindow(viewport, viewport, fallback, [-105, -35, 55, 130], true);
  }

  }).catch(() => { /* Keep the static window visible if an asset cannot load. */ });

  // The real SVG and the file:// / WebGL fallback use the same animation engine.
  function animateWindow(section, stage, svg, offsets, isFallback = false) {
    const layers = [...svg.querySelectorAll('[data-window-layer]')];
    const mobile = window.matchMedia('(max-width: 760px)');
    const isMobile = () => !isFallback && mobile.matches;
    // Fit each actual part into the same cell. Glass and beads start at different
    // local coordinates, so applying the same scale/offset misaligns them.
    const mobileCenters = [[160, 165], [480, 165], [160, 545], [480, 545]];
    const bounds = layers.map(layer => layer.getBBox());
    const projection = svg.querySelector('.ws-projection');
    const desktopProjection = projection?.getAttribute('transform');
    const finalTransform = index => {
      if (!isMobile()) return `translateX(${offsets[index]}px)`;
      const b = bounds[index];
      const scale = Math.min(230 / b.width, 280 / b.height);
      const [cx, cy] = mobileCenters[index];
      return `translate(${cx - (b.x + b.width / 2) * scale}px, ${cy - (b.y + b.height / 2) * scale}px) scale(${scale})`;
    };
    function setViewBox() {
      if (!isFallback) {
        svg.setAttribute('viewBox', isMobile() ? '0 0 640 760' : '0 0 1000 580');
        projection?.setAttribute('transform', isMobile() ? 'matrix(1 0 0 1 0 0)' : desktopProjection);
      }
    }
    function placeLayer(layer, index) {
      if (isMobile()) {
        // SVG attributes use local coordinates consistently in iOS WebKit.
        // Do not combine CSS transforms with the parent's SVG projection.
        layer.style.removeProperty('transform');
        layer.setAttribute('transform', finalTransform(index).replaceAll('px', ''));
      } else {
        layer.removeAttribute('transform');
        layer.style.transform = finalTransform(index);
      }
    }
    setViewBox();
    let state = 'idle';
    let observer;
    let rendererObserver;
    let animations = [];
    let mobileFrame = 0;

    function complete() {
      if (state === 'complete') return;
      state = 'complete';
      if (!isMobile()) observer?.disconnect();
      if (mobileFrame) window.cancelAnimationFrame(mobileFrame);
      mobileFrame=0;
      rendererObserver?.disconnect();
      layers.forEach((layer, index) => {
        layer.style.removeProperty('opacity');
        placeLayer(layer, index);
      });
      // Keep only final transforms; release animation objects and observers.
      animations.forEach(animation => {
        animation.finished?.catch(() => {});
        animation.cancel();
      });
      animations = [];
      section.classList.remove('is-playing');
      section.classList.add('is-complete');
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (motion.removeEventListener) motion.removeEventListener('change', onMotionChange);
      else motion.removeListener(onMotionChange);
    }

    function onMotionChange(event) {
      if (event.matches) complete();
    }

    function onVisibilityChange() {
      if (document.hidden) complete();
    }

    function play() {
      if (state !== 'idle') return;
      state = 'playing';
      const fallbackHidden = isFallback && stage.classList.contains('is-rendered');
      if (motion.matches || document.hidden || fallbackHidden || layers.some(layer => typeof layer.animate !== 'function')) {
        complete();
        return;
      }
      if(isMobile()) {
        if(!window.requestAnimationFrame){complete();return;}
        section.classList.remove('is-complete');
        section.classList.add('is-playing');
        document.addEventListener('visibilitychange',onVisibilityChange);
        if(motion.addEventListener)motion.addEventListener('change',onMotionChange);
        else motion.addListener(onMotionChange);
        let began;
        const position=(elapsed)=>layers.forEach((layer,index)=>{
          const progress=Math.max(0,Math.min(1,(elapsed-150-index*80)/1000));
          const ease=progress*progress*(3-2*progress);
          const b=bounds[index],scale=Math.min(230/b.width,280/b.height);
          const [cx,cy]=mobileCenters[index];
          const x=cx-(b.x+b.width/2)*scale,y=cy-(b.y+b.height/2)*scale;
          // Same local SVG coordinates for the assembled window and the four cells.
          layer.style.removeProperty('transform');
          layer.setAttribute('transform',`translate(${212+(x-212)*ease} ${209+(y-209)*ease}) scale(${.72+(scale-.72)*ease})`);
          layer.style.opacity=String(Math.min(1,elapsed/240));
        });
        position(0);
        const tick=now=>{
          if(state!=='playing')return;
          if(began===undefined)began=now;
          const elapsed=now-began;
          position(elapsed);
          if(elapsed<1390)mobileFrame=window.requestAnimationFrame(tick);
          else {layers.forEach(layer=>layer.style.removeProperty('opacity'));complete();}
        };
        mobileFrame=window.requestAnimationFrame(tick);
        return;
      }
      section.classList.add('is-playing');
      document.addEventListener('visibilitychange', onVisibilityChange);
      if (isFallback && 'MutationObserver' in window) {
        rendererObserver = new MutationObserver(() => {
          if (stage.classList.contains('is-rendered')) complete();
        });
        rendererObserver.observe(stage, { attributes: true, attributeFilter: ['class'] });
      }
      try {
        // SVG-local pixel offsets keep the existing projection aligned in Safari.
        layers.forEach((layer, index) => {
          animations.push(layer.animate([
            { transform: isMobile() ? 'translate(210px, 200px) scale(.72)' : 'translateX(0px)' },
            { transform: finalTransform(index) },
          ], {
            duration: isMobile() ? 1100 : (timing?.duration ?? 1800),
            delay: index * (timing?.stagger ?? 100),
            easing: timing?.easing ?? 'cubic-bezier(.22, 1, .36, 1)',
            fill: 'both',
          }));
        });
        Promise.all(animations.map(animation => animation.finished)).then(complete, complete);
      } catch {
        complete();
      }
    }

    // Reflow after rotation without replaying or retaining stale animation transforms.
    function onLayoutChange() {
      setViewBox();
      if (state === 'playing') complete();
      if (state === 'complete') layers.forEach(placeLayer);
    }
    if (!isFallback) {
      if (mobile.addEventListener) mobile.addEventListener('change', onLayoutChange);
      else mobile.addListener(onLayoutChange);
    }
    if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
    else motion.addListener(onMotionChange);

    if (motion.matches || !('IntersectionObserver' in window)) {
      complete();
    } else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => !entry.isIntersecting)) {
          if(state==='playing')complete();
          if(isMobile()&&!motion.matches)state='idle';
        }
        else if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .3)) play();
      }, { threshold: [0, .3] });
      observer.observe(stage);
    }
  }
})();
