const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/js/window-inside-3d.js','utf8');
test('rounded profile keeps its air passages open and has finite, bounded geometry',async()=>{
  const THREE=await import('../assets/vendor/three/three.module.min.js');
  const state={THREE,pvc:new THREE.MeshStandardMaterial({side:THREE.DoubleSide})};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('  const rectangle ='),source.indexOf('  function windowModel(')),state);
  vm.runInContext(source.slice(source.indexOf('  function hollow('),source.indexOf('  const body=')),state);
  const group=new THREE.Group();
  const holes=[[-.32,0,.17,.33],[-.05,0,.31,.33],[.23,.09,.15,.15],[.23,-.12,.15,.15],[.38,0,.07,.33]];
  const mesh=state.hollow(group,.91,.45,1.3,holes);
  mesh.updateMatrixWorld(true);
  assert.ok(mesh.geometry.attributes.position.count<15000,'keep the cross-section suitable for mobile');
  assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  const ray=new THREE.Raycaster();
  for(const [x,y] of holes){
    ray.set(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1));
    assert.equal(ray.intersectObject(mesh).length,0,'air chamber must remain a through-hole');
  }
  ray.set(new THREE.Vector3(-.435,0,2),new THREE.Vector3(0,0,-1));
  assert.ok(ray.intersectObject(mesh).length>0,'outer PVC wall remains solid');
});
