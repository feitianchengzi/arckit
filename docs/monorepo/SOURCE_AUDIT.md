# Todo 与 Feedback 源码公开导入审计

审计日期：2026-09-01

本报告只保存路径、对象、规则和脱敏 fingerprint，不保存匹配到的凭据值。审计器位于 `tools/scripts/audit-monorepo-sources.mjs`，扫描源仓库所有 refs 可达的 4 MiB 以下文本 blob，并补充当前工作树的敏感路径检查。

## 审计输入

| 源仓库 | 分支 | 审计 HEAD | 当前树 |
|---|---|---|---|
| `hoewo/workshop-todo` | `main` | `633b779ca1d0793a9577e267d3e9b1599248f772` | clean |
| `hoewo/workshop-todo-website` | `main` | `ddbb99a7b83dfcefb3316c8fced3a2f8573c3eb0` | clean |
| `hoewo/Workshop-Feedbacks` | `main` | `447e16800edac4108d4dfdfb4e92f41da70e5fa6` | clean |

三个源仓库当前均无顶层 `LICENSE`。提交历史包含多个作者身份；公开发布前，仓库所有者负责确认已有贡献的著作权归属、雇佣或贡献协议，以及采用 Apache-2.0 或 PolyForm Perimeter 1.0.1 再许可的权利。

## 高置信敏感发现

| 源 | 范围 | 路径 | 分类 | Fingerprint | 处置 |
|---|---|---|---|---|---|
| Workshop API | current + history | `web/index.html` | OSS 临时 Secret 与 Security Token | `8f34e336a8a5306c`、`c833818e180cee0e` | `web/` 不导入；私有隔离；相关身份按已泄露处理 |
| Workshop API | current + history | `USER_GUIDE.md` | API Key 与 API Key ID 候选 | `8af4d0eb40fdb36e`、`5255d291cfb7c5c7`、`b5e0b9cb7deaac32` | 导入历史删除该文档，再以无效占位符重建当前文档；值进入私有隔离/轮换清单 |
| Workshop API | current + history | `docs/feedback-v2-deployment-runbook.md`、`docs/feedback-v2-notifications-unread.md` | 数据库口令候选 | `38fd2040d7a795d9`、`95fd118ed3457250` | 导入历史删除两份文档，再以无效占位符重建当前文档 |
| Workshop API | current + history | `deploy/prod/env.workshop.production.example` | 生产签名/共享秘密默认值 | `02a4d2582cb9a56b`、`ea94be284d331295` | 不作为真实秘密保存；当前模板改成明确无效占位符并 fail closed |
| Workshop API | history only | `api/user_api.md` | JWT 文档样例 | `ba80ffd6d0024109` | 旧路径不导入；当前 `api/user.md` 保留 |
| Todo Web | current + history | `frontend/src/lib/feedbackSdk.ts` | 硬编码 Feedback API Key | `75b4a00e7c532dbb` | 原值提取到私有 ignored secret；公开源码改为显式环境契约；轮换 |
| Todo Web | history only | `frontend/env.template` | OSS AccessKey ID 与 Secret | `a8785f90a5628b39`、`d2d51f63b1710e5e` | 文件历史不导入；以当前无效模板重建；轮换 |

`middleware/feedback_session_test.go` 中的固定签名串是测试 fixture；`FeedbackProjectSettingsPage.tsx` 中的 API Key 字符串是 `${apiKeyForDocs}` 模板插值；`CLEAR_STORAGE.md` 的 token 是说明性 storage key。它们不属于真实秘密，但公开源码仍接受迁移后的重复扫描。

## 必须排除的非产品路径

### Workshop API

- `.agents/`
- `.cursor/`
- `.claude/`
- `.shared/`
- `.gitmodules`
- `web/`
- `build/`
- `.DS_Store`
- 真实 `.env*`、证书、签名和本地 runtime 输出

`.agents/skills/todo-api` 是 gitlink，本次不导入；Arckit 已有自己的 skill source 和治理边界。

### Todo Web

- `.cursor/`
- `.tools/`
- `.arckit/`
- `.gitmodules`
- `frontend-nextjs-backup/`
- `frontend/public/sdk/`
- `frontend/dist/`
- `frontend/node_modules/`
- `.DS_Store`
- 真实 `.env*`、缓存和构建输出

`.cursor/skills/todo-api-skill` 是缺少 `.gitmodules` mapping 的失效 gitlink，不导入。`frontend/public/sdk/` 是 Feedback SDK 的已构建副本，包含第三方 React/Remix/Tailwind 代码与 notice；monorepo 使用 `packages/feedback-sdk-web` 的源码构建，不保留该副本。

### Workshop Feedbacks

- `Server/` 与 `sameArchWebReference/` 当前未被 Git 跟踪，且是另外两个源仓库的工作区参考。
- 所有 `dist/`、`node_modules/`、`.env*`、DerivedData、xcuserdata、签名与 provisioning 文件。

当前被跟踪的 Feedback Console、Feedback SDK、iOS 示例和 `design/反馈ideaV2` 未发现嵌套仓库或高置信云密钥。设计资料在导入后仍需接受公开内容复核。

## 公开导入集合

| 目标 | 来源 | 历史策略 |
|---|---|---|
| `services/workshop-api/` | Workshop API 产品路径 | 保留允许路径历史；删除敏感文档路径历史并以脱敏 HEAD 重建 |
| `apps/todo-web/` | `frontend/` | 保留源码历史；删除 `feedbackSdk.ts`、env template 与 generated SDK 历史并以脱敏 HEAD 重建 |
| `apps/todo-web/docs/specs/` | `specs/` | 保留历史，排除 `.DS_Store` |
| `apps/feedback-console/` | `webapps/feedback-console-web/` | 保留历史；重新扫描模板和文档 |
| `packages/feedback-sdk-web/` | `webapps/feedback-sdk-web/` | 保留历史；排除 deploy account inputs 和 build output |
| `examples/feedback-ios/` | `Test/ios/TestFeedBack/` | 保留历史；排除签名和用户 Xcode 状态 |
| `docs/workshop/feedback-design/` | `design/` | 保留历史；公开内容复核后发布 |

## arckit-ops 提取清单

| 私有目标 | 来源 | 跟踪策略 |
|---|---|---|
| `secrets/imported/todo-web-feedback.env` | Todo Web 当前硬编码 Feedback API Key | 整个 `secrets/` Git ignored；保存仅用于轮换过渡 |
| `secrets/quarantine/workshop-api-web/` | Workshop API `web/` 调试页 | Git ignored；保留脱离公开源码的本地隔离副本 |
| `secrets/quarantine/workshop-api-doc-values.json` | USER_GUIDE 与部署文档候选值 | Git ignored；仅保存 fingerprint、来源与必要的轮换过渡值 |
| `runbooks/credential-rotation.md` | 本报告高置信发现 | 可跟踪；只保存 secret identifier、fingerprint、owner、状态和轮换证据，不保存值 |
| `environments/*/workshop-api/` | 环境专属 Workshop API 配置 | 可跟踪无秘密配置或加密载荷；明文 secret Git ignored |
| `environments/*/todo-web/` | Todo Web Feedback 环境绑定 | 可跟踪变量契约；明文 secret Git ignored |

历史中已删除的 OSS AccessKey 和 JWT 不复制为可继续使用的 ops 配置。它们只进入轮换/失效记录。

## 审计限制与门禁

- 自定义审计器用于本次本地源筛查，不替代 GitHub secret scanning、Gitleaks/TruffleHog 或云厂商凭据状态检查。
- 大于 4 MiB 的 blob 和二进制内容只接受路径审计；三个源仓库当前没有大于 1 MiB 的 tracked HEAD 文件。
- 扫描不会证明某个历史凭据已经失效；高置信发现必须轮换或由凭据所有者证明失效。
- 公开导入后必须对 Arckit 新历史再次运行扫描，并验证敏感 fingerprint 不可达。
- License 文件落位不等于再许可权已经证明；公开 push 前需要仓库所有者确认贡献权利。

满足以上过滤、脱敏、轮换 handoff 和导入后复扫后，源集合才可作为公开 monorepo 输入。
