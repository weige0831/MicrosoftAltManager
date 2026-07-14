package router

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/controller"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/model"
	"github.com/weige0831/microsoftaltmanager/service"
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
		// Same-origin SPA + cookie auth: reflect only the request Origin when present.
		// Empty Origin (non-browser / same-origin) is allowed without credentials leakage.
		AllowOriginFunc: func(origin string) bool {
			return origin != ""
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	setupH := &controller.SetupHandler{DB: d.DB}
	acctH := &controller.AccountHandler{DB: d.DB, Cipher: d.Accounts.Cipher, Accounts: d.Accounts, Settings: d.Settings}
	keyH := &controller.APIKeyHandler{DB: d.DB}
	authH := &controller.AuthHandler{Auth: d.Auth, DB: d.DB, Settings: d.Settings}
	setH := &controller.SettingsHandler{DB: d.DB, Settings: d.Settings}
	logH := &controller.LogsHandler{DB: d.DB}
	userH := &controller.UserHandler{DB: d.DB, Auth: d.Auth}
	authLimit := middleware.NewRateLimiter(20, time.Minute)
	setupLimit := middleware.NewRateLimiter(5, time.Minute)

	isAPIPath := func(p string) bool {
		return p == "/api" || len(p) >= 5 && p[:5] == "/api/"
	}
	setupGate := func(c *gin.Context) {
		p := c.Request.URL.Path
		if !isAPIPath(p) {
			c.Next()
			return
		}
		switch p {
		case "/api/setup", "/api/setup/status", "/api/status", "/api/settings", "/api/notice",
			"/api/user/login", "/api/auth/login", "/api/user/register":
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
		// public
		api.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"success": true,
				"data":    d.Settings.StatusPayload(model.NeedsSetup(d.DB)),
			})
		})
		api.GET("/notice", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"success": true,
				"message": "",
				"data":    d.Settings.Get("notice", ""),
			})
		})
		api.GET("/settings", setH.Public)
		api.GET("/setup/status", setupH.Status)
		api.POST("/setup", setupLimit.Middleware(), setupH.Create)

		// auth
		api.POST("/auth/login", authLimit.Middleware(), authH.Login)
		api.POST("/user/login", authLimit.Middleware(), authH.Login)
		api.POST("/user/register", authLimit.Middleware(), authH.Register)
		api.POST("/auth/logout", d.Auth.RequireSession(), authH.Logout)
		api.POST("/user/logout", d.Auth.RequireSession(), authH.Logout)
		api.GET("/user/self", d.Auth.RequireSession(), authH.Self)
		api.PUT("/user/self", d.Auth.RequireSession(), authH.UpdateSelf)

		// account: session or apikey
		api.POST("/account", d.Auth.RequireAnyAuth("upload"), acctH.Upload)
		api.POST("/account/batch", d.Auth.RequireAnyAuth("upload"), acctH.UploadBatch)
		api.POST("/account/extract", d.Auth.RequireAnyAuth("extract"), acctH.Extract)

		// session-only management
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

			g.GET("/settings/all", d.Auth.RequireRole(model.RoleAdmin), setH.Get)
			g.PUT("/settings", d.Auth.RequireRole(model.RoleAdmin), setH.Update)

			g.GET("/logs", d.Auth.RequireRole(model.RoleAdmin), logH.List)

			// multi-user admin
			admin := g.Group("", d.Auth.RequireRole(model.RoleAdmin))
			{
				admin.GET("/users", userH.List)
				admin.POST("/users", userH.Create)
				admin.PUT("/users/:id", userH.Update)
				admin.DELETE("/users/:id", userH.Delete)
			}
		}
	}

	r.NoRoute(func(c *gin.Context) {
		if isAPIPath(c.Request.URL.Path) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "not found"})
			return
		}
		common.StaticHandler().ServeHTTP(c.Writer, c.Request)
	})
	return r
}
