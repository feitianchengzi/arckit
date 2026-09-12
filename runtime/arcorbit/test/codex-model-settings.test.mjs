import assert from "node:assert/strict";
import test from "node:test";
import { queryCodexModelCatalog } from "../src/codex-model-catalog.mjs";
import { normalizeCodexSettings, validateCodexSettingsPatch } from "../src/codex-model-settings.mjs";
import { createCodexSettingsForm } from "../desktop/renderer/codex-settings-form.mjs";

const model = (name = "gpt-6-astra") => ({ model: name, displayName: name, supportedReasoningEfforts: [{ reasoningEffort: "high" }, { reasoningEffort: "medium" }], defaultReasoningEffort: "medium" });
const available = { status: "available", models: [{ model: "gpt-6-astra", displayName: "Astra", reasoningEfforts: ["high", "medium"] }] };

test("model settings default only missing or invalid stored fields and preserve manual values", () => {
  const defaults = { model: "gpt-6-astra", reasoning_effort: "high" };
  assert.deepEqual(normalizeCodexSettings(), { chat: defaults, automation: defaults });
  assert.deepEqual(normalizeCodexSettings({ model: "future/provider", reasoning_effort: " custom " }), {
    chat: { model: "future/provider", reasoning_effort: "custom" },
    automation: { model: "future/provider", reasoning_effort: "custom" }
  });
  assert.deepEqual(normalizeCodexSettings({
    chat: { model: "chat-model", reasoning_effort: "medium" },
    automation: { model: "automation-model", reasoning_effort: "ultra" }
  }), {
    chat: { model: "chat-model", reasoning_effort: "medium" },
    automation: { model: "automation-model", reasoning_effort: "ultra" }
  });
  for (const value of [null, [], { model: "" }, { chat: { model: "a\nb", reasoning_effort: "high" } }, { automation: { model: "a", reasoning_effort: "x".repeat(201) } }, { command: "codex" }]) assert.throws(() => validateCodexSettingsPatch(value));
  assert.deepEqual(normalizeCodexSettings({ model: {}, reasoning_effort: null }), normalizeCodexSettings());
});

test("catalog reads every page through fixed methods and always closes its isolated client", async () => {
  const calls = [];
  let closed = 0;
  const result = await queryCodexModelCatalog({
    command: "/active/codex", cwd: "/runtime", env: { PATH: "/active" },
    createClient(options) {
      assert.deepEqual(options.args, ["app-server", "--stdio"]);
      assert.equal(options.stderr, "ignore");
      return {
        async request(method, params) {
          calls.push({ method, params });
          if (method === "initialize") return {};
          return params.cursor === null ? { data: [model()], nextCursor: "page2" } : { data: [model("custom-model")], nextCursor: null };
        },
        notify(method) { calls.push({ method }); }, close() { closed += 1; }
      };
    }
  });
  assert.deepEqual(calls.map((item) => item.method), ["initialize", "initialized", "model/list", "model/list"]);
  assert.equal(calls[3].params.cursor, "page2");
  assert.deepEqual(result.models.map((item) => item.model), ["gpt-6-astra", "custom-model"]);
  assert.deepEqual(result.models[0].reasoningEfforts, ["high", "medium"]);
  assert.equal(closed, 1);
});

for (const failure of ["initialize", "second-page", "cycle", "malformed", "timeout", "spawn"]) {
  test(`catalog ${failure} fails with no partial list or private error and closes`, async () => {
    let closed = 0;
    let pages = 0;
    const result = await queryCodexModelCatalog({ command: "codex", timeoutMs: 10, createClient() {
      if (failure === "spawn") throw new Error("private-token");
      return {
        async request(method) {
          if (failure === "timeout") return new Promise(() => {});
          if (method === "initialize") {
            if (failure === "initialize") throw new Error("private-token");
            return {};
          }
          pages += 1;
          if (failure === "second-page" && pages === 2) throw new Error("private-token");
          if (failure === "malformed") return { data: [model()], nextCursor: undefined };
          return { data: [model()], nextCursor: "repeat" };
        }, notify() {}, close() { closed += 1; }
      };
    } });
    assert.equal(result.status, "unavailable");
    assert.deepEqual(result.models, []);
    assert.equal(JSON.stringify(result).includes("private-token"), false);
    assert.equal(closed, failure === "spawn" ? 0 : 1);
  });
}

test("form keeps drafts on catalog refresh, updates efforts and saves unknown current values", async () => {
  let release;
  const saves = [];
  const { form, elements } = fixture({
    listCodexModels: () => new Promise((resolve) => { release = resolve; }),
    updateSettings: async (value) => { saves.push(value); return value; }
  });
  form.reset({});
  const pending = form.refresh();
  elements.contexts.chat.model.value = "future-model";
  elements.contexts.chat.effort.value = "custom";
  release(available);
  await pending;
  assert.equal(elements.contexts.chat.model.value, "future-model");
  assert.equal(elements.contexts.chat.effort.value, "custom");
  assert.equal(elements.contexts.chat.effortList.children.length, 0);
  elements.contexts.chat.model.value = "gpt-6-astra";
  elements.contexts.chat.model.fire("input");
  assert.deepEqual(elements.contexts.chat.effortList.children.map((item) => item.value), ["high", "medium"]);
  assert.equal(elements.contexts.chat.effort.value, "custom");
  elements.contexts.automation.model.value = "automation-model";
  elements.contexts.automation.effort.value = "ultra";
  await form.save();
  assert.deepEqual(saves, [{ codex: {
    chat: { model: "gpt-6-astra", reasoning_effort: "custom" },
    automation: { model: "automation-model", reasoning_effort: "ultra" }
  } }]);
  assert.match(elements.feedback.textContent, /已保存/);
});

test("form failures preserve input, allow retry, and ignore a response from an earlier opening", async () => {
  let release;
  const { form, elements } = fixture({ listCodexModels: () => new Promise((resolve) => { release = resolve; }), updateSettings: async () => { throw new Error("disk"); } });
  form.reset({});
  const pending = form.refresh();
  form.reset({ codex: {
    chat: { model: "custom-model", reasoning_effort: "max" },
    automation: { model: "automation-model", reasoning_effort: "high" }
  } });
  release(available);
  await pending;
  assert.equal(elements.contexts.chat.modelList.children.length, 0);
  await form.save();
  assert.equal(elements.contexts.chat.model.value, "custom-model");
  assert.equal(elements.contexts.chat.effort.value, "max");
  assert.equal(elements.saveButton.disabled, false);
  assert.match(elements.feedback.textContent, /保存失败/);
  const failed = form.refresh();
  release({ status: "unavailable", models: [] });
  await failed;
  assert.equal(elements.contexts.chat.model.value, "custom-model");
  assert.equal(elements.refreshButton.disabled, false);
  assert.match(elements.catalogFeedback.textContent, /手动输入/);
});

function fixture(api) {
  const element = () => ({
    value: "", textContent: "", disabled: false, children: [], handlers: {},
    ownerDocument: { createElement: () => ({}) },
    replaceChildren(...children) { this.children = children; },
    addEventListener(name, handler) { this.handlers[name] = handler; },
    fire(name) { this.handlers[name](); }
  });
  const elements = Object.fromEntries(["refreshButton", "saveButton", "feedback", "catalogFeedback", "generalSaveButton"].map((key) => [key, element()]));
  elements.contexts = Object.fromEntries(["chat", "automation"].map((key) => [key, Object.fromEntries(
    ["model", "effort", "modelList", "effortList"].map((field) => [field, element()])
  )]));
  return { elements, form: createCodexSettingsForm({ elements, api }) };
}
