package controller

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type APIKeyHandler struct {
	DB *gorm.DB
}

type createKeyReq struct {
	Name        string `json:"name" binding:"required"`
	Permissions string `json:"permissions,omitempty"` // e.g. "extract" or "upload,extract"
	Quota       int    `json:"quota,omitempty"`
}

const keyPrefix = "msm_"

// List GET /api/api-keys
func (h *APIKeyHandler) List(c *gin.Context) {
	var rows []model.ApiKey
	h.DB.Order("created_at DESC").Find(&rows)
	common.OK(c, rows)
}

// Create POST /api/api-keys  -> returns the plaintext key ONCE.
func (h *APIKeyHandler) Create(c *gin.Context) {
	var req createKeyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	if req.Permissions == "" {
		req.Permissions = "extract"
	}
	req.Permissions = normalizePerms(req.Permissions)

	plain := keyPrefix + randomHex(24)
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		common.Fail(c, http.StatusInternalServerError, "生成失败")
		return
	}
	k := model.ApiKey{
		Name:        req.Name,
		KeyHash:     string(hash),
		KeyPrefix:   plain[:10],
		Enabled:     true,
		Quota:       req.Quota,
		Permissions: req.Permissions,
	}
	if err := h.DB.Create(&k).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "保存失败")
		return
	}
	common.OKMsg(c, "创建成功（密钥仅展示一次）", gin.H{
		"id": k.ID, "name": k.Name, "key": plain, "key_prefix": k.KeyPrefix,
		"permissions": k.Permissions, "created_at": k.CreatedAt,
	})
}

// Update PUT /api/api-keys/:id  (enable/disable, name, quota, perms)
func (h *APIKeyHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var k model.ApiKey
	if err := h.DB.First(&k, "id = ?", id).Error; err != nil {
		common.Fail(c, http.StatusNotFound, "不存在")
		return
	}
	var req struct {
		Name        *string `json:"name,omitempty"`
		Enabled     *bool   `json:"enabled,omitempty"`
		Quota       *int    `json:"quota,omitempty"`
		Permissions *string `json:"permissions,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	updates := map[string]any{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if req.Quota != nil {
		updates["quota"] = *req.Quota
	}
	if req.Permissions != nil {
		updates["permissions"] = normalizePerms(*req.Permissions)
	}
	if err := h.DB.Model(&k).Updates(updates).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "更新失败")
		return
	}
	common.OKMsg(c, "已更新", k)
}

// Delete DELETE /api/api-keys/:id
func (h *APIKeyHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&model.ApiKey{}, "id = ?", id).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "删除失败")
		return
	}
	common.OKMsg(c, "已删除", nil)
}

func normalizePerms(s string) string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.ToLower(strings.TrimSpace(p))
		if p == "upload" || p == "extract" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return "extract"
	}
	return strings.Join(out, ",")
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

var _ = time.Now
