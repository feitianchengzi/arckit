import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

test('unified task Chat renders continuous history, delivery and explicit takeover in Electron', {
  skip: process.env.ARCORBIT_UNIFIED_CONVERSATION_FIXTURE !== '1' && 'set ARCORBIT_UNIFIED_CONVERSATION_FIXTURE=1',
}, async () => {
  const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
  const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/unified-conversation-electron.mjs',import.meta.url))],{env,timeout:30000,maxBuffer:1024*1024});
  const result=JSON.parse(stdout.trim());assert.equal(result.checks.length,6);assert.deepEqual(result.errors,[]);
});
