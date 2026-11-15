package handler

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Only explicitly exposed product documentation can become customer-visible evidence.
// Model-proposed paths and line numbers alone never establish a source.
type AgentSource struct {
	Path      string `json:"path"`
	StartLine int    `json:"start_line"`
	EndLine   int    `json:"end_line"`
	Excerpt   string `json:"excerpt"`
}

var agentSourcesBlock = regexp.MustCompile(`(?s)\[sources\]\s*(.*?)\s*\[/sources\]`)

func parseVerifiedAgentSources(content, workspace string) (string, []AgentSource) {
	blocks := agentSourcesBlock.FindAllStringSubmatch(content, -1)
	content = strings.TrimSpace(agentSourcesBlock.ReplaceAllString(content, ""))
	if len(blocks) == 0 || workspace == "" {
		return content, nil
	}
	var proposed []AgentSource
	if json.Unmarshal([]byte(blocks[0][1]), &proposed) != nil {
		return content, nil
	}
	roots := []string{workspace}
	// Multi-repo workspaces expose only their explicit repository symlink targets.
	multiRoot := filepath.Join(ohRepoRoot(), ".agent-workspaces")
	relative, relativeErr := filepath.Rel(multiRoot, workspace)
	isMulti := relativeErr == nil && len(strings.Split(relative, string(filepath.Separator))) == 2 && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
	if entries, err := os.ReadDir(workspace); err == nil && isMulti {
		for _, entry := range entries {
			if entry.Type()&os.ModeSymlink != 0 && regexp.MustCompile(`^repo-[0-9]+$`).MatchString(entry.Name()) {
				if root, err := filepath.EvalSymlinks(filepath.Join(workspace, entry.Name())); err == nil {
					roots = append(roots, root)
				}
			}
		}
	}
	result := []AgentSource{}
	for _, source := range proposed {
		if len(result) >= 4 {
			break
		}
		path := filepath.Clean(source.Path)
		if filepath.IsAbs(path) || path == ".." || strings.HasPrefix(path, ".."+string(filepath.Separator)) {
			continue
		}
		// Restrict public evidence to docs/help Markdown or root readme, never code/config/secrets.
		normalized := filepath.ToSlash(path)
		parts := strings.Split(strings.ToLower(normalized), "/")
		isDoc := false
		for _, part := range parts {
			if strings.HasPrefix(part, ".") {
				isDoc = false
				break
			}
			if part == "docs" || part == "help" {
				isDoc = true
			}
		}
		if !strings.HasSuffix(strings.ToLower(path), ".md") || (!isDoc && !strings.EqualFold(filepath.Base(path), "README.md")) {
			continue
		}
		if source.StartLine < 1 || source.EndLine < source.StartLine || source.EndLine-source.StartLine >= 20 {
			continue
		}
		real, err := filepath.EvalSymlinks(filepath.Join(workspace, path))
		if err != nil {
			continue
		}
		allowed := false
		for _, root := range roots {
			resolved, err := filepath.EvalSymlinks(root)
			if err != nil {
				continue
			}
			rel, err := filepath.Rel(resolved, real)
			if err == nil && rel != ".." && !filepath.IsAbs(rel) && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
				allowed = true
				break
			}
		}
		if !strings.HasSuffix(strings.ToLower(real), ".md") {
			continue
		}
		if !allowed {
			continue
		}
		info, err := os.Stat(real)
		if err != nil || !info.Mode().IsRegular() || info.Size() > 1024*1024 {
			continue
		}
		data, err := os.ReadFile(real)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		if source.EndLine > len(lines) {
			continue
		}
		source.Path = normalized
		source.Excerpt = strings.Join(lines[source.StartLine-1:source.EndLine], "\n")
		if len(source.Excerpt) > 4000 {
			continue
		}
		result = append(result, source)
	}
	return content, result
}
func persistAgentSources(message *AgentMessageRecord, sources []AgentSource) {
	if len(sources) == 0 {
		return
	}
	metadata := map[string]interface{}{}
	if message.Metadata != nil {
		_ = json.Unmarshal([]byte(*message.Metadata), &metadata)
	}
	metadata["sources"] = sources
	raw, _ := json.Marshal(metadata)
	value := string(raw)
	message.Metadata = &value
}
