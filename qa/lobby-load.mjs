import {fork} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
if(!process.env.PARK_SERVER_PACKAGE)throw Error('Set PARK_SERVER_PACKAGE to the existing server package.json (ws dependency).');
const require=createRequire(process.env.PARK_SERVER_PACKAGE),WS=require('ws');
const origin='https://oscarbrendonn.github.io',child=fork(new URL('./lobby-load-server.mjs',import.meta.url),[],{execArgv:['--max-old-space-size=1536'],stdio:['ignore','pipe','pipe','ipc']});
child.stdout.on('data',b=>process.stdout.write('SERVER '+b));child.stderr.on('data',b=>process.stderr.write('SERVER '+b));
let port,seq=0,active=true,botTraffic,chatTimer;const waiters=new Map(),bots=[],latencies=[],errors=[],closed=[],report={};
child.on('message',m=>{if(m.t==='ready'){port=m.port;waiters.get('ready')?.(m)}else{waiters.get(m.seq)?.(m);waiters.delete(m.seq)}});
const request=t=>new Promise(r=>{const n=++seq;waiters.set(n,r);child.send({t,seq:n})});
const delay=n=>new Promise(r=>setTimeout(r,n));
let received=0,inBytes=0;
async function session(token){const r=await fetch('http://127.0.0.1:'+port+'/kimi/api/session',{headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{})}});if(r.status!==200)return {status:r.status};return {...await r.json(),status:r.status}}
async function socket(bot,channel){return new Promise((resolve,reject)=>{const ws=new WS('ws://127.0.0.1:'+port+'/kimi/'+channel,['67park-v1','guest.'+bot.token],{headers:{Origin:origin}});bot[channel]=ws;ws.on('error',reject);ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',name:'Load'+bot.n,combo:JSON.stringify({base:'goril'})}));resolve(ws)});ws.on('message',raw=>{received++;inBytes+=raw.length;const m=JSON.parse(String(raw));if(m.t==='pong')latencies.push(Date.now()-m.at);if(m.t==='error')errors.push(m.message);if(m.t==='match.snapshot')bot.match=m;if(m.t==='state'){bot.state=m;bot.lobby=m.island?.code;bot.capacity=m.island?.capacity;bot.members=m.island?.players.length}});ws.on('close',(code)=>{if(active&&!bot.reconnecting)closed.push({n:bot.n,channel,code})});})}
function send(bot,ch,m){const ws=bot[ch];if(ws?.readyState===1)ws.send(JSON.stringify(m))}
function summary(v){const a=v.slice().sort((a,b)=>a-b);return {n:a.length,p50:a[Math.floor(a.length*.5)]||0,p95:a[Math.floor(a.length*.95)]||0,p99:a[Math.floor(a.length*.99)]||0,max:a.at(-1)||0};}
async function phase(name,ms){await request('reset');received=inBytes=0;latencies.length=0;await delay(ms);const s=await request('stats');report[name]={server:s,pingMs:summary(latencies),received,inBytes,errors:errors.slice(),closed:closed.slice()};console.log(name,JSON.stringify(report[name]));if(s.rssMB>1500)throw Error('Safety RSS threshold');assert.equal(s.faults,0);}
try{
 await new Promise((resolve,reject)=>{waiters.set('ready',resolve);child.once('exit',c=>reject(Error('Server exited '+c)));setTimeout(()=>reject(Error('Server startup timeout')),90000).unref()});
 console.log('ISOLATED PORT',port);
 for(let i=0;i<100;i++){const s=await session();assert.equal(s.status,200,'session '+i);const b={n:i,token:s.token,id:s.id};bots.push(b);await socket(b,'ws');await socket(b,'online');}
 await delay(500);const state=await request('stats');assert.equal(state.lobbies.length,1);assert.equal(state.lobbies[0].members,100);assert.equal(state.online,100);report.join=state;console.log('100 SAME LOBBY',JSON.stringify(state));
 let tick=0;const motionStart=Date.now();botTraffic=setInterval(()=>{tick++;const t=(Date.now()-motionStart)/1000;for(const b of bots){const a=b.n*.2+t*.3,r=4+(b.n%8)*.25;send(b,'ws',{t:'s',p:[139+Math.cos(a)*r,9.95+Math.max(0,Math.sin(t+b.n))*.3,109+Math.sin(a)*r],ry:a%(Math.PI*2),e:'',cm:[1,3,3,0,0,0,0,0,0]});if(tick%20===0)send(b,'online',{t:'ping',at:Date.now()});}},100);
 chatTimer=setInterval(()=>{for(const b of bots)send(b,'ws',{t:'chat',text:'Load test '+b.n,nonce:String(Date.now())})},3000);
 await phase('steady100',Number(process.env.SOAK_MS)||20000);
 assert(report.steady100.server.types.s>100000,'Motion must actually be accepted and relayed');
 const reconnected=[];for(const b of bots.slice(0,25)){b.reconnecting=true;b.ws.terminate();b.online.terminate();}
 await delay(500);
 for(const b of bots.slice(0,25)){const s=await session(b.token);reconnected.push(s.status);if(s.status===200){await socket(b,'ws');await socket(b,'online');b.reconnecting=false;}}
 report.reconnectHTTP=reconnected;console.log('RECONNECT HTTP',JSON.stringify(reconnected));
 await phase('afterReconnect',10000);
 if(process.env.GUARDED){assert(reconnected.every(s=>s===200));assert.equal(report.afterReconnect.server.online,100);assert.deepEqual(errors,[]);assert.deepEqual(closed,[]);}
 
 if(process.env.MINIGAMES){
  report.minigames=[];
  async function until(check){const until=Date.now()+10000;while(!check()){if(Date.now()>until)throw Error('Game state timeout');await delay(50)}}
  for(const mode of ['balloon','basket','penalty','race','rockets']){
   const group=bots.slice(0,mode==='rockets'?4:2),host=group[0],startErrors=errors.length;
   send(host,'online',{t:'room.create',capacity:group.length,mode,teamMode:'solo'});await until(()=>host.state?.room?.mode===mode&&host.state.room.status==='waiting');
   const code=host.state.room.code;
   for(const b of group.slice(1))send(b,'online',{t:'room.join',code});
   await until(()=>host.state.room.members.length===group.length);
   send(host,'online',{t:'room.start'});await until(()=>host.state.room.status==='loading');
   for(const b of group){b.match=null;send(b,'online',{t:'match.ready',code})}
   await until(()=>group.every(b=>b.match?.status==='playing'));
   const before=host.match.now,initialActor=host.match.players.find(p=>p.id===host.id);
   const modeIndex=['balloon','basket','penalty','race','rockets'].indexOf(mode);
   for(let seq=1;seq<=20;seq++){for(const b of group){
    const common={seq:10000+modeIndex*100+seq,t:mode==='race'?'race.input':mode==='rockets'?'rocket.input':mode==='basket'||mode==='penalty'?'sports.input':'input'};
    send(b,'online',{...common,x:.5,y:.2,z:.5,jump:seq===1,ax:0,az:1,fire:seq%5===0,throttle:1,steer:.2,aim:.2,action:seq===2?'charge':seq===10?'release':'aim'});
   }await delay(100)}
   assert(host.match.now>before,'Simulation snapshots must advance');
   assert.equal(errors.length,startErrors,'No game protocol errors');
   const actor=host.match.players.find(p=>p.id===host.id);
   if(mode==='basket'||mode==='penalty')assert(host.match.ball||host.match.phase!=='aim','Shot must actually start');
   else {const a=actor.p||[actor.x,actor.y,actor.z],b=initialActor.p||[initialActor.x,initialActor.y,initialActor.z];assert(Math.hypot(a[0]-b[0],a[2]-b[2])>.1,'Input must actually move actor');}
   report.minigames.push({mode,players:group.length,status:host.match.status,snapshotAdvanceMs:host.match.now-before});
   for(const b of group)send(b,'online',{t:'room.leave'});
   await until(()=>group.every(b=>!b.state?.room));await delay(200);
  }
  console.log('MINIGAME SERVER SMOKE',JSON.stringify(report.minigames));
 }

 report.final={errors,closed};const file=process.env.REPORT|| (process.env.GUARDED?'guarded.json':'baseline.json');fs.writeFileSync(new URL('./'+file,import.meta.url),JSON.stringify(report,null,2));
 console.log('RESULT WRITTEN',new URL('./'+file,import.meta.url).pathname);
}finally{active=false;clearInterval(botTraffic);clearInterval(chatTimer);for(const b of bots){b.ws?.terminate();b.online?.terminate()}child.send({t:'stop'});setTimeout(()=>child.kill('SIGTERM'),5000).unref()}
