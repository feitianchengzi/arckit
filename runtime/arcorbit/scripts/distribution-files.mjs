import { cp } from 'node:fs/promises';
import path from 'node:path';

// Exclude host metadata before generating manifests. Runtime verification stays strict.
const systemEntries = new Set(['.DS_Store', 'Thumbs.db', '.Spotlight-V100', '.Trashes']);
export async function copyDistributionTree(source, target) {
  await cp(source, target, {recursive:true, filter: file => !systemEntries.has(path.basename(file))});
}
