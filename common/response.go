package common

import "github.com/gin-gonic/gin"

// Envelope matches new-api: { success, message, data }.
type Envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(200, Envelope{Success: true, Data: data})
}

func OKMsg(c *gin.Context, msg string, data interface{}) {
	c.JSON(200, Envelope{Success: true, Message: msg, Data: data})
}

func Fail(c *gin.Context, code int, msg string) {
	c.AbortWithStatusJSON(code, Envelope{Success: false, Message: msg})
}

// Pagination common params.
type PageQuery struct {
	Page     int `form:"page,default=1" binding:"-"`
	PageSize int `form:"page_size,default=20" binding:"-"`
}

func (p *PageQuery) Normalize() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize < 1 {
		p.PageSize = 20
	}
	if p.PageSize > 500 {
		p.PageSize = 500
	}
}
func (p *PageQuery) Offset() int { return (p.Page - 1) * p.PageSize }

type PagedResult struct {
	Items interface{} `json:"items"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Pages int         `json:"pages"`
}
