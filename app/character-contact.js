// Reuse the existing curb/stair/swept-wall rules. A blocked diagonal must not
// discard its free tangent. There are at most three sweeps, never a retry loop.
export function resolveCharacterContact(sweep, options) {
  const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
  if(!finite(options.to)||!finite(options.velocity)||(options.from&&!finite(options.from))) {
    const position=finite(options.from)?{...options.from}:finite(options.to)?{...options.to}:{x:0,y:.555,z:0};
    return {position,vertical:0,horizontal:{x:0,z:0},grounded:false,blocked:true,kind:'invalid-motion',samples:0};
  }
  const hit = sweep(options);
  const velocity = options.velocity;
  const horizontal = {x: velocity.x, z: velocity.z};
  if (!hit.blocked) return {...hit, horizontal};
  horizontal.x = horizontal.z = 0;
  if (!options.from || hit.kind === 'sweep-limit') return {...hit, horizontal};

  let best = hit, bestDistance = 0;
  let samples = hit.samples || 0;
  for (const axis of ['x', 'z']) {
    const distance = options.to[axis] - hit.position[axis];
    if (Math.abs(distance) < 1e-7) continue;
    const to = {...hit.position, y: options.to.y, [axis]: options.to[axis]};
    const candidate = sweep({...options, from: hit.position, to, wasGrounded: hit.grounded});
    samples += candidate.samples || 0;
    const moved = Math.abs(candidate.position[axis] - hit.position[axis]);
    if (moved > bestDistance + 1e-7) {best = candidate; bestDistance = moved;}
  }
  for (const axis of ['x', 'z']) {
    if (Math.abs(options.to[axis] - best.position[axis]) < 1e-6) horizontal[axis] = velocity[axis];
  }
  return {...best, blocked: true, horizontal, kind: bestDistance > 1e-7 ? 'slide' : hit.kind,
    stepUp: (hit.stepUp || 0) + (best === hit ? 0 : best.stepUp || 0),
    stepDown: (hit.stepDown || 0) + (best === hit ? 0 : best.stepDown || 0), samples};
}

// Skate/swim retain the original slope and water rules, with bounded sampling.
// Sliding uses this same predicate; it cannot bypass an intervening wall.
export function sweepRideContact({from, to, velocity, ground, water=()=>false, blocked=()=>false}) {
  const start = from || to, length = Math.hypot(to.x-start.x, to.z-start.z);
  let samples = 0;
  const sample = (x,z) => {samples++; return ground(x,z);};
  if (length > 8 || !Number.isFinite(length)) return {position:{...start},vertical:velocity.y,blocked:true,kind:'sweep-limit',samples};
  const count = Math.max(1, Math.ceil(length/.12));
  let previous = sample(start.x,start.z), position = {...start};
  for (let i=1; i<=count; i++) {
    const x=start.x+(to.x-start.x)*i/count,z=start.z+(to.z-start.z)*i/count;
    const height=sample(x,z),slope=height!=null&&previous!=null&&Math.abs(height-previous)<=length/count*1.5+.03;
    let collision = blocked(x,to.y,z);
    for (const [dx,dz] of [[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]]) {
      if (collision) break;
      const h=sample(x+dx,z+dz);
      if (h!=null&&h>to.y+.05&&!water(x+dx,z+dz)&&!(slope&&Math.abs(h-height)<.7)) collision=true;
    }
    if (collision) return {position:{...position,y:to.y},vertical:velocity.y,blocked:true,kind:'blocked',samples};
    position={x,y:to.y,z}; previous=height;
  }
  return {position,vertical:velocity.y,blocked:false,kind:'ride',samples};
}

// One small, non-interactive cue, no new 3D assets, queue or frame loop. It only
// appears while pushing into a blocked direction; walking alongside stays quiet.
export function createContactFeedback({document, now=()=>performance.now(), schedule=setTimeout, cancel=clearTimeout}={}) {
  let node=null,timer=null,last=0,pressure=0,disabled=false;
  function hide(){if(node)node.hidden=true;pressure=0;}
  function expire(){timer=null;const remaining=last+450-now();if(remaining>0)timer=schedule(expire,remaining);else hide();}
  function update({contact, moving=false, active=true, dt=0}) {
    if(disabled)return;
    try {
      if(!active||!moving){hide();return;}
      const elapsed=Math.min(.05,Math.max(0,dt));
      if(!contact?.blocked||(contact.kind==='slide'&&Math.hypot(contact.horizontal?.x||0,contact.horizontal?.z||0)>.05)){
        pressure=Math.max(0,pressure-elapsed*.1);return;
      }
      pressure=Math.min(.3,pressure+elapsed*2);
      if(pressure<.12)return;
      if(!node){
        node=document.createElement('div');node.id='park-contact-cue';node.setAttribute('role','status');
        node.textContent='Path blocked · Go around';
        node.style.cssText='position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:35;max-width:65vw;padding:8px 14px;border:1px solid #fff9;border-radius:999px;background:#fff8e9ed;color:#514a43;font:600 13px system-ui;text-align:center;pointer-events:none;box-shadow:0 3px 12px #57493618';
        document.body.append(node);
      }
      node.hidden=false;last=now();if(timer===null)timer=schedule(expire,450);
    }catch{disabled=true;dispose();}
  }
  function dispose(){if(timer!==null)cancel(timer);timer=null;node?.remove();node=null;pressure=0;}
  return {update,dispose};
}

let feedback;
export function updateContactFeedback(state){
  if(!globalThis.document)return;
  feedback??=createContactFeedback({document:globalThis.document});
  feedback.update(state);
}
globalThis.addEventListener?.('pagehide',()=>{feedback?.dispose();feedback=null;});
