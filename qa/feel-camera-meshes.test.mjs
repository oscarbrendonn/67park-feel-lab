import test from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,BoxGeometry,MeshBasicMaterial,Group} from 'three';
import {cameraMeshCast} from '../app/feel-camera-meshes.js';
test('actual triangles block from both sides without changing authored materials',()=>{
 const wall=new Mesh(new BoxGeometry(10,10,.2),new MeshBasicMaterial());wall.position.z=3;wall.updateMatrixWorld(true);
 const world={blockers:[wall]},origin={x:0,y:0,z:0},direction={x:0,y:0,z:1};
 assert(Math.abs(cameraMeshCast(world,origin,direction,8)-2.9)<.001);
 assert.equal(wall.material.side,0);
 assert(Math.abs(cameraMeshCast(world,{x:0,y:0,z:6},{x:0,y:0,z:-1},8)-2.9)<.001);
 const group=new Group();group.add(wall);group.visible=false;assert.equal(cameraMeshCast(world,origin,direction,8),null);
 group.visible=true;wall.position.z=4;wall.updateMatrixWorld(true);assert(Math.abs(cameraMeshCast(world,origin,direction,8)-3.9)<.001);
});
