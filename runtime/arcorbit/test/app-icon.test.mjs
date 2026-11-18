import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const runtimeRoot = fileURLToPath(new URL("..", import.meta.url));
const rendererPath = path.join(runtimeRoot, "desktop", "renderer", "index.html");
const iconSvgPath = path.join(runtimeRoot, "build", "icon.svg");
const iconPngPath = path.join(runtimeRoot, "build", "icon.png");
const orbitGeometry = [
  'd="M25.5 8.5a12 12 0 1 0 3.8 14.8"',
  'cx="18" cy="18" rx="17" ry="6.5" transform="rotate(-35 18 18)"',
  'cx="18" cy="18" r="3"',
  'cx="27" cy="10" r="2.5"'
];

test("packaged app icon uses the main-page ArcOrbit mark at desktop resolution", async () => {
  const [renderer, iconSvg, iconPng] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(iconSvgPath, "utf8"),
    readFile(iconPngPath)
  ]);

  for (const geometry of orbitGeometry) {
    assert.equal(renderer.includes(geometry), true, `renderer is missing ${geometry}`);
    assert.equal(iconSvg.includes(geometry), true, `app icon is missing ${geometry}`);
  }

  assert.equal(iconSvg.includes('stroke="#F4B77D"'), true);
  assert.deepEqual([...iconPng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(iconPng.readUInt32BE(16), 1024);
  assert.equal(iconPng.readUInt32BE(20), 1024);
});
