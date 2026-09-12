# Engineering 场景技能管理

状态：✅ 已实现

## 目标与范围

Engineering 是本机全局的场景技能配置中心，首版管理 Chat 和 Automation；配置不写项目，不修改 Project/Case 模型，不为 Gap 预绑定技能。用户可从内置、用户级、项目级、on-demand catalog 和显式选择的本地目录选择技能。

## 存储与身份

内置技能通过 ArcForge 原有的来源、availability plan、catalog v2 和 applied source 关系管理。`catalog-only` 将文件安装到统一用户目录 `stateRoot/catalog/<skillName>/`，共享资源与技能平级。索引位于 `catalog/index.json`，保留来源、版本与内容校验证据；不再新增 consumers 或 versions 安装层。来源的 user-ambient、project-ambient、user-on-demand 是默认推荐，场景配置决定实际发现方式。

环境检查只验证资源并获取 Provider 计划，不安装、更新或修改安装关系。首次安装、内容更新、缺少管理登记均展示名称、来源、目标、来源类型和内容版本，包含 on-demand；无需变更的项目也可见。用户确认当前计划摘要后才执行安装与更新。安装确认不包含清理授权。内容漂移和来源冲突保留原文件并显示原因，禁止自动覆盖。首次未安装或待确认更新时，新运行不可使用尚未验证的新 catalog；安装、更新和清理不查询或受 Chat / Automation 活动状态阻断。新技能何时被采用属于使用侧：不主动修改运行中的绑定，后续 Chat 轮次或 Automation Run 重新解析；旧绑定加载已变更内容时在使用环节要求重新解析，不将其作为环境安装失败。

CLI 的 catalog list/resolve 默认查询同一用户 catalog，隔离测试可显式指定 stateRoot；Provider 和应用不得维护第二份安装状态。Engineering 场景选择与 revision 独立持久化，升级保持显式用户选择。

## 场景集合

每个场景对 catalog 技能配置三种方式：直接发现、按需使用、禁用。直接发现的精确目录进入 Agent 清单；按需技能不加入原生发现目录，仅在用户显式调用或宿主程序显式配置 arcforge-on-demand 调用后查询并加载；禁用技能不出现在该场景的按需候选中，也不能通过该入口 exact resolve。

Automation 默认直接发现来源推荐为 user-ambient 的开发技能；project-ambient 技能按需可用，由明确场景配置决定直接发现，不按技术栈词表自动启用。来源推荐为 user-on-demand 的 Feedback、OSS、Git 分支、intake、pending 默认按需。Chat 默认仅直接发现 arcforge-on-demand，其他内置技能按需。用户原生技能保持已有可用性，显式配置只影响 ArcOrbit 场景。

arcforge-on-demand 来自 ArcForge Provider，作为独立来源列入安装更新清单并登记在统一 catalog。它默认直接可发现，可被禁用，但不能配置成按需加载自身。入口仅接受用户显式调用或宿主程序在特定场景显式配置的调用；Agent 不得因判断任务缺少能力而自主触发。直接可发现和按需范围配置都不等于调用授权。按需加载不安装或更新文件。

核心包 `arckit-state-driven-loop` 在 Automation 固定启用，禁止替换。Chat 允许独立开关；单包同时提供 Agent 协议与可信 Ledger。升级时沿用旧版 Loop 的 Chat 开关；新开关已存在时以新配置为准。旧入口在当前场景中禁用，用户文件保留，既有清理流程仍须独立确认来源归属。所有场景拒绝第三方同名核心覆盖，后端独立校验。普通技能替换是原子地关闭当前绑定并选择另一个技能，不修改技能正文，不要求新技能冒用原名称。

## 生效与执行

场景集合在 Codex 进程创建前解析，显式绝对路径用于原生发现。Automation 在运行开始时冻结配置，续轮、修复、压缩与 Git closeout 使用同一配置；重新运行读取新配置。Chat 在下一条消息边界重新解析配置，必要时重建 app-server 并恢复同一 thread。关闭技能不能删除 thread 历史，页面说明全新上下文需要新会话。

Runtime 仍只驱动同一个 Agent thread，Agent 选择 Gap 后自行使用技能。Engineering 不提供语义能力打分，不编码技能到 Gap 的映射。Chat 可通过用户指令运行 arckit-state-driven-loop Loop，不自动转入 Automation 调度或创建执行租约。

## 交互

Engineering 以 Chat / Automation 场景切换、来源与搜索过滤、技能卡片、使用方式选择、替换操作、本地目录导入、恢复默认组成。展示实际来源、路径、启用状态、缺失/冲突错误和核心保护。保存采用 revision 防并发覆盖。Chat 输入框附近的技能入口显示当前场景摘要，进入 Engineering 的 Chat 页；返回保留草稿与会话。

## 旧项目副本清理确认

环境检查先通过 ArcForge 生成安装更新计划，再通过 Provider 生成已绑定项目 `.codex/skills` 的清理计划。检查只生成计划，不安装、不更新、不删除文件。安装验证完成之前不开放删除执行。页面默认展开待删除完整路径和原因，用户勾选已查看清单后点击确认删除，才将计划摘要与显式确认提交给 Provider。执行前重算计划摘要和内容证据；计划变化时拒绝删除，要求重新检查与确认。删除不创建备份。用户可暂不清理并继续使用。没有旧关系记录时，只接受与可信随包技能完整内容摘要一致的副本；名称、前缀或 description 相同不是删除证据。

受管理但已修改或缺少可验证基线的副本保留。第三方、归属冲突、链接目录及包内链接均保留并报告；共享 loader 不按名称清理。旧版本已退役技能可用历史安装关系中的内容摘要确认；无可靠历史证据时保留，不猜测归属。

ArcForge 负责读取与更新历史安装关系，并在显式 stateRoot 的 migrations 目录保存结果；ArcOrbit 只展示清理、保留和错误。迁移幂等，关系更新失败后可重试修复，不重新安装项目技能，不删除用户级技能。

## 验收

- 页面开关、替换、本地导入、重启恢复与 Chat 跳转真实生效。
- Chat 默认只直接发现按需入口、其他技能按配置加载；Automation 核心无法通过 UI 或直接请求替换。
- Codex 首次启动/恢复设置 roots；配置切换不污染另一个消费者；同名旧副本不覆盖受保护核心。
- 活动 Automation 配置稳定，Chat 消息边界生效，不写全局 Codex 配置。
- 项目关联技能先展示清单、明确确认后清理、无备份；第三方和归属不明技能保留；重复检查无副作用。

旧 consumer/version 目录只对安装关系记录过且完整包内容未变的目标生成清理清单；替代安装成功后单独确认。没有可靠证据或仍有安装关系引用的目标保留。清理只删除清单中的具体技能/资源目录，不递归清空版本根目录。
