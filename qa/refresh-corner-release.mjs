// Mechanical release-key propagation only: version every changed importer so
// a returning player cannot load old contact code beside the new module graph.
// Dry-run by default. The explicit --write switch applies the replacements.
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url).pathname,revision='corner-contact-1';
const sources=new Map(),updated=new Map();
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()){
   if(!['node_modules','.git','server','vendor','.qa-results','.pages-stage'].includes(entry.name))walk(p);
  }else if(/\.(js|mjs|cjs|html)$/.test(p)&&!entry.name.startsWith('refresh-')){
   const s=fs.readFileSync(p,'utf8');sources.set(p,s);updated.set(p,s);
  }
 }
}
walk(root);
const changed=new Set(['main.js','chunk-OZ77422N.js','runtime.bundle.js','central-buildings-v68.js']);
let again=true;
while(again){
 again=false;
 for(const [p,s] of updated){
  let next=s;
  for(const name of changed)next=next.replaceAll(new RegExp(name.replaceAll('.','\\.')+'\\?v=[a-zA-Z0-9_-]+','g'),name+'?v='+revision);
  if(next!==s){updated.set(p,next);if(!changed.has(path.basename(p))){changed.add(path.basename(p));again=true;}}
 }
}
const main=updated.get(path.join(root,'app/main.js'));
const version=name=>{
 const keys=[...main.matchAll(new RegExp(name.replaceAll('.','\\.')+'\\?v=([a-zA-Z0-9_-]+)','g'))].map(m=>m[1]);
 if(new Set(keys).size!==1)throw Error('Ambiguous shared runtime key: '+name);return keys[0];
};
const html=path.join(root,'index.html');
updated.set(html,updated.get(html).replace(/window\.__partyConfig=\{runtime:"[^"]+",carry:"[^"]+"\}/,
 'window.__partyConfig={runtime:"'+version('claude-gorilla-runtime.js')+'",carry:"'+version('park-carry.js')+'"}'));
const touched=[...updated].filter(([p,s])=>s!==sources.get(p));
if(process.argv.includes('--write'))for(const [p,s] of touched)fs.writeFileSync(p,s);
console.log(JSON.stringify({revision,write:process.argv.includes('--write'),files:touched.map(([p])=>path.relative(root,p)),count:touched.length}));
