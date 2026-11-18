import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStallPromptSettings, DEFAULT_STALL_PROMPT, renderStallPrompt } from '../src/desktop/stall-prompt.mjs';
import { createStallRecords } from '../src/desktop/stall-records.mjs';

async function root(t) {
  const dir = await mkdtemp(join(tmpdir(), 'stall-prompt-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('confirmed default keeps analysis sequence, architecture, evidence and authorization boundary', () => {
  for (const part of ['1. 从日志', '2. 对确定性较高', '3. 优先审视架构合理性', '4. 基于以上分析', '核心技术点', '不修改代码、不创建待办', '具体分析方法由你']) assert.ok(DEFAULT_STALL_PROMPT.includes(part));
  const rendered = renderStallPrompt(DEFAULT_STALL_PROMPT, { directory: '/tmp/{时间范围}/$&', timeRange: 'A 至 B' });
  assert.ok(rendered.includes('/tmp/{时间范围}/$&'));
  assert.ok(rendered.includes('）：A 至 B'));
});

test('custom template persists across instances, survives record clearing, and reset follows bundled default', async t => {
  const dir = await root(t), directory = join(dir, 'stalls');
  const records = createStallRecords({ directory, now: () => Date.parse('2026-11-15T13:00:00Z') });
  assert.equal((await records.promptSettings()).template, DEFAULT_STALL_PROMPT);
  const custom = '我的分析要求\n{日志目录}\n{时间范围}\n不创建待办';
  await records.savePrompt(custom);
  const reopened = createStallRecords({ directory, now: () => Date.parse('2026-11-15T13:00:00Z') });
  assert.equal((await reopened.promptSettings()).template, custom);
  const day = await reopened.analysis('24h');
  assert.ok(day.text.includes(directory));
  assert.ok(day.text.includes('2026-11-14T13:00:00.000Z 至 2026-11-15T13:00:00.000Z'));
  assert.ok(day.text.startsWith('我的分析要求'));
  assert.match((await reopened.analysis('all')).text, /全部留存记录，截至/);
  await reopened.clear([]); await reopened.prune();
  assert.equal((await reopened.promptSettings()).template, custom);
  assert.equal((await reopened.savePrompt(null)).template, DEFAULT_STALL_PROMPT);
  await assert.rejects(readFile(join(dir, 'stall-analysis-prompt.json')), { code: 'ENOENT' });
});

test('invalid saves keep the previous prompt and do not poison the serialized save queue', async t => {
  const dir = await root(t), settings = createStallPromptSettings({ path: join(dir, 'prompt.json') });
  const valid = '{日志目录} {时间范围} 自定义';
  await settings.save(valid);
  for (const value of ['', {}, 'missing placeholders', '{日志目录}', '{日志目录}{时间范围}' + 'x'.repeat(16000)]) {
    await assert.rejects(settings.save(value));
    assert.equal((await settings.get()).template, valid);
  }
  await Promise.all([settings.save(valid + '1'), settings.save(valid + '2')]);
  assert.equal((await settings.get()).template, valid + '2');
});
