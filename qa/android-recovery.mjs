// Physical phone + isolated fixture. Network loss is scoped to this debugged
// game tab; do not toggle the phone's Wi-Fi, stop the server or touch other apps.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {androidPage} from './android-cdp.mjs';
const page=await androidPage(),control='http://127.0.0.1:8522';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const fixture=async()=>{const r=await fetch(control+'/state');if(!r.ok)throw Error('Fixture unavailable');return r.json()};
const until=async(expression,timeout=30000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await page.evaluate(expression))return;await delay(300)}throw Error('Phone recovery timed out: '+expression)};
const read=()=>page.evaluate(`({id:__candyOnline.data.me.id,world:__eggyNet.connected,social:__candyOnline.data.connected,visit:__parkHousing.debug().visit,frame:__islandWorld.renderer.info.render.frame,muted:localStorage.getItem('67park-feel-lab-muted'),errors:window.__candyErrors||[]})`);
const results=[];
let networkEnabled=false,homeClaimed=false;
try{
 await until('window.__islandWorld?.ready&&window.__parkHousing?.debug().model&&window.__eggyNet?.connected&&window.__candyOnline?.data.connected');
 assert(!await page.evaluate('window.__phoneQA?.measurement?.until>Date.now()'),'Do not interrupt a separate warm measurement');
 const response=await fetch(control+'/mixed',{method:'POST'}),setup=await response.json();
 assert(response.ok||response.status===409&&setup.mixed,JSON.stringify(setup));
 await page.call('Network.enable');networkEnabled=true;
 async function cut(label){
  const before=await read(),othersBefore=await fixture();
  assert(othersBefore.matches.every(m=>m.status==='playing'&&m.snapshotAt));assert.equal(othersBefore.home,'H01');
  await page.call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  try{
   await page.evaluate('(()=>{__eggyNet.ws?.close();__candyOnline.ws?.close()})()');
   await until('!__eggyNet.connected&&!__candyOnline.data.connected',5000);
   await delay(1800);
   const offline=await read(),othersOffline=await fixture();
   assert(offline.frame>before.frame,'Phone must keep drawing during outage');
   assert.equal(othersOffline.connected,15);assert.equal(othersOffline.home,'H01');
   othersOffline.matches.forEach((m,i)=>assert(m.snapshotAt>othersBefore.matches[i].snapshotAt,'Other match must keep advancing'));
   results.push({label,before:{frame:before.frame,visit:before.visit},offline:{frame:offline.frame,world:offline.world,social:offline.social},othersBefore,othersOffline});
  }finally{await page.call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})}
  await until('__eggyNet.connected&&__candyOnline.data.connected');
  const after=await read();assert.equal(after.id,before.id);assert.equal(after.visit,before.visit);assert.equal(after.muted,'1');assert.deepEqual(after.errors,[]);
  Object.assign(results.at(-1),{recovered:{sameIdentity:true,visit:after.visit,frame:after.frame}});
 }
 await cut('lobby reconnect while two matches and a home continue');
 // Exercise real server-authorized home travel and the actual phone renderer.
 // This is not a claim about navigating to the physical door with the joystick.
 await page.evaluate('__candyOnline.send({t:"house.claim",house:"H02"})');
 await until('__parkHousing.debug().model.houses.find(h=>h.id==="H02")?.owner===__candyOnline.data.me.id');homeClaimed=true;
 await page.evaluate('__candyOnline.send({t:"house.door",house:"H02"})');await delay(600);
 await page.evaluate('__candyOnline.send({t:"house.enter",house:"H02"})');await until('__parkHousing.debug().visit==="H02"');
 await cut('home reconnect while lobby and two other matches continue');
 await page.evaluate('__candyOnline.send({t:"house.exit",house:"H02"})');await until('!__parkHousing.debug().visit');
 fs.mkdirSync('.qa-results',{recursive:true});fs.writeFileSync('.qa-results/android-mixed-recovery.json',JSON.stringify({results},null,2));
 console.log('ANDROID_MIXED_RECOVERY_PASS '+JSON.stringify({results}));
}finally{
 if(networkEnabled){await page.call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});await page.call('Network.disable').catch(()=>{})}
 if(homeClaimed)await page.evaluate('(()=>{__candyOnline.send({t:"house.exit",house:"H02"});__candyOnline.send({t:"house.release",house:"H02"})})()').catch(()=>{});
 page.close();
}
