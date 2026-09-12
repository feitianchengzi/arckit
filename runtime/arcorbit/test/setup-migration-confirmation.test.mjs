import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source=await readFile(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
const html=await readFile(new URL('../desktop/renderer/index.html',import.meta.url),'utf8');
const functionSource=name=>source.slice(source.indexOf(`function ${name}(`),source.indexOf('\nfunction ',source.indexOf(`function ${name}(`)+1));

test('setup shows complete cleanup paths before consent and requires an unchecked acknowledgement',async()=>{
 const {document}=parseHTML(html),els=Object.fromEntries([...document.querySelectorAll('[id]')].map(el=>[el.id,el]));
 const state={setup:{status:'ready',catalog:{path:'/catalog',count:13},can_apply:true,plan:{digest:'reviewed-plan',cleanup:[]},migration:{pending:[{path:'/project/.codex/skills/old',reason:'unchanged managed installation'}],removed:[],preserved:[],errors:[]}},setupCleanupPaths:[],setupRecoveryPaths:[]};
 const calls=[];let click;
 const context=vm.createContext({els,state,escapeHtml:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),syncSetupCleanupSelection:()=>{},syncSetupReview:()=>{},renderSetup:()=>{},runAction:fn=>fn(),api:{applySetupPlan:async input=>{calls.push(input);return state.setup;}}});
 vm.runInContext(functionSource('renderSetupPlan')+'\n'+functionSource('renderSetupActions')+'\nrenderSetupPlan();renderSetupActions();',context);
 assert.match(els.setupPlan.textContent,/待确认删除 1 项，已清理 0 项/);
 assert.match(els.setupPlan.textContent,/\/project\/\.codex\/skills\/old/);
 assert.equal(els.setupPlanDetails.open,true);assert.equal(els.setupPlan.querySelector('details').hasAttribute('open'),true);
 assert.equal(els.setupApplyButton.disabled,true);assert.equal(els.setupApplyButton.textContent,'确认删除清单中的 1 项');
 assert.equal(els.setupContinueButton.textContent,'暂不清理，继续使用');assert.equal(calls.length,0);
 els.setupReviewed.checked=true;vm.runInContext('renderSetupActions()',context);assert.equal(els.setupApplyButton.disabled,false);
 els.setupApplyButton.addEventListener=(_event,listener)=>{click=listener;};
 const start=source.indexOf('  els.setupApplyButton.addEventListener('),end=source.indexOf('  els.setupRecoverButton.addEventListener(',start);
 vm.runInContext(source.slice(start,end),context);await click();
 assert.equal(calls.length,1);assert.equal(calls[0].confirmed,true);assert.equal(calls[0].planDigest,'reviewed-plan');assert.equal(els.setupReviewed.checked,false);
});

test('installation review includes on-demand targets and grants no cleanup consent',()=>{
 const {document}=parseHTML(html),els=Object.fromEntries([...document.querySelectorAll('[id]')].map(el=>[el.id,el]));
 const state={setup:{status:'needs-install',catalog:{path:'/catalog/version',count:1},can_apply:true,plan:{operation:'install',digest:'installation-plan',cleanup:[]},installation:{items:[{skill:'manual-skill',mode:'user-on-demand',sourcePath:'/bundle/manual-skill',path:'/catalog/version/manual-skill',status:'install',incomingDigest:'abcd'}],assets:[]},migration:{pending:[{path:'/project/.codex/skills/old',reason:'managed'}],removed:[],preserved:[],errors:[]}},setupCleanupPaths:[],setupRecoveryPaths:[]};
 const context=vm.createContext({els,state,escapeHtml:v=>String(v??''),syncSetupCleanupSelection:()=>{},syncSetupReview:()=>{}});
 vm.runInContext(functionSource('renderSetupPlan')+'\n'+functionSource('renderSetupActions')+'\nrenderSetupPlan();renderSetupActions();',context);
 assert.equal(els.setupApplyButton.textContent,'确认安装与更新');assert.equal(els.setupApplyButton.disabled,true);
 assert.match(els.setupPlan.textContent,/user-on-demand/);assert.match(els.setupPlan.textContent,/\/bundle\/manual-skill/);assert.match(els.setupPlan.textContent,/\/catalog\/version\/manual-skill/);
 assert.match(els.setupPlan.textContent,/清理需要安装验证完成后单独确认/);
 assert.match(els.setupReviewHint.textContent,/不会同时清理/);assert.match(els.setupReviewLabel.textContent,/安装与更新/);
});

test('source replacement review shows both sources and requires installation consent',()=>{
 const {document}=parseHTML(html),els=Object.fromEntries([...document.querySelectorAll('[id]')].map(el=>[el.id,el]));
 const state={setupCleanupPaths:[],setupRecoveryPaths:[],setup:{status:'needs-install',catalog:{path:'/catalog',count:1},can_apply:true,plan:{operation:'install',digest:'replacement',cleanup:[]},installation:{items:[{skill:'arckit-pending',mode:'user-on-demand',sourcePath:'/new/pending',path:'/catalog/arckit-pending',status:'replace-source',sourceSelection:{currentSourceKey:'old-key',incomingSourceKey:'new-key',currentSourcePath:'/old/pending'}}],assets:[]},migration:{pending:[],removed:[],preserved:[],errors:[]}}};
 const context=vm.createContext({els,state,escapeHtml:v=>String(v??''),syncSetupCleanupSelection:()=>{},syncSetupReview:()=>{}});
 vm.runInContext(functionSource('renderSetupPlan')+'\n'+functionSource('renderSetupActions')+'\nrenderSetupPlan();renderSetupActions();',context);
 for(const expected of ['待确认切换来源并替换','/old/pending','/new/pending','old-key','new-key','共享副本']) assert.ok(els.setupPlan.textContent.includes(expected));
 assert.equal(els.setupApplyButton.disabled,true);
});
