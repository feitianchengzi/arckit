# Arckit Monorepo 与私有运维边界

## 定位

Arckit 仓库是 Arckit 协作协议、ArcOrbit Desktop/Runtime、Workshop Todo 和 Workshop Feedback 的公开源码 monorepo。它保存可公开审查、构建、测试和自托管的通用产品源码，不保存生产环境秘密、客户专属交付物或只能由飞天橙子内部持有的基础设施事实。

与 Arckit 同级的 `arckit-ops` 是私有运维工作区。它保存环境部署清单、生产拓扑、加密秘密引用、本地未跟踪秘密和客户专属覆盖层。两个工作区通过公开的配置契约连接，不通过相对路径源码 import、Git submodule 或构建时隐式读取连接。

## 仓库职责

```text
arckit/                           public source monorepo
  entry/                          Arckit Controller skills
  definition/                     Arckit stable-fact skills
  engineering/                    Arckit engineering skills
  code/                           Arckit stack-specific skills
  memory/                         Arckit context skills
  delivery/                       Arckit delivery skills
  runtime/arcorbit/               ArcOrbit Desktop and Runtime
  apps/todo-web/                  Workshop Todo browser application
  apps/feedback-console/          Workshop Feedback developer console
  services/workshop-api/          shared Todo and Feedback Go service
  packages/feedback-sdk-web/      embeddable Feedback Web SDK
  examples/feedback-ios/          iOS integration example
  docs/workshop/                  cross-surface public documentation

arckit-ops/                       private operational workspace
  environments/                   environment-specific deployment inputs
  infrastructure/                 private infrastructure definitions
  customers/                      customer-specific overlays and adapters
  runbooks/                       private operational procedures
  secrets/                        ignored local material or encrypted payloads
```

Arckit 已有的 skill 与 ArcOrbit 路径保持不变。仓库合并不把 Arckit skills 移入嵌套 package，也不改变 Runtime 对 `entry/`、`definition/`、`engineering/`、`code/`、`memory/`、`delivery/` 和 `runtime/arcorbit/` 的相对路径约定。

## 源仓库映射

| 源 | 公开目标 | 保留内容 | 排除内容 |
|---|---|---|---|
| `hoewo/workshop-todo` | `services/workshop-api/` | Go service、数据库迁移、API 文档、测试、通用 Docker 与环境模板 | `.git`、本地 Agent 安装副本、编辑器状态、构建产物、真实环境文件、部署私密配置 |
| `hoewo/workshop-todo-website/frontend` | `apps/todo-web/` | 当前 Vite/React 应用、测试、公共资源、构建脚本和应用文档 | `dist`、缓存、本地环境文件 |
| `hoewo/workshop-todo-website/specs` 与仍有效的根文档 | `apps/todo-web/docs/` | 可恢复的产品、设计、契约和架构资料 | `.arckit` 旧投影、`.tools`、`.cursor`、`frontend-nextjs-backup`、临时诊断与本地交接材料 |
| `hoewo/Workshop-Feedbacks/webapps/feedback-console-web` | `apps/feedback-console/` | 当前 Feedback 管理控制台 | 构建产物、本地环境文件、复制的 server 参考 |
| `hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web` | `packages/feedback-sdk-web/` | SDK 源码、构建脚本、公开接入文档 | 构建产物、本地环境文件、部署账户配置 |
| `hoewo/Workshop-Feedbacks/Test/ios/TestFeedBack` | `examples/feedback-ios/` | iOS SDK 接入示例与测试客户端 | DerivedData、用户 Xcode 状态、签名文件、provisioning profiles |
| `hoewo/Workshop-Feedbacks/design` | `docs/workshop/feedback-design/` | 可公开且仍能解释 Feedback 产品的设计资料 | 客户素材、个人数据和本地导出产物 |

源仓库中的 README、脚本或文档如果引用旧仓库根路径，导入后的权威引用使用 monorepo 路径。旧仓库名只保留在来源说明和历史提交中。

## 历史与来源

导入历史保留源提交的 author、author date、commit message 和文件演进。每个源仓库通过独立的过滤分支映射到目标子目录，再与 Arckit 主历史合并。

历史导入满足以下约束：

- 只导入映射表中允许公开的路径。
- 禁止公开的文件从待导入的完整历史中过滤，而不只是在导入后的最新提交中删除。
- `frontend-nextjs-backup`、构建输出、缓存、`.DS_Store`、本地 Agent 安装副本和嵌套 Git 元数据不进入公开历史。
- 每个导入边界记录源 remote、源 commit、过滤规则和目标路径。
- 旧仓库在验证完成后进入只读归档；Arckit 成为唯一源码事实源。

提交历史保真不优先于秘密移除。发现真实凭据、个人数据、客户资料或第三方无再授权权利的内容时，该路径不进入公开历史，并形成来源审计记录。

## 许可模型

仓库采用目录优先的多许可证模型。距离文件最近的 `LICENSE` 和 package metadata 优先于仓库根许可证。

| 范围 | 许可证 | 定位 |
|---|---|---|
| Arckit skills、协议、schemas、trusted entrypoints、公共文档 | Apache License 2.0 | 可自由使用、修改和分发的协作协议层 |
| `packages/feedback-sdk-web/` | Apache License 2.0 | 面向第三方产品的低摩擦接入面 |
| `examples/feedback-ios/` | Apache License 2.0 | 可复制修改的公开接入示例 |
| `runtime/arcorbit/` | PolyForm Perimeter 1.0.1 | 源码可见的 ArcOrbit 产品与 Runtime |
| `apps/todo-web/` | PolyForm Perimeter 1.0.1 | 源码可见的 Todo 产品客户端 |
| `apps/feedback-console/` | PolyForm Perimeter 1.0.1 | 源码可见的 Feedback 管理产品 |
| `services/workshop-api/` | PolyForm Perimeter 1.0.1 | 源码可见的 Todo/Feedback 共享产品服务 |
| `arckit-ops/` | 未公开、保留全部权利 | 私有运维与客户交付工作区 |

PolyForm Perimeter 范围使用“源码可见”或 `source-available` 描述，不使用“开源组件”描述。仓库整体描述为“包含开源组件与源码可见产品组件的公开源码 monorepo”。

每个受目录许可证约束的应用、服务和 package 都包含本地 `LICENSE`，并在支持 license metadata 的 manifest 中声明 SPDX identifier 或 `SEE LICENSE IN LICENSE`。根 `LICENSING.md` 和中文许可说明列出完整矩阵；分发物携带对应许可证和第三方声明。

## 公开配置契约

公开仓库保留能够让贡献者完成本地开发和自托管的通用配置：

- Dockerfile、通用 Compose 文件和可复现构建脚本；
- 只包含占位值和说明的 `*.example`、`*.template`；
- 环境变量名称、类型、是否必需、验证规则和失败行为；
- 数据库迁移、开发种子数据和本地 mock；
- 不含真实账户、域名、拓扑或凭据的部署文档。

示例值不得被生产环境接受为安全默认值。应用在生产模式遇到示例签名密钥、示例共享秘密或缺失的必需配置时 fail closed。

## 私有运维边界

以下材料只存在于 `arckit-ops` 或外部 secrets manager：

- 真实数据库、OSS、网关、邮件、监控、代码签名和发布凭据；
- 正式域名、主机清单、网络拓扑、防火墙规则和生产账户标识；
- 环境专属 Compose override、Kubernetes values、Terraform state 或等价配置；
- 备份恢复细节、内部告警接收方、事故材料和安全处置手册；
- 客户名称、客户数据、客户品牌资产、客户专属业务规则和内部系统适配器；
- 商业授权文件、签名证书、provisioning profile 和未公开发布材料。

`arckit-ops/secrets/` 默认整体被 Git 忽略。需要版本管理的秘密只保存加密载荷或 secrets manager reference，不提交明文。私有仓库本身不构成明文秘密保护措施。

Arckit 代码不依赖 `../arckit-ops` 才能构建或运行测试。生产部署工具可以显式接受 ops 路径、加密配置或 secrets manager identity，但必须由操作者指定并验证，不能在公开代码中硬编码同级目录。

## 安全门禁

公开导入在接受前满足：

- 对当前文件树和待导入历史执行 secret scan；
- 对证书、环境文件、移动签名材料、客户命名和生产 endpoint 执行路径与内容审计；
- 所有公开环境文件均为无效占位模板；
- `.gitignore` 覆盖依赖、构建、缓存、真实环境文件和本地秘密；
- 公开 CI 验证没有运行时步骤读取 `../arckit-ops`；
- 许可证矩阵、package metadata 和分发第三方声明一致；
- Go service、三个 Web workspace、ArcOrbit 与 iOS 示例分别具有可执行的最小验证入口。

任何扫描命中都先按内容所有权分类。真实秘密执行撤销或轮换后才算处置完成；仅删除工作树文件不构成秘密处置。

## Workspace 与构建边界

JavaScript workspace 使用一个根级 package manager lockfile 管理 ArcOrbit、Todo Web、Feedback Console 和 Feedback SDK。各应用保留独立 build/test/lint 入口，根命令只负责编排，不把不同发布物合成单一版本。

`services/workshop-api/` 保持独立 Go module，由根级任务编排调用 `go test ./...`。Go module 不嵌入 JavaScript workspace。

公共 package 只在至少两个当前消费者已经共享稳定契约时建立。迁移不以抽取通用 UI、API client 或设计 token 为前置条件；目录合并后仍允许应用先保持内部实现边界。

CI 根据受影响路径选择验证集合，同时保留能够验证全部 workspace 的集成入口。Todo、Feedback、SDK、ArcOrbit 和 Workshop API 分别发布，monorepo commit 是跨组件兼容性的唯一源码快照。

## 权威性与归档

合并完成后：

- Arckit 是通用源码、许可、公共配置契约和跨组件兼容性的唯一权威仓库。
- `arckit-ops` 是私有环境与客户交付事实源，不反向定义公共产品行为。
- 原 Todo、Todo Website 和 Feedbacks 仓库只保留迁移说明、目标 commit 和只读历史，不接受新的产品提交。
- 公共 issue、pull request 和发布说明指向 Arckit 中对应 app、service 或 package 路径。
