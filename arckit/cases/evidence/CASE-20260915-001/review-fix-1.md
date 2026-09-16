# 退出授权补修

两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。

新增行为回归设置暂停队列与显式任务请求，退出后核对请求为空、全局关闭，再调用调度仍不启动执行。`node --test runtime/arcorbit/test/automation-coordinator.test.mjs`：通过，详见该测试中的 logout clears explicit work-item Auto requests 用例。
