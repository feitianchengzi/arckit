import { readFile, writeFile } from 'node:fs/promises';

// Development-time projection only. The packaged app reads its local CSS copy.
const source = new URL('../../../arckit/visual/_library/generated-tokens.css', import.meta.url);
const target = new URL('../desktop/renderer/visual-tokens.css', import.meta.url);
const expected = await readFile(source, 'utf8');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== expected) {
    throw new Error('Visual tokens are stale. Run npm run sync:visual in runtime/arcorbit.');
  }
} else {
  await writeFile(target, expected);
}
