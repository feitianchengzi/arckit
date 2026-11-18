const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value ? new Date(value).toLocaleString() : '—';
export function createStallDiagnostics({root,api,projects,selectedProject,onAnalyze,confirm = message => window.confirm(message)}) {
  let data = null, range = '24h', busy = false, projectId = '', visible = 30;
  let savedPrompt = null, dirty = false;
  root.innerHTML = `<h3>运行诊断</h3><p class="settings-lead">此设备后台持续记录卡顿，不弹窗。记录保留最近 7 天，最多 20 MiB。</p>
    <label class="field"><span>时间范围</span><select data-range><option value="24h">最近 24 小时</option><option value="7d">最近 7 天</option><option value="all">全部留存记录</option></select></label>
    <p data-summary role="status">正在读取…</p><details><summary>历史记录</summary><div data-records></div><button type="button" class="secondary-button" data-more hidden>查看更多</button></details>
    <label class="field"><span>分析使用的工作区</span><select data-project></select></label>
    <p class="settings-lead">打开新 Chat，发送分析 Prompt、日志目录和时间范围，由 Agent 自行读取日志。分析不删除记录。</p>
    <details data-prompt-panel><summary>查看和编辑分析 Prompt</summary>
      <p class="settings-lead">保留 {日志目录} 和 {时间范围}，分析时会自动填入实际内容。修改仅保存在此设备。</p>
      <label class="field"><span>分析 Prompt</span><textarea data-prompt rows="16" maxlength="16000" spellcheck="false" aria-describedby="stallPromptStatus"></textarea></label>
      <div class="pw-settings-actions"><button type="button" class="primary-button" data-prompt-save>保存 Prompt</button><button type="button" class="secondary-button" data-prompt-reset>恢复默认并保存</button></div>
      <p id="stallPromptStatus" data-prompt-status role="status" aria-live="polite"></p>
    </details>
    <div class="pw-settings-actions"><button type="button" class="primary-button" data-analyze>分析卡顿</button><button type="button" class="secondary-button" data-refresh>刷新</button><button type="button" class="secondary-button" data-clear>清理当前范围</button></div><p data-status role="status" aria-live="polite"></p>`;
  const el = name => root.querySelector(`[data-${name}]`);
  function controls() {
    for(const name of ['analyze','clear','refresh','range','project']) el(name).disabled = busy;
    el('analyze').disabled = busy || !data?.count || !el('project').value || savedPrompt === null || dirty;
    el('prompt').disabled = busy;
    el('prompt-save').disabled = busy || !dirty;
    el('prompt-reset').disabled = busy;
    el('clear').disabled = busy || !data?.count;
  }
  function render() {
    const options = projects();
    projectId = options.some(p=>p.id===projectId) ? projectId : selectedProject();
    el('project').innerHTML = options.length ? options.map(p=>`<option value="${escape(p.id)}">${escape(p.name || p.id)}</option>`).join('') : '<option value="">暂无可用工作区</option>';
    el('project').value = projectId;
    el('summary').textContent = data ? `${data.count} 次卡顿 · 最长心跳间隔 ${(data.max_gap_ms/1000).toFixed(2)} 秒 · 最近发生 ${date(data.records[0]?.started_at)}${data.unreadable ? ` · ${data.unreadable} 个文件无法读取` : ''}` : '读取失败，请重试';
    el('records').innerHTML = data?.count ? data.records.slice(0,visible).map(r=>`<p>${escape(date(r.started_at))} · ${r.source==='main'?'主进程':'渲染进程'} · ${(Number(r.max_gap_ms || 0)/1000).toFixed(2)} 秒${r.recovered_at?'':' · 记录未完成'}${r.version?` · ${escape(r.version)}`:''}</p>`).join('') : '<p>所选范围内暂无卡顿记录。</p>';
    el('more').hidden = !data || visible >= data.count;
    controls();
  }
  function acceptPrompt(settings) {
    savedPrompt = settings.template;
    el('prompt').value = settings.template;
    el('prompt').maxLength = settings.max_length;
    dirty = false;
    el('prompt-status').textContent = settings.is_default ? '当前使用默认 Prompt' : '当前使用已保存的自定义 Prompt';
  }
  async function savePrompt(reset = false) {
    if (busy) return;
    busy = true; controls();
    el('prompt-status').textContent = '正在保存…';
    try { acceptPrompt(await api.saveStallPrompt(reset ? null : el('prompt').value)); }
    catch (error) { el('prompt-status').textContent = error.message || '保存失败，修改尚未生效'; }
    finally { busy = false; controls(); }
  }
  el('prompt').addEventListener('input', () => {
    dirty = el('prompt').value !== savedPrompt;
    el('prompt-status').textContent = dirty ? '有未保存的修改，请先保存再分析。' : '没有未保存的修改';
    controls();
  });
  el('prompt-save').addEventListener('click', () => savePrompt());
  el('prompt-reset').addEventListener('click', () => savePrompt(true));
  async function refresh() {
    if(busy) return;
    busy=true;controls();el('status').textContent='';
    try {data=await api.stallOverview(range);}
    catch(error) {data=null;el('status').textContent=error.message || '读取失败';}
    finally {
      if (savedPrompt === null && !dirty) {
        try { acceptPrompt(await api.stallPrompt()); }
        catch (error) { el('prompt-status').textContent = error.message || 'Prompt 读取失败，请重试或恢复默认'; }
      }
      busy=false;render();
    }
  }
  el('range').addEventListener('change',()=>{range=el('range').value;visible=30;void refresh();});
  el('project').addEventListener('change',()=>{projectId=el('project').value;controls();});
  el('refresh').addEventListener('click',refresh);
  el('more').addEventListener('click',()=>{visible+=30;render();});
  el('analyze').addEventListener('click',async()=>{
    if(busy || dirty || savedPrompt === null || !data?.count || !el('project').value) return;
    const project=el('project').value;
    busy=true;controls();el('status').textContent='正在准备诊断上下文…';
    try {await onAnalyze(await api.stallAnalysis(range),project);el('status').textContent='已进入 Chat';}
    catch(error) {el('status').textContent=error.message || '分析启动失败，请重试';}
    finally {busy=false;controls();}
  });
  el('clear').addEventListener('click',async()=>{
    if(busy || !data || !confirm('删除当前范围的本地卡顿记录？正在采集的记录会保留。此操作不会删除 Chat。')) return;
    const tokens=data.records.map(r=>r.token);
    busy=true;controls();
    try {const result=await api.clearStalls(tokens);data=await api.stallOverview(range);el('status').textContent=`已删除 ${result.deleted} 条记录；新增、变化或正在采集的记录会保留。`;}
    catch(error) {el('status').textContent=error.message || '清理失败，请刷新确认';}
    finally {busy=false;render();}
  });
  controls();
  return {refresh};
}
