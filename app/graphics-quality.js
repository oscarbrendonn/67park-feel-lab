import {playerSettings} from './player-settings.js';

export const GRAPHICS_LEVELS=Object.freeze({
 auto:{label:'Automatic',dpr:null,shadowSize:null,shadows:true},
 low:{label:'Low',dpr:.8,shadowSize:512,shadows:false},
 medium:{label:'Medium',dpr:1.25,shadowSize:1024,shadows:true},
 high:{label:'High',dpr:2,shadowSize:null,shadows:true},
});
export function qualityPixelRatio(level,requested,native=globalThis.devicePixelRatio||1){
 const profile=GRAPHICS_LEVELS[level]||GRAPHICS_LEVELS.auto;
 const safe=Number.isFinite(requested)&&requested>0?requested:1;
 return profile.dpr===null?safe:Math.max(.5,Math.min(native,profile.dpr));
}
const slot=Symbol.for('67park.graphics-quality.v1');
/** Bind once per renderer. Resolution/shadow changes never throttle physics,
 * network, input, animations or the HTML interface; no model is removed. */
export function installGraphicsQuality(renderer,{settings=playerSettings,host=globalThis,now=()=>performance.now()}={}){
 if(renderer[slot])return renderer;
 const render=renderer.render,dispose=renderer.dispose,setRatio=renderer.setPixelRatio;
 let requested=renderer.getPixelRatio(),level=null,scene=null,dirty=true,dead=false,degraded=false,originalShadows;
 const lights=new Map(),sceneScans=new WeakMap();
 const resetMap=shadow=>{shadow.map?.dispose();shadow.mapPass?.dispose();shadow.map=null;shadow.mapPass=null;shadow.needsUpdate=true;};
 const apply=nextScene=>{
  if(dead)return;
  const next=Object.hasOwn(GRAPHICS_LEVELS,settings.graphics)?settings.graphics:'auto';
  if(next!==level){level=next;dirty=true;setRatio.call(renderer,qualityPixelRatio(level,requested,host.devicePixelRatio||1));}
  const profile=GRAPHICS_LEVELS[level];
  if(originalShadows===undefined)originalShadows=!!renderer.shadowMap?.enabled;
  if(renderer.shadowMap){
   const enabled=originalShadows&&profile.shadows;
   if(renderer.shadowMap.enabled!==enabled){renderer.shadowMap.enabled=enabled;renderer.shadowMap.needsUpdate=true;}
  }
  scene=nextScene;
  if(scene&&(!sceneScans.has(scene)||now()-sceneScans.get(scene)>2000)){
   sceneScans.set(scene,now());
   scene?.traverse?.(o=>{if(o.isLight&&o.shadow&&!lights.has(o)){lights.set(o,{x:o.shadow.mapSize.x,y:o.shadow.mapSize.y});dirty=true;}});
   for(const light of lights.keys())if(!light.parent)lights.delete(light);
  }
  if(!dirty)return;dirty=false;
  for(const [light,size] of lights){
   const shadow=light.shadow,limit=profile.shadowSize??Infinity;
   const x=Math.min(size.x,limit),y=Math.min(size.y,limit);
   if(shadow.mapSize.x!==x||shadow.mapSize.y!==y){shadow.mapSize.set(x,y);resetMap(shadow);}
   else if(!profile.shadows&&shadow.map)resetMap(shadow);
  }
  if(renderer.domElement?.dataset)renderer.domElement.dataset.parkGraphics=JSON.stringify({level,dpr:renderer.getPixelRatio(),shadows:renderer.shadowMap?.enabled===true,shadowLimit:profile.shadowSize});
 };
 const safeApply=nextScene=>{
  if(dead||degraded)return;
  try{apply(nextScene)}catch{
   // Optional quality management must not stop the actual game renderer.
   // One bounded fallback, not an exception on every frame or a retry queue.
   degraded=true;
   if(renderer.shadowMap)renderer.shadowMap.enabled=false;
   try{setRatio.call(renderer,.8)}catch{}
   if(renderer.domElement?.dataset)renderer.domElement.dataset.parkGraphics=JSON.stringify({level:'fallback',dpr:renderer.getPixelRatio(),shadows:false});
   host.dispatchEvent?.(new Event('park:graphics-fault'));
  }
 };
 const changed=()=>{dirty=true;level=null;if(scene)safeApply(scene);};
 renderer.setPixelRatio=function(value){requested=value;return setRatio.call(this,degraded?.8:qualityPixelRatio(settings.graphics,value,host.devicePixelRatio||1));};
 renderer.render=function(nextScene,...args){safeApply(nextScene);return render.call(this,nextScene,...args);};
 renderer.dispose=function(...args){
  if(!dead){dead=true;host.removeEventListener?.('park:settings-change',changed);host.removeEventListener?.('resize',changed);lights.clear();}
  return dispose?.apply(this,args);
 };
 renderer[slot]={apply:safeApply,summary:()=>({level,degraded,dpr:renderer.getPixelRatio(),lights:lights.size}),dispose:()=>renderer.dispose()};
 host.addEventListener?.('park:settings-change',changed);host.addEventListener?.('resize',changed);
 return renderer;
}
