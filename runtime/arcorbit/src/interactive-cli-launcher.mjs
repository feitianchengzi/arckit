import { spawn } from "node:child_process";
import { taskDisplayTitle } from "./task-display-title.mjs";

export function buildCodexCliHandoffPrompt({ caseId = "", taskTitle = "", taskIntent = "" } = {}) {
  if (!/^CASE-\d{8}-\d{3}$/.test(String(caseId))) {
    throw new Error("Codex CLI handoff requires an authoritative Case id.");
  }
  return [
    "$using-arckit",
    "",
    "你正在从 ArcOrbit 接管一个进行中的待办。",
    `当前已绑定 Case：${caseId}。先读取该 Case 的 fresh canonical state，再继续推进。`,
    taskTitle ? `待办：${taskDisplayTitle(taskTitle)}` : "",
    "自动执行 state-driven loop 直到 Case 完成，仅在确实需要人工介入时暂停。",
    "继续使用当前对话上下文，并以 fresh Project/Case State 和稳定事实源覆盖冲突的旧事实。"
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1])).join("\n");
}

export function buildInteractiveCodexLaunchSpec({ projectPath, threadId, prompt, codexExecutable = { command: "codex", pathEntries: [] }, platform = process.platform, env = process.env } = {}) {
  const root = String(projectPath || "").trim();
  const initialPrompt = String(prompt || "").trim();
  if (!root) throw new Error("A local project path is required to launch Codex CLI.");
  const persistedThreadId = String(threadId || "").trim();
  if (!persistedThreadId) throw new Error("A persisted Codex thread id is required to launch Codex CLI.");
  if (!initialPrompt) throw new Error("A handoff prompt is required to launch Codex CLI.");
  const executable = normalizeCodexExecutable(codexExecutable);
  const posixCommand = buildPosixCodexCommand({ executable, root, persistedThreadId, initialPrompt });

  if (platform === "darwin") {
    return {
      command: "osascript",
      args: [
        "-e", "on run argv",
        "-e", "tell application \"Terminal\"",
        "-e", "activate",
        "-e", "do script (item 1 of argv)",
        "-e", "end tell",
        "-e", "end run",
        posixCommand
      ],
      options: { detached: true, stdio: "ignore" },
      wait_for_exit: true
    };
  }

  if (platform === "win32") {
    const script = "$projectPath=$args[0];$threadId=$args[1];$initialPrompt=$args[2];$codexBin=$args[3];Start-Process -FilePath $codexBin -WorkingDirectory $projectPath -ArgumentList @('resume','--no-alt-screen','-C',$projectPath,$threadId,$initialPrompt)";
    return {
      command: "powershell.exe",
      args: ["-NoProfile", "-Command", script, root, persistedThreadId, initialPrompt, executable.command],
      options: { detached: true, stdio: "ignore", windowsHide: false }
    };
  }

  return {
    command: String(env.TERMINAL || "x-terminal-emulator"),
    args: ["-e", "/bin/sh", "-lc", posixCommand],
    options: { detached: true, stdio: "ignore" }
  };
}

export function createInteractiveCodexCliLauncher({
  platform = process.platform,
  env = process.env,
  getCodexExecutable = () => ({ command: "codex", pathEntries: [] }),
  spawnProcess = spawn
} = {}) {
  return {
    async launch(input) {
      const spec = buildInteractiveCodexLaunchSpec({ ...input, codexExecutable: getCodexExecutable(), platform, env });
      const child = spawnProcess(spec.command, spec.args, spec.options);
      if (spec.wait_for_exit) await waitForSuccessfulExit(child, spec.command);
      else await waitForSpawn(child);
      child.unref?.();
      return { launched: true, pid: child.pid || null, command: spec.command };
    }
  };
}

function buildPosixCodexCommand({ executable, root, persistedThreadId, initialPrompt }) {
  const pathPrefix = executable.pathEntries.length
    ? `export PATH=${quotePosix(executable.pathEntries.join(":"))}:$PATH; `
    : "";
  return `${pathPrefix}exec ${quotePosix(executable.command)} resume --no-alt-screen -C ${quotePosix(root)} ${quotePosix(persistedThreadId)} ${quotePosix(initialPrompt)}`;
}

function normalizeCodexExecutable(value) {
  const command = typeof value === "string" ? value : value?.command;
  if (!String(command || "").trim()) throw new Error("Codex CLI handoff requires a resolved Codex executable.");
  return {
    command: String(command),
    pathEntries: Array.isArray(value?.pathEntries) ? value.pathEntries.map(String).filter(Boolean) : []
  };
}

function waitForSuccessfulExit(child, command) {
  if (!child || typeof child.once !== "function") {
    return Promise.reject(new Error("The terminal launcher did not return a child process."));
  }
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      child.off?.("close", onClose);
      reject(error);
    };
    const onClose = (code) => {
      child.off?.("error", onError);
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with exit code ${code ?? "unknown"}.`));
    };
    child.once("error", onError);
    child.once("close", onClose);
  });
}

function quotePosix(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function waitForSpawn(child) {
  if (!child || typeof child.once !== "function") {
    return Promise.reject(new Error("The terminal launcher did not return a child process."));
  }
  return new Promise((resolve, reject) => {
    const onSpawn = () => {
      child.off?.("error", onError);
      resolve();
    };
    const onError = (error) => {
      child.off?.("spawn", onSpawn);
      reject(error);
    };
    child.once("spawn", onSpawn);
    child.once("error", onError);
  });
}
