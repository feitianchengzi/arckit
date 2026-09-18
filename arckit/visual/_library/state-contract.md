# 组件状态与验收契约

本契约是组件目录的公共规则。组件声明适用状态；专属变体叠加在公共规则上，不省略键盘、等待与失败反馈。

| 状态 | 可见表达 | 约束 |
|---|---|---|
| default | canvas / text，必要控件使用 control_border | 装饰分隔线不能充当输入边界 |
| hover | 中性控件使用 ink.100；主按钮 accent.hover | 文字对比度保持，焦点独立存在 |
| pressed / active | 主按钮 accent.pressed；次按钮 ink.100 与 control_border | 不使列表、消息和输入内容缩放或位移 |
| selected | accent.soft 背景、中性文字和 accent.base 指示线 | 与运行状态、focus 和 hover 区别明确 |
| focus-visible | semantic.focus 不透明 2px 环，2px 间隔 | 所有操作入口适用；不被 overflow 裁切 |
| disabled | disabled_bg / disabled_text，无 hover 强调 | 原因显示于邻近说明，不能仅靠禁用按钮的 tooltip |
| busy | 保留标签，追加进行说明和 aria-busy | 动作是否可重复由交互决定；不能空转无说明 |
| loading | 保持结构，ink.100 静态骨架并显示加载文本 | 有快照时优先保留快照，不闪空页面 |
| empty | 短标题、说明及现有首要动作 | 不填假指标、假完成、无关引导卡 |
| error | danger.soft 背景、danger.base 文本，说明原因/影响和恢复动作 | 保留输入、最近可信结果与状态；不凭颜色识别 |
| stale / disconnected | info 或 warning 文本，显示来源与新鲜度 | 断连不等于事情失败，不把未知显示为 0 |
| conflict | warning 提示实际冲突对象和核对入口 | 不用成功反馈覆盖部分失败 |
| success | success.soft / success.base，说明完成对象 | 执行完成不能代表用户已验收 |

## 业务与运行状态映射

| 业务键 | 标签 | 颜色 |
|---|---|---|
| pending_review | 待评审 | ink.600 / ink.100 |
| pending | 待处理 | warning.strong / warning.soft |
| in_progress | 进行中 | accent.strong / accent.soft |
| completed | 已完成 | success.base / success.soft |
| accepted | 已验收 | accepted.base / accepted.soft |
| cancelled | 已取消 | danger.base / danger.soft，普通标签 |
| blocked | 已阻塞 | warning.strong / warning.soft，边界加重 |

运行层独立显示：空闲（中性）、执行中（橙）、排队（中性）、待决定（琥珀）、暂停（中性）、外部等待（琥珀）、失败（红）、连接中断（有说明的警示）。每个状态有文本；不确定时显示“状态未知”。只有已知总量才使用百分比。

## 组件专项规则

- Button：primary 的 default/hover/active 为 accent.base/hover/pressed，前景为 accent.on，无装饰性深橙边框，凭可读标签识别操作；普通链接与 ghost 使用 semantic.text；destructive 使用 danger.base，hover/pressed 以 control_border 加重，保持语义色；secondary/ghost hover 使用 ink.100。局部决策区只有一个实心主动作。
- FormField / Composer：空值、输入中、错误、只读和禁用均保持文字可读；错误文字紧邻输入，错误边界使用 danger.base；焦点不覆盖错误说明。只读内容可以选择复制。
- NavigationRow / TaskListRow：单行标题省略，状态不挤掉主对象；选中和键盘焦点独立。项目计数按现有语义显示，图标计数具有可访问名称。
- RuntimePopover：抬升表面、细边界、small 阴影；需要处理/执行/排队按交互分组，底部动作固定，长内容局部滚动。定位反馈不模拟执行完成。
- ConversationSurface：Agent 正文 15/24px，过程信息 12/18px；需要用户执行的权限标签与动作仍为 13/18px。无内容不产生空 reasoning 区块。只有简短活动摘要采用单行省略。
- ArtifactEvidence：名称与来源可读；验证未运行、通过、失败、外部未确认分别有文本。Diff 增删使用 + / − 标记与语义色，代码区允许局部横向滚动。
- LoginGate / AccountPanel：登录错误使用红色表单提示；会话恢复使用信息文本；不显示 access/refresh token。窄屏面板宽度不超过可用宽度。
- macOS 原生窗口控件在组件预览中仅说明预留区域；网页不仿造原生行为。

## 检查范围

1. 核对所有组件 token_refs 和主题覆盖的键可解析；组件不得重复命名。
2. 检查主按钮三个交互状态、七状态标签、正文/辅助文字、必要边界和焦点对比度。
3. 查看亮色、暗色和兼容混合主题、控件默认/hover/focus/disabled/busy/error、消息折叠与长文本。
4. 组件预览在 1440px、760px、390px 和 200% 缩放下不产生页面级水平溢出。
5. 完整业务布局、焦点返回、原生窗口、读屏和真实执行行为在各自消费者中验证，不能以组件样张代替。
