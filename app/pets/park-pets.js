import {createPetModels} from './pet-model.js?v=pets-soft-2';
import {createPetFollower} from './pet-follow.js?v=pets-soft-2';
import {petSelection,petFromCombo,comboWithPet,validPet} from './pet-state.js?v=pets-soft-2';

// Optional, isolated cosmetic layer. One existing frame hook and shared avatar
// metadata; no new RAF, light, physics body, position stream or server process.
export function createParkPets({world,net,heading=()=>0,reducedMotion=()=>false}) {
  let current=null,models=null,local=null,clock=0,nextRoster=0,failed=false,active=false,disposed=false;
  let profileNet=null,originalHello=null,wrappedHello=null,onlineClient=null,originalSend=null,wrappedSend=null,lastProfile=-10,dirty=true;
  const remotes=new Map(),counts={frames:0,probes:0,failed:0};let body=null,remaining=0,lastZone='',created=0;
  const unsubscribe=petSelection.subscribe(()=>{dirty=true;});
  const requested=validPet(new URLSearchParams(globalThis.location?.search||'').get('pet'));
  if(requested)petSelection.select(requested);
  const mobile=globalThis.matchMedia?.('(pointer: coarse)').matches;
  const remoteLimit=mobile?6:10;
  function probe(x,z,reference) {
    if(!current||remaining--<=0)return null;counts.probes++;
    const y=current.ground?.(x,z,true);
    if(!Number.isFinite(y)||current.water?.(x,z)||Math.abs(y-reference)>2.2)return null;
    // The runtime's obstacle test includes tree trunks and home furniture.
    if(current.treeBlocked?.(x,y+.25,z))return null;
    for(const [dx,dz] of [[-.18,0],[.18,0],[0,-.18],[0,.18]])if(current.treeBlocked?.(x+dx,y+.25,z+dz))return null;
    return y;
  }
  function make(kind) {
    const model=models.create(kind,{scale:.48}),follow=createPetFollower(probe);
    current.scene.add(model.root);return {kind,model,follow,navAge:(++created%11)/88};
  }
  function remove(record){record?.model.dispose();}
  function clear(){remove(local);local=null;for(const r of remotes.values())remove(r);remotes.clear();models?.dispose();models=null;current=null;}
  function hooks(){
    const n=net();
    if(n&&n!==profileNet){
      if(profileNet&&profileNet.sendHello===wrappedHello)profileNet.sendHello=originalHello;
      profileNet=n;originalHello=n.sendHello;
      wrappedHello=function(name,combo){return originalHello.call(this,name,comboWithPet(combo,petSelection.get()));};
      n.sendHello=wrappedHello;dirty=true;
    }
    // The social channel may refresh the same profile on a room transition.
    // Preserve its existing hello fields and the selected cosmetic there too.
    const online=globalThis.__candyOnline;
    if(online?.send&&online!==onlineClient){
      if(onlineClient?.send===wrappedSend)onlineClient.send=originalSend;
      onlineClient=online;originalSend=online.send;
      wrappedSend=function(message){return originalSend.call(this,message?.t==='hello'&&typeof message.combo==='string'?{...message,combo:comboWithPet(message.combo,petSelection.get())}:message);};
      online.send=wrappedSend;
    }
    if(dirty&&clock-lastProfile>.8&&n?.connected&&n.lastHello?.combo){
      n.sendHello(n.lastHello.name,n.lastHello.combo);dirty=false;lastProfile=clock;
    }
  }
  function move(record,dt,owner,yaw,localPlayer=false){
    record.navAge+=dt;
    // Local navigation at <= 24 Hz; nearby remotes at <= 8 Hz. The rig still
    // interpolates every frame. The hard global budget also covers crowded rooms.
    const interval=localPlayer?1/24:1/8;
    if(record.navAge>=interval){
      const step=record.follow.step(Math.min(.1,record.navAge),owner,yaw);record.navAge=0;
    }
    const st=record.follow.state,root=record.model.root;
    root.visible=active&&st.visible;
    if(!root.visible)return;
    const factor=1-Math.exp(-22*dt);
    if(!record.placed||Math.hypot(root.position.x-st.x,root.position.z-st.z)>10){root.position.set(st.x,st.y,st.z);record.placed=true;}
    else {root.position.x+=(st.x-root.position.x)*factor;root.position.y+=(st.y-root.position.y)*factor;root.position.z+=(st.z-root.position.z)*factor;}
    root.rotation.y+=Math.atan2(Math.sin(st.heading-root.rotation.y),Math.cos(st.heading-root.rotation.y))*(1-Math.exp(-16*dt));
    record.model.update(dt,{speed:st.speed,reducedMotion:reducedMotion()});
  }
  function step(nextBody,dt,map) {
    if(disposed||failed)return;
    try {
      dt=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));clock+=dt;counts.frames++;body=nextBody;
      hooks();
      const w=world(),p=body?.translation?.();
      active=map==='city'&&!!w?.ready&&!!p&&[p.x,p.y,p.z].every(Number.isFinite);
      if(!active){if(local){local.model.root.visible=false;local.follow.reset();}for(const r of remotes.values()){r.model.root.visible=false;r.follow.reset();}return;}
      if(w!==current){clear();current=w;models=createPetModels();}
      remaining=20;
      const zone=p.x>450?`${Math.round(p.x/100)}:${Math.round(p.z/100)}`:'park';
      if(zone!==lastZone){local?.follow.reset();for(const r of remotes.values())r.follow.reset();lastZone=zone;}
      const selected=petSelection.get();
      if(local?.kind!==selected){remove(local);local=selected?make(selected):null;}
      const owner={x:p.x,y:p.y-.555,z:p.z};
      if(local)move(local,dt,owner,heading(),true);
      if(clock>=nextRoster){
        nextRoster=clock+.6;
        const rows=[];
        for(const [id,r]of net()?.remotes||[]) {
          const q=r.targetP;
          if(!Array.isArray(q)||q.length!==3||!q.every(Number.isFinite))continue;
          const kind=petFromCombo(r.combo),distance=Math.hypot(q[0]-p.x,q[2]-p.z);
          if(kind&&distance<30&&Math.abs(q[1]-p.y)<5)rows.push({id,r,kind,distance});
        }
        rows.sort((a,b)=>a.distance-b.distance);const keep=new Set(rows.slice(0,remoteLimit).map(r=>r.id));
        for(const [id,r]of remotes)if(!keep.has(id)){remove(r);remotes.delete(id);}
        for(const row of rows.slice(0,remoteLimit)){
          let r=remotes.get(row.id);if(r&&r.kind!==row.kind){remove(r);r=null;}
          if(!r){r=make(row.kind);remotes.set(row.id,r);}r.owner=row.r;
        }
      }
      for(const r of remotes.values()){
        const q=r.owner.targetP;move(r,dt,{x:q[0],y:q[1]-.555,z:q[2]},r.owner.targetRy||0);
      }
    } catch(error) {
      failed=true;counts.failed++;clear();console.warn('[pets] companion layer stopped safely',error);
    }
  }
  return {step,select:petSelection.select,play(){local?.model.play();},debug:()=>({selected:petSelection.get(),active,failed,...counts,local:local?{...local.model.stats,follow:local.follow.stats(),position:local.model.root.position.toArray()}:null,remotes:[...remotes].map(([id,r])=>({id,kind:r.kind,visible:r.model.root.visible})),remoteLimit,models:models?.stats()}),dispose(){if(disposed)return;disposed=true;unsubscribe();clear();if(profileNet?.sendHello===wrappedHello)profileNet.sendHello=originalHello;if(onlineClient?.send===wrappedSend)onlineClient.send=originalSend;}};
}
