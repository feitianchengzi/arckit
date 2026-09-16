# 项目事情台实现与验证

日期：2026-09-16。范围：CASE-20260915-001；最终原型 project-workbench-v2。

## 已实现

- 独立生产事情台成为默认入口，11 个旧页面通过“全部页面”二级菜单访问；原业务页面保留。
- 左项目范围、右侧单行事情列表、中央四类详情、按需中央消息弹层、底部创建与逐事情输入；运行状态支持跨项目定位。
- 真实任务/附件服务、账号隔离且持久的场景状态、同事情主 session/thread、Chat 与 Auto 串行互斥、显式单事情 Auto 请求。
- Agent 场景工具与业务能力目录复用原协调器；Run 通过本机短期授权工具桥接入，令牌绑定账号/事情/工作区并在结束后撤销。
- 不引用交互原型的数据或脚本；文件成果打开时检查实际路径并计算实际版本。

完整细节见 [acceptance-matrix.md](acceptance-matrix.md)。

## 执行结果

| 验证 | 结果 | 范围 |
|---|---|---|
| `node runtime/arcorbit/scripts/run-tests.mjs` | 789 项：758 通过、31 跳过、0 失败 | ArcOrbit 全量套件；新增 UI 末次微调前执行 |
| `node --test test/project-workbench.test.mjs test/chat-coordinator.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs` | 168 通过、0 失败 | 后续属性、账号/线程及刷新改动回归 |
| `node --test test/project-workbench.test.mjs` | 13 通过、0 失败 | 最后工具与附件作用域变更后复测 |
| `./node_modules/.bin/electron test/fixtures/project-workbench-electron.mjs --evidence ../../arckit/cases/evidence/CASE-20260915-001` | 11 组行为检查通过；Renderer 错误 0 | 生产 Renderer，隔离 IPC 数据；1440/1000/760/390 均无横向溢出 |
| `node runtime/arcorbit/scripts/check-syntax.mjs` | 通过 | JavaScript 语法 |

后面三个测试命令工作目录为 `runtime/arcorbit`，语法检查工作目录为仓库根。全量测试的 31 项跳过按既有测试条件处理，不声称这些路径已运行。

GUI 证据：[检查结果](electron-verification.json)、[详情](workbench-overview.png)、[消息](workbench-messages.png)、[窄窗口](workbench-mobile.png)。

## 证据边界

自动化覆盖真实本地持久化、版本冲突、幂等、账号分区、任务主线程复用、同事情互斥、工具桥 HTTP 授权、实际临时文件路径边界、场景与软件命令分发。GUI 使用真实生产页面及脚本，业务 IPC 使用可控测试记录。未以用户身份创建远端正式事情、发送对外消息或运行计费 Codex 执行，不把这些依赖的线上可用性算作已验证。

场景计划/标准/约定/草稿为此账号此设备的状态；共享任务与资料仍来自 Workshop。语音入口保留并禁用。任务删除及跨项目替换保持旧入口，不授权 Agent 改变在执行事情的身份。未重新打包、安装覆盖或发布。

## 补修后的最终全量结果

`node runtime/arcorbit/scripts/run-tests.mjs`：**803 项，772 通过、31 跳过、0 失败**。此次全量运行包含两项完成审查补修，以及同一工作区当时的其他已存在改动；不将测试总数解读为新事情台独占用例数量。最终 JavaScript 语法检查与 `git diff --check` 通过。

## 完成审查补修

审查 1 发现退出请求授权和既有线程动态工具注册两项边界，分别完成修复及独立账本回合。退出授权回归 72 项通过；线程工具修复回归 57 项通过，并通过本机 Codex 真实恢复/发现/调用协议验证（模型 turn 为 0）。详见 [补修 1](review-fix-1.md)、[补修 2](review-fix-2.md) 和 [原生协议回执](native-mcp-verification.json)。

## 文档维护结果

- document_scope: created `arckit/spec/agentic-software-development/arcorbit-project-workbench.md`、`arckit/interaction/project-workbench/interaction.md`、`arckit/interaction/project-workbench/default.html`、`arckit/tech/arcorbit/project-workbench-solution.md`；更新各域 INDEX 与关系映射。
- fact_result: 用户认可的最终原型、旧入口保留要求、场景状态所有权及同事情主线程约束已形成可恢复的规格、交互与技术事实；逐项实现与验证边界记录在本目录。
