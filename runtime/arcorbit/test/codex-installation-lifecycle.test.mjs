import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCodexSetupNetworkEnv,
  compareCodexVersions,
  createCodexInstallAdvice,
  createCodexUpdateChecker,
  ownerUpdateSpec,
  parseCodexVersion,
  resolveCodexInstallationOwners
} from "../src/codex-installation-lifecycle.mjs";

test("Codex semantic versions normalize release tags and compare prereleases", () => {
  assert.equal(parseCodexVersion("codex-cli rust-v1.24.3")?.value, "1.24.3");
  assert.equal(parseCodexVersion("codex-cli 1.25.0-beta.2")?.value, "1.25.0-beta.2");
  assert.equal(compareCodexVersions("1.25.0", "1.24.9"), 1);
  assert.equal(compareCodexVersions("1.25.0-beta.2", "1.25.0"), -1);
  assert.equal(compareCodexVersions("not-a-version", "1.0.0"), null);
});

test("Codex setup network context normalizes proxy keys without removing NO_PROXY", () => {
  const env = buildCodexSetupNetworkEnv({ PATH: "/usr/bin", NO_PROXY: "localhost" }, { enabled: true, url: "http://proxy.example:7890" });
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) {
    assert.equal(env[key], "http://proxy.example:7890");
  }
  assert.equal(env.NO_PROXY, "localhost");
  assert.equal(env.no_proxy, "localhost");
});

test("install advisor keeps a healthy owner and otherwise recommends standalone", () => {
  assert.deepEqual(createCodexInstallAdvice({
    platform: "linux",
    installations: [{ available: true, state: "ready", active: true, owner: "npm", execution_scope: "native:linux" }]
  }), [{
    method: "npm",
    suitability: "recommended",
    execution_scope: "native:linux",
    reason: "继续使用当前健康 installation 的同一 owner。",
    blockers: []
  }]);

  const missing = createCodexInstallAdvice({ platform: "darwin", capabilities: { npm: { available: true }, homebrew: { available: false, blockers: ["homebrew-unavailable"] } } });
  assert.equal(missing.find((item) => item.method === "standalone")?.suitability, "recommended");
  assert.equal(missing.find((item) => item.method === "npm")?.suitability, "available");
  assert.equal(missing.find((item) => item.method === "homebrew")?.suitability, "blocked");
});

test("npm ownership is proven only by exact prefix and package metadata", async () => {
  const calls = [];
  const [installation] = await resolveCodexInstallationOwners({
    platform: "linux",
    env: { PATH: "/fixture/node/bin" },
    installations: [{
      id: "npm-installation",
      command: "/fixture/node/bin/codex",
      owner: "unknown-external",
      owner_confidence: "inferred",
      available: true,
      state: "ready"
    }],
    processRunner: async (spec) => {
      calls.push(spec);
      if (spec.args.join(" ") === "prefix --global") return { exitCode: 0, stdout: "/fixture/node", stderr: "" };
      return { exitCode: 0, stdout: JSON.stringify({ dependencies: { "@openai/codex": { version: "1.2.3" } } }), stderr: "" };
    }
  });

  assert.equal(installation.owner_confidence, "proven");
  assert.equal(installation.owner_identity, "npm:/fixture/node");
  assert.equal(installation.owner_executable, "/fixture/node/bin/npm");
  assert.deepEqual(calls.map((call) => call.args), [
    ["prefix", "--global"],
    ["ls", "--global", "@openai/codex", "--depth=0", "--json"]
  ]);
});

test("owner-aware update checks cache success and force refresh through exact npm", async () => {
  let calls = 0;
  const checker = createCodexUpdateChecker({
    now: () => 1_000,
    processRunner: async (spec) => {
      calls += 1;
      assert.equal(spec.command, "/fixture/node/bin/npm");
      assert.deepEqual(spec.args, ["view", "@openai/codex", "dist-tags.latest", "--json"]);
      assert.equal(spec.env.HTTPS_PROXY, "http://proxy.example:7890");
      return { exitCode: 0, stdout: '"1.3.0"', stderr: "" };
    }
  });
  const installation = {
    id: "npm-installation",
    available: true,
    owner: "npm",
    owner_confidence: "proven",
    owner_identity: "npm:/fixture/node",
    owner_executable: "/fixture/node/bin/npm",
    version: "1.2.3",
    platform: "linux"
  };
  const env = { HTTPS_PROXY: "http://proxy.example:7890" };
  assert.equal((await checker(installation, { env })).state, "update-available");
  assert.equal((await checker(installation, { env })).latest_version, "1.3.0");
  assert.equal(calls, 1);
  await checker(installation, { env, force: true });
  assert.equal(calls, 2);
});

test("update check failures remain advisory and owner mutations use fixed argv", async () => {
  const checker = createCodexUpdateChecker({
    processRunner: async () => { throw Object.assign(new Error("proxy unavailable"), { code: "ECONNREFUSED" }); }
  });
  const installation = {
    id: "npm-installation",
    available: true,
    owner: "npm",
    owner_confidence: "proven",
    owner_identity: "npm:/fixture/node",
    owner_executable: "/fixture/node/bin/npm",
    version: "1.2.3",
    platform: "linux"
  };
  const update = await checker(installation);
  assert.equal(update.state, "check-failed");
  assert.equal(update.installed_version, "1.2.3");
  assert.equal(update.error.code, "UPDATE_NETWORK_FAILED");
  assert.deepEqual(ownerUpdateSpec(installation, { platform: "linux", env: { SAFE: "1" } }), {
    command: "/fixture/node/bin/npm",
    args: ["install", "--global", "@openai/codex@latest"],
    env: { SAFE: "1" },
    windowsHide: false
  });
});
