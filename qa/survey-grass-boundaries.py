"""Survey visible live-scene grass contours for short, unintended staircase edges."""
import json, sys
from pathlib import Path
import numpy as np
import shapely
from shapely import Polygon, union_all, set_precision

source=Path(sys.argv[1]); output=Path(sys.argv[2]); output.mkdir(parents=True,exist_ok=True)
data=json.loads(source.read_text()); footprints={}; candidates=[]; summary=[]

def polygons(g):
    if g.is_empty:return []
    if g.geom_type=='Polygon':return [g]
    return [p for child in getattr(g,'geoms',[]) for p in polygons(child)]

for mesh in data['meshes']:
    if not any(any(word in (m[0] or '').upper() for word in ['CIM','GRASS','TURF']) for m in mesh['material']):continue
    p=np.array(mesh['p']).reshape(-1,3); matrix=np.array(mesh['matrix']).reshape(4,4).T
    world=np.einsum('ij,kj->ik',np.column_stack((p,np.ones(len(p)))),matrix)
    assert np.isfinite(world).all(),mesh['name']+' has non-finite world vertices'
    ix=np.array(mesh['ix'] if mesh['ix'] is not None else range(len(p))).reshape(-1,3)
    tris=world[ix,:3]; n=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0])
    top=tris[(n[:,1]>1e-9)&(tris[:,:,1].min(axis=1)>9)]
    if not len(top):continue
    shape=union_all(set_precision(shapely.polygons(top[:,:,[0,2]]),.00001))
    footprints[mesh['name']]=shapely.to_geojson(shape)
    counts=0
    for polyid,poly in enumerate(polygons(shape)):
        for ringid,ring in enumerate([poly.exterior,*poly.interiors]):
            # Remove only sub-millimetre export splits, not visible corners.
            points=np.array(Polygon(ring).simplify(.0005,preserve_topology=True).exterior.coords)[:-1]
            for i in range(len(points)):
                a,b,c,d=[points[(i+j)%len(points)] for j in [-1,0,1,2]]
                edges=[b-a,c-b,d-c]; lengths=[float(np.linalg.norm(e)) for e in edges]
                if min(lengths)<1e-6:continue
                u,v,w=[e/l for e,l in zip(edges,lengths)]
                if .025<lengths[1]<1.5 and min(lengths[0],lengths[2])>.45 and np.dot(u,w)>.94 and abs(np.dot(u,v))<.90:
                    row={'id':len(candidates),'mesh':mesh['name'],'part':polyid,'ring':ringid,'at':((b+c)/2).round(5).tolist(),'points':np.array([a,b,c,d]).round(5).tolist(),'lengths':np.round(lengths,5).tolist()}
                    candidates.append(row);counts+=1
    summary.append({'mesh':mesh['name'],'area':shape.area,'bounds':shape.bounds,'parts':len(polygons(shape)),'steps':counts})
    print(mesh['name'],len(top),'top triangles',len(polygons(shape)),'parts',counts,'step candidates',flush=True)
(output/'footprints.json').write_text(json.dumps(footprints,separators=(',',':')))
(output/'survey.json').write_text(json.dumps({'summary':summary,'candidates':candidates},indent=2))
print(json.dumps({'meshes':len(summary),'steps':len(candidates),'candidates':candidates}),flush=True)
