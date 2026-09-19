import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {boundedSimulationStep,MAX_SIMULATION_STEP} from '../app/simulation-step.js';

test('normal 20/30/60/120 FPS steps are unchanged; stalls and invalid deltas are bounded',()=>{
 for(const fps of [20,30,60,120])assert.equal(boundedSimulationStep(1/fps),1/fps);
 for(const dt of [.1,.5,15,Infinity,NaN,-1]){
  const step=boundedSimulationStep(dt);assert(Number.isFinite(step)&&step>=0&&step<=.05);
 }
 assert.equal(boundedSimulationStep(.5),.05);
 assert.equal(boundedSimulationStep(Infinity),0);
});

test('jump gravity and position integrate the same time after a slow frame',()=>{
 // The original mismatch used the controller's 50 ms gravity with a 500 ms
 // physics displacement. This reproduces that mismatch without a renderer.
 function jump(delta,physicsDelta){let y=0,v=9.2,peak=0;for(let n=0;n<200;n++){
  v-=24*boundedSimulationStep(delta);y+=v*physicsDelta(delta);peak=Math.max(peak,y);if(y<0)break;
 }return peak}
 const normal=jump(.05,boundedSimulationStep),slow=jump(.5,boundedSimulationStep);
 assert.equal(slow,normal);assert(normal>1.4&&normal<1.8);
 assert(jump(.5,dt=>Math.min(.5,dt))>normal*9);
 assert.equal(6.8*boundedSimulationStep(15),.34);
});

test('shipped variable physics and character controller share the tested bound',()=>{
 const main=fs.readFileSync(new URL('../app/main.js',import.meta.url),'utf8');
 const controller=fs.readFileSync(new URL('../app/claude-gorilla-runtime.js',import.meta.url),'utf8');
 assert(main.includes('Io=We?boundedSimulationStep(Te):Bu.clamp(Te,0,.5)'));
 assert(controller.includes('pt=boundedSimulationStep'));
 for(const source of [main,controller])assert(source.includes('from"./simulation-step.js"'));
 assert.equal(MAX_SIMULATION_STEP,.05);
});
