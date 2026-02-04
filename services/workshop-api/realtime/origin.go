package realtime

import (
	"os"
	"strings"
)

// IsOriginAllowed determines whether a websocket origin is allowed.
func IsOriginAllowed(origin string) bool {
	if origin == "" {
		return true
	}
	allowOriginsEnv := os.Getenv("CORS_ALLOW_ORIGINS")
	if allowOriginsEnv == "" {
		return true
	}

	origins := strings.Split(allowOriginsEnv, ",")
	for _, allowedOrigin := range origins {
		allowedOrigin = strings.TrimSpace(allowedOrigin)
		if allowedOrigin == "" {
			continue
		}
		if origin == allowedOrigin {
			return true
		}
		if strings.HasPrefix(origin, allowedOrigin+":") {
			return true
		}
	}
	return false
}
