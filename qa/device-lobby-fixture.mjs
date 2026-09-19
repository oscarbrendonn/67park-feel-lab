// Real protocol peers for a PHYSICAL device test, never sent to the public park.
// One browser + 15 peers = a full 16-seat lobby. Production avatar selection,
// distance culling and model budgets stay unchanged; do not call this 16 draws.
import {onlinePeer,waitUntil} from './online-fixture.mjs';

const origin=process.env.PARK_FIXTURE_ORIGIN||'http://127.0.0.1:8507';
const url=new URL(origin);
if(url.hostname!=='127.0.0.1'||url.protocol!=='http:'||url.pathname!=='/')throw Error('Use an isolated loopback QA origin only');
const positions=JSON.parse(process.env.PARK_FIXTURE_POSITIONS||'null');
if(!Array.isArray(positions)||positions.length!==15||positions.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))throw Error('Provide 15 real sampled ground positions as PARK_FIXTURE_POSITIONS JSON [[x,y,z],...]');
const bases=['goril','friendsie_1','friendsie_100','friendsie_1111','friendsie_12'];
const peers=[];let timer,closed=false;
const close=()=>{if(closed)return;closed=true;clearInterval(timer);for(const peer of peers)peer.close();};
try{
 for(let i=0;i<15;i++)peers.push(await onlinePeer(origin,{name:'Device QA '+(i+1),combo:JSON.stringify({v:3,base:bases[i%bases.length]})}));
 await waitUntil(()=>peers.every(p=>p.data.island?.code===peers[0].data.island.code),'all fixtures in the same island');
 let tick=0;
 timer=setInterval(()=>{
  tick++;
  for(let i=0;i<peers.length;i++){
   const p=positions[i],wave=Math.sin(tick*.06+i)*.12;
   const peer=peers[i];if(peer.sockets[0]?.readyState!==1)continue;
   peer.send({t:'s',p:[p[0]+wave,p[1],p[2]],ry:Math.PI,cm:[1,3,.8,0,0,0,0,0,0]},'ws');
  }
 },120);
 console.log('DEVICE_LOBBY_FIXTURE_READY '+JSON.stringify({peers:peers.length,distinctModels:bases.length,origin,realNetworkPackets:true,renderBudget:'unchanged'}));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{close();process.exit(0)});
}catch(error){close();throw error;}
