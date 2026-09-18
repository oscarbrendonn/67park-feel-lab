if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('carQA')){
 const panel=document.createElement('div');panel.style.cssText='position:fixed;top:80px;left:16px;z-index:9999;background:white;padding:8px;max-width:430px;font:12px monospace';
 const output=document.createElement('pre');output.style.whiteSpace='pre-wrap';
 let busy=false;
 const button=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.style.cssText='padding:10px;margin:3px';b.onclick=fn;panel.append(b);};
 button('Approach parked car',()=>window.__candy?.approach('car',0));
 button('Enter / exit car',()=>window.__candy?.action());
 for(const [label,keys]of [['Drive 3 seconds',['KeyW']],['Turn right 2 seconds',['KeyW','KeyD']],['Reverse 2 seconds',['KeyS']],['Brake',['Space']]])button(label,()=>{
  if(busy)return;busy=true;
  for(const code of keys)dispatchEvent(new KeyboardEvent('keydown',{code,key:code==='Space'?' ':code.slice(3).toLowerCase(),bubbles:true}));
  setTimeout(()=>{for(const code of keys)dispatchEvent(new KeyboardEvent('keyup',{code,key:code==='Space'?' ':code.slice(3).toLowerCase(),bubbles:true}));busy=false;},label.startsWith('Drive')?3000:2000);
 });
 panel.append(output);document.body.append(panel);
 setInterval(()=>{const s=window.__candy?.state();if(s)output.textContent=JSON.stringify(s,null,1);},250);
}
