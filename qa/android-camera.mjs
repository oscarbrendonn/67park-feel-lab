// Physical Android camera acceptance: use actual touch gestures and Jump.
// No direct camera/controller/physics writes or viewport emulation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {androidPage} from './android-cdp.mjs';
const page=await androidPage(),delay=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>page.evaluate(`(()=>{const c=__islandWorld.camera,p=__eggyInput.playerRef.body.translation();return {yaw:c.userData.feelLab.yaw,pitch:c.userData.feelLab.pitch,feet:[p.x,p.y-.555,p.z],frame:__islandWorld.renderer.info.render.frame}})()`);
const phase=name=>page.evaluate(`window.__cameraAcceptance.phase=${JSON.stringify(name)}`);
const point=selector=>page.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e?.getBoundingClientRect();if(!r?.width||!r.height)throw Error('Missing touch target');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
const touch=(type,points)=>page.call('Input.dispatchTouchEvent',{type,touchPoints:points});
try{
 const environment=await page.evaluate(`(()=>{
  if(window.__cameraAcceptance)throw Error('Camera check is already running');
  if(!__islandWorld?.ready||!__islandWorld.camera?.userData.feelLab)throw Error('Camera is not ready');
  const x=innerWidth*.75,y=innerHeight*.43;
  for(const px of [x,x-80])if(document.elementFromPoint(px,y)?.closest('button,input,select,textarea,.park-stick'))throw Error('Camera drag overlaps a control');
  const s=window.__cameraAcceptance={phase:'baseline',samples:[],touches:[],errorCount:window.__candyErrors?.length||0};
  s.onTouch=e=>{if(s.touches.length<100)s.touches.push({type:e.type,trusted:e.isTrusted})};
  for(const type of ['touchstart','touchend','touchcancel'])addEventListener(type,s.onTouch,true);
  const sample=t=>{const p=__eggyInput.playerRef.body.translation(),c=__islandWorld.camera,f=c.userData.feelLab;
   if(f&&s.samples.length<1500)s.samples.push({at:t,phase:s.phase,footY:p.y-.555,targetY:f.target.y-1.15,horizontalLag:Math.hypot(f.target.x-p.x,f.target.z-p.z),yaw:f.yaw,pitch:f.pitch,fov:c.fov,frame:__islandWorld.renderer.info.render.frame});
   s.raf=requestAnimationFrame(sample);
  };s.raf=requestAnimationFrame(sample);
  return {x,y,width:innerWidth,height:innerHeight,muted:localStorage.getItem('67park-feel-lab-muted')};
 })()`);
 assert.equal(environment.muted,'1');
 await delay(250);const before=await read();
 const drag=async direction=>{
  await touch('touchStart',[{x:environment.x,y:environment.y,id:7}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:environment.x+direction*80*i/6,y:environment.y,id:7}]);await delay(20)}
  await touch('touchEnd',[]);
 };
 await phase('drag');await drag(-1);const released=await read();
 await phase('release');await delay(350);const rested=await read();
 await phase('restore');await drag(1);await delay(250);
 const jump=await point('button[aria-label="Jump"]');
 await phase('jump');const jumpStart=await read();
 await touch('touchStart',[{...jump,id:8}]);await delay(100);await touch('touchEnd',[]);await delay(2600);
 await phase('walk');const stick=await point('.park-stick');
 for(const direction of [1,-1]){
  await touch('touchStart',[{...stick,id:9}]);
  await touch('touchMove',[{x:stick.x+direction*32,y:stick.y,id:9}]);
  await delay(350);await touch('touchEnd',[]);await delay(200);
 }
 await phase('settle');await delay(350);
 const evidence=await page.evaluate(`(()=>{const s=__cameraAcceptance;cancelAnimationFrame(s.raf);return {samples:s.samples,touches:s.touches,errors:(window.__candyErrors||[]).slice(s.errorCount),muted:localStorage.getItem('67park-feel-lab-muted'),connected:__eggyNet.connected&&__candyOnline.data.connected,lost:__islandWorld.renderer.getContext().isContextLost(),input:{x:__eggyInput.input.x,z:__eggyInput.input.z}}})()`);
 const samples=evidence.samples,jumpSamples=samples.filter(s=>s.phase==='jump');
 const result={browser:page.browser,device:'physical Android',viewport:[environment.width,environment.height],samples:samples.length,jumpSamples:jumpSamples.length,yawChange:released.yaw-before.yaw,releaseDrift:rested.yaw-released.yaw,jumpRise:Math.max(...jumpSamples.map(s=>s.footY))-jumpStart.feet[1],maxVerticalLag:Math.max(...jumpSamples.map(s=>Math.abs(s.footY-s.targetY))),maxHorizontalLag:Math.max(...samples.map(s=>s.horizontalLag)),maxSampleGap:Math.max(...samples.slice(1).map((s,i)=>s.at-samples[i].at)),renderedFrames:samples.at(-1).frame-samples[0].frame,fovs:[...new Set(samples.map(s=>s.fov))],...Object.fromEntries(Object.entries(evidence).filter(([key])=>key!=='samples'))};
 fs.mkdirSync('.qa-results',{recursive:true});fs.writeFileSync('.qa-results/android-camera.json',JSON.stringify(result,null,2));
 assert(Math.abs(result.yawChange)>.2,JSON.stringify(result));assert(Math.abs(result.releaseDrift)<.0001,JSON.stringify(result));
 assert(result.jumpRise>.8&&result.jumpRise<2.2&&result.jumpSamples>30,JSON.stringify(result));
 assert(result.maxVerticalLag>.05&&result.maxVerticalLag<=.6501,JSON.stringify(result));
 assert(result.maxHorizontalLag<.001,JSON.stringify(result));assert(result.maxSampleGap<2500);
 assert(result.renderedFrames>60);assert.deepEqual(result.fovs,[55]);assert.deepEqual(result.errors,[]);
 assert(result.touches.length>=10&&result.touches.every(e=>e.trusted));
 assert.equal(result.muted,'1');assert(result.connected&&!result.lost);assert.deepEqual(result.input,{x:0,z:0});
 console.log('ANDROID_CAMERA_PASS '+JSON.stringify(result));
}finally{
 await touch('touchCancel',[]).catch(()=>{});
 await page.evaluate(`(()=>{const s=window.__cameraAcceptance;if(!s)return;cancelAnimationFrame(s.raf);for(const type of ['touchstart','touchend','touchcancel'])removeEventListener(type,s.onTouch,true);delete window.__cameraAcceptance})()`).catch(()=>{});
 page.close();
}
