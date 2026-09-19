const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'chat-layout-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1500,height:1000,show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 const run=s=>w.webContents.executeJavaScript(s),wait=()=>new Promise(r=>setTimeout(r,90)),checks=[];
 const shot=async name=>{fs.mkdirSync(path.join(__dirname,'previews'),{recursive:true});fs.writeFileSync(path.join(__dirname,'previews',name+'.png'),(await w.webContents.capturePage()).toPNG())};
 try{
  await w.loadFile(path.join(__dirname,'default.html'),{query:{autoplay:'off'}});
  for(const [width,height] of [[1500,1000],[1500,800],[1024,800],[820,800],[760,800],[390,800],[390,640]]){
   w.setContentSize(width,height);await wait();
   if(width>760){
    const rects=await run(`(()=>{const selectors=['#gc-sync>summary','#gc-runtime>summary','.gc-feedback','#gc-refresh','[data-account-open]'];return selectors.map(s=>{const r=GlobalShell.header.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height}})})()`);
    assert.ok(rects.every(r=>r.height>0&&Math.abs(r.y-rects[0].y)<2&&r.bottom<=54),JSON.stringify({width,height,rects}));
    assert.ok(rects.every((r,i)=>!i||r.x>=rects[i-1].right),JSON.stringify(rects));
   }
   await run('ChatNativeInput.open()');await wait();
   const geometry=await run(`(()=>{const p=document.querySelector('#native-picker'),list=document.querySelector('#native-options'),a=document.querySelector('[data-native-action=invoke]'),footer=p.querySelector('.native-picker-footer'),r=p.getBoundingClientRect(),l=list.getBoundingClientRect(),f=footer.getBoundingClientRect();return {height:r.height,available:a.getBoundingClientRect().top-20,top:r.top,bottom:r.bottom,anchor:a.getBoundingClientRect().top,listHeight:l.height,listTop:l.top,listBottom:l.bottom,footerTop:f.top,footerBottom:f.bottom,client:list.clientHeight,scroll:list.scrollHeight,count:list.querySelectorAll('button').length}})()`);
   assert.ok(Math.abs(geometry.height-Math.min(640,geometry.available))<2,JSON.stringify(geometry));
   assert.ok(geometry.listHeight>=200&&geometry.listBottom<=geometry.footerTop&&geometry.footerBottom<=geometry.bottom,JSON.stringify(geometry));
   assert.ok(Math.abs(geometry.anchor-geometry.bottom-8)<2&&geometry.top>=12,JSON.stringify(geometry));
   assert.equal(geometry.count,6);
   if(height===1000)assert.ok(geometry.scroll<=geometry.client,'All initial entries fit at full height');
   await shot('layout-'+width+'-'+height);
   // Scroll to every candidate and verify it is actually visible and hit-testable.
   const reachable=await run(`(()=>{const list=document.querySelector('#native-options');return [...list.querySelectorAll('button')].every(b=>{b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect(),l=list.getBoundingClientRect(),hit=document.elementFromPoint(r.left+20,r.top+r.height/2);return r.top>=l.top-1&&r.bottom<=l.bottom+1&&b.contains(hit)})})()`);
   assert.ok(reachable,'Every capability/reference can be reached at '+width+'x'+height);
   await run('document.querySelector("[data-native-pick=T202]").click()');
   assert.ok(await run('ChatNative.context().refs.some(r=>r.id==="T202")'));
   await run('document.querySelector("[data-native-action=remove][data-id=T202]").click()');
   checks.push({width,height,topbar:width>760?'horizontal':'compact',menuHeight:geometry.height,listHeight:geometry.listHeight,allEntriesReachable:true});
  }
  const report={ok:true,checks,boundary:'Electron browser-local prototype; native WebKit host not executed.'};
  fs.writeFileSync(path.join(__dirname,'verification-layout.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e);await shot('layout-failure');app.exit(1)}
});
