const fs=require('node:fs');
const assert=require('node:assert/strict');

// Test infrastructure only. The public game's renderer/settings are unchanged.
function browserLaunchOptions(env=process.env,{platform=process.platform,exists=fs.existsSync}={}){
 const mac='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const options={headless:true,channel:'chromium'};
 if(env.PARK_CHROME)options.executablePath=env.PARK_CHROME;
 else if(platform==='darwin'&&exists(mac))options.executablePath=mac;
 if(env.PARK_SOFTWARE_RENDER!=='1')return options;
 if(env.PARK_SOFTWARE_DRIVER==='mesa'){
  assert.equal(platform,'linux','Mesa CI profile requires Linux');
  assert(env.DISPLAY,'Run the Mesa profile inside xvfb-run');
  options.headless=false;
  options.args=['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'];
 }else{
  options.args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
 }
 return options;
}

async function assertBrowserRenderer(page,env=process.env){
 const state=await page.evaluate(()=>{
  const r=window.__islandWorld?.renderer,g=r?.getContext();
  if(!g)return null;
  const e=g.getExtension('WEBGL_debug_renderer_info');
  return {renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),lost:g.isContextLost(),width:r.domElement.width,height:r.domElement.height};
 });
 assert(state&&!state.lost,'Functional tests require a real, live WebGL context');
 if(env.PARK_SOFTWARE_RENDER==='1'&&env.PARK_SOFTWARE_DRIVER==='mesa'){
  assert.match(state.renderer,/llvmpipe/i,'Do not silently fall back to a different CI renderer');
 }else if(env.PARK_SOFTWARE_RENDER==='1')assert.match(state.renderer,/swiftshader/i);
 console.log('QA_RENDERER',JSON.stringify(state));
 return state;
}
module.exports={browserLaunchOptions,assertBrowserRenderer};
