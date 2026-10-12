package handler

import (
	"testing"

	"todo/models"
)

// TestProcessWithLocalLLMNeedCollectConsistency 验证本地索引降级路径的 NeedCollect
// 与 OpenHands 路径阈值一致：confidence < 0.75 即触发 NeedCollect。
// 修复前：有结果分支返回 confidence=0.7 但 NeedCollect=false（与 shouldMarkAgentMessageUnresolved 的 0.7<0.75 判定矛盾）。
// DB-gated，无 DSN 跳过。
func TestProcessWithLocalLLMNeedCollectConsistency(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)

	// 本地索引查 code_index.code_chunks，测试 helper 不建该表，手动建 schema + 表。
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS code_index").Error; err != nil {
		t.Fatalf("create code_index schema: %v", err)
	}
	if err := db.AutoMigrate(&models.CodeChunk{}); err != nil {
		t.Fatalf("migrate code_chunks: %v", err)
	}

	t.Run("no results triggers NeedCollect with zero confidence", func(t *testing.T) {
		resp, err := processWithLocalLLM(db, 9999, "完全不存在的搜索词xyz", nil)
		if err != nil {
			t.Fatalf("processWithLocalLLM: %v", err)
		}
		if !resp.NeedCollect {
			t.Fatalf("no results: NeedCollect = false, want true")
		}
		if resp.Confidence != 0 {
			t.Fatalf("no results: Confidence = %v, want 0", resp.Confidence)
		}
		// 降级路径无 LLM，不编造 structured（agent_confidence.go 原则：不允许编造内容占位）。
		// 前端 formatStructuredFeedback(undefined, question) 退回提问原文，是合理 fallback。
		if resp.Structured != nil {
			t.Fatalf("no results: Structured = %v, want nil (降级路径不编造结构化总结)", resp.Structured)
		}
	})

	t.Run("has results with confidence 0.7 triggers NeedCollect (consistent with 0.75 threshold)", func(t *testing.T) {
		// 插一条 code chunk 含搜索词 "导出乱码"
		chunk := models.CodeChunk{
			ProjectID: 9998, SourceID: 1, FilePath: "export.go",
			SymbolType: models.CodeChunkSymbolFunction, SymbolName: "ExportCSV",
			StartLine: 1, EndLine: 10, ChunkText: "导出乱码处理函数", Embedding: "[]",
		}
		if err := db.Create(&chunk).Error; err != nil {
			t.Fatalf("create chunk: %v", err)
		}

		resp, err := processWithLocalLLM(db, 9998, "导出乱码", nil)
		if err != nil {
			t.Fatalf("processWithLocalLLM: %v", err)
		}
		if resp.Confidence != 0.7 {
			t.Fatalf("has results: Confidence = %v, want 0.7", resp.Confidence)
		}
		// 0.7 < 0.75 阈值，应触发 NeedCollect（与 OpenHands 路径 + shouldMarkAgentMessageUnresolved 一致）
		if !resp.NeedCollect {
			t.Fatalf("has results confidence 0.7: NeedCollect = false, want true (0.7 < 0.75 阈值应触发，与 unresolved 标记一致)")
		}
		// 降级路径不编造 structured；前端退回提问原文 + 客户看到的代码片段回答作为上下文。
		if resp.Structured != nil {
			t.Fatalf("has results: Structured = %v, want nil (降级路径不编造结构化总结)", resp.Structured)
		}
	})
}
