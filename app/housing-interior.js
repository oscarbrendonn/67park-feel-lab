import * as T from 'three';
import {RoundedBoxGeometry} from '../island/utils/RoundedBoxGeometry.js';
import {HOUSES,inRoom,roomObstacle} from './housing-layout.js';

// A small, reusable dollhouse interior. No GLB, texture downloads, shadow maps,
// timers or physics world per house. Only the currently visited room is drawn.
export function createHousingInterior(world){
 const root=new T.Group();root.name='67PARK_HOME_INTERIOR';root.visible=false;
 const geometry=new RoundedBoxGeometry(1,1,1,2,.065),materials=[],batches=new Map();
 const add=(color,x,y,z,sx,sy,sz)=>{if(!batches.has(color))batches.set(color,[]);batches.get(color).push([x,y,z,sx,sy,sz]);};
 add('#f2e9dc',0,-.17,0,14.2,.34,12.2);
 add('#dfcdb9',0,.008,0,12.9,.018,10.9);
 // Soft plaster walls with real boundaries; near walls fade out of the way
 // by side visibility, like an open dollhouse, not transparent double surfaces.
 const walls=[];
 const wallMat=new T.MeshStandardMaterial({color:'#f5eadf',roughness:.9});materials.push(wallMat);
 const ceilingGeometry=new T.PlaneGeometry(14,12),ceiling=new T.Mesh(ceilingGeometry,wallMat);
 ceiling.rotation.x=Math.PI/2;ceiling.position.y=3.96;root.add(ceiling);
 // Non-shadow-casting fill: keeps avatars readable without new shadow maps.
 const fill=new T.HemisphereLight('#fff6e6','#d5c7b5',1.15);root.add(fill);
 for(const [x,z,sx,sz]of [[0,-6,14,.18],[0,6,14,.18],[-7,0,.18,12],[7,0,.18,12]]){
  const mesh=new T.Mesh(geometry,wallMat);mesh.position.set(x,2,z);mesh.scale.set(sx,4,sz);root.add(mesh);walls.push({mesh,x,z});
 }
 add('#fff5e7',0,.13,-5.84,13.8,.24,.1);
 add('#fff5e7',-6.84,.13,0,.1,.24,11.8);add('#fff5e7',6.84,.13,0,.1,.24,11.8);
 // A mint sofa, rose cushions and a low, rounded coffee table.
 add('#a6c6b8',-4.5,.48,-2.3,3.4,.58,1.3);add('#a6c6b8',-4.5,.99,-2.82,3.4,.72,.28);
 for(const x of [-6,-3])add('#a6c6b8',x,.81,-2.3,.32,.62,1.3);
 for(const x of [-5.45,-3.55])add('#e8bec7',x,.92,-2.3,.67,.3,.62);
 add('#f7efdf',-4.5,.63,-.25,2.1,.16,1.3);add('#c8ad8e',-4.5,.3,-.25,1.5,.56,.8);
 add('#bed4cb',-4.5,.029,-.2,4.3,.025,4.2);
 add('#d0bddc',-4.85,.76,-.3,.52,.1,.35);add('#f0d996',-4.2,.76,-.18,.3,.16,.3);
 // Bed and side cabinet. Nothing obstructs the path between door and sofa.
 add('#c1ae97',4.55,.25,-3.55,2.6,.42,3.4);add('#faf5e9',4.55,.56,-3.55,2.55,.3,3.35);
 add('#bfcce1',4.55,.75,-3.15,2.55,.16,2.4);add('#e6ccba',4.55,1,-5.1,2.7,1.25,.2);
 for(const x of [3.9,5.2])add('#fff8ed',x,.83,-4.7,1,.2,.65);
 add('#dcc8af',2.5,.4,-4.6,.7,.8,.8);add('#f2da9e',2.5,1.15,-4.6,.55,.48,.55);
 // Kitchen, a sage splashback, sink and a window into a pastel sky.
 add('#e5d0b8',3.9,.56,4.75,4.4,1.1,1.2);add('#fff7e9',3.9,1.17,4.75,4.6,.15,1.3);
 add('#aebfb8',4.9,1.26,4.7,1.1,.06,.8);add('#bfd7dd',4.9,1.295,4.7,.9,.015,.62);
 add('#d1b9a4',2.55,1.32,4.72,.4,.2,.45);
 add('#fff8e9',0,2.45,-5.79,2.5,1.95,.13);add('#b8d6dd',0,2.45,-5.69,2.2,1.66,.06);
 add('#f6efdf',0,2.45,-5.64,.06,1.66,.045);add('#f6efdf',0,2.45,-5.64,2.2,.06,.045);
 add('#e2c0c3',-1.45,2.5,-5.65,.35,2.12,.15);add('#e2c0c3',1.45,2.5,-5.65,.35,2.12,.15);
 // Door is an exit landmark, not a hidden collision opening.
 add('#fff4df',0,1.38,5.82,1.9,2.76,.13);add('#acc7b7',0,1.32,5.7,1.6,2.58,.09);
 add('#edcf86',-.52,1.23,5.61,.12,.15,.12);add('#e6c7a8',0,.025,4.95,2.2,.04,.9);
 add('#ead2c0',-5.75,.25,4.65,.65,.5,.65);add('#aac28f',-5.75,.87,4.65,.95,1,.95);
 const mat4=new T.Matrix4();
 for(const [color,rows]of batches){
  const material=new T.MeshStandardMaterial({color,roughness:.78});materials.push(material);
  const mesh=new T.InstancedMesh(geometry,material,rows.length);
  rows.forEach(([x,y,z,sx,sy,sz],i)=>{mat4.makeScale(sx,sy,sz);mat4.setPosition(x,y,z);mesh.setMatrixAt(i,mat4);});
  mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;root.add(mesh);
 }
 world.scene.add(root);
 let current=null;
 const restores=[];
 function wrap(target,key,fn){const prev=target[key];if(typeof prev!=='function')return;const next=(...args)=>fn(prev,...args);target[key]=next;restores.push(()=>{if(target[key]===next)target[key]=prev;});}
 const inside=(x,z)=>current&&inRoom(current,x,z,3);
 wrap(world,'ground',(old,x,z,...args)=>inside(x,z)?current.room.y:old(x,z,...args));
 wrap(world,'terrainGround',(old,x,z,...args)=>inside(x,z)?current.room.y:old(x,z,...args));
 wrap(world,'water',(old,x,z)=>inside(x,z)?false:old(x,z));
 wrap(world,'treeBlocked',(old,x,y,z)=>inside(x,z)?roomObstacle(current,x,y,z):old(x,y,z));
 wrap(world,'sample',(old,x,z)=>inside(x,z)?{point:new T.Vector3(x,current.room.y,z),object:{name:'67PARK_HOME_FLOOR'}}:old(x,z));
 wrap(world,'constrainSwimmer',(old,body,...args)=>{const p=body.translation();return inside(p.x,p.z)?false:old(body,...args);});
 if(world.swimBoundary)wrap(world.swimBoundary,'outsideRescue',(old,x,z)=>inside(x,z)?false:old(x,z));
 // Door markers share one mesh/material, eight tiny key-coloured posts.
 const signMaterial=new T.MeshStandardMaterial({color:'#f0da9d',roughness:.75});materials.push(signMaterial);
 const signs=new T.InstancedMesh(geometry,signMaterial,HOUSES.length);signs.name='67PARK_HOME_DOOR_MARKERS';
 HOUSES.forEach((h,i)=>{mat4.makeRotationY(h.yaw);mat4.scale(new T.Vector3(.35,.85,.1));mat4.setPosition(h.door[0]+Math.cos(h.yaw)*1.1,h.door[1],h.door[2]-Math.sin(h.yaw)*1.1);signs.setMatrixAt(i,mat4);});
 signs.instanceMatrix.needsUpdate=true;world.scene.add(signs);
 return {
  show(h){current=h||null;root.visible=!!h;signs.visible=!h;if(h)root.position.set(h.room.x,h.room.y,h.room.z);},
  step(){if(!current)return;const c=world.camera.position;for(const w of walls)w.mesh.visible=w.x?Math.sign(w.x)*(c.x-current.room.x)<6.8:Math.sign(w.z)*(c.z-current.room.z)<5.8;},
  dispose(){current=null;for(const f of restores.reverse())f();root.removeFromParent();signs.removeFromParent();geometry.dispose();ceilingGeometry.dispose();materials.forEach(m=>m.dispose());},
  stats:()=>({room:current?.id||null,draws:root.children.length,instances:[...batches.values()].reduce((n,a)=>n+a.length,0),newTextureBytes:0}),
 };
}
