// A single authored centreline drives the road mesh, walls and server checkpoints.
// Lengths are world metres; cars are never moved along an invisible rail.
export const RACE = Object.freeze({id:'race',title:'Pocket Rally',icon:'🏁',description:'Three laps. Little cars. Proper racing.',laps:3,duration:240,roadHalfWidth:7.4,carRadius:1.36,carProbe:1.18,wheelbase:2.92,wheelRadius:.71,maxSpeed:24,reverseSpeed:7,checkpoints:24});
export const RACE_COLORS=['#b92f3e','#329d85','#ce9235','#3d7ead'];
export const RACE_POINTS=[[-45,38],[-12,43],[27,43],[58,30],[63,2],[40,-23],[11,-23],[-8,-43],[-43,-47],[-65,-29],[-70,3]];
export const mod=(x,n)=>((x%n)+n)%n;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
export const TRACK=[];
const count=528,n=RACE_POINTS.length;
for(let i=0;i<=count;i++){
 const t=i/count*n,j=Math.floor(t),u=t-j,p=[-1,0,1,2].map(k=>RACE_POINTS[mod(j+k,n)]);
 const x=cat(...p.map(p=>p[0]),u),z=cat(...p.map(p=>p[1]),u),prev=TRACK[i-1];
 TRACK.push({x,z,s:prev?prev.s+Math.hypot(x-prev.x,z-prev.z):0});
}
export const TRACK_LENGTH=TRACK.at(-1).s;
export function roadHeight(s){return .22+.92*Math.sin(mod(s,TRACK_LENGTH)/TRACK_LENGTH*Math.PI*2)**4;}
for(let i=0;i<TRACK.length;i++){
 const prev=TRACK[mod(i-1,count)],next=TRACK[mod(i+1,count)],p=TRACK[i],len=Math.hypot(next.x-prev.x,next.z-prev.z);
 p.tx=(next.x-prev.x)/len;p.tz=(next.z-prev.z)/len;p.nx=p.tz;p.nz=-p.tx;p.y=roadHeight(p.s);
}
export function roadAt(s,offset=0){
 s=mod(s,TRACK_LENGTH);let lo=0,hi=TRACK.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(TRACK[mid].s>s)hi=mid;else lo=mid;}
 const a=TRACK[lo],b=TRACK[hi],t=(s-a.s)/(b.s-a.s),tx=a.tx+(b.tx-a.tx)*t,tz=a.tz+(b.tz-a.tz)*t,len=Math.hypot(tx,tz);
 const nx=tz/len,nz=-tx/len;return{x:a.x+(b.x-a.x)*t+nx*offset,z:a.z+(b.z-a.z)*t+nz*offset,y:roadHeight(s),tx:tx/len,tz:tz/len,nx,nz,s,yaw:Math.atan2(tx,tz)};
}
export function nearestRoad(x,z){
 let best=Infinity,result;
 for(let i=0;i<TRACK.length-1;i++){
  const a=TRACK[i],b=TRACK[i+1],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),px=a.x+dx*t,pz=a.z+dz*t,d=(x-px)**2+(z-pz)**2;
  if(d<best){best=d;const len=Math.hypot(dx,dz);result={x:px,z:pz,s:a.s+(b.s-a.s)*t,nx:dz/len,nz:-dx/len,tx:dx/len,tz:dz/len,offset:((x-px)*dz-(z-pz)*dx)/len,distance:Math.sqrt(d)};}
 }
 return result;
}
export const checkpointSpacing=TRACK_LENGTH/RACE.checkpoints;
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function startingGrid(i){const at=roadAt(4-Math.floor(i/2)*6.3,i%2===0?-2.15:2.15);return{...at,unwrapped:4-Math.floor(i/2)*6.3};}
