package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/model"
	"github.com/weige0831/microsoftaltmanager/service"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	Auth     *middleware.Service
	DB       *gorm.DB
	Settings *service.SettingsService
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.Settings != nil && !h.Settings.GetBool("password_login_enabled", true) {
		common.Fail(c, http.StatusForbidden, "密码登录已关闭")
		return
	}
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	u, err := h.Auth.Login(c, strings.TrimSpace(req.Username), req.Password)
	if err != nil {
		common.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	common.OKMsg(c, "登录成功", model.PublicUser(u))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	h.Auth.Logout(c)
	common.OKMsg(c, "已退出", nil)
}

func (h *AuthHandler) Self(c *gin.Context) {
	u := h.Auth.CurrentUser(c)
	if u == nil {
		common.Fail(c, http.StatusUnauthorized, "未登录")
		return
	}
	common.OK(c, model.PublicUser(u))
}

// Register POST /api/user/register
func (h *AuthHandler) Register(c *gin.Context) {
	// require both switches (UI toggles them together; either off blocks register)
	if h.Settings == nil ||
		!h.Settings.GetBool("register_enabled", false) ||
		!h.Settings.GetBool("password_register_enabled", false) {
		common.Fail(c, http.StatusForbidden, "注册已关闭")
		return
	}
	var req struct {
		Username    string `json:"username" binding:"required"`
		Password    string `json:"password" binding:"required"`
		DisplayName string `json:"display_name"`
		Email       string `json:"email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
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
	var cnt int64
	h.DB.Model(&model.User{}).Where("username = ?", req.Username).Count(&cnt)
	if cnt > 0 {
		common.Fail(c, http.StatusConflict, "用户名已存在")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		common.Fail(c, http.StatusInternalServerError, "注册失败")
		return
	}
	dn := strings.TrimSpace(req.DisplayName)
	if dn == "" {
		dn = req.Username
	}
	u := &model.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		DisplayName:  dn,
		Email:        strings.TrimSpace(req.Email),
		Role:         model.RoleUser,
		Status:       model.UserStatusEnabled,
	}
	if err := h.DB.Create(u).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "注册失败: "+err.Error())
		return
	}
	_ = h.DB.Create(&model.OpLog{
		Action: "user.register", Actor: u.Username,
		TargetID: strconv.FormatInt(u.ID, 10), Detail: "self-register",
	}).Error
	common.OKMsg(c, "注册成功，请登录", model.PublicUser(u))
}

// UpdateSelf PUT /api/user/self
func (h *AuthHandler) UpdateSelf(c *gin.Context) {
	u := h.Auth.CurrentUser(c)
	if u == nil {
		common.Fail(c, http.StatusUnauthorized, "未登录")
		return
	}
	var req struct {
		DisplayName      string `json:"display_name"`
		Email            string `json:"email"`
		Password         string `json:"password"`
		OriginalPassword string `json:"original_password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	updates := map[string]any{}
	if req.DisplayName != "" {
		updates["display_name"] = strings.TrimSpace(req.DisplayName)
	}
	if req.Email != "" {
		updates["email"] = strings.TrimSpace(req.Email)
	}
	if req.Password != "" {
		if len(req.Password) < 6 {
			common.Fail(c, http.StatusBadRequest, "密码至少 6 个字符")
			return
		}
		if req.OriginalPassword == "" {
			common.Fail(c, http.StatusBadRequest, "请提供原密码")
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.OriginalPassword)); err != nil {
			common.Fail(c, http.StatusUnauthorized, "原密码错误")
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			common.Fail(c, http.StatusInternalServerError, "更新失败")
			return
		}
		updates["password_hash"] = string(hash)
	}
	if len(updates) == 0 {
		common.OK(c, model.PublicUser(u))
		return
	}
	if err := h.DB.Model(u).Updates(updates).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "更新失败")
		return
	}
	_ = h.DB.First(u, u.ID).Error
	common.OKMsg(c, "已保存", model.PublicUser(u))
}
