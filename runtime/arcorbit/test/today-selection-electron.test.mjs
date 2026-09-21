import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
import test from 'node:test';
import {electronFixtureArguments} from './electron-fixture-launch.mjs';
test('Today follows viewed workset scope while project clicks remain local',{
 skip:process.env.ARCORBIT_ELECTRON_TODAY_SELECTION_TEST!=='1'&&'set ARCORBIT_ELECTRON_TODAY_SELECTION_TEST=1 to run Electron'
},async()=>{
 const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await promisify(execFile)(electron,electronFixtureArguments(fileURLToPath(new URL('./fixtures/today-selection-electron.mjs',import.meta.url))),{env,timeout:25000});
 const result=JSON.parse(stdout.trim());assert.equal(result.ok,true);assert.deepEqual(result.errors,[]);
});
