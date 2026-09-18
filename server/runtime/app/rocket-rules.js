export const ROCKETS=Object.freeze({id:'rockets',title:'Candy Rockets',icon:'🚀',description:'Four toy launchers. Free-for-all or 2 vs 2.',duration:150,target:10,halfX:18,halfZ:15,speed:7.2,radius:.62,health:100,ammo:3,reload:1.4,cooldown:.6,rocketSpeed:23,blastRadius:3,damage:55,respawn:3,shield:1.8});
export const ROCKET_SPAWNS=[[-13,10],[13,-10],[-13,-10],[13,10]];
export const ROCKET_COVERS=[[-7,-5,5,2.1],[7,5,5,2.1],[-7,5,2.1,4.2],[7,-5,2.1,4.2],[0,0,3.4,3.4]];
export const ELEMENTS=Object.freeze({ice:{name:'Frost bloom',cooldown:8,color:'#a5e0ef'},fire:{name:'Fire pop',cooldown:9,color:'#f4a76f'},air:{name:'Air wave',cooldown:7,color:'#c6efe0'}});
// One height field for the rendered meadow, characters and server projectiles.
export function meadowHeight(x,z){const d=Math.hypot(x/11,z/9),t=Math.max(0,Math.min(1,1-d));return .9*t*t*(3-2*t);}
export function arenaGround(x,z){return meadowHeight(x,z)+.02+(ROCKET_SPAWNS.some(([a,b])=>Math.hypot(x-a,z-b)<1.55)?.16:0);}
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function blocked(x,z,r=ROCKETS.radius){return Math.abs(x)>ROCKETS.halfX-r||Math.abs(z)>ROCKETS.halfZ-r||ROCKET_COVERS.some(([cx,cz,w,d])=>Math.hypot(x-clamp(x,cx-w/2,cx+w/2),z-clamp(z,cz-d/2,cz+d/2))<r);}
export function segmentCircle(ax,az,bx,bz,x,z,r){const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(ax+dx*t-x,az+dz*t-z)<=r;}
