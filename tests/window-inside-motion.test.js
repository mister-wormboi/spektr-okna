const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('assets/js/window-inside-3d.js','utf8');
test('opening moves the free edge toward the viewer while the right hinge stays fixed',()=>{
  const hw={updateStay(){},pivot:{rotation:{}},handle:{rotation:{}},mechanism:{traverse(){}},arm:{rotation:{},position:{}}};
  const state={key:'hardware',hw};vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('  function apply('),source.indexOf('  function draw(')),state);
  state.apply({open:1,tilt:0,mech:0,detail:0});
  const freeEdgeZ=-Math.sin(hw.pivot.rotation.y)*(-1.28);
  assert.ok(freeEdgeZ>1,'free edge must move toward the camera (+z)');
  assert.equal(hw.pivot.rotation.x,0);
  state.apply({open:0,tilt:1,mech:0,detail:0});
  assert.equal(hw.pivot.rotation.y,0);
  assert.ok(Math.sin(hw.pivot.rotation.x)*1.74>0,'top edge must tilt toward camera');
});
test('opening and tilting never overlap during a mode transition',()=>{
  for(const [from,target] of [[{open:1,tilt:0},{open:0,tilt:1}],[{open:0,tilt:1},{open:1,tilt:0}]]){
    const state={frame:0,viewFrame:0,lastDraw:0,lowPower:false,cancelAnimationFrame(){},renderScene(){},lost:false,visible:true,document:{hidden:false},motion:{matches:false},start:0,from,target,current:{},apply(){},renderer:{render(){}},scene:{},camera:{},updateArrow(){},requestAnimationFrame(){return 1;}};
    vm.createContext(state);vm.runInContext(source.slice(source.indexOf('  function draw('),source.indexOf('  function animate(')),state);
    for(let t=0;t<=1050;t+=25){state.draw(t);assert.ok(state.current.open===0||state.current.tilt===0);}
    assert.equal(state.current.open,target.open);assert.equal(state.current.tilt,target.tilt);
  }
});
test('idle and hidden scenes do not schedule animation frames',()=>{
  const state={frame:0,lost:false,visible:true,document:{hidden:false},from:{},current:{open:0},target:{open:0},cancelRendering(){},apply(){},renderView(){},performance:{now(){return 0;}},requestAnimationFrame(){throw Error('unexpected animation');}};
  vm.createContext(state);vm.runInContext(source.slice(source.indexOf('  function animate('),source.indexOf('  let lastRenderSize')),state);
  state.animate();state.visible=false;state.target.open=1;state.animate();
});
test('stay endpoints remain attached through the full tilt travel and model rotation',async()=>{
  const THREE=await import('../assets/vendor/three/three.module.min.js');
  const fixed=new THREE.Group(),pivot=new THREE.Group(),sash=new THREE.Group();
  fixed.rotation.set(.2,-.6,.1);fixed.add(pivot);pivot.position.set(.647,-.87,.12);
  pivot.add(sash);sash.position.set(-.647,.87,0);
  const stay=new THREE.Group(),arm=new THREE.Object3D(),framePin=new THREE.Object3D(),sashPin=new THREE.Object3D();
  fixed.add(stay);stay.add(arm,framePin,sashPin);
  const state={hardware:true,fixed,sash,stay,arm,framePin,sashPin,anchor:new THREE.Vector3(.14,.85,.11),end:new THREE.Vector3(),start:new THREE.Vector3(),direction:new THREE.Vector3(),axis:new THREE.Vector3(1,0,0),Math};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('    function updateStay('),source.indexOf('    stay.visible=false;')),state);
  for(let i=0;i<=24;i++){
    pivot.rotation.x=i/100;state.updateStay(i/24,0,1);fixed.updateWorldMatrix(true,true);
    const a=arm.localToWorld(new THREE.Vector3(-.5,0,0)),b=arm.localToWorld(new THREE.Vector3(.5,0,0));
    assert.ok(a.distanceTo(framePin.getWorldPosition(new THREE.Vector3()))<1e-9);
    assert.ok(b.distanceTo(sash.localToWorld(state.anchor.clone()))<1e-9);
    assert.ok(Math.abs(a.distanceTo(b)-.52)<1e-9);
    assert.ok(framePin.position.x>=.13&&framePin.position.x<=.68);
  }
});
