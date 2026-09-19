import fs from 'node:fs';
import path from 'node:path';
import {chatVerdict,SAFETY_LIMIT,validSafetyId} from '../app/chat-policy.js';
import {createReplyBudget} from './reply-budget.mjs';

// No raw chat is written to disk. Stores only authenticated guest IDs and the
// recipient's safety preferences. Identity storage is owned by CommunityHub.
export function installSocialSafety(app,{file=null}={}){
 let saved=new Map();
 if(file&&fs.existsSync(file)){
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(data.version!==1||!Array.isArray(data.people))throw Error('Invalid safety store; restore it instead of discarding blocks.');
  saved=new Map(data.people);
 }
 const metrics={accepted:0,rejected:0,muted:0,blocked:0,duplicates:0};
 let timer;
 function flush(){clearTimeout(timer);if(!file)return;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify({version:1,people:[...saved]}),{mode:0o600});fs.renameSync(file+'.tmp',file);}
 function save(){if(!file)return;clearTimeout(timer);timer=setTimeout(()=>{try{flush();metrics.storageError=false;}catch{metrics.storageError=true;console.error('Safety storage unavailable; existing file retained.');}},250);timer.unref?.();}
 const disposers=[];
 for(const hub of app.hubs.values()){
  const original={send:hub.send,attach:hub.attach,lobbyMessage:hub.lobbyMessage,message:hub.message,profile:hub.profile,close:hub.close};
  const sockets=new WeakMap(),rates=new Map(),nonces=new Map(),commands=new Map();
  const reply=createReplyBudget({now:()=>hub.now()});
  const streaming=new Set(['input','sports.input','race.input','rocket.input','island.drive','ping','house.exit','house.stand','room.leave']);
  const row=id=>{let r=saved.get(id);if(!r){r={blocked:[],muted:[]};saved.set(id,r);}return r;};
  const blocked=(a,b)=>!!(a&&b&&(saved.get(a)?.blocked.includes(b)||saved.get(b)?.blocked.includes(a)));
  const hidden=(to,from)=>blocked(to,from)||saved.get(to)?.muted.includes(from);
  hub.safety={blocked,hidden};
  const state=p=>{const r=row(p.id);hub.send(p.online,{t:'safety.state',blocked:r.blocked,muted:r.muted});hub.send(p.lobbySocket,{t:'safety.state',blocked:r.blocked,muted:r.muted});};
  hub.attach=function(p,ws,channel){sockets.set(ws,p.id);original.attach.call(this,p,ws,channel);state(p);};
  hub.send=function(ws,m){
   const to=sockets.get(ws);
   if(to&&m.t==='chat'&&hidden(to,m.id)){metrics.muted++;return false;}
   if(to&&m.t==='s'&&blocked(to,m.id))m={...m,e:'',cg:''};
   if(to&&m.t==='welcome')m={...m,chat:(m.chat||[]).filter(q=>!hidden(to,q.id)&&chatVerdict(q.text).ok)};
   if(to&&m.t==='state')m={...m,invites:(m.invites||[]).filter(i=>!blocked(to,hub.invites.get(i.id)?.from))};
   if(to&&m.t==='social')m={...m,friends:m.friends.filter(q=>!blocked(to,q.id)),requests:m.requests.filter(q=>!blocked(to,q.from))};
   if(to&&m.t==='house.bell'&&blocked(to,m.from))return false;
   if(to&&m.t==='house.state')m={...m,people:(m.people||[]).filter(p=>!blocked(to,p.id))};
   return original.send.call(this,ws,m);
  };
  hub.profile=function(p,m){if(m.name&&!chatVerdict(m.name).ok)m={...m,name:'Guest'};return original.profile.call(this,p,m);};
  hub.lobbyMessage=function(p,m){
   if(m.t==='s'&&m.cg&&blocked(p.id,m.cg))m={...m,cg:''};
   if(m.t!=='chat')return original.lobbyMessage.call(this,p,m);
   const nonce=typeof m.nonce==='string'?m.nonce.slice(0,24):'',now=hub.now();
   let seen=nonces.get(p.id);if(!seen){seen=new Map();nonces.set(p.id,seen);}
   for(const [key,v]of seen)if(now-v.at>60000)seen.delete(key);
   if(nonce&&seen.has(nonce)){metrics.duplicates++;reply(p,()=>hub.send(p.lobbySocket,seen.get(nonce).result));return;}
   let result=chatVerdict(m.text),rate=rates.get(p.id)||{at:-Infinity,text:''};
   if(result.ok&&now-rate.at<800)result={ok:false,code:'rate',message:'One message at a time. Please wait a moment.'};
   if(result.ok&&result.text===rate.text&&now-rate.at<5000)result={ok:false,code:'duplicate',message:'You already sent that message.'};
   const ack={t:'chat.result',nonce,ok:result.ok,code:result.code,message:result.message};
   if(nonce){if(seen.size>=64)seen.delete(seen.keys().next().value);seen.set(nonce,{at:now,result:ack});}
   if(!result.ok){metrics.rejected++;reply(p,()=>hub.send(p.lobbySocket,ack));return;}
   rates.set(p.id,{at:now,text:result.text});p.chatAt=now;metrics.accepted++;
   const l=hub.lobbies.get(p.lobbyId);if(!l)return;
   const entry={id:p.id,name:p.name,color:p.color,text:result.text,at:now,nonce};
   l.chat.push(entry);if(l.chat.length>20)l.chat.splice(0,l.chat.length-20);
   hub.lobbyBroadcast(l,{t:'chat',...entry});hub.send(p.lobbySocket,ack);
  };
  hub.message=function(p,m){
   if(!streaming.has(m.t)){
    const now=hub.now(),r=commands.get(p.id)||{at:now,tokens:20,notice:0};r.tokens=Math.min(20,r.tokens+(now-r.at)/200);r.at=now;commands.set(p.id,r);
    if(r.tokens<1){if(now-r.notice>1000){r.notice=now;hub.send(p.online,{t:'notice',message:'Please wait a moment before another action.'});}return;}r.tokens--;
   }
   if(m.t==='safety.sync'){state(p);return;}
   if(m.t==='safety.set'){
    if(!['blocked','muted'].includes(m.kind)||!validSafetyId(m.target)||m.target===p.id||typeof m.value!=='boolean')throw Error('Invalid safety choice.');
    const r=row(p.id),ids=r[m.kind],index=ids.indexOf(m.target);
    if(m.value&&index<0){if(ids.length>=SAFETY_LIMIT)throw Error('Safety list is full. Remove an old entry first.');ids.push(m.target);}
    if(!m.value&&index>=0)ids.splice(index,1);
    if(m.kind==='blocked'&&m.value){
     metrics.blocked++;
     for(const [id,i]of hub.invites)if(blocked(i.from,i.to))hub.invites.delete(id);
     for(const [id,i]of hub.requests||[])if(blocked(i.from,i.to))hub.requests.delete(id);
     hub.friends?.get(p.id)?.delete(m.target);hub.friends?.get(m.target)?.delete(p.id);hub.saveSocial?.();
     p.carryTarget='';const other=hub.players.get(m.target);if(other?.carryTarget===p.id)other.carryTarget='';
     hub.state(other);
    }
    save();state(p);hub.state(p);return;
   }
   const target=m.target||[...hub.players.values(),...hub.profiles?.values()||[]].find(q=>q.friendCode===String(m.friendCode||'').trim().toUpperCase())?.id;
   const invitation=m.t==='invite.accept'?hub.invites.get(m.id):m.t==='friend.accept'?hub.requests?.get(m.id):null;
   if((['invite.send','friend.request'].includes(m.t)&&blocked(p.id,target))||(invitation&&blocked(p.id,invitation.from)))throw Error('This player is unavailable for contact.');
   return original.message.call(this,p,m);
  };
  hub.close=function(){flush();rates.clear();nonces.clear();commands.clear();return original.close.call(this);};
  // Session pruning also bounds transient moderation state.
  const sweep=setInterval(()=>{for(const map of [rates,nonces,commands])for(const id of map.keys())if(!hub.players.has(id))map.delete(id);},60000);sweep.unref?.();
  disposers.push(()=>{clearInterval(sweep);Object.assign(hub,original);delete hub.safety;});
 }
 return {metrics,flush,dispose(){flush();for(const f of disposers)f();}};
}
