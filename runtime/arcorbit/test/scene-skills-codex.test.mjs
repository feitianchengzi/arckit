import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JsonRpcStdioClient } from '../src/json-rpc-stdio-client.mjs';
import { configureCodexSceneSkills } from '../src/codex-scene-skills.mjs';
import { digest, readSkill } from '../src/skill-files.mjs';

// Local fake model endpoint: verifies the real Codex prompt without credentials or inference.
test('real Codex applies scene enablement to the model request', { skip: process.env.ARCORBIT_CODEX_SCENE_TEST !== '1', timeout: 30000 }, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'arcorbit-scene-codex-'));
  const home = path.join(root, 'home'), native = path.join(home, 'skills', 'scene-hidden'), extra = path.join(root, 'scene-visible');
  for (const [folder, name] of [[native, 'scene-hidden'], [extra, 'scene-visible']]) {
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, 'SKILL.md'), `---\nname: ${folder === extra ? 'arcforge-on-demand' : name}\ndescription: ${name}-CATALOG-SENTINEL\n---\nTest instructions.\n`);
  }
  let accept;
  const server = createServer(async (request, response) => {
    const chunks = []; for await (const chunk of request) chunks.push(chunk);
    if (request.url.includes('responses')) accept(Buffer.concat(chunks).toString());
    response.writeHead(400, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: { message: 'Fixture captured the request; no inference.' } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const client = new JsonRpcStdioClient({ command: 'codex', args: ['app-server', '-c', 'model_provider="scene_fixture"', '-c', `model_providers.scene_fixture={name="Scene fixture",base_url="http://127.0.0.1:${port}/v1",wire_api="responses",requires_openai_auth=false}`, '-c', 'model="gpt-5.4"'], cwd: root, env: { ...process.env, CODEX_HOME: home }, stderr: 'ignore' });
  try {
    await client.request('initialize', { clientInfo: { name: 'scene-fixture', version: '1' }, capabilities: { experimentalApi: true } });
    const selected = await readSkill(extra);
    const body = { schema_version: 'arcorbit-scene-skill-binding/v1', scene: 'chat', catalogContext: {stateRoot: path.join(root, 'arcforge'), providerEntrypoint: process.env.ARCFORGE_TEST_PROVIDER || path.resolve('runtime/arcorbit/dist-package/resources/provisioning/arcforge-provider/dist/provider/index.js')}, onDemand: [], skills: [{ ...selected, id: 'local:fixture', source: 'local' }], managedNames: ['scene-hidden'], disabledPaths: [native] };
    const binding = { ...body, fingerprint: digest(JSON.stringify(body)) };
    const configured = await configureCodexSceneSkills(client, root, binding);
    const received = new Promise(resolve => { accept = resolve; });
    const thread = await client.request('thread/start', { cwd: root, ephemeral: true, config: configured.config, dynamicTools: configured.dynamicTools, developerInstructions: configured.developerInstructions });
    await client.request('turn/start', { threadId: thread.thread.id, input: [{ type: 'text', text: 'Reply OK.' }] });
    const request = await Promise.race([received, new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('No model request captured')), 15000); timer.unref(); })]);
    assert.ok(request.includes('arcforge_catalog'), 'on-demand tool must reach the real model request');
    assert.ok(request.includes('--scope-file'), 'resumed-thread fallback must preserve scope');
    assert.ok(request.includes('scene-visible-CATALOG-SENTINEL'), 'selected skill must reach native skill metadata');
    assert.ok(!request.includes('scene-hidden-CATALOG-SENTINEL'), 'disabled skill must not reach native skill metadata');
  } finally { client.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); }
});
