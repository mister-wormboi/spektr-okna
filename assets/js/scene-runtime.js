import * as THREE from '../vendor/three/three.module.min.js';
export { THREE };

// Local environment map: large softboxes and sky, with no low-resolution image assets.
export function environment(renderer, studio = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
  gradient.addColorStop(0, studio ? '#dbe5e1' : '#6e9caa');
  gradient.addColorStop(.48, studio ? '#829a8e' : '#e6e9d8');
  gradient.addColorStop(.52, studio ? '#40574b' : '#98a183');
  gradient.addColorStop(1, '#1b2c24');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,2048,1024);
  ctx.fillStyle = '#fff9e7'; ctx.fillRect(280,170,180,400);
  ctx.fillStyle = '#e2f5f4'; ctx.fillRect(1190,120,90,440);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(1660,240,240,140);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(texture);
  texture.dispose(); generator.dispose();
  return target.texture;
}

export function createRenderer(container, transparent = false) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = false;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);
  return renderer;
}

export function box(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth), material);
  mesh.position.set(x,y,z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

// Render at 30 fps only while visible; use a bounded framebuffer without supersampling.
export function playback(container, renderer, camera, scene, animate, onResize = () => {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, lost = false, frame = 0, elapsed = 0, previous = 0, lastDraw = 0;
  let width = 1, height = 1;
  function render() { animate(elapsed); renderer.render(scene,camera); }
  function tick(now) {
    frame = 0;
    if (previous) elapsed += Math.min((now-previous)/1000,.25);
    previous = now;
    if (!lastDraw || now - lastDraw >= 1000 / 30 - 1) {
      lastDraw = now; render();
    }
    if (visible && !document.hidden && !motion.matches && !lost) frame = requestAnimationFrame(tick);
  }
  function update() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = 0; lastDraw = 0;
    if (lost) return;
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    else render();
  }
  function resize() {
    width = Math.max(1,container.clientWidth); height = Math.max(1,container.clientHeight);
    // Antialiasing preserves smooth edges with far fewer pixels and GPU passes.
    const max = renderer.capabilities.maxTextureSize;
    const density = Math.min(devicePixelRatio || 1,1.25,Math.sqrt(800000/(width*height)),max/width,max/height);
    renderer.setPixelRatio(density); renderer.setSize(width,height,false);
    camera.aspect = width/height; camera.updateProjectionMatrix();
    onResize(width,height); if (!lost) render();
  }
  new ResizeObserver(resize).observe(container);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; update();
  }, {threshold: .01}).observe(container);
  else { visible = true; update(); }
  document.addEventListener('visibilitychange',update);
  motion.addEventListener('change',update);
  renderer.domElement.addEventListener('webglcontextlost',event => {
    event.preventDefault(); lost = true;
    cancelAnimationFrame(frame); frame = 0;
    container.classList.remove('is-rendered');
  });
  renderer.domElement.addEventListener('webglcontextrestored',() => {
    lost = false; resize(); update(); container.classList.add('is-rendered');
  });
  resize(); container.classList.add('is-rendered');
}
