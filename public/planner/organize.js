const organizeDialog=document.createElement('dialog');document.body.append(organizeDialog);
function nameDialog(title,value,save){
  organizeDialog.innerHTML=`<form><h2>${esc(title)}</h2><label>Name<input name="name" required maxlength="80" value="${esc(value)}" autocomplete="off"></label><div class="actions"><button type="button" data-cancel>Cancel</button><button class="primary">Save</button></div></form>`;
  organizeDialog.querySelector('[data-cancel]').onclick=()=>organizeDialog.close();
  organizeDialog.querySelector('form').onsubmit=e=>{e.preventDefault();const name=new FormData(e.target).get('name').trim();if(!name)return;save(name);persist();render();organizeDialog.close()};organizeDialog.showModal();
}

const addCategory=document.createElement('button');addCategory.type='button';addCategory.className='add-category';addCategory.textContent='＋ New category';
addCategory.onclick=()=>{const m=currentMap();nameDialog('New category','',name=>{(m.categories??=[]).push({id:placeUUID(),name})})};addCategory.className='textbtn category-header-action';$('fit').hidden=true;$('fit').after(addCategory);
function movePlace(id,category,before){
  const p=state.places.find(p=>p.id===id);if(!p||p.map!==active)return;
  p.category=category;state.places=state.places.filter(p=>p.id!==id);
  const index=before?state.places.findIndex(p=>p.id===before):-1;
  if(index<0)state.places.push(p);else state.places.splice(index,0,p);
  persist();render();
}
function organizePlace(id){
  const p=state.places.find(p=>p.id===id);if(!p)return;
  organizeDialog.innerHTML=`<button class="close" aria-label="Close organization">×</button><h2>Organize place</h2><p class="hint">${esc(p.name)}</p><h3>Category</h3><div class="category-options"></div><div class="actions"><button type="button" data-up>Move up</button><button type="button" data-down>Move down</button></div>`;
  organizeDialog.querySelector('.close').onclick=()=>organizeDialog.close();
  for(const c of [{id:'',name:'Uncategorized'},...(currentMap().categories||[])]){
    const b=document.createElement('button');b.type='button';b.className='category-choice';b.textContent=c.name+((p.category||'')===c.id?' ✓':'');
    b.onclick=()=>{movePlace(id,c.id);organizeDialog.close()};organizeDialog.querySelector('.category-options').append(b);
  }
  const peers=myPlaces().filter(x=>(x.category||'')===(p.category||'')),i=peers.findIndex(x=>x.id===id);
  const up=organizeDialog.querySelector('[data-up]'),down=organizeDialog.querySelector('[data-down]');up.disabled=i===0;down.disabled=i===peers.length-1;
  up.onclick=()=>{movePlace(id,p.category||'',peers[i-1].id);organizeDialog.close()};
  down.onclick=()=>{movePlace(id,p.category||'',peers[i+2]?.id);organizeDialog.close()};organizeDialog.showModal();
}
const renderUngrouped=render;
render=function(){
  renderUngrouped();
  const places=visible(),categories=currentMap().categories||[],valid=new Set(categories.map(c=>c.id));
  const groups=[...categories,{id:'',name:'Uncategorized'}];
  $('list').innerHTML=groups.map(c=>{
    const items=places.filter(p=>(valid.has(p.category)?p.category:'')===c.id);
    if(!items.length&&!c.id&&!categories.length)return '';
    return `<section class="place-group" data-category="${esc(c.id)}"><div class="category-heading"><h3>${esc(c.name)}</h3>${c.id?`<button class="drag-category" data-category-move="${esc(c.id)}" aria-label="Drag ${esc(c.name)} category to reorder"><span class="reorder-lines" aria-hidden="true"></span></button>`:''}${c.id?`<button class="textbtn" data-edit-category="${esc(c.id)}" aria-label="Manage ${esc(c.name)} category">Edit</button>`:''}</div>${items.map(p=>`<div class="organized-place" data-id="${esc(p.id)}"><button class="place" data-place="${esc(p.id)}"><span class="emoji" style="background:${p.color}20;border-left:4px solid ${p.color}">${symbolMarkup(p.icon)}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.note.slice(0,64)||'Add a note for this place')}</small></span></button><button class="drag-place" data-organize="${esc(p.id)}" aria-label="Move or change category for ${esc(p.name)}" title="Drag to reorder, or tap to organize"><span class="reorder-lines" aria-hidden="true"></span></button></div>`).join('')}${!items.length?'<p class="category-empty">Drag places here</p>':''}</section>`;
  }).join('')||'<p class="empty">No saved places here yet.</p>';
};
$('list').addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-category]');if(edit){const c=currentMap().categories.find(c=>c.id===edit.dataset.editCategory);nameDialog('Edit category',c.name,name=>c.name=name);const remove=document.createElement('button');remove.type='button';remove.className='delete-place';remove.textContent='Delete category';remove.onclick=()=>confirmDeleteCategory(c.id);organizeDialog.querySelector('form').append(remove)}
  const b=e.target.closest('[data-organize]');if(b){if(suppressOrganize){suppressOrganize=false;return}organizePlace(b.dataset.organize)}
});
let drag=null,suppressOrganize=false;
$('list').addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-organize],[data-category-move]');if(!handle)return;drag={categoryDrag:!!handle.dataset.categoryMove,id:handle.dataset.organize||handle.dataset.categoryMove,start:e.clientY,handle,moved:false,target:null};handle.setPointerCapture(e.pointerId)});
$('list').addEventListener('pointermove',e=>{
  if(!drag)return;if(Math.abs(e.clientY-drag.start)>6)drag.moved=true;if(!drag.moved)return;
  drag.handle.closest(drag.categoryDrag?'.place-group':'.organized-place').classList.add('dragging');
  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  const under=document.elementFromPoint(e.clientX,e.clientY),group=under?.closest('.place-group');
  if(group){const row=drag.categoryDrag?null:under.closest('.organized-place');let before=row?.dataset.id;if(row&&e.clientY>row.getBoundingClientRect().top+row.getBoundingClientRect().height/2)before=row.nextElementSibling?.dataset.id;drag.target={category:group.dataset.category,before};(row||group).classList.add('drop-target')}
  const list=$('list'),r=list.getBoundingClientRect();if(e.clientY<r.top+45)list.scrollTop-=12;else if(e.clientY>Math.min(r.bottom,innerHeight)-45)list.scrollTop+=12;
});
function finishDrag(e){if(!drag)return;const d=drag;drag=null;document.querySelectorAll('.drop-target,.dragging').forEach(el=>el.classList.remove('drop-target','dragging'));if(d.moved){suppressOrganize=true;if(e.type!=='pointercancel'&&d.target){if(d.categoryDrag){const cats=currentMap().categories,c=cats.find(c=>c.id===d.id);if(c&&d.target.category!==d.id){cats.splice(cats.indexOf(c),1);const index=cats.findIndex(c=>c.id===d.target.category);cats.splice(index<0?cats.length:index,0,c);persist();render()}}else if(d.target.before!==d.id)movePlace(d.id,d.target.category,d.target.before);}setTimeout(()=>suppressOrganize=false,0)}}
$('list').addEventListener('pointerup',finishDrag);$('list').addEventListener('pointercancel',finishDrag);
render();

function confirmDeleteCategory(id){
  const m=currentMap(),category=m.categories?.find(c=>c.id===id);if(!category)return;
  organizeDialog.innerHTML=`<h2>Delete category?</h2><p class="hint">Delete “${esc(category.name)}”? Its saved places will move to Uncategorized.</p><div class="actions"><button type="button" data-keep>Keep category</button><button type="button" class="danger" data-delete>Delete category</button></div>`;
  organizeDialog.querySelector('[data-keep]').onclick=()=>organizeDialog.close();
  organizeDialog.querySelector('[data-delete]').onclick=()=>{
    const index=m.categories.indexOf(category),places=state.places.filter(p=>p.map===m.id&&p.category===id).map(p=>p.id);
    m.categories=m.categories.filter(c=>c.id!==id);state.places.forEach(p=>{if(p.map===m.id&&p.category===id)p.category=''});
    persist();render();organizeDialog.close();
    deletedToast('Category deleted. Places kept.',()=>{const restored=state.maps.find(map=>map.id===m.id);if(!restored)return;(restored.categories??=[]).splice(index,0,category);state.places.forEach(p=>{if(p.map===m.id&&places.includes(p.id)&&!p.category)p.category=id});persist();render()});
  };
}
