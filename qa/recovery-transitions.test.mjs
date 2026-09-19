import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {createPreviewServer} from '../server/create-server.mjs';
import {onlinePeer,waitUntil} from './online-fixture.mjs';

test('incompatible protocols fail clearly before admission, including authenticated renewal and websocket',async()=>{
 const origin='http://127.0.0.1:8509',app=await createPreviewServer({origins:[origin],worldSource:null});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;let ws;
 try{
  const headers={Origin:origin},guest=await(await fetch(base+'/kimi/api/session?protocol=1',{headers})).json();
  assert.equal(guest.protocol.min,1);
  for(const auth of [{},{Authorization:'Bearer '+guest.token}]){
   const response=await fetch(base+'/kimi/api/session?protocol=2',{headers:{...headers,...auth}});
   assert.equal(response.status,426);assert.equal((await response.json()).code,'CLIENT_UPDATE_REQUIRED');
  }
  assert.equal(app.hubs.get('kimi').players.size,1);
  ws=new WebSocket(base.replace('http','ws')+'/kimi/online?protocol=2',['67park-v1','guest.'+guest.token],{headers});ws.on('error',()=>{});
  assert.equal(await new Promise(resolve=>ws.once('close',resolve)),4009);
 }finally{ws?.terminate();await app.close();}
});

test('16-person island: two matches, home and lobby remain alive while each context reconnects',{timeout:30000},async()=>{
 // Bind first to learn the origin, then add it to the explicit QA allowlist.
 const app=await createPreviewServer({origins:['http://127.0.0.1:8511'],worldSource:null});
 await new Promise(r=>app.server.listen(8511,'127.0.0.1',r));const origin='http://127.0.0.1:8511',peers=[];
 try{
  for(let i=0;i<16;i++)peers.push(await onlinePeer(origin,{name:'Mixed context '+i}));
  const hub=app.hubs.get('kimi');assert.equal(hub.lobbies.size,1);assert.equal([...hub.lobbies.values()][0].members.size,16);
  async function match(a,b){
   a.send({t:'room.create',capacity:2,mode:'balloon'});await waitUntil(()=>a.data.room?.code,'room created');const code=a.data.room.code;
   b.send({t:'room.join',code});await waitUntil(()=>a.data.room?.members.length===2,'two seats');
   a.send({t:'room.start'});await waitUntil(()=>b.data.room?.status==='loading','loading');
   for(const p of [a,b])p.send({t:'match.ready',code});
   await waitUntil(()=>a.latest('match.snapshot')?.status==='playing','playing');return code;
  }
  const first=await match(peers[0],peers[1]),second=await match(peers[2],peers[3]);
  const resident=peers[4],observer=peers[5];
  resident.send({t:'house.claim',house:'H01'});await waitUntil(()=>resident.home?.houses.find(h=>h.id==='H01')?.owner===resident.id,'home claimed');
  resident.send({t:'house.door',house:'H01'});await waitUntil(()=>resident.latest('house.travel'),'front door');
  resident.send({t:'house.enter',house:'H01'});await waitUntil(()=>resident.home?.visiting==='H01','inside home');
  for(const affected of [peers[0],resident,observer]){
   const before=peers[3].latest('match.snapshot').now,room=affected.data.room?.code;
   affected.close();await waitUntil(()=>!hub.players.get(affected.id).online,'server sees disconnect');
   const renewed=await(await fetch(origin+'/kimi/api/session?protocol=1',{headers:{Origin:origin,Authorization:'Bearer '+affected.token}})).json();assert.equal(renewed.id,affected.id);
   await affected.connect();await waitUntil(()=>hub.players.get(affected.id).online?.readyState===1,'connected again');
   assert.equal(affected.data.room?.code,room);
   if(affected===resident){affected.send({t:'house.sync'});await waitUntil(()=>affected.home?.visiting==='H01','home resumed');}
   await waitUntil(()=>peers[3].latest('match.snapshot').now>before,'unaffected match advances');
   assert.equal(hub.rooms.get(first).status,'playing');assert.equal(hub.rooms.get(second).status,'playing');
   assert.equal(resident.home.visiting,'H01');assert.equal(observer.data.room,null);
   assert(peers.filter(p=>p!==affected).every(p=>p.sockets.every(s=>s.readyState===1)));
  }
  observer.send({t:'chat',text:'Still here after reconnect',nonce:'mixed-context'},'ws');
  await waitUntil(()=>peers[6].messages.some(m=>m.t==='chat'&&m.nonce==='mixed-context'),'lobby chat still works');
  // Fail only one room deliberately; the other simulation, home, and island stay live.
  hub.rooms.get(first).sim.step=()=>{throw Error('Isolated QA match failure')};
  const before=peers[3].latest('match.snapshot').now;
  await waitUntil(()=>hub.rooms.get(first).status==='waiting','room fault recovered');
  await waitUntil(()=>peers[3].latest('match.snapshot').now>before,'sibling survived fault');
  assert.equal(resident.home.visiting,'H01');assert.equal(hub.lobbies.size,1);assert.equal(hub.players.size,16);
  assert.equal((await(await fetch(origin+'/health')).json()).faults,0);
 }finally{for(const p of peers)p.close();await app.close();}
});
