import {RACE,TRACK_LENGTH,roadAt,roadHeight,nearestRoad,startingGrid,clamp,mod,angleDelta} from './race-track.js';

export function createRacer(id,index=0){const p=startingGrid(index);return{id,index,x:p.x,z:p.z,y:roadHeight(p.s),yaw:p.yaw,vx:0,vz:0,speed:0,steer:0,travel:0,wallHit:0,resetAge:99};}
export function limitToTrack(p){
 let contact=0;
 // Two rounded end probes cover the full body and all four wheels, not just
 // its centre. Re-evaluate after each push so tight bends cannot clip a nose.
 for(let pass=0;pass<4;pass++){let changed=false;for(const end of [-1,1]){
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),x=p.x+fx*RACE.carProbe*end,z=p.z+fz*RACE.carProbe*end,q=nearestRoad(x,z),limit=RACE.roadHalfWidth-RACE.carRadius-.08;
  if(q.distance<=limit)continue;
  changed=true;
  const nx=(x-q.x)/q.distance,nz=(z-q.z)/q.distance,push=q.distance-limit;
  p.x-=nx*push;p.z-=nz*push;
  const into=p.vx*nx+p.vz*nz;if(into>0){p.vx-=nx*into*1.08;p.vz-=nz*into*1.08;p.vx*=.985;p.vz*=.985;}
  contact=Math.max(contact,Math.abs(into));
 }if(!changed)break;}
 p.wallHit=Math.max(p.wallHit,Math.min(1,contact/7));
 return contact;
}
export function stepRacer(p,input={},dt=1/60){
 if(!Number.isFinite(dt)||dt<=0||dt>.05)return;
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1;
 const throttle=valid(input.throttle)?input.throttle:0,steer=valid(input.steer)?input.steer:0;
 p.steer+=(steer-p.steer)*(1-Math.exp(-10*dt));
 const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),rx=fz,rz=-fx;
 let forward=p.vx*fx+p.vz*fz,lateral=p.vx*rx+p.vz*rz;
 const brake=input.brake===true||throttle*forward<-.8;
 const drive=brake?0:throttle*(throttle<0?9:13.5);
 forward+=drive*dt;
 const loss=(brake?19:throttle===0?2.1:1.05)+.016*forward*forward;
 forward=Math.sign(forward)*Math.max(0,Math.abs(forward)-loss*dt);
 forward=clamp(forward,-RACE.reverseSpeed,RACE.maxSpeed);
 lateral*=Math.exp(-(brake?5.4:9.5)*dt);
 // Steering retains velocity, so a toy car leans into a turn instead of
 // snapping direction. Positive steer is the driver's LEFT in +Z car space.
 p.yaw+=forward/RACE.wheelbase*Math.tan(p.steer*.48)/(1+Math.abs(forward)*.055)*dt;
 p.yaw=angleDelta(p.yaw,0);
 const newFx=Math.sin(p.yaw),newFz=Math.cos(p.yaw);
 p.vx=newFx*forward+rx*lateral;p.vz=newFz*forward+rz*lateral;
 p.x+=p.vx*dt;p.z+=p.vz*dt;p.travel+=forward*dt;p.resetAge+=dt;p.wallHit=Math.max(0,p.wallHit-dt*3);
 limitToTrack(p);p.speed=p.vx*newFx+p.vz*newFz;
 p.y=roadHeight(nearestRoad(p.x,p.z).s);
}
export function collideRacers(players){
 const radius=RACE.carRadius*.95;
 for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
  const a=players[i],b=players[j];if(a.finished||b.finished||a.alive===false||b.alive===false)continue;
  for(const ea of [-1,1])for(const eb of [-1,1]){
   const ax=a.x+Math.sin(a.yaw)*RACE.carProbe*ea,az=a.z+Math.cos(a.yaw)*RACE.carProbe*ea,bx=b.x+Math.sin(b.yaw)*RACE.carProbe*eb,bz=b.z+Math.cos(b.yaw)*RACE.carProbe*eb;
   let dx=ax-bx,dz=az-bz,d=Math.hypot(dx,dz);if(d>=radius*2)continue;
   if(d<.0001){dx=i%2?1:-1;dz=0;d=1;}
   const nx=dx/d,nz=dz/d,push=(radius*2-d)*.505;
   a.x+=nx*push;a.z+=nz*push;b.x-=nx*push;b.z-=nz*push;
   const rel=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(rel<0){const impulse=-rel*.56;a.vx+=nx*impulse;a.vz+=nz*impulse;b.vx-=nx*impulse;b.vz-=nz*impulse;}
  }
 }
 for(const p of players)if(p.alive!==false&&!p.finished){limitToTrack(p);p.y=roadHeight(nearestRoad(p.x,p.z).s);}
}
export function recoverRacer(p,checkpointS){
 if(p.resetAge<5)return false;
 const q=roadAt(checkpointS,p.index%2?-2:2);
 Object.assign(p,{x:q.x,z:q.z,y:q.y,yaw:q.yaw,vx:0,vz:0,speed:0,steer:0,resetAge:0});return true;
}
// Used only by explicitly named QA drivers; no hidden matchmaking bots.
export function followTrackInput(p){
 const q=nearestRoad(p.x,p.z),ahead=roadAt(q.s+5+Math.abs(p.speed)*.5),error=angleDelta(Math.atan2(ahead.x-p.x,ahead.z-p.z),p.yaw);
 const steer=clamp(error*2.2,-1,1),target=22-Math.abs(steer)*10;
 return{throttle:p.speed>target?0:1,steer,brake:p.speed>target+4};
}
