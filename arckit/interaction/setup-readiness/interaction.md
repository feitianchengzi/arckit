# Setup Readiness 交互

## 页面定位

Setup Readiness 是 Desktop 在 Runtime task、Workshop 登录和项目队列之前呈现的本机能力准备页面。它只在受信资源、Codex 或 Arckit skills 尚未达到可运行状态时成为主路由；全部检查通过后，应用继续进入 Login 或 Automation Workspace。

页面不承担 GitHub 出包、ArcForge 治理编辑或 Runtime task 执行。它只展示当前安装包锁定的资源、目标目录、plan/drift、需要的确认和可恢复结果。

## 交互策略

### 核心任务

用户确认应用将如何准备完整 Arckit Runtime 环境，并在不静默覆盖已有 Agent 资产的前提下完成安装、修复或升级。

### 主路径

1. 应用启动后自动校验 distribution lock、trusted resources、ArcForge provider、skill payload、Codex 和既有关系。
2. 环境已经 ready 时显示短暂成功结果并自动继续。
3. 需要安装或升级时，页面展示来源、版本、目标、availability 分类和 drift 摘要。
4. 用户展开 changed、uncertain、managed-stale 和计划写入路径，确认 fresh plan。
5. 系统执行事务化 apply，持续展示目录、catalog、关系和 discoverability 阶段。
6. post-drift 与 Codex probe 成功后，页面开放“继续使用 Arckit”。

### 决策点

- 用户可以确认当前 fresh plan、返回检查详情，或退出应用；不存在跳过必须能力并启动 Runtime 的路径。
- 同名未受管理目录、changed managed skill 或 source upgrade 前的旧目标 drift 会进入冲突状态，不能使用普通确认继续。
- `managed-stale` 清理使用独立 confirmation，不和普通 apply 捆绑。
- project-ambient skills 不在本页面首次安装；添加具体项目后由项目上下文触发单独 plan。
- 签名或系统信任问题只提供平台恢复入口，不把“忽略风险”伪装成 ready。

### 信息揭示

默认摘要显示当前 Runtime 版本、Arckit payload、ArcForge provider、Codex 状态、Arckit skill 总数、user-ambient/user-on-demand/project-ambient deferred 分类数量、独立的 ArcForge loader target 数和整体 readiness。Arckit skill 总数不包含 loader，user-on-demand 不与 user-ambient 合并为“用户 skills”。用户展开详情后才显示绝对目标目录、逐 skill availability、文件 drift 和关系记录位置。

secret、私钥、完整环境变量、Codex credential 和 GitHub token 永不进入页面。签名信息只显示公开证书身份、签名状态和公证状态。

### 状态流

```text
checking
  -> ready -> continue
  -> needs-install -> review-plan -> applying -> ready
  -> drifted -> review-plan/repair -> applying -> ready
  -> conflict -> inspect -> user resolves/explicit cleanup -> recheck
  -> blocked -> recover/retry -> checking
```

plan 展示后如果 source、target、policy、关系或内容 digest 改变，确认失效并返回 `checking`。apply 不接受旧 plan digest。

### 反馈机制

- 检查阶段逐项显示 pending、passed 或 failed，不用单一无限 loading 覆盖所有工作。
- plan 阶段将“将新增”“将更新”“不会处理”和“需单独确认清理”分开。
- 执行阶段显示事务阶段和最近完成项，不展示 provider 原始 JSON。
- 完成结果明确区分 resources 校验、skills post-drift 和 Codex discoverability。
- 错误保留稳定 code、用户可理解摘要、受影响路径和恢复动作；详细诊断可以复制。

### 异常恢复

- bundled resource digest 失败：禁用 apply，提供重新安装当前应用的说明。
- Codex 不可用：提供重新检测和 Codex 安装/登录入口，保留 Arckit plan。
- 目标无权限：显示精确目录，用户修复权限后重新检查。
- provider apply 失败且回滚完整：显示未发生持久变更并允许重试。
- provider apply 回滚不完整：列出残留路径，禁止继续 Runtime，提供复制诊断。
- source upgrade 前发现旧目标 drift：保留旧 source，不切换 payload，进入冲突检查。
- App 离线：bundled payload 仍可安装；不把网络失败当作首次安装阻塞。

### 输入输出边界

输入包括 distribution lock 校验结果、provider inspect、source state、plan、drift、Codex probe 和用户确认。页面不接受用户手输任意 source、target 或 shell 命令。

输出包括被确认的 plan digest、单独 cleanup confirmation、retry、打开平台恢复入口、复制诊断和继续路由。文件写入只由 Electron main process 的 SkillProvisioningManager 执行。

## 页面状态

### 正在检查

- 页面进入后立即开始，不要求用户先点击。
- “继续”禁用；“退出”可用。
- 每个检查项有独立状态和失败摘要。
- 检查结束后原位进入 ready、plan、conflict 或 blocked。

### 安装计划

- 顶部显示 Runtime、Arckit payload、ArcForge provider 和 release intent tag。
- 中部按 user-ambient、user-on-demand、project-ambient deferred 分组。
- 摘要先显示 Arckit payload 总数及各 availability 数量，ArcForge on-demand loader 作为独立 target 显示，不计入 Arckit skill 数。
- 目标摘要显示新增、same、changed、managed-stale、uncertain 数量。
- 用户必须打开写入目标摘要后才能启用“安装并继续”。
- 确认动作携带 plan digest；页面显示确认后的写入边界。

### 执行中

- 页面锁定返回和重复提交动作。
- 阶段顺序为 source staging、target directories、catalog、relationship、post-drift、Codex probe。
- 应用退出请求先交给 main process 完成当前事务或回滚。
- 执行结果到达前不把 Runtime 标记 ready。

### 已准备完成

- 显示全部关键检查为 passed。
- 显示已安装 user-ambient 数、catalog 中 user-on-demand 数、deferred project-ambient 数和独立 ArcForge loader target 数；四项之和不得作为 Arckit skill 总数。
- 首次启动由用户点击继续；普通启动可以在短暂停留后自动路由。
- 用户可以打开安装详情，但不能在完成页面直接删除 skills。

### 冲突检查

- changed managed targets、同名 uncertain 目录和 managed-stale 分组显示。
- changed target 提供查看文件 diff 和保留本地内容入口。
- uncertain 目录不提供批量删除。
- managed-stale 需要逐路径选择和单独确认。
- 任何处理动作完成后重新生成 plan，不复用旧确认。

### 阻塞恢复

- 显示稳定错误 code、失败阶段、影响范围和是否已完整回滚。
- 可恢复错误提供“重新检查”；资源损坏提供“重新安装应用”。
- 缺少 Codex 登录提供外部登录入口，返回后自动重新 probe。
- 回滚不完整只提供诊断和人工修复说明，不开放继续按钮。

## 导航

- 应用启动且 Setup Readiness 非 ready：进入本页，隐藏 Login 和 Automation Workspace 的主操作。
- ready 且 Workshop 认证未知：进入 Login 会话恢复。
- ready 且 Workshop 会话有效：进入 Automation Workspace。
- 设置页的“Arckit 能力”入口可以再次打开本页的只读状态；选择修复后才进入可写 plan。
- Runtime task start 检测到 readiness 失效时返回本页，并保留原 task start intent，修复成功后重新执行 preflight，不自动领取远端任务。

## 确认与安全

- 安装、修复、升级 apply 使用一次确认，摘要包含 source、profile、目标、changed 和 plan digest。
- managed-stale 清理使用独立 ConfirmationDialog，列出每个绝对路径。
- 移除全部 Arckit managed skills 是设置页中的独立流程，不出现在首次安装主路径。
- 页面不提供“信任所有”“覆盖全部额外目录”或“删除未知 skills”。

## 加载与可访问性

- 检查与 apply 使用文本阶段、进度和图形三重表达，不只依赖颜色。
- 所有错误、目录和 digest 可复制；长路径允许换行和完整查看。
- 动作顺序保持稳定，键盘焦点在状态切换后进入新状态标题。
- ConfirmationDialog 的默认焦点是取消；破坏性 cleanup 明确逐路径说明。
