import test from 'node:test';
import assert from 'node:assert/strict';
import {installHousing} from '../server/housing.mjs';
import {HOUSES,roomSpawn,roomObstacle} from '../app/housing-layout.js';
import {keepChatSendFocused} from '../app/chat-send-focus.js';
import {HOME_SPOTS,spotPosition} from '../app/housing-actions.js';
function fixture(){
 let at=10000;const sent=[];
 const hub={now:()=>at,players:new Map(),lobbies:new Map([['A',{members:new Set()}],['B',{members:new Set()}]]),
  send(ws,m){if(ws)sent.push({id:ws.id,...m});},lobbyBroadcast(){},state(){},update(){},
  message(p,m){if(m.t==='room.create')p.roomId='test';},
  lobbyMessage(p,m){if(m.t==='s')p.lastPosition=m;},islandWorld:()=>({mounts:new Map()}),
 };
 installHousing({hubs:new Map([['kimi',hub]])});
 function player(id,lobbyId='A'){const p={id,name:id,lobbyId,online:{id},roomId:'',lastPosition:{p:[...HOUSES[0].door]}};hub.players.set(id,p);hub.lobbies.get(lobbyId).members.add(id);return p;}
 const a=player('alice'),b=player('bob'),c=player('cara','B');
 function act(p,t,extra={}){at+=401;hub.message(p,{t:'house.'+t,house:'H01',request:'test',...extra});return sent.findLast(m=>m.id===p.id&&m.t==='house.result');}
 const state=p=>{act(p,'sync');return sent.findLast(m=>m.id===p.id&&m.t==='house.state');};
 return {hub,a,b,c,act,state,sent,advance:ms=>at+=ms};
}
test('one owner per home, one home per player, distinct islands stay independent',()=>{
 const f=fixture();assert(f.act(f.a,'claim').ok);assert(!f.act(f.b,'claim',{owner:'alice'}).ok);
 assert(!f.act(f.a,'claim',{house:'H02'}).ok);assert(f.act(f.c,'claim').ok);
 assert.equal(f.state(f.a).houses[0].owner,'alice');assert.equal(f.state(f.c).houses[0].owner,'cara');
});
test('door proximity, locked entry, lock authority and visiting peers',()=>{
 const f=fixture();f.act(f.a,'claim');f.b.lastPosition={p:[0,10,0]};assert(!f.act(f.b,'enter').ok);
 f.act(f.b,'door');f.act(f.a,'lock',{locked:true});assert(!f.act(f.b,'lock',{locked:false}).ok);assert(!f.act(f.b,'enter').ok);
 assert(f.act(f.a,'enter').ok);f.act(f.a,'lock',{locked:false});assert(f.act(f.b,'enter').ok);assert.equal(f.state(f.a).houses[0].guests,2);
 f.act(f.a,'lock',{locked:true});assert.equal(f.state(f.b).visiting,'H01','locking does not eject existing guests');
});
test('crafted interior movement without admission and cross-home movement are rejected',()=>{
 const f=fixture(),before=f.b.lastPosition;
 f.hub.lobbyMessage(f.b,{t:'s',p:roomSpawn(HOUSES[0])});assert.deepEqual(f.b.lastPosition.p,before.p);
 f.act(f.a,'claim');f.act(f.a,'enter');f.advance(1100);
 f.hub.lobbyMessage(f.a,{t:'s',p:roomSpawn(HOUSES[1])});assert.deepEqual(f.a.lastPosition.p,roomSpawn(HOUSES[0]));
});
test('sync restores visit; release returns all guests to the original door',()=>{
 const f=fixture();f.act(f.a,'claim');f.act(f.a,'enter');f.act(f.b,'enter');
 assert.equal(f.state(f.b).visiting,'H01');assert(f.act(f.a,'release').ok);
 for(const p of [f.a,f.b]){assert.equal(f.state(p).visiting,null);assert.deepEqual(p.lastPosition.p,HOUSES[0].door);}
 assert.equal(f.state(f.a).houses[0].owner,null);
});
test('disconnect reservation follows lobby grace and expired ownership is released',()=>{
 const f=fixture();f.act(f.a,'claim');f.act(f.a,'enter');f.a.online=null;f.advance(5000);f.hub.update();
 assert.equal(f.state(f.b).houses[0].owner,'alice');
 f.hub.lobbies.get('A').members.delete('alice');f.advance(21000);f.hub.update();assert.equal(f.state(f.b).houses[0].owner,null);
});
test('mini-game transition exits the interior; unknown commands and malformed lock are rejected',()=>{
 const f=fixture();f.act(f.a,'claim');assert(!f.act(f.a,'lock',{locked:'true'}).ok);assert(!f.act(f.a,'something').ok);
 f.act(f.a,'enter');f.hub.message(f.a,{t:'room.create'});assert.deepEqual(f.a.lastPosition.p,HOUSES[0].door);
 assert(!f.act(f.a,'enter').ok);
});
test('1000 repeated home actions remain bounded',()=>{
 const f=fixture();for(let i=0;i<1000;i++)f.hub.message(f.a,{t:'house.claim',house:'H01'});
 assert(f.sent.length<50);assert.equal(f.state(f.a).houses.filter(h=>h.owner==='alice').length,1);
});
test('stale pre-travel motion cannot undo arriving at the door',()=>{
 const f=fixture();f.act(f.a,'claim');f.act(f.a,'door');
 f.hub.lobbyMessage(f.a,{t:'s',p:[163,9.8,121]});assert.deepEqual(f.a.lastPosition.p,HOUSES[0].door);assert(f.act(f.a,'enter').ok);
});
test('interior boundary and furniture collision leave the main walking route open',()=>{
 const h=HOUSES[0],r=h.room;
 assert(!roomObstacle(h,r.x,r.y+.555,r.z));assert(roomObstacle(h,r.x+6.9,r.y+.555,r.z));
 assert(roomObstacle(h,r.x-4.5,r.y+.555,r.z-2.3));assert(!roomObstacle(h,r.x-4.5,r.y+3,r.z-2.3));
});
test('different houses are outside the avatar render range',()=>{
 for(const a of HOUSES)for(const b of HOUSES)if(a!==b)assert(Math.hypot(a.room.x-b.room.x,a.room.z-b.room.z)-20>115);
});
test('Send preserves input focus, but chat opener and unrelated buttons keep default behavior',()=>{
 let prevented=0;const event=input=>({cancelable:true,target:{closest:()=>({closest:()=>({querySelector:()=>input})})},preventDefault:()=>prevented++});
 keepChatSendFocused(event({}));assert.equal(prevented,1);
 keepChatSendFocused(event(null));keepChatSendFocused({cancelable:true,target:{closest:()=>null},preventDefault:()=>prevented++});assert.equal(prevented,1);
});
test('private invitation needs owner authority, same lobby and explicit acceptance; works through locked door',()=>{
 const f=fixture();f.act(f.a,'claim');f.act(f.a,'lock',{locked:true});
 assert(!f.act(f.b,'invite',{target:'alice'}).ok);assert(!f.act(f.a,'invite',{target:'cara'}).ok);
 assert(!f.act(f.b,'accept').ok);assert(f.act(f.a,'invite',{target:'bob'}).ok);
 assert.equal(f.state(f.b).visiting,null,'an invitation must never teleport the recipient');
 assert.equal(f.state(f.b).invitations.length,1);assert.equal(f.state(f.a).invitations.length,0);
 assert(!f.act(f.a,'invite',{target:'bob'}).ok,'deduplicates pending invites');
 f.b.lastPosition={p:[163,9.8,121]};assert(f.act(f.b,'accept').ok);assert.equal(f.state(f.b).visiting,'H01');
 assert(!f.act(f.b,'accept').ok,'one-use invitation');
});
test('decline, expiry, changing lobby and releasing home invalidate invitations',()=>{
 for(const mode of ['decline','expiry','lobby','release']){
  const f=fixture();f.act(f.a,'claim');f.act(f.a,'invite',{target:'bob'});
  if(mode==='decline')assert(f.act(f.b,'decline').ok);
  if(mode==='expiry')f.advance(300001);
  if(mode==='lobby'){f.b.lobbyId='B';f.hub.lobbies.get('B').members.add('bob');}
  if(mode==='release'){f.act(f.a,'release');f.act(f.a,'claim');}
  assert(!f.act(f.b,'accept').ok,mode);assert.equal(f.state(f.b).visiting,null);
 }
});
test('bell reaches only owner, requires doorway, and repeated rings stay bounded',()=>{
 const f=fixture();f.act(f.a,'claim');assert(f.act(f.b,'bell').ok);
 assert.deepEqual(f.sent.filter(m=>m.t==='house.bell').map(m=>m.id),['alice']);
 assert(!f.act(f.b,'bell').ok);f.advance(4000);f.b.lastPosition={p:[0,0,0]};assert(!f.act(f.b,'bell').ok);
 f.b.lastPosition={p:HOUSES[0].door};f.sent.length=0;
 for(let i=0;i<1000;i++)f.hub.message(f.b,{t:'house.bell',house:'H01'});
 assert(f.sent.length<50);assert.equal(f.sent.filter(m=>m.t==='house.bell').length,1);
});
test('rest slots require admission and proximity, are exclusive and publish both players poses',()=>{
 const f=fixture(),h=HOUSES[0],s=HOME_SPOTS[0];f.act(f.a,'claim');
 assert(!f.act(f.b,'rest',{spot:s.id}).ok);f.act(f.a,'enter');f.act(f.b,'enter');
 assert(!f.act(f.a,'rest',{spot:s.id}).ok,'not in range from doorway');
 f.a.lastPosition={p:spotPosition(h,s,true)};assert(f.act(f.a,'rest',{spot:s.id}).ok);
 f.b.lastPosition={p:spotPosition(h,s,true)};assert(!f.act(f.b,'rest',{spot:s.id}).ok);
 const other=HOME_SPOTS[1];f.b.lastPosition={p:spotPosition(h,other,true)};assert(f.act(f.b,'rest',{spot:other.id}).ok);
 assert.equal(f.state(f.a).poses.length,2);assert.equal(f.state(f.b).rest,other.id);
 f.hub.lobbyMessage(f.a,{t:'s',p:[h.room.x+2,h.room.y+.555,h.room.z+1]});assert.deepEqual(f.a.lastPosition.p,spotPosition(h,s));
 f.act(f.a,'exit');assert.equal(f.state(f.b).poses.length,1);f.act(f.a,'release');assert.equal(f.state(f.b).rest,null);
});
test('all eight rooms have collision-free stand points, and standing escapes after action spam',()=>{
 for(const h of HOUSES)for(const s of HOME_SPOTS)assert(!roomObstacle(h,...spotPosition(h,s,true)),h.id+' '+s.id);
 const f=fixture(),h=HOUSES[0],s=HOME_SPOTS[2];f.act(f.a,'claim');f.act(f.a,'enter');f.a.lastPosition={p:spotPosition(h,s,true)};
 assert(f.act(f.a,'rest',{spot:s.id}).ok);
 for(let i=0;i<1000;i++)f.hub.message(f.a,{t:'house.rest',house:h.id,spot:s.id});
 f.hub.message(f.a,{t:'house.stand'});assert.deepEqual(f.a.lastPosition.p,spotPosition(h,s,true));
 f.advance(4000);assert.equal(f.state(f.a).rest,null);assert.equal(f.state(f.a).poses.length,0);
});
test('new lobby arrivals refresh the invitation roster and expired invites disappear',()=>{
 const f=fixture();f.act(f.a,'claim');f.act(f.a,'invite',{target:'bob'});f.hub.update();
 const p={id:'dan',name:'Dan',lobbyId:'A',online:{id:'dan'}};f.hub.players.set('dan',p);f.hub.lobbies.get('A').members.add('dan');f.advance(1100);f.hub.update();
 assert(f.sent.findLast(m=>m.id==='alice'&&m.t==='house.state').people.some(p=>p.id==='dan'));
 f.advance(300001);f.hub.update();assert.equal(f.sent.findLast(m=>m.id==='bob'&&m.t==='house.state').invitations.length,0);
});
