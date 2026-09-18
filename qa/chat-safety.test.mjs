import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {CommunityHub} from '../server/runtime/server/community-hub.js';
import {installSocialSafety} from '../server/social-safety.mjs';
import {installHousing} from '../server/housing.mjs';
import {chatVerdict} from '../app/chat-policy.js';
class Socket extends EventEmitter{readyState=1;bufferedAmount=0;messages=[];send(s){this.messages.push(JSON.parse(s));}close(){this.readyState=3;this.emit('close');}}
function fixture(options={}){let now=10000;const hub=new CommunityHub({now:()=>now,...options});const app={hubs:new Map([['kimi',hub]])};installHousing(app);const safety=installSocialSafety(app,{file:options.safetyFile});const add=token=>{const s=hub.session(token);hub.attach(s.player,new Socket(),'lobby');hub.attach(s.player,new Socket(),'online');return s;};return {hub,safety,add,advance(n=1000){now+=n;},chat(p,text,nonce='n'+now){hub.lobbyMessage(p,{t:'chat',text,nonce});}};}
test('plain game chat survives; sexual content, evasion, links and markup are denied',()=>{
 for(const text of ['Hi everyone!','Let’s race','Merhaba arkadaşlar','classroom','Scunthorpe','I finished first','basketball 3 2 1'])assert.equal(chatVerdict(text).ok,true,text);
 for(const text of ['porn','p0rn','p o r n','p\u200born','ＰＯＲＮ','porno','çıplak foto gönder','send nude pictures','sex','sexy','s e x','https://example.com','example dot com','example.ru','www.example.org','discord.gg/test','<img src=x>'])assert.equal(chatVerdict(text).ok,false,text);
 assert.equal(chatVerdict('x'.repeat(141)).ok,false);
});
test('1000 repeated chat commands stay bounded; rejected content never reaches history or peer',()=>{
 const f=fixture(),a=f.add().player,b=f.add().player;
 try{for(let i=0;i<1000;i++)f.chat(a,'hello',String(i));assert.equal(f.hub.lobbies.get(a.lobbyId).chat.length,1);assert.equal(f.safety.metrics.accepted,1);
 f.advance();f.chat(a,'porn','bad');assert(!b.lobbySocket.messages.some(m=>m.t==='chat'&&m.text==='porn'));assert(!f.hub.lobbies.get(a.lobbyId).chat.some(m=>m.text==='porn'));
 f.advance();f.chat(a,'Ready to play','once');f.chat(a,'Ready to play','once');assert.equal(f.safety.metrics.duplicates,1);
 for(let i=0;i<100;i++){f.advance();f.chat(a,'Round '+i,'round'+i);}assert.equal(f.hub.lobbies.get(a.lobbyId).chat.length,20);
 }finally{f.safety.dispose();f.hub.close();}
});
test('mute hides live and reconnect history; unblock does not unmute; block stops contact both ways',()=>{
 const f=fixture(),a=f.add().player,b=f.add().player;
 try{f.chat(b,'Before mute','before');f.hub.message(a,{t:'safety.set',kind:'muted',target:b.id,value:true});const count=a.lobbySocket.messages.filter(m=>m.t==='chat').length;
 f.advance();f.chat(b,'After mute','after');assert.equal(a.lobbySocket.messages.filter(m=>m.t==='chat').length,count);
 f.hub.attach(a,new Socket(),'lobby');assert.deepEqual(a.lobbySocket.messages.find(m=>m.t==='welcome').chat,[]);
 f.hub.message(a,{t:'safety.set',kind:'blocked',target:b.id,value:true});
 for(const [from,to]of [[a,b],[b,a]]){assert.throws(()=>f.hub.message(from,{t:'friend.request',target:to.id}),/unavailable/);assert.throws(()=>f.hub.message(from,{t:'invite.send',target:to.id,kind:'island'}),/unavailable/);}
 f.hub.message(a,{t:'house.claim',house:'H01'});f.hub.message(a,{t:'house.invite',house:'H01',target:b.id});assert.match(a.online.messages.at(-2).message,/unavailable/);
 f.hub.message(a,{t:'safety.set',kind:'blocked',target:b.id,value:false});assert.equal(f.hub.safety.hidden(a.id,b.id),true);
 }finally{f.safety.dispose();f.hub.close();}
});
test('guest identity and block list survive authority restart without saving chat text',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'67park-safety-')),options={socialPath:path.join(dir,'social.json'),safetyFile:path.join(dir,'safety.json')};
 let f=fixture(options);const a=f.add(),b=f.add();f.hub.message(a.player,{t:'safety.set',kind:'blocked',target:b.player.id,value:true});f.safety.dispose();f.hub.close();
 f=fixture(options);try{const returned=f.add(a.token);assert.equal(returned.player.id,a.player.id);assert.equal(f.hub.safety.blocked(returned.player.id,b.player.id),true);}finally{f.safety.dispose();f.hub.close();rmSync(dir,{recursive:true,force:true});}
});
test('duplicate home request cannot teleport twice or accumulate work',()=>{
 const f=fixture(),p=f.add().player;
 try{f.hub.message(p,{t:'house.door',house:'H03',request:'same'});for(let i=0;i<1000;i++)f.hub.message(p,{t:'house.door',house:'H03',request:'same'});assert.equal(p.online.messages.filter(m=>m.t==='house.travel').length,1);assert.equal(f.hub.rooms.size,0);assert.equal(p.online.readyState,1);}finally{f.safety.dispose();f.hub.close();}
});
