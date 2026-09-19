const assert=require('node:assert/strict');

module.exports=async function checkCornerContacts(page,{mobile=false,check}){
 const report=await page.evaluate(()=>{
  const w=__islandWorld,placements=JSON.parse(w.renderer.domElement.dataset.centralLayout68),stats=JSON.parse(w.renderer.domElement.dataset.buildingContacts);
  let corners=0,blockedCentres=0;
  for(const p of placements){
   if(w.ground(p.x,p.z)>=p.y+p.height-.01)blockedCentres++;
   for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=p.x+sx*(p.radius-.05),z=p.z+sz*(p.radius-.05);
    if(w.ground(x,z)<p.y+2)corners++;
   }
  }
  return{stats,corners,blockedCentres};
 });
 assert.equal(report.stats.modelMatched,16);assert.equal(report.stats.addedDrawCalls,0);
 assert.equal(report.blockedCentres,16);assert(report.corners>=48,'Rounded corners must not remain square invisible walls');
 await check('model-matched corners: walk and skate slide, retreat, closed walls',async()=>{
  const result=await page.evaluate(async()=>{
   const w=__islandWorld,{body}=__eggyInput.playerRef,input=__eggyInput.input;
   const module=await import('./app/chunk-G7D6MVRW.js?v=foundation-safety-1');
   const original={...body.translation()},boardBefore=module.i.on,rows=[];
   const pause=ms=>new Promise(r=>setTimeout(r,ms));
   const frames=async count=>{for(let i=0;i<count;i++)await new Promise(requestAnimationFrame);};
   // RAF count alone is not elapsed simulation time (high-refresh screens can
   // deliver 16 frames before the body has even accelerated). Observe real
   // movement for a bounded interval and inspect every rendered sample.
   const observe=async(ms,sample)=>{
    const start=performance.now();let count=0;
    do{
     await frames(1);count++;sample?.();
     if(performance.now()-start>60000)throw Error('Corner movement did not complete within its deadline');
    }while(performance.now()-start<ms||count<32);
   };
   const stop=()=>{input.x=input.z=0;input.run=false;body.setLinvel({x:0,y:0,z:0},true);};
   function direction(x,z){const yaw=w.camera.userData.feelLab.yaw;input.x=Math.cos(yaw)*x-Math.sin(yaw)*z;input.z=-Math.sin(yaw)*x-Math.cos(yaw)*z;}
   async function board(value){if(module.i.on!==value){dispatchEvent(new KeyboardEvent('keydown',{key:'v',code:'KeyV',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{key:'v',code:'KeyV',bubbles:true}));await frames(2);}if(module.i.on!==value)throw Error('Board control did not switch');}
   async function place(x,z){
    stop();
    // Debug teleports shorter than the sweep-reset distance are interpreted as
    // movement. Reset via the distant spawn so setup itself is not a wall sweep.
    __tp([original.x,original.y,original.z]);await frames(3);
    __tp([x,w.ground(x,z)+.555,z]);await pause(350);await frames(2);
    const q=body.translation();if(Math.hypot(q.x-x,q.z-z)>.15)throw Error('Corner fixture did not reach its start');
   }
   try{
    for(const riding of [false,true]){
     await board(riding);
     const p=JSON.parse(w.renderer.domElement.dataset.centralLayout68).find(p=>p.id==='N1');
     const wall=p.x+p.footprint.maxX*1.15,x=wall+.405,z=p.z-1;
     await place(x,z);
     const before={...body.translation()};let intrusion=false;
     direction(-.7,.7);
     await observe(800,()=>{const q=body.translation();if(w.ground(q.x,q.z)>q.y+1)intrusion=true;});
     const slide={...body.translation()};stop();
     // Push directly into the visibly closed facade: stopped, with a clear cue.
     await place(x,z);direction(-1,0);
     await observe(700);const wallStop={...body.translation()},cue=!!document.querySelector('#park-contact-cue:not([hidden])');
     direction(1,0);await observe(600);const retreat={...body.translation()};stop();await frames(3);
     rows.push({riding,before,slide,wall,wallStop,retreat,cue,intrusion,cueHidden:!document.querySelector('#park-contact-cue:not([hidden])')});
    }
   }finally{stop();await board(boardBefore);__tp([original.x,original.y,original.z]);await frames(3);}
   return rows;
  });
  for(const r of result){
   assert(r.slide.z-r.before.z>.3,JSON.stringify(r));assert(!r.intrusion,JSON.stringify(r));
   assert(r.wallStop.x>=r.wall+.35,JSON.stringify(r));assert(r.retreat.x-r.wallStop.x>.4,JSON.stringify(r));
   assert(r.cue,JSON.stringify(r));assert(r.cueHidden,JSON.stringify(r));
  }
  console.log('PASS model contact survey',JSON.stringify({mobile,...report,movement:result.map(r=>({board:r.riding,slide:r.slide.z-r.before.z,retreat:r.retreat.x-r.wallStop.x}))}));
 });
};
