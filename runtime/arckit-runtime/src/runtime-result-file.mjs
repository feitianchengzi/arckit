import { readFile } from "node:fs/promises";

export async function loadRuntimeResultFile(file) {
  const parsed = JSON.parse(await readFile(file, "utf8"));
  return {
    envelope: parsed,
    runtimeResult: parsed?.runtime_result || parsed
  };
}
