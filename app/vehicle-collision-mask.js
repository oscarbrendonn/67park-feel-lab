// Compact run-length encoded clearance sampled from the finished island,
// including its actual building/prop, water and trunk collision queries.
// Four corner samples conservatively cover each 25 cm cell. This is collision
// data only; it never changes a mesh, material, texture or ground elevation.
export function createVehicleCollisionMask(data){
 const {x,z,step,cols,rows,runs}=data;
 if(!(step>0)||!Number.isInteger(cols)||!Number.isInteger(rows)||runs.length!==rows||cols*rows>5e6)throw Error('Invalid vehicle clearance data');
 const bits=new Uint8Array(Math.ceil(cols*rows/8));
 for(let r=0;r<rows;r++)for(let k=0;k<runs[r].length;k+=2){const a=runs[r][k],b=runs[r][k+1];if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b>cols||b<a)throw Error('Invalid clearance run');for(let c=a;c<b;c++){const n=r*cols+c;bits[n>>3]|=1<<(n&7);}}
 const at=(c,r)=>{const n=r*cols+c;return (bits[n>>3]&(1<<(n&7)))!==0;};
 return {blocked(px,pz){if(!Number.isFinite(px+pz))return true;const c=Math.floor((px-x)/step),r=Math.floor((pz-z)/step);return c<0||r<0||c>=cols-1||r>=rows-1||at(c,r)||at(c+1,r)||at(c,r+1)||at(c+1,r+1);},stats:{step,cols,rows,bytes:bits.length}};
}
