import { JsonRpcStdioClient } from "./json-rpc-stdio-client.mjs";
import { validCodexSetting } from "./codex-model-settings.mjs";

// A separate, read-only app-server: never creates or resumes a conversation.
export async function queryCodexModelCatalog({ command, cwd, env, timeoutMs = 10_000, createClient = (options) => new JsonRpcStdioClient(options) }) {
  let client;
  let timer;
  let expired = false;
  try {
    client = createClient({ command, args: ["app-server", "--stdio"], cwd, env, stderr: "ignore" });
    const query = async () => {
      await client.request("initialize", { clientInfo: { name: "arcorbit-model-catalog", version: "0.1.0" }, capabilities: { experimentalApi: true } });
      if (expired) throw new Error("expired");
      client.notify("initialized", {});
      const models = new Map();
      const cursors = new Set();
      let cursor = null;
      for (let page = 0; page < 50; page += 1) {
        if (expired) throw new Error("expired");
        const response = await client.request("model/list", { cursor, limit: 100, includeHidden: false });
        if (expired) throw new Error("expired");
        if (!Array.isArray(response?.data) || response.data.length > 1000) throw new Error("invalid catalog");
        for (const model of response.data) {
          if (!validCodexSetting(model?.model) || !Array.isArray(model.supportedReasoningEfforts) || model.supportedReasoningEfforts.length > 100) throw new Error("invalid model");
          if (model.hidden) continue;
          const efforts = model.supportedReasoningEfforts.map((entry) => entry?.reasoningEffort);
          if (efforts.some((effort) => !validCodexSetting(effort))) throw new Error("invalid effort");
          models.set(model.model, {
            model: model.model,
            displayName: typeof model.displayName === "string" ? model.displayName.slice(0, 200) : model.model,
            reasoningEfforts: [...new Set(efforts)],
            defaultReasoningEffort: validCodexSetting(model.defaultReasoningEffort) ? model.defaultReasoningEffort : ""
          });
        }
        if (models.size > 1000) throw new Error("catalog too large");
        if (response.nextCursor === null) return { status: "available", models: [...models.values()] };
        cursor = response.nextCursor;
        if (typeof cursor !== "string" || !cursor || cursor.length > 4096 || cursors.has(cursor)) throw new Error("invalid cursor");
        cursors.add(cursor);
      }
      throw new Error("page limit");
    };
    return await Promise.race([
      query(),
      new Promise((_, reject) => { timer = setTimeout(() => { expired = true; reject(new Error("timeout")); }, timeoutMs); })
    ]);
  } catch {
    // Provider errors may contain credentials or private paths. Only this fixed projection crosses IPC.
    return { status: "unavailable", models: [], message: "暂时无法获取 Codex 清单，可手动输入 Model 和 Level，或稍后重试。" };
  } finally {
    clearTimeout(timer);
    client?.close();
  }
}
