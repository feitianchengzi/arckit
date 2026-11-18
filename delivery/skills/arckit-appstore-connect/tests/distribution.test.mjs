import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, access, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('connection tools execute from a discovered non-sibling installation path',async()=>{
  const root=await mkdtemp(join(tmpdir(),'arckit-apple-distribution-'));
  try {
    const skill=new URL('../',import.meta.url);
    await cp(skill,join(root,'skill'),{recursive:true});
    const env={...process.env};
    delete env.ASC_KEY_ID;delete env.ASC_ISSUER_ID;delete env.ASC_PRIVATE_KEY_PATH;
    for(const file of ['asc-api.mjs','asc-submission.mjs','asc-upload.mjs']) {
      const r=spawnSync(process.execPath,[join(root,'skill/scripts',file),'--help'],{cwd:root,env,encoding:'utf8'});
      assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.length>0);
    }
    const request=join(root,'request.json');
    await writeFile(request,JSON.stringify({data:{type:'reviewSubmissions',id:'s',attributes:{submitted:true}}}));
    const args=[join(root,'skill/scripts/asc-api.mjs'),'PATCH','/v1/reviewSubmissions/s','--scope','submission','--body',request];
    const denied=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8'});
    assert.notEqual(denied.status,0);
    const plan=spawnSync(process.execPath,[...args,'--confirm-submission','s'],{cwd:root,env,encoding:'utf8'});
    assert.equal(plan.status,0,plan.stderr);assert.equal(JSON.parse(plan.stdout).mode,'plan');
  } finally {await rm(root,{recursive:true,force:true});}
});

for (const name of ['arckit-appstore-testflight','arckit-appstore-submission']) {
  test(`${name} declares a required connection and has no duplicated tools`, async()=>{
    const skill=new URL(`../../${name}/`,import.meta.url);
    await assert.rejects(access(new URL('scripts/',skill)));
    const main=await readFile(new URL('SKILL.md',skill),'utf8');
    assert.match(main,/必需依赖/);
    assert.match(main,/arckit-appstore-connect/);
    const contract=await readFile(new URL('references/connection-dependency.md',skill),'utf8');
    assert.match(contract,/blocked_missing_dependency/);
    assert.match(contract,/<connect-root>/);
    assert.match(contract,/不假定同级安装目录/);
  });
}
