# 授权和人工交接

团队 Key 使用 ASC_KEY_ID、ASC_ISSUER_ID、ASC_PRIVATE_KEY_PATH；附带客户端在内存签短期 ES256 JWT。只支持团队 Key，不猜测个人 Key 的 issuer。环境变量设置遵循当前 shell 的安全引用，不输出环境全集或私钥正文。

仅查项目文档/明确配置/环境中命名的凭据引用。缺少时引导用户在 App Store Connect → Users and Access → Integrations → App Store Connect API 创建必要权限的团队密钥，下载 p8 到仓库外，通过下述本机 UI 输入 Key ID、Issuer ID 并选择文件，参数不进入聊天。页面变化时以当前官方界面为准。

先读取 apps / bundleIds；证书、Cloud、users 权限分别验证。401 检查时钟、Key/Issuer、撤销和签名；403 指明被拒端点及能力，不默认索取 Admin。用项目和账户已有 app/证书等信息交叉核对团队，Issuer 不是 Developer Team ID。

人工介入限于缺口：登录/2FA、生成密钥、协议接受、Cloud 首次接入、代码托管授权、工具无法完成的网页操作或无法确定的业务/合规事实。协议由用户决定，Agent 不代签。

交接必须给：已完成项、目标页面、准确待填字段、最小操作、完成后会查询的证据。内置 UI 以进程回执自动续接；只有缺少机器回执的外部操作才请用户告知完成，然后回读。优先通过已授权浏览器做准备，不把可完成的 API 操作交给人。

宿主 approval request failed 是请求未发起；rejected by user 是用户拒绝；Apple 403 是平台权限不足。准确报告，不换工具绕审批。重试遵循当前宿主策略，不在 skill 中硬编码 require_escalated。

官方：https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api


## 本机交互配置与复用

先检查本机记录的 credentialProfile，通过 API 客户端验证已有连接；有效则复用。需要首次配置、更换或修复时，启动：

```sh
node <skill>/scripts/asc-setup.mjs
```

需要 macOS 图形桌面、Swift 工具链和 Node >=18。启动后保持进程运行，等待用户操作，不因暂时没有 stdout 就重启或认定失败。
对用户说明：“请在窗口完成验证并保存，我会自动接收结果并继续。”不要说“完成后告诉我”，不要在窗口打开后结束当前轮来等待聊天消息。
使用可等待的进程执行方式，保留工具返回的进程/会话 ID。工具提前返回 running 时，通过对应 wait/poll 接口继续等待同一进程；每次短等待并按需更新进度，空输出表示尚未收到结果，不是失败。禁止后台脱离、重复开窗或以固定等待时长推定完成。
收到完整 JSON 回执并确认进程正常结束后处理结果。saved 时记录 credentialProfile，按原授权验证目标 app/团队及后续所需访问，再直接续接原业务任务；不重复请求继续许可。进程异常退出、回执缺失或格式错误时报告结果未知，先用已有引用或 profile 名称列表恢复并验证，不读取秘密文件，不盲目重开窗口。
用户明确取消/暂停时遵从用户指令；宿主中断导致无法继续等待时保存非秘密恢复信息并如实报告，不能声称仍在后台监听。
UI 提供“去申请配置”和“已有配置，开始录入”。前者打开 Apple 后台并提示团队 Key 申请步骤，两者最终使用同一表单填写连接名称、Key ID、Issuer ID，并用文件选择器选择 .p8。用户点击“验证并保存”才读取文件、向官方 API 验证并持久保存。
参数仅在 UI 与本机 helper 的 stdin 管道间流转，不进入命令参数、聊天、临时明文传输文件或工具日志。Agent 不截图/OCR 配置窗口，不读取 profile 文件或 .p8；使用附带客户端按引用完成签名与调用。
UI 内显示字段/鉴权/网络/存储错误，保留表单以供修正；同名 profile 不覆盖。取消或关闭返回 cancelled；保存期间提示等待，不把尚未确定的写入结果报告为取消成功。

回传仅包括：
- saved、profile、connectionVerified=true：完成保存并通过 apps 读取检查；不证明目标团队/app 匹配或所有写权限，需要按原流程验证。
- cancelled：用户取消，停止依赖凭据的动作，不再次索取参数。
- error/code 或 unavailable/code：启动/环境问题；报告具体限制，不能降级要求用户将凭据发送到聊天。

凭据位置仍为 ~/.config/arckit/appstore-connect/<profile>.json，内含 Key ID、Issuer ID、私钥内容；目录 0700、文件 0600，未加密。UI 明示存储方式；原 .p8 保留。轮换用新名称验证保存后切换引用，不自动删除或吊销旧 key。
将成功返回的 profile 写入既有 Git common dir 下本机业务记录 credentialProfile；无 Git 时使用用户指定的仓库外受控状态目录。后续仅传 --profile，身份字段不与环境混合，JWT 只在进程内存使用。缺环境变量时先查 profile；多团队不自动选择第一项。
asc-auth.mjs register 保留为本机底层兼容入口，不作为 Agent 收集参数的用户流程。无 GUI 环境需要用户在有桌面的同一主机完成配置后再续接，不虚称已支持远程窗口。

```sh
node <skill>/scripts/asc-auth.mjs list
node <skill>/scripts/asc-api.mjs GET '/v1/apps?limit=1' --profile <profile>
```
