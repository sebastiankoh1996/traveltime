import test from 'node:test';
import assert from 'node:assert/strict';
import {travelSource,extractPlaces,postContent,readTravelPost} from './travel-pocket.mjs';
test('only supported public URLs can reach the provider',()=>{
  for(const url of ['https://localhost/test','https://youtube.com.evil.test/watch?v=1','https://name:secret@youtube.com/watch?v=1','http://youtube.com/watch?v=1'])assert.throws(()=>travelSource(url));
  assert.equal(travelSource('https://www.instagram.com/reel/abc/').platform,'Instagram');
  assert.equal(travelSource('https://xhslink.com/abc').platform,'Xiaohongshu');
});
test('suggestions include evidence and deduplicate explicit names',()=>{
  const places=extractPlaces('📍 Yu Garden\n📍 Jing’an Temple\n📍 Yu Garden');
  assert.deepEqual(places.map(p=>p.name),['Yu Garden','Jing’an Temple']);assert.ok(places.every(p=>p.evidence));
  assert.deepEqual(extractPlaces('Have a wonderful day!'),[]);
});
test('post text excludes comments and account biographies',()=>{
  const content=postContent({data:{title:'Shanghai trip',description:'📍 Yu Garden',comments:[{text:'📍 Fake Garden'}],author:{description:'Not the post'},location:{name:'The Bund'}}});
  assert.ok(!content.text.includes('Fake'));assert.ok(!content.text.includes('Not the post'));assert.deepEqual(content.tags,['The Bund']);
});
test('pasted text and unsupported automatic sources never call paid service',async()=>{
  const fetcher=()=>{throw Error('Unexpected paid request')};
  const manual=await readTravelPost({url:'https://youtube.com/watch?v=test',text:'📍 Yu Garden'},{fetcher});assert.equal(manual.candidates[0].name,'Yu Garden');
  const xhs=await readTravelPost({url:'https://xhslink.com/abc'},{key:'test',fetcher});assert.equal(xhs.status,'needs-text');
});
test('provider response becomes suggestions and failures are recoverable',async()=>{
  const result=await readTravelPost({url:'https://www.tiktok.com/@test/video/123'},{key:'test',fetcher:async(url,options)=>{assert.equal(url.hostname,'api.scrapecreators.com');assert.equal(url.searchParams.get('get_transcript'),'true');assert.equal(options.headers['x-api-key'],'test');return {ok:true,json:async()=>({aweme_detail:{desc:'📍 Yu Garden'}})}}});assert.equal(result.candidates[0].name,'Yu Garden');
  const failed=await readTravelPost({url:'https://instagram.com/reel/test'},{key:'test',fetcher:async()=>({ok:false})});assert.equal(failed.status,'needs-text');assert.equal(failed.candidates.length,0);
});
