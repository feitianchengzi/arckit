const path = require("node:path");
// ws 依赖来自 runtime/arcorbit/node_modules（monorepo 工作区）。
const wsDir = path.resolve(process.env.WS_NODE_MODULES || "/Users/zqs/Downloads/project/arckit/runtime/arcorbit/node_modules");
const WebSocket = require(path.join(wsDir, "ws"));

const [base, uuid, projectId, feedbackId, customUserId] = process.argv.slice(2);
const ws = new WebSocket(`${base.replace("http", "ws")}/workshop/v1/user/projects/${projectId}/ws`, {
  headers: { "X-User-ID": uuid }
});
const timer = setTimeout(() => { console.log("WS_TIMEOUT"); process.exit(2); }, 9000);
ws.on("message", (raw) => {
  const payload = JSON.parse(raw.toString());
  if (payload.event === "feedback.message.created" && String(payload.data?.feedback_id) === String(feedbackId)) {
    console.log(`WS_EVENT_OK sender=${payload.data.sender_type} content=${String(payload.data.content).slice(0, 30)}`);
    clearTimeout(timer);
    ws.close();
    process.exit(0);
  }
});
ws.on("error", () => { console.log("WS_ERROR"); process.exit(3); });
// 连接建立后 1.2s 再触发客户消息（apikey 路由 sender=customer，需反馈自身的 custom_user_id）。
setTimeout(() => {
  fetch(`${base}/workshop/v2/apikey/feedbacks/${feedbackId}/messages`, {
    method: "POST",
    headers: { "X-User-ID": uuid, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "请问修复进展如何？", custom_user_id: customUserId || "e2e-ws-customer", client_message_id: "e2e-" + Date.now() })
  }).catch(() => {});
}, 1200);
