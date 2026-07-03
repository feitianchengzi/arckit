# Arckit Evaluation Index

## 定位

`arckit/evaluation/` 维护用于检验 Arckit 面向真实软件研发活动的评测资产。

当前项目的核心最终产物是 skills，但当前项目存在的目的，是为了后续能更好地开发 skill 类项目和 code 类项目。这里的评测资产用于模拟人在真实软件研发活动中的输入、目标、纠错和协作链路，检查 Arckit 是否能同时支撑这两类最终产物。

评测资产不是正式产品规格，不直接改变 `arckit/spec/` 中的产品决策。评测结论可以作为后续修订产品方案、skill 架构或具体 skill 内容的证据。

## 目录

- `software-development-scenarios/` 软件研发场景评测集：按 skill 类最终产物和 code 类最终产物拆分真实研发活动样本。
