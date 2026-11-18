import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {saveConnection} from '../scripts/asc-setup.mjs';
import {listProfiles,loadProfile} from '../scripts/asc-auth.mjs';

test('UI helper verifies before save and returns only a receipt, preserving verified key bytes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'asc-ui-'));
  try {
    const root=join(dir,'profiles'), keyPath=join(dir,'source.p8');
    const pem=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey.export({type:'pkcs8',format:'pem'});
    await writeFile(keyPath,pem,{mode:0o600});
    const input={profile:'team',keyId:'SECRETID',issuerId:'00000000-0000-0000-0000-000000000000',keyPath};
    for(const [status,code] of [[401,'authentication_failed'],[403,'permission_denied'],[429,'rate_limited']]){
      const receipt=await saveConnection(input,{root,fetchImpl:async()=>new Response(JSON.stringify({errors:[{detail:pem}]}),{status})});
      assert.deepEqual(receipt,{status:'error',code});
      assert.deepEqual(await listProfiles(root),[]);
    }
    const receipt=await saveConnection(input,{root,fetchImpl:async()=>{
      await writeFile(keyPath,'changed after validation');
      return new Response(JSON.stringify({data:[{id:'private-app'}]}),{status:200});
    }});
    assert.deepEqual(receipt,{status:'saved',profile:'team',connectionVerified:true});
    assert.equal((await loadProfile('team',root)).privateKey,pem);
    await writeFile(keyPath,pem);
    const duplicate=await saveConnection(input,{root,fetchImpl:async()=>new Response('{"data":[]}',{status:200})});
    assert.deepEqual(duplicate,{status:'error',code:'profile_exists'});
    assert.equal(JSON.stringify(receipt).includes(input.keyId),false);
    assert.equal(JSON.stringify(receipt).includes(keyPath),false);
  }finally{await rm(dir,{recursive:true,force:true});}
});
