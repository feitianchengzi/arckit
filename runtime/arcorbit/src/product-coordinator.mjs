import { mkdir, realpath, readdir, readFile, lstat, cp } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createProductStore } from './product-store.mjs';
import { createProductGit, githubUrl, runProductCommand } from './product-git.mjs';
import { createChatCoordinator } from './chat-coordinator.mjs';
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const stamp = () => new Date().toISOString();
const objectSchema = properties => ({type:'object',properties,additionalProperties:false});
const text = {type:'string'};
const TOOLS = [
  {type:'function',name:'product_context',description:'读取当前产品记录、修订号、材料授权、待采纳提案、接入计划与真实回执。',inputSchema:objectSchema({})},
  {type:'function',name:'product_materials',description:'列出或读取用户选定材料目录中的有限文件；path 空时列目录。',inputSchema:objectSchema({path:text})},
  {type:'function',name:'product_propose',description:'提出基于当前 revision 的资料补丁或接入计划供用户编辑采纳；不执行外部写入。',inputSchema:objectSchema({revision:{type:'integer'},patch:{type:'object'},plan:{type:'object'},reason:text})},
  {type:'function',name:'product_execute',description:'执行用户在界面已确认的精确接入方案；必须提供上下文中的 approved_digest。',inputSchema:objectSchema({approved_digest:text})}
];
export function createProductCoordinator({ dataDir, protocol, skillPath, getPlatform, getAccountScope, executePlatform, getSettings, getCodexExecutable, assertCodexReady = async()=>{}, createAdapter, runCommand = runProductCommand, git: injectedGit, bindWorkspace = async()=>{} }) {
  if (!protocol) throw new Error('Product protocol is required.');
  const store = createProductStore(join(dataDir,'products.json'), {version:1,ideas:[],controls:{}});
  const emitter = new EventEmitter(); const chats = new Map(); const executions = new Map();
  const git = injectedGit || createProductGit({protocol,run:runCommand});
  const formal = new Map(); let recoveryErrors = []; let refreshPromise;
  let catalogScope = ""; let initialized; let catalog = {projects:[],organizations:[],errors:[]};
  const emit = id => emitter.emit('event',{type:'product.changed',product_id:id});
  async function init() {
    initialized ||= store.update(s => {
      if (s.version !== 1 || !Array.isArray(s.ideas)) throw new Error('不支持的本机产品记录。');
      s.controls ||= {};
      for (const p of s.ideas) for (const step of Object.values(p.receipts || {})) if(step.status === 'started') step.status='uncertain';
    });
    await initialized;
  }
  async function account() { const a = await getAccountScope(); if (!a) throw new Error('请先登录 Workshop。'); return String(a); }
  async function owned(id) {
    await init(); const scope = await account();
    const p = (await store.read()).ideas.find(p=>p.id===id && p.scope===scope) || formal.get(id);
    if(!p || p.scope!==scope) throw new Error('当前账号无法访问这个 Idea。'); return structuredClone(p);
  }
  async function update(id, fn) {
    const scope = await account(); await init(); let result;
    await store.update(async s=>{
      let p=s.ideas.find(p=>p.id===id && p.scope===scope);
      const repo = !p && formal.get(id)?.scope===scope ? structuredClone(formal.get(id)) : null;
      p ||= repo;if(!p)throw new Error('Idea 已不可访问。');
      const before=protocol.digestRecord(p.record);const rev=p.record.revision;
      await fn(p); p.updated_at=stamp();
      if(repo) {
        if(protocol.digestRecord(p.record)!==before) await protocol.writeRecord(p.material_path,p.record,rev);
        const {record,...control}=p;s.controls[`${scope}:${id}`]=control;
      }
      result=structuredClone(p);
    });
    if(result.kind==='formal')formal.set(id,result);
    emit(id);return result;
  }
  async function recover() {
    const scope=await account();const state=await store.read();const next=new Map();recoveryErrors=[];
    for(const remote of catalog.projects || []) {
      if(!remote.local_project_path)continue;
      try {
        const root=await realpath(remote.local_project_path);
        const record=await protocol.readRecord(root);if(!record)continue;
        if(record.idea)githubUrl(remote.git_url);
        const old=state.controls[`${scope}:${record.product_id}`] || {};
        const p={id:record.product_id,scope,kind:'formal',name:remote.name,record,workspace:join(dataDir,'product-workspaces',record.product_id),material_path:root,remote_project_id:String(remote.id),plan:null,proposal:null,approved_digest:'',receipts:{},sync:{status:'unknown',base_sha:'',base_digest:'',url:remote.git_url || ''},created_at:record.idea?.created_at || stamp(),updated_at:old.updated_at || record.idea?.recorded_at || '',...old};
        // Directory binding and remote identity are always from the current catalog.
        Object.assign(p,{record,scope,kind:'formal',name:remote.name,material_path:root,remote_project_id:String(remote.id)});
        if(p.sync.url && p.sync.url!==remote.git_url)p.sync={status:'unknown',base_sha:'',base_digest:'',url:remote.git_url || ''};
        p.sync.url=remote.git_url || '';
        if(p.sync.base_digest && protocol.digestRecord(record)!==p.sync.base_digest && p.sync.status==='shared')p.sync.status='local';
        if(next.has(p.id) && (next.get(p.id).material_path!==root || next.get(p.id).remote_project_id!==p.remote_project_id))throw new Error('多个项目目录包含同一产品身份，请核对绑定。');
        next.set(p.id,p);
      } catch(e) {recoveryErrors.push({project_id:String(remote.id),name:remote.name,message:e.message});}
    }
    formal.clear();for(const [id,p] of next)formal.set(id,p);
    // Only a verified formal record can retire a duplicated temporary record.
    await store.update(s=>{s.ideas=s.ideas.filter(p=>p.scope!==scope || !formal.get(p.id)?.record.idea);});
  }
  async function refresh() {
    if(refreshPromise)return refreshPromise;
    refreshPromise=(async()=>{await init();const scope=await account();const next=await getPlatform();if(await account()!==scope)throw new Error('账号已变化，请重新读取。');catalog=next;catalogScope=scope;await recover();return snapshot();})();
    try{return await refreshPromise;}finally{refreshPromise=null;}
  }
  async function snapshot() {
    await init(); const scope=await account(); if(catalogScope && catalogScope!==scope){catalog={projects:[],organizations:[],errors:[]};formal.clear();catalogScope='';} const local=(await store.read()).ideas.filter(p=>p.scope===scope);
    const selected=new Set((catalog.active_workset?.project_ids || []).map(String));
    const records=[...formal.values()].filter(p=>p.scope===scope);
    const ideas=[...local.filter(p=>p.kind!=='product'),...records.filter(p=>p.record.idea && selected.has(p.remote_project_id))];
    const missing=(catalog.projects || []).filter(p=>selected.has(String(p.id)) && !p.local_project_path).map(p=>({project_id:String(p.id),name:p.name,message:'尚未关联本地目录，无法恢复仓库 Idea。'}));
    return {ideas,records:[...local,...records],projects:catalog.projects || [],organizations:catalog.organizations || [],members:catalog.project_members || [],user:catalog.user || null,errors:[...(catalog.errors || []),...recoveryErrors,...missing],generated_at:stamp()};
  }
  async function create(input={}) {
    await init(); const scope=await account();
    let material=''; if(input.material_path) {material=await realpath(input.material_path);if(!(await lstat(material)).isDirectory())throw new Error('请选择材料目录。');}
    const id=randomUUID(); const workspace=join(dataDir,'product-workspaces',id);
    const p={id,scope,conversation_key:id,kind:input.kind==='product'?'product':'temporary',name:String(input.name || (material?basename(material):'新的 Idea')).slice(0,160),record:protocol.emptyRecord(id),material_path:material,source_path:material,workspace,remote_project_id:'',plan:null,proposal:null,approved_digest:'',receipts:{},sync:{status:'local',base_sha:'',base_digest:'',url:''},created_at:stamp(),updated_at:stamp()};
    await store.update(s=>{s.ideas.push(p);});
    try{await mkdir(workspace,{recursive:true,mode:0o700});}catch(e){return update(id,d=>{d.workspace_error=e.message;});}
    emit(id);return p;
  }
  async function attachRemote(input) {
    const beforeScope=await account();const fresh=await getPlatform();if(await account()!==beforeScope)throw new Error('账号已变化。');catalog=fresh;catalogScope=beforeScope; const remote=fresh.projects?.find(p=>String(p.id)===String(input.project_id));
    if(!remote)throw new Error('项目已不可访问，请刷新目录。');
    const scope=await account(); const existing=(await store.read()).ideas.find(p=>p.scope===scope && p.remote_project_id===String(remote.id));
    if(existing && input.id && existing.id!==input.id)throw new Error('该项目已有本机资料，请打开原记录继续。');
    if(existing && !input.id) return existing;
    const existingFormal=[...formal.values()].find(p=>p.scope===scope && p.remote_project_id===String(remote.id));
    if(existingFormal && input.id && existingFormal.id!==input.id)throw new Error('该项目已包含正式 Idea，请打开原记录。');
    if(existingFormal)return existingFormal;
    const p=input.id ? await owned(input.id) : await create({name:remote.name,kind:'product'});
    return update(p.id,d=>{d.remote_project_id=String(remote.id);d.name=remote.name;d.sync.url=remote.git_url || '';if(d.kind==='product')d.material_path=remote.local_project_path || '';d.approved_digest='';d.receipts.project={status:'completed',result:{id:String(remote.id),name:remote.name,git_url:remote.git_url || ''}};});
  }
  async function materialize(p) {
    if(p.kind!=='product' || !p.material_path)return p;
    const existing=await protocol.readRecord(p.material_path);
    if(existing && protocol.digestRecord(existing)!==protocol.digestRecord(p.record))throw new Error('关联目录已有不同资料，请重新读取目录后比较。');
    if(!existing)await protocol.writeRecord(p.material_path,p.record,null);
    const completed={...p,id:p.record.product_id,kind:'formal'};
    await store.update(s=>{const {record,...control}=completed;s.controls[`${p.scope}:${completed.id}`]=control;s.ideas=s.ideas.filter(d=>d.id!==p.id || d.scope!==p.scope);});
    formal.set(completed.id,completed);emit(completed.id);return completed;
  }
  async function save(input) {
    const saved=await update(input.id,p=>{
      p.record=protocol.reviseRecord(p.record,input.patch,input.revision);
      if(input.name!==undefined){if(!String(input.name).trim())throw new Error('Idea 名称不能为空。');if(!p.remote_project_id)p.name=String(input.name).trim().slice(0,160);}
      p.approved_digest='';p.sync.status='local';
    });
    return materialize(saved);
  }
  function normalizePlan(value={}) {
    if(!value || typeof value !== 'object' || Array.isArray(value))throw new Error('接入方案无效。');
    const keys=['mode','project_id','name','organization_id','repository','git_url','github_owner','github_name','directory'];
    if(Object.keys(value).some(k=>!keys.includes(k)))throw new Error('接入方案包含未知字段。');
    const p=Object.fromEntries(keys.map(k=>[k,String(value[k]||'').trim()]));
    if(!['create','existing'].includes(p.mode) || !['none','existing','create'].includes(p.repository) || !['managed','material'].includes(p.directory))throw new Error('请选择项目、仓库与开发目录安排。');
    if(p.mode==='create' && (!p.name || p.name.length>160))throw new Error('请输入项目名称。');
    if(p.mode==='existing' && !p.project_id)throw new Error('请选择已有项目。');
    if(p.repository==='existing') p.git_url=githubUrl(p.git_url);
    if(p.repository==='create' && (!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(p.github_owner) || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(p.github_name)))throw new Error('GitHub 主体或仓库名无效。');
    if(p.mode==='create' && p.repository==='none')throw new Error('正式录入需要 GitHub 仓库。');
    if(p.mode==='existing' && p.repository!=='none')throw new Error('关联已有项目时沿用该项目的仓库；修改仓库请到项目关系。');
    if(p.mode==='existing'){p.name='';p.organization_id='';p.git_url='';p.github_owner='';p.github_name='';}
    else if(p.repository==='existing'){p.github_owner='';p.github_name='';}
    else p.git_url='';
    return p;
  }
  async function plan(input) { const value=normalizePlan(input.plan); return update(input.id,p=>{if(p.record.revision!==input.revision)throw new Error('资料已变化，请重新读取接入方案。');p.plan=value;p.approved_digest='';}); }
  async function propose(id,input) {
    return update(id,p=>{
      if(p.record.revision!==input.revision)throw new Error('提案基于旧资料，请重新读取。');
      if(input.patch)protocol.reviseRecord(p.record,input.patch,input.revision);
      p.proposal={id:randomUUID(),revision:input.revision,patch:input.patch || {},plan:input.plan?normalizePlan(input.plan):null,reason:String(input.reason||'').slice(0,4000)};
    });
  }
  async function accept(input) { const accepted=await update(input.id,p=>{
    const q=p.proposal;if(!q || q.id!==input.proposal_id || q.revision!==p.record.revision)throw new Error('建议已过期，请重新整理。');
    p.record=protocol.reviseRecord(p.record,q.patch,q.revision);if(q.plan)p.plan=q.plan;p.proposal=null;p.approved_digest='';p.sync.status='local';
  }); return materialize(accepted); }
  async function approve(input) { return update(input.id,p=>{
    if(!p.plan || p.record.revision!==input.revision)throw new Error('方案已变化，请重新确认。');
    if(input.plan_digest!==hash(p.plan))throw new Error('接入参数已变化，请重新确认。');
    p.approved_digest=hash({scope:p.scope,id:p.id,plan:p.plan,revision:p.record.revision});
  }); }
  async function step(id,key,parameters,operation) {
    const fingerprint=hash({step:key,parameters});
    const p=await owned(id);const old=p.receipts[key];
    if(old?.status==='completed'){
      if(old.fingerprint!==fingerprint)throw new Error(`已有 ${key} 成功结果与当前方案参数不一致。请核对并显式关联已有资源。`);
      return old.result;
    }
    if(old && ['started','uncertain'].includes(old.status))throw new Error('上次创建结果待核对，请查找已有资源后关联；不会重复创建。');
    await update(id,p=>{p.receipts[key]={status:'started',fingerprint,parameters,started_at:stamp()};});
    try { const result=await operation(); await update(id,p=>{p.receipts[key]={status:'completed',fingerprint,parameters,result,completed_at:stamp()};});return result; }
    catch(e) {await update(id,p=>{p.receipts[key]={status:'uncertain',fingerprint,parameters,error:String(e.message).slice(0,1000)};});throw new Error(`${key} 结果待核对。${e.message}`);}
  }
  async function execute(input) {
    if(executions.has(input.id))return executions.get(input.id);
    const promise=(async()=>{
      const p=await owned(input.id);const approved=hash({scope:p.scope,id:p.id,plan:p.plan,revision:p.record.revision});
      if(!p.plan || !p.approved_digest || p.approved_digest!==input.approved_digest || approved!==p.approved_digest)throw new Error('请先在界面确认当前接入方案。');
      const plan=p.plan;let remote;
      if(plan.mode==='existing')remote=await attachRemote({id:p.id,project_id:plan.project_id});
      else {
        let url=plan.repository==='existing'?plan.git_url:'';
        if(plan.repository==='create') {
          if(p.receipts.repository?.status!=='completed')await runCommand('gh',['auth','status']);
          const result=await step(p.id,'repository',{owner:plan.github_owner,name:plan.github_name,visibility:'private'},async()=>{
            await runCommand('gh',['repo','create',`${plan.github_owner}/${plan.github_name}`,'--private']);
            const actual=JSON.parse(await runCommand('gh',['repo','view',`${plan.github_owner}/${plan.github_name}`,'--json','url,nameWithOwner']));
            return {url:githubUrl(actual.url),name:actual.nameWithOwner};
          });url=result.url;
        }
        const projectParameters={name:plan.name,organization_id:plan.organization_id || undefined,git_url:url};
        const result=await step(p.id,'project',projectParameters,async()=>{
          // Recheck account before invoking authenticated Platform mutation.
          if(await account()!==p.scope)throw new Error('账号已变化。');
          const r=await executePlatform('project.create',projectParameters);
          const value=r?.data || r;if(!value?.id)throw new Error('服务器没有返回项目身份。');return {id:String(value.id),name:value.name || plan.name,git_url:value.git_url || url};
        });
        remote=await update(p.id,d=>{d.remote_project_id=result.id;d.name=result.name;d.sync.url=result.git_url;});
      }
      const url=githubUrl(remote.sync.url);
      let directory=p.material_path;
      if(plan.directory==='managed') {
        directory=join(dataDir,'projects',p.id);
        await mkdir(join(dataDir,'projects'),{recursive:true,mode:0o700});
        try { await lstat(directory); }
        catch(e) { if(e.code!=='ENOENT')throw e; await runCommand('git',['clone','--',url,directory]); }
      }
      if(!directory)throw new Error('请选择本地 Git 工作目录。');
      let root;
      try {root=await runCommand('git',['-C',directory,'rev-parse','--show-toplevel']);}
      catch {await runCommand('git',['init',directory]);root=directory;}
      if(await realpath(root)!==await realpath(directory))throw new Error('请选择 Git 仓库根目录，不能使用仓库子目录。');
      let origin;
      try{origin=await runCommand('git',['-C',directory,'remote','get-url','origin']);}
      catch{await runCommand('git',['-C',directory,'remote','add','origin',url]);origin=url;}
      const repoKey=x=>githubUrl(x).replace(/^https:\/\/github.com\/|^git@github.com:|^ssh:\/\/git@github.com\//,'').replace(/\.git\/?$|\/$/g,'').toLowerCase();
      if(repoKey(origin)!==repoKey(url))throw new Error('本地目录的 origin 与项目 GitHub 仓库不一致。');
      const latest=await owned(p.id); const existing=await protocol.readRecord(directory);
      if(existing && existing.product_id!==p.record.product_id)throw new Error('目录已属于另一个产品，不能覆盖。');
      if(existing && protocol.digestRecord(existing)!==protocol.digestRecord(latest.record) && existing.idea?.id!==p.id)throw new Error('本地目录已有不同产品资料，请先读取并核对。');
      const record=protocol.validateRecord({...latest.record,revision:Math.max(latest.record.revision,existing?.revision || 0)+1,idea:{id:p.id,name:p.name,created_at:p.created_at,recorded_at:existing?.idea?.recorded_at || stamp()}});
      if(await account()!==p.scope)throw new Error('账号已变化，录入未完成。');
      await protocol.writeRecord(directory,record,existing?.revision ?? null);
      await bindWorkspace(remote.remote_project_id,directory);
      const check=await protocol.readRecord(directory);
      if(protocol.digestRecord(check)!==protocol.digestRecord(record))throw new Error('正式记录读取校验失败，临时内容仍保留。');
      const completed={...latest,kind:'formal',record,material_path:directory,remote_project_id:remote.remote_project_id,name:remote.name,approved_digest:'',sync:{...remote.sync,status:'local'}};
      await store.update(s=>{
        const {record,...control}=completed;s.controls[`${p.scope}:${p.id}`]=control;
        s.ideas=s.ideas.filter(d=>!(d.scope===p.scope && d.id===p.id));
      });
      formal.set(p.id,completed);emit(p.id);return completed;
    })();executions.set(input.id,promise);try{return await promise;}finally{executions.delete(input.id);}
  }
  async function materials(id,input={}) {
    const p=await owned(id);const source=p.source_path || p.material_path;if(!source)return {files:[],notice:'没有选定材料目录。'};
    const forbidden = path => path.split('/').some(n=>/^(\.git|\.env(?:\..*)?|\.ssh|\.aws|node_modules|vendor|credentials.*|.*\.(pem|key|p12|pfx))$/i.test(n));
    if(input.path) {
      if(forbidden(input.path))throw new Error('该文件不属于可读取材料范围。');
      const path=await protocol.safePath(source,input.path);const stat=await lstat(path);
      if(!stat.isFile() || stat.size>150000)throw new Error('只支持 150 KB 内的文本材料；可保留大文件或设计稿引用。');
      const bytes=await readFile(path);if(bytes.includes(0))throw new Error('这是二进制材料，可引用但不能按文本读取。');
      return {path:input.path,content:bytes.toString('utf8')};
    }
    const files=[];async function walk(dir,depth=0){for(const entry of await readdir(join(source,dir),{withFileTypes:true})){const rel=dir?`${dir}/${entry.name}`:entry.name;if(forbidden(rel)||entry.isSymbolicLink())continue;if(files.length>=300)return;if(entry.isDirectory()){if(depth<2)await walk(rel,depth+1);}else files.push(rel);}}
    await walk('');return {files,limit:300};
  }
  async function chooseMaterial(id,path) {if((await owned(id)).kind==='formal')throw new Error('正式工作目录请通过项目绑定管理。');if(executions.has(id))throw new Error('接入正在执行。');const material=await realpath(path);if(!(await lstat(material)).isDirectory())throw new Error('请选择文件夹。');return update(id,p=>{p.material_path=material;p.source_path=material;p.approved_digest='';});}
  async function copyMaterial(id,target) {
    const p=await owned(id);if(executions.has(id)||p.kind==='formal')throw new Error('正式目录请通过项目绑定管理。');if(!p.material_path)throw new Error('尚无材料目录。');
    const base=await realpath(target);const destination=join(base,`idea-${p.id}`);
    try{await lstat(destination);throw new Error('目标目录已存在，不覆盖。');}catch(e){if(e.code!=='ENOENT')throw e;}
    await cp(p.material_path,destination,{recursive:true,errorOnExist:true,force:false,filter:async source=>!(await lstat(source)).isSymbolicLink()});
    return chooseMaterial(id,destination);
  }
  async function sync(input) {
    const p=await owned(input.id);
    if(p.kind==='temporary')throw new Error('Idea 录入未完成，仅保存在本机；正式录入后才能同步。');
    if(input.action==='publish' && input.resolution!=='remote') {
      if(p.kind!=='formal' || !p.material_path)throw new Error('请先将产品资料保存到关联本地目录，再共享。');
      const persisted=await protocol.readRecord(p.material_path);
      if(!persisted || protocol.digestRecord(persisted)!==protocol.digestRecord(p.record))throw new Error('本地产品资料已变化，请重新读取后共享。');
    }
    const url=githubUrl(p.sync.url);const root=join(p.workspace,'product.git');
    if(executions.has(p.id))throw new Error('接入正在执行，稍后再同步。');
    const observed=await git.read(root,url);const localDigest=protocol.digestRecord(p.record);
    const changed=observed.sha!==p.sync.base_sha;const dirty=localDigest!==p.sync.base_digest;
    if(changed && observed.record && dirty && p.record.revision>0 && !input.resolution) {
      return update(p.id,d=>{d.sync={...d.sync,status:'conflict',remote:observed};});
    }
    if(input.action==='read' && !changed && !input.resolution) return p;
    if(input.resolution==='remote' && input.remote_sha!==observed.sha)throw new Error('远端再次变化，请重新比较。');
    if(input.action==='read' || input.resolution==='remote') {
      if(observed.record?.idea && p.kind!=='formal' && !p.material_path)throw new Error('读取到正式 Idea，请先关联本地项目目录再采用。');
      const saved=await update(p.id,d=>{
        if(d.record.revision!==p.record.revision)throw new Error('读取期间资料已修改，请重试。');
        if(observed.record)d.record=observed.record;
        d.sync={...d.sync,status:observed.record?'shared':'local',base_sha:observed.sha,base_digest:observed.record?protocol.digestRecord(observed.record):'',remote:null};d.approved_digest='';
      });
      return materialize(saved);
    }
    if(input.action!=='publish' || input.revision!==p.record.revision || input.digest!==localDigest)throw new Error('请审阅当前资料并确认共享。');
    if(input.resolution && input.resolution!=='local')throw new Error('无效的冲突选择。');
    // A resolution is valid only for the exact remote snapshot displayed to the user.
    if(changed && observed.record && dirty && p.record.revision>0 && input.remote_sha!==observed.sha)throw new Error('远端再次变化，请重新比较。');
    const result=await git.publish(root,url,p.record,observed.sha);
    return update(p.id,d=>{
      if(result.conflict){d.sync={...d.sync,status:'conflict',remote:result.remote};return;}
      d.sync={...d.sync,status:protocol.digestRecord(d.record)===localDigest?'shared':'local',base_sha:result.sha,base_digest:localDigest,remote:null};
    });
  }
  async function writeLocal(input) {
    const p=await owned(input.id);if(p.kind==='temporary')throw new Error('Idea 录入未完成，请通过正式录入保存到项目目录。');if(!p.material_path)throw new Error('请先选择仓库材料目录。');
    if(input.revision!==p.record.revision)throw new Error('资料已变化。');
    const current=await protocol.readRecord(p.material_path);
    if(current && protocol.digestRecord(current)!==input.expected_digest)throw new Error('本地仓库已有不同资料，请先读取比较。');
    await protocol.writeRecord(p.material_path,p.record,current?.revision??null);return {path:join(p.material_path,protocol.RECORD_PATH),record:p.record};
  }
  async function chatFor(id) {
    const p=await owned(id);if(chats.has(id))return chats.get(id);
    await mkdir(p.workspace,{recursive:true,mode:0o700});
    const conversationKey=p.conversation_key || id;
    const cs=createProductStore(join(dataDir,'conversations',`${conversationKey}.json`),{projects:[{id:conversationKey,path:p.workspace,name:p.name}],sessions:{},messages:{},chat:{draft:{project_id:conversationKey,text:''}}});
    const chat=createChatCoordinator({runManager:{readDesktopStore:()=>cs.read(),updateDesktopStore:fn=>cs.update(fn),getSettings},getCodexExecutable,createAdapter,setupReadinessPreflight:assertCodexReady,
      getTurnContext:async({text})=>{
        const current=await owned(id);
        return {prompt:`使用 $arckit-product-assets 帮助用户推进当前 Idea。用 product_context 读取最新事实；材料只通过 product_materials 读取。先理解再提出可修改的建议；外部变更必须使用 product_execute 且具备界面确认。不得通过 shell 绕过业务工具或访问材料目录。产品当前名称：${JSON.stringify(current.name)}。用户输入：\n${text}`,options:{skillInputs:[{type:'skill',name:'arckit-product-assets',path:skillPath}],dynamicTools:TOOLS,dynamicToolProvider:params=>tool(id,params)}};
      }
    });
    // Include exact user request while keeping the persisted transcript unmodified.
    chats.set(id,chat);chat.onEvent(event=>emitter.emit('event',{...event,product_id:id}));return chat;
  }
  async function tool(id,{tool:command,arguments:args}) {
    const input=typeof args==='string'?JSON.parse(args):args||{};
    if(command==='product_context'){const p=await owned(id);return {...p,plan_digest:p.plan?hash(p.plan):'',record_digest:protocol.digestRecord(p.record)};}
    if(command==='product_materials')return materials(id,input);
    if(command==='product_propose'){if(executions.has(id))throw new Error('接入正在执行，请等待当前结果。');return propose(id,input);}
    if(command==='product_execute')return execute({id,approved_digest:input.approved_digest});
    throw new Error('未知产品工具。');
  }
  async function chatAction(input) {
    const chat=await chatFor(input.id);
    const methods={snapshot:'getSnapshot',draft:'createDraft',send:'send',stop:'interrupt',approval:'decideApproval'};
    const method=methods[input.action];if(!method)throw new Error('未知场景会话动作。');
    const {action,id,...payload}=input;const p=await owned(id);return chat[method]({...payload,project_id:p.conversation_key || id});
  }
  async function command(action,input={}) {
    const actions={create,attach:attachRemote,save,plan,accept,approve,execute,sync,writeLocal};
    if(!actions[action])throw new Error('未知产品动作。');
    if(input.id && executions.has(input.id) && !['execute'].includes(action))throw new Error('接入正在执行，请等待当前步骤完成。');
    return actions[action](input);
  }
  return {snapshot,refresh,command,chatAction,chooseMaterial,copyMaterial,materials,tool,async assetLocation(id,path){const p=await owned(id);if(!p.material_path || !p.record.assets.some(a=>a.path===path))throw new Error('资产不在当前产品引用中。');if(!/\.(md|txt|json|yaml|yml|html|pdf|png|jpe?g|webp|svg|fig)$/i.test(path))throw new Error('该类型请在项目编辑器中打开。');return protocol.safePath(p.material_path,path);},async detail(id){const p=await owned(id);return {...p,plan_digest:p.plan?hash(p.plan):'',record_digest:protocol.digestRecord(p.record)};},onEvent(fn){emitter.on('event',fn);return()=>emitter.off('event',fn);},async close(){await Promise.all([...chats.values()].map(c=>c.close()));}};
}
