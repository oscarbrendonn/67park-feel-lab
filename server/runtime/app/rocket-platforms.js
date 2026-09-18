import {meadowHeight,arenaGround,ROCKET_COVERS,ROCKETS as R,clamp} from './rocket-rules.js';

// Same immutable dimensions drive rendering, authoritative movement and shots.
const summits=[
 {id:'rose-mushroom',kind:'mushroom',x:-4,z:10.6,r:1.75,h:1.65,color:'#df91a8'},
 {id:'honey-mushroom',kind:'mushroom',x:4,z:-10.6,r:1.75,h:1.65,color:'#e8bd70'},
 {id:'mint-hill',kind:'candy',x:-13,z:0,r:1.85,h:1.85,color:'#8bcab5'},
 {id:'sky-hill',kind:'candy',x:13,z:0,r:1.85,h:1.85,color:'#94badf'},
];
export const ROCKET_PLATFORMS=Object.freeze(summits.flatMap(p=>{
 const top=meadowHeight(p.x,p.z)+p.h,dir=p.z>0?-1:p.z<0?1:1;
 const steps=[1,2,3,4].map(i=>({id:p.id+'-step-'+i,kind:'step',
  x:p.x,z:p.z+dir*(p.r+.2+(4-i)*.88),r:.72,
  top:arenaGround(p.x,p.z+dir*(p.r+.2+(4-i)*.88))+(p.h-.18)*i/4,color:p.color}));
 return [{...p,top},...steps];
}).map(Object.freeze));
export const JUMP=Object.freeze({speed:10.5,gravity:24,step:.42});
export function onPlatform(p,x,z,r=0){return Math.hypot(x-p.x,z-p.z)<=p.r-r;}
export function rocketBlocked(x,z,r=R.radius,feet=arenaGround(x,z),step=JUMP.step){
 if(Math.abs(x)>R.halfX-r||Math.abs(z)>R.halfZ-r)return true;
 // Original wooded cover remains non-walkable; trees above it stay solid.
 if(ROCKET_COVERS.some(([a,b,w,d])=>Math.hypot(x-clamp(x,a-w/2,a+w/2),z-clamp(z,b-d/2,b+d/2))<r))return true;
 return ROCKET_PLATFORMS.some(p=>onPlatform(p,x,z,-r*.65)&&feet+step<p.top-.015);
}
export function supportHeight(x,z,limit=Infinity){
 let y=arenaGround(x,z);
 for(const p of ROCKET_PLATFORMS)if(p.top<=limit+.025&&onPlatform(p,x,z,p.r*.20))y=Math.max(y,p.top);
 return y;
}
export function moveRocket(p,dx,dz,jump,dt){
 if(!Number.isFinite(p.y))p.y=arenaGround(p.x,p.z);
 p.vy=Number.isFinite(p.vy)?p.vy:0;
 const wasGrounded=p.grounded!==false;
 if(jump&&!p.jumpHeld&&wasGrounded){p.vy=JUMP.speed;p.grounded=false;}
 p.jumpHeld=jump;
 const step=p.grounded===false?0:JUMP.step;
 if(!rocketBlocked(p.x+dx,p.z,R.radius,p.y,step))p.x+=dx;
 if(!rocketBlocked(p.x,p.z+dz,R.radius,p.y,step))p.z+=dz;
 const support=supportHeight(p.x,p.z,p.y+step);
 if(p.grounded!==false&&support>=p.y-.025){p.y=support;p.vy=0;p.grounded=true;return;}
 const before=p.y;p.vy-=JUMP.gravity*dt;p.y+=p.vy*dt;
 const landing=supportHeight(p.x,p.z,before);
 if(p.vy<=0&&p.y<=landing){p.y=landing;p.vy=0;p.grounded=true;}
 else p.grounded=false;
}
export function shotBlocked(x,y,z){
 if(Math.abs(x)>R.halfX||Math.abs(z)>R.halfZ||y<arenaGround(x,z))return true;
 if(ROCKET_COVERS.some(([a,b,w,d])=>Math.abs(x-a)<w/2+.12&&Math.abs(z-b)<d/2+.12&&y<meadowHeight(a,b)+1.85))return true;
 return ROCKET_PLATFORMS.some(p=>onPlatform(p,x,z,-.12)&&y<p.top);
}
