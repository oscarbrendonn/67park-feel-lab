import WebSocket from 'ws';
export const waitUntil=async(predicate,label='condition',timeout=15000)=>{
 const end=Date.now()+timeout;while(Date.now()<end){const value=predicate();if(value)return value;await new Promise(r=>setTimeout(r,30));}throw Error('Timed out: '+label);
};
export async function onlinePeer(origin,{name='QA guest',combo=JSON.stringify({v:3,base:'goril'}),token}={}){
 const response=await fetch(origin+'/kimi/api/session?protocol=1',{headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{})}});
 if(!response.ok)throw Error('QA session '+response.status);
 const guest=await response.json(),peer={...guest,messages:[],sockets:[],data:null,home:null};
 peer.send=(m,channel='online')=>peer.sockets[channel==='online'?1:0]?.send(JSON.stringify(m));
 peer.latest=type=>peer.messages.findLast(m=>m.t===type);
 peer.close=()=>{for(const s of peer.sockets)s.terminate();};
 peer.connect=async()=>{
  peer.sockets=[];
  for(const channel of ['ws','online']){
   const ws=new WebSocket(origin.replace('http','ws')+'/kimi/'+channel+'?protocol=1',['67park-v1','guest.'+peer.token],{headers:{Origin:origin}});
   ws.on('error',()=>{});ws.on('message',wire=>{const m=JSON.parse(wire);peer.messages.push(m);if(peer.messages.length>1500)peer.messages.splice(0,500);if(m.t==='state')peer.data=m;if(m.t==='house.state')peer.home=m;});
   peer.sockets.push(ws);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('QA socket timed out')),10000);ws.once('open',()=>{clearTimeout(timer);resolve()});ws.once('error',e=>{clearTimeout(timer);reject(e)});});
   ws.send(JSON.stringify({t:'hello',name,combo}));
  }
  await waitUntil(()=>peer.data?.me?.id===peer.id,'guest state');return peer;
 };
 await peer.connect();return peer;
}
