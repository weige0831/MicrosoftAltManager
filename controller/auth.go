package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/weige0831/microsoftaltmanager/middleware"
	"github.com/weige0831/microsoftaltmanager/common"
)

type AuthHandler struct {
	Auth *middleware.Service
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, http.StatusBadRequest, "参数错误")
		return
	}
	u, err := h.Auth.Login(c, req.Username, req.Password)
	if err != nil {
		common.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}
	common.OKMsg(c, "登录成功", gin.H{
		"id": u.ID, "username": u.Username, "role": u.Role,
	})
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
	common.OK(c, gin.H{"id": u.ID, "username": u.Username, "role": u.Role})
}
