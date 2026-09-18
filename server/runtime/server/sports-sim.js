import {SPORTS,chargeAt,shotOrigin,shotTarget,shotVelocity,ballAt,shotPoints} from '../app/sports-rules.js';

/** Turn-based skill contests. Clients supply input, never scores/ball positions.
 * Basketball resolves the downward rim-plane crossing; penalties resolve the
 * goal plane against a server-controlled human keeper. One clock for everyone.
 */
export class SportsSimulation {
  constructor(roster,{mode='basket',teams={},shots=5,turnSeconds=20,practice=false}={}){
    if(!SPORTS[mode])throw Error('Unknown sport.');
    this.mode=mode;this.rules=SPORTS[mode];this.shots=shots;this.turnSeconds=turnSeconds;this.practice=practice;
    this.tick=0;this.over=false;this.events=[];this.eventId=0;this.turn=0;this.phase='aim';this.phaseTime=0;this.age=0;
    this.aim=[0,0];this.chargeStart=null;this.shot=null;this.lastResult=null;this.keeper={x:0,y:0,dive:0,cd:0};
    this.players=roster.map((p,i)=>({id:p.id,team:teams[p.id]??i,alive:true,placement:0,score:0,attempts:0,history:[]}));
    const grouped=new Map();for(const p of this.players){if(!grouped.has(p.team))grouped.set(p.team,[]);grouped.get(p.team).push(p);}
    // Alternate teams, including 2v2: A1 B1 A2 B2, never A1 A2 B1 B2.
    this.order=[];for(let i=0;i<Math.max(...[...grouped.values()].map(g=>g.length));i++)for(const g of grouped.values())if(g[i])this.order.push(g[i].id);
    this.total=this.players.length*shots;this.left=this.total*(turnSeconds+4);this.beginTurn();
  }
  event(type,data={}){this.events.push({n:++this.eventId,type,...data});if(this.events.length>30)this.events.shift();}
  alive(){return this.players.filter(p=>p.alive);}
  current(){return this.players.find(p=>p.id===this.order[this.turn%this.order.length]);}
  defender(){const p=this.current(),opponents=this.players.filter(q=>q.alive&&q.team!==p.team);return opponents[Math.floor(this.turn/this.order.length)%Math.max(1,opponents.length)]?.id||null;}
  beginTurn(){
    if(this.turn>=this.total){this.finish();return;}
    if(!this.current().alive){this.turn++;this.beginTurn();return;}
    this.phase='aim';this.phaseTime=0;this.aim=[0,0];this.chargeStart=null;this.shot=null;
    this.keeper={x:0,y:0,dive:0,cd:0};this.event('turn',{id:this.current().id,turn:this.turn});
  }
  input(id,m){
    if(this.over)return;
    const numeric=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1;
    if(this.phase==='aim'&&id===this.current().id){
      if(m.action==='aim'){if(this.mode==='basket')return;if(!numeric(m.x)||!numeric(m.y))return;this.aim=[m.x,m.y];}
      else if(m.action==='charge'&&this.chargeStart===null)this.chargeStart=this.tick;
      else if(m.action==='cancel')this.chargeStart=null;
      else if(m.action==='release'&&this.chargeStart!==null){
        const charge=chargeAt((this.tick-this.chargeStart)/60);this.launch(charge);
      }
    }
    if(this.mode==='penalty'&&id===this.defender()&&['aim','flight'].includes(this.phase)){
      if(m.action==='keeper'&&numeric(m.x)){this.keeperInput=m.x;this.keeperInputAt=this.tick;}
      if(m.action==='dive'&&this.keeper.cd<=0){this.keeper.dive=.65;this.keeper.cd=1.15;}
    }
  }
  launch(charge){
    const p=this.current(),round=p.attempts,origin=shotOrigin(this.mode,round),target=shotTarget(this.mode,...this.aim,charge),flight=this.rules.flightSeconds;
    this.shot={origin,velocity:shotVelocity(origin,target,flight),age:0,p:origin.slice(),charge,round,resolved:false};
    this.phase='flight';this.phaseTime=0;p.attempts++;
    this.event('shot',{id:p.id,origin,charge,turn:this.turn});
  }
  resolve(scored,reason){
    if(this.phase==='result'||this.over)return;
    const p=this.current(),points=scored?shotPoints(this.mode,this.shot?.round??p.attempts-1):0;
    p.score+=points;p.history.push(points);this.lastResult={id:p.id,team:p.team,points,reason,turn:this.turn};
    this.phase='result';this.phaseTime=0;if(this.shot)this.shot.resolved=true;
    this.event('score',this.lastResult);
  }
  eliminate(p,reason='left'){
    if(!p?.alive||this.over)return;p.alive=false;this.event('out',{id:p.id,reason});
    const allTeams=new Set(this.players.map(q=>q.team)),liveTeams=new Set(this.alive().map(q=>q.team));
    if(this.alive().length===0||(allTeams.size>1&&liveTeams.size<2)){this.finish();return;}
    if(p.id===this.current().id){this.turn++;this.beginTurn();}
  }
  finish(){
    if(this.over)return;this.over=true;this.phase='finished';
    const scores=this.teamScores(),live=new Set(this.alive().map(p=>p.team));
    const ranked=scores.sort((a,b)=>(Number(live.has(b.team))-Number(live.has(a.team)))||b.score-a.score);
    ranked.forEach((team,i)=>{const prev=ranked[i-1];team.placement=prev&&team.score===prev.score&&live.has(team.team)===live.has(prev.team)?prev.placement:i+1;});
    for(const p of this.players)p.placement=ranked.find(t=>t.team===p.team).placement;
    this.event('result');
  }
  teamScores(){const teams=new Map();for(const p of this.players){if(!teams.has(p.team))teams.set(p.team,{team:p.team,score:0,attempts:0});const t=teams.get(p.team);t.score+=p.score;t.attempts+=p.attempts;}return [...teams.values()];}
  step(){
    if(this.over)return;this.tick++;this.age+=1/60;this.phaseTime+=1/60;this.left=Math.max(0,this.total*(this.turnSeconds+4)-this.age);
    if(this.practice&&this.mode==='penalty'){this.keeperInput=Math.sin(this.tick/75)*.7;this.keeperInputAt=this.tick;}
    const k=this.keeper;k.cd=Math.max(0,k.cd-1/60);k.dive=Math.max(0,k.dive-1/60);k.y=k.dive>0?Math.sin((.65-k.dive)/.65*Math.PI)*1.45:0;
    k.x+=Math.max(-.09,Math.min(.09,(this.tick-(this.keeperInputAt||0)<30?this.keeperInput||0:0)*(this.rules.keeperRange||0)-k.x));
    if(this.phase==='aim'){
      if(!this.practice&&this.phaseTime>=this.turnSeconds){this.current().attempts++;this.resolve(false,'Time up');}
      else if(this.chargeStart!==null&&this.tick-this.chargeStart>=90)this.launch(1);
    }else if(this.phase==='flight'){
      const s=this.shot,prev=s.p;s.age+=1/60;s.p=ballAt(s.origin,s.velocity,s.age);
      // Sweep the ball against the keeper before the goal plane. A save
      // starts a new outward trajectory shared by every client's snapshot.
      if(this.mode==='penalty'&&!s.deflected){
        const plane=this.rules.target[2]+.45;
        if(prev[2]>plane&&s.p[2]<=plane){
          const t=(prev[2]-plane)/(prev[2]-s.p[2]);
          const x=prev[0]+t*(s.p[0]-prev[0]),y=prev[1]+t*(s.p[1]-prev[1]);
          const radius=this.rules.ballRadius;
          if(Math.abs(x-k.x)<(k.dive>0?1:.62)+radius&&y<k.y+1.65+radius&&y>k.y-radius){
            s.p=[x,y,plane+.02];s.origin=s.p.slice();s.velocity=[Math.sign(x-k.x||1)*3.8,3.2,Math.max(7,Math.abs(s.velocity[2])*.55)];s.age=0;s.deflected=true;
            this.event('save',{id:this.defender(),position:s.p.slice()});this.resolve(false,'Saved');return;
          }
        }
      }
      if(this.mode==='basket'&&prev[1]>=this.rules.target[1]&&s.p[1]<this.rules.target[1]){
        const a=(prev[1]-this.rules.target[1])/(prev[1]-s.p[1]),x=prev[0]+a*(s.p[0]-prev[0]),z=prev[2]+a*(s.p[2]-prev[2]);
        const scored=Math.hypot(x-this.rules.target[0],z-this.rules.target[2])<this.rules.rimRadius-this.rules.ballRadius-.02;this.resolve(scored,scored?'Basket':'Miss');
      }else if(this.mode==='penalty'&&prev[2]>this.rules.target[2]&&s.p[2]<=this.rules.target[2]){
        const a=(prev[2]-this.rules.target[2])/(prev[2]-s.p[2]),x=prev[0]+a*(s.p[0]-prev[0]),y=prev[1]+a*(s.p[1]-prev[1]);
        const inside=Math.abs(x)<this.rules.goalHalfWidth-this.rules.ballRadius&&y>this.rules.ballRadius&&y<this.rules.goalHeight-this.rules.ballRadius;
        this.resolve(inside,inside?'Goal':'Wide');
      }else if(s.age>3||s.p[1]<this.rules.ballRadius){this.resolve(false,'Miss');}
    }else if(this.phase==='result'){
      if(this.shot){const s=this.shot;s.age+=1/60;s.p=ballAt(s.origin,s.velocity,s.age);s.p[1]=Math.max(this.rules.ballRadius,s.p[1]);s.p[2]=Math.max(this.rules.target[2]-1.5,s.p[2]);}
      if(this.phaseTime>=2){this.turn++;this.keeperInput=0;this.beginTurn();}
    }
  }
  snapshot(){return {kind:'sport',mode:this.mode,tick:this.tick,left:this.left,over:this.over,phase:this.phase,phaseTime:this.phaseTime,turn:this.turn,total:this.total,shots:this.shots,turnSeconds:this.turnSeconds,current:this.current()?.id,defender:this.defender(),aim:this.aim,charge:this.chargeStart===null?null:chargeAt((this.tick-this.chargeStart)/60),ball:this.shot?{p:this.shot.p,age:this.shot.age,origin:this.shot.origin,velocity:this.shot.velocity,charge:this.shot.charge}:null,origin:shotOrigin(this.mode,this.current()?.attempts??0),keeper:{...this.keeper},lastResult:this.lastResult,teams:this.teamScores(),events:this.events,players:this.players.map(p=>({...p}))};}
}
