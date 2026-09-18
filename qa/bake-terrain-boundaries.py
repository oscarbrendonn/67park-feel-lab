"""Bake bounded, shared-edge repairs from an exported live scene (not a GLB guess)."""
import json, sys, zlib
from pathlib import Path
import numpy as np
from shapely import Polygon, union_all, set_precision, constrained_delaunay_triangles
from shapely.geometry import box, Point
from shapely.geometry.polygon import orient

source=Path(sys.argv[1]); out=Path(sys.argv[2])
meshes={m['name']:m for m in json.loads(source.read_text())['meshes']}
world={}; tris={}; footprints={}
def polygons(g):
    if g.is_empty:return []
    if g.geom_type=='Polygon':return [g]
    return [p for child in getattr(g,'geoms',[]) for p in polygons(child)]
for name,m in meshes.items():
    p=np.array(m['p']).reshape(-1,3);mat=np.array(m['matrix']).reshape(4,4).T
    p=np.einsum('ij,kj->ik',np.column_stack((p,np.ones(len(p)))),mat)[:,:3]
    world[name]=p
    ix=np.array(m['ix'] if m['ix']is not None else range(len(p))).reshape(-1,3)
    t=p[ix];tris[name]=t;n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])
    ok=(n[:,1]>1e-9)&(t[:,:,1].min(axis=1)>9.0)
    footprints[name]=union_all([set_precision(Polygon(v[:,[0,2]]),.00001)for v in t[ok]])

rows={}
def row_for(name):
    if name not in rows:
        m=meshes[name]
        rows[name]={'name':name,'expected':{'vertices':len(m['p'])//3,'indices':len(m['ix']),'positionCRC':f'{zlib.crc32(np.array(m["p"],dtype="<f4").tobytes()):08x}'},'remove':[],'p':[],'n':[],'ix':[]}
    return rows[name]
def triangle(row,v,normal=None):
    v=np.array(v);n=np.cross(v[1]-v[0],v[2]-v[0]);length=np.linalg.norm(n)
    if length<1e-10:return
    n=n/length if normal is None else normal
    start=len(row['p'])//3
    row['p'].extend(np.round(v,7).flatten().tolist());row['n'].extend(np.tile(n,(3,1)).flatten().tolist());row['ix'].extend([start,start+1,start+2])
def flat(row,g,y,up=True):
    for poly in polygons(g):
        for face in constrained_delaunay_triangles(poly).geoms:
            v=[[x,y,z] for x,z in list(face.exterior.coords)[:3]]
            if np.cross(np.subtract(v[1],v[0]),np.subtract(v[2],v[0]))[1]*(1 if up else -1)<0:v.reverse()
            triangle(row,v)
def solid(row,g,top,bottom):
    flat(row,g,top);flat(row,g,bottom,False)
    for poly in polygons(g):
        poly=orient(poly,sign=1)
        for ring in [poly.exterior,*poly.interiors]:
            for (x,z),(a,b)in zip(ring.coords,list(ring.coords)[1:]):
                triangle(row,[[x,top,z],[a,bottom,b],[a,top,b]])
                triangle(row,[[x,top,z],[x,bottom,z],[a,bottom,b]])
def clip_out(row,region):
    bounds=region.bounds
    for i,v in enumerate(tris[row['name']]):
        xz=v[:,[0,2]]
        if xz[:,0].max()<bounds[0]or xz[:,0].min()>bounds[2]or xz[:,1].max()<bounds[1]or xz[:,1].min()>bounds[3]:continue
        poly=Polygon(xz)
        if poly.area<1e-10:
            from shapely.geometry import LineString
            if region.covers(LineString(xz)):row['remove'].append(i*3)
            continue
        remain=poly.difference(region)
        if poly.area-remain.area<1e-10:continue
        row['remove'].append(i*3)
        if remain.is_empty:continue
        coeff=np.linalg.solve(np.column_stack([xz,np.ones(3)]),v[:,1]);n=np.cross(v[1]-v[0],v[2]-v[0]);n/=np.linalg.norm(n)
        for p in polygons(remain):
            for f in constrained_delaunay_triangles(p).geoms:
                verts=[[x,float(np.clip(coeff@[x,z,1],v[:,1].min(),v[:,1].max())),z]for x,z in list(f.exterior.coords)[:3]]
                if np.dot(np.cross(np.subtract(verts[1],verts[0]),np.subtract(verts[2],verts[0])),n)<0:verts.reverse()
                triangle(row,verts,n)

# Central grey panels were inset farther than the road cutouts: four long
# 10 cm slots plus four circular slots were missed by the old <3 m² gap scan.
cover=union_all([g for n,g in footprints.items()if not n.startswith('4_')])
holes=[Polygon(ring)for poly in polygons(cover)for ring in poly.interiors]
panels=union_all([g for n,g in footprints.items()if n.startswith('CENTER_WHITE71_')])
bx,bz,ex,ez=panels.bounds
# v71 deliberately inset the four slabs 0.5 m from the original plaza carrier.
# The road was already cut to that carrier. Include its complete original
# rectangle, not only enclosed holes: the long slots run out to this perimeter.
central_domain=box(bx-.5,bz-.5,ex+.5,ez+.5)
central_gaps=polygons(central_domain.difference(cover))
central=[]
for name in [n for n in meshes if n.startswith('CENTER_WHITE71_')]:
    existing=footprints[name]
    gap=union_all([p for p in central_gaps if .00001<p.area<100 and p.distance(existing)<.00003])
    gap=union_all([p for p in polygons(gap)if p.area>1e-5])
    row=row_for(name);row['lowerBaseTo']=8.79
    solid(row,gap,9.29,8.79)
    central.append({'name':name,'area':gap.area,'bounds':gap.bounds})

# The fountain export leaves an actual circular hole in the road. Close the
# underlying road too, so an oblique view cannot see below the rounded plinth.
cx,cz=49.3719545,-32.327407
fountain_holes=[Polygon(ring)for poly in polygons(footprints['5_YOL'])for ring in poly.interiors if Polygon(ring).covers(Point(cx,cz))]
assert len(fountain_holes)==1 and 100<fountain_holes[0].area<120
solid(row_for('5_YOL'),fountain_holes[0],9.22754747,8.79)
transforms=[]
base_y=world['67D_CENTER_FOUNTAIN_PLINTH'][:,1].min()
for name in ['67D_CENTER_FOUNTAIN_PLINTH','67D_CENTER_FOUNTAIN_RIM','67D_CENTER_FOUNTAIN_BASIN']:
    m=meshes[name]
    transforms.append({'name':name,'expected':{'vertices':len(m['p'])//3,'indices':len(m['ix']),'positionCRC':f'{zlib.crc32(np.array(m["p"],dtype="<f4").tobytes()):08x}'},'center':[cx,cz],'scaleXZ':1.06,'dy':9.21754747-base_y})

# Replace the park's notched path boundary, then reconstruct the grass on the
# very same curve. Entrances, pond, skate bowl and coast are protected.
old_path=footprints['8_PARK_PATIKA_UST']
region=box(119.5,28.0,210,111.5)
rounded=old_path.buffer(1.4,quad_segs=16).buffer(-1.4,quad_segs=16)
rounded=rounded.buffer(-.8,quad_segs=16).buffer(.8,quad_segs=16).simplify(.006,preserve_topology=True)
water_row=next(r for r in json.loads((Path(__file__).parent.parent/'repairs/map-continuity-59.json').read_text())['meshes']if r['name']=='67D_PARK_WATER_UNIFIED_V65')
water_p=np.array(water_row['p']).reshape(-1,3);water_t=water_p[np.array(water_row['ix']).reshape(-1,3)]
water=union_all([Polygon(t[:,[0,2]])for t in water_t])
bowl=union_all([g for n,g in footprints.items()if n.startswith('67D_REF_MINI_SKATE')])
protected=water.buffer(.22,quad_segs=12).union(bowl.buffer(.12,quad_segs=12)).difference(old_path)
new_path=set_precision(rounded.intersection(region).union(old_path.difference(region)).difference(protected),.00001)
added=new_path.difference(old_path);removed=old_path.difference(new_path)
grass=footprints['3_CIMEN']
# Include the old path volume in the domain: a removed path corner must become
# grass, never expose the sand underlay. Re-cut only the park, not all the map.
new_grass=set_precision(grass.union(old_path),.00001).difference(new_path).intersection(region)
assert new_path.intersection(water).area<1e-6,'Path crosses pond'
assert new_path.difference(old_path).intersection(bowl).area<1e-6,'Path expands into bowl'
row=row_for('8_PARK_PATIKA_UST');row['remove']=list(range(0,len(meshes[row['name']]['ix']),3));solid(row,new_path,9.4787867,9.22755)
row=row_for('3_CIMEN');clip_out(row,region);solid(row,new_grass,9.39803127,8.79)

# A second whole-map survey includes curb faces as well as the slabs; each
# candidate is confirmed against a downward ray in the running scene. This
# finds open 20 cm road corners, not just the old scan's enclosed tiny seams.
survey=json.loads((Path(__file__).parent/'terrain-gap-survey-2.json').read_text())
confirmed=[]
for gap in survey['gaps']:
    p=Polygon(gap['outline']).difference(water.buffer(.02))
    near=gap['near']
    if '5_YOL'in near:name,top='5_YOL',9.22754747
    elif '5_PARSEL_ZEMIN'in near:name,top='5_PARSEL_ZEMIN',9.22754747
    elif '3_CIMEN'in near:name,top='3_CIMEN',9.39803127
    elif '7_DOGU_SAHIL_MEYDAN_APRON'in near:name,top='7_DOGU_SAHIL_MEYDAN_APRON',9.2185
    else:name,top='6_BORDUR',9.38008564
    if p.is_empty:continue
    # The same 0.1 mm buried overlap as the earlier seam repair protects the
    # shared edge against Float32 export rounding at distant map coordinates.
    p=p.buffer(.0001,quad_segs=2)
    solid(row_for(name),p,top-.0002,8.79)
    confirmed.append({'target':name,'at':gap['at'],'area':p.area,'top':top-.0002})

for row in rows.values():
    positions=[];normals=[];indices=[];unique={}
    for old in row['ix']:
        p=row['p'][old*3:old*3+3];n=[round(v,7)for v in row['n'][old*3:old*3+3]];key=tuple(p+n)
        if key not in unique:unique[key]=len(positions)//3;positions.extend(p);normals.extend(n)
        indices.append(unique[key])
    row['p']=positions;row['n']=normals;row['ix']=indices

metrics={'centralSlots':central,'centralFilledArea':sum(r['area']for r in central),'pathAddedArea':added.area,'pathRemovedArea':removed.area,'pathAreaBefore':old_path.area,'pathAreaAfter':new_path.area,'pathBoundaryShift':old_path.boundary.hausdorff_distance(new_path.boundary),'pathGrassOverlap':new_grass.intersection(new_path).area,'addedDrawCalls':0,'addedMeshes':0,'parkScope':list(region.bounds)}
metrics['pathPondOverlap']=new_path.intersection(water).area
metrics['pathBowlOverlap']=new_path.intersection(bowl).area
metrics['pathBowlAddedOverlap']=new_path.difference(old_path).intersection(bowl).area
metrics['pathChangeRegions']=[{'area':p.area,'bounds':p.bounds}for p in polygons(added)if p.area>.02]
metrics['fountainRoadFilledArea']=fountain_holes[0].area
metrics['fountainScaleXZ']=1.06
metrics['fountainBaseY']=9.21754747
metrics['centralDomain']=list(central_domain.bounds)
metrics['extraSeams']=confirmed
metrics['extraSeamArea']=sum(r['area']for r in confirmed)
patch={'version':2,'metrics':metrics,'meshes':list(rows.values()),'transforms':transforms}
out.write_text(json.dumps(patch,separators=(',',':')))
print(json.dumps(metrics),flush=True)
print([(r['name'],len(r['remove']),len(r['ix'])//3)for r in rows.values()],flush=True)
