package model

import (
	"fmt"
	"log"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/weige0831/microsoftaltmanager/common"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Open opens the database per cfg and runs AutoMigrate + seeding.
func Open(cfg *common.Config) (*gorm.DB, error) {
	gormLogLevel := logger.Warn
	gcfg := &gorm.Config{
		Logger:                 logger.Default.LogMode(gormLogLevel),
		SkipDefaultTransaction: true,
		PrepareStmt:            true,
	}

	var db *gorm.DB
	var err error
	if cfg.UseSqlite {
		db, err = gorm.Open(sqlite.Open(cfg.SqlitePath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)"), gcfg)
	} else {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), gcfg)
	}
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	if cfg.UseSqlite {
		sqlDB.SetMaxOpenConns(1) // sqlite single-writer
	} else {
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	if cfg.AutoMigrate {
		if err := db.AutoMigrate(
			&Account{}, &ApiKey{}, &User{},
			&Session{}, &Setting{}, &OpLog{},
		); err != nil {
			return nil, fmt.Errorf("migrate: %w", err)
		}
		if err := seed(db); err != nil {
			log.Printf("[store] seed warning: %v", err)
		}
	}
	return db, nil
}

// defaultSettings returns the seed settings.
func defaultSettings() map[string]string {
	return map[string]string{
		"ttl_after_extract": "86400",   // 1 day after extraction
		"max_age_unused":    "2592000", // 30 days after upload if never extracted
		"brand_name":        "微软账号管理器",
	}
}

// seed ensures default settings only. The admin account is created via the
// first-run setup wizard (/api/setup), NOT seeded here.
func seed(db *gorm.DB) error {
	defs := defaultSettings()
	for k, v := range defs {
		if err := db.Where(Setting{Key: k}).FirstOrCreate(&Setting{Key: k, Value: v}).Error; err != nil {
			return err
		}
	}
	return nil
}

// NeedsSetup reports whether no admin user exists yet (first-run setup pending).
func NeedsSetup(db *gorm.DB) bool {
	var cnt int64
	db.Model(&User{}).Count(&cnt)
	return cnt == 0
}
