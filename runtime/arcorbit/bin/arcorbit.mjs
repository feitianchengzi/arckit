#!/usr/bin/env node

const { main } = await import("../src/cli.mjs");

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
}

await Promise.all([
  closeOutput(process.stdout),
  closeOutput(process.stderr)
]);
process.exit(process.exitCode || 0);

function closeOutput(stream) {
  if (!stream?.writable || stream.writableEnded || stream.destroyed) return Promise.resolve();
  return new Promise((resolve) => {
    stream.once("error", resolve);
    stream.end(resolve);
  });
}
