# Feedback Workflow Messaging Plan

## Goals

- Treat feedback as a long-lived workflow item instead of a single mutable row.
- Allow customers and developers to exchange messages under a feedback item.
- Allow each message to carry multiple attachments.
- Link feedback items to one or more tasks so task status changes can update feedback status.
- Keep existing SDK and console behavior compatible while new clients migrate to structured fields.

## Phase 1 Backend Scope

1. Add structured feedback status fields to `feedbacks`.
2. Add `feedback_messages` for customer, developer, and system messages.
3. Add `feedback_message_attachments` for message-level attachments.
4. Add `feedback_task_links` for feedback-to-task associations.
5. Add message list/create APIs for both `user` and `apikey` auth levels.
6. Add a server-side convert-to-task API for developer-side flow.
7. Sync linked feedback status when an associated task changes state.

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
