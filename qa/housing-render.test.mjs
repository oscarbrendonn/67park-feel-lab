import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,PerspectiveCamera,Box3,Vector3,Matrix4} from 'three';
import {createHousingInterior} from '../app/housing-interior.js';
import {HOUSES} from '../app/housing-layout.js';
import {HOME_SPOTS} from '../app/housing-actions.js';
function fixture(){
 const world={scene:new Scene(),camera:new PerspectiveCamera(),ground:()=>9};
 const room=createHousingInterior(world,{markers:false}),parts=new Map(),matrix=new Matrix4();
 world.scene.traverse(mesh=>mesh.userData.homeParts?.forEach((name,i)=>{
  if(!name)return;mesh.getMatrixAt(i,matrix);
  parts.set(name,{mesh,box:new Box3(new Vector3(-.5,-.5,-.5),new Vector3(.5,.5,.5)).applyMatrix4(matrix)});
 }));
 return {world,room,parts};
}
test('entry mat, threshold, frame and counter have distinct uncluttered footprints',()=>{
 const {room,parts}=fixture(),b=name=>parts.get(name).box;
 assert(b('door-threshold').min.z-b('entry-mat').max.z>=.349);
 assert(b('kitchen-counter').min.x-b('entry-mat').max.x>=.779);
 assert(b('door-leaf').min.x-b('door-jamb-left').max.x>=.029);
 assert(b('door-jamb-right').min.x-b('door-leaf').max.x>=.029);
 assert(b('door-lintel').min.y-b('door-leaf').max.y>=.019);
 assert(b('door-leaf').min.y>b('door-threshold').max.y);
 assert(b('door-handle').max.z<=b('door-leaf').min.z+.00001);
 assert(b('entry-mat').max.y<.05,'A mat must not turn into a raised platform');
 room.dispose();
});
test('both rugs sit completely on one floor finish, not across a material-height seam',()=>{
 const {room,parts}=fixture(),floor=parts.get('floor-finish').box;
 for(const name of ['entry-mat','living-rug','door-threshold']){
  const b=parts.get(name).box;
  assert(b.min.x>=floor.min.x&&b.max.x<=floor.max.x,name+' x support');
  assert(b.min.z>=floor.min.z&&b.max.z<=floor.max.z,name+' z support');
  assert(Math.abs(b.min.y-floor.max.y)<.00001,name+' lies on floor');
 }
 room.dispose();
});
test('both sitting anchors are supported by the cushion-free sofa and both bed places fit',()=>{
 const {world,room,parts}=fixture(),seat=parts.get('sofa-seat').box,cover=parts.get('bed-cover').box;
 const colors=[];world.scene.traverse(o=>{if(o.material?.color)colors.push(o.material.color.getHexString());});
 assert(!colors.includes('e8bec7'),'removed pink cushions cannot return');
 for(const s of HOME_SPOTS.filter(s=>s.pose==='sit')){
  assert(s.x>seat.min.x+.4&&s.x<seat.max.x-.4);assert(s.z>seat.min.z+.35&&s.z<seat.max.z-.05);
  assert(Math.abs(s.surface-seat.max.y)<1e-6);
 }
 const beds=HOME_SPOTS.filter(s=>s.pose==='lie');assert.equal(beds.length,2);
 assert(beds[1].x-beds[0].x>=1.49,'separate head and shoulder space');
 for(const s of beds){assert(s.x-.7>=cover.min.x&&s.x+.7<=cover.max.x);assert(Math.abs(s.surface-cover.max.y)<1e-6);}
 room.dispose();
});
test('cutaway wall also hides its own door and window in every cottage',()=>{
 const {world,room,parts}=fixture();
 for(const h of HOUSES){
  room.show(h);world.camera.position.set(h.room.x,h.room.y+2,h.room.z);room.step();
  assert(parts.get('door-leaf').mesh.visible&&parts.get('window-frame').mesh.visible);
  world.camera.position.z=h.room.z+7;room.step();
  assert(!parts.get('door-leaf').mesh.visible&&!parts.get('door-handle').mesh.visible);
  assert(parts.get('window-frame').mesh.visible&&parts.get('entry-mat').mesh.visible);
  world.camera.position.z=h.room.z-7;room.step();
  assert(parts.get('door-leaf').mesh.visible&&!parts.get('window-frame').mesh.visible);
 }
 room.dispose();
});
test('repeated house entry never changes scene light count or allocates room copies',()=>{
 const world={scene:new Scene(),camera:new PerspectiveCamera(),ground:()=>9,water:()=>false};
 const original=world.ground,room=createHousingInterior(world),children=world.scene.children.length;
 let lights=0;world.scene.traverse(n=>{if(n.isLight)lights++});assert.equal(lights,0);
 for(let i=0;i<1000;i++){const h=HOUSES[i%HOUSES.length];room.show(h);room.step();assert.equal(world.ground(h.room.x,h.room.z),20);room.show(null);assert.equal(world.scene.children.length,children);}
 assert.equal(room.stats().newTextureBytes,0);room.dispose();assert.equal(world.scene.children.length,0);assert.equal(world.ground,original);
});
test('discarding a late prepared room cannot retain or replace the retry ground hooks',()=>{
 const original=()=>9,world={scene:new Scene(),camera:new PerspectiveCamera(),ground:original};
 const stale=createHousingInterior(world,{markers:false}),retry=createHousingInterior(world,{markers:false});
 assert.equal(world.ground,original,'Staging a room cannot change world hooks');
 retry.show(HOUSES[0]);const active=world.ground;stale.dispose();stale.dispose();
 assert.equal(world.ground,active);assert.equal(world.ground(HOUSES[0].room.x,HOUSES[0].room.z),20);
 retry.dispose();assert.equal(world.ground,original);assert.equal(world.scene.children.length,0);
});
