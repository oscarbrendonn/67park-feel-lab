import assert from 'node:assert/strict';
import fs from 'node:fs';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.hidden=false;}
 append(...nodes){this.children.push(...nodes);}setAttribute(k,v){this[k]=v;}remove(){this.removed=true;}
}
const body=new Element('body'),events={};
globalThis.document={body,createElement:tag=>new Element(tag)};
globalThis.location={search:'?map=obstacle&practice=1&bots=1'};
globalThis.window={addEventListener:(name,fn)=>events[name]=fn};
const {installObstaclePractice}=await import('../app/obstacle-practice-entry.js');
const {obstaclePracticeCard}=await import('../app/obstacle-practice-card.js');
let phase='roam',started=0;const subs=new Set(),wardrobe={open:false};
installObstaclePractice({store:{getState:()=>({phase}),subscribe:fn=>(subs.add(fn),()=>subs.delete(fn))},start:()=>started++,wardrobe,subscribeWardrobe:fn=>(subs.add(fn),()=>subs.delete(fn))});
const host=body.children[0],button=host.children[2],update=()=>subs.forEach(fn=>fn());
assert.equal(host.hidden,false);
for(let i=0;i<1000;i++)button.onclick();
assert.equal(started,1);assert.equal(button.disabled,true);
phase='playing';update();assert.equal(host.hidden,true);
phase='roam';update();assert.equal(host.hidden,false);assert.equal(button.disabled,false);
wardrobe.open=true;update();button.onclick();assert.equal(started,1);
wardrobe.open=false;update();button.onclick();assert.equal(started,2);
events.pagehide({persisted:true});assert.ok(!host.removed);assert.ok(subs.size);
events.pagehide({persisted:false});assert.equal(host.removed,true);assert.equal(subs.size,0);
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const available=obstaclePracticeCard(jsx,false),blocked=obstaclePracticeCard(jsx,true);
for(const node of available.props.children)assert.match(node.props.href,/map=obstacle&practice=1&bots=1/);
for(const node of blocked.props.children)assert.equal(node.props.href,undefined);
const shared=fs.readFileSync(new URL('../app/chunk-A5QZM2VZ.js',import.meta.url),'utf8');
assert.ok(shared.includes('friends-panel-style.js'));assert.ok(shared.includes('skyboundCard(e,!!a)'));
console.log('PASS: 1000 Start presses launch once; replay, wardrobe guard, back/forward cache, local-only course links and shared panel loading.');
