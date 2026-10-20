(()=>{
  const screen=document.getElementById('launch-screen'),art=document.getElementById('launch-art');
  const began=performance.now();let imageReadyAt=null,appReady=false,mapReady=false,finished=false,timer;
  function check(){
    if(finished||imageReadyAt===null||!appReady)return;
    const now=performance.now(),remaining=Math.max(2000-(now-imageReadyAt),mapReady?0:8000-(now-began));
    clearTimeout(timer);if(remaining>0){timer=setTimeout(check,remaining);return}
    finished=true;document.querySelector('main.app')?.removeAttribute('inert');
    screen.classList.add('launch-done');setTimeout(()=>screen.remove(),260);
  }
  const imageReady=()=>{if(imageReadyAt===null)imageReadyAt=performance.now();check()};
  art.addEventListener('load',imageReady,{once:true});art.addEventListener('error',imageReady,{once:true});
  if(art.complete)imageReady();
  document.addEventListener('travelmapready',()=>{mapReady=true;check()},{once:true});
  document.addEventListener('DOMContentLoaded',()=>{appReady=true;check()},{once:true});
  // A failed image request must not prevent access to saved places.
  setTimeout(()=>{if(imageReadyAt===null)imageReady();check()},8000);
})();
