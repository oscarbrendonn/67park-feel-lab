import test from 'node:test';
import assert from 'node:assert/strict';
import {createHousingLoader} from '../app/housing-loader.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('deduplicates 1000 preparations and keeps one reusable room',async()=>{
 let created=0,disposed=0,compiled=0;const room={prepare:async()=>{compiled++},dispose(){disposed++}};
 const loader=createHousingLoader({}, {load:async()=>({createHousingInterior(){created++;return room}})});
 const rooms=await Promise.all(Array.from({length:1000},()=>loader.prepare()));
 assert(rooms.every(r=>r===room));assert.equal(created,1);assert.equal(compiled,1);assert.equal(loader.stats.phase,'ready');
 loader.dispose();assert.equal(disposed,1);
});
test('failed download can retry and a late timed-out room cannot attach',async()=>{
 let disposed=0,n=0;const loader=createHousingLoader({}, {timeoutMs:15,load:async()=>{
  if(++n===1){await sleep(40);return {createHousingInterior(){throw Error('stale factory must not execute')}};}
  return {createHousingInterior:()=>({dispose(){disposed++}})};
 }});
 await assert.rejects(loader.prepare(),/timed out/);assert.equal(loader.stats.phase,'error');
 await loader.prepare();await sleep(45);assert.equal(loader.stats.phase,'ready');assert.equal(disposed,0);loader.dispose();assert.equal(disposed,1);
});
test('world change during shader preparation disposes only its stale room',async()=>{
 let disposed=0;const loader=createHousingLoader({}, {load:async()=>({createHousingInterior:()=>({prepare:()=>sleep(15),dispose(){disposed++}})})});
 const p=loader.prepare();await sleep(2);loader.dispose();await assert.rejects(p,/cancelled/);await sleep(1);assert.equal(disposed,1);assert.equal(loader.stats.phase,'disposed');
});
test('timed-out compilation can finish after a successful retry without disposing the new room',async()=>{
 let attempt=0,oldDisposed=0,newDisposed=0;
 const loader=createHousingLoader({}, {timeoutMs:15,load:async()=>({createHousingInterior:()=>++attempt===1?{prepare:()=>sleep(45),dispose(){oldDisposed++}}:{dispose(){newDisposed++}}})});
 await assert.rejects(loader.prepare(),/timed out/);const room=await loader.prepare();await sleep(50);
 assert.equal(loader.room,room);assert.equal(loader.stats.phase,'ready');assert.equal(oldDisposed,1);assert.equal(newDisposed,0);
 loader.dispose();assert.equal(newDisposed,1);
});
