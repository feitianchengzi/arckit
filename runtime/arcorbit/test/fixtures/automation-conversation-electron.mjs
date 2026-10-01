import {app,BrowserWindow} from 'electron';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),userData=join(tmpdir(),`auto-view-${process.pid}`),output=process.env.ARCORBIT_TEST_OUTPUT||join(tmpdir(),`auto-view-evidence-${process.pid}`);
app.setPath('userData',userData);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(here,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}}),errors=[];
 w.webContents.on('console-message',(_e,level,text)=>{if(level>=3)errors.push(text);});
 const run=s=>w.webContents.executeJavaScript(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async s=>{for(let i=0;i<100;i++){if(await run(s))return;await sleep(50);}throw Error('Timed out: '+s);};
 try{
  await mkdir(output,{recursive:true});await w.loadFile(join(here,'../../desktop/renderer/index.html'));await sleep(300);
  await run(`document.querySelector('[data-page="command"]').click()`);await until(`!!document.querySelector('#reviewRunButton')`);
  const point=await run(`window.savedReviewButton=document.querySelector('#reviewRunButton');const r=savedReviewButton.getBoundingClientRect();({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})`);
  w.webContents.sendInputEvent({type:'mouseMove',...point});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});
  for(let i=0;i<4;i++){await run('arckitDesktop.publishAutoViewProgress()');await sleep(180);}
  assert.ok(await run(`savedReviewButton===document.querySelector('#reviewRunButton') && savedReviewButton.isConnected`));
  w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
  await until(`document.querySelector('[data-page-view="workbench"]').classList.contains('is-active')`);
  await until(`document.querySelector('#transcriptList').textContent.includes('人工讨论历史')`);
  assert.ok(await run(`document.querySelector('#transcriptList').textContent.includes('自动执行历史')`));
  assert.ok(await run(`document.querySelector('#workbenchContext').textContent.includes('AUTO-SESSION') && document.querySelector('#workbenchEvidence').textContent.includes('SHARED-THREAD')`));
  await run('arckitDesktop.publishAutoViewMessage()');await until(`document.querySelector('#transcriptList').textContent.includes('已送达')`);
  const stats=await run('arckitDesktop.getAutoViewStats()');assert.equal(stats.opens,0);assert.equal(stats.sync,0);assert.ok(stats.activity>=4);
  assert.ok(await run(`!document.querySelector('[data-page-view="chat"]').classList.contains('is-active')`));
  await writeFile(join(output,'automation-workbench.png'),(await w.webContents.capturePage()).toPNG());
  await run(`document.querySelector('[data-page="command"]').click();window.historyButton=document.querySelector('[data-history-open]')`);
  await run('arckitDesktop.publishAutoViewSnapshot()');await sleep(300);
  assert.ok(await run(`historyButton===document.querySelector('[data-history-open]')`));
  await run('historyButton.click()');await until(`document.querySelector('[data-page-view="workbench"]').classList.contains('is-active')`);
  assert.deepEqual(errors,[]);const result={status:'passed',checks:['stable mouse-down/up across progress updates','Auto three-panel navigation','shared messages and receipt','no task open or sync','stable history actions'],stats,errors};
  await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){console.error(e);app.exitCode=1;process.exitCode=1;}finally{w.destroy();await rm(userData,{recursive:true,force:true});app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
