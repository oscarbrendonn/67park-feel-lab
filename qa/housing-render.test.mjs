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
