# ArcKit Engineering Skills

`arcflow-catalog/arckit-engineering/skills/` 是 `arckit-engineering` 个人经验包的 agent skill 源目录。

## 维护约定

- Pack 内 `skills/` 是唯一 source of truth；Desktop 根据当前选择的底层 agent 同步到该 agent 可访问的 skill 目录。
- 新增或删除 skill 时，同步更新 `../pack.yaml` 的 `skills` 清单。
- Pack skill 不声明 agent 白名单；agent 适配能力由 Desktop 同步层决定。
- 多个 arckit 文档类 skill 共享 `_arckit_shared/content-spec.md`。

## 清单

| Skill | 角色 | 共享资源 |
|---|---|---|
| `arckit-spec` | 需求规格 | `_arckit_shared/content-spec.md` |
| `arckit-tech` | 技术方案 / 数据契约 | `_arckit_shared/content-spec.md` |
| `arckit-interaction` | 交互 / 线框图 | `_arckit_shared/content-spec.md` |
| `arckit-visual` | 视觉设计系统 | `_arckit_shared/content-spec.md` |
