// Real phone telemetry. No emulated viewport, renderer cap, cheap avatars or
// production preference overrides. Interactions use a separate debugger socket.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {androidPage} from './android-cdp.mjs';
export function installPhoneMetrics(){
 if(window.__phoneQA)return true;
 let start=performance.now(),last=0,lastDraw=-1,ticks=0,draws=0,max=0,total=0,hidden=0,hiddenAt=document.hidden?start:null;
 let losses=0,errors=0,tasks=0,taskMs=0,frame,observer;const bins=new Uint32Array(1001);
 const reset=()=>{start=performance.now();last=0;ticks=draws=max=total=tasks=taskMs=hidden=0;bins.fill(0);hiddenAt=document.hidden?start:null};
 const onVisibility=()=>{const now=performance.now();if(document.hidden)hiddenAt=now;else if(hiddenAt!==null){hidden+=now-hiddenAt;hiddenAt=null}last=0};
 document.addEventListener('visibilitychange',onVisibility);
 const onLoss=()=>losses++,onError=()=>errors++;
 document.addEventListener('webglcontextlost',onLoss,true);
 window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onError);
 try{observer=new PerformanceObserver(list=>{for(const e of list.getEntries()){tasks++;taskMs+=e.duration}});observer.observe({type:'longtask',buffered:false})}catch{}
 const tick=now=>{
  if(!document.hidden){const frame=window.__islandWorld?.renderer?.info.render.frame;
   if(last){const dt=now-last;ticks++;total+=dt;max=Math.max(max,dt);bins[Math.min(1000,Math.round(dt))]++;if(frame!==lastDraw)draws++}
   last=now;lastDraw=frame;
  }else last=0;
  frame=requestAnimationFrame(tick);
 };frame=requestAnimationFrame(tick);
 const quantile=q=>{let n=0;for(let i=0;i<bins.length;i++){n+=bins[i];if(n>=ticks*q)return i}return null};
 window.__phoneQA={reset,dispose(){cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('webglcontextlost',onLoss,true);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onError);delete window.__phoneQA},sample(){
  const w=window.__islandWorld,r=w?.renderer,remotes=[...(window.__eggyNet?.remotes?.values?.()||[])];
  const models=[];w?.scene?.traverse?.(o=>{if(o.userData?.claudeRemoteCharacter)models.push(o)});
  return {elapsedMs:performance.now()-start,hiddenMs:hidden+(hiddenAt===null?0:performance.now()-hiddenAt),foreground:!document.hidden,focused:document.hasFocus(),rafFps:ticks*1000/(total||1),drawFps:draws*1000/(total||1),p50Ms:quantile(.5),p95Ms:quantile(.95),p99Ms:quantile(.99),maxGapMs:max,ticks,draws,longTasks:tasks,longTaskMs:taskMs,contextLosses:losses,errors,
   width:r?.domElement.width,height:r?.domElement.height,dpr:r?.getPixelRatio(),quality:r?.domElement.dataset.parkGraphics,drawCalls:r?.info.render.calls,triangles:r?.info.render.triangles,programs:r?.info.programs?.length,
   networkSeats:window.__candyOnline?.data.island?.players?.length,remotePeers:remotes.length,remoteMotion:remotes.filter(p=>p.claudeMotion).length,selectedRealModels:models.length,visibleModelRoots:models.filter(o=>o.visible).length,animatedModels:models.filter(o=>o.userData.claudeRemoteCharacter.protocol&&o.userData.claudeRemoteCharacter.frames>0).length,parkConnected:window.__eggyNet?.connected,socialConnected:window.__candyOnline?.data.connected,
   avatar:document.documentElement.dataset.gameplayAvatarState,wardrobe:!!document.querySelector('.wardrobe'),jsHeapBytes:performance.memory?.usedJSHeapSize??null,
   partyFaults:window.__party?.status?.().faults?.length??null};
 }};
 return true;
}
if(process.argv[1]?.endsWith('android-measure.mjs')){
 const label=process.argv[2]||'baseline',duration=Number(process.argv[3]||60000);
 if(!/^[a-z0-9-]+$/.test(label)||duration<1000||duration>1800000)throw Error('Invalid measurement label or duration');
 const page=await androidPage(),samples=[];
 const property=name=>execFileSync('adb',['shell','getprop',name],{encoding:'utf8'}).trim();
 const device={model:property('ro.product.model'),android:property('ro.build.version.release'),browser:page.browser};
 const runId=label+'-'+Date.now();let claimed=false;
 const persist=(status,error)=>{fs.mkdirSync('.qa-results',{recursive:true});fs.writeFileSync('.qa-results/android-'+label+'.json',JSON.stringify({label,status,error,device,durationMs:duration,samples},null,2))};
 try{
  await page.evaluate('('+installPhoneMetrics.toString()+')()');
  const expectedSeats=Number(process.env.PARK_PHONE_EXPECT_SEATS||0),expectedModels=Number(process.env.PARK_PHONE_EXPECT_MODELS||0);
  const claim=await page.evaluate(`(()=>{const q=__phoneQA,s=q.sample();if(q.measurement?.until>Date.now())return {error:'Another phone measurement is active'};if(!s.foreground||!s.parkConnected||s.avatar!=='ready')return {error:'Phone game is not ready in the foreground'};if((${expectedSeats}&&s.networkSeats!==${expectedSeats})||(${expectedModels}&&s.animatedModels!==${expectedModels}))return {error:'Expected real lobby/models are not ready',seats:s.networkSeats,models:s.animatedModels};q.measurement={id:${JSON.stringify(runId)},until:Date.now()+${duration+60000}};q.reset();return {ready:true}})()`);
  if(!claim.ready)throw Error(JSON.stringify(claim));claimed=true;
  const end=Date.now()+duration;
  do{
   await new Promise(r=>setTimeout(r,Math.min(30000,Math.max(0,end-Date.now()))));
   const metrics=await page.evaluate('__phoneQA.sample()');
   const battery=execFileSync('adb',['shell','dumpsys','battery'],{encoding:'utf8'});
   metrics.batteryC=Number(battery.match(/temperature:\s*(\d+)/)?.[1])/10;
   metrics.batteryPercent=Number(battery.match(/level:\s*(\d+)/)?.[1]);
   const previous=samples.at(-1);samples.push(metrics);persist('running');
   console.log('ANDROID_SAMPLE '+JSON.stringify({label,...metrics}));
   if(!metrics.foreground||metrics.hiddenMs||!metrics.parkConnected||!metrics.socialConnected||metrics.errors||metrics.contextLosses)throw Error('Physical foreground/connection/error acceptance failed');
   if(previous&&metrics.draws<=previous.draws)throw Error('Phone stopped rendering');
   if(expectedSeats&&metrics.networkSeats!==expectedSeats||expectedModels&&metrics.animatedModels!==expectedModels)throw Error('Physical lobby/model count changed');
  }while(Date.now()<end);
  persist('completed');
 }catch(error){persist('interrupted',String(error.message));throw error}
 finally{if(claimed)await page.evaluate(`(()=>{if(__phoneQA.measurement?.id===${JSON.stringify(runId)})delete __phoneQA.measurement})()`).catch(()=>{});page.close()}
}
