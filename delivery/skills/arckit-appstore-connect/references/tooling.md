# 公共工具契约

唯一维护源码与运行入口为本 skill 的 `scripts/`，测试在 `tests/`，仓库根运行 `npm run test:appstore`。不再生成或维护其他 skill 的工具副本。

`arckit-appstore-testflight` 与 `arckit-appstore-submission` 强制依赖本 skill。调用方必须从可见技能元数据、明确配置或已授权按需任务的解析结果定位本 skill 的实际根目录并读取 SKILL.md，随后通过绝对路径调用工具；不能假定相邻目录。尚未加载时按入口通用协议解析；解析后仍不可用时报告具体阻塞与恢复动作，不自动复制脚本或绕过宿主能力授权。

Node >=18；鉴权 UI 另需 macOS 图形桌面和 Swift 工具链。profile 名称、存储路径、权限和取消/失败回执保持兼容。

- asc-auth.mjs：本机 profile 存储及名称列表。
- asc-setup.mjs / asc-setup.swift：同机 UI 录入/验证/保存；不通过聊天收集秘密。
- asc-api.mjs：官方 ASC v1/v2 请求、分页、JWT、脱敏与范围检查。
- asc-submission.mjs：只读选择最新平台构建和核验提交关联。
- asc-upload.mjs：根据官方预约上传 screenshot 字节，无 JWT 的存储请求。

API GET 可执行；POST/PATCH 默认仅 plan，--execute 才写入。scope=read 禁止全部写入；scope=testflight（兼容默认）仅签名/Cloud/内测资源与 build 加密字段；scope=submission 支持版本/本地化/审核资料/截图/地区价格/提交资源，不含构建、证书、内测成员和审核后发布。范围检查不能代替当前官方 schema、用户授权或平台权限。

最终 submitted=true 另需 --confirm-submission 与资源 ID 一致。该参数只阻止误发，用户确认仍由 Agent 验证。没有自动重试写入、撤回、吊销或 DELETE。

业务状态只引用 credentialProfile。团队 key 验证可读取 apps 不代表可以修改任意应用。若项目使用已有可靠 API/CLI，可以消费其结果和同样的连接契约，不强制迁移凭据。

所有请求结果按事实输出；401/403、结果未知、数据不完整须区分。公开报告不得包含 JWT、私钥、审核密码、私人联系方式或预签名上传 URL。
