export function sanitizeRuntimeProcessEnvironment(env = process.env) {
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

export function runtimeNodeChildEnvironment(versions = process.versions) {
  return versions?.electron ? { ELECTRON_RUN_AS_NODE: "1" } : {};
}
