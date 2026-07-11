import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDesktopStore } from "../src/desktop/desktop-store.mjs";

test("desktop store serializes concurrent reads and updates", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-store-"));
  try {
    const storePath = join(root, "desktop-store.json");
    const store = createDesktopStore({
      dataDir: root,
      runsDir: join(root, "runs"),
      storePath
    });
    await store.updateStore((draft) => {
      draft.projects.push({
        id: "PROJECT-1",
        name: "Project",
        path: root,
        added_at: "2026-07-11T00:00:00.000Z"
      });
      return draft;
    });

    await Promise.all(Array.from({ length: 40 }, (_, index) => {
      if (index % 2 === 0) {
        return store.readStore();
      }
      return store.updateStore((draft) => {
        draft.runs.unshift({
          id: `RUN-${index}`,
          project_id: "PROJECT-1",
          session_id: "SESSION-1",
          status: "completed",
          started_at: `2026-07-11T00:00:${String(index).padStart(2, "0")}.000Z`,
          activity: {
            current_step: "large activity should not be stored in desktop-store.json"
          }
        });
        return draft;
      });
    }));

    const finalStore = await store.readStore();
    const finalStoreText = await readFile(storePath, "utf8");
    assert.equal(finalStore.runs.length, 20);
    assert.equal(finalStore.runs.some((run) => "activity" in run), false);
    assert.doesNotThrow(() => JSON.parse(finalStoreText));
    assert.equal(finalStoreText.includes("large activity should not be stored"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
