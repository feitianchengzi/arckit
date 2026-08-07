import { spawn } from "node:child_process";

export function buildCodexCliHandoffPrompt({ caseId = "", taskTitle = "", taskIntent = "" } = {}) {
  const caseInstruction = caseId
    ? `当前 Case：${caseId}。先读取该 Case 的 fresh canonical state，再继续推进。`
    : "当前尚未绑定 Case。请从 fresh Project State 和待办意图选择或创建唯一 Case，并继续推进。";
  return [
    "$using-arckit",
    "",
    "你正在从 Arckit Runtime 接管一个进行中的待办。",
    caseInstruction,
    taskTitle ? `待办：${taskTitle}` : "",
    "原始待办意图：",
    String(taskIntent || taskTitle || "").trim(),
    "",
    "自动执行 state-driven loop 直到 Case 完成，仅在确实需要人工介入时暂停。",
    "以 Project/Case State 和稳定事实源为准；不要依赖或尝试恢复旧 Runtime Run 的内部 thread。"
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1])).join("\n");
}

export function buildInteractiveCodexLaunchSpec({ projectPath, prompt, platform = process.platform, env = process.env } = {}) {
  const root = String(projectPath || "").trim();
  const initialPrompt = String(prompt || "").trim();
  if (!root) throw new Error("A local project path is required to launch Codex CLI.");
  if (!initialPrompt) throw new Error("A handoff prompt is required to launch Codex CLI.");

  if (platform === "darwin") {
    const command = `exec codex --no-alt-screen -C ${quotePosix(root)} ${quotePosix(initialPrompt)}`;
    return {
      command: "osascript",
      args: [
        "-e", "on run argv",
        "-e", "tell application \"Terminal\"",
        "-e", "activate",
        "-e", "do script (item 1 of argv)",
        "-e", "end tell",
        "-e", "end run",
        command
      ],
      options: { detached: true, stdio: "ignore" },
      wait_for_exit: true
    };
  }

  if (platform === "win32") {
    const script = "$projectPath=$args[0];$initialPrompt=$args[1];Start-Process -FilePath 'codex' -WorkingDirectory $projectPath -ArgumentList @('--no-alt-screen','-C',$projectPath,$initialPrompt)";
    return {
      command: "powershell.exe",
      args: ["-NoProfile", "-Command", script, root, initialPrompt],
      options: { detached: true, stdio: "ignore", windowsHide: false }
    };
  }

  const command = `exec codex --no-alt-screen -C ${quotePosix(root)} ${quotePosix(initialPrompt)}`;
  return {
    command: String(env.TERMINAL || "x-terminal-emulator"),
    args: ["-e", "/bin/sh", "-lc", command],
    options: { detached: true, stdio: "ignore" }
  };
}

export function createInteractiveCodexCliLauncher({
  platform = process.platform,
  env = process.env,
  spawnProcess = spawn
} = {}) {
  return {
    async launch(input) {
      const spec = buildInteractiveCodexLaunchSpec({ ...input, platform, env });
      const child = spawnProcess(spec.command, spec.args, spec.options);
      if (spec.wait_for_exit) await waitForSuccessfulExit(child, spec.command);
      else await waitForSpawn(child);
      child.unref?.();
      return { launched: true, pid: child.pid || null, command: spec.command };
    }
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
