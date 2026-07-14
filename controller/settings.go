package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"github.com/weige0831/microsoftaltmanager/service"
	"gorm.io/gorm"
)

type SettingsHandler struct {
	DB       *gorm.DB
	Settings *service.SettingsService
}

func (h *SettingsHandler) Public(c *gin.Context) {
	common.OK(c, h.Settings.Public())
}

func (h *SettingsHandler) Get(c *gin.Context) {
	all := h.Settings.All()
	// enrich with first super admin username for UI
	var admin model.User
	if err := h.DB.Where("role >= ?", model.RoleSuperAdmin).Order("id ASC").First(&admin).Error; err == nil {
		all["admin_username"] = admin.Username
	}
	common.OK(c, all)
}

func (h *SettingsHandler) Update(c *gin.Context) {
	var body map[string]string
	if err := c.ShouldBindJSON(&body); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	for k, v := range body {
		if !service.EditableKeys[k] {
			continue
		}
		// strip dangerous HTML from free-text fields rendered in the SPA
		if k == "footer_html" || k == "notice" || k == "brand_name" || k == "system_name" {
			v = common.SanitizeHTML(v)
		}
		if err := h.Settings.Set(k, v); err != nil {
			common.Fail(c, http.StatusInternalServerError, "保存失败")
			return
		}
		// keep brand/system names in sync when one is updated
		if k == "brand_name" && body["system_name"] == "" {
			_ = h.Settings.Set("system_name", v)
		}
		if k == "system_name" && body["brand_name"] == "" {
			_ = h.Settings.Set("brand_name", v)
		}
	}
	all := h.Settings.All()
	var admin model.User
	if err := h.DB.Where("role >= ?", model.RoleSuperAdmin).Order("id ASC").First(&admin).Error; err == nil {
		all["admin_username"] = admin.Username
	}
	common.OKMsg(c, "已保存", all)
}

type LogsHandler struct {
	DB *gorm.DB
}

func (h *LogsHandler) List(c *gin.Context) {
	var q struct {
		common.PageQuery
		Action string `form:"action"`
	}
	_ = c.ShouldBindQuery(&q)
	q.Normalize()
	tx := h.DB.Model(&model.OpLog{})
	if q.Action != "" {
		tx = tx.Where("action LIKE ?", "%"+q.Action+"%")
	}
	var total int64
	tx.Count(&total)
	var rows []model.OpLog
	tx.Order("created_at DESC, id DESC").Limit(q.PageSize).Offset(q.Offset()).Find(&rows)
	common.OK(c, common.PagedResult{
		Items: rows, Total: total, Page: q.Page,
		Pages: int((total + int64(q.PageSize) - 1) / int64(q.PageSize)),
	})
}
