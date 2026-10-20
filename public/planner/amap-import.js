const shareDialog=document.createElement('dialog');shareDialog.id='sharedialog';shareDialog.setAttribute('aria-labelledby','sharetitle');
shareDialog.innerHTML=`<button type="button" class="close share-close" aria-label="Close AMap import">×</button><h2 id="sharetitle">Save from AMap</h2><p class="hint">In AMap, open a place → Share → Copy link. Paste the link or the whole shared message below.</p><form id="resolveform"><label for="sharetext">AMap link or share message</label><textarea id="sharetext" maxlength="8000" required placeholder="https://surl.amap.com/…"></textarea><p id="shareerror" role="alert" hidden></p><button class="add" id="resolvebutton">Preview place</button><button type="button" class="textbtn" id="trysample">Try an example</button></form><section id="sharepreview" hidden></section>`;
document.body.appendChild(shareDialog);
const shareButton=document.createElement('button');shareButton.id='addamap';shareButton.className='add amap-add';shareButton.textContent='↗ Paste AMap link';$('add').before(shareButton);
const hint=document.querySelector('.preview-note');hint.innerHTML='OpenStreetMap preview · Import places from AMap share links.<br>Your maps stay in this browser. Export a backup to keep them.';
let sharedPlace=null,previewMap=null,previewVersion=0;
function resetShare(){previewVersion++;sharedPlace=null;if(previewMap){previewMap.remove();previewMap=null}$('resolveform').reset();$('sharepreview').hidden=true;$('sharepreview').innerHTML='';$('shareerror').hidden=true;$('resolvebutton').disabled=false;$('resolvebutton').textContent='Preview place'}
shareButton.onclick=()=>{adding=false;closeDetail();resetShare();shareDialog.showModal()};
shareDialog.querySelector('.share-close').onclick=()=>shareDialog.close();shareDialog.addEventListener('close',()=>{previewVersion++;if(previewMap){previewMap.remove();previewMap=null}});
$('trysample').onclick=()=>{$('sharetext').value='https://surl.amap.com/i0WfNp0Selu';$('shareerror').hidden=true};
$('resolveform').onsubmit=async event=>{
  event.preventDefault();const version=++previewVersion;sharedPlace=null;$('sharepreview').hidden=true;$('shareerror').hidden=true;$('resolvebutton').disabled=true;$('resolvebutton').textContent='Reading AMap link…';
  try {
    const response=await fetch('/api/amap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:$('sharetext').value}),signal:AbortSignal.timeout(15000)});
    let place;try{place=await response.json()}catch{throw Error('The importer is unavailable. Refresh the website and try again.')}
    if(!response.ok)throw Error(place.error||'This link could not be read.');
    if(version!==previewVersion)return;
    sharedPlace=place;const [lat,lng]=gcjToWgs(place.lat,place.lng);
    if(previewMap){previewMap.remove();previewMap=null}
    $('sharepreview').innerHTML=`<div class="share-result"><span class="tag">Found in your AMap link</span><h3>${esc(place.name)}</h3><p>${esc(place.address||'No address supplied in this link.')}</p></div><div id="sharemap" aria-label="Imported pin preview"></div><p class="hint">Check the pin before saving. Preview uses an approximate conversion to OpenStreetMap; AMap navigation keeps the original coordinates.</p><form id="saveamapform"><label>Save to map<select name="map">${state.maps.map(m=>`<option value="${esc(m.id)}" ${m.id===active?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><label>Place name<input name="name" maxlength="80" required value="${esc(place.name)}"></label><label>Your notes<textarea name="note" maxlength="2000" placeholder="What to order, when to visit…"></textarea></label>${chooseStyle({color:COLORS[1],icon:'🍜'})}<div class="actions"><button type="button" id="cancelshare">Cancel</button><button class="primary">Save to my map</button></div></form>`;
    $('sharepreview').hidden=false;previewMap=L.map('sharemap',{scrollWheelZoom:false}).setView([lat,lng],16);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(previewMap);const previewMarker=L.marker([lat,lng],{icon:icon({color:COLORS[1],icon:'🍜'}),title:place.name}).addTo(previewMap);
    $('cancelshare').onclick=()=>shareDialog.close();$('saveamapform').onchange=()=>{const f=new FormData($('saveamapform'));previewMarker.setIcon(icon({color:f.get('color'),icon:f.get('icon')}))};
    $('saveamapform').onsubmit=e=>{
      e.preventDefault();if(!sharedPlace)return;const f=new FormData(e.target),name=f.get('name').trim();if(!name){toast('Enter a place name');return}
      const mapId=f.get('map'),existing=state.places.find(p=>p.map===mapId&&p.amap?.placeId===place.placeId);
      if(existing){active=mapId;persist();shareDialog.close();$('search').value='';show(existing.id);toast('This place is already saved in this map');return}
      const p={id:crypto.randomUUID(),map:mapId,name,lat,lng,color:f.get('color'),icon:f.get('icon'),note:f.get('note'),amap:{placeId:place.placeId,lat:place.lat,lng:place.lng,address:place.address,sourceUrl:place.sourceUrl}};
      state.places.push(p);active=mapId;
      if(!persist()){state.places.pop();return}
      shareDialog.close();$('search').value='';show(p.id);toast('AMap place saved');
    };
    $('sharepreview').scrollIntoView({behavior:'smooth',block:'start'});requestAnimationFrame(()=>previewMap?.invalidateSize());
  }catch(error){if(version!==previewVersion)return;$('shareerror').textContent=error.name==='TimeoutError'?'AMap took too long to respond. Try again, or enter coordinates manually.':error.message;$('shareerror').hidden=false}
  finally{if(version===previewVersion){$('resolvebutton').disabled=false;$('resolvebutton').textContent='Preview place'}}
};
