import test from 'node:test';
import assert from 'node:assert/strict';
import {taskCreationAutomation as hint} from '../desktop/renderer/task-creation-automation.mjs';
const base = () => ({projectId:'11',taskState:'pending',executorId:'7',authentication:{authenticated:true},platform:{product_workspaces:[{id:'11',current_user_id:'7',current_user_role:'owner'}]},automation:{source_status:'healthy',enabled:true,queue_paused:false,projects:[{id:'11',source_status:'healthy',local_project_id:'local',local_project_path:'/repo',participating:true}],errors:[],active_executions:[],recovery_items:[],attention_items:[]},setup:{status:'ready'}});
test('all seven states and three assignees distinguish ordinary eligibility from enabled claiming',()=>{
 for(const state of ['pending_review','pending','in_progress','completed','accepted','cancelled','blocked'])for(const executor of ['','7','8']){
  const r=hint({...base(),taskState:state,executorId:executor});
  assert.equal(r.label,state==='pending'&&executor==='7'?'Automation 已开启':'本待办不自动领取');
  if(state!=='pending')assert.match(r.message,/将状态改为「待处理」/);
  if(executor!=='7')assert.match(r.message,/将执行人设为「我」/);
 }
});
test('unknown identity, sources, authorization and refresh failure never appear green',()=>{
 const cases=[b=>b.platform.product_workspaces[0].current_user_id='',b=>b.authentication.authenticated=false,b=>b.automation.source_status='error',b=>b.automation.projects[0].source_status='syncing',b=>delete b.automation.enabled,b=>delete b.automation.projects[0].participating,b=>b.sourceReadFailed=true,b=>delete b.setup.status];
 for(const change of cases){const b=base();change(b);assert.equal(hint(b).label,'Automation 待确认');}
});
test('binding, participation and role show actionable reasons; disabled and paused differ',()=>{
 const b=base();b.automation.projects[0].local_project_path='';assert.match(hint(b).message,/绑定本地目录/);
 b.automation.projects[0].local_project_path='/repo';b.automation.projects[0].participating=false;assert.match(hint(b).message,/Today 允许/);
 b.platform.product_workspaces[0].current_user_role='member';assert.match(hint(b).message,/联系项目管理员/);
 b.automation.projects[0].participating=true;b.automation.enabled=false;assert.equal(hint(b).label,'Automation 已关闭');
 b.automation.enabled=true;b.automation.queue_paused=true;assert.equal(hint(b).label,'Automation 已暂停');
});
test('only relevant recovery and attention block; busy lanes and full capacity retain enabled',()=>{
 const b=base();b.automation.recovery_items=[{project_id:'other',workspace_key:'elsewhere'}];assert.equal(hint(b).tone,'success');
 b.automation.recovery_items[0].freeze_scope='global';assert.equal(hint(b).label,'Automation 等待处理');
 b.automation.recovery_items=[];b.automation.attention_items=[{workspace_key:'local'}];assert.equal(hint(b).label,'Automation 等待处理');
 b.automation.attention_items=[];b.automation.active_executions=[{workspace_key:'local'}];assert.equal(hint(b).tone,'success');assert.match(hint(b).message,/等待空位/);
 b.automation.active_executions=[];b.automation.concurrency={available:0};assert.match(hint(b).message,/等待空位/);
 b.setup.status='blocked';assert.match(hint(b).message,/环境尚未就绪/);
});
test('tag-only or other-project errors do not block; relevant task-source failures do',()=>{
 const b=base();b.automation.errors=[{project_id:'11',section:'tags'},{project_id:'12',section:'tasks'}];assert.equal(hint(b).tone,'success');
 b.automation.errors.push({project_id:'11',section:'tasks'});assert.equal(hint(b).label,'Automation 待确认');
});
