package service

import (
	"strconv"
	"strings"

	"github.com/weige0831/microsoftaltmanager/model"
	"gorm.io/gorm"
)

// SettingsService reads/writes key-value settings with defaults.
type SettingsService struct {
	DB *gorm.DB
}

var settingDefaults = map[string]string{
	"ttl_after_extract":          "86400",
	"max_age_unused":             "2592000",
	"brand_name":                 "微软账号管理器",
	"system_name":                "微软账号管理器",
	"logo":                       "",
	"footer_html":                "",
	"notice":                     "",
	"register_enabled":           "false",
	"password_login_enabled":     "true",
	"password_register_enabled":  "false",
}

// EditableKeys are admin-writable settings.
var EditableKeys = map[string]bool{
	"ttl_after_extract":         true,
	"max_age_unused":            true,
	"brand_name":                true,
	"system_name":               true,
	"logo":                      true,
	"footer_html":               true,
	"notice":                    true,
	"register_enabled":          true,
	"password_login_enabled":    true,
	"password_register_enabled": true,
}

func (s *SettingsService) Get(key, def string) string {
	var st model.Setting
	if err := s.DB.Where(model.Setting{Key: key}).First(&st).Error; err != nil {
		if def != "" {
			return def
		}
		if d, ok := settingDefaults[key]; ok {
			return d
		}
		return ""
	}
	return st.Value
}

func (s *SettingsService) GetInt(key string, def int) int {
	v := s.Get(key, "")
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func (s *SettingsService) GetBool(key string, def bool) bool {
	v := strings.ToLower(strings.TrimSpace(s.Get(key, "")))
	if v == "" {
		return def
	}
	return v == "1" || v == "true" || v == "yes" || v == "on"
}

func (s *SettingsService) Set(key, value string) error {
	return s.DB.Where(model.Setting{Key: key}).Assign(model.Setting{Value: value}).
		FirstOrCreate(&model.Setting{Key: key}).Error
}

// All returns all settings as a map with defaults filled.
func (s *SettingsService) All() map[string]string {
	var rows []model.Setting
	s.DB.Find(&rows)
	out := make(map[string]string, len(settingDefaults)+len(rows))
	for k, v := range settingDefaults {
		out[k] = v
	}
	for _, r := range rows {
		out[r.Key] = r.Value
	}
	// keep system_name in sync with brand if empty
	if strings.TrimSpace(out["system_name"]) == "" {
		out["system_name"] = out["brand_name"]
	}
	return out
}

// Public returns non-sensitive public settings.
func (s *SettingsService) Public() map[string]any {
	all := s.All()
	return map[string]any{
		"brand_name":                all["brand_name"],
		"system_name":               all["system_name"],
		"logo":                      all["logo"],
		"footer_html":               all["footer_html"],
		"register_enabled":          s.GetBool("register_enabled", false),
		"password_login_enabled":    s.GetBool("password_login_enabled", true),
		"password_register_enabled": s.GetBool("password_register_enabled", false),
	}
}

// StatusPayload builds /api/status data for new-api compatible frontend.
func (s *SettingsService) StatusPayload(needsSetup bool) map[string]any {
	all := s.All()
	name := all["system_name"]
	if name == "" {
		name = all["brand_name"]
	}
	return map[string]any{
		"version":                   "1.0.0",
		"commit_hash":               "dev",
		"system_name":               name,
		"brand_name":                all["brand_name"],
		"logo":                      all["logo"],
		"footer_html":               all["footer_html"],
		"needs_setup":               needsSetup,
		"setup":                     !needsSetup,
		"announcements_enabled":     false,
		"announcements":             []any{},
		"register_enabled":          s.GetBool("register_enabled", false),
		"password_login_enabled":    s.GetBool("password_login_enabled", true),
		"password_register_enabled": s.GetBool("password_register_enabled", false),
	}
}
