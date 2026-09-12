import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import electron from 'electron';

test('desktop catalog command runs without RunAsNode or Desktop state initialization', {skip:process.env.ARCORBIT_ELECTRON_CATALOG_TEST!=='1',timeout:20000},async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'catalog-command-')),scope=path.join(root,"scope's file.json"),appState=path.join(root,'app');
 const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true',ARCORBIT_RENDERER_SMOKE_USER_DATA:appState};delete env.ELECTRON_RUN_AS_NODE;
 try {
  await writeFile(scope,JSON.stringify({schema:'arcforge-catalog-scope/v1',stateRoot:root,skills:[]}));
  const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('../desktop/main.mjs',import.meta.url)),'--arcforge-catalog','--renderer-load-smoke','--scope-file',scope,'--action','list'],{env,timeout:15000});
  assert.deepEqual(JSON.parse(stdout),{status:'empty',candidates:[]});
  await assert.rejects(access(appState));await assert.rejects(access(path.join(root,'catalog')));
 } finally {await rm(root,{recursive:true,force:true});}
});
