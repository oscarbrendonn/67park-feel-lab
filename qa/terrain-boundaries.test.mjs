import {register} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
register(new URL('./three-test-loader.mjs',import.meta.url));
const T=await import('three');
const {applyTerrainBoundaries}=await import('../app/terrain-boundaries.js');
const {createTerrainSampler}=await import('../island/terrain-sampler-v27.js');
const patch=JSON.parse(fs.readFileSync(new URL('../repairs/terrain-boundaries-2.json',import.meta.url)));
assert.equal(patch.version,2);assert.equal(patch.meshes.length,10);assert.equal(patch.transforms.length,3);
for(const r of patch.meshes){assert.equal(r.p.length,r.n.length);assert(r.p.every(Number.isFinite));assert(r.n.every(Number.isFinite));assert(r.ix.every(i=>i>=0&&i<r.p.length/3));}
assert(patch.metrics.centralFilledArea>80&&patch.metrics.centralFilledArea<100);
assert.equal(patch.metrics.pathPondOverlap,0);assert(patch.metrics.pathBowlAddedOverlap<1e-6);
assert(patch.metrics.pathGrassOverlap<1e-5);
if(process.env.TERRAIN_FIXTURE){
 const fixture=JSON.parse(fs.readFileSync(process.env.TERRAIN_FIXTURE)),root=new T.Group(),original=new Map();
 for(const row of fixture.meshes){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(row.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(row.n,3));if(row.ix)g.setIndex(row.ix);
  const m=new T.Mesh(g,new T.MeshStandardMaterial());m.name=row.name;m.matrixAutoUpdate=false;m.matrix.fromArray(row.matrix);root.add(m);original.set(m.name,{g,material:m.material,p:g.attributes.position.array.slice(),ix:g.index?.array.slice()});
 }
 root.updateMatrixWorld(true);
 const corrupt=structuredClone(patch);corrupt.transforms.at(-1).expected.positionCRC='00000000';
 assert.throws(()=>applyTerrainBoundaries(root,corrupt),/source changed/);
 for(const m of root.children)assert.equal(m.geometry,original.get(m.name).g,'Partial mutation after invalid source');
 assert.equal(root.userData.terrainBoundaries2,undefined);
 const before=createTerrainSampler(root.children);
 const result=applyTerrainBoundaries(root,patch);
 assert.equal(result.addedDrawCalls,0);assert.equal(result.perFrameWork,0);assert.equal(applyTerrainBoundaries(root,patch),result);
 const targetNames=new Set([...patch.meshes,...patch.transforms].map(r=>r.name));
 for(const m of root.children){
  assert.equal(m.material,original.get(m.name).material);
  assert(m.geometry.attributes.position.array.every(Number.isFinite));assert(m.geometry.attributes.normal.array.every(Number.isFinite));
  if(!targetNames.has(m.name))assert.equal(m.geometry,original.get(m.name).g,m.name+' changed outside scope');
  if(m.name.startsWith('CENTER_WHITE71_')){
   const bounds=new T.Box3().setFromObject(m,true),v=new T.Vector3(),old=original.get(m.name).g.attributes.position;let oldTop=-Infinity;
   for(let i=0;i<old.count;i++)oldTop=Math.max(oldTop,v.fromBufferAttribute(old,i).applyMatrix4(m.matrixWorld).y);
   assert(bounds.min.y<9.22);assert(Math.abs(bounds.max.y-oldTop)<.00001,m.name+' changed the walking surface');
  }
 }
 const after=createTerrainSampler(root.children);let probes=0;
 for(const row of patch.meshes){
  for(let i=0;i<row.ix.length;i+=3){
   const ids=row.ix.slice(i,i+3),v=ids.map(id=>row.p.slice(id*3,id*3+3));
   if(!ids.every(id=>row.n[id*3+1]>.99))continue;
   const area=Math.abs((v[1][0]-v[0][0])*(v[2][2]-v[0][2])-(v[2][0]-v[0][0])*(v[1][2]-v[0][2]));if(area<1e-6)continue;
   const x=v.reduce((s,p)=>s+p[0],0)/3,z=v.reduce((s,p)=>s+p[2],0)/3,y=v.reduce((s,p)=>s+p[1],0)/3;
   // Float32 anchors at x=100 can shift sub-20-micrometre slivers. Probe that
   // export tolerance without excusing any visible millimetre/centimetre gap.
   let covered=false;
   for(const dx of [0,-.00002,.00002])for(const dz of [0,-.00002,.00002]){const hit=after.sample(x+dx,z+dz);if(hit&&hit.point.y>=y-.00015)covered=true;}
   assert(covered,'Gap at '+row.name+' '+x+','+z);probes++;
  }
 }
 const center=patch.transforms[0].center;let oldSand=0,newSand=0;
 for(let angle=0;angle<360;angle+=2)for(const radius of [5.83,5.85,5.9,5.92,5.96,6.02,6.1,6.18]){
  const x=center[0]+Math.cos(angle*Math.PI/180)*radius,z=center[1]+Math.sin(angle*Math.PI/180)*radius;
  if((before.sample(x,z)?.point.y??0)<9.2)oldSand++;
  if((after.sample(x,z)?.point.y??0)<9.2)newSand++;
 }
 assert(oldSand>100);assert.equal(newSand,0);
 for(const row of patch.metrics.extraSeams){const hit=after.sample(...row.at);assert(hit&&hit.point.y>=row.top-.00015,'Survey gap remains '+JSON.stringify(row));}
 const plinth=new T.Box3().setFromObject(root.getObjectByName('67D_CENTER_FOUNTAIN_PLINTH'));assert(plinth.min.y<9.22755);
 console.log('PASS live-geometry boundaries',JSON.stringify({probes,oldSand,newSand,triangleDelta:result.triangleDelta,centralArea:result.centralFilledArea}));
}else console.log('PASS boundary patch schema/protected areas; set TERRAIN_FIXTURE for live-geometry ray tests');
