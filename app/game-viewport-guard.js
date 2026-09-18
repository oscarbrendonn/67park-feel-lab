// Gameplay owns multi-touch, not the browser's page magnifier. Keep Pointer
// Events flowing to the joystick, action buttons and custom overhead-map zoom.
export function installGameViewportGuard(doc = document, win = window) {
 const surfaces = 'canvas,.park-stick,.park-action,#preview-hit,.park-toolbar,.park-weather,#hawk-map-navigation,.park-chat>button,.online-toggle,.sp-controls,.rr-controls,.cr-pad,.cr-tools,.cr-jump,#touch-ui';
 const excluded = 'input:not([type="range"]),textarea,select,[contenteditable],.wardrobe,[role="dialog"],.online-dialog,.park-inventory-panel,.claude-emote-panel';
 const editable = node => !!node?.closest?.('input:not([type="range"]),textarea,select,[contenteditable]');
 const playing = () => (!!doc.querySelector('.park-hud') || !!doc.querySelector('.sp-controls,.rr-controls,.cr-pad,#touch-ui')) && !doc.querySelector('.wardrobe') && !editable(doc.activeElement);
 const gameTarget = node => !!node?.closest?.(surfaces) && !node.closest(excluded);
 let owned = false;
 const prevent = event => { if (event.cancelable) event.preventDefault(); };
 const touch = event => {
  if (!playing()) { owned = false; return; }
  // Touch.target is its original target even after a finger slides off a button.
  owned = Array.from(event.touches || []).some(t => gameTarget(t.target));
  if (owned && event.touches.length > 1) prevent(event);
 };
 const gesture = event => {
  if (playing() && (owned || gameTarget(event.target))) prevent(event);
 };
 const finish = event => {
  owned = playing() && Array.from(event.touches || []).some(t => gameTarget(t.target));
 };
 const reset = () => { owned = false; };
 const options = {capture:true, passive:false};
 for (const type of ['touchstart','touchmove']) doc.addEventListener(type,touch,options);
 for (const type of ['gesturestart','gesturechange']) doc.addEventListener(type,gesture,options);
 for (const type of ['touchend','touchcancel']) doc.addEventListener(type,finish,true);
 for (const type of ['blur','pagehide']) win.addEventListener(type,reset);
 doc.addEventListener('visibilitychange',reset);
 return () => {
  for (const type of ['touchstart','touchmove']) doc.removeEventListener(type,touch,true);
  for (const type of ['gesturestart','gesturechange']) doc.removeEventListener(type,gesture,true);
  for (const type of ['touchend','touchcancel']) doc.removeEventListener(type,finish,true);
  for (const type of ['blur','pagehide']) win.removeEventListener(type,reset);
  doc.removeEventListener('visibilitychange',reset);
  reset();
 };
}
if (typeof document !== 'undefined') installGameViewportGuard();
