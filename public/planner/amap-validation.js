// LAN previews use HTTP, where randomUUID may be unavailable on mobile browsers.
function placeUUID(){
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function validAmap(a){
  if(!a||typeof a.placeId!=='string'||!/^B[A-Z0-9]{5,30}$/i.test(a.placeId)||!Number.isFinite(a.lat)||!Number.isFinite(a.lng)||Math.abs(a.lat)>90||Math.abs(a.lng)>180||typeof a.address!=='string'||typeof a.sourceUrl!=='string')return false;
  try{const u=new URL(a.sourceUrl);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['surl.amap.com','wb.amap.com','www.amap.com','amap.com','m.amap.com','uri.amap.com'].includes(u.hostname)}catch{return false}
}
