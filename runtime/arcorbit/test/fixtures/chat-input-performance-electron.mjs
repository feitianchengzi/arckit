import { app, BrowserWindow } from 'electron';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const fixtureDir=dirname(fileURLToPath(import.meta.url));
const userData=join(tmpdir(),`arcorbit-chat-input-${process.pid}`);
app.setPath('userData',userData);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{preload:join(fixtureDir,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}});
 try{
  await window.loadFile(join(fixtureDir,'../../desktop/renderer/index.html'));
  const result=await window.webContents.executeJavaScript(`(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(300);
   document.querySelector('[data-page="chat"]').click();await wait(100);
   document.querySelector('[data-chat-session-id="CHAT-B"]').click();await wait(100);
   await window.arckitDesktop.setTestChatNativeTaskCount(2000);
   document.querySelector('#chatNativeInvoke').click();await wait(100);document.querySelector('.chat-capability-menu [data-close]').click();
   const input=document.getElementById('chatInput');
   let mutations=0;const observer=new MutationObserver(records=>{mutations+=records.length});
   observer.observe(document.querySelector('.chat-native-identity'),{childList:true,subtree:true});
   const start=performance.now();
   for(let i=0;i<100;i++){input.value+='中';input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'中'}));}
   const elapsed=performance.now()-start;await wait(0);observer.disconnect();
   await window.arckitDesktop.setTestChatNativeDelay(4200);
   const before=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   document.querySelector('#chatNativeInvoke').click();document.querySelector('.chat-capability-menu [data-close]').click();
   await wait(3100);input.value+='文';input.dispatchEvent(new InputEvent('input',{bubbles:true}));
   await wait(1400);
   const after=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   const taskListPresent=!!document.querySelector('.chat-native-task-list');
   const callsBeforeStream=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   await window.arckitDesktop.emitTestChatStream({count:50,interval_ms:1});await wait(150);
   const callsAfterStream=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   await wait(6300);
   const idleBefore=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   input.value+='字';input.dispatchEvent(new InputEvent('input',{bubbles:true}));await wait(20);
   const idleAfter=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='chatNativeCatalog').length;
   input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
   input.value+='中文';input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));
   input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));
   input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));await wait(400);
   const saved=(await window.arckitDesktop.getTestCalls()).filter(([name])=>name==='createChat').at(-1)?.[1]?.text;
   return {draft_saved:saved===input.value,catalog_calls_from_stream:callsAfterStream-callsBeforeStream,elapsed_ms:elapsed,identity_mutations:mutations,slow_request_calls:after-before,task_list_present:taskListPresent,calls_from_typing_after_idle:idleAfter-idleBefore,draft:input.value};
  })()`);

  process.stdout.write(JSON.stringify(result)+'\n');
 }finally{window.destroy();await rm(userData,{recursive:true,force:true});app.exit(0)}
}).catch(e=>{process.stderr.write(e.stack+'\n');app.exit(1)});
