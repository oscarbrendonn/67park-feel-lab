import {register} from 'node:module';
import assert from 'node:assert/strict';
register(new URL('./three-test-loader.mjs',import.meta.url));
globalThis.document={createElement:()=>({setAttribute(){},style:{},remove(){}}),body:{append(){}}};
const T=await import('three');
const {createParkSocialToys,TOY_RULES}=await import('../app/party/park-social-toys.js');
function fixture(){
 const p={x:139,y:.555,z:109},v={x:0,y:0,z:0},st={enabled:true,heading:0},input={x:0,z:0,run:false,jumpQueued:false};
 const body={translation:()=>({...p}),linvel:()=>({...v}),setTranslation:n=>Object.assign(p,n),setLinvel:n=>Object.assign(v,n)};
 const world={ready:true,ground:()=>0,sample:()=>({point:{y:0},object:{name:'3_CIMEN'}}),water:()=>false,treeBlocked:()=>false};
 const scene=new T.Scene(),network={id:'local',remotes:new Map([['peer',{p:[139,8.555,109],ry:0}]])};
 const toys=createParkSocialToys({world:()=>world,scene:()=>scene,state:()=>st,net:()=>network,settings:{},sfx:{play(){}},send(){}});
 toys.step(body,input,0,true);
 return {p,v,st,input,body,toys,tick(dt){toys.step(body,input,dt,true);p.y+=v.y*dt;v.y-=18*dt;if(p.y<.555){p.y=.555;v.y=0;}}};
}
assert.equal(TOY_RULES.rideHeight,8);assert.equal(TOY_RULES.rideSeconds,5.5);
for(const fps of [20,30,60,120]){
 const f=fixture();assert(f.toys.interact());let max=0,released=null;
 for(let i=0;i<fps*14;i++){f.tick(1/fps);max=Math.max(max,f.p.y-.555);if(released===null&&!f.toys.debug().flight)released=(i+1)/fps;assert(Number.isFinite(f.p.y));}
 assert(max>7.9&&max<8.15);assert(released>=5.45&&released<5.6);assert(!f.toys.debug().glide);assert(Math.abs(f.p.y-.555)<.001);
 assert.equal(f.toys.debug().counts.rides,1);assert.equal(f.toys.debug().counts.releases,1);f.toys.dispose();console.log('PASS height / auto-release / landing',fps,{max,released});
}
for(const release of ['jump','interact']){
 const f=fixture();assert(f.toys.interact());for(let i=0;i<60;i++)f.tick(1/60);
 if(release==='jump')f.input.jumpQueued=true;else assert(f.toys.interact());
 f.tick(1/60);assert(!f.toys.debug().flight);assert(f.toys.debug().glide);f.toys.dispose();
}
{
 const f=fixture();assert(f.toys.interact());for(let i=0;i<1000;i++)f.toys.interact();assert.equal(f.toys.debug().counts.rides,1);assert(f.toys.debug().flight);
 f.toys.receive({id:'peer',e:'pk1t:b:1:1',p:[139,8.555,109]});assert(f.toys.debug().remoteBalloons.some(r=>r.active));
 f.toys.receive({id:'peer',e:'pk1t:b:2:1',p:[139,99,109]});assert.equal(f.toys.debug().counts.rejected,1);
 f.p.y=TOY_RULES.rideHeight+3;f.tick(1/60);assert(!f.toys.debug().flight);f.toys.dispose();
}
console.log('PASS manual release, repeat input, raised remote validation, upper safety limit');
