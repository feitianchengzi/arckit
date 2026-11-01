import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { apiURL, validateRequest, jwt, redact, request, allPages } from '../scripts/asc-api.mjs';

const response = (body,status=200,headers={}) => new Response(body===null?null:JSON.stringify(body),{status,headers});

test('ES256 JWT is verifiable, short-lived, and contains no private material',()=>{
  const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const pem=privateKey.export({type:'pkcs8',format:'pem'});
  const token=jwt({ASC_KEY_ID:'fixture-key',ASC_ISSUER_ID:'fixture-issuer'},pem,1000);
  const [head,payload,sig]=token.split('.');
  assert.equal(JSON.parse(Buffer.from(head,'base64url')).alg,'ES256');
  assert.deepEqual(JSON.parse(Buffer.from(payload,'base64url')),
    {iss:'fixture-issuer',iat:1000,exp:1600,aud:'appstoreconnect-v1'});
  assert.equal(Buffer.from(sig,'base64url').length,64);
  assert.ok(verify('sha256',Buffer.from(head+'.'+payload),
    {key:publicKey,dsaEncoding:'ieee-p1363'},Buffer.from(sig,'base64url')));
  assert.equal(token.includes('PRIVATE KEY'),false);
});

test('URL confinement rejects external origins and credential-bearing URLs',()=>{
  for(const path of ['https://example.org/v1/apps','//example.org/v1/apps',
    'http://api.appstoreconnect.apple.com/v1/apps',
    'https://user@api.appstoreconnect.apple.com/v1/apps','/v1/apps#secret','/other'])
    assert.throws(()=>apiURL(path));
  assert.equal(apiURL('/v1/apps?limit=200').origin,'https://api.appstoreconnect.apple.com');
});

test('write gate blocks revocation, expiry, submissions and private app creation',()=>{
  for(const [method,path] of [['DELETE','/v1/certificates/id'],['POST','/v1/apps'],
    ['POST','/v1/reviewSubmissions'],['PATCH','/v1/users/id']])
    assert.throws(()=>validateRequest(method,path,{data:{}}));
  assert.throws(()=>validateRequest('PATCH','/v1/builds/id',
    {data:{type:'builds',id:'id',attributes:{expired:true}}}));
  validateRequest('PATCH','/v1/builds/id',
    {data:{type:'builds',id:'id',attributes:{usesNonExemptEncryption:false}}});
});

test('pagination retains every page and deduplicates included resources',async()=>{
  const pages=[
    {data:[{id:'a'}],included:[{type:'x',id:'i'}],links:{next:'/v1/apps?cursor=2'}},
    {data:[{id:'b'}],included:[{type:'x',id:'i'}],links:{next:null}}
  ];
  const r=await allPages({path:'/v1/apps',token:'fixture',fetchImpl:async()=>response(pages.shift())});
  assert.deepEqual(r.body.data,[{id:'a'},{id:'b'}]);
  assert.equal(r.body.included.length,1);
  assert.equal(r.body.meta.pages,2);
});

test('external pagination URL is rejected before sending a second request',async()=>{
  let calls=0;
  await assert.rejects(allPages({path:'/v1/apps',token:'fixture',fetchImpl:async()=>{
    calls++;return response({data:[],links:{next:'https://example.org/v1/apps'}});
  }}),/Only official/);
  assert.equal(calls,1);
});

test('pagination cycles fail rather than returning an incomplete success',async()=>{
  await assert.rejects(allPages({path:'/v1/apps',token:'fixture',
    fetchImpl:async()=>response({data:[],links:{next:'/v1/apps'}})}),/cycle/);
});

test('unknown write outcome is not automatically retried',async()=>{
  let calls=0;
  await assert.rejects(request({method:'POST',path:'/v1/betaGroups',body:{data:{}},token:'fixture',
    fetchImpl:async(_url,options)=>{calls++;assert.equal(options.redirect,'error');throw Error('network');}
  }),e=>e.result.kind==='outcome_unknown');
  assert.equal(calls,1);
});

test('HTTP failures preserve permission, retry and uncertain-write information',async()=>{
  for(const [status,method,kind] of [[403,'GET','permission_denied'],[429,'GET','rate_limited'],
    [503,'POST','outcome_unknown'],[409,'POST','conflict_reconcile']]) {
    await assert.rejects(request({method,path:'/v1/betaGroups',
      ...(method==='POST'?{body:{data:{}}}:{}),token:'fixture',
      fetchImpl:async()=>response({errors:[{code:'FIXTURE'}]},status,{'retry-after':'20'})
    }),e=>e.result.kind===kind && e.result.retryAfter==='20');
  }
});

test('204 is a successful transport response, not fabricated business evidence',async()=>{
  const r=await request({method:'POST',path:'/v1/betaGroups/g/relationships/builds',
    body:{data:[{type:'builds',id:'b'}]},token:'fixture',fetchImpl:async()=>response(null,204)});
  assert.deepEqual(r,{status:204,body:null});
});

test('sensitive fields and embedded private keys are redacted',()=>{
  const r=redact({Authorization:'Bearer secret',nested:{profileContent:'secret'},
    message:'-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'});
  assert.equal(JSON.stringify(r).includes('secret'),false);
});

test('write plan works with no key or network and requires explicit execution flag',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'arckit-asc-test-'));
  try {
    const path=join(dir,'request.json');
    await writeFile(path,JSON.stringify({data:[{type:'builds',id:'fixture'}]}));
    const env={...process.env};
    delete env.ASC_KEY_ID; delete env.ASC_ISSUER_ID; delete env.ASC_PRIVATE_KEY_PATH;
    const r=spawnSync(process.execPath,[new URL('../scripts/asc-api.mjs',import.meta.url).pathname,
      'POST','/v1/betaGroups/g/relationships/builds','--body',path],{env,encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    assert.equal(JSON.parse(r.stdout).mode,'plan');
  } finally {await rm(dir,{recursive:true,force:true});}
});
