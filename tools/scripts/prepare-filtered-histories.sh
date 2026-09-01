#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 5 ]]; then
  echo "Usage: prepare-filtered-histories.sh <git-filter-repo> <output-dir> <workshop-api-repo> <todo-web-repo> <feedbacks-repo>" >&2
  exit 2
fi

filter_repo="$1"
output_root="$2"
workshop_api_source="$3"
todo_web_source="$4"
feedbacks_source="$5"

if [[ ! -x "$filter_repo" ]]; then
  echo "git-filter-repo is not executable: $filter_repo" >&2
  exit 2
fi

if [[ ! -d "$output_root" || -n "$(find "$output_root" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Output directory must exist and be empty: $output_root" >&2
  exit 2
fi

git clone --quiet --no-local --single-branch --branch main "$workshop_api_source" "$output_root/workshop-api"
"$filter_repo" --force --source "$output_root/workshop-api" --target "$output_root/workshop-api" \
  --path AGENTS.md \
  --path README.md \
  --path go.mod \
  --path go.sum \
  --path main.go \
  --path api/ \
  --path database/ \
  --path deploy/ \
  --path deploy.sh \
  --path docs/ \
  --path handler/ \
  --path middleware/ \
  --path models/ \
  --path realtime/ \
  --path response/ \
  --path router/ \
  --path test/ \
  --path USER_GUIDE.md \
  --to-subdirectory-filter services/workshop-api
"$filter_repo" --force --source "$output_root/workshop-api" --target "$output_root/workshop-api" --invert-paths \
  --path services/workshop-api/USER_GUIDE.md \
  --path services/workshop-api/api/user_api.md \
  --path services/workshop-api/deploy/prod/env.production.example \
  --path services/workshop-api/deploy/prod/env.workshop.production.example \
  --path services/workshop-api/docs/feedback-v2-deployment-runbook.md \
  --path services/workshop-api/docs/feedback-v2-notifications-unread.md

git clone --quiet --no-local --single-branch --branch main "$todo_web_source" "$output_root/todo-web"
"$filter_repo" --force --source "$output_root/todo-web" --target "$output_root/todo-web" \
  --path frontend/ \
  --path specs/ \
  --path-rename frontend/:apps/todo-web/ \
  --path-rename specs/:apps/todo-web/docs/specs/
"$filter_repo" --force --source "$output_root/todo-web" --target "$output_root/todo-web" --invert-paths \
  --path apps/todo-web/src/lib/feedbackSdk.ts \
  --path apps/todo-web/env.template \
  --path apps/todo-web/.env.production.example \
  --path apps/todo-web/public/sdk/ \
  --path apps/todo-web/dist/ \
  --path apps/todo-web/node_modules/ \
  --path apps/todo-web/.npm-cache/

git clone --quiet --no-local --single-branch --branch main "$feedbacks_source" "$output_root/workshop-feedbacks"
"$filter_repo" --force --source "$output_root/workshop-feedbacks" --target "$output_root/workshop-feedbacks" \
  --path webapps/feedback-console-web/ \
  --path webapps/feedback-sdk-web/ \
  --path Test/ios/TestFeedBack/ \
  --path design/ \
  --path-rename webapps/feedback-console-web/:apps/feedback-console/ \
  --path-rename webapps/feedback-sdk-web/:packages/feedback-sdk-web/ \
  --path-rename Test/ios/TestFeedBack/:examples/feedback-ios/ \
  --path-rename design/:docs/workshop/feedback-design/
"$filter_repo" --force --source "$output_root/workshop-feedbacks" --target "$output_root/workshop-feedbacks" --invert-paths \
  --path apps/feedback-console/dist/ \
  --path apps/feedback-console/node_modules/ \
  --path packages/feedback-sdk-web/dist/ \
  --path packages/feedback-sdk-web/node_modules/ \
  --path examples/feedback-ios/DerivedData/ \
  --path examples/feedback-ios/xcuserdata/

for repository in workshop-api todo-web workshop-feedbacks; do
  git -C "$output_root/$repository" fsck --no-dangling --no-progress >/dev/null
done

node -e '
  const { execFileSync } = require("node:child_process");
  const path = require("node:path");
  const root = process.argv[1];
  const names = ["workshop-api", "todo-web", "workshop-feedbacks"];
  const result = Object.fromEntries(names.map((name) => [name, {
    path: path.join(root, name),
    head: execFileSync("git", ["-C", path.join(root, name), "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    commits: Number(execFileSync("git", ["-C", path.join(root, name), "rev-list", "--count", "HEAD"], { encoding: "utf8" }).trim())
  }]));
  process.stdout.write(`${JSON.stringify({ schema_version: "arckit-filtered-histories/v1", output_root: root, repositories: result }, null, 2)}\n`);
' "$output_root"
