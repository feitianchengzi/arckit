import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {atomicJson, digest} from './skill-files.mjs';
import { CORE_SKILLS } from './core-skill-identity.mjs';
import { validateSceneSkillBinding } from './scene-skill-manager.mjs';

export async function configureCodexSceneSkills(client, projectRoot, binding) {
  if (!binding) return null;
  await validateSceneSkillBinding(binding);
  try {
    await client.request('skills/extraRoots/set', { extraRoots: binding.skills.map(x => x.path) });
    const result = await client.request('skills/list', { cwds: [projectRoot], forceReload: true });
    const inventory = result.data?.find(x => path.resolve(x.cwd) === path.resolve(projectRoot));
    if (!inventory) throw new Error('Codex returned no skill inventory for this workspace.');
    const selected = new Set(binding.skills.filter(x => !x.inheritNative || inventory.skills.find(native => path.resolve(native.path) === path.resolve(x.skillPath))?.enabled !== false).map(x => path.resolve(x.skillPath)));
    for (const skill of binding.skills) if (!inventory.skills.some(x => path.resolve(x.path) === path.resolve(skill.skillPath) && x.name === skill.name)) throw new Error(`Codex did not discover selected skill: ${skill.name}`);
    const controlledNames = new Set([...binding.managedNames, ...binding.skills.map(x => x.name)]);
    const disabled = new Set(binding.disabledPaths.map(x => path.resolve(x)));
    const overrides = inventory.skills.filter(skill => controlledNames.has(skill.name) || disabled.has(path.dirname(path.resolve(skill.path))) || skill.enabled === false)
      .map(skill => ({ path: path.resolve(skill.path), enabled: selected.has(path.resolve(skill.path)) }));
    // Codex 0.153 uses the canonical SKILL.md path as the enablement key.
    // A folder is accepted by the config parser but does not disable the skill.
    // Overrides belong to thread start/resume. Never write global Codex configuration.
    const demand = await createOnDemandTools(binding);
    return { ...demand, config: { 'skills.config': overrides }, fingerprint: binding.fingerprint,
      skillInputs: binding.scene === 'automation' ? binding.skills.filter(x => CORE_SKILLS.includes(x.name)).map(x => ({ type: 'skill', name: x.name, path: x.skillPath })) : [] };
  } catch (error) { throw new Error(`无法应用场景技能配置，请检查 Codex 的 skills/extraRoots/set 支持和技能来源：${error.message}`, { cause: error }); }
}


export async function createOnDemandTools(binding) {
  if (!binding.catalogContext || !binding.skills.some(x => x.name === 'arcforge-on-demand')) return {developerInstructions: '当前场景未启用按需入口。只使用当前直接发现的技能；旧线程中的 arcforge_catalog 或 catalog 查询命令不构成本轮按需加载授权。'};
  const provider = await import(pathToFileURL(binding.catalogContext.providerEntrypoint).href);
  const scope = binding.onDemand || [];
  const scopeFile = path.join(binding.catalogContext.stateRoot, 'scopes', `${binding.fingerprint}.json`);
  await atomicJson(scopeFile, {schema:'arcforge-catalog-scope/v1',stateRoot:binding.catalogContext.stateRoot,skills:scope});
  const launch = binding.catalogContext.catalogCommand || {executable:process.execPath,args:[path.join(path.dirname(binding.catalogContext.providerEntrypoint),'catalog-query.js')]};
  if (process.versions.electron && !binding.catalogContext.catalogCommand) throw new Error('缺少桌面只读 catalog 命令配置。');
  const quote = value => "'" + String(value).replaceAll("'", process.platform === 'win32' ? "''" : "'\\''") + "'";
  const command = (process.platform === 'win32' ? '& ' : '') + [launch.executable,...launch.args,'--scope-file',scopeFile].map(quote).join(' ');

  return {
    developerInstructions: `当前场景提供 $arcforge-on-demand 显式调用入口。仅当用户显式调用，或宿主程序在本轮显式配置该入口调用时，才可使用 arcforge_catalog。入口可见、工具存在和按需范围配置均不代表调用授权；不得因自行判断任务缺少能力而查询或加载隐藏技能。本说明仅提供接口，不是调用指令。已收到显式调用时，旧线程若未提供该工具，只能使用以下同范围的只读命令：${command} --action list；选定后 ${command} --action resolve --query '<qualifiedName>'。不得改用全局 catalog 绕过当前场景的禁用或范围限制。`,
    dynamicTools: [{type:'function',name:'arcforge_catalog', description:'仅用于执行用户或宿主程序对 arcforge-on-demand 的显式调用；不得自主发现隐藏技能。查询当前场景允许的技能。list 返回候选元数据，resolve 校验选定技能并返回指令路径。', inputSchema:{type:'object',properties:{action:{type:'string',enum:['list','resolve']},query:{type:'string'}},required:['action'],additionalProperties:false}}],
    dynamicToolProvider: async params => {
      const input = typeof params.arguments === 'string' ? JSON.parse(params.arguments) : params.arguments;
      if (params.tool !== 'arcforge_catalog' || !input || !['list','resolve'].includes(input.action)) throw new Error('Invalid on-demand catalog request.');
      const result = await provider.queryCatalog({...binding.catalogContext, allowedSkills: scope.map(x => x.qualifiedName), action: input.action, query: input.query});
      if (result.status === 'resolved') {
        const expected = scope.find(x => x.qualifiedName === result.resolved.qualifiedName);
        if (!expected || expected.catalogDigest !== result.resolved.contentDigest || (expected.packageDigest && expected.packageDigest !== result.resolved.packageDigest)) throw new Error('按需技能已更新；请在下一轮重新解析场景技能后重试。');
      }
      return result;
    }
  };
}
