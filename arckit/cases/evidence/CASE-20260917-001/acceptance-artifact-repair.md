# Acceptance artifact repair

The Electron fixture now prevents automatic quit after its last window closes, awaits cleanup, and calls `app.exit(exitStatus)` with an explicit status. Running `chat-layout-electron.mjs --force-failure` produces the intentional assertion and exits 1; running with `--evidence /tmp/arcorbit-chat-evidence` passes and exits 0. The passing report covers visible content dimensions, right sidebar placement, composer centering, 1440/1000/760/390 widths, drawer focus, session draft restoration, compact navigation and account access.

The Thing specification now describes cross-project results with status, text, assignee and priority filters, without the removed project scope selector.

Related regression evidence: 17 unit tests passed (Thing shell/service and Chat coordinator); both opt-in production Electron Chat overflow and streaming tests passed; Thing Electron fixture passed all 15 checks. Renderer errors were empty.
