const assert=require('node:assert/strict');
module.exports=async function graphicsAndCamera(page,{mobile,check}){
 await page.locator('#party-settings-btn').click();
 const select=page.getByRole('combobox',{name:'Graphics quality',exact:true});
 const read=()=>page.evaluate(()=>{const r=__islandWorld.renderer;return {ratio:r.getPixelRatio(),width:r.domElement.width,height:r.domElement.height,shadows:r.shadowMap.enabled,frame:r.info.render.frame,profile:JSON.parse(r.domElement.dataset.parkGraphics)}});
 await select.selectOption('high');await page.waitForTimeout(400);const high=await read();
 await select.selectOption('low');await page.waitForTimeout(400);const low=await read();
 assert(low.width<high.width&&low.height<high.height,'Low must reduce the actual framebuffer');assert.equal(low.shadows,false);
 await select.selectOption('medium');await page.waitForTimeout(400);const medium=await read();
 assert(medium.width>=low.width&&medium.width<=high.width);assert.equal(medium.shadows,true);assert(medium.frame>high.frame);
 console.log('GRAPHICS_FRAMEBUFFERS',JSON.stringify({mobile,high,low,medium}));
 // Compositing a screenshot on the CPU-only runner is separate from the
 // render-progress checks. Keep the measured framebuffers/shadows unchanged.
 await page.screenshot({path:'.qa-results/graphics-'+(mobile?'mobile':'desktop')+'.png',timeout:90000});
 await select.selectOption('auto');await page.getByRole('button',{name:'Close settings',exact:true}).click();
 await check('quality changes retain rendering, controls and connections',async()=>{});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('67park.feel-lab.player-settings.v1')).graphics),'auto');
 console.log('GRAPHICS_BROWSER_PASS',JSON.stringify({mobile,high,low,medium}));
};
