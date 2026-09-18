import {pathToFileURL} from 'node:url';
export function resolve(specifier,context,next){
 if(specifier.startsWith('three/examples/jsm/'))return {url:new URL('addons/'+specifier.slice(19),process.env.THREE_MODULE?pathToFileURL(process.env.THREE_MODULE):new URL('../vendor/three.module.js',import.meta.url)).href,shortCircuit:true};
 if(specifier==='three')return {url:process.env.THREE_MODULE?pathToFileURL(process.env.THREE_MODULE).href:new URL('../vendor/three.module.js',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
