# Skill and Subagent Feedback Loop Workflow

## Status

- State: promoted
- Type: workflow
- Source: agent conversation
- Created: 2026-05-26
- Updated: 2026-05-26
- Decision: migrated to an independent project for follow-up

## Background

The user asked to work through a "create and maintain skill + subagent execution feedback" pattern: first create or adjust a skill for disk cleanup scanning, then have a subagent run the scan, then let the main agent observe the results, revise the skill based on feedback, and continue.

During the work, the request was initially misunderstood as a scan of the current project. The user interrupted and clarified that the target was the computer hard disk, so the skill was adjusted from a workspace cleanup audit into a disk cleanup audit and then validated through subagent execution.

The user then inserted a research question: whether this working mode already has mature products or frameworks in the industry, and whether Hermes counts as part of that pattern.

The later discussion shifted away from Arckit itself and toward the user's own experiment. The important detail is that the user did not use a dedicated multi-agent framework. They gave Codex CLI a prompt and still produced a loop resembling skill creation, delegated execution, observation, skill revision, and continued execution.

## Pending Item

Capture a possible Arckit workflow pattern in which the main agent owns skill creation and maintenance, delegates execution to one or more subagents, observes execution output, evaluates the artifact quality, and iterates the skill before continuing.

This should remain parked for now rather than becoming a productized workflow. The discussion should be revisited only if the pattern repeats across more real tasks or needs to be formalized into an Arckit workflow or agent coordination skill.

## Current Judgment

This pattern is not speculative. It is one of the mainstream directions in agent engineering: reusable skill artifacts, worker agents, delegated execution, traces, evaluations, and feedback loops are increasingly treated as core agent system primitives.

The closest product references are Claude Code Skills plus Subagents, and OpenAI/Codex Skills plus Subagents.

LangGraph, CrewAI, AutoGen, and the OpenAI Agents SDK are lower-level or more engineering-oriented multi-agent orchestration frameworks. They can implement supervisor/worker patterns, handoffs, tracing, evaluation, and feedback loops, but skill artifact creation, versioning, and closed-loop improvement usually need to be designed by the application team.

GPTs and Actions count as reusable instruction plus tool/action artifacts, but they are less directly aligned with a main agent observing multiple workers and continuously iterating a skill.

If Hermes means Nous Research's Hermes Agent, then it counts as related: public descriptions mention skills, subagents, a shared skill library, multi-agent orchestration, and self-improvement. Its maturity still needs hands-on validation, and the name "Hermes" has several unrelated meanings in the ecosystem.

Arckit should not treat this as a new invention. A better framing is to integrate Agent Skills standards, subagent execution, artifact evaluation, and main-agent reflection and iteration into a stable engineering workflow when there is enough repeated usage to justify it.

The user's prompt-only Codex CLI experiment suggests that the minimum viable form of agent workflow orchestration has moved closer to natural language. A framework is no longer required to start exploring skill evolution loops. Instead, frameworks become more important when the pattern needs repeatability, auditability, safety boundaries, multi-user coordination, persistent traces, permissioning, or evaluation at scale.

The central finding is not simply "multi-agent collaboration works." The more specific pattern is skill lifecycle governance:

1. a human or main agent identifies a repeated or fragile work pattern;
2. the pattern is expressed as a reusable skill-like instruction artifact;
3. an execution agent applies it to a real task;
4. the execution exposes ambiguities, missing boundaries, or unsafe assumptions;
5. the main agent judges whether the skill should be revised;
6. the revised skill becomes a more stable reusable capability.

This aligns with visible industry movement around agent skills, subagents, traces, and evals. Claude Code documents both Agent Skills and custom subagents, including the ability for subagents to preload skills. OpenAI exposes related building blocks through Skills in ChatGPT/Codex/API, the Agents SDK, tracing, and trace grading. Hermes Agent presents an even closer public reference point by explicitly emphasizing a self-improving agent, skills created from experience, shared skill libraries, and isolated subagents. LangGraph, CrewAI, AutoGen, and similar systems remain relevant, but they are better understood here as orchestration infrastructure rather than the essence of the user's discovery.

The user's exploration therefore sits at the same conceptual layer as current industry development, but at a more primitive and flexible edge: prompt as orchestration, skill as memory, subagent or delegated agent as execution sandbox, and feedback as the improvement signal. The opportunity implied by the experiment is not necessarily to invent another agent framework, but to understand and formalize how effective one-off prompting becomes durable agent operating practice.

## Revisit When

- The skill plus subagent execution feedback pattern appears repeatedly in practical Arckit work.
- Arckit needs a formal workflow or agent coordination skill for supervisor/worker execution.
- There is a need to standardize skill artifact evaluation, revision history, or subagent feedback capture.
- Hermes Agent or similar products are validated hands-on and their workflow should inform Arckit's design.

## Related Areas

- `thinking/skills/`
- `iteration/skills/`
- `memory/skills/`
- `engineering/skills/`

## Notes

- The immediate disk cleanup scan workflow should not be productized from this pending item.
- Treat this as parked discussion context, not backlog commitment.
- Future promotion could become an Arckit workflow skill, an agent coordination skill, or guidance inside a broader skill maintenance process.
- The user's no-framework experiment is important because it shows the loop can emerge from prompt-level orchestration before any dedicated framework is introduced.
- The analysis should distinguish between orchestration infrastructure and skill lifecycle governance. The latter is the more specific finding.
- Relevant public references checked on 2026-05-26:
  - Claude Code Agent Skills: https://docs.claude.com/en/docs/claude-code/skills
  - Claude Code custom subagents: https://code.claude.com/docs/en/subagents
  - Claude Code subagents with skills field: https://code.claude.com/docs/en/sub-agents
  - OpenAI Agents SDK tracing: https://openai.github.io/openai-agents-python/tracing/
  - OpenAI trace grading: https://platform.openai.com/docs/guides/trace-grading
  - Hermes Agent documentation: https://hermes-agent.nousresearch.com/docs/

## Outcome

Migrated to an independent project for follow-up on 2026-05-26.
