package router

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/controller"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/service"
	"github.com/weige0831/microsoftaltmanager/model"
	"github.com/weige0831/microsoftaltmanager/common"
	"gorm.io/gorm"
)

type Deps struct {
	DB       *gorm.DB
	Auth     *middleware.Service
	Accounts *service.AccountService
	Settings *service.SettingsService
}

func NewRouter(d Deps) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(cors.New(cors.Config{
		AllowOriginFunc:  func(string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	setupH := &controller.SetupHandler{DB: d.DB}
	acctH := &controller.AccountHandler{DB: d.DB, Cipher: d.Accounts.Cipher, Accounts: d.Accounts, Settings: d.Settings}
	keyH := &controller.APIKeyHandler{DB: d.DB}
	authH := &controller.AuthHandler{Auth: d.Auth}
	setH := &controller.SettingsHandler{DB: d.DB, Settings: d.Settings}
	logH := &controller.LogsHandler{DB: d.DB}

	// setup gate: while first-run setup is pending, allow only setup endpoints
	// and read-only status; reject all OTHER /api/* calls so the app cannot be
	// used before initialization. Non-API paths (the SPA) always pass through.
	// NOTE: must match "/api/" (or exact "/api"), NOT strings that merely start
	// with "/api" — otherwise SPA routes like "/apikeys" get blocked.
	isAPIPath := func(p string) bool {
		return p == "/api" || len(p) >= 5 && p[:5] == "/api/"
	}
	setupGate := func(c *gin.Context) {
		p := c.Request.URL.Path
		// always let the SPA + static assets through
		if !isAPIPath(p) {
			c.Next()
			return
		}
		// allowed during setup
		if p == "/api/setup" || p == "/api/setup/status" ||
			p == "/api/status" || p == "/api/settings" ||
			p == "/api/notice" {
			c.Next()
			return
		}
		if model.NeedsSetup(d.DB) {
			c.AbortWithStatusJSON(http.StatusOK, gin.H{
				"success": false,
				"message": "系统尚未初始化，请先完成首次配置",
				"data":    gin.H{"needs_setup": true},
			})
			return
		}
		c.Next()
	}
	r.Use(setupGate)

	api := r.Group("/api")
	{
		// public (no auth) — mirrors new-api /api/status shape
		api.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"success": true,
				"data": gin.H{
					"version":                common.Version,
					"commit_hash":            common.CommitHash,
					"system_name":            d.Settings.Get("brand_name", "微软账号管理器"),
					"brand_name":             d.Settings.Get("brand_name", "微软账号管理器"),
					"logo":                   "",
					"needs_setup":            model.NeedsSetup(d.DB),
					"setup":                  !model.NeedsSetup(d.DB),
					"announcements_enabled":  false,
					"announcements":          []any{},
				},
			})
		})
		// new-api compatible notice endpoint (empty until settings support it)
		api.GET("/notice", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"success": true,
				"message": "",
				"data":    d.Settings.Get("notice", ""),
			})
		})
		api.GET("/settings", setH.Public)
		api.GET("/setup/status", setupH.Status)
		api.POST("/setup", setupH.Create)

		// auth — new-api compatible routes + my own
		api.POST("/auth/login", authH.Login)
		api.POST("/user/login", authH.Login) // new-api alias
		api.POST("/auth/logout", d.Auth.RequireSession(), authH.Logout)
		api.POST("/user/logout", d.Auth.RequireSession(), authH.Logout) // new-api alias
		api.GET("/user/self", d.Auth.RequireSession(), authH.Self)

		// account: upload + extract need auth (session OR apikey with perm)
		api.POST("/account", d.Auth.RequireAnyAuth("upload"), acctH.Upload)
		api.POST("/account/batch", d.Auth.RequireAnyAuth("upload"), acctH.UploadBatch)
		api.POST("/account/extract", d.Auth.RequireAnyAuth("extract"), acctH.Extract)

		// account management: session only
		secure := d.Auth.RequireSession()
		g := api.Group("", secure)
		{
			g.GET("/accounts", acctH.List)
			g.GET("/account/:id", acctH.Detail)
			g.DELETE("/account/:id", acctH.Delete)
			g.GET("/dashboard/stats", acctH.Stats)

			g.GET("/api-keys", keyH.List)
			g.POST("/api-keys", keyH.Create)
			g.PUT("/api-keys/:id", keyH.Update)
			g.DELETE("/api-keys/:id", keyH.Delete)

			g.GET("/settings/all", setH.Get)
			g.PUT("/settings", setH.Update)

			g.GET("/logs", logH.List)
		}
	}

	// SPA static files
	r.NoRoute(func(c *gin.Context) {
		if isAPIPath(c.Request.URL.Path) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "not found"})
			return
		}
		common.StaticHandler().ServeHTTP(c.Writer, c.Request)
	})
	return r
}
