import test from 'node:test';
import assert from 'node:assert/strict';
import {installParkRenderHealth} from '../app/park-render-health.js';

test('stalled frames record bounded local house diagnostics and resume cleanly',()=>{
 let now=0,check,report,panel;
 const events=new Map();
 const target=()=>({addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)});
 const win={...target(),innerWidth:390,innerHeight:844,visualViewport:{scale:1},
  localStorage:{setItem:(key,value)=>{report=JSON.parse(value)}},
  setInterval:f=>{check=f;return 1},clearInterval:()=>{},
  __parkHousing:{debug:()=>({visit:'H08',failed:false,pending:null})}};
 const doc={...target(),hidden:false,body:{append:p=>{panel=p}},
  createElement:()=>({style:{},dataset:{},setAttribute:()=>{},remove:()=>{panel=null}})};
 const renderer={info:{render:{frame:10},programs:[1,2]},getContext:()=>({isContextLost:()=>false})};
 const dispose=installParkRenderHealth({canvas:target(),renderer,ready:()=>true,mode:()=> 'always',win,doc,now:()=>now});
 check();now=6001;check();
 assert.equal(report.version,'home-stability-1');assert.equal(report.code,'G33-RENDER');
 assert.deepEqual(report.house,{visit:'H08',failed:false,pending:null});
 assert.equal(report.programs,2);assert.equal(panel.hidden,false);
 renderer.info.render.frame++;check();assert.equal(panel.hidden,true);
 dispose();assert.equal(panel,null);
});
