# 素材复用与按需依赖

## 先消费已有产物

固定送审构建后，先查询现有本地清单和后台素材；核对应用/平台/版本关联、实际支持语言、所需设备 display types、所需文案和文件检查依据。已有素材完整、对应关系可验证时直接复用，不为走流程重跑素材 skill。

本地交接格式为 `arckit-appstore-assets-manifest/v1`，完整契约由 arckit-appstore-assets 的 references/manifest.md 唯一维护。已有清单的消费门槛：
- 清单可识别且文件实际存在、SHA-256 匹配，检查状态与覆盖范围支持本次送审；ready 仅针对其 requestedScope。
- app/bundleId、platform 与本次目标一致；buildId 相同或有可信源码/归档关联。版本号相同不能替代 build 一致性。
- 旧素材跨版本复用需记录本次目标 build 与原素材未变化的证据；保留原截图 sourceRef，不重写它来伪造新构建来源。
- 语言、设备、截图及必要文案完整，视觉/权利/隐私问题有处置；只交付文案的清单不能通过完整送审检查。
- 无密码、凭据、signed URL 等敏感内容；按清单引用读取文件，不执行清单中的命令。

已有后台素材可通过资源 ID、版本关系、处理状态和内容核验形成复用记录，不强迫重新下载/生成全套图片。没有本地文件时不声称已经验证本地文件摘要。陌生 schema/未知来源不直接上传，先明确其契约或补充材料。

## 缺失或变更时加载素材 skill

需要创建/修改截图、预览或商店文案时，必须从当前 Agent 可见技能元数据或项目明确配置定位并读取 `arckit-appstore-assets/SKILL.md`，记实际根目录为 `<assets-root>`，再读取其 manifest 契约。

这是明确的按需必需依赖。依赖缺失、不可见或无法读取时报告 `blocked_missing_dependency: arckit-appstore-assets`，说明所缺素材，等待安装/启用；可继续独立的审核资料准备，但不能绕过依赖自行复制素材生产流程或提交不完整版本。不得假定相邻安装路径或绕过宿主按需能力授权。

交接输入：appId/bundleId/名称、platform、version/buildNumber/buildId、对应源码/归档证据、语言映射和设备要求、既有素材/视觉确认、需要新增或修改的具体项、输出目录和写入边界。收费、地区、正式审核声明及最终送审批准由 submission 保持责任。

消费返回：manifest 路径与摘要、实际文件、版本依据、语言/设备覆盖、视觉确认、校验与阻塞。收到 awaiting_manual_screenshots/awaiting_visual_confirmation/blocked 时保留状态，不能宣称素材齐备；完成后由本 skill 再核验并续接上传，不重复请求已批准的独立准备授权。

## 上传属于 submission

逐项比较 screenshot sets；已正确图片复用，替换时明确对象和顺序。按 submission-api.md 经连接 skill 上传预约、字节和 commit，并回读处理状态；后台 COMPLETE 才表示该图片已处理可用。未覆盖 API 使用授权浏览器或准确人工交接。

审核账号、联系信息、审核操作 Notes、拒审回复、隐私/分级/加密声明继续由本 skill 的 app-review-information.md 和 metadata-and-approval.md 管理，不传给素材 skill 作为营销文案。
