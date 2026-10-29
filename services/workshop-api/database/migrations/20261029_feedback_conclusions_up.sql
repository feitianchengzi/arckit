CREATE TABLE IF NOT EXISTS feedback_conclusions (
 id bigserial PRIMARY KEY, feedback_id bigint NOT NULL REFERENCES feedbacks(id), project_id bigint NOT NULL REFERENCES projects(id),
 version integer NOT NULL CHECK(version>0), kind varchar(32) NOT NULL CHECK(kind IN ('delivery','answer','not_planned')),
 title varchar(200) NOT NULL, body text NOT NULL, artifact_url text NOT NULL DEFAULT '', version_label varchar(200) NOT NULL DEFAULT '',
 published_by bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT uniq_feedback_conclusion_version UNIQUE(feedback_id,version)
);
CREATE INDEX IF NOT EXISTS idx_feedback_conclusions_project ON feedback_conclusions(project_id);
CREATE TABLE IF NOT EXISTS feedback_conclusion_responses (
 id bigserial PRIMARY KEY, feedback_id bigint NOT NULL REFERENCES feedbacks(id), conclusion_id bigint NOT NULL REFERENCES feedback_conclusions(id),
 custom_user_id varchar(128) NOT NULL, response varchar(32) NOT NULL CHECK(response IN ('accepted','needs_review')), content text NOT NULL DEFAULT '',
 client_message_id varchar(128) NOT NULL, scope_feedback_id bigint NOT NULL, scope_custom_user_id varchar(128) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT uniq_feedback_conclusion_response UNIQUE(scope_feedback_id,scope_custom_user_id,client_message_id)
);
CREATE INDEX IF NOT EXISTS idx_feedback_conclusion_responses_feedback ON feedback_conclusion_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_conclusion_responses_conclusion ON feedback_conclusion_responses(conclusion_id);
