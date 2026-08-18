#!/usr/bin/env node

const { main } = await import("../src/cli.mjs");

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
}

await Promise.all([
  new Promise((resolve) => process.stdout.write("", resolve)),
  new Promise((resolve) => process.stderr.write("", resolve))
]);
process.exit(process.exitCode || 0);
