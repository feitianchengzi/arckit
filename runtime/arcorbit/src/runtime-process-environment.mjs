export function sanitizeRuntimeProcessEnvironment(env = process.env) {
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}
