import { app, BrowserWindow } from 'electron';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
app.setPath('userData',join(tmpdir(),`member-add-electron-${process.pid}`));app.disableHardwareAcceleration();
app.whenReady().then(async () => {
const window=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{preload:join(dir,'organization-center-preload.cjs'),contextIsolation:true,sandbox:false}});
try {
 await window.loadFile(join(dir,'../../desktop/renderer/index.html'));
 const result=await window.webContents.executeJavaScript(`(async()=>{
 const wait=()=>new Promise(r=>setTimeout(r,100));const click=s=>{const e=document.querySelector(s);if(!e)throw Error('missing '+s);e.click()};
 await wait();click('[data-page="organization"]');await wait();click('[data-organization-section="projects"]');await wait();
 click('[data-organization-project-open="12"]');await wait();const memberDenied=!document.querySelector('[data-project-member-add="12"]');
 click('[data-organization-project-open="11"]');await wait();click('[data-project-member-add="11"]');await wait();
 const root=()=>document.querySelector('[data-member-add]');
 const existingDisabled=root().querySelector('input[value="91"]').disabled;
 const search=root().querySelector('input[type="search"]');search.value='New';search.dispatchEvent(new Event('input'));await wait();
 const matches=root().querySelectorAll('input[type="radio"]').length;
 click('[data-member-add] input[value="501"]');await wait();
 const contextVisible=root().querySelector('[data-member-add-context]').textContent.includes('组织：飞天橙子 · 项目：ArcOrbit');
 search.value='Lin';search.dispatchEvent(new Event('input'));await wait();
 const hiddenSelectionVisible=!root().querySelector('input[value="501"]')&&root().querySelector('[data-member-add-selection]').textContent.includes('New Member（用户 99）')&&!root().querySelector('.primary-button').disabled;
 search.value='no-matching-member';search.dispatchEvent(new Event('input'));await wait();
 const emptySearchSelectionVisible=root().querySelectorAll('input[type="radio"]').length===0&&root().querySelector('[data-member-add-selection]').textContent.includes('New Member（用户 99）');
 click('[data-member-add] .primary-button');await wait();await wait();
 const success=root().textContent.includes('项目成员已刷新');const refreshed=document.querySelector('#organizationContent').textContent.includes('New Member');
 click('[data-member-add] .secondary-button');await wait();const focused=document.activeElement?.dataset.projectMemberAdd==='11';
 click('[data-project-member-add="11"]');await wait();click('[data-organization-project-open="12"]');await wait();const staleClosed=!root();
 const calls=await window.arckitDesktop.getTestCalls();const adds=calls.filter(x=>x[0]==='project.member.add');
 return {memberDenied,existingDisabled,matches,contextVisible,hiddenSelectionVisible,emptySearchSelectionVisible,success,refreshed,focused,staleClosed,adds};
 })()`);
 console.log(JSON.stringify(result));
 if(!result.memberDenied||!result.existingDisabled||result.matches!==1||!result.contextVisible||!result.hiddenSelectionVisible||!result.emptySearchSelectionVisible||!result.success||!result.refreshed||!result.focused||!result.staleClosed||result.adds.length!==1||result.adds[0][1].organization_member_id!=='501')process.exitCode=1;
} catch(error){console.error(error);process.exitCode=1;} finally {window.destroy();app.quit();}

});
