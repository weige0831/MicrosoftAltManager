package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// statusColor wraps the HTTP status code in an ANSI color (mirrors new-api
// middleware/logger.go). Kept minimal — just structured logging.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		if status >= 400 {
			log.Printf("[gin] %3d | %10v | %s %s", status, latency, c.Request.Method, path)
		}
	}
}
