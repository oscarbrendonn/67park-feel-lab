import {RoadCarPhysics108} from '../island-source/pastel-car-v108.js';
import {vehiclesOverlap} from '../app/vehicle-collision.js';
import {findVehicleExit} from '../app/vehicle-access.js';
import {LobbyCourtBalls} from '../app/lobby-court-rules.js';
export class IslandWorld{
 constructor(source){this.source=source;this.mounts=new Map();this.exits=new Map();this.serial=0;this.cars=source.cars.map(c=>({...c,occupants:new Map(),physics:null,control:null,controlAt:0}));for(const c of this.cars)c.physics=new RoadCarPhysics108({...c,area:source.area,blocked:(x,z,yaw)=>this.cars.some(o=>o!==c&&o.physics&&vehiclesOverlap({x,z,yaw,spec:c.spec},o.physics))});this.rideSeats=new Map(source.rides.map(r=>[r.asset,new Map()]));}
 position(id){const m=this.mounts.get(id);if(!m)return null;let x,y,z,yaw;
  if(m.kind==='car'){const c=this.cars.find(c=>c.id===m.id),p=c.physics,[u,v,w]=c.seats[m.index];x=p.x+Math.cos(p.yaw)*u+Math.sin(p.yaw)*w;z=p.z-Math.sin(p.yaw)*u+Math.cos(p.yaw)*w;y=p.y+.015+v+.24+.23;yaw=p.yaw;}
  else{const s=this.source.rides.find(r=>r.asset===m.id).seat(m.index);({x,y,z}=s.position);y+=.23;yaw=s.heading;}return{p:[x,y,z],ry:yaw};
 }
 enter(p,id){
  if(this.mounts.has(p.id))throw Error('Exit your current seat first.');if(p.roomId)throw Error('Leave the match room before boarding.');const at=p.lastPosition?.p;if(!at)throw Error('Walk to the boarding point first.');
  const c=this.cars.find(c=>c.id===id),ride=this.source.rides.find(r=>r.asset===id);let seats,index,kind;
  if(c){if(Math.hypot(at[0]-c.physics.x,at[2]-c.physics.z)>c.spec.halfLength+2.1||Math.abs(at[1]-c.physics.y)>2||Math.abs(c.physics.speed)>.4)throw Error('Stand beside a stopped car.');seats=c.occupants;index=c.seats.findIndex((_,i)=>!seats.has(i));kind='car';}
  else if(ride){if(Math.hypot(at[0]-ride.entry.x,at[2]-ride.entry.z)>4.6||Math.abs(at[1]-ride.entry.y)>2)throw Error('Stand at the ride entrance.');seats=this.rideSeats.get(id);const n=ride.nearestSeat(),start=ride.asset==='ferris'?Math.floor(n/4)*4:0,count=ride.asset==='ferris'?4:ride.stats.seats;index=Array.from({length:count},(_,i)=>start+i).find(i=>!seats.has(i))??-1;kind='ride';}
  else throw Error('Unknown vehicle or ride.');
  if(index<0)throw Error('All boarding seats are occupied.');seats.set(index,p.id);if(kind==='car'&&index===0){c.seq=-1;c.control=null;}this.mounts.set(p.id,{kind,id,index,boarding:[...at]});this.exits.delete(p.id);return this.position(p.id);
 }
 exit(id,{force=true}={}){const m=this.mounts.get(id);if(!m)return null;let point;
  if(m.kind==='ride'){const r=this.source.rides.find(r=>r.asset===m.id);point=[r.entry.x,r.entry.y+.58,r.entry.z];this.rideSeats.get(m.id).delete(m.index);}
  else{const c=this.cars.find(c=>c.id===m.id),p=c.physics;
   const safe=findVehicleExit(c,{ground:this.source.ground,water:this.source.water,blocked:this.source.treeBlocked,cars:this.cars});
   if(!safe&&!force)throw Error('No clear exit. Move the vehicle a little.');
   if(safe)point=[safe.x,safe.y,safe.z];
   c.occupants.delete(m.index);if(m.index===0){p.stop();c.control=null;}
   point??=m.boarding;
  }
  this.mounts.delete(id);const exit={serial:++this.serial,p:point};this.exits.set(id,exit);if(this.exits.size>64)this.exits.delete(this.exits.keys().next().value);return exit;
 }
 resume(id){const seat=this.mounts.get(id);if(seat?.kind!=='car'||seat.index!==0)return;const c=this.cars.find(c=>c.id===seat.id);c.seq=-1;c.control=null;c.physics.stop();}
 drive(p,m,now){const seat=this.mounts.get(p.id);if(!seat||seat.kind!=='car'||seat.index!==0)return false;const c=this.cars.find(c=>c.id===seat.id);if(!Number.isSafeInteger(m.seq)||m.seq<0||m.seq<=(c.seq??-1)||![m.throttle,m.steer].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1))return false;c.seq=m.seq;c.control={throttle:m.throttle,steer:m.steer,brake:m.brake===true};c.controlAt=now;return true;}
 step(dt,now,players=[]){for(const c of this.cars)c.physics.update(dt,c.occupants.has(0)&&now-c.controlAt<350&&c.control?c.control:{brake:true});this.courtBalls??=new LobbyCourtBalls(this.source.ground);this.courtBalls.step(dt,now,players);}
 snapshot(now){return{t:'island.world',now,balls:(this.courtBalls??=new LobbyCourtBalls(this.source.ground)).snapshot(),mounts:Object.fromEntries(this.mounts),exits:Object.fromEntries(this.exits),cars:this.cars.map(c=>({id:c.id,x:c.physics.x,y:c.physics.y,z:c.physics.z,yaw:c.physics.yaw,speed:c.physics.speed,steer:c.physics.steer,brake:c.occupants.has(0)&&now-c.controlAt>=0&&now-c.controlAt<350&&c.control?.brake===true,seats:Object.fromEntries(c.occupants)})),rides:this.source.rides.map(r=>({id:r.asset,angle:r.angle,period:r.stats.period,seats:Object.fromEntries(this.rideSeats.get(r.asset))}))};}
}
