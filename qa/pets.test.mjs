import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
register('./three-test-loader.mjs',import.meta.url);
const T=await import('../vendor/three.module.js');
const {createPetModels}=await import('../app/pets/pet-model.js');
const {createPetFollower}=await import('../app/pets/pet-follow.js');
const {createPetSelection,petFromCombo,comboWithPet,petSelection}=await import('../app/pets/pet-state.js?v=pets-soft-2');
const {createParkPets}=await import('../app/pets/park-pets.js');

test('bounded pet metadata preserves every existing outfit field',()=>{
  const original={v:3,base:'goril',back:'wings',body:'hoodie',head:'hat',kicks:'red'};
  const combo=comboWithPet(JSON.stringify(original),'cat');
  assert.deepEqual(JSON.parse(combo),{...original,pet:'cat'});
  assert.equal(petFromCombo(combo),'cat');assert.equal(petFromCombo('{bad'), '');
  assert.equal(petFromCombo(JSON.stringify({pet:'javascript:evil'})), '');
  assert.deepEqual(JSON.parse(comboWithPet(combo,'')),original);
  assert.equal(comboWithPet('x'.repeat(701),'cat'),'x'.repeat(701));
  const map=new Map(),store=createPetSelection({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)});
  store.select('dog');assert.equal(store.get(),'dog');assert.equal(store.select('dragon'),false);
  assert.equal(createPetSelection({getItem:k=>map.get(k)}).get(),'dog');
  assert.doesNotThrow(()=>createPetSelection({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}).select('cat'));
});

test('shared skinned models animate feet/ears/tail without allocating new resources',()=>{
  const factory=createPetModels({shadows:false});
  for(const kind of ['cat','dog']){
    const a=factory.create(kind),b=factory.create(kind);assert.equal(a.mesh.geometry,b.mesh.geometry);assert.equal(a.mesh.material,b.mesh.material);
    assert.notEqual(a.mesh.skeleton,b.mesh.skeleton);assert(a.stats.triangles<12000);assert.equal(a.stats.draws,1);
    const before=a.mesh.skeleton.bones.find(b=>b.name==='frontL').rotation.x;
    for(let i=0;i<120;i++)a.update(1/60,{speed:1.7});
    assert.notEqual(a.mesh.skeleton.bones.find(b=>b.name==='frontL').rotation.x,before);
    for(let i=0;i<240;i++)a.update(1/60,{speed:0});assert.equal(a.stats.pose,'sit');
    a.play();a.update(.05,{speed:0});assert.equal(a.stats.pose,'play');
    for(let i=0;i<180;i++)a.update(1/60,{speed:2,reducedMotion:true});
    assert.equal(a.mesh.skeleton.bones[0].rotation.z,0);
    assert([...a.mesh.geometry.attributes.position.array].every(Number.isFinite));a.dispose();b.dispose();
  }
  assert.equal(factory.stats().instances,0);assert.equal(factory.stats().geometries,2);factory.dispose();
});

test('follower walks, stops, recalls after teleport and never crosses a wall',()=>{
  let probes=0;const follower=createPetFollower((x,z)=>{probes++;return x>2&&x<3?null:0});
  let p={x:0,y:0,z:0};follower.step(.05,p,0);
  for(let i=0;i<500;i++){p={x:Math.min(1.2,i*.008),y:0,z:Math.min(6,i*.02)};follower.step(.02,p,0);assert(!(follower.state.x>2&&follower.state.x<3));}
  for(let i=0;i<500;i++)follower.step(.02,p,0);
  assert.equal(follower.state.speed,0);assert(follower.stats().trail<=80);
  follower.step(.05,{x:60,y:0,z:60},0);assert(Math.hypot(follower.state.x-60,follower.state.z-60)<2);
  assert(probes<10000);assert.doesNotThrow(()=>follower.step(NaN,{x:NaN,y:0,z:0},Infinity));
});

test('rounded sculpts keep a small shared budget and resting paws on the floor',()=>{
  const factory=createPetModels({shadows:false}),v=new T.Vector3();
  for(const kind of ['cat','dog']){
    const pet=factory.create(kind,{scale:1}),g=pet.mesh.geometry;
    const bytes=Object.values(g.attributes).reduce((sum,a)=>sum+a.array.byteLength,0)+g.index.array.byteLength;
    assert(bytes<550000,kind+' geometry budget');
    for(const name of ['position','normal','color','skinWeight'])assert([...g.attributes[name].array].every(Number.isFinite),name+' must remain finite');
    for(let i=0;i<g.attributes.skinWeight.count;i++){
      const a=g.attributes.skinWeight,sum=a.getX(i)+a.getY(i)+a.getZ(i)+a.getW(i);
      assert(Math.abs(sum-1)<1e-6,'Each vertex must stay attached to the rig');
    }
    for(let i=0;i<240;i++)pet.update(1/60,{sitting:true,reducedMotion:true});
    pet.root.updateMatrixWorld(true);pet.mesh.skeleton.update();const floor={};
    for(let i=0;i<g.attributes.position.count;i++){
      const bone=pet.mesh.skeleton.bones[g.attributes.skinIndex.getX(i)].name;
      if(!/^(front|back)/.test(bone))continue;
      v.fromBufferAttribute(g.attributes.position,i);pet.mesh.applyBoneTransform(i,v);
      floor[bone]=Math.min(floor[bone]??Infinity,v.y);
    }
    for(const y of Object.values(floor))assert(y>-.002&&y<.04,'Resting paws must not float or sink');
    assert.equal(Object.keys(floor).length,4);pet.dispose();
  }
  factory.dispose();
});

test('a water-only area does not create a floating pet',()=>{
  const follower=createPetFollower(()=>null);for(let i=0;i<50;i++)follower.step(.02,{x:0,y:0,z:0},0);
  assert.equal(follower.state.visible,false);
  const roof=createPetFollower(()=>1.2);roof.step(.05,{x:0,y:0,z:0},0);assert.equal(roof.state.visible,false,'Never recall onto a roof above the owner');
});

test('100 nearby players are bounded; switches and map changes retain no pets',()=>{
  const world={ready:true,scene:new T.Scene(),ground:()=>0,water:()=>false,treeBlocked:()=>false};
  const network={connected:true,remotes:new Map(),lastHello:{name:'Test',combo:JSON.stringify({v:3,base:'goril',head:'hat'})},sendHello(name,combo){this.lastHello={name,combo}}};
  for(let i=0;i<100;i++)network.remotes.set('peer'+i,{combo:JSON.stringify({base:'goril',pet:i%2?'cat':'dog'}),targetP:[i/10,.555,3],targetRy:0});
  const original=network.sendHello,body={translation:()=>({x:0,y:.555,z:0})};
  const pets=createParkPets({world:()=>world,net:()=>network});pets.select('cat');
  for(let i=0;i<100;i++)pets.step(body,1/60,'city');
  assert.equal(petFromCombo(network.lastHello.combo),'cat');assert.equal(JSON.parse(network.lastHello.combo).head,'hat');
  assert(pets.debug().remotes.length<=10);assert(pets.debug().models.instances<=11);
  const resources=pets.debug().models;
  for(let i=0;i<100;i++){pets.select(i%2?'cat':'dog');pets.step(body,1/60,'city');}
  assert.equal(pets.debug().models.geometries,resources.geometries);assert.equal(pets.debug().models.materials,resources.materials);
  pets.step(body,.02,'cloud');assert.equal(pets.debug().active,false);assert(!pets.debug().remotes.some(r=>r.visible));
  pets.step(body,.02,'city');assert.equal(pets.debug().active,true);assert.equal(pets.debug().failed,0);
  pets.dispose();assert.equal(network.sendHello,original);assert.equal(world.scene.children.length,0);petSelection.select('');
});
