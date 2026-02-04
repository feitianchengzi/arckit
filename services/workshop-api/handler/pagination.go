package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	defaultPage     = 1
	defaultPageSize = 50
	maxPageSize     = 200
)

// Pagination holds pagination parameters.
type Pagination struct {
	Page     int
	PageSize int
	Offset   int
	Limit    int
}

// ParsePagination parses page and page_size from query.
// Always returns pagination with defaults (forced pagination).
func ParsePagination(c *gin.Context) (Pagination, bool) {
	pageStr := c.Query("page")
	sizeStr := c.Query("page_size")

	page := parseIntWithDefault(pageStr, defaultPage)
	if page < 1 {
		page = defaultPage
	}

	pageSize := parseIntWithDefault(sizeStr, defaultPageSize)
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	offset := (page - 1) * pageSize
	return Pagination{
		Page:     page,
		PageSize: pageSize,
		Offset:   offset,
		Limit:    pageSize,
	}, true
}

func parseIntWithDefault(value string, def int) int {
	if value == "" {
		return def
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return def
	}
	return parsed
}
