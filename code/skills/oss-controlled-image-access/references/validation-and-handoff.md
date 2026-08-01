# 验收与交接

## 私有化前验收

必须验证：

- 后端本机或容器端口能返回图片网关 `302`。
- 入口机能访问后端服务健康检查和图片网关。
- 公网域名能访问健康检查和图片网关。
- 业务接口对 object-key 图片返回网关 URL。
- 浏览器或客户端能跟随网关 `302` 并显示图片。
- 分享页正常显示图片。
- 前端源码或构建产物不再包含公开 OSS Bucket base URL、`OSSAccessKeyId`、`AccessKeySecret` 或客户端签名逻辑。
- 客户端刷新页面或重启 App 后仍使用稳定网关 URL，不复用旧 OSS 签名 URL。
- 前端 `.env.example` 或部署配置不再要求公开 OSS base；如保留网关 base，明确它是稳定网关而不是 OSS Bucket 域名。
- 签名 URL 过期后，重新请求同一个网关 URL 能拿到新的签名 URL。
- 服务端日志不包含完整签名 URL query。
- `../secret`、`http://...`、非图片前缀等非法路径被拒绝。

验证命令注意：

- API GET 接口不要默认用 `curl -I`，因为 `-I` 是 HEAD 请求。
- 需要 GET 响应头时使用 `curl -sS -D - -o /dev/null "URL"`。
- 图片网关验证可用 `curl -i "URL"` 看 302，或 `curl -L -I "URL"` 看最终图片响应。

如果没有 OSS 凭证，至少验证：

- 配置读取。
- object key 到网关 URL 的转换。
- 路径安全校验。
- 客户端不透明 URL 消费。

## 私有化后验收

必须验证：

- 不带签名的 OSS 裸 URL 不能直接访问。
- 通过图片网关 URL 仍然能访问图片。
- 业务接口、客户端、分享页不需要额外改动。
- 浏览器 Network 或客户端日志显示入口仍是稳定网关 URL。

失败时：

1. 先判断是否生产影响。
2. 如有影响，按回滚方案恢复 Bucket ACL 或旧 URL 策略。
3. 再定位 OSS 权限、签名、endpoint、Bucket、前缀或部署配置问题。

## 跨仓 handoff

当前仓库无法完成全流程时，输出：

```yaml
oss_controlled_image_access_handoff:
  current_repo_roles:
    - server-repo|client-repo|share-page-repo|ops-repo|docs-repo|unknown-or-empty
  completed_here:
    - ""
  required_from_human:
    - ""
  required_from_server_repo:
    - ""
  required_from_client_repo:
    - ""
  required_from_share_page_repo:
    - ""
  required_from_ops_repo:
    - ""
  validation_plan:
    - ""
  blockers:
    - ""
  deployment_topology:
    public_domain: ""
    entry_gateway: ""
    core_service_endpoint: ""
    credential_mode: "access_key|ecs_ram_role|other"
  client_migration:
    image_fields_from_server:
      - ""
    url_normalization_status: ""
    removed_public_oss_base_config: true|false
    follows_redirect_verified: true|false
    signed_url_persistence_checked: true|false
    share_metadata_checked: true|false
```

## 最终汇报模板

```text
当前仓库角色：
- ...

本轮完成：
- ...

需要你做：
- ...

还需要其他仓库配合：
- ...

验证结果：
- ...

客户端/分享页：
- ...

部署与入口：
- ...

凭证模式：
- ...

Bucket 私有化状态：
- 未执行/已执行/阻塞

下一步：
- ...
```

## 可选隔离执行验证交接

如果用户要求 Skill First 闭环，或修改涉及多仓、多角色、生产风险，准备：

```yaml
arcforge_skill_first_validation:
  target_skill_path: "skills/oss-controlled-image-access"
  validation_task: "在一个包含服务端和客户端的仓库中使用该 skill，判断仓库角色并输出第一阶段执行计划；不要接触真实云密钥。"
  workspace: ""
  write_boundary: "只允许写临时验证目录或工作副本"
  observe:
    - "是否先识别仓库角色集合"
    - "是否区分 agent 可做事项和人类操作"
    - "是否把 Bucket 私有化放到最后"
    - "是否输出跨仓 handoff"
    - "是否把前端 URL 拼接、缓存和分享元数据作为 Bucket 私有化前置验收"
```
