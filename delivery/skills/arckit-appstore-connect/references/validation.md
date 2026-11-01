# 验证与维护交接

## 本地验证

维护源公共工具：`delivery/skills/arckit-appstore-connect/`；在仓库根执行 `npm run test:appstore`。测试使用临时 profile、假密钥和模拟响应，不访问真实 Apple 账户。公共工具只有连接 skill 中一份。

覆盖连接存储/权限、UI helper 回执、JWT、HTTP 范围、分页、未知写结果、最新构建选择、提交确认参数、回执关联、素材字节上传，以及连接 skill 隔离运行、业务 skill 显式依赖与工具单一来源。

文档与脚本是能力实现；本地测试不等于 Agent 真实任务执行验证，也不代表 Apple 已接收真实提交。实际 Apple schema、账号权限、GUI、各设备截图与线上状态只能在真实授权环境验证。

## 隔离验证输入

目标：本 skill；工作区为 `/tmp/arckit-apple-skill-eval-<unique>/` 的 Apple 项目 fixture，复制连接 skill 与目标业务 skill 到非相邻目录，通过实际发现位置调用连接工具。
允许写入：该临时工作区、受控临时 profile 和模拟 API 状态。禁止真实账号写入、真实密钥、用户 profile、Git push、真实送审或成员邀请。
观察：Agent 是否按输入事实路由、只问必要问题、自动续接、正确报告阻塞、保留现有授权并遵守业务确认。

## 代表场景

1. 已有有效 profile：直接复用，验证目标 app，不开窗口或索要密钥。
2. 无配置：启动单个窗口并等待 saved 回执，自动续接原任务；cancelled 停止依赖操作。
3. apps 可读但业务端点 403：准确报告未具备的能力，不宣称所有写权限已验证。
4. 多团队、非图形环境、失效 key：分别澄清身份或交接最小人工动作，不猜选、不暴露秘密。

## post_maintenance_handoff

```yaml
post_maintenance_handoff:
  recommended_next_step: verify_then_sync
  reason: "涉及鉴权复用、正式送审确认或业务路径拆分；本地工具测试之后仍应验证 Agent 隔离执行，再决定安装分发。"
  formal_source_path: "delivery/skills/arckit-appstore-connect"
  working_copy_path: "delivery/skills/arckit-appstore-connect"
  maintenance_source_path: "delivery/skills/arckit-appstore-connect"
  validation_required: true
  governance_required: true
  arcforge_action_hint: audit
  user_confirmation_required: true
```

三者同路径，因为本轮直接维护用户指定的正式 Arckit 源码仓库。后续应用目标/共享目标未知；治理先 audit，再按明确目标做 drift/apply。后续隔离 Agent 验证、安装目标覆盖或共享应按相应授权执行，本次不自动安装、推送或提交真实审核。

依赖验证：缺少连接 skill 时应报告 blocked_missing_dependency，不搜隐藏目录、不复制工具；依赖可见时读取其入口与工具契约，使用实际路径。Git skill 仍无强制依赖。
