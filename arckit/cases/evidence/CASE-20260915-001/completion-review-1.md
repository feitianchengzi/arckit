# 完成审查 1

针对已完成内容版本 2 独立检查五个维度。

- implementation_correctness：发现退出账号的两级 clearRemoteSession 未清除新增 requested_tasks，需要清除旧账号的显式执行请求。
- problem_resolution：发现已有 Codex thread 的恢复不能增加 thread/start 的 dynamicTools；必须提供恢复线程也能使用的场景工具接入。
- verification_credibility：现有测试与 GUI 证据可信，但不能据此声称旧线程的真实工具注册兼容。补查本机 codex-cli 0.154.0 导出的 experimental ThreadStartParams/ThreadResumeParams：前者有 dynamicTools，后者无此字段。
- regression_risk：旧页面壳改动范围有限，旧业务保持，原回归通过；新增排队请求退出边界需补测试。
- minimality：新页面/场景/桥独立，复用旧协调器，未扩展包发布或重写旧页面。

结论：2 项 findings，先修复再审查；不宣称 Case 完成。
