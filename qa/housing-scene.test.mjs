import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,Group,HemisphereLight,DirectionalLight} from 'three';
import {createHousingScene} from '../app/housing-scene.js';

test('isolates only exterior roots; preserves avatars, lights, transforms and restoration',()=>{
 const scene=new Scene(),park=new Group(),hidden=new Group(),avatar=new Group(),hemi=new HemisphereLight(),sun=new DirectionalLight();
 park.position.set(3,4,5);hidden.visible=false;scene.add(park,hidden,avatar,hemi,sun,sun.target);
 let updates=0,disposed=0;const world={scene,objects:[park,hidden,hemi,sun,sun.target],update(){updates++},dispose(){disposed++},shadowCache:{enabled:true,setEnabled(v){this.enabled=v},invalidate(){}}};
 const originalUpdate=world.update,home=createHousingScene(world),position=park.position.clone();
 for(let i=0;i<1000;i++){
  home.enter();home.enter();home.step();world.update(.02,{});
  assert.notEqual(park.parent,scene);assert.equal(avatar.parent,scene);assert.equal(sun.parent,scene);assert.equal(hemi.parent,scene);
  assert.equal(world.shadowCache.enabled,false);assert.deepEqual(park.position,position);
  home.leave();world.update(.02,{});assert.equal(park.parent,scene);assert.equal(hidden.visible,false);assert.equal(world.shadowCache.enabled,true);
 }
 assert.equal(updates,1000);assert.equal(home.stats.parkUpdatesSkipped,1000);assert.equal(scene.children.length,6);
 home.enter();world.dispose();assert.equal(home.active,false);assert.equal(park.parent,scene);assert.equal(disposed,1);assert.equal(world.update,originalUpdate);
});
test('late exterior roots are suspended but new shared avatars are untouched',()=>{
 const scene=new Scene(),world={scene,objects:[],update(){}};const home=createHousingScene(world);home.enter();
 const toy=new Group(),avatar=new Group();toy.name='PARK_SOCIAL_TOYS';scene.add(toy,avatar);home.step();
 assert.notEqual(toy.parent,scene);assert.equal(avatar.parent,scene);home.dispose();assert.equal(toy.parent,scene);
});
