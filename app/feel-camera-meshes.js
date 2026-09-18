import {Raycaster,Box3,Mesh,MeshBasicMaterial,DoubleSide,Vector3} from 'three';
// Reuse the world's authored collision mesh list, never traverse avatars/FX.
// Bounding-box rejection keeps triangle work local to the short camera boom.
const indexes=new WeakMap();
export function cameraMeshCast(world,origin,direction,length){
 if(!world?.blockers?.length)return null;
 let index=indexes.get(world);
 if(!index||index.source!==world.blockers||index.count!==world.blockers.length){
  index?.material.dispose();
  const material=new MeshBasicMaterial({side:DoubleSide});
  const rows=world.blockers.filter(m=>m.isMesh&&!m.isSkinnedMesh&&!m.isInstancedMesh).map(mesh=>{
   if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();mesh.updateWorldMatrix(true,false);
   const proxy=new Mesh(mesh.geometry,material);proxy.matrixAutoUpdate=false;proxy.matrixWorld.copy(mesh.matrixWorld);
   return {mesh,proxy,box:new Box3().copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)};
  });
  index={rows,material,ray:new Raycaster(),hits:[],point:new Vector3(),source:world.blockers,count:world.blockers.length};indexes.set(world,index);
 }
 const {ray,hits,point}=index;ray.ray.origin.set(origin.x,origin.y,origin.z);ray.ray.direction.set(direction.x,direction.y,direction.z);ray.near=.02;ray.far=length;
 let closest=null;
 for(const row of index.rows){
  let visible=true;for(let node=row.mesh;node;node=node.parent)if(!node.visible){visible=false;break;}
  if(!visible||row.mesh.userData?.cameraIgnore)continue;
  if(!row.proxy.matrixWorld.equals(row.mesh.matrixWorld)){row.proxy.matrixWorld.copy(row.mesh.matrixWorld);row.box.copy(row.mesh.geometry.boundingBox).applyMatrix4(row.mesh.matrixWorld);}
  if(!row.box.containsPoint(ray.ray.origin)&&(!ray.ray.intersectBox(row.box,point)||point.distanceTo(ray.ray.origin)>ray.far))continue;
  hits.length=0;row.proxy.raycast(ray,hits);
  for(const hit of hits)if(closest===null||hit.distance<closest){closest=hit.distance;ray.far=closest;}
 }
 return closest;
}
