const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/js/window-inside-3d.js','utf8');
function setup(){
  let id=0,renders=0;const queue=new Map();
  const state={active:null,frame:0,viewFrame:0,lastDraw:0,lowPower:true,lost:false,disposed:false,visible:true,document:{hidden:false},renderer:{render(){renders++;}},scene:{},camera:{},updateArrow(){},requestAnimationFrame(fn){queue.set(++id,fn);return id;},cancelAnimationFrame(id){queue.delete(id);}};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('  function renderScene('),source.indexOf('  function inspect(')),state);
  return {state,queue,get renders(){return renders;},step(t){const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(t));}};
}
test('a burst of touch events schedules only one render and no idle loop',()=>{
  const run=setup();
  for(let i=0;i<100;i++)run.state.renderView();
  assert.equal(run.queue.size,1);
  run.step(40);assert.equal(run.renders,1);assert.equal(run.queue.size,0);
  run.state.renderView();run.step(48);assert.equal(run.renders,1);
  run.step(72);assert.equal(run.renders,2);assert.equal(run.queue.size,0);
});
test('hidden or offscreen scenes cancel pending work and cannot schedule rendering',()=>{
  const run=setup();run.state.renderView();run.state.visible=false;run.state.cancelRendering();
  run.state.renderView();assert.equal(run.queue.size,0);assert.equal(run.state.viewFrame,0);
  run.state.visible=true;run.state.document.hidden=true;run.state.renderView();assert.equal(run.queue.size,0);
});
test('mobile animation throttles high refresh screens but always reaches its final state',()=>{
  const run=setup();Object.assign(run.state,{motion:{matches:false},transitionDuration:1050,scrollDriven:false,start:0,from:{detail:0},target:{detail:1},current:{detail:0},apply(){}});
  vm.runInContext(source.slice(source.indexOf('  function draw('),source.indexOf('  function animate(')),run.state);
  run.state.draw(0);
  for(let t=8;t<1050;t+=8)run.step(t);
  run.step(1050);
  assert.equal(run.state.current.detail,1);assert.equal(run.queue.size,0);
  assert.ok(run.renders>=60 && run.renders<=66,'target about 60 fps rather than 30 or 120');
});

test('rotation renders on every 60 Hz frame without an alternating-frame delay',()=>{
  const run=setup();
  for(let i=1;i<=60;i++){
    for(let event=0;event<4;event++)run.state.renderView();
    run.step(i*1000/60);
    assert.equal(run.renders,i);
    assert.equal(run.queue.size,0);
  }
});

test('story prewarms each chapter before readiness and restores model visibility',async()=>{
  const models=Object.fromEntries(['hardware','glass','profile','frame'].map(name=>[name,{visible:name==='hardware',traverse(fn){fn(this);}}]));
  let compiles=0,renders=0;
  const state={storyMode:true,models,key:'hardware',disposed:false,lost:false,scene:{},camera:{},host:{querySelector(){return {}; }},update(){},cancelRendering(){},renderer:{async compileAsync(){compiles++;},render(){renders++;}},requestAnimationFrame(fn){fn();}};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('  async function prepareStory('),source.indexOf('  const statuses=')),state);
  await state.prepareStory();
  assert.equal(compiles,4);assert.equal(renders,4);
  assert.equal(models.hardware.visible,true);
  assert.ok(['glass','profile','frame'].every(name=>models[name].visible===false));
});

test('story canvas stays mounted and is not controlled by chapter visibility observers',()=>{
  assert.match(source,/if\(!storyMode\)preservePanel\(\)/);
  assert.match(source,/if\(mount.parentNode!==destination\)destination.append\(mount\)/);
  assert.match(source,/if\(!storyMode && !motion.matches\)mount.animate/);
  assert.match(source,/if\(!storyMode\)host.querySelectorAll\('\.inside-scene'\)/);
});
