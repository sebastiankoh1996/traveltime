// Keep native form values while presenting a consistent, touch-friendly picker.
const selectionSheet=document.createElement('dialog');
selectionSheet.className='selection-sheet';
document.body.append(selectionSheet);
let undoAction;
function deletedToast(message,restore){
  clearTimeout(toastTimer);undoAction=restore;
  $('toast').replaceChildren(document.createTextNode(message+' '));
  const button=document.createElement('button');button.textContent='Undo';
  button.onclick=()=>{const action=undoAction;undoAction=null;action?.();toast('Restored')};
  $('toast').append(button);$('toast').style.display='block';
  toastTimer=setTimeout(()=>{$('toast').style.display='none';undoAction=null},10000);
}
function deleteSavedPlace(id){
  const removed=structuredClone(state.places.find(p=>p.id===id));
  state.places=state.places.filter(p=>p.id!==id);persist();closeDetail();
  deletedToast('Place deleted.',()=>{if(removed&&state.maps.some(m=>m.id===removed.map)&&!state.places.some(p=>p.id===id))state.places.push(removed);persist();render()});
}
function confirmDeleteMap(id){
  const m=state.maps.find(m=>m.id===id),count=state.places.filter(p=>p.map===id).length;
  selectionSheet.innerHTML=`<h2>Delete this map?</h2><p class="hint">${esc(m.name)} and its ${count} saved ${count===1?'place':'places'} will be deleted.</p><div class="actions"><button type="button" data-cancel>Keep map</button><button type="button" class="danger" data-delete>Delete map</button></div>`;
  selectionSheet.querySelector('[data-cancel]').onclick=()=>selectionSheet.close();
  selectionSheet.querySelector('[data-delete]').onclick=()=>{
    const removedMap=structuredClone(m),removedPlaces=structuredClone(state.places.filter(p=>p.map===id));let fallback=null;
    state.maps=state.maps.filter(m=>m.id!==id);state.places=state.places.filter(p=>p.map!==id);
    if(!state.maps.length){fallback={id:placeUUID(),name:'My map'};state.maps.push(fallback)}
    if(active===id)active=state.maps[0].id;
    adding=false;$('search').value='';persist();fit();selectionSheet.close();
    deletedToast('Map deleted.',()=>{if(fallback&&!state.places.some(p=>p.map===fallback.id))state.maps=state.maps.filter(m=>m.id!==fallback.id);state.maps.push(removedMap);state.places.push(...removedPlaces);active=id;persist();fit()});
  };
}
function openSelection(select){
  const maps=select.id==='mapselect';
  selectionSheet.innerHTML=`<button type="button" class="close" aria-label="Close selection">×</button><h2>${maps?'Your maps':esc(select.getAttribute('aria-label')||select.closest('label')?.firstChild.textContent.trim()||'Choose an option')}</h2><div class="selection-options"></div>${maps?'<button type="button" class="create-map-option">＋ Create a new map</button>':''}`;
  selectionSheet.querySelector('.close').onclick=()=>selectionSheet.close();
  const options=selectionSheet.querySelector('.selection-options');
  for(const option of select.options){
    const row=document.createElement('div');row.className='selection-row';
    const button=document.createElement('button');button.type='button';button.className='selection-option';
    button.innerHTML=`<span>${esc(option.textContent)}</span><span class="selection-check">${option.selected?'✓':''}</span>`;
    button.setAttribute('aria-pressed',String(option.selected));button.disabled=option.disabled;
    button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));selectionSheet.close();syncSelections()};row.append(button);
    if(maps){const edit=document.createElement('button');edit.type='button';edit.className='map-rename';edit.setAttribute('aria-label','Rename '+option.textContent);edit.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/></svg>';edit.onclick=()=>{const m=state.maps.find(m=>m.id===option.value);selectionSheet.close();nameDialog('Edit map name',m.name,name=>m.name=name)};row.append(edit);const remove=document.createElement('button');remove.className='map-delete';remove.type='button';remove.setAttribute('aria-label','Delete '+option.textContent);remove.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v8m4-8v8"/></svg>';remove.onclick=()=>confirmDeleteMap(option.value);row.append(remove)}
    options.append(row);
  }
  if(maps)selectionSheet.querySelector('.create-map-option').onclick=()=>{selectionSheet.close();$('newmap').click()};
  if(!selectionSheet.open)selectionSheet.showModal();
}
function syncSelections(){
  document.querySelectorAll('select').forEach(select=>{
    let button=select.nextElementSibling;
    if(!button?.classList.contains('selection-trigger')){
      button=document.createElement('button');button.type='button';button.className='selection-trigger';button.setAttribute('aria-haspopup','dialog');select.after(button);
      select.hidden=true;select.addEventListener('change',syncSelections);button.onclick=()=>openSelection(select);
    }
    const label=select.selectedOptions[0]?.textContent||'Choose';
    if(button.dataset.value!==label){button.innerHTML=`<span>${esc(label)}</span><span aria-hidden="true">⌄</span>`;button.dataset.value=label}
    button.setAttribute('aria-label',select.id==='mapselect'?'Choose custom map: '+label:label);
  });
}
new MutationObserver(syncSelections).observe(document.body,{childList:true,subtree:true});
syncSelections();
