import { THREE, createRenderer, environment, surfaceTexture, box } from './scene-runtime.js?v=20261105-realism';

// One shared, lazy WebGL context. Frames are requested only during an interaction.
export function createInsideExhibit(host) {
  // Keep the same quality tier through rotation: avoid shader recompilation on resize.
  const compactDevice=matchMedia('(max-width: 700px), (pointer: coarse) and (max-width: 1100px)').matches;
  const lowPower=compactDevice || navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory<=4);
  const mount = document.createElement('div');
  mount.className = 'inside-webgl';
  const renderer = createRenderer(mount, true);
  renderer.toneMappingExposure = .92;
  // A single bounded shadow map gives the hollow sections real depth.
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = environment(renderer, 'neutral');
  scene.add(new THREE.HemisphereLight(0xffffff, 0x626566, .65));
  const light = new THREE.DirectionalLight(0xfff8ef, 2.0);
  light.position.set(-3, 5, 6); scene.add(light);
  light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  Object.assign(light.shadow.camera,{left:-2.6,right:2.6,top:2.8,bottom:-2.8,near:.5,far:15});
  light.shadow.bias=-.0001;light.shadow.normalBias=.002;
  const rim = new THREE.DirectionalLight(0xe4edff, 1.1);
  rim.position.set(4, 2, -2); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  const mat = (color, roughness = .3, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const pvc = new THREE.MeshPhysicalMaterial({color:0xf4f3ef,roughness:.29,metalness:0,clearcoat:.26,clearcoatRoughness:.25,envMapIntensity:.85});
  const cut = mat(0xd9dcd8,.48), seal = mat(0x181b1c, .88);
  const steel = new THREE.MeshPhysicalMaterial({color:0xb8bdc0,roughness:.33,metalness:.96,anisotropy:lowPower?0:.45,anisotropyRotation:Math.PI/2,envMapIntensity:1.15});
  const wall = mat(0xc7c4bb, .96);
  const foam = mat(0xd3bf84, 1);
  const pvcTexture=surfaceTexture('pvc');pvc.bumpMap=pvc.roughnessMap=pvcTexture;pvc.bumpScale=.0006;
  seal.bumpMap=surfaceTexture('rubber');seal.bumpScale=.0008;
  wall.bumpMap=surfaceTexture('plaster');wall.bumpScale=.004;
  foam.bumpMap=surfaceTexture('foam');foam.bumpScale=.007;
  // Physical transmission bends the rendered surroundings through each pane.
  // Keep the surface nearly colourless; tint belongs to the volume and edges.
  const glass = new THREE.MeshPhysicalMaterial({
    color:0xf7fffc,metalness:0,roughness:.055,ior:1.46,
    transmission:lowPower?0:.96,thickness:.045,attenuationColor:0xb8e7d8,attenuationDistance:2.8,
    clearcoat:1,clearcoatRoughness:.075,envMapIntensity:1.65,
    specularIntensity:1,transparent:true,opacity:lowPower?.23:1,
    side:THREE.DoubleSide,depthWrite:false,forceSinglePass:true
  });
  // Mobile keeps angle-dependent highlights without an extra scene render per frame.
  if(lowPower){
    glass.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float grazing=pow(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),4.0);
        diffuseColor.a=mix(diffuseColor.a,0.72,grazing);
        #include <opaque_fragment>
      `);
    };
    glass.customProgramCacheKey=()=> 'inside-mobile-glass-v1';
  }
  const glassEdge=new THREE.MeshPhysicalMaterial({
    color:0xc1e8dc,metalness:0,roughness:.08,ior:1.46,
    clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.8,
    transparent:true,opacity:.48,depthWrite:false
  });
  glassEdge.userData.part='glass';
  // Transmission needs a rendered background, rather than only the CSS behind
  // the transparent canvas. Match the studio palette in both site themes.
  const backdropCanvas=document.createElement('canvas');
  backdropCanvas.width=512;backdropCanvas.height=512;
  const backdropContext=backdropCanvas.getContext('2d');
  const backdrop=new THREE.CanvasTexture(backdropCanvas);
  backdrop.colorSpace=THREE.SRGBColorSpace;scene.background=backdrop;
  function updateBackdrop(){
    const style=getComputedStyle(host.closest('.inside') || host);
    const gradient=backdropContext.createRadialGradient(246,180,0,246,180,380);
    gradient.addColorStop(0,style.getPropertyValue('--studio-center').trim() || '#30483a');
    gradient.addColorStop(.55,style.getPropertyValue('--studio-mid').trim() || '#203127');
    gradient.addColorStop(1,style.getPropertyValue('--studio-edge').trim() || '#15221a');
    backdropContext.fillStyle=gradient;backdropContext.fillRect(0,0,512,512);backdrop.needsUpdate=true;
  }
  updateBackdrop();
  const metalTexture=surfaceTexture('metal');
  steel.roughnessMap=steel.bumpMap=metalTexture;steel.bumpScale=.00015;
  const models = {};
  const descriptions = {
    pvc:['ПВХ-оболочка','Твёрдые наружные стенки профиля. Они формируют его поверхность и защищают внутренние камеры и усиление.'],
    steel:['Сталь и дистанционные рамки','В раме металл служит усилением, а в стеклопакете дистанционная рамка задаёт расстояние между стёклами.'],
    seal:['Контур уплотнения','Эластичный уплотнитель обеспечивает плотное прилегание створки к раме.'],
    glass:['Стекло','В этой модели три стекла образуют две герметичные камеры. Они помогают сохранять тепло и снижать шум.'],
    wall:['Стенной проём','Окно закрепляется в проёме. Зазор по периметру нужен для монтажного шва.'],
    foam:['Монтажный шов','Теплоизоляционный слой заполняет зазор между рамой и стеной. В реальном узле его защищают изнутри и снаружи.'],
    chambers:['Воздушные камеры','Зелёным выделены полости внутри профиля, а не пластик. Воздух в этих каналах помогает уменьшить передачу тепла.'],
    reinforcement:['Стальное усиление','Вставка внутри профиля повышает жёсткость рамы. В модели она выдвигается из камеры, чтобы её можно было рассмотреть.'],
    spacer:['Дистанционная рамка','Рамка удерживает стёкла на заданном расстоянии. Внутри обычно находится влагопоглотитель, а по краям — герметик.'],
    sill:['Подоконник','Внутренний подоконник примыкает к нижней части рамы. С наружной стороны установлен отлив для отвода воды.'],
    swing:['Поворотное открывание','Створка вращается на боковых петлях. Ручка устанавливается горизонтально.'],
    tilting:['Проветривание','Верх створки откидывается внутрь. Ножницы ограничивают ход и удерживают створку.'],
    handle:['Поворотно-откидная ручка','Нажмите на ручку: вниз — закрыто, горизонтально — открыто, вверх — проветривание.']
  };
  pvc.userData.part='pvc'; steel.userData.part='steel'; seal.userData.part='seal'; glass.userData.part='glass'; wall.userData.part='wall'; foam.userData.part='foam';
  const shadowCanvas=document.createElement('canvas'); shadowCanvas.width=128; shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d'), gradient=ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.15)'); gradient.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gradient; ctx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=-1.34; scene.add(shadow);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.ShadowMaterial({opacity:.2}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.335;floor.receiveShadow=true;scene.add(floor);
  const rectangle = (w,h,r=.004) => {
    r=Math.min(r,w/4,h/4);
    const path=new THREE.Shape();
    path.moveTo(-w/2+r,-h/2);path.lineTo(w/2-r,-h/2);
    path.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);path.lineTo(w/2,h/2-r);
    path.quadraticCurveTo(w/2,h/2,w/2-r,h/2);path.lineTo(-w/2+r,h/2);
    path.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);path.lineTo(-w/2,-h/2+r);
    path.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);path.closePath();return path;
  };
  // Small radiused extrusions catch light without the sharp block-like edges.
  function moulding(parent,w,h,d,x,y,z,material=pvc) {
    const radius=Math.min(.006,w*.18,h*.18,d*.18);
    const geometry=new THREE.ExtrudeGeometry(rectangle(w-2*radius,h-2*radius,radius),{
      depth:d-2*radius,bevelEnabled:true,bevelSize:radius,bevelThickness:radius,bevelSegments:3,curveSegments:4,steps:1
    });
    geometry.translate(0,0,-(d-2*radius)/2);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
    mesh.castShadow=mesh.receiveShadow=!material.transparent;parent.add(mesh);return mesh;
  }
  function ring(parent,w,h,b,d,z,material=pvc) {
    const shape=rectangle(w,h); shape.holes.push(rectangle(w-2*b,h-2*b));
    const bevel=Math.min(.004,b*.2,d*.2);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:4,steps:1});
    geometry.translate(0,0,-d/2);
    const mesh=new THREE.Mesh(geometry,material); mesh.position.z=z;
    mesh.castShadow=mesh.receiveShadow=!material.transparent;parent.add(mesh);return mesh;
  }
  function pane(parent,w,h,z) {
    moulding(parent,w,h,.012,0,0,z,glass);
    // The slight green tint is concentrated along the polished glass edges.
    for(const x of [-w/2,w/2]) box(parent,.0025,h,.012,x,0,z,glassEdge);
    for(const y of [-h/2,h/2]) box(parent,w,.0025,.012,0,y,z,glassEdge);
  }
  function windowModel(parent, hardware=false) {
    const fixed=new THREE.Group(); parent.add(fixed);
    ring(fixed,1.5,2,.105,.19,0); ring(fixed,1.475,1.975,.008,.012,.101,cut); ring(fixed,1.32,1.82,.016,.025,.109,seal);
    const pivot=new THREE.Group(); pivot.position.set(.647,-.87,.12); fixed.add(pivot);
    const sash=new THREE.Group(); sash.position.set(-.647,.87,0); pivot.add(sash);
    ring(sash,1.28,1.74,.09,.105,.025); ring(sash,1.115,1.575,.012,.016,.084,seal);
    for(const z of [.02,.045,.07]) pane(sash,1.085,1.545,z);
    ring(sash,1.11,1.57,.018,.022,.098);
    const mechanism=new THREE.Group(); sash.add(mechanism);
    ring(mechanism,1.255,1.715,.015,.015,.091,steel);
    for(const y of [-.57,0,.57]) {
      const cam=new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,.025,20),steel);
      cam.rotation.x=Math.PI/2; cam.position.set(-.621,y,.112); mechanism.add(cam);
      box(mechanism,.032,.085,.02,.62,y,.114,steel);
    }
    // Recessed fastener heads give the locking rail its actual assembled scale.
    const screwGeometry=new THREE.CylinderGeometry(.008,.008,.003,12);
    const slotGeometry=new THREE.BoxGeometry(.009,.0014,.001);
    for(const x of [-.62,.62]) for(const y of [-.71,-.32,.32,.71]) {
      const head=new THREE.Mesh(screwGeometry,steel);head.rotation.x=Math.PI/2;
      head.position.set(x,y,.103);mechanism.add(head);
      if(!lowPower){const slot=new THREE.Mesh(slotGeometry,seal);slot.position.set(x,y,.105);slot.rotation.z=.45;mechanism.add(slot);}
    }
    // The stay belongs to the fixed frame, with its other end attached to the sash.
    const stay=new THREE.Group(); fixed.add(stay);
    box(stay,.55,.018,.035,.405,.91,.15,steel);
    const arm=box(stay,1,.018,.028,0,0,0,steel);
    const framePin=new THREE.Mesh(new THREE.SphereGeometry(.022,12,8),steel);
    const sashPin=framePin.clone();stay.add(framePin,sashPin);
    const anchor=new THREE.Vector3(.14,.85,.11),end=new THREE.Vector3(),start=new THREE.Vector3();
    const direction=new THREE.Vector3(),axis=new THREE.Vector3(1,0,0);
    function updateStay(tilt,open,detail) {
      stay.visible=hardware && open<.001 && (tilt>.001 || detail>.01);
      if(!stay.visible)return;
      // Convert the moving attachment into the frame's coordinates, including the pivot.
      fixed.updateWorldMatrix(true,true);
      end.copy(anchor);sash.localToWorld(end);fixed.worldToLocal(end);
      // A sliding shoe travels along the top rail; the metal arm keeps its length.
      const length=.52,dy=end.y-.91,dz=end.z-.15;
      start.set(end.x+Math.sqrt(Math.max(0,length*length-dy*dy-dz*dz)),.91,.15);
      direction.subVectors(end,start);
      arm.position.copy(start).add(end).multiplyScalar(.5);
      arm.scale.set(direction.length(),1,1);
      arm.quaternion.setFromUnitVectors(axis,direction.normalize());
      framePin.position.copy(start);sashPin.position.copy(end);
    }
    stay.visible=false;
    const handle=new THREE.Group(); handle.position.set(-.586,0,.151); sash.add(handle);
    box(sash,.042,.12,.022,-.586,0,.125,pvc);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.05,24),steel);
    neck.rotation.x=Math.PI/2; handle.add(neck);
    const lever=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.105,6,16),pvc);
    lever.position.set(0,-.065,.035); handle.add(lever); handle.traverse(obj=>{obj.userData.part="handle";});
    for(const y of [-.66,.66]) {
      const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.14,24),pvc);
      hinge.position.set(.66,y,.13); fixed.add(hinge);
    }
    mechanism.visible=hardware;
    return {fixed,pivot,sash,handle,mechanism,arm,updateStay};
  }
  function root(key) { const group=new THREE.Group(); group.rotation.set(.09,-.42,0); scene.add(group); models[key]=group; return group; }
  const frameRoot=root('frame'); frameRoot.rotation.y=.2;
  // The frame tab displays only its cross-section; no hidden full window is built.
  const section=new THREE.Group(); frameRoot.add(section);
  // Extruded hollow PVC sections: actual open chambers, not painted dark rectangles.
  function hollow(parent,w,h,d,holes,material=pvc) {
    const shape=rectangle(w,h);
    for(const [x,y,cw,ch] of holes) {const hole=rectangle(cw,ch,.009);const points=hole.getPoints(4);const offset=new THREE.Path(points.map(point=>point.add(new THREE.Vector2(x,y))));shape.holes.push(offset);}
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:4,steps:1}); geo.translate(0,0,-d/2);
    const mesh=new THREE.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=!material.transparent;parent.add(mesh);return mesh;
  }
  const body=new THREE.Group(); section.add(body);
  hollow(body,.91,.45,1.3,[[-.32,0,.17,.33],[-.05,0,.31,.33],[.23,.09,.15,.15],[.23,-.12,.15,.15],[.38,0,.07,.33]]);
  // Highlight the empty air passages separately from the solid PVC walls.
  // The central reinforced chamber is intentionally excluded from this overlay.
  const airChambers=new THREE.Group(); body.add(airChambers); airChambers.visible=false;
  const airMaterial=new THREE.MeshStandardMaterial({color:0x42c78a,emissive:0x187c36,emissiveIntensity:.2,transparent:true,opacity:.22,depthWrite:false,roughness:1});
  airMaterial.userData.part='chambers';
  for(const [x,y,w,h] of [[-.32,0,.165,.325],[.23,.09,.145,.145],[.23,-.12,.145,.145],[.38,0,.065,.325]]) {
    const volume=box(airChambers,w,h,1.29,x,y,0,airMaterial);volume.userData.part='chambers';
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,1.29)),new THREE.LineBasicMaterial({color:0x187c36,transparent:true,opacity:.85}));
    outline.position.set(x,y,0);airChambers.add(outline);
  }
  const reinforcement=new THREE.Group(); body.add(reinforcement);
  hollow(reinforcement,.27,.29,1.32,[[0,0,.22,.24]],steel).position.x=-.05;
  // Extrusion grooves, glazing rebate and paired seal lips remain visible at every angle.
  for(const x of [-.43,-.25,.22,.42]) {
    box(body,.018,.035,1.3,x,-.24,0,pvc);
    box(body,.012,.016,1.3,x,-.265,0,cut);
  }
  // Rounded glazing bead and flexible seal lips, rather than rectangular strips.
  const cap=moulding(section,.93,.035,1.32,0,.245,0,pvc);
  const rubber=moulding(section,.025,.065,1.34,.39,.29,0,seal);
  moulding(rubber,.018,.014,1.34,-.014,.025,0,seal);
  moulding(rubber,.012,.012,1.34,-.018,.012,0,seal);
  const sashSection=new THREE.Group(); section.add(sashSection);
  hollow(sashSection,.53,.34,1.3,[[-.14,0,.13,.24],[.075,0,.23,.24]]);
  sashSection.position.set(.12,.47,0);
  for(const x of [-.12,.24]) {
    moulding(sashSection,.045,.055,1.31,x,.192,0,pvc);
    moulding(sashSection,.025,.018,1.32,x,.225,0,seal);
  }
  box(sashSection,.016,.25,1.3,-.282,-.015,0,pvc);
  hollow(sashSection,.19,.21,1.31,[[0,0,.15,.17]],steel).position.x=.075;
  for(const x of [-.01,.07,.15]) {
    moulding(sashSection,.012,.5,1.28,x,.4,0,glass);
    for(const z of [-.641,.641]) box(sashSection,.012,.5,.0025,x,.4,z,glassEdge);
  }
  // Two spacer rails and their dark butyl seals sit between the three panes.
  for(const x of [.03,.11]) {
    moulding(sashSection,.056,.04,1.27,x,.177,0,steel);
    for(const dx of [-.03,.03]) moulding(sashSection,.006,.046,1.275,x+dx,.177,0,seal);
    for(let i=0;i<18;i++) box(sashSection,.01,.0015,.009,x,.198,-.59+i*.069,seal);
  }
  // Clip-in feet and channels along the outer PVC wall.
  for(const x of [-.43,.42]) {
    moulding(body,.035,.018,1.3,x,-.25,0,pvc);
    moulding(body,.012,.022,1.3,x,-.268,0,pvc);
  }
  section.rotation.set(.24,-.55,0); section.position.set(0,-.36,0);

  const profileRoot=root('profile');
  const installed=windowModel(profileRoot);
  const surround=new THREE.Group(); profileRoot.add(surround);
  const openingWalls=new THREE.Group();surround.add(openingWalls);
  box(openingWalls,.4,2.6,.75,-1.02,0,.025,wall); box(openingWalls,.4,2.6,.75,1.02,0,.025,wall);
  box(openingWalls,1.66,.3,.75,0,1.15,.025,wall); box(openingWalls,1.66,.3,.75,0,-1.15,.025,wall);
  const installationJoint=ring(surround,1.64,2.14,.065,.15,-.15,foam);
  const sill=box(surround,2,.055,.9,0,-1.065,.25,pvc);
  const apron=box(surround,1.65,.025,.32,0,-1.075,-.44,steel); apron.rotation.x=-.12;

  const glassRoot=root('glass'); glassRoot.rotation.y=-.65;
  const layers=[];
  for(let i=0;i<5;i++) {
    const group=new THREE.Group(); glassRoot.add(group); layers.push(group);
    if(i%2===0) pane(group,1.3,1.83,0);
    else {
      ring(group,1.3,1.83,.028,.06,0,steel); ring(group,1.315,1.845,.012,.065,0,seal);
      for(let j=0;j<25;j++) {
        for(const x of [-.623,.623]) box(group,.004,.008,.002,x,-.82+j*.068,.033,seal);
      }
    }
  }
  const layerParts=['outerPane','outerGap','middlePane','innerGap','innerPane'];
  layers.forEach((layer,i)=>{layer.userData.selectionPart=layerParts[i];});
  openingWalls.userData.selectionPart='opening';installed.fixed.userData.selectionPart='windowStructure';
  installationJoint.userData.selectionPart='installationJoint';sill.userData.selectionPart='windowSill';
  Object.assign(descriptions,{
    outerPane:['Наружное стекло','Первое стекло со стороны улицы. Отделяет наружный воздух от первой герметичной камеры стеклопакета.'],
    outerGap:['Первая камера и рамка','Промежуток между наружным и средним стёклами. Дистанционная рамка по периметру задаёт его ширину.'],
    middlePane:['Среднее стекло','Центральное стекло разделяет стеклопакет на две отдельные герметичные камеры.'],
    innerGap:['Вторая камера и рамка','Промежуток между средним и внутренним стёклами. Собственная дистанционная рамка удерживает расстояние между ними.'],
    innerPane:['Внутреннее стекло','Третье стекло, обращённое в комнату. Замыкает вторую камеру со стороны помещения.'],
    opening:['Стена и проём','Стена вокруг окна. В проёме закрепляется оконная рама; по периметру оставляют зазор для монтажного шва.'],
    windowStructure:['Рама и створка','Неподвижная рама закрепляется в проёме. Внутри неё находится створка, которая удерживает стеклопакет и может открываться.'],
    installationJoint:['Монтажный шов','Теплоизоляционный слой между стеной и наружным краем рамы. В реальном монтаже его защищают от влаги и продувания.'],
    windowSill:['Подоконник','Горизонтальная деталь со стороны комнаты под нижней частью рамы. Снаружи окна расположен отдельный отлив.']
  });
  const hardwareRoot=root('hardware'); const hw=windowModel(hardwareRoot,true);
  const proceduralChildren=Object.fromEntries(Object.entries(models).map(([name,model])=>[name,[...model.children]]));
  const glbModels={};
  const ready=Promise.all(Object.keys(models).map(async name=>{
    const {loadGLB}=await import('./load-glb.js');
    const model=await loadGLB(new URL(`../models/${name}.glb`,import.meta.url));
    model.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=!mesh.material.transparent;mesh.receiveShadow=!mesh.material.transparent;}});
    glbModels[name]=model;models[name].add(model);
    proceduralChildren[name].forEach(child=>child.visible=false);
    if(key===name){apply(current);renderView();}
  }).catch(error=>console.warn(`GLB ${name}:`,error.message)));
  // Transparent panes and selection overlays must not cast opaque rectangular shadows.
  Object.values(models).forEach(model=>model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=!mesh.material.transparent;
    mesh.receiveShadow=!mesh.material.transparent;
  }));
  let active, key='frame', detail=0, open=0, tilt=0, mech=0, frame=0, start=0, from={}, target={}, current={detail:0,open:0,tilt:0,mech:0};
  let lost=false, visible=true;
  let viewFrame=0,lastDraw=0;
  let zoom=1, dragging=null, highlighted=null;
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const inspector=document.createElement('div'); inspector.className='inside-inspector'; inspector.setAttribute('role','status'); inspector.hidden=true;
  const canvas=renderer.domElement;
  canvas.tabIndex=0; canvas.removeAttribute('aria-hidden'); canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Объёмная модель окна. Вращайте стрелками или горизонтальным движением пальца. Выберите деталь нажатием.');
  let selectedObject=null, selectedPoint=null;
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
  arrow.classList.add('inside-selection-arrow'); arrow.setAttribute('aria-hidden','true');
  arrow.innerHTML='<defs><marker id="inside-arrow-tip" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L7 4.5L1 8" fill="none" stroke="#187c36" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><path class="inside-arrow-halo"/><path class="inside-arrow-line" marker-end="url(#inside-arrow-tip)"/><circle r="4"/>';
  const arrowLabel=document.createElement('div');arrowLabel.className='inside-arrow-label';arrowLabel.setAttribute('aria-hidden','true');
  mount.append(arrow,arrowLabel);
  const bounds=new THREE.Box3(), anchor=new THREE.Vector3();
  function updateArrow(){
    arrow.style.display=arrowLabel.style.display=selectedObject?'':'none';
    if(!selectedObject)return;
    let node=selectedObject;while(node){if(!node.visible){arrow.style.display=arrowLabel.style.display='none';return;}node=node.parent;}
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    if(selectedPoint)anchor.copy(selectedPoint).applyMatrix4(selectedObject.matrixWorld);
    else bounds.setFromObject(selectedObject).getCenter(anchor);
    anchor.project(camera);
    const w=mount.clientWidth,h=mount.clientHeight,x=(anchor.x+1)*w/2,y=(1-anchor.y)*h/2;
    if(anchor.z>1 || x<8 || x>w-8 || y<8 || y>h-8){arrow.style.display=arrowLabel.style.display='none';return;}
    arrow.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const compact=w<500,padding=compact?8:22;
    const left=x>w*.5, labelWidth=Math.min(190,w*(compact?.48:.45)), labelX=left?padding:w-labelWidth-padding;
    arrowLabel.style.width=labelWidth+'px';arrowLabel.style.left=labelX+'px';
    const labelHeight=arrowLabel.offsetHeight;
    const labelY=Math.max(compact?8:65,Math.min(h-labelHeight-12,y-labelHeight-22));
    arrowLabel.style.top=labelY+'px';
    const sx=left?labelX+labelWidth:labelX,sy=labelY+arrowLabel.offsetHeight/2;
    const elbow=left?Math.min(sx+30,x-12):Math.max(sx-30,x+12);
    const d=`M ${sx} ${sy} L ${elbow} ${sy} L ${x} ${y}`;
    arrow.querySelectorAll('path[class]').forEach(path=>path.setAttribute('d',d));
    const dot=arrow.querySelector('circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);
  }
  function renderScene(){
    renderer.render(scene,camera);updateArrow();
    // Reveal only after the first real frame, never the temporary SVG or blank canvas.
    const readyScene=active?.querySelector('.inside-scene');
    readyScene?.classList.remove('is-unavailable');
    readyScene?.classList.add('has-3d');
  }
  function cancelRendering(){
    cancelAnimationFrame(frame);cancelAnimationFrame(viewFrame);frame=0;viewFrame=0;
  }
  // Allow every 60 Hz display frame; tolerate timestamp jitter to avoid dropping to 30 Hz.
  function renderView(){
    if(lost || !visible || document.hidden || viewFrame || frame)return;
    viewFrame=requestAnimationFrame(function paint(now){
      viewFrame=0;
      if(lost || !visible || document.hidden)return;
      if(lowPower && now-lastDraw<1000/60-1){viewFrame=requestAnimationFrame(paint);return;}
      lastDraw=now;renderScene();
    });
  }
  function inspect(object, partOverride, hitPoint){
    // A scene element has its own identity, even when several elements share a material.
    if(!partOverride && object){let node=object;while(node){if(node.userData.selectionPart){object=node;partOverride=node.userData.selectionPart;break;}node=node.parent;}}
    if(highlighted){highlighted.forEach(item=>{item.mesh.material=item.original;item.material.dispose();});highlighted=null;}
    const part=partOverride || object?.userData.part || object?.material?.userData.part;
    airChambers.visible=part==='chambers';
    selectedObject=part?object:null;selectedPoint=hitPoint && object?object.worldToLocal(hitPoint.clone()):null;
    if(!hitPoint && object===body.children[0] && part==='pvc')selectedPoint=new THREE.Vector3(-.435,.19,.655);
    if(!hitPoint && object===airChambers)selectedPoint=new THREE.Vector3(-.32,0,.655);
    if(!hitPoint && object===openingWalls)selectedPoint=new THREE.Vector3(-1.02,.35,.4);
    if(!hitPoint && object===installed.fixed)selectedPoint=new THREE.Vector3(-.7,.35,.1);
    if(!hitPoint && object===installationJoint)selectedPoint=new THREE.Vector3(-.79,.35,-.075);
    if(!hitPoint && ['outerGap','innerGap'].includes(partOverride))selectedPoint=new THREE.Vector3(-.635,.25,.033);
    active?.querySelectorAll('[data-inspect]').forEach(button=>button.setAttribute('aria-pressed',String(Boolean(part) && button.dataset.inspectPart===part)));
    if(!part){inspector.hidden=true;renderView();return;}
    const [title,description]=descriptions[part] || descriptions.pvc; inspector.hidden=false;arrowLabel.textContent=title;
    inspector.textContent=''; const heading=document.createElement('strong');heading.textContent=title;const copy=document.createElement('p');copy.textContent=description;inspector.append(heading,copy);
    highlighted=[];
    object?.traverse(mesh=>{if(!mesh.isMesh || !mesh.material.emissive)return;if(part==='windowStructure' && !['pvc','seal'].includes(mesh.material.userData.part))return;const material=mesh.material.clone();material.onBeforeCompile=mesh.material.onBeforeCompile;material.customProgramCacheKey=mesh.material.customProgramCacheKey;material.emissive.setHex(0x208a45);material.emissiveIntensity=.24;highlighted.push({mesh,original:mesh.material,material});mesh.material=material;});
    renderView();
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!event.isPrimary || (event.pointerType==='mouse' && event.button!==0)){dragging=null;return;}
    dragging={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:0,touch:event.pointerType==='touch',locked:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging || dragging.id!==event.pointerId)return;
    if(dragging.touch && !dragging.locked){
      const horizontal=Math.abs(event.clientX-dragging.startX),vertical=Math.abs(event.clientY-dragging.startY);
      if(Math.max(horizontal,vertical)<7)return;
      if(vertical>horizontal){dragging=null;canvas.releasePointerCapture(event.pointerId);return;}
      dragging.locked=true;
    }
    const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y;
    dragging.moved+=Math.abs(dx)+Math.abs(dy);dragging.x=event.clientX;dragging.y=event.clientY;
    models[key].rotation.y+=dx*.008;models[key].rotation.x=THREE.MathUtils.clamp(models[key].rotation.x+(dragging.touch?0:dy*.006),-.65,.65);renderView();
  });
  canvas.addEventListener('pointerup',event=>{
    if(dragging?.id===event.pointerId && dragging.moved<6){
      const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObject(models[key],true).find(hit=>{let node=hit.object;while(node){if(!node.visible)return false;node=node.parent;}return true;});
      inspect(hit?.object,undefined,hit?.point);
      if(key==='hardware' && hit?.object.userData.part==='handle'){
        const modes=['closed','open','tilt'];active.querySelector(`[data-mode="${modes[(modes.indexOf(active.dataset.mode)+1)%3]}"]`).click();
      }
    }dragging=null;
  });
  canvas.addEventListener('pointercancel',()=>{dragging=null;});
  canvas.addEventListener('lostpointercapture',()=>{dragging=null;});
  canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();models[key].rotation.y+=event.key==='ArrowLeft'?-.12:event.key==='ArrowRight'?.12:0;models[key].rotation.x=THREE.MathUtils.clamp(models[key].rotation.x+(event.key==='ArrowUp'?-.1:event.key==='ArrowDown'?.1:0),-.65,.65);renderView();});
  host.querySelectorAll('.inside-panel').forEach(panel=>{
    const choices={frame:[[body.children[0],'pvc'],[airChambers,'chambers'],[reinforcement,'reinforcement'],[rubber,'seal']],profile:[[openingWalls,'opening'],[installed.fixed,'windowStructure'],[installationJoint,'installationJoint'],[sill,'windowSill']],glass:layers.map((layer,i)=>[layer,layerParts[i]]),hardware:[]};
    panel.querySelectorAll('[data-inspect]').forEach((button,i)=>{button.dataset.inspectPart=choices[panel.dataset.part][i][1];button.addEventListener('click',()=>{
      const was=button.getAttribute('aria-pressed')==='true';
      panel.querySelectorAll('[data-inspect]').forEach(item=>item.setAttribute('aria-pressed',String(!was && item===button)));
      if(was){inspect(null);return;}
      if(panel.dataset.part!=='hardware' && !panel.classList.contains('is-detail'))panel.querySelector('[data-detail]').click();
      if(panel.dataset.part==='hardware')panel.querySelector(`[data-mode="${['closed','open','tilt'][i]}"]`).click();
      const [object,part]=choices[panel.dataset.part][i];inspect(object,part);
    });});
    const toolbar=document.createElement('div');toolbar.className='inside-view-tools';
    toolbar.innerHTML='<span>Вращайте модель</span><button type="button" data-view="in" aria-label="Приблизить модель">+</button><button type="button" data-view="out" aria-label="Отдалить модель">−</button><button type="button" data-view="reset" aria-label="Вернуть исходный ракурс">↺</button>';
    panel.querySelector('.inside-scene').append(toolbar);
    toolbar.addEventListener('click',event=>{const action=event.target.dataset.view;if(!action)return;if(action==='reset'){models[key].rotation.set(.09,key==='glass'?-.65:key==='frame'?.2:-.42,0);zoom=1;inspect(null);}else zoom=THREE.MathUtils.clamp(zoom+(action==='in'?.15:-.15),.7,1.5);camera.zoom=zoom;camera.updateProjectionMatrix();renderView();});
    if(panel.dataset.part!=='hardware'){
      const label=document.createElement('label');label.className='inside-scrubber';label.innerHTML='Разборка <input type="range" min="0" max="100" value="0" aria-label="Степень разборки модели"><output>0%</output>';
      panel.querySelector('.inside-controls').append(label);
      label.querySelector('input').addEventListener('input',event=>{
        const value=Number(event.target.value)/100;label.querySelector('output').value=Math.round(value*100)+'%';
        cancelRendering();current.detail=value;target.detail=value;apply(current);renderView();
        panel.classList.toggle('is-detail',value>.5);const button=panel.querySelector('[data-detail]');button.setAttribute('aria-pressed',value>.5);button.textContent=value>.5?button.dataset.on:button.dataset.off;
      });
    }
  });
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function apply(values) {
    const d=values.detail;
    if(key==='frame') {
    section.visible=true; section.scale.setScalar(1.28); section.position.x=0;
    // Outer cover and the steel core slide out to expose the hollow structure.
    cap.position.y=.245+d*.25; rubber.position.x=.39+d*.23;
    reinforcement.position.z=d*.5;
    sashSection.position.y=.47+d*.13;
    } else if(key==='profile') {
    surround.visible=d>.01; surround.scale.setScalar(1);
    surround.position.z=-.5*(1-d); installed.fixed.position.z=-d*.15;
    sill.position.z=.25;
    } else if(key==='glass') {
    layers.forEach((layer,i)=>{layer.position.z=(i-2)*(.042+d*.32); layer.position.x=(i-2)*d*.07;});
    } else if(key==='hardware') {
    // Right-side hinge: positive yaw brings the free left edge toward the viewer.
    hw.pivot.rotation.y=values.open*1.12;
    hw.pivot.rotation.x=values.tilt*.24;
    hw.handle.rotation.z=values.open*Math.PI/2+values.tilt*Math.PI;
    hw.mechanism.visible=values.mech>.01;
    hw.mechanism.traverse(obj=>{ if(obj.isMesh) {obj.scale.z=1+values.mech*.6;} });
    hw.updateStay(values.tilt,values.open,values.mech);
    }
    const glb=glbModels[key];
    if(glb) {
      const assembled=values.detail<.01&&values.open<.01&&values.tilt<.01;
      glb.visible=assembled;
      proceduralChildren[key].forEach(child=>child.visible=!assembled);
    }
  }
  function draw(now) {
    frame=0; if(lost || !visible || document.hidden) return;
    const t=motion.matches?1:Math.min(1,(now-start)/1050);
    if(lowPower && t<1 && now-lastDraw<1000/60-1){frame=requestAnimationFrame(draw);return;}
    lastDraw=now;
    cancelAnimationFrame(viewFrame);viewFrame=0;
    const ease=1-Math.pow(1-t,4);
    for(const property of Object.keys(target)) current[property]=from[property]+(target[property]-from[property])*ease;
    // Close the previous opening axis before engaging the other hinge mode.
    if((from.open>0 && target.tilt>0)||(from.tilt>0 && target.open>0)) {
      const closing=1-Math.pow(1-Math.min(1,t*2),4);
      const opening=1-Math.pow(1-Math.max(0,t*2-1),4);
      current.open=from.open*(1-closing)+target.open*opening;
      current.tilt=from.tilt*(1-closing)+target.tilt*opening;
    }
    apply(current); renderScene();
    if(t<1) frame=requestAnimationFrame(draw);
  }
  function animate() {
    cancelRendering();
    if(lost || !visible || document.hidden)return;
    from={...current};
    if(Object.keys(target).every(property=>Math.abs(target[property]-current[property])<.0001)) {
      apply(current);renderView();return;
    }
    start=performance.now(); frame=requestAnimationFrame(draw);
  }
  let lastRenderSize="";
  function resize() {
    const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);
    renderer.transmissionResolutionScale=lowPower?.35:.75;
    if(active&&inspector.parentNode!==active)active.append(inspector);
    const ratio=Math.min(devicePixelRatio||1,lowPower?1.25:2,Math.sqrt((lowPower?350000:2200000)/(w*h)));
    const renderSize=`${w}:${h}:${ratio}`;
    if(renderSize!==lastRenderSize){
      renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);lastRenderSize=renderSize;
    }
    camera.aspect=w/h;
    const distance=Math.max(5.6,1.85/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.min(camera.aspect,1)));
    camera.position.set(0,.15,distance); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
    animate();
  }
  const statuses={
    frame:['Разрез рамы. Раздвиньте детали, чтобы рассмотреть конструкцию.','Рама в разрезе: полые камеры, стальное усиление и контур уплотнения.'],
    profile:['Рама и подвижная створка в сборе.','Окно в проёме: монтажный шов по периметру, подоконник внутри и отлив снаружи.'],
    glass:['Двухкамерный стеклопакет в сборе: три стекла и две камеры.','Слои разделены: стекло, дистанционная рамка, стекло, дистанционная рамка, стекло.']
  };
  const panelStates = new WeakMap();
  function preservePanel() {
    if (!active) return;
    panelStates.set(active, { values: {...current}, zoom });
    if (lost) return;
    // A still frame keeps the previous block complete while the one WebGL
    // context moves to the next study. No extra 3D scenes or idle render loops.
    const studio = active.querySelector('.inside-scene');
    let preview = studio.querySelector('.inside-scene-preview');
    if (!preview) {
      preview = document.createElement('canvas');
      preview.className = 'inside-scene-preview';
      preview.setAttribute('aria-hidden', 'true');
      studio.append(preview);
    }
    renderer.render(scene, camera);
    preview.width = canvas.width; preview.height = canvas.height;
    preview.getContext('2d').drawImage(canvas, 0, 0);
    studio.classList.add('has-preview');
  }
  function update(panel = active || host.querySelector('.inside-panel')) {
    if(!panel)return;
    if(active!==panel) { cancelRendering(); preservePanel(); }
    const changed=active!==panel; active=panel; key=panel.dataset.part;
    if(changed) {
      inspect(null); zoom=panelStates.get(panel)?.zoom || 1;camera.zoom=zoom;camera.updateProjectionMatrix();
      host.querySelectorAll('.inside-scene').forEach(el=>el.classList.remove('has-3d'));
      panel.querySelector('.inside-scene').append(mount);
      panel.append(inspector);
      host.querySelectorAll('[data-inspect]').forEach(button=>button.setAttribute('aria-pressed','false'));
      Object.entries(models).forEach(([name,model])=>{model.visible=name===key;});
      current=panelStates.get(panel)?.values || {detail:0,open:0,tilt:0,mech:0};
      const rect = panel.querySelector('.inside-scene').getBoundingClientRect();
      visible = rect.bottom > 0 && rect.top < innerHeight;
    }
    detail=changed && panelStates.has(panel) ? current.detail : Number(panel.classList.contains('is-detail'));
    open=Number(panel.dataset.mode==='open'); tilt=Number(panel.dataset.mode==='tilt'); mech=key==='hardware'?detail:0;
    target={detail,open,tilt,mech};
    const scrubber=panel.querySelector('.inside-scrubber');if(scrubber){scrubber.querySelector('input').value=detail*100;scrubber.querySelector('output').value=(detail*100)+'%';}
    const status=panel.querySelector('.inside-status');
    status.textContent=key==='hardware'?`${open?'Створка открыта на боковых петлях.':tilt?'Верх створки откинут внутрь для проветривания.':'Створка закрыта, ручка направлена вниз.'}${mech?' Подсвечены запорная обвязка и точки прижима.':''}`:statuses[key][detail];
    panel.querySelector('.inside-legend').classList.toggle('is-expanded',Boolean(detail));
    if(changed)resize();else animate();
  }
  new ResizeObserver(resize).observe(mount);
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting); if(visible)animate();else cancelRendering();}); observer.observe(mount);
  const visibleStudies = new Map();
  const studiesObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => visibleStudies.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
    const best = [...visibleStudies].sort((a,b) => b[1] - a[1])[0];
    if (best?.[1] > 0) {
      const panel = best[0].closest('.inside-panel');
      if (panel !== active) update(panel);
    }
  }, { threshold: [0, .15, .35, .6, 1] });
  host.querySelectorAll('.inside-scene').forEach(studio => studiesObserver.observe(studio));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelRendering();else animate();});
  motion.addEventListener('change',animate);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelRendering();active?.querySelector('.inside-scene').classList.remove('has-3d');active?.querySelector('.inside-scene').classList.add('is-unavailable');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;update();});
  new MutationObserver(()=>{updateBackdrop();renderView();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  function scroll(panel, progress) {
    if (!panel || lost) return;
    if (active !== panel) update(panel);
    cancelRendering();
    const value=THREE.MathUtils.clamp(progress,0,1);
    const detailValue=THREE.MathUtils.smoothstep(value,.08,.78);
    current=key==='hardware'?{
      detail:0,
      open:THREE.MathUtils.smoothstep(value,.18,.42)*(1-THREE.MathUtils.smoothstep(value,.62,.78)),
      tilt:THREE.MathUtils.smoothstep(value,.62,.88),mech:0
    }:{detail:detailValue,open:0,tilt:0,mech:0};
    target={...current};
    panel.classList.toggle('is-detail',current.detail>.5);
    if(key!=='hardware') {
      const button=panel.querySelector('[data-detail]');
      button.setAttribute('aria-pressed',String(current.detail>.5));
      button.textContent=current.detail>.5?button.dataset.on:button.dataset.off;
      const input=panel.querySelector('.inside-scrubber input');
      const output=panel.querySelector('.inside-scrubber output');
      input.value=Math.round(current.detail*100);output.value=Math.round(current.detail*100)+'%';
    } else {
      panel.dataset.mode=current.tilt>.5?'tilt':current.open>.1?'open':'closed';
      panel.querySelectorAll('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===panel.dataset.mode)));
    }
    const baseRotation=key==='glass'?-.65:key==='frame'?.2:-.42;
    models[key].rotation.y=baseRotation+value*.85;
    models[key].rotation.x=.09+Math.sin(value*Math.PI)*.12;
    apply(current);renderView();
  }
  return {update,scroll,ready};
}
