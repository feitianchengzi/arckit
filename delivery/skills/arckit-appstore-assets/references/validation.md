# 验证与维护交接

## 本地结构检查

核对 frontmatter 名称、agents 元数据、相对引用、manifest 字段约定与生产流程一致。确认本 skill 无 Apple 鉴权或 TF 前置、无后台上传、无 Git skill 依赖；送审方只消费产物与按需交接，不复制生产规则。

结构检查不代表真实素材质量或 Agent 行为已验证；只有实际文件、视觉检查和确认记录可以证明具体素材交付。

## 隔离验证任务

工作区 `/tmp/arckit-appstore-assets-eval-<unique>/`，使用受控 Apple 项目 fixture、无隐私真实 UI 示例及临时输出目录。允许写入该目录，禁止真实账户、业务仓库、Git push 或 Apple 写入。可将 assets 与 submission 放在不相邻路径，验证由技能元数据定位。

1. 独立 iOS 素材：无 TestFlight、无 connect；根据提供的源码版本与真实截图交付文案/图片，不要求鉴权，buildId 保持未知。
2. macOS 素材：使用 Mac 窗口及对应尺寸，动态读取语言，不套用 iPhone 设备框；新风格先确认首张。
3. 单独文案：requestedScope=copy，无截图仍可完成该范围；清单不能被送审方解释为完整素材。
4. 已有合格素材：送审方直接复用，不要求重跑或安装 assets。文件摘要不符、语言/设备不足、构建关系不明则不通过。
5. 缺图/需翻译：送审方显式加载 assets；依赖缺失报告 blocked_missing_dependency，同时可准备独立审核资料。
6. 自动采集失败：给出具体手动指南，保持等待状态；缺实际文件不能完成。
7. 开发阶段素材转送审：buildId 为空时用源码/归档证据建立关联；相同营销版本但不同界面不能直接复用，不能仅填新 buildId 伪造来源。
8. 拒审或审核账号请求：由 submission 维护审核说明，assets 不索取账号密码或生成法律声明。

观察 Agent 路由、依赖恢复、真实 UI 与版本依据、视觉确认、partial/ready 区分和上传边界。未执行上述隔离场景时不得宣称行为验证通过。

## post_maintenance_handoff

```yaml
post_maintenance_handoff:
  recommended_next_step: verify_then_sync
  reason: "拆分素材生产与送审消费，增加按需依赖及独立素材入口；需隔离验证路由和交接后再安装。"
  formal_source_path: "delivery/skills/arckit-appstore-assets"
  working_copy_path: "delivery/skills/arckit-appstore-assets"
  maintenance_source_path: "delivery/skills/arckit-appstore-assets"
  validation_required: true
  governance_required: true
  arcforge_action_hint: audit
  user_confirmation_required: true
```

本轮直接维护用户指定 Arckit 仓库，三者同路径。应用/共享目标未知；后续先验证，再按实际目标 audit/drift/apply，不在创建维护阶段安装、推送或送审。原 arckit-temp 素材 skill 是历史来源参考，本轮不修改或删除它。
