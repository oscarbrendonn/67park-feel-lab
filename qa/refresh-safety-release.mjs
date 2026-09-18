// Mechanical cache-key update across shared module importers. One exact URL
// per module avoids duplicating singleton physics/input stores.
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const main=new URL('app/main.js',root);
const old='mode:()=>__healthState.get().frameloop}',next='mode:()=>__healthState.get().frameloop,recover:()=>{__healthState.get().setFrameloop("always");__healthState.get().invalidate();}}';
let source=fs.readFileSync(main,'utf8');
if(source.includes(old)){if(source.split(old).length!==2)throw Error('Health hook ambiguous');fs.writeFileSync(main,source.replace(old,next));}
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()){if(!['node_modules','.git','server','.qa-results','.pages-stage'].includes(entry.name))walk(p);}else if(/\.(js|mjs|cjs|html)$/.test(p)&&!p.endsWith('refresh-safety-release.mjs'))files.push(p);}}
walk(root.pathname);
const changed=new Set(['main.js','party-pack.js','settings-panel.js','preview-network.js','preview-network-config.js','housing.js','chat-submit.js','remote-speech-bubbles.js','local-speech-bubble.js','park-render-health.js']);
let again=true;while(again){again=false;for(const p of files){let s=fs.readFileSync(p,'utf8'),updated=s;for(const name of changed)updated=updated.replaceAll(new RegExp(name.replaceAll('.','\\.')+'\\?v=[a-zA-Z0-9_-]+','g'),name+'?v=foundation-safety-1');if(updated!==s){fs.writeFileSync(p,updated);if(!changed.has(path.basename(p))){changed.add(path.basename(p));again=true;}}}}
console.log('Unified release keys:',changed.size);
// party-pack also dynamically imports these stateful modules using inline
// configuration. Keep that configuration equal to main's static imports.
const current=fs.readFileSync(main,'utf8'),version=name=>{
 const versions=[...current.matchAll(new RegExp(name.replaceAll('.','\\.')+'\\?v=([a-zA-Z0-9_-]+)','g'))].map(m=>m[1]);
 if(new Set(versions).size!==1)throw Error('Ambiguous shared runtime URL: '+name);return versions[0];
};
const html=new URL('index.html',root),index=fs.readFileSync(html,'utf8');
fs.writeFileSync(html,index.replace(/window\.__partyConfig=\{runtime:"[^"]+",carry:"[^"]+"\}/,'window.__partyConfig={runtime:"'+version('claude-gorilla-runtime.js')+'",carry:"'+version('park-carry.js')+'"}'));
