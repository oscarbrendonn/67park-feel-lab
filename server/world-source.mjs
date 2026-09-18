import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import * as T from 'three';
import {loadIslandWorldSource} from './runtime/server/island-world-source.js';
import {withPreviewCoast} from '../app/online-coast-floor.js';
import {createVehicleSurfaceDomain} from '../app/vehicle-surface-domain.js';
import {expandIslandDriveArea} from '../app/island-drive-area.js';
import {tunePreviewWorld} from '../app/park-driving-tuning.js';
import {installParkCarReturn} from '../app/park-car-return.js';
import {IslandWorld} from './runtime/server/island-world.js';

// Same finished terrain capture used by the existing authority. This 12 MB
// compressed server-only fixture is excluded from the public web artifact.
export async function loadWorld(){
 const source=withPreviewCoast(await loadIslandWorldSource());
 const terrain=new T.Group(),rows=JSON.parse(gunzipSync(await fs.readFile(new URL('./vehicle-terrain.json.gz',import.meta.url))));
 for(const row of rows){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float64Array(row.p),3));if(row.ix)g.setIndex(row.ix);const m=new T.Mesh(g);m.name=row.name;m.matrixAutoUpdate=false;m.matrix.fromArray(row.matrix);terrain.add(m);}
 const domain=createVehicleSurfaceDomain(terrain);
 expandIslandDriveArea(source.area,{ground:source.ground,water:source.water,domain});
 for(const c of source.cars)if(!source.area.check(c.x,c.z,c.yaw,c.spec).ok)throw Error('Vehicle spawn rejected: '+c.id);
 return source;
}
// Apply the existing driving tuning to this isolated backend only.
const original=IslandWorld.prototype.step;
IslandWorld.prototype.step=function(...args){installParkCarReturn(tunePreviewWorld(this));return original.apply(this,args);};
