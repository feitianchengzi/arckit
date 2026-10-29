# Embedded support: multimodal integration

The V2 SDK is embedded in the host product. The host obtains a short-lived feedback Session through its backend; keep long-lived API Keys out of browser deployments. Existing gateway authentication and project membership boundaries remain authoritative.

## Runtime configuration

- Repository-based answers continue to use the project's existing knowledge workspace / OpenHands configuration and repository synchronization. This change does not seed a repository or replace the existing retrieval backend.
- `AGENT_VISION_ENABLED=true`: the configured OpenHands model must support image input. Both initial and resumed turns send images. A disabled image adapter rejects the send explicitly.
- `AGENT_AUDIO_BASE_URL`, `AGENT_AUDIO_API_KEY`, `AGENT_AUDIO_MODEL`: server-only configuration for an OpenAI-compatible `/chat/completions` native audio model accepting `input_audio` WAV and returning text. The adapter requests a JSON transcript and observations; an ASR-only endpoint is insufficient. The original sound is passed to this model, then its labeled, unverified interpretation is supplied to the repository-answering Agent. This is recorded voice messaging, not streaming calls or synthesized speech.
- Server needs `ffmpeg` and `ffprobe`; the Docker image installs ffmpeg. Actual audio is decoded to PCM 16 kHz mono WAV, measured independently of client metadata and rejected above 60 seconds.
- OSS: `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_BUCKET_NAME`, `OSS_REGION`, plus existing upload-policy/STS configuration. Credentials stay server-side. Agent reads use object-specific 15-minute signed GET URLs. Keep the bucket private and ensure the model service can reach it.
- Browser microphone needs HTTPS (localhost is allowed), customer permission and iframe `allow="microphone"`. Host Permissions-Policy must permit the SDK origin. Permission denial/cancel leaves text and images available.

## Message contract

Session routes are relative to `/workshop/v2/feedback`; existing API Key counterparts remain available for server-controlled integration.

`POST /agent-chats/messages` starts/resumes an unlinked support conversation; `POST /feedbacks/:id/agent-message` continues an existing feedback conversation.

```json
{"content":"请查看截图","client_message_id":"unique-turn-id","conversation_id":"optional-existing-id","new_conversation":false,"attachments":[{"type":"image","object_key":"upload-policy-issued-key","file_name":"screen.png","mime_type":"image/png","size":1024}]}
```

Audio uses `type:audio` and positive `duration_ms`. No arbitrary attachment URL is accepted. Each turn supports 4 images and 1 audio recording, at most 10 MB each / 20 MB total; pure media messages are allowed. MIME, object ownership, actual size, decodability and actual audio duration are validated server-side. Image types: PNG, JPEG, GIF, WebP. Audio types: WebM, Ogg, MP4, WAV, MPEG.

A stable `client_message_id` scopes retry to the authenticated customer and target feedback. Persisted messages and response receipt commit together; replay returns the same result, a changed payload returns 409. Legacy requests without an ID cannot guarantee deduplication. `new_conversation:true` explicitly creates a new unlinked conversation; absence preserves legacy resume behavior.

Message history exposes normalized attachments with `access_path`. GET that path using the same auth context to obtain `{url,expires_at}`. API Key reads also require the existing `custom_user_id` query. Both conversation authorization and attachment customer prefix are checked. Do not use object keys as public URLs.

## Domain boundaries

`domain/support` owns media invariants; HTTP adapters own identity, OSS/model clients and normalization. `domain/feedback` owns query windows, conclusions and customer response rules. The application boundary coordinates transactions; existing feedback/task models continue to own processing status. An audio transcript is model-generated evidence, not a customer-confirmed fact. Agent autonomously classifies Bug versus feature and asks factual clarification only. Customers review facts before explicit card creation; type selection is not exposed.

See [feedback lifecycle](feedback-lifecycle.md) for searches, pagination, immutable conclusions and original-card followup.

## Migration and verification

Run the existing service migration command before application replacement (`./todo migrate`); AutoMigrate includes `SupportTurn`, `FeedbackConclusion`, and `FeedbackConclusionResponse`. SQL equivalents are in `database/migrations/20261029_*`. With `DB_AUTO_MIGRATE=false`, do not skip this deployment migration.

```sh
# From services/workshop-api; use a disposable PostgreSQL instance only.
WORKSHOP_TEST_POSTGRES_DSN='host=127.0.0.1 port=5432 user=test dbname=postgres sslmode=disable' go test -race ./... -count=1
# From repository root
npm test --workspace @arckit/feedback-sdk-web
npm test --workspace @arckit/feedback-console
npm run build:check --workspace @arckit/feedback-sdk-web
npm run build:check --workspace @arckit/feedback-console
```

Without `WORKSHOP_TEST_POSTGRES_DSN`, PostgreSQL integration tests skip; that is not full acceptance. Native provider capability, real OSS authorization/network reachability and external gateway integration require environment acceptance with operator-supplied configuration. Automated native-audio and image transport tests use local HTTP adapters rather than real provider credentials.
