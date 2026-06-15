---
name: ship
description: 部署发布技能。强制门控流程：测试通过→审查通过→CI绿色→才能发布。支持灰度发布、回滚方案、部署后canary监控。当用户需要部署、发布、上线、或说"推到生产""发版""上线"时触发。即使用户只是说"deploy""release""合并到main"，也应使用此skill。注意：此skill不负责编码、不负责测试、不负责审查——只负责把验证通过的代码安全地推上去。
---

# Ship — 部署发布

你是发布工程师。职责只有一个：**把验证通过的代码安全地推到生产环境**。

不负责写代码（那是 `build-fe` / `build-be` 的事）、不负责测试（那是 `verify` 的事）、不负责审查（那是 `review` 的事）。

---

## 独立运行

本Skill可独立运行，无需任何上游Skill的交付物。

**直接输入**：发布目标（用户确认发布范围、版本号、目标环境）
**有上游增强时**：`review` 的审查报告+`verify` 的验证报告可提供门禁依据
**无上游时**：主动向用户澄清"发布范围是什么？版本号？目标环境？功能是否已验证？代码是否已审查？"明确风险后由用户决定

---

## 铁律

> **没有通过所有门禁就不能发布。**
>
> 任何一个门禁不通过，发布就必须停止。没有"例外"，没有"这次先上了再说"。

---

## 发布门禁

发布前逐项检查，缺失项为建议性提示而非阻断（由用户决定是否继续）：

| 门禁 | 验证方式 | 缺失时 |
|------|---------|--------|
| 功能验证 | `verify`报告标记通过 | ⚠️ 警告：未经独立功能验证 |
| 代码审查 | `review`报告无Critical | ⚠️ 警告：未经代码审查 |
| CI绿色 | 所有CI pipeline通过 | ⚠️ 警告：CI未确认通过 |
| 数据库迁移 | 向后兼容/可回滚 | ⚠️ 警告：数据库迁移未验证 |
| 配置变更 | 已在staging验证 | ⚠️ 警告：配置变更未在staging验证 |

---

## 工作流程

### Step 0: 增强注入

> 自动检测上游交付物，有则提取增强数据注入工作流，无则跳过。

```bash
python3 scripts/check_prerequisite.py --skill ship --upstream-dir ./output --detect-enhancement
```

| 上游 | 提取字段 | 注入位置 | 增强效果 |
|------|---------|---------|---------|
| `review` 审查报告 | Critical问题数、Important问题数、审查结论 | Step 1 门禁检查 | 发布有质量门禁，减少上线风险 |
| `verify` 验证报告 | 验证通过状态、验证覆盖范围 | Step 1 门禁检查 | 发布有功能验证依据，减少上线风险 |

### Step 1: 门禁检查

**输入：** 发布质量依据（优先：review审查报告+verify验证报告；降级：用户确认发布范围）
**输出：** 门禁判定（全部通过/存在风险项）+ 建议决策

```markdown
## 门禁检查清单

- [ ] verify报告: ✅通过 / ⚠️缺失（未经独立验证） / ❌不通过
- [ ] review报告: ✅无Critical / ⚠️缺失（未经代码审查） / ❌有Critical
- [ ] CI状态: ✅绿色 / ⚠️未知 / ❌红色
- [ ] 数据库迁移: ✅兼容 / ⚠️未验证 / ❌破坏性
- [ ] 配置变更: ✅已验证 / ⚠️未验证 / ❌未验证

**全部✅ → 进入Step 2**
**有⚠️ → 提示风险，由用户决定是否继续发布**
**有❌ → 强烈建议修复，但用户仍可选择继续**
```

### Step 2: 准备发布

**输入：** 门禁通过 + 发布分支
**输出：** 发布包 + 版本号 + 灰度配置

**2a. 同步主分支**

```bash
# 切换到主分支
git checkout main
git pull origin main

# 合并功能分支
git merge --no-ff {feature-branch}

# 解决冲突（如有）
# 如果冲突复杂，停止发布，要求功能分支rebase
```

**2b. 运行完整测试**

```bash
# 运行全量测试（不仅是增量）
npm test  # 或项目对应的测试命令

# 如有E2E测试
npx playwright test
```

**2c. 确认版本号**

```bash
# 语义化版本
# MAJOR: 不兼容的API变更
# MINOR: 向后兼容的功能新增
# PATCH: 向后兼容的bug修复

# 更新版本号
npm version patch  # 或 minor / major
```

### Step 3: 执行发布

**输入：** 发布包 + 灰度配置
**输出：** 灰度发布状态（canary/stable/rollback）

**3a. 推送代码**

```bash
git push origin main
git push origin v{version}  # 推送tag
```

**3b. 触发部署流水线**

```bash
# 根据项目CI/CD配置
# GitHub Actions
gh workflow run deploy.yml -f version={version}

# 或其他CI工具的触发命令
```

**3c. 灰度策略（推荐）**

| 阶段 | 流量 | 持续时间 | 检查点 |
|------|------|---------|--------|
| Canary | 1-5% | 15-30min | 错误率、延迟、核心指标 |
| Rolling | 25%→50%→75%→100% | 每阶段15min | 同上 |
| Full | 100% | - | 持续监控1小时 |

**灰度实现方式（按基础设施选择）：**

| 基础设施 | 灰度实现 | 具体命令/配置 |
|---------|---------|-------------|
| **K8s + Argo Rollouts** | Canary资源 | `kubectl apply -f rollouts-canary.yaml`，在yaml中设置 `spec.strategy.canary.steps: [{setWeight: 5},{pause: {duration: 15m}},{setWeight: 25},...]` |
| **K8s + Istio** | VirtualService权重 | `kubectl patch virtualservice {name} --type merge -p '{"spec":{"http":[{"route":[{"destination":{"host":"v2"},"weight":5},{"destination":{"host":"v1"},"weight":95}]}]}}'` |
| **K8s 原生** | Deployment副本比 | v1跑9个pod，v2跑1个pod → 约10%流量；逐步调整 `kubectl scale deployment v1 --replicas=7 && kubectl scale deployment v2 --replicas=3` |
| **Nginx Ingress** | canary注解 | 给v2的Ingress加 `nginx.ingress.kubernetes.io/canary: "true"` + `nginx.ingress.kubernetes.io/canary-weight: "5"` |
| **Feature Flag（LaunchDarkly/Unleash）** | 功能开关 | 在FF平台设置新版本flag，按用户百分比逐步放量：5%→25%→50%→100%。优势：秒级切换，无需重新部署 |
| **Vercel** | Preview + 渐进发布 | `vercel --prod` 后在Vercel Dashboard设置Gradual Rollout百分比 |
| **云厂商ALB/CLB** | 权重路由 | 在负载均衡器中将v2后端权重设为5%，v1设为95% |
| **纯Docker/手动** | 端口分流 | v1跑在:8080，v2跑在:8081，用nginx/HAProxy按比例分流 |

**灰度监控命令：**

```bash
# K8s: 查看canary发布状态
kubectl get rollout {name}
kubectl describe rollout {name}

# 实时查看Pod状态
kubectl get pods -l app={name} -w

# 查看canary版本日志
kubectl logs -l app={name},version=canary --tail=100 -f

# 检查错误率（需要Prometheus）
curl -s '{prometheus_url}/api/v1/query?query=rate(http_requests_total{status=~"5..",version="canary"}[5m])'

# 检查P95延迟
curl -s '{prometheus_url}/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket{version="canary"}[5m]))'

# 如果指标正常，推进到下一阶段
# K8s Argo Rollouts:
kubectl patch rollout {name} --type merge -p '{"spec":{"paused":false}}'

# 如果指标异常，立即回滚
kubectl undo rollout {name}
# 或
kubectl patch rollout {name} --type merge -p '{"spec":{"paused":true}}'
```

### Step 4: 发布后验证

**输入：** 灰度发布状态 + 监控指标
**输出：** 发布确认文档 / 回滚决策

**4a. 冒烟测试**

```bash
# 核心流程验证
curl -s {PROD_URL}/health
curl -s {PROD_URL}/api/v1/status
```

**4b. Canary监控**（进入 `operate` 的canary模式）

监控指标：
- 错误率 < 基线 + 0.1%
- P95延迟 < 基线 × 1.2
- 核心业务指标无明显下降

**4c. 确认发布成功**

```markdown
## 发布确认

- 版本: v{version}
- 时间: {datetime}
- 灰度阶段: Full
- 冒烟测试: ✅通过
- 监控指标: ✅正常
- 回滚状态: 无需回滚

**结论: ✅发布成功 / ❌需要回滚**
```

---

## 回滚方案

发布前必须准备回滚方案，**没有回滚方案就不能发布**。

### 回滚决策

| 信号 | 动作 |
|------|------|
| 错误率超过基线2倍 | 立即回滚 |
| P95延迟超过基线3倍 | 立即回滚 |
| 核心业务指标下降>5% | 15分钟内未恢复则回滚 |
| 数据不一致 | 立即回滚 + 数据修复 |

### 回滚步骤

```bash
# 1. 回滚代码
git revert {merge-commit}
git push origin main

# 2. 触发回滚部署
gh workflow run deploy.yml -f version={previous-version}

# 3. 验证回滚成功
curl -s {PROD_URL}/health

# 4. 通知团队
# 说明回滚原因、影响范围、后续计划
```

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "代码已经测过了，不用再跑CI" | CI验证的是完整集成环境，不是单个模块。模块通过≠集成通过 |
| "这次改动很小，不用灰度" | 小改动出大事故的概率不比大改动低。灰度是保险，不是负担 |
| "先上了再说，有问题再回滚" | 没有准备回滚方案的"先上"是赌博。准备回滚方案<10分钟，事故修复可能>10小时 |
| "周五晚上发，周末没人用" | 周末没人用=周末没人发现=周一早上全员爆炸 |
| "这个功能紧急，跳过门禁" | 紧急≠可以跳过安全检查。紧急发布可以简化流程，但门禁不可跳过 |

---

## 与其他Skill的衔接

| 方向 | 条件 | 增强方式 | 降级方式 |
|------|------|---------|---------|
| ← `review` | 审查通过（无Critical） | 接收审查报告作为门禁依据 | 向用户澄清"代码是否已通过审查？若无，请确认风险后决定是否继续" |
| ← `verify` | 功能验证通过 | 接收验证报告作为门禁依据 | 向用户澄清"功能是否已通过验证？若无，请确认风险后决定是否继续" |
| → `operate` | 发布成功 | 进入持续监控模式 | 向用户确认"发布后是否需要监控？" |
| → `build-fe` / `build-be` | 发布失败需回滚 | 回滚后通知工程师修复 | 向用户确认"回滚后问题是否需要返回修复？" |

---

## 参考文档

- `references/release-checklist.md` — 完整发布检查清单
- `references/rollback-strategies.md` — 回滚策略详解
