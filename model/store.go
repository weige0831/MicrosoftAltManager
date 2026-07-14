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
	gcfg := &gorm.Config{
		Logger:                 logger.Default.LogMode(logger.Warn),
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
		sqlDB.SetMaxOpenConns(1)
	} else {
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	if cfg.AutoMigrate {
		// Convert legacy string role column before AutoMigrate when possible.
		if err := migrateRoleColumn(db, cfg.UseSqlite); err != nil {
			log.Printf("[store] role column migrate warning: %v", err)
		}

		if err := db.AutoMigrate(
			&Account{}, &ApiKey{}, &User{},
			&Session{}, &Setting{}, &OpLog{},
		); err != nil {
			return nil, fmt.Errorf("migrate: %w", err)
		}
		if err := seed(db); err != nil {
			log.Printf("[store] seed warning: %v", err)
		}
		if err := ensureUserDefaults(db); err != nil {
			log.Printf("[store] user defaults warning: %v", err)
		}
	}
	return db, nil
}

func migrateRoleColumn(db *gorm.DB, sqlite bool) error {
	if sqlite {
		return nil
	}
	var dataType string
	err := db.Raw(`
		SELECT data_type FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
	`).Scan(&dataType).Error
	if err != nil || dataType == "" {
		return err
	}
	if dataType == "integer" || dataType == "bigint" || dataType == "smallint" {
		// still ensure new columns exist
		return ensureExtraUserColumns(db)
	}
	log.Printf("[store] converting users.role from %s to integer", dataType)

	// Drop default first — PG cannot cast default expression with type change.
	if err := db.Exec(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`).Error; err != nil {
		return err
	}
	if err := db.Exec(`
		ALTER TABLE users
		ALTER COLUMN role TYPE integer
		USING CASE
			WHEN lower(role::text) IN ('admin','root','super','super_admin','100') THEN 100
			WHEN lower(role::text) IN ('administrator','mod','10') THEN 10
			WHEN role::text ~ '^[0-9]+$' THEN role::text::integer
			ELSE 1
		END
	`).Error; err != nil {
		return err
	}
	if err := db.Exec(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 1`).Error; err != nil {
		return err
	}
	return ensureExtraUserColumns(db)
}

func ensureExtraUserColumns(db *gorm.DB) error {
	stmts := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(128) DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(255) DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS status integer DEFAULT 1`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS remark varchar(255) DEFAULT ''`,
	}
	for _, s := range stmts {
		if err := db.Exec(s).Error; err != nil {
			return err
		}
	}
	return nil
}

func defaultSettings() map[string]string {
	return map[string]string{
		"ttl_after_extract":         "86400",
		"max_age_unused":            "2592000",
		"brand_name":                "微软账号管理器",
		"system_name":               "微软账号管理器",
		"logo":                      "",
		"footer_html":               "",
		"notice":                    "",
		"register_enabled":          "false",
		"password_login_enabled":    "true",
		"password_register_enabled": "false",
	}
}

func seed(db *gorm.DB) error {
	defs := defaultSettings()
	for k, v := range defs {
		if err := db.Where(Setting{Key: k}).FirstOrCreate(&Setting{Key: k, Value: v}).Error; err != nil {
			return err
		}
	}
	return nil
}

func ensureUserDefaults(db *gorm.DB) error {
	var users []User
	if err := db.Find(&users).Error; err != nil {
		return err
	}
	if len(users) == 0 {
		return nil
	}

	allZero := true
	for _, u := range users {
		if u.Role > 0 {
			allZero = false
			break
		}
	}

	for i, u := range users {
		updates := map[string]any{}
		if allZero {
			if i == 0 {
				updates["role"] = RoleSuperAdmin
			} else {
				updates["role"] = RoleUser
			}
		} else if u.Role == 0 {
			updates["role"] = RoleUser
		}
		// Existing installs never used status; treat 0 as enabled once.
		if u.Status == 0 {
			updates["status"] = UserStatusEnabled
		}
		if u.DisplayName == "" {
			updates["display_name"] = u.Username
		}
		if len(updates) > 0 {
			if err := db.Model(&User{}).Where("id = ?", u.ID).Updates(updates).Error; err != nil {
				return err
			}
		}
	}

	var superCnt int64
	db.Model(&User{}).Where("role >= ?", RoleSuperAdmin).Count(&superCnt)
	if superCnt == 0 {
		var first User
		if err := db.Order("id ASC").First(&first).Error; err == nil {
			_ = db.Model(&first).Updates(map[string]any{
				"role":   RoleSuperAdmin,
				"status": UserStatusEnabled,
			}).Error
		}
	}
	return nil
}

// NeedsSetup reports whether no user exists yet.
func NeedsSetup(db *gorm.DB) bool {
	var cnt int64
	db.Model(&User{}).Count(&cnt)
	return cnt == 0
}
