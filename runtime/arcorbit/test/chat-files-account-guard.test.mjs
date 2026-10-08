import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../desktop/main.mjs',import.meta.url),'utf8');
const source=main.slice(main.indexOf('  ipcMain.handle("arckit:auth-login"'),main.indexOf('  ipcMain.handle("arckit:automation-snapshot"'));
function fixture(allowed){const handlers=new Map(),calls=[];const context={ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},chatFilesLeave:{request:async()=>{calls.push('file-guard');return allowed;}},chatGit:{close:()=>calls.push('git-close')},
 workshopService:{loginWithCode:async()=>{calls.push('login');return {};},logout:async()=>{calls.push('logout');return {};},getAuthStatus:async()=>({})},
 workSyncCoordinator:{reconcile:async()=>{},clearSession:async()=>{}},productFeedbackService:{refreshUnread:async()=>{},resetSession:()=>{}},
 automationCoordinator:{getSnapshot:async()=>({active_executions:[{id:'run'}]}),stopAll:async()=>calls.push('stop'),clearRemoteSession:async()=>{}},releaseCoordinator:{closeScope:async()=>calls.push('release-close')},projectWorkbench:{close:async()=>calls.push('workbench-close')}};
 vm.createContext(context);vm.runInContext(source,context);return {handlers,calls};}
test('actual account handlers cancel before credentials, scope disposal or running work changes',async()=>{const f=fixture(false);await assert.rejects(f.handlers.get('arckit:auth-login')({},{}),/取消/);await assert.rejects(f.handlers.get('arckit:auth-logout')({},{confirm_active_task:true}),/取消/);assert.deepEqual(f.calls,['file-guard','file-guard']);});
test('account transition proceeds only after file guard resolves',async()=>{const f=fixture(true);await f.handlers.get('arckit:auth-login')({},{});await f.handlers.get('arckit:auth-logout')({},{confirm_active_task:true});assert.deepEqual(f.calls,['file-guard','login','git-close','file-guard','stop','release-close','git-close','workbench-close','logout']);});
test('actual quit handler asks before stopping runtime and only cleans up after approval',async()=>{
 const source=main.slice(main.indexOf('app.on("before-quit"'),main.indexOf('\nasync function createMainWindow'));
 // Limit evaluation to the event registration, regardless of intervening helpers.
 const registration=source.slice(0,source.indexOf('\n});')+4);
 for(const allowed of [false,true]){
  let handler;const calls=[];
  const context={quitAfterCleanup:false,runManager:{abortActiveRuns:async()=>calls.push('abort')},chatFilesLeave:{request:async()=>{calls.push('guard');return allowed;}},chatGit:{close:()=>calls.push('git-close')},app:{on:(_name,fn)=>handler=fn,quit:()=>calls.push('quit')},powerMonitor:{removeListener:()=>{}},handleSystemResume:()=>{},console};
  for(const name of ['syncTimer','realtimeSubscriptionTimer','productFeedbackUnreadTimer','workshopRealtimeAdapter','automationCoordinator','chatCoordinator','chatNative','projectWorkbench','workbenchAgentBridge','releaseCoordinator','productCoordinator','productFeedbackService','imageViewer','skillProvisioningManager','codexSetupManager'])context[name]=null;
  vm.createContext(context);vm.runInContext(registration,context);await handler({preventDefault:()=>calls.push('prevent')});
  assert.deepEqual(calls,allowed?['prevent','guard','git-close','abort','quit']:['prevent','guard']);assert.equal(context.quitAfterCleanup,allowed);
 }
});
