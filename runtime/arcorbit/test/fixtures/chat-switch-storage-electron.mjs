import {app,BrowserWindow,ipcMain} from 'electron';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createDesktopStore} from '../../src/desktop/desktop-store.mjs';
import {createChatCoordinator} from '../../src/chat-coordinator.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-switch-electron-'));
app.setPath('userData',root);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 let window;
 try{
  const storePath=join(root,'runtime','desktop-store.json');
  const store=createDesktopStore({dataDir:join(root,'runtime'),runsDir:join(root,'runtime/runs'),storePath});
  await store.updateStore(s=>{
   s.projects=[{id:'local-11',name:'ArcOrbit Local',path:root}];
   s.sessions['local-11']=Array.from({length:170},(_,i)=>({id:i===0?'CHAT-A':i===1?'CHAT-B':'CHAT-'+i,project_id:'local-11',kind:'chat',title:'Conversation '+i,status:'completed',created_at:new Date(2026,8,19,0,0,170-i).toISOString()}));
   for(const session of s.sessions['local-11'])s.messages[session.id]=Array.from({length:session.id==='CHAT-B'?500:10},(_,i)=>({id:session.id+'-'+i,role:'assistant',kind:'text',content:'Message '+i+'\n\n'+('A paragraph with **formatting** and code.\n\n').repeat(session.id==='CHAT-B'?4:140),status:'completed'}));
   s.messages['CHAT-A']=[{id:'SHORT',role:'assistant',kind:'text',content:'Short conversation',status:'completed'}];
   return s;
  });
  let fullReads=0,fullWrites=0;
  const coordinator=createChatCoordinator({runManager:{readDesktopStore:store.readControlStore,updateDesktopStore:store.updateControlStore,readDesktopChatMetadata:store.readChatMetadata,readDesktopChatSnapshotStore:store.readChatSnapshotStore,updateDesktopChatMetadata:store.updateChatMetadata,readDesktopStoreWithMessages:()=>{fullReads++;return store.readStoreWithMessages()},updateDesktopStoreWithMessages:fn=>{fullWrites++;return store.updateStoreWithMessages(fn)}},getCodexExecutable:()=>({command:'codex'})});
  await coordinator.select({session_id:'CHAT-A'});
  const before=JSON.parse(await readFile(storePath,'utf8')).partitions;
  fullReads=fullWrites=0;const selections=[],drafts=[];
  ipcMain.handle('test:chat-switch-snapshot',(_event,input)=>coordinator.getSnapshot(input));
  ipcMain.handle('test:chat-switch-draft',async(_event,input)=>{drafts.push({session_id:input.session_id,response:input.response});return coordinator.createDraft(input)});
  ipcMain.handle('test:chat-switch-select',async(_event,input)=>{const start=performance.now();const result=await coordinator.select(input);selections.push({ms:performance.now()-start,messages:result.messages.length});return result});
  window=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{preload:join(here,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}});
  await window.loadFile(join(here,'../../desktop/renderer/index.html'));
  let last=performance.now(),maxDelay=0;
  const timer=setInterval(()=>{const n=performance.now();maxDelay=Math.max(maxDelay,n-last-5);last=n},5);
  let renderer;
  try{
   renderer=await window.webContents.executeJavaScript(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(300);
    document.querySelector('[data-page="chat"]').click();await wait(100);
    const samples=[],transcript=document.getElementById('chatTranscript');
    for(const id of ['CHAT-B','CHAT-A','CHAT-B','CHAT-A']){
     const input=document.getElementById('chatInput');input.value='切换前中文草稿';input.dispatchEvent(new InputEvent('input',{bubbles:true}));
     const start=performance.now();document.querySelector('[data-chat-session-id="'+id+'"]').click();
     while(!document.querySelector('[data-chat-session-id="'+id+'"]').classList.contains('is-active')){if(performance.now()-start>3000)throw Error('switch timed out');await wait(1)}
     const rendered=performance.now();void transcript.scrollHeight;const laidOut=performance.now();
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     samples.push({id,visible_ms:laidOut-start,settled_ms:performance.now()-start,messages:transcript.querySelectorAll('[data-conversation-message-id]').length,bottom:transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight});
    }
    return samples;
   })()`);
  }finally{clearInterval(timer)}
  const metadata=await store.readChatMetadata();
  const result={selections,drafts,renderer,fullReads,fullWrites,max_main_loop_delay_ms:maxDelay,saved_drafts:metadata.sessions['local-11'].filter(s=>['CHAT-A','CHAT-B'].includes(s.id)).map(s=>s.draft),partitions_unchanged:JSON.stringify(JSON.parse(await readFile(storePath,'utf8')).partitions)===JSON.stringify(before)};
  await new Promise(resolve=>process.stdout.write(JSON.stringify(result)+'\n',resolve));
 }finally{window?.destroy();await rm(root,{recursive:true,force:true})}
 app.exit(0);
}).catch(e=>{process.stderr.write(e.stack+'\n');app.exit(1)});
