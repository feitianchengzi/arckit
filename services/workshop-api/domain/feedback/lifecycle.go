// Package feedback owns customer-visible feedback policies independently of HTTP,
// persistence, model providers and internal task authorization.
package feedback

import (
	"errors"
	"net/url"
	"strings"
	"time"
)

type Search struct {
	Query, Status, DateField string
	Start, End               *time.Time
}

func ParseSearch(q, status, from, to, field string) (Search, error) {
	f := Search{Query: strings.TrimSpace(q), Status: strings.TrimSpace(status), DateField: field}
	if len([]rune(f.Query)) > 200 {
		return f, errors.New("搜索内容不能超过200字")
	}
	switch f.Status {
	case "", "submitted", "analyzing", "reviewing", "developing", "released", "completed", "ignored", "pending", "accepted", "converted", "in_progress", "auto_resolved":
	default:
		return f, errors.New("无效的反馈状态")
	}
	if field == "" {
		f.DateField = "created"
	}
	if f.DateField != "created" && f.DateField != "updated" {
		return f, errors.New("date_field仅支持created/updated")
	}
	for _, item := range []struct {
		raw    string
		target **time.Time
		end    bool
	}{{from, &f.Start, false}, {to, &f.End, true}} {
		if item.raw == "" {
			continue
		}
		v, err := time.Parse(time.RFC3339, item.raw)
		if err != nil {
			v, err = time.Parse("2006-01-02", item.raw)
			if err == nil && item.end {
				v = v.AddDate(0, 0, 1)
			}
		}
		if err != nil {
			return f, errors.New("日期须为ISO日期或含时区的RFC3339时间")
		}
		*item.target = &v
	}
	if f.Start != nil && f.End != nil && !f.Start.Before(*f.End) {
		return f, errors.New("开始时间必须早于结束时间")
	}
	return f, nil
}
func (s Search) Pattern() string {
	return "%" + strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_").Replace(s.Query) + "%"
}

type Conclusion struct{ Kind, Title, Body, ArtifactURL, VersionLabel string }

func (c Conclusion) Validate() error {
	if strings.TrimSpace(c.Title) == "" || strings.TrimSpace(c.Body) == "" {
		return errors.New("结论标题和正文不能为空")
	}
	if len([]rune(c.Title)) > 200 || len([]rune(c.Body)) > 20000 {
		return errors.New("结论内容超过长度限制")
	}
	switch c.Kind {
	case "delivery", "answer", "not_planned":
	default:
		return errors.New("结论类型仅支持delivery/answer/not_planned")
	}
	if c.ArtifactURL != "" {
		u, err := url.Parse(c.ArtifactURL)
		if err != nil || u.Host == "" || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil {
			return errors.New("交付链接必须为HTTP(S)地址")
		}
	}
	return nil
}
func ValidateResponse(action string, version, current int, kind string) error {
	if version != current {
		return errors.New("该结论已被更新，请先阅读最新版本")
	}
	switch action {
	case "accepted":
		if kind == "not_planned" {
			return errors.New("暂不采纳结论不可作为交付验收")
		}
	case "needs_review":
	default:
		return errors.New("response仅支持accepted/needs_review")
	}
	return nil
}
