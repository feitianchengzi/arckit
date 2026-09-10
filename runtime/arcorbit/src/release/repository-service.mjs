import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
import { simpleGit } from 'simple-git';
import { readFile, realpath, lstat, readlink, stat } from 'node:fs/promises';
import { join, dirname, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digest, validRelative } from './workspace-files.mjs';
const MAX = 4 * 1024 * 1024;
const queues = new Map();
export function serial(key, fn) { const previous=queues.get(key)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);queues.set(key,next);next.finally(()=>{if(queues.get(key)===next)queues.delete(key);}).catch(()=>{});return next; }
const ref = value => { if(typeof value!=='string'||!value||value.startsWith('-')||/[\s\x00-\x1f]/.test(value)||value.length>250)throw new Error('Git 引用无效。');return value; };
const pathArg = value => { validRelative(value); if(!value || value.startsWith('-'))throw new Error('请选择文件。');return value; };
export function createRepositoryService() {
  const confirmations = new Map();
  const client = root => simpleGit({baseDir:root,maxConcurrentProcesses:1,timeout:{block:120000},trimmed:false});
  async function raw(root,args) { const {stdout}=await exec('git',args,{cwd:root,timeout:120000,maxBuffer:MAX,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_EDITOR:process.platform==='win32'?'cmd /c exit':'true'}});return stdout; }
  async function identity(root) { const gitRoot=(await raw(root,['rev-parse','--show-toplevel'])).trim();const common=(await raw(root,['rev-parse','--path-format=absolute','--git-common-dir'])).trim();return {root:await realpath(gitRoot),common:await realpath(common)}; }
  async function snapshot(root) {
    const repo=await identity(root); const git=client(repo.root);
    const status=await git.status();
    const [branches,tags,log,remotes,stashes,rawStatus,index]=await Promise.all([
      git.branchLocal(),git.tags(),git.log({maxCount:60}).catch(()=>({all:[]})),git.getRemotes(true),git.stashList().catch(()=>({all:[]})),raw(repo.root,['status','--porcelain=v2','-z']),raw(repo.root,['ls-files','--stage','-z'])
    ]);
    const diff=await raw(repo.root,['diff','--no-ext-diff','--no-textconv','--raw','--no-abbrev','-z','HEAD']).catch(()=>raw(repo.root,['diff','--no-ext-diff','--no-textconv','--raw','--no-abbrev','-z']));
    const fileVersions=await Promise.all(status.files.map(async f=>{try{const info=await lstat(join(repo.root,f.path));return [f.path,info.size,info.mtimeMs,info.ctimeMs];}catch{return [f.path,'missing'];}}));
    const state=[];for(const marker of ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply']){const location=(await raw(repo.root,['rev-parse','--git-path',marker])).trim();try { await stat(location.startsWith('/')?location:join(repo.root,location));state.push(marker); } catch {} }
    return {...repo,branch:status.current||'',head:log.all[0]?.hash||'',ahead:status.ahead,behind:status.behind,tracking:status.tracking,files:status.files,conflicted:status.conflicted,branches:branches.all,tags:tags.all.slice(-200),log:log.all,remotes,stashes:stashes.all,state,revision:digest((log.all[0]?.hash||'')+(status.current||'')+rawStatus+index+diff+JSON.stringify(fileVersions)),dirty:!status.isClean()};
  }
  async function readDiff(root,input={}) {
    const repo=await identity(root);if(input.ref&&input.path){const revision=ref(input.ref),name=pathArg(input.path);const patch=await raw(repo.root,['show','--format=','--no-ext-diff','--no-textconv',revision,'--',name]);const base=await raw(repo.root,['show',`${revision}^:${name}`]).catch(()=>'');const modified=await raw(repo.root,['show',`${revision}:${name}`]).catch(()=>'');return {patch,base,modified};}const args=['diff','--no-ext-diff','--no-textconv', ...(input.staged?['--cached']:[]), ...(input.ref?[ref(input.ref)]:[]),'--',...(input.path?[pathArg(input.path)]:[])];
    let patch=await raw(repo.root,args);
    const name=input.path;if(!name)return {patch};
    let base='';try {base=await raw(repo.root,['show',input.staged?`HEAD:${name}`:`:${name}`]);}catch{}
    let modified='';if(input.staged){try{modified=await raw(repo.root,['show',`:${name}`]);}catch{}}else{try{const location=join(repo.root,name);const parent=relative(repo.root,await realpath(dirname(location)));if(parent==='..'||parent.startsWith('../')||parent.startsWith('..\\')||isAbsolute(parent))throw new Error('路径超出仓库');const info=await lstat(location);if(info.size>MAX)throw new Error('binary');const bytes=info.isSymbolicLink()?Buffer.from(await readlink(location)):await readFile(location);if(bytes.includes(0)||bytes.length>MAX)throw new Error('binary');modified=bytes.toString();}catch(e){if(e.message==='binary')return {patch,base:'',modified:'',binary:true};}}
    if(!patch&&!base&&modified)patch=`未跟踪文件：${name}`;
    const conflicts={};if(input.conflict)for(const [key,stage] of [['base',1],['ours',2],['theirs',3]]){try{conflicts[key]=await raw(repo.root,['show',`:${stage}:${name}`]);}catch{conflicts[key]='';}}
    return {patch,base,modified,conflicts};
  }
  function argsFor(action,input) {
    const paths=()=>{if(!Array.isArray(input.paths)||!input.paths.length||input.paths.length>1000)throw new Error('请选择文件。');return input.paths.map(pathArg);};
    switch(action){
      case 'stage':return ['add','--',...paths()];
      case 'unstage':return ['reset','--',...paths()];
      case 'commit':if(typeof input.message!=='string'||!input.message.trim()||input.message.length>20000)throw new Error('请填写提交说明。');return ['commit',...(input.amend?['--amend']:[]),'-m',input.message];
      case 'fetch':return ['fetch',ref(input.remote||'origin')];
      case 'pull':return ['pull','--ff-only'];
      case 'push':return ['push',...(input.force?['--force-with-lease']:[]),...(input.remote?[ref(input.remote)]:[]),...(input.ref?[ref(input.ref)]:[])];
      case 'switch':return ['switch',ref(input.ref)];
      case 'branch':return ['switch','-c',ref(input.ref)];
      case 'delete-branch':return ['branch','-d',ref(input.ref)];
      case 'tag':return ['tag',ref(input.ref)];
      case 'delete-tag':return ['tag','-d',ref(input.ref)];
      case 'stash':return ['stash','push','-u','-m',String(input.message||'ArcOrbit stash').slice(0,500)];
      case 'stash-pop':return ['stash','pop',ref(input.ref||'stash@{0}')];
      case 'merge':return ['merge',ref(input.ref)];
      case 'rebase':return ['rebase',ref(input.ref)];
      case 'cherry-pick':return ['cherry-pick',ref(input.ref)];
      case 'revert':return ['revert','--no-edit',ref(input.ref)];
      case 'reset':if(!['soft','mixed','hard'].includes(input.mode))throw new Error('Reset 模式无效。');return ['reset',`--${input.mode}`,ref(input.ref)];
      case 'discard':return ['restore','--worktree','--',...paths()];
      case 'continue':case 'abort':if(!['merge','rebase','cherry-pick','revert'].includes(input.operation))throw new Error('整合操作无效。');return [input.operation,`--${action}`];
      default:throw new Error('不支持的 Git 操作；高级操作可使用 Lazygit 或终端。');
    }
  }
  async function prepare(root,action,input) {
    for(const [key,value] of confirmations)if(value.expires<Date.now())confirmations.delete(key);const snapshotValue=await snapshot(root);const args=argsFor(action,input);const token=randomUUID();
    confirmations.set(token,{root:snapshotValue.root,action,input:JSON.stringify(input),revision:snapshotValue.revision,head:snapshotValue.head,expires:Date.now()+120000});
    return {token,command:['git',...args],root:snapshotValue.root,branch:snapshotValue.branch,head:snapshotValue.head,revision:snapshotValue.revision};
  }
  async function execute(root,action,input={}) {
    const repo=await identity(root);
    return serial(repo.common,async()=>{
      const current=await snapshot(repo.root);
      if(input.revision && input.revision!==current.revision)throw new Error('Git 状态已变化，请刷新后重试。');
      if(['push','discard','reset','delete-branch','delete-tag'].includes(action)||input.amend){const confirmation=confirmations.get(input.token);confirmations.delete(input.token);const {token,...rest}=input;if(!confirmation||confirmation.expires<Date.now()||confirmation.root!==repo.root||confirmation.action!==action||confirmation.input!==JSON.stringify(rest)||confirmation.revision!==current.revision||confirmation.head!==current.head)throw new Error('请先确认当前仓库和精确操作。');}
      let output;
      try {
        if(action==='patch'){
          if(!input.revision||typeof input.patch!=='string'||Buffer.byteLength(input.patch)>MAX)throw new Error('需要当前基线和有效补丁。');
          const {execFile}=await import('node:child_process');
          const runPatch=check=>new Promise((res,rej)=>{const p=execFile('git',['apply','--cached',...(input.reverse?['--reverse']:[]),...(check?['--check']:[]),'-'],{cwd:repo.root,maxBuffer:MAX,timeout:30000},(e,out,err)=>e?rej(new Error(err||e.message)):res(out));p.stdin.end(input.patch);});
          await runPatch(true);output=await runPatch(false);
        }else output=await raw(repo.root,argsFor(action,input));
        return {ok:true,output,snapshot:await snapshot(repo.root)};
      }catch(error){return {ok:false,error:error.message,snapshot:await snapshot(repo.root)};}
    });
  }
  return {snapshot,async diff(root,input={}){const baseline=await snapshot(root);return {...await readDiff(root,input),revision:baseline.revision};},prepare,execute,identity,async history(root,name){const repo=await identity(root);return (await client(repo.root).log(['-60','--follow','--',pathArg(name)])).all;}};
}
