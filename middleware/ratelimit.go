package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
)

// RateLimiter is a simple in-memory IP rate limiter for auth endpoints.
type RateLimiter struct {
	mu       sync.Mutex
	hits     map[string][]time.Time
	limit    int
	window   time.Duration
	now      func() time.Time
	lastPrune time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	if limit <= 0 {
		limit = 10
	}
	if window <= 0 {
		window = time.Minute
	}
	return &RateLimiter{
		hits:   make(map[string][]time.Time),
		limit:  limit,
		window: window,
		now:    time.Now,
	}
}

func (r *RateLimiter) allow(key string) bool {
	now := r.now()
	cutoff := now.Add(-r.window)

	r.mu.Lock()
	defer r.mu.Unlock()

	// occasional full prune to avoid unbounded growth
	if now.Sub(r.lastPrune) > r.window {
		for k, times := range r.hits {
			kept := times[:0]
			for _, t := range times {
				if t.After(cutoff) {
					kept = append(kept, t)
				}
			}
			if len(kept) == 0 {
				delete(r.hits, k)
			} else {
				r.hits[k] = kept
			}
		}
		r.lastPrune = now
	}

	times := r.hits[key]
	kept := times[:0]
	for _, t := range times {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= r.limit {
		r.hits[key] = kept
		return false
	}
	kept = append(kept, now)
	r.hits[key] = kept
	return true
}

// Middleware rejects requests that exceed limit per client IP within window.
func (r *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if ip == "" {
			ip = "unknown"
		}
		if !r.allow(ip) {
			common.Fail(c, http.StatusTooManyRequests, "请求过于频繁，请稍后再试")
			return
		}
		c.Next()
	}
}
