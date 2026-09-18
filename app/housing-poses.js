import {Vector3,Quaternion,Euler,Matrix4} from 'three';
import {canonicalPoseBoneName} from './character-pose-bones.js';
import {alignVehicleHip} from './vehicle-pose.js';

// Reuse the avatar's actual skeleton, including all clothing copies. No new
// model, animation loop, texture, skeleton reparenting or limb scaling.
const rigs=new WeakMap(),scenes=new WeakMap(),failed=new WeakSet();
const offset=new Quaternion(),rotation=new Euler(),matrix=new Matrix4();
const pos=new Vector3(),scale=new Vector3(),quat=new Quaternion();
const sit={ThighL:[-1.45,0,-.06],ThighR:[-1.45,0,.06],ShinL:[1.5,0,0],ShinR:[1.5,0,0],Spine1:[.05,0,0],BiscepL:[-.32,0,-.08],BiscepR:[-.32,0,.08],ArmL:[.65,0,.12],ArmR:[.65,0,-.12]};
function build(root){
 const bind=new Map();
 root.traverse(n=>{const s=n.skeleton;if(!s)return;for(let i=0;i<s.bones.length;i++)if(!bind.has(s.bones[i]))bind.set(s.bones[i],s.boneInverses[i].clone().invert());});
 const bones=[];
 root.traverse(o=>{
  const name=canonicalPoseBoneName(o);if(!o.isBone||!name||name==='Root'||!(/^(Spine|Head|Biscep|Arm|Hand|Thigh|Shin|Toe)/.test(name)))return;
  const rest=o.quaternion.clone();
  if(bind.has(o)&&bind.has(o.parent)){matrix.copy(bind.get(o.parent)).invert().multiply(bind.get(o));matrix.decompose(pos,rest,scale);}
  bones.push({o,name,rest,base:rest.clone(),last:rest.clone(),goal:rest.clone(),applied:false});
 });
 if(!bones.length)return null;
 const r={bones,weight:0,basePosition:root.position.clone(),lastPosition:root.position.clone(),baseRotation:root.quaternion.clone(),lastRotation:root.quaternion.clone(),applied:false};
 rigs.set(root,r);return r;
}
function apply(root,spot,house,dt){
 const r=rigs.get(root)||(spot&&build(root));if(!r)return;
 if(r.applied){
  if(root.position.distanceToSquared(r.lastPosition)<1e-12)root.position.copy(r.basePosition);
  if(root.quaternion.angleTo(r.lastRotation)<1e-6)root.quaternion.copy(r.baseRotation);
 }
 r.applied=false;
 for(const b of r.bones)if(b.applied){if(b.o.quaternion.angleTo(b.last)<1e-6)b.o.quaternion.copy(b.base);b.applied=false;}
 if(!spot||!house){r.weight=0;root.userData.homePose={active:false};return;}
 r.weight=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,r.weight+Math.min(.05,Math.max(0,dt||0))/.18);
 const w=r.weight*r.weight*(3-2*r.weight);
 for(const b of r.bones){
  b.base.copy(b.o.quaternion);const angles=spot.pose==='sit'?(sit[b.name]||[0,0,0]):[0,0,0];
  offset.setFromEuler(rotation.set(...angles));b.goal.copy(b.rest).multiply(offset);
  b.o.quaternion.copy(b.base).slerp(b.goal,w);b.last.copy(b.o.quaternion);b.applied=true;
 }
 r.basePosition.copy(root.position);r.baseRotation.copy(root.quaternion);
 quat.setFromEuler(rotation.set(spot.pose==='lie'?-Math.PI/2:0,0,0));root.quaternion.slerp(quat,w);
 alignVehicleHip(root,{x:house.room.x+spot.x,y:house.room.y+spot.surface+(spot.pose==='lie'?.08:0),z:house.room.z+spot.z});
 root.position.lerpVectors(r.basePosition,root.position,w);
 r.lastPosition.copy(root.position);r.lastRotation.copy(root.quaternion);r.applied=true;
 root.updateMatrixWorld(true);root.userData.homePose={active:true,pose:spot.pose,spot:spot.id,weight:r.weight,bones:r.bones.length};
}
export function queueHomePose(root,spot,house,dt){
 if(!root||failed.has(root)||(!spot&&!rigs.has(root)))return;
 let scene=root;while(scene.parent)scene=scene.parent;if(!scene.isScene)return;
 let pending=scenes.get(scene);
 if(!pending){
  pending=new Map();scenes.set(scene,pending);const before=scene.onBeforeRender;
  scene.onBeforeRender=function(...args){
   before?.apply(this,args);
   for(const [avatar,sample]of pending)try{apply(avatar,...sample);}catch(e){failed.add(avatar);avatar.userData.homePose={active:false,error:String(e?.message||e)};}
   pending.clear();
  };
 }
 pending.set(root,[spot,house,dt]);
}
