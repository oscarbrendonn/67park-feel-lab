// Optional Claude locomotion presentation metadata. Never movement authority.
// v1: [version, flags, speed, verticalVelocity, sprint, jumpSeq, landSeq, jumpKind, impact].
// Invalid optional metadata is ignored without rejecting the legacy position packet.
export function sanitizeClaudeMotion(value) {
  if (!Array.isArray(value) || value.length !== 9 || value[0] !== 1) return null;
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if (!integer(value[1],0,31) || !finite(value[2],0,12.5) ||
      !finite(value[3],-60,20) || !finite(value[4],0,1) ||
      !integer(value[5],0,65535) || !integer(value[6],0,65535) ||
      !integer(value[7],0,2) || !finite(value[8],0,60)) return null;
  return value.map((v,i)=>i===2||i===3||i===4||i===8 ? Math.round(v*100)/100 : v);
}
