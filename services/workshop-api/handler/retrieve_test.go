package handler

import (
	"testing"
)

func TestMergeAndComputeConfidence(t *testing.T) {
	cases := []struct {
		name      string
		hits      []RetrievalHit
		threshold float64
		wantConf  float64
		wantDraft bool
	}{
		{
			name:      "empty hits yields zero confidence",
			hits:      []RetrievalHit{},
			threshold: 0.75,
			wantConf:  0,
			wantDraft: false,
		},
		{
			name: "single high-score FAQ hit exceeds threshold",
			hits: []RetrievalHit{
				{Source: "product_faq", Type: "faq", Score: 0.85, Title: "如何登录", Snippet: "点击右上角登录按钮"},
			},
			threshold: 0.75,
			wantConf:  0.85 * sourceWeightProductFAQ,
			wantDraft: true,
		},
		{
			name: "single low-score code hit below threshold",
			hits: []RetrievalHit{
				{Source: "customer_code", Type: "code", Score: 0.6, Title: "src/auth.ts", Snippet: "login function"},
			},
			threshold: 0.75,
			wantConf:  0.6 * sourceWeightCustomerCode,
			wantDraft: false,
		},
		{
			name: "multiple hits picks max weighted score",
			hits: []RetrievalHit{
				{Source: "customer_doc", Type: "doc", Score: 0.7, Title: "README", Snippet: "overview"},
				{Source: "product_faq", Type: "faq", Score: 0.8, Title: "FAQ", Snippet: "answer"},
				{Source: "customer_code", Type: "code", Score: 0.9, Title: "main.go", Snippet: "func main"},
			},
			threshold: 0.75,
			wantConf:  0.8 * sourceWeightProductFAQ, // 0.8*1.2 = 0.96, max of all three
			wantDraft: true,                         // 0.96 >= 0.75
		},
		{
			name: "product_facts hit with high score",
			hits: []RetrievalHit{
				{Source: "product_facts", Type: "doc", Score: 0.95, Title: "arckit-spec", Snippet: "spec content"},
			},
			threshold: 0.75,
			wantConf:  0.95 * sourceWeightProductFacts,
			wantDraft: true,
		},
		{
			name: "FAQ exact match dominates",
			hits: []RetrievalHit{
				{Source: "product_faq", Type: "faq", Score: 0.99, Title: "exact", Snippet: "precise"},
				{Source: "customer_code", Type: "code", Score: 0.5, Title: "x.go", Snippet: "low"},
			},
			threshold: 0.75,
			wantConf:  0.99 * sourceWeightProductFAQ,
			wantDraft: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			confidence, hits := mergeHitsAndComputeConfidence(tc.hits)
			if len(hits) != len(tc.hits) {
				t.Fatalf("hits count = %d, want %d", len(hits), len(tc.hits))
			}
			if diff := confidence - tc.wantConf; diff > 0.001 || diff < -0.001 {
				t.Errorf("confidence = %f, want %f", confidence, tc.wantConf)
			}
			gotDraft := confidence >= tc.threshold
			if gotDraft != tc.wantDraft {
				t.Errorf("would generate draft = %v, want %v (confidence=%f, threshold=%f)", gotDraft, tc.wantDraft, confidence, tc.threshold)
			}
		})
	}
}

func TestSourceWeights(t *testing.T) {
	// Verify weights are in expected order: FAQ > facts > doc > code
	if sourceWeightProductFAQ <= sourceWeightProductFacts {
		t.Error("FAQ weight should be > facts weight")
	}
	if sourceWeightProductFacts <= sourceWeightCustomerDoc {
		t.Error("facts weight should be > doc weight")
	}
	if sourceWeightCustomerDoc <= sourceWeightCustomerCode {
		t.Error("doc weight should be > code weight")
	}
	if sourceWeightProductFAQ <= 1.0 {
		t.Error("FAQ weight should be > 1.0")
	}
	if sourceWeightCustomerCode >= 1.0 {
		t.Error("code weight should be < 1.0")
	}
}

func TestBuildDraftContentFromHits(t *testing.T) {
	hits := []RetrievalHit{
		{Source: "product_faq", Type: "faq", Title: "登录问题", Snippet: "请点击右上角", SourceRef: "faq-001"},
		{Source: "customer_code", Type: "code", Title: "src/auth.ts", Snippet: "export function login()", SourceRef: "src/auth.ts:42"},
	}

	content := buildDraftContentFromHits(hits, "如何登录系统")

	if content == "" {
		t.Fatal("draft content should not be empty")
	}
	if len(content) < 10 {
		t.Fatalf("draft content too short: %d chars", len(content))
	}
}

func TestMapSourceToRetrievalHitSource(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"customer_doc", "customer_doc"},
		{"product_faq", "product_faq"},
		{"product_facts", "product_facts"},
		{"customer_code", "customer_code"},
		{"code", "customer_code"},
		{"faq", "product_faq"},
		{"doc", "customer_doc"},
		{"unknown", "customer_doc"},
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got := normalizeHitSource(tc.input)
			if got != tc.want {
				t.Errorf("normalizeHitSource(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}
