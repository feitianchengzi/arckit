# Feedback Workflow Messaging Plan

## Goals

- Treat feedback as a long-lived workflow item instead of a single mutable row.
- Allow customers and developers to exchange messages under a feedback item.
- Allow each message to carry multiple attachments.
- Link feedback items to one or more tasks so task status changes can update feedback status.
- Preserve the initial feedback's attachments when it is converted to a task, while keeping later conversation attachments in the feedback thread.
- Keep existing SDK and console behavior compatible while new clients migrate to structured fields.

## Phase 1 Backend Scope

1. Add structured feedback status fields to `feedbacks`.
2. Add `feedback_messages` for customer, developer, and system messages.
3. Add `feedback_message_attachments` for message-level attachments.
4. Add `feedback_task_links` for feedback-to-task associations.
5. Add message list/create APIs for both `user` and `apikey` auth levels.
6. Add a server-side convert-to-task API for developer-side flow.
7. Sync linked feedback status when an associated task changes state.
8. Render converted initial attachments as a task communication record and issue exact-object read credentials only after task/member/link validation.

## V2 Route Strategy

- Keep V1 routes available for existing clients.
- Register the same base business routes under `/workshop/v2` so SDK V2 can switch its workshop base URL without losing `projects`, `oss/credentials`, and basic feedback APIs.
- Expose workflow-only capabilities under V2:
  - `GET /workshop/v2/{user|apikey}/feedbacks/:id/messages`
  - `POST /workshop/v2/{user|apikey}/feedbacks/:id/messages`
  - `POST /workshop/v2/user/feedbacks/:id/convert-to-task`
- Do not register feedback messages or convert-to-task under V1. This keeps the test surface explicit and avoids accidentally changing the V1 API contract.

## Database Change Strategy

Production database changes must be explicit and reversible. Do not rely on application startup alone for this feature.

- Use `database/migrations/20260714_feedback_workflow_up.sql` before deploying feature code.
- Use `database/migrations/20260714_feedback_workflow_down.sql` only after rolling code back to a version that does not read/write the new tables.
- Keep all phase 1 schema changes additive:
  - new nullable columns on `feedbacks`
  - new tables
  - new indexes
  - no destructive table rewrites
  - no removal or type changes of existing columns
- Keep old `feedbacks.data` compatibility. New code should write structured fields and also keep the JSON payload usable by old SDK/UI code.
- V2 uses the same `feedbacks` table and additive workflow tables instead of `feedbacks_v2`, so successful testing can become the production data model without a later merge migration.

## Rollback Plan

1. Before migration, create an RDS snapshot or run a `pg_dump` of the workshop database.
2. Deploy order:
   - run the `up.sql` migration
   - deploy backend feature code
   - deploy frontend/SDK changes later
3. If backend release must be rolled back:
   - first roll backend code back to the previous release
   - verify old feedback create/list/update APIs still work
   - keep new tables in place if data created during the feature window needs preservation
   - optionally export `feedback_messages`, `feedback_message_attachments`, and `feedback_task_links`
   - run `down.sql` only when it is acceptable to drop feature-created workflow data
4. If data migration/backfill is added later, it must be idempotent and separately reversible.

## Compatibility Notes

- Existing feedback rows without `status` should behave as `pending`.
- Existing SDK clients can continue reading status from `feedbacks.data`.
- New APIs should return structured `status` and message data.
- API key access to messages must be scoped by `custom_user_id` to avoid exposing one customer's messages to another customer using the same project API key.

## Future Phases

- Add unread counters and per-participant read receipts.
- Add notification delivery for developer replies.
- Add a dedicated frontend conversation view in the console and SDK status page.
- Add optional outbox processing if task-to-feedback sync should become eventually consistent and retryable.

## Tracked Todo: V2 Feedback Integration Skill

Create a reusable V2 Feedback integration Skill only after the complete workflow has passed end-to-end production verification: create feedback, initial message, customer/developer replies, attachments, and task-status writeback.

The Skill must support two explicit integration modes for every client platform:

1. **Secure host-service mode (default)**
   - Guide the host backend to keep the Workshop API Key in server-side configuration.
   - Implement a small feedback-session endpoint that maps the host's authenticated user to a stable `custom_user_id` and exchanges the API Key for a short-lived feedback session token.
   - Guide the frontend/SDK bridge to inject only the session token, refresh it on expiry, and never persist or log it.
2. **Direct API Key mode (explicitly risk-accepted)**
   - Keep the V1-style SDK experience on web, mobile, and native clients: initialize with a project-scoped API Key, `project_id`, and stable `custom_user_id`, then call V2 `/apikey/*` APIs directly. The integrator must not need to create, store, refresh, or understand feedback session tokens.
   - Provide functional parity with secure mode for feedback creation, list/status, customer/developer messages, and attachment upload/read; direct mode must not force clients back to V1 routes for any V2 feature.
   - Require an explicit opt-in acknowledgement that a packaged or browser-delivered API Key is a client identifier rather than a secret. Recommend a high-entropy installation identifier when no authenticated backend identity exists.
   - Provide project-only scopes, rotation/revocation, rate limits, and abuse monitoring. Do not silently fall back between the two modes.

The Skill should include configuration templates, secure backend and direct-client reference flows, token-refresh handling for secure mode, V1/V2 migration guidance, API examples, a test checklist, and deployment/rollback checks.
