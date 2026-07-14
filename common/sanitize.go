package common

import (
	"regexp"
	"strings"
)

var (
	reScript     = regexp.MustCompile(`(?is)<script\b[^>]*>.*?</script>`)
	reStyle      = regexp.MustCompile(`(?is)<style\b[^>]*>.*?</style>`)
	reIframe     = regexp.MustCompile(`(?is)<iframe\b[^>]*>.*?</iframe>`)
	reObject     = regexp.MustCompile(`(?is)<object\b[^>]*>.*?</object>`)
	reEmbed      = regexp.MustCompile(`(?is)<embed\b[^>]*/?>`)
	reEventAttr  = regexp.MustCompile(`(?is)\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)`)
	reJSURL      = regexp.MustCompile(`(?is)\s+(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)`)
	reDataURL    = regexp.MustCompile(`(?is)\s+(href|src)\s*=\s*("\s*data:[^"]*"|'\s*data:[^']*'|[^\s>]*data:[^\s>]*)`)
)

// SanitizeHTML removes common XSS vectors from admin-supplied HTML snippets.
// Intentionally conservative (no full HTML parser dependency).
func SanitizeHTML(s string) string {
	if s == "" {
		return s
	}
	out := s
	out = reScript.ReplaceAllString(out, "")
	out = reStyle.ReplaceAllString(out, "")
	out = reIframe.ReplaceAllString(out, "")
	out = reObject.ReplaceAllString(out, "")
	out = reEmbed.ReplaceAllString(out, "")
	out = reEventAttr.ReplaceAllString(out, "")
	out = reJSURL.ReplaceAllString(out, "")
	out = reDataURL.ReplaceAllString(out, "")
	// neutralize leftover script tags without closing body
	out = strings.ReplaceAll(out, "<script", "&lt;script")
	out = strings.ReplaceAll(out, "</script", "&lt;/script")
	return out
}
