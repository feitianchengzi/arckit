package handler

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAgentSourcesRequireRealScopedDocumentation(t *testing.T) {
	root := t.TempDir()
	os.Mkdir(filepath.Join(root, "docs"), 0700)
	os.WriteFile(filepath.Join(root, "docs", "usage.md"), []byte("title\nactual export steps\nlast"), 0600)
	text, sources := parseVerifiedAgentSources(`answer [sources][{"path":"docs/usage.md","start_line":2,"end_line":2,"excerpt":"invented"},{"path":"../secrets.md","start_line":1,"end_line":1},{"path":"docs/missing.md","start_line":1,"end_line":1},{"path":"config.env","start_line":1,"end_line":1}][/sources]`, root)
	if text != "answer" || len(sources) != 1 || sources[0].Excerpt != "actual export steps" {
		t.Fatalf("unverified sources: %s %#v", text, sources)
	}
	outside := t.TempDir()
	os.WriteFile(filepath.Join(outside, "private.md"), []byte("secret"), 0600)
	os.Symlink(filepath.Join(outside, "private.md"), filepath.Join(root, "docs", "escape.md"))
	_, sources = parseVerifiedAgentSources(`[sources][{"path":"docs/escape.md","start_line":1,"end_line":1}][/sources]`, root)
	if len(sources) != 0 {
		t.Fatal("escaped project workspace")
	}
	for _, content := range []string{`[sources]not json[/sources]`, `[sources][{"path":"docs/usage.md","start_line":0,"end_line":3}][/sources]`} {
		clean, sources := parseVerifiedAgentSources(content, root)
		if strings.Contains(clean, "[sources]") || len(sources) != 0 {
			t.Fatal("invalid source leaked")
		}
	}
}
