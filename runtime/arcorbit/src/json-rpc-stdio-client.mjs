import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { win32 as pathWin32 } from "node:path";
import { createInterface } from "node:readline";

const WINDOWS_COMMAND_EXTENSIONS = new Set([".bat", ".cmd"]);
const WINDOWS_POWERSHELL_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$rpcCommand = $env:ARCKIT_JSON_RPC_COMMAND",
  "$rpcArgs = ConvertFrom-Json -InputObject $env:ARCKIT_JSON_RPC_ARGS",
  "& $rpcCommand @rpcArgs",
  "exit $LASTEXITCODE"
].join("; ");

export function buildJsonRpcSpawnSpec({
  command,
  args = [],
  cwd = process.cwd(),
  stderr = "inherit",
  platform = process.platform,
  env = process.env,
  isFile = defaultIsFile
}) {
  const resolvedCommand = platform === "win32"
    ? resolveWindowsCommand(command, { env, isFile })
    : command;
  const extension = platform === "win32" ? pathWin32.extname(resolvedCommand).toLowerCase() : "";

  if (platform === "win32" && WINDOWS_COMMAND_EXTENSIONS.has(extension)) {
    return {
      command: resolveWindowsPowerShell(env),
      args: [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        WINDOWS_POWERSHELL_SCRIPT
      ],
      options: {
        cwd,
        env: {
          ...env,
          ARCKIT_JSON_RPC_COMMAND: resolvedCommand,
          ARCKIT_JSON_RPC_ARGS: JSON.stringify(args)
        },
        stdio: ["pipe", "pipe", stderr],
        windowsHide: true
      },
      requestedCommand: command,
      resolvedCommand,
      launchMode: "windows-command-shim"
    };
  }

  return {
    command: resolvedCommand,
    args,
    options: {
      cwd,
      env,
      stdio: ["pipe", "pipe", stderr]
    },
    requestedCommand: command,
    resolvedCommand,
    launchMode: "direct"
  };
}

export function resolveWindowsCommand(command, { env = process.env, isFile = defaultIsFile } = {}) {
  const value = String(command || "").trim();
  if (!value) return value;

  const extensions = windowsExecutableExtensions(env);
  const hasPathSeparator = value.includes("\\") || value.includes("/");
  const candidates = hasPathSeparator
    ? windowsCommandCandidates(value, extensions)
    : windowsPathDirectories(env).flatMap((directory) => windowsCommandCandidates(pathWin32.join(directory, value), extensions));

  return candidates.find((candidate) => isFile(candidate)) || value;
}

function windowsCommandCandidates(command, extensions) {
  if (pathWin32.extname(command)) return [command];
  return [...extensions.map((extension) => `${command}${extension}`), command];
}

function windowsExecutableExtensions(env) {
  const configured = readWindowsEnv(env, "PATHEXT") || ".COM;.EXE;.BAT;.CMD";
  return configured
    .split(";")
    .map((extension) => extension.trim())
    .filter(Boolean)
    .map((extension) => extension.startsWith(".") ? extension : `.${extension}`);
}

function windowsPathDirectories(env) {
  return (readWindowsEnv(env, "PATH") || "")
    .split(";")
    .map((directory) => directory.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function readWindowsEnv(env, name) {
  const key = Object.keys(env || {}).find((candidate) => candidate.toUpperCase() === name);
  return key ? env[key] : "";
}

function resolveWindowsPowerShell(env) {
  const systemRoot = readWindowsEnv(env, "SYSTEMROOT");
  return systemRoot
    ? pathWin32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";
}

function defaultIsFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export class JsonRpcStdioClient {
  constructor({
    command,
    args = [],
    cwd = process.cwd(),
    stderr = "inherit",
    platform = process.platform,
    env = process.env,
    isFile = defaultIsFile,
    spawnProcess = spawn
  }) {
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.nextId = 1;
    this.pending = new Map();
    this.notifications = [];
    this.requestHandlers = [];
    this.closeHandlers = [];
    this.closed = false;
    this.spawnSpec = buildJsonRpcSpawnSpec({ command, args, cwd, stderr, platform, env, isFile });
    this.proc = spawnProcess(this.spawnSpec.command, this.spawnSpec.args, this.spawnSpec.options);
    this.readline = createInterface({ input: this.proc.stdout });
    this.readline.on("line", (line) => this.#handleLine(line));
    this.proc.on("exit", (code, signal) => {
      this.closed = true;
      const error = new Error(`JSON-RPC process exited: code=${code} signal=${signal || ""}`);
      for (const { reject } of this.pending.values()) {
        reject(error);
      }
      this.pending.clear();
      for (const handler of this.closeHandlers) {
        handler({ code, signal, error });
      }
    });
    this.proc.on("error", (error) => {
      this.closed = true;
      const launchError = new Error(
        `Unable to start JSON-RPC process ${JSON.stringify(this.spawnSpec.requestedCommand)} ` +
        `(mode=${this.spawnSpec.launchMode}, platform=${platform}, cwd=${JSON.stringify(cwd)}): ${error.message}`,
        { cause: error }
      );
      launchError.code = error.code;
      for (const pending of this.pending.values()) {
        pending.reject(launchError);
      }
      this.pending.clear();
      for (const handler of this.closeHandlers) {
        handler({ code: null, signal: null, error: launchError });
      }
    });
  }

  request(method, params = {}) {
    if (this.closed) {
      return Promise.reject(new Error("JSON-RPC process is closed."));
    }
    const id = this.nextId++;
    const message = { method, id, params };
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.#send(message);
    return promise;
  }

  notify(method, params = {}) {
    if (this.closed) {
      throw new Error("JSON-RPC process is closed.");
    }
    this.#send({ method, params });
  }

  onNotification(handler) {
    this.notifications.push(handler);
  }

  onRequest(handler) {
    this.requestHandlers.push(handler);
  }

  onClose(handler) {
    this.closeHandlers.push(handler);
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.readline.close();
    this.proc.stdin.end();
    this.proc.kill("SIGTERM");
  }

  #send(message) {
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      for (const handler of this.notifications) {
        handler({ method: "runtime/protocolParseError", params: { line, error: String(error) } });
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id") && message.method) {
      this.#handleRequest(message);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id")) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        const error = new Error(message.error.message || "JSON-RPC request failed.");
        error.code = message.error.code;
        error.data = message.error.data;
        pending.reject(error);
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.method) {
      for (const handler of this.notifications) {
        handler(message);
      }
    }
  }

  async #handleRequest(message) {
    for (const handler of this.requestHandlers) {
      try {
        const result = await handler(message);
        if (result !== undefined) {
          this.#send({ id: message.id, result });
          return;
        }
      } catch (error) {
        this.#send({
          id: message.id,
          error: {
            code: -32000,
            message: String(error)
          }
        });
        return;
      }
    }
    this.#send({
      id: message.id,
      error: {
        code: -32601,
        message: `Unhandled server request: ${message.method}`
      }
    });
  }
}
