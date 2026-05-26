# Decision Framework

决策思考工具箱 - 提供三套递进式思考工具，提升产品决策、战略规划、方案评审的质量。

## 📦 包含工具

| 工具 | 用途 | 适用场景 |
|------|------|---------|
| **第一性原理拆解** | 找方向 | 全新领域、战略转型、打破僵局 |
| **产品价值评估** | 判价值 | 需求评审、立项决策、方案选择 |
| **苏格拉底追问** | 拷逻辑 | 方案评审、风险识别、团队对齐 |

## 🚀 快速开始

### 方式一：让 agent 引导

直接告诉 agent:
- "帮我评估这个方案"
- "用第一性原理分析一下"
- "拷问这个方案的逻辑"

Agent 会自动判断场景，选择合适的工具，逐步引导你填写。

### 方式二：手动初始化模版

```bash
# 查看可用模版
bash skills/decision-framework/scripts/init-template.sh -l

# 创建模版文件
bash skills/decision-framework/scripts/init-template.sh fp 项目名称
bash skills/decision-framework/scripts/init-template.sh va 项目名称
bash skills/decision-framework/scripts/init-template.sh sq 项目名称

# 示例
bash skills/decision-framework/scripts/init-template.sh fp 直播带货
# 输出: workspace/直播带货-first-principles-20250521.md
```

## 📖 文档

- **SKILL.md** - 完整使用说明、工作流程、引导策略
- **templates/README.md** - 三个工具的递进关系、组合模式、实战案例
- **templates/*.md** - 三个模版的详细结构

## 🔄 递进关系

```
第一性原理 → 产品价值评估 → 苏格拉底追问
找方向        判价值          拷逻辑
```

**三种组合模式：**
1. **完整流程**（重大决策）：三个工具全用
2. **快速验证**（常规需求）：价值评估 → 追问
3. **打破僵局**（陷入困境）：追问 → 第一性原理

详见 `templates/README.md`。

## 💡 何时用哪个？

| 场景 | 优先工具 |
|------|---------|
| 全新领域/业务 | 第一性原理 |
| "竞品都在做，要不要跟？" | 第一性原理 |
| 需求评审 | 产品价值评估 |
| 有多个候选方案 | 产品价值评估 |
| 方案评审 | 苏格拉底追问 |
| 方案反复被否 | 苏格拉底追问 → 第一性原理 |

## 🛠️ 文件结构

```
decision-framework/
├── SKILL.md                          # Skill 说明
├── skill.json                        # Skill 元数据
├── README.md                         # 本文件
├── templates/
│   ├── README.md                     # 使用指南（递进关系、案例）
│   ├── first-principles-thinking.md
│   ├── product-value-assessment.md
│   └── socratic-questioning.md
└── scripts/
    └── init-template.sh              # 快速初始化脚本
```

## 📝 使用示例

### 示例 1：评估是否做直播带货

```
用户: "帮我评估一下，要不要做直播带货？"

Agent: 这是"竞品都在做，要不要跟"的场景。
       我建议先用第一性原理拆解，从零审视这个问题。
       要开始吗？

用户: 好

Agent: [创建文件 直播带货-first-principles-20250521.md]
       先说说你最初想解决的问题？

... (逐步引导填写)

Agent: 基于拆解，发现核心目标是"提高利润"而非"增加渠道"。
       重构出3个路径：
       1. 老客推荐+私域运营（成本低、转化高）
       2. 短视频种草（覆盖广、可沉淀）
       3. 直播带货（投入大、效果不确定）
       
       建议接下来用产品价值评估，对比这3个方案？
```

### 示例 2：需求评审

```
用户: "评估一下这个AI助手功能值不值得做"

Agent: 这是需求评审场景，我用产品价值评估工具。
       [创建文件 AI助手功能-value-assessment-20250521.md]
       
       先明确目标用户：这个功能主要给谁用？

... (逐步引导填写六维)

Agent: 评估完成，总分 4.2/5.0（推荐立项）
       
       关键优势：
       - 场景高频刚需（每天使用）
       - 痛点强度高（现有方案效率低）
       - 技术壁垒明显（数据+算法）
       
       主要风险：用户学习成本，建议先做MVP验证。
       
       要用苏格拉底追问再拷问一遍吗？
```

## 🔧 维护与迭代

### 使用后复盘

每次使用后，建议在对应的模版文件里填写"版本记录"章节，沉淀：
- 新发现的关键假设
- 有效的追问角度
- 典型的陷阱与规避方法

### 贡献案例

如果有典型案例，欢迎补充到 `templates/README.md` 的"实战案例"章节。

## 📄 License

内部使用，基于产品决策最佳实践沉淀。

---

*Version: 1.0.0 | Author: 张秋实 | Created: 2025-05-21*
