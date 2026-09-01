# Feedback V2 Notifications and Unread

## Purpose

This change adds in-app notifications and unread state for Feedback V2 without
changing V1 endpoints, existing Feedback V2 list/message response bodies, or
the current Console and SDK request paths.

It covers three user-visible events:

1. A customer creates a feedback item or adds a follow-up: project members are notified.
2. A developer replies: that feedback item's customer is notified.
3. A workflow status changes through triage, conversion, or a linked task: that feedback item's customer is notified.

It intentionally does not send email, push, webhook, or task-comment
notifications. Those delivery channels can consume the same notification table
later without changing the conversation contract.

## Scope and Compatibility

| Surface | Existing behavior | Notification rollout |
| --- | --- | --- |
| V1 SDK / API | Unchanged | No route and no notification write |
| Existing V2 SDK / Console | Existing list and conversation calls remain unchanged | Disabled unless the new client flag is explicitly enabled |
| New V2 client | Uses separate notification APIs | Opt-in per project/client |

The server writes notification records only for V2-created messages and V2
workflow system messages **after** a project is explicitly allowlisted through
`FEEDBACK_V2_NOTIFICATION_PROJECT_IDS`. The default empty value means no
notification row is written and notification endpoints return `404`; deployment
does not change existing V2 traffic or create a sudden unread backlog.

## Data Model

`feedback_notifications` stores one row for one recipient of one feedback
message. It is not a field on `feedbacks`, which keeps older response contracts
stable.

```text
feedback_messages (one message)
        |
        +-- feedback_notifications (one per recipient)
              - recipient_type: developer | customer
              - recipient_user_id OR recipient_custom_user_id
              - type: customer_message | developer_message | status_change
              - read_at
```

Rows are created in the same database transaction as their source message.
Partial unique indexes on `(message_id, recipient)` make retries idempotent.

## Authorization

| Client mode | Read / mark scope | Required identity |
| --- | --- | --- |
| Console | One project member's developer notifications | Existing JWT user + project membership |
| Scoped session SDK | One `(project_id, custom_user_id)` customer | Existing short-lived `fbs_` feedback session token |
| Direct API Key SDK | One `(project_id, custom_user_id)` customer | Existing gateway API Key + API Key owner remains a project member |

The customer identity is always derived from the session token or validated
against the API Key request scope. A caller cannot use notification IDs to read
or mark another customer's records.

## API Contract

All routes are new and V2-only.

### Console JWT

```text
GET  /workshop/v2/user/feedback-notifications?project_id=78&unread_only=true
POST /workshop/v2/user/feedback-notifications/read
```

```json
{
  "project_id": 78,
  "feedback_id": 123
}
```

### Scoped session SDK

```text
GET  /workshop/v2/feedback/notifications?unread_only=true
POST /workshop/v2/feedback/notifications/read
```

```json
{
  "feedback_id": 123
}
```

The feedback session token fixes both project and customer scope. Supplying a
different `project_id` or `custom_user_id` is rejected.

### Direct API Key SDK

```text
GET  /workshop/v2/apikey/feedback-notifications?project_id=78&custom_user_id=user-42&unread_only=true
POST /workshop/v2/apikey/feedback-notifications/read
```

```json
{
  "project_id": 78,
  "custom_user_id": "user-42",
  "feedback_id": 123
}
```

### List response

```json
{
  "code": "OK",
  "data": {
    "notifications": [
      {
        "id": 501,
        "project_id": 78,
        "feedback_id": 123,
        "feedback_short_id": "FB123",
        "message_id": 987,
        "message_preview": "我们已经定位到这个问题。",
        "sender_type": "developer",
        "type": "developer_message",
        "created_at": "2026-07-23T10:00:00Z"
      }
    ],
    "unread_count": 1
  },
  "meta": { "page": 1, "page_size": 100, "total": 1 }
}
```

`unread_count` is the recipient's project-wide total even when `feedback_id`
filters the returned page. This lets a client keep a compact global badge while
marking only the opened feedback as read.

## Client Rollout

### Console

Set `VITE_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS` to an explicit comma-separated
allowlist, for example `78`. The current V2 project allowlist does not imply
notification enrollment.

The Workshop service must independently set
`FEEDBACK_V2_NOTIFICATION_PROJECT_IDS=78`. The browser flag only controls UI
requests; the service allowlist controls whether notification data exists.

When enabled, the Console fetches the new notification API, displays a compact
unread count and a dot on affected feedback items, and marks notifications for
the opened conversation as read.

### SDK

The host must opt in explicitly:

```js
window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2NotificationsEnabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: 'fbs_...'
})
```

The same opt-in works in direct API Key mode. The SDK shows an unread dot for a
feedback item and marks it read only after its conversation is opened.

Without `feedbackV2NotificationsEnabled: true`, no notification API request is
made.

The service-side allowlist must contain the same project before enabling this
SDK flag.

## Database Deployment and Rollback

Apply the additive migration before deploying the service version that writes
notifications:

```bash
PGPASSWORD=REPLACE_WITH_PRIVATE_SECRET psql \
  "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER sslmode=$DB_SSLMODE" \
  -v ON_ERROR_STOP=1 \
  -f database/migrations/20260723_feedback_notifications_up.sql
```

The migration creates only a new table and indexes. It neither changes old
tables nor backfills data.

Keep `FEEDBACK_V2_NOTIFICATION_PROJECT_IDS` empty for the first code deploy.
After health checks, set it to only the test project (for example `78`) and
restart the service. Only then turn on the Console and SDK client flags for
that project.

Rollback order:

1. Disable the Console project allowlist and SDK notification opt-in.
2. Deploy the previous service version so no process writes notification rows.
3. Run `database/migrations/20260723_feedback_notifications_down.sql` only if
   the data must be removed. Keeping the unused table is also safe and makes a
   later retry simpler.

## Acceptance Checks

1. Create a V2 customer feedback under test project `78`; a project member sees
   one unread `customer_message` notification.
2. Open the item in Console; only that member's notifications for the feedback
   are marked read.
3. Send a developer reply; the matching SDK customer sees one unread
   `developer_message` notification.
4. Update the linked task state; that customer sees one unread `status_change`
   notification and the ordinary V2 status view remains unchanged.
5. Repeat message submission with the same `client_message_id`; verify there
   is one message and one notification set, not duplicates.
6. Attempt cross-customer notification reads in session and direct API Key
   modes; verify they return no data or `403` for a mismatched supplied scope.
