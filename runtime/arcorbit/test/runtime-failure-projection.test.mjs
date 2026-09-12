import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRunEvent, finalizeRunActivity} from '../src/projection/run-event-projector.mjs';
import {executionOutcome} from '../src/automation/execution-outcome.mjs';

test('terminal session error survives exit code and reaches Automation recovery reason',()=>{
 const run={id:'RUN-schema-failed',status:'running'};
 const message="Codex Agent turn failed: invalid_json_schema at properties.handoff: $ref cannot have keywords {'description'}.";
 applyRunEvent(run,{parsed:{event:{type:'runtime.lifecycle.span.completed',name:'runtime.session',status:'error',error:{name:'CodexTurnError',message}}}});
 const activity=finalizeRunActivity(run,{status:'failed',exitCode:1,parsedResult:null,errorMessage:''});
 assert.equal(activity.error,message);
 assert.ok(activity.messages.at(-1).content.includes(message));
 assert.equal(executionOutcome({activity,status:'failed'}).reason,message);
});

test('recoverable inner span error is not presented as a terminal failure',()=>{
 const run={id:'RUN-recovered',status:'running'};
 applyRunEvent(run,{parsed:{event:{type:'runtime.lifecycle.span.completed',name:'codex.turn',status:'error',error:{message:'transient'}}}});
 const activity=finalizeRunActivity(run,{status:'completed',exitCode:0,parsedResult:null,errorMessage:''});
 assert.equal(activity.error,'');
 assert.doesNotMatch(activity.messages.at(-1).content,/transient/);
});
