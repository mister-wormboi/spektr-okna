import { THREE, createRenderer, environment, box } from './scene-runtime.js';

// One shared, lazy WebGL context. Frames are requested only during an interaction.
export function createInsideExhibit(host) {
  const mount = document.createElement('div');
  mount.className = 'inside-webgl';
  const renderer = createRenderer(mount, true);
  renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene();
  scene.environment = environment(renderer, true);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x344f40, 1.3));
  const light = new THREE.DirectionalLight(0xfff8ec, 2.5);
  light.position.set(-3, 5, 6); scene.add(light);
  const rim = new THREE.DirectionalLight(0xdaeeff, 1.8);
  rim.position.set(4, 2, -2); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  const mat = (color, roughness = .3, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const pvc = mat(0xf1f3ed), cut = mat(0xd5dfd5), seal = mat(0x25362e, .8);
  const steel = mat(0x9aaeb0, .25, .85), green = mat(0x27b45b, .4), wall = mat(0xb7beb0, .95);
  const foam = mat(0xc1b58b, 1);
  const glass = new THREE.MeshPhysicalMaterial({color:0xa5d8d1, metalness:.12, roughness:.035, transparent:true, opacity:.32, side:THREE.DoubleSide, depthWrite:false});
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
  gradient.addColorStop(0,'rgba(0,0,0,.32)'); gradient.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gradient; ctx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=-1.34; scene.add(shadow);
  const rectangle = (w,h) => {
    const path = new THREE.Shape(); path.moveTo(-w/2,-h/2); path.lineTo(w/2,-h/2); path.lineTo(w/2,h/2); path.lineTo(-w/2,h/2); path.closePath(); return path;
  };
  function ring(parent,w,h,b,d,z,material=pvc) {
    const shape=rectangle(w,h); shape.holes.push(rectangle(w-2*b,h-2*b));
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:3,steps:1});
    geometry.translate(0,0,-d/2);
    const mesh=new THREE.Mesh(geometry,material); mesh.position.z=z; parent.add(mesh); return mesh;
  }
  function pane(parent,w,h,z) {
    box(parent,w,h,.012,0,0,z,glass);
    // Thin strips give the glass a clear edge and a studio reflection.
    box(parent,.005,h,.015,-w/2,0,z,cut);
    const shape=new THREE.Shape(); shape.moveTo(-w*.43,-h*.32); shape.lineTo(w*.42,h*.24); shape.lineTo(w*.42,h*.35); shape.lineTo(-w*.43,-h*.21); shape.closePath();
    const reflection=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));
    reflection.position.z=z+.009; parent.add(reflection);
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
      box(mechanism,.032,.085,.02,.62,y,.114,green);
    }
    const arm=box(mechanism,.53,.018,.028,.35,.867,.13,steel);
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
    return {fixed,pivot,sash,handle,mechanism,arm};
  }
  function root(key) { const group=new THREE.Group(); group.rotation.set(.09,-.42,0); scene.add(group); models[key]=group; return group; }
  const frameRoot=root('frame'); frameRoot.rotation.y=.2;
  const full=windowModel(frameRoot).fixed;
  const section=new THREE.Group(); frameRoot.add(section);
  // Extruded hollow PVC sections: actual open chambers, not painted dark rectangles.
  function hollow(parent,w,h,d,holes,material=pvc) {
    const shape=rectangle(w,h);
    for(const [x,y,cw,ch] of holes) {const hole=new THREE.Path(); hole.moveTo(x-cw/2,y-ch/2); hole.lineTo(x+cw/2,y-ch/2); hole.lineTo(x+cw/2,y+ch/2); hole.lineTo(x-cw/2,y+ch/2); hole.closePath(); shape.holes.push(hole);}
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,steps:1}); geo.translate(0,0,-d/2);
    const mesh=new THREE.Mesh(geo,material); parent.add(mesh); return mesh;
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
  for(const z of [-.66,.66]) {
    const end=new THREE.LineSegments(new THREE.EdgesGeometry(body.children[0].geometry,25),new THREE.LineBasicMaterial({color:0x70877b,transparent:true,opacity:.38}));
    if(z<0)body.add(end);
  }
  const cap=box(section,.93,.035,1.32,0,.245,0,pvc);
  const rubber=box(section,.025,.065,1.34,.39,.29,0,seal);
  const sashSection=new THREE.Group(); section.add(sashSection);
  hollow(sashSection,.53,.34,1.3,[[-.14,0,.13,.24],[.075,0,.23,.24]]);
  sashSection.position.set(.12,.47,0);
  for(const x of [-.12,.24]) {
    box(sashSection,.045,.055,1.31,x,.192,0,pvc);
    box(sashSection,.025,.018,1.32,x,.225,0,seal);
  }
  box(sashSection,.016,.25,1.3,-.282,-.015,0,pvc);
  hollow(sashSection,.19,.21,1.31,[[0,0,.15,.17]],steel).position.x=.075;
  for(const x of [-.01,.07,.15]) box(sashSection,.012,.5,1.28,x,.4,0,glass);
  section.rotation.set(.24,-.55,0); section.position.set(0,-.36,0);

  const profileRoot=root('profile');
  const installed=windowModel(profileRoot);
  const surround=new THREE.Group(); profileRoot.add(surround);
  const openingWalls=new THREE.Group();surround.add(openingWalls);
  box(openingWalls,.4,2.6,.48,-1.02,0,-.11,wall); box(openingWalls,.4,2.6,.48,1.02,0,-.11,wall);
  box(openingWalls,1.66,.3,.48,0,1.15,-.11,wall); box(openingWalls,1.66,.3,.48,0,-1.15,-.11,wall);
  const installationJoint=ring(surround,1.64,2.14,.065,.15,-.015,foam);
  const sill=box(surround,2,.055,.65,0,-1.065,.12,pvc);
  const apron=box(surround,1.65,.025,.26,0,-1.075,-.43,steel); apron.rotation.x=-.12;

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
  let active, key='frame', detail=0, open=0, tilt=0, mech=0, frame=0, start=0, from={}, target={}, current={detail:0,open:0,tilt:0,mech:0};
  let lost=false, visible=true;
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
  function renderView(){ if(!lost && visible && !document.hidden){renderer.render(scene,camera);updateArrow();} }
  function inspect(object, partOverride, hitPoint){
    // A scene element has its own identity, even when several elements share a material.
    if(!partOverride && object){let node=object;while(node){if(node.userData.selectionPart){object=node;partOverride=node.userData.selectionPart;break;}node=node.parent;}}
    if(highlighted){highlighted.forEach(item=>{item.mesh.material=item.original;item.material.dispose();});highlighted=null;}
    const part=partOverride || object?.userData.part || object?.material?.userData.part;
    airChambers.visible=part==='chambers';
    selectedObject=part?object:null;selectedPoint=hitPoint && object?object.worldToLocal(hitPoint.clone()):null;
    if(!hitPoint && object===body.children[0] && part==='pvc')selectedPoint=new THREE.Vector3(-.435,.19,.655);
    if(!hitPoint && object===airChambers)selectedPoint=new THREE.Vector3(-.32,0,.655);
    if(!hitPoint && object===openingWalls)selectedPoint=new THREE.Vector3(-1.02,.35,.14);
    if(!hitPoint && object===installed.fixed)selectedPoint=new THREE.Vector3(-.7,.35,.1);
    if(!hitPoint && object===installationJoint)selectedPoint=new THREE.Vector3(-.79,.35,.075);
    if(!hitPoint && ['outerGap','innerGap'].includes(partOverride))selectedPoint=new THREE.Vector3(-.635,.25,.033);
    active?.querySelectorAll('[data-inspect]').forEach(button=>button.setAttribute('aria-pressed',String(Boolean(part) && button.dataset.inspectPart===part)));
    if(!part){inspector.hidden=true;renderView();return;}
    const [title,description]=descriptions[part] || descriptions.pvc; inspector.hidden=false;arrowLabel.textContent=title;
    inspector.textContent=''; const heading=document.createElement('strong');heading.textContent=title;const copy=document.createElement('p');copy.textContent=description;inspector.append(heading,copy);
    highlighted=[];
    object?.traverse(mesh=>{if(!mesh.isMesh || !mesh.material.emissive)return;if(part==='windowStructure' && !['pvc','seal'].includes(mesh.material.userData.part))return;const material=mesh.material.clone();material.emissive.setHex(0x208a45);material.emissiveIntensity=.24;highlighted.push({mesh,original:mesh.material,material});mesh.material=material;});
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
        cancelAnimationFrame(frame);current.detail=value;target.detail=value;apply(current);renderView();
        panel.classList.toggle('is-detail',value>.5);const button=panel.querySelector('[data-detail]');button.setAttribute('aria-pressed',value>.5);button.textContent=value>.5?button.dataset.on:button.dataset.off;
      });
    }
  });
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function apply(values) {
    const d=values.detail;
    full.visible=false;
    section.visible=true; section.scale.setScalar(1.28); section.position.x=0;
    // Outer cover and the steel core slide out to expose the hollow structure.
    cap.position.y=.245+d*.25; rubber.position.x=.39+d*.23;
    reinforcement.position.z=d*.5;
    sashSection.position.y=.47+d*.13;
    surround.visible=d>.01; surround.scale.setScalar(.94+d*.06);
    surround.position.z=-.5*(1-d); installed.fixed.position.z=d*.13;
    sill.position.z=.12+d*.08;
    layers.forEach((layer,i)=>{layer.position.z=(i-2)*(.042+d*.32); layer.position.x=(i-2)*d*.07;});
    hw.pivot.rotation.y=-values.open*1.12;
    hw.pivot.rotation.x=values.tilt*.24;
    hw.handle.rotation.z=values.open*Math.PI/2+values.tilt*Math.PI;
    hw.mechanism.visible=values.mech>.01;
    hw.mechanism.traverse(obj=>{ if(obj.isMesh) {obj.scale.z=1+values.mech*.6;} });
    hw.arm.rotation.y=-values.tilt*.7;
    hw.arm.position.z=.13+values.tilt*.1;
  }
  function draw(now) {
    frame=0; if(lost || !visible || document.hidden) return;
    const t=motion.matches?1:Math.min(1,(now-start)/1050);
    const ease=1-Math.pow(1-t,4);
    for(const property of Object.keys(target)) current[property]=from[property]+(target[property]-from[property])*ease;
    apply(current); renderer.render(scene,camera); updateArrow();
    if(t<1) frame=requestAnimationFrame(draw);
  }
  function animate() {
    cancelAnimationFrame(frame); from={...current}; start=performance.now(); frame=requestAnimationFrame(draw);
  }
  function resize() {
    const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);
    const mobile=matchMedia('(max-width: 700px)').matches;
    if(active){const destination=mobile?active:active.querySelector('.inside-copy');if(inspector.parentNode!==destination)destination.append(inspector);}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2,Math.sqrt((mobile?650000:2200000)/(w*h)))); renderer.setSize(w,h,false);
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
  function update() {
    const panel=host.querySelector('.inside-panel:not([hidden])'); if(!panel)return;
    const changed=active!==panel; active=panel; key=panel.dataset.part;
    if(changed) {
      inspect(null); zoom=1;camera.zoom=1;camera.updateProjectionMatrix();
      host.querySelectorAll('.inside-scene').forEach(el=>el.classList.remove('has-3d'));
      panel.querySelector('.inside-scene').append(mount);
      panel.querySelector('.inside-copy').append(inspector);
      host.querySelectorAll('[data-inspect]').forEach(button=>button.setAttribute('aria-pressed','false'));
      Object.entries(models).forEach(([name,model])=>{model.visible=name===key;});
      current={detail:0,open:0,tilt:0,mech:0};
    }
    detail=Number(panel.classList.contains('is-detail'));
    open=Number(panel.dataset.mode==='open'); tilt=Number(panel.dataset.mode==='tilt'); mech=key==='hardware'?detail:0;
    target={detail,open,tilt,mech};
    const scrubber=panel.querySelector('.inside-scrubber');if(scrubber){scrubber.querySelector('input').value=detail*100;scrubber.querySelector('output').value=(detail*100)+'%';}
    const status=panel.querySelector('.inside-status');
    status.textContent=key==='hardware'?`${open?'Створка открыта на боковых петлях.':tilt?'Верх створки откинут внутрь для проветривания.':'Створка закрыта, ручка направлена вниз.'}${mech?' Подсвечены запорная обвязка и точки прижима.':''}`:statuses[key][detail];
    panel.querySelector('.inside-legend').classList.toggle('is-expanded',Boolean(detail));
    if(changed)resize();else animate();
    panel.querySelector('.inside-scene').classList.add('has-3d');
  }
  new ResizeObserver(resize).observe(mount);
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting); if(visible)animate();else cancelAnimationFrame(frame);}); observer.observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else animate();});
  motion.addEventListener('change',animate);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);active?.querySelector('.inside-scene').classList.remove('has-3d');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;update();});
  return {update};
}
