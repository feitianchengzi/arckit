import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 加载 runtime/arcorbit/.env 中的进程级配置（如产品反馈凭据与本地覆盖地址）。
// 已存在的环境变量优先；打包产物不携带 .env 时静默跳过，保持 fail-closed。
// 该模块必须是桌面入口的首个 import，保证下游模块顶层读取的 env 已就位。
export function loadDesktopEnv() {
  try {
    const envFile = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || match[1] in process.env) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (value) process.env[match[1]] = value;
    }
  } catch {
    // 无 .env：按未配置处理。
  }
}

loadDesktopEnv();
