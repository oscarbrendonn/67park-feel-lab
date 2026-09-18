import {randomBytes,randomUUID} from 'node:crypto';
import {BattleSimulation} from './battle-sim.js';
import {englishCopy} from '../english-copy.mjs';
import {sanitizeClaudeMotion} from './claude-motion.js';
const code=()=>randomBytes(5).toString('hex').toUpperCase();
const clean=(s,n=24)=>typeof s==='string'?s.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n):'';
const finite=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=max;
const DEMO=Object.freeze({id:'67park-demo-goril-001',name:'67Park Gorilla · Demo',model:'goril',network:'offchain-demo',minted:false,transferable:false});
export class OnlineHub{
 constructor({now=Date.now,lobbyCapacity=16,disconnectGrace=20000,loadTimeout=60000,duration=150}={}){this.now=now;this.lobbyCapacity=lobbyCapacity;this.disconnectGrace=disconnectGrace;this.loadTimeout=loadTimeout;this.duration=duration;this.sessions=new Map();this.players=new Map();this.lobbies=new Map();this.rooms=new Map();this.invites=new Map();this.last=now();this.acc=0;this.lastBroadcast=0;}
 session(token){let p=this.sessions.get(token);if(p){p.lastSeen=this.now();return{player:p,token,fresh:false};}if(this.players.size>=2000)throw Error('The server is full.');token=randomBytes(32).toString('base64url');p={id:randomUUID(),friendCode:code(),name:'Guest',color:['#e8b64a','#d0775e','#5a9c7a','#8a6fb0'][this.players.size%4],combo:'',lobbyId:'',roomId:'',online:null,lobbySocket:null,lastSeen:this.now(),offlineAt:0,lastPosition:null,carryTarget:'',chatAt:0,inbox:[],tokens:80,refill:this.now(),stateAt:0,lastSeq:-1,control:null,controlAt:0};this.sessions.set(token,p);this.players.set(p.id,p);this.assignLobby(p);return{player:p,token,fresh:true};}
 lookup(token){return this.sessions.get(token);}
 publicPlayer(p){return{id:p.id,name:p.name,color:p.color,combo:p.combo,friendCode:p.friendCode,connected:!!p.online,roomId:p.roomId||null,p:p.lastPosition?.p||[179,12,121]};}
 assignLobby(p,target=null){let l=target?this.lobbies.get(target):[...this.lobbies.values()].find(l=>l.members.size<this.lobbyCapacity);if(target&&!l)throw Error('Island invitation not found or expired.');if(l&&l.members.size>=this.lobbyCapacity&&!l.members.has(p.id))throw Error('This island is full.');if(!l){l={code:code(),members:new Set(),chat:[]};this.lobbies.set(l.code,l);}const old=this.lobbies.get(p.lobbyId);old?.members.delete(p.id);l.members.add(p.id);p.lobbyId=l.code;p.lastPosition=null;this.refreshLobby(old);this.refreshLobby(l);return l;}
 send(ws,message){try{if(ws?.readyState===1&&ws.bufferedAmount<256000){if((message.t==='error'||message.t==='notice')&&typeof message.message==='string')message={...message,message:englishCopy(message.message)};ws.send(JSON.stringify(message));return true;}}catch{}return false;}
 lobbyBroadcast(l,message,except){for(const id of l?.members||[]){const p=this.players.get(id);if(p&&id!==except)this.send(p.lobbySocket,message);}}
 welcome(p){const l=this.lobbies.get(p.lobbyId);if(!l)return;this.send(p.lobbySocket,{t:'welcome',id:p.id,name:p.name,color:p.color,players:[...l.members].filter(id=>id!==p.id&&this.players.get(id)?.lobbySocket?.readyState===1&&!this.rooms.get(this.players.get(id).roomId)?.sim).map(id=>this.publicPlayer(this.players.get(id))),chat:l.chat});}
 refreshLobby(l){if(!l)return;for(const id of l.members){const p=this.players.get(id);if(p){this.welcome(p);this.state(p);}}}
 roomInfo(r){if(!r)return null;const snapshot=this.roomTask(r,()=>r.sim?.snapshot()||null);return {code:r.code,host:r.host,capacity:r.capacity,visibility:r.visibility,status:r.status,ready:[...r.ready],startAt:r.startAt||null,loadDeadline:r.loadDeadline||null,members:[...r.members].map(id=>this.players.get(id)).filter(Boolean).map(p=>this.publicPlayer(p)),snapshot:snapshot||null};}
 roomTask(r,fn){try{return fn();}catch(error){this.failRoom(r,error);return null;}}
 failRoom(r,error){
  // Clear the broken simulation BEFORE any state serialization or leave path.
  // The party stays together in its waiting room and can retry or leave.
  r.sim=null;r.status='waiting';r.ready.clear();r.startAt=0;r.loadDeadline=0;
  this.roomFaults??=[];this.roomFaults.push({room:r.code,at:this.now(),message:String(error?.message||error).slice(0,240)});if(this.roomFaults.length>32)this.roomFaults.shift();
  for(const id of r.members){const p=this.players.get(id);if(!p)continue;p.control=null;this.send(p.online,{t:'notice',message:'This match stopped safely. Your party is still connected; start again or return to the park.'});this.state(p);}
 }
 state(p){if(!p?.online)return;const l=this.lobbies.get(p.lobbyId),r=this.rooms.get(p.roomId);if(!l)return;this.send(p.online,{t:'state',now:this.now(),me:this.publicPlayer(p),demoCharacter:DEMO,island:{code:l.code,capacity:this.lobbyCapacity,players:[...l.members].map(id=>this.publicPlayer(this.players.get(id)))},room:this.roomInfo(r),invites:p.inbox.map(id=>this.invites.get(id)).filter(i=>i&&i.expires>this.now()).map(i=>({id:i.id,from:this.players.get(i.from)?.name||'Friend',kind:i.kind,code:i.code,expires:i.expires})),queues:[2,3,4].map(size=>({size,waiting:[...this.rooms.values()].filter(r=>r.capacity===size&&r.status==='queued').reduce((n,r)=>n+r.members.size,0)}))});}
 roomChanged(r){for(const id of r?.members||[])this.state(this.players.get(id));}
 allState(){for(const p of this.players.values())if(p.online)this.state(p);}
 attach(p,ws,channel){if(!this.lobbies.get(p.lobbyId)?.members.has(p.id))this.assignLobby(p);const key=channel==='lobby'?'lobbySocket':'online';if(p[key]&&p[key]!==ws)p[key].close(4001,'This account is open in another tab.');p[key]=ws;p.lastSeen=this.now();p.offlineAt=0;
  if(channel==='lobby'){this.welcome(p);const l=this.lobbies.get(p.lobbyId);this.lobbyBroadcast(l,{t:'join',...this.publicPlayer(p)},p.id);}
  else{p.lastSeq=-1;this.state(p);this.refreshLobby(this.lobbies.get(p.lobbyId));}
  ws.on('message',raw=>{if(p[key]!==ws)return;const at=this.now();p.tokens=Math.min(80,p.tokens+(at-p.refill)*.06);p.refill=at;if(--p.tokens<0){ws.close(1008,'Message limit reached');return;}let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object'||Array.isArray(m))return;}catch{return;}p.lastSeen=at;try{if(channel==='lobby')this.lobbyMessage(p,m);else this.message(p,m);}catch(error){this.send(ws,{t:'error',message:error.message});}});
  ws.on('close',()=>{if(p[key]!==ws)return;p[key]=null;if(channel==='online'){p.offlineAt=this.now();p.control=null;this.roomChanged(this.rooms.get(p.roomId));}else{p.carryTarget='';this.lobbyBroadcast(this.lobbies.get(p.lobbyId),{t:'leave',id:p.id},p.id);}});
 }
 profile(p,m){const name=clean(m.name,16);if(name)p.name=name;if(typeof m.combo==='string'&&m.combo.length<=700){try{const eq=JSON.parse(m.combo);if(eq&&typeof eq.base==='string'&&/^[a-zA-Z0-9_-]{1,40}$/.test(eq.base))p.combo=m.combo;}catch{}}}
 lobbyMessage(p,m){const l=this.lobbies.get(p.lobbyId);if(m.t==='hello'){this.profile(p,m);this.lobbyBroadcast(l,{t:'meta',...this.publicPlayer(p)});this.state(p);}else if(m.t==='s'){
   if(this.now()-p.stateAt<65||this.rooms.get(p.roomId)?.sim)return;
   if(!Array.isArray(m.p)||m.p.length!==3||!m.p.every(x=>finite(x,1000))||!finite(m.ry,100000))return;
   const requested=clean(m.cg,64),target=requested&&requested!==p.id&&l.members.has(requested)?this.players.get(requested):null;
   if(requested&&!target)return;
   if(target&&p.carryTarget!==target.id){const a=p.lastPosition?.p,b=target.lastPosition?.p;if(!a||!b||Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])>2.5)return;if([...l.members].some(id=>id!==p.id&&this.players.get(id)?.carryTarget===target.id))return;}
   p.carryTarget=target?.id||'';p.stateAt=this.now();p.lastPosition={t:'s',id:p.id,p:m.p,ry:m.ry,e:clean(m.e,40),...(p.carryTarget?{cg:p.carryTarget}:{})};const cm=sanitizeClaudeMotion(m.cm);if(cm)p.lastPosition.cm=cm;this.lobbyBroadcast(l,p.lastPosition,p.id);
  }else if(m.t==='chat'){
   if(this.now()-p.chatAt<700)return;const text=clean(m.text,140);if(!text)return;p.chatAt=this.now();const entry={id:p.id,name:p.name,color:p.color,text,at:this.now(),nonce:clean(m.nonce,24)};l.chat.push(entry);l.chat=l.chat.slice(-20);this.lobbyBroadcast(l,{t:'chat',...entry});
  }
 }
 newRoom(p,capacity){if(![2,3,4].includes(capacity))throw Error('Choose 2, 3 or 4 players.');this.leaveRoom(p);const r={code:code(),host:p.id,capacity,visibility:'private',status:'waiting',members:new Set([p.id]),ready:new Set(),created:this.now(),startAt:0,sim:null};this.rooms.set(r.code,r);p.roomId=r.code;return r;}
 requireRoom(p,host=false){const r=this.rooms.get(p.roomId);if(!r)throw Error('Create a match room first.');if(host&&r.host!==p.id)throw Error('Only the host can do that.');return r;}
 requireWaiting(r){if(!['waiting','queued','results'].includes(r.status))throw Error('The match has started. New players cannot join.');}
 leaveRoom(p){const r=this.rooms.get(p.roomId);if(!r){p.roomId='';return;}r.members.delete(p.id);r.ready.delete(p.id);p.roomId='';p.control=null;const actor=r.sim?.players.find(q=>q.id===p.id);if(actor&&!r.sim.over){r.sim.eliminate(actor,'left');if(r.sim.alive().length<=1)r.sim.finish();}
  if(!r.members.size)this.rooms.delete(r.code);else{if(r.host===p.id)r.host=[...r.members][0];if(['loading','countdown'].includes(r.status)){r.status='waiting';r.ready.clear();r.sim=null;r.startAt=0;}this.roomChanged(r);}this.state(p);
 }
 joinRoom(p,r){if(!r)throw Error('Room not found or invitation expired.');if(r.members.has(p.id))return;this.requireWaiting(r);if(r.status==='results')throw Error('This match has ended.');if(r.members.size>=r.capacity)throw Error('This match room is full.');this.leaveRoom(p);r.members.add(p.id);p.roomId=r.code;if(r.status==='queued')this.matchmake();else this.roomChanged(r);}
 matchmake(){let changed=true;while(changed){changed=false;const list=[...this.rooms.values()].filter(r=>r.status==='queued').sort((a,b)=>a.created-b.created);for(let i=0;i<list.length;i++){const a=list[i];if(!this.rooms.has(a.code))continue;if(a.members.size===a.capacity){this.prepare(a);changed=true;continue;}for(let j=i+1;j<list.length;j++){const b=list[j];if(!this.rooms.has(b.code)||b.capacity!==a.capacity||a.members.size+b.members.size>a.capacity)continue;for(const id of b.members){a.members.add(id);this.players.get(id).roomId=a.code;}this.rooms.delete(b.code);changed=true;break;}if(changed)break;}}
  this.allState();
 }
 prepare(r){if(r.members.size!==r.capacity)return;r.status='loading';r.ready.clear();r.sim=null;r.startAt=0;r.loadDeadline=this.now()+this.loadTimeout;this.roomChanged(r);}
 invitation(p,m){const target=[...this.players.values()].find(q=>q.friendCode===clean(m.friendCode,10).toUpperCase()||q.id===m.target);if(!target||!target.online)throw Error('Friend code not found or your friend is offline.');if(target===p)throw Error('That is your own friend code.');if(!['island','match'].includes(m.kind))throw Error('Invalid invitation type.');let targetCode=p.lobbyId;if(m.kind==='match'){const r=this.requireRoom(p);this.requireWaiting(r);if(r.members.size>=r.capacity)throw Error('This match room is full.');targetCode=r.code;}
  const recent=target.inbox.map(id=>this.invites.get(id)).find(i=>i?.from===p.id&&i.kind===m.kind&&i.expires>this.now());if(recent)return;
  const i={id:randomUUID(),from:p.id,to:target.id,kind:m.kind,code:targetCode,expires:this.now()+120000};this.invites.set(i.id,i);target.inbox.push(i.id);while(target.inbox.length>5)this.invites.delete(target.inbox.shift());this.state(target);this.send(p.online,{t:'notice',message:'Invitation sent.'});
 }
 message(p,m){
  if(m.t==='hello'){this.profile(p,m);if(m.island&&m.island!==p.lobbyId&&!p.roomId)this.assignLobby(p,clean(m.island,10).toUpperCase());this.refreshLobby(this.lobbies.get(p.lobbyId));return;}
  if(m.t==='ping'){this.send(p.online,{t:'pong',at:m.at,now:this.now()});return;}
  if(m.t==='input'){const r=this.requireRoom(p);if(!['countdown','playing'].includes(r.status))return;if(!Number.isSafeInteger(m.seq)||m.seq<=p.lastSeq||!finite(m.x,1)||!finite(m.z,1))return;p.lastSeq=m.seq;const n=Math.max(1,Math.hypot(m.x,m.z));p.control={x:m.x/n,z:m.z/n,jump:m.jump===true,dash:m.dash===true,sprint:m.sprint===true};p.controlAt=this.now();return;}
  if(m.t==='room.create'){const r=this.newRoom(p,m.capacity);this.roomChanged(r);}
  else if(m.t==='room.join')this.joinRoom(p,this.rooms.get(clean(m.code,10).toUpperCase()));
  else if(m.t==='room.leave')this.leaveRoom(p);
  else if(m.t==='room.capacity'){const r=this.requireRoom(p,true);this.requireWaiting(r);if(![2,3,4].includes(m.capacity)||r.members.size>m.capacity)throw Error('Capacity cannot be smaller than the current player count.');r.capacity=m.capacity;r.status='waiting';r.visibility='private';this.roomChanged(r);}
  else if(m.t==='queue.join'){const r=p.roomId?this.requireRoom(p,true):this.newRoom(p,m.capacity);this.requireWaiting(r);if(r.status==='results')throw Error('Set up the next round first.');r.visibility='public';r.status='queued';this.matchmake();}
  else if(m.t==='queue.cancel'){const r=this.requireRoom(p,true);this.requireWaiting(r);r.status='waiting';r.visibility='private';this.allState();}
  else if(m.t==='room.start'){const r=this.requireRoom(p,true);this.requireWaiting(r);if(r.members.size!==r.capacity)throw Error('All seats must be filled before starting.');this.prepare(r);}
  else if(m.t==='match.ready'){const r=this.requireRoom(p);if(m.code!==r.code||!['loading','countdown','playing','results'].includes(r.status))return;r.ready.add(p.id);if(r.status==='loading'&&r.ready.size===r.capacity){r.status='countdown';r.startAt=this.now()+3500;r.sim=new BattleSimulation([...r.members].map(id=>this.players.get(id)),{duration:this.duration});}this.roomChanged(r);}
  else if(m.t==='room.rematch'){const r=this.requireRoom(p,true);if(r.status!=='results')throw Error('The match has not finished yet.');r.status='waiting';r.sim=null;r.ready.clear();r.startAt=0;this.roomChanged(r);}
  else if(m.t==='island.join'){if(p.roomId)throw Error('Leave the match room before changing islands.');this.assignLobby(p,clean(m.code,10).toUpperCase());}
  else if(m.t==='invite.send')this.invitation(p,m);
  else if(m.t==='invite.accept'){const i=this.invites.get(m.id);if(!i||i.to!==p.id||i.expires<this.now())throw Error('The invitation has expired.');if(i.kind==='match')this.joinRoom(p,this.rooms.get(i.code));else{if(p.roomId)throw Error('Leave your current match room first.');this.assignLobby(p,i.code);}this.invites.delete(i.id);p.inbox=p.inbox.filter(id=>id!==i.id);this.state(p);}
  else if(m.t==='invite.decline'){const i=this.invites.get(m.id);if(i?.to===p.id){this.invites.delete(i.id);p.inbox=p.inbox.filter(id=>id!==i.id);this.state(p);}}
  else throw Error('Unsupported action.');
 }
 update(){const now=this.now();this.acc+=Math.min(.25,Math.max(0,(now-this.last)/1000));this.last=now;
  // A page that obtains a guest cookie but never opens a socket must not occupy an island.
  for(const p of this.players.values())if(!p.online&&!p.lobbySocket&&!p.offlineAt&&now-p.lastSeen>60000){const l=this.lobbies.get(p.lobbyId);if(l?.members.delete(p.id))this.refreshLobby(l);}
  for(const p of this.players.values())if(p.offlineAt&&now-p.offlineAt>this.disconnectGrace){p.offlineAt=0;this.leaveRoom(p);if(!p.lobbySocket){const l=this.lobbies.get(p.lobbyId);l?.members.delete(p.id);this.refreshLobby(l);}}
  for(const r of this.rooms.values()){if(r.status==='loading'&&now>r.loadDeadline){r.status='waiting';r.ready.clear();this.roomChanged(r);for(const id of r.members)this.send(this.players.get(id).online,{t:'notice',message:'A player did not load in time. The match did not start. Please try again.'});}if(r.status==='countdown'&&now>=r.startAt){r.status='playing';this.roomChanged(r);}}
  let steps=0;while(this.acc>=1/60&&steps++<15){this.acc-=1/60;for(const r of this.rooms.values())if(r.status==='playing')this.roomTask(r,()=>{const controls=new Map([...r.members].map(id=>{const p=this.players.get(id);return[id,p?.online&&now-p.controlAt<350?p.control:null];}).filter(([,c])=>c));r.sim.step(controls);if(r.sim.over){r.status='results';r.finishedAt=now;this.roomChanged(r);}});}
  if(now-this.lastBroadcast>=50){this.lastBroadcast=now;for(const r of this.rooms.values())if(r.sim&&['countdown','playing'].includes(r.status))this.roomTask(r,()=>{const msg={t:'match.snapshot',code:r.code,status:r.status,startAt:r.startAt,now,...r.sim.snapshot()};for(const id of r.members)this.send(this.players.get(id)?.online,msg);});}
  for(const [id,i]of this.invites)if(i.expires<now)this.invites.delete(id);
  for(const r of [...this.rooms.values()])if((r.status==='results'&&now-r.finishedAt>300000)||(!r.sim&&now-r.created>3600000))for(const id of [...r.members])this.leaveRoom(this.players.get(id));
  for(const [token,p]of this.sessions)if(!p.online&&!p.lobbySocket&&now-p.lastSeen>86400000){this.leaveRoom(p);this.lobbies.get(p.lobbyId)?.members.delete(p.id);this.players.delete(p.id);this.sessions.delete(token);}
  for(const [id,l]of this.lobbies)if(!l.members.size)this.lobbies.delete(id);
 }
 close(){for(const p of this.players.values()){p.online?.close(1001,'Server shutting down');p.lobbySocket?.close(1001,'Server shutting down');}}
}
