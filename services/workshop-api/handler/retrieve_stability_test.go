package handler

import (
	"encoding/json"
	"strings"
	"testing"

	"todo/models"
)

func modelsCodeChunkWithID(id uint) models.CodeChunk {
	return models.CodeChunk{ID: id}
}

// 检索结果不稳定（一会有内容一会没内容）的后端规格：
// 1. 降级（Agent 超时/失败）必须与"真未命中"区分：degraded 字段 + 保留可解释性。
// 2. 本地 LIKE 检索必须转义通配符、抽取查询词（整段反馈正文直接 LIKE 恒不命中）、加确定性排序。
// 3. 向量排序必须稳定（同分 tie-break），否则结果抖动。

// --- degraded 字段 ---

func TestRetrieveResponseSerializesDegraded(t *testing.T) {
	b, err := json.Marshal(RetrieveResponse{Degraded: true, NeedCollect: true})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(b), `"degraded":true`) {
		t.Errorf("RetrieveResponse JSON 缺少 degraded 字段: %s", b)
	}
}

func TestDegradedRetrieveResponseMarksDegraded(t *testing.T) {
	data := degradedRetrieveResponse()
	if !data.Degraded {
		t.Error("降级响应必须标记 degraded=true，前端据此保留 stale 结果而非显示未命中")
	}
	if !data.NeedCollect {
		t.Error("降级响应应继续 need_collect 转追问")
	}
	if len(data.Hits) != 0 {
		t.Errorf("降级响应 hits 应为空切片/nil, got %d", len(data.Hits))
	}
}

// --- LIKE 转义 ---

func TestEscapeLike(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"plain", "plain"},
		{"100%", `100\%`},
		{"a_b", `a\_b`},
		{`back\slash`, `back\\slash`},
		{"%_%", `\%\_\%`},
	}
	for _, tc := range cases {
		if got := escapeLike(tc.in); got != tc.want {
			t.Errorf("escapeLike(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

// --- 查询词抽取：整段反馈正文不能直接做 LIKE ---

func TestLocalSearchTerms(t *testing.T) {
	if terms := localSearchTerms(""); len(terms) != 0 {
		t.Errorf("空查询应无词, got %v", terms)
	}
	if terms := localSearchTerms("   "); len(terms) != 0 {
		t.Errorf("空白查询应无词, got %v", terms)
	}

	// 整段反馈正文：按标点/空白切分，产出多个可 LIKE 的片段
	long := "在使用订单管理功能时，页面加载时间超过 5 秒，影响工作效率。"
	terms := localSearchTerms(long)
	if len(terms) < 2 {
		t.Fatalf("整段正文应切出多个查询词（否则本地层恒不命中）, got %v", terms)
	}
	for _, term := range terms {
		if len([]rune(term)) > 32 {
			t.Errorf("查询词过长（ LIKE 整段不可命中）: %q len=%d", term, len([]rune(term)))
		}
	}

	// 结果必须确定（同一输入两次调用一致），否则检索结果抖动
	again := localSearchTerms(long)
	if strings.Join(terms, "|") != strings.Join(again, "|") {
		t.Errorf("localSearchTerms 非确定性: %v vs %v", terms, again)
	}

	// 丢弃无意义碎片
	if terms := localSearchTerms("。，！？"); len(terms) != 0 {
		t.Errorf("纯标点应无查询词, got %v", terms)
	}
}

// --- 向量排序稳定性 ---

func TestSortScoredChunksDeterministic(t *testing.T) {
	// 同分元素按 chunk ID 升序 tie-break：输入顺序不得影响输出
	makeItems := func(ids ...uint) []scoredChunk {
		var out []scoredChunk
		for _, id := range ids {
			out = append(out, scoredChunk{chunk: modelsCodeChunkWithID(id), score: 0.5})
		}
		return out
	}

	desc := makeItems(9, 8, 7, 6, 5, 4, 3, 2, 1, 0)
	asc := makeItems(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)

	sortScoredChunks(desc)
	sortScoredChunks(asc)

	for i := 0; i < len(desc); i++ {
		if desc[i].chunk.ID != uint(i) {
			t.Fatalf("降序输入排序后未按 ID 升序: 第%d个 ID=%d", i, desc[i].chunk.ID)
		}
		if asc[i].chunk.ID != desc[i].chunk.ID {
			t.Fatalf("同分输入顺序不同导致输出不一致: asc[%d].ID=%d desc[%d].ID=%d", i, asc[i].chunk.ID, i, desc[i].chunk.ID)
		}
	}
}

func TestSortScoredChunksByScoreDesc(t *testing.T) {
	items := []scoredChunk{
		{chunk: modelsCodeChunkWithID(1), score: 0.1},
		{chunk: modelsCodeChunkWithID(2), score: 0.9},
		{chunk: modelsCodeChunkWithID(3), score: 0.5},
	}
	sortScoredChunks(items)
	if items[0].chunk.ID != 2 || items[1].chunk.ID != 3 || items[2].chunk.ID != 1 {
		t.Errorf("未按分数降序: ids = %d,%d,%d", items[0].chunk.ID, items[1].chunk.ID, items[2].chunk.ID)
	}
}
