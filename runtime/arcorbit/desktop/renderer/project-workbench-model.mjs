import { taskDisplayTitle } from '../../src/task-display-title.mjs';
export const stateLabels={pending_review:'待评审',pending:'待处理',in_progress:'进行中',completed:'待验收',accepted:'已验收',blocked:'已阻塞',cancelled:'已取消'};
export const tabs={overview:'概览',context:'资料与协作',results:'成果与验收',activity:'活动'};
export const title=task=>taskDisplayTitle(String(task?.content||'').split(/\r?\n/).find(line=>line.trim())?.replace(/^#{1,6}\s+/,''),task?.id || '未命名事情');
export const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function runtimeGroups(snapshot={}) {
  const runtime=snapshot.runtime || {},tasks=snapshot.tasks || [],entries=new Map(),tasksById=new Map(tasks.map(task=>[String(task.id),task]));
  const put=(item,group,reason)=>{const id=String(item.task_id || item.source_task_id || item.id);if(entries.has(id))return;const task=tasksById.get(id);if(!task)return;entries.set(id,{id,task,group,reason});};
  (runtime.recovery_items||[]).forEach(i=>put(i,'attention',i.message||i.reason||'需要恢复'));
  (runtime.attention_items||[]).forEach(i=>put(i,'attention',i.reason||i.question||'需要你处理'));
  (runtime.active_executions||[]).forEach(i=>put(i,['awaiting_human','waiting_external','recovery'].includes(i.phase)?'attention':'running',i.intervention_reason || i.phase));
  (runtime.queue||[]).forEach(i=>put(i,'queued','等待本机执行'));
  return ['attention','running','queued'].map(group=>({group,items:[...entries.values()].filter(i=>i.group===group)}));
}
export function visibleTasks(snapshot,state) {
  const attention=new Set(runtimeGroups(snapshot)[0].items.map(i=>i.id));
  return (snapshot.tasks||[]).filter(task=> (!state.projectIds || state.projectIds.includes(String(task.project_id))) && (state.project==='all'||state.project==='attention'&& (attention.has(String(task.id))||task.state==='completed'||task.state==='blocked')||String(task.project_id)===state.project)
    && (!state.filter||(state.filter==='attention'?(attention.has(String(task.id))||task.state==='completed'||task.state==='blocked'):task.state===state.filter)) && (!state.search||title(task).toLowerCase().includes(state.search.toLowerCase())||String(task.id)===state.search)
    && (!state.executor||String(task.executor_id)===state.executor) && (!state.priority||String(task.priority)===state.priority));
}
export function taskMode(task,snapshot,detail,modes) {
  if(snapshot.scenes?.[task.id]?.pause_requested)return detail?.current_turn_owner?.startsWith('auto:')?'正在暂停':'已暂停';
  const group=modes ? modes.get(String(task.id)) : runtimeGroups(snapshot).find(g=>g.items.some(i=>i.id===String(task.id)))?.group;
  return group?{attention:'待介入',running:'Auto',queued:'已排队'}[group]:stateLabels[task.state]||task.state;
}
export function sceneMessages(detail={}) {
  const messages=[...(detail.messages||[]),...(detail.activity?.messages||[])];
  const seen=new Set();return messages.filter(m=>{if(!m.content)return false;const key=m.id||JSON.stringify([m.role,m.content,m.created_at]);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>String(a.created_at||a.at||'').localeCompare(String(b.created_at||b.at||'')));
}
