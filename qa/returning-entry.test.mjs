import test from 'node:test';
import assert from 'node:assert/strict';
import {returningEntryView} from '../app/returning-entry.js';
const start=1000;
const loading={status:'loading',entryStarted:start,stage:'Preparing the park',progress:.4,downloadBytes:10*1048576,downloadTotal:20*1048576};
test('returning player sees real progress without fake completion',()=>{
 const s=returningEntryView(loading,{status:'ready'},start+5000);
 assert.equal(s.progress,.4);assert.equal(s.download,10);assert.equal(s.total,20);assert.equal(s.retry,false);
});
test('slow entry exposes retry; no unbounded silent wait',()=>{
 assert.equal(returningEntryView(loading,{status:'ready'},start+20000).retry,true);
 assert.equal(returningEntryView(loading,{status:'loading'},start+180000).timedOut,true);
});
test('world ready but avatar pending is not playable',()=>{
 const s=returningEntryView({...loading,status:'ready',progress:1},{status:'loading'},start+5000);
 assert.equal(s.stage,'Preparing your saved character');
});
test('map and avatar failures both expose recovery',()=>{
 for(const [world,avatar] of [['error','ready'],['ready','error']]){
  const s=returningEntryView({...loading,status:world},{status:avatar},start);
  assert.equal(s.failed,true);assert.equal(s.retry,true);
 }
});
test('ready avatar and world never receive a timeout warning',()=>{
 assert.equal(returningEntryView({...loading,status:'ready'},{status:'ready'},start+200000).timedOut,false);
});
