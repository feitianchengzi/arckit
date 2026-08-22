import OSS from "ali-oss";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeTaskAttachmentObjectKey } from "./work-task-attachment-content.mjs";

export const WORK_TASK_IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const WORK_TASK_FILE_MAX_BYTES = 25 * 1024 * 1024;

export async function uploadWorkTaskAttachmentResource({ credentials, kind, file, clientFactory = createOssClient, now = Date.now, randomId = randomUUID }) {
  const normalizedKind = requireKind(kind);
  const normalizedFile = requireUploadFile(file, normalizedKind);
  const client = clientFactory(credentials);
  const objectKey = workTaskAttachmentObjectKey(credentials?.root_path, normalizedKind, normalizedFile.file_name, { now, randomId });
  const result = await client.put(objectKey, normalizedFile.bytes, { headers: { "Content-Type": normalizedFile.mime_type } });
  if (result?.res?.status !== 200) throw Object.assign(new Error("评论资源上传失败。"), { code: "work_attachment_upload_failed" });
  return { object_key: objectKey, file_name: normalizedFile.file_name, mime_type: normalizedFile.mime_type, size: normalizedFile.size, kind: normalizedKind };
}

export function signWorkTaskAttachmentUrl({ objectKey, credentials, download = false, clientFactory = createOssClient }) {
  const key = requireRootedObjectKey(objectKey, credentials?.root_path);
  const client = clientFactory(credentials);
  const fileName = key.split("/").pop() || "attachment";
  const response = download ? { "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}` } : undefined;
  return requireTrustedResourceUrl(client.signatureUrl(key, { expires: 15 * 60, ...(response ? { response } : {}) }));
}

export function workTaskAttachmentObjectKey(rootPath, kind, fileName, { now = Date.now, randomId = randomUUID } = {}) {
  const root = normalizeRootPath(rootPath);
  const directory = requireKind(kind) === "image" ? "attachments/comment/image" : "attachments/comment/file";
  const extension = safeExtension(fileName);
  const suffix = String(randomId()).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  if (!suffix) throw new Error("评论资源标识生成失败。");
  return normalizeTaskAttachmentObjectKey(`${root ? `${root}/` : ""}${directory}/${Number(now())}_${suffix}${extension}`);
}

export function requireTrustedResourceUrl(value) {
  const url = new URL(String(value || ""));
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname || url.toString().length > 8192) throw new Error("评论资源 URL 无效。");
  return url.toString();
}

function createOssClient(credentials) {
  const value = credentials && typeof credentials === "object" ? credentials : {};
  return new OSS({
    region: requiredCredential(value.region),
    accessKeyId: requiredCredential(value.access_key_id),
    accessKeySecret: requiredCredential(value.access_key_secret),
    stsToken: requiredCredential(value.security_token),
    bucket: requiredCredential(value.bucket_name),
    secure: value.secure !== false,
    authorizationV4: Boolean(value.authorization_v4)
  });
}

function requireUploadFile(value, kind) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("评论资源文件无效。");
  const bytes = value.bytes instanceof Uint8Array ? value.bytes : value.bytes instanceof ArrayBuffer ? new Uint8Array(value.bytes) : null;
  const max = kind === "image" ? WORK_TASK_IMAGE_MAX_BYTES : WORK_TASK_FILE_MAX_BYTES;
  if (!bytes || bytes.byteLength === 0 || bytes.byteLength > max) throw new TypeError(`评论${kind === "image" ? "图片" : "文件"}大小无效。`);
  const size = Number(value.size || bytes.byteLength);
  if (!Number.isSafeInteger(size) || size !== bytes.byteLength) throw new TypeError("评论资源文件大小不一致。");
  const mimeType = String(value.mime_type || "application/octet-stream").trim().toLowerCase();
  if (!mimeType || mimeType.length > 200 || (kind === "image" && !mimeType.startsWith("image/"))) throw new TypeError("评论资源 MIME 类型无效。");
  return { file_name: safeFileName(value.file_name), mime_type: mimeType, size, bytes };
}

function requireRootedObjectKey(value, rootPath) {
  const key = normalizeTaskAttachmentObjectKey(value);
  const root = normalizeRootPath(rootPath);
  if (root && key !== root && !key.startsWith(`${root}/`)) throw new Error("评论资源不在授权 OSS 根目录内。");
  return key;
}

function normalizeRootPath(value) {
  const root = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  return root ? normalizeTaskAttachmentObjectKey(root) : "";
}

function safeFileName(value) {
  const name = String(value || "").trim().split(/[\\/]/).pop();
  if (!name || name.length > 500 || /[\u0000-\u001f\u007f]/.test(name)) throw new TypeError("评论资源文件名无效。");
  return name;
}

function safeExtension(value) {
  const extension = extname(safeFileName(value)).toLowerCase();
  return /^\.[a-z0-9]{1,12}$/.test(extension) ? extension : "";
}

function requireKind(value) {
  if (!["image", "file"].includes(value)) throw new TypeError("评论资源类型无效。");
  return value;
}

function requiredCredential(value) {
  const text = String(value || "").trim();
  if (!text) throw new Error("评论资源临时凭据不完整。");
  return text;
}
