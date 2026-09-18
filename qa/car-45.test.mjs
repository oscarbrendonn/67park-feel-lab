import assert from 'node:assert/strict';
import {updateParkDriving,PARK_DRIVING} from '../app/park-driving-tuning.js';
import {installParkCarReturn} from '../app/park-car-return.js';
const make=()=>({x:0,z:0,y:0,yaw:0,speed:0,steer:0,accumulator:0,spec:{wheelbase:3.255},area:{check:()=>({ok:true,y:0})},blocked:()=>false,stop(){this.speed=0;this.accumulator=0;}});
const distances=[];
for(const hz of [20,30,60,120]){
 const car=make();for(let i=0;i<hz*3;i++)updateParkDriving(car,1/hz,{throttle:1});
 assert.equal(car.speed,13);distances.push(car.z);
 const start=car.z;for(let i=0;i<hz;i++)updateParkDriving(car,1/hz,{brake:true});
 assert.equal(car.speed,0);assert.ok(car.z-start<5.4);
 for(let i=0;i<hz*3;i++)updateParkDriving(car,1/hz,{throttle:-1});assert.equal(car.speed,-4);
}
assert.ok(Math.max(...distances)-Math.min(...distances)<1e-9);
const left=make(),right=make();for(let i=0;i<1000;i++){updateParkDriving(left,1/60,{throttle:1,steer:1});updateParkDriving(right,1/60,{throttle:1,steer:-1});}
assert.ok(Math.abs(left.x+right.x)<1e-9);assert.ok(Math.abs(left.z-right.z)<1e-9);
for(let i=0;i<60;i++)updateParkDriving(left,1/60,{steer:0,brake:true});assert.ok(Math.abs(left.steer)<1e-12);
const blocked=make();blocked.area.check=(x,z)=>({ok:z<=2,y:0,reason:'edge'});
for(let i=0;i<1000;i++)updateParkDriving(blocked,1/60,{throttle:1});assert.ok(blocked.z<=2);
updateParkDriving(left,NaN,{});assert.equal(left.speed,0);
const car={id:'mint',x:183,z:122,yaw:Math.PI/2,kind:'car',spec:{},occupants:new Map(),physics:make()};
const world={cars:[car],step(){}};installParkCarReturn(world);const firstStep=world.step;installParkCarReturn(world);assert.equal(firstStep,world.step);
world.step(0,0);world.step(0,59000);assert.equal(car.physics.x,0);
car.occupants.set(0,'driver');world.step(0,61000);assert.equal(car.physics.x,0);
car.occupants.clear();world.step(0,62000);world.step(0,123000,[{p:[0,0,0]}]);assert.equal(car.physics.x,0);
world.step(0,123000,[{p:[183,0,122]}]);assert.equal(car.physics.x,0);
car.physics.blocked=()=>true;world.step(0,124000);assert.equal(car.physics.x,0);
car.physics.blocked=()=>false;world.step(0,125000);assert.equal(car.physics.x,183);assert.equal(car.physics.z,122);assert.equal(car.physics.speed,0);
console.log(JSON.stringify({pass:true,maxKmh:PARK_DRIVING.maxSpeed*3.6,frameRates:[20,30,60,120],symmetricSteering:true,collisionGuard:true,idleReturn:'only empty, no nearby players, clear parking'}));
