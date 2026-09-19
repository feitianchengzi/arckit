import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRunOptions } from '../src/cli.mjs';
import { resolveCodexExecutionPolicy } from '../src/codex-execution-policy.mjs';

test('Runtime CLI accepts explicit YOLO switches independently of approval policy', () => {
  const on = parseRunOptions(['--yolo', '--approval-policy', 'on-request']);
  assert.equal(resolveCodexExecutionPolicy(on, '/project').approvalPolicy, 'never');
  const off = parseRunOptions(['--no-yolo', '--approval-policy', 'never']);
  assert.equal(resolveCodexExecutionPolicy(off, '/project').approvalPolicy, 'on-request');
  assert.equal(parseRunOptions(['--yolo', '--no-yolo']).yoloMode, false);
  assert.equal(resolveCodexExecutionPolicy({ yoloMode: false, sandboxPolicy: { type: 'dangerFullAccess' } }, '/project').sandboxPolicy.type, 'workspaceWrite');
  const legacy = { approvalPolicy: 'never', sandboxPolicy: { type: 'readOnly', networkAccess: false } };
  assert.deepEqual(resolveCodexExecutionPolicy(legacy, '/project'), legacy);
  assert.throws(() => resolveCodexExecutionPolicy({ yoloMode: 'true' }, '/project'), /boolean/);
});
