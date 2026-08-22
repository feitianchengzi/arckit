import { requireWorkExternalLinkUrl } from "./work-external-link.mjs";

const RESOURCE_MARKER = /\[(image|file)\]\(([^)]+)\)/g;
const OBJECT_KEY_LIMIT = 2000;

export function parseTaskAttachmentContent(attachment = {}) {
  const type = ["text", "url", "file"].includes(attachment.type) ? attachment.type : "text";
  const content = String(attachment.content || "");
  if (type === "url") {
    return {
      type,
      text: "",
      external_url: normalizeTaskAttachmentUrl(content),
      images: [],
      files: []
    };
  }
  if (type === "file") {
    return {
      type,
      text: "",
      external_url: "",
      images: [],
      files: [normalizeTaskAttachmentObjectKey(content)]
    };
  }

  const payload = parseTextPayload(content);
  const images = [];
  const files = [];
  for (const key of payload.imageKeys || []) pushUnique(images, normalizeTaskAttachmentObjectKey(key));
  for (const key of payload.fileKeys || []) pushUnique(files, normalizeTaskAttachmentObjectKey(key));
  const text = String(payload.text || "").replace(RESOURCE_MARKER, (_match, kind, key) => {
    pushUnique(kind === "image" ? images : files, normalizeTaskAttachmentObjectKey(key));
    return "";
  }).replace(/[ \t]+\n/g, "\n").trim();
  return { type, text, external_url: "", images, files };
}

export function taskCommentTextToMarkdown(value = "") {
  return String(value || "")
    .replace(/\[name\]\(([^)]*)\)/g, (_match, name) => `@${safeDisplayText(name)}`)
    .replace(/\[link\]\(([^)|]+)(?:\|([^)]*))?\)/g, (_match, url, label) => {
      try {
        const href = normalizeTaskAttachmentUrl(url);
        return `[${safeDisplayText(label || href)}](${href})`;
      } catch {
        return `${safeDisplayText(label || url)} (${String(url || "").trim()})`;
      }
    })
    .replace(/(^|\s)(https?:\/\/[^\s<>"\]]+)/gi, (_match, prefix, url) => `${prefix}[${url}](${url})`);
}

export function buildTaskCommentContent({ text = "", images = [], files = [] } = {}) {
  const imageKeys = uniqueObjectKeys(images);
  const fileKeys = uniqueObjectKeys(files);
  const body = String(text || "").trim();
  if (!body && imageKeys.length === 0 && fileKeys.length === 0) throw new TypeError("评论内容或资源不能为空。");
  return [
    ...imageKeys.map((key) => `[image](${key})`),
    ...fileKeys.map((key) => `[file](${key})`),
    body
  ].filter(Boolean).join(" ");
}

export function normalizeTaskAttachmentUrl(value = "") {
  const raw = String(value || "").trim();
  const candidate = raw && !/^[a-z][a-z0-9+.-]*:/i.test(raw) ? `https://${raw}` : raw;
  return requireWorkExternalLinkUrl(candidate);
}

export function normalizeTaskAttachmentObjectKey(value = "") {
  const key = String(value || "").trim().replace(/^\/+/, "");
  if (!key || key.length > OBJECT_KEY_LIMIT || /[\u0000-\u001f\u007f]/.test(key)) throw new TypeError("附件对象 key 无效。");
  const segments = key.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) throw new TypeError("附件对象 key 无效。");
  return key;
}

export function taskAttachmentHasObjectKey(attachment, objectKey) {
  const expected = normalizeTaskAttachmentObjectKey(objectKey);
  const parsed = parseTaskAttachmentContent(attachment);
  return [...parsed.images, ...parsed.files].includes(expected);
}

export function taskAttachmentFileName(objectKey) {
  const name = normalizeTaskAttachmentObjectKey(objectKey).split("/").pop() || "附件";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function parseTextPayload(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && typeof parsed.text === "string") {
      return {
        text: parsed.text,
        imageKeys: Array.isArray(parsed.imageKeys) ? parsed.imageKeys : [],
        fileKeys: Array.isArray(parsed.fileKeys) ? parsed.fileKeys : []
      };
    }
  } catch {}
  return { text: content, imageKeys: [], fileKeys: [] };
}

function uniqueObjectKeys(values) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) pushUnique(result, normalizeTaskAttachmentObjectKey(value));
  return result;
}

function pushUnique(values, value) {
  if (!values.includes(value)) values.push(value);
}

function safeDisplayText(value) {
  const text = String(value || "").trim();
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
