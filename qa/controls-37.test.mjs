import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
class Element {
 constructor(tagName='BUTTON'){this.tagName=tagName;this.listeners={};this.style={};this.attrs={};this.captures=new Set();this.classList={toggle(){},remove(){},add(){}};}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 emit(name,props={}){const e={pointerId:1,pointerType:'touch',clientX:0,clientY:0,button:0,buttons:1,preventDefault(){},stopPropagation(){},target:this,...props};for(const fn of this.listeners[name]||[])fn(e);}
 setAttribute(k,v){this.attrs[k]=v;}setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
 closest(){return null;}matches(){return false;}querySelector(){return this.knob??=new Element('SPAN');}
 getBoundingClientRect(){return {left:0,top:0,right:80,bottom:80,width:80,height:80};}
}
const win=new Element('WINDOW'),doc=new Element('DOCUMENT'),els=new Map();
let clock=0;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
globalThis.window=win;globalThis.document=doc;globalThis.innerWidth=390;globalThis.innerHeight=844;
win.innerWidth=390;win.innerHeight=844;globalThis.addEventListener=win.addEventListener.bind(win);
globalThis.matchMedia=()=>({matches:true});Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:5,getGamepads:()=>[]},configurable:true});
doc.body=new Element('BODY');doc.getElementById=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);};
const canvas=new Element('CANVAS');doc.querySelector=()=>canvas;
const {bindHeldAction,bindMinigameLook}=await import(root+'/app/minigame-input.js');
const action=new Element(),hold=bindHeldAction(action);
for(let i=0;i<1000;i++){
 action.emit('pointerdown',{pointerId:i});assert.equal(hold.held(),true);
 action.emit('pointerup',{pointerId:i+1});assert.equal(hold.held(),true);
 action.emit('pointerleave',{pointerId:i});assert.equal(hold.held(),true);
 action.emit('pointerup',{pointerId:i});assert.equal(hold.consume(),true);clock+=45;assert.equal(hold.consume(),true);clock+=60;assert.equal(hold.consume(),false);
 action.emit('pointerdown',{pointerId:i});action.emit('pointercancel',{pointerId:i});assert.equal(hold.consume(),false);
}
const {bindRallyTouch}=await import(root+'/race/rally-touch-input.js');
const held=new Set(),rally=bindRallyTouch(doc.getElementById,held,()=>{}),wheel=els.get('rr-wheel'),gas=els.get('rr-gas');
for(let i=0;i<1000;i++){
 gas.emit('pointerdown',{pointerId:2});wheel.emit('pointerdown',{pointerId:1,clientX:60});assert.equal(rally.steer(),0);
 wheel.emit('pointermove',{pointerId:1,clientX:82});assert.ok(rally.steer()<0&&rally.steer()>-1);
 wheel.emit('pointermove',{pointerId:1,clientX:104});assert.equal(rally.steer(),-1);assert.ok(held.has('gas'));
 wheel.emit('pointerup',{pointerId:2});assert.equal(rally.steer(),-1);
 wheel.emit('pointercancel',{pointerId:1});assert.equal(rally.steer(),0);assert.ok(held.has('gas'));
 gas.emit('pointerup',{pointerId:2});assert.equal(held.size,0);
}
const {createPlayerInput}=await import(root+'/balloon/player-input.js');const input=createPlayerInput();input.poll();
const jump=els.get('btn-jump'),pad=els.get('stick-base');
for(let i=0;i<1000;i++){
 pad.emit('pointerdown',{pointerId:1,clientX:50,clientY:650});pad.emit('pointermove',{pointerId:1,clientX:94,clientY:650});
 jump.emit('pointerdown',{pointerId:2});let value=input.poll();assert.equal(value.jumpHeld,true);assert.equal(value.mx,1);assert.equal(value.lookYaw,0);
 jump.emit('pointerup',{pointerId:1});assert.equal(input.poll().jumpHeld,true);
 jump.emit('pointerup',{pointerId:2});pad.emit('pointerup',{pointerId:1});clock+=101;assert.equal(input.poll().jumpHeld,false);assert.equal(input.poll().moving,false);
}
win.emit('keydown',{code:'Space',target:canvas});assert.equal(input.poll().jumpHeld,true);win.emit('keyup',{code:'Space'});assert.equal(input.poll().jumpHeld,false);
pad.emit('pointerdown',{pointerId:1});pad.emit('pointermove',{pointerId:1,clientX:44});jump.emit('pointerdown',{pointerId:2});win.emit('blur');assert.equal(input.poll().moving,false);assert.equal(input.poll().jumpHeld,false);
const look=bindMinigameLook(canvas);canvas.emit('pointerdown',{pointerType:'mouse',button:2,buttons:2,clientX:100,clientY:100});canvas.emit('pointermove',{pointerType:'mouse',buttons:2,clientX:200,clientY:100});assert.ok(look.poll().lookYaw<0);canvas.emit('pointerup');
const source=fs.readFileSync(root+'/rockets/rockets.js','utf8'),start=source.indexOf('function Na(){'),end=source.indexOf('var lc=',start);
const {characterDirection}=await import(root+'/app/character-control-profile.js');
const context={feelDirection:characterDirection,feelRocketYaw:0,Mn:false,he:new Set(),Ve:{move:{x:0,z:0},aim:{x:0,z:1}},Gt:false,yt:false,Sn:false,xt:false,bt:'launcher',Dt:'ice',rocketJump:{consume:()=>false}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
context.he.add('Space');assert.equal(context.Na().jump,true);assert.equal(context.Na().fire,false);
context.he.add('KeyF');assert.equal(context.Na().jump,true);assert.equal(context.Na().fire,true);
context.he.clear();assert.equal(context.Na().jump,false);assert.equal(context.Na().fire,false);
const balloonSource=fs.readFileSync(root+'/balloon/balloon-RURKS3DS.js','utf8'),physics={};
vm.createContext(physics);vm.runInContext(balloonSource.slice(balloonSource.indexOf('var B='),balloonSource.indexOf('async function Ct')),physics);
input.resetTransient();jump.emit('pointerdown',{pointerId:4});jump.emit('pointerup',{pointerId:4});
const actor=physics.je(0,0),world={bounds:100,solids:[],sampleGround:()=>({y:0})};let peak=0;
for(let frame=0;frame<120;frame++){
 clock+=1000/60;const controls=input.poll();physics.Ae(actor,{dirX:0,dirZ:0,moving:false,jumpHeld:controls.jumpHeld},1/60,world);peak=Math.max(peak,actor.pos.y);
}
assert.ok(peak>.3,'The live Balloon controller must lift the character, not just animate a button');assert.equal(actor.grounded,true);assert.equal(actor.pos.y,0);
console.log('PASS: actual Balloon physics consumes a quick mobile Jump and returns to ground; peak '+peak.toFixed(3)+' m.');
console.log('PASS: 1000 owned jump cycles, 1000 wheel+gas cycles, 1000 jump+move cycles; blur reset, right mouse, Rockets Space jump / F attack.');
