// One physics implementation for offline prediction and the dedicated Kimi
// server. Preserve the 120 Hz collision sweep, footprint and mounting rules.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const approach=(a,b,d)=>a<b?Math.min(b,a+d):Math.max(b,a-d);
export const PARK_DRIVING=Object.freeze({maxSpeed:13,reverseSpeed:4,acceleration:8,braking:16,steerAngle:.66,steerRate:3.8,returnRate:4.8});
export function updateParkDriving(car,dt,{throttle=0,steer=0,brake=false}={}) {
  if(![dt,throttle,steer].every(Number.isFinite)){car.stop();return;}
  dt=clamp(dt,0,.05);throttle=clamp(throttle,-1,1);steer=clamp(steer,-1,1);
  car.accumulator+=dt;car.distance=0;car.reason='';
  const h=1/120, p=PARK_DRIVING;
  while(car.accumulator+1e-9>=h){
    car.accumulator-=h;
    const angle=p.steerAngle/(1+Math.abs(car.speed)*.045);
    car.steer=approach(car.steer,-steer*angle,(Math.abs(steer)<.01?p.returnRate:p.steerRate)*h);
    if(brake)car.speed=approach(car.speed,0,p.braking*h);
    else if(Math.abs(throttle)>.06)car.speed=approach(car.speed,throttle>0?p.maxSpeed*throttle:p.reverseSpeed*throttle,(car.speed*throttle<-.03?11:p.acceleration)*h);
    else car.speed=approach(car.speed,0,2*h);
    const turn=car.speed/car.spec.wheelbase*Math.tan(car.steer)*h;
    const heading=car.yaw+turn*.5,d=car.speed*h,nx=car.x+Math.sin(heading)*d,nz=car.z+Math.cos(heading)*d,nyaw=car.yaw+turn;
    if(Math.abs(d)<1e-7)continue;
    const hit=car.area.check(nx,nz,nyaw,car.spec);
    if(!hit.ok||car.blocked(nx,nz,nyaw)){car.speed=0;car.reason=hit.ok?'car':hit.reason;continue;}
    car.x=nx;car.z=nz;car.y=hit.y;car.yaw=nyaw;car.distance+=d;
  }
}
export function tunePreviewWorld(world){
  for(const car of world?.cars||[]){
    if(car.kind!=='car'||car.physics.previewDriving35)continue;
    car.physics.previewDriving35=true;
    car.physics.update=function(dt,input){return updateParkDriving(this,dt,input)};
  }
  return world;
}
