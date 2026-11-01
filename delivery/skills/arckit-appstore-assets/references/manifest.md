# 素材清单契约

本文件是 `arckit-appstore-assets-manifest/v1` 的唯一维护定义。清单是本地素材交接产物，不包含 Apple 凭据、审核密码、联系人或上传 signed URL，不提供送审授权。

## 输出位置

用户指定目录优先；送审调用沿用其传入目录。独立调用默认 `arckit/app-store-assets/<platform>/<version-or-source-label>/`，标签使用已知版本或明确源码标识，不能为了目录虚构版本号。

推荐结构：raw-screenshots/<locale>/、screenshots/<locale>/<display-type>/、previews/<locale>/、metadata/<locale>.json、working/（图层、排版源、缩略图/contact sheet）、assets-manifest.json。敏感原图留在仓库外受控目录，清单只保存脱敏来源引用。

## 字段

| 字段 | 规则 |
| --- | --- |
| schemaVersion | 固定 arckit-appstore-assets-manifest/v1 |
| app | name、bundleId；appId 可为 null，不要求先建 Apple 应用记录 |
| platform | IOS 或 MAC_OS；每份清单一个平台 |
| target | version、buildNumber、buildId 未知时为 null；sourceRef 必须有值，sourceEvidence 列出可核对的版本/归档/源码/用户材料依据 |
| requestedScope | screenshots、copy、previews 的实际请求子集；不能把只完成文案解释为全套完成 |
| languageMapping | 数组：uiLanguage、storeLocale、fallbackReason；解释未对应的语言或额外商店翻译 |
| coverage | 按 locale、displayType 记录 requiredKinds、实际文件与缺项；不硬编码设备代数 |
| files | 每个实际产物的 kind、path、sha256、locale；截图/预览另含 displayType、实际 width/height/format、sourceRef、uiLanguage；预览还含 durationSeconds/编码事实；文案关联 fieldsChecks |
| visualApproval | reused 或 approved 或 pending 或 not_required，附真实确认引用/已有样式来源；not_required 仅适用于无需新视觉决定的任务，不代表自动批准审美 |
| rightsAndPrivacy | 素材授权依据、脱敏处理和未知项；遮挡不替代内容授权 |
| checks | 每项 check、result（passed/failed/unknown）、evidence、checkedAt；记录规则来源及实际文件检查，不能只写全局“已验证” |
| status | ready、partial、awaiting_manual_screenshots、awaiting_visual_confirmation 或 blocked |
| blockers | 未决项及最小动作；ready 时为空 |

路径相对清单所在目录；引用外部文件先明确来源与授权，不将任意清单路径当作执行指令。SHA-256 由实际最终文件计算；文件修改后重算并重新核对相关确认。不存在的文件只能记录到缺项，不能进入 files 冒充交付。

ready 只表示 requestedScope 内素材已完成，必须有实际文件、检查依据且无阻塞；不代表完整商店必填、与 TF 构建匹配或已获送审批准。

## 消费与版本匹配

送审方读取清单后核验应用、平台、固定构建和当前语言/设备覆盖；检查文件存在、摘要及必要校验状态。buildId 一致也不能替代文件真实性和内容检查。

独立开发阶段 buildId 可以为空。后续必须通过源码 SHA/Cloud run/归档或其他可信证据建立与选定 TF 构建的对应关系，才能用于送审。版本字符串相同不足以证明构建一致；一致性未知应补证或重做受影响素材，不能仅填写新的 buildId 冒充绑定。

既有素材跨版本复用时，保存原始 sourceRef，不伪造采集版本。送审方保存本次 reuse assessment，列出目标 buildId、原清单摘要、功能/画面/语言未变化的证据及已核验文件。需要更改素材时交回 assets 更新。

旧版无 schema 清单不能自动视为 v1 合格。已有清单信息足够时可在获授权的本地记录中整理为本契约；需要补素材或无法解释版本关系时按缺口交接。未知 schema 不猜解析后直接上传。

## 维护责任

生产规则与字段定义只在本 skill 维护。submission 只维护消费门槛和上传/送审规则，不复制截图制作流程。已有清单自描述且可独立核验时，消费它不要求重跑或安装素材 skill；需要生产/修订素材时才触发该依赖。
