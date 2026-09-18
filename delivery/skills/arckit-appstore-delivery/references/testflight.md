# TestFlight 与合规

## 加密声明
读取目标 build 的 usesNonExemptEncryption 与 buildBetaDetail。已有声明记录事实，不擅自覆盖。缺声明时审查该提交代码、依赖锁文件、静态库/SDK及网络和本地加密用途；不能看到 HTTPS 就忽略第三方算法。

有证据确认无加密或只用豁免加密时，在对应 Info.plist 设置 ITSAppUsesNonExemptEncryption=false；已上传 build 用 PATCH /v1/builds/{id} 的 usesNonExemptEncryption=false。配置只影响未来二进制，当前 build 声明要保留判断依据；问卷第四项不能机械等同所有情况。

有非豁免加密或证据不足时说明算法/SDK和缺失事实，请用户完成必要判断、材料与 Apple 审批，再关联获准声明。不能伪造审批码或代签法律声明。按当前官方规则核对。

## 组与构建
查询 app 的 betaGroups，匹配目标且 isInternalGroup=true、app 关系正确。无组时创建 name/isInternalGroup/app relationship，多合理候选未指定时询问。

查询组 builds；目标已存在跳过，否则 POST /v1/betaGroups/{id}/relationships/builds，body 为 data 数组、元素 type=builds/id=已验证的本次 buildId。204 后回读组 builds 并检查 buildBetaDetail、expired。处理未完成/合规缺失的 409 先解决原因，不循环重试。

## 成员
有明确名单按名单，默认 GET /v1/users 所有分页。按当前官方内部测试资格筛选 ACCOUNT_HOLDER、ADMIN、APP_MANAGER、DEVELOPER、MARKETING；对 allAppsVisible=false 查询 visibleApps，必须包含目标 app。不得扩大权限、创建组织账户或添加外部地址；跳过者列出原因。

查询目标 app 的 betaTesters 与目标组成员所有分页，按 app+大小写归一邮箱去重。同一邮箱在其他 app 的多条 tester 记录不能随便复用；app 内多匹配时查询关系消歧。

已有目标 app tester：POST /v1/betaGroups/{id}/relationships/betaTesters。
未有：POST /v1/betaTesters，传 email/firstName/lastName 和 betaGroups relationship。
执行前说明成员范围；默认契约含 TestFlight 系统邀请，不发自定义邮件。

回读成员和邀请状态。已有成员不重复邀请；NOT_INVITED 先确认有可测试 build 并等待同步，必要时按官方 betaTesterInvitations 对该 app 请求一次并回读。不要循环重发，既有退出/移除意图需澄清后再邀请。

完成分别报告入组、可测试、合规、成员和邀请。INVITED 不等于 ACCEPTED/INSTALLED，不能声称邮件已送达。共享配置不包含邮箱名单。

官方：
- https://developer.apple.com/documentation/appstoreconnectapi/post-v1-betagroups-_id_-relationships-builds
- https://developer.apple.com/documentation/appstoreconnectapi/post-v1-betagroups-_id_-relationships-betatesters
- https://developer.apple.com/documentation/appstoreconnectapi/post-v1-betatesters
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/
- https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- https://developer.apple.com/documentation/appstoreconnectapi/buildupdaterequest/data-data.dictionary/attributes-data.dictionary

