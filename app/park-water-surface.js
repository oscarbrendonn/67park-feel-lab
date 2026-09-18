// Park pond uses the same palette, moving surface and swimmer wake as the coast.
// The authored pond mesh supplies its boundary; the ocean's land mask must not clip it.
export function applyParkWaterSurface(world) {
  // This legacy GLB cap is not a pond: the authored S-bowl below is for skating.
  // Keep its source identity for collision/asset compatibility, never render it.
  const hiddenCaps=[];
  world.terrain?.traverse(node=>{
    if(node.isMesh && /^9_GOLET_MINI(?:$|[._-])/i.test(node.name)) {
      node.visible=false; hiddenCaps.push(node.name);
    }
  });
  if (world.parkWaterSurface) return world.parkWaterSurface;
  const ocean = world.scene?.getObjectByName('KIMI_WATERBODY_GORUNUR');
  const pond = world.terrain?.getObjectByName('67D_PARK_WATER_UNIFIED_V65');
  if (!ocean?.material?.isShaderMaterial || !pond?.isMesh) return null;
  const source = ocean.material;
  const mask = /if\(all\(greaterThanEqual\(uv,vec2\(0\.\)\)\)&&all\(lessThanEqual\(uv,vec2\(1\.\)\)\)&&texture2D\(uLand,uv\)\.r>\.5\)discard;/;
  if (!mask.test(source.fragmentShader)) throw Error('Park water: coast shader mask changed');
  const original = pond.material;
  const material = source.clone();
  material.name = '67P_PARK_WATER_COAST_SURFACE';
  // Share the existing clock/player uniforms. No extra loop, texture or audio/physics changes.
  material.uniforms = {...source.uniforms};
  material.fragmentShader = source.fragmentShader.replace(mask, '');
  // The enclosed pond has no distant ocean silhouette to reveal its surface.
  // Retain the coastal palette/wave timing, with readable soft ripple shading
  // at character height. Do not mutate the shared ocean material/uniforms.
  material.fragmentShader = material.fragmentShader
    .replace('vec3(-.035*ca+.021*cb,1.,-.014*ca-.030*cb)',
      'vec3(-.18*ca+.11*cb,1.,-.07*ca-.15*cb)')
    .replace('(light-.745)*.55*detail','(light-.745)*.85*detail')
    .replace('sheen*.065*detail','sheen*.20*detail');
  material.uniforms.uAmp={value:.025};
  // Ocean geometry is an XY plane rotated into the ground; the pond is already
  // in XYZ world space. Adapt only the displacement axis, retaining its waves.
  if(!source.vertexShader.includes('p.z+=')) throw Error('Park water: coast wave adapter changed');
  material.vertexShader = source.vertexShader.replace('p.z+=','p.y+=');
  material.visible=true;
  material.colorWrite=true;
  material.needsUpdate = true;
  pond.material = material;
  const report = {version:'park-water-4',mesh:pond.name,source:ocean.name,hiddenSkateCaps:hiddenCaps,
    sharedWaveTiming:true,sharedSwimmerWake:true,geometryUnchanged:true,extraDrawCalls:0};
  world.parkWaterSurface = report;
  // The existing swim controller keeps its capsule 0.58 m above water. Its
  // horizontal model was entirely above the pond as well. Immerse only the
  // visual, never the physics body, dry bowl, coast, or other game maps.
  world.parkSwimVisual = root => {
    if(!root || root.rotation.x<.5) return;
    const p=globalThis.window?.__eggyInput?.playerRef?.body?.translation?.();
    if(!p || Math.hypot(root.position.x-p.x,root.position.z-p.z)>.1) return;
    const level=world.pond?.height(p.x,p.z);
    if(level==null || !world.water(p.x,p.z) || Math.abs(p.y-level-.58)>.10) return;
    if(root.position.y>level+.30) root.position.y-=.47;
  };
  world.renderer.domElement.dataset.parkWaterSurface = JSON.stringify(report);
  const dispose = world.dispose?.bind(world);
  if (dispose) world.dispose = () => {
    pond.material = original; material.dispose(); delete world.parkWaterSurface; delete world.parkSwimVisual; dispose();
  };
  return report;
}
