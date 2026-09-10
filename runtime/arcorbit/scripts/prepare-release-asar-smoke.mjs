// Offline distribution-boundary check. Uses already installed dependencies;
// does not rebuild native modules, download executables, sign or publish.
import { cp, mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createPackageWithOptions } from '@electron/asar';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = await realpath(await mkdtemp(join(tmpdir(), 'arcorbit-release-asar-')));
const stage = join(output, 'stage');
await mkdir(stage);
for (const name of ['src', 'adapters', 'schemas', 'config', 'desktop', 'package.json']) {
  await cp(join(root, name), join(stage, name), { recursive: true });
}
await mkdir(join(stage, 'test/fixtures'), { recursive: true });
for (const name of ['release-workspace-electron.mjs', 'organization-center-preload.cjs']) {
  await cp(join(root, 'test/fixtures', name), join(stage, 'test/fixtures', name));
}
const copied = new Map();
async function copyDependency(name, from, parentDestination) {
  const require = createRequire(join(from, 'package.json'));
  let directory;
  if (name === 'monaco-editor') directory = resolve(dirname(require.resolve('monaco-editor/editor/editor.api.js')), '../../..');
  else {
    try { directory = dirname(require.resolve(name + '/package.json')); }
    catch {
      directory = dirname(require.resolve(name));
      for (;;) {
        try { if (JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')).name === name) break; } catch {}
        const parent = dirname(directory); if (parent === directory) throw new Error('Cannot locate package '+name); directory = parent;
      }
    }
  }
  directory = await realpath(directory);
  const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  if (copied.get(name) === pkg.version) return;
  const target = join(copied.has(name) ? parentDestination : stage, 'node_modules', name);
  if (!copied.has(name)) copied.set(name, pkg.version);
  await cp(directory, target, { recursive: true, filter: source => !source.slice(directory.length).split(/[\\/]/).includes('node_modules') });
  for (const dependency of Object.keys(pkg.dependencies || {})) await copyDependency(dependency, directory, target);
}
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
for (const name of Object.keys(pkg.dependencies)) await copyDependency(name, root, stage);
const archive = join(output, 'app.asar');
await createPackageWithOptions(stage, archive, { unpackDir: 'node_modules/node-pty' });
await writeFile(join(output, 'smoke.json'), JSON.stringify({ archive, fixture: archive + '/test/fixtures/release-workspace-electron.mjs' }, null, 2));
console.log(JSON.stringify({ archive, fixture: archive + '/test/fixtures/release-workspace-electron.mjs' }));
