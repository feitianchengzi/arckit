# Interaction Feature Matrix

| Page | Status | Core task | Projected states |
|---|---|---|---|
| `login/` | ✅ | 启动时恢复 Workshop 会话；未登录时通过不可绕过的验证码门禁建立当前用户项目来源 | 会话恢复、未登录入口、验证码已发送、登录失败 |
| `setup-readiness/` | ✅ | 先校验全局受信资源，在无默认选择和无凭证管理的边界内恢复 Codex standalone 安装/更新与官方认证，再以可见项目写入摘要引导 skills 安装 | 全局检查、Codex 缺失/安装/更新、两级认证选择、官方登录与 status 复核、外部安装/活动任务阻断、项目安装计划、managed-stale 清理、执行中、项目已准备、升级迁移、阻塞恢复 |
| `platform-workspace/` | ✅ | 通过四组主导航连接个人协作、产品全生命周期和组织能力，并让 Organization Project Detail 与 Feedback 承载各自真实处理行为 | Personal/Product/Product Lifecycle/Organization 导航、Workset 多选、组织概览、项目连接缺口、Feedback 主工作台与窄窗口收敛、转待办与仅重试关联、有限范围与部分失败 |
| `today-workspace/` | 🟡 | 复用真实主导航，以项目栏、需要你处理/项目配置和来源操作台承载多项目执行前置与明确人工责任 | 当前查看范围内成员列表、局部选择不回写顶部、点击初始化及失败重试、多项目并行配置、目录/Setup/本机 participation、Chat 权限、Automation 明确人工决定与执行恢复分离、Work 内容纠偏 Sheet 与服务器确认、编辑失败保留草稿/选择/阅读上下文、Work 评审/验收、验收问题原位直显与进展、跨对象部分成功、即时确认后移出、来源未知 |
| `chat-workspace/` | ✅ | 原 Chat 完整页面整合 Agent 原生待办能力：仅会话列表与待办双向关联能力，会话创建时间倒序、待办列表及筛选保留在 Work，当前项目整理/创建/读写/执行，统一能力/Skill 与文件/待办引用 | 保留项目分组、历史、Model/Level、大小调整、账户、权限与恢复；新增来源/对应关系、/ 与 @、草稿标签、原生回执、版本冲突、占用、失权、失败重试、停止、暗色与窄窗；verification.json + verification-native.json 仅证明本地原型 |
| `idea-workspace/` | ✅ | 探索和讨论产品创意，比较问题、用户、证据与风险，并在确认后预览正式项目转换 | 探索中、讨论中、已确认、团队观点、开始项目预览 |
| `release-workspace/` | ✅ | 已有工作区的终端、Git、源码、任务与共享 Agent | 多项目范围、真实执行、冲突、过期写入、缺少工具、恢复 |
| `operations-workspace/` | ✅ | 组织对外市场动作、渠道内容和效果信号，并把发现回流到产品生命周期 | 待发布、进行中、已复盘、示意信号、Idea/Work/Feedback 回流 |
| `engineering-profile/` | ✅ | 选择、编辑、比较和应用由 State Model、Capability Mapping 与 Lifecycle Mapping 组成的 Domain Profile | Profile Library、草稿编辑、跨行业比较、兼容性检查、Apply 确认、稳定 Loop Kernel |
| `product-feedback-center/` | ✅ | 在 ArcOrbit 内向固定 Project 107 提交反馈、查看当前账户反馈并感知未读变化 | 未读角标、SDK 加载、提交反馈、我的反馈、需要登录、SDK 失败恢复 |
| `automation-workspace/` | ✅ | 登录后只消费 Work 发布的本地待办状态，以本地 workspace lane 串行仲裁普通待办与验收问题，并在最多 3 条独立 lane 间并行；账号设置分别维护 Chat 与 Automation 的 Codex 默认值 | Chat/Automation 两组 Model/Level、Automation Run 配置固定、Work 同步健康摘要、资格原因引导、双队列总览、活动执行选择、槽位容量、lane 串行、跨 workspace 并行、问题等待/运行/待人工/阻塞、external dependency 人工介入与同 thread 恢复、项目范围切换、CLI 接管、人工介入、外部等待、执行停止、完成续接、Work 动作失败、领取冲突与用量诊断 |
| `task-browser/` | ✅ | 在 Work 的单行控制轨中组合本地查询，并用 Work-owned 同步和任务树/可持久调宽 Inspector 完成分区详情、评论附件、产品限定维护、编辑七状态兜底及引导式状态动作；Automation 只消费确认结果 | 本地查询、Work Sync、单行控制轨与窄窗口收敛、多维筛选、任务树、Inspector 440px 默认/拖拽/键盘/跨重启恢复、内容/紧凑属性/协作/验收分区、评论附件、新建/编辑七状态 Picker、新建执行人 Automation 资格提示、Inspector 下一步动作、待评审/执行人/项目连接引导、标签生命周期、运行/验收查看、外部状态恢复、空态与冲突 |

| Product / Idea / Today 续接 | ✅ | 产品目录与详情、空白/材料接入、双区协作、显式状态、Git 共享冲突与来源恢复。 |

Release 本地交付工作台：产品源为 arckit/spec/agentic-software-development/arcorbit-release-workspace.md，技术源为 arckit/tech/arcorbit/release-workspace-solution.md，页面源为 arckit/interaction/release-workspace/interaction.md。复用已有项目绑定与 Chat/Idea 基础层。

| `project-workbench/` | ✅ | V2 已采纳为完整正式原型，消费 visual light 橙色强调；覆盖资料、成果、可变安排、消息与草稿连续性、运行概况、Thing 独立入口、四组业务导航与完整个人中心、异常恢复与窄窗；已移除全局项目列表及资源入口。验证见 verification*.json；不代表生产实现通过。 |

浅杏橙已采纳：#F4B77D 主操作、无深橙装饰描边、中性链接与选中文字；正式 project-workbench 消费共享 Token 和对应样式。来源：arckit/visual/_explorations/orange-tone/exploration.md。

无标题栏主窗口：interaction/CONVENTIONS.md、visual/_library/brief.md 及 AppShell、tech/arcorbit/solution.md 共同定义独立窗口控件、局部避让和全局顶部同步时间戳。生产无标题栏与顶部同步投影已更新；实现及验证范围见 arckit/cases/evidence/CASE-20260917-003/implementation-verification.json，Windows/Linux 原生执行与 macOS 原生悬停面板未人工验证。历史页面线框中的标题栏不作为当前窗口外壳验收依据。

| 全局顶部上下文 | ✅ | 所有主入口统一产品集与范围、同步、运行控制、反馈与设置；Chat/Thing/Product 对象和草稿恢复、空范围、窄窗菜单 | `_shared/verify-global-context.cjs` 实际原型验证；专项旧状态图不作为全局壳验证 |

- 本机外观：CONVENTIONS.md → _shared/appearance.js 与 project-workbench/account-settings.js；共享设置消费者加载统一主题模拟。颜色来源为 visual/themes/light.yaml、dark.yaml。生产接入与旧页面全部状态的暗色覆盖尚未验证。
