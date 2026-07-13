package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	SessionCookie = "msm_session"
	SessionTTL    = 7 * 24 * time.Hour
)

// Service handles sessions + api key middleware.
type Service struct {
	db  *gorm.DB
	now func() time.Time
}

func New(db *gorm.DB) *Service {
	return &Service{db: db, now: time.Now}
}

// Login validates credentials, creates a session, sets the cookie.
func (s *Service) Login(c *gin.Context, username, password string) (*model.User, error) {
	var u model.User
	if err := s.db.Where("username = ?", username).First(&u).Error; err != nil {
		return nil, errInvalid()
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, errInvalid()
	}
	tok := randomToken(32)
	sess := model.Session{
		Token:     tok,
		UserID:    u.ID,
		ExpiresAt: s.now().Add(SessionTTL),
		CreatedAt: s.now(),
	}
	if err := s.db.Create(&sess).Error; err != nil {
		return nil, err
	}
	// Secure flag must only be set when actually serving over HTTPS.
	// Over plain HTTP (e.g. direct IP:port access) a Secure cookie is rejected
	// by the browser, which silently drops the session -> login "doesn't stick".
	secure := isHTTPS(c.Request)
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(SessionCookie, tok, int(SessionTTL.Seconds()), "/", "", secure, true)
	return &u, nil
}

// Logout invalidates the current session.
func (s *Service) Logout(c *gin.Context) {
	if tok, _ := c.Cookie(SessionCookie); tok != "" {
		s.db.Where("token = ?", tok).Delete(&model.Session{})
	}
	c.SetCookie(SessionCookie, "", -1, "/", "", false, true)
}

// CurrentUser resolves the session user, or nil.
func (s *Service) CurrentUser(c *gin.Context) *model.User {
	if v, ok := c.Get("user"); ok {
		if u, ok := v.(*model.User); ok {
			return u
		}
	}
	tok, _ := c.Cookie(SessionCookie)
	if tok == "" {
		return nil
	}
	var sess model.Session
	if err := s.db.Where("token = ?", tok).First(&sess).Error; err != nil {
		return nil
	}
	if s.now().After(sess.ExpiresAt) {
		s.db.Delete(&sess)
		return nil
	}
	var u model.User
	if err := s.db.First(&u, sess.UserID).Error; err != nil {
		return nil
	}
	c.Set("user", &u)
	return &u
}

// RequireSession middleware: allow only logged-in admin.
func (s *Service) RequireSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		if s.CurrentUser(c) == nil {
			common.Fail(c, http.StatusUnauthorized, "未登录或会话已过期")
			return
		}
		c.Next()
	}
}

// VerifyApiKey resolves an API key from the Authorization header.
// Returns the api key row + actor label, or nil.
func (s *Service) VerifyApiKey(c *gin.Context, wantPerm string) (*model.ApiKey, string) {
	raw := extractBearer(c)
	if raw == "" {
		return nil, ""
	}
	var keys []model.ApiKey
	s.db.Where("enabled = ?", true).Find(&keys)
	for i := range keys {
		if bcrypt.CompareHashAndPassword([]byte(keys[i].KeyHash), []byte(raw)) == nil {
			if !hasPerm(keys[i].Permissions, wantPerm) {
				return &keys[i], ""
			}
			now := s.now()
			keys[i].UsedCount++
			keys[i].LastUsedAt = &now
			s.db.Model(&model.ApiKey{}).Where("id = ?", keys[i].ID).Updates(map[string]any{
				"used_count":   keys[i].UsedCount,
				"last_used_at": now,
			})
			actor := "apikey:" + keys[i].Name
			return &keys[i], actor
		}
	}
	return nil, ""
}

// RequireAnyAuth allows EITHER a valid session OR an api key with the permission.
func (s *Service) RequireAnyAuth(perm string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// session first
		if s.CurrentUser(c) != nil {
			c.Set("actor", "admin")
			c.Next()
			return
		}
		key, actor := s.VerifyApiKey(c, perm)
		if key == nil {
			common.Fail(c, http.StatusUnauthorized, "需要鉴权：请登录或提供有效的 API Key")
			return
		}
		if actor == "" {
			common.Fail(c, http.StatusForbidden, "该 API Key 无 "+perm+" 权限")
			return
		}
		c.Set("actor", actor)
		c.Set("apikey", key)
		c.Next()
	}
}

// --- helpers ---

func hasPerm(perms, want string) bool {
	if perms == "" {
		return want == "extract"
	}
	for _, p := range strings.Split(perms, ",") {
		if strings.TrimSpace(p) == want {
			return true
		}
	}
	return false
}

func extractBearer(c *gin.Context) string {
	h := c.GetHeader("Authorization")
	h = strings.TrimSpace(h)
	if strings.HasPrefix(strings.ToLower(h), "bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return strings.TrimSpace(h)
}

func isLocalhost(r *http.Request) bool {
	host := r.Host
	return strings.Contains(host, "localhost") || strings.Contains(host, "127.0.0.1")
}

// isHTTPS reports whether the request is effectively HTTPS, either directly
// (TLS) or behind a reverse proxy that forwarded X-Forwarded-Proto: https.
func isHTTPS(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	if xfp := r.Header.Get("X-Forwarded-Proto"); strings.EqualFold(xfp, "https") {
		return true
	}
	return false
}

func errInvalid() error { return &invalidCreds{} }

type invalidCreds struct{}

func (e *invalidCreds) Error() string { return "用户名或密码错误" }
