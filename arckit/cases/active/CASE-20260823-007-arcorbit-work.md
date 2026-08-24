# 优化 ArcOrbit Work 状态列表切换性能

Case: CASE-20260823-007
Status: active
Artifact Type: code
Selected Gap: none
Updated: 2026-08-23T21:46:41.163Z

## User Intent

定位 ArcOrbit Work 页面通过待办状态切换列表时明显卡顿的真实瓶颈，并在已验证的架构边界内完成可持续的性能优化。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-007",
  "title": "优化 ArcOrbit Work 状态列表切换性能",
  "status": "active",
  "artifact_type": "code",
  "created_at": "2026-08-23T21:46:41.163Z",
  "updated_at": "2026-08-23T21:46:41.163Z",
  "user_intent": "定位 ArcOrbit Work 页面通过待办状态切换列表时明显卡顿的真实瓶颈，并在已验证的架构边界内完成可持续的性能优化。",
  "expected_outcome": "状态列表切换达到可信的交互性能，修复基于可复现测量和明确的数据、状态与渲染责任边界，不引入临时旁路、重复状态源或破坏现有 Work 行为。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WORK-STATUS-SWITCH-LAG-REPORT",
      "revision": 1,
      "status": "accepted",
      "statement": "操作者报告 ArcOrbit Work 页面通过待办状态切换列表时特别卡，并要求采用正确、可持续的架构方案进行性能优化。",
      "basis": "当前操作者输入是本 Case 的直接问题报告和约束来源；它证明用户可感知问题存在，但不预判瓶颈位置或修复方案。",
      "evidence": [
        "Current operator input, 2026-08-24"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
      "status": "open",
      "goal": "建立 ArcOrbit Work 状态列表切换卡顿的可复现性能证据、主导瓶颈和正确架构责任边界。",
      "reason": "实现优化会因瓶颈位于数据获取、主进程协调、状态投影、筛选计算、DOM 渲染或事件绑定而显著不同；在根因被接受前直接修改会形成临时补丁风险。",
      "derived_from": [
        "FACT-WORK-STATUS-SWITCH-LAG-REPORT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "根因和责任边界未建立，阻塞可信实现。",
        "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
        "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
        "user_impact": "高；状态切换是 Work 页面高频核心操作。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定复现状态切换卡顿的场景与基线测量",
        "覆盖状态切换触发、数据/投影处理和 Renderer 更新的调用链证据",
        "能够区分主要瓶颈与次要开销的性能证据",
        "说明优化应归属的数据、状态、协调或渲染层架构结论"
      ],
      "resolution": null
    }
  ],
  "content_revision": 0,
  "completion_review": {
    "status": "pending",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-23T21:46:41.163Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 0,
    "reviewed_content_revision": null,
    "dimensions": {
      "implementation_correctness": "unknown",
      "problem_resolution": "unknown",
      "verification_credibility": "unknown",
      "regression_risk": "unknown",
      "minimality": "unknown"
    },
    "findings": [],
    "cycles": [],
    "evidence": [],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "satisfied": [],
    "remaining": [
      "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS"
    ],
    "blocked": [],
    "reason": "1 Case obligation(s) remain.",
    "candidate_gaps": [
      {
        "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
        "responsibility": "agent",
        "goal": "建立 ArcOrbit Work 状态列表切换卡顿的可复现性能证据、主导瓶颈和正确架构责任边界。",
        "reason": "实现优化会因瓶颈位于数据获取、主进程协调、状态投影、筛选计算、DOM 渲染或事件绑定而显著不同；在根因被接受前直接修改会形成临时补丁风险。",
        "derived_from": [
          "FACT-WORK-STATUS-SWITCH-LAG-REPORT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "根因和责任边界未建立，阻塞可信实现。",
          "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
          "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
          "user_impact": "高；状态切换是 Work 页面高频核心操作。"
        },
        "evidence_required": [
          "稳定复现状态切换卡顿的场景与基线测量",
          "覆盖状态切换触发、数据/投影处理和 Renderer 更新的调用链证据",
          "能够区分主要瓶颈与次要开销的性能证据",
          "说明优化应归属的数据、状态、协调或渲染层架构结论"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "automatic",
      "responsibility_reason": "实现优化会因瓶颈位于数据获取、主进程协调、状态投影、筛选计算、DOM 渲染或事件绑定而显著不同；在根因被接受前直接修改会形成临时补丁风险。",
      "next_prompt": "Continue CASE-20260823-007: compare the ready dynamic gaps and advance one evidence-backed transition.",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-23T21:46:41.163Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
