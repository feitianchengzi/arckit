import {app,BrowserWindow} from 'electron';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-switch-layout-'));
app.setPath('userData',root);app.disableHardwareAcceleration();
const input=process.env.ARCORBIT_CHAT_LAYOUT_DATA?JSON.parse(await readFile(process.env.ARCORBIT_CHAT_LAYOUT_DATA,'utf8')):null;
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{contextIsolation:true,sandbox:false}});
 try{
  await win.loadFile(join(here,'../../desktop/renderer/index.html'));
  const result=await win.webContents.executeJavaScript(String.raw`(async()=>{
   const {createConversationSurface}=await import('./conversation-surface.mjs');
   const input=${JSON.stringify(input)};
   const messages=input?.[1]?.messages || Array.from({length:500},(_,i)=>({id:'M'+i,role:i%4===0?'user':'assistant',kind:'text',status:'completed',content:'Message '+i+'\n\n'+('A detailed paragraph with **bold text** and code.\n\n').repeat(i%6+1)+'\n\n\x60\x60\x60js\nconst answer = '+i+';\n\x60\x60\x60'}));
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   document.body.innerHTML='';
   function mount(defer){
    const element=document.createElement('div'),jumpButton=document.createElement('button');
    element.className='conversation-surface';element.style.cssText='height:700px;width:950px;display:grid';
    document.body.replaceChildren(element,jumpButton);
    const copied=[],approved=[],opened=[];
    const surface=createConversationSurface({element,jumpButton,deferOffscreenLayout:defer,clipboard:{writeText:async text=>copied.push(text)},onApproval:(m,d)=>approved.push([m.id,d]),onExternalLink:url=>opened.push(url)});
    return {element,jumpButton,surface,copied,approved,opened};
   }
   const samples=[];
   for(const defer of [false,true]){
    const {element,surface}=mount(defer);
    for(let i=0;i<3;i++){
     const start=performance.now();surface.render({contextId:'long-'+i,messages});const rendered=performance.now();
     void element.scrollHeight;const laidOut=performance.now();
     await wait(100);
     samples.push({defer,dom_ms:rendered-start,layout_ms:laidOut-rendered,at_bottom:element.scrollHeight-element.scrollTop-element.clientHeight,messages:element.querySelectorAll('[data-conversation-message-id]').length});
    }
   }
   const {element,jumpButton,surface,copied,approved,opened}=mount(true);
   const history=messages.map(m=>({...m}));
   history[0]={id:'EARLY',role:'assistant',kind:'text',status:'completed',content:'EARLYHISTORYSEARCHTARGET\n\n\x60\x60\x60js\nconst old = 1;\n\x60\x60\x60\n\n[Docs](https://example.com/docs)'};
   history[1]={id:'APPROVAL',kind:'approval',status:'pending',content:'Approve older action',approval_request_id:'REQ'};
   surface.render({contextId:'reading',messages:history});await wait(100);
   const visibleAnchor=()=>{
    const top=element.getBoundingClientRect().top+element.clientTop;
    const node=[...element.children].find(n=>n.dataset.conversationMessageId&&n.getBoundingClientRect().bottom>top);
    return node?{id:node.dataset.conversationMessageId,offset:node.getBoundingClientRect().top-top}:null;
   };
   element.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));
   const middle=element.children[240];middle.scrollIntoView({block:'start'});element.scrollTop+=35;
   element.dispatchEvent(new Event('scroll'));await wait(100);
   const before=visibleAnchor();
   surface.render({contextId:'other',messages:[{id:'OTHER',role:'assistant',kind:'text',content:'Other session'}]});await wait(50);
   element.style.width='800px';
   surface.render({contextId:'reading',messages:history});await wait(150);
   const restored=visibleAnchor();
   const last=history[history.length-1];last.status='streaming';
   for(let i=0;i<12;i++){last.content+=' delta '+i;surface.render({contextId:'reading',messages:history});await wait(10)}
   const afterStream=visibleAnchor(),jumpVisible=!jumpButton.classList.contains('hidden');
   history.push({id:'NEW',role:'assistant',kind:'text',content:'New message after stream'});
   surface.render({contextId:'reading',messages:history});await wait(100);
   const afterAppend=visibleAnchor();
   // User history is still available, including actions far outside initial viewport.
   element.children[0].scrollIntoView({block:'start'});await wait(100);
   element.querySelector('[data-conversation-copy-code]').click();
   element.querySelector('[data-conversation-approval]').click();
   element.querySelector('[data-task-markdown-external-link]').click();
   await wait(20);
   const searchable=window.find('EARLYHISTORYSEARCHTARGET');window.getSelection()?.removeAllRanges();
   jumpButton.click();await wait(1000);
   for(let i=0;i<6;i++){last.content+='\n\nLatest paragraph '+i;surface.render({contextId:'reading',messages:history});await wait(20)}
   const bottomDistance=element.scrollHeight-element.scrollTop-element.clientHeight;
   // A pending restore may never reposition a new context or override user input.
   element.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));
   element.children[240].scrollIntoView({block:'start'});element.dispatchEvent(new Event('scroll'));await wait(50);
   surface.render({contextId:'other',messages:[]});
   surface.render({contextId:'reading',messages:history});
   element.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));element.scrollTop=0;
   element.dispatchEvent(new Event('scroll'));await wait(100);
   return {samples,reading:{before,restored,afterStream,afterAppend,jumpVisible},history:{count:element.querySelectorAll('[data-conversation-message-id]').length,copied,approved,opened,searchable},bottomDistance,userScrollTop:element.scrollTop};
  })()`);
  console.log(JSON.stringify(result));
 }finally{win.destroy();await rm(root,{recursive:true,force:true})}
 app.exit(0);
}).catch(e=>{process.stderr.write(e.stack+'\n');app.exit(1)});
