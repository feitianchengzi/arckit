# Feedback V2 lifecycle, conclusions and history

All paths are relative to `/workshop/v2/{user|apikey|feedback}`. The gateway supplies identity; `feedback` uses the short-lived Session scope. User routes require project membership. API Key reads/responses additionally require `custom_user_id`. Session identity is never accepted from the body.

## List and search

`GET /feedbacks?q=&status=&date_from=&date_to=&date_field=created&page=1&page_size=20`

- Search covers feedback number/title/content, sent feedback messages, Agent conversations and published conclusions. `%` and `_` are literal characters.
- `date_field`: `created` or `updated` (last message timestamp, falling back to update timestamp).
- RFC3339 timestamps use a half-open `[date_from,date_to)` interval; timezone offsets are honored. Date-only end is inclusive through its UTC day. Clients should convert local dates to explicit RFC3339 boundaries.
- Customer statuses: `submitted`, `reviewing`, `developing`, `completed`, `released`, `ignored`; `analyzing` aliases submitted. Existing internal status filters remain supported.
- Permission predicates are applied before search and count. Draft replies and deleted messages cannot produce search matches.

## Customer-scoped detail

`GET /feedbacks/:id/detail`

Returns `{feedback,events,conclusions,responses}` in the normal `data` envelope. Events have `{id,type,title,status?,created_at}` and expose customer-facing transitions only. Task internals and draft conversations are excluded.

`GET /feedbacks/:id/conversation-messages?page=1&page_size=100`

Returns a chronological array with `meta.page/page_size/total`. Identities are `(source,id)` (`agent` / `feedback`), not `id` alone. Agent attachment references include temporary authorized `access_path`; use the corresponding media access endpoint, never treat an OSS object key as a public URL. Pagination occurs in SQL before message bodies and attachments load. Legacy requests without pagination retain the all-history response shape.

Mirrored developer replies carry `metadata.feedback_message_id` to the original sent message. Equal text alone does not establish identity. Unlinked historical copies are preserved rather than silently deleting potentially distinct communication.

## Formal conclusions

`GET /feedbacks/:id/conclusions` returns newest-first immutable versions:

```json
{"id":1,"feedback_id":42,"version":1,"kind":"delivery","title":"处理结果","body":"验证步骤与结论","artifact_url":"https://example.com/release","version_label":"2.8.0","published_by":7,"created_at":"2026-10-29T09:00:00Z"}
```

Internal **user** route only:

`POST /feedbacks/:id/conclusions`

Body: `{kind:delivery|answer|not_planned,title,body,artifact_url?,version_label?,expected_version?}`. `expected_version` is the latest version the editor reviewed (0 for first); mismatch returns 409. Publication is serialized on the feedback aggregate and also creates a sent developer message plus notifications atomically. It never overrides linked task state. Customer/API Key callers cannot publish conclusions.

Customer Session/API Key route:

`POST /feedbacks/:id/conclusions/:conclusionId/response`

Body: `{response:accepted|needs_review,content?,client_message_id}`. The idempotency key is scoped by feedback and authenticated customer. Replays return the same response; changing its payload returns 409. Only the current conclusion accepts a new response. A `not_planned` decision allows review requests, not delivery acceptance.

Acceptance/review is a customer verification record; it does **not** invoke the internal task acceptance transition or overwrite task-driven feedback status. Both actions append to the original communication and notify internal members. Details return response history, keyed by `conclusion_id`, so UI can distinguish formal task progress from the latest customer validation.

## Existing delivery integration

`POST /feedbacks/:id/delivery-notify` publishes a versioned `delivery` conclusion in the same transaction as its delivery message. V2 refuses to declare unfinished feedback completed (409); work must already be completed/released by the task workflow. Delivery links must be HTTP(S). Existing V1 status behavior is retained. Read access to delivery-status is project/customer scoped.

## Domain and verification

`domain/feedback` owns search windows/literal patterns, conclusion content/link rules, response validity and stale-version policy. HTTP adapters establish scope; GORM transactions lock the feedback aggregate and persist immutable conclusions, response history and sent communication/notifications together. Existing sent workflow messages provide durable lifecycle events; no second competing state machine is introduced.

Migration: `database/migrations/20261029_feedback_conclusions_{up,down}.sql`; models are also included in the binary's AutoMigrate path. Integration tests use isolated PostgreSQL schemas with `WORKSHOP_TEST_POSTGRES_DSN`. Tests cover ownership, search scope, hidden drafts, idempotent and stale acceptance, task-state protection, >100-message pagination, and persistence failures.

## Confirmed conversation conversion

Session and APIKey feedback creation with `conversation_id` require a valid `structured` summary and `clarification.confirmed=true`. The server locks the owned conversation inside the creation transaction, creates the feedback and initial message, and links the conversation plus original Agent messages atomically. A retry returns HTTP 200 with the existing feedback; first creation returns 201. An unconfirmed request returns 400 even after creation; wrong project/customer ownership returns 403. Requests without a conversation retain their existing behavior. Confirmation concerns the collected facts, not a customer choice of Bug versus feature: Agent owns classification.

Regression: `TestConfirmedConversationCreatesOneFeedback` exercises both Session/APIKey paths against PostgreSQL with concurrent submissions, ownership denial, confirmation bypass denial and preserved original Agent history.
