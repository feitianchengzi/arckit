import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { CODEX_OWNER_RECEIPT_SCHEMA, createCodexOwnerReceiptStore } from "../src/codex-owner-receipt-store.mjs";

test("standalone owner receipts persist atomically without auth or proxy data", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "arcorbit-codex-receipts-"));
  const file = path.join(root, "receipts.json");
  try {
    const store = createCodexOwnerReceiptStore(file);
    await store.record({ id: "codex-fixture", command: "/fixture/.local/bin/codex", version: "1.2.3", secret: "not-persisted" });
    assert.deepEqual((await store.read()).map(({ recorded_at: _recordedAt, ...receipt }) => receipt), [{
      id: "codex-fixture",
      command: "/fixture/.local/bin/codex",
      version: "1.2.3"
    }]);
    const raw = await readFile(file, "utf8");
    assert.equal(JSON.parse(raw).schema_version, CODEX_OWNER_RECEIPT_SCHEMA);
    assert.equal(raw.includes("not-persisted"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
