import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {copyDistributionTree} from '../scripts/distribution-files.mjs';
import {treeManifest} from '../src/skill-files.mjs';

test('distribution copies omit host metadata before strict manifests are generated',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'distribution-files-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const source=path.join(root,'source'),target=path.join(root,'target');
  for(const name of ['SKILL.md','.DS_Store','references/Thumbs.db','.Trashes/junk','references/real.md']) {
    await mkdir(path.dirname(path.join(source,name)),{recursive:true});
    await writeFile(path.join(source,name),name);
  }
  await copyDistributionTree(source,target);
  assert.deepEqual((await treeManifest(target)).map(x=>x.path),['references/real.md','SKILL.md']);
});
