import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-work-navigation-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const click = (selector) => document.querySelector(selector).click();
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      await window.arckitDesktop.setTestPlatformSnapshotDelay(240);
      const startedAt = performance.now();
      click('[data-page="work"]');
      const immediateActive = document.querySelector('#workView').classList.contains('is-active');
      const clickDurationMs = Number((performance.now() - startedAt).toFixed(2));
      await wait(300);
      const workQueryCall = (await window.arckitDesktop.getTestCalls()).filter(([command]) => command === 'platformWorkQuery').at(-1)?.[1] || {};
      await window.arckitDesktop.setTestPlatformSnapshotDelay(0);
      click('[data-page="today"]');
      await window.arckitDesktop.failNextTestPlatformSnapshot('Controlled Work refresh failure');
      click('[data-page="work"]');
      const failureImmediateActive = document.querySelector('#workView').classList.contains('is-active');
      await wait(50);
      const cachedRowsAfterFailure = document.querySelectorAll('#platformWorkTable tbody tr').length;
      const failureToastVisible = document.querySelector('#toast').textContent.includes('Controlled Work refresh failure');
      const layoutGeometry = () => {
        const page = document.querySelector('#workView > .platform-page');
        const status = document.querySelector('.work-state-filter-card');
        const layout = document.querySelector('.platform-work-layout');
        const list = layout.querySelector('.panel-card');
        const pageRect = page.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();
        const layoutRect = layout.getBoundingClientRect();
        return {
          direct_children: page.children.length,
          status_height: Number(statusRect.height.toFixed(2)),
          status_visible: statusRect.top >= pageRect.top && statusRect.bottom <= pageRect.bottom,
          status_before_list: statusRect.bottom <= layoutRect.top,
          list_within_page: layoutRect.bottom <= pageRect.bottom,
          list_height: Number(layoutRect.height.toFixed(2)),
          list_scrolls: list.scrollHeight > list.clientHeight,
          list_overflow_y: getComputedStyle(list).overflowY
        };
      };
      const statusToolbarGeometry = () => {
        const toolbar = document.querySelector('.work-state-filter-card');
        const filters = document.querySelector('.work-state-filters');
        const summary = document.querySelector('#workStateSummary');
        const toolbarRect = toolbar.getBoundingClientRect();
        const filtersRect = filters.getBoundingClientRect();
        const summaryRect = summary.getBoundingClientRect();
        const summaryStyle = getComputedStyle(summary);
        return {
          toolbar_width: Number(toolbarRect.width.toFixed(2)),
          toolbar_height: Number(toolbarRect.height.toFixed(2)),
          filters_width: Number(filtersRect.width.toFixed(2)),
          filters_overflow: filters.scrollWidth > filters.clientWidth,
          buttons_within_filters: [...filters.querySelectorAll('button')].every((button) => {
            const buttonRect = button.getBoundingClientRect();
            return buttonRect.left >= filtersRect.left - 0.5 && buttonRect.right <= filtersRect.right + 0.5;
          }),
          summary_width: Number(summaryRect.width.toFixed(2)),
          summary_overflow: summaryStyle.overflow,
          summary_text_overflow: summaryStyle.textOverflow,
          summary_white_space: summaryStyle.whiteSpace,
          summary_clipped: summary.scrollWidth > summary.clientWidth
        };
      };
      const measureStatusToolbarVariants = () => {
        const summary = document.querySelector('#workStateSummary');
        const originalText = summary.textContent;
        const variants = [
          'Arc研发平台 · 命中 0 / 补全树 0 · 待评审 0 项',
          'Arc研发平台 · 命中 128 / 补全树 356 · 已完成 128 项 · 后台刷新',
          '一个名称明显更长的本地产品工作区用于验证摘要文本截断'.repeat(4) + ' · 命中 9999 / 补全树 12000 · 已阻塞 888 项 · 刷新失败，保留匹配缓存'
        ].map((text) => {
          summary.textContent = text;
          return statusToolbarGeometry();
        });
        summary.textContent = originalText;
        return variants;
      };
      const manyTasks = Array.from({ length: 80 }, (_, index) => ({
        id: 'LAYOUT-' + index,
        project_id: '11',
        project_name: 'ArcOrbit',
        title: 'Layout task ' + index,
        content: 'Verify list owns remaining height',
        state: 'pending',
        terminal: false,
        priority: 100 - index,
        raw: { priority: 1 },
        executor_id: '7',
        assignee: { id: '7', username: 'Glare' },
        tags: ''
      }));
      await window.arckitDesktop.setTestPlatformTasks(manyTasks);
      click('[data-page="today"]');
      click('[data-page="work"]');
      await wait(50);
      const populatedLayout = layoutGeometry();
      await window.arckitDesktop.setTestPlatformTasks([]);
      click('[data-page="today"]');
      click('[data-page="work"]');
      await wait(50);
      const emptyLayout = layoutGeometry();
      const desktopStatusToolbar = measureStatusToolbarVariants();
      return {
        immediate_active: immediateActive,
        click_duration_ms: clickDurationMs,
        work_query_state: workQueryCall.state,
        work_query_has_complete_key: typeof workQueryCall.query_key === 'string' && workQueryCall.query_key.includes('creator_ids') && workQueryCall.query_key.includes('start_time'),
        failure_immediate_active: failureImmediateActive,
        cached_rows_after_failure: cachedRowsAfterFailure,
        failure_toast_visible: failureToastVisible,
        populated_layout: populatedLayout,
        empty_layout: emptyLayout,
        desktop_status_toolbar: desktopStatusToolbar
      };
    })()`);
    const measureStatusToolbarAtCurrentWidth = () => window.webContents.executeJavaScript(`(() => {
      const toolbar = document.querySelector('.work-state-filter-card');
      const filters = document.querySelector('.work-state-filters');
      const summary = document.querySelector('#workStateSummary');
      const originalText = summary.textContent;
      const variants = [
        'Arc研发平台 · 命中 0 / 补全树 0 · 待评审 0 项',
        'Arc研发平台 · 命中 128 / 补全树 356 · 已完成 128 项 · 后台刷新',
        '一个名称明显更长的本地产品工作区用于验证摘要文本截断'.repeat(4) + ' · 命中 9999 / 补全树 12000 · 已阻塞 888 项 · 刷新失败，保留匹配缓存'
      ].map((text) => {
        summary.textContent = text;
        const toolbarRect = toolbar.getBoundingClientRect();
        const filtersRect = filters.getBoundingClientRect();
        const summaryRect = summary.getBoundingClientRect();
        const summaryStyle = getComputedStyle(summary);
        return {
          toolbar_width: Number(toolbarRect.width.toFixed(2)),
          toolbar_height: Number(toolbarRect.height.toFixed(2)),
          filters_width: Number(filtersRect.width.toFixed(2)),
          filters_overflow: filters.scrollWidth > filters.clientWidth,
          buttons_within_filters: [...filters.querySelectorAll('button')].every((button) => {
            const buttonRect = button.getBoundingClientRect();
            return buttonRect.left >= filtersRect.left - 0.5 && buttonRect.right <= filtersRect.right + 0.5;
          }),
          summary_width: Number(summaryRect.width.toFixed(2)),
          summary_overflow: summaryStyle.overflow,
          summary_text_overflow: summaryStyle.textOverflow,
          summary_white_space: summaryStyle.whiteSpace,
          summary_clipped: summary.scrollWidth > summary.clientWidth
        };
      });
      summary.textContent = originalText;
      return variants;
    })()`);
    result.intermediate_status_toolbars = [];
    for (const width of [1280, 1181]) {
      window.setSize(width, 900);
      await new Promise((resolveWait) => setTimeout(resolveWait, 50));
      result.intermediate_status_toolbars.push({ width, variants: await measureStatusToolbarAtCurrentWidth() });
    }
    window.setSize(1100, 900);
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    result.responsive_status_toolbar = await measureStatusToolbarAtCurrentWidth();
    await new Promise((resolveWrite) => process.stdout.write(`${JSON.stringify(result)}\n`, resolveWrite));
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  await new Promise((resolveWrite) => process.stderr.write(`${error.stack || error.message}\n`, resolveWrite));
  app.exit(1);
});
