import assert from "node:assert/strict";
import test from "node:test";
import { parseWorkTaskReference, renderRestrictedMarkdown, resolveWorkTaskReference, workTaskReference, workTaskReferenceSelection } from "../desktop/renderer/restricted-markdown.mjs";

test("Work task references preserve project and task identity", () => {
  const reference = workTaskReference({ project_id: "product/11", id: "task 21" });
  assert.equal(reference, "arcorbit-work://project/product%2F11/task/task%2021");
  assert.deepEqual(parseWorkTaskReference(reference), { project_id: "product/11", task_id: "task 21" });
});

test("Work task references resolve only visible tasks in the active workset", () => {
  const platform = {
    active_workset: { project_ids: ["product/11"] },
    tasks: [{ id: "task 21", project_id: "product/11", state: "completed", created_at: "2026-08-21T10:00:00Z" }]
  };
  const target = resolveWorkTaskReference("arcorbit-work://project/product%2F11/task/task%2021", platform);
  assert.deepEqual(target, {
    project_id: "product/11",
    task_id: "task 21",
    state: "completed",
    created_at: "2026-08-21T10:00:00Z"
  });
  assert.deepEqual(workTaskReferenceSelection(target), {
    page: "work",
    selectedProjectId: "product/11",
    selectedState: "completed",
    selectedPlatformTaskId: "task 21"
  });
  assert.throws(() => resolveWorkTaskReference("arcorbit-work://project/product%2F12/task/task%2021", platform), /不在当前产品集/);
  assert.throws(() => resolveWorkTaskReference("arcorbit-work://project/product%2F11/task/missing", platform), /无法在该产品中找到/);
  assert.throws(() => parseWorkTaskReference("https://example.test/project/11/task/21"), /格式无效/);
  assert.throws(() => parseWorkTaskReference("arcorbit-work://project/11/task/21?unsafe=1"), /格式无效/);
  assert.throws(() => workTaskReferenceSelection({ project_id: "11", task_id: "21", state: "unknown" }), /上下文无效/);
});

test("restricted Work markdown renders useful structure without executable HTML", () => {
  const html = renderRestrictedMarkdown(`# Detail

**strong** and \`inline\u0060 with [safe](https://example.test/path).

- first
- second

\u0060\u0060\u0060js
<script>alert(1)</script>
\u0060\u0060\u0060`);

  assert.match(html, /<h2>Detail<\/h2>/);
  assert.match(html, /<strong>strong<\/strong>/);
  assert.match(html, /<code>inline<\/code>/);
  assert.match(html, /<ul><li>first<\/li><li>second<\/li><\/ul>/);
  assert.match(html, /class="task-markdown-link"/);
  assert.match(html, /type="button"/);
  assert.match(html, /data-task-markdown-external-link="https:\/\/example\.test\/path"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script|onclick=|href=/i);
});

test("restricted Work markdown makes unsafe links inert", () => {
  const html = renderRestrictedMarkdown(`[run](javascript:alert(1)) [secret](https://user:secret@example.test/path) <img src=x onerror=alert(2)>`);

  assert.doesNotMatch(html, /javascript:alert\(1\)["']/i);
  assert.doesNotMatch(html, /<img/i);
  assert.match(html, /&lt;img src=x onerror=alert\(2\)&gt;/);
  assert.doesNotMatch(html, /data-task-markdown-external-link=/);
});
