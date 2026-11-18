import test from 'node:test';
import assert from 'node:assert/strict';
import { selectLatestBuild, latestBuild, submissionReceipt } from '../scripts/asc-submission.mjs';
import { validateRequest, request, redact } from '../scripts/asc-api.mjs';
import { uploadScreenshot, validateOperations } from '../scripts/asc-upload.mjs';

const version = (id, platform='IOS') => ({type:'preReleaseVersions',id,attributes:{platform,version:'1.2.0'}});
const build = (id,date,v='v1',attributes={}) => ({type:'builds',id,
  attributes:{version:id,uploadedDate:date,processingState:'VALID',buildAudienceType:'APP_STORE_ELIGIBLE',...attributes},
  relationships:{app:{data:{id:'a'}},preReleaseVersion:{data:{id:v}}}});
const inventory = data => ({data, included:[version('v1'),version('mac','MAC_OS')],complete:true});
const response = body => new Response(JSON.stringify(body),{status:200});

test('latest means upload time within app/platform, not version string or first page',()=>{
  const data=[build('99','2026-01-01'),build('2','2026-02-01'),build('300','2026-03-01','mac')];
  assert.equal(selectLatestBuild(inventory(data),'a','IOS').buildId,'2');
  assert.equal(selectLatestBuild(inventory(data),'a','MAC_OS').buildId,'300');
  assert.equal(selectLatestBuild(inventory(data),'other','IOS').status,'blocked_no_testflight');
});
test('latest ineligible build blocks; no silent fallback to older valid build or testing-proof requirement',()=>{
  for(const attrs of [{processingState:'PROCESSING'},{buildAudienceType:'INTERNAL_ONLY'},{buildAudienceType:null}]) {
    const r=selectLatestBuild(inventory([build('1','2026-01-01'),build('2','2026-02-01','v1',attrs)]),'a','IOS');
    assert.equal(r.status,'blocked_latest_build');assert.equal(r.buildId,'2');
  }
  assert.equal(selectLatestBuild(inventory([build('1','2026-01-01')]),'a','IOS').status,'selected');
});
test('incomplete inventories, unknown platform evidence and ties cannot select a build',()=>{
  assert.throws(()=>selectLatestBuild({...inventory([]),complete:false},'a','IOS'),/Complete/);
  assert.throws(()=>selectLatestBuild(inventory([build('1','2026-01-01','missing')]),'a','IOS'),/Missing/);
  assert.throws(()=>selectLatestBuild(inventory([build('1','2026-01-01'),build('2','2026-01-01')]),'a','IOS'),/ambiguous/);
});
test('latest queries every page and retains platform relationships',async()=>{
  const pages=[{data:[build('1','2026-01-01')],included:[version('v1')],links:{next:'/v1/builds?cursor=2'}},
    {data:[build('2','2026-02-01')],included:[],links:{next:null}}];
  const r=await latestBuild({appId:'a',platform:'IOS',token:'fake',fetchImpl:async()=>response(pages.shift())});
  assert.equal(r.buildId,'2');assert.equal(pages.length,0);
});
test('submission requires scope and matching explicit confirmation; cancellation/release remain blocked',()=>{
  const path='/v1/reviewSubmissions/s',body={data:{type:'reviewSubmissions',id:'s',attributes:{submitted:true}}};
  assert.throws(()=>validateRequest('PATCH',path,body));
  assert.throws(()=>validateRequest('PATCH',path,body,{scope:'submission'}),/confirm-submission/);
  assert.throws(()=>validateRequest('PATCH',path,body,{scope:'submission',confirmSubmission:'other'}));
  validateRequest('PATCH',path,body,{scope:'submission',confirmSubmission:'s'});
  assert.throws(()=>validateRequest('PATCH',path,{data:{...body.data,attributes:{canceled:true}}},{scope:'submission'}));
  for(const path of ['/v1/appStoreVersionReleaseRequests','/v1/certificates','/v1/betaGroups'])
    assert.throws(()=>validateRequest('POST',path,{data:{}},{scope:'submission'}));
  assert.throws(()=>validateRequest('POST','/v1/reviewSubmissions',{data:{type:'reviewSubmissions',attributes:{submitted:true}}},{scope:'submission'}));
  assert.throws(()=>validateRequest('POST','/v1/reviewSubmissions',{data:{type:'reviewSubmissions'}},{scope:'read'}));
});
test('uncertain final write is never retried automatically',async()=>{
  let calls=0;
  await assert.rejects(request({method:'PATCH',path:'/v1/reviewSubmissions/s',scope:'submission',confirmSubmission:'s',
    body:{data:{type:'reviewSubmissions',id:'s',attributes:{submitted:true}}},token:'fake',
    fetchImpl:async()=>{calls++;throw Error('lost response');}}),e=>e.result.kind==='outcome_unknown');
  assert.equal(calls,1);
});
test('receipt requires exact version-build-item linkage and a submitted state/date',()=>{
  const s={data:{type:'reviewSubmissions',id:'s',attributes:{platform:'IOS',state:'WAITING_FOR_REVIEW',submittedDate:'2026-02-01'}}};
  const v={data:{type:'appStoreVersions',id:'v',attributes:{platform:'IOS'},relationships:{build:{data:{id:'b'}}}}};
  const items={data:[{relationships:{appStoreVersion:{data:{id:'v'}}}}]};
  assert.equal(submissionReceipt(s,items,v,'b').status,'submitted');
  assert.equal(submissionReceipt(s,items,v,'other').status,'outcome_unknown');
  assert.equal(submissionReceipt(s,{data:[]},v,'b').status,'outcome_unknown');
  for(const state of ['READY_FOR_REVIEW','WAITING_FOR_REVIEW']) {
    assert.equal(submissionReceipt({data:{...s.data,attributes:{platform:'IOS',state}}},items,v,'b').status,'not_confirmed_submitted');
  }
});
test('asset ranges reject gaps, overlap and non-Apple destinations',()=>{
  const op={url:'https://store.blobstore.apple.com/upload',method:'PUT',offset:0,length:4};
  validateOperations([op],4);
  for(const changed of [{url:'https://apple.com.evil.test/upload'},{url:'http://store.apple.com/u'},
    {offset:1},{length:3},{requestHeaders:[{name:'Authorization',value:'secret'}]}])
    assert.throws(()=>validateOperations([{...op,...changed}],4));
});
test('reserve-upload-commit uses exact bytes, no JWT on asset host, and reads back status',async()=>{
  const bytes=Buffer.from('abcd'),calls=[];
  const reservation={data:{type:'appScreenshots',id:'s',attributes:{fileSize:4,assetDeliveryState:{state:'AWAITING_UPLOAD'},
    uploadOperations:[{url:'https://store.blobstore.apple.com/u?secret=temporary',method:'PUT',offset:0,length:4,requestHeaders:[]}]}}};
  const result=await uploadScreenshot({id:'s',bytes,token:'jwt',execute:true,fetchImpl:async(url,o)=>{
    calls.push({url:String(url),...o});
    if(calls.length===1)return response(reservation);
    if(calls.length===2){assert.equal(o.headers.Authorization,undefined);assert.equal(o.body.toString(),'abcd');return response({});}
    if(calls.length===3){assert.equal(JSON.parse(o.body).data.attributes.sourceFileChecksum,'e2fc714c4727ee9395f324cd2e7f331f');return response({});}
    return response({data:{attributes:{assetDeliveryState:{state:'COMPLETE'}}}});
  }});
  assert.equal(calls.length,4);assert.equal(result.state.state,'COMPLETE');
  assert.equal(JSON.stringify(result).includes('secret=temporary'),false);
});
test('asset plan performs no transfer and sensitive review/upload fields are redacted',async()=>{
  let calls=0;
  const r=await uploadScreenshot({id:'s',bytes:Buffer.from('a'),token:'fake',fetchImpl:async()=>{
    calls++;return response({data:{type:'appScreenshots',id:'s',attributes:{fileSize:1,assetDeliveryState:{state:'AWAITING_UPLOAD'},
      uploadOperations:[{url:'https://store.apple.com/u',method:'PUT',offset:0,length:1}]}}});
  }});
  assert.equal(r.mode,'plan');assert.equal(calls,1);
  const safe=redact({demoAccountPassword:'SECRET',contactEmail:'SECRET',uploadOperations:[{url:'SECRET'}]});
  assert.equal(JSON.stringify(safe).includes('SECRET'),false);
});
