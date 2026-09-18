import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {reconcileLobbyRoster,selectLobbyRemotes,queueLobbyNotification} from '../app/lobby-roster.js';
import {installLobbyLoadGuard} from '../server/lobby-load-guard.mjs';

test('near-equal neighbours stay stable, nearer arrivals win, render budget stays bounded',()=>{
 const make=(id,x)=>({id,targetP:[x,1,0]});
 const a=make('a',3),b=make('b',4),c=make('c',3.9);
 assert.deepEqual(selectLobbyRemotes([a,b,c],{x:0,z:0},2,[a,b]),[a,b]);
 c.targetP[0]=1;assert.deepEqual(selectLobbyRemotes([a,b,c],{x:0,z:0},2,[a,b]),[a,c]);
 a.targetP=[NaN,0,0];assert.equal(selectLobbyRemotes([a,b,c],{x:0,z:0},8).length,2);
 b.targetP=[116,0,0];assert.deepEqual(selectLobbyRemotes([a,b,c],{x:0,z:0},8),[c]);
});
test('a thousand network packets coalesce without losing latest state or version',()=>{
 const scheduled=[];let calls=0;const client={version:0,listeners:new Set([()=>calls++])};
 for(let i=0;i<1000;i++)queueLobbyNotification(client,cb=>scheduled.push(cb));
 assert.equal(client.version,1000);assert.equal(scheduled.length,1);assert.equal(calls,0);
 scheduled.shift()();assert.equal(calls,1);
 queueLobbyNotification(client,cb=>scheduled.push(cb));scheduled.shift()();assert.equal(calls,2);
});
test('roster refresh preserves animation, interpolation and render identity',()=>{
 const a={id:'a',name:'old',combo:'goril',p:[1,2,3],targetP:[4,5,6],emote:'wave'};
 const map=new Map([['a',a],['gone',{id:'gone'}]]);
 let made=0;const make=p=>{made++;return {...p}};
 reconcileLobbyRoster(map,[{id:'self'},{id:'a',name:'new',p:[179,12,121]},{id:'b',name:'b'}],make,'self');
 assert.equal(map.get('a'),a);assert.deepEqual(a.p,[1,2,3]);assert.equal(a.emote,'wave');
 assert.equal(a.name,'new');assert.equal(made,1);assert(!map.has('gone'));assert(!map.has('self'));
 for(let i=0;i<1000;i++)reconcileLobbyRoster(map,[{id:'a',name:'new'},{id:'b',name:'b'}],make,'self');
 assert.equal(made,1);assert.equal(map.get('a'),a);
 reconcileLobbyRoster(map,null,make,'self');assert.equal(map.size,2);
});
function fixture(){
 let now=10000,refresh=0,fallback=0;const players=new Map();
 for(let i=0;i<20;i++){const messages=[],ws={readyState:1,bufferedAmount:0,send(s){messages.push(JSON.parse(s))}};players.set(String(i),{id:String(i),lastPosition:{p:[i,0,0]},lobbySocket:ws,messages})}
 const lobby={code:'test',members:new Set(players.keys())};
 const hub={lobbyCapacity:16,players,lobbies:new Map([['test',lobby]]),now:()=>now,refreshLobby(){refresh++},lobbyBroadcast(){fallback++},close(){},lookup:t=>t==='a'.repeat(43)?players.get('0'):null,session:token=>({token,player:players.get('0')})};
 const server=new EventEmitter();server.on('request',(req,res)=>{res.writeHead(403);res.end('original')});
 const app={hubs:new Map([['kimi',hub]]),server},guard=installLobbyLoadGuard(app,{capacity:100,nearby:2,refreshInterval:5});
 return{hub,lobby,guard,server,players,advance:n=>now+=n,counts:()=>({refresh,fallback})};
}
test('motion prioritizes nearby players, throttles distant, preserves grab pairs, bounds slow queues',()=>{
 const f=fixture();try{
 const m={t:'s',id:'0',p:[0,0,0]};
 f.hub.lobbyBroadcast(f.lobby,m,'0');f.advance(100);f.hub.lobbyBroadcast(f.lobby,m,'0');
 assert.equal(f.players.get('1').messages.length,2);assert.equal(f.players.get('19').messages.length,1);
 f.players.get('19').carryTarget='0';f.advance(100);f.hub.lobbyBroadcast(f.lobby,m,'0');assert.equal(f.players.get('19').messages.length,2);
 f.players.get('1').lobbySocket.bufferedAmount=65536;f.advance(100);f.hub.lobbyBroadcast(f.lobby,m,'0');assert.equal(f.players.get('1').messages.length,3);assert(f.guard.metrics.backpressureDrops>0);
 f.hub.lobbyBroadcast(f.lobby,{t:'chat',text:'hello'},'0');assert.equal(f.counts().fallback,1);
 }finally{f.guard.dispose()}
});
test('join burst coalesces full roster refreshes and cancel on dispose',async()=>{
 const f=fixture();for(let i=0;i<100;i++)f.hub.refreshLobby(f.lobby);
 await new Promise(r=>setTimeout(r,20));assert.equal(f.counts().refresh,1);f.guard.dispose();
});
test('authenticated renewals keep per-session limit and untrusted origin/unknown token use original validation',()=>{
 const f=fixture();function request(token='a'.repeat(43),origin='https://oscarbrendonn.github.io'){
  const response={status:0,writeHead(code){this.status=code},end(body){this.body=body}};
  f.server.emit('request',{method:'GET',url:'/kimi/api/session',headers:{origin,authorization:'Bearer '+token}},response);return response;
 }
 try{for(let i=0;i<12;i++)assert.equal(request().status,200);assert.equal(request().status,429);assert.equal(request('b'.repeat(43)).status,403);assert.equal(request('a'.repeat(43),'https://not-allowed.example').status,403)}
 finally{f.guard.dispose()}
});
