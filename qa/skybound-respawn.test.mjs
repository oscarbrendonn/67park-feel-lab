import assert from 'node:assert/strict';
import {pickSkyboundSpawn} from '../app/skybound-respawn.js';
const checkpoint={x:0,y:5,z:-73};
const sample=(x,z)=>Math.abs(x)<7.2&&Math.abs(z+73)<5?{height:3.8,owner:{id:'arena-two'}}:null;
const hazard={object:{position:{x:0,z:-73}},reach:4.35};
for(let i=0;i<1000;i++){
 const p=pickSkyboundSpawn(checkpoint,sample,[hazard],[]);
 assert.ok(Math.hypot(p.x,p.z+73)>5.35);
 assert.equal(p.y,4.38);
 assert.deepEqual(p,pickSkyboundSpawn(checkpoint,sample,[hazard],[]));
}
assert.doesNotThrow(()=>pickSkyboundSpawn(checkpoint,()=>null,[hazard],[]));
console.log('PASS: 1000 safe deterministic checkpoint spawns; no exception on missing future surfaces');
