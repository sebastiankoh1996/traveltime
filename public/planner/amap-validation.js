function validAmap(a){
  if(!a||typeof a.placeId!=='string'||!/^B[A-Z0-9]{5,30}$/i.test(a.placeId)||!Number.isFinite(a.lat)||!Number.isFinite(a.lng)||Math.abs(a.lat)>90||Math.abs(a.lng)>180||typeof a.address!=='string'||typeof a.sourceUrl!=='string')return false;
  try{const u=new URL(a.sourceUrl);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['surl.amap.com','wb.amap.com','www.amap.com','amap.com','m.amap.com','uri.amap.com'].includes(u.hostname)}catch{return false}
}
