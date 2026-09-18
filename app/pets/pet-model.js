import * as T from 'three';
import {validPet} from './pet-state.js?v=pets-1';

// Original vertex-coloured pets. All sculpted pieces are baked into ONE shared
// skinned geometry/material per species. No GLB download, fur shader or lights.
const clamp = T.MathUtils.clamp;
const TAU = Math.PI * 2;
function buildPet(kind) {
  const cat = kind === 'cat';
  const colors = {
    coat:cat?'#bcbcc5':'#e4b278', cream:'#fff2dc', ear:cat?'#e6ada9':'#cb925e',
    stripe:cat?'#999ba7':'#d49b64', collar:cat?'#95cbb6':'#e79882',
    nose:cat?'#d98f99':'#61463c', eye:'#332b29', iris:'#6b4b37', white:'#fff9ee', mouth:'#745455',
  };
  const bones = [], names = {}, positions = [], normals = [], color = [], indices = [], weights = [], elements = [];
  function bone(name, xyz, parent = 'body') {
    const b = new T.Bone(); b.name = name; b.position.set(...xyz);
    if (names[parent] !== undefined) bones[names[parent]].add(b);
    names[name] = bones.length; bones.push(b); return b;
  }
  bone('body',[0,.47,-.08],null);
  bone('head',[0,.39,.42]);
  bone('leftEar',[-.255,.235,0],'head'); bone('rightEar',[.255,.235,0],'head');
  for (const [name,x,z] of [['frontL',-.19,.25],['frontR',.19,.25],['backL',-.19,-.32],['backR',.19,-.32]]) bone(name,[x,-.10,z]);
  bone('tail',[0,.10,-.39]); bone('tailTip',[0,.20,-.23],'tail');
  bone('eyes',[0,0,0],'head');
  bones[0].updateMatrixWorld(true);
  const mat = new T.Matrix4(), quaternion = new T.Quaternion(), euler = new T.Euler();
  function part(g, c, owner, xyz, scale, rotation=[0,0,0]) {
    quaternion.setFromEuler(euler.set(...rotation));
    mat.compose(new T.Vector3(...xyz),quaternion,new T.Vector3(...scale));
    g.applyMatrix4(mat);
    const p = g.attributes.position, n = g.attributes.normal, rgb = new T.Color(c), ix=names[owner], offset=positions.length/3;
    for (let i=0; i<p.count; i++) {
      positions.push(p.getX(i),p.getY(i),p.getZ(i)); normals.push(n.getX(i),n.getY(i),n.getZ(i));
      color.push(rgb.r,rgb.g,rgb.b); indices.push(ix,0,0,0); weights.push(1,0,0,0);
    }
    if(g.index)for(const index of g.index.array)elements.push(offset+index);
    else for(let i=0;i<p.count;i++)elements.push(offset+i);
    g.dispose();
  }
  const ball = (c,owner,xyz,scale,rot,segments=16,rings=10) => part(new T.SphereGeometry(1,segments,rings),c,owner,xyz,scale,rot);
  // Continuous soft volumes, no block-bodied or humanoid stand-ins.
  ball(colors.coat,'body',[0,.48,-.10],[.265,.30,.43],nullRotation(),20,14);
  ball(colors.cream,'body',[0,.49,.206],[.207,.255,.14]);
  ball(colors.coat,'head',[0,.885,.34],[.385,.33,.315],nullRotation(),24,16);
  ball(colors.cream,'head',[0,.728,.546],[.255,.155,.149]);
  for (const side of [-1,1]) {
    ball(colors.cream,'head',[side*.079,.774,.638],[.101,.073,.064]);
    // Inset broad eyes follow the face, with modeled iris and tiny glints.
    const x=side*.158, y=.925, z=.606, tilt=side*.22;
    ball(colors.white,'eyes',[x,y,z],[.106,.127,.037],[0,tilt,side*-.06]);
    ball(colors.iris,'eyes',[x+side*.006,y-.002,z+.027],[.078,.098,.028],[0,tilt,0]);
    ball(colors.eye,'eyes',[x+side*.008,y,z+.050],[.056,.077,.019],[0,tilt,0]);
    ball(colors.white,'eyes',[x-.019,y+.043,z+.068],[.021,.026,.009],undefined,10,8);
    ball(colors.white,'eyes',[x+.027,y-.035,z+.065],[.008,.010,.006],undefined,8,6);
    ball(colors.stripe,'head',[side*.156,1.075,.561],[.063,.017,.015],[0,side*.16,side*.15],12,8);
  }
  ball(colors.nose,'head',[0,.802,.704],cat?[.044,.029,.027]:[.062,.045,.044]);
  // Small smile nestled beneath the cheeks instead of a painted flat face.
  ball(colors.mouth,'head',[0,.707,cat?.653:.697],cat?[.046,.012,.011]:[.075,.039,.022]);
  if(!cat) ball('#dc9498','head',[.007,.679,.717],[.034,.035,.014],[.35,0,0]);
  const ring = new T.TorusGeometry(.189,.034,6,24);
  part(ring,colors.collar,'body',[0,.653,.268],[1,1,1],[Math.PI/2+.20,0,0]);
  ball(colors.collar,'body',[0,.560,.424],[.046,.050,.018]);
  for (const [name,x,z] of [['frontL',-.19,.25],['frontR',.19,.25],['backL',-.19,-.32],['backR',.19,-.32]]) {
    ball(colors.coat,name,[x,.254,z-.055],[.102,.218,.115]);
    ball(colors.cream,name,[x,.091,z+.007],[.116,.091,.141]);
    // Toe seams are intentionally omitted: silhouette, not microgeometry.
  }
  if(cat) {
    // Rounded triangular ears, not cones: a bevelled sculpted outer shell.
    for(const side of [-1,1]) {
      const shape=new T.Shape(); shape.moveTo(-.115,0);shape.quadraticCurveTo(-.07,.18,-.016,.30);shape.quadraticCurveTo(0,.333,.025,.299);shape.quadraticCurveTo(.10,.14,.128,0);shape.quadraticCurveTo(0,-.032,-.115,0);
      const xyz=[side*.255,1.085,.275], rot=[-.07,side*-.13,side*-.22];
      const ear=new T.ExtrudeGeometry(shape,{depth:.054,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.032,bevelThickness:.028,curveSegments:5});
      part(ear,colors.coat,side<0?'leftEar':'rightEar',xyz,[1,1,1],rot);
      const inside=new T.ExtrudeGeometry(shape,{depth:.009,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.010,curveSegments:5});
      part(inside,colors.ear,side<0?'leftEar':'rightEar',[xyz[0],xyz[1]+.037,xyz[2]+.091],[.64,.74,1],rot);
    }
    for(const phi of [-.31,0,.31])foreheadPatch(colors.stripe,phi,.064,.26,.76);
    ball(colors.coat,'tail',[0,.719,-.574],[.071,.243,.078],[.43,0,0]);
    ball(colors.coat,'tailTip',[0,.91,-.671],[.075,.195,.077],[-.13,0,0]);
    ball(colors.cream,'tailTip',[0,1.037,-.650],[.078,.090,.078]);
  } else {
    for(const side of [-1,1]) {
      ball(colors.ear,side<0?'leftEar':'rightEar',[side*.365,.873,.287],[.142,.286,.111],[.04,side*-.14,side*.27],20,14);
    }
    foreheadPatch(colors.cream,0,.23,.10,1.08);
    ball(colors.stripe,'body',[.205,.596,-.244],[.074,.129,.142],[.20,0,0]);
    ball(colors.coat,'tail',[0,.698,-.574],[.080,.22,.08],[.55,0,0]);
    ball(colors.cream,'tailTip',[0,.868,-.686],[.080,.129,.08],[-.14,0,0]);
  }
  function foreheadPatch(c,phi,halfWidth,start,end){
    const g=new T.BufferGeometry(),p=[],ix=[];const rows=7,columns=6;
    for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
      const theta=start+(end-start)*j/rows,a=phi+(i/columns*2-1)*halfWidth*Math.sin(Math.PI*(.08+.84*j/rows));
      p.push(.386*Math.sin(theta)*Math.sin(a),.885+.331*Math.cos(theta),.34+.317*Math.sin(theta)*Math.cos(a));
    }
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+columns+1;ix.push(a,b,a+1,b,b+1,a+1);}
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();part(g,c,'head',[0,0,0],[1,1,1]);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  geometry.setIndex(elements);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const bind=bones.map(b=>({name:b.name,parent:b.parent?names[b.parent.name]:-1,position:b.position.toArray()}));
  return {geometry,bind,names,triangles:elements.length/3};
}
function nullRotation(){return [0,0,0];}

export function createPetModels({shadows=true}={}) {
  const templates=new Map(),live=new Set(); let disposed=false;
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.43,metalness:0,envMapIntensity:.5});
  let shadowGeometry,shadowMaterial,shadowTexture;
  if(shadows && globalThis.document){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');
    if(ctx){const gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(61,48,48,.25)');gradient.addColorStop(.50,'rgba(61,48,48,.13)');gradient.addColorStop(1,'rgba(61,48,48,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);shadowTexture=new T.CanvasTexture(canvas);shadowGeometry=new T.PlaneGeometry(1.1,1.35);shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});}
  }
  function create(kind,{scale=.78}={}) {
    if(disposed||!validPet(kind))throw Error('Unknown or disposed pet');
    if(!templates.has(kind))templates.set(kind,buildPet(kind));
    const template=templates.get(kind), root=new T.Group(), rig=new T.Group();
    root.name='67PARK_PET_'+kind.toUpperCase();root.add(rig);rig.scale.setScalar(scale);
    const bones=template.bind.map(row=>{const b=new T.Bone();b.name=row.name;b.position.fromArray(row.position);return b});
    template.bind.forEach((row,i)=>{if(row.parent>=0)bones[row.parent].add(bones[i]);});
    const skeleton=new T.Skeleton(bones), mesh=new T.SkinnedMesh(template.geometry,material);
    mesh.name='pet-sculpt-'+kind;mesh.add(bones[0]);mesh.bind(skeleton);mesh.frustumCulled=false;rig.add(mesh);
    const shadow=shadowMaterial?new T.Mesh(shadowGeometry,shadowMaterial):null;
    if(shadow){shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;root.add(shadow);}
    const named=Object.fromEntries(bones.map(b=>[b.name,b]));
    let phase=0,clock=0,idle=0,pose=0,closed=false,playAge=10;
    const stats={kind,triangles:template.triangles,draws:shadow?2:1,frames:0,speed:0,pose:'idle',distance:0};root.userData.pet=stats;
    function update(dt,{speed=0,distance,reducedMotion=false,sitting=false}={}) {
      if(closed)return;
      dt=clamp(Number.isFinite(dt)?dt:0,0,.05);speed=clamp(Number.isFinite(speed)?speed:0,0,20);clock+=dt;playAge+=dt;
      const moved=Number.isFinite(distance)?Math.max(0,distance):speed*dt;
      phase+=moved/scale*6.5;stats.distance+=moved;idle=speed<.08?idle+dt:0;
      const desiredSit=(sitting||idle>2.2)&&speed<.12?1:0;
      pose+=(desiredSit-pose)*(1-Math.exp(-8*dt));
      const run=clamp(speed/3.8,0,1),swing=clamp(speed/2.5,0,1)*.62;
      for(const [name,offset,back]of [['frontL',0,false],['frontR',Math.PI,false],['backL',Math.PI,true],['backR',0,true]]) {
        const b=named[name];b.rotation.x=Math.sin(phase+offset)*swing*(1-pose)+(back?-1.05:.10)*pose;
        b.position.y=-.10+(back?.055:.082)*pose;
      }
      const bounce=reducedMotion?0:Math.abs(Math.sin(phase))*.033*run;
      const play=playAge<1.2&&!reducedMotion?Math.sin(clamp(playAge/1.2,0,1)*Math.PI):0;
      named.body.position.y=.47-.082*pose+bounce+play*.17;
      named.body.rotation.x=.10*pose-.07*run;
      named.body.rotation.z=reducedMotion?0:Math.sin(phase)*.027*run;
      named.head.rotation.set(-.07*pose+.025*Math.sin(clock*1.3)*(reducedMotion?0:1),Math.sin(clock*.75)*.05*(reducedMotion?0:1),Math.sin(clock*.9)*.03*(reducedMotion?0:1));
      const wag=reducedMotion?.06:(kind==='dog'?.26:.13);
      named.tail.rotation.z=Math.sin(clock*(kind==='dog'?6.5:2.5))*wag*(1+play);
      named.tailTip.rotation.z=Math.sin(clock*(kind==='dog'?6.5:2.5)-.7)*wag*.7;
      named.leftEar.rotation.x=named.rightEar.rotation.x=reducedMotion?0:Math.sin(phase+.7)*run*.12;
      // Blink around the eye centre; no eyelid geometry or per-frame allocations.
      const blink=clock%4.9,eyeScale=blink>4.64&&blink<4.86?Math.max(.09,Math.abs(blink-4.75)/.11):1;
      named.eyes.scale.y=eyeScale;named.eyes.position.y=(1-eyeScale)*.065;
      stats.frames++;stats.speed=speed;stats.pose=play>.05?'play':pose>.5?'sit':speed>.08?'walk':'idle';
    }
    const api={root,rig,mesh,shadow,stats,update,play(){playAge=0},dispose(){if(closed)return;closed=true;root.removeFromParent();skeleton.dispose();live.delete(api);}};
    live.add(api);return api;
  }
  return {create,stats:()=>({templates:templates.size,instances:live.size,geometries:templates.size+(shadowGeometry?1:0),materials:1+(shadowMaterial?1:0),textureBytes:shadowTexture?16384:0,triangles:Object.fromEntries([...templates].map(([k,v])=>[k,v.triangles]))}),dispose(){if(disposed)return;disposed=true;for(const pet of [...live])pet.dispose();for(const row of templates.values())row.geometry.dispose();material.dispose();shadowGeometry?.dispose();shadowMaterial?.dispose();shadowTexture?.dispose();templates.clear();}};
}
