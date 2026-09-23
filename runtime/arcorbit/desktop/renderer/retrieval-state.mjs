/**
 * 知识库检索状态管理：与快照 feedback 对象解耦，按 id 独立缓存。
 *
 * 产品规格（详情页知识库检索）：
 * - 区域四态常驻：idle / loading / ready(命中|未匹配) / error，view 永不返回 null
 * - 详情打开默认不自动打 LLM；仅显式触发（手动按钮 / 分诊成功后）
 * - 命中显示内容；未命中显示"未匹配到"；错误保留 stale 并标记 degraded
 *
 * 解决的缺陷（详见 test/feedback-retrieval-store.test.mjs）：
 * - 快照刷新替换对象后检索结果丢失 → 闪烁
 * - 请求进行中无 loading 占位 → 区域消失
 * - 陈旧响应覆盖当前选中反馈 → 内容错乱
 * - 错误静默清空结果 → 与成功结果交替出现
 * - 每轮快照刷新重复发起 LLM 检索 → 放大后端非确定性
 */

/**
 * @returns {{
 *   begin: (id: string|number) => boolean,
 *   finish: (id: string|number, result: {hits?: any[], confidence?: number, draft_reply?: string}) => void,
 *   fail: (id: string|number, error: unknown) => void,
 *   view: (id: string|number) => {status: string, hits: any[], confidence: number, draft_reply: string, degraded: boolean, error: string},
 *   shouldAutoLoad: (id: string|number, hasContent: boolean) => boolean,
 *   canManualLoad: (id: string|number) => boolean,
 *   invalidate: (id: string|number) => void
 * }}
 */
export function createRetrievalStore() {
  const cache = new Map();
  const active = new Set();

  const idleView = () => ({
    status: "idle",
    hits: [],
    confidence: 0,
    draft_reply: "",
    degraded: false,
    error: ""
  });

  return {
    begin(id) {
      const key = String(id);
      if (active.has(key)) return false;
      active.add(key);
      const prev = cache.get(key);
      const keepStale = Array.isArray(prev?.hits);
      cache.set(key, {
        status: "loading",
        hits: keepStale ? prev.hits : [],
        confidence: keepStale ? (prev.confidence ?? 0) : 0,
        draft_reply: keepStale ? (prev.draft_reply || "") : "",
        degraded: false,
        error: ""
      });
      return true;
    },

    finish(id, result) {
      const key = String(id);
      active.delete(key);
      const hits = Array.isArray(result?.hits) ? result.hits : [];
      cache.set(key, {
        status: "ready",
        hits,
        confidence: Number(result?.confidence ?? 0),
        draft_reply: String(result?.draft_reply || ""),
        degraded: false,
        error: ""
      });
    },

    fail(id, error) {
      const key = String(id);
      active.delete(key);
      const prev = cache.get(key);
      const staleHits = Array.isArray(prev?.hits) ? prev.hits : [];
      const hadStale = prev != null && Array.isArray(prev.hits) && (prev.status === "ready" || prev.status === "loading");
      cache.set(key, {
        status: "error",
        hits: staleHits,
        confidence: hadStale ? (prev.confidence ?? 0) : 0,
        draft_reply: hadStale ? (prev.draft_reply || "") : "",
        degraded: true,
        error: String(error?.message || error || "检索失败")
      });
    },

    /**
     * 四态常驻快照：未知 id 返回 idle 占位（hits: []），永不返回 null。
     * 渲染层据此始终输出检索卡片：idle→未检索，ready 空→未匹配到，loading→检索中。
     */
    view(id) {
      const key = String(id);
      const entry = cache.get(key);
      if (entry) {
        return {
          ...entry,
          hits: Array.isArray(entry.hits) ? entry.hits : []
        };
      }
      if (active.has(key)) {
        return { status: "loading", hits: [], confidence: 0, draft_reply: "", degraded: false, error: "" };
      }
      return idleView();
    },

    /**
     * 详情打开默认不自动检索（产品决策：打开详情不打 LLM）。
     * 显式触发点（分诊成功后等）若需判断，用 canManualLoad + begin。
     */
    shouldAutoLoad() {
      return false;
    },

    /**
     * 手动检索资格：非进行中即可发起（begin 仍做原子去重）。
     * idle / ready / error 均允许手动重查。
     */
    canManualLoad(id) {
      if (!active.has(String(id))) return true;
      return false;
    },

    invalidate(id) {
      const key = String(id);
      active.delete(key);
      cache.delete(key);
    }
  };
}

/**
 * 选中态守卫：await 完成后只有仍选中的反馈才允许更新 DOM。
 * @param {unknown} selectedId 当前选中的反馈 id
 * @param {unknown} feedbackId 响应归属的反馈 id
 * @returns {boolean}
 */
export function isCurrentSelection(selectedId, feedbackId) {
  const selected = String(selectedId ?? "");
  return selected !== "" && selected === String(feedbackId);
}

/**
 * AI 分诊退避：失败过的反馈不再随渲染自动重试，阻断刷新风暴。
 * @returns {{shouldRun: (id: string|number, hasTriage: boolean) => boolean, markFailed: (id: string|number) => void, markSuccess: (id: string|number) => void}}
 */
export function createTriageGate() {
  const failed = new Set();
  return {
    shouldRun(id, hasTriage) {
      if (hasTriage) return false;
      return !failed.has(String(id));
    },
    markFailed(id) {
      failed.add(String(id));
    },
    markSuccess(id) {
      failed.delete(String(id));
    }
  };
}
