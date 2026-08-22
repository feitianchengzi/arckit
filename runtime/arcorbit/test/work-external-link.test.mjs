import assert from "node:assert/strict";
import test from "node:test";
import { requireWorkExternalLinkUrl } from "../src/work-external-link.mjs";

test("Work external links accept only explicit browser and mail protocols", () => {
  assert.equal(requireWorkExternalLinkUrl("https://example.test/path?q=1"), "https://example.test/path?q=1");
  assert.equal(requireWorkExternalLinkUrl("http://example.test/path"), "http://example.test/path");
  assert.equal(requireWorkExternalLinkUrl("mailto:owner@example.test?subject=ArcOrbit"), "mailto:owner@example.test?subject=ArcOrbit");
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "file:///tmp/private",
    "https://user:secret@example.test/path",
    "mailto:",
    "not a url",
    `https://example.test/${"a".repeat(4096)}`
  ]) assert.throws(() => requireWorkExternalLinkUrl(value), /不是可打开的外部地址/);
});
