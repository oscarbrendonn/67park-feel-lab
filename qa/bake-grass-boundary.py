"""Bake a shared grass/pavement contour; never cover a crack with a floating decal."""
import json, sys, zlib
from pathlib import Path
import numpy as np
import shapely
from shapely import Polygon, union_all, set_precision, constrained_delaunay_triangles
from shapely.geometry import LineString, box
from shapely.geometry.polygon import orient

source=Path(sys.argv[1]); survey_dir=Path(sys.argv[2]); output=Path(sys.argv[3])
meshes={m['name']:m for m in json.loads(source.read_text())['meshes']}
survey=json.loads((survey_dir/'survey.json').read_text())
shapes={n:shapely.from_geojson(g) for n,g in json.loads((survey_dir/'footprints.json').read_text()).items()}

def polygons(g):
    if g.is_empty:return []
    if g.geom_type=='Polygon':return [g]
    return [p for c in getattr(g,'geoms',[]) for p in polygons(c)]

grass=set_precision(shapes['3_CIMEN'],.000001); candidates=survey['candidates']
assert len(candidates)==2 and all(r['mesh']=='3_CIMEN' and 220<r['at'][0]<240 and 128<r['at'][1]<132 for r in candidates)
parts=polygons(grass); part=next(p for p in parts if p.distance(shapely.Point(*candidates[0]['at']))<.001)
assert all(r['part']==candidates[0]['part'] and r['ring']==0 for r in candidates)
remove=sum([r['points'][1:3] for r in candidates],[])
points=[v for v in np.array(part.exterior.coords)[:-1] if not any(np.linalg.norm(v-r)<.002 for r in remove)]
fixed=set_precision(Polygon(points,[list(r.coords) for r in part.interiors]),.000001); assert fixed.is_valid
new_grass=union_all([fixed if p.equals(part) else p for p in parts])
added=new_grass.difference(grass); removed=grass.difference(new_grass)
assert added.area<.5 and removed.area<1
# Keep a small shared collar, so the old vertical step faces are removed too.
changed=set_precision(added.union(removed).buffer(.012,quad_segs=2),.00001)
world={}; tris={}; footprints={}; rows=[]
for name in ['3_CIMEN','7_KALDIRIM_TABANI']:
    m=meshes[name]; p=np.array(m['p']).reshape(-1,3); mat=np.array(m['matrix']).reshape(4,4).T
    w=np.einsum('ij,kj->ik',np.column_stack((p,np.ones(len(p)))),mat)[:,:3]
    t=w[np.array(m['ix']).reshape(-1,3)]; world[name]=w; tris[name]=t
    n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]); top=t[(n[:,1]>1e-9)&(t[:,:,1].min(axis=1)>9)]
    footprints[name]=union_all(set_precision(shapely.polygons(top[:,:,[0,2]]),.000001))

def triangle(row,v,normal=None):
    v=np.array(v); n=np.cross(v[1]-v[0],v[2]-v[0]); length=np.linalg.norm(n)
    if length<1e-11:return
    n=n/length if normal is None else normal
    start=len(row['p'])//3
    row['p'].extend(np.round(v,8).flatten().tolist()); row['n'].extend(np.tile(n,(3,1)).flatten().tolist()); row['ix'].extend([start,start+1,start+2])

def flat(row,g,y,up=True):
    for p in polygons(g):
        for f in constrained_delaunay_triangles(p).geoms:
            v=[[x,y,z] for x,z in list(f.exterior.coords)[:3]]
            if np.cross(np.subtract(v[1],v[0]),np.subtract(v[2],v[0]))[1]*(1 if up else -1)<0:v.reverse()
            triangle(row,v)

def solid(row,g,top,bottom):
    flat(row,g,top); flat(row,g,bottom,False)
    for p in polygons(g):
        p=orient(p,sign=1)
        for ring in [p.exterior,*p.interiors]:
            for (x,z),(a,b) in zip(ring.coords,list(ring.coords)[1:]):
                triangle(row,[[x,top,z],[a,bottom,b],[a,top,b]])
                triangle(row,[[x,top,z],[x,bottom,z],[a,bottom,b]])

def clip_out(row):
    bounds=changed.bounds
    for i,v in enumerate(tris[row['name']]):
        xz=v[:,[0,2]]
        if xz[:,0].max()<bounds[0] or xz[:,0].min()>bounds[2] or xz[:,1].max()<bounds[1] or xz[:,1].min()>bounds[3]:continue
        poly=Polygon(xz); n=np.cross(v[1]-v[0],v[2]-v[0]); length=np.linalg.norm(n)
        if length<1e-12:continue
        n/=length
        if poly.area<1e-10:
            # A vertical face has a line footprint. Clip it in distance/height
            # space too; keeping partial old side faces leaves dark tooth marks.
            pair=max(((a,b) for a in range(3) for b in range(a+1,3)),key=lambda ab:np.linalg.norm(xz[ab[1]]-xz[ab[0]]))
            origin=xz[pair[0]]; axis=xz[pair[1]]-origin; total=np.linalg.norm(axis)
            if total<1e-9:continue
            axis/=total; line=LineString([origin,origin+axis*total]); remain=line.difference(changed)
            if abs(remain.length-total)<1e-9:continue
            row['remove'].append(i*3)
            segments=[remain] if remain.geom_type=='LineString' else list(getattr(remain,'geoms',[]))
            face=Polygon([[(q-origin)@axis,y] for q,y in zip(xz,v[:,1])])
            for segment in segments:
                if segment.geom_type!='LineString' or segment.length<1e-8:continue
                ts=[(np.array(q)-origin)@axis for q in segment.coords]
                for p in polygons(face.intersection(box(min(ts),v[:,1].min()-1,max(ts),v[:,1].max()+1))):
                    for f in constrained_delaunay_triangles(p).geoms:
                        verts=[[*(origin+axis*t)[:1],y,(origin+axis*t)[1]] for t,y in list(f.exterior.coords)[:3]]
                        if np.dot(np.cross(np.subtract(verts[1],verts[0]),np.subtract(verts[2],verts[0])),n)<0:verts.reverse()
                        triangle(row,verts,n)
            continue
        remain=poly.difference(changed)
        if poly.area-remain.area<1e-11:continue
        row['remove'].append(i*3)
        if remain.is_empty:continue
        coeff=np.linalg.solve(np.column_stack([xz,np.ones(3)]),v[:,1])
        for p in polygons(remain):
            for f in constrained_delaunay_triangles(p).geoms:
                verts=[[x,float(np.clip(np.dot(coeff,[x,z,1]),v[:,1].min(),v[:,1].max())),z] for x,z in list(f.exterior.coords)[:3]]
                if np.dot(np.cross(np.subtract(verts[1],verts[0]),np.subtract(verts[2],verts[0])),n)<0:verts.reverse()
                triangle(row,verts,n)

new_paving=footprints['7_KALDIRIM_TABANI'].union(grass).difference(new_grass)
for name,shape,top in [('3_CIMEN',new_grass,9.39803127),('7_KALDIRIM_TABANI',new_paving,9.38008976)]:
    m=meshes[name]
    row={'name':name,'expected':{'vertices':len(m['p'])//3,'indices':len(m['ix']),'positionCRC':f'{zlib.crc32(np.array(m["p"],dtype="<f4").tobytes()):08x}'},'remove':[],'p':[],'n':[],'ix':[]}
    clip_out(row); solid(row,set_precision(shape.intersection(changed),.00001),top,8.79)
    if name=='7_KALDIRIM_TABANI':
        # Float32 subdivision of a long old triangle can create a <20 µm
        # T-junction along its untouched neighbour. Retain that exact old
        # triangle as a buried 2 mm support, below both visible surfaces.
        # This is the same pavement material, not a coplanar overlay/decal.
        for offset in row['remove']:
            v=tris[name][offset//3].copy(); n=np.cross(v[1]-v[0],v[2]-v[0])
            if n[1]>1e-9 and v[:,1].min()>9.35:
                v[:,1]-=.002; triangle(row,v,n/np.linalg.norm(n))
    unique={}; p=[]; n=[]; ix=[]
    for j in row['ix']:
        a=row['p'][j*3:j*3+3]; b=[round(v,7) for v in row['n'][j*3:j*3+3]]; key=tuple(a+b)
        if key not in unique:unique[key]=len(p)//3;p.extend(a);n.extend(b)
        ix.append(unique[key])
    row.update(p=p,n=n,ix=ix); rows.append(row)
filled=new_paving.union(new_grass)
coverage=grass.union(footprints['7_KALDIRIM_TABANI']).intersection(changed)
metrics={'surveyedMeshes':len(survey['summary']),'surveyedParts':sum(r['parts'] for r in survey['summary']),
 'repairedSteps':len(candidates),'grassAddedArea':added.area,'grassRemovedArea':removed.area,
 'uncoveredArea':coverage.difference(filled).area,'grassPavementOverlap':new_paving.intersection(new_grass).intersection(changed).area,
 'bounds':changed.bounds,'addedDrawCalls':0,'addedMaterials':0,'perFrameWork':0,
 'triangleDelta':sum(len(r['ix'])//3-len(r['remove']) for r in rows)}
print(json.dumps(metrics),flush=True)
assert metrics['uncoveredArea']<1e-8 and metrics['grassPavementOverlap']<1e-8
patch={'version':1,'metrics':metrics,'sites':candidates,'meshes':rows}
output.write_text(json.dumps(patch,separators=(',',':')))
print(json.dumps(metrics)); print([(r['name'],len(r['remove']),len(r['ix'])//3) for r in rows])
