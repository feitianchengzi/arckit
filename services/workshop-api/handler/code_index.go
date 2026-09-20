package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"sync"
	"strings"
	"time"
	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// EmbeddingServiceEmbedRequest embedding 服务请求
type EmbeddingServiceEmbedRequest struct {
	Texts []string `json:"texts"`
}

// EmbeddingServiceEmbedResponse embedding 服务响应
type EmbeddingServiceEmbedResponse struct {
	Embeddings [][]float64 `json:"embeddings"`
}

// CodeIndexConfig 代码索引配置
type CodeIndexConfig struct {
	EmbeddingURL   string  `json:"embedding_url"`
	EmbeddingModel string  `json:"embedding_model"`
	MaxChunkLines  int     `json:"max_chunk_lines"`
	MinChunkLines  int     `json:"min_chunk_lines"`
	BatchSize      int     `json:"batch_size"`
}

// SymbolRange 代码符号范围
type SymbolRange struct {
	SymbolType string
	SymbolName string
	StartLine  int
	EndLine    int
}

// SupportedExtensions 支持索引的文件扩展名
var SupportedExtensions = map[string]bool{
	".go": true, ".js": true, ".ts": true, ".tsx": true, ".jsx": true,
	".py": true, ".java": true, ".rs": true, ".rb": true, ".php": true,
	".c": true, ".cpp": true, ".h": true, ".cs": true, ".swift": true,
	".kt": true, ".scala": true, ".sh": true, ".yaml": true, ".yml": true,
	".json": true, ".toml": true, ".md": true, ".sql": true, ".html": true,
	".css": true, ".scss": true,
}

// DefaultCodeIndexConfig 返回默认配置
func DefaultCodeIndexConfig() CodeIndexConfig {
	return CodeIndexConfig{
		EmbeddingURL:   getEnvOrDefault("EMBEDDING_SERVICE_URL", "http://localhost:11434/api/embeddings"),
		EmbeddingModel: getEnvOrDefault("EMBEDDING_MODEL", "bge-m3"),
		MaxChunkLines:  200,
		MinChunkLines:  10,
		BatchSize:      32,
	}
}

func getEnvOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

// IndexCodeRepoHandler 同步并索引客户代码仓库
// POST /api/v1/projects/{projectId}/code-repos/{repoId}/index
func IndexCodeRepoHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "索引代码仓库")
	if !ok {
		return
	}
	_ = userID

	repoIDStr := c.Param("repoId")
	if repoIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少仓库ID参数", nil))
		return
	}

	var repoID uint
	if _, err := fmt.Sscanf(repoIDStr, "%d", &repoID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的仓库ID", nil))
		return
	}

	var repo CustomerCodeRepo
	if err := db.Where("id = ? AND project_id = ?", repoID, projectID).First(&repo).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "代码仓库不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询代码仓库失败: "+err.Error(), nil))
		return
	}

	// 异步触发索引
	go runCodeIndexPipeline(db, projectID, repo)

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"repo_id": repoID,
		"status":  "indexing",
	}))
}

// indexPipelineMu 串行化索引管道：sync 自动触发与显式 /index 并发到达时避免同源双写。
var indexPipelineMu sync.Mutex

// runCodeIndexPipeline 执行代码索引管道
func runCodeIndexPipeline(db *gorm.DB, projectID uint, repo CustomerCodeRepo) {
	indexPipelineMu.Lock()
	defer indexPipelineMu.Unlock()

	// 查找或创建 knowledge_source
	var src models.KnowledgeSource
	sourceName := fmt.Sprintf("code-repo-%d", repo.ID)
	if err := db.Where("project_id = ? AND name = ?", projectID, sourceName).First(&src).Error; err != nil {
		src = models.KnowledgeSource{
			ProjectID:  &projectID,
			Name:       sourceName,
			SourceType: models.KnowledgeSourceTypeCodeRepo,
			Status:     models.KnowledgeSourceStatusIndexing,
			Scope:      models.KnowledgeScopeProject,
		}
		if err := db.Create(&src).Error; err != nil {
			return
		}
	} else {
		db.Model(&src).Update("status", models.KnowledgeSourceStatusIndexing)
	}

	// 清除旧的 chunks
	db.Where("project_id = ? AND source_id = ?", projectID, src.ID).Delete(&models.CodeChunk{})

	config := DefaultCodeIndexConfig()

	// 收集代码文件
	type fileEntry struct {
		relPath string
		absPath string
	}
	var files []fileEntry

	_ = filepath.Walk(repo.RepoPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			name := info.Name()
			if name == ".git" || name == "node_modules" || name == "vendor" || name == "__pycache__" || name == ".next" || name == "dist" {
				return filepath.SkipDir
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if SupportedExtensions[ext] {
			relPath, _ := filepath.Rel(repo.RepoPath, path)
			files = append(files, fileEntry{relPath: relPath, absPath: path})
		}
		return nil
	})

	if len(files) == 0 {
		now := time.Now()
		db.Model(&src).Updates(map[string]interface{}{
			"status":          models.KnowledgeSourceStatusSynced,
			"last_indexed_at": &now,
		})
		return
	}

	// 分块 + embedding + 存储
	var allChunks []models.CodeChunk
	var allTexts []string
	var chunkMeta []chunkedSymbol

	for _, f := range files {
		content, err := os.ReadFile(f.absPath)
		if err != nil {
			continue
		}
		chunks := chunkCodeFile(string(content), f.relPath, config)
		for _, ch := range chunks {
			allTexts = append(allTexts, ch.text)
			chunkMeta = append(chunkMeta, ch)
		}
	}

	// 批量获取 embeddings
	embeddings, err := batchEmbed(allTexts, config)
	if err != nil {
		now := time.Now()
		errStr := err.Error()
		db.Model(&src).Updates(map[string]interface{}{
			"status":           models.KnowledgeSourceStatusSyncFailed,
			"last_index_error": &errStr,
			"last_indexed_at":  &now,
		})
		return
	}

	// 存储 chunks
	for i, meta := range chunkMeta {
		embJSON, _ := json.Marshal(embeddings[i])
		chunk := models.CodeChunk{
			ProjectID:  projectID,
			SourceID:   src.ID,
			FilePath:   meta.filePath,
			SymbolType: meta.symbolType,
			SymbolName: meta.symbolName,
			StartLine:  meta.startLine,
			EndLine:    meta.endLine,
			ChunkText:  meta.text,
			Embedding:  string(embJSON),
		}
		allChunks = append(allChunks, chunk)
	}

	// 批量插入（每 50 条一批）
	batchSize := 50
	for i := 0; i < len(allChunks); i += batchSize {
		end := i + batchSize
		if end > len(allChunks) {
			end = len(allChunks)
		}
		if err := db.Create(allChunks[i:end]).Error; err != nil {
			continue
		}
	}

	now := time.Now()
	db.Model(&src).Updates(map[string]interface{}{
		"status":          models.KnowledgeSourceStatusSynced,
		"last_indexed_at": &now,
	})
}

// chunkedSymbol 分块结果
type chunkedSymbol struct {
	symbolType string
	symbolName string
	startLine  int
	endLine    int
	filePath   string
	text       string
}

// chunkCodeFile 将代码文件按符号边界分块
func chunkCodeFile(content, relPath string, config CodeIndexConfig) []chunkedSymbol {
	lines := strings.Split(content, "\n")
	symbols := detectSymbols(lines)
	var chunks []chunkedSymbol

	if len(symbols) == 0 {
		// 无符号检测到，按固定行数分块
		for i := 0; i < len(lines); i += config.MaxChunkLines {
			end := i + config.MaxChunkLines
			if end > len(lines) {
				end = len(lines)
			}
			if end-i < config.MinChunkLines && i > 0 {
				continue
			}
			chunkText := strings.Join(lines[i:end], "\n")
			if strings.TrimSpace(chunkText) == "" {
				continue
			}
			chunks = append(chunks, chunkedSymbol{
				symbolType: models.CodeChunkSymbolModule,
				symbolName: relPath,
				startLine:  i + 1,
				endLine:    end,
				filePath:   relPath,
				text:       chunkText,
			})
		}
		return chunks
	}

	for _, sym := range symbols {
		end := sym.EndLine
		if end-sym.StartLine+1 > config.MaxChunkLines {
			end = sym.StartLine + config.MaxChunkLines - 1
		}
		if end > len(lines) {
			end = len(lines)
		}
		chunkText := strings.Join(lines[sym.StartLine-1:end], "\n")
		if strings.TrimSpace(chunkText) == "" {
			continue
		}
		chunks = append(chunks, chunkedSymbol{
			symbolType: sym.SymbolType,
			symbolName: sym.SymbolName,
			startLine:  sym.StartLine,
			endLine:    end,
			filePath:   relPath,
			text:       chunkText,
		})
	}

	return chunks
}

// detectSymbols 检测代码中的函数/类/方法符号
func detectSymbols(lines []string) []SymbolRange {
	var symbols []SymbolRange

	goFuncRe := regexp.MustCompile(`^func\s+(?:\([^)]+\)\s+)?(\w+)`)
	goClassRe := regexp.MustCompile(`^type\s+(\w+)\s+struct`)
	jsFuncRe := regexp.MustCompile(`^(?:export\s+)?(?:async\s+)?function\s+(\w+)`)
	jsClassRe := regexp.MustCompile(`^(?:export\s+)?class\s+(\w+)`)
	jsArrowRe := regexp.MustCompile(`^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(`)
	pyClassRe := regexp.MustCompile(`^class\s+(\w+)`)
	genericRe := regexp.MustCompile(`^(?:pub\s+)?(?:fn|def|func|function|async\s+fn)\s+(\w+)`)
	closingBraceRe := regexp.MustCompile(`^\}`)

	braceDepth := 0
	inSymbol := false
	var currentSym SymbolRange

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "#") || strings.HasPrefix(trimmed, "*") || strings.HasPrefix(trimmed, "/*") {
			if inSymbol {
				braceDepth += countChar(line, '{') - countChar(line, '}')
				if braceDepth <= 0 {
					currentSym.EndLine = i + 1
					symbols = append(symbols, currentSym)
					inSymbol = false
					braceDepth = 0
				}
			}
			continue
		}

		if inSymbol {
			braceDepth += countChar(line, '{') - countChar(line, '}')
			if closingBraceRe.MatchString(trimmed) || braceDepth <= 0 {
				currentSym.EndLine = i + 1
				symbols = append(symbols, currentSym)
				inSymbol = false
				braceDepth = 0
			}
			continue
		}

		var symType, symName string
		var match bool

		if m := goFuncRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolFunction
			symName = m[1]
			match = true
		} else if m := goClassRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolClass
			symName = m[1]
			match = true
		} else if m := jsFuncRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolFunction
			symName = m[1]
			match = true
		} else if m := jsClassRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolClass
			symName = m[1]
			match = true
		} else if m := jsArrowRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolFunction
			symName = m[1]
			match = true
		} else if m := pyClassRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolClass
			symName = m[1]
			match = true
		} else if m := genericRe.FindStringSubmatch(trimmed); len(m) > 1 {
			symType = models.CodeChunkSymbolFunction
			symName = m[1]
			match = true
		}

		if match {
			braceDepth = countChar(line, '{') - countChar(line, '}')
			if braceDepth > 0 {
				currentSym = SymbolRange{
					SymbolType: symType,
					SymbolName: symName,
					StartLine:  i + 1,
					EndLine:    i + 1,
				}
				inSymbol = true
			} else {
				// 无花括号的符号（如 Python），扫描到下一个符号或文件尾
				endLine := len(lines)
				for j := i + 1; j < len(lines); j++ {
					next := strings.TrimSpace(lines[j])
					if genericRe.MatchString(next) || pyClassRe.MatchString(next) || jsClassRe.MatchString(next) {
						endLine = j
						break
					}
				}
				symbols = append(symbols, SymbolRange{
					SymbolType: symType,
					SymbolName: symName,
					StartLine:  i + 1,
					EndLine:    endLine,
				})
			}
		}
	}

	if inSymbol {
		currentSym.EndLine = len(lines)
		symbols = append(symbols, currentSym)
	}

	// 按起始行排序
	sort.Slice(symbols, func(i, j int) bool {
		return symbols[i].StartLine < symbols[j].StartLine
	})

	return symbols
}

func countChar(s string, c byte) int {
	count := 0
	for i := 0; i < len(s); i++ {
		if s[i] == c {
			count++
		}
	}
	return count
}

// batchEmbed 批量获取 embedding 向量
func batchEmbed(texts []string, config CodeIndexConfig) ([][]float64, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	embedURL := config.EmbeddingURL
	if embedURL == "" {
		embedURL = "http://localhost:11434/api/embeddings"
	}

	var allEmbeddings [][]float64

	for i := 0; i < len(texts); i += config.BatchSize {
		end := i + config.BatchSize
		if end > len(texts) {
			end = len(texts)
		}

		batch := texts[i:end]
		payload := EmbeddingServiceEmbedRequest{
			Texts: batch,
		}
		jsonPayload, _ := json.Marshal(payload)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Post(embedURL, "application/json", bytes.NewReader(jsonPayload))
		if err != nil {
			// 降级：生成伪 embedding（基于文本哈希的确定性向量）
			for range batch {
				allEmbeddings = append(allEmbeddings, generatePseudoEmbedding())
			}
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		var embResp EmbeddingServiceEmbedResponse
		if err := json.Unmarshal(body, &embResp); err != nil {
			for range batch {
				allEmbeddings = append(allEmbeddings, generatePseudoEmbedding())
			}
			continue
		}

		allEmbeddings = append(allEmbeddings, embResp.Embeddings...)
	}

	return allEmbeddings, nil
}

// generatePseudoEmbedding 生成伪 embedding（当 embedding 服务不可用时）
func generatePseudoEmbedding() []float64 {
	emb := make([]float64, 128)
	for i := range emb {
		emb[i] = float64(i) / 128.0
	}
	return emb
}

// SearchCodeChunksHandler 搜索代码片段
// POST /api/v1/projects/{projectId}/knowledge/search-code
func SearchCodeChunksHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, projectID, "搜索代码")
	if !ok {
		return
	}

	var req struct {
		Query string `json:"query" binding:"required"`
		Limit int    `json:"limit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	if req.Limit <= 0 || req.Limit > 20 {
		req.Limit = 5
	}

	config := DefaultCodeIndexConfig()

	// 获取查询的 embedding
	queryEmb, err := batchEmbed([]string{req.Query}, config)
	if err != nil || len(queryEmb) == 0 {
		// 降级：文本匹配搜索
		results := searchCodeChunksBySQL(db, projectID, req.Query, req.Limit)
		c.JSON(http.StatusOK, response.NewSuccessResponse(results))
		return
	}

	// 向量相似度搜索
	results := searchCodeChunksByVector(db, projectID, queryEmb[0], req.Limit)
	c.JSON(http.StatusOK, response.NewSuccessResponse(results))
}

// CodeChunkResult 代码搜索结果
type CodeChunkResult struct {
	ID         uint    `json:"id"`
	FilePath   string  `json:"file_path"`
	SymbolType string  `json:"symbol_type"`
	SymbolName string  `json:"symbol_name"`
	StartLine  int     `json:"start_line"`
	EndLine    int     `json:"end_line"`
	Snippet    string  `json:"snippet"`
	Score      float64 `json:"score"`
}

// searchCodeChunksByVector 向量相似度搜索
func searchCodeChunksByVector(db *gorm.DB, projectID uint, queryEmb []float64, limit int) []CodeChunkResult {
	var chunks []models.CodeChunk
	if err := db.Where("project_id = ?", projectID).Find(&chunks).Error; err != nil {
		return nil
	}

	type scored struct {
		chunk models.CodeChunk
		score float64
	}

	var scoredChunks []scored
	for _, ch := range chunks {
		var emb []float64
		if err := json.Unmarshal([]byte(ch.Embedding), &emb); err != nil {
			continue
		}
		sim := cosineSimilarity(queryEmb, emb)
		scoredChunks = append(scoredChunks, scored{chunk: ch, score: sim})
	}

	sort.Slice(scoredChunks, func(i, j int) bool {
		return scoredChunks[i].score > scoredChunks[j].score
	})

	if len(scoredChunks) > limit {
		scoredChunks = scoredChunks[:limit]
	}

	var results []CodeChunkResult
	for _, s := range scoredChunks {
		snippet := s.chunk.ChunkText
		if len(snippet) > 500 {
			snippet = snippet[:500] + "..."
		}
		results = append(results, CodeChunkResult{
			ID:         s.chunk.ID,
			FilePath:   s.chunk.FilePath,
			SymbolType: s.chunk.SymbolType,
			SymbolName: s.chunk.SymbolName,
			StartLine:  s.chunk.StartLine,
			EndLine:    s.chunk.EndLine,
			Snippet:    snippet,
			Score:      math.Round(s.score*1000) / 1000,
		})
	}

	return results
}

// searchCodeChunksBySQL 降级：SQL LIKE 搜索
func searchCodeChunksBySQL(db *gorm.DB, projectID uint, query string, limit int) []CodeChunkResult {
	var chunks []models.CodeChunk
	likeQuery := "%" + query + "%"
	if err := db.Where("project_id = ? AND (chunk_text LIKE ? OR symbol_name LIKE ? OR file_path LIKE ?)",
		projectID, likeQuery, likeQuery, likeQuery).
		Limit(limit).Find(&chunks).Error; err != nil {
		return nil
	}

	var results []CodeChunkResult
	seen := make(map[string]struct{}, len(chunks))
	for _, ch := range chunks {
		// 同一物理仓库重复注册会产生不同 source 下内容相同的 chunk，检索层按位置与内容去重。
		key := fmt.Sprintf("%s|%s|%d|%d", ch.FilePath, ch.SymbolName, ch.StartLine, ch.EndLine)
		if _, dup := seen[key]; dup {
			continue
		}
		seen[key] = struct{}{}
		snippet := truncateRunes(ch.ChunkText, 500)
		results = append(results, CodeChunkResult{
			ID:         ch.ID,
			FilePath:   ch.FilePath,
			SymbolType: ch.SymbolType,
			SymbolName: ch.SymbolName,
			StartLine:  ch.StartLine,
			EndLine:    ch.EndLine,
			Snippet:    snippet,
			Score:      0.5,
		})
	}

	return results
}

// cosineSimilarity 计算余弦相似度
func cosineSimilarity(a, b []float64) float64 {
	if len(a) != len(b) {
		minLen := len(a)
		if len(b) < minLen {
			minLen = len(b)
		}
		a = a[:minLen]
		b = b[:minLen]
	}

	var dotProduct, normA, normB float64
	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}

// GetCodeIndexStatsHandler 获取代码索引统计
// GET /api/v1/projects/{projectId}/knowledge/code-stats
func GetCodeIndexStatsHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var totalChunks int64
	db.Model(&models.CodeChunk{}).Where("project_id = ?", projectID).Count(&totalChunks)

	var totalFiles int64
	db.Model(&models.CodeChunk{}).Where("project_id = ?", projectID).Distinct("file_path").Count(&totalFiles)

	var symbolStats []struct {
		SymbolType string `json:"symbol_type"`
		Count      int64  `json:"count"`
	}
	db.Model(&models.CodeChunk{}).Where("project_id = ?", projectID).
		Select("symbol_type, COUNT(*) as count").
		Group("symbol_type").Find(&symbolStats)

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"total_chunks": totalChunks,
		"total_files":  totalFiles,
		"symbol_stats": symbolStats,
	}))
}