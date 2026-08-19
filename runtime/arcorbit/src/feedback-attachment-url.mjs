export function requireFeedbackAttachmentUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || "").trim());
  } catch {
    throw new Error("该反馈附件不是可直接打开的 HTTPS 地址。");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error("该反馈附件不是可直接打开的 HTTPS 地址。");
  }
  return parsed.href;
}
