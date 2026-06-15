# 产品研发全生命周期 Skill 体系 — 开发指南

## 项目定位

这是一个 **Skill 体系框架**，不是软件应用。每个 Skill 是一个结构化 prompt + 工作流 + 脚本集，
覆盖从市场洞察到线上运营的完整产品研发链路。

## 目录结构

```
all/
├── 01-pm/          # 产品经理（insight/decide/prd-gen）
├── 02-design/      # 设计师（design）
├── 03-architect/   # 架构师（arch/model）
├── 04-engineer/    # 工程师+QA（build/verify）
├── 05-lead/        # 主任工程师（review）
├── 06-sre/         # SRE（ship/operate）
├── scripts/        # 通用脚本（check_prerequisite.py 等）
└── README.md
```

每个 Skill 目录结构：
```
{skill}/
├── SKILL.md       # Skill 定义（铁律+工作流+反合理化表）
├── scripts/       # 可执行脚本
└── references/    # 参考文档和模板
```

## 修改规范

### SKILL.md 规范

- 必须包含 YAML frontmatter（`name` + `description`）
- 必须包含**铁律**（一条不可绕过的硬约束）
- 必须包含**反合理化表**（预判借口并反驳）
- 必须包含**与其他Skill的衔接**关系
- 工作流步骤必须有明确的输入/输出
- **零平台依赖**：不硬编码任何平台特定API/路径

### 脚本规范

每个脚本必须满足：
1. `#!/usr/bin/env python3` 或 `#!/usr/bin/env bash` shebang
2. docstring/help 说明用途、参数、输出
3. `--help` 参数支持
4. 错误处理：返回结构化错误，不裸抛异常
5. 降级逻辑：外部依赖不可用时降级而非报错退出
6. **零平台依赖**：不硬编码任何平台特定路径/API
7. 时区：使用系统时区，不硬编码 `timezone(timedelta(hours=8))`

### references 规范

- 提供完整内容，不是占位符
- 独立于特定平台或业务

## 测试要求

- 新增脚本必须可通过 `--help` 输出
- 新增 Python 脚本必须可通过 `python3 -c "import py_compile; py_compile.compile('script.py')"` 语法检查
- 新增 Shell 脚本必须可通过 `bash -n script.sh` 语法检查

## 提交规范

```
<type>(<scope>): <subject>

type: feat | fix | refactor | docs | chore
scope: skill名 或 scripts
subject: 祈使句，不超过50字符
```
