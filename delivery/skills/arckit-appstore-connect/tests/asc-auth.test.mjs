import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, stat, chmod, symlink, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {registerProfile, loadProfile, listProfiles} from '../scripts/asc-auth.mjs';
import {jwt} from '../scripts/asc-api.mjs';

test('persistent profiles survive fresh reads, protect files and reject overwrite and unsafe storage', async()=>{
  const dir=await mkdtemp(join(tmpdir(),'asc-auth-'));
  try {
    const root=join(dir,'store'), source=join(dir,'key.p8');
    const pem=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey.export({type:'pkcs8',format:'pem'});
    await writeFile(source,pem,{mode:0o600});
    const issuer='00000000-0000-0000-0000-000000000000';
    assert.deepEqual(await listProfiles(root),[]);
    assert.deepEqual(await registerProfile('team','TEST',issuer,source,root),{profile:'team',stored:true});
    assert.deepEqual(await listProfiles(root),['team']);
    const p=await loadProfile('team',root);
    assert.equal(jwt({ASC_KEY_ID:p.keyId,ASC_ISSUER_ID:p.issuerId},p.privateKey).split('.').length,3);
    assert.equal((await stat(root)).mode & 0o777,0o700);
    assert.equal((await stat(join(root,'team.json'))).mode & 0o777,0o600);
    await assert.rejects(registerProfile('team','TEST',issuer,source,root),{code:'EEXIST'});
    await assert.rejects(loadProfile('../team',root),/Invalid profile/);
    await symlink(join(root,'team.json'),join(root,'alias.json'));
    await assert.rejects(loadProfile('alias',root),/Unsafe/);
    await chmod(join(root,'team.json'),0o644);
    await assert.rejects(loadProfile('team',root),/Unsafe/);
    await writeFile(source,'not a key');
    await assert.rejects(registerProfile('bad','TEST',issuer,source,root),/Invalid private key/);
    assert.equal((await listProfiles(root)).includes('bad'),false);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('API uses persisted profile in a fresh process without ASC environment and overrides conflicting environment', async()=>{
  const dir=await mkdtemp(join(tmpdir(),'asc-profile-client-'));
  try {
    const source=join(dir,'key.p8');
    const pem=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey.export({type:'pkcs8',format:'pem'});
    await writeFile(source,pem,{mode:0o600});
    await registerProfile('team','PROFILE','00000000-0000-0000-0000-000000000000',source,join(dir,'.config','arckit','appstore-connect'));
    const code = `
      const {main}=await import(process.argv[1]);
      globalThis.fetch=async(url,options)=>{
        const head=JSON.parse(Buffer.from(options.headers.Authorization.split(' ')[1].split('.')[0],'base64url'));
        if(head.kid!=='PROFILE')throw Error('Wrong credential source');
        return new Response(JSON.stringify({data:[]}),{status:200});
      };
      await main(['GET','/v1/apps','--profile','team']);
    `;
    for(const conflict of [false,true]){
      const env={...process.env,HOME:dir};
      delete env.ASC_KEY_ID;delete env.ASC_ISSUER_ID;delete env.ASC_PRIVATE_KEY_PATH;
      if(conflict)Object.assign(env,{ASC_KEY_ID:'WRONG',ASC_ISSUER_ID:'WRONG',ASC_PRIVATE_KEY_PATH:'/missing'});
      const result=spawnSync(process.execPath,['--input-type=module','-e',code,new URL('../scripts/asc-api.mjs',import.meta.url).href],{env,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
      assert.equal(JSON.parse(result.stdout).status,200);
      assert.equal(result.stdout.includes('PRIVATE KEY'),false);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
