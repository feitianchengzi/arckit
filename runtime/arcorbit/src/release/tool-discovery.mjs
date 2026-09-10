import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { userInfo } from 'node:os';

// Discovery never downloads or installs a program. The packaging step can
// provide a pinned binary; otherwise use the developer's login environment.
export function createLazygitDiscovery(bundledPath = '') {
  let cached;
  let checked = 0;
  return async function discover() {
    if (Date.now() - checked < 60000) return cached;
    let path = '';
    if (bundledPath) {
      try { await access(bundledPath, constants.X_OK); path = bundledPath; } catch {}
    }
    if (!path) {
      try {
        const windows = process.platform === 'win32';
        const shell = windows ? (process.env.COMSPEC || 'cmd.exe') : (userInfo().shell || '/bin/sh');
        const { stdout } = await promisify(execFile)(shell, windows ? ['/d', '/c', 'where lazygit'] : ['-l', '-c', 'command -v lazygit'], { timeout: 5000, maxBuffer: 65536 });
        path = stdout.trim().split(/\r?\n/).at(-1) || '';
        await access(path, constants.X_OK);
      } catch { path = ''; }
    }
    cached = { available: Boolean(path), path, message: path ? '' : '未找到 Lazygit。可在终端安装后刷新，或继续使用内置 Git 和 Shell。' };
    checked = Date.now();
    return cached;
  };
}
