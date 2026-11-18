---
name: arckit-appstore-connect
description: 配置、验证或恢复 Apple App Store Connect 连接、团队密钥 profile、本机鉴权窗口和 API 权限时使用。支持 iOS/macOS 交付的连接准备；不承担构建、素材制作、送审、上架或业务授权。
---

# App Store Connect 连接

建立可复用的本机连接，输出非秘密的凭据引用和已验证访问范围。

## 1. 发现连接

输入：项目配置、目标应用/团队、已有 credentialProfile。
读取 [授权与人工交接](references/auth-handoff.md)，先查项目明确引用和本机 profile 名称列表。
优先复用可用连接；多团队/多应用只在身份无法确定时询问，不以 Issuer ID 代替 Developer Team ID。
退出：确定可验证的 profile 或需要配置的原因。

## 2. 验证或配置

先用 `scripts/asc-api.mjs GET '/v1/apps?limit=1' --scope read --profile <name>` 验证。
无有效连接时按授权 reference 启动 `scripts/asc-setup.mjs`，用户在本机窗口选择 p8 并验证保存。
持续等待同一进程回执；saved 后自动续接，cancelled 后停止依赖操作。窗口参数和私钥不进入聊天、截图或项目仓库。
无图形桌面时提供在同一主机完成配置的交接，不索取聊天中的秘密。
退出：连接验证成功，或明确认证/权限/环境阻塞。

## 3. 核对业务访问条件

输入：原任务需要的资源与团队/应用身份。
查询目标 app 及所需资源，把 401 与 403 分开诊断；读取成功不证明写入权限。
仅报告实际检查的端点与能力；不为证明权限做测试写入，不默认索取 Admin，不代签协议。
需要额外权限或人工登录时给出准确页面、字段、最小动作及之后的验证方式。
退出：连接结果可供原任务继续；连接成功不等于允许提交审核、邀请成员或改变价格。

## 4. 保存与交接

profile 沿用 `~/.config/arckit/appstore-connect/` 的受限本机存储；项目只保存 profile 名称。
如有 Git common dir 中的原交付状态，沿用 credentialProfile；无 Git 时使用用户指定的仓库外受控状态目录。
输出 profile、已确认 appId/团队、已验证读取能力、未验证写权限和阻塞；禁止输出密钥、JWT 或表单敏感信息。
回到原任务授权范围继续执行，无需重复询问是否继续。

## 工具分发

读取 [工具契约](references/tooling.md) 了解 API 范围、唯一维护来源和业务依赖契约。
本 skill 是 TestFlight 与正式送审 skill 的必需依赖，所有公共工具仅在本 skill 的 scripts/ 中维护。业务方先定位并读取本入口，再使用实际根目录调用工具；不要求同级安装。
维护或验证时读取 [验证与交接](references/validation.md)。
