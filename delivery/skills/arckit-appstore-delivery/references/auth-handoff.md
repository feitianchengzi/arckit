# 授权和人工交接

团队 Key 使用 ASC_KEY_ID、ASC_ISSUER_ID、ASC_PRIVATE_KEY_PATH；附带客户端在内存签短期 ES256 JWT。只支持团队 Key，不猜测个人 Key 的 issuer。环境变量设置遵循当前 shell 的安全引用，不输出环境全集或私钥正文。

仅查项目文档/明确配置/环境中命名的凭据引用。缺少时引导用户在 App Store Connect → Users and Access → Integrations → App Store Connect API 创建必要权限的团队密钥，下载 p8 到仓库外，提供 Key ID、Issuer ID、路径。页面变化时以当前官方界面为准。

先读取 apps / bundleIds；证书、Cloud、users 权限分别验证。401 检查时钟、Key/Issuer、撤销和签名；403 指明被拒端点及能力，不默认索取 Admin。用项目和账户已有 app/证书等信息交叉核对团队，Issuer 不是 Developer Team ID。

人工介入限于缺口：登录/2FA、生成密钥、协议接受、Cloud 首次接入、代码托管授权、工具无法完成的网页操作或无法确定的业务/合规事实。协议由用户决定，Agent 不代签。

交接必须给：已完成项、目标页面、准确待填字段、最小操作、完成后会查询的证据。用户说“完成”后回读再续接。优先通过已授权浏览器做准备，不把可完成的 API 操作交给人。

宿主 approval request failed 是请求未发起；rejected by user 是用户拒绝；Apple 403 是平台权限不足。准确报告，不换工具绕审批。重试遵循当前宿主策略，不在 skill 中硬编码 require_escalated。

官方：https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api

