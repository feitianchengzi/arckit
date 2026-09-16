const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'arcorbit-unified-work-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1500,height:1020,show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 const errors=[],requests=[],checks=[],geometry=[];
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=3&&!message.includes('Content Security Policy'))errors.push(message);});
 win.webContents.on('render-process-gone',(_e,d)=>errors.push(JSON.stringify(d)));
 win.webContents.session.webRequest.onBeforeRequest((details,callback)=>{if(/^https?:/.test(details.url))requests.push(details.url);callback({cancel:/^https?:/.test(details.url)});});
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const run=code=>win.webContents.executeJavaScript(code);
 const get=code=>run(`(()=>{const M=window.WorkModel;return (${code});})()`);
 const click=async selector=>{await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing: '+${JSON.stringify(selector)});if(e.disabled)throw Error('Disabled: '+${JSON.stringify(selector)});e.click();})()`);await wait(40);};
 const fill=async(selector,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const change=async(selector,value)=>{await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(30);};
 const submit=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);await wait(50);};
 const choose=async id=>{await click('[data-action="demo"]');await click(`[data-action="demo-select"][data-task="${id}"]`);};
 const shot=async name=>{await wait(120);fs.writeFileSync(path.join(__dirname,'previews',name+'.png'),(await win.webContents.capturePage()).toPNG());};
 const measure=async(view,width)=>{win.setSize(width,960);await wait(120);const g=await run(`({width:innerWidth,scroll:document.documentElement.scrollWidth,mainWidth:document.querySelector('.main-shell').getBoundingClientRect().width,dialog:document.querySelector('dialog').open})`);assert.ok(g.scroll<=g.width,JSON.stringify({view,...g}));geometry.push({view,...g});};
 try {
  await win.loadFile(path.join(__dirname,'index.html'));await shot('comparison');
  for(const view of ['list','focus','attention']){
   win.setSize(1500,1020);await win.loadFile(path.join(__dirname,'workbench.html'),{query:{view}});await wait(150);
   assert.equal(await get('M.view'),view);assert.equal(await run('document.querySelector("dialog").open'),false);assert.equal(await run('document.querySelectorAll(".messages").length'),0);
   await shot(view);
   await choose('101');const thread=await get('M.current().thread');await click('.work-actions [data-action="auto"]');await click('[data-action="confirm-auto"]');
   assert.equal(await get('M.current().mode'),'auto');assert.equal(await get('M.current().assignee'),'我');assert.equal(await get('M.current().thread'),thread);assert.equal(await get('M.state.autoClaim'),false);
   await choose('102');await click('.work-actions [data-action="analyze"]');assert.equal(await get('M.current().mode'),'discussion');assert.equal(await get('M.current().status'),'review');assert.equal(await run('document.querySelector("dialog").open'),false);
   const analysisThread=await get('M.current().thread');await click('.work-actions [data-action="auto"]');await click('[data-action="confirm-auto"]');assert.equal(await get('M.current().mode'),'queued');assert.equal(await get('M.current().thread'),analysisThread);
   await choose('103');const runtimeThread=await get('M.current().thread');await fill('.work-detail .composer textarea','不要修改反馈原文，只修复图片加载。');await submit('.work-detail [data-form="message"]');assert.equal(await get('M.current().mode'),'auto');assert.equal(await get('M.current().pending.length'),1);assert.equal(await run('document.querySelectorAll(".messages").length'),0);
   await click('[data-action="demo"]');await click('[data-action="advance"]');assert.equal(await get('M.current().pending.length'),0);assert.match(await get('M.current().activity.join(" ")'),/补充要求已生效/);
   await click('.work-actions [data-action="pause"]');assert.equal(await get('M.current().mode'),'paused');assert.equal(await run('document.querySelector("dialog").open'),true);
   await fill('dialog .composer textarea','先保留这个讨论草稿');await click('dialog [data-action="close"]');assert.equal(await get('M.current().draft'),'先保留这个讨论草稿');await click('.work-actions [data-action="chat"]');assert.equal(await run('document.querySelector("dialog textarea").value'),'先保留这个讨论草稿');
   await fill('dialog .composer textarea','先核对重试次数，再继续执行。');await submit('dialog [data-form="message"]');assert.equal(await get('M.current().mode'),'paused');assert.equal(await get('M.current().thread'),runtimeThread);
   if(view==='focus')await shot('conversation-on-demand');
   await click('dialog [data-action="resume"]');assert.equal(await get('M.current().mode'),'auto');assert.equal(await get('M.current().thread'),runtimeThread);assert.equal(await run('document.querySelector("dialog").open'),false);
   await click('[data-action="demo"]');await click('[data-setting="failNext"]');await click('dialog [data-action="close"]');
   const count=await get('M.state.tasks.length');await click('[data-action="new"]');await fill('dialog [name="intent"]','分析评论离线恢复，需要保留草稿。');await change('dialog [name="project"]','orbit');await submit('dialog [data-form="new"]');assert.equal(await get('M.state.tasks.length'),count);assert.match(await run('document.querySelector(".form-error").textContent'),/失败/);assert.equal(await run('document.querySelector("[name=intent]").value'),'分析评论离线恢复，需要保留草稿。');
   await submit('dialog [data-form="new"]');assert.equal(await get('M.state.tasks.length'),count+1);assert.equal(await get('M.current().assignee'),'我');assert.equal(await get('M.current().status'),'review');assert.equal(await get('M.current().mode'),'discussion');const created=await get('M.current().id');
   await fill('.work-detail .composer textarea','新事情尚未发送的补充');await choose('101');assert.notEqual(await run('document.querySelector(".work-detail textarea").value'),'新事情尚未发送的补充');
   await win.reload();await wait(180);assert.equal(await get('M.state.tasks.length'),count+1);assert.equal(await get(`M.state.tasks.find(t=>t.id===${JSON.stringify(created)}).draft`),'新事情尚未发送的补充');assert.equal(await run('document.querySelector("dialog").open'),false);
   await choose('104');await click('.work-actions [data-action="decision"]');await click('[data-action="decide"]');assert.equal(await get('M.current().mode'),'auto');assert.equal(await get('M.current().decision'),'');
   await choose('105');await click('.work-actions [data-action="issue"]');await fill('dialog [name=issue]','检查 760px 窗口下的主要操作。');await submit('dialog [data-form="issue"]');assert.equal(await get('M.current().status'),'completed');assert.equal(await get('M.current().issues.length'),1);assert.equal(await run('document.querySelector(".work-actions [data-action=accept]").disabled'),true);await click('[data-action="resolve-issue"]');await click('.work-actions [data-action="accept"]');assert.equal(await get('M.current().status'),'accepted');
   await choose('102');await click('[data-action="demo"]');await click('[data-setting="offline"]');await click('dialog [data-action="close"]');await fill('.work-detail .composer textarea','离线时保留这条输入');const previous=await get('M.current().messages.length');await submit('.work-detail [data-form="message"]');assert.equal(await get('M.current().messages.length'),previous);assert.equal(await get('M.current().draft'),'离线时保留这条输入');
   await click('[data-action="demo"]');await click('[data-setting="offline"]');await click('dialog [data-action="close"]');await submit('.work-detail [data-form="message"]');assert.equal(await get('M.current().messages.length'),previous+2);
   for(const width of [1500,1024,760,390])await measure(view,width);
   if(view==='focus')await shot('narrow-focus');
   win.setSize(1500,1020);await choose('103');await click('.work-actions [data-action="stop"]');await click('[data-action="confirm-stop"]');assert.equal(await get('M.current().mode'),'stopped');assert.equal(await get('M.current().status'),'progress');await click('.work-actions [data-action="recover"]');assert.equal(await get('M.current().thread'),runtimeThread);assert.equal(await get('M.current().mode'),'auto');
   checks.push({view,passed:['messages hidden by default','direct Auto keeps owner and thread','analysis → Auto same work identity','workspace queue','running addition applied at execution boundary','pause → discuss → explicit resume','new conversation creates one self-assigned task','failed create retries without duplicates','per-work drafts and reload','human decision → continue','independent acceptance issue','offline preserves draft','stop ≠ complete; resume same work']});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const result={ok:true,checks,geometry,errors,externalRequests:requests,scope:'Browser simulation only. No backend, Codex, Runtime, microphone or production changes.'};
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));app.exit(0);
 }catch(error){console.error(error);console.error(errors);await shot('verification-failure');app.exit(1);}
});
