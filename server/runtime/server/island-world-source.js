import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createCityHeightSampler58} from '../island-source/city-height-sampler58.js';
import {createRoadArea108} from '../island-source/pastel-car-v108.js';
import {expandIslandDriveArea} from '../app/island-drive-area.js';
import {repairEastRoadEnd} from '../app/east-road-end.js';
import {CAR110,BUS110} from '../island-source/candy-vehicle-model-v110.js';
import {vehicleSeatLayout} from '../island-source/vehicle-seat-layout.js';
import {prepareSeasideAsset89} from '../island-source/seaside-scale-v89.js';
import {createRideAsset84} from '../island-source/lunapark-rides-v84.js';
// Server-side geometry only: no browser, textures, WebGL or client-provided roads.
export async function loadIslandWorldSource(){
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).register(parser=>({name:'SERVER_GEOMETRY',loadMaterial(i){const s=parser.json.materials[i];return Promise.resolve(new T.MeshStandardMaterial({name:s.name}));}}));
 const load=async file=>{const b=await fs.readFile(new URL('../../../island/'+file,import.meta.url));return(await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;};
 const terrain=await load('ada_calisma.glb'),scale=320/1.7831611037254333;
 terrain.scale.setScalar(scale);terrain.updateMatrixWorld(true);terrain.position.set(.04531264305114746*scale,-new T.Box3().setFromObject(terrain).min.y-2.15,-.012233048677444458*scale);terrain.updateMatrixWorld(true);
 repairEastRoadEnd(terrain);
 const road=terrain.getObjectByName('5_YOL'),groundMeshes=[];terrain.traverse(o=>{if(o.isMesh&&!/DENIZ|WATER|^1_TABAN|GOLET.*SU/i.test(o.name))groundMeshes.push(o);});
 const surface=createCityHeightSampler58(groundMeshes),ground=(x,z)=>surface.height(x,z);
 const area=createRoadArea108({roadMeshes:[road],ground});
 const waterMeshes=[];terrain.traverse(o=>{if(o.isMesh&&/DENIZ|WATER|GOLET.*SU/i.test(o.name))waterMeshes.push(o);});
 const waterSurface=waterMeshes.length?createCityHeightSampler58(waterMeshes):null;
 const water=(x,z)=>{const floor=ground(x,z),level=waterSurface?.height(x,z);return floor==null||(level!=null&&floor<=level+.08);};
 expandIslandDriveArea(area,{ground,water});
 const cars=[{id:'main-mint',kind:'car',x:183,z:122,yaw:Math.PI/2},{id:'small-blue',kind:'car',x:-133,z:97,yaw:0},{id:'school-service',kind:'bus',x:-73,z:-182,yaw:Math.PI/2}];
 for(const c of cars){c.spec=c.kind==='bus'?BUS110:CAR110;c.seats=vehicleSeatLayout(c.kind,c.spec.scale).map(s=>[s.x,s.y,s.z]);let spawn=null;
  for(const dz of [0,-1,1,-2,2,-4,4,-6,6]){for(const dx of [0,-1,1,-2,2,-4,4])if(area.check(c.x+dx,c.z+dz,c.yaw,c.spec).ok){spawn={x:c.x+dx,z:c.z+dz};break;}if(spawn)break;}if(!spawn)throw Error('Server road spawn missing: '+c.id);Object.assign(c,spawn);
 }
 const rides=[];
 for(const [asset,x,z]of [['ferris',173,-173.7],['carousel',192.7,-161.5],['carouselSmall',188.845,-135.693]]){
  const source=prepareSeasideAsset89(await load('lunapark-v1/'+asset+'.glb'),asset),y=ground(x,z)-.015;
  const ride=createRideAsset84(source,{asset,transform:new T.Matrix4().makeTranslation(x,y,z),material:m=>m});ride.entry.y=ground(ride.entry.x,ride.entry.z);rides.push(ride);
 }
 return{area,ground,water,cars,rides};
}
