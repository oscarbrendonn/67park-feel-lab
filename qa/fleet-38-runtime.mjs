// Mechanical splice into the checked-in compiled runtime; originals stay intact.
import fs from 'node:fs';
const file=new URL('../island/runtime.bundle.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
for(const [before,after] of [
 ['e.kind==="car"?__parkCarDetailBody(e):O7(e)','e.kind==="car"?__parkCarDetailBody(e):__fleetBus38(e)'],
 ['m(),r.add(l),l.updateMatrixWorld(!0);let E={version:97','m(),r.add(l),l.updateMatrixWorld(!0);const fleet38=__fleetParked38(l);let E={fleet:fleet38.stats,version:97']
]){if(source.split(before).length!==2)throw Error('Runtime contract changed: '+before);source=source.replace(before,after);}
source='import {styleParkBus as __fleetBus38} from "../app/vehicle-branding.js?v=fleet-38";\nimport {installParkedFleet as __fleetParked38} from "../app/parked-fleet.js?v=fleet-38";\n'+source;
fs.writeFileSync(file,source);
