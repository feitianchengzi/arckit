import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererPath = new URL("../desktop/renderer/renderer.js", import.meta.url);

test("desktop renderer defines every text truncation helper it calls", async () => {
  const source = await readFile(rendererPath, "utf8");

  assert.match(source, /function truncate\(value, limit\)/);
  assert.match(source, /function safeFormatEvent\(formatFn\)/);
  assert.match(source, /safeFormatEvent\(\(\) => formatActivityEvent\(event\)\)/);
  assert.match(source, /safeFormatEvent\(\(\) => formatPayload\(event\)\)/);
});
