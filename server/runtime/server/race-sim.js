import {RACE,TRACK_LENGTH,checkpointSpacing,nearestRoad,mod,startingGrid} from '../app/race-track.js';
import {createRacer,stepRacer,collideRacers,recoverRacer} from '../app/race-physics.js';

/** Server-owned race: clients submit pedal / steering inputs, never positions,
 * lap counts, finish times or ranks. Gates must be crossed in forward order. */
export class RaceSimulation{
 constructor(roster,{teams={},practice=false,laps=RACE.laps,duration=RACE.duration}={}){
  this.kind='race';this.mode='race';this.tick=0;this.age=0;this.left=duration;this.duration=duration;this.laps=laps;this.practice=practice;this.over=false;this.events=[];this.eventId=0;
  this.players=roster.map((p,i)=>({...createRacer(p.id,i),team:teams[p.id]??i,alive:true,finished:false,finishTime:null,finishOrder:0,placement:0,progress:startingGrid(i).unwrapped,previousS:mod(startingGrid(i).unwrapped,TRACK_LENGTH),nextGate:1,lap:1,score:0,lastInput:-1,resetLock:0}));
 }
 event(type,data={}){this.events.push({n:++this.eventId,type,...data});if(this.events.length>24)this.events.shift();}
 alive(){return this.players.filter(p=>p.alive);}
 eliminate(p,reason='left'){
  if(!p?.alive||this.over)return;p.alive=false;p.vx=p.vz=p.speed=0;this.event('out',{id:p.id,reason});
  // A finisher can return to the lobby without forfeiting earned team points.
  const teams=new Set(this.players.map(q=>q.team)),remaining=new Set(this.players.filter(q=>q.alive||q.finished).map(q=>q.team));
  if(teams.size>1&&remaining.size<=1){this.forfeitTeam=remaining.values().next().value;this.finish();}
 }
 checkpoint(p){
  const s=nearestRoad(p.x,p.z).s;let delta=s-p.previousS;if(delta>TRACK_LENGTH/2)delta-=TRACK_LENGTH;if(delta<-TRACK_LENGTH/2)delta+=TRACK_LENGTH;
  p.previousS=s;
  // This is also a guard against discontinuous recovery or future net inputs.
  if(Math.abs(delta)>RACE.maxSpeed/60+1.4)return;
  p.progress+=delta;
  const gate=p.nextGate*checkpointSpacing;
  if(p.progress>=gate&&p.progress-gate<2){
   p.nextGate++;
   if((p.nextGate-1)%RACE.checkpoints===0){
    const completed=(p.nextGate-1)/RACE.checkpoints;p.lap=Math.min(this.laps,completed+1);this.event('lap',{id:p.id,lap:completed});
    if(completed>=this.laps){p.finished=true;p.finishTime=this.age;p.finishOrder=this.players.filter(q=>q.finished).length;p.score=this.players.length+1-p.finishOrder;p.vx=p.vz=p.speed=0;this.event('finish',{id:p.id,place:p.finishOrder});}
   }
  }
 }
 standings(){return [...this.players].sort((a,b)=>Number(b.finished)-Number(a.finished)||(a.finished?a.finishTime-b.finishTime:0)||Number(b.alive)-Number(a.alive)||b.nextGate-a.nextGate||b.progress-a.progress||a.index-b.index);}
 teamScores(){
  const teams=new Map();for(const p of this.players){if(!teams.has(p.team))teams.set(p.team,{team:p.team,score:0,finished:0,time:0});const t=teams.get(p.team);t.score+=p.score;t.finished+=Number(p.finished);t.time+=p.finishTime??this.duration;}
  return [...teams.values()];
 }
 finish(){
  if(this.over)return;this.over=true;
  const rank=this.standings();for(let i=0;i<rank.length;i++)rank[i].racePlace=i+1;
  const compareTeams=(a,b)=>Number(b.team===this.forfeitTeam)-Number(a.team===this.forfeitTeam)||b.score-a.score||b.finished-a.finished||a.time-b.time;
  const teams=this.teamScores().sort(compareTeams);
  const isTeam=new Set(this.players.map(p=>p.team)).size<this.players.length;
  for(const p of this.players)p.placement=isTeam?teams.filter(t=>compareTeams(t,teams.find(q=>q.team===p.team))<0).length+1:p.racePlace;
  this.event('result');
 }
 step(controls=new Map()){
  if(this.over)return;this.tick++;this.age=this.tick/60;this.left=Math.max(0,this.duration-this.age);
  for(const p of this.players){
   if(!p.alive||p.finished)continue;const c=controls.get(p.id)||{};p.lastInput=c.seq??p.lastInput;p.resetLock=Math.max(0,p.resetLock-1/60);
   if(c.reset===true&&p.resetAge>=5){
    const target=(p.nextGate-1)*checkpointSpacing+.1;
    if(recoverRacer(p,target)){p.progress=target;p.previousS=mod(target,TRACK_LENGTH);p.resetLock=1.5;this.event('recover',{id:p.id});}
   }
   stepRacer(p,p.resetLock>0?{brake:true}:c);this.checkpoint(p);
  }
  collideRacers(this.players);
  if(this.age>=this.duration||this.alive().every(p=>p.finished)||!this.alive().length)this.finish();
 }
 snapshot(){
  const rank=this.standings();return{kind:'race',mode:'race',tick:this.tick,age:this.age,left:this.left,laps:this.laps,over:this.over,teams:this.teamScores(),events:this.events,players:this.players.map(p=>({id:p.id,index:p.index,team:p.team,x:p.x,y:p.y,z:p.z,yaw:p.yaw,vx:p.vx,vz:p.vz,speed:p.speed,steer:p.steer,travel:p.travel,wallHit:p.wallHit,alive:p.alive,finished:p.finished,finishTime:p.finishTime,finishOrder:p.finishOrder,placement:p.placement,progress:p.progress,lap:p.lap,nextGate:p.nextGate,rank:rank.indexOf(p)+1,score:p.score,lastInput:p.lastInput,resetLock:p.resetLock}))};
 }
}
