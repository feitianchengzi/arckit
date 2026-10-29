package feedback

import (
	"testing"
	"time"
)

func TestSearchWindowAndLiteralQuery(t *testing.T) {
	f, err := ParseSearch("  导出_100%  ", "developing", "2026-10-01T00:00:00+08:00", "2026-11-01T00:00:00+08:00", "created")
	if err != nil {
		t.Fatal(err)
	}
	if f.Query != "导出_100%" || f.Start.UTC().Format(time.RFC3339) != "2026-09-30T16:00:00Z" {
		t.Fatalf("unexpected filter: %+v", f)
	}
	if f.Pattern() != "%导出\\_100\\%%" {
		t.Fatalf("wildcard query must be literal: %q", f.Pattern())
	}
	if _, err := ParseSearch("", "", "2026-11-01", "2026-10-01", ""); err == nil {
		t.Fatal("inverted interval accepted")
	}
	if _, err := ParseSearch("", "unknown", "", "", ""); err == nil {
		t.Fatal("unknown status accepted")
	}
}
func TestConclusionRequiresEvidenceAndSafeDelivery(t *testing.T) {
	c := Conclusion{Kind: "delivery", Title: "修复完成", Body: "请更新验证", ArtifactURL: "javascript:alert(1)"}
	if c.Validate() == nil {
		t.Fatal("unsafe URL accepted")
	}
	c.ArtifactURL = "https://example.com/release/2"
	if err := c.Validate(); err != nil {
		t.Fatal(err)
	}
	c.Body = " "
	if c.Validate() == nil {
		t.Fatal("empty conclusion accepted")
	}
}
func TestAcceptanceIsBoundToCurrentConclusion(t *testing.T) {
	if ValidateResponse("accepted", 2, 3, "delivery") == nil {
		t.Fatal("stale conclusion accepted")
	}
	if ValidateResponse("accepted", 3, 3, "not_planned") == nil {
		t.Fatal("rejected proposal accepted as delivered")
	}
	if err := ValidateResponse("needs_review", 3, 3, "not_planned"); err != nil {
		t.Fatal(err)
	}
	if err := ValidateResponse("accepted", 3, 3, "delivery"); err != nil {
		t.Fatal(err)
	}
}
