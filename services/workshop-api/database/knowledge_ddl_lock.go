package database

import "gorm.io/gorm"

// codeChunksDDLLockKey 串行化跨进程/跨测试进程对 code_index.code_chunks
// 与知识库表的破坏性 DDL（DROP/RENAME/CREATE）。PostgreSQL advisory lock
// 在连接断开时自动释放，不会死锁。
const codeChunksDDLLockKey int64 = 0xA11C0DE1

// WithKnowledgeDDLLock 在排他锁内执行知识库相关 DDL。
// database 与 handler 包的测试并行跑时不得再对同一物理表抢 DROP/CREATE。
func WithKnowledgeDDLLock(db *gorm.DB, fn func() error) error {
	if db == nil {
		return fn()
	}
	if err := db.Exec(`SELECT pg_advisory_lock(?)`, codeChunksDDLLockKey).Error; err != nil {
		return err
	}
	defer func() {
		_ = db.Exec(`SELECT pg_advisory_unlock(?)`, codeChunksDDLLockKey).Error
	}()
	return fn()
}
