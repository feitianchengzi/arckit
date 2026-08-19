import assert from "node:assert/strict";
import test from "node:test";
import { requireFeedbackAttachmentUrl } from "../src/feedback-attachment-url.mjs";

test("feedback attachment URLs accept only absolute credential-free HTTPS targets", () => {
  assert.equal(requireFeedbackAttachmentUrl(" https://files.example.test/path/image.png?x=1 "), "https://files.example.test/path/image.png?x=1");
  for (const value of [
    "http://files.example.test/image.png",
    "javascript:alert(1)",
    "file:///tmp/image.png",
    "/relative/image.png",
    "feedback/object-key.png",
    "https://user:secret@files.example.test/image.png",
    ""
  ]) {
    assert.throws(() => requireFeedbackAttachmentUrl(value), /HTTPS/);
  }
});
