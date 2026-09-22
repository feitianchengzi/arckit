const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const output=process.env.ARCORBIT_TEST_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'arcorbit-automation-hint-evidence-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'arcorbit-automation-hint-prototype-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1200,height:1000,show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 const errors=[],checks=[];let exitCode=0;
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
 const js=code=>win.webContents.executeJavaScript(code),wait=()=>new Promise(resolve=>setTimeout(resolve,220));
 const open=()=>js("document.querySelector('#gc-create-task').click()");
 const close=()=>js("document.querySelector('[data-create-cancel]').click()");
 const get=name=>js(`document.querySelector('.gc-task-create [name=${name}]').value`);
 const set=(name,value)=>js(`(()=>{const field=document.querySelector('.gc-task-create [name=${name}]');field.value=${JSON.stringify(value)};field.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const toggle=()=>js("document.querySelector('.gc-task-create [name=reuse]').click()");
 const submit=async()=>{await js("document.querySelector('.gc-task-create form').requestSubmit()");await wait();};
 try{
  await win.loadFile(path.join(__dirname,'default.html'));await js('GlobalContext.reset()');await open();
  const hint=()=>js("document.querySelector('[data-create-automation]').textContent");
  const scenario=async value=>js(`CreateAutomationPreview.set(${JSON.stringify(value)})`);
  await set('content','保留当前正文');
  for(const state of ['pending_review','pending','in_progress','completed','accepted','cancelled','blocked']){
   await set('state',state);
   for(const executor of ['', 'orbit-me','orbit-lin']){
    await set('executor',executor);const value=await hint();
    if(state==='pending'&&executor==='orbit-me')assert.match(value,/Automation 已关闭/);
    else {assert.match(value,/本待办不自动领取/);if(state!=='pending')assert.match(value,/将状态改为「待处理」/);if(executor!=='orbit-me')assert.match(value,/将执行人设为「我」/);}
   }
  }
  checks.push('七状态 × 未分配/我/其他成员的 21 个组合，原因与建议只显示实际缺口');
  await set('state','pending');await set('executor','orbit-me');
  for(const [config,expected] of [
   [{known:false},/待确认/],[{known:true,bound:false},/绑定本地目录/],
   [{bound:true,participating:false,admin:false},/联系项目管理员/],
   [{admin:true},/Today 允许该产品/],[{participating:true,enabled:true,paused:true},/已暂停/],
   [{paused:false,setupReady:false},/项目环境尚未就绪/],[{setupReady:true,attention:true},/等待恢复或人工处理/],
   [{attention:false},/已开启/],[{busy:true},/等待空位/]
  ]){await scenario(config);assert.match(await hint(),expected);}
  assert.equal(await js("document.querySelector('.gc-automation-badge').dataset.tone"),'success');
  await js("document.querySelector('[name=content]').focus()");await scenario({busy:false});assert.equal(await js('document.activeElement.name'),'content');assert.equal(await get('content'),'保留当前正文');
  checks.push('未知/绑定/参与角色/关闭/暂停/环境/恢复/开启/忙碌；场景刷新保留正文和焦点');
  await set('project','feedback');assert.equal(await get('executor'),'');assert.match(await hint(),/未分配/);await set('executor','feedback-me');assert.match(await hint(),/已开启/);
  await toggle();await submit();await open();assert.equal(await get('state'),'pending');assert.equal(await get('executor'),'feedback-me');assert.match(await hint(),/已开启/);assert.equal(await get('content'),'');
  checks.push('产品切换先清空关联再更新；成功创建后复用值直接参与提示计算');
  fs.mkdirSync(output,{recursive:true});
  for(const theme of ['light','dark']){await js(`document.documentElement.dataset.theme='${theme}';document.querySelector('[data-create-automation]').scrollIntoView({block:'center'})`);await wait();fs.writeFileSync(path.join(output,theme+'.png'),(await win.webContents.capturePage()).toPNG());}
  win.setSize(600,850);await wait();assert.equal(await js("(()=>{const d=document.querySelector('.gc-task-create');return d.scrollWidth<=d.clientWidth&&d.getBoundingClientRect().right<=innerWidth;})()"),true);fs.writeFileSync(path.join(output,'narrow.png'),(await win.webContents.capturePage()).toPNG());
  await js("document.querySelector('.gc-task-create [type=submit]').focus()");win.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab'});await wait();assert.equal(await js("document.querySelector('.gc-task-create').contains(document.activeElement)"),true);
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await wait();assert.equal(await js('document.activeElement.id'),'gc-create-task');
  checks.push('明暗开启标记截图、600px 无横向溢出、模态 Tab 与 Escape 焦点恢复');assert.deepEqual(errors,[]);
 }catch(error){exitCode=1;errors.push(error.stack);}
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({status:exitCode?'failed':'passed',checks,errors,scope:'本地交互原型，不证明生产事实映射、后台刷新或真实自动执行。'},null,2));
 console.log(JSON.stringify({status:exitCode?'failed':'passed',output,checks,errors}));win.destroy();app.quit();process.exitCode=exitCode;
}).catch(error=>{console.error(error);app.exit(1);});
