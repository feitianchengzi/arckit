import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function isMain(moduleURL) {
  try {
    // argv[1] may be an arbitrary argument in node -e / imported-module tests.
    return Boolean(process.argv[1] && !process.argv[1].startsWith('file:') &&
      moduleURL === pathToFileURL(realpathSync(process.argv[1])).href);
  } catch { return false; }
}
