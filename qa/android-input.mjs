// Real Android touch events, through the shipped joystick and Jump button.
// No teleports, direct physics writes, emulated viewport or controller bypass.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {androidPage} from './android-cdp.mjs';
const page=await androidPage(),delay=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>page.evaluate('({...__eggyInput.playerRef.body.translation()})');
const point=selector=>page.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing touch target');const r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('Hidden touch target');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
try{
 await page.evaluate(`(()=>{window.__androidTouchEvidence=[];window.__androidTouchListener=e=>__androidTouchEvidence.push({type:e.type,trusted:e.isTrusted});for(const t of ['touchstart','touchend'])addEventListener(t,__androidTouchListener,true)})()`);
 const stick=await point('.park-stick'),start=await read();
 const steer=async direction=>{
  await page.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...stick,id:1}]});
  await page.call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:stick.x+32*direction,y:stick.y,id:1}]});
  await delay(350);await page.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(200);
 };
 await steer(1);const moved=await read();await steer(-1);
 const beforeJump=await read(),jump=await point('button[aria-label="Jump"]');
 await page.evaluate(`(()=>{const until=performance.now()+2500;window.__androidJump={peak:__eggyInput.playerRef.body.translation().y,samples:0};const step=()=>{const p=__eggyInput.playerRef.body.translation();__androidJump.peak=Math.max(__androidJump.peak,p.y);__androidJump.samples++;if(performance.now()<until)requestAnimationFrame(step)};requestAnimationFrame(step)})()`);
 await page.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...jump,id:2}]});await delay(100);
 await page.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(2600);
 const state=await page.evaluate(`({jump:__androidJump,touches:__androidTouchEvidence,input:{x:__eggyInput.input.x,z:__eggyInput.input.z},stickActive:document.querySelector('.park-stick').dataset.claudeStickActive,connected:__eggyNet.connected&&__candyOnline.data.connected,networkSeats:__candyOnline.data.island.players.length,muted:localStorage.getItem('67park-feel-lab-muted')})`);
 const result={start,moved,after:await read(),travel:Math.hypot(moved.x-start.x,moved.z-start.z),rise:state.jump.peak-beforeJump.y,...state};
 assert(result.travel>.5,JSON.stringify(result));assert(result.rise>.8,JSON.stringify(result));assert(result.jump.samples>30);
 assert(result.touches.length>=6&&result.touches.every(e=>e.trusted));assert.equal(result.stickActive,'false');
 assert.equal(result.input.x,0);assert.equal(result.input.z,0);assert(result.connected);assert.equal(result.muted,'1');
 fs.mkdirSync('.qa-results',{recursive:true});fs.writeFileSync('.qa-results/android-touch.json',JSON.stringify(result,null,2));
 console.log('ANDROID_TOUCH_PASS '+JSON.stringify(result));
}finally{
 await page.call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}).catch(()=>{});
 await page.evaluate(`(()=>{if(window.__androidTouchListener)for(const t of ['touchstart','touchend'])removeEventListener(t,__androidTouchListener,true);delete window.__androidTouchListener})()`).catch(()=>{});
 page.close();
}
