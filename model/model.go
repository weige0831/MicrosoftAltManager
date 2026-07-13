package model

import (
	"encoding/json"
	"time"
)

// AccountStatus constants.
const (
	AccountAvailable = 0 // 未被提取
	AccountUsed      = 1 // 已被提取（倒计时中）
)

// Account is the core Microsoft account record.
type Account struct {
	ID            int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Username      string         `gorm:"size:255;not null;index" json:"username"`
	PasswordEnc   string         `gorm:"type:text;not null;column:password_enc" json:"-"` // AES, never serialized
	PasswordSet   bool           `gorm:"not null;default:true" json:"password_set"`
	CookieEnc     string         `gorm:"type:text;not null" json:"-"`
	CookieSet     bool           `gorm:"not null;default:true" json:"cookie_set"`
	RefreshEnc    string         `gorm:"type:text" json:"-"` // AES(JSON), optional
	RefreshSet    bool           `gorm:"not null;default:false" json:"refresh_set"`
	Remark        string         `gorm:"size:255" json:"remark"`
	Status        int            `gorm:"not null;default:0;index" json:"status"`
	UploadedAt    time.Time      `gorm:"not null;index" json:"uploaded_at"`
	UsedAt        *time.Time     `json:"used_at,omitempty"`
	UploadedBy    string         `gorm:"size:64" json:"uploaded_by"`
	ExtractedBy   string         `gorm:"size:64" json:"extracted_by,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

func (Account) TableName() string { return "accounts" }

// RefreshToken is one app-scoped refresh token attached to an account.
type RefreshToken struct {
	AppName      string `json:"app_name"`
	RefreshToken string `json:"refresh_token"`
}

// EncodeRefreshTokens serializes a token list to JSON string.
func EncodeRefreshTokens(ts []RefreshToken) (string, error) {
	if len(ts) == 0 {
		return "", nil
	}
	b, err := json.Marshal(ts)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// DecodeRefreshTokens parses a JSON string back to token list.
func DecodeRefreshTokens(s string) ([]RefreshToken, error) {
	if s == "" {
		return nil, nil
	}
	var out []RefreshToken
	if err := json.Unmarshal([]byte(s), &out); err != nil {
		return nil, err
	}
	return out, nil
}

// ApiKey is a token used for upload/extract without a browser session.
type ApiKey struct {
	ID         int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name       string      `gorm:"size:128" json:"name"`
	KeyHash    string      `gorm:"size:255;uniqueIndex;not null" json:"-"`
	KeyPrefix  string      `gorm:"size:16" json:"key_prefix"` // first chars for display
	Enabled    bool        `gorm:"not null;default:true" json:"enabled"`
	Quota      int         `gorm:"not null;default:0" json:"quota"` // 0 = unlimited
	UsedCount  int         `gorm:"not null;default:0" json:"used_count"`
	LastUsedAt *time.Time  `json:"last_used_at,omitempty"`
	Permissions string     `gorm:"size:64;default:'extract'" json:"permissions"` // comma sep: upload,extract
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

func (ApiKey) TableName() string { return "api_keys" }

// User is an admin login.
type User struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string    `gorm:"size:64;uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         string    `gorm:"size:16;default:'admin'" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (User) TableName() string { return "users" }

// Session is a login session.
type Session struct {
	Token     string    `gorm:"primaryKey;size:64" json:"-"`
	UserID    int64     `gorm:"not null;index" json:"user_id"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

func (Session) TableName() string { return "sessions" }

// Setting is a key/value config row.
type Setting struct {
	Key   string `gorm:"primaryKey;size:64" json:"key"`
	Value string `gorm:"type:text" json:"value"`
}

func (Setting) TableName() string { return "settings" }

// OpLog is an audit entry.
type OpLog struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Action    string    `gorm:"size:64;not null;index" json:"action"`
	TargetID  string    `gorm:"size:64" json:"target_id"`
	Actor     string    `gorm:"size:64" json:"actor"`
	Detail    string    `gorm:"type:text" json:"detail"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

func (OpLog) TableName() string { return "op_logs" }
