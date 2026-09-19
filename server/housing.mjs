import {HOUSES,houseById,roomSpawn,inRoom,isHousingZone,nearDoor} from '../app/housing-layout.js';
import {homeSpot,spotPosition,nearHomeSpot} from '../app/housing-actions.js';
import {createReplyBudget} from './reply-budget.mjs';

// Additive protocol: the existing avatar, vehicle and match simulations stay
// untouched. Ownership is scoped to the authenticated session AND island.
export function installHousing(app){
 const disposers=[];
 for(const hub of app.hubs.values()){
  const homes=new Map(),visits=new Map(),rates=new Map(),corrections=new Map(),travelUntil=new Map(),receipts=new Map();
  const rests=new Map(),invites=new Map(),bells=new Map(),rosters=new Map();
  const reply=createReplyBudget({now:()=>hub.now()});
  const original={message:hub.message,lobbyMessage:hub.lobbyMessage,update:hub.update,state:hub.state};
  const entries=id=>{if(!homes.has(id))homes.set(id,new Map());return homes.get(id);};
  const occupied=(p)=>visits.get(p.id);
  function snapshot(p){
   const rows=homes.get(p.lobbyId);
   const members=[...hub.lobbies.get(p.lobbyId)?.members||[]].map(id=>hub.players.get(id)).filter(Boolean);
   const inbox=[...invites.get(p.id)?.values()||[]].filter(i=>validInvite(p,i));
   return {t:'house.state',features:['rest','bell','invite'],island:p.lobbyId,visiting:occupied(p)?.house||null,rest:rests.get(p.id)?.spot||null,
    poses:[...rests].filter(([,r])=>r.lobby===p.lobbyId).map(([id,r])=>({id,house:r.house,spot:r.spot})),
    invitations:inbox.map(i=>({house:i.house,name:hub.players.get(i.owner)?.name||'Guest',expires:i.expires})),
    people:members.filter(q=>q.online&&q.id!==p.id&&!q.roomId).map(q=>({id:q.id,name:q.name||'Guest'})),
    houses:HOUSES.map(h=>{const q=rows?.get(h.id);return {id:h.id,owner:q?.owner||null,name:q?hub.players.get(q.owner)?.name||'Guest':'',locked:!!q?.locked,guests:[...visits.values()].filter(v=>v.lobby===p.lobbyId&&v.house===h.id).length};})};
  }
  const sendState=p=>p&&hub.send(p.online,snapshot(p));
  const changed=lobby=>{for(const id of hub.lobbies.get(lobby)?.members||[])sendState(hub.players.get(id));};
  function teleport(p,position,house=null,reason='',extra={}){
   p.carryTarget='';p.lastPosition={t:'s',id:p.id,p:[...position],ry:0,e:''};
   travelUntil.set(p.id,hub.now()+1000);
   hub.send(p.online,{t:'house.travel',house,p:[...position],reason,rest:rests.get(p.id)?.spot||null,...extra});
   hub.lobbyBroadcast(hub.lobbies.get(p.lobbyId),p.lastPosition,p.id);
  }
  function exit(p,reason='',notify=true){
   const v=occupied(p);if(!v)return;
   visits.delete(p.id);rests.delete(p.id);const h=houseById(v.house);
   teleport(p,h.door,null,reason);if(notify)changed(v.lobby);
  }
  function release(lobby,id){
   homes.get(lobby)?.delete(id);
   for(const inbox of invites.values())inbox.delete(lobby+':'+id);
   for(const [pid,v]of [...visits])if(v.lobby===lobby&&v.house===id){const p=hub.players.get(pid);if(p)exit(p,'This home is now available.',false);else{visits.delete(pid);rests.delete(pid);}}
   changed(lobby);
  }
  function validInvite(p,i){return !hub.safety?.blocked(p.id,i.owner)&&i.expires>hub.now()&&i.lobby===p.lobbyId&&homes.get(i.lobby)?.get(i.house)?.owner===i.owner&&hub.lobbies.get(i.lobby)?.members.has(i.owner);}
  function stand(p,notify=true){
   const r=rests.get(p.id);if(!r)return;
   rests.delete(p.id);const h=houseById(r.house),s=homeSpot(r.spot);
   teleport(p,spotPosition(h,s,true),h.id,'',{standing:true});if(notify)changed(r.lobby);
  }
  function enter(p,h){
   rests.delete(p.id);
   const guests=[...visits].filter(([id,v])=>id!==p.id&&v.house===h.id&&v.lobby===p.lobbyId).length;
   visits.set(p.id,{house:h.id,lobby:p.lobbyId});teleport(p,roomSpawn(h,guests),h.id);changed(p.lobbyId);
  }
  function eligible(p){
   if(!hub.lobbies.get(p.lobbyId)?.members.has(p.id))throw Error('Reconnect to the island first.');
   if(p.roomId)throw Error('Leave the mini-game room before visiting a home.');
   if(hub.islandWorld?.(p)?.mounts.has(p.id))throw Error('Step out of the vehicle first.');
   if(p.carryTarget||[...hub.players.values()].some(q=>q.lobbyId===p.lobbyId&&q.carryTarget===p.id))throw Error('Put your friend down before visiting a home.');
  }
  function action(p,m){
   const req=typeof m.request==='string'?m.request.slice(0,32):'',now=hub.now();
   let previous=receipts.get(p.id);if(!previous){previous=new Map();receipts.set(p.id,previous);}
   for(const [key,r]of previous)if(now-r.at>30000)previous.delete(key);
   if(req&&previous.has(req)){reply(p,()=>hub.send(p.online,previous.get(req).value));return;}
   const result=value=>{if(req){if(previous.size>=32)previous.delete(previous.keys().next().value);previous.set(req,{at:now,value});}hub.send(p.online,value);};
   // House traffic has its own small budget; it never creates a broadcast storm.
   const rate=rates.get(p.id)||{tokens:8,at:now};
   rate.tokens=Math.min(8,rate.tokens+(now-rate.at)/400);rate.at=now;rates.set(p.id,rate);
   const safety=m.t==='house.stand'?rests.has(p.id):m.t==='house.exit'&&visits.has(p.id);
   if(rate.tokens<1&&!safety){reply(p,()=>hub.send(p.online,{t:'house.result',request:req,ok:false,message:'Please wait a moment before another home action.'}));return;}if(!safety)rate.tokens--;
   try{
    if(m.t==='house.sync'){
     const v=occupied(p);if(v&&v.lobby===p.lobbyId&&!p.roomId){const h=houseById(v.house);teleport(p,inRoom(h,...[p.lastPosition?.p?.[0],p.lastPosition?.p?.[2]])?p.lastPosition.p:roomSpawn(h),h.id);}
    }else{
     // Standing/exiting are always escape routes, including an interrupted grab.
     if(m.t!=='house.stand'&&m.t!=='house.exit')eligible(p);
     const h=houseById(m.house),rows=entries(p.lobbyId);
     if(m.t==='house.exit'){exit(p);}
     else if(m.t==='house.stand'){stand(p);}
     else{
      if(!h)throw Error('Choose a home from this island.');
      const owner=rows.get(h.id);
      if(owner&&owner.owner!==p.id&&hub.safety?.blocked(p.id,owner.owner))throw Error('This home is unavailable for visits.');
      if(m.t==='house.claim'){
       if(owner&&owner.owner!==p.id)throw Error('Someone has already claimed this home.');
       if([...rows].some(([id,q])=>id!==h.id&&q.owner===p.id))throw Error('You already have a home. Release it before choosing another.');
       if(!owner){rows.set(h.id,{owner:p.id,locked:false});changed(p.lobbyId);}
      }else if(m.t==='house.release'){
       if(owner?.owner!==p.id)throw Error('Only the owner can release this home.');release(p.lobbyId,h.id);
      }else if(m.t==='house.lock'){
       if(owner?.owner!==p.id)throw Error('Only the owner can change the lock.');
       if(typeof m.locked!=='boolean')throw Error('Invalid lock setting.');
       owner.locked=m.locked;changed(p.lobbyId);
      }else if(m.t==='house.door'){
       // Travel arrives OUTSIDE. It never bypasses a locked door.
       exit(p,'',false);teleport(p,h.door);changed(p.lobbyId);
      }else if(m.t==='house.rest'){
       const s=homeSpot(m.spot),v=occupied(p);
       if(v?.house!==h.id||v.lobby!==p.lobbyId||!nearHomeSpot(h,s,p.lastPosition?.p))throw Error('Walk beside the sofa or bed first.');
       if([...rests].some(([id,r])=>id!==p.id&&r.lobby===p.lobbyId&&r.house===h.id&&r.spot===s.id))throw Error('Someone is using that spot. Try the other seat.');
       rests.set(p.id,{house:h.id,lobby:p.lobbyId,spot:s.id});teleport(p,spotPosition(h,s),h.id);changed(p.lobbyId);
      }else if(m.t==='house.bell'){
       if(!owner||owner.owner===p.id||occupied(p)||!nearDoor(h,p.lastPosition?.p))throw Error('Walk to your friend’s front door to ring.');
       const host=hub.players.get(owner.owner),homeKey=p.lobbyId+':'+h.id;
       if(!host?.online)throw Error('The owner is reconnecting. Try again shortly.');
       if(now-(bells.get(p.id)||-Infinity)<4000||now-(bells.get(homeKey)||-Infinity)<2000)throw Error('The bell just rang. Give your friend a moment.');
       bells.set(p.id,now);bells.set(homeKey,now);
       hub.send(host.online,{t:'house.bell',house:h.id,from:p.id,name:p.name||'Guest'});
      }else if(m.t==='house.invite'){
       if(owner?.owner!==p.id)throw Error('Only the owner can invite guests.');
       const guest=hub.players.get(m.target);
       if(hub.safety?.blocked(p.id,guest?.id))throw Error('This player is unavailable for contact.');
       if(!guest?.online||guest.id===p.id||guest.lobbyId!==p.lobbyId||guest.roomId||!hub.lobbies.get(p.lobbyId)?.members.has(guest.id))throw Error('Choose an online friend in this lobby.');
       let inbox=invites.get(guest.id);if(!inbox){inbox=new Map();invites.set(guest.id,inbox);}
       const key=p.lobbyId+':'+h.id,old=inbox.get(key);
       if(old&&validInvite(guest,old))throw Error('Your invitation is already waiting for them.');
       inbox.set(key,{house:h.id,lobby:p.lobbyId,owner:p.id,expires:now+300000});sendState(guest);
      }else if(m.t==='house.accept'||m.t==='house.decline'){
       const inbox=invites.get(p.id),key=p.lobbyId+':'+h.id,i=inbox?.get(key);
       if(!i||!validInvite(p,i)){inbox?.delete(key);throw Error('This invitation has expired. Ask for another.');}
       inbox.delete(key);if(m.t==='house.accept')enter(p,h);
      }else if(m.t==='house.enter'){
       if(!owner)throw Error('Claim this home before entering.');
       if(owner.locked&&owner.owner!==p.id)throw Error('This door is locked. Ask the owner to open it.');
       if(occupied(p)?.house!==h.id&&!nearDoor(h,p.lastPosition?.p))throw Error('Walk to the front door first.');
       enter(p,h);
      }else throw Error('Unknown home action.');
     }
    }
    sendState(p);result({t:'house.result',request:req,ok:true});
   }catch(e){result({t:'house.result',request:req,ok:false,message:e.message});sendState(p);}
  }
  hub.message=function(p,m){
   if(typeof m.t==='string'&&m.t.startsWith('house.'))return action(p,m);
   if(occupied(p)&&m.t==='island.mount'){hub.send(p.online,{t:'notice',message:'Leave the house before riding.'});return;}
   const result=original.message.call(this,p,m);
   if(occupied(p)&&(p.roomId||occupied(p).lobby!==p.lobbyId))exit(p);
   return result;
  };
  hub.state=function(p){original.state.call(this,p);sendState(p);};
  hub.lobbyMessage=function(p,m){
   if(m.t==='s'&&Array.isArray(m.p)&&m.p.length===3&&m.p.every(Number.isFinite)){
    const v=occupied(p),h=v&&houseById(v.house);
    // A movement packet sent just before teleport can arrive afterwards on the
    // other socket. It must not undo the authoritative door/room arrival.
    const last=p.lastPosition?.p;
    if(hub.now()<(travelUntil.get(p.id)||0)&&last&&Math.hypot(m.p[0]-last[0],m.p[1]-last[1],m.p[2]-last[2])>10)return;
    const rest=rests.get(p.id);
    if(rest){
     // Movement can't drag a seated avatar through furniture. New clients send
     // stand first; old clients remain safe and can always use Leave home.
     m={...m,p:spotPosition(h,homeSpot(rest.spot)),ry:0,cg:'',e:''};
    }
    const valid=h?inRoom(h,m.p[0],m.p[2],-.35)&&m.p[1]>=h.room.y+.2&&m.p[1]<=h.room.y+7:!isHousingZone(m.p[0],m.p[2]);
    if(!valid){
     if(hub.now()>(travelUntil.get(p.id)||0)&&hub.now()-(corrections.get(p.id)||0)>750){
      corrections.set(p.id,hub.now());teleport(p,h?roomSpawn(h):(p.lastPosition?.p||[163,9.8,121]),h?.id||null);
     }
     return;
    }
    // Grabs must never cross the room boundary, including crafted packets.
    if(m.cg&&(rests.has(m.cg)||occupied(hub.players.get(m.cg)||{})?.house!==v?.house))m={...m,cg:''};
   }
   return original.lobbyMessage.call(this,p,m);
  };
  let cleanupAt=0;
  hub.update=function(){
   original.update.call(this);
   const now=hub.now();if(now-cleanupAt<1000)return;cleanupAt=now;
   for(const [lobby,rows]of homes){
    for(const [id,q]of [...rows]){const p=hub.players.get(q.owner);if(!p||p.lobbyId!==lobby||!hub.lobbies.get(lobby)?.members.has(q.owner))release(lobby,id);}
    if(!rows.size)homes.delete(lobby);
   }
   for(const [id,v]of [...visits]){const p=hub.players.get(id);if(!p){visits.delete(id);rests.delete(id);continue;}if(p.roomId||p.lobbyId!==v.lobby||!hub.lobbies.get(v.lobby)?.members.has(id))exit(p);}
   for(const [id,inbox]of invites){const p=hub.players.get(id),before=inbox.size;for(const [key,i]of inbox)if(!p||!validInvite(p,i))inbox.delete(key);if(!inbox.size)invites.delete(id);if(p&&before!==inbox.size)sendState(p);}
   for(const [id,lobby]of hub.lobbies){const key=JSON.stringify([...lobby.members].map(pid=>{const q=hub.players.get(pid);return [pid,q?.name,!!q?.online,q?.roomId];}));if(rosters.get(id)!==key){rosters.set(id,key);changed(id);}}
   for(const id of rosters.keys())if(!hub.lobbies.has(id))rosters.delete(id);
   for(const [key,at]of bells)if(now-at>10000)bells.delete(key);
   for(const map of [rates,corrections,travelUntil,receipts])for(const id of map.keys())if(!hub.players.has(id))map.delete(id);
  };
  disposers.push(()=>Object.assign(hub,original));
 }
 return {dispose:()=>disposers.forEach(f=>f())};
}
