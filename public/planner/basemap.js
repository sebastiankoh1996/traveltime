function addBasemap(target){
  let vector,ready=false,fallbackUsed=false;
  const fallback=()=>{
    if(fallbackUsed)return;fallbackUsed=true;
    if(vector&&target.hasLayer(vector))target.removeLayer(vector);
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(target);tiles.once('load',()=>{if(target.getContainer().id==='map')document.dispatchEvent(new Event('travelmapready'))});
  };
  try{
    if(typeof L.maplibreGL!=='function'||typeof maplibregl==='undefined'){fallback();return}
    vector=L.maplibreGL({style:new URL(travelPrefs.night?'basemap-night.json':'basemap.json',location.href).href,interactive:false,attributionControl:false,pane:'tilePane'}).addTo(target);
    const attribution='<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a> · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    target.attributionControl.addAttribution(attribution);
    const gl=vector.getMaplibreMap();const appearance=()=>gl.setStyle(new URL(travelPrefs.night?'basemap-night.json':'basemap.json',location.href).href);document.addEventListener('appearancechange',appearance);target.once('unload',()=>document.removeEventListener('appearancechange',appearance));
    gl.once('load',()=>{ready=true;if(target.getContainer().id==='map')document.dispatchEvent(new Event('travelmapready'));requestAnimationFrame(()=>target.fire('basemapready'))});
    gl.on('error',()=>{if(!ready)fallback()});
    target.once('unload',()=>{ready=true});
  }catch{fallback()}
}

// Keep provider attribution accessible without a permanent strip across the map.
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.leaflet-control-attribution').forEach(control=>{
    const disclosure=document.createElement('details');disclosure.className='map-credits leaflet-control';
    const summary=document.createElement('summary');summary.textContent='ⓘ';summary.setAttribute('aria-label','Map credits');summary.title='Map credits';
    control.parentNode.insertBefore(disclosure,control);disclosure.append(summary,control);
    L.DomEvent.disableClickPropagation(disclosure);L.DomEvent.disableScrollPropagation(disclosure);
  });
});
