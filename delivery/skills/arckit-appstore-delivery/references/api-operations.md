# API 执行脚本

scripts/asc-api.mjs 是通用的受限 HTTP 执行器，不是自动作业务判断的发布服务。Node >=18，无 npm 依赖。优先复用项目既有工具；本脚本用于减少重复编写 JWT、分页和错误处理。

使用绝对 skill 路径调用。shell 中包含方括号的 API path 必须引用：

```sh
node <skill>/scripts/asc-api.mjs --help
node <skill>/scripts/asc-api.mjs GET '/v1/apps?filter[bundleId]=<identifier>' --all
node <skill>/scripts/asc-api.mjs GET '/v1/ciWorkflows/<id>/buildRuns' --all
node <skill>/scripts/asc-api.mjs GET '/v1/ciBuildRuns/<runId>/builds' --all
node <skill>/scripts/asc-api.mjs POST '/v1/betaGroups/<groupId>/relationships/builds' --body <local-request.json>
node <skill>/scripts/asc-api.mjs POST '/v1/betaGroups/<groupId>/relationships/builds' --body <local-request.json> --execute
```

写操作默认仅输出 plan，不加载私钥，不联网；Agent 检查 body、目标与现有授权范围后自行加 --execute，无需为了此参数重复询问用户。请求 JSON 放受控临时目录，不用不安全 shell 插值。GET 的 --all 自动遍历分页并保留 included，单条资源不加 --all。结果可能含成员邮箱，保持在本机，不提交公开日志。

环境 ASC_KEY_ID、ASC_ISSUER_ID、ASC_PRIVATE_KEY_PATH 由用户明确引用的本机配置提供，私钥不能在命令参数或日志出现。仅支持团队 Key，JWT 600 秒；每次运行重新生成。分页会验证同源，禁止重定向；无通用 base URL 覆盖，以免向代理/其他域泄露授权。

客户端只允许官方 ASC v1/v2 读取，以及明确列入内部交付范围的 v1 POST/PATCH：
- bundleIds、bundleIdCapabilities、certificates、profiles
- ciWorkflows、ciBuildRuns
- betaGroups、betaTesters、betaBuildLocalizations、betaTesterInvitations
- 组与 builds/testers 的关联
- build 的加密属性/声明关联、buildBetaDetails

不支持 DELETE、正式审核/上架、新 app 私有 API；build 的 expire 修改被阻止。白名单不是用户授权证明，具体请求仍由 Agent 对照上下文和当前官方 schema 校验；workflow 配置尤其要检查是否意外包含额外分发动作。

为避免敏感日志，默认隐藏证书/profile/CSR 内容。本客户端不负责下载/导入签名材料；需要时复用已有受控工具直接写仓库外文件，验证权限与签名，禁止通过聊天复制 base64 内容。也不自动创建 CSR、维护状态、替用户判断加密或修改 Xcode 工程。

失败分类：authentication_failed、permission_denied、conflict_reconcile、rate_limited、network_error、outcome_unknown、invalid_response。遵守 Retry-After；读取可按短等待重试，写入不自动重试，遇到网络异常或 5xx 先查询资源判断是否已经成功。返回 2xx 后仍需业务回读验证。

接口文档核对入口：https://developer.apple.com/documentation/appstoreconnectapi/

