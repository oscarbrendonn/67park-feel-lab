import {createCityHeightSampler58} from '../island/city-height-sampler58.js';
import {createVehicleCollisionMask} from './vehicle-collision-mask.js?v=drive-anywhere-1';
import clearanceData from './vehicle-clearance-data.js?v=drive-anywhere-1';
const clearance=createVehicleCollisionMask(clearanceData);

// Authored dry terrain, never a building roof, prop or invisible world base.
// Keep this selector shared with the authority's rendered-geometry capture.
export function isVehicleDriveSurface(name){
 return /^(?:5_YOL|6_BORDUR|7_KALDIRIM_TABANI)(?:$|_)/.test(name)
  || /^3_.*CIM/.test(name)
  || /^(?:4_(?:KUMTABAN|ANA_KUMTABAN|KIYI_TOPRAK_TABANI|DOGU_SAHIL_UST_TOPRAK|KURU_IC_ZEMIN_KIYI_EGIMI)|5_(?:PARSEL_ZEMIN|SAHIL_GRI_ZEMIN|DOGU_SAHIL_MEYDAN_ZEMIN|KB_SPOR_ZEMIN)|7_(?:MERKEZ_KALDIRIM_TABANI|DOGU_SAHIL_KAVSAK_TABANI|DOGU_SAHIL_MEYDAN_APRON|KB_SPOR_CIM_TASIYICI)|8_(?:PARK_PATIKA_UST|PARK_KOPRU_UST|CIM_STUB_DOLGU|KB_ATLETIZM_ZEMIN|KB_BEYZBOL_KIL_ZEMIN)|67D_(?:REF_HILL_DOME|KIYI_KUM_OMUZ)|CENTER73_(?:LAWN_\d+|PATH_.+))(?:$|_)/.test(name);
}
export function createVehicleSurfaceDomain(terrain){
 const floors=[],waters=[];
 terrain.updateWorldMatrix(true,true);
 terrain.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  if(isVehicleDriveSurface(mesh.name))floors.push(mesh);
  else if(/^(?:9_GOLET|67D_(?:REF_MAIN_WATER|PARK_WATER_UNIFIED))/.test(mesh.name))waters.push(mesh);
 });
 if(!floors.some(m=>m.name==='5_YOL')||!floors.some(m=>m.name==='7_KALDIRIM_TABANI'))throw Error('Vehicle road/sidewalk geometry missing');
 const allowed=createCityHeightSampler58(floors);
 const wet=waters.length?createCityHeightSampler58(waters):null;
 return {
  blocked:clearance.blocked,
  height(x,z){
   const y=allowed.height(x,z);if(y==null)return null;
   const level=wet?.height(x,z);
   return level!=null&&level>=y-.006?null:y;
  },
  stats:{allowed:floors.map(m=>m.name),excluded:waters.map(m=>m.name),triangles:allowed.stats.triangles,clearance:clearance.stats}
 };
}
