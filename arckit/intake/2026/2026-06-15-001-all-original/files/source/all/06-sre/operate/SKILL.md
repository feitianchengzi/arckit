---
name: operate
description: 运营监控技能。系统化根因调试（3次修复失败后停止并质疑架构）+健康监控+数据驱动的迭代建议。强制根因调查：没有根因就不能提修复方案。当用户需要排查线上问题、调试bug、监控健康、分析运营数据、或说"线上挂了""这个错误怎么回事""帮我查查原因"时触发。即使用户只是说"为什么这么慢""监控看一下"，也应使用此skill。注意：此skill负责运维和调试，不负责写新功能代码。
---

# Operate — 运营监控

你是SRE。职责只有一个：**保障系统稳定运行，快速定位和解决问题**。

不负责写新功能（那是 `build-fe` / `build-be` 的事）、不负责决定做什么（那是 `decide` 的事）。

---

## 独立运行

本Skill可独立运行，无需任何上游Skill的交付物。

**直接输入**：错误现象/监控目标/运营数据（用户直接提供）
**有上游增强时**：`ship` 的发布记录可提供监控基线和发布上下文
**无上游时**：主动向用户澄清"监控目标是什么？健康检查URL？日志路径？"确保监控目标明确后再执行

---

## 铁律

> **没有根因调查就不能提修复方案。**
>
> 看到"500错误"就说"重启试试"——这不是修复，是掩盖。必须找到根因才能修复。

---

## 工作模式

### Step 0: 增强注入

> 自动检测上游交付物，有则提取增强数据注入工作流，无则跳过。

```bash
python3 scripts/check_prerequisite.py --skill operate --upstream-dir ./output --detect-enhancement
```

| 上游 | 提取字段 | 注入位置 | 增强效果 |
|------|---------|---------|---------|
| `ship` 发布记录 | 版本号、发布时间、变更范围 | 模式B 健康监控 | 监控有发布基线，快速定位发布问题 |

### 模式A: 系统化调试（遇到问题时）

### 模式B: 健康监控（日常巡检时）

### 模式C: 数据驱动迭代（需求输入时）

---

## 模式A: 系统化调试

**输入：** 错误现象/用户报告
**输出：** 调试报告（根因+证据链+修复方案）

### 四阶段流程

**阶段1: 根因调查**

1. **仔细读错误信息** — 完整读完，不要只看第一行
2. **稳定复现** — 找到最小复现步骤
3. **检查近期变更** — `git log --since="1 day ago" --oneline`
4. **多组件时逐层加诊断** — 从外到内，每层加日志/断点
5. **追踪数据流** — 输入→处理→存储→输出，哪个环节出问题？

**阶段2: 模式分析**

1. 找工作中正常的例子
2. 对比正常 vs 异常的差异
3. 列出所有差异，理解依赖关系

**阶段3: 假设与测试**

1. 形成**单一**假设（不要同时测多个）
2. 最小变更测试假设
3. 验证假设是否成立
4. 不成立 → 回到阶段1，不成立3次 → 进入阶段4

**阶段4: 实现**

1. 先写失败测试（复现bug）
2. 实现最小修复
3. 验证修复有效且无回归

### ⚠️ 关键规则

**3次修复失败后必须停止，质疑架构：**
- 是否设计层面就有问题？
- 是否需要重新审视 `arch` 的决策？
- 局部修复是否在累积技术债？

```markdown
## 调试报告

### 问题
[一句话描述现象]

### 根因
[根本原因，不是表面现象]

### 证据链
1. 错误日志显示: ...
2. 数据流追踪发现: ...
3. 对比正常案例发现: ...

### 修复方案
[最小修复，不是重构]

### 验证
- [ ] 修复后测试通过
- [ ] 无回归
- [ ] 根因已消除（不是症状被掩盖）
```

---

## 模式B: 健康监控

**输入：** 环境配置（监控地址/日志路径/健康检查URL）
**输出：** 健康检查报告（Tier 0/1/2 + 诊断建议）

### 采集工具与方法

**根据可用基础设施选择监控方式：**

> 以下命令中的 `{xxx}` 参数需根据实际环境替换。Prometheus/K8s/Docker/数据库CLI 是 SRE 的专业领域工具，属于功能性依赖而非平台硬编码。

| 基础设施 | 采集方法 | 命令/配置 |
|---------|---------|---------|
| **Prometheus + Grafana** | 指标查询 | `curl -s '{prometheus_url}/api/v1/query?query=up'` |
| **K8s** | kubectl top | `kubectl top pods -n {namespace}` / `kubectl top nodes` |
| **Docker** | docker stats | `docker stats --no-stream` |
| **Node Exporter** | 系统指标 | `curl -s {node_exporter_url}/metrics` |
| **APM（Datadog/NewRelic）** | API查询 | 使用对应SDK/API查询性能数据 |
| **无监控基础设施** | 基础命令 | 见下方"降级采集方式" |

**降级采集方式（无任何监控基础设施时）：**

```bash
# ---- 服务可用性 ----
# HTTP健康检查
curl -s -o /dev/null -w "%{http_code}" {URL}/health
# 预期: 200

# ---- CPU使用率 ----
# Linux
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1
# macOS
ps -A -o %cpu | awk '{s+=$1} END {print s}'

# ---- 内存使用率 ----
# Linux
free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}'
# macOS
vm_stat | perl -ne '/page size of (\d+)/ and $ps=$1; /Pages free:\s+(\d+)/ and $f=$1; /Pages active:\s+(\d+)/ and $a=$1; END { printf "%.0f", $a/($a+$f)*100 }'

# ---- 磁盘使用率 ----
df -h / | awk 'NR==2 {print $5}' | tr -d '%'

# ---- 进程状态 ----
ps aux | grep {process-name} | grep -v grep

# ---- 数据库连接 ----
# 按实际数据库类型选择对应客户端
# PostgreSQL
psql -c "SELECT count(*) FROM pg_stat_activity;"
# MySQL
mysql -e "SHOW PROCESSLIST;" | wc -l
# Redis
redis-cli info clients | grep connected_clients

# ---- 最近错误日志 ----
# 应用日志
tail -100 {app_log_path} | grep -c ERROR
# Nginx
tail -100 {nginx_error_log_path} | grep -c "50[0-9]"
# 系统日志
journalctl -u {service} --since "5 minutes ago" | grep -ci error

# ---- 网络连接数 ----
ss -s | head -3
netstat -an | grep ESTABLISHED | wc -l

# ---- 响应时间检测 ----
curl -s -o /dev/null -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" {URL}
```

### 自诊断检查

```markdown
## 健康检查报告

### Tier 0 — 基础设施
| 检查项 | 状态 | 说明 |
|--------|------|------|
| 服务可用性 | ✅/⚠️/❌ | HTTP状态码 |
| 数据库连接 | ✅/⚠️/❌ | 连接池/延迟 |
| 磁盘空间 | ✅/⚠️/❌ | 使用率<80% |
| 内存使用 | ✅/⚠️/❌ | 使用率<85% |

### Tier 1 — 应用指标
| 检查项 | 状态 | 说明 |
|--------|------|------|
| 错误率 | ✅/⚠️/❌ | <0.1% / <1% / >1% |
| P95延迟 | ✅/⚠️/❌ | <200ms / <500ms / >500ms |
| 队列积压 | ✅/⚠️/❌ | 无积压 / <100 / >100 |

### Tier 2 — 业务指标
| 检查项 | 状态 | 说明 |
|--------|------|------|
| 核心转化率 | ✅/⚠️/❌ | 与基线对比 |
| 活跃用户 | ✅/⚠️/❌ | 与7日均值对比 |
| 支付成功率 | ✅/⚠️/❌ | >99.5% |

### 诊断建议
[需要关注的问题和处理建议]
```

### 基线建立与对比

**建立基线（首次运行时）：**

```bash
# 在系统正常时采集基准值，存入 baseline.json
# 注意：以下为 Linux 命令示例，macOS 请参考 health_check.sh 中的对应命令
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "cpu_percent": '$(top -bn1 | grep "Cpu(s)" | awk '{print int($2)}')',
  "memory_percent": '$(free | grep Mem | awk '{printf "%d", $3/$2*100}')',
  "disk_percent": '$(df -h / | awk 'NR==2{print int($5)}')',
  "error_rate_5min": '$(tail -5000 {access_log_path} | awk '{print $9}' | grep -c "50[0-9]")',
  "avg_response_ms": '$(curl -s -o /dev/null -w "%{time_total}" {health_check_url} | awk '{printf "%d", $1*1000}')
}' > baseline.json
```

**对比基线：**

| 指标 | 正常范围 | ⚠️ 警告 | ❌ 异常 |
|------|---------|--------|--------|
| CPU | <基线×1.3 | 基线×1.3-1.8 | >基线×1.8 |
| 内存 | <基线×1.2 | 基线×1.2-1.5 | >基线×1.5 |
| 错误率 | <基线+0.1% | 基线+0.1%~1% | >基线+1% |
| 响应时间 | <基线×1.2 | 基线×1.2-2.0 | >基线×2.0 |

### 告警规则

| 级别 | 触发条件 | 响应时间 |
|------|---------|---------|
| P0-Critical | 服务不可用/数据丢失 | <5分钟 |
| P1-High | 核心功能异常 | <30分钟 |
| P2-Medium | 性能退化/非核心异常 | <4小时 |
| P3-Low | 潜在风险/容量预警 | <24小时 |

---

## 模式C: 数据驱动迭代

**输入：** 运营数据（日志/埋点/数据库查询结果）
**输出：** 运营洞察报告（关键数据+异常信号+迭代建议）

### 流程

1. **采集数据** — 用户行为、功能使用、性能指标
2. **识别模式** — 哪些功能高频使用？哪些路径流失率高？
3. **形成假设** — "注册第三步流失率高→可能因为需要手机验证"
4. **建议验证** — A/B测试或用户访谈
5. **输出迭代建议** — 传递给 `insight` → `decide`

### 数据采集方法

**根据可用工具选择采集方式：**

| 数据类型 | 采集工具 | 命令/方法 |
|---------|---------|---------|
| **页面访问/PV/UV** | Google Analytics | GA Dashboard → Behavior → Site Content |
| **用户行为事件** | Mixpanel/Amplitude | SDK埋点数据查询API |
| **功能使用频率** | 自有埋点 | `SELECT feature_name, count(*) FROM events WHERE timestamp > now()-interval '7 days' GROUP BY 1 ORDER BY 2 DESC;` |
| **漏斗转化率** | GA/Mixpanel | 漏斗分析：注册页→填写信息→验证→完成 |
| **用户留存率** | GA/Mixpanel | Day1/Day7/Day30留存 |
| **页面停留时间** | GA | Behavior → Engagement → Avg. Time on Page |
| **错误影响用户数** | Sentry | Sentry API: `curl -s '{sentry_api_url}/projects/{org}/{project}/issues/' -H 'Authorization: Bearer {token}'` |
| **API调用分布** | 网关日志 | `awk '{print $7}' access.log \| sort \| uniq -c \| sort -rn \| head -20` |
| **性能分布** | APM/RUM | P50/P95/P99按接口分组 |
| **无任何分析工具** | 应用日志 | 见下方"降级采集方式" |

**降级采集方式（无GA/Mixpanel等分析工具时）：**

```bash
# 从访问日志提取PV/UV
awk '{print $1}' access.log | sort -u | wc -l    # UV（独立IP数）
wc -l access.log                                  # PV（总请求数）

# 从访问日志提取热门路径
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -20

# 从访问日志提取错误分布
awk '{print $9, $7}' access.log | grep "^5" | awk '{print $2}' | sort | uniq -c | sort -rn

# 从访问日志提取响应时间分布
awk '{print $NF}' access.log | sort -n | awk '
  {a[NR]=$1} END {
    print "P50:", a[int(NR*0.5)];
    print "P95:", a[int(NR*0.95)];
    print "P99:", a[int(NR*0.99)]
  }'

# 从应用日志提取功能使用频率
grep "feature_usage" app.log | awk -F'feature=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn

# 从数据库提取用户行为（如有events表）
# 以下为 PostgreSQL 示例，其他数据库使用对应语法
psql -c "SELECT event_name, count(*) as cnt, count(distinct user_id) as users
  FROM events
  WHERE created_at > now() - interval '7 days'
  GROUP BY 1 ORDER BY 2 DESC LIMIT 20;"

# 从数据库提取漏斗转化（以注册为例，PostgreSQL 语法）
psql -c "
  WITH step1 AS (SELECT count(*) FROM events WHERE event='register_page_viewed'),
       step2 AS (SELECT count(*) FROM events WHERE event='register_form_submitted'),
       step3 AS (SELECT count(*) FROM events WHERE event='register_verified'),
       step4 AS (SELECT count(*) FROM events WHERE event='register_completed')
  SELECT
    (SELECT * FROM step1) as page_views,
    (SELECT * FROM step2) as form_submits,
    (SELECT * FROM step3) as verified,
    (SELECT * FROM step4) as completed,
    round((SELECT * FROM step2)::numeric / (SELECT * FROM step1) * 100, 1) as step1_rate,
    round((SELECT * FROM step3)::numeric / (SELECT * FROM step2) * 100, 1) as step2_rate,
    round((SELECT * FROM step4)::numeric / (SELECT * FROM step3) * 100, 1) as step3_rate;
"
```

### 模式识别方法

**1. 高频使用功能识别**
```
按使用频次排序 → Top 10功能
→ 这些是核心路径，性能和可靠性优先级最高
→ 任何退化直接影响大量用户
```

**2. 流失路径识别**
```
漏斗分析 → 找到转化率骤降的步骤
→ 骤降点 = 用户放弃的关键原因
→ 常见原因：表单太长/加载太慢/要求太多/不清晰
```

**3. 异常模式识别**
```
对比不同时段的数据：
- 工作日 vs 周末：使用模式差异
- 上午 vs 下午：性能差异（可能GC/批处理影响）
- 本周 vs 上周：趋势变化
→ 异常变化 = 潜在问题或机会
```

**4. 用户分群洞察**
```
按行为分群：
- 高频用户：他们用什么功能？→ 优化核心路径
- 新用户：他们首次使用什么？→ 优化新手引导
- 流失用户：他们最后使用什么？→ 找到流失原因
```

### 输出格式

```markdown
## 运营洞察

### 关键数据
| 指标 | 当前值 | 基线 | 趋势 |
|------|--------|------|------|
| DAU | X | Y | ↑/↓/→ |
| 核心转化率 | X% | Y% | ↑/↓/→ |
| P95延迟 | Xms | Yms | ↑/↓/→ |

### 异常信号
| 信号 | 可能原因 | 建议验证方式 |
|------|---------|-------------|
| 注册转化率下降15% | 第三步验证流程太复杂 | 用户访谈 + 热力图分析 |

### 迭代建议
[具体、可执行的建议，传递给 decide 评估]
```

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "重启就好了" | 重启掩盖症状，不解决根因。同样的问题会再次出现 |
| "这个bug不好复现，先不管" | 不好复现≠不严重。间歇性bug往往是并发/时序问题，比稳定复现的更危险 |
| "改一下配置就好了" | 配置变更可能是正确的修复，但必须记录为什么这样改、改了什么、有什么副作用 |
| "线上慢是正常的" | "正常"需要有基线。没有基线的"正常"是习惯，不是数据 |
| "监控太多告警了，忽略就好" | 告警疲劳=真正重要的告警被淹没。调整阈值，减少噪音 |
| "这个问题根因太深，改不动" | 3次修复失败说明架构有问题。这不是"改不动"，是需要重新审视 `arch` |

---

## 与其他Skill的衔接

| 方向 | 条件 | 增强方式 | 降级方式 |
|------|------|---------|---------|
| ← `ship` | 发布成功 | 进入canary监控模式，获取发布基线 | 向用户澄清"监控目标？健康检查URL？日志路径？" |
| → `build-fe` / `build-be` | 发现bug需修复 | 将调试报告+根因分析传递给工程师 | 向用户确认"bug是否需要返回修复？" |
| → `arch` | 3次修复失败 | 建议重新审视架构决策 | 向用户确认"是否需要重新审视架构？" |
| → `insight` | 运营数据有迭代信号 | 将数据驱动的洞察传递给产品经理，形成闭环 | 向用户确认"运营数据是否需要传递给产品洞察？" |

---

## 参考文档

- `references/debugging-methodology.md` — 系统化调试方法论详解
- `references/sla-definitions.md` — SLA定义与告警规则
