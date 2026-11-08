import fs from 'node:fs';
import path from 'node:path';
import * as THREE from '../assets/vendor/three/three.module.min.js';

const output=path.resolve('assets/models');
fs.mkdirSync(output,{recursive:true});
const materials={
  pvc:new THREE.MeshStandardMaterial({name:'Белый ПВХ',color:0xf4f3ef,roughness:.3}),
  steel:new THREE.MeshStandardMaterial({name:'Сталь',color:0xb8bdc0,roughness:.3,metalness:.95}),
  seal:new THREE.MeshStandardMaterial({name:'Уплотнитель',color:0x181b1c,roughness:.85}),
  glass:new THREE.MeshPhysicalMaterial({name:'Стекло',color:0xe8fff7,roughness:.06,metalness:0,transparent:true,opacity:.3,side:THREE.DoubleSide}),
  wall:new THREE.MeshStandardMaterial({name:'Стена',color:0xc7c4bb,roughness:.95}),
  foam:new THREE.MeshStandardMaterial({name:'Монтажный шов',color:0xd3bf84,roughness:1})
};
function box(parent,w,h,d,x,y,z,material='pvc') {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials[material]);
  mesh.position.set(x,y,z);mesh.name=material;parent.add(mesh);return mesh;
}
function rectangle(w,h) {
  const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();return s;
}
function ring(parent,w,h,b,d,x,y,z,material='pvc') {
  const shape=rectangle(w,h);shape.holes.push(rectangle(w-2*b,h-2*b));
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});geometry.translate(0,0,-d/2);
  const mesh=new THREE.Mesh(geometry,materials[material]);mesh.position.set(x,y,z);mesh.name=material;parent.add(mesh);return mesh;
}
function windowModel(hardware=false) {
  const root=new THREE.Group();root.name=hardware?'Фурнитура':'Окно в проёме';
  ring(root,1.5,2,.105,.19,0,0,0);ring(root,1.32,1.82,.016,.025,0,0,.11,'seal');
  const pivot=new THREE.Group();pivot.position.set(.647,-.87,.12);root.add(pivot);
  const sash=new THREE.Group();sash.position.set(-.647,.87,0);pivot.add(sash);
  ring(sash,1.28,1.74,.09,.105,0,0,.025);ring(sash,1.115,1.575,.012,.016,0,0,.084,'seal');
  for(const z of [.02,.045,.07])box(sash,1.085,1.545,.012,0,0,z,'glass');
  if(hardware){
    ring(sash,1.255,1.715,.015,.015,0,0,.091,'steel');
    box(sash,.04,.12,.04,-.586,0,.14,'steel');
    const lever=new THREE.Mesh(new THREE.CapsuleGeometry(.022,.13,5,10),materials.pvc);lever.position.set(-.586,-.08,.19);lever.name='Ручка';sash.add(lever);
    for(const y of [-.66,.66]){const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.14,16),materials.steel);hinge.position.set(.66,y,.13);hinge.name='Петля';root.add(hinge);}
    pivot.rotation.y=.35;
  }
  return root;
}
function makeFrame(){
  const root=new THREE.Group();root.name='Рама в разрезе';
  const body=ring(root,.91,.45,.055,1.3,0,0,0);body.name='ПВХ-оболочка';
  for(const x of [-.32,-.05,.23,.38])box(root,.025,.34,1.31,x,0,0);
  box(root,.24,.26,1.34,-.05,0,0,'steel');
  box(root,.025,.065,1.36,.4,.29,0,'seal');
  box(root,.93,.04,1.34,0,.28,0);
  const sash=new THREE.Group();sash.position.set(.12,.47,0);root.add(sash);ring(sash,.53,.34,.045,1.3,0,0,0);box(sash,.2,.2,1.33,.075,0,0,'steel');
  return root;
}
function makeGlass(){
  const root=new THREE.Group();root.name='Двухкамерный стеклопакет';
  for(let i=0;i<5;i++){
    const z=(i-2)*.36;
    if(i%2===0){const pane=box(root,1.3,1.83,.014,0,0,z,'glass');pane.name=['Наружное стекло','Среднее стекло','Внутреннее стекло'][i/2];}
    else{const spacer=ring(root,1.3,1.83,.035,.06,0,0,z,'steel');spacer.name='Дистанционная рамка';ring(root,1.315,1.845,.012,.065,0,0,z,'seal');}
  }
  return root;
}
function makeProfile(){
  const root=windowModel(false);
  box(root,.4,2.6,.75,-1.02,0,.025,'wall');box(root,.4,2.6,.75,1.02,0,.025,'wall');
  box(root,1.66,.3,.75,0,1.15,.025,'wall');box(root,1.66,.3,.75,0,-1.15,.025,'wall');
  ring(root,1.64,2.14,.065,.15,0,0,-.15,'foam');box(root,2,.055,.9,0,-1.065,.25);
  return root;
}
function materialIndex(material,list){let i=list.indexOf(material);if(i<0){i=list.length;list.push(material);}return i;}
function exportGLB(scene,file){
  scene.updateMatrixWorld(true);const buffers=[],accessors=[],bufferViews=[],meshes=[],nodes=[],materialsOut=[],materialList=[];let offset=0;
  function addData(array,target){
    const pad=(4-offset%4)%4;if(pad){buffers.push(Buffer.alloc(pad));offset+=pad;}
    const buffer=Buffer.from(array.buffer,array.byteOffset,array.byteLength);const view={buffer:0,byteOffset:offset,byteLength:buffer.length};if(target)view.target=target;
    const index=bufferViews.push(view)-1;buffers.push(buffer);offset+=buffer.length;return index;
  }
  const byMaterial=new Map();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    let geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);if(geometry.index)geometry=geometry.toNonIndexed();
    if(!byMaterial.has(object.material))byMaterial.set(object.material,[]);
    byMaterial.get(object.material).push(geometry);
  });
  const flattened=new THREE.Group();flattened.name=scene.name;
  for(const [material,geometries] of byMaterial){
    const merged=new THREE.BufferGeometry();
    for(const name of ['position','normal']){
      const length=geometries.reduce((sum,g)=>sum+g.attributes[name].array.length,0);
      const array=new Float32Array(length);let cursor=0;
      geometries.forEach(g=>{array.set(g.attributes[name].array,cursor);cursor+=g.attributes[name].array.length;});
      merged.setAttribute(name,new THREE.BufferAttribute(array,3));
    }
    geometries.forEach(g=>g.dispose());merged.computeBoundingBox();
    const mesh=new THREE.Mesh(merged,material);mesh.name=material.name;flattened.add(mesh);
  }
  scene=flattened;scene.updateMatrixWorld(true);
  const rootIndex=nodes.push({name:scene.name,children:[]})-1;
  scene.traverse(object=>{
    if(!object.isMesh)return;
    const geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);const pos=geometry.attributes.position;
    const primitive={attributes:{POSITION:accessors.length},mode:4};accessors.push({bufferView:addData(pos.array,34962),componentType:5126,count:pos.count,type:'VEC3',min:[...geometry.boundingBox?.min||[0,0,0]],max:[...geometry.boundingBox?.max||[0,0,0]]});
    geometry.computeBoundingBox();const accessor=accessors[primitive.attributes.POSITION];accessor.min=geometry.boundingBox.min.toArray();accessor.max=geometry.boundingBox.max.toArray();
    if(geometry.attributes.normal){primitive.attributes.NORMAL=accessors.length;const a=geometry.attributes.normal;accessors.push({bufferView:addData(a.array,34962),componentType:5126,count:a.count,type:'VEC3'});}
    if(geometry.index){primitive.indices=accessors.length;const a=geometry.index.array;accessors.push({bufferView:addData(a,34963),componentType:a instanceof Uint32Array?5125:5123,count:a.length,type:'SCALAR'});}
    primitive.material=materialIndex(object.material,materialList);meshes.push({name:object.name,primitives:[primitive]});const node=nodes.push({name:object.name,mesh:meshes.length-1})-1;nodes[rootIndex].children.push(node);geometry.dispose();
  });
  materialList.forEach(m=>{const entry={name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,m.opacity],metallicFactor:m.metalness,roughnessFactor:m.roughness}};if(m.transparent){entry.alphaMode='BLEND';entry.doubleSided=true;}materialsOut.push(entry);});
  const json={asset:{version:'2.0',generator:'Спектр — процедурные модели окна'},scene:0,scenes:[{nodes:[rootIndex]}],nodes,meshes,materials:materialsOut,bufferViews,accessors,buffers:[{byteLength:offset}]};
  const jsonBuffer=Buffer.from(JSON.stringify(json));const jsonPad=(4-jsonBuffer.length%4)%4;const binary=Buffer.concat(buffers);const glb=Buffer.alloc(12);glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(28+jsonBuffer.length+jsonPad+binary.length,8);
  const jsonHeader=Buffer.alloc(8);jsonHeader.writeUInt32LE(jsonBuffer.length+jsonPad,0);jsonHeader.writeUInt32LE(0x4e4f534a,4);const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length,0);binHeader.writeUInt32LE(0x004e4942,4);
  fs.writeFileSync(path.join(output,file),Buffer.concat([glb,jsonHeader,jsonBuffer,Buffer.alloc(jsonPad,0x20),binHeader,binary]));
}
const models={hardware:windowModel(true),glass:makeGlass(),profile:makeProfile(),frame:makeFrame()};
for(const [name,model] of Object.entries(models)){exportGLB(model,`${name}.glb`);}
const all=new THREE.Group();all.name='Окна изнутри';
Object.entries(models).forEach(([name,model],i)=>{model.position.x=(i-1.5)*3;all.add(model);});exportGLB(all,'window-inside.glb');
for(const file of fs.readdirSync(output))console.log(`${file}: ${(fs.statSync(path.join(output,file)).size/1024).toFixed(0)} КБ`);
