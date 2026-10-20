import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveShare,shareURL} from './amap-share.mjs';
const target='https://wb.amap.com/?'+new URLSearchParams({p:'B001557EGG,31.236124664605235,121.47712558507915,Lai Laixiaolong,Huangpu Tianjin Road No.506'});
test('short links extract redirect data without loading the listing',async()=>{
  let calls=0;
  const p=await resolveShare('Lai Laixiaolong\n¥64/person\nhttps://surl.amap.com/i0WfNp0Selu',async(url,options)=>{calls++;assert.equal(url,'https://surl.amap.com/i0WfNp0Selu');assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{location:target}})});
  assert.equal(calls,1);assert.equal(p.placeId,'B001557EGG');assert.equal(p.lat,31.236124664605235);assert.equal(p.name,'Lai Laixiaolong');assert.match(p.address,/506/);
});
test('direct links decode Unicode and address commas without fetching',async()=>{const p=await resolveShare('https://wb.amap.com/?'+new URLSearchParams({p:'B001557EGG,31.2,121.4,莱莱小笼,天津路506号,黄浦区'}),()=>{throw Error('No fetch expected')});assert.equal(p.name,'莱莱小笼');assert.equal(p.address,'天津路506号,黄浦区')});
test('rejects lookalike hosts, credentials, ports and off-site redirects',async()=>{
  for(const url of ['https://amap.com.evil.test/x','https://amap.com@127.0.0.1/x','https://surl.amap.com:8080/x','file:///etc/passwd']) assert.throws(()=>shareURL(url));
  await assert.rejects(resolveShare('https://surl.amap.com/abc',async()=>new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}})),/AMap share link/);
});
test('unsupported links and malformed coordinates fail without invented pins',async()=>{
  await assert.rejects(resolveShare('https://www.amap.com/ssr/place/B001557EGG'),/did not include coordinates/);
  await assert.rejects(resolveShare('https://wb.amap.com/?'+new URLSearchParams({p:'B001557EGG,999,121,Fake'})),/valid place location/);
});
