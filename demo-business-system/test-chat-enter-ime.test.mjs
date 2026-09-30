import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnterGate } from './chat-input-enter.mjs';

// 规格：输入法合成期（含英文候选确认）的第一次 Enter 只确认上屏，不得发送。

test('合成中 Enter 不发送', () => {
  const gate = createEnterGate();
  gate.compositionStart();
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: true, keyCode: 13 }), false);
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 229 }), false);
});

test('合成刚结束（Safari 先 compositionend 再 keydown）的 Enter 不发送', async () => {
  const gate = createEnterGate();
  gate.compositionStart();
  gate.compositionEnd();
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }), false);
  await new Promise((r) => setTimeout(r, 1));
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }), true);
});

test('未合成时 Enter 发送；Shift+Enter 不发送', () => {
  const gate = createEnterGate();
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }), true);
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: true, isComposing: false, keyCode: 13 }), false);
});

test('keyCode 229（部分浏览器 IME）不发送', () => {
  const gate = createEnterGate();
  assert.equal(gate.shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 229 }), false);
});
