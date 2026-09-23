import {app,BrowserWindow,ipcMain} from 'electron';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createDesktopStore} from '../../src/desktop/desktop-store.mjs';
import {createChatCoordinator} from '../../src/chat-coordinator.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-draft-electron-'));
app.setPath('userData',root);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 let window;
 try{
  const storePath=join(root,'runtime','desktop-store.json');
  const store=createDesktopStore({dataDir:join(root,'runtime'),runsDir:join(root,'runtime/runs'),storePath});
  await store.updateStore(s=>{
   s.projects=[{id:'local-11',name:'Project',path:root}];
   s.sessions['local-11']=Array.from({length:170},(_,i)=>({id:i===0?'CHAT-A':i===1?'CHAT-B':'CHAT-'+i,project_id:'local-11',kind:'chat',title:'Conversation '+i,status:'completed'}));
   for(const session of s.sessions['local-11'])s.messages[session.id]=Array.from({length:10},(_,i)=>({id:session.id+'-'+i,role:'assistant',kind:'text',content:'history '.repeat(750),status:'completed'}));
   return s;
  });
  let fullReads=0,fullWrites=0;
  const coordinator=createChatCoordinator({runManager:{readDesktopStore:store.readControlStore,updateDesktopStore:store.updateControlStore,updateDesktopChatMetadata:store.updateChatMetadata,readDesktopStoreWithMessages:()=>{fullReads++;return store.readStoreWithMessages()},updateDesktopStoreWithMessages:fn=>{fullWrites++;return store.updateStoreWithMessages(fn)}},getCodexExecutable:()=>({command:'codex'})});
  await coordinator.createDraft({session_id:'CHAT-B',project_id:'local-11',text:'',response:'ack'});
  const before=JSON.parse(await readFile(storePath,'utf8')).partitions.message_file;
  fullReads=fullWrites=0;const saves=[];
  ipcMain.handle('test:chat-draft-save',async(_event,input)=>{const start=performance.now();const result=await coordinator.createDraft(input);saves.push({ms:performance.now()-start,bytes:JSON.stringify(result).length,response:input.response});return result});
  window=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{preload:join(here,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}});
  await window.loadFile(join(here,'../../desktop/renderer/index.html'));
  let last=performance.now(),maxDelay=0;
  const timer=setInterval(()=>{const n=performance.now();maxDelay=Math.max(maxDelay,n-last-5);last=n},5);
  try{
   await window.webContents.executeJavaScript(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(300);
    document.querySelector('[data-page="chat"]').click();await wait(100);
    document.querySelector('[data-chat-session-id="CHAT-B"]').click();await wait(100);
    const input=document.getElementById('chatInput');input.focus();
    for(const text of ['中','中文','中文草稿','中文草稿保留']){input.value=text;input.dispatchEvent(new InputEvent('input',{bubbles:true}));await wait(550)}
   })()`);
  }finally{clearInterval(timer)}
  const control=await store.readControlStore();
  console.log(JSON.stringify({saves,fullReads,fullWrites,max_main_loop_delay_ms:maxDelay,draft:control.sessions['local-11'].find(s=>s.id==='CHAT-B').draft,history_unchanged:JSON.parse(await readFile(storePath,'utf8')).partitions.message_file===before}));
 }finally{window?.destroy();await rm(root,{recursive:true,force:true});app.exit(0)}
}).catch(e=>{process.stderr.write(e.stack+'\n');app.exit(1)});
