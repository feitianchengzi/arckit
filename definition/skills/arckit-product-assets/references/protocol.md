# 协议与入口

固定文件 `arckit/product/record.json` 使用 `arcorbit-product/v1`。
字段：product_id、revision、status、description、vision、audience、principles、assets、idea。idea 为空表示没有正式录入记录；正式录入由应用验证 GitHub、本地目录及项目关联后写入 id、name、created_at、recorded_at。
status 是 null / exploring / active / paused / archived；null 表示尚未设置。
assets 每项是 title、kind、path；kind 是 spec / interaction / visual / tech / material / other，path 是仓库相对路径。

确定性实现是 `scripts/product-assets.mjs`，可作为 Node 模块被应用导入：

```
node <skill>/scripts/product-assets.mjs read <root>
node <skill>/scripts/product-assets.mjs init <root>
node <skill>/scripts/product-assets.mjs update <root> <patch.json> <expected-revision>
```

先读取再修改；patch 只包含要更新的资料字段。更新拒绝过期修订、未知字段、身份覆盖和越界路径。
单独调用 init 需要已有项目资料初始化授权；损坏文件不能当作未初始化。
锁冲突先确认当前是否有写入者，进程中断留下的锁须核对后恢复。

ArcOrbit 场景使用 product_context、product_environment、product_materials、product_propose、product_execute 工具，所有身份和路径范围由应用绑定。
product_propose 只产生建议；product_execute 只执行应用中已经确认的精确计划。
用户手工输入或确认后再次读取上下文；工具错误按返回原因恢复。

未完成录入仅在应用本机临时库保存；正式记录必须位于关联项目目录的 arckit/product/，列表从产品集关联目录恢复。

资料分支是 arcorbit/product，应用独立处理其 Git index 与远端冲突。
独立工作区不自行推送该分支覆盖应用同步基线，使用应用共享入口或用户明确指定的 Git 流程。

接入计划字段：mode=create|existing，project_id，name，organization_id，repository=existing|create|none，git_url，github_owner，github_name，directory=material|selected，workspace_path 为本机正式目录绝对路径。关联已有项目使用 repository=none 沿用服务器仓库；新建项目必须有已有或新建仓库。已有材料可建议原地 material 或复制到 selected；空白使用 selected 并提示用户选择位置。不得建议应用内部工作区。selected 路径只能来自原生选择器授权或真实项目绑定；缺少路径仍提交其余可完成部分。组织及目录选择须用户核对。

product_context.candidates 提供当前可访问项目、组织和已知成员；不要猜 ID。product_environment 的 github=true 会查询 GitHub 登录主体/组织，默认只检测材料 Git；失败保留未知。product_materials 返回有限文件列表、文本或图片 inputImage。PNG/JPEG/WebP 限 5 MB，文本限 150 KB；设计源文件/PDF/压缩包需导出图或说明。

product_propose 接收 revision、patch、plan、reason。patch 允许 status/description/vision/audience/principles/assets；名称通过 plan.name 建议并在界面核对。缺失信息可留空，其他枚举仍必须有效。返回方案后明确指出缺项和当前主动作；已批准方案使用 product_execute，错误后使用真实回执及环境信息提出恢复方案。

## 探索与执行来源

product_environment 是快捷事实工具，不是排查流程。product_context.command_environment 给出业务执行来源、PATH 目录和发现的 Git/gh 路径；environment 是带 checked_at 的最近检测，可重新检查。不要将旧失败当作刚验证的状态。

自主根据错误选择下一项有信息价值的检查：例如区分启动 ENOENT、非零退出、网络/认证响应和目录解析；必要时用原生命令寻找安装位置、验证绝对路径、核对授权材料中的 Git 关系。以上是判断示例，不是必须依次执行的脚本。没有证据时保留未知，能够继续整理的内容继续完成。

原生命令默认只读且无网络，突破沙箱沿用可见审批；只读并不是目录级读取隔离。仅探索当前材料、相关 Git 元数据与工具安装信息，不读取凭据正文、不读取无关项目、不擅自安装或改登录。材料正文/图片优先使用材料工具。禁止通过原生命令绕过 product_execute 的确认进行创建、修改、搬移或共享。

结论标注执行来源、实际程序路径与检测时间。原生命令成功不证明业务工具已经恢复；需要时用快捷工具复验。业务工具不会因工具声明更新而替换旧线程，旧会话仍可使用原生命令探索和已有工具。Agent 不能修改运行器、全局 PATH 或凭据去隐藏故障。

## 界面与材料结果

context.interaction 提供当前字段、actual_path、material_action 与 actions。plan 是已保存方案，proposal 是待采纳建议；不能互换。发送消息前界面保存可保存的编辑，因此询问左侧选项时按最新 plan 回答。目录选择未完成时指向“选择正式目录”，不承诺任意推测路径可执行。Workshop 组织与 GitHub 主体分别决定业务归属和代码归属。

selected 将材料复制到选定 GitHub 本地仓库，保留来源并排除原 .git、依赖缓存、凭据和符号链接；不同内容不覆盖。明确报告未复制项、实际正式目录和原材料保留。复制不是提交或推送；管理资料已共享也不代表源码和设计正文已同步。旧 managed 方案需要重新选择，不沿用历史确认。
