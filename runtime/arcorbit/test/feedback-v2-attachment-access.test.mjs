import assert from "node:assert/strict";
import test from "node:test";
import { signFeedbackAttachmentUrl, uploadFeedbackAttachmentWithPolicy } from "../src/feedback-v2-attachment-access.mjs";

test("Feedback V2 attachment upload accepts only bounded HTTPS POST policies", async () => {
  const calls = [];
  await uploadFeedbackAttachmentWithPolicy(async (url, options) => {
    calls.push({ url, options });
    return { status: 201 };
  }, {
    upload_url: "https://oss.example.test/upload",
    fields: { key: "feedback/51/log.txt", policy: "bounded" }
  }, {
    file_name: "log.txt",
    mime_type: "text/plain",
    bytes: new Uint8Array([1, 2, 3])
  });

  assert.equal(calls[0].url, "https://oss.example.test/upload");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.body instanceof FormData, true);
  await assert.rejects(
    uploadFeedbackAttachmentWithPolicy(async () => ({ status: 201 }), { upload_url: "http://oss.example.test", fields: { key: "x" } }, { bytes: new Uint8Array([1]) }),
    /URL is invalid/
  );
});

test("Feedback V2 attachment signing fails closed before exposing incomplete credentials", () => {
  assert.throws(
    () => signFeedbackAttachmentUrl({ objectKey: "feedback/51/log.txt", credentials: { region: "oss-cn-test" } }),
    /credentials are incomplete/
  );
});
