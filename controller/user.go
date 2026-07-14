package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB   *gorm.DB
	Auth *middleware.Service
}

// List GET /api/users
func (h *UserHandler) List(c *gin.Context) {
	var q struct {
		common.PageQuery
		Keyword string `form:"keyword"`
		Role    *int   `form:"role"`
		Status  *int   `form:"status"`
	}
	_ = c.ShouldBindQuery(&q)
	q.Normalize()

	tx := h.DB.Model(&model.User{})
	if kw := strings.TrimSpace(q.Keyword); kw != "" {
		like := "%" + kw + "%"
		tx = tx.Where("username LIKE ? OR display_name LIKE ? OR email LIKE ?", like, like, like)
	}
	if q.Role != nil {
		tx = tx.Where("role = ?", *q.Role)
	}
	if q.Status != nil {
		tx = tx.Where("status = ?", *q.Status)
	}
	var total int64
	tx.Count(&total)
	var rows []model.User
	tx.Order("role DESC, id ASC").Limit(q.PageSize).Offset(q.Offset()).Find(&rows)

	items := make([]map[string]any, 0, len(rows))
	for i := range rows {
		items = append(items, model.PublicUser(&rows[i]))
	}
	common.OK(c, common.PagedResult{
		Items: items, Total: total, Page: q.Page,
		Pages: int((total + int64(q.PageSize) - 1) / int64(q.PageSize)),
	})
}

// Create POST /api/users
func (h *UserHandler) Create(c *gin.Context) {
	actor := h.Auth.CurrentUser(c)
	var req struct {
		Username    string `json:"username" binding:"required"`
		Password    string `json:"password" binding:"required"`
		DisplayName string `json:"display_name"`
		Email       string `json:"email"`
		Role        int    `json:"role"`
		Remark      string `json:"remark"`
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
	role := req.Role
	if role == 0 {
		role = model.RoleUser
	}
	if role != model.RoleUser && role != model.RoleAdmin && role != model.RoleSuperAdmin {
		common.Fail(c, http.StatusBadRequest, "无效角色")
		return
	}
	// only super admin can create admin/super admin
	if role >= model.RoleAdmin && (actor == nil || actor.Role < model.RoleSuperAdmin) {
		common.Fail(c, http.StatusForbidden, "仅超级管理员可创建管理员")
		return
	}
	if role >= model.RoleSuperAdmin && (actor == nil || actor.Role < model.RoleSuperAdmin) {
		common.Fail(c, http.StatusForbidden, "无法创建超级管理员")
		return
	}
	// non-super cannot create super
	if role == model.RoleSuperAdmin && actor.Role < model.RoleSuperAdmin {
		common.Fail(c, http.StatusForbidden, "无法创建超级管理员")
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
		common.Fail(c, http.StatusInternalServerError, "创建失败")
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
		Role:         role,
		Status:       model.UserStatusEnabled,
		Remark:       strings.TrimSpace(req.Remark),
	}
	if err := h.DB.Create(u).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "创建失败: "+err.Error())
		return
	}
	_ = h.DB.Create(&model.OpLog{
		Action: "user.create", Actor: middleware.ActorLabel(actor),
		TargetID: strconv.FormatInt(u.ID, 10), Detail: u.Username,
	}).Error
	common.OKMsg(c, "已创建", model.PublicUser(u))
}

// Update PUT /api/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	actor := h.Auth.CurrentUser(c)
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var u model.User
	if err := h.DB.First(&u, id).Error; err != nil {
		common.Fail(c, http.StatusNotFound, "用户不存在")
		return
	}
	var req struct {
		DisplayName *string `json:"display_name"`
		Email       *string `json:"email"`
		Password    *string `json:"password"`
		Role        *int    `json:"role"`
		Status      *int    `json:"status"`
		Remark      *string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	// Root (super admin) cannot be demoted/disabled by non-root; root is protected
	if u.Role >= model.RoleSuperAdmin && actor.Role < model.RoleSuperAdmin {
		common.Fail(c, http.StatusForbidden, "无法修改根用户")
		return
	}
	// cannot modify higher-or-equal role user unless super admin targeting lower
	if actor.Role < model.RoleSuperAdmin && u.Role >= actor.Role && u.ID != actor.ID {
		common.Fail(c, http.StatusForbidden, "无法修改同级或更高权限用户")
		return
	}
	updates := map[string]any{}
	if req.DisplayName != nil {
		updates["display_name"] = strings.TrimSpace(*req.DisplayName)
	}
	if req.Email != nil {
		updates["email"] = strings.TrimSpace(*req.Email)
	}
	if req.Remark != nil {
		updates["remark"] = strings.TrimSpace(*req.Remark)
	}
	if req.Password != nil && *req.Password != "" {
		if len(*req.Password) < 6 {
			common.Fail(c, http.StatusBadRequest, "密码至少 6 个字符")
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			common.Fail(c, http.StatusInternalServerError, "更新失败")
			return
		}
		updates["password_hash"] = string(hash)
	}
	if req.Role != nil {
		role := *req.Role
		if role != model.RoleUser && role != model.RoleAdmin && role != model.RoleSuperAdmin {
			common.Fail(c, http.StatusBadRequest, "无效角色")
			return
		}
		if role >= model.RoleAdmin && actor.Role < model.RoleSuperAdmin {
			common.Fail(c, http.StatusForbidden, "仅超级管理员可设置管理员角色")
			return
		}
		if u.ID == actor.ID && role < actor.Role {
			common.Fail(c, http.StatusBadRequest, "不能降低自己的角色")
			return
		}
		updates["role"] = role
	}
	if req.Status != nil {
		if *req.Status != model.UserStatusEnabled && *req.Status != model.UserStatusDisabled {
			common.Fail(c, http.StatusBadRequest, "无效状态")
			return
		}
		if u.ID == actor.ID && *req.Status == model.UserStatusDisabled {
			common.Fail(c, http.StatusBadRequest, "不能禁用自己")
			return
		}
		if u.Role >= model.RoleSuperAdmin && *req.Status == model.UserStatusDisabled {
			common.Fail(c, http.StatusBadRequest, "不能禁用根用户")
			return
		}
		updates["status"] = *req.Status
	}
	if req.Role != nil && u.Role >= model.RoleSuperAdmin && *req.Role < model.RoleSuperAdmin {
		// prevent demoting last root
		var cnt int64
		h.DB.Model(&model.User{}).Where("role >= ? AND id <> ?", model.RoleSuperAdmin, u.ID).Count(&cnt)
		if cnt < 1 {
			common.Fail(c, http.StatusBadRequest, "不能降级唯一根用户")
			return
		}
	}
	if len(updates) == 0 {
		common.OK(c, model.PublicUser(&u))
		return
	}
	if err := h.DB.Model(&u).Updates(updates).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "更新失败")
		return
	}
	_ = h.DB.First(&u, id).Error
	_ = h.DB.Create(&model.OpLog{
		Action: "user.update", Actor: middleware.ActorLabel(actor),
		TargetID: strconv.FormatInt(u.ID, 10), Detail: u.Username,
	}).Error
	common.OKMsg(c, "已保存", model.PublicUser(&u))
}

// Delete DELETE /api/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
	actor := h.Auth.CurrentUser(c)
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if id == actor.ID {
		common.Fail(c, http.StatusBadRequest, "不能删除自己")
		return
	}
	var u model.User
	if err := h.DB.First(&u, id).Error; err != nil {
		common.Fail(c, http.StatusNotFound, "用户不存在")
		return
	}
	if u.Role >= model.RoleSuperAdmin {
		common.Fail(c, http.StatusForbidden, "不能删除根用户")
		return
	}
	if actor.Role < model.RoleSuperAdmin && u.Role >= actor.Role {
		common.Fail(c, http.StatusForbidden, "无法删除同级或更高权限用户")
		return
	}
	if err := h.DB.Delete(&u).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "删除失败")
		return
	}
	// kill sessions
	h.DB.Where("user_id = ?", id).Delete(&model.Session{})
	_ = h.DB.Create(&model.OpLog{
		Action: "user.delete", Actor: middleware.ActorLabel(actor),
		TargetID: strconv.FormatInt(id, 10), Detail: u.Username,
	}).Error
	common.OKMsg(c, "已删除", nil)
}
