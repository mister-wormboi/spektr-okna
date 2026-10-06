import { THREE, createRenderer, environment, box, playback } from './scene-runtime.js';

const viewport = document.querySelector('.window-3d-viewport');
if (viewport) {
  const initialize = () => {
    try { buildWindow(viewport); } catch (error) { console.warn('Window preview unavailable:',error.message); }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect(); initialize();
    }, { rootMargin: '150px' });
    observer.observe(viewport);
  } else initialize();
}
function buildWindow(viewport) {
  const renderer = createRenderer(viewport,true);
  renderer.setClearColor(0,0);
  const scene = new THREE.Scene();
  scene.environment = environment(renderer,true);
  const camera = new THREE.PerspectiveCamera(32,1,.1,50);
  camera.position.set(0,.35,4.5); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x4c6854,2));
  const key = new THREE.DirectionalLight(0xfff5de,4.5);
  key.position.set(-3,5,5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd0e9ff,2.2); rim.position.set(3,2,-3); scene.add(rim);
  const pvc = new THREE.MeshStandardMaterial({color:0xf6f6ee,roughness:.24,metalness:0});
  const seal = new THREE.MeshStandardMaterial({color:0x28352e,roughness:.8});
  const aluminium = new THREE.MeshStandardMaterial({color:0xb8c6bd,metalness:.86,roughness:.22});
  const glass = new THREE.MeshStandardMaterial({color:0x719b94,roughness:.025,metalness:.15,transparent:true,opacity:.18,envMapIntensity:1.3,side:THREE.DoubleSide,depthWrite:false});
  glass.forceSinglePass = true;
  const model = new THREE.Group(); scene.add(model);
  // Keep one fixed viewing angle while the window separates and reassembles.
  model.rotation.set(-.05, -.55, 0);
  const layers = Array.from({length:4},() => { const layer = new THREE.Group(); model.add(layer); return layer; });

  function roundedPath(w,h,r) {
    const p = new THREE.Shape();
    p.moveTo(-w/2+r,-h/2); p.lineTo(w/2-r,-h/2); p.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    p.lineTo(w/2,h/2-r); p.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    p.lineTo(-w/2+r,h/2); p.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    p.lineTo(-w/2,-h/2+r); p.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); return p;
  }
  function ring(parent,w,h,b,d,z,material) {
    const shape = roundedPath(w,h,.008);
    const hole = roundedPath(w-2*b,h-2*b,.005); shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.003,bevelThickness:.003,curveSegments:6});
    geo.translate(0,0,-d/2);
    const mesh = new THREE.Mesh(geo,material); mesh.position.z=z; mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh);
    return mesh;
  }
  ring(layers[0],1.25,1.72,.085,.16,0,pvc);
  ring(layers[0],1.22,1.69,.012,.008,.085,pvc);
  ring(layers[0],1.085,1.555,.017,.024,.066,seal);
  box(layers[0],1.4,.048,.28,0,-.883,.015,pvc);
  ring(layers[1],1.075,1.545,.082,.10,.045,pvc);
  ring(layers[1],1.047,1.517,.009,.012,.104,pvc);
  ring(layers[1],.916,1.385,.014,.02,.067,seal);
  ring(layers[2],.9,1.37,.012,.052,.062,aluminium);
  for (const z of [.044,.066,.088]) {
    const pane=box(layers[2],.876,1.346,.006,0,0,z,glass); pane.castShadow=false;
  }
  // Analytic softbox reflection stays crisp at any size and angle.
  const reflection = new THREE.Mesh(new THREE.PlaneGeometry(.872,1.342),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
    vertexShader:'varying vec2 uvGlass; void main(){uvGlass=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 uvGlass; void main(){
      float diagonal=uvGlass.x+uvGlass.y*.42;
      float band=smoothstep(.38,.40,diagonal)*(1.-smoothstep(.55,.57,diagonal));
      float hairline=smoothstep(.79,.80,diagonal)*(1.-smoothstep(.82,.83,diagonal));
      gl_FragColor=vec4(.85,.97,.94,band*.19+hairline*.12);
    }`
  }));
  reflection.position.z=.094; layers[2].add(reflection);
  ring(layers[3],.925,1.395,.022,.026,.113,pvc);
  ring(layers[3],.885,1.355,.007,.01,.125,seal);
  // Smooth hardware, with separate hinges and a rounded lever.
  for (const y of [-.55,.55]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,.14,32),pvc);
    hinge.position.set(.543,y,.099); layers[1].add(hinge);
  }
  const plate = new THREE.Mesh(new THREE.CapsuleGeometry(.018,.08,8,24),pvc); plate.position.set(-.487,0,.115); layers[1].add(plate);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.065,32),aluminium); neck.rotation.x=Math.PI/2; neck.position.set(-.487,-.01,.155); layers[1].add(neck);
  const lever = new THREE.Mesh(new THREE.CapsuleGeometry(.014,.11,8,24),pvc); lever.position.set(-.487,-.07,.185); layers[1].add(lever);
  // A soft contact shadow avoids redrawing the entire model into a shadow map each frame.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3,2.4),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    vertexShader:'varying vec2 shadowUV; void main(){shadowUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 shadowUV; void main(){vec2 p=(shadowUV-.5)*vec2(2.,3.);float a=exp(-dot(p,p)*5.)*.18;gl_FragColor=vec4(0.,0.,0.,a);}'
  }));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.95; scene.add(floor);
  function smooth(a,b,t) { const x=THREE.MathUtils.clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); }
  playback(viewport,renderer,camera,scene,time => {
    const t=(time%7)/7*20;
    const spread=smooth(4,8,t)*(1-smooth(11,15,t));
    layers.forEach((layer,i) => {
      layer.position.z = [-.45,0,.42,.72][i]*spread;
      layer.position.x = [-.16,0,.1,.2][i]*spread;
    });
  }, (w,h) => {
    camera.position.z = w/h < .75 ? 6.4 : 4.5;
    camera.updateProjectionMatrix();
  });
}
