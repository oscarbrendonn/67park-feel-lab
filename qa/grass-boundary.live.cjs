const assert=require('node:assert/strict');
module.exports=async(page,{mobile,check})=>{
 await check('shared grass and pavement contour has no floor opening',async()=>{
  const result=await page.evaluate(()=>{
   const w=__islandWorld,patch=w.terrain.userData.grassBoundary1;let probes=0;const gaps=[];
   for(let x=220.98;x<239.28;x+=.04)for(let z=128.97;z<130.64;z+=.04){
    const y=w.ground(x,z);probes++;if(y==null||y<9.375)gaps.push({x,z,y});
   }
   // Exact long-triangle Float32 seam found during the first strict audit.
   const support=w.ground(225.84956,129.34537);
   return {patch,probes,gaps:gaps.slice(0,8),support};
  });
  assert.equal(result.patch?.version,1);assert.equal(result.patch.repairedSteps,2);
  assert.equal(result.patch.addedDrawCalls,0);assert.deepEqual(result.gaps,[]);assert(result.support>9.375);
  console.log('PASS grass contour survey',JSON.stringify({mobile,probes:result.probes,support:result.support}));
 });
};
