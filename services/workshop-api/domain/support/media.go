// Package support holds framework-independent customer-support invariants.
package support

import (
	"fmt"
	"mime"
	"path"
	"strings"
)

type Media struct {
	Type       string
	ObjectKey  string
	URL        string
	MIME       string
	Size       int64
	DurationMS int64
}

func NormalizeMIME(value string) string {
	value, _, err := mime.ParseMediaType(value)
	if err != nil {
		return ""
	}
	return strings.ToLower(value)
}

func ValidateMedia(content string, media []Media, prefix string) error {
	if strings.TrimSpace(content) == "" && len(media) == 0 {
		return fmt.Errorf("请提供文字、图片或语音")
	}
	if len(content) > 32000 {
		return fmt.Errorf("消息内容过长")
	}
	images, audio, total := 0, 0, int64(0)
	for _, m := range media {
		if m.URL != "" || m.ObjectKey == "" || prefix == "" || !strings.HasPrefix(m.ObjectKey, prefix) || path.Clean(m.ObjectKey) != m.ObjectKey || strings.ContainsAny(m.ObjectKey, "\\\x00\r\n?#%") {
			return fmt.Errorf("附件不属于当前客户或对象引用无效")
		}
		if m.Size <= 0 || m.Size > 10*1024*1024 {
			return fmt.Errorf("单个媒体须大于0且不超过10MB")
		}
		total += m.Size
		switch m.Type {
		case "image":
			images++
			switch NormalizeMIME(m.MIME) {
			case "image/jpeg", "image/png", "image/gif", "image/webp":
			default:
				return fmt.Errorf("不支持的图片格式")
			}
		case "audio":
			audio++
			switch NormalizeMIME(m.MIME) {
			case "audio/webm", "audio/ogg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/mpeg":
			default:
				return fmt.Errorf("不支持的音频格式")
			}
			if m.DurationMS <= 0 || m.DurationMS > 60000 {
				return fmt.Errorf("语音长度须在60秒以内")
			}
		default:
			return fmt.Errorf("客服仅支持图片或音频媒体")
		}
	}
	if images > 4 || audio > 1 || total > 20*1024*1024 {
		return fmt.Errorf("每轮最多4张图片和1段语音，总计不超过20MB")
	}
	return nil
}
