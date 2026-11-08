import { THREE } from './scene-runtime.js?v=20261105-realism';

export async function loadGLB(url) {
  const response=await fetch(url);
  if(!response.ok)throw new Error(`GLB ${response.status}`);
  const buffer=await response.arrayBuffer();
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67)throw new Error('Invalid GLB');
  const jsonLength=view.getUint32(12,true);
  const data=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength)));
  const binaryStart=20+jsonLength+8;
  function accessor(index) {
    const source=data.accessors[index],chunk=data.bufferViews[source.bufferView];
    const start=binaryStart+(chunk.byteOffset||0)+(source.byteOffset||0);
    const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
    const count=source.count*sizes[source.type];
    if(source.componentType===5126)return new Float32Array(buffer,start,count);
    if(source.componentType===5125)return new Uint32Array(buffer,start,count);
    if(source.componentType===5123)return new Uint16Array(buffer,start,count);
    throw new Error('Unsupported GLB accessor');
  }
  const materials=(data.materials||[]).map(item=>{
    const color=item.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1];
    return new THREE.MeshStandardMaterial({
      name:item.name,color:new THREE.Color(color[0],color[1],color[2]),
      metalness:item.pbrMetallicRoughness?.metallicFactor||0,
      roughness:item.pbrMetallicRoughness?.roughnessFactor??1,
      transparent:item.alphaMode==='BLEND',opacity:color[3],side:item.doubleSided?THREE.DoubleSide:THREE.FrontSide,
      depthWrite:item.alphaMode!=='BLEND'
    });
  });
  const group=new THREE.Group();
  (data.nodes||[]).forEach((node,index)=>{
    if(node.mesh===undefined)return;
    const source=data.meshes[node.mesh];
    source.primitives.forEach(primitive=>{
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(accessor(primitive.attributes.POSITION),3));
      if(primitive.attributes.NORMAL!==undefined)geometry.setAttribute('normal',new THREE.BufferAttribute(accessor(primitive.attributes.NORMAL),3));
      else geometry.computeVertexNormals();
      if(primitive.indices!==undefined)geometry.setIndex(new THREE.BufferAttribute(accessor(primitive.indices),1));
      geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,materials[primitive.material]);
      mesh.name=node.name||source.name||`Деталь ${index+1}`;
      mesh.castShadow=mesh.receiveShadow=!mesh.material.transparent;
      group.add(mesh);
    });
  });
  return group;
}
