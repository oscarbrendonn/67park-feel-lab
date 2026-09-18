import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,PerspectiveCamera} from 'three';
import {createHousingInterior} from '../app/housing-interior.js';
import {HOUSES} from '../app/housing-layout.js';
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
