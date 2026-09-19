import {androidPage} from './android-cdp.mjs';
const level=process.argv[2];if(!['auto','low','medium','high'].includes(level))throw Error('Choose a real graphics setting');
const page=await androidPage();
try{
 const target=await page.evaluate(`(()=>{const b=document.querySelector('#party-settings-btn'),r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await page.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[target]});
 await new Promise(r=>setTimeout(r,100));await page.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await new Promise(r=>setTimeout(r,200));
 // Exercise the shipped select's change handler, not a renderer override.
 await page.evaluate(`(()=>{const s=document.querySelector('#setting-graphics');if(!s||s.closest('[hidden]'))throw Error('Graphics UI is not open');s.scrollIntoView({block:'center',behavior:'instant'});s.value=${JSON.stringify(level)};s.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[aria-label="Close settings"]').click()})()`);
 await new Promise(r=>setTimeout(r,500));
 console.log(await page.evaluate(`(()=>{const r=__islandWorld.renderer;return {setting:JSON.parse(localStorage.getItem('67park.feel-lab.player-settings.v1')).graphics,width:r.domElement.width,height:r.domElement.height,ratio:r.getPixelRatio(),shadows:r.shadowMap.enabled}})()`));
}finally{page.close()}
