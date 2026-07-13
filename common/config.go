package common

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Config holds all runtime configuration loaded from the environment / .env.
type Config struct {
	Port            int
	DatabaseURL     string
	MasterKey       string
	SessionSecret   string
	PublicBaseURL   string
	BrandName       string
	TZ              string
	AutoMigrate     bool
	SqlitePath      string // optional fallback when DATABASE_URL empty
	UseSqlite       bool
}

func Load() *Config {
	loadDotEnv()
	cfg := &Config{
		Port:          envInt("PORT", 27321),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		MasterKey:     os.Getenv("MASTER_KEY"),
		SessionSecret: os.Getenv("SESSION_SECRET"),
		PublicBaseURL: os.Getenv("PUBLIC_BASE_URL"),
		BrandName:     envStr("BRAND_NAME", "微软账号管理器"),
		TZ:            envStr("TZ", "Asia/Shanghai"),
		AutoMigrate:   envBool("AUTO_MIGRATE", true),
	}
	if cfg.DatabaseURL == "" {
		cfg.UseSqlite = true
		cfg.SqlitePath = envStr("SQLITE_PATH", "data/manager.db")
	}
	if cfg.MasterKey == "" {
		cfg.MasterKey = randHex(32)
		log.Println("[config] MASTER_KEY not set, generated ephemeral key (data unreadable after restart)")
	}
	if cfg.SessionSecret == "" {
		cfg.SessionSecret = randHex(32)
		log.Println("[config] SESSION_SECRET not set, generated ephemeral secret")
	}
	return cfg
}

// env helpers
func envStr(k, d string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return d
}
func envInt(k string, d int) int {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return d
}
func envBool(k string, d bool) bool {
	if v := strings.ToLower(strings.TrimSpace(os.Getenv(k))); v != "" {
		return v == "1" || v == "true" || v == "yes" || v == "on"
	}
	return d
}

func randHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// loadDotEnv reads a .env file from CWD or executable dir if present.
// It will NOT clobber existing env vars.
func loadDotEnv() {
	for _, p := range []string{".env", ".env.local"} {
		path := p
		if abs, err := filepath.Abs(p); err == nil {
			path = abs
		}
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		parseEnv(string(data))
	}
}

func parseEnv(data string) {
	for _, line := range strings.Split(data, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.IndexByte(line, '=')
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		val = strings.Trim(val, `"'`)
		if _, ok := os.LookupEnv(key); !ok {
			_ = os.Setenv(key, val)
		}
	}
}

// EnsureDataDir makes sure the data directory exists (for sqlite / uploads).
func EnsureDataDir() {
	_ = os.MkdirAll("data", 0o755)
}

// DescribePort returns a human readable note for logs.
func DescribePort(p int) string { return fmt.Sprintf(":%d", p) }
