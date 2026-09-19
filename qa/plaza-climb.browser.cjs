const assert=require('node:assert/strict');
// Software CI clamps the same game timestep but rasterizes fewer frames per
// wall-clock second. Only the action deadline differs, not the asserted route,
// frame-stall budget, geometry, controls, or mandatory soak duration.
const actionTimeout=process.env.PARK_SOFTWARE_RENDER==='1'?240000:45000;
module.exports=async function checkPlazaClimb(page,{mobile=false,check}){
 await check('plaza leaves, all awnings and roofs match visible geometry; walls stay closed',async()=>{
  const result=await page.evaluate(async()=>{
   const w=__islandWorld,T=await import('three'),p=w.roofSupports.plaza,g=w.scene.getObjectByName('LOWER_PLAZA_V83');
   if(!p)throw Error('Plaza support missing');let meta;g.traverse(o=>{if(o.userData.plaza83)meta=o.userData.plaza83;});
   const ray=new T.Raycaster(),errors=[];let tested=0;
   for(const s of meta.shops){
    for(const [u,v,ceiling]of [[0,s.depth/2+1.5,17],[0,0,40],[-s.width*.17,s.depth/2+.55,19]]){
     const c=Math.cos(s.yaw),n=Math.sin(s.yaw),x=meta.cx+s.x+c*u+n*v,z=meta.cz+s.z-n*u+c*v;
     ray.set(new T.Vector3(x,ceiling,z),new T.Vector3(0,-1,0));
     const hit=ray.intersectObject(g,true).find(h=>!/COLLIDER|glass|reflection|bulb|cord/.test(h.object.name));
     const found=p.sample(x,z,ceiling);if(!hit||!found||Math.abs(hit.point.y-found.point.y)>.025)errors.push({id:s.id,u,v,hit:hit?.point.y,found:found?.point.y});
     tested++;
    }
    const x=meta.cx+s.x,z=meta.cz+s.z;
    if(w.characterGround(x,z,meta.ground,.36)<meta.ground+9)errors.push({id:s.id,reason:'wall open'});
   }
   // One-way awnings leave the original street below open, not a tall wall.
   const under=w.characterGround(18,57.5,meta.ground,.36),on=w.characterGround(18,57.5,15.1,.012);
   return {stats:p.stats,tested,errors,under,on};
  });
  assert.equal(result.tested,33);assert.deepEqual(result.errors,[]);assert.equal(result.stats.shops,11);
  assert(result.stats.windowCaps>=44);assert.equal(result.stats.addedDrawCalls,1);assert.equal(result.stats.newAssetDownloads,0);
  assert(result.stats.bytes<11*1024*1024);assert(Math.abs(result.under-9.66)<.02);assert(result.on>14.8&&result.on<15);
  console.log('PASS plaza geometry',JSON.stringify({mobile,...result}));
 });
 await check(mobile?'touch jumps: paving → shrub → striped awning → window cap → roof':'keyboard jumps: paving → shrub → striped awning → window cap → roof',async()=>{
  const before=await page.evaluate(()=>({position:{...__eggyInput.playerRef.body.translation()},board:__candy.state().board}));
  const jump=()=>mobile?page.getByRole('button',{name:'Jump',exact:true}).tap():page.keyboard.press('Space');
  async function direction(x,target){await page.evaluate(({x,target,deadline})=>{
   const token=(window.__qaPlazaSteer||0)+1;window.__qaPlazaSteer=token;window.__qaPlazaAtTarget=false;
   const started=performance.now();
   const tick=()=>{
    if(window.__qaPlazaSteer!==token)return;
    const i=__eggyInput.input,b=__eggyInput.playerRef.body,p=b.translation(),remaining=(target-p.x)*x;
    if(remaining<=.06||performance.now()-started>deadline){i.x=i.z=0;i.run=false;const v=b.linvel();b.setLinvel({x:0,y:v.y,z:0},true);window.__qaPlazaAtTarget=remaining<=.06;return;}
    const yaw=__islandWorld.camera.userData.feelLab.yaw;
    // Normal analog input, with walking-speed final approach. Stop in the
    // browser frame, not a network round trip later on a narrow shrub/cap.
    const strength=Math.min(1,remaining*2);i.x=x*Math.cos(yaw)*strength;i.z=-x*Math.sin(yaw)*strength;i.run=remaining>2;
    requestAnimationFrame(tick);
   };tick();
  },{x,target,deadline:actionTimeout});}
  async function stop(){await page.evaluate(()=>{window.__qaPlazaSteer=(window.__qaPlazaSteer||0)+1;const i=__eggyInput.input,b=__eggyInput.playerRef.body;i.x=i.z=0;i.run=false;const v=b.linvel();b.setLinvel({x:0,y:v.y,z:0},true);});}
  async function hop(target,{double=true,delayMove=false}={}){
   const start=await page.evaluate(()=>({...__eggyInput.playerRef.body.translation()}));
   await jump();
   // A mobile tap queues the jump for the next physics frame. Do not mistake
   // the still-grounded frame immediately after the tap for a new landing.
   await page.waitForFunction(y=>{const b=__eggyInput.playerRef.body;return b.translation().y>y+.15&&b.linvel().y>0;},start.y,{timeout:actionTimeout});
   if(!delayMove)await direction(Math.sign(target-start.x),target);
   if(double){
    await page.waitForFunction(y=>{const b=__eggyInput.playerRef.body;return b.translation().y>y+1&&b.linvel().y<2.8;},start.y,{timeout:actionTimeout});
    await jump();
    // Keyboard key-up refreshes the real input singleton from held keys;
    // restore this QA world-direction vector after that real UI event.
    if(!delayMove)await direction(Math.sign(target-start.x),target);
   }
   if(delayMove)await direction(Math.sign(target-start.x),target);
   await page.waitForFunction(()=>window.__qaPlazaAtTarget,null,{timeout:actionTimeout});
   await stop();
   await page.waitForFunction(()=>{const w=__islandWorld,b=__eggyInput.playerRef.body,p=b.translation();return Math.abs(b.linvel().y)<.2&&Math.abs(p.y-.555-w.characterGround(p.x,p.z,p.y-.555))<.08;},null,{timeout:actionTimeout});
   return page.evaluate(()=>({...__eggyInput.playerRef.body.translation()}));
  }
  try{
   if(before.board)await page.keyboard.press('KeyV');
   await page.evaluate(async()=>{__tp(__islandWorld.spawn);for(let f=0;f<4;f++)await new Promise(requestAnimationFrame);__tp([26.1,10.215,57.5]);for(let f=0;f<10;f++)await new Promise(requestAnimationFrame);});
   const shrub=await hop(24.5,{delayMove:true});assert(shrub.y>12.3&&shrub.y<13.1,JSON.stringify({shrub}));
   const awning=await hop(18.2);assert(awning.y>15.1&&awning.y<15.6,JSON.stringify({awning}));
   await page.waitForTimeout(600);
   await page.screenshot({path:'.qa-results/plaza-awning-'+(mobile?'mobile':'desktop')+'.png',timeout:90000});
   const sill=await hop(17.12,{double:false,delayMove:true});assert(sill.y>16.15&&sill.y<16.4,JSON.stringify({sill}));
   const cap=await hop(17.14,{delayMove:true});assert(cap.y>19&&cap.y<19.3,JSON.stringify({cap}));
   const roof=await hop(15.7,{delayMove:true});assert(roof.y>20.3,JSON.stringify({roof}));
   await page.waitForTimeout(600);
   await page.screenshot({path:'.qa-results/plaza-roof-'+(mobile?'mobile':'desktop')+'.png',timeout:90000});
   // Walk off the eaves into the court; no old collider-box invisible platform.
   await direction(1,20.5);await page.waitForFunction(()=>window.__qaPlazaAtTarget,null,{timeout:actionTimeout});await stop();
   await page.waitForFunction(()=>__eggyInput.playerRef.body.translation().y<10.3,null,{timeout:actionTimeout});
   // Same front approached on the ground stays closed.
   await direction(-1,16);await page.waitForTimeout(1600);await stop();
   const wall=await page.evaluate(()=>({...__eggyInput.playerRef.body.translation()}));
   assert(wall.x>=16.85&&wall.x<17.5&&wall.y<11,JSON.stringify({wall}));
   console.log('PASS plaza route',JSON.stringify({mobile,shrub,awning,sill,cap,roof,wall}));
  }catch(error){
   console.log('PLAZA_ROUTE_FAILURE',await page.evaluate(()=>{const w=__islandWorld,b=__eggyInput.playerRef.body,p=b.translation();return {p,v:b.linvel(),input:__eggyInput.input,board:__candy.state().board,surface:w.characterGround(p.x,p.z,p.y-.555),ahead:w.characterGround(p.x-.45,p.z,p.y-.555),errors:__candyErrors};}));
   throw error;
  }finally{
   await stop();await page.evaluate(p=>__tp([p.x,p.y,p.z]),before.position);
   if(before.board)await page.keyboard.press('KeyV');
  }
 });
};
