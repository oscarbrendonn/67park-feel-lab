import test from 'node:test';
import assert from 'node:assert/strict';
import {launcherPlacements,HATCH_SITES,validLauncherSpot} from '../app/party/park-launchers.js';
function world(){return {spawn:[163,10,121],ground:()=>9.38,water:()=>false,treeBlocked:()=>false,
 sample(x,z){const end=HATCH_SITES.some(c=>x===c.endX&&z===c.endZ);return {object:{name:end?'KUM':z<0?'5_YOL':x>200?'7_KALDIRIM_TABANI':'3_CIMEN'},point:{y:9.38}}}}}
test('hatches stay at measured road ends, trampolines stay in the park',()=>{
 const pads=launcherPlacements(world());assert.equal(pads.length,4);
 assert.deepEqual(pads.filter(p=>p.kind==='hatch').map(p=>[p.x,p.z]),[[245,130],[158,-234]]);
 assert.deepEqual(pads.filter(p=>p.kind==='trampoline').map(p=>[p.x,p.z]),[[133,103],[169,61]]);
 const w=world();w.spawn=[400,10,700];assert.deepEqual(launcherPlacements(w),pads,'A changed spawn must not move a hatch into traffic');
});
test('unsafe road-end footprints are omitted, not moved into a middle-road fallback',()=>{
 for(const reject of ['water','tree','slope']){
  const w=world();if(reject==='water')w.water=(x,z)=>Math.abs(x-245)<2;
  if(reject==='tree')w.treeBlocked=(x,y,z)=>Math.abs(x-245)<2;
  if(reject==='slope')w.ground=(x,z)=>x>245?10:9.38;
  assert(!launcherPlacements(w).some(p=>p.kind==='hatch'&&p.x>200));
 }
});
test('a road extension invalidates the old terminus placement',()=>{
 const w=world(),sample=w.sample;w.sample=(x,z)=>x===254&&z===130?{object:{name:'5_YOL'},point:{y:9.38}}:sample(x,z);
 assert.equal(launcherPlacements(w).filter(p=>p.kind==='hatch').length,1);
});
test('sidewalk footprint must remain flat and fully supported',()=>{
 const w=world();assert(validLauncherSpot(w,245,130,'hatch'));
 w.sample=()=>({object:{name:'7_KALDIRIM_TABANI'},point:{y:7}});assert(!validLauncherSpot(w,245,130,'hatch'));
});
