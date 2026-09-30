// 对话输入框键盘/IME 决策的纯函数（从 chat-widget 抽出，便于单测）。
// 合成期与"合成刚结束"的 Enter 必须只确认候选上屏，不得触发发送。

export function createEnterGate() {
  let imeComposing = false;
  let imeJustComposed = false;
  let clearTimer = null;

  return {
    compositionStart() {
      imeComposing = true;
      imeJustComposed = false;
      if (clearTimer !== null) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
    },
    compositionEnd() {
      imeComposing = false;
      imeJustComposed = true;
      if (clearTimer !== null) {
        clearTimeout(clearTimer);
      }
      clearTimer = setTimeout(() => {
        imeJustComposed = false;
        clearTimer = null;
      }, 0);
    },
    /** keydown 是否应触发发送（仅处理 Enter+无 Shift 的发送语义）。 */
    shouldSendOnEnter(event) {
      if (event.isComposing || event.keyCode === 229 || imeComposing || imeJustComposed) {
        return false;
      }
      return event.key === 'Enter' && !event.shiftKey;
    },
    /** 测试辅助：立即结束"刚合成"窗口（模拟宏任务已清）。 */
    flushJustComposed() {
      if (clearTimer !== null) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
      imeJustComposed = false;
    },
  };
}
