function addBasemap(target){
  let vector,ready=false,fallbackUsed=false;
  const fallback=()=>{
    if(fallbackUsed)return;fallbackUsed=true;
    if(vector&&target.hasLayer(vector))target.removeLayer(vector);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(target);
  };
  try{
    if(typeof L.maplibreGL!=='function'||typeof maplibregl==='undefined'){fallback();return}
    vector=L.maplibreGL({style:new URL('basemap.json',location.href).href,interactive:false,attributionControl:false,pane:'tilePane'}).addTo(target);
    const attribution='<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a> · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    target.attributionControl.addAttribution(attribution);
    const gl=vector.getMaplibreMap();
    gl.once('load',()=>{ready=true;requestAnimationFrame(()=>target.fire('basemapready'))});
    gl.on('error',()=>{if(!ready)fallback()});
    target.once('unload',()=>{ready=true});
  }catch{fallback()}
}
