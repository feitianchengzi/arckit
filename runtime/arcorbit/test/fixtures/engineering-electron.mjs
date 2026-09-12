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
 const home=path.join(root,'home');
 const catalog=createBundledSkillCatalog({resourcesRoot:path.join(runtimeRoot,'dist-package/resources'),sourceRoot:path.resolve(runtimeRoot,'../..'),dataRoot:root,homeDir:home});
 const installPlan=await catalog.prepare();await catalog.install({planDigest:installPlan.installation.planDigest,confirmed:true});
 const manager=createSceneSkillManager({dataRoot:root,catalog});
 const custom=path.join(home,'.codex','skills','my-private-skill');await mkdir(custom,{recursive:true});await writeFile(path.join(custom,'SKILL.md'),'---\nname: my-private-skill\ndescription: User managed\n---\nFixture');
 ipcMain.handle('scene:snapshot',()=>manager.snapshot());ipcMain.handle('scene:update',(_e,value)=>manager.update(value));
 const url=relative=>pathToFileURL(path.join(runtimeRoot,'desktop/renderer',relative)).href;
 const html=path.join(root,'view.html');await writeFile(html,`<!doctype html><html lang="zh-CN" style="min-width:0"><link rel="stylesheet" href="${url('styles.css')}"><link rel="stylesheet" href="${url('engineering.css')}"><body style="display:block;overflow:auto;min-width:0;background:var(--ink-50)"><div style="padding:16px"><textarea id="draft">保持草稿</textarea><button id="chat" class="secondary-button">Skills</button></div><section id="root"></section><script type="module">import {createEngineeringSurface} from '${url('engineering-surface.mjs')}';window.surface=createEngineeringSurface({root:document.getElementById('root'),api:window.sceneTest,chatButton:document.getElementById('chat'),navigate:p=>window.destination=p});await surface.refresh();window.ready=true;</script></body></html>`);
 window=new BrowserWindow({show:false,width:1100,height:850,webPreferences:{preload:path.join(fixtureRoot,'engineering-preload.cjs'),sandbox:false,contextIsolation:true}});
 await window.loadFile(html);
 const waitFor=async expression=>{for(let i=0;i<100;i++){if(await window.webContents.executeJavaScript(expression))return;await new Promise(resolve=>setTimeout(resolve,40));}throw new Error('UI did not settle: '+expression);};
 await waitFor('window.ready===true');
 assert.equal(await window.webContents.executeJavaScript(`document.querySelector('[data-mode="builtin:using-arckit"]').disabled`),true);
 assert.equal(await window.webContents.executeJavaScript(`document.body.textContent.includes('my-private-skill')`),false);
 assert.equal(await window.webContents.executeJavaScript(`Boolean(document.querySelector('[data-action="import"], [data-replace], [data-role="source"]'))`),false);
 await assert.rejects(manager.update({scene:'automation',expectedRevision:0,changes:[{id:'local:forged',mode:'direct'}]}),/only manages ArcOrbit built-in/);
 await window.webContents.executeJavaScript(`{const mode=document.querySelector('[data-mode="builtin:arckit-spec"]');mode.value='disabled';mode.dispatchEvent(new Event('change',{bubbles:true}));}`);
 await waitFor(`document.querySelector('[data-mode="builtin:arckit-spec"]').value==='disabled'`);
 await window.webContents.executeJavaScript(`document.getElementById('chat').click()`);
 await waitFor(`document.querySelector('[data-scene="chat"]').getAttribute('aria-selected')==='true'`);
 await window.webContents.executeJavaScript(`{const mode=document.querySelector('[data-mode="builtin:using-arckit"]');mode.value='direct';mode.dispatchEvent(new Event('change',{bubbles:true}));}`);
 await waitFor(`document.querySelector('[data-mode="builtin:using-arckit"]').value==='direct'`);
 assert.equal(await window.webContents.executeJavaScript(`document.getElementById('draft').value`),'保持草稿');
 const snapshot=await manager.snapshot();assert.ok(snapshot.skills.every(x=>x.source==='builtin'&&x.id.startsWith('builtin:')));
 const reopened=createSceneSkillManager({dataRoot:root,catalog});assert.equal((await reopened.snapshot()).skills.find(x=>x.name==='using-arckit').enabled.chat,true);
 await writeFile('/private/tmp/arcorbit-engineering.png',(await window.webContents.capturePage()).toPNG());
 window.setSize(800,700);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(await window.webContents.executeJavaScript('document.documentElement.scrollWidth<=window.innerWidth'),true);
 console.log(JSON.stringify({status:'passed',skills:snapshot.skills.length,builtin_only:true,core_protected:true,user_skill_hidden:true,chat_loop_self_contained:true,draft_preserved:true,narrow_layout:true,screenshot:'/private/tmp/arcorbit-engineering.png'}));
} catch(error){console.error(error);exitCode=1;} finally{window?.destroy();await rm(root,{recursive:true,force:true});app.exit(exitCode);}
});
