import { normalizeCodexSettings, validateCodexSettingsPatch } from "../../src/codex-model-settings.mjs";

export function createCodexSettingsForm({ elements, api, onSaved = () => {} }) {
  const { model, effort, modelList, effortList, refreshButton, saveButton, feedback, catalogFeedback, generalSaveButton } = elements;
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
  function updateEfforts() {
    const selected = models.find((item) => item.model === model.value.trim());
    setOptions(effortList, (selected?.reasoningEfforts || []).map((value) => ({ value })));
  }
  function busy(value) {
    model.disabled = effort.disabled = saveButton.disabled = generalSaveButton.disabled = value;
  }
  function read() {
    const value = { model: model.value, reasoning_effort: effort.value };
    validateCodexSettingsPatch(value);
    return normalizeCodexSettings(value);
  }
  function reset(settings) {
    generation += 1;
    queryRevision += 1;
    const value = normalizeCodexSettings(settings.codex);
    model.value = value.model;
    effort.value = value.reasoning_effort;
    models = [];
    setOptions(modelList, []);
    updateEfforts();
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
      setOptions(modelList, models.map((item) => ({ value: item.model, label: item.displayName })));
      updateEfforts();
      catalogFeedback.textContent = models.length
        ? "已获取候选；Level 候选随 Model 更新。当前值不在清单时也可保留并保存。"
        : "暂无可用清单，可手动输入 Model 和 Level，或重试。";
    } catch {
      if (current !== generation || request !== queryRevision) return;
      models = [];
      setOptions(modelList, []);
      updateEfforts();
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
      model.value = settings.codex.model;
      effort.value = settings.codex.reasoning_effort;
      updateEfforts();
      feedback.textContent = "已保存。下一条 Chat 消息及下一次 Automation Run 使用新配置。";
    } catch {
      if (current === generation) feedback.textContent = "保存失败。Model 和 Level 需为 1–200 个字符的非空文本；请检查后重试，当前输入已保留。";
    } finally {
      if (current === generation) busy(false);
    }
  }
  model.addEventListener("input", () => { feedback.textContent = ""; updateEfforts(); });
  effort.addEventListener("input", () => { feedback.textContent = ""; });
  refreshButton.addEventListener("click", refresh);
  saveButton.addEventListener("click", save);
  function lockSave() {
    const current = generation;
    busy(true);
    return () => { if (current === generation) busy(false); };
  }
  return { reset, refresh, read, save, lockSave };
}
