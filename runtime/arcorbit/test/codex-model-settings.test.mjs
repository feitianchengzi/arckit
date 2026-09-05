import assert from "node:assert/strict";
import test from "node:test";
import { queryCodexModelCatalog } from "../src/codex-model-catalog.mjs";
import { normalizeCodexSettings, validateCodexSettingsPatch } from "../src/codex-model-settings.mjs";
import { createCodexSettingsForm } from "../desktop/renderer/codex-settings-form.mjs";

const model = (name = "gpt-6-astra") => ({ model: name, displayName: name, supportedReasoningEfforts: [{ reasoningEffort: "high" }, { reasoningEffort: "medium" }], defaultReasoningEffort: "medium" });
const available = { status: "available", models: [{ model: "gpt-6-astra", displayName: "Astra", reasoningEfforts: ["high", "medium"] }] };

test("model settings default only missing or invalid stored fields and preserve manual values", () => {
  assert.deepEqual(normalizeCodexSettings(), { model: "gpt-6-astra", reasoning_effort: "high" });
  assert.deepEqual(normalizeCodexSettings({ model: "future/provider", reasoning_effort: " custom " }), { model: "future/provider", reasoning_effort: "custom" });
  for (const value of [null, [], { model: "" }, { model: "a\nb" }, { reasoning_effort: "x".repeat(201) }, { command: "codex" }]) assert.throws(() => validateCodexSettingsPatch(value));
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
  elements.model.value = "future-model";
  elements.effort.value = "custom";
  release(available);
  await pending;
  assert.equal(elements.model.value, "future-model");
  assert.equal(elements.effort.value, "custom");
  assert.equal(elements.effortList.children.length, 0);
  elements.model.value = "gpt-6-astra";
  elements.model.fire("input");
  assert.deepEqual(elements.effortList.children.map((item) => item.value), ["high", "medium"]);
  assert.equal(elements.effort.value, "custom");
  await form.save();
  assert.deepEqual(saves, [{ codex: { model: "gpt-6-astra", reasoning_effort: "custom" } }]);
  assert.match(elements.feedback.textContent, /已保存/);
});

test("form failures preserve input, allow retry, and ignore a response from an earlier opening", async () => {
  let release;
  const { form, elements } = fixture({ listCodexModels: () => new Promise((resolve) => { release = resolve; }), updateSettings: async () => { throw new Error("disk"); } });
  form.reset({});
  const pending = form.refresh();
  form.reset({ codex: { model: "custom-model", reasoning_effort: "max" } });
  release(available);
  await pending;
  assert.equal(elements.modelList.children.length, 0);
  await form.save();
  assert.equal(elements.model.value, "custom-model");
  assert.equal(elements.effort.value, "max");
  assert.equal(elements.saveButton.disabled, false);
  assert.match(elements.feedback.textContent, /保存失败/);
  const failed = form.refresh();
  release({ status: "unavailable", models: [] });
  await failed;
  assert.equal(elements.model.value, "custom-model");
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
  const elements = Object.fromEntries(["model", "effort", "modelList", "effortList", "refreshButton", "saveButton", "feedback", "catalogFeedback", "generalSaveButton"].map((key) => [key, element()]));
  return { elements, form: createCodexSettingsForm({ elements, api }) };
}
