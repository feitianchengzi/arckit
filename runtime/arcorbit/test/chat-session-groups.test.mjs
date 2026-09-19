import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAT_SESSION_PREVIEW_LIMIT, chatSessionVisibility, groupChatSessions } from '../desktop/renderer/chat-session-groups.mjs';
const sessions = Array.from({ length: 12 }, (_, i) => ({ id: `S${String(i).padStart(2, '0')}`, project_id: 'A', created_at: `2026-09-${String(i + 1).padStart(2, '0')}`, updated_at: '' }));
test('Activity, renamed projects and shuffled snapshots do not reorder projects or sessions', () => {
  const input = [...sessions, { id:'B1', project_id:'B', created_at:'2026-09-01' }];
  const order = items => items.map(g => [g.project_id, g.sessions.map(s => s.id)]);
  const before = groupChatSessions({ sessions:input, projects:[{id:'A',name:'Z'},{id:'B',name:'A'}] });
  const after = groupChatSessions({ sessions:input.toReversed().map(s => ({...s, updated_at:Math.random().toString(), status:'running'})), projects:[{id:'B',name:'Z'},{id:'A',name:'A'}] });
  assert.deepEqual(order(before), order(after));
  assert.deepEqual(before[0].sessions, sessions.toReversed());
  assert.equal(groupChatSessions({sessions:[{id:'orphan',project_id:'missing'}]})[0].available,false);
});
test('Projects show five at a time; active selection never overrides collapse or limit', () => {
  const group={sessions};
  assert.equal(CHAT_SESSION_PREVIEW_LIMIT,5);
  for (const [limit,count,hidden] of [[5,5,7],[10,10,2],[15,12,0]]) {
    const result=chatSessionVisibility(group,{limit,selectedSessionId:'S11'});
    assert.equal(result.sessions.length,count);assert.equal(result.hidden_count,hidden);
  }
  assert.deepEqual(chatSessionVisibility(group,{collapsed:true,selectedSessionId:'S01'}).sessions,[]);
  assert.equal(chatSessionVisibility(group).sessions.length,5);
});

test('New sessions lead by their own creation time, including task-linked sessions', () => {
  const items = [
    { id: 'old', project_id: 'A', created_at: '2026-09-01', updated_at: '2026-09-30', task_id: 'task-new' },
    { id: 'new', project_id: 'A', created_at: '2026-09-19', updated_at: '2026-09-19' },
    { id: 'linked', project_id: 'A', created_at: '2026-09-10', task_id: 'task-old' },
  ];
  const grouped = groupChatSessions({ sessions: items });
  assert.deepEqual(grouped[0].sessions.map(s => s.id), ['new', 'linked', 'old']);
  assert.deepEqual(groupChatSessions({ sessions: [...items, { id: 'latest', project_id: 'A', created_at: '2026-09-20' }] })[0].sessions.map(s => s.id), ['latest', 'new', 'linked', 'old']);
});

test('Empty projects remain visible without synthetic sessions', () => {
  const projects = [{ id: 'A', name: 'Empty project' }, { id: 'B', name: 'Chat project' }];
  const groups = groupChatSessions({ projects, sessions: [{ id: 'S', project_id: 'B' }] });
  assert.deepEqual(groups[0], { project_id: 'A', project_name: 'Empty project', available: true, sessions: [] });
  assert.deepEqual(chatSessionVisibility(groups[0]).sessions, []);
  assert.equal(groups[1].sessions.length, 1);
});
