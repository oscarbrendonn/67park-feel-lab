import {moveRocket,shotBlocked} from '../app/rocket-platforms.js';
import {ROCKETS as R,ROCKET_SPAWNS,ELEMENTS,arenaGround,segmentCircle,clamp} from '../app/rocket-rules.js';
export class RocketSimulation{
 constructor(roster,{teams,duration=R.duration}={}){
  this.duration=duration;this.age=0;this.over=false;this.serial=0;this.projectiles=[];this.events=[];
  this.players=roster.map((p,i)=>({id:p.id,index:i,team:teams?.[p.id]??i,x:ROCKET_SPAWNS[i][0],z:ROCKET_SPAWNS[i][1],y:arenaGround(...ROCKET_SPAWNS[i]),vy:0,grounded:true,jumpHeld:false,yaw:0,health:R.health,ammo:R.ammo,reload:0,cd:0,respawn:0,shield:R.shield,score:0,deaths:0,alive:true,placement:0,weapon:'launcher',skillCd:0,slow:0,burn:0,burnOwner:null,kx:0,kz:0,swing:0,element:'ice'}));
 }
 alive(){return this.players.filter(p=>p.alive);}
 event(e){this.events.push({id:++this.serial,at:this.age,...e});this.events=this.events.slice(-40);}
 eliminate(p,reason){if(!p.alive)return;p.alive=false;p.health=0;p.respawn=0;this.projectiles=this.projectiles.filter(q=>q.owner!==p.id);this.event({type:'left',player:p.id,reason});}
 finish(){if(this.over)return;this.over=true;const scores=new Map();for(const p of this.players)scores.set(p.team,(scores.get(p.team)||0)+p.score);const sorted=[...new Set(scores.values())].sort((a,b)=>b-a);for(const p of this.players)p.placement=sorted.indexOf(scores.get(p.team))+1;}
 visible(ax,az,bx,bz,ay=arenaGround(ax,az)+1.1,by=arenaGround(bx,bz)+1.1){const steps=Math.ceil(Math.hypot(bx-ax,bz-az,by-ay)/.15);for(let i=1;i<steps;i++)if(shotBlocked(ax+(bx-ax)*i/steps,ay+(by-ay)*i/steps,az+(bz-az)*i/steps))return false;return true;}
 aimSlope(p,ax,az){const target=this.players.filter(q=>q.alive&&!q.respawn&&q.team!==p.team).map(q=>({q,d:Math.hypot(q.x-p.x,q.z-p.z)})).filter(({q,d})=>d>.1&&((q.x-p.x)*ax+(q.z-p.z)*az)/d>.985&&this.visible(p.x,p.z,q.x,q.z,p.y+1.1,q.y+1.1)).sort((a,b)=>a.d-b.d)[0];return target?clamp((target.q.y-p.y)/target.d,-.8,.8):0;}
 damage(p,owner,amount,kind){if(!p.alive||p.respawn||p.shield||!owner?.alive||p.team===owner.team)return false;p.health=Math.max(0,p.health-amount);this.event({type:'hit',player:p.id,owner:owner.id,x:p.x,y:p.y,z:p.z,element:kind});if(!p.health){p.deaths++;p.respawn=R.respawn;p.burn=0;p.slow=0;p.kx=p.kz=0;owner.score++;this.event({type:'pop',player:p.id,owner:owner.id,x:p.x,y:p.y,z:p.z});}return true;}
 explode(q){
  this.event({type:'burst',x:q.x,y:(q.y??arenaGround(q.x,q.z)+1.1)-1.1,z:q.z,owner:q.owner,element:q.element});const owner=this.players.find(p=>p.id===q.owner);if(!owner?.alive)return;
  for(const p of this.players){
   const qy=q.y??arenaGround(q.x,q.z)+1.1,d=Math.hypot(p.x-q.x,p.z-q.z,p.y+1.1-qy);if(!p.alive||p.respawn>0||p.shield>0||p.team===owner.team||d>R.blastRadius)continue;
   // Cover blocks splash too, not merely the visible rocket.
   if(!this.visible(q.x,q.z,p.x,p.z,qy,p.y+1.1))continue;
   const amount=q.element==='ice'?22:q.element==='fire'?35:R.damage;
   if(this.damage(p,owner,Math.round(amount*(1-.45*d/R.blastRadius)),q.element)&&!p.respawn){
    if(q.element==='ice')p.slow=2.2;if(q.element==='fire'){p.burn=2;p.burnOwner=owner.id;}
    p.kx=(p.x-q.x)/(d||1)*3;p.kz=(p.z-q.z)/(d||1)*3;
   }
  }
 }
 step(controls=new Map()){
  if(this.over)return;const dt=1/60;this.age+=dt;
  for(const p of this.players){
   if(!p.alive)continue;p.shield=Math.max(0,p.shield-dt);p.cd=Math.max(0,p.cd-dt);p.skillCd=Math.max(0,p.skillCd-dt);p.swing=Math.max(0,p.swing-dt);p.slow=Math.max(0,p.slow-dt);
   if(p.respawn>0){p.respawn=Math.max(0,p.respawn-dt);if(!p.respawn){[p.x,p.z]=ROCKET_SPAWNS[p.index];p.y=arenaGround(p.x,p.z);p.vy=0;p.grounded=true;p.jumpHeld=false;p.health=R.health;p.ammo=R.ammo;p.shield=R.shield;p.reload=0;p.burn=p.slow=p.kx=p.kz=0;this.event({type:'arrival',player:p.id,x:p.x,z:p.z});}continue;}
   if(p.burn>0){const old=p.burn;p.burn=Math.max(0,p.burn-dt);if(Math.ceil(old*2)!==Math.ceil(p.burn*2))this.damage(p,this.players.find(q=>q.id===p.burnOwner),4,'fire');if(p.respawn)continue;}
   if(p.ammo<R.ammo){p.reload+=dt;if(p.reload>=R.reload){p.ammo++;p.reload=0;}}else p.reload=0;
   const c=controls.get(p.id)||{},safe=n=>typeof n==='number'&&Number.isFinite(n)?clamp(n,-1,1):0;
   let x=safe(c.x),z=safe(c.z),n=Math.max(1,Math.hypot(x,z));x=(x/n*R.speed*(p.slow>0?.48:1)+p.kx)*dt;z=(z/n*R.speed*(p.slow>0?.48:1)+p.kz)*dt;p.kx*=Math.exp(-7*dt);p.kz*=Math.exp(-7*dt);
   moveRocket(p,x,z,c.jump===true,dt);
   let ax=safe(c.ax),az=safe(c.az);n=Math.hypot(ax,az);if(n>.1)p.yaw=Math.atan2(ax,az);
   p.weapon=c.weapon==='bat'?'bat':'launcher';if(Object.hasOwn(ELEMENTS,c.element))p.element=c.element;
   if(c.skill===true&&p.skillCd===0){
    p.skillCd=ELEMENTS[p.element].cooldown;p.shield=0;this.event({type:'skill',player:p.id,x:p.x,y:p.y,z:p.z,element:p.element,yaw:p.yaw});
    if(p.element==='air'){for(const q of this.players){const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(Math.hypot(d,q.y-p.y)>5.5||!this.visible(p.x,p.z,q.x,q.z,p.y+1.1,q.y+1.1))continue;if(this.damage(q,p,16,'air')&&!q.respawn){q.kx=dx/(d||1)*20;q.kz=dz/(d||1)*20;}}}
    else this.projectiles.push({id:++this.serial,owner:p.id,team:p.team,x:p.x,y:p.y+1.1,z:p.z,dy:this.aimSlope(p,Math.sin(p.yaw),Math.cos(p.yaw)),dx:Math.sin(p.yaw),dz:Math.cos(p.yaw),life:1.65,element:p.element});
   }
   if(c.fire===true&&p.weapon==='bat'&&p.cd===0){
    p.cd=.72;p.swing=.34;p.shield=0;this.event({type:'swing',player:p.id,x:p.x,z:p.z,yaw:p.yaw});
    for(const q of this.players){const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d>3.2||Math.abs(q.y-p.y)>1.5||(dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))/(d||1)<.35||!this.visible(p.x,p.z,q.x,q.z,p.y+1.1,q.y+1.1))continue;if(this.damage(q,p,34,'bat')&&!q.respawn){q.kx=dx/(d||1)*12;q.kz=dz/(d||1)*12;}}
   }else if(c.fire===true&&p.weapon==='launcher'&&n>.1&&p.cd===0&&p.ammo>0){
    ax/=n;az/=n;p.ammo--;p.cd=R.cooldown;p.shield=0;
    this.projectiles.push({id:++this.serial,owner:p.id,team:p.team,x:p.x,y:p.y+1.1,z:p.z,dy:this.aimSlope(p,ax,az),dx:ax,dz:az,life:1.65});
    this.event({type:'shot',player:p.id,x:p.x,z:p.z});
   }
  }
  const remaining=[];
  for(const q of this.projectiles){
   const x=q.x+q.dx*R.rocketSpeed*dt,z=q.z+q.dz*R.rocketSpeed*dt,y=q.y+(q.dy||0)*R.rocketSpeed*dt;q.life-=dt;
   const hit=this.players.some(p=>p.alive&&!p.respawn&&p.team!==q.team&&Math.min(q.y,y)<=p.y+2&&Math.max(q.y,y)>=p.y&&segmentCircle(q.x,q.z,x,z,p.x,p.z,R.radius+.16));
   if(shotBlocked(x,y,z)){this.explode(q);continue;}
   q.x=x;q.y=y;q.z=z;if(hit||q.life<=0)this.explode(q);else remaining.push(q);
  }this.projectiles=remaining;
  const teams=new Map();for(const p of this.players)teams.set(p.team,(teams.get(p.team)||0)+p.score);
  if(this.age>=this.duration||[...teams.values()].some(s=>s>=R.target)||new Set(this.alive().map(p=>p.team)).size<=1)this.finish();
 }
 snapshot(){return{kind:'rockets',mode:'rockets',age:this.age,left:Math.max(0,this.duration-this.age),over:this.over,players:this.players.map(p=>({...p})),projectiles:this.projectiles.map(p=>({...p})),events:this.events.map(e=>({...e}))};}
}
