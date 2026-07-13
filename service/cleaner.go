package service

import (
	"log"
	"strconv"
	"time"

	"github.com/weige0831/microsoftaltmanager/model"
	"gorm.io/gorm"
)

// Cleaner periodically deletes expired accounts.
type Cleaner struct {
	DB  *gorm.DB
	Now func() time.Time
}

// SettingsProvider reads TTL settings. Returns seconds.
type settingsReader interface {
	Get(key string, def string) string
}

// Start launches the background loop. Call once at boot. Returns stop func.
func (cl *Cleaner) Start(getter func(string, string) string) (stop func()) {
	tk := time.NewTicker(60 * time.Second)
	done := make(chan struct{})
	go func() {
		cl.runOnce(getter) // run immediately on boot
		for {
			select {
			case <-done:
				tk.Stop()
				return
			case <-tk.C:
				cl.runOnce(getter)
			}
		}
	}()
	return func() { close(done) }
}

func (cl *Cleaner) runOnce(getter func(string, string) string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[cleaner] panic: %v", r)
		}
	}()
	if cl.Now == nil {
		cl.Now = time.Now
	}
	now := cl.Now()

	ttlExtract, _ := strconv.Atoi(getter("ttl_after_extract", "86400"))
	maxUnused, _ := strconv.Atoi(getter("max_age_unused", "2592000"))
	if ttlExtract <= 0 {
		ttlExtract = 86400
	}
	if maxUnused <= 0 {
		maxUnused = 2592000
	}

	// 1) delete used accounts past their post-extract TTL
	extractCutoff := now.Add(-time.Duration(ttlExtract) * time.Second)
	res1 := cl.DB.Where("status = ? AND used_at IS NOT NULL AND used_at < ?", model.AccountUsed, extractCutoff).
		Delete(&model.Account{})
	if res1.Error != nil {
		log.Printf("[cleaner] delete used err: %v", res1.Error)
	} else if res1.RowsAffected > 0 {
		log.Printf("[cleaner] deleted %d used accounts (expired after %ds)", res1.RowsAffected, ttlExtract)
		_ = cl.DB.Create(&model.OpLog{Action: "cleaner.delete_used", Detail: strconv.FormatInt(res1.RowsAffected, 10)}).Error
	}

	// 2) delete never-extracted accounts past their max-age-from-upload
	unusedCutoff := now.Add(-time.Duration(maxUnused) * time.Second)
	res2 := cl.DB.Where("status = ? AND uploaded_at < ?", model.AccountAvailable, unusedCutoff).
		Delete(&model.Account{})
	if res2.Error != nil {
		log.Printf("[cleaner] delete unused err: %v", res2.Error)
	} else if res2.RowsAffected > 0 {
		log.Printf("[cleaner] deleted %d unused accounts (older than %ds)", res2.RowsAffected, maxUnused)
		_ = cl.DB.Create(&model.OpLog{Action: "cleaner.delete_unused", Detail: strconv.FormatInt(res2.RowsAffected, 10)}).Error
	}
}
