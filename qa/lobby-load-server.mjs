import {monitorEventLoopDelay} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
if(!process.env.PARK_SERVER_FACTORY)throw Error('Set PARK_SERVER_FACTORY to the existing createVehicleServer module. Never supply the live listening entrypoint.');
const {createVehicleServer}=await import(pathToFileURL(process.env.PARK_SERVER_FACTORY));
import {installLobbyLoadGuard} from '../server/lobby-load-guard.mjs';
const app=await createVehicleServer();
for(const hub of app.hubs.values())hub.lobbyCapacity=100;
const guard=process.env.GUARDED?installLobbyLoadGuard(app,{capacity:100}):null;
let sent=0,bytes=0,dropped=0,maxBuffered=0,types={},phaseAt=performance.now(),cpu=process.cpuUsage();
const lag=monitorEventLoopDelay({resolution:10});lag.enable();
for(const hub of app.hubs.values()){
 const original=hub.attach;
 hub.attach=function(p,ws,ch){const send=ws.send;ws.send=function(data,...args){maxBuffered=Math.max(maxBuffered,ws.bufferedAmount);sent++;bytes+=Buffer.byteLength(data);const type=typeof data==='string'?/"t":"([^"]+)"/.exec(data)?.[1]:'binary';types[type]=(types[type]||0)+1;return send.call(this,data,...args)};return original.call(this,p,ws,ch)};
}
function stats(){const delta=process.cpuUsage(cpu),elapsed=performance.now()-phaseAt;return {elapsedMs:elapsed,cpuPercent:(delta.user+delta.system)/elapsed/10,rssMB:process.memoryUsage().rss/1048576,heapMB:process.memoryUsage().heapUsed/1048576,lagP95Ms:lag.percentile(95)/1e6,lagP99Ms:lag.percentile(99)/1e6,lagMaxMs:lag.max/1e6,sent,bytes,dropped,maxBuffered,types,faults:app.faults,lobbies:[...app.hubs.get('kimi').lobbies.values()].map(l=>({members:l.members.size,code:l.code})),players:app.hubs.get('kimi').players.size,online:[...app.hubs.get('kimi').players.values()].filter(p=>p.online&&p.lobbySocket).length};}
process.on('message',async m=>{if(m.t==='stats')process.send({t:'stats',seq:m.seq,...stats()});if(m.t==='reset'){sent=bytes=dropped=maxBuffered=0;types={};phaseAt=performance.now();cpu=process.cpuUsage();lag.reset();process.send({t:'reset',seq:m.seq});}if(m.t==='stop'){await app.close();process.exit(0)}});
app.server.listen(0,'127.0.0.1',()=>process.send({t:'ready',port:app.server.address().port}));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
