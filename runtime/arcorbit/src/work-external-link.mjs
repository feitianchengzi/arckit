const WORK_EXTERNAL_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const MAX_WORK_EXTERNAL_LINK_LENGTH = 4096;

export function requireWorkExternalLinkUrl(value) {
  const source = String(value || "").trim();
  if (!source || source.length > MAX_WORK_EXTERNAL_LINK_LENGTH) throw new Error("该任务链接不是可打开的外部地址。");
  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    throw new Error("该任务链接不是可打开的外部地址。");
  }
  if (!WORK_EXTERNAL_LINK_PROTOCOLS.has(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("该任务链接不是可打开的外部地址。");
  }
  if (["http:", "https:"].includes(parsed.protocol) && !parsed.hostname) {
    throw new Error("该任务链接不是可打开的外部地址。");
  }
  if (parsed.protocol === "mailto:" && !parsed.pathname) {
    throw new Error("该任务链接不是可打开的外部地址。");
  }
  return parsed.href;
}
