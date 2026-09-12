import { normalizeCodexSettings, validateCodexSettingsPatch } from "../../src/codex-model-settings.mjs";

export function createCodexSettingsForm({ elements, api, onSaved = () => {} }) {
  const { contexts, refreshButton, saveButton, feedback, catalogFeedback, generalSaveButton } = elements;
  const fields = Object.values(contexts);
  let generation = 0;
  let queryRevision = 0;
  let models = [];

  function setOptions(list, values) {
    list.replaceChildren(...values.map(({ value, label }) => {
      const option = list.ownerDocument.createElement("option");
      option.value = value;
      option.label = label || value;
      return option;
    }));
  }
  function updateEfforts(context) {
    const selected = models.find((item) => item.model === context.model.value.trim());
    setOptions(context.effortList, (selected?.reasoningEfforts || []).map((value) => ({ value })));
  }
  function busy(value) {
    for (const field of fields) field.model.disabled = field.effort.disabled = value;
    saveButton.disabled = generalSaveButton.disabled = value;
  }
  function read() {
    const value = Object.fromEntries(Object.entries(contexts).map(([key, context]) => [key, {
      model: context.model.value,
      reasoning_effort: context.effort.value
    }]));
    validateCodexSettingsPatch(value);
    return normalizeCodexSettings(value);
  }
  function reset(settings) {
    generation += 1;
    queryRevision += 1;
    const value = normalizeCodexSettings(settings.codex);
    models = [];
    for (const [key, context] of Object.entries(contexts)) {
      context.model.value = value[key].model;
      context.effort.value = value[key].reasoning_effort;
      setOptions(context.modelList, []);
      updateEfforts(context);
    }
    feedback.textContent = "";
    catalogFeedback.textContent = "可手动输入 Model 和 Level。";
    refreshButton.disabled = false;
    busy(false);
  }
  async function refresh() {
    const current = generation;
    const request = ++queryRevision;
    refreshButton.disabled = true;
    catalogFeedback.textContent = "正在获取 Codex 清单；仍可编辑和保存。";
    try {
      const result = await api.listCodexModels();
      if (current !== generation || request !== queryRevision) return;
      models = result.status === "available" && Array.isArray(result.models) ? result.models : [];
      for (const context of fields) {
        setOptions(context.modelList, models.map((item) => ({ value: item.model, label: item.displayName })));
        updateEfforts(context);
      }
      catalogFeedback.textContent = models.length
        ? "已获取候选；Level 候选随 Model 更新。当前值不在清单时也可保留并保存。"
        : "暂无可用清单，可手动输入 Model 和 Level，或重试。";
    } catch {
      if (current !== generation || request !== queryRevision) return;
      models = [];
      for (const context of fields) {
        setOptions(context.modelList, []);
        updateEfforts(context);
      }
      catalogFeedback.textContent = "暂时无法获取清单，可手动输入 Model 和 Level，或重试。";
    } finally {
      if (current === generation && request === queryRevision) refreshButton.disabled = false;
    }
  }
  async function save() {
    const current = generation;
    try {
      const codex = read();
      busy(true);
      feedback.textContent = "正在保存 Codex 配置…";
      const settings = await api.updateSettings({ codex });
      if (current !== generation) return;
      onSaved(settings);
      const saved = normalizeCodexSettings(settings.codex);
      for (const [key, context] of Object.entries(contexts)) {
        context.model.value = saved[key].model;
        context.effort.value = saved[key].reasoning_effort;
        updateEfforts(context);
      }
      feedback.textContent = "已保存。新对话使用 Chat 默认值，下一次 Automation Run 使用 Automation 默认值。";
    } catch {
      if (current === generation) feedback.textContent = "保存失败。Model 和 Level 需为 1–200 个字符的非空文本；请检查后重试，当前输入已保留。";
    } finally {
      if (current === generation) busy(false);
    }
  }
  for (const context of fields) {
    context.model.addEventListener("input", () => { feedback.textContent = ""; updateEfforts(context); });
    context.effort.addEventListener("input", () => { feedback.textContent = ""; });
  }
  refreshButton.addEventListener("click", refresh);
  saveButton.addEventListener("click", save);
  function lockSave() {
    const current = generation;
    busy(true);
    return () => { if (current === generation) busy(false); };
  }
  return { reset, refresh, read, save, lockSave };
}
