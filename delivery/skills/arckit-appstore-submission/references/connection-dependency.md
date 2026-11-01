# 必需依赖：arckit-appstore-connect

执行本 skill 前必须定位并读取 `arckit-appstore-connect/SKILL.md`。从当前 Agent 可见的技能元数据或项目明确配置中取得实际位置，将其根目录记为 `<connect-root>`；不假定同级安装目录，不搜索私钥，不复制脚本作为缺依赖的补救。

依赖尚未加载时，若当前处于宿主允许续接的已显式启动按需任务，按 arcforge-on-demand 的通用协议解析后读取；不把未加载直接判为未安装。解析后仍不可用或文件不可读时，报告 `blocked_missing_dependency: arckit-appstore-connect`，附查询实际支持的原因及恢复动作；仅返回 not-found 时不臆断未安装或禁用，歧义或漂移先解决后再加载；不绕过宿主按需能力授权，不自动调用隐藏目录。

连接协议与鉴权 UI 按 `<connect-root>/references/auth-handoff.md`，公共工具和范围按 `<connect-root>/references/tooling.md`。本 skill 的全部 `asc-*` 命令都使用该实际根目录下的 `scripts/`。

复用 credentialProfile 与目标 app/团队验证结果；窗口 saved 后继续原任务，取消则停止依赖动作。依赖只提供连接和工具，不扩大业务授权：TestFlight 使用 testflight scope，正式送审使用 submission scope，最终确认仍由送审 skill 负责。

本依赖是用户批准的 Apple skill 组合例外；Git 能力继续由 Agent 根据实际需要自主选择。
