import { lstat, realpath, readdir, mkdir, copyFile } from 'node:fs/promises';
import { createReadStream, constants } from 'node:fs';
import pathApi, { join, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { githubUrl } from './product-git.mjs';
const key=x=>githubUrl(x.trim()).replace(/^https:\/\/github.com\/|^git@github.com:|^ssh:\/\/git@github.com\//,'').replace(/\.git\/?$|\/$/g,'').toLowerCase();
const digest=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');};
export function workspaceContains(root,path,paths=pathApi){const r=paths.relative(root,path);return !r || (!r.startsWith('..'+paths.sep) && r!=='..' && !paths.isAbsolute(r));}
const excluded=n=>/^(\.git|\.env(?:\..*)?|\.ssh|\.aws|node_modules|vendor|\.DS_Store|build|dist|\.build|DerivedData|credentials.*|.*\.(pem|key|p12|pfx))$/i.test(n);
async function stat(path){try{return await lstat(path);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
export async function inspectWorkspace({p,plan,projects=[],dataDir,run,url}) {
  if(plan.directory==='managed')throw new Error('旧托管目录方案已停用，请重新选择正式工作目录。');
  const value=plan.directory==='material'?p.material_path:plan.workspace_path;
  if(!value || !isAbsolute(value))throw new Error('请选择正式工作目录。');
  const target=await realpath(value);
  if(!(await lstat(target)).isDirectory())throw new Error('正式目录必须是文件夹。');
  if(workspaceContains(await realpath(dataDir),target))throw new Error('正式工作目录不能位于 ArcOrbit 应用数据目录中，请选择开发目录。');
  if(plan.directory==='selected' && !(p.workspace_grants || []).includes(target) && !projects.some(x=>x.local_project_path===target))throw new Error('请通过目录选择器授权这个正式目录，或明确使用已有项目绑定目录。');
  if(plan.directory==='material' && target!==p.material_path)throw new Error('材料目录位置已变化，请重新选择材料。');
  const source=p.source_path || p.material_path;
  if(source && await realpath(source)!==source)throw new Error('材料来源已变化，请重新选择材料。');
  if(source && target!==await realpath(source) && (workspaceContains(await realpath(source),target)||workspaceContains(target,await realpath(source))))throw new Error('材料与正式目录不能互相嵌套，请选择独立目录。');
  let root='';
  try{root=(await run('git',['-C',target,'rev-parse','--show-toplevel'])).trim();}
  catch(e){if(!/not a git repository/i.test(e.stderr || e.message))throw e;}
  if(root && await realpath(root)!==target)throw new Error('请选择 Git 仓库根目录，不能使用仓库子目录。');
  let origin='';
  if(root){const remotes=await run('git',['-C',target,'remote']);if(remotes.split(/\s+/).includes('origin'))origin=(await run('git',['-C',target,'remote','get-url','origin'])).trim();}
  if(origin && key(origin)!==key(url))throw new Error('本地目录的 origin 与项目 GitHub 仓库不一致。');
  const empty=(await readdir(target)).length===0;
  if(plan.directory==='selected' && !root && !empty)throw new Error('请选择空文件夹或对应已有 Git 仓库；不会覆盖非仓库目录中的文件。');
  return {target,source,root,origin,empty};
}
export async function materialManifest(source,target) {
  const files=[],skipped=[];
  if(!source || await realpath(source)===await realpath(target))return {files,skipped};
  async function walk(dir='') {
    for(const entry of await readdir(join(source,dir),{withFileTypes:true})) {
      const path=dir?`${dir}/${entry.name}`:entry.name;
      if(excluded(entry.name)||entry.isSymbolicLink()){skipped.push(path);continue;}
      if(entry.isDirectory())await walk(path);
      else if(entry.isFile())files.push({path,digest:await digest(join(source,path))});
      else skipped.push(path);
    }
  }
  await walk();await verifyMaterialTargets(target,{files});return {files,skipped};
}
export async function verifyMaterialTargets(target,manifest) {
  for(const file of manifest.files){const parts=file.path.split('/');let current=target;
    for(let i=0;i<parts.length;i++){current=join(current,parts[i]);const s=await stat(current);if(!s)break;
      if(s.isSymbolicLink() || (i<parts.length-1?!s.isDirectory():!s.isFile()))throw new Error(`材料目标类型冲突：${file.path}`);
      if(i===parts.length-1 && await digest(current)!==file.digest)throw new Error(`材料内容冲突，不覆盖：${file.path}`);
    }
  }
}
export async function prepareWorkspace({inspection,url,run,manifest,beforeCopy=async()=>{}}) {
  const {target,source,root}=inspection;
  if(!root){if(inspection.empty)await run('git',['clone','--',url,target]);else await run('git',['init',target]);}
  const remotes=await run('git',['-C',target,'remote']);
  if(!remotes.split(/\s+/).includes('origin'))await run('git',['-C',target,'remote','add','origin',url]);
  const actual=(await run('git',['-C',target,'remote','get-url','origin'])).trim();if(key(actual)!==key(url))throw new Error('准备后仓库 origin 不一致。');
  await beforeCopy(target);
  await verifyMaterialTargets(target,manifest);
  for(const file of manifest.files){
    const from=join(source,file.path),to=join(target,file.path);
    // Recheck source and ancestors before each write; never replace an existing file.
    let current=source;for(const part of file.path.split('/')){current=join(current,part);if((await lstat(current)).isSymbolicLink())throw new Error(`材料已变化：${file.path}`);}
    if(await digest(from)!==file.digest)throw new Error(`材料已变化，请重新审阅：${file.path}`);
    await verifyMaterialTargets(target,{files:[file]});await mkdir(dirname(to),{recursive:true});
    try{await copyFile(from,to,constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST'||await digest(to)!==file.digest)throw e;}
    if(await digest(to)!==file.digest)throw new Error(`复制后校验失败：${file.path}`);
  }
  return {path:target,source:source || '',copied:manifest.files.map(f=>f.path),skipped:manifest.skipped,original_preserved:true,source_committed:false,source_pushed:false};
}
