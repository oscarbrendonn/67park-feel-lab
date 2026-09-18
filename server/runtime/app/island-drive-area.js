// Shared by server authority and rendered vehicle reconciliation. Surface
// coverage, rather than the road mesh alone, defines where a car can travel.
export function expandIslandDriveArea(area,{ground,water=()=>false,blocked=()=>false}){
 const check=(x,z,yaw,spec)=>{
  if(![x,z,yaw].every(Number.isFinite))return {ok:false,reason:'invalid'};
  const center=ground(x,z);if(!Number.isFinite(center)||water(x,z))return {ok:false,reason:'water-or-edge'};
  const s=Math.sin(yaw),c=Math.cos(yaw);let low=center,high=center;
  for(const [u,v] of spec?area.footprint(spec):area.points){
   const px=x+c*u+s*v,pz=z-s*u+c*v,y=ground(px,pz);
   if(!Number.isFinite(y)||water(px,pz))return {ok:false,reason:'water-or-edge'};
   low=Math.min(low,y);high=Math.max(high,y);
   // Normal curbs are traversable, but walls, roofs, cliffs and large steps
   // still fail the complete bumper/mirror footprint before moving there.
   if(high-low>.55||blocked(px,center+.6,pz))return {ok:false,reason:'obstacle'};
  }
  return {ok:true,y:center};
 };
 area.check=check;area.stats={...area.stats,roadOnly:false,driveSurfaces:'dry-ground-and-sidewalk',maxStep:.55};return area;
}
export function installIslandDriving(world){
 if(!world.traffic||world.traffic.freeDrive)return world;
 expandIslandDriveArea(world.traffic.area,{ground:(x,z)=>world.ground(x,z,true),water:world.water,blocked:world.treeBlocked});
 world.traffic.freeDrive=true;world.traffic.stats.roadOnly=false;
 world.renderer.domElement.dataset.islandDriveArea=JSON.stringify(world.traffic.area.stats);
 return world;
}
