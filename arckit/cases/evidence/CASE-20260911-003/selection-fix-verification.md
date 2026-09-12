# Member selection review finding repair

2026-09-12 — FINDING-20260911-003-001

The production sheet receives the organization matched by the project's organization_id and displays organization and project names. A selected-member summary outside the filtered list shows the name and user identity, including while the list has no matches. Search preserves the explicitly displayed selection. Existing submission and recovery logic is unchanged.

Validation:

- `node --test runtime/arcorbit/test/project-member-add.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs`: exit 0, 77 passed, no failures or skips. Output: selection-fix-focused.tap.
- From runtime/arcorbit, `npx electron test/fixtures/project-member-add-electron.mjs`: exit 0. This loads the production Renderer in Electron with deterministic service data. The fixture asserts organization/project text, selects New Member, searches Lin and then a nonexistent name, verifies the persistent selected identity, and submits exactly organization_member_id 501 once.
- Electron result: {"memberDenied":true,"existingDisabled":true,"matches":1,"contextVisible":true,"hiddenSelectionVisible":true,"emptySearchSelectionVisible":true,"success":true,"refreshed":true,"focused":true,"staleClosed":true,"adds":[["project.member.add",{"project_id":"11","account_id":"7","organization_member_id":"501"}]]}
- `git diff --check`: exit 0.
- `git status --short services/workshop-api`: empty.

The initial Electron invocation from the repository root failed with `electron: command not found`; running from its installed workspace succeeded. No dependency installation was needed.

Scope: client source and isolated real Renderer behavior only. No live server request, deployment or packaged application acceptance. Existing server caller-role limitations remain unchanged. This repairs the recorded finding; completion review remains a separate next transition.
