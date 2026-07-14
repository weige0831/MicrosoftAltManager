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
	common.OK(c, h.Settings.All())
}

func (h *SettingsHandler) Update(c *gin.Context) {
	var body map[string]string
	if err := c.ShouldBindJSON(&body); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	// whitelist editable keys
	allowed := map[string]bool{
		"ttl_after_extract": true,
		"max_age_unused":    true,
		"brand_name":        true,
		"notice":            true,
	}
	for k, v := range body {
		if !allowed[k] {
			continue
		}
		if err := h.Settings.Set(k, v); err != nil {
			common.Fail(c, http.StatusInternalServerError, "保存失败")
			return
		}
	}
	common.OKMsg(c, "已保存", h.Settings.All())
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
