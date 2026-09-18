import assert from 'node:assert/strict';
import {
  applyLocalCarry, carryPacket, createParkBotCarryController,
  readCarryPacket, registerRemoteCarryAvatar, setCarryLocalId,
  toggleParkCarry, updateCarryPose,
} from '../app/park-carry.js';

const vector=(x=0,y=0,z=0)=>({x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;}});
const root=(x,y,z,heading=0)=>({visible:true,position:vector(x,y,z),rotation:{x:0,y:heading,z:0,set(a,b,c){this.x=a;this.y=b;this.z=c;}}});

updateCarryPose({x:0,y:0,z:0},0);
const bot={root:root(0,0,1),entry:{}};
const bots=createParkBotCarryController({actors:()=>[bot]});
assert.equal(toggleParkCarry(),true,'nearby bot is picked up');
let sample=bots.sample(bot,{position:{x:9,y:0,z:9},velocity:{x:1,y:0,z:0},speed:1,heading:0});
assert.deepEqual(sample.position,{x:0,y:1.05,z:.72});
assert.equal(sample.speed,0);
assert.equal(toggleParkCarry(),false,'debounce rejects immediate spam without queuing');
await new Promise(resolve=>setTimeout(resolve,230));
assert.equal(toggleParkCarry(),true,'second deliberate interaction drops the bot');
bots.dispose();

setCarryLocalId('me');
const remoteRoot=root(0,0,1);
const remote=registerRemoteCarryAvatar('them');
remote.update(remoteRoot,{carryTarget:''});
await new Promise(resolve=>setTimeout(resolve,230));
assert.equal(toggleParkCarry(),true,'nearby online avatar is selected');
assert.equal(carryPacket(),'them');
remote.update(remoteRoot,{carryTarget:''});
assert.equal(remoteRoot.position.z,.72,'carried remote is attached to the local pose');

const carrierRoot=root(2,3,4,Math.PI/2);
const carrier=registerRemoteCarryAvatar('carrier');
carrier.update(carrierRoot,{carryTarget:'me'});
const body={velocity:null,translation:null,setLinvel(v){this.velocity=v;},setTranslation(v){this.translation=v;}};
const local=vector();
assert.equal(applyLocalCarry(body,local),true,'the carried client follows the remote carrier');
assert.deepEqual(body.velocity,{x:0,y:0,z:0});
assert.ok(Math.abs(body.translation.x-2.72)<1e-9);

const packet={};readCarryPacket(packet,'abc');assert.equal(packet.carryTarget,'abc');
readCarryPacket(packet,'x'.repeat(65));assert.equal(packet.carryTarget,'');
remote.dispose();carrier.dispose();
console.log('park carry 50: bot, remote, local-follow and spam guards passed');
