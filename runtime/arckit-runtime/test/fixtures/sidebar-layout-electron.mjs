import { app, BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv.find((argument) => argument.startsWith("--output="))?.slice("--output=".length);

await app.whenReady();

const window = new BrowserWindow({
  show: false,
  width: 500,
  height: 500,
  webPreferences: {
    sandbox: true
  }
});

try {
  await window.loadFile(join(fixtureDir, "sidebar-layout.html"));
  const measurements = await window.webContents.executeJavaScript(`
    (async () => {
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const scenarios = [1, 2, 4];

      function projectMarkup(index) {
        return '<div class="project-item"><div class="project-name">Project ' + index + ' with a deliberately long name</div><div class="project-path">/a/deliberately/long/project/path/' + index + '</div></div>';
      }

      function sessionMarkup(index) {
        return '<div class="session-item"><div class="session-title">Chat ' + index + ' with a deliberately long title</div></div>';
      }

      async function measure(selector, itemSelector, markup, count) {
        const list = document.querySelector(selector);
        list.innerHTML = Array.from({ length: count }, (_, index) => markup(index)).join('');
        await nextFrame();
        await nextFrame();
        const items = Array.from(list.querySelectorAll(itemSelector));
        const itemStyle = getComputedStyle(items[0]);
        const contents = Array.from(items[0].children).map((content) => {
          const contentStyle = getComputedStyle(content);
          return {
            height: content.getBoundingClientRect().height,
            overflow: contentStyle.overflow,
            textOverflow: contentStyle.textOverflow,
            whiteSpace: contentStyle.whiteSpace,
            isClipped: content.scrollWidth > content.clientWidth
          };
        });
        return {
          count,
          itemHeights: items.map((item) => item.getBoundingClientRect().height),
          itemOverflow: itemStyle.overflow,
          contents,
          clientHeight: list.clientHeight,
          scrollHeight: list.scrollHeight
        };
      }

      const project = [];
      const session = [];
      for (const count of scenarios) {
        project.push(await measure('#projectList', '.project-item', projectMarkup, count));
        session.push(await measure('#sessionList', '.session-item', sessionMarkup, count));
      }
      return { project, session };
    })()
  `);
  const output = `${JSON.stringify(measurements)}\n`;
  if (outputPath) {
    await writeFile(outputPath, output, "utf8");
  }
  process.stdout.write(output);
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
} finally {
  window.destroy();
  app.quit();
}
