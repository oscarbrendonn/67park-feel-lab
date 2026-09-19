const assert=require('node:assert/strict');
module.exports=async(page,{mobile,check})=>{
 await check('coastal house divider stays inside the lawn and leaves the sidewalk clear',async()=>{
  const result=await page.evaluate(async()=>{
   const T=await import('three'),w=__islandWorld,m=w.terrain.getObjectByName('8_REF_AYIRICI');
   const p=m.geometry.attributes.position,v=new T.Vector3();let count=0,minZ=Infinity,maxZ=-Infinity;
   for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);
    if(v.x>224.2&&v.x<225.4&&v.z>130.2&&v.z<151.7){count++;minZ=Math.min(minZ,v.z);maxZ=Math.max(maxZ,v.z);}
   }
   const probes=[];
   for(const x of[224.2,224.8,225.3])for(const z of[142.65,144,147.8,148.5,149.5]){
    const hit=w.sample(x,z);probes.push({x,z,name:hit?.object?.name,y:hit?.point?.y});
   }
   return {report:m.userData.southeastDivider49,count,minZ,maxZ,probes};
  });
  assert.equal(result.report?.version,49,'Published runtime omitted the divider repair');
  assert.equal(result.count,1253);assert(Math.abs(result.minZ-130.400677)<1e-5);
  assert(Math.abs(result.maxZ-142.55)<1e-5,'Divider extends beyond its restored lawn endpoint');
  for(const p of result.probes){
   assert.equal(p.name,p.z<145?'3_CIMEN':'7_KALDIRIM_TABANI','Unexpected surface behind divider '+JSON.stringify(p));
   assert(p.y>9.375,'Floor opening behind shortened divider '+JSON.stringify(p));
  }
  try{
   await page.evaluate(()=>{__candyCamera.parked={p:[249,29,174],t:[224,9.4,140]};});
   await page.waitForTimeout(350);
   // CPU-only CI may need longer to capture a composited image. This does not
   // change the enclosing render-progress, frame-gap or WebGL-loss assertions.
   await page.screenshot({path:'.qa-results/divider-'+(mobile?'mobile':'desktop')+'.png',timeout:90000});
  }finally{await page.evaluate(()=>{__candyCamera.parked=null;});}
  console.log('PASS restored coastal divider',JSON.stringify({mobile,count:result.count,maxZ:result.maxZ,floorProbes:result.probes.length}));
 });
};
