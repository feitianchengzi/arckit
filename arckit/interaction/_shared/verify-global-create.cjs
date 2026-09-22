const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'arcorbit-create-'));
const output=process.env.ARCORBIT_PROTOTYPE_EVIDENCE||path.join(temp,'evidence');
fs.mkdirSync(output,{recursive:true});app.setPath('userData',path.join(temp,'profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1440,height:950,show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 const checks=[],errors=[];const run=s=>win.webContents.executeJavaScript(s),wait=()=>new Promise(r=>setTimeout(r,220));
 win.webContents.on('console-message',(_e,level,text)=>{if(level>=3&&!text.includes('Content Security Policy'))errors.push(text);});
 const load=async page=>{await win.loadFile(path.join(__dirname,'..',page.includes('.html')?page:page+'/default.html'),{query:{autoplay:'off'}});await wait();};
 const click=s=>run(`document.querySelector(${JSON.stringify(s)}).click()`);
 const submit=()=>run('document.querySelector(".gc-task-create form").requestSubmit()');
 const content=()=>run('document.querySelector(".gc-task-create textarea").value="随时记录"');
 try{
  for(const page of ['today-workspace','chat-workspace','project-workbench','task-browser','product-list','product-detail','idea-workspace','idea-add','automation-workspace','release-workspace','operations-workspace','platform-workspace','platform-workspace/collaboration-views.html','engineering-profile','product-feedback-center']){
   await load(page);await run('GlobalContext.change("feedback","team")');
   const url=win.webContents.getURL();await click('#gc-create-task');
   assert.equal(await run('document.activeElement.name'),'content');
   assert.equal(await run('document.querySelector(".gc-task-create select[name=project]").value'),'feedback');
   assert.equal(await run('document.querySelector(".gc-task-create select[name=state]").value'),'pending_review');
   await click('[data-create-cancel]');await wait();
   assert.equal(await run('document.activeElement.id'),'gc-create-task');assert.equal(win.webContents.getURL(),url);
  }
  checks.push('15 page entries: scoped defaults, content focus, cancel, trigger focus and unchanged route');
  await load('chat-workspace');await run('document.querySelector("#chat-input").value="未发送草稿";document.querySelector("#chat-input").dispatchEvent(new Event("input",{bubbles:true}));window.beforeSession=ChatModel.state.selected');
  await click('#gc-create-task');await content();await run('GlobalContext.state.failCreate=true');await submit();
  assert.equal(await run('document.querySelector(".gc-task-create button[type=submit]").disabled'),true);
  await run('document.querySelector(".gc-task-create").dispatchEvent(new Event("cancel",{cancelable:true}))');
  assert.equal(await run('document.querySelector(".gc-task-create").open'),true);await wait();
  assert.equal(await run('document.querySelector(".gc-task-create textarea").value'),'随时记录');
  assert.match(await run('document.querySelector("[data-create-status]").textContent'),/创建失败/);
  await run('GlobalContext.state.failCreate=false;window.count=GlobalContext.state.pageObjects?.Work?.length||0');await submit();await submit();await wait();
  assert.equal(await run('GlobalContext.state.pageObjects.Work.length-count'),1);
  assert.equal(await run('document.querySelector("#chat-input").value'),'未发送草稿');
  assert.equal(await run('ChatModel.state.selected===beforeSession'),true);
  checks.push('Failure retains input; retry adds once; submit is busy; Chat draft/session preserved');
  await load('task-browser');await click('#gc-new');assert.equal(await run('document.querySelector(".gc-task-create").open'),true);await click('[data-create-cancel]');await wait();assert.equal(await run('document.activeElement.id'),'gc-new');
  await run('GlobalContext.change("all","empty")');await click('#gc-create-task');assert.equal(await run('document.querySelector(".gc-task-create").open'),false);assert.match(await run('document.querySelector(".gc-create-notice").textContent'),/没有可创建/);
  await run('GlobalContext.change("all","team");GlobalContext.state.sync="offline"');await click('#gc-create-task');assert.match(await run('document.querySelector(".gc-create-notice").textContent'),/登录/);await run('GlobalContext.state.sync="healthy"');
  checks.push('Work reuses global flow; empty scope and logged-out states explain recovery');
  for(const width of [1440,760,390]){
   win.setContentSize(width,950);await wait();await click('#gc-create-task');
   assert.equal(await run('document.querySelector(".gc-topbar").getBoundingClientRect().height'),54);
   assert.ok(await run('(()=>{const b=document.querySelector("#gc-create-task").getBoundingClientRect(),d=document.querySelector(".gc-task-create").getBoundingClientRect();return b.width>0&&b.right<=innerWidth&&d.left>=0&&d.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth})()'));
   if(width===390)fs.writeFileSync(path.join(output,'create-390.png'),(await win.webContents.capturePage()).toPNG());
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'ESC'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'ESC'});await wait();
   assert.equal(await run('document.querySelector(".gc-task-create").open'),false);
  }
  checks.push('1440/760/390px: single-row header, visible action, dialog fits, native Escape closes');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({ok:true,checks,errors,boundary:'Local prototype only. No production API, member/tag fields or native window validation.'},null,2));
  console.log(JSON.stringify({ok:true,checks,output}));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(output,'failure.txt'),String(e.stack));console.error(e);app.exit(1);}
});
