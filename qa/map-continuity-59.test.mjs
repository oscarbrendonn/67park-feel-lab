import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const patch=JSON.parse(readFileSync(new URL('../repairs/map-continuity-59.json',import.meta.url)));
assert.equal(patch.version,59);
assert.equal(patch.metrics.addedDrawCalls,0);
assert.ok(patch.metrics.grassWaterOverlap<1e-6);
assert.ok(patch.metrics.pathWaterOverlap<1e-6);
for(const m of patch.meshes){
 assert.equal(m.p.length,m.n.length,m.name);
 assert.equal(m.p.length%3,0,m.name);
 assert.equal(m.ix.length%3,0,m.name);
 assert.ok(m.p.every(Number.isFinite)&&m.n.every(Number.isFinite),m.name);
 assert.equal(new Set(m.remove).size,m.remove.length,m.name);
 assert.ok(m.remove.every(i=>Number.isInteger(i)&&i>=0&&i%3===0&&i<m.expected.indices),m.name);
 assert.ok(m.ix.every(i=>Number.isInteger(i)&&i>=0&&i<m.p.length/3),m.name);
}
console.log('Map continuity 59: finite geometry, valid indices, atomic removal lists and zero park/water overlap PASS');
