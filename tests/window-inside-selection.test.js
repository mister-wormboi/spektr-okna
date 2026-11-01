const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/window-inside-3d.js', 'utf8');
function setup(parts) {
  const buttons=parts.map(part=>({dataset:{inspectPart:part},setAttribute(name,value){this[name]=value;}}));
  const material={userData:{part:'glass'},emissive:{setHex(){}},clone(){return {...this,emissive:{setHex(){}},dispose(){this.disposed=true;}};}};
  const objects=parts.map(part=>({userData:{selectionPart:part},isMesh:true,material,traverse(fn){fn(this);}}));
  const state={THREE:{Vector3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}}},descriptions:{pvc:['ПВХ','Оболочка']},highlighted:null,selectedObject:null,selectedPoint:null,airChambers:{},body:{children:[{}]},openingWalls:{},installed:{fixed:{}},installationJoint:{},active:{querySelectorAll(){return buttons;}},inspector:{append(...children){this.children=children;}},arrowLabel:{},document:{createElement(){return {}; }},renderView(){}};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('  Object.assign(descriptions,'),source.indexOf("  const hardwareRoot=root('hardware');")),state);
  vm.runInContext(source.slice(source.indexOf('  function inspect('),source.indexOf("  canvas.addEventListener('pointerdown'")),state);
  return {state,objects,buttons,material};
}
test('each glass layer selects exactly one button, uses its own copy, and restores the previous material',()=>{
  const parts=JSON.parse(source.match(/const layerParts=(\[[^;]+\]);/)[1].replaceAll("'",'"'));
  const {state,objects,buttons,material}=setup(parts);
  const titles=new Set();
  objects.forEach((object,i)=>{
    state.inspect(object,parts[i]);
    assert.deepEqual(buttons.map(b=>b['aria-pressed']),parts.map((_,j)=>String(i===j)));
    assert.equal(state.selectedObject,object);
    titles.add(state.arrowLabel.textContent);
    objects.forEach((other,j)=>{if(i!==j)assert.equal(other.material,material);});
  });
  assert.equal(titles.size,5);
  state.inspect(null);
  assert.ok(buttons.every(b=>b['aria-pressed']==='false'));
  assert.ok(objects.every(o=>o.material===material));
});
test('clicking a child of a glass layer resolves to that layer rather than the shared glass material',()=>{
  const {state,objects,buttons}=setup(['outerPane','middlePane','innerPane']);
  const child={userData:{},material:{userData:{part:'glass'}},parent:objects[1]};
  state.inspect(child);
  assert.equal(state.selectedObject,objects[1]);
  assert.deepEqual(buttons.map(b=>b['aria-pressed']),['false','true','false']);
  assert.equal(state.arrowLabel.textContent,'Среднее стекло');
});
test('installation elements have independent descriptions and selection identities',()=>{
  const parts=['opening','windowStructure','installationJoint','windowSill'];
  const {state,objects,buttons}=setup(parts);
  const titles=new Set(),copy=new Set();
  objects.forEach((object,i)=>{
    state.inspect(object,parts[i]);
    assert.equal(buttons.filter(b=>b['aria-pressed']==='true').length,1);
    titles.add(state.arrowLabel.textContent);copy.add(state.inspector.children[1].textContent);
  });
  assert.equal(titles.size,4);assert.equal(copy.size,4);
});
