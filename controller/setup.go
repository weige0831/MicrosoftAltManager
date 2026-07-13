package controller

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type SetupHandler struct {
	DB *gorm.DB
}

// Status GET /api/setup/status
func (h *SetupHandler) Status(c *gin.Context) {
	common.OK(c, gin.H{"needs_setup": model.NeedsSetup(h.DB)})
}

// Create POST /api/setup  { username, password }
// Only works before any admin exists (first-run).
func (h *SetupHandler) Create(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	if len(req.Username) < 3 {
		common.Fail(c, http.StatusBadRequest, "用户名至少 3 个字符")
		return
	}
	if len(req.Password) < 6 {
		common.Fail(c, http.StatusBadRequest, "密码至少 6 个字符")
		return
	}
	if !model.NeedsSetup(h.DB) {
		common.Fail(c, http.StatusForbidden, "系统已初始化，请直接登录")
		return
	}
	// ensure username not taken
	var cnt int64
	h.DB.Model(&model.User{}).Where("username = ?", req.Username).Count(&cnt)
	if cnt > 0 {
		common.Fail(c, http.StatusConflict, "用户名已存在")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		common.Fail(c, http.StatusInternalServerError, "初始化失败")
		return
	}
	u := &model.User{Username: req.Username, PasswordHash: string(hash), Role: "admin"}
	if err := h.DB.Create(u).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "创建失败: "+err.Error())
		return
	}
	_ = h.DB.Create(&model.OpLog{Action: "setup.create", Actor: req.Username, Detail: "initial admin"}).Error
	common.OKMsg(c, "初始化完成，请登录", gin.H{"username": u.Username})
}
