import { realpath } from 'node:fs/promises';
import { githubUrl } from './product-git.mjs';
import { commandDiagnostic, describeCommandEnvironment, redactCommandText } from './local-command-runtime.mjs';
export async function inspectProductEnvironment(p, {run, includeGithub = false, env = process.env}) {
  const result={material_path:p.kind==='formal'?p.material_path:p.source_path || p.material_path || '',git:{status:'no_directory'},github:{status:'not_checked',owners:[]},checked_at:new Date().toISOString(),diagnostics:[],command_environment:await describeCommandEnvironment(env)};
  const dir=result.material_path;
  async function command(bin,args,stage,timeout) {
    const started=Date.now(),cwd=process.cwd();
    try {const value=await run(bin,args,{timeout,cwd});result.diagnostics.push(commandDiagnostic(null,{bin,args,cwd,stage,env,executable:result.command_environment.executables[bin] || bin,started}));return value;}
    catch(e){result.diagnostics.push({...commandDiagnostic(e,{bin,args,cwd,stage,env,executable:result.command_environment.executables[bin] || bin,started}),...e.diagnostic,stage});throw e;}
  }
  function localFailure(e,stage){result.diagnostics.push(commandDiagnostic(e,{bin:null,cwd:dir,stage,env}));}
  if(dir) {
    let root;
    try {root=await command('git',['-C',dir,'rev-parse','--show-toplevel'],'git.root',10000);result.git={status:'repository',root};}
    catch {result.git={status:'unavailable',notice:'Git 仓库尚未确认，请查看实际命令诊断或让 Agent 继续排查。'};}
    if(root) {
      try {result.git.is_root=await realpath(root)===await realpath(dir);}
      catch(e){localFailure(e,'git.path');result.git.notice='Git 已返回仓库根，目录访问核对尚未完成。';}
      let origin;
      try {origin=await command('git',['-C',dir,'remote','get-url','origin'],'git.origin',10000);}
      catch {result.git.notice='仓库根已确认，origin 尚未确认；可继续检查远端配置。';}
      if(origin)try{result.git.origin=githubUrl(origin);}catch(e){localFailure(e,'git.origin-format');result.git.notice='origin 已返回，但不是支持的不含凭据的 GitHub 地址。';}
    }
  }
  if(includeGithub) {
    let user;
    try {user=JSON.parse(await command('gh',['api','user'],'github.user',15000));
      if(!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(user.login || ''))throw new Error('GitHub 用户响应缺少有效 login');
      result.github={status:'authenticated',login:user.login,owners:[{login:user.login,kind:'user'}]};
    }catch(e){
      if(result.diagnostics.at(-1)?.exit_code===0)localFailure(new Error('GitHub 用户响应格式无法解析'),'github.user-format');
      result.github={status:'unavailable',owners:[],notice:'GitHub 账号尚未确认；请根据命令诊断继续排查，不能据此判断未登录。'};
    }
    if(result.github.status==='authenticated')try{
      const orgs=JSON.parse(await command('gh',['api','user/orgs?per_page=100'],'github.organizations',15000));
      if(!Array.isArray(orgs))throw new Error('组织响应不是清单');
      result.github.owners.push(...orgs.filter(o=>/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(o.login || '')).map(o=>({login:o.login,kind:'organization'})));
      result.github.notice='账号已确认；候选主体不代表已验证创建权限。';
    }catch(e){
      if(result.diagnostics.at(-1)?.exit_code===0)localFailure(new Error('GitHub 组织响应格式无法解析'),'github.organizations-format');
      result.github.notice='账号已确认，组织清单暂不可用；可以继续排查或填写已有权限的组织。';
    }
  }
  // Results are shared with the model/UI, never raw credentials or response bodies.
  for(const d of result.diagnostics)d.stderr=redactCommandText(d.stderr,env);
  return result;
}
