// Bounded, isolated fixture for one physical phone plus 15 real network peers.
import http from 'node:http';
import {androidPage} from './android-cdp.mjs';
import {onlinePeer,waitUntil} from './online-fixture.mjs';
const origin='http://127.0.0.1:8521',peers=[],page=await androidPage(origin);
const bases=['goril','friendsie_1','friendsie_100','friendsie_1111','friendsie_12'];
const durationMs=Number(process.env.PARK_FIXTURE_MS||3600000);
if(!Number.isFinite(durationMs)||durationMs<60000||durationMs>7200000){page.close();throw Error('Fixture duration must be 1 minute to 2 hours')}
let timer,deadline,server,mixed=false,busy=false,closed=false;
const close=()=>{if(closed)return;closed=true;clearInterval(timer);clearTimeout(deadline);for(const p of peers)p.close();server?.close();page.close()};
try{
 const positions=await page.evaluate(`(()=>{const w=__islandWorld,p=__eggyInput.playerRef.body.translation(),yaw=2.67,out=[];for(let row=0;row<3;row++)for(let col=-2;col<=2;col++){const d=2+row*1.6,s=col*1.2,x=p.x-Math.sin(yaw)*d+Math.cos(yaw)*s,z=p.z-Math.cos(yaw)*d-Math.sin(yaw)*s,h=w.sample(x,z);if(!h)throw Error('No floor for fixture');out.push([x,h.point.y+.555,z])}return out})()`);
 for(let i=0;i<15;i++)peers.push(await onlinePeer(origin,{name:'Device QA '+(i+1),combo:JSON.stringify({v:3,base:bases[i%bases.length]})}));
 await waitUntil(()=>peers.every(p=>p.data.island?.code===peers[0].data.island.code),'one island');
 await waitUntil(()=>peers.every(p=>p.data.island.players.length===16),'all rosters contain 16 seats');
 let tick=0;timer=setInterval(()=>{tick++;for(let i=0;i<peers.length;i++){
  if(mixed&&i<5)continue;const p=peers[i],at=positions[i];
  if(p.sockets[0]?.readyState===1)p.send({t:'s',p:[at[0]+Math.sin(tick*.06+i)*.12,at[1],at[2]],ry:Math.PI,cm:[1,3,.8,0,0,0,0,0,0]},'ws');
 }},120);
 const summary=()=>({mixed,busy,fixturePeers:peers.length,connected:peers.filter(p=>p.sockets.every(s=>s.readyState===1)).length,networkSeats:peers[0].data.island?.players.length,
  matches:[peers[0],peers[2]].map(p=>({room:p.data.room?.code??null,status:p.data.room?.status??null,snapshotAt:p.latest('match.snapshot')?.now??null})),home:peers[4].home?.visiting??null});
 const makeMatch=async(a,b)=>{
  a.send({t:'room.create',capacity:2,mode:'balloon'});await waitUntil(()=>a.data.room?.code,'room');const code=a.data.room.code;
  b.send({t:'room.join',code});await waitUntil(()=>a.data.room?.members.length===2,'join');a.send({t:'room.start'});await waitUntil(()=>b.data.room?.status==='loading','loading');
  a.send({t:'match.ready',code});b.send({t:'match.ready',code});await waitUntil(()=>a.latest('match.snapshot')?.status==='playing','playing');
 };
 server=http.createServer(async(req,res)=>{
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  if(req.method==='GET'&&req.url==='/state'){send(200,summary());return}
  if(req.method!=='POST'||req.url!=='/mixed'){send(404,{});return}
  if(busy||mixed){send(409,summary());return}busy=true;
  try{
   await makeMatch(peers[0],peers[1]);await makeMatch(peers[2],peers[3]);
   const resident=peers[4];resident.send({t:'house.claim',house:'H01'});await waitUntil(()=>resident.home?.houses.find(h=>h.id==='H01')?.owner===resident.id,'claim');
   resident.send({t:'house.door',house:'H01'});await waitUntil(()=>resident.latest('house.travel'),'door');resident.send({t:'house.enter',house:'H01'});await waitUntil(()=>resident.home?.visiting==='H01','home');
   mixed=true;busy=false;send(200,summary());
  }catch(error){busy=false;send(500,{error:error.message,...summary()})}
 });
 server.listen(8522,'127.0.0.1',()=>console.log('ANDROID_LOBBY_READY '+JSON.stringify(summary())));
 deadline=setTimeout(()=>{console.log('ANDROID_LOBBY_COMPLETE bounded fixture deadline');close()},durationMs);
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{close();process.exit(0)});
}catch(error){close();throw error}
