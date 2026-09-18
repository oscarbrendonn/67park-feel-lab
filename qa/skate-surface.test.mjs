import assert from 'node:assert/strict';
import {createSkateSurface,isSkateRideSurface} from '../app/skate-surface.js';
const name='67D_SKATEPARK_BOWL_NW_SURFACE_MESH';
function fixture(ground, surface=name){
 const p={x:0,y:.555,z:0},v={x:0,y:0,z:0};
 const body={translation:()=>({...p}),linvel:()=>({...v}),setTranslation:n=>Object.assign(p,n),setLinvel:n=>Object.assign(v,n)};
 const world={ready:true,ground,water:()=>false,sample:(x,z)=>({point:{y:ground(x,z)},object:{name:surface}})};
 return {p,v,body,world};
}
for(const n of ['5_YOL','7_KALDIRIM','67D_SKATEPARK_STEP_0_0','67D_SKATEPARK_STEP_RAIL_0','67D_SKATEPARK_BOWL_NW_COPING'])assert(!isSkateRideSurface(n));
for(const fps of [30,60,120]){
 const f=fixture(x=>x<0?0:x<4?x*.5:2),c=createSkateSurface();f.p.x=-2;f.v.x=6;
 const dt=1/fps;let maxTilt=0,maxHeight=0;
 for(let i=0;i<fps*4;i++){
  f.v.y-=18*dt;f.p.x+=f.v.x*dt;f.p.y+=f.v.y*dt;
  const s=c.step({...f,enabled:true,dt});c.pose(Math.PI/2,dt,true);
  maxTilt=Math.max(maxTilt,Math.abs(s.pitch));maxHeight=Math.max(maxHeight,f.p.y);
  assert([f.p.x,f.p.y,s.pitch,s.roll].every(Number.isFinite));
 }
 console.log('RAMP',fps,{maxTilt,maxHeight,launches:c.state.launches});
 assert.equal(c.state.launches,1,'exactly one crest launch '+fps);assert(maxHeight>2.6);assert(maxTilt>.2);assert(c.state.grounded);
 // Stop, turn, manual hop, then dismount: no stale launch or residual tilt.
 f.v.y=6;f.p.y+=.1;c.step({...f,enabled:true,dt});assert(!c.state.grounded);
 c.step({...f,enabled:false,dt});assert.equal(c.state.pitch,0);assert(!c.state.managed);
 console.log('PASS ramp',fps,{maxTilt,maxHeight});
}
const f=fixture(x=>x<2?0:.2,'7_KALDIRIM'),c=createSkateSurface();
for(let i=0;i<1000;i++){f.p.x=i*.01;f.v.x=10;assert(!c.step({...f,enabled:true,dt:1/60}).managed)}
assert.equal(c.state.launches,0);
const bowl=fixture(x=>Math.max(0,Math.abs(x)-2)*.5),ride=createSkateSurface();bowl.p.x=-5;bowl.p.y=2.055;bowl.v.x=3;
let min=Infinity;
for(let i=0;i<120;i++){bowl.p.x+=.05;bowl.v.y-=.3;bowl.p.y+=bowl.v.y/60;ride.step({...bowl,enabled:true,dt:1/60});min=Math.min(min,bowl.p.y)}
assert(min<.6,'descend to bowl floor');
bowl.p.x+=20;ride.step({...bowl,enabled:true,dt:1/60});assert.equal(ride.state.launches,0,'teleport never launches');
ride.step({...bowl,enabled:true,dt:3});assert(!ride.state.managed,'resume resets');
bowl.world.water=()=>true;ride.step({...bowl,enabled:true,dt:1/60});assert(!ride.state.managed,'water excluded');
bowl.world.water=()=>false;bowl.world.sample=()=>{throw Error('probe failure')};ride.step({...bowl,enabled:true,dt:1/60});assert.equal(ride.state.error,'probe failure');
for(let i=0;i<1000;i++)ride.step({...bowl,enabled:true,dt:1/60});
console.log('PASS reset, manual jump, water, curb, descent, failure isolation, 2000 repeat calls');
