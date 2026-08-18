import { EventEmitter } from "node:events";

const CONTROL_SCHEMA = "arcorbit-runtime-control/v1";
const ELECTRON_BOOTSTRAP_ENV = "ELECTRON_RUN_AS_NODE";

export function createElectronUtilityRuntimeHost(utilityProcess) {
  if (typeof utilityProcess?.fork !== "function") {
    throw new Error("Electron utilityProcess.fork is required.");
  }
  return {
    controlMode: "parent-port",
    spawn(modulePath, args, options = {}) {
      const child = utilityProcess.fork(modulePath, args, {
        cwd: options.cwd,
        env: utilityProcessEnvironment(options.env),
        stdio: "pipe",
        serviceName: "ArcOrbit Runtime"
      });
      return adaptUtilityProcess(child);
    },
    sendControl(child, control) {
      child.postMessage({ schema_version: CONTROL_SCHEMA, ...control });
    },
    terminate(child) {
      child.kill();
    }
  };
}

export function utilityProcessEnvironment(source = process.env) {
  const env = { ...source };
  delete env[ELECTRON_BOOTSTRAP_ENV];
  return env;
}

function adaptUtilityProcess(child) {
  const adapted = new EventEmitter();
  adapted.pid = child.pid;
  adapted.stdout = child.stdout;
  adapted.stderr = child.stderr;
  adapted.exitCode = null;
  adapted.signalCode = null;
  adapted.postMessage = (message, transfer) => child.postMessage(message, transfer);
  adapted.kill = () => child.kill();
  child.on("error", (error) => adapted.emit("error", error));
  child.on("exit", (code) => {
    adapted.exitCode = code;
    adapted.emit("close", code);
  });
  return adapted;
}
