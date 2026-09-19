import assert from "node:assert/strict";
import test from "node:test";
import { createChatStateCoordinator } from "../desktop/renderer/chat-state-coordinator.mjs";

test("Chat state keeps Composer configuration with a new draft, workspace changes and send", async () => {
  const creates = [];
  const sends = [];
  let request = 0;
  const snapshotFor = (payload = {}) => ({
    projects: [{ id: "P-1", name: "One" }, { id: "P-2", name: "Two" }],
    sessions: [],
    selected_session_id: "",
    messages: [],
    pending_approvals: [],
    draft: {
      project_id: payload.project_id || "P-1",
      text: payload.text || "",
      model: payload.model || "gpt-6-astra",
      reasoning_effort: payload.reasoning_effort || "high"
    }
  });
  const api = {
    async createChat(payload) { creates.push(payload); return snapshotFor(payload); },
    async sendChatMessage(payload) { sends.push(payload); return snapshotFor(payload); },
    async chatSnapshot() { return snapshotFor(); },
    async selectChat() { return snapshotFor(); },
    async deleteChat() { return snapshotFor(); },
    async renameChat() { return snapshotFor(); },
    async interruptChat() { return snapshotFor(); },
    async decideChatApproval() { return snapshotFor(); }
  };
  const coordinator = createChatStateCoordinator({
    api,
    createRequestId: () => `REQUEST-${++request}`,
    setTimer: () => 1,
    clearTimer: () => {}
  });

  await coordinator.initialize(snapshotFor());
  await coordinator.newDraft("P-1", { model: "chat-model", reasoning_effort: "max" });
  assert.deepEqual(creates.at(-1), {
    session_id: "",
    project_id: "P-1",
    text: "",
    model: "chat-model",
    reasoning_effort: "max"
  });

  coordinator.setDraft("Keep this draft");
  await coordinator.changeDraftWorkspace("P-2");
  assert.deepEqual(creates.at(-1), {
    session_id: "",
    project_id: "P-2",
    text: "Keep this draft",
    model: "chat-model",
    reasoning_effort: "max"
  });

  await coordinator.send();
  assert.deepEqual(sends.at(-1), {
    session_id: "",
    project_id: "P-2",
    text: "Keep this draft",
    client_request_id: "REQUEST-1",
    model: "chat-model",
    reasoning_effort: "max"
  });
});

test('native context follows draft ownership, clears foreign references and restores failed send', async()=>{
 const drafts=new Map(),sessions=[{id:'A',project_id:'P'},{id:'B',project_id:'P'}];let selected='A',sent;
 const snap=()=>({projects:[{id:'P'},{id:'Q'}],sessions,selected_session_id:selected,messages:[],draft:{project_id:selected?'P':'Q',text:'',...drafts.get(selected)}});
 const api={chatSnapshot:async()=>snap(),createChat:async p=>{selected=p.session_id;drafts.set(p.session_id,{...p});return snap()},selectChat:async p=>{selected=p.session_id;return snap()},sendChatMessage:async p=>{sent=p;throw Error('offline')},deleteChat:async()=>{},renameChat:async()=>{},interruptChat:async()=>{},decideChatApproval:async()=>{}};
 const c=createChatStateCoordinator({api,createRequestId:()=> 'id',setTimer:()=>1,clearTimer:()=>{}});await c.initialize(snap());
 c.setNativeContext({capability:{id:'create',kind:'native',label:'创建待办'},refs:[{kind:'task',id:'1',project_id:'P',label:'todo'}]});c.setDraft('keep');await c.selectSession('B');assert.equal(c.getState().native_context.capability,null);await c.selectSession('A');assert.equal(c.getState().native_context.refs[0].id,'1');
 await assert.rejects(c.send(),/offline/);assert.equal(sent.native_context.refs[0].id,'1');assert.equal(c.getState().draft,'keep');assert.equal(c.getState().native_context.capability.id,'create');
 await c.newDraft('P');c.setDraft('new');c.setNativeContext({capability:{id:'create',kind:'native',label:'创建待办'},refs:[{kind:'task',id:'1',project_id:'P'}]});await c.changeDraftWorkspace('Q');assert.equal(c.getState().draft,'new');assert.deepEqual(c.getState().native_context.refs,[]);assert.equal(c.getState().native_context.capability.id,'create');await c.clearScopeSelection();assert.equal(c.getState().native_context.capability,null);
});
