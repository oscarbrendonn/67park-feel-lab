import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {OnlineHub} from './online-hub.js';
import {SportsSimulation} from './sports-sim.js';
import {RaceSimulation} from './race-sim.js';
import {RocketSimulation} from './rocket-sim.js';
import {IslandWorld} from './island-world.js';
import {isSport} from '../app/sports-rules.js';

const hash=token=>createHash('sha256').update(token).digest('hex');
const modes=['balloon','basket','penalty','race','rockets'];
const teamGame=mode=>isSport(mode)||mode==='race'||mode==='rockets';
/** Extends the existing island protocol; Balloon Battle keeps its original rules. */
export class CommunityHub extends OnlineHub {
  constructor(options={}){
    super(options);this.friends=new Map();this.requests=new Map();this.profiles=new Map();this.socialPath=options.socialPath;this.worldSource=options.worldSource;this.worlds=new Map();this.worldAt=this.now();this.worldBroadcast=0;
    if(this.socialPath&&fs.existsSync(this.socialPath)){
      // Fail visibly on corrupt data; never silently overwrite a friends list.
      const saved=JSON.parse(fs.readFileSync(this.socialPath,'utf8'));
      if(saved.version!==1||!Array.isArray(saved.profiles)||!Array.isArray(saved.friends))throw Error('Invalid social store. Restore data/social.json from a backup.');
      this.profiles=new Map(saved.profiles);this.friends=new Map(saved.friends.map(([id,ids])=>[id,new Set(ids)]));
      this.requests=new Map(saved.requests||[]);
    }
  }
  session(token){
    if(token&&this.sessions.has(token))return super.session(token);
    const previous=token?this.profiles.get(hash(token)):null,result=super.session();
    if(previous){
      const p=result.player,old=p.id,l=this.lobbies.get(p.lobbyId);
      this.players.delete(old);l?.members.delete(old);
      Object.assign(p,{id:previous.id,friendCode:previous.friendCode,name:previous.name,color:previous.color});
      this.players.set(p.id,p);l?.members.add(p.id);this.sessions.delete(result.token);this.sessions.set(token,p);
      result.token=token;result.fresh=false;
    }
    this.recordProfile(result.player,result.token);return result;
  }
  recordProfile(p,token){
    if(!token)token=[...this.sessions].find(([,value])=>value===p)?.[0];if(!token)return;
    this.profiles.set(hash(token),{id:p.id,friendCode:p.friendCode,name:p.name,color:p.color,lastSeen:this.now()});this.saveSocial();
  }
  saveSocial(){
    if(!this.socialPath)return;clearTimeout(this.socialTimer);this.socialTimer=setTimeout(()=>{try{this.flushSocial();this.storageError=null;}catch(e){this.storageError=String(e.message);console.error('Social storage unavailable; existing file retained.');}},250);this.socialTimer.unref();
  }
  flushSocial(){
    if(!this.socialPath)return;clearTimeout(this.socialTimer);
    fs.mkdirSync(path.dirname(this.socialPath),{recursive:true});
    const tmp=this.socialPath+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify({version:1,profiles:[...this.profiles],friends:[...this.friends].map(([id,ids])=>[id,[...ids]]),requests:[...this.requests]},null,2),{mode:0o600});
    fs.renameSync(tmp,this.socialPath);
  }
  profile(p,m){super.profile(p,m);this.recordProfile(p);}
  send(ws,message){
    if(message.t==='state')message={...message,invites:message.invites.map(i=>{const source=this.invites.get(i.id);return {...i,team:source?.team,mode:source?.kind==='match'?this.rooms.get(source.code)?.mode:undefined};})};
    return super.send(ws,message);
  }
  publicPlayer(p){
    const r=this.rooms.get(p.roomId);return {...super.publicPlayer(p),mode:r?.mode||null,roomStatus:r?.status||null};
  }
  person(id){const live=this.players.get(id);if(live)return this.publicPlayer(live);const p=[...this.profiles.values()].find(p=>p.id===id);return p?{...p,connected:false,roomId:null}:null;}
  state(p){
    super.state(p);if(!p?.online||!this.friends)return;
    this.send(p.online,{t:'social',friends:[...(this.friends.get(p.id)||[])].map(id=>this.person(id)).filter(Boolean),requests:[...this.requests.values()].filter(r=>r.to===p.id&&r.expires>this.now()).map(r=>({...r,fromPlayer:this.person(r.from)})),outgoing:[...this.requests.values()].filter(r=>r.from===p.id&&r.expires>this.now()).map(r=>r.to)});
  }
  attach(p,ws,channel){super.attach(p,ws,channel);if(channel==='online'){
    const w=this.islandWorld(p);if(w){w.resume(p.id);this.send(ws,{...w.snapshot(this.now()),island:p.lobbyId});}
    // OnlineHub already clears the active socket before this listener. An
    // older, replaced socket must not release the newer connection's seat.
    ws.on('close',()=>{if(!p.online)this.releaseWorld(p);});
    for(const id of this.friends.get(p.id)||[])this.state(this.players.get(id));
    ws.on('close',()=>{for(const id of this.friends.get(p.id)||[])this.state(this.players.get(id));});
  }}
  roomInfo(r){const info=super.roomInfo(r);return info?{...info,mode:r.mode||'balloon',teamMode:r.teamMode||'solo',teams:Object.fromEntries(r.teams||[])}:null;}
  roomChanged(r){
    super.roomChanged(r);if(!r)return;const islands=new Set([...r.members].map(id=>this.players.get(id)?.lobbyId));
    for(const p of this.players.values())if(!r.members.has(p.id)&&islands.has(p.lobbyId))this.state(p);
  }
  newRoom(p,capacity,mode='balloon',teamMode='solo'){
    if(!modes.includes(mode))throw Error('Choose a supported game.');
    if(mode==='rockets'&&capacity!==4)throw Error('Candy Rockets needs four players.');
    if(!['solo','teams'].includes(teamMode)||teamMode==='teams'&&(!teamGame(mode)||capacity!==4))throw Error('Team matches need 4 players: 2 vs 2.');
    this.releaseWorld(p);const r=super.newRoom(p,capacity);r.mode=mode;r.teamMode=teamMode;r.teams=new Map([[p.id,0]]);return r;
  }
  requireEditable(r){if(r.status!=='waiting')throw Error('Cancel matchmaking or finish the match before changing the team.');}
  joinCommunityRoom(p,r,team){
    if(r?.teamMode==='teams'&&!r.members.has(p.id)){
      const counts=[0,0];for(const id of r.members)counts[r.teams.get(id)]++;
      team=team??(counts[0]<=counts[1]?0:1);
      if(![0,1].includes(team)||counts[team]>=2)throw Error('That team is full.');
      // super.joinRoom may immediately matchmake. Assign before it runs.
      r.teams.set(p.id,team);
    }
    try{super.joinRoom(p,r);}catch(e){if(r&&!r.members.has(p.id))r.teams?.delete(p.id);throw e;}
    if(r&&!r.teams?.has(p.id)){r.teams??=new Map();r.teams.set(p.id,[...r.members].indexOf(p.id));}
    this.roomChanged(r);
  }
  leaveRoom(p){const r=this.rooms.get(p.roomId);super.leaveRoom(p);r?.teams?.delete(p.id);if(r)this.roomChanged(r);}
  prepare(r){
    if(r.teamMode==='teams'&&r.members.size===r.capacity){const counts=[0,0];for(const id of r.members)counts[r.teams.get(id)]++;if(counts[0]!==2||counts[1]!==2)throw Error('Each team needs two players.');}
    super.prepare(r);
  }
  matchmake(){
    // Partition by BOTH game and requested team format; keep each queued group.
    let changed=true;
    while(changed){changed=false;const list=[...this.rooms.values()].filter(r=>r.status==='queued').sort((a,b)=>a.created-b.created);
      for(let i=0;i<list.length;i++){
        const a=list[i];if(a.members.size===a.capacity){this.prepare(a);changed=true;break;}
        for(const b of list.slice(i+1)){
          if(a.mode!==b.mode||a.teamMode!==b.teamMode||a.capacity!==b.capacity||a.members.size+b.members.size>a.capacity)continue;
          let assignments;
          if(a.teamMode==='teams'){
            // All members of a party seeking opponents must fit on ONE team.
            if(b.members.size>2)continue;const counts=[0,0];for(const id of a.members)counts[a.teams.get(id)]++;
            const team=[0,1].find(t=>counts[t]+b.members.size<=2);if(team===undefined)continue;
            assignments=[...b.members].map(id=>[id,team]);
          }else assignments=[...b.members].map((id,j)=>[id,a.members.size+j]);
          for(const [id,team]of assignments){a.members.add(id);a.teams.set(id,team);this.players.get(id).roomId=a.code;}
          this.rooms.delete(b.code);changed=true;break;
        }
        if(changed)break;
      }
    }
    this.allState();
  }
  invitation(p,m){
    if(m.kind==='match'){
      const r=this.requireRoom(p);if(r.teamMode==='teams'){
        if(r.status!=='waiting')throw Error('Cancel matchmaking before inviting a teammate.');
        const team=m.team??r.teams.get(p.id),count=[...r.members].filter(id=>r.teams.get(id)===team).length;
        if(![0,1].includes(team)||count>=2)throw Error('That team is full.');
        super.invitation(p,m);
        const target=[...this.players.values()].find(q=>q.id===m.target||q.friendCode===String(m.friendCode||'').toUpperCase());
        const invite=[...this.invites.values()].find(i=>i.from===p.id&&i.to===target?.id&&i.kind==='match'&&i.expires>this.now());
        if(invite){invite.team=team;this.state(target);}return;
      }
    }
    super.invitation(p,m);
  }
  friendAction(p,m){
    if(m.t==='friend.request'){
      const target=m.target?this.person(m.target):[...this.profiles.values()].find(q=>q.friendCode===String(m.friendCode||'').trim().toUpperCase());
      if(!target||target.id===p.id)throw Error('Enter another player’s friend code.');
      if(this.friends.get(p.id)?.has(target.id))throw Error('You are already friends.');
      if((this.friends.get(p.id)?.size||0)>=100)throw Error('Your friends list is full.');
      if([...this.requests.values()].filter(r=>r.from===p.id&&r.expires>this.now()).length>=20)throw Error('Too many pending friend requests.');
      if([...this.requests.values()].some(r=>r.expires>this.now()&&((r.from===p.id&&r.to===target.id)||(r.to===p.id&&r.from===target.id))))throw Error('A friend request is already pending.');
      const r={id:randomUUID(),from:p.id,to:target.id,expires:this.now()+7*86400000};this.requests.set(r.id,r);
      this.send(p.online,{t:'notice',message:'Friend request sent.'});this.state(this.players.get(target.id));
    }else if(m.t==='friend.accept'||m.t==='friend.decline'){
      const r=this.requests.get(m.id);if(!r||r.to!==p.id||r.expires<this.now())throw Error('Friend request expired.');
      if(m.t==='friend.accept'){
        for(const id of [p.id,r.from])if((this.friends.get(id)?.size||0)>=100)throw Error('A friends list is full.');
        for(const [a,b]of [[p.id,r.from],[r.from,p.id]]){if(!this.friends.has(a))this.friends.set(a,new Set());this.friends.get(a).add(b);}
      }
      this.requests.delete(r.id);this.state(this.players.get(r.from));
    }else if(m.t==='friend.remove'){
      this.friends.get(p.id)?.delete(m.target);this.friends.get(m.target)?.delete(p.id);this.state(this.players.get(m.target));
    }else throw Error('Unknown friend action.');
    this.state(p);this.saveSocial();
  }
  message(p,m){
    if(['island.mount','island.dismount','island.drive'].includes(m.t)){
      const w=this.islandWorld(p);if(!w)throw Error('Shared Island is still loading.');
      if(m.t==='island.mount')w.enter(p,m.id);else if(m.t==='island.dismount'){const exit=w.exit(p.id,{force:false});if(exit)p.lastPosition={t:'s',id:p.id,p:exit.p,ry:0,e:''};}else w.drive(p,m,this.now());
      if(m.t!=='island.drive')this.broadcastWorld(p.lobbyId);return;
    }
    if(typeof m.t==='string'&&m.t.startsWith('friend.'))return this.friendAction(p,m);
    if(m.t==='room.create'){this.roomChanged(this.newRoom(p,m.capacity,m.mode||'balloon',m.teamMode||'solo'));return;}
    if(m.t==='queue.join'){
      const r=p.roomId?this.requireRoom(p,true):this.newRoom(p,m.capacity,m.mode||'balloon',m.teamMode||'solo');this.requireEditable(r);
      if(r.teamMode==='teams'&&r.members.size<4){
        const distinct=new Set([...r.members].map(id=>r.teams.get(id)));if(r.members.size>2||distinct.size>1)throw Error('Queue as one team of 1–2 friends, or fill both teams and start privately.');
      }
      r.visibility='public';r.status='queued';this.matchmake();return;
    }
    if(m.t==='room.settings'){
      const r=this.requireRoom(p,true);this.requireEditable(r);
      if(m.mode==='rockets'&&m.capacity!==4)throw Error('Candy Rockets needs four players.');
      if(!modes.includes(m.mode)||!['solo','teams'].includes(m.teamMode)||![2,3,4].includes(m.capacity)||r.members.size>m.capacity)throw Error('Invalid match settings.');
      if(m.teamMode==='teams'&&(!teamGame(m.mode)||m.capacity!==4))throw Error('Team matches need 4 players.');
      r.mode=m.mode;r.capacity=m.capacity;r.teamMode=m.teamMode;r.teams=new Map([...r.members].map((id,i)=>[id,m.teamMode==='teams'?i%2:i]));this.roomChanged(r);return;
    }
    if(m.t==='room.team'){
      const r=this.requireRoom(p);this.requireEditable(r);if(r.teamMode!=='teams'||![0,1].includes(m.team))throw Error('Choose Mint or Rose.');
      const id=m.playerId||p.id;if(id!==p.id&&r.host!==p.id)throw Error('Only the host can move another player.');if(!r.members.has(id))throw Error('Player is not in this room.');
      if([...r.members].filter(q=>q!==id&&r.teams.get(q)===m.team).length>=2)throw Error('That team is full.');
      r.teams.set(id,m.team);this.roomChanged(r);return;
    }
    if(m.t==='room.capacity'&&this.rooms.get(p.roomId)?.teamMode==='teams')throw Error('2 vs 2 always has four seats.');
    if(m.t==='match.ready'){
      const r=this.requireRoom(p);if(teamGame(r.mode)){
        if(m.code!==r.code||!['loading','countdown','playing','results'].includes(r.status))return;
        r.ready.add(p.id);if(r.status==='loading'&&r.ready.size===r.capacity){r.status='countdown';r.startAt=this.now()+3500;const Simulation=r.mode==='rockets'?RocketSimulation:r.mode==='race'?RaceSimulation:SportsSimulation;r.sim=new Simulation([...r.members].map(id=>this.players.get(id)),{mode:r.mode,teams:r.teamMode==='teams'?Object.fromEntries(r.teams):Object.fromEntries([...r.members].map((id,i)=>[id,i]))});}
        this.roomChanged(r);return;
      }
    }
    if(m.t==='sports.input'){
      const r=this.requireRoom(p);if(!isSport(r.mode)||r.status!=='playing')return;
      if(!Number.isSafeInteger(m.seq)||m.seq<=p.lastSeq)return;p.lastSeq=m.seq;this.roomTask(r,()=>r.sim.input(p.id,m));return;
    }
    if(m.t==='race.input'){
      const r=this.requireRoom(p);if(r.mode!=='race'||r.status!=='playing')return;
      const valid=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1;
      if(!Number.isSafeInteger(m.seq)||m.seq<=p.lastSeq||!valid(m.throttle)||!valid(m.steer))return;
      p.lastSeq=m.seq;p.control={throttle:m.throttle,steer:m.steer,brake:m.brake===true,reset:m.reset===true,seq:m.seq};p.controlAt=this.now();return;
    }
    if(m.t==='rocket.input'){
      const r=this.requireRoom(p);if(r.mode!=='rockets'||r.status!=='playing')return;
      if(!Number.isSafeInteger(m.seq)||m.seq<=p.lastSeq||![m.x,m.z,m.ax,m.az].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1))return;
      p.lastSeq=m.seq;p.control={x:m.x,z:m.z,ax:m.ax,az:m.az,fire:m.fire===true,jump:m.jump===true,weapon:m.weapon==='bat'?'bat':'launcher',skill:m.skill===true,element:['ice','fire','air'].includes(m.element)?m.element:'ice'};p.controlAt=this.now();return;
    }
    if(m.t==='room.capacity'&&this.rooms.get(p.roomId)?.mode==='rockets'&&m.capacity!==4)throw Error('Candy Rockets needs four players.');
    // Each game accepts only its own input protocol.
    if(m.t==='input'&&['race','rockets'].includes(this.rooms.get(p.roomId)?.mode))return;
    if(m.t==='invite.accept'){
      const i=this.invites.get(m.id);if(i?.team!==undefined){
        if(i.to!==p.id||i.expires<this.now())throw Error('Invitation expired.');
        this.joinRoom(p,this.rooms.get(i.code),i.team);this.invites.delete(i.id);p.inbox=p.inbox.filter(id=>id!==i.id);this.state(p);return;
      }
    }
    super.message(p,m);
  }
  close(){this.flushSocial();super.close();}
  islandWorld(p){if(!this.worldSource||!p.lobbyId)return null;if(!this.worlds.has(p.lobbyId))this.worlds.set(p.lobbyId,new IslandWorld(this.worldSource));return this.worlds.get(p.lobbyId);}
  releaseWorld(p){for(const w of this.worlds?.values()||[]){const exit=w.exit(p.id);if(exit)p.lastPosition={t:'s',id:p.id,p:exit.p,ry:0,e:''};}}
  assignLobby(p,target=null){this.releaseWorld(p);return super.assignLobby(p,target);}
  joinRoom(p,r,team){this.releaseWorld(p);return this.joinCommunityRoom(p,r,team);}
  lobbyMessage(p,m){if(m.t==='s'&&this.islandWorld(p)?.mounts.has(p.id))return;super.lobbyMessage(p,m);}
  broadcastWorld(id){const w=this.worlds.get(id),l=this.lobbies.get(id);if(!w||!l)return;const msg={...w.snapshot(this.now()),island:id};for(const id of l.members){const p=this.players.get(id);if(p?.online)this.send(p.online,msg);}}
  worldTask(id,fn){
    this.worldFaults??=new Map();if(this.worldFaults.has(id))return;
    try{return fn();}catch(error){
      this.worldFaults.set(id,{at:this.now(),message:String(error?.message||error).slice(0,240)});
      if(this.worldFaults.size>128)this.worldFaults.delete(this.worldFaults.keys().next().value);
      // A vehicle-world fault cannot starve matches, homes or another lobby.
      // Keep the existing world for safe dismounts rather than teleporting users.
      for(const pid of this.lobbies.get(id)?.members||[])this.send(this.players.get(pid)?.online,{t:'notice',message:'Vehicles on this island paused safely. You can get out and keep playing; other islands are unaffected.'});
    }
  }
  update(){
    super.update();if(!this.worldSource)return;
    const now=this.now(),dt=Math.min(.05,Math.max(0,(now-this.worldAt)/1000));this.worldAt=now;
    this.rideFaults??=new WeakSet();
    for(const r of this.worldSource.rides)if(!this.rideFaults.has(r))try{r.advance(dt);}catch{this.rideFaults.add(r);}
    for(const [id,w]of this.worlds){
      if(!this.lobbies.has(id)){this.worlds.delete(id);this.worldFaults?.delete(id);continue;}
      this.worldTask(id,()=>{
        w.step(dt,now,[...this.lobbies.get(id).members].map(pid=>this.players.get(pid)).filter(p=>p?.online&&p.lastPosition).map(p=>({id:p.id,p:p.lastPosition.p,at:p.stateAt,mounted:w.mounts.has(p.id),inMatch:!!this.rooms.get(p.roomId)?.sim})));
        for(const pid of w.mounts.keys()){const p=this.players.get(pid),position=w.position(pid);if(p&&position)p.lastPosition={t:'s',id:pid,...position,e:'benchsit'};}
      });
    }
    if(now-this.worldBroadcast<66)return;this.worldBroadcast=now;
    for(const [id,w]of this.worlds)this.worldTask(id,()=>{this.broadcastWorld(id);for(const pid of w.mounts.keys()){const p=this.players.get(pid);if(p)this.lobbyBroadcast(this.lobbies.get(id),p.lastPosition,pid);}});
  }
}
