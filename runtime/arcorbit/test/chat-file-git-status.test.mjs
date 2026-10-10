import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFileGitPath, projectFileGitStatus } from '../desktop/renderer/chat-file-git-status.mjs';

test('file Git projection preserves index/worktree meaning and aggregates all ancestors', () => {
  const projection = projectFileGitStatus({ kind: 'repository', conflicted: ['conflict.txt'], files: [
    { path: 'src/both.js', index: 'M', working_dir: 'M' },
    { path: 'src/both.js', index: 'M', working_dir: 'M' },
    { path: 'src/new.js', index: '?', working_dir: '?' },
    { path: 'conflict.txt', index: 'U', working_dir: 'U' },
    { path: 'new/place.js', from: 'old/place.js', index: 'R', working_dir: ' ' },
    { path: 'removed/deleted.js', index: ' ', working_dir: 'D' }
  ] });

  assert.equal(projection.files.get('src/both.js').label, 'M M');
  assert.match(projection.files.get('src/both.js').meaning, /已暂存修改；未暂存修改/);
  assert.equal(projection.files.get('src/new.js').label, '?');
  assert.equal(projection.files.get('conflict.txt').label, '!');
  assert.equal(projection.files.get('new/place.js').label, 'R');
  assert.equal(projection.files.get('removed/deleted.js').label, 'D');

  assert.deepEqual(projection.directories.get('src'), { category: 'tracked', label: 'M', count: 2, meaning: 'Git：已跟踪变更 1，未跟踪 1；共 2 个后代路径' });
  assert.deepEqual(projection.directories.get('new'), { category: 'tracked', label: 'M', count: 1, meaning: 'Git：已跟踪变更 1；共 1 个后代路径' });
  assert.deepEqual(projection.directories.get('old'), projection.directories.get('new'), 'both rename ancestors represent one changed path');
  assert.equal(projection.directories.get('removed').label, 'M', 'a deleted file still marks its existing ancestor without a ghost row');
  assert.deepEqual(projection.directories.get(''), { category: 'conflict', label: '!', count: 5, meaning: 'Git：冲突 1，已跟踪变更 3，未跟踪 1；共 5 个后代路径' });
});

test('file Git projection distinguishes clean, non-repository and untrusted paths', () => {
  const clean = projectFileGitStatus({ kind: 'repository', files: [], conflicted: [] });
  assert.equal(clean.files.size, 0); assert.equal(clean.directories.size, 0);
  assert.equal(projectFileGitStatus({ kind: 'not_repository' }).kind, 'not_repository');
  assert.equal(normalizeFileGitPath('src\\app.js'), 'src/app.js');
  for (const path of ['', '../outside', '/absolute', 'C:\\absolute', 'a//b', 'a/./b']) {
    assert.throws(() => normalizeFileGitPath(path), /Git 状态/);
  }
  assert.throws(() => projectFileGitStatus({ kind: 'repository', files: [{ path: '../outside', index: 'M', working_dir: ' ' }] }), /Git 状态/);
});
