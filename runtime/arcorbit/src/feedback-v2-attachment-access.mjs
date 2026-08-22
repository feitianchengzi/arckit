import OSS from "ali-oss";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function uploadFeedbackAttachmentWithPolicy(fetchImpl, policy, file) {
  if (typeof fetchImpl !== "function") throw new TypeError("Feedback upload requires fetch.");
  const uploadUrl = trustedUploadUrl(policy?.upload_url);
  const fields = policy?.fields && typeof policy.fields === "object" && !Array.isArray(policy.fields) ? policy.fields : null;
  if (!fields || Object.keys(fields).length === 0 || Object.keys(fields).length > 50) throw new Error("Feedback upload policy fields are invalid.");
  if (!(file?.bytes instanceof Uint8Array) || file.bytes.byteLength === 0 || file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new TypeError("Feedback attachment bytes are invalid.");
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(String(key), String(value));
  form.append("file", new Blob([file.bytes], { type: file.mime_type }), file.file_name);
  let response;
  try {
    response = await fetchImpl(uploadUrl, { method: "POST", body: form });
  } catch {
    throw Object.assign(new Error("反馈附件上传请求失败。"), { code: "feedback_attachment_upload_failed" });
  }
  if (response.status !== 201) {
    throw Object.assign(new Error(`反馈附件上传失败（存储服务返回 ${response.status}）。`), {
      code: "feedback_attachment_upload_failed",
      status: response.status
    });
  }
}

export function signFeedbackAttachmentUrl({ objectKey, credentials }) {
  const value = credentials && typeof credentials === "object" ? credentials : {};
  const client = new OSS({
    region: requiredCredential(value.region),
    accessKeyId: requiredCredential(value.access_key_id),
    accessKeySecret: requiredCredential(value.access_key_secret),
    stsToken: requiredCredential(value.security_token),
    bucket: requiredCredential(value.bucket_name),
    secure: value.secure !== false,
    authorizationV4: Boolean(value.authorization_v4)
  });
  const url = client.signatureUrl(String(objectKey || "").replace(/^\/+/, ""), { expires: 15 * 60 });
  return trustedUploadUrl(url);
}

function trustedUploadUrl(value) {
  const url = new URL(String(value || ""));
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Feedback attachment URL is invalid.");
  return url.toString();
}

function requiredCredential(value) {
  const text = String(value || "").trim();
  if (!text) throw new Error("Feedback attachment credentials are incomplete.");
  return text;
}
