# Completion Review 1

内容修订 2；结果 findings。本轮仅审查。

RF-20260909-003-001（error）：Idea 页面异步准备/保存回调缺少发起对象和页面版本绑定。`product-surface.mjs` 的 prepare 捕获 id 后 await productChat，但随后调用使用全局 current 的 loadChat，并对全局 chat 执行 initialize；saveReview 在 await 之后直接设置全局 current。用户在等待中切换 Idea 或返回列表时，A 的迟到结果可能投影到 B，或恢复 A 覆盖新的选择。

代码可追踪序列：prepare(A) 等待 → open(B) 更新 current/chat → A 返回 → loadChat() 取 B → chat.initialize(snapshot(A))。当前 epoch 只保护 open 的 detail 获取，未覆盖这些回调。

要求：所有受影响的异步结果只回写发起时的对象和仍有效的页面 owner；后台操作继续保存自身结果，不能覆盖新选择。验证延迟准备、延迟保存、切换 B 后 A 返回的场景，确认 B 的字段、对话与后续发送身份正确。

implementation_correctness、problem_resolution、verification_credibility、regression_risk 为 findings；minimality 为 clean。现有 115 项检查与真实模型/窗口验证限制保持，不能替代此切换边界检查。
