# 构建选择、素材上传与正式提交

本文件给出可执行骨架；每次实施前核对 Apple 当前 endpoint/schema 与目标后台状态。客户端白名单不是完整 schema，也不是用户批准证明。业务判断由 Agent 完成，工具只执行范围检查与请求。

## 构建与现状

```sh
node <connect-root>/scripts/asc-submission.mjs latest --app <app-id> --platform IOS --profile <profile>
node <connect-root>/scripts/asc-api.mjs GET '/v1/apps/<app-id>/appStoreVersions?include=build' --all --profile <profile>
node <connect-root>/scripts/asc-api.mjs GET '/v1/apps/<app-id>/reviewSubmissions' --all --profile <profile>
```

macOS 使用 MAC_OS。latest 分页查询 app 的 builds，关联 preReleaseVersion，按 uploadedDate 降序选择目标平台最新构建。无构建、处理未 VALID、INTERNAL_ONLY、平台/资格信息缺失或时间歧义都不能静默退回旧包。工具不要求测试通过、安装记录或验收证明。TestFlight 过期不单独推定不能正式送审，按当前 ASC 构建资格判断。

latest 固定结果后检查 app/platform/build 和 editable version；已有审核中的其他构建属于冲突。已提交相同构建优先核验并返回现状。

## 准备版本与资料

在当前 schema 支持的前提下：
1. 创建/复用 appStoreVersions，版本号取 preReleaseVersion.version，platform 必须匹配；设置已确认 releaseType。
2. PATCH `/v1/appStoreVersions/<version-id>/relationships/build`，body.data 为 `{type:"builds",id:"<build-id>"}`。
3. 查询并创建/更新 appStoreVersionLocalizations、appInfoLocalizations、appStoreReviewDetails；应用共享字段写前执行 metadata reference 的影响确认。
4. 查询 screenshot sets，创建需要的 appScreenshotSets 与 appScreenshots 预约，完成上传和处理核验；正确素材复用。更新图片顺序使用明确的关系数组。
5. 查询地区、price points、当前 availability 和 price schedule，按已确认决定准备请求；关系与 included 结构必须来自当前 schema。客户端支持 appPriceSchedules、v2 appAvailabilities/territoryAvailabilities 的受限写入。
6. 隐私问卷、协议、地区资质、IAP/订阅、图片替换删除及 API 未覆盖项，用已授权浏览器或精确人工交接完成；不能猜 endpoint、绕白名单或跳过必填。共享客户端不实现证书吊销、删除、审核后发布或商品创建。

JSON 请求文件写受控本机目录（0600）。例如版本草稿创建：

```json
{"data":{"type":"appStoreVersions","attributes":{"platform":"IOS","versionString":"<selected-version>","releaseType":"MANUAL"},"relationships":{"app":{"data":{"type":"apps","id":"<app-id>"}}}}}
```

```sh
node <connect-root>/scripts/asc-api.mjs POST '/v1/appStoreVersions' --scope submission --profile <profile> --body <request.json>
node <connect-root>/scripts/asc-api.mjs POST '/v1/appStoreVersions' --scope submission --profile <profile> --body <request.json> --execute
```

第一次输出 plan（不加载私钥/联网），第二次在已有授权内写入。所有写操作回读对象与关系。草稿写入不等于提交。

## 素材上传

对于仍使用 appScreenshots 的接口，预约 POST 返回 id 后：

```sh
node <connect-root>/scripts/asc-upload.mjs --id <screenshot-id> --file <image.png> --profile <profile>
node <connect-root>/scripts/asc-upload.mjs --id <screenshot-id> --file <image.png> --profile <profile> --execute
```

工具每次从 ASC 读取预约，核对文件大小/状态，按 uploadOperations 的 offset/length 上传原始字节，使用服务端提供的 headers；不把 JWT 发送到存储主机，不输出 signed URLs。全部上传后 PATCH uploaded=true 与 MD5 sourceFileChecksum，再回读。

上传 COMPLETE/处理失败应由 Agent 查询并判断；上传成功不直接等于素材审核可用。预约过期或结果未知先对账，不重复创建相同图片。服务器返回非受信存储域时停止并核对官方文档，不任意扩展域。

Apple 新版 asset library 流程与旧 screenshots 不同，不能混用 checksum/关系字段；若当前 app 使用新资源且本工具未覆盖，使用当前官方 schema 支持的既有工具或浏览器完成并回读。工具不声称覆盖全部未来 API。

## 草稿提交与最终确认

查询已有 reviewSubmissions 与 items，复用当前应用/平台可编辑草稿，禁止将无关草稿项目并入本次。无合适草稿时 POST `/v1/reviewSubmissions`：

```json
{"data":{"type":"reviewSubmissions","attributes":{"platform":"IOS"},"relationships":{"app":{"data":{"type":"apps","id":"<app-id>"}}}}}
```

POST `/v1/reviewSubmissionItems` 关联版本（IAP/订阅类型与依赖按当前 Apple schema 准备，或后台完成）：

```json
{"data":{"type":"reviewSubmissionItems","relationships":{"reviewSubmission":{"data":{"type":"reviewSubmissions","id":"<submission-id>"}},"appStoreVersion":{"data":{"type":"appStoreVersions","id":"<version-id>"}}}}}
```

确认前读取完整 items 列表和资料/素材状态，在摘要展示本次全部项目。获得具体摘要确认后，回读关键身份和内容未变，再 PATCH `/v1/reviewSubmissions/<submission-id>`：

```json
{"data":{"type":"reviewSubmissions","id":"<submission-id>","attributes":{"submitted":true}}}
```

```sh
node <connect-root>/scripts/asc-api.mjs PATCH '/v1/reviewSubmissions/<submission-id>' --scope submission --body <submit.json> --confirm-submission <submission-id> --profile <profile> --execute
node <connect-root>/scripts/asc-submission.mjs receipt --submission <submission-id> --version <version-id> --build <build-id> --profile <profile>
```

`--confirm-submission` 是防误操作校验，只有 Agent 已取得真实用户确认后才可提供，不是脚本授予审批。工具拒绝在 TestFlight scope 下送审、取消审核或发布操作。

## 成功与故障

receipt 只读一次 submission/items/version，要求关联选定 build，平台一致，提交时间存在且状态 WAITING_FOR_REVIEW、IN_REVIEW 或 COMPLETED 才返回 submitted。COMPLETED 只说明已提交流程进入终态，不解释为批准。

API 2xx、Ready for Review、草稿 items 存在都不能单独宣称已提交。网络/5xx/解析失败按 outcome_unknown 处理，先查询再决定。只做 discovery-state 规定的有限提交核验；审核等待与最终上架不在本 skill 生命周期内。

官方核对入口（2026-11-01 已核对流程，实际调用前仍复核）：
- https://developer.apple.com/documentation/appstoreconnectapi/review-submissions
- https://developer.apple.com/documentation/appstoreconnectapi/uploading-assets-to-app-store-connect
- https://developer.apple.com/documentation/appstoreconnectapi/uploading-and-managing-image-assets
- https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
