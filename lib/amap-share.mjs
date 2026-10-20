const HOSTS = new Set(['surl.amap.com','wb.amap.com','www.amap.com','amap.com','m.amap.com','uri.amap.com']);
export function shareURL(text) {
  if (typeof text !== 'string' || text.length > 8000) throw new Error('Paste an AMap share link or the text copied from AMap.');
  const match = text.match(/https?:\/\/[^\s<>"\u3002]+/i);
  if (!match) throw new Error('No link found. In AMap, choose Share → Copy link, then paste it here.');
  let url;
  try { url = new URL(match[0].replace(/[)\]}>.,;，；]+$/g,'')); } catch { throw new Error('That link could not be read. Copy the link again from AMap.'); }
  return allowedURL(url);
}
function allowedURL(url) {
  if (!HOSTS.has(url.hostname) || !['http:','https:'].includes(url.protocol) || url.username || url.password || url.port) throw new Error('Use an AMap share link from amap.com.');
  url.protocol='https:'; url.hash=''; return url;
}
export function parsePlace(url) {
  const raw=url.searchParams.get('p'); if (!raw) return null;
  const parts=raw.split(','); if(parts.length<4) return null;
  const [placeId,latText,lngText,name]=parts,lat=Number(latText),lng=Number(lngText);
  if(!latText.trim()||!lngText.trim()||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!name.trim()||!/^B[A-Z0-9]{5,30}$/i.test(placeId)) throw new Error('This link does not contain a valid place location. Try sharing the place again.');
  return {placeId,name:name.trim().slice(0,80),address:parts.slice(4).join(',').slice(0,1000),lat,lng,coordinateSystem:'GCJ-02'};
}
export async function resolveShare(text, fetcher=fetch) {
  const original=shareURL(text),sourceUrl=original.href; let url=original;
  for(let hop=0;hop<5;hop++) {
    const place=parsePlace(url); if(place) return {...place,sourceUrl};
    // Only short-link redirects are fetched; never follow arbitrary hosts or listing endpoints.
    if(url.hostname!=='surl.amap.com'||!/^\/[A-Za-z0-9_-]{1,100}\/?$/.test(url.pathname)) break;
    const response=await fetcher(url.href,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{Accept:'text/html'}});
    const location=response.headers.get('location'); await response.body?.cancel();
    if(response.status<300||response.status>399||!location) break;
    url=allowedURL(new URL(location,url));
  }
  throw new Error('AMap did not include coordinates in this link. Try Copy link again, or use Enter coordinates. Nothing has been saved.');
}
