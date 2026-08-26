import { app, BrowserWindow } from "electron";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-work-navigation-${process.pid}`);
const resultPath = process.env.ARCORBIT_ELECTRON_RESULT_FILE;
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
  const errors = [];
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const click = (selector) => document.querySelector(selector).click();
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      const geometry = (kind) => {
        const work = kind === 'work';
        const page = document.querySelector(work ? '#workView > .platform-page' : '#feedbackView > .platform-page');
        const rail = page.querySelector('.primary-control-rail');
        const layout = page.querySelector(work ? '.platform-work-layout' : '.feedback-workbench-layout');
        const list = page.querySelector(work ? '#platformWorkTable' : '#ordinaryFeedbackTable');
        const detail = page.querySelector(work ? '#platformWorkInspector' : '.feedback-inspector-scroll');
        const pageRect = page.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        const layoutRect = layout.getBoundingClientRect();
        const firstHeader = layout.querySelector('.section-title-row').getBoundingClientRect();
        return {
          direct_children: page.children.length,
          rail_height: Number(railRect.height.toFixed(2)),
          rail_single_line: rail.scrollWidth <= rail.clientWidth && railRect.height <= 44.5,
          rail_before_layout: railRect.bottom <= layoutRect.top,
          layout_within_page: layoutRect.bottom <= pageRect.bottom && layoutRect.top >= pageRect.top,
          layout_height: Number(layoutRect.height.toFixed(2)),
          item_count: list.children.length,
          list_scrolls: list.scrollHeight > list.clientHeight,
          detail_scrolls: detail.scrollHeight > detail.clientHeight,
          list_overflow_y: getComputedStyle(list).overflowY,
          detail_overflow_y: getComputedStyle(detail).overflowY,
          header_visible: firstHeader.top >= layoutRect.top && firstHeader.bottom <= layoutRect.bottom
        };
      };
      await window.arckitDesktop.setTestPlatformSnapshotDelay(240);
      const startedAt = performance.now();
      click('[data-page="work"]');
      const immediateActive = document.querySelector('#workView').classList.contains('is-active');
      const clickDurationMs = Number((performance.now() - startedAt).toFixed(2));
      const loadingLayout = geometry('work');
      await wait(300);
      const workQueryCall = (await window.arckitDesktop.getTestCalls()).filter(([command]) => command === 'platformWorkQuery').at(-1)?.[1] || {};
      await window.arckitDesktop.setTestPlatformSnapshotDelay(0);
      click('[data-page="today"]');
      await window.arckitDesktop.failNextTestPlatformSnapshot('Controlled Work refresh failure');
      click('[data-page="work"]');
      const failureImmediateActive = document.querySelector('#workView').classList.contains('is-active');
      await wait(50);
      const errorLayout = geometry('work');
      const cachedRowsAfterFailure = document.querySelectorAll('#platformWorkTable tbody tr').length;
      const failureToastVisible = document.querySelector('#toast').textContent.includes('Controlled Work refresh failure');
      const longContent = Array.from({ length: 90 }, (_, index) => 'Detail paragraph ' + index).join('\\n\\n');
      const manyTasks = Array.from({ length: 80 }, (_, index) => ({
        id: 'LAYOUT-' + index,
        project_id: '11', project_name: 'ArcOrbit', title: 'Layout task ' + index,
        content: index === 0 ? longContent : 'Verify list owns remaining height',
        state: 'pending', terminal: false, priority: 100 - index, raw: { priority: 1 },
        executor_id: '7', assignee: { id: '7', username: 'Glare' }, tags: ''
      }));
      await window.arckitDesktop.setTestPlatformTasks(manyTasks);
      click('[data-page="today"]');
      click('[data-page="work"]');
      await wait(60);
      const populatedLayout = geometry('work');
      const desktopWorkRail = {
        state_buttons_visible: getComputedStyle(document.querySelector('#workStateFilters')).display !== 'none',
        compact_state_hidden: getComputedStyle(document.querySelector('.work-state-compact')).display === 'none'
      };
      await window.arckitDesktop.setTestPlatformTasks([]);
      click('[data-page="today"]');
      click('[data-page="work"]');
      await wait(60);
      const emptyLayout = geometry('work');
      await window.arckitDesktop.setTestPlatformTasks(manyTasks);
      click('[data-page="today"]');
      click('[data-page="work"]');
      await wait(60);
      click('[data-page="feedback"]');
      await wait(40);
      const renderedFeedbackList = document.querySelector('#ordinaryFeedbackTable');
      const feedbackTemplate = renderedFeedbackList.querySelector('.feedback-list-item');
      for (let index = renderedFeedbackList.children.length; index < 70; index += 1) {
        const row = feedbackTemplate.cloneNode(true);
        row.dataset.feedbackSelect = 'GEOMETRY-' + index;
        row.classList.remove('is-active');
        row.querySelector('strong').textContent = 'Feedback geometry row ' + index;
        renderedFeedbackList.append(row);
      }
      const renderedFeedbackDetail = document.querySelector('.feedback-inspector-scroll');
      const detailProbe = document.createElement('div');
      detailProbe.textContent = longContent;
      detailProbe.style.whiteSpace = 'pre-line';
      renderedFeedbackDetail.append(detailProbe);
      const feedbackLayout = geometry('feedback');
      const feedbackList = document.querySelector('#ordinaryFeedbackTable');
      const feedbackDetail = document.querySelector('.feedback-inspector-scroll');
      feedbackList.scrollTop = 120;
      feedbackDetail.scrollTop = 90;
      return {
        immediate_active: immediateActive,
        click_duration_ms: clickDurationMs,
        work_query_state: workQueryCall.state,
        work_query_has_complete_key: typeof workQueryCall.query_key === 'string' && workQueryCall.query_key.includes('creator_ids') && workQueryCall.query_key.includes('start_time'),
        failure_immediate_active: failureImmediateActive,
        cached_rows_after_failure: cachedRowsAfterFailure,
        failure_toast_visible: failureToastVisible,
        loading_layout: loadingLayout,
        error_layout: errorLayout,
        populated_layout: populatedLayout,
        empty_layout: emptyLayout,
        desktop_work_rail: desktopWorkRail,
        feedback_layout: feedbackLayout,
        feedback_context: { selected: document.querySelector('.feedback-list-item.is-active')?.dataset.feedbackSelect || '', list_scroll: feedbackList.scrollTop, detail_scroll: feedbackDetail.scrollTop }
      };
    })()`);
    window.setSize(1180, 900);
    await new Promise((resolveWait) => setTimeout(resolveWait, 80));
    result.compact_feedback = await window.webContents.executeJavaScript(`(() => {
      const page = document.querySelector('#feedbackView > .platform-page');
      const rail = page.querySelector('.feedback-toolbar');
      const layout = page.querySelector('.feedback-workbench-layout');
      const list = document.querySelector('#ordinaryFeedbackTable');
      const detail = document.querySelector('.feedback-inspector-scroll');
      return {
        rail_single_line: rail.scrollWidth <= rail.clientWidth && rail.getBoundingClientRect().height <= 44.5,
        more_visible: getComputedStyle(document.querySelector('.feedback-more-menu > summary')).display !== 'none',
        layout_within_page: layout.getBoundingClientRect().bottom <= page.getBoundingClientRect().bottom,
        selected: document.querySelector('.feedback-list-item.is-active')?.dataset.feedbackSelect || '',
        list_scroll: list.scrollTop,
        detail_scroll: detail.scrollTop
      };
    })()`);
    result.compact_work = await window.webContents.executeJavaScript(`(async () => {
      document.querySelector('[data-page="work"]').click();
      await new Promise((resolve) => setTimeout(resolve, 80));
      const rail = document.querySelector('.work-control-rail');
      const list = document.querySelector('#platformWorkTable');
      const detail = document.querySelector('#platformWorkInspector');
      const filterMenu = document.querySelector('[data-work-filter-menu]');
      filterMenu.open = true;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const filterPopover = filterMenu.querySelector('.work-filter-popover');
      const filterRect = filterPopover.getBoundingClientRect();
      list.scrollTop = 120;
      detail.scrollTop = 90;
      const result = {
        rail_single_line: rail.scrollWidth <= rail.clientWidth && rail.getBoundingClientRect().height <= 44.5,
        state_buttons_hidden: getComputedStyle(document.querySelector('#workStateFilters')).display === 'none',
        compact_state_visible: getComputedStyle(document.querySelector('.work-state-compact')).display !== 'none',
        filter_popover: {
          left: Number(filterRect.left.toFixed(2)),
          right: Number(filterRect.right.toFixed(2)),
          top: Number(filterRect.top.toFixed(2)),
          bottom: Number(filterRect.bottom.toFixed(2)),
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          columns: getComputedStyle(filterPopover).gridTemplateColumns.split(' ').length
        },
        selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '',
        list_scroll: list.scrollTop,
        detail_scroll: detail.scrollTop
      };
      filterMenu.open = false;
      return result;
    })()`);
    window.setSize(1040, 720);
    await new Promise((resolveWait) => setTimeout(resolveWait, 80));
    result.minimum_work = await window.webContents.executeJavaScript(`(async () => {
      const page = document.querySelector('#workView > .platform-page');
      const rail = page.querySelector('.work-control-rail');
      const layout = page.querySelector('.platform-work-layout');
      const list = document.querySelector('#platformWorkTable');
      const detail = document.querySelector('#platformWorkInspector');
      const filterMenu = document.querySelector('[data-work-filter-menu]');
      filterMenu.open = true;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const filterPopover = filterMenu.querySelector('.work-filter-popover');
      const filterRect = filterPopover.getBoundingClientRect();
      const result = {
        rail_single_line: rail.scrollWidth <= rail.clientWidth && rail.getBoundingClientRect().height <= 44.5,
        layout_height: Number(layout.getBoundingClientRect().height.toFixed(2)),
        layout_within_page: layout.getBoundingClientRect().bottom <= page.getBoundingClientRect().bottom,
        filter_popover: {
          left: Number(filterRect.left.toFixed(2)),
          right: Number(filterRect.right.toFixed(2)),
          top: Number(filterRect.top.toFixed(2)),
          bottom: Number(filterRect.bottom.toFixed(2)),
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          columns: getComputedStyle(filterPopover).gridTemplateColumns.split(' ').length
        },
        selected: document.querySelector('#platformWorkTable tr.selected')?.dataset.platformTaskSelect || '',
        list_scroll: list.scrollTop,
        detail_scroll: detail.scrollTop
      };
      filterMenu.open = false;
      return result;
    })()`);
    if (resultPath) await writeFile(resultPath, JSON.stringify(result), "utf8");
    else process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    const result = { fixture_error: error?.stack || error?.message || String(error), errors };
    if (resultPath) await writeFile(resultPath, JSON.stringify(result), "utf8");
    else process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  if (resultPath) await writeFile(resultPath, JSON.stringify({ fixture_error: error.stack || error.message }), "utf8");
  await new Promise((resolveWrite) => process.stderr.write(`${error.stack || error.message}\n`, resolveWrite));
  app.exit(1);
});
