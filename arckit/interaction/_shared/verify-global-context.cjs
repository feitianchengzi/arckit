const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'arcorbit-global-prototype-'));
const output=process.env.ARCORBIT_PROTOTYPE_EVIDENCE||path.join(temp,'evidence');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(temp,'profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1440,height:1000,show:false,webPreferences:{sandbox:true,contextIsolation:true}}),errors=[],checks=[];
 win.webContents.on('console-message',(_e,level,text)=>{if(level>=3&&!text.includes('Content Security Policy'))errors.push(text);});
 const run=code=>win.webContents.executeJavaScript(code),wait=(ms=70)=>new Promise(r=>setTimeout(r,ms));
 const load=async folder=>{await win.loadFile(path.join(__dirname,'..',folder.includes('.html')?folder:folder+'/default.html'),{query:{autoplay:'off'}});await wait();};
 const click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click()`);await wait();};
 const scope=async (id,set)=>{await run(`GlobalContext.change(${JSON.stringify(id)},${JSON.stringify(set)})`);await wait();};
 const input=async (s,value)=>run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const shot=async name=>fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());
 try{
  await load('chat-workspace');
  assert.equal(await run('getComputedStyle(document.querySelector(".gc-navigation")).display'),'none');
  assert.equal(await run('document.querySelector(".gc-scope label:nth-child(2)>span").textContent'),'查看');
  assert.ok(await run('document.querySelector("#gc-manage").getBoundingClientRect().right<document.querySelector("#gc-sync").getBoundingClientRect().left'));
  assert.ok(await run('document.querySelector(".gc-feedback").getBoundingClientRect().right<document.querySelector("#gc-refresh").getBoundingClientRect().left'));
  await click('#gc-manage');assert.equal(await run('document.querySelectorAll("dialog[open] [name=project]").length'),3);await click('dialog[open] [data-cancel]');
  await click('#gc-manage');await click('dialog[open] [value=feedback]');await run('document.querySelector("dialog[open] form").requestSubmit()');assert.equal(await run('GlobalContext.includes("feedback")'),false);
  await win.reload();await wait();assert.equal(await run('GlobalContext.includes("feedback")'),false);
  await click('#gc-manage');await click('dialog[open] [value=feedback]');await run('document.querySelector("dialog[open] form").requestSubmit()');assert.equal(await run('GlobalContext.includes("feedback")'),true);
  checks.push('Desktop header matches implemented scope cluster, management and action order; navigation is compact-only');
  for(const id of ['gc-sync','gc-runtime']){await click('#'+id+'>summary');const style=await run(`(()=>{const e=document.getElementById('${id}');return {bg:getComputedStyle(e.querySelector('.gc-popup')).backgroundColor,border:getComputedStyle(e.querySelector('summary')).borderTopStyle,arrow:getComputedStyle(e.querySelector('summary'),'::after').content};})()`);assert.notEqual(style.bg,'rgba(0, 0, 0, 0)');assert.equal(style.border,'solid');assert.notEqual(style.arrow,'none');await click('#'+id+'>summary');}
  checks.push('Status entries visibly indicate disclosure; popover surfaces are opaque');await scope('orbit');assert.equal(await run('ChatModel.current().project'),'atlas');
  await input('#chat-input','ArcOrbit 草稿');await scope('feedback');assert.equal(await run('ChatModel.current().project'),'borealis');
  await input('#chat-input','Feedback 草稿');await scope('orbit');assert.equal(await run('ChatModel.owner().draft'),'ArcOrbit 草稿');
  await run('window.savedHeader=GlobalShell.header');await click('[data-chat-action=new]');assert.equal(await run('GlobalShell.header===savedHeader'),true);
  await input('#chat-input','未发送新对话');await scope('todo');assert.equal(await run('ChatModel.state.selected'),'');assert.equal(await run('ChatModel.owner().project'),'');assert.equal(await run('document.querySelector("#chat-compose button[type=submit]").disabled'),true);
  await click('[data-chat-action=bind]');assert.equal(await run('document.querySelectorAll("#chat-dialog select option").length'),1);assert.equal(await run('document.querySelector("#chat-dialog select").value'),'todo');await run('document.querySelector("#chat-dialog form").requestSubmit()');await wait();assert.equal(await run('ChatModel.owner().project'),'todo');await scope('orbit');assert.equal(await run('ChatModel.owner().draft'),'未发送新对话');await scope('all','empty');assert.equal(await run('document.querySelectorAll(".session-row").length'),0);await scope('orbit','team');
  await shot('chat-1440');checks.push('Chat product scope, selected session drafts, empty/unbound scope, shared header identity');
  await load('project-workbench');await scope('orbit');await input('textarea[name=message]','事情 101 草稿');await scope('feedback');assert.equal(await run('WorkModel.current().project'),'feedback');await scope('orbit');assert.equal(await run('WorkModel.current().draft'),'事情 101 草稿');
  await scope('all','empty');assert.equal(await run('WorkModel.visible().length'),0);assert.equal(await run('WorkModel.current()||null'),null);await scope('orbit','team');await shot('thing-1440');checks.push('Thing scope, task drafts and empty scope');
  const pages=['today-workspace','product-list','product-detail','idea-workspace','idea-add','task-browser','automation-workspace','release-workspace','operations-workspace','platform-workspace','platform-workspace/collaboration-views.html','engineering-profile','product-feedback-center'];
  for(const page of pages){await load(page);assert.equal(await run('document.querySelectorAll(".gc-topbar").length'),1);assert.equal(await run('GlobalContext.state.project'),'orbit');assert.equal(await run('!!document.querySelector("#gc-refresh")&&!!document.querySelector("#gc-runtime")'),true);await scope('feedback');assert.equal(await run('document.querySelector("#gc-project").value'),'feedback');await scope('orbit');}
  checks.push('13 further page entries share scope and all global capabilities');
  await load('product-list');await scope('all');await click('[data-product=feedback]');await wait(150);assert.equal(await run('GlobalContext.state.project'),'feedback');await input('[data-draft]','产品资料草稿');await scope('orbit');await scope('feedback');assert.equal(await run('document.querySelector("[data-draft]").value'),'产品资料草稿');await scope('all');assert.ok(await run('!!document.querySelector("[data-product]")'));checks.push('Product detail follows single scope; all returns list; drafts retain ownership');
  await load('task-browser');await scope('feedback');await click('#gc-new');assert.equal(await run('document.querySelectorAll("#gc-create option").length'),1);await input('#gc-create textarea','范围内新待办');await run('document.querySelector("#gc-create form").requestSubmit()');assert.equal(await run('GlobalContext.state.pageObjects.Work.at(-1).project'),'feedback');
  await run('GlobalContext.state.failSync=true');await click('#gc-refresh');await wait(360);assert.equal(await run('GlobalContext.state.sync'),'error');await run('GlobalContext.state.failSync=false');await click('#gc-refresh');await wait(360);assert.equal(await run('GlobalContext.state.sync'),'healthy');
  const runs=await run('JSON.stringify(GlobalContext.state.runs)');await click('#gc-enabled');await click('#gc-pause');assert.equal(await run('GlobalContext.state.paused'),true);assert.equal(await run('JSON.stringify(GlobalContext.state.runs)'),runs);checks.push('New objects inherit scope; failure/retry truthful sync; pause preserves running task');
  for(const folder of ['chat-workspace','project-workbench','task-browser','product-detail'])for(const width of [1440,760,390]){
   win.setContentSize(width,950);await load(folder);await wait();
   const bounds=await run('(()=>{const h=document.querySelector(".gc-topbar").getBoundingClientRect();return {w:innerWidth,scroll:document.documentElement.scrollWidth,right:h.right,height:h.height}})()');
   assert.ok(bounds.scroll<=bounds.w&&bounds.right<=bounds.w+1,JSON.stringify({folder,width,bounds}));assert.equal(bounds.height,54);if(width===1440)assert.ok(await run('document.querySelector("#gc-project").getBoundingClientRect().width>0&&document.querySelector("#gc-refresh").getBoundingClientRect().width>0'));
   if(width===390){await click('.gc-controls>summary');await click('#gc-runtime>summary');await run('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');assert.equal(await run('document.querySelector("#gc-runtime").open'),false);await shot(folder+'-390');}
  }
  checks.push('1440/760/390px single row, no horizontal overflow, nested Escape focus');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'global-context-verification.json'),JSON.stringify({ok:true,checks,errors,boundary:'Browser-local fixtures, no real business calls or native window controls.'},null,2)+'\n');console.log(JSON.stringify({ok:true,checks,output}));app.exit(0);
 }catch(e){console.error(e,errors);await shot('failure');app.exit(1);}
});
