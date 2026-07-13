package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"github.com/weige0831/microsoftaltmanager/service"
	"gorm.io/gorm"
)

type AccountHandler struct {
	DB       *gorm.DB
	Cipher   *common.Cipher
	Accounts *service.AccountService
	Settings *service.SettingsService
}

type uploadReq struct {
	Username      string                 `json:"username" binding:"required"`
	Password      string                 `json:"password" binding:"required"`
	Cookie        string                 `json:"cookie" binding:"required"`
	Remark        string                 `json:"remark,omitempty"`
	RefreshTokens []model.RefreshToken   `json:"refresh_tokens,omitempty"`
}

type batchReq struct {
	Items []uploadReq `json:"items" binding:"required"`
}

func (h *AccountHandler) actorOf(c *gin.Context) string {
	if v, ok := c.Get("actor"); ok {
		if s, _ := v.(string); s != "" {
			return s
		}
	}
	return "unknown"
}

// Upload POST /api/account
func (h *AccountHandler) Upload(c *gin.Context) {
	var req uploadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	acc, err := h.buildAccount(req, h.actorOf(c))
	if err != nil {
		common.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.DB.Create(acc).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "保存失败: "+err.Error())
		return
	}
	h.log(c, "account.upload", acc.ID)
	common.OKMsg(c, "上传成功", maskAccount(acc))
}

// UploadBatch POST /api/account/batch
func (h *AccountHandler) UploadBatch(c *gin.Context) {
	var req batchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误: "+err.Error())
		return
	}
	actor := h.actorOf(c)
	created := make([]*model.Account, 0, len(req.Items))
	for _, it := range req.Items {
		acc, err := h.buildAccount(it, actor)
		if err != nil {
			common.Fail(c, http.StatusInternalServerError, err.Error())
			return
		}
		if err := h.DB.Create(acc).Error; err != nil {
			common.Fail(c, http.StatusInternalServerError, "保存失败: "+err.Error())
			return
		}
		created = append(created, acc)
	}
	h.log(c, "account.upload_batch", 0)
	vals := make([]model.Account, 0, len(created))
	for _, a := range created {
		vals = append(vals, *a)
	}
	common.OKMsg(c, "批量上传成功", gin.H{"created": len(created), "items": maskAccounts(vals)})
}

func (h *AccountHandler) buildAccount(req uploadReq, actor string) (*model.Account, error) {
	pwEnc, err := h.Cipher.Encrypt(req.Password)
	if err != nil {
		return nil, err
	}
	ckEnc, err := h.Cipher.Encrypt(req.Cookie)
	if err != nil {
		return nil, err
	}
	acc := &model.Account{
		Username:    req.Username,
		PasswordEnc: pwEnc,
		PasswordSet: true,
		CookieEnc:   ckEnc,
		CookieSet:   true,
		Remark:      req.Remark,
		Status:      model.AccountAvailable,
		UploadedAt:  time.Now(),
		UploadedBy:  actor,
	}
	if len(req.RefreshTokens) > 0 {
		jsonStr, err := model.EncodeRefreshTokens(req.RefreshTokens)
		if err != nil {
			return nil, err
		}
		enc, err := h.Cipher.Encrypt(jsonStr)
		if err != nil {
			return nil, err
		}
		acc.RefreshEnc = enc
		acc.RefreshSet = true
	}
	return acc, nil
}

// List GET /api/accounts
func (h *AccountHandler) List(c *gin.Context) {
	var q struct {
		common.PageQuery
		Status     *int   `form:"status"`
		Remark     string `form:"remark"`
		Username   string `form:"username"`
	}
	_ = c.ShouldBindQuery(&q)
	q.Normalize()

	tx := h.DB.Model(&model.Account{})
	if q.Status != nil {
		tx = tx.Where("status = ?", *q.Status)
	}
	if q.Remark != "" {
		tx = tx.Where("remark LIKE ?", "%"+q.Remark+"%")
	}
	if q.Username != "" {
		tx = tx.Where("username LIKE ?", "%"+q.Username+"%")
	}

	var total int64
	tx.Count(&total)

	var rows []model.Account
	tx.Order("uploaded_at DESC, id DESC").Limit(q.PageSize).Offset(q.Offset()).Find(&rows)

	common.OK(c, common.PagedResult{
		Items: maskAccounts(rows), Total: total, Page: q.Page,
		Pages: int((total + int64(q.PageSize) - 1) / int64(q.PageSize)),
	})
}

// Detail GET /api/account/:id  (plaintext, admin only)
func (h *AccountHandler) Detail(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var acc model.Account
	if err := h.DB.First(&acc, id).Error; err != nil {
		common.Fail(c, http.StatusNotFound, "账号不存在")
		return
	}
	plain := h.Accounts.ToView(&acc)
	common.OK(c, plain)
}

// Delete DELETE /api/account/:id
func (h *AccountHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.DB.Delete(&model.Account{}, id).Error; err != nil {
		common.Fail(c, http.StatusInternalServerError, "删除失败")
		return
	}
	h.log(c, "account.delete", id)
	common.OKMsg(c, "已删除", nil)
}

// Extract POST /api/account/extract
func (h *AccountHandler) Extract(c *gin.Context) {
	var req service.ExtractRequest
	_ = c.ShouldBindJSON(&req)
	out, err := h.Accounts.Extract(req, h.actorOf(c))
	if err != nil {
		common.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	if len(out) == 0 {
		common.OKMsg(c, "没有可用账号", gin.H{"items": []any{}, "count": 0})
		return
	}
	common.OKMsg(c, "提取成功", gin.H{"items": out, "count": len(out)})
}

// Stats GET /api/dashboard/stats
func (h *AccountHandler) Stats(c *gin.Context) {
	var available, used int64
	h.DB.Model(&model.Account{}).Where("status = ?", model.AccountAvailable).Count(&available)
	h.DB.Model(&model.Account{}).Where("status = ?", model.AccountUsed).Count(&used)

	now := time.Now()
	day := now.Add(-24 * time.Hour)
	var todayUpload int64
	h.DB.Model(&model.Account{}).Where("uploaded_at >= ?", day).Count(&todayUpload)

	ttl := h.Settings.GetInt("ttl_after_extract", 86400)
	maxAge := h.Settings.GetInt("max_age_unused", 2592000)
	var expiringSoon int64
	if ttl > 0 {
		cutoff := now.Add(-time.Duration(ttl) * time.Second).Add(2 * time.Hour) // within 2h of expiry
		h.DB.Model(&model.Account{}).
			Where("status = ? AND used_at IS NOT NULL AND used_at < ?", model.AccountUsed, cutoff).
			Count(&expiringSoon)
	}
	common.OK(c, gin.H{
		"available":     available,
		"used":          used,
		"today_upload":  todayUpload,
		"expiring_soon": expiringSoon,
		"ttl_after_extract": ttl,
		"max_age_unused":    maxAge,
	})
}

// --- helpers ---

func (h *AccountHandler) log(c *gin.Context, action string, id int64) {
	actor := h.actorOf(c)
	_ = h.DB.Create(&model.OpLog{
		Action: action, Actor: actor,
		TargetID: strconv.FormatInt(id, 10),
	}).Error
}

func maskAccount(a *model.Account) gin.H {
	return maskAccounts([]model.Account{*a}).([]gin.H)[0]
}

func maskAccounts(rows []model.Account) any {
	out := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		out = append(out, gin.H{
			"id":           r.ID,
			"username":     r.Username,
			"remark":       r.Remark,
			"status":       r.Status,
			"uploaded_at":  r.UploadedAt,
			"used_at":      r.UsedAt,
			"uploaded_by":  r.UploadedBy,
			"extracted_by": r.ExtractedBy,
			"password_set": r.PasswordSet,
			"cookie_set":   r.CookieSet,
			"refresh_set":  r.RefreshSet,
		})
	}
	return out
}
