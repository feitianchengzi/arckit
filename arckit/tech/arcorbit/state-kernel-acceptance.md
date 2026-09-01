# ArcOrbit Desktop State Kernel 架构验收

## 验收对象

- 验收日期：2026-08-30。
- 基线提交：`beedc10` 上的未提交实现变更。
- 环境：macOS Darwin 24.6.0 x86_64、Node.js v22.22.2、Electron 31.7.7。
- 状态边界：Desktop Store v17、`desktop-state-partitions/v1`、`desktop-session-messages/v1`、`desktop-task-projection/v1`。
- 增量边界：`desktop-state-view/v1`、`run.activity.patch/v1`、`run.activity.snapshot/v1`。

## 证据命令

```sh
cd runtime/arcorbit
npm run check
npm run benchmark:state-kernel
ARCORBIT_STATE_KERNEL_PERFORMANCE_TEST=1 node --expose-gc --test \
  test/state-kernel-performance.test.mjs \
  test/run-activity-sync.test.mjs \
  test/desktop-store.test.mjs
```

## 大 Store 与 Warm Snapshot

`benchmark:state-kernel` 使用 52,428,800 bytes（50 MiB）历史消息 fixture。冷启动只读取 control 与 Task Projection 两个分区；warm state view 捕获不读取任何分区，历史 message 分区读取数为零。control snapshot 为 2,585 bytes，warm capture p50/p95/p99 分别为 0.506/0.759/1.437 微秒。

这证明 warm Automation Snapshot 的输入规模由有界 control state 决定，不随历史 message/evidence 体积线性增长。历史正文只由显式 session/run detail 查询加载。

## 三 Lane 连续流负载

基准按生产 activity 合并节奏 160 ms 模拟三个 workspace lane，各 lane 3,750 次、总计 11,250 次事件，等价覆盖 1,800 秒（30 分钟）连续流：

- 回放墙钟 193.46 ms，CPU 264.29 ms。
- 折算单逻辑核心占用 0.01%。
- event-loop delay p99/max 12.70 ms。
- heap 增量 183,400 bytes。
- 三个 lane 最终 revision 均为 3,750。

该结果是确定性的 30 分钟等价事件回放，不是等待 30 分钟的墙钟 soak；它用于验证每事件成本、event-loop delay 与堆增长上界。发布构建仍应在目标 Electron 机器上执行墙钟 soak，观察 UI/Chromium/GPU 等本基准未覆盖的宿主成本。

## Single-flight 与恢复

- 连续 100 次 activity invalidation 的测试证明最大并发消费数为 1；连续 revision 本地应用 patch，revision gap 只读取目标 Run activity snapshot。
- Store 测试覆盖旧单体 Store 到 v17 分区迁移，并验证 messages 与 Task Projection 无损保留。
- 故障注入覆盖新分区写入后、control manifest 提交前的失败；旧 control manifest 保持不变，未提交分区被清理。
- Run activity/messages/result 仍由既有 per-Run evidence 边界恢复；Desktop control 不嵌入完整 activity 或 transcript。

## 结论

当前实现满足 State Kernel 单次加载、单 revision view、共享 Automation query context、分层持久化、增量 Run activity 同步、single-flight 和 crash-safe manifest commit 的架构要求。剩余发布级风险不是已知架构缺口，而是目标 Electron 构建上的长时间宿主 soak 与真实用户数据分布观测。
