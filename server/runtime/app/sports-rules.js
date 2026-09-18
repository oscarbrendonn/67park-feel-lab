// Shared dimensions: the authoritative simulation and visible models agree.
export const SPORTS = Object.freeze({
  basket: {id:'basket',title:'Basket Shots',icon:'🏀',description:'Shoot on the Island’s residential court.',ballRadius:.15,target:[0,3.66,-12.72],rimRadius:.30,shots:5,turnSeconds:20,flightSeconds:1.25,
    spectatorSpots:[[-8.7,0,-3],[8.7,0,-3],[-8.7,0,1],[8.7,0,1]],camera:{shot:[3.6,9.4,3.8],mobile:[3.3,10.6,5.3],look:[0,1.9,-8.4],overview:[56,78,79],overviewLook:[-2,1,9.5]}},
  penalty: {id:'penalty',title:'Penalty Club',icon:'⚽',description:'Take penalties in the Island’s oval stadium.',ballRadius:.22,target:[0,1.6,-23.4],goalHalfWidth:3.205,goalHeight:2.725,keeperRange:2.95,shots:5,turnSeconds:20,flightSeconds:.72,
    spectatorSpots:[[-14.3,2.59,-15],[14.3,2.59,-15],[-14.3,2.59,-11],[14.3,2.59,-11]],camera:{shot:[3.8,7.8,-2.8],mobile:[3.3,10.8,.3],look:[0,1.9,-20.2],mobileLook:[0,1.9,-15.6],overview:[47,70,78],overviewLook:[0,1,0]}},
});
export const isSport = mode => Object.hasOwn(SPORTS, mode);
export const chargeAt = seconds => Math.min(1,Math.max(0,seconds/1.2));
export const shotOrigin = (mode,round=0) => mode==='basket'
  ? [[0,1.75,-8.2],[-3,1.75,-8.2],[3,1.75,-8.2],[-5,1.75,-7],[5,1.75,-7]][round%5]
  : [0,.24,-12.4];
export const shotPoints = (mode,round) => mode==='basket'?(round>=3?3:2):1;
export const shotTarget = (mode,aimX,aimY,charge) => mode==='basket'
  ? [0,3.66,-12.72+(charge-.65)*2]
  : [aimX*3.8,.25+(aimY+1)*1.35+(charge-.65)*1.8,-23.4];
export function shotVelocity(origin,target,seconds){
  return [(target[0]-origin[0])/seconds,(target[1]-origin[1]+4.9*seconds**2)/seconds,(target[2]-origin[2])/seconds];
}
export function ballAt(origin,velocity,time){
  return [origin[0]+velocity[0]*time,origin[1]+velocity[1]*time-4.9*time*time,origin[2]+velocity[2]*time];
}
