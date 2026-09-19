# Agent Loop

## 定位

本规格定义人类直接在 Codex 中使用 Arckit，以及 Desktop Runtime 自动推进同一事项时共享的 `Project State -> Case -> Loop` 语义。

默认形态是一个连贯的 Codex Agent 工作单元：同一 Agent 在一个 turn 内恢复 fresh Project/Case state、用 Project decisions/invariants 指导 Case 候选发现、选择一个 Case gap、使用必要 skills/tools 只完成该 Gap，并提交 transition 或责任明确的 handoff。Runtime 取代人类在对话外执行的自动化动作，不取代 Agent 的能力。

Loop 是一次可验证的 Case 状态推进，不等于 Agent 内部每次工具调用；一个 Loop 只处理一个 gap。

通用 Loop 从场景 State 定义读取业务对象、不变量、事实关系、证据与完成条件；软件场景的六个思考方向和预期依赖不硬编码为跨场景方法或 Runtime 分支。概念边界见 `product-concepts.md` 的“通用 Loop 与场景 State”“事实依赖与选择资格”和“探索与正式确立”。

## 责任边界

| 参与者 | 职责 | 不负责 |
|---|---|---|
| 人类 | 提供目标、补充与纠错；承担取舍、授权、审美、风险接受和发布责任 | 不手工搬运默认流水线中的伪 packet/report |
| Codex Agent | 选择 Case/gap；原生选择 skills/tools；调查、实现、验证、自我审查；形成语义 claim | 不直接写 ledger；不静默代替人类决策 |
| Desktop Runtime | readiness、任务领取、授权投影、持久 thread、fresh-state bridge、上下文压缩、结构门禁、trusted ledger、自动续轮、恢复与 commit | 不预选 gap、固定 skill/role/path；不语义复审 Agent 工作 |

`using-arckit` 是当前 Agent 的对话控制协议，不是另一个必须先规划、后交给当前 Agent 执行的角色。该包内 Ledger 脚本提供确定性状态写回接口。

## 从单一目标启动

新项目允许仅从用户目标开始。Agent 确认工作目录与已有材料，将明确要求、事实和未决分开；只对影响重要行为、范围、权限或验收的歧义先澄清。从未建账时通过可信入口初始化，存在旧记录时恢复而不覆盖。初始化只创建状态容器，不预选首个 Gap、不生成业务阶段，也不代表目标推进完成。用户提出目标本身可成为 Case 初始事实；登记当前已知义务后 fresh-read 比较，按同一选择机制确定首个 Gap。

## 人类直接在 Codex 中工作

人类在一个持续对话中调用 `$using-arckit`。当前 Agent：

1. 通过 ledger manifest 声明的 trusted snapshot entrypoint 读取 Project State、全部 active Cases、iteration、candidate catalog、revision 与 snapshot token；不能把 writeback candidate 当作 fresh state。
2. 判断用户输入是新事项、继续、补充、纠错、目标变化、暂停或状态查询。
3. 识别项目维护对象、实现载体与生效方式，结合 Project decisions/invariants、fresh Case facts、既有显式判断与稳定事实源发现实际候选，并检查事实前置与粒度；曾经完成的事实域可以因新 facts 重新成为候选，但 Case 初始化和上一轮不得预排工作顺序。
4. 明示本轮 `round_opening`：列出 persisted candidates、本轮 fresh gap 候选、eligibility、priority basis 与 selected/deferred/excluded 结论，声明 selected gap 的有界 acceptance claim、探索或正式确立性质、依赖依据、完成证据和执行边界，再选择一个 active Case 与一个 gap；没有合适 Case 时请求 `case_control.create_case`。
5. 在当前 turn 内使用适合的事实、skills 和工具，只完成 selected gap 中可共同决定和验收的问题及其必要证明；新发现不能授权同轮跨越关键决策边界、修改预期后正式实现或切换到另一个 Gap。
6. 记录本轮确认或改变的 Case facts、它们对 Project decisions/invariants 的实际 impacts、invariant-guided 显式判断和由此暴露的后续 gaps；只提交由 selected gap 直接建立的 Project delta，不执行新增 gap。
7. 执行与风险相称、只用于证明 selected gap 的验证和自我审查。
8. 提交绑定 snapshot token、完整比较轨迹和 evidence 的 transition，或形成 human/external handoff。
9. ledger 写回成功后先展示独立 `round_closeout`，再以其 post-commit token 调 trusted snapshot entrypoint；只有这个 fresh-read receipt 可启动下一轮。

用户不需要为概念上的“计划—执行—复审”创建多个对话。验证、修复和提交继续使用当前对话。

## Runtime 自动化形态

默认自动执行链路是：

```text
local readiness
  -> remote claim
  -> fresh Project/Case read
  -> one $using-arckit Agent turn
  -> structural/revision/authorization gate
  -> trusted ledger writeback
  -> user-visible round_closeout
  -> trusted post-commit snapshot read
  -> next turn in the same task thread
```

Runtime invocation 只提供自然的 `$using-arckit` 触发、真实用户意图、当前增量、由 canonical records 确定性派生的 bounded facts、revision 与执行授权。Codex output schema 作为机器参数约束返回形状。Runtime 不显式注入一份额外 skill input，不拼接 skill 正文、固定 workflow、Worker role、skill 白名单或预测路径。

一个远端待办从领取、逐 gap 推进、验证、修复到 Git commit 始终绑定一个持久 Codex thread。Runtime 在第一个 turn 前保存 Codex 返回的 thread id；进程重启后通过该 id 恢复对话并继续追加 turn。fresh canonical facts 与当前授权覆盖冲突的历史内容，ledger 与持久 thread 分别提供事实恢复和语义连续性。

每次成功 ledger 写回后，Runtime 用该 thread 最新请求的 input tokens 除以模型 context window 计算上下文占用率。占用率达到 80% 时，Runtime 在同一 thread 完成上下文压缩并等待压缩成功，再发起下一 gap turn。压缩不创建新对话，也不改变 canonical state。

自动执行持续到 Case resolved。只有下一步真实需要人类判断或授权时才把控制权交给人类；external wait 保持为可恢复等待而不伪装成人工责任。确定性基础设施失败或连续无 canonical 进展会进入明确恢复状态，不以生产性轮次、总墙钟或长命令时长停止。

总墙钟、生产性 Loop 数和长命令时长不是停止条件。每个 Loop 仍串行推进一个 gap；相关小问题可以按结论依赖合理合并，不以减少轮次为由跨越重要取舍或预期与正式实现的边界，也不默认并发执行多个 Gap。

## 输入与授权

真实用户输入与 Runtime 控制元数据必须分开。任务 ID、run ID、续轮深度、gate 和 ledger 状态不能伪装成 `role=user` 内容。自动续轮没有新增人类输入，Runtime 只发起下一 turn 并提供 fresh facts。

执行授权来自用户显式执行意图、Desktop auto-run policy 或外部已授权 packet。Runtime 负责 sandbox、approval 与 workspace 边界；Agent 的 skill/tool 选择不能扩大这些权限。

状态查询只报告，不触发工作区修改。human-responsibility gap 不由自动执行提升为 Agent 责任。

## Gap 发现、资格与优先级

Agent 先恢复 Case 目标和授权，确定当前纵向对象，再从软件场景的产品需求、交互设计、视觉规范、技术方案、实现兑现和诊断根因六个方向审视相关性。每个业务候选说明对象边界、相关不变量、缺少的结果或证据；已有事实充分则复用，无关则说明，相关未决则保留。当前 State 的附加不变量同样逐项判断，不变量检查不扩大原任务。

选择先检查资格，再比较优先级：

1. 确认属于授权目标，具备所需责任和执行条件。
2. 对正式确立的决定检查关键依据；依据不足且影响决定时，形成回答具体未知的探索 Gap，不能凭假设定稿。
3. 对正式实现检查其范围和共享依赖所需的相关预期是否明确、有效、接受且可验收；缺失或冲突由预期或取证 Gap 承接。已记录为 ready 不代替本轮语义检查。
4. 判断重要取舍或关键未知是否须独立处理，相关小问题是否适合共同决定。
5. 在具备条件的候选中选择最能解除关键阻塞、减少重大返工或产生直接价值的结果，结合影响面、不确定性、依赖、风险与可验证性解释。范围外或不影响决定的陌生问题不因不确定性高而优先；不设固定分数或事实方向顺序。

正式实现的预期前置是资格约束，不能被“实现影响大”“实现容易”覆盖。它作用于当前局部及依赖，不要求整个 Case 全部预期齐备：A 模块预期已成立且不依赖 B 的未决交互时，A 实现与 B 交互均可比较；共享契约未成立时，所有依赖它的正式实现都等待。选择实现时说明依据哪些预期、为何足够、其余预期未决为何不影响本范围。充分性的判断是剩余未知是否可能改变本次外部行为、关键约束或验收标准；清楚有效的用户要求可以直接作为预期来源，不以文档齐全为前提。

预期的接受按既有授权与决策权限判断，不为每个 Gap 增设人工审批。新建或改变的正式结论在当前预期 Gap 中维护到权威事实源，再提交并 fresh-read；Ledger 写回成功不替代语义采纳或事实源维护。已有充分预期直接引用复用，必要人类取舍保持原责任边界。

用户待解决的故障，或影响后续处置的重要独立因果问题，直接原因未知时先取得原因证据；查清后提交并重新选择处理方向。已有因果证据和相关有效预期时可直接修复，不重复诊断或补写无变化的预期。原因解释的是实际现象，不能用“可能属于需求或技术问题”的分类替代调查，也不把原因查清等同于修复完成。实现或实验中为证明当前结果所需的常规排障可以留在当前 Gap；若失败暴露重要独立因果问题，或动摇已接受预期、关键前提或验收边界，则保存证据与未完成义务，提交重选。是否拆分取决于结果与决定边界，不由出现报错或正处于实现过程决定。

## 探索、采纳与正式兑现

每个 Gap 说明尚未成立的具体结果、缺少什么、成立后改变什么与何种证据足够；结论性质说明取得决定所需依据，还是正式确立有依据的结果。该判断与事实方向正交：产品、交互、视觉、技术、实现和诊断均可涉及探索或正式结论，不根据所用工具、文件格式或是否写代码推断性质。

关键依据缺失时，探索是前置缺口的处理方式，不是任意可选的附加步骤。探索 opening 说明服务的授权目标或未知阻塞的决定、要回答的问题、足够证据、适用条件以及本轮不能据此成立的下游主张，再选择调查、原型、实验或试跑方法。不要求纯探索任务先虚构一个待采纳的产品决定。

探索验收只接受证据实际支持的结论。实验中的真实观察可成为实现事实，但实验成功不自动批准产品方向、技术方案或正式交付。关闭已回答未知的同时保留仍需正式决定和兑现的义务，相关不变量不能因探索成功一并视为完成。需要另行选择的独立结果或重要决定首次具备条件，或新证据使已接受预期、关键前提、责任或验收边界需要重定时，提交并 fresh-read 后选择；取证始终服务同一既定局部结果时，可在该边界内完成比较与采纳，不因探索标签强制新建 Gap。无需独立取舍的相关小项可共同验收。同一验收结果内部的动作依赖就绪，以及既定约束内的实现手段调整，不单独触发重选；例如接口完成后联调、未改变约定的批次参数调整，仍服务当前结果。

探索不可行的结论可以完成 Gap；证据不足或试验执行失败而未回答原问题时，如实保留原 Gap 和证据，不为换轮重新命名。试验依赖有界假设、观察标准和授权，不要求尚待探索的功能预期先行定稿。实现不变量在本轮区分“实际观察有依据”“已有相关行为是否保持”与“正式预期是否兑现”；只有前两项成立不能支持最终兑现主张，试验引入的实际回归仍须承接。

正式预期接受后，探索载体可以被复用，并按预期调整与验证，不要求机械重写。Skill 项目中的技能正文、脚本、模板及其实际生效行为都是实现判断的对象；改 Markdown 不自动属于预期维护。实现验收区分源文件变化、目标环境生效和行为兑现，不以文本修改成功代替 Agent 行为证据。

## Gap 粒度与义务连续性

一个 Gap 的 acceptance claim 可以包含围绕同一有界目标、适合共同决定和验收的多个子结论。方向明确的需求、入口和反馈细节可以合并为预期 Gap，相关实现与其验证可以合并为实现 Gap；预期的建立或修改与正式实现不能同轮合并。读取、复用和确认已有有效预期不要求独立 Gap。

独立处理应说明所保护的重要判断：影响后续方向或多个对象、需要独立取舍与授权、错误会造成明显返工。工作量与耗时不直接决定 Gap 数。判断依据是“现在能否共同决定，还是必须先获得其中一个答案才能决定其他工作”，不按文件、测试、模块、不变量或 skill 数量拆分，也不以工作量或轮数代替结论边界。

一个小任务若前置已满足、只剩一个有界实现结果，可以由一个普通 Gap 完成并进入必要复审；Case 和 Gap 的范围恰好一致不是拆分理由。反之，多个互不相关的小问题也不因都容易而合并。选择说明既交代独立处理的必要性，也交代合并问题共享的目标、依据和验收边界。

已知缺口及其真实依赖可以在当前轮完整记录，包括初始化时已有证据支持的义务；这不等于预排未来步骤。不得为维持“动态发现”而故意等到下一轮才记录已知问题，也不因其已经记录而自动选中。每次 fresh-read 仍审视 Case 内部边界并比较候选。

执行中发现关键未知时保留已经成立的结论和未完成义务，必要时通过可信接口重新界定 Gap；取消或替代不冒充验收完成，不丢失责任。同一 Gap 未验收可 partial 跨轮。新反证使前提失效时重新判断依赖结论和实现资格；无关局部不自动失效。

优先 Gap 解决后，当前授权目标内其余相关不变量仍须逐项补齐。局部结论只覆盖声明的对象和证据范围；已知未决不能因换轮遗漏，也不因本轮未选而标记无关。任务只授权探索时按探索目标结束并交接剩余义务，不自动扩大为正式交付。

## 单 Loop 契约

一个 Loop 的标准步骤是：

1. 通过 trusted snapshot entrypoint 恢复 canonical facts、candidate catalog、revision 与 snapshot token；历史 transcript 只提供连续性。
2. 恢复维护对象与实现载体，结合完整 Project decisions/invariants、fresh Case facts、已有 judgments 与稳定事实源，发现本轮实际暴露的 fresh candidates；业务 Gap 关联具体不变量义务，不生成固定 facet 或初始化工作清单。
3. 检查候选的事实依赖、选择资格与粒度，再比较全部 persisted candidates 与本轮 fresh candidates，记录 eligibility、priority basis、selected/deferred/excluded 及理由，选择一个 Case 和一个 gap。
4. 形成 selected gap 的有界 acceptance claim、结论性质、前置依据、完成证据和明确边界；`planned_transition` 不预排后续事实域、skills、产物或步骤链。
5. 当前 Agent 自主使用必要 skills/tools，只完成 selected gap 及证明该 claim 所必需的调查、编辑、构建或测试。
6. 形成本轮 accepted Case facts，判断与 Project decisions/invariants 的 state impacts，保存本轮显式 judgments，并添加由新事实暴露的后续 dynamic gaps；新增工作不得在本轮继续执行。
7. 分离 `round_outcome`、`case_resolution`、`project_state_delta` 与 handoff。
8. 提交绑定 snapshot token、Case revision、observed Project revision、完整 selected gap 与比较轨迹的 Case transition。
9. Runtime 通过结构、revision、授权、路径和 ledger legality gate 后调用 trusted ledger。
10. 写回成功后展示 ledger 生成的独立 `round_closeout`，其中只陈述本轮已接受事实、judgments、证据和 resulting revisions，不携带下一 Gap 指令。
11. 以 closeout 的 post-commit token 调 trusted snapshot entrypoint；验证确实观察到 commit 后 state，才从 fresh catalog 开始下一轮。

Runtime 不把单个 gap 完成当成 Case 已关闭，也不让语义 resolved claim 覆盖结构 guard 的否决。Agent 可以提交 unresolved transition，并在同轮添加从新事实发现的后续 gap；有 blocker、未闭合 state impact 或 open gap 的 resolved claim 不能进入 writeback。

Case 的相关 state impacts、全部实际 gaps 和所有已经被 fresh facts 暴露为相关的 invariant-guided judgments 闭合后，当前 content revision 仍需以实现正确性、验证可信度、回归风险和最小性为重点的完成态复审。未记录不能等同于 `not_applicable`；复审、finding 修复和复验均由当前 Agent在同一 task thread 完成；最后一个授权自主复审仍有 findings 时转 human responsibility。

复审按 Case 授权的交付范围解释上述责任。纯探索或定义事项检查其产物、结论、实际影响和证据，不要求把未授权的完整产品实现补齐；当前目标内的未决义务仍须真实解决，不能通过重命名阶段跳过。

## Closeout 与 handoff

一轮 Agent turn 结束不等于 round、Case 或 Project 都完成。closeout 必须分别说明：

- 本轮工作是否 completed、partial、blocked、needs_human 或 external_wait。
- Case 是 unresolved、resolved 或 blocked，以及 remaining gaps。
- Project impact 是 none、proposed 或 accepted。
- 下一责任方是 agent、human、external 或 none。

此外，ledger 成功 receipt 必须提供可独立展示的 `round_closeout`；Runtime 与直接 Codex 使用同一份 canonical receipt。它与后续 `fresh_read` 是两个事件：前者证明上一轮接受了什么，后者证明下一轮基于哪个 commit 后 snapshot。closeout 不得夹带 `next_candidate` 或下一轮实施方向。

结构化输出不足时不得补造可写回 delta。Case 关闭必须有可解释的 Project impact 或明确 no-change closure。No-change closure 只用于重复、无效、过期、不再需要、合并、放弃或外部转移。

## Desktop 控制态

Desktop 只穷举可恢复控制态，不穷举业务路径：`no_context`、`running`、`interrupted`、`human_gate_required`、`agent_resumable`、`external_wait`、`blocked`、`failed_or_invalid`、`ledger_writeback_ready`、`ledger_writeback_blocked`、`ledger_written`、`context_compacting` 与 `committing`。

主动作只表达控制操作，如 Run、Respond、Resume、Resolve、Write Ledger 或 Diagnose。Desktop 不根据关键词决定业务下一步；用户补充交给同一 Agent结合 fresh state 解释。

readiness 必须在远端 claim 前完成。只有 ledger 写回成功后才能自动发起下一 turn，避免读取旧 Case revision。运行结果持久化语义快照，不保存逐 token/reasoning/command delta 的重复副本。

## 验收口径

- 人类直接在 Codex 中与 Runtime 自动执行使用同一 trusted snapshot、Case transition、round closeout 和 post-commit fresh-read 协议。
- 每轮在执行前可见地比较 persisted 与 fresh candidates；选择轨迹可解释关心的候选为何 selected、deferred 或 excluded。
- writeback candidate 不能充当 fresh state；下一轮必须持有验证过 `observed_after_commit=true` 的 snapshot receipt。
- 上一轮 transition 只能持久化结果 Gap，不得用复合步骤 Gap 预先约束下一轮实施路径；closeout 不携带 next candidate。
- selected gap 建立一个有界 acceptance claim，可包含能够共同决定的相关子结论；重要取舍或关键未知独立处理，执行中新事实不授权跨越决策边界或切换 Gap。
- 每轮用 Project software invariants 与 fresh Case facts 动态发现显式判断；新增、变化、缺失、过时、歧义和冲突都可能使长期事实相关，实际相关判断必须有匹配其证据责任的结论或 Gap，且可以因后续 facts 重新打开。
- 默认每个 gap 只有一次连贯 Agent invocation，不强制 Plan/Worker/Review 三段调用。
- 同一待办全流程只使用一个持久 Codex thread；进程重启恢复该 thread，验证、修复、压缩和 Git commit 不切换 thread。
- Agent 可按原生机制使用已安装 skills/tools，Runtime 不维护默认 definition/diagnosis 白名单。
- Runtime 只替代人类自动化动作，不做语义微编排或二次业务审查。
- readiness 失败时远端任务仍保持未领取。
- 只有人类责任暂停自动执行；external wait 与 no-progress recovery 独立表达。
- 生产性 Loop、总墙钟和长命令没有完成上限。
- 上下文占用达到 80% 时在同一 thread 压缩完成后继续下一 gap。
- trusted ledger 是 Project/Case/iteration 状态的唯一写回入口。

### Gap 选择行为验收

| 场景 | 必须表现 |
|---|---|
| 点击无效，直接原因未知 | 先以证据定位直接原因，完成后重新选择；不将预期方向分类当成诊断结果。 |
| 原因已有证据，相关预期有效，仅实现错误 | 直接选择修复与验证，不制造需求、交互或重复诊断轮次。 |
| 产品决定依赖未证实的技术能力 | 必须先取证；探索成功后仍保留正式预期决定，不能直接宣称功能交付。 |
| 一个归档行为的规则、入口、反馈均无重要独立取舍 | 可合并为一个预期 Gap；正式实现另选一轮，不按小项机械拆分。 |
| 其中权限规则涉及关键取舍 | 单独处理权限问题，取得结论后再决定其余工作。 |
| A 预期齐备，B 有独立预期缺口 | A 实现和 B 预期均可比较；不能以全 Case 文档未齐为由阻止 A。 |
| A、B 依赖未定共享契约 | 依赖该契约的正式实现不具备选择资格，先处理契约或其证据前置。 |
| 实现时出现推翻预期的新证据 | 保留实现证据，重审受影响预期，不能同轮修改预期并完成正式实现。 |
| 项目维护 skill，需通过试跑确认引导是否有效 | 识别技能文本为实现载体；试跑验收探索结论，正式修改与行为验收依据已接受预期。 |
| 局部完成或只授权探索 | 结论不外推到整个 Case；保留其余义务并按授权范围判断完成。 |
| 一个小任务只剩已明确的有界修复 | 允许一个普通 Gap 完成后进入必要复审；不因范围等于 Case 而人为拆分。 |
| 产品或交互方案缺少关键依据，使用候选方案或原型取证 | 探索由证据缺口触发，不限于写代码；候选和模拟结果不自动成为正式预期或生产行为证据。 |
| 实验有证据证明不可行，或实验未回答问题 | 前者可以完成探索 Gap；后者保留未决与已有证据，不把“试过了”当作完成。 |
| 当前已有多个必要缺口及共享前置 | 完整记录真实依赖后动态比较，不预排未知工作，也不故意逐轮才披露已知义务。 |
| Agent 在已有授权内确定预期 | 当轮维护权威事实源，不新增人工确认关卡；正式实现另轮选择。 |
| 实现中的常规测试失败与独立因果问题 | 为证明当前结果的排障可继续；重要独立原因未知或关键前提失效时保存证据并重选，不能仅按报错或执行阶段分界。 |
| 接口完成后可联调，或在既定约束内调整批次 | 同一验收内继续；不把动作依赖首次就绪误当成另一个独立结果获得资格。 |
