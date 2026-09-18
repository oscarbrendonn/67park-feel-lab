// Browser-local preferences only. No changes to physics, accounts or saved outfits.
export const SETTINGS_VERSION = 'settings-1';
export const SETTINGS_KEY = '67park.feel-lab.player-settings.v1';
export const DEFAULTS = Object.freeze({mouseSensitivity:1,touchSensitivity:1,desktopButtonSize:1,mobileButtonSize:1,sfx:.8,ambience:1,showChat:true,showNames:true,juice:true,pads:true,haptics:true});
const ranges = {mouseSensitivity:[.25,2],touchSensitivity:[.25,2],desktopButtonSize:[.8,1.2],mobileButtonSize:[.8,1.2],sfx:[0,1],ambience:[0,1]};
export function sanitizeSettings(value) {
 const out={...DEFAULTS};
 if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const key of Object.keys(DEFAULTS)){
  if(ranges[key]){const n=value[key];if(typeof n==='number'&&Number.isFinite(n))out[key]=Math.min(ranges[key][1],Math.max(ranges[key][0],n));}
  else if(typeof value[key]==='boolean')out[key]=value[key];
 }
 return out;
}
const slot=Symbol.for('67park.player-settings.v1');
export const playerSettings=globalThis[slot] ||= (()=>{
 let value;try{value=JSON.parse(localStorage.getItem(SETTINGS_KEY)||localStorage.getItem('67park-party')||'{}')}catch{}
 return sanitizeSettings(value);
})();
export function savePlayerSettings(){
 Object.assign(playerSettings,sanitizeSettings(playerSettings));
 try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(playerSettings))}catch{}
 globalThis.dispatchEvent?.(new Event('park:settings-change'));
}
export function setPlayerSetting(key,value){if(Object.hasOwn(DEFAULTS,key)){playerSettings[key]=value;savePlayerSettings()}}
export function resetPlayerSettings(){Object.assign(playerSettings,DEFAULTS);savePlayerSettings()}
export function settingsOpen(){return !!globalThis.document?.documentElement?.hasAttribute('data-park-settings-open')}
