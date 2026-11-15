import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

export const STALL_PROMPT_LIMIT = 16000;
export const STALL_PROMPT_VARIABLES = ['{日志目录}', '{时间范围}'];
export const DEFAULT_STALL_PROMPT = `请读取以下日志，分析指定时间范围内 ArcOrbit 卡顿的原因，并提出优化方案。

日志目录："{日志目录}"
时间范围（UTC，按 started_at 筛选，包含起止时间）：{时间范围}

请按以下思路推进：

1. 从日志确认主要卡顿现象和高可信线索，说明证据及其局限，区分观察、假设与已确认原因。

2. 对确定性较高的部分，结合相关业务逻辑与代码深入分析，解释问题如何产生。不要停留在耗时热点或表面症状；证据不足的关键问题，说明还需要如何验证。

3. 优先审视架构合理性。架构直接影响软件质量，如果问题源于架构，应优先考虑架构优化。同时明确相关业务场景的核心技术点，判断现有方案是否合理、怎样的方案更适合。

4. 基于以上分析提出有优先级的优化建议，说明解决什么问题、为什么有效、主要权衡，以及如何验证收益和避免业务回归。结合已有实现选择适当的改动范围，避免缺乏依据的局部修补或过度重构。

先给出主要结论，再展开关键证据和建议。具体分析方法由你根据实际情况选择。

本次仅分析和提出方案，不修改代码、不创建待办，待我确认后再实施。`;

export function validateStallPrompt(template) {
  if (typeof template !== 'string' || !template.trim()) throw new Error('Prompt 不能为空');
  if (template.length > STALL_PROMPT_LIMIT) throw new Error(`Prompt 不能超过 ${STALL_PROMPT_LIMIT} 个字符`);
  for (const variable of STALL_PROMPT_VARIABLES) {
    if (!template.includes(variable)) throw new Error(`请保留 ${variable}，用于自动填入诊断上下文`);
  }
  return template;
}

export function renderStallPrompt(template, { directory, timeRange }) {
  validateStallPrompt(template);
  // One pass, literal replacement: values are never evaluated as a template.
  return template.replace(/\{日志目录\}|\{时间范围\}/g, key => key === '{日志目录}' ? directory : timeRange);
}

export function createStallPromptSettings({ path }) {
  let queue = Promise.resolve();
  async function read() {
    let template = DEFAULT_STALL_PROMPT;
    try {
      const saved = JSON.parse(await readFile(path, 'utf8'));
      if (saved.schema !== 'arcorbit-stall-prompt/v1') throw new Error('不支持的 Prompt 配置格式');
      template = validateStallPrompt(saved.template);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return { template, default_template: DEFAULT_STALL_PROMPT, is_default: template === DEFAULT_STALL_PROMPT, max_length: STALL_PROMPT_LIMIT };
  }
  async function get() { await queue; return read(); }
  function save(template) {
    const operation = queue.then(async () => {
      // null explicitly restores the bundled default, including future updates.
      if (template === null) await unlink(path).catch(error => { if (error.code !== 'ENOENT') throw error; });
      else {
        validateStallPrompt(template);
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const temp = `${path}.tmp`;
        try {
          await writeFile(temp, JSON.stringify({ schema: 'arcorbit-stall-prompt/v1', template }), { mode: 0o600 });
          await rename(temp, path);
        } catch (error) { await unlink(temp).catch(() => {}); throw error; }
      }
      return read();
    });
    queue = operation.then(() => {}, () => {});
    return operation;
  }
  return { get, save };
}
