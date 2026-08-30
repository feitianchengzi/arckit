import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const RECEIPT_SCHEMA = "arcorbit-codex-owner-receipts/v1";

export function createCodexOwnerReceiptStore(filePath) {
  const target = path.resolve(String(filePath || ""));
  if (!target) throw new TypeError("Codex owner receipt path is required.");

  async function read() {
    try {
      const payload = JSON.parse(await readFile(target, "utf8"));
      if (payload?.schema_version !== RECEIPT_SCHEMA || !Array.isArray(payload.receipts)) return [];
      return payload.receipts.map(normalizeReceipt).filter(Boolean);
    } catch (error) {
      if (error?.code === "ENOENT" || error instanceof SyntaxError) return [];
      throw error;
    }
  }

  async function record(input = {}) {
    const receipt = normalizeReceipt({ ...input, recorded_at: new Date().toISOString() });
    if (!receipt) throw new TypeError("A valid standalone Codex receipt is required.");
    const receipts = (await read()).filter((item) => item.command !== receipt.command);
    receipts.push(receipt);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ schema_version: RECEIPT_SCHEMA, receipts }, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, target);
    return receipt;
  }

  return { read, record };
}

function normalizeReceipt(input) {
  const command = String(input?.command || "").trim();
  const id = String(input?.id || "").trim();
  if (!command || !id || !path.isAbsolute(command)) return null;
  return {
    id,
    command,
    version: String(input.version || ""),
    recorded_at: String(input.recorded_at || "")
  };
}

export const CODEX_OWNER_RECEIPT_SCHEMA = RECEIPT_SCHEMA;
