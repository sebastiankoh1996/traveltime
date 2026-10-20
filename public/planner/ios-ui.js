const UI_PATHS={map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',plus:'<path d="M12 5v14M5 12h14"/>',link:'<path d="m10 13 4-4m-6 6-1.5 1.5a4 4 0 0 1-5.7-5.7L6 6.6a4 4 0 0 1 5.7 0m.6 10.8a4 4 0 0 0 5.7 0l4.2-4.2a4 4 0 0 0-5.7-5.7L15 9"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',fit:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',chevron:'<path d="m9 5 7 7-7 7"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',food:'<path d="M5 3v7m3-7v7M3 3v5a3 3 0 0 0 6 0V3M6 11v10m11-18c-4 4-4 9 0 9h2M19 3v18"/>',coffee:'<path d="M4 8h12v7a6 6 0 0 1-12 0V8Zm12 0h2a3 3 0 0 1 0 6h-2M7 3v2m5-2v2M2 21h17"/>',stay:'<path d="M3 18V6m18 12V9H8v7H3m0 0h18M3 21v-3m18 3v-3"/><circle cx="6" cy="11" r="2"/>',culture:'<path d="m3 8 9-5 9 5H3Zm0 13h18M5 10v8m7-8v8m7-8v8"/>',shop:'<path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',leaf:'<path d="M20 3C7 2 2 10 6 16s14 4 14-13Z"/><path d="M3 21 16 8"/>',camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3V7Z"/><circle cx="12" cy="13" r="4"/>',star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',train:'<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M8 21l2-3m6 3-2-3M9 14h.01M15 14h.01"/>',arrow:'<path d="m12 3 8 17-8-4-8 4 8-17Z"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>'};
function uiSymbol(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI_PATHS[name]||UI_PATHS.pin}</svg>`}
function symbolMarkup(emoji){return uiSymbol(({'📍':'pin','🍜':'food','☕':'coffee','🏨':'stay','🏛':'culture','🛍':'shop','🌿':'leaf','📷':'camera','⭐':'star','🚉':'train'})[emoji]||'pin')}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-symbol]').forEach(e=>e.innerHTML=uiSymbol(e.dataset.symbol));
  const importButton=$('addamap');importButton.innerHTML=uiSymbol('link')+'<span>Paste AMap link</span>';
  $('add').innerHTML=uiSymbol('plus')+'<span>Drop a pin</span>';
  $('fit').innerHTML=uiSymbol('fit')+'<span>Show all</span>';
  $('mapfit').onclick=()=>$('fit').click();$('mapsmenu').onclick=()=>$('toolsdialog').showModal();$('closetools').onclick=()=>$('toolsdialog').close();
  const coordAction=$('coordinates').onclick;$('coordinates').onclick=()=>{$('toolsdialog').close();coordAction()};
  $('showlibrary').onclick=()=>{closeDetail();setSheet('expanded')};
  const sheet=$('library'),handle=$('sheethandle');
  function setSheet(size){sheet.dataset.sheet=size;handle.setAttribute('aria-expanded',String(size==='expanded'));handle.setAttribute('aria-label',size==='expanded'?'Collapse saved places':'Expand saved places')}
  let dragged=false;handle.onclick=()=>{if(dragged){dragged=false;return}setSheet(sheet.dataset.sheet==='expanded'?'medium':'expanded')};
  let startY=0;handle.onpointerdown=e=>{startY=e.clientY;dragged=false;handle.setPointerCapture(e.pointerId)};handle.onpointerup=e=>{const delta=e.clientY-startY;if(Math.abs(delta)<25)return;dragged=true;setSheet(delta<0?'expanded':'compact');};
  handle.onkeydown=e=>{if(e.key==='ArrowUp'){e.preventDefault();setSheet('expanded')}if(e.key==='ArrowDown'){e.preventDefault();setSheet('compact')}};
  $('search').addEventListener('focus',()=>{if(matchMedia('(max-width: 700px)').matches)setSheet('expanded')});
  $('add').addEventListener('click',()=>{if(adding){setSheet('compact');$('add').innerHTML=uiSymbol('pin')+'<span>Tap the map</span>'}});
  const sync=()=>{document.body.classList.toggle('place-open',!$('detail').hidden);sheet.inert=!$('detail').hidden;const form=$('editform');if(!form||form.dataset.ios)return;form.dataset.ios='true';form.hidden=true;
    const p=state.places.find(p=>p.id===selected);const summary=document.createElement('div');summary.className='place-summary';
    const title=document.createElement('div');title.className='summary-heading';title.innerHTML='<h3>Your note</h3><button type="button" class="textbtn edit-place">Edit place</button>';
    const note=document.createElement('p');note.textContent=p?.note||'Add a note to remember the little details.';summary.append(title,note);form.before(summary);
    title.querySelector('button').onclick=()=>{form.hidden=false;summary.hidden=true;form.scrollIntoView({behavior:'smooth',block:'nearest'})};
    const nav=$('navigate');nav.innerHTML=uiSymbol('arrow')+'<span>Navigate in AMap</span>';nav.setAttribute('aria-label','Navigate to this place in AMap');
  };
  new MutationObserver(sync).observe($('detail'),{childList:true,attributes:true,attributeFilter:['hidden']});sync();
  new MutationObserver(()=>{const name=currentMap().name;const visibleCount=myPlaces().length;$('librarysubtitle').textContent=`${visibleCount} saved ${visibleCount===1?'place':'places'} · China`;$('add').innerHTML=uiSymbol(adding?'pin':'plus')+`<span>${adding?'Tap the map':'Drop a pin'}</span>`}).observe($('list'),{childList:true});
  $('librarysubtitle').textContent=`${myPlaces().length} saved places · China`;
  $('fit').onclick=()=>{closeDetail();const ps=myPlaces(),mobile=matchMedia('(max-width:700px)').matches;const bottom=mobile?Math.min(sheet.getBoundingClientRect().height+24,innerHeight-180):50;if(ps.length)map.fitBounds(ps.map(p=>[p.lat,p.lng]),{paddingTopLeft:[mobile?36:420,105],paddingBottomRight:[mobile?36:60,bottom],maxZoom:15});else map.setView([35.5,104.5],4)};
  $('fit').click();
  map.on('basemapready',()=>{if($('detail').hidden&&!adding)$('fit').click()});
  $('export').addEventListener('click',()=>$('toolsdialog').close());$('importfile').addEventListener('change',()=>$('toolsdialog').close());
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()})});
});
