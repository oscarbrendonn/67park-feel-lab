const test=require('node:test');
const assert=require('node:assert/strict');
const {browserLaunchOptions,assertBrowserRenderer}=require('./browser-launch.cjs');
test('normal hardware checks do not inherit a software-renderer override',()=>{
 assert.deepEqual(browserLaunchOptions({},{platform:'linux'}),{headless:true,channel:'chromium'});
 assert.equal(browserLaunchOptions({PARK_CHROME:'/explicit/chrome'},{platform:'linux'}).executablePath,'/explicit/chrome');
});
test('CPU backends are explicit and the Mesa profile cannot run without Linux and X11',()=>{
 assert(browserLaunchOptions({PARK_SOFTWARE_RENDER:'1'},{platform:'linux'}).args.includes('--use-angle=swiftshader'));
 const env={PARK_SOFTWARE_RENDER:'1',PARK_SOFTWARE_DRIVER:'mesa',DISPLAY:':99'};
 const options=browserLaunchOptions(env,{platform:'linux'});
 assert.equal(options.headless,false);assert(options.args.includes('--use-angle=gl'));
 assert(!options.args.includes('--enable-unsafe-swiftshader'));
 assert.throws(()=>browserLaunchOptions(env,{platform:'darwin',exists:()=>false}),/Linux/);
 assert.throws(()=>browserLaunchOptions({...env,DISPLAY:''},{platform:'linux'}),/xvfb-run/);
});
test('renderer check fails instead of accepting fallback or a lost context',async()=>{
 const env={PARK_SOFTWARE_RENDER:'1',PARK_SOFTWARE_DRIVER:'mesa'};
 await assert.rejects(assertBrowserRenderer({evaluate:async()=>({renderer:'SwiftShader',lost:false})},env),/silently fall back/);
 await assert.rejects(assertBrowserRenderer({evaluate:async()=>({renderer:'llvmpipe',lost:true})},env),/live WebGL/);
});
