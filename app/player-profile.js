// A browser-local player, never an IP address. Commit only after successful entry.
const KEY = '67park-feel-lab.player-profile.v1';
export function hasChosenCharacter(base) {
  try { const p=JSON.parse(localStorage.getItem(KEY)); return p?.version===1&&p.base===base; }
  catch { return false; }
}
export function rememberCharacter(base) {
  if(typeof base!=='string'||!base) return false;
  try { localStorage.setItem(KEY,JSON.stringify({version:1,base})); return true; }
  catch { return false; }
}
export function openPlayerStudio(equip,openWardrobe) {
  window.dispatchEvent(new Event('park:release-controls'));
  // Friends retain their own equipped model and working in-game item editor.
  if(equip.base!=='goril') { openWardrobe(true); return; }
  const root=new URL('../',import.meta.url);
  try { sessionStorage.setItem('67park.studio-return.'+root.pathname,location.pathname+location.search); } catch {}
  location.assign(new URL('style-studio/?from=profile&v=5',root));
}
