package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"github.com/weige0831/microsoftaltmanager/router"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/service"
	"github.com/weige0831/microsoftaltmanager/model"
)

func main() {
	cfg := common.Load()
	common.EnsureDataDir()

	if exe, err := os.Executable(); err == nil {
		_ = os.Chdir(filepath.Dir(exe))
	}

	db, err := model.Open(cfg)
	if err != nil {
		log.Fatalf("[fatal] open db: %v", err)
	}

	cipher, err := common.New(cfg.MasterKey)
	if err != nil {
		log.Fatalf("[fatal] crypto init: %v", err)
	}

	authSvc := middleware.New(db)
	settingsSvc := &service.SettingsService{DB: db}
	accountSvc := &service.AccountService{DB: db, Cipher: cipher, Now: time.Now}

	// background cleaner
	cleaner := &service.Cleaner{DB: db, Now: time.Now}
	stopCleaner := cleaner.Start(func(k, def string) string { return settingsSvc.Get(k, def) })
	defer stopCleaner()

	r := router.NewRouter(router.Deps{
		DB: db, Auth: authSvc, Accounts: accountSvc, Settings: settingsSvc,
	})

	// port with auto-increment fallback (up to 20 tries)
	port := cfg.Port
	if port == 0 {
		port = 27321
	}
	srv := &http.Server{
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}
	chosen := -1
	for i := 0; i < 20; i++ {
		try := port + i
		ln, err := net.Listen("tcp", fmt.Sprintf(":%d", try))
		if err != nil {
			log.Printf("[net] port %d unavailable (%v), trying next...", try, err)
			continue
		}
		chosen = try
		srv.Addr = fmt.Sprintf(":%d", try)
		go func() {
			log.Printf("[app] listening on http://0.0.0.0:%d  (requested %d)", try, port)
			if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
				log.Fatalf("[fatal] serve: %v", err)
			}
		}()
		break
	}
	if chosen < 0 {
		log.Fatalf("[fatal] no free port in range %d-%d", port, port+19)
	}
	_ = strconv.Itoa(chosen)

	// graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[app] shutting down...")
	_ = srv.Close()
}
