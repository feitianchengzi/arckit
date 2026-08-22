import assert from "node:assert/strict";
import test from "node:test";
import {
  signWorkTaskAttachmentUrl,
  uploadWorkTaskAttachmentResource,
  workTaskAttachmentObjectKey
} from "../src/work-task-attachment-resource.mjs";

const credentials = {
  region: "oss-cn-test",
  access_key_id: "id",
  access_key_secret: "secret",
  security_token: "token",
  bucket_name: "bucket",
  root_path: "/workshop",
  secure: true,
  authorization_v4: true
};

test("Work TaskAttachment resources stay under the authorized comment directory", () => {
  assert.equal(workTaskAttachmentObjectKey("/workshop", "image", "screen.PNG", { now: () => 7, randomId: () => "fixed-id" }), "workshop/attachments/comment/image/7_fixed-id.png");
  const url = signWorkTaskAttachmentUrl({
    objectKey: "workshop/attachments/comment/file/log.txt",
    credentials,
    download: true,
    clientFactory: () => ({ signatureUrl: (key, options) => `https://oss.example.test/${key}?download=${Boolean(options.response)}` })
  });
  assert.equal(url, "https://oss.example.test/workshop/attachments/comment/file/log.txt?download=true");
  assert.throws(() => signWorkTaskAttachmentUrl({ objectKey: "outside/log.txt", credentials, clientFactory: () => ({}) }), /根目录/);
});

test("Work TaskAttachment upload validates bytes and returns only durable resource metadata", async () => {
  const calls = [];
  const result = await uploadWorkTaskAttachmentResource({
    credentials,
    kind: "image",
    file: { file_name: "screen.png", mime_type: "image/png", size: 3, bytes: new Uint8Array([1, 2, 3]) },
    clientFactory: () => ({ put: async (...args) => { calls.push(args); return { res: { status: 200 } }; } }),
    now: () => 9,
    randomId: () => "upload-id"
  });
  assert.deepEqual(result, {
    object_key: "workshop/attachments/comment/image/9_upload-id.png",
    file_name: "screen.png",
    mime_type: "image/png",
    size: 3,
    kind: "image"
  });
  assert.equal(calls[0][0], result.object_key);
  await assert.rejects(uploadWorkTaskAttachmentResource({ credentials, kind: "image", file: { file_name: "bad.txt", mime_type: "text/plain", size: 1, bytes: new Uint8Array([1]) } }), /MIME/);
});
