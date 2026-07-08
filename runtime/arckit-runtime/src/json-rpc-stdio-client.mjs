import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export class JsonRpcStdioClient {
  constructor({ command, args = [], cwd = process.cwd(), stderr = "inherit" }) {
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.nextId = 1;
    this.pending = new Map();
    this.notifications = [];
    this.requestHandlers = [];
    this.closeHandlers = [];
    this.closed = false;
    this.proc = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", stderr]
    });
    this.readline = createInterface({ input: this.proc.stdout });
    this.readline.on("line", (line) => this.#handleLine(line));
    this.proc.on("exit", (code, signal) => {
      this.closed = true;
      const error = new Error(`JSON-RPC process exited: code=${code} signal=${signal || ""}`);
      for (const { reject } of this.pending.values()) {
        reject(error);
      }
      this.pending.clear();
      for (const handler of this.closeHandlers) {
        handler({ code, signal, error });
      }
    });
    this.proc.on("error", (error) => {
      this.closed = true;
      for (const pending of this.pending.values()) {
        pending.reject(error);
      }
      this.pending.clear();
      for (const handler of this.closeHandlers) {
        handler({ code: null, signal: null, error });
      }
    });
  }

  request(method, params = {}) {
    if (this.closed) {
      return Promise.reject(new Error("JSON-RPC process is closed."));
    }
    const id = this.nextId++;
    const message = { method, id, params };
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.#send(message);
    return promise;
  }

  notify(method, params = {}) {
    if (this.closed) {
      throw new Error("JSON-RPC process is closed.");
    }
    this.#send({ method, params });
  }

  onNotification(handler) {
    this.notifications.push(handler);
  }

  onRequest(handler) {
    this.requestHandlers.push(handler);
  }

  onClose(handler) {
    this.closeHandlers.push(handler);
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.readline.close();
    this.proc.stdin.end();
    this.proc.kill("SIGTERM");
  }

  #send(message) {
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      for (const handler of this.notifications) {
        handler({ method: "runtime/protocolParseError", params: { line, error: String(error) } });
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id") && message.method) {
      this.#handleRequest(message);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id")) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        const error = new Error(message.error.message || "JSON-RPC request failed.");
        error.code = message.error.code;
        error.data = message.error.data;
        pending.reject(error);
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.method) {
      for (const handler of this.notifications) {
        handler(message);
      }
    }
  }

  async #handleRequest(message) {
    for (const handler of this.requestHandlers) {
      try {
        const result = await handler(message);
        if (result !== undefined) {
          this.#send({ id: message.id, result });
          return;
        }
      } catch (error) {
        this.#send({
          id: message.id,
          error: {
            code: -32000,
            message: String(error)
          }
        });
        return;
      }
    }
    this.#send({
      id: message.id,
      error: {
        code: -32601,
        message: `Unhandled server request: ${message.method}`
      }
    });
  }
}
