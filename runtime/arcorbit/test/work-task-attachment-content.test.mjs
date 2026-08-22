import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskCommentContent,
  normalizeTaskAttachmentUrl,
  parseTaskAttachmentContent,
  taskAttachmentHasObjectKey,
  taskCommentTextToMarkdown
} from "../src/work-task-attachment-content.mjs";

test("TaskAttachment text preserves JSON and tag image/file resources", () => {
  assert.deepEqual(parseTaskAttachmentContent({
    type: "text",
    content: JSON.stringify({ text: "See [link](https://example.test|spec)", imageKeys: ["workshop/a.png"], fileKeys: ["workshop/a.pdf"] })
  }), {
    type: "text",
    text: "See [link](https://example.test|spec)",
    external_url: "",
    images: ["workshop/a.png"],
    files: ["workshop/a.pdf"]
  });
  const tagged = parseTaskAttachmentContent({ type: "text", content: "[image](/workshop/a.png) [file](workshop/a.pdf) Update" });
  assert.deepEqual(tagged, { type: "text", text: "Update", external_url: "", images: ["workshop/a.png"], files: ["workshop/a.pdf"] });
  assert.equal(taskAttachmentHasObjectKey({ type: "text", content: "[file](workshop/a.pdf)" }, "workshop/a.pdf"), true);
});

test("TaskAttachment URL and comment serialization are explicit and safe", () => {
  assert.equal(normalizeTaskAttachmentUrl("example.test/spec"), "https://example.test/spec");
  assert.equal(taskCommentTextToMarkdown("[name](glare) [link](https://example.test|Spec)"), "@glare [Spec](https://example.test/)");
  assert.equal(buildTaskCommentContent({ text: "Update", images: ["workshop/a.png"], files: ["workshop/a.pdf"] }), "[image](workshop/a.png) [file](workshop/a.pdf) Update");
  assert.throws(() => normalizeTaskAttachmentUrl("javascript:alert(1)"), /外部地址|not allowed/);
  assert.throws(() => parseTaskAttachmentContent({ type: "file", content: "../secret" }), /key/);
  assert.throws(() => buildTaskCommentContent({}), /不能为空/);
});
