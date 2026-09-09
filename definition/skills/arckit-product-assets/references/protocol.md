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

ArcOrbit 场景使用 product_context、product_materials、product_propose、product_execute 工具，所有身份和路径范围由应用绑定。
product_propose 只产生建议；product_execute 只执行应用中已经确认的精确计划。
用户手工输入或确认后再次读取上下文；工具错误按返回原因恢复。

未完成录入仅在应用本机临时库保存；正式记录必须位于关联项目目录的 arckit/product/，列表从产品集关联目录恢复。

资料分支是 arcorbit/product，应用独立处理其 Git index 与远端冲突。
独立工作区不自行推送该分支覆盖应用同步基线，使用应用共享入口或用户明确指定的 Git 流程。
