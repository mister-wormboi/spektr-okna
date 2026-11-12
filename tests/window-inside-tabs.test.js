const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('assets/js/window-inside-gallery.js','utf8').replace(/import\('\.\/window-inside-3d\.js\?[^']+'\)/,'loadModule()');
const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
function setup() {
 const created=[], listeners=[], tabs=[];
 const classList=()=>({add(){},remove(){},toggle(){},contains:()=>true});
 const panel=()=>({classList:classList(),cloneNode:panel,replaceWith(){},querySelector:()=>({classList:classList()})});
 const cards=Array.from({length:4},(_,i)=>({hidden:i!==0,dataset:{},classList:classList(),querySelector:panel,setAttribute(){},removeAttribute(){},addEventListener(){}}));
 for(let i=0;i<4;i++)tabs.push({setAttribute(){},focus(){},addEventListener(name,fn){(listeners[i] ||= {})[name]=fn;}});
 const observer=[];
 vm.runInNewContext(code,{
  document:{querySelectorAll:s=>s.includes('data-gallery-model')?cards:tabs,querySelector:()=>({offsetTop:0,offsetHeight:500}),documentElement:{scrollHeight:1000,style:{setProperty(){}}},body:{classList:classList()}},
  window:{IntersectionObserver:true,requestIdleCallback:true},
  IntersectionObserver:class {constructor(fn){observer.push(fn);}observe(){}},
  requestIdleCallback:fn=>fn(),requestAnimationFrame:()=>1,addEventListener(){},innerHeight:800,scrollY:0,console,
  loadModule:async()=>({createInsideExhibit(card){let resolve;const exhibit={card,ready:new Promise(r=>resolve=r),destroyed:0,destroy(){this.destroyed++;},update(){},resolve};created.push(exhibit);return exhibit;}}),
 });
 return {cards,tabs,created,select:i=>listeners[i].click(),enter:()=>observer[0]([{target:cards[0],isIntersecting:true}])};
}
test('rapid tab switches destroy stale models and keep only the selected model',async()=>{
 const s=setup();s.enter();await flush();
 assert.equal(s.created.length,1);
 s.select(1);s.select(2);s.created[0].resolve();await flush();
 assert.equal(s.created[0].destroyed,1);
 assert.equal(s.created.length,2);
 assert.equal(s.created[1].card,s.cards[2]);
 s.created[1].resolve();await flush();
 s.select(3);await flush();
 assert.equal(s.created[1].destroyed,1);
 assert.equal(s.created.length,3);
 assert.deepEqual(s.cards.map(c=>c.hidden),[true,true,true,false]);
 s.created[2].resolve();await flush();
 assert.equal(s.created[2].destroyed,0);
});
