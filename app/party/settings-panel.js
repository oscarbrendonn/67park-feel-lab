import {playerSettings as settings, setPlayerSetting, resetPlayerSettings, SETTINGS_VERSION} from '../player-settings.js';

export function installPlayerSettings({sfx,isTouch}){
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./settings-panel.css',import.meta.url).href;document.head.append(sheet);
 const gear=document.createElement('button');gear.id='party-settings-btn';gear.type='button';gear.textContent='Settings';gear.setAttribute('aria-label','Party settings');gear.setAttribute('aria-expanded','false');
 gear.hidden=true;
 const panel=document.createElement('div');panel.id='party-settings';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','settings-title');
 const sizeKey=isTouch?'mobileButtonSize':'desktopButtonSize';
 const slider=(key,label,min,max,step,unit='%')=>`<label class="party-setting-row" for="setting-${key}"><span>${label}</span><output data-output="${key}"></output><input id="setting-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}" data-unit="${unit}"></label>`;
 const toggle=(key,label)=>`<div class="party-row"><span>${label}</span><button type="button" class="party-toggle" data-setting="${key}" role="switch" aria-label="${label}"><i></i></button></div>`;
 panel.innerHTML=`<div class="party-card" tabindex="-1"><div class="party-head"><div><small>MAKE IT YOURS</small><h2 id="settings-title">Settings</h2></div><button type="button" class="party-close" aria-label="Close settings">×</button></div>
 <p class="party-intro">Your controls. Your sound. Saved on this browser.</p>
 <section><h3>Camera & controls</h3>${slider('mouseSensitivity','Mouse sensitivity',25,200,5)}${slider('touchSensitivity','Touch sensitivity',25,200,5)}${slider(sizeKey,'Button size',80,120,5)}<p class="party-hint">100% keeps the original feel. Sensitivity applies to free-look cameras; aiming games keep their own controls.</p></section>
 <section><h3>Audio</h3>${slider('sfx','Sound effects',0,100,5)}${slider('ambience','Ambience & park music',0,100,5)}<p class="party-hint" id="settings-muted" hidden>Sound is muted with the speaker button. <button type="button" data-action="unmute">Turn sound on</button></p></section>
 <section><h3>Social</h3>${toggle('showChat','Show chat messages')}${toggle('showNames','Show player names')}<p class="party-hint">Only changes what you see. Other players keep their own preferences.</p></section>
 <section><h3>Party feel</h3>${toggle('juice','Bouncy moves')}${toggle('pads','Jump pads')}${isTouch&&typeof navigator.vibrate==='function'?toggle('haptics','Vibration'):''}</section>
 <section><h3>Help</h3><details><summary>Show controls</summary><div class="party-hint"><strong>On a phone</strong><p>Left joystick: move. Drag an empty area on the right: camera. Use the labelled action buttons.</p><strong>Keyboard & mouse</strong><p>WASD / arrows: move · Space: jump · Shift: sprint · F: punch · E: interact / grab · T: throw · V: skate / walk · B: emotes · Enter: chat. Drag on the game with the left or right mouse button to look around.</p><p>Mini-games show their own relevant actions. Basketball and penalties use aiming instead of free movement.</p></div></details><details><summary>Report a bug</summary><p class="party-hint">Describe the problem, then save or copy the report and send it to the 67Park team with a screenshot. Reports are not sent automatically.</p><label class="party-report-label">What happened?<textarea id="settings-report-description" maxlength="2000" rows="3" placeholder="What did you do? What happened instead?"></textarea></label><label class="party-report-label">Diagnostic details<textarea id="settings-report" readonly rows="4"></textarea></label><div class="party-help-actions"><button type="button" data-action="copy">Copy details</button><button type="button" data-action="download">Save bug report</button></div><p id="settings-report-status" role="status"></p></details><button type="button" class="party-reset" data-action="reset">Restore defaults</button><div id="settings-reset-confirm" hidden><p>Reset these settings? Your character and progress will stay unchanged.</p><button type="button" data-action="confirm-reset">Reset settings</button><button type="button" data-action="cancel-reset">Cancel</button></div></section>
 <div class="party-foot">67Park · ${SETTINGS_VERSION}</div></div>`;
 document.body.append(gear,panel);
 const root=document.documentElement;
 let lastNames;
 const apply=()=>{
  root.dataset.parkShowChat=String(settings.showChat);root.dataset.parkShowNames=String(settings.showNames);
  root.style.setProperty('--park-button-scale',String(settings[sizeKey]));
  // Bot labels are distinct groups; do not hide characters, effects or balloons.
  if(lastNames!==settings.showNames){lastNames=settings.showNames;const scene=window.__eggyScene;scene?.traverse?.(o=>{if(o.userData?.botLabel)o.visible=settings.showNames})}
  for(const el of panel.querySelectorAll('[data-setting]')){
   const key=el.dataset.setting;
   if(el.type==='range'){el.value=String(Math.round(settings[key]*100));panel.querySelector(`[data-output="${key}"]`).textContent=el.value+'%';el.setAttribute('aria-valuetext',el.value+' percent')}
   else el.setAttribute('aria-checked',String(settings[key]));
  }
  let muted=false;try{muted=localStorage.getItem('67park-feel-lab-muted')==='1'}catch{}
  panel.querySelector('#settings-muted').hidden=!muted;
 };
 const reportText=()=>panel.querySelector('#settings-report').value+'\nYour description:\n'+panel.querySelector('#settings-report-description').value;
 const release=()=>window.dispatchEvent(new Event('park:release-controls'));
 const open=value=>{
  if(value&&gear.hidden)return;
  release();panel.hidden=!value;root.toggleAttribute('data-park-settings-open',value);gear.setAttribute('aria-expanded',String(value));
  if(value){apply();report();panel.querySelector('.party-close').focus({preventScroll:true})}else{panel.querySelector('#settings-reset-confirm').hidden=true;gear.focus({preventScroll:true})}
  sfx.ensure();sfx.play('click');
 };
 function report(){
  const text=`67Park ${SETTINGS_VERSION}\nPage: ${location.origin}${location.pathname}\nScreen: ${innerWidth} x ${innerHeight}; DPR: ${devicePixelRatio}\nBrowser: ${navigator.userAgent}\n\nWhat happened:\n\nSteps to reproduce:\n1. \n\nExpected result:\n`;
  panel.querySelector('#settings-report').value=text;
 }
 gear.addEventListener('click',()=>open(panel.hidden));
 panel.querySelector('.party-close').addEventListener('click',()=>open(false));
 panel.addEventListener('click',e=>{if(e.target===panel)open(false)});
 panel.addEventListener('input',e=>{const key=e.target.dataset.setting;if(!key||e.target.type!=='range')return;setPlayerSetting(key,Number(e.target.value)/100);if(key==='sfx'){sfx.ensure();sfx.setVolume(settings.sfx)}});
 panel.addEventListener('change',e=>{if(e.target.dataset.setting==='sfx')sfx.play('jump')});
 panel.addEventListener('click',async e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.matches('[role=switch]')){setPlayerSetting(el.dataset.setting,!settings[el.dataset.setting]);sfx.play('click');return}
  switch(el.dataset.action){
   case 'reset':panel.querySelector('#settings-reset-confirm').hidden=false;panel.querySelector('[data-action=confirm-reset]').focus();break;
   case 'cancel-reset':panel.querySelector('#settings-reset-confirm').hidden=true;panel.querySelector('[data-action=reset]').focus();break;
   case 'confirm-reset':resetPlayerSettings();sfx.setVolume(settings.sfx);panel.querySelector('#settings-reset-confirm').hidden=true;panel.querySelector('[data-action=reset]').focus();break;
   case 'unmute':try{localStorage.setItem('67park-feel-lab-muted','0')}catch{}window.dispatchEvent(new Event('park:audio-mute-change'));sfx.ensure();apply();break;
   case 'download':{const url=URL.createObjectURL(new Blob([reportText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='67park-bug-report.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);panel.querySelector('#settings-report-status').textContent='Report saved. Send it to the 67Park team with your screenshot.';break;}
   case 'copy':try{await navigator.clipboard.writeText(reportText());panel.querySelector('#settings-report-status').textContent='Copied. Paste these details into your report.'}catch{panel.querySelector('#settings-report').select();panel.querySelector('#settings-report-status').textContent='Select and copy the details above.'}break;
  }
 });
 window.addEventListener('park:settings-change',apply);
 // Capture before gameplay listeners. Default range, text selection and keyboard
 // activation still work; gameplay never receives dialog keys or held inputs.
 window.addEventListener('keydown',e=>{
  if(panel.hidden)return;
  if(e.key==='Escape'){e.preventDefault();open(false)}
  else if(e.key==='Tab'){
   const items=[...panel.querySelectorAll('button,input,a[href],textarea,summary')].filter(n=>!n.disabled&&n.getClientRects().length);
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
  e.stopImmediatePropagation();
 },true);
 window.addEventListener('keyup',e=>{if(!panel.hidden)e.stopImmediatePropagation()},true);
 apply();
 const setAvailable=value=>{
  gear.hidden=!value;
  if(!value&&!panel.hidden){release();panel.hidden=true;root.removeAttribute('data-park-settings-open');gear.setAttribute('aria-expanded','false');}
 };
 return {open,apply,setAvailable};
}
