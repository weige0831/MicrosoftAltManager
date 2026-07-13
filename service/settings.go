package service

import (
	"strconv"

	"github.com/weige0831/microsoftaltmanager/model"
	"gorm.io/gorm"
)

// SettingsService reads/writes key-value settings with defaults.
type SettingsService struct {
	DB *gorm.DB
}

func (s *SettingsService) Get(key, def string) string {
	var st model.Setting
	if err := s.DB.Where(model.Setting{Key: key}).First(&st).Error; err != nil {
		return def
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

func (s *SettingsService) Set(key, value string) error {
	return s.DB.Where(model.Setting{Key: key}).Assign(model.Setting{Value: value}).
		FirstOrCreate(&model.Setting{Key: key}).Error
}

// All returns all settings as a map (public-safe).
func (s *SettingsService) All() map[string]string {
	var rows []model.Setting
	s.DB.Find(&rows)
	out := make(map[string]string, len(rows))
	for _, r := range rows {
		out[r.Key] = r.Value
	}
	// defaults
	if _, ok := out["ttl_after_extract"]; !ok {
		out["ttl_after_extract"] = "86400"
	}
	if _, ok := out["max_age_unused"]; !ok {
		out["max_age_unused"] = "2592000"
	}
	if _, ok := out["brand_name"]; !ok {
		out["brand_name"] = "微软账号管理器"
	}
	return out
}

// Public returns only non-sensitive settings.
func (s *SettingsService) Public() map[string]any {
	all := s.All()
	return map[string]any{
		"brand_name": all["brand_name"],
	}
}
