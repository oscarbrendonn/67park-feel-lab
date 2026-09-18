import {isTextEntry} from './text-input-guard.js?v=mobile-29';
// Pointer ownership shared by character and fallback orbit cameras.
// Camera distance and native zoom policy are unchanged.
const UI='button,a,input,textarea,select,[contenteditable="true"],[role="button"],[role="dialog"],.park-stick,.park-action,.park-touch,.park-toolbar,.park-chat,.claude-emote-panel,.park-inventory-panel,.wardrobe,.online-dialog';
export function cameraCanvasEvent(event){
 if(isTextEntry())return false;
 const target=event?.target;
 if(target?.tagName!=='CANVAS'||target.closest?.(UI))return false;
 const path=event.composedPath?.()||[];
 if(path.some(el=>el!==target&&el?.matches?.(UI)))return false;
 return true;
}
export function beginCameraDrag(event,current=null){
 if(current||!cameraCanvasEvent(event))return current;
 const mouse=event.pointerType==='mouse';
 if(mouse&&event.button!==0&&event.button!==2)return null;
 if(!mouse&&event.pointerType!=='touch'&&event.pointerType!=='pen')return null;
 if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
 // Keep the established left-hand movement region separate.
 if(event.pointerType==='touch'&&event.clientX<(globalThis.window?.innerWidth||0)*.45&&event.clientY>(globalThis.window?.innerHeight||0)*.55)return null;
 const drag={id:event.pointerId,x:event.clientX,y:event.clientY,mouse,button:event.button,target:event.target};
 try{event.target.setPointerCapture?.(event.pointerId)}catch{}
 if(mouse&&event.button===2)event.preventDefault?.();
 return drag;
}
export function moveCameraDrag(drag,event){
 if(drag&&isTextEntry())return {ended:true};
 if(!drag||drag.id!==event.pointerId)return null;
 if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
 // A missed release must never leave mouse-look latched.
 if(drag.mouse&&typeof event.buttons==='number'&&!(event.buttons&(drag.button===2?2:1)))return {ended:true};
 const delta={x:event.clientX-drag.x,y:event.clientY-drag.y};
 drag.x=event.clientX;drag.y=event.clientY;
 return delta;
}
export function endCameraDrag(drag,event){
 if(!drag||event&&drag.id!==event.pointerId)return drag;
 try{if(drag.target.hasPointerCapture?.(drag.id))drag.target.releasePointerCapture(drag.id)}catch{}
 return null;
}
