import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,Group,Bone,Vector3,Quaternion} from 'three';
import {queueHomePose} from '../app/housing-poses.js';
import {HOUSES} from '../app/housing-layout.js';
import {HOME_SPOTS} from '../app/housing-actions.js';
function avatar(){
 const scene=new Scene(),root=new Group();scene.add(root);const bones=[];
 for(const suffix of ['', '_1']){
  const hip=new Bone();hip.name='Root'+suffix;hip.position.y=.8;root.add(hip);
  for(const side of ['L','R']){const thigh=new Bone(),shin=new Bone();thigh.name='Thigh'+side+suffix;shin.name='Shin'+side+suffix;thigh.position.x=side==='L'?.15:-.15;shin.position.y=-.35;hip.add(thigh);thigh.add(shin);bones.push(thigh,shin);}
 }
 return {scene,root,bones};
}
test('sit overlay supports duplicate costume bones without accumulation and releases immediately',()=>{
 const {scene,root,bones}=avatar(),h=HOUSES[0],s=HOME_SPOTS[0];
 for(let i=0;i<1000;i++){root.position.set(h.room.x+s.x,h.room.y,h.room.z+s.z);root.quaternion.identity();queueHomePose(root,s,h,.02);scene.onBeforeRender();}
 assert.equal(root.userData.homePose.weight,1);assert.equal(root.userData.homePose.bones,8);
 for(const b of bones)assert(Math.abs(b.rotation.x-(b.name.startsWith('Thigh')?-1.45:1.5))<.01);
 const thigh=root.getObjectByName('ThighL').getWorldPosition(new Vector3());assert(Math.abs(thigh.y-h.room.y-s.surface-.12)<1e-5);
 queueHomePose(root,null,null,.016);scene.onBeforeRender();
 assert.equal(root.userData.homePose.active,false);for(const b of bones)assert(b.quaternion.angleTo(new Quaternion())<1e-5);
 assert.equal(root.position.y,h.room.y);
});
test('lying faces up along bed; returning to movement preserves new controller transform',()=>{
 const {scene,root}=avatar(),h=HOUSES[0],s=HOME_SPOTS[2];
 for(let i=0;i<30;i++){root.position.set(0,0,0);root.quaternion.identity();queueHomePose(root,s,h,.02);scene.onBeforeRender();}
 assert(Math.abs(root.rotation.x+Math.PI/2)<1e-5);assert.equal(root.userData.homePose.pose,'lie');
 root.position.set(480,21,500);root.rotation.set(0,.4,0);const before=root.position.clone();
 queueHomePose(root,null,null,.016);scene.onBeforeRender();assert(root.position.equals(before));assert(Math.abs(root.rotation.y-.4)<1e-5);
});
