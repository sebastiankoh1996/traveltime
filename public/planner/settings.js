const SETTINGS_KEY='travel-time-settings';
let travelPrefs={night:false,navigation:'amap',showAmap:true};
try{const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(saved){travelPrefs.night=saved.night===true;travelPrefs.showAmap=saved.showAmap!==false;if(['amap','google','apple'].includes(saved.navigation))travelPrefs.navigation=saved.navigation}}catch{}
document.documentElement.dataset.theme=travelPrefs.night?'night':'day';
function applyAmapVisibility(){document.documentElement.dataset.showAmap=String(travelPrefs.showAmap)}
applyAmapVisibility();
function navigationAppName(){return {amap:'AMap',google:'Google Maps',apple:'Apple Maps'}[travelPrefs.navigation]}
function navigationURL(p){
  // Saved preview pins are WGS84; only AMap receives GCJ-02 coordinates.
  if(travelPrefs.navigation==='google')return 'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',destination:`${p.lat.toFixed(6)},${p.lng.toFixed(6)}`,travelmode:'walking'});
  if(travelPrefs.navigation==='apple')return 'https://maps.apple.com/?'+new URLSearchParams({daddr:`${p.lat.toFixed(6)},${p.lng.toFixed(6)}`,dirflg:'w'});
  return amapNavigationURL(p);
}
document.addEventListener('DOMContentLoaded',()=>{
  const settings=document.createElement('dialog');settings.id='settingsdialog';settings.setAttribute('aria-labelledby','settingstitle');
  settings.innerHTML=`<button type="button" class="close" aria-label="Close settings">×</button><h2 id="settingstitle">Settings</h2><div class="settings-row"><label for="nightmode">Night mode<small>A softer map after dark</small></label><input id="nightmode" class="night-switch" type="checkbox" role="switch"></div><div class="settings-row"><label for="showamap">Show Paste AMap link<small>Display the shortcut in your saved places</small></label><input id="showamap" class="night-switch" type="checkbox" role="switch"></div><fieldset class="navigation-settings"><legend>Default navigation app</legend><p class="hint">Open directions in your preferred app.</p>${['amap','google','apple'].map(value=>`<label class="navigation-choice"><span>${{amap:'AMap · 高德地图',google:'Google Maps',apple:'Apple Maps'}[value]}</span><input type="radio" name="navigationapp" value="${value}"></label>`).join('')}</fieldset><p class="hint">Preferences are saved on this device.</p>`;
  document.body.append(settings);const button=document.createElement('button');button.type='button';button.className='settings-entry';button.textContent='Settings';
  $('toolsdialog').querySelector('.utility').before(button);const backupButton=document.createElement('button');backupButton.type='button';backupButton.className='settings-entry';backupButton.textContent='Keep a copy';button.after(backupButton);backupButton.onclick=()=>{$('toolsdialog').close();$('backupdialog').showModal()};$('closebackup').onclick=()=>$('backupdialog').close();$('export').addEventListener('click',()=>$('backupdialog').close());$('importfile').addEventListener('change',()=>$('backupdialog').close());
  button.onclick=()=>{$('toolsdialog').close();settings.showModal()};settings.querySelector('.close').onclick=()=>settings.close();
  $('nightmode').checked=travelPrefs.night;$('showamap').checked=travelPrefs.showAmap;settings.querySelector(`[name="navigationapp"][value="${travelPrefs.navigation}"]`).checked=true;
  settings.addEventListener('change',()=>{
    const changedNight=travelPrefs.night!==$('nightmode').checked;travelPrefs.night=$('nightmode').checked;travelPrefs.navigation=settings.querySelector('[name="navigationapp"]:checked').value;
    document.documentElement.dataset.theme=travelPrefs.night?'night':'day';travelPrefs.showAmap=$('showamap').checked;applyAmapVisibility();
    try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(travelPrefs))}catch{toast('Could not save settings on this device')}
    if(changedNight)document.dispatchEvent(new Event('appearancechange'));
    const p=state.places.find(p=>p.id===selected);if(p){const nav=$('navigate');nav.href=navigationURL(p);nav.innerHTML=uiSymbol('arrow')+'<span>Navigate in '+navigationAppName()+'</span>';nav.setAttribute('aria-label','Navigate to this place in '+navigationAppName())}
  });
});
