---
name: oss-controlled-image-access
description: 引导实现阿里云 OSS 图片资源可控访问的执行型 skill。适用于用户要从公开 OSS 图片直链迁移到服务端可控访问、稳定图片网关 URL、服务端生成短时 OSS GET 签名 URL、客户端/分享页加载适配、RAM 权限与部署配置、人类云控制台协作、先跑通流程后再把 Bucket 改私有、单仓多角色或多仓协作，或后续再升级 CDN 的场景。不适用于纯粹询问 OSS/CDN 价格、只做一般安全科普、或已经明确只要阿里云控制台手工操作且不涉及项目接入的任务。
---

# OSS 图片可控访问

本 skill 用来引导 agent 和人类一起完成 OSS 图片可控访问接入。它不是方案说明书；进入后必须按阶段推进：先识别当前仓库能做什么，agent 能做的直接做，agent 做不到的云资源、密钥和发布切换动作交给人类，并给出清晰操作说明。

## 硬约束

- 初版默认不接 CDN：使用“稳定图片网关 URL -> 服务端生成短时 OSS GET 签名 URL -> 302 跳转 -> OSS 返回图片”。
- 第一阶段不要先改 Bucket 私有；先在现有权限下跑通服务端、客户端和分享页链路，最后再由人类把 Bucket ACL 改为私有并验收。
- 不能把“本地代码已改完”说成“线上链路已完成”。必须区分本地实现、镜像/部署、入口网关、公网域名、客户端展示和 Bucket 私有化。
- 公网验证前必须确认域名解析指向、入口机、反向代理/网关、入口机到后端的网络连通；不能只在后端服务器 `127.0.0.1` 验证后就要求用户私有化 Bucket。
- 客户端不能持有阿里云长期 AccessKey，也不能自行生成 OSS 签名。
- 客户端迁移不能只验证一条图片网关 URL。必须检查业务接口返回字段、前端 URL 归一化函数、图片组件、缓存/预加载、分享页元数据和构建环境变量，防止客户端继续拼公开 OSS/CDN base URL 或缓存短时签名 URL。
- RAM 身份模式必须先确认：RAM 用户 AccessKey 是快速跑通方式；ECS RAM 角色是推荐生产方式；ACK、函数计算、非阿里云服务器或本地 Docker 需要单独适配，不能假装 ECS metadata 一定可用。
- 不要求用户在聊天中发送 `AccessKeySecret`、STS token 或完整签名 URL。让用户把密钥放进环境变量、Secret Manager、CI/CD secret、部署平台 secret 或本机 `.env`。
- 给用户 env 配置时必须标注哪些值可原样使用、哪些是项目契约默认值、哪些必须替换；不要把模板值当成真实配置。
- 验证 API 时不要默认使用 `curl -I`；`-I` 是 HEAD 请求，可能被网关或后端返回 404。需要 GET 响应头时使用 `curl -sS -D - -o /dev/null "URL"`。
- 当前仓库角色是集合，不是单选；一个仓库可以同时包含服务端、客户端、分享页、运维配置和文档。
- 缺少某个角色代码时，不要假装完成全流程；输出跨仓交接清单。
- 如果当前环境提供安全 UI、表单、确认页、`request_user_input`、Workshop Desktop 或安全 secret store，优先用它收集非敏感选择或确认；敏感密钥只进入明确的安全 secret store。

## 主流程

### 0. 建立执行上下文

输入：用户请求、当前仓库、历史方案文档、已有实现线索。

动作：
- 读取 [references/scenarios-and-boundaries.md](references/scenarios-and-boundaries.md)，确认本轮真实场景、触发边界和不做事项。
- 用一句话向用户说明本 skill 会按“agent 可做事项 + 人类协作事项”推进。

退出条件：确认本轮是在执行 OSS 图片可控访问接入，而不是只做泛泛咨询。

### 1. 识别当前仓库角色

输入：当前工作目录。

动作：
- 扫描文件结构和关键词，识别当前仓库角色集合：`server-repo`、`client-repo`、`share-page-repo`、`ops-repo`、`docs-repo`、`unknown-or-empty`。
- 搜索关键词：`oss`、`aliyun`、`image`、`cover`、`avatar`、`share`、`og:image`、`upload`、`bucket`、`endpoint`、`VITE_OSS_PUBLIC_BASE_URL`、`OSS_PUBLIC_BASE_URL`、`cdn`。
- 读取最小必要文件确认路由入口、配置入口、图片 URL 生成入口、客户端图片使用入口或部署配置入口。
- 告诉用户识别出的角色集合和本轮能直接完成的范围。

退出条件：明确当前仓库角色集合；如果无法判断，按 `unknown-or-empty` 输出契约和交接清单。

### 2. 确认接入契约

输入：仓库角色、项目现有 URL、用户已知 OSS 信息。

动作：
- 读取 [references/execution-stages.md](references/execution-stages.md) 的“契约阶段”。
- 读取 [references/credential-modes.md](references/credential-modes.md)，确认凭证模式：`access_key`、`ecs_ram_role` 或待适配模式。
- 确认稳定图片网关 URL 形态、允许 object key 前缀、签名 URL TTL、凭证模式、迁移期如何处理已有 `http/https` 图片。
- 解释 object key 的来源：它是 Bucket 内路径，不是完整 OSS URL；给出 OSS 控制台、数据库字段或缓存结果三种查找方式。
- 如果缺少非敏感参数，直接问用户或用可用 UI 收集；如果缺少密钥，只要求用户配置到安全位置。

退出条件：形成可供服务端、客户端和运维共同使用的图片网关契约。

### 2.5 确认部署和入口拓扑

输入：仓库角色、部署目录、compose/脚本、域名、服务器或部署平台信息。

动作：
- 读取 [references/deployment-and-network-diagnosis.md](references/deployment-and-network-diagnosis.md)。
- 判断部署形态：源码构建、镜像包部署、CI/CD、托管平台或未知；不要在镜像包部署目录里使用 `--build`。
- 确认公网域名解析到哪台入口机，入口机由 Caddy、nginx、OpenResty、API Gateway、SLB/ALB/WAF/CDN 还是应用网关处理。
- 确认入口机到后端服务的网络路径：优先私网 IP；若临时走公网，安全组只放行必要来源。
- 输出部署链路图：`client -> public domain -> entry gateway -> core-service -> OSS`。

退出条件：知道本地改动如何发布到线上、线上入口在哪里、入口到后端是否需要网络/网关配置；无法确认时停止在部署 handoff，不进入 Bucket 私有化。

### 3. 推进当前仓库能做的实现

输入：角色集合和接入契约。

动作：
- 读取 [references/role-execution.md](references/role-execution.md)。
- 如果有 `server-repo`，先实现或修改服务端图片网关、OSS 签名服务、业务接口 URL 输出。
- 如果有 `client-repo` 或 `share-page-repo`，在服务端契约明确后验证或修改图片加载、分享页、`og:image`。
- 如果有 `ops-repo`，补环境变量模板、secret 配置说明、日志脱敏和最后私有化发布步骤。
- 如果只有 `docs-repo` 或 `unknown-or-empty`，只输出接口契约、角色待办和验收计划，不强行改代码。

退出条件：当前仓库能完成的代码、配置或文档改动已经完成；不能完成的事项已进入交接清单。

### 3.5 推进客户端和分享页迁移

输入：服务端图片网关契约、业务接口响应、客户端或分享页代码。

动作：
- 读取 [references/client-share-page-migration.md](references/client-share-page-migration.md)。
- 如果当前仓库包含 `client-repo` 或 `share-page-repo`，必须检查并改造 URL 消费逻辑、图片组件、缓存策略、分享元数据和构建配置。
- 如果当前仓库只有服务端，也必须输出客户端 handoff：哪些字段会变成稳定网关 URL、客户端必须删除哪些 OSS/CDN 拼接、如何验证 302 图片显示。
- 如果客户端依赖 Native、小程序、SSR、图片代理、预加载或 Service Worker，必须把 302、缓存和跨域行为列为实测项。

退出条件：客户端/分享页已完成最小迁移并有验证结果，或形成明确的跨仓客户端交接清单；未满足时不能进入 Bucket 私有化。

### 4. 人类协作门禁和线上部署

输入：实现过程中缺少的云资源、权限、密钥、发布操作或确认。

动作：
- 读取 [references/human-actions.md](references/human-actions.md)。
- 读取 [references/deployment-and-network-diagnosis.md](references/deployment-and-network-diagnosis.md) 的“部署门禁”和“入口网关门禁”。
- 只在确实需要时让人类介入。
- 给用户直接、可执行的操作说明：打开哪里、创建什么、复制什么非敏感值、把敏感值放到哪里、完成后如何回复。
- 如果线上需要发布新代码，先要求部署新镜像/新服务，再配置或验证线上 env；不要只让用户改配置。
- 如果用户提供服务器错误输出，先判断它属于源码构建、镜像加载、容器名冲突、网关转发、DNS 指向、HTTP 方法、RAM/OSS 签名还是 Bucket ACL 问题。
- Bucket 改私有只能作为后期门禁，必须等网关链路验证通过后再执行。

退出条件：人类完成必要操作，或明确当前因外部权限/配置阻塞。

### 5. 本地验证

输入：当前仓库改动、可用配置、可运行命令。

动作：
- 读取 [references/validation-and-handoff.md](references/validation-and-handoff.md)。
- 读取 [references/deployment-and-network-diagnosis.md](references/deployment-and-network-diagnosis.md) 的“验证矩阵”。
- 运行当前仓库成本最低且有意义的验证：单元测试、类型检查、构建、路由测试、配置解析、手动 curl 方案。
- 不具备真实 OSS 凭证时，至少验证路径校验、URL 生成、客户端不透明 URL 消费和配置读取。
- 线上验证必须分层报告：后端本机、入口机到后端、公网域名、浏览器/客户端展示。任何一层失败都先定位该层，不跳到 OSS 私有化。

退出条件：验证结果明确；无法验证时说明缺少什么。

### 6. Bucket 私有化与最终验收

输入：服务端网关、客户端/分享页加载和部署配置已跑通。

动作：
- 只有满足前置条件后，才要求人类把 Bucket ACL 改为私有。
- 改私有后验证：OSS 裸 URL 不可访问，图片网关 URL 仍可访问，客户端和分享页不需要额外改动。
- 若失败，先回滚 Bucket ACL 或恢复旧图片 URL 策略，再定位问题。

退出条件：最终链路验收完成，或给出回滚/阻塞说明。

### 7. 汇报和交接

输入：完成项、阻塞项、验证证据。

动作：
- 输出最终汇报字段。
- 如果当前仓库无法完成全流程，输出 `oss_controlled_image_access_handoff`。
- 如果用户要求隔离执行验证，或本轮改动涉及多角色复杂协作，准备可选交接给 `arcforge-skill-first`。

退出条件：用户知道已完成什么、下一步谁做什么、还有哪些阻塞。

## Reference 路由

- 触发场景、适用边界、代表性用户请求：读 [references/scenarios-and-boundaries.md](references/scenarios-and-boundaries.md)。
- 阶段执行、接入契约、默认初版路线和 CDN 后续升级：读 [references/execution-stages.md](references/execution-stages.md)。
- 服务端、客户端、分享页、运维、文档仓的具体执行细节：读 [references/role-execution.md](references/role-execution.md)。
- 前端/客户端、分享页、SSR、Native、小程序和缓存迁移细节：读 [references/client-share-page-migration.md](references/client-share-page-migration.md)。
- RAM 用户、ECS RAM 角色、STS token、签名 URL 和凭证配置：读 [references/credential-modes.md](references/credential-modes.md)。
- 部署形态、域名入口、Caddy/nginx/API Gateway、网络连通和 curl 验证：读 [references/deployment-and-network-diagnosis.md](references/deployment-and-network-diagnosis.md)。
- 人类云控制台、RAM、密钥、私有化门禁和 UI 协作：读 [references/human-actions.md](references/human-actions.md)。
- 验收、回滚、跨仓 handoff 和最终输出格式：读 [references/validation-and-handoff.md](references/validation-and-handoff.md)。

## 最终汇报字段

- 当前仓库角色集合。
- 本轮完成的 agent 可执行事项。
- 需要人类完成或已完成人类协作事项。
- 服务端契约：图片网关 URL、允许前缀、TTL、迁移策略。
- 凭证模式：RAM 用户 AccessKey、ECS RAM 角色或待适配模式；secret 是否进入安全位置。
- 部署形态和入口拓扑：域名解析、入口机、反向代理/网关、后端地址、是否使用私网。
- 客户端/分享页影响。
- 客户端/分享页迁移状态：业务字段、URL 归一化、图片组件、缓存/预加载、分享元数据和构建配置分别报告。
- 运维配置和 secret 状态。
- 验证结果和无法验证项：后端本机、入口机到后端、公网域名、浏览器/客户端展示分别报告。
- Bucket 私有化是否已执行；若未执行，给出执行前置条件。
- 剩余阻塞、回滚建议和下一步。
- 如需要跨仓协作，输出 `oss_controlled_image_access_handoff`。
