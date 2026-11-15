(() => {
  if (M.variant !== "dock") return;
  const { e, b, icon } = V,
    base = V.render;
  const files = {
    "src/components/ExportDialog.tsx": {
      status: "M",
      body: `import { useState } from 'react';\nimport { exportRecords } from '../services/export';\n\nexport function ExportDialog({ records }) {\n  const [progress, setProgress] = useState(0);\n  const [error, setError] = useState('');\n\n  async function handleExport() {\n    setError('');\n    try {\n      await exportRecords(records, setProgress);\n    } catch {\n      setError('导出失败，请重试');\n    }\n  }\n\n  return (\n    <section>\n      <progress value={progress} max={100} />\n      {error && <p>{error}</p>}\n      <button onClick={handleExport}>导出</button>\n    </section>\n  );\n}`,
    },
    "src/services/export.ts": {
      status: "M",
      body: `export async function exportRecords(records, onProgress) {\n  onProgress(0);\n  const result = await createExport(records);\n  onProgress(100);\n  return result;\n}`,
    },
    "src/styles/export.css": {
      status: "",
      body: `.export-dialog {\n  padding: 24px;\n  max-width: 480px;\n}\n\n.export-progress {\n  width: 100%;\n  margin-block: 16px;\n}`,
    },
    "tests/export.test.ts": {
      status: "A",
      body: `describe('阅读记录导出', () => {\n  it('导出时显示进度', async () => {\n    await expectProgressVisible();\n  });\n\n  it('失败后保留选择', async () => {\n    await expectSelectionRetained();\n  });\n});`,
    },
    "README.md": {
      status: "",
      body: "# 拾光\n\n保存阅读，留下自己的收获。\n\n## 本地运行\n\nnpm install\nnpm run dev\n\n## 验证\n\nnpm test",
    },
  };
  const diffs = {
    "src/components/ExportDialog.tsx": [
      ["context", " export function ExportDialog({ records }) {"],
      ["add", "  const [progress, setProgress] = useState(0);"],
      ["add", "  const [error, setError] = useState('');"],
      ["context", "   async function handleExport() {"],
      ["remove", "    await exportRecords(records);"],
      ["add", "    setError('');"],
      ["add", "    try {"],
      ["add", "      await exportRecords(records, setProgress);"],
      ["add", "    } catch {"],
      ["add", "      setError('导出失败，请重试');"],
      ["add", "    }"],
      ["context", "   }"],
    ],
    "src/services/export.ts": [
      ["remove", "export async function exportRecords(records) {"],
      ["add", "export async function exportRecords(records, onProgress) {"],
      ["add", "  onProgress(0);"],
      ["context", "  const result = await createExport(records);"],
      ["add", "  onProgress(100);"],
      ["context", "  return result;"],
      ["context", "}"],
    ],
    "tests/export.test.ts": files["tests/export.test.ts"].body
      .split("\n")
      .map((x) => ["add", x]),
  };
  const ui = () => {
    M.s.dock ??= {
      tab: "task",
      file: "",
      diff: "",
      collapsed: [],
      query: "",
      index: false,
      staged: [],
      scroll: {},
    };
    return M.s.dock;
  };
  const counts = (path) => {
    const rows = diffs[path] || [];
    return `<span class="add-text">+${rows.filter((r) => r[0] === "add").length}</span> <span class="remove-text">−${rows.filter((r) => r[0] === "remove").length}</span>`;
  };
  function fileTree() {
    const u = ui(),
      paths = Object.keys(files).filter((p) =>
        p.toLowerCase().includes(u.query.toLowerCase()),
      );
    let html = "",
      seen = new Set();
    for (const path of paths) {
      const parts = path.split("/");
      let hidden = false;
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = parts.slice(0, i + 1).join("/");
        if (!seen.has(folder) && !hidden) {
          html += `<button class="tree-folder" data-dock="folder" data-path="${folder}" style="padding-left:${14 + i * 16}px" aria-expanded="${!u.collapsed.includes(folder)}">${u.collapsed.includes(folder) ? "›" : "⌄"} ${e(parts[i])}</button>`;
          seen.add(folder);
        }
        if (u.collapsed.includes(folder) && !u.query) hidden = true;
      }
      if (!hidden)
        html += `<button class="tree-file ${u.file === path ? "selected" : ""}" data-dock="file" data-path="${path}" style="padding-left:${14 + (parts.length - 1) * 16}px"><span>${icon("file")} ${e(parts.at(-1))}</span><small>${files[path].status}</small></button>`;
    }
    return html || '<p class="muted">没有找到文件</p>';
  }
  function inspector() {
    const u = ui(),
      t = M.current();
    let body = "";
    if (u.tab === "task")
      body = t
        ? V.summary(t)
        : '<div class="inspector-empty">发送消息，开始新的工作。</div>';
    if (u.tab === "files")
      body = `<div class="inspector-context"><strong>拾光</strong><small> / workspace</small></div><input class="file-search" aria-label="搜索文件" placeholder="搜索文件…" value="${e(u.query)}"><div class="file-tree">${fileTree()}</div>${u.file ? `<div class="file-preview"><div class="row between"><strong>${e(u.file.split("/").at(-1))}</strong>${b("dock-reference", "引用到对话", "small", `data-path="${e(u.file)}"`)}</div><small class="file-path">${e(u.file)}</small><pre>${e(files[u.file].body)}</pre></div>` : ""}`;
    if (u.tab === "git") {
      const paths = Object.keys(diffs).filter((p) =>
        u.index ? u.staged.includes(p) : !u.staged.includes(p),
      );
      body = `<div class="git-branch row between"><strong>⑂ feature/export-feedback</strong><small>${Object.keys(diffs).length} 个变更</small></div><div class="tabbar"><button data-dock="git-scope" data-index="false" class="quiet ${!u.index ? "active" : ""}">工作区 ${3 - u.staged.length}</button><button data-dock="git-scope" data-index="true" class="quiet ${u.index ? "active" : ""}">已暂存 ${u.staged.length}</button></div><div class="git-files">${paths.map((p) => `<button class="diff-file ${u.diff === p ? "selected" : ""}" data-dock="diff" data-path="${p}"><span class="grow"><strong>${e(p.split("/").at(-1))}</strong><small>${e(p.split("/").slice(0, -1).join("/"))}</small></span><span>${counts(p)}</span></button>`).join("") || '<p class="muted">没有相应变更</p>'}</div>${u.diff && paths.includes(u.diff) ? `<div class="diff-preview"><div class="row wrap between"><strong>${e(u.diff.split("/").at(-1))}</strong>${b("dock-stage", u.index ? "取消暂存" : "暂存文件", "small", `data-path="${e(u.diff)}"`)}</div><div class="row between"><small>HEAD ↔ ${u.index ? "暂存区" : "工作区"}</small>${b("dock-reference", "引用差异", "quiet small", `data-path="${e(u.diff)}"`)}</div><div class="code-diff">${diffs[u.diff].map(([kind, text], i) => `<div class="diff-line ${kind}"><span>${i + 1}</span><code>${kind === "add" ? "+" : kind === "remove" ? "−" : " "} ${e(text)}</code></div>`).join("")}</div></div>` : '<div class="inspector-empty">选择文件查看差异</div>'}`;
    }
    return `<aside class="inspector ${M.s.drawer ? "is-open" : ""}" aria-label="综合栏"><header class="inspector-tabs" role="tablist" aria-label="工作资料">${[
      ["task", "待办"],
      ["files", "文件"],
      ["git", "Git Diff"],
    ]
      .map(
        ([key, label]) =>
          `<button role="tab" aria-selected="${u.tab === key}" data-dock="tab" data-tab="${key}" class="${u.tab === key ? "active" : ""}">${label}</button>`,
      )
      .join(
        "",
      )}${b("close-details", icon("close"), "quiet inspector-close", 'aria-label="关闭综合栏"')}</header><div class="inspector-content" role="tabpanel" aria-label="${{ task: "待办详情", files: "文件列表", git: "Git Diff" }[u.tab]}">${body}</div><footer class="inspector-footer"><span>拾光</span><span>${u.tab === "task" ? (t ? "#" + t.id : "新工作") : "feature/export-feedback"}</span></footer></aside>`;
  }
  V.render = () => {
    const preview = new URLSearchParams(location.search).has("preview");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = base();
    if (!preview) wrapper.querySelector(".lab")?.remove();
    const shell = wrapper.querySelector(".shell");
    shell.classList.add("dock-v2");
    if (preview) shell.classList.add("with-preview");
    wrapper.querySelector(".summary")?.remove();
    shell.insertAdjacentHTML("beforeend", inspector());
    const control = wrapper.querySelector(".controlbar"),
      top = wrapper.querySelector(".top");
    if (control) {
      const compact = document.createElement("div");
      compact.className = "header-execution row";
      compact.append(control.querySelector(".pill"), control.lastElementChild);
      top.querySelector(".top-actions").prepend(compact);
      control.remove();
    }
    if (!preview) wrapper.querySelector("[data-act=fill]")?.remove();
    const footer = wrapper.querySelector(".sidebar-foot .row:last-child small");
    if (footer) footer.textContent = "个人空间";
    const hint = wrapper.querySelector(".composer-hint");
    if (hint && !M.s.error)
      hint.textContent =
        M.current()?.mode === "accepted"
          ? "本轮已验收"
          : "Enter 发送 · Shift + Enter 换行";
    let html = wrapper.innerHTML;
    for (const [from, to] of [
      ["与当前对话为同一个待办", "拾光"],
      ["发送后自动建立待办", "新的工作"],
      ["首条消息建立待办", "新工作"],
      ["有效信息 · 第", "修订 "],
      [" 次整理", ""],
      ["形成后会出现在这里，不必翻找消息。", "暂无成果"],
      ["离线样本", "连接已断开"],
      ["可交互样本、范围说明与检查记录", "体验预览与检查记录"],
      ["导出体验样本", "导出体验"],
      [
        "直接聊，工作会随第一条消息建立。<br>有效信息会逐步整理在这件事里。",
        "今天想推进什么？",
      ],
      ["试试：改善阅读记录导出体验", "改善阅读记录导出体验"],
    ])
      html = html.replaceAll(from, to);
    return html;
  };
  function refresh() {
    document.dispatchEvent(new Event("dock:refresh"));
  }
  document.addEventListener(
    "click",
    (ev) => {
      const el = ev.target.closest("[data-dock]"),
        action = ev.target.closest("[data-act]");
      if (action?.dataset.act === "details") ui().tab = "task";
      if (
        !el &&
        !["dock-reference", "dock-stage"].includes(action?.dataset.act)
      )
        return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const u = ui(),
        path = (el || action).dataset.path;
      if (el?.dataset.dock === "tab") {
        u.tab = el.dataset.tab;
        M.s.drawer = true;
      }
      if (el?.dataset.dock === "folder")
        u.collapsed = u.collapsed.includes(path)
          ? u.collapsed.filter((x) => x !== path)
          : [...u.collapsed, path];
      if (el?.dataset.dock === "file") u.file = path;
      if (el?.dataset.dock === "diff") u.diff = path;
      if (el?.dataset.dock === "git-scope") {
        u.index = el.dataset.index === "true";
        u.diff = "";
      }
      if (action?.dataset.act === "dock-stage") {
        u.staged = u.staged.includes(path)
          ? u.staged.filter((x) => x !== path)
          : [...u.staged, path];
        u.diff = "";
      }
      if (action?.dataset.act === "dock-reference") {
        const t = M.current(),
          text = `${u.tab === "git" ? "请检查这份差异" : "请查看这个文件"}：${path}\n`;
        if (t) t.draft += (t.draft ? "\n" : "") + text;
        else M.s.newDraft += text;
        M.s.drawer = false;
      }
      M.save();
      refresh();
      if (action?.dataset.act === "dock-reference")
        document.querySelector("[name=message]")?.focus();
    },
    true,
  );
  document.addEventListener("input", (ev) => {
    if (ev.target.matches(".file-search")) {
      const start = ev.target.selectionStart;
      ui().query = ev.target.value;
      M.save();
      refresh();
      const field = document.querySelector(".file-search");
      field?.focus();
      field?.setSelectionRange(start, start);
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (
      ev.target.matches("[role=tab]") &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)
    ) {
      ev.preventDefault();
      const tabs = [...document.querySelectorAll("[data-dock=tab]")];
      const i = tabs.indexOf(ev.target);
      const next =
        ev.key === "Home"
          ? 0
          : ev.key === "End"
            ? 2
            : (i + (ev.key === "ArrowRight" ? 1 : 2)) % 3;
      tabs[next].click();
      document.querySelectorAll("[data-dock=tab]")[next]?.focus();
    }
  });
})();
