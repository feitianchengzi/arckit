import { app, BrowserWindow } from 'electron';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url));
const userData=join(tmpdir(),`arcorbit-unified-ui-${process.pid}`);
const output=process.env.ARCORBIT_TEST_OUTPUT || join(tmpdir(),`arcorbit-unified-evidence-${process.pid}`);
app.setPath('userData',userData);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
await mkdir(output,{recursive:true});
const w=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(here,'organization-center-preload.cjs'),sandbox:false,contextIsolation:true}}),errors=[];
w.webContents.on('console-message',(_e,level,message)=>{if(level>=3&&!message.includes('Content Security Policy'))errors.push(message);});
const run=s=>w.webContents.executeJavaScript(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let i=0;i<100;i++){if(await run(expression))return;await delay(50);}throw Error('Timed out: '+expression);}
try{
 await w.loadFile(join(here,'../../desktop/renderer/index.html'));await delay(500);
 await run(`document.querySelector('[data-page="chat"]').click()`);
 await until(`document.querySelector('#chatTranscript').textContent.includes('Auto 执行输出')`);
 assert.ok(await run(`document.querySelector('#chatTranscript').textContent.includes('先前的人工讨论')`));
 await run(`const input=document.querySelector('#chatInput');input.value='执行中补充';input.dispatchEvent(new Event('input',{bubbles:true}));`);
 await until(`!document.querySelector('#chatSendButton').disabled`);
 await run(`document.querySelector('#chatSendButton').click()`);
 await until(`document.querySelector('#chatTranscript').textContent.includes('等待送达')`);
 await run(`arckitDesktop.setTestDelivery('delivered')`);
 await until(`document.querySelector('#chatTranscript').textContent.includes('已送达')`);
 await run(`document.querySelector('#chatStopButton').click()`);
 await until(`!!document.querySelector('[data-resume]')`);
 await run(`document.querySelector('[data-resume]').click()`);
 await until(`document.querySelector('#chatStopButton').textContent.includes('接管')`);
 const calls=await run('arckitDesktop.getUnifiedCalls()');assert.equal(calls.filter(x=>x[0]==='send').length,1);assert.equal(calls.filter(x=>x[0]==='auto.resume').length,1);
 await writeFile(join(output,'unified-desktop.png'),(await w.webContents.capturePage()).toPNG());
 w.setSize(430,800);await delay(200);
 assert.ok(await run('document.documentElement.scrollWidth <= innerWidth+1'));
 await writeFile(join(output,'unified-narrow.png'),(await w.webContents.capturePage()).toPNG());
 await run('arckitDesktop.setAutoFinished()');
 await until(`document.querySelector('#chatStopButton').classList.contains('hidden') && !document.querySelector('[data-resume]')`);
 assert.deepEqual(errors,[]);
 // Exercise the maintained interaction prototype independently from the production UI fixture.
 await w.loadFile(resolve(here,'../../../../arckit/interaction/chat-workspace/default.html'),{query:{autoplay:'off'}});await delay(100);
 await run(`TaskConversationPrototype.scenario('auto-running');ChatModel.current().draft='补充样本';ChatModel.send();ChatPrototype.render();`);
 assert.ok(await run(`document.body.textContent.includes('等待送达')`));
 await run('ChatPrototype.tick()');assert.ok(await run(`document.body.textContent.includes('已送达')`));
 const thread=await run('ChatModel.current().thread');
 await run(`document.querySelector('[data-task-conversation=pause]').click()`);
 assert.ok(await run(`document.body.textContent.includes('讨论不自动恢复')`));
 await run(`document.querySelector('[data-task-conversation=resume]').click()`);
 assert.equal(await run('ChatModel.current().thread'),thread);
 await writeFile(join(output,'prototype-narrow.png'),(await w.webContents.capturePage()).toPNG());
 const result={checks:['continuous history','supplement queue and receipt','pause and explicit resume','narrow layout','late Auto completion refresh','prototype same-thread interaction'],errors,output};
 await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){console.error(error);process.exitCode=1;}finally{w.destroy();await rm(userData,{recursive:true,force:true});app.quit();}

}).catch(error=>{console.error(error);app.exit(1);});
