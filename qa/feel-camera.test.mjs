import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraBoom,feelCameraPose,createTravelSampler,locomotionRate,approachVelocity} from '../app/feel-camera.js';
test('direct translation follows at 30/60/120 FPS without lag',()=>{
 for(const fps of [30,60,120]){const boom=createCameraBoom();for(let i=0;i<fps*10;i++){const p=feelCameraPose({x:i/fps*6.8,y:0,z:0},0,.36);const out=boom.step(p.target,p.position,1/fps);assert(Math.abs(out.x-p.position.x)<1e-8);assert(Math.abs(out.distance-6.8)<1e-8);}}
});
test('near-plane probes retract immediately, release smoothly, teleport resets',()=>{
 const boom=createCameraBoom(),target={x:0,y:1,z:0},desired={x:0,y:3,z:7};
 const a=boom.step(target,desired,.016);let calls=0;
 const b=boom.step(target,desired,.016,()=>{calls++;return 2});assert.equal(calls,5);assert.equal(b.distance,1.76);
 const c=boom.step(target,desired,.016);assert.equal(c.distance,b.distance);
 let d=c;for(let i=0;i<60;i++)d=boom.step(target,desired,1/60);assert(d.distance>a.distance-.02);assert(d.distance<=a.distance);
 assert.equal(boom.step({x:100,y:1,z:0},{x:100,y:1,z:7},.016).distance,7);
});
test('phone keeps more context; bad inputs cannot poison camera state',()=>{
 const a=feelCameraPose({x:0,y:0,z:0},0,.36,6.8,1.5),b=feelCameraPose({x:0,y:0,z:0},0,.36,6.8,.46);
 assert(b.position.z>a.position.z);assert.equal(createCameraBoom().step({x:NaN,y:0,z:0},a.position,.016),null);
});
test('animation cadence uses actual travel and ignores teleport',()=>{
 const sample=createTravelSampler();assert.equal(sample({x:0,y:0,z:0},.02),null);assert(Math.abs(sample({x:.136,y:0,z:0},.02)-6.8)<1e-8);assert.equal(sample({x:.136,y:0,z:0},.02),0);assert.equal(sample({x:100,y:0,z:0},.02),null);
 assert.equal(locomotionRate('run',12.5),12.5/6.8);assert.equal(locomotionRate('walk',3.4),1);
});
test('turns and stops are bounded at 30/60/120 FPS, with vertical velocity untouched',()=>{
 for(const fps of [30,60,120]){
  const v={x:6.8,z:0,y:9.2};approachVelocity(v,v,{x:-6.8,z:0},40,1/fps);assert(v.x>-6.8);assert.equal(v.y,9.2);
  for(let i=0;i<fps;i++)approachVelocity(v,v,{x:0,z:0},60,1/fps);
  assert.equal(v.x,0);assert.equal(v.z,0);
 }
});
