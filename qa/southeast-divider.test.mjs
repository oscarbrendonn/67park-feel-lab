import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {shortenSoutheastDivider49} from '../app/southeast-divider-49.js';

// Use the actual published divider asset, not a simplified substitute. This
// transform is the live island transform after its 2.15 m lowering.
function fixture(){
 const meta=JSON.parse(fs.readFileSync(new URL('../island/small-island-match-v55.json',import.meta.url)));
 const bytes=fs.readFileSync(new URL('../island/small-island-match-v55.bin',import.meta.url));
 const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),geometry=new T.BufferGeometry();
 for(const [key,a]of Object.entries(meta.attributes))geometry.setAttribute(key,new T.BufferAttribute(new Float32Array(buffer.slice(a.offset,a.offset+a.length*4)),a.size));
 geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer.slice(meta.indices.offset,meta.indices.offset+meta.indices.length*4)),1));
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#d9cbb9'})),root=new T.Group();mesh.name=meta.mesh;
 mesh.scale.setScalar(179.45658377779017);mesh.position.set(8.131652123901347,6.822829322595082,-2.195301124841597);root.add(mesh);root.updateMatrixWorld(true);
 return {root,mesh};
}

test('both map loaders shorten the coastal house divider after replacement and before mask baking',()=>{
 for(const file of ['runtime.js','runtime.bundle.js']){
  const source=fs.readFileSync(new URL('../island/'+file,import.meta.url),'utf8');
  assert(/import\s*\{shortenSoutheastDivider49\}\s*from[^;]+southeast-divider-49\.js/.test(source),'Missing divider import in '+file);
  const call='dataset.southeastDivider49=JSON.stringify(shortenSoutheastDivider49(';
  assert.equal(source.split(call).length,2,'Exactly one actual invocation in '+file);
  assert(source.indexOf(call)>source.indexOf('dataset.smallIslandMatch55='),'Do not let the replacement asset undo the shortening');
  assert(source.indexOf(call)<source.indexOf('dataset.parkTerrain57='),'Shorten before terrain and divider shadow masks are baked');
 }
});

test('actual coastal divider stops in the lawn without changing other strips or materials',()=>{
 const {root,mesh}=fixture(),g=mesh.geometry,material=mesh.material,p=g.attributes.position;
 const old=p.array.slice(),index=g.index.array.slice(),channels=Object.fromEntries(Object.entries(g.attributes).filter(([k])=>k!=='position').map(([k,a])=>[k,a.array.slice()]));
 const before=new T.Vector3(),after=new T.Vector3();let selected=0,others=0,maxZ=-Infinity;
 const result=shortenSoutheastDivider49(root);
 assert.equal(result.selected,1253);assert(Math.abs(result.oldEnd-151.441966)<1e-5);assert.equal(result.newEnd,142.55);
 assert.equal(mesh.geometry,g);assert.equal(mesh.material,material);assert.equal(g.attributes.position,p);assert.deepEqual(g.index.array,index);
 for(let i=0;i<p.count;i++){
  before.fromArray(old,i*3).applyMatrix4(mesh.matrixWorld);after.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  if(before.x>224.2&&before.x<225.4&&before.z>130.2&&before.z<151.7){
   selected++;assert(Math.abs(before.x-after.x)<1e-5);assert(Math.abs(before.y-after.y)<1e-5);
   assert(after.z>=130.40067&&after.z<=142.55001);maxZ=Math.max(maxZ,after.z);
  }else{others++;assert.deepEqual(p.array.subarray(i*3,i*3+3),old.subarray(i*3,i*3+3));}
 }
 assert.equal(selected,1253);assert.equal(others,p.count-1253);assert(Math.abs(maxZ-142.55)<1e-5);
 for(const [key,values]of Object.entries(channels))assert.deepEqual(g.attributes[key].array,values);
 const shortened=p.array.slice();assert.equal(shortenSoutheastDivider49(root),result);assert.deepEqual(p.array,shortened);
});

test('changed or missing divider cannot partially deform another map',()=>{
 assert.equal(shortenSoutheastDivider49(new T.Group()).skipped,'divider missing');
 const {root,mesh}=fixture();mesh.position.z+=.5;const old=mesh.geometry.attributes.position.array.slice();
 assert(shortenSoutheastDivider49(root).skipped);assert.deepEqual(mesh.geometry.attributes.position.array,old);
});
