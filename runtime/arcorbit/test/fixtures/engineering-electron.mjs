import { app, BrowserWindow, ipcMain } from 'electron';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createBundledSkillCatalog } from '../../src/bundled-skill-catalog.mjs';
import { createSceneSkillManager } from '../../src/scene-skill-manager.mjs';

const fixtureRoot=path.dirname(fileURLToPath(import.meta.url)),runtimeRoot=path.resolve(fixtureRoot,'../..');
const root=await mkdtemp(path.join(tmpdir(),'scene-engineering-electron-'));
app.setPath('userData',path.join(root,'electron'));app.disableHardwareAcceleration();
app.whenReady().then(async () => {
let window, exitCode=0;
try {
 const catalog=createBundledSkillCatalog({resourcesRoot:path.join(runtimeRoot,'dist-package/resources'),sourceRoot:path.resolve(runtimeRoot,'../..'),dataRoot:root,homeDir:path.join(root,'home')});
 const installPlan=await catalog.prepare();await catalog.install({planDigest:installPlan.installation.planDigest,confirmed:true});const manager=createSceneSkillManager({dataRoot:root,catalog,homeDir:path.join(root,'home')});
 const custom=path.join(root,'custom');await mkdir(custom);await writeFile(path.join(custom,'SKILL.md'),'---\nname: my-spec\ndescription: My familiar specification workflow\n---\nFixture');
 ipcMain.handle('scene:snapshot',()=>manager.snapshot());ipcMain.handle('scene:update',(_e,value)=>manager.update(value));ipcMain.handle('scene:import',()=>manager.importLocal(custom));
 const url=relative=>pathToFileURL(path.join(runtimeRoot,'desktop/renderer',relative)).href;
 const html=path.join(root,'view.html');await writeFile(html,`<!doctype html><html lang="zh-CN" style="min-width:0"><link rel="stylesheet" href="${url('styles.css')}"><link rel="stylesheet" href="${url('engineering.css')}"><body style="display:block;overflow:auto;min-width:0;background:var(--ink-50)"><div style="padding:16px"><textarea id="draft">保持草稿</textarea><button id="chat" class="secondary-button">技能</button></div><section id="root"></section><script type="module">import {createEngineeringSurface} from '${url('engineering-surface.mjs')}';window.surface=createEngineeringSurface({root:document.getElementById('root'),api:window.sceneTest,chatButton:document.getElementById('chat'),navigate:p=>window.destination=p});await surface.refresh();window.ready=true;</script></body></html>`);
 window=new BrowserWindow({show:false,width:1100,height:850,webPreferences:{preload:path.join(fixtureRoot,'engineering-preload.cjs'),sandbox:false,contextIsolation:true}});
 await window.loadFile(html);
 const waitFor=async expression=>{for(let i=0;i<100;i++){if(await window.webContents.executeJavaScript(expression))return;await new Promise(resolve=>setTimeout(resolve,40));}throw new Error('UI did not settle: '+expression);};
 await waitFor('window.ready===true');
 assert.equal(await window.webContents.executeJavaScript(`document.querySelector('[data-mode="builtin:arckit-state-driven-loop"]').disabled`),true);
 await window.webContents.executeJavaScript(`document.querySelector('[data-action="import"]').click()`);
 await waitFor(`document.querySelector('[data-role="skills"]').textContent.includes('my-spec')`);
 await window.webContents.executeJavaScript(`document.querySelector('[data-replace="builtin:arckit-spec"]').click();const dialog=document.querySelector('dialog');dialog.querySelector('select').value=Array.from(dialog.querySelectorAll('option')).find(x=>x.textContent.includes('my-spec')).value;dialog.close('replace');`);
 await waitFor(`document.querySelector('[data-mode="builtin:arckit-spec"]').value==='disabled'`);
 await window.webContents.executeJavaScript(`document.getElementById('chat').click()`);
 await waitFor(`document.querySelector('[data-scene="chat"]').getAttribute('aria-selected')==='true'`);
 await window.webContents.executeJavaScript(`{const mode=document.querySelector('[data-mode="builtin:arckit-state-driven-loop"]');mode.value='direct';mode.dispatchEvent(new Event('change',{bubbles:true}));}`);
 await waitFor(`document.querySelector('[data-mode="builtin:arckit-state-driven-loop"]').value==='direct'`);
 const draft=await window.webContents.executeJavaScript(`document.getElementById('draft').value`);assert.equal(draft,'保持草稿');
 const snapshot=await manager.snapshot();assert.equal(snapshot.skills.find(x=>x.name==='my-spec').enabled.automation,true);
 const reopened=createSceneSkillManager({dataRoot:root,catalog,homeDir:path.join(root,'home')});assert.equal((await reopened.snapshot()).skills.find(x=>x.name==='arckit-state-driven-loop').enabled.chat,true);
 await writeFile('/private/tmp/arcorbit-engineering.png',(await window.webContents.capturePage()).toPNG());
 window.setSize(800,700);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(await window.webContents.executeJavaScript('document.documentElement.scrollWidth<=window.innerWidth'),true);
 console.log(JSON.stringify({status:'passed',skills:snapshot.skills.length,core_protected:true,replacement_persisted:true,chat_loop_self_contained:true,draft_preserved:true,narrow_layout:true,screenshot:'/private/tmp/arcorbit-engineering.png'}));
} catch(error){console.error(error);exitCode=1;} finally{window?.destroy();await rm(root,{recursive:true,force:true});app.exit(exitCode);}
});
