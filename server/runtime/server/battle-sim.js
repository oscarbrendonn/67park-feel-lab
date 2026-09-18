import {createPlayerState,stepPlayer} from '../source-claude/src/player.js';
import {createArenaPhysics} from '../app/arena-physics.js';
export const RULES=Object.freeze({dt:1/60,duration:150,balloons:3,maxBalloons:5,dashTime:.30,dashCd:1.6,dashSpeed:11.5,contact:1.05,immune:1.2,bumpSpeed:7.5,boostMult:1.45,boostTime:5,itemFirst:4,itemEvery:3.5,itemMax:4});
const EMPTY={x:0,z:0,jump:false,dash:false,sprint:false};
/** Claude's movement, dash/pop, catch-up items and final-gust tuning.
 * Online differences: every human is equal; ties share a rank; an eliminated
 * client spectates instead of ending the whole room. No client score events.
 */
export class BattleSimulation{
 constructor(roster,{random=Math.random,duration=RULES.duration}={}){
  this.random=random;this.duration=duration;this.left=duration;this.tick=0;this.over=false;this.items=[];this.nextItem=RULES.itemFirst;this.itemId=0;this.events=[];this.eventId=0;this.physics=createArenaPhysics();
  this.players=roster.map((p,i)=>{const a=i*Math.PI*2/roster.length,s=createPlayerState(Math.sin(a)*8,Math.cos(a)*8);s.yaw=Math.atan2(-s.pos.x,-s.pos.z);return{id:p.id,state:s,balloons:3,alive:true,placement:0,pops:0,shield:0,boostT:0,dashT:0,dashCd:0,popImmune:0,dashDir:{x:0,z:-1},jumpSerial:0};});
 }
 event(type,data){this.events.push({n:++this.eventId,type,...data});if(this.events.length>24)this.events.shift();}
 alive(){return this.players.filter(p=>p.alive);}
 eliminate(p,reason='pop'){if(!p.alive)return;p.alive=false;p.placement=this.alive().length+1;p.balloons=0;this.event('out',{id:p.id,reason});}
 finish(){if(this.over)return;this.over=true;const ranked=this.alive().sort((a,b)=>b.balloons-a.balloons||b.pops-a.pops);ranked.forEach((p,i)=>{p.placement=i>0&&p.balloons===ranked[i-1].balloons&&p.pops===ranked[i-1].pops?ranked[i-1].placement:i+1;});this.event('result',{});}
 pop(att,vic){if(!vic.alive||vic.popImmune>0)return;vic.popImmune=RULES.immune;const dx=vic.state.pos.x-att.state.pos.x,dz=vic.state.pos.z-att.state.pos.z,d=Math.hypot(dx,dz)||1;vic.state.vel.x+=dx/d*6;vic.state.vel.z+=dz/d*6;att.state.vel.x-=dx/d*2.5;att.state.vel.z-=dz/d*2.5;
  if(vic.shield){vic.shield=0;this.event('shield',{id:vic.id});return;}
  vic.balloons--;att.pops++;this.event('pop',{id:vic.id,by:att.id,x:vic.state.pos.x,y:vic.state.pos.y+2,z:vic.state.pos.z});if(vic.balloons<=0)this.eliminate(vic);
 }
 item(p){const r=this.random(),deficit=Math.max(...this.alive().map(q=>q.balloons))-p.balloons,can=p.balloons<5;let type=deficit>=1?(can&&r<.45?'balloon':r<.75?'shield':'boost'):(r<.40?'shield':can&&r<.52?'balloon':'boost');if(type==='balloon')p.balloons++;else if(type==='shield')p.shield=1;else p.boostT=5;this.event('item',{id:p.id,item:type});}
 step(controls=new Map()){
  if(this.over)return;const dt=RULES.dt;this.tick++;this.left=Math.max(0,this.left-dt);const gust=this.left<=Math.min(45,this.duration*.3);
  if(this.left<=0){this.finish();return;}
  this.nextItem-=dt;if(this.nextItem<=0){this.nextItem=gust?2:3.5;if(this.items.length<4){const a=this.random()*Math.PI*2,r=2.5+this.random()*8.5;this.items.push({id:++this.itemId,x:Math.cos(a)*r,z:Math.sin(a)*r});}}
  for(const p of this.players){if(!p.alive)continue;const input=controls.get(p.id)||EMPTY;let x=input.x,z=input.z;const n=Math.hypot(x,z);if(n>1){x/=n;z/=n;}
   if(input.dash&&p.dashCd<=0&&p.dashT<=0){p.dashDir=n>.001?{x:x/(Math.hypot(x,z)||1),z:z/(Math.hypot(x,z)||1)}:{x:Math.sin(p.state.yaw),z:Math.cos(p.state.yaw)};p.dashT=.30;p.dashCd=gust?.95:1.6;this.event('dash',{id:p.id});}
   const mult=p.boostT>0?1.45:1,env={bounds:14.6,sampleGround:()=>{this.physics.resolveContacts(p.state);return this.physics.sampleGround(p.state.pos.x,p.state.pos.z);}};
   stepPlayer(p.state,{dirX:x*mult,dirZ:z*mult,moving:n>.001,jumpHeld:input.jump,sprintHeld:input.sprint,grabPressed:false},dt,env);
   if(p.state.jumpEvent)p.jumpSerial++;
   if(p.dashT>0){p.dashT-=dt;p.state.vel.x=p.dashDir.x*11.5;p.state.vel.z=p.dashDir.z*11.5;}
   p.dashCd=Math.max(0,p.dashCd-dt);p.boostT=Math.max(0,p.boostT-dt);p.popImmune=Math.max(0,p.popImmune-dt);
  }
  const live=this.alive();for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j];if(!a.alive||!b.alive||Math.hypot(a.state.pos.x-b.state.pos.x,a.state.pos.z-b.state.pos.z)>1.05||Math.abs(a.state.pos.y-b.state.pos.y)>1.5)continue;const ad=a.dashT>0,bd=b.dashT>0;if(ad&&!bd)this.pop(a,b);else if(bd&&!ad)this.pop(b,a);else if(ad&&bd){this.pop(a,b);this.pop(b,a);}else if(Math.hypot(b.state.vel.x-a.state.vel.x,b.state.vel.z-a.state.vel.z)>7.5){if(Math.hypot(a.state.vel.x,a.state.vel.z)>Math.hypot(b.state.vel.x,b.state.vel.z))this.pop(a,b);else this.pop(b,a);}}
  for(const item of [...this.items])for(const p of this.alive())if(Math.hypot(p.state.pos.x-item.x,p.state.pos.z-item.z)<.95){this.item(p);this.items.splice(this.items.indexOf(item),1);break;}
  if(this.alive().length<=1)this.finish();
 }
 snapshot(){return{tick:this.tick,left:this.left,over:this.over,items:this.items,events:this.events,players:this.players.map(p=>({id:p.id,p:[p.state.pos.x,p.state.pos.y,p.state.pos.z],v:[p.state.vel.x,p.state.vel.y,p.state.vel.z],yaw:p.state.yaw,grounded:p.state.grounded,jumpSerial:p.jumpSerial,balloons:p.balloons,alive:p.alive,placement:p.placement,pops:p.pops,shield:p.shield,boost:p.boostT,dash:p.dashT,cd:p.dashCd}))};}
}
