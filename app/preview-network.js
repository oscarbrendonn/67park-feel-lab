import {PREVIEW_BACKEND,PREVIEW_VARIANT} from './preview-network-config.js?v=foundation-safety-1';
import {protectParkSocket} from './social-safety.js';

const key='67park.preview.guest.v1.'+PREVIEW_VARIANT;
const sharedKey=Symbol.for('67park.preview.transport.v1.'+PREVIEW_VARIANT);
const state=globalThis[sharedKey]??=( {pending:null,session:null} );
const endpoint=path=>PREVIEW_BACKEND+'/'+PREVIEW_VARIANT+path;
export async function ensurePreviewGuest(){
 if(state.pending)return state.pending;
 state.pending=(async()=>{
  let token=state.session?.token;try{token||=localStorage.getItem(key);}catch{}
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
  try{
   const response=await fetch(endpoint('/api/session'),{mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:token?{Authorization:'Bearer '+token}:{},signal:abort.signal});
   if(!response.ok)throw Error('Preview server connection failed ('+response.status+').');
   const session=await response.json();
   if(!/^[A-Za-z0-9_-]{43}$/.test(session.token)||typeof session.id!=='string')throw Error('Invalid preview session.');
   state.session=session;try{localStorage.setItem(key,session.token);}catch{}
   return session;
  }finally{clearTimeout(timer);}
 })();
 try{return await state.pending;}finally{state.pending=null;}
}
export async function fetchParkSession(){
 const session=await ensurePreviewGuest();
 return new Response(JSON.stringify({...session,token:undefined}),{status:200,headers:{'Content-Type':'application/json'}});
}
export function parkSocket(channel){
 if(!['ws','online'].includes(channel)||!state.session)throw Error('Preview session not ready.');
 const url=new URL(endpoint('/'+channel));url.protocol=url.protocol==='https:'?'wss:':'ws:';
 return protectParkSocket(new WebSocket(url,['67park-v1','guest.'+state.session.token]),channel);
}
