/** Geometry-free version of the candy arena, shared by authoritative rooms. */
export function arenaSolids(){
 const a=[],box=(w,h,d,x,y,z,yaw=0)=>a.push({x,z,w,d,yaw,top:y+h/2});
 for(const s of [-1,1])for(const q of [-1,1]){box(10.5,1.15,.78,q*7.95,.575,s*15.65);box(.78,1.15,10.5,s*15.65,.575,q*7.95);}
 for(const x of [-1,1])for(const z of [-1,1])a.push({x:x*14.4,z:z*14.4,w:3.5,d:.78,yaw:x*z*Math.PI/4,top:1.15});
 for(const s of [-1,1])for(const q of [-1,1]){box(.86,1.2,1.03,q*2.65,.60,s*15.65);box(1.03,1.2,.86,s*15.65,.60,q*2.65);}
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const x=sx*11.8,z=sz*11.8;
  a.push({x,z:z+sz*.85,w:4.5,d:1.2,yaw:0,top:1.08},{x:x+sx*1.69,z:z-sz*.2,w:1.12,d:3.4,yaw:0,top:1.08});
  box(4.35,.78,1.55,sx*7.65,.39,sz*6.25,-sx*sz*.53);
  a.push({x:sx*11.3,z:sz*5.4,w:2.84,d:2.9,yaw:0,top:1.125,ramp:true});
 }
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(let i=0;i<5;i++){const q=angle+(i-2)*.1;a.push({x:5.15*Math.cos(q),z:-5.15*Math.sin(q),w:.56,d:.62,yaw:Math.PI/2+q,top:.81});}
 for(const x of [-1,1])for(const z of [-1,1])a.push({x:x*13.8,z:z*13.8,w:.42,d:.42,yaw:0,top:1.4});
 return a;
}
export function createArenaPhysics(solids=arenaSolids()){
 function local(s,x,z){const c=Math.cos(s.yaw),n=Math.sin(s.yaw),dx=x-s.x,dz=z-s.z;return{x:c*dx-n*dz,z:n*dx+c*dz};}
 function sampleGround(x,z){let y=Math.hypot(x,z)<1.2?.48:0;for(const s of solids){const p=local(s,x,z);if(Math.abs(p.x)<s.w/2&&Math.abs(p.z)<s.d/2)y=Math.max(y,s.ramp?Math.min(s.top,Math.max(0,(1.45-Math.abs(p.z))*1.42)):s.top);}return{y,box2:null};}
 function resolveContacts(state){const p=state.pos,v=state.vel;for(let pass=0;pass<2;pass++)for(const s of solids){if(s.ramp||s.top<=p.y+.55)continue;const q=local(s,p.x,p.z),hx=s.w/2+.35,hz=s.d/2+.35;if(Math.abs(q.x)>=hx||Math.abs(q.z)>=hz)continue;let dx=0,dz=0;if(hx-Math.abs(q.x)<hz-Math.abs(q.z))dx=Math.sign(q.x||1)*(hx-Math.abs(q.x));else dz=Math.sign(q.z||1)*(hz-Math.abs(q.z));const c=Math.cos(s.yaw),n=Math.sin(s.yaw);p.x+=c*dx+n*dz;p.z+=-n*dx+c*dz;const vx=c*v.x-n*v.z,vz=n*v.x+c*v.z;v.x=c*(dx?0:vx)+n*(dz?0:vz);v.z=-n*(dx?0:vx)+c*(dz?0:vz);}}
 return{bounds:14.6,sampleGround,resolveContacts};
}
