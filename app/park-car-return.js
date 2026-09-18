// Server-owned return to authored parking. Never move an occupied vehicle or
// make one disappear beside a player. No timers per car and no client authority.
export function installParkCarReturn(world,{idleMs=60000,clearance=8}={}){
 if(world.parkingReturn45)return world;
 world.parkingReturn45=true;
 const homes=new Map(world.cars.map(c=>[c.id,{x:c.x,z:c.z,yaw:c.yaw}]));
 const idle=new Map(),step=world.step;
 world.step=function(dt,now,players=[]){
  step.call(this,dt,now,players);
  for(const car of this.cars){
   if(car.kind!=='car')continue;
   const p=car.physics,home=homes.get(car.id);
   if(car.occupants.size||!home||Math.hypot(p.x-home.x,p.z-home.z)<1){idle.delete(car.id);continue;}
   if(!idle.has(car.id))idle.set(car.id,now);
   if(now-idle.get(car.id)<idleMs||Math.abs(p.speed)>.05)continue;
   const near=players.some(player=>player.p&&[p,home].some(at=>Math.hypot(player.p[0]-at.x,player.p[2]-at.z)<clearance));
   if(near)continue;
   const floor=p.area.check(home.x,home.z,home.yaw,car.spec);
   if(!floor.ok||p.blocked(home.x,home.z,home.yaw))continue;
   p.stop();Object.assign(p,{...home,y:floor.y,steer:0,distance:0,reason:''});
   car.control=null;car.controlAt=0;idle.delete(car.id);
  }
 };
 return world;
}
