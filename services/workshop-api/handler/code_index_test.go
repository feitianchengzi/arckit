package handler

import (
	"testing"
)

func TestChunkCodeFile(t *testing.T) {
	config := DefaultCodeIndexConfig()

	tests := []struct {
		name     string
		content  string
		filePath string
		wantMin  int
	}{
		{
			name: "Go函数",
			content: `package main

func Hello() string {
	return "hello"
}

func World() string {
	return "world"
}`,
			filePath: "main.go",
			wantMin:  2,
		},
		{
			name: "Go结构体",
			content: `package main

type User struct {
	Name string
	Age  int
}

func (u *User) GetName() string {
	return u.Name
}`,
			filePath: "user.go",
			wantMin:  2,
		},
		{
			name: "JavaScript函数",
			content: `export function hello() {
  return "hello";
}

export async function world() {
  return "world";
}`,
			filePath: "index.js",
			wantMin:  2,
		},
		{
			name: "Python类",
			content: `class User:
    def __init__(self, name):
        self.name = name

    def get_name(self):
        return self.name`,
			filePath: "user.py",
			wantMin:  1,
		},
		{
			name:     "空文件",
			content:  "",
			filePath: "empty.go",
			wantMin:  0,
		},
		{
			name:     "纯注释",
			content:  "// This is a comment\n/* block comment */",
			filePath: "comments.go",
			wantMin:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chunks := chunkCodeFile(tt.content, tt.filePath, config)
			if len(chunks) < tt.wantMin {
				t.Errorf("chunkCodeFile() returned %d chunks, want at least %d", len(chunks), tt.wantMin)
			}
			for _, ch := range chunks {
				if ch.text == "" {
					t.Error("chunk has empty text")
				}
				if ch.startLine <= 0 {
					t.Errorf("chunk has invalid startLine: %d", ch.startLine)
				}
				if ch.endLine < ch.startLine {
					t.Errorf("chunk endLine %d < startLine %d", ch.endLine, ch.startLine)
				}
				// 检索命中必须能标注来源文件；filePath 缺失会让命中卡片失去路径信息。
				if len(chunks) > 0 && tt.wantMin > 0 && ch.filePath != tt.filePath {
					t.Errorf("chunk filePath = %q, want %q", ch.filePath, tt.filePath)
				}
			}
		})
	}
}

func TestDetectSymbols(t *testing.T) {
	tests := []struct {
		name    string
		lines   []string
		wantMin int
	}{
		{
			name: "Go函数",
			lines: []string{
				"package main",
				"",
				"func Hello() string {",
				"	return \"hello\"",
				"}",
			},
			wantMin: 1,
		},
		{
			name: "Go结构体",
			lines: []string{
				"package main",
				"",
				"type User struct {",
				"	Name string",
				"}",
			},
			wantMin: 1,
		},
		{
			name: "JavaScript函数",
			lines: []string{
				"export function hello() {",
				"  return \"hello\";",
				"}",
			},
			wantMin: 1,
		},
		{
			name: "Python类",
			lines: []string{
				"class User:",
				"    def __init__(self):",
				"        pass",
			},
			wantMin: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			symbols := detectSymbols(tt.lines)
			if len(symbols) < tt.wantMin {
				t.Errorf("detectSymbols() returned %d symbols, want at least %d", len(symbols), tt.wantMin)
			}
		})
	}
}

func TestCosineSimilarity(t *testing.T) {
	tests := []struct {
		name    string
		a       []float64
		b       []float64
		wantMin float64
	}{
		{
			name:    "相同向量",
			a:       []float64{1, 0, 0},
			b:       []float64{1, 0, 0},
			wantMin: 0.99,
		},
		{
			name:    "正交向量",
			a:       []float64{1, 0, 0},
			b:       []float64{0, 1, 0},
			wantMin: -0.01,
		},
		{
			name:    "相似向量",
			a:       []float64{1, 2, 3},
			b:       []float64{1, 2, 3},
			wantMin: 0.99,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cosineSimilarity(tt.a, tt.b)
			if got < tt.wantMin-0.01 || got > 1.01 {
				t.Errorf("cosineSimilarity() = %f, want >= %f", got, tt.wantMin)
			}
		})
	}
}

func TestGeneratePseudoEmbedding(t *testing.T) {
	emb := generatePseudoEmbedding()
	if len(emb) != 128 {
		t.Errorf("generatePseudoEmbedding() returned %d dimensions, want 128", len(emb))
	}
	for i, v := range emb {
		expected := float64(i) / 128.0
		if v != expected {
			t.Errorf("emb[%d] = %f, want %f", i, v, expected)
		}
	}
}

func TestDefaultCodeIndexConfig(t *testing.T) {
	config := DefaultCodeIndexConfig()
	if config.MaxChunkLines <= 0 {
		t.Error("MaxChunkLines should be positive")
	}
	if config.MinChunkLines <= 0 {
		t.Error("MinChunkLines should be positive")
	}
	if config.BatchSize <= 0 {
		t.Error("BatchSize should be positive")
	}
}
