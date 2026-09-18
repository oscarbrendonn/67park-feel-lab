// Oriented bumper footprints; the old length-radius circles blocked adjacent
// lanes long before two actual vehicles touched.
export function vehiclesOverlap(a,b){
 for(const angle of [a.yaw,b.yaw,a.yaw+Math.PI/2,b.yaw+Math.PI/2]){
  const ax=Math.sin(angle),az=Math.cos(angle);
  const radius=p=>p.spec.halfWidth*Math.abs(Math.cos(p.yaw)*ax-Math.sin(p.yaw)*az)+p.spec.halfLength*Math.abs(Math.sin(p.yaw)*ax+Math.cos(p.yaw)*az);
  if(Math.abs((a.x-b.x)*ax+(a.z-b.z)*az)>=radius(a)+radius(b)+.08)return false;
 }
 return true;
}
