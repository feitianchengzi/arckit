import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  buildCodexCliHandoffPrompt,
  buildInteractiveCodexLaunchSpec,
  createInteractiveCodexCliLauncher
} from "../src/interactive-cli-launcher.mjs";

test("Codex CLI handoff prompt continues the stable Case without repeating the todo", () => {
  const prompt = buildCodexCliHandoffPrompt({
    caseId: "CASE-20260807-001",
    taskTitle: "修复切换闭环",
    taskIntent: "实现并验证 Runtime 与 CLI 接力。"
  });

  assert.match(prompt, /^\$using-arckit/);
  assert.match(prompt, /CASE-20260807-001/);
  assert.doesNotMatch(prompt, /实现并验证 Runtime 与 CLI 接力/);
  assert.match(prompt, /仅在确实需要人工介入时暂停/);
  assert.doesNotMatch(prompt, /controller thread|worker thread|raw event/i);
});

test("macOS launch spec opens interactive codex in Terminal without codex exec", () => {
  const spec = buildInteractiveCodexLaunchSpec({
    projectPath: "/workspace/Project with space",
    threadId: "THREAD-PERSISTED",
    prompt: "$using-arckit\n继续 CASE-20260807-001",
    platform: "darwin"
  });

  assert.equal(spec.command, "osascript");
  assert.match(spec.args.at(-1), /codex resume --no-alt-screen -C/);
  assert.match(spec.args.at(-1), /THREAD-PERSISTED/);
  assert.doesNotMatch(spec.args.at(-1), /codex exec/);
  assert.match(spec.args.at(-1), /Project with space/);
  assert.equal(spec.options.detached, true);
});

test("interactive launcher confirms the macOS terminal request and detaches it", async () => {
  const calls = [];
  let unrefCalled = false;
  const launcher = createInteractiveCodexCliLauncher({
    platform: "darwin",
    spawnProcess(command, args, options) {
      calls.push({ command, args, options });
      const child = new EventEmitter();
      child.pid = 42;
      child.unref = () => { unrefCalled = true; };
      queueMicrotask(() => child.emit("close", 0));
      return child;
    }
  });

  const result = await launcher.launch({ projectPath: "/workspace/project", threadId: "THREAD-PERSISTED", prompt: "$using-arckit" });

  assert.equal(result.launched, true);
  assert.equal(result.pid, 42);
  assert.equal(calls.length, 1);
  assert.equal(unrefCalled, true);
});

test("interactive launcher reports a rejected macOS terminal request", async () => {
  const launcher = createInteractiveCodexCliLauncher({
    platform: "darwin",
    spawnProcess() {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("close", 1));
      return child;
    }
  });

  await assert.rejects(
    launcher.launch({ projectPath: "/workspace/project", threadId: "THREAD-PERSISTED", prompt: "$using-arckit" }),
    /osascript failed with exit code 1/
  );
});
