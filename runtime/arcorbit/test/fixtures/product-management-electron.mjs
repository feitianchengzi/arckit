import { app,BrowserWindow,ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname,join } from 'node:path';
import { mkdtemp,mkdir,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as protocol from '../../../../definition/skills/arckit-product-assets/scripts/product-assets.mjs';
import { runProductCommand } from '../../src/product-git.mjs';
import { createProductCoordinator } from '../../src/product-coordinator.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root=await mkdtemp(join(tmpdir(),'arcorbit-product-ui-'));app.setPath('userData',join(root,'electron'));process.env.ARCORBIT_PRODUCT_FIXTURE='1';
await app.whenReady();const errors=[];let product;
try {
 const material=join(root,'demo');await mkdir(material);await writeFile(join(material,'README.md'),'Prototype for creative people');
 const platform={projects:[],organizations:[],active_workset:{id:'current',project_ids:[]},errors:[]};
 product=createProductCoordinator({runCommand:async(bin,args,options)=>{if(bin==='gh')throw new Error('No test GitHub account');return runProductCommand(bin,args,options);},dataDir:join(root,'products'),protocol,skillPath:join(root,'SKILL.md'),getPlatform:async()=>structuredClone(platform),getAccountScope:async()=> 'fixture:user',getSettings:async()=>({}),getCodexExecutable:()=> 'codex',
 executePlatform:async(_action,input)=>{const r={id:'11',name:input.name,git_url:input.git_url};platform.projects.push(r);return r;},bindWorkspace:async(id,path)=>{platform.projects.find(p=>p.id===id).local_project_path=path;platform.active_workset.project_ids=[id];},
 createAdapter:()=>({async *runTurn({options}){await options.onThreadBound({threadId:'IDEA-THREAD'});yield {type:'codex.turn.started',turn_id:'IDEA-TURN'};const p=await options.dynamicToolProvider({tool:'product_context',arguments:{}});if(p.approved_digest)await options.dynamicToolProvider({tool:'product_execute',arguments:{approved_digest:p.approved_digest}});else await options.dynamicToolProvider({tool:'product_propose',arguments:{revision:p.record.revision,patch:{description:'帮助创意同学正式管理 Demo'},plan:{mode:'create',name:'Demo',organization_id:'',repository:'existing',git_url:'https://github.com/example/demo',directory:'material'},reason:'已准备接入建议'}});yield {type:'codex.item.completed',params:{item:{type:'agentMessage',id:'reply',text:'建议已经准备好，请在左侧审阅。'}}};yield {type:'codex.turn.completed',turn:{status:'completed'}};},async interrupt(){},close(){}})
 });
 ipcMain.handle('fixture:product-snapshot',(_e,input={})=>input.refresh?product.refresh():product.snapshot());
 ipcMain.handle('fixture:product-detail',(_e,id)=>product.detail(id));ipcMain.handle('fixture:product-command',(_e,a,i)=>product.command(a,i));ipcMain.handle('fixture:product-chat',(_e,i)=>product.chatAction(i));ipcMain.handle('fixture:product-pick',(_e,i={})=>i.id?product.chooseMaterial(i.id,material):product.command('create',{material_path:material}));
 const window=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{preload:join(here,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}});
 product.onEvent(event=>window.webContents.send('fixture:product-event',event));
 window.webContents.on('console-message',(_e,level,message)=>{if(level>=2)errors.push(message);});
 await window.loadFile(join(here,'../../desktop/renderer/index.html'));
 const result=await window.webContents.executeJavaScript(`(async()=>{
  const wait=async(fn,label)=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw new Error('Timeout: '+label);};
  const click=s=>{const e=document.querySelector(s);if(!e)throw new Error('Missing '+s);e.click();};
  const input=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
  await wait(()=>document.querySelector('#desktopShell')?.classList.contains('hidden')===false || document.querySelector('[data-page="idea"]'),'app');
  await new Promise(r=>setTimeout(r,200));click('[data-page="idea"]');
  await wait(()=>document.querySelector('#ideaListHost [data-product-action="new"]'),'Idea list');click('#ideaListHost [data-product-action="new"]');
  await wait(()=>!document.querySelector('#ideaStart').classList.contains('hidden'),'start');click('#ideaFolder');
  await wait(()=>document.querySelector('#ideaEditor [data-product-action="review-save"]')&&!document.querySelector('#ideaEditor [data-product-action="review-save"]').disabled,'auto analysis');
  const before=document.querySelector('#ideaEditor [data-field="description"]').value;
  input('#ideaEditor [data-field="description"]','帮助创意同学正式管理 Demo');click('#ideaEditor [data-product-action="review-save"]');
  await wait(()=>document.querySelector('#ideaEditor [data-product-action="approve-agent"]'),'saved');
  click('#ideaEditor [data-product-action="approve-agent"]');click('#ideaEditor [data-product-action="confirm-agent"]');
  await wait(()=>document.querySelector('#ideaStatus').textContent.includes('已录入'),'formal intake');
  const status=document.querySelector('#ideaStatus').textContent;
  const text=document.querySelector('#ideaTranscript').textContent;
  click('#ideaEditor [data-product-action="detail"]');await wait(()=>document.querySelector('#productDetailHost [data-tab="relations"]'),'detail');
  const detail=document.querySelector('#productDetailHost').textContent;
  click('[data-page="idea"]');await wait(()=>document.querySelector('#ideaListHost .product-card'),'recovered list');
  const list=document.querySelector('#ideaListHost').textContent;
  click('[data-page="today"]');await wait(()=>document.querySelector('#todayProductContinuity [data-resume]'),'Today resume');
  return {before,status,text,detail,list,bodyOverflow:document.body.scrollWidth>innerWidth};
 })()`);
 const records=await product.refresh();const files=await protocol.readRecord(material);
 await window.webContents.executeJavaScript(`document.querySelector('[data-page="idea"]').click()`);
 await window.capturePage().then(image=>writeFile('/private/tmp/arcorbit-idea-production.png',image.toPNG()));
 process.stdout.write(JSON.stringify({result,formal_count:records.ideas.filter(p=>p.kind==='formal').length,stored_idea:Boolean(files?.idea),errors}));window.destroy();
} catch(e){process.stderr.write(e.stack+'\n');process.exitCode=1;}finally{await product?.close();await rm(root,{recursive:true,force:true});app.quit();}
