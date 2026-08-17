import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function localTarInvocation(archive, argsBeforeArchive, argsAfterArchive = [], pathApi = path) {
  const archivePath = pathApi.resolve(archive);
  return {
    command: "tar",
    args: [...argsBeforeArchive, pathApi.basename(archivePath), ...argsAfterArchive],
    options: { cwd: pathApi.dirname(archivePath) }
  };
}

export async function execLocalTar(archive, argsBeforeArchive, argsAfterArchive = [], execute = execFileAsync) {
  const invocation = localTarInvocation(archive, argsBeforeArchive, argsAfterArchive);
  return execute(invocation.command, invocation.args, invocation.options);
}
