const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/scene-runtime.js'),'utf8')
  .replace(/^import .*;$/gm,'').replace(/^export \{ THREE \};$/gm,'').replace(/export function /g,'function ');
function setup({width=640,height=480,density=2,reduced=false,playbackOptions={}}={}) {
  const events={}, canvasEvents={}, callbacks=new Map(), media={matches:reduced,addEventListener:(_,fn)=>{events.motion=fn;}};
  let intersection,resize,id=0,renders=0,ratio,size,observerOptions;
  const times=[];
  const document={hidden:false,timeline:{currentTime:0},addEventListener:(name,fn)=>{events[name]=fn;}};
  const container={clientWidth:width,clientHeight:height,classList:{add(){},remove(){}}};
  const renderer={capabilities:{maxTextureSize:8192},domElement:{addEventListener:(name,fn)=>{canvasEvents[name]=fn;}},setPixelRatio:r=>{ratio=r;},setSize:(w,h)=>{size=[w,h];},render:()=>{renders++;}};
  const camera={updateProjectionMatrix(){}};
  const context={document,devicePixelRatio:density,matchMedia:()=>media,requestAnimationFrame:fn=>{callbacks.set(++id,fn);return id;},cancelAnimationFrame:n=>callbacks.delete(n),
    ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},IntersectionObserver:class{constructor(fn,options){intersection=fn;observerOptions=options;}observe(){}disconnect(){}},window:{IntersectionObserver:true}};
  vm.createContext(context); vm.runInContext(source,context);
  context.playback(container,renderer,camera,{},time=>times.push(time),()=>{},playbackOptions);
  return {document,media,events,canvasEvents,renderer,container,times,observerOptions:()=>observerOptions,visible:(visible,ratio=1)=>intersection([{isIntersecting:visible,intersectionRatio:ratio}]),frame:now=>{const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(now));},pending:()=>callbacks.size,renders:()=>renders,ratio:()=>ratio,size:()=>size,resize:()=>resize()};
}
test('WebGL render loops pause outside the viewport, in hidden tabs and with reduced motion',()=>{
  const s=setup(); assert.equal(s.pending(),0);
  s.visible(true); assert.equal(s.pending(),1); s.frame(1000); assert.equal(s.pending(),1);
  s.visible(false); assert.equal(s.pending(),0); const count=s.renders(); s.frame(2000); assert.equal(s.renders(),count);
  s.visible(true); s.document.hidden=true; s.events.visibilitychange(); assert.equal(s.pending(),0);
  s.document.hidden=false; s.events.visibilitychange(); assert.equal(s.pending(),1);
  s.media.matches=true; s.events.motion(); assert.equal(s.pending(),0);
  s.media.matches=false; s.events.motion(); assert.equal(s.pending(),1);
});
test('3D rendering avoids supersampling and limits Retina framebuffers',()=>{
  assert.equal(setup({density:1}).ratio(),1);
  const retina=setup({density:3}); assert.equal(retina.ratio(),1.25); assert.deepEqual(retina.size(),[640,480]);
  const large=setup({width:2400,height:1500,density:3}); assert.ok(2400*1500*large.ratio()**2<=800000.01);
});
test('3D rendering skips intermediate frames to cap GPU work at 30 fps',()=>{
  const s=setup(); s.visible(true); s.frame(1000); const count=s.renders();
  s.frame(1016); assert.equal(s.renders(),count);
  s.frame(1034); assert.equal(s.renders(),count+1);
});
test('WebGL context loss stops rendering and recovery resumes the visible scene',()=>{
  const s=setup(); s.visible(true); let prevented=false;
  s.canvasEvents.webglcontextlost({preventDefault(){prevented=true;}}); assert.ok(prevented); assert.equal(s.pending(),0);
  s.canvasEvents.webglcontextrestored(); assert.equal(s.pending(),1);
});
test('one-shot 3D playback starts at the visibility threshold and holds its final frame',()=>{
  const s=setup({playbackOptions:{threshold:.3,duration:2.1}});
  assert.equal(s.observerOptions().threshold,.3);
  s.visible(true,.29); assert.equal(s.pending(),0);
  s.visible(true,.3); assert.equal(s.pending(),1);
  for (let now=1000;now<=3300;now+=100) s.frame(now);
  assert.equal(s.times.at(-1),2.1);
  assert.equal(s.pending(),0);
  s.visible(true,1); assert.equal(s.pending(),0);
  s.resize(); assert.equal(s.times.at(-1),2.1);
});
test('one-shot 3D playback shows its final frame for reduced motion and hidden tabs',()=>{
  const reduced=setup({reduced:true,playbackOptions:{threshold:.3,duration:2.1}});
  assert.equal(reduced.times.at(-1),2.1);
  assert.equal(reduced.pending(),0);
  const s=setup({playbackOptions:{threshold:.3,duration:2.1}});
  s.visible(true,.3); s.frame(1000);
  s.document.hidden=true; s.events.visibilitychange();
  assert.equal(s.times.at(-1),2.1);
  assert.equal(s.pending(),0);
});

test('synchronized WebGL follows the shared clock and does not run offscreen',()=>{
  let play;
  const s=setup({playbackOptions:{threshold:.3,duration:2.1,synchronization:{subscribe(fn){play=fn;}}}});
  s.visible(true);
  assert.equal(s.pending(),0);
  s.document.timeline.currentTime=1500;
  play({startTime:1000});
  s.frame(1500);
  assert.equal(s.times.at(-1),.5);
  s.visible(false);
  assert.equal(s.pending(),0);
  s.document.timeline.currentTime=2000;
  play({startTime:1800});
  assert.equal(s.pending(),0);
  s.document.timeline.currentTime=2200;
  s.visible(true);
  s.frame(2200);
  assert.equal(s.times.at(-1),.4);
  s.frame(4000);
  assert.equal(s.times.at(-1),2.1);
  assert.equal(s.pending(),0);
});
