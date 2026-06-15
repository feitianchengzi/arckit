# Skill 有效性评估（eval）

> 回答一个之前没人能回答的问题：**这 13 个 Skill，到底有没有让 Agent 的输出变好？**

verify Skill 的铁律是"没有新鲜证据就不能声称完成"。但在没有 eval 之前，整个 Skill 体系对自身的有效性只有声称、没有证据——21 个测试验证的是脚本函数返回值对不对，不是 Skill 让 Agent 输出质量提升了多少。这个目录补上这块证据。

## 方法：A/B 对比

每个 case 定义一对输入：

| 组 | 输入 | 产出 |
|----|------|------|
| **baseline** | 裸 prompt（不带任何 SKILL.md） | baseline 输出 |
| **treatment** | 同一 prompt + 对应 SKILL.md 作为系统约束 | treatment 输出 |

两者输出用 `scorer.py` 按同一份 rubric 打分，**Δ = treatment_score − baseline_score**：

- Δ ≥ 0.1 → Skill 在该 case 上有效
- Δ ≤ −0.1 → Skill 无效或负向（需修正）
- |Δ| < 0.1 → 提升不显著（rubric 可能没区分度，或 Skill 在该场景无用）

## 关键设计：评分与 LLM 调用解耦

`scorer.py` 是**确定性纯 Python**（正则/包含规则），不依赖任何 LLM provider。LLM 跑两次（带/不带 SKILL.md）由用户在外部完成，把两份输出文件交给 `run_eval.py` 评分对比。

这样做的原因：
1. **零平台依赖**（项目核心规范）——不绑死到 OpenAI / Anthropic / 本地模型
2. **可复现**——同一对输出永远得到同一分数，便于回归
3. **可审计**——rubric 是显式规则，"为什么这分"一眼可见

## 目录结构

```
scripts/eval/
├── scorer.py              # 确定性评分器（核心，纯 Python）
├── run_eval.py            # A/B 对比主脚本
├── cases/                 # 黄金测试 case（JSON）
│   ├── review_flattery.json   # review 是否抑制谄媚
│   └── verify_evidence.json   # verify 是否强制证据
└── README.md              # 本文件
```

## case 格式

```json
{
  "id": "唯一标识",
  "skill": "对应的 Skill 名",
  "description": "本 case 要验证什么",
  "input_context": "输入上下文说明",
  "baseline_prompt_hint": "baseline 用的裸 prompt 提示",
  "treatment_prompt_hint": "treatment 用的 prompt（加载哪个 SKILL.md）",
  "rubric": [
    {
      "id": "规则标识",
      "description": "这条规则检查什么",
      "check": "not_contains | contains_any | contains_all | regex | min_length",
      "patterns": ["模式列表（not_contains/contains_* 用）"],
      "weight": 3.0
    }
  ]
}
```

支持的 check 类型：

| check | 通过条件 |
|-------|---------|
| `not_contains` | 输出不含 patterns 中任一项 |
| `contains_any` | 输出含 patterns 中任一项 |
| `contains_all` | 输出含 patterns 中全部项 |
| `regex` | 输出匹配 `pattern` 字段（注意是单数） |
| `min_length` | 输出字符数 ≥ `threshold` |

默认大小写不敏感；某条 rubric 需要区分大小写时加 `"case_sensitive": true`。

## 用法

### 1. 单 case 评估

```bash
# 假设你已在 LLM 端跑过两次，输出存为文件
python3 run_eval.py \
  --case cases/review_flattery.json \
  --baseline-output out/review.baseline.txt \
  --treatment-output out/review.treatment.txt \
  --report out/review_report.md
```

### 2. 批量评估

```bash
# 约定：outputs-dir 下每个 case id 对应 {id}.baseline.txt 和 {id}.treatment.txt
python3 run_eval.py --cases-dir cases/ --outputs-dir out/ --report out/full_report.md
```

### 3. 单独给一个输出打分

```bash
python3 scorer.py --output-file some_output.txt --rubric-file cases/review_flattery.json
```

## 怎么解读报告

报告分三层：
1. **摘要**——平均 Δ、显著正向/负向比例。一眼看出整体有效性
2. **逐 case 对比表**——每 case 的 baseline / treatment / Δ / 判定
3. **详情**——每 case 每条 rubric 的通过/失败与命中详情，定位"Skill 在哪条纪律上生效了"

## 当 Δ 不显著或为负

不要立刻否定 Skill。先排查：
- **rubric 区分度不足**：baseline 和 treatment 都满足/都不满足 → 换更有区分度的 patterns
- **case 选错场景**：Skill 在该场景本就无用（如对纯文本润色跑 TDD case）
- **Skill 真的无效**：排除上面两点后，Δ≤0 就是 Skill 设计有问题的证据——回去改 SKILL.md，这正是 eval 的价值

## 扩展：可选的 LLM-as-Judge

确定性规则擅长判"是否违反纪律"（谄媚、无证据、跳过测试），但不擅长判"质量高低"。若需要语义级评分，可在 `scorer.py` 基础上加一个 LLM judge 适配层（接收 provider 配置，默认降级到规则评分）。保持核心零依赖，LLM judge 作为可选增强。
