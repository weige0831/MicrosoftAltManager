package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/weige0831/microsoftaltmanager/common"
	"github.com/weige0831/microsoftaltmanager/model"
	"gorm.io/gorm"
)

type AccountService struct {
	DB     *gorm.DB
	Cipher *common.Cipher
	Now    func() time.Time
}

// ExtractRequest are the filters for extraction.
type ExtractRequest struct {
	Count        int        `json:"count"`
	UploadedAfter *time.Time `json:"uploaded_after,omitempty"`
	Remark       string     `json:"remark,omitempty"`
	AppName      string     `json:"app_name,omitempty"`
}

// ExtractedAccount is the plaintext view returned once on extraction.
type ExtractedAccount struct {
	ID            int64                 `json:"id"`
	Username      string                `json:"username"`
	Password      string                `json:"password,omitempty"`
	Cookie        string                `json:"cookie,omitempty"`
	RefreshTokens []model.RefreshToken  `json:"refresh_tokens,omitempty"`
	Remark        string                `json:"remark,omitempty"`
	UploadedAt    time.Time             `json:"uploaded_at"`
	UsedAt        *time.Time            `json:"used_at,omitempty"`
}

// Extract atomically marks `count` available accounts as used (FIFO old->new)
// and returns their plaintext. Guarantees no double-extraction.
func (s *AccountService) Extract(req ExtractRequest, actor string) ([]ExtractedAccount, error) {
	if req.Count <= 0 {
		req.Count = 1
	}
	if req.Count > 500 {
		req.Count = 500
	}

	var out []ExtractedAccount
	// AppName filter is encrypted content, so when requested we over-fetch in Go.
	limit := req.Count
	if req.AppName != "" {
		limit *= 5 // over-fetch to survive app_name filtering
	}

	var ids []int64
	idQ := s.DB.Model(&model.Account{}).Where("status = ?", model.AccountAvailable)
	if req.UploadedAfter != nil {
		idQ = idQ.Where("uploaded_at >= ?", *req.UploadedAfter)
	}
	if req.Remark != "" {
		idQ = idQ.Where("remark LIKE ?", "%"+req.Remark+"%")
	}
	if err := idQ.Order("uploaded_at ASC, id ASC").Limit(limit).Pluck("id", &ids).Error; err != nil {
		return nil, err
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var rows []model.Account
		if len(ids) == 0 {
			return nil
		}
		if err := tx.Where("id IN ?", ids).Order("uploaded_at ASC, id ASC").Find(&rows).Error; err != nil {
			return err
		}
		// filter by app name if requested (encrypted content)
		if req.AppName != "" {
			filtered := make([]model.Account, 0, len(rows))
			for _, r := range rows {
				toks, _ := model.DecodeRefreshTokens(decryptOrEmpty(s.Cipher, r.RefreshEnc))
				for _, t := range toks {
					if t.AppName == req.AppName {
						filtered = append(filtered, r)
						break
					}
				}
			}
			rows = filtered
		}

		now := s.Now()
		for i := range rows {
			row := &rows[i]
			// atomic claim: only this UPDATE will succeed for status=0
			res := tx.Model(&model.Account{}).
				Where("id = ? AND status = ?", row.ID, model.AccountAvailable).
				Updates(map[string]any{
					"status":        model.AccountUsed,
					"used_at":       now,
					"extracted_by":  actor,
				})
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				continue // someone else grabbed it; skip
			}
			out = append(out, s.toExtracted(row))
		}
		// log
		if len(out) > 0 {
			_ = tx.Create(&model.OpLog{
				Action: "account.extract", Actor: actor,
				Detail: fmt.Sprintf("count=%d", len(out)),
			}).Error
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (s *AccountService) toExtracted(r *model.Account) ExtractedAccount {
	return s.ToView(r)
}

// ToView decrypts an account into its plaintext view.
func (s *AccountService) ToView(r *model.Account) ExtractedAccount {
	ea := ExtractedAccount{
		ID:         r.ID,
		Username:   r.Username,
		Remark:     r.Remark,
		UploadedAt: r.UploadedAt,
		UsedAt:     r.UsedAt,
	}
	ea.Password = decryptOrEmpty(s.Cipher, r.PasswordEnc)
	ea.Cookie = decryptOrEmpty(s.Cipher, r.CookieEnc)
	if r.RefreshSet {
		toks, _ := model.DecodeRefreshTokens(decryptOrEmpty(s.Cipher, r.RefreshEnc))
		ea.RefreshTokens = toks
	}
	return ea
}

func decryptOrEmpty(c *common.Cipher, s string) string {
	if s == "" || c == nil {
		return ""
	}
	v, err := c.Decrypt(s)
	if err != nil {
		return ""
	}
	return v
}

func (s *AccountService) dialectIsPg(tx *gorm.DB) bool {
	return tx != nil && tx.Dialector != nil && tx.Dialector.Name() == "postgres"
}


// ErrNothingAvailable when no accounts match extraction filters.
var ErrNothingAvailable = errors.New("没有可用账号")
