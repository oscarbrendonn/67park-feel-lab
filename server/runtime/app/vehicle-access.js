// Shared, bounded access checks. Never use a distant boarding location as a
// normal exit, or accept a safe centre with the player's feet over an edge.
export function findVehicleExit(car,{ground,water=()=>false,blocked=()=>false,cars=[]}){
 const p=car.physics,w=car.spec.halfWidth,l=car.spec.halfLength;
 for(const gap of [.8,1.25,1.8])for(const [u,v] of [[-w-gap,0],[w+gap,0],[-w-gap,-l*.55],[w+gap,-l*.55],[0,-l-gap],[0,l+gap]]){
  const x=p.x+Math.cos(p.yaw)*u+Math.sin(p.yaw)*v,z=p.z-Math.sin(p.yaw)*u+Math.cos(p.yaw)*v,y=ground(x,z);
  if(y==null||!Number.isFinite(y)||Math.abs(y-p.y)>.65)continue;
  const clear=[[0,0],[.42,0],[-.42,0],[0,.42],[0,-.42]].every(([dx,dz])=>{
   const px=x+dx,pz=z+dz,h=ground(px,pz);
   if(h==null||Math.abs(h-y)>.22||water(px,pz)||blocked(px,y+.58,pz))return false;
   return !cars.some(c=>{const a=c.physics,s=Math.sin(a.yaw),co=Math.cos(a.yaw),ox=px-a.x,oz=pz-a.z;return Math.abs(co*ox-s*oz)<c.spec.halfWidth+.08&&Math.abs(s*ox+co*oz)<c.spec.halfLength+.08;});
  });
  if(clear)return{x,y:y+.58,z};
 }
 return null;
}
export function vehicleBoardingHint(car){
 if(Math.abs(car.physics.speed)>.4)return 'Wait for the vehicle to stop';
 if(car.seatStatus().occupied.length>=car.capacity)return 'Vehicle full';
 return `E · Enter ${car.kind==='bus'?'school bus':'car'}`;
}
