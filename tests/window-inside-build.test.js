const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
test('gallery construction allocates only the requested model, while the story keeps all four',async()=>{
 const {THREE,box}=await import(pathToFileURL(path.resolve('assets/js/scene-runtime.js')));
 const source=fs.readFileSync('assets/js/window-inside-3d.js','utf8');
 const start=source.indexOf('\n',source.indexOf('export function createInsideExhibit(host)'));
 const body=source.slice(start,source.indexOf('  const initialVisibility='));
 for(const part of [undefined,'frame','profile','glass','hardware']){
  const state={THREE,box,host:{dataset:{galleryModel:part},closest(){return null;}},matchMedia:()=>({matches:false}),navigator:{},createRenderer:()=>({shadowMap:{}}),environment:()=>null,surfaceTexture:()=>new THREE.Texture(),getComputedStyle:()=>({getPropertyValue:()=>''}),document:{createElement:()=>({className:'',getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})}};
  vm.createContext(state);
  const result=vm.runInContext('(function(){'+body+'\nreturn {models,lowPower,shadows:renderer.shadowMap.enabled,transmission:glass.transmission};})()',state);
  const {models}=result;
  assert.equal(Boolean(result.lowPower),Boolean(part));
  assert.equal(result.shadows,!part);
  assert.equal(result.transmission,part?0:.96);
  assert.deepEqual(Object.keys(models),part?[part]:['frame','profile','glass','hardware']);
  for(const model of Object.values(models))assert.ok(model.children.length>0);
 }
});
