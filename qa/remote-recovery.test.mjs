import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Use the shipped module, only resolve its browser-root imports for Node.
const prefix=new URL('../',import.meta.url).href;
const code=fs.readFileSync(new URL('../app/claude-remote-state.js',import.meta.url),'utf8').replaceAll('"/67park-feel-lab/','"'+prefix);
const {installClaudeRemoteNetwork}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
class Socket extends EventTarget {
 listeners=0;
 addEventListener(type,fn,...rest){if(type==='message')this.listeners++;super.addEventListener(type,fn,...rest)}
 removeEventListener(type,fn,...rest){if(type==='message')this.listeners--;super.removeEventListener(type,fn,...rest)}
 message(cm){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({t:'s',id:'peer',cm,cg:'carrier'})}))}
}
test('async first connection and 100 reconnects rebind remote motion/carry exactly once',async()=>{
 const peer={},client={ws:null,remotes:new Map([['peer',peer]]),sendState(){},async connect(){await Promise.resolve();this.ws=new Socket()}};
 const remove=installClaudeRemoteNetwork(client,()=>'',()=>100);
 const packet=[1,3,2,0,0,0,0,0,0];let old;
 for(let i=0;i<100;i++){
  await client.connect();assert.equal(client.ws.listeners,1);
  if(old){assert.equal(old.listeners,0);old.message([1,3,9,0,0,0,0,0,0]);}
  client.ws.message(packet);assert.deepEqual(peer.claudeMotion,packet);assert.equal(peer.carryTarget,'carrier');assert.equal(peer.claudeMotionAt,100);
  old=client.ws;
 }
 remove();assert.equal(old.listeners,0);
});
test('disposing during authentication never attaches an orphan listener',async()=>{
 let resolve;
 const client={ws:null,remotes:new Map(),sendState(){},async connect(){await new Promise(r=>resolve=r);this.ws=new Socket()}};
 const remove=installClaudeRemoteNetwork(client),pending=client.connect();remove();resolve();await pending;
 assert.equal(client.ws.listeners,0);
});
