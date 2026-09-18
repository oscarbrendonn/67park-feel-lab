import {register} from 'node:module';
import assert from 'node:assert/strict';
register(new URL('./three-test-loader.mjs',import.meta.url));
const T=await import('three');
const {sealTerrainSeams,TERRAIN_SEAM_PATCHES}=await import('../app/terrain-seam-repair.js');
const root=new T.Group(),original=new Map();
for(const [name,vertices,indexCount]of [['3_CIMEN',212134,116469],['5_YOL',63501,97737],['5_PARSEL_ZEMIN',64188,82272]]){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(vertices*3),3));g.setAttribute('normal',new T.BufferAttribute(new Float32Array(vertices*3),3));g.setIndex(Array(indexCount).fill(0));
 if(name==='3_CIMEN')g.addGroup(0,118578,0);
 const mesh=new T.Mesh(g,new T.MeshStandardMaterial());mesh.name=name;root.add(mesh);
}
for(const name of ['7_KALDIRIM_TABANI_STUB67','7_KALDIRIM_TABANI_STUB_JOIN67_0','7_KALDIRIM_TABANI_STUB_JOIN67_1','7_KALDIRIM_TABANI_ENTRY67_0','7_KALDIRIM_TABANI_ENTRY67_1','7_KALDIRIM_TABANI_ENTRY67_2']){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,9.38,0,0,9.38,1,1,9.38,1,1,9.38,0],3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
 const mesh=new T.Mesh(g);mesh.name=name;root.add(mesh);
}
const bowl=new T.Mesh(new T.BoxGeometry(1,1,1));bowl.name='67D_REF_MINI_SKATE_BOWL';root.add(bowl);
for(const mesh of root.children)original.set(mesh.name,{g:mesh.geometry,material:mesh.material,p:mesh.geometry.attributes.position.array.slice(),ix:Array.from(mesh.geometry.index.array)});
const result=sealTerrainSeams(root);
assert.equal(result.patches,24);assert.equal(result.curbSideTriangles,48);assert.equal(result.addedDrawCalls,0);assert.equal(sealTerrainSeams(root),result);
assert.equal(bowl.geometry,original.get(bowl.name).g);
for(const mesh of root.children){
 const old=original.get(mesh.name),g=mesh.geometry;
 assert.equal(mesh.material,old.material);
 assert.deepEqual(g.attributes.position.array.slice(0,old.p.length),old.p);
 assert.deepEqual(Array.from(g.index.array.slice(0,old.ix.length)),old.ix);
 assert(g.attributes.position.array.every(Number.isFinite));
 assert(g.attributes.normal.array.every(Number.isFinite));
 assert.equal(g.attributes.position.count,g.attributes.normal.count);
 if(g.groups.length===1)assert.equal(g.groups[0].count,g.index.count);
}
let samples=0;
for(const patch of TERRAIN_SEAM_PATCHES){
 const pts=patch.outline.slice(0,-1).map(p=>new T.Vector2(...p));
 for(const f of T.ShapeUtils.triangulateShape(pts,[])){
  const [a,b,c]=f.map(i=>pts[i]);
  if(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))<2e-8)continue;
  // Float32 world-space fixture positions can move by micrometres at x=100.
  // Probe a 20-micrometre neighbourhood instead of treating export rounding
  // on these sub-millimetre seams as a visible hole.
  let covered=false;
  for(const dx of [0,-.00002,.00002])for(const dz of [0,-.00002,.00002]){
   const ray=new T.Raycaster(new T.Vector3((a.x+b.x+c.x)/3+dx,20,(a.y+b.y+c.y)/3+dz),new T.Vector3(0,-1,0));
   if(ray.intersectObject(root.getObjectByName(patch.target)).some(h=>Math.abs(h.point.y-patch.top)<.0001))covered=true;
  }
  assert(covered,patch.id);samples++;
 }
}
console.log('PASS terrain seams: 24 patches, preserved source vertices/materials, 6 closed curb fixtures, idempotent, '+samples+' ray probes');
