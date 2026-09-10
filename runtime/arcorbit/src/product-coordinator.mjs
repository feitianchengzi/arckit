import { mkdir, realpath, readdir, readFile, lstat, cp } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createProductStore } from './product-store.mjs';
import { createProductGit, githubUrl, runProductCommand } from './product-git.mjs';
import { createChatCoordinator } from './chat-coordinator.mjs';
import { intakeInteraction } from './product-intake-context.mjs';
import { inspectWorkspace, materialManifest, prepareWorkspace } from './product-workspace.mjs';
import { intakeMissing } from './product-intake-state.mjs';
import { buildCommandEnvironment, describeCommandEnvironment } from './local-command-runtime.mjs';
import { buildRuntimeEnv } from './desktop/desktop-store.mjs';
import { inspectProductEnvironment } from './product-environment.mjs';
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const stamp = () => new Date().toISOString();
const objectSchema = properties => ({type:'object',properties,additionalProperties:false});
const text = {type:'string'};
const TOOLS = [
  {type:'function',name:'product_context',description:'读取当前产品记录、修订号、材料授权、待采纳提案、接入计划与真实回执。',inputSchema:objectSchema({})},
  {type:'function',name:'product_materials',description:'列出或读取用户选定材料目录中的有限文件；path 空时列目录。',inputSchema:objectSchema({path:text})},
  {type:'function',name:'product_environment',description:'只读检查已授权材料目录的 Git 根与 origin；github=true 时查询当前 GitHub 账号及组织候选，失败返回未知。',inputSchema:objectSchema({github:{type:'boolean'}})},
  {type:'function',name:'product_propose',description:'提出基于当前 revision 的资料补丁或接入计划供用户编辑采纳；不执行外部写入。',inputSchema:objectSchema({revision:{type:'integer'},patch:{type:'object'},plan:{type:'object'},reason:text})},
  {type:'function',name:'product_execute',description:'执行用户在界面已确认的精确接入方案；必须提供上下文中的 approved_digest。',inputSchema:objectSchema({approved_digest:text})}
];
export function createProductCoordinator({ dataDir, privateRoot = dataDir, protocol, skillPath, getPlatform, getAccountScope, executePlatform, getSettings, getCodexExecutable, assertCodexReady = async()=>{}, createAdapter, runCommand = runProductCommand, git: injectedGit, bindWorkspace = async()=>{} }) {
  if (!protocol) throw new Error('Product protocol is required.');
  const suppliedRun=runCommand;
  async function commandEnvironment() {
    let executable;
    try{executable=getCodexExecutable?.();}catch{/* Codex readiness gates Agent turns, not independent Git/gh operations. */}
    return buildCommandEnvironment(buildRuntimeEnv({...process.env},await getSettings()),{pathEntries:executable?.pathEntries || []});
  }
  runCommand=async(bin,args,options={})=>suppliedRun(bin,args,{...options,env:{...await commandEnvironment(),...options.env}});
  const store = createProductStore(join(dataDir,'products.json'), {version:1,ideas:[],controls:{}});
  const emitter = new EventEmitter(); const chats = new Map(); const chatStores = new Map(); const chatInitializations = new Map(); const preparations = new Map(); const executions = new Map();
  const git = injectedGit || createProductGit({protocol,run:runCommand});
  const formal = new Map(); let recoveryErrors = []; let refreshPromise;
  let catalogScope = ""; let initialized; let catalog = {projects:[],organizations:[],errors:[]};
  const emit = id => emitter.emit('event',{type:'product.changed',product_id:id});
  async function init() {
    initialized ||= store.update(s => {
      if (s.version !== 1 || !Array.isArray(s.ideas)) throw new Error('不支持的本机产品记录。');
      s.controls ||= {};
      for (const p of s.ideas) {
        if(p.plan?.directory==='managed' || p.proposal?.plan?.directory==='managed'){
          if(p.plan?.directory==='managed')p.plan={...p.plan,directory:'selected',workspace_path:''};
          p.proposal=null;p.approved_digest='';p.record=protocol.reviseRecord(p.record,{},p.record.revision);
          p.directory_notice='旧托管目录方案已停用，请选择你自己的正式工作目录。';
        }
        if(['starting','running'].includes(p.analysis?.status))p.analysis.status='interrupted';if(p.intake_execution?.status==='running')p.intake_execution={status:'failed',error:'上次接入已中断，请核对已有步骤后继续。'}; }
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
  function normalizePlan(value={}, partial=false) {
    if(!value || typeof value !== 'object' || Array.isArray(value))throw new Error('接入方案无效。');
    const keys=['mode','project_id','name','organization_id','repository','git_url','github_owner','github_name','directory','workspace_path'];
    if(Object.keys(value).some(k=>!keys.includes(k)))throw new Error('接入方案包含未知字段。');
    const p=Object.fromEntries(keys.map(k=>[k,String(value[k]||'').trim()]));
    if(p.directory==='managed'){p.directory='selected';p.workspace_path='';}
    if(p.directory==='material')p.workspace_path='';
    if(!['create','existing'].includes(p.mode) || !['none','existing','create'].includes(p.repository) || !['selected','material'].includes(p.directory))throw new Error('请选择项目、仓库与开发目录安排。');
    if(!partial && p.mode==='create' && (!p.name || p.name.length>160))throw new Error('请输入项目名称。');
    if(!partial && p.mode==='existing' && !p.project_id)throw new Error('请选择已有项目。');
    if(p.repository==='existing' && (p.git_url || !partial)) p.git_url=githubUrl(p.git_url);
    if(!partial && p.repository==='create' && (!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(p.github_owner) || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(p.github_name)))throw new Error('GitHub 主体或仓库名无效。');
    if(p.mode==='create' && p.repository==='none')throw new Error('正式录入需要 GitHub 仓库。');
    if(p.mode==='existing' && p.repository!=='none')throw new Error('关联已有项目时沿用该项目的仓库；修改仓库请到项目关系。');
    if(p.mode==='existing'){p.name='';p.organization_id='';p.git_url='';p.github_owner='';p.github_name='';}
    else if(p.repository==='existing'){p.github_owner='';p.github_name='';}
    else p.git_url='';
    return p;
  }
  async function plan(input) { const value=normalizePlan(input.plan,true); return update(input.id,p=>{if(p.record.revision!==input.revision)throw new Error('资料已变化，请重新读取接入方案。');p.plan=value;p.record=protocol.reviseRecord(p.record,{},p.record.revision);p.approved_digest='';}); }
  async function propose(id,input) {
    return update(id,p=>{
      if(p.record.revision!==input.revision)throw new Error('提案基于旧资料，请重新读取。');
      if(input.patch)protocol.reviseRecord(p.record,input.patch,input.revision);
      p.proposal={id:randomUUID(),revision:input.revision,patch:input.patch || {},plan:input.plan?normalizePlan(input.plan,true):null,reason:String(input.reason||'').slice(0,4000)};
    });
  }
  async function accept(input) { const accepted=await update(input.id,p=>{
    const q=p.proposal;if(!q || q.id!==input.proposal_id || q.revision!==p.record.revision)throw new Error('建议已过期，请重新整理。');
    p.record=protocol.reviseRecord(p.record,q.patch,q.revision);if(q.plan)p.plan=q.plan;p.proposal=null;p.approved_digest='';p.sync.status='local';
  }); return materialize(accepted); }
  async function approve(input) { const scope=await account();const fresh=await getPlatform();if(await account()!==scope)throw new Error('账号已变化。');catalog=fresh;catalogScope=scope;return update(input.id,p=>{
    if(!p.plan || p.record.revision!==input.revision)throw new Error('方案已变化，请重新确认。');
    normalizePlan(p.plan);const missing=intakeMissing(p.plan,p,catalog.projects);if(missing.length)throw new Error(missing[0].message);
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
      await update(p.id,d=>{d.intake_execution={status:'running'};});
      const plan=normalizePlan(p.plan);let remote;
      const missing=intakeMissing(plan,p,catalog.projects);if(missing.length)throw new Error(missing[0].message);
      const intendedUrl=plan.mode==='existing'?catalog.projects?.find(x=>String(x.id)===plan.project_id)?.git_url:plan.repository==='create'?`https://github.com/${plan.github_owner}/${plan.github_name}`:plan.git_url;
      const inspection=await inspectWorkspace({p,plan,projects:catalog.projects,dataDir:privateRoot,run:runCommand,url:githubUrl(intendedUrl)});
      for(const path of new Set([inspection.target,inspection.source].filter(Boolean))){
        const record=await protocol.readRecord(path);if(record && record.product_id!==p.id)throw new Error('目录已属于另一个产品，不能覆盖或复制其管理记录。');
      }
      const manifest=await materialManifest(inspection.source,inspection.target);
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
      const verified=await inspectWorkspace({p,plan,projects:catalog.projects,dataDir:privateRoot,run:runCommand,url});
      const workspaceResult=await prepareWorkspace({inspection:verified,url,run:runCommand,manifest,beforeCopy:async target=>{const record=await protocol.readRecord(target);if(record && record.product_id!==p.id)throw new Error('克隆仓库已属于另一个产品，未复制材料。');}});
      const directory=workspaceResult.path;
      await update(p.id,d=>{d.receipts.workspace={status:'completed',result:workspaceResult,completed_at:stamp()};});
      const latest=await owned(p.id); const existing=await protocol.readRecord(directory);
      if(existing && existing.product_id!==p.record.product_id)throw new Error('目录已属于另一个产品，不能覆盖。');
      if(existing && protocol.digestRecord(existing)!==protocol.digestRecord(latest.record) && existing.idea?.id!==p.id)throw new Error('本地目录已有不同产品资料，请先读取并核对。');
      const record=protocol.validateRecord({...latest.record,revision:Math.max(latest.record.revision,existing?.revision || 0)+1,idea:{id:p.id,name:p.name,created_at:p.created_at,recorded_at:existing?.idea?.recorded_at || stamp()}});
      if(await account()!==p.scope)throw new Error('账号已变化，录入未完成。');
      await protocol.writeRecord(directory,record,existing?.revision ?? null);
      await bindWorkspace(remote.remote_project_id,directory);
      const check=await protocol.readRecord(directory);
      if(protocol.digestRecord(check)!==protocol.digestRecord(record))throw new Error('正式记录读取校验失败，临时内容仍保留。');
      const completed={...latest,kind:'formal',record,environment:null,material_path:directory,remote_project_id:remote.remote_project_id,name:remote.name,approved_digest:'',intake_execution:{status:'completed'},sync:{...remote.sync,status:'local'}};
      await store.update(s=>{
        const {record,...control}=completed;s.controls[`${p.scope}:${p.id}`]=control;
        s.ideas=s.ideas.filter(d=>!(d.scope===p.scope && d.id===p.id));
      });
      formal.set(p.id,completed);emit(p.id);return completed;
    })();executions.set(input.id,promise);try{return await promise;}catch(e){await update(input.id,p=>{p.intake_execution={status:'failed',error:e.message};}).catch(()=>{});throw e;}finally{executions.delete(input.id);}
  }
  async function materials(id,input={}) {
    const p=await owned(id);const source=p.kind==='formal'?p.material_path:p.source_path || p.material_path;if(!source)return {files:[],notice:'没有选定材料目录。'};
    const forbidden = path => path.split('/').some(n=>/^(\.git|\.env(?:\..*)?|\.ssh|\.aws|node_modules|vendor|credentials.*|.*\.(pem|key|p12|pfx))$/i.test(n));
    if(input.path) {
      if(forbidden(input.path))throw new Error('该文件不属于可读取材料范围。');
      const path=await protocol.safePath(source,input.path);const stat=await lstat(path);
      if(/\.(png|jpe?g|webp)$/i.test(input.path)) {
        if(!stat.isFile() || stat.size>5_000_000)throw new Error('图片限 5 MB，请提供较小导出图。');
        const bytes=await readFile(path);const hex=bytes.subarray(0,12).toString('hex');
        const mime=hex.startsWith('89504e470d0a1a0a')?'image/png':hex.startsWith('ffd8ff')?'image/jpeg':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':'';
        if(!mime)throw new Error('图片格式无法确认，请导出 PNG/JPEG/WebP。');
        return {contentItems:[{type:'inputText',text:`已授权材料图片：${input.path}`},{type:'inputImage',imageUrl:`data:${mime};base64,${bytes.toString('base64')}`}]};
      }
      if(/\.(fig|sketch|psd|ai|pdf|zip)$/i.test(input.path))throw new Error('该设计源文件暂不能直接理解，请提供 PNG/JPEG/WebP 导出图或文字说明；原文件可保留引用。');
      if(!stat.isFile() || stat.size>150000)throw new Error('只支持 150 KB 内的文本材料；可保留大文件或设计稿引用。');
      const bytes=await readFile(path);if(bytes.includes(0))throw new Error('这是二进制材料，可引用但不能按文本读取。');
      return {path:input.path,content:bytes.toString('utf8')};
    }
    const files=[];async function walk(dir,depth=0){for(const entry of await readdir(join(source,dir),{withFileTypes:true})){const rel=dir?`${dir}/${entry.name}`:entry.name;if(forbidden(rel)||entry.isSymbolicLink())continue;if(files.length>=300)return;if(entry.isDirectory()){if(depth<2)await walk(rel,depth+1);}else files.push(rel);}}
    await walk('');return {files,limit:300,supported_images:['png','jpg','jpeg','webp'],notice:'文本限 150 KB，图片限 5 MB。设计源文件、PDF 和压缩包请提供导出图或说明。'};
  }
  async function chooseMaterial(id,path) {if((await owned(id)).kind==='formal')throw new Error('正式工作目录请通过项目绑定管理。');if(executions.has(id))throw new Error('接入正在执行。');const material=await realpath(path);if(!(await lstat(material)).isDirectory())throw new Error('请选择文件夹。');return update(id,p=>{p.material_path=material;p.source_path=material;p.record=protocol.reviseRecord(p.record,{},p.record.revision);p.proposal=null;p.approved_digest='';p.environment=null;p.analysis=null;});}
  async function chooseWorkspace(id,path) {
    const p=await owned(id);if(p.kind==='formal'||executions.has(id))throw new Error('正式目录请通过项目绑定管理，执行中不可更改。');
    const target=await realpath(path);if(!(await lstat(target)).isDirectory())throw new Error('请选择文件夹。');
    // Only this native-picker entrypoint grants a new path; plan/propose cannot.
    await update(id,d=>{d.workspace_grants=[...new Set([...(d.workspace_grants || []),target])];});
    return {path:target};
  }
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
  function contextCandidates() {
    return {projects:(catalog.projects || []).map(p=>({id:String(p.id),name:p.name,organization_id:p.organization_id,git_url:p.git_url,local_project_path:p.local_project_path})),organizations:(catalog.organizations || []).map(o=>({id:String(o.id),name:o.name})),members:(catalog.project_members || []).map(m=>({project_id:String(m.project_id),user_id:m.user_id,name:m.name || m.username,role:m.role})),user:catalog.user?{id:catalog.user.id,name:catalog.user.name || catalog.user.username}:null};
  }
  async function environment(id,github=false) {
    const p=await owned(id),env=await commandEnvironment();const result=await inspectProductEnvironment(p,{run:runCommand,includeGithub:github,env});
    const now=await owned(id);if(now.source_path!==p.source_path || now.material_path!==p.material_path)throw new Error('材料目录已变化，请重新检查。');
    await update(id,d=>{d.environment=result;});return result;
  }
  async function review(input) {
    const value=input.plan?normalizePlan(input.plan,true):null;
    const result=await update(input.id,p=>{
      if(p.record.revision!==input.revision)throw new Error('资料已变化，你的修改仍保留；请比较后重新整理。');
      if(input.proposal_id && (p.proposal?.id!==input.proposal_id || p.proposal.revision!==input.revision))throw new Error('建议已过期，请读取新建议后再保存。');
      p.record=protocol.reviseRecord(p.record,input.patch || {},input.revision);
      if(input.name!==undefined && !p.remote_project_id){const name=String(input.name).trim();if(!name || name.length>160)throw new Error('请填写 Idea 名称（最多 160 字）。');p.name=name;}
      p.plan=value;p.proposal=null;p.approved_digest='';p.sync.status='local';p.intake_execution=null;
    });
    await note(input.id,`你通过界面保存了 Idea「${result.name}」的资料${value?'和接入方案':''}。Agent 将使用这份最新内容。`);
    return materialize(result);
  }
  async function note(id,content) {
    await chatFor(id);const cs=chatStores.get(id);const p=await owned(id);
    await cs.update(s=>{
      const sid=s.chat?.selected_session_id;const message={id:randomUUID(),role:'tool',kind:'tool',content,status:'completed',created_at:stamp()};
      if(sid)(s.messages[sid] ||= []).push(message);
      else {s.product_notes ||= [];s.product_notes.push(message);}
    });emit(p.id);
  }
  async function prepare(input) {
    if(preparations.has(input.id))return preparations.get(input.id);
    const promise=(async()=>{
      const p=await owned(input.id);const chat=await chatFor(input.id);const snap=await chat.getSnapshot();
      const session=snap.sessions.find(s=>s.id===snap.selected_session_id) || snap.sessions[0];
      if(['starting','running','waiting_approval','interrupting'].includes(session?.status))return snap;
      if(input.automatic && p.analysis?.attempt_id)return snap;
      const attempt=randomUUID();await update(p.id,d=>{d.analysis={status:'starting',attempt_id:attempt};d.intake_execution=null;});
      try {
        const result=await chat.send({project_id:p.conversation_key || p.id,session_id:session?.id || '',client_request_id:attempt,text:p.material_path?'请查看我选择的材料，识别这个应用及已有 Git 仓库，查询可用项目与组织，准备可修改的 Idea 接入方案。能确定的先整理，只问必须由我决定的信息。':String(input.text || '请根据当前已保存的想法，帮我整理并准备 Idea 接入方案，只问必要的信息。')});
        await update(p.id,d=>{d.analysis={status:'started',attempt_id:attempt};});return result;
      }catch(e){await update(p.id,d=>{d.analysis={status:'failed',attempt_id:attempt,error:e.message};});throw e;}
    })();preparations.set(input.id,promise);try{return await promise;}finally{preparations.delete(input.id);}
  }
  async function chatFor(id) {
    await owned(id);if(chats.has(id))return chats.get(id);
    if(!chatInitializations.has(id))chatInitializations.set(id,createSceneChat(id));
    try{return await chatInitializations.get(id);}finally{chatInitializations.delete(id);}
  }
  async function createSceneChat(id) {
    const p=await owned(id);if(chats.has(id))return chats.get(id);
    await mkdir(p.workspace,{recursive:true,mode:0o700});
    const conversationKey=p.conversation_key || id;
    const cs=createProductStore(join(dataDir,'conversations',`${conversationKey}.json`),{projects:[{id:conversationKey,path:p.workspace,name:p.name}],sessions:{},messages:{},chat:{draft:{project_id:conversationKey,text:''}}});
    const chat=createChatCoordinator({runManager:{readDesktopStore:()=>cs.read(),updateDesktopStore:fn=>cs.update(fn),getSettings},getCodexExecutable,createAdapter,setupReadinessPreflight:assertCodexReady,
      getTurnContext:async({text})=>{
        const current=await owned(id),env=await commandEnvironment();
        return {prompt:`使用 $arckit-product-assets 帮助用户推进当前 Idea。用 product_context 读取最新事实；interaction 是左侧界面的字段语义、当前选项、实际目录、材料处理及可用动作。用户问“正式工作目录/这个选项”时先对应 interaction.fields，不从 workspace 猜测正式目录。需要其他位置时引导使用左侧选择器；可通过 product_propose 建议已授权或已有项目绑定路径。区分已保存 plan 与待采纳 proposal，解释复制/原地保留与提交/推送的区别。材料正文与图片优先通过 product_materials 读取。先理解再提出可修改的建议；外部变更必须使用 product_execute 且具备界面确认。允许使用 Codex 原生命令在授权材料、已选正式目录、Git 元数据和相关工具安装信息范围内只读探索。不要读取凭据正文或无关项目，不得通过 shell 绕过业务确认做写入、安装、登录修改或创建远端资源。原生命令默认 readOnly 且无网络，确需超出时使用可见审批；readOnly 不等于目录级读取隔离。本次目标是完成 Idea 接入准备与经确认的接入执行。自主决定如何理解与排查，不必遵循固定检测顺序。product_context 包含应用命令环境和带时间的检测结果；快捷检查失败不是终点，不代表未登录或没有仓库。可使用原生 command 查 PATH、定位并以绝对路径验证程序、读取相关 Git 元数据，再按证据提出结论。区分原生命令与应用工具的执行来源；检查失败后使用诊断判断下一步，不重复要求登录。若会话支持 product_environment，可主动重新核对；旧线程保持原生探索能力。使用 product_context.candidates 中的真实候选；不得编造项目/组织身份。先给出名称、简要说明和接入方案，不要求填写全部理念。方案可以不完整，缺失信息先提出问题并将可完成部分通过 product_propose 返回。用户修改后以最新事实为准，已确认时调用 product_execute 并核对结果。产品当前名称：${JSON.stringify(current.name)}。用户输入：\n${text}`,options:{commandEnvironment:env,sandboxPolicy:{type:'readOnly',networkAccess:false},skillInputs:[{type:'skill',name:'arckit-product-assets',path:skillPath}],dynamicTools:TOOLS,dynamicToolProvider:params=>tool(id,params)}};
      }
    });
    chatStores.set(id,cs);
    // Include exact user request while keeping the persisted transcript unmodified.
    chats.set(id,chat);chat.onEvent(event=>emitter.emit('event',{...event,product_id:id}));return chat;
  }
  async function tool(id,{tool:command,arguments:args}) {
    const input=typeof args==='string'?JSON.parse(args):args||{};
    if(command==='product_context'){await refresh();const p=await owned(id);return {...p,interaction:intakeInteraction(p,contextCandidates()),command_environment:await describeCommandEnvironment(await commandEnvironment()),exploration:{native_commands:'read-only',network_access:false,authorized_material:p.kind==='formal'?p.material_path:p.source_path || p.material_path,authorized_workspace:intakeInteraction(p,contextCandidates()).locations.formal_workspace,scope:'材料、相关 Git 元数据与工具安装；不读取凭据正文、不绕过业务写入确认',cached_environment: Boolean(p.environment)},candidates:contextCandidates(),missing:intakeMissing(p.plan,p,catalog.projects),plan_digest:p.plan?hash(p.plan):'',record_digest:protocol.digestRecord(p.record)};}
    if(command==='product_environment')return environment(id,input.github===true);
    if(command==='product_materials')return materials(id,input);
    if(command==='product_propose'){if(executions.has(id))throw new Error('接入正在执行，请等待当前结果。');return propose(id,input);}
    if(command==='product_execute')return execute({id,approved_digest:input.approved_digest});
    throw new Error('未知产品工具。');
  }
  async function chatAction(input) {
    const chat=await chatFor(input.id);
    if(input.action==='prepare')return prepare(input);
    const methods={snapshot:'getSnapshot',draft:'createDraft',send:'send',stop:'interrupt',approval:'decideApproval'};
    const method=methods[input.action];if(!method)throw new Error('未知场景会话动作。');
    const {action,id,...payload}=input;const p=await owned(id);const result=await chat[method]({...payload,project_id:p.conversation_key || id});
    if(method==='getSnapshot'){const notes=(await chatStores.get(id).read()).product_notes || [];result.messages=[...notes,...result.messages];}return result;
  }
  async function command(action,input={}) {
    const actions={create,attach:attachRemote,save,plan,review,accept,approve,execute,sync,writeLocal,environment:i=>environment(i.id,true)};
    if(!actions[action])throw new Error('未知产品动作。');
    if(input.id && executions.has(input.id) && !['execute'].includes(action))throw new Error('接入正在执行，请等待当前步骤完成。');
    return actions[action](input);
  }
  return {snapshot,refresh,command,chatAction,chooseMaterial,chooseWorkspace,copyMaterial,materials,tool,async assetLocation(id,path){const p=await owned(id);if(!p.material_path || !p.record.assets.some(a=>a.path===path))throw new Error('资产不在当前产品引用中。');if(!/\.(md|txt|json|yaml|yml|html|pdf|png|jpe?g|webp|svg|fig)$/i.test(path))throw new Error('该类型请在项目编辑器中打开。');return protocol.safePath(p.material_path,path);},async detail(id){const p=await owned(id);return {...p,plan_digest:p.plan?hash(p.plan):'',record_digest:protocol.digestRecord(p.record)};},onEvent(fn){emitter.on('event',fn);return()=>emitter.off('event',fn);},async close(){await Promise.all([...chats.values()].map(c=>c.close()));}};
}
