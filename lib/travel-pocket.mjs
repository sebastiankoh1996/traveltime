const postCache=new Map();let requestTimes=[];
const PLATFORMS=[['YouTube',['youtube.com','youtu.be'],'/v1/youtube/video'],['Instagram',['instagram.com'],'/v1/instagram/post'],['TikTok',['tiktok.com'],'/v2/tiktok/video'],['Facebook',['facebook.com','fb.watch','fb.com'],'/v1/facebook/post'],['Xiaohongshu',['xiaohongshu.com','xhslink.com'],null]];
export function travelSource(text){
  const match=String(text||'').match(/https:\/\/[^\s<>"“”]+/i);if(!match)throw Error('Paste a public travel post or video link.');
  let url;try{url=new URL(match[0].replace(/[),。]+$/,''))}catch{throw Error('That link is not valid.')}
  if(url.port||url.username||url.password)throw Error('Use a standard public post link.');
  const platform=PLATFORMS.find(([,hosts])=>hosts.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)));
  if(!platform)throw Error('Use a YouTube, Instagram, TikTok, Xiaohongshu or Facebook link.');
  url.hash='';return {url:url.href,platform:platform[0],endpoint:platform[2]};
}
export function extractPlaces(text,tags=[]){
  const results=[],seen=new Set();
  const add=(name,evidence)=>{name=name.replace(/^[\s\d.)、\-📍📌•]+/u,'').replace(/\s+/g,' ').trim().slice(0,100);if(name.length<2||seen.has(name.toLowerCase())||results.length>=30)return;seen.add(name.toLowerCase());results.push({name,evidence:String(evidence).slice(0,260)})};
  for(const name of tags)if(typeof name==='string')add(name,'Location tagged in the original post');
  for(const line of String(text).split(/[\n\r]+/)){
    const explicit=line.match(/(?:📍|📌|地点[：:]|店名[：:]|地址[：:]|location\s*[:：]|place\s*[:：])\s*([^\n#|]{2,100})/i);
    if(explicit)add(explicit[1],line);
    const numbered=line.match(/^\s*(?:\d{1,2}[.)、]|[①②③④⑤⑥⑦⑧⑨⑩])\s*([^#|]{2,90})/);if(numbered)add(numbered[1].split(/\s[-–—]\s|[：:]/)[0],line);
    for(const match of line.matchAll(/[\p{Script=Han}]{2,16}(?:博物馆|美术馆|咖啡馆|咖啡店|餐厅|饭店|公园|古镇|寺庙|景区|小笼|花园|老街|书店|酒店|大厦|外滩|豫园)/gu))add(match[0],line);
    for(const match of line.matchAll(/\b(?:[A-Z][\p{L}'’.-]*\s+){1,5}(?:Museum|Temple|Garden|Gardens|Park|Cafe|Café|Restaurant|Palace|Market|Lake|Tower|Beach|Square)\b/gu))add(match[0],line);
  }
  return results;
}
export function postContent(data){
  const text=[],tags=[];
  function walk(value,key='',depth=0){
    if(depth>12||value==null)return;
    if(typeof value==='string'){if(['title','description','desc','caption','transcript','transcript_only_text','text','content'].includes(key)&&!value.startsWith('http'))text.push(value);return}
    if(Array.isArray(value)){value.slice(0,500).forEach(v=>walk(v,key,depth+1));return}
    if(typeof value==='object'){
      if(['location','poi_info','poi','place'].includes(key)&&typeof value.name==='string')tags.push(value.name);
      for(const [k,v] of Object.entries(value))if(!/comment|owner|author|user|music|related|suggest/i.test(k))walk(v,k,depth+1);
    }
  }
  walk(data);return {text:[...new Set(text)].join('\n').slice(0,40000),tags};
}
export async function readTravelPost(input,{key=process.env.SCRAPECREATORS_API_KEY,fetcher=fetch}={}){
  const source=travelSource(input.url),pasted=String(input.text||'').slice(0,30000);
  if(pasted.trim())return {...source,text:pasted,candidates:extractPlaces(pasted),status:'review',message:'Suggestions from the text you pasted. Check names and branches before saving.'};
  if(!source.endpoint||!key)return {...source,text:'',candidates:[],status:'needs-text',message:!source.endpoint?'This platform needs copied caption text for now. Your link is safely saved.':'Automatic post reading is unavailable on this server. Paste the caption below.'};
  const cached=postCache.get(source.url);if(cached&&Date.now()-cached.at<3600000)return cached.result;requestTimes=requestTimes.filter(time=>Date.now()-time<60000);if(requestTimes.length>=8)return {...source,text:'',candidates:[],status:'needs-text',message:'Please wait a minute before reading more links, or paste the caption below.'};requestTimes.push(Date.now());
  const endpoint=new URL('https://api.scrapecreators.com'+source.endpoint);endpoint.searchParams.set('url',source.url);endpoint.searchParams.set('cache_max_age','7d');
  if(source.platform==='TikTok'||source.platform==='Facebook')endpoint.searchParams.set('get_transcript','true');
  if(source.platform==='Instagram')endpoint.searchParams.set('include_play_count','false');
  try{
    const response=await fetcher(endpoint,{headers:{'x-api-key':key},signal:AbortSignal.timeout(55000)});
    if(!response.ok)throw Error();const data=await response.json();if(data.success===false)throw Error();
    const content=postContent(data),candidates=extractPlaces(content.text,content.tags);
    const result={...source,text:content.text,candidates,status:candidates.length?'review':'needs-text',message:candidates.length?'Possible places found in available captions, subtitles or location tags. Review each match.':"No clear place names found. Paste a caption or list of places; video-only mentions may not be available."};postCache.set(source.url,{at:Date.now(),result});if(postCache.size>100)postCache.delete(postCache.keys().next().value);return result;
  }catch{return {...source,text:'',candidates:[],status:'needs-text',message:'This post could not be read. It may be private, restricted, or temporarily unavailable. Paste its caption to continue.'}}
}
