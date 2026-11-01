# 身份与签名

## Apple 资源
Bundle ID 按 identifier 精确匹配，核对平台/团队，已有 app 不迁移 identifier。扩展单独匹配，capabilities 仅开启实现需要的项，App ID、profile、entitlements 一致。

查询 ASC apps 的 bundleId/name 并确认身份。公开 Apps API 不支持创建新 app（2026-09-18 官方核对），不要猜造 POST /v1/apps。准备名称、主语言、Bundle ID、SKU、平台及访问范围，通过官方网页完成。可用浏览器先填表，登录/协议等由用户完成。之后 GET apps 回读 appId。

## 证书决策
1. 查询后台有效证书，并在本地用 security find-identity 等验证证书与私钥配对、类型和有效期。
2. 分清本地开发、本地 App Store 导出、Cloud 管理签名。Cloud 能管理的资源不必额外在本机创建；不为了“配齐”创建不使用的发行证书。
3. 缺私钥时先使用用户授权的备份导入路径；下载公钥证书不能恢复私钥。
4. 确认必要且缺失后才生成私钥/CSR并申请。macOS Installer Distribution 与 Apple Distribution 分别判断；Developer ID 不属于默认 App Store 内测用途。
5. 配额按当前官方文档、证书类型、团队类型和后台实际资源判断。区分同时有效数量、有效期与申请规则，不硬编码“每年两次”；满额时报告已有资源，不吊销腾位。
6. 私钥/备份/profile 放仓库外受控目录；不擅自生成无密码 p12，不修改整个钥匙串信任设置。

profile 匹配 app、平台、证书、capabilities、有效期及开发所需设备。只有真机开发确实需要时才注册新设备，避免消耗设备名额。Cloud 签名策略独立验证。

## Xcode
优先改生成源，保留 Debug/Release 原有策略。Cloud 可独立 shared scheme/configuration 自动签名，不写死本地证书 SHA/profile 名。不要把所有项目强改手动签名。

核对 Bundle ID、Team、签名方式、营销版本、构建号、Info.plist、entitlements、架构及 export 配置。macOS sandbox/录屏/麦克风/文件访问结合实现决定；编译通过不代表运行权限正常，记录必要 smoke check。

必要时本地编译/归档验证，导出过产物则验证签名；本地验证不自动上传。证书证据记录 ID/类型/有效期/私钥可用性，别记录私钥内容。

官方：
- https://developer.apple.com/documentation/appstoreconnectapi/certificates
- https://developer.apple.com/documentation/appstoreconnectapi/profiles
- https://developer.apple.com/documentation/appstoreconnectapi/bundle-ids
- https://developer.apple.com/documentation/appstoreconnectapi/apps

