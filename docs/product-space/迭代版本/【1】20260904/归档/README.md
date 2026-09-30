# 归档文档

本目录存放已被取代、重复或过时的过程文档。保留以备溯源,但不再是权威依据。新的权威文档见上级目录的 `README.md` 索引与各篇保留文档。

| 文档 | 归档原因 | 被谁取代 |
|---|---|---|
| `handoff-pending.md` | 内容是 `implementation-handoff.md` 的极简子集,重复 | `../implementation-handoff.md` |
| `workload-assessment-and-plan.md` | 开工前的工作量预估,代码已 100% 完成,数字与时间线已过时 | `../implementation-handoff.md` + `../迭代总结.md` |
| `技术方案-工作总结-能力现状.md` | "已完成工作"列表与 `implementation-handoff.md` 重复,架构/能力现状已并入 `../迭代总结.md` | `../implementation-handoff.md` + `../迭代总结.md` |
| `knowledge-base-integration-guide.md` | WeKnora 知识库 + 代码 RAG 方案已被 `openhands-integration-plan.md` 第 1.1 节明确推翻,未实施(数据库无 knowledge_workspaces 表) | `../openhands-integration-plan.md` |
| `customer-support-channel-design.md` | 早期通道设计,已被 `产品规划/customer-support-orchestration-plan.md` 取代,有效部分已并入 `../customer-support-prd.md` | `../../产品规划/customer-support-orchestration-plan.md` |

注:`knowledge-base-integration-guide.md` 中的"置信度合并算法(来源加权 + 0.75 阈值)"概念仍被实际实现的 `RetrieveHandler` 双层检索合并逻辑参考,如需溯源算法设计可查阅该归档文档第 7 节。
