package dashboard

import (
	"crypto/sha256"
	_ "embed"
	"fmt"
	"strings"

	"iiko-analytic/internal/api/utils"

	"github.com/gofiber/fiber/v2"
)

//go:embed templates/index.html
var htmlPage string

//go:embed static/js/main.js
var mainJS string

//go:embed static/js/utils.js
var utilsJS string

//go:embed static/js/fields.js
var fieldsJS string

//go:embed static/js/filters.js
var filtersJS string

//go:embed static/js/clear-fields.js
var clearFieldsJS string

//go:embed static/js/query.js
var queryJS string

//go:embed static/js/json-highlight.js
var jsonHighlightJS string

//go:embed static/js/import.js
var importJS string

//go:embed static/js/servers.js
var serversJS string

//go:embed static/js/chart.js
var chartJS string

//go:embed static/js/hash.js
var hashJS string

//go:embed static/favicon.svg
var faviconSVG string

var (
	htmlETag            string
	mainJSETag          string
	utilsJSETag         string
	fieldsJSETag        string
	filtersJSETag       string
	clearFieldsJSETag   string
	queryJSETag         string
	jsonHighlightJSETag string
	importJSETag        string
	serversJSETag       string
	chartJSETag         string
	hashJSETag          string
	faviconSVGETag      string
)

const (
	Route  = "/"
	Method = fiber.MethodGet
)

func init() {
	// Генерируем ETag при запуске
	mainJSETag = generateETag(mainJS)
	utilsJSETag = generateETag(utilsJS)
	fieldsJSETag = generateETag(fieldsJS)
	filtersJSETag = generateETag(filtersJS)
	clearFieldsJSETag = generateETag(clearFieldsJS)
	queryJSETag = generateETag(queryJS)
	jsonHighlightJSETag = generateETag(jsonHighlightJS)
	importJSETag = generateETag(importJS)
	serversJSETag = generateETag(serversJS)
	chartJSETag = generateETag(chartJS)
	hashJSETag = generateETag(hashJS)
	faviconSVGETag = generateETag(faviconSVG)

	// Добавляем cache-busting к URL скриптов в HTML
	replacer := strings.NewReplacer(
		"/static/js/utils.js", "/static/js/utils.js?v="+utilsJSETag,
		"/static/js/servers.js", "/static/js/servers.js?v="+serversJSETag,
		"/static/js/fields.js", "/static/js/fields.js?v="+fieldsJSETag,
		"/static/js/filters.js", "/static/js/filters.js?v="+filtersJSETag,
		"/static/js/clear-fields.js", "/static/js/clear-fields.js?v="+clearFieldsJSETag,
		"/static/js/query.js", "/static/js/query.js?v="+queryJSETag,
		"/static/js/json-highlight.js", "/static/js/json-highlight.js?v="+jsonHighlightJSETag,
		"/static/js/import.js", "/static/js/import.js?v="+importJSETag,
		"/static/js/chart.js", "/static/js/chart.js?v="+chartJSETag,
		"/static/js/hash.js", "/static/js/hash.js?v="+hashJSETag,
		"/static/js/main.js", "/static/js/main.js?v="+mainJSETag,
	)
	htmlPage = replacer.Replace(htmlPage)
	htmlETag = generateETag(htmlPage)
}

func generateETag(content string) string {
	hash := sha256.Sum256([]byte(content))
	return fmt.Sprintf(`"%x"`, hash[:8])
}

func NewDashboardHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, dashboardHandler)
}

func NewStaticHandler(path, content, etag string) utils.HandlerInterface {
	return utils.NewHandler(fiber.MethodGet, path, func(c *fiber.Ctx) error {
		if c.Get("If-None-Match") == etag {
			return c.SendStatus(fiber.StatusNotModified)
		}

		c.Set("Cache-Control", "public, max-age=31536000, immutable") // 1 год для статики
		c.Set("ETag", etag)
		c.Set("Content-Type", "application/javascript; charset=utf-8")

		return c.SendString(content)
	})
}

func NewFaviconHandler(path, content, etag string) utils.HandlerInterface {
	return utils.NewHandler(fiber.MethodGet, path, func(c *fiber.Ctx) error {
		if c.Get("If-None-Match") == etag {
			return c.SendStatus(fiber.StatusNotModified)
		}

		c.Set("Cache-Control", "public, max-age=31536000, immutable") // 1 год для статики
		c.Set("ETag", etag)
		c.Set("Content-Type", "image/svg+xml")

		return c.SendString(content)
	})
}

func GetStaticHandlers() []utils.HandlerInterface {
	return []utils.HandlerInterface{
		NewStaticHandler("/static/js/main.js", mainJS, mainJSETag),
		NewStaticHandler("/static/js/utils.js", utilsJS, utilsJSETag),
		NewStaticHandler("/static/js/fields.js", fieldsJS, fieldsJSETag),
		NewStaticHandler("/static/js/filters.js", filtersJS, filtersJSETag),
		NewStaticHandler("/static/js/clear-fields.js", clearFieldsJS, clearFieldsJSETag),
		NewStaticHandler("/static/js/query.js", queryJS, queryJSETag),
		NewStaticHandler("/static/js/json-highlight.js", jsonHighlightJS, jsonHighlightJSETag),
		NewStaticHandler("/static/js/import.js", importJS, importJSETag),
		NewStaticHandler("/static/js/servers.js", serversJS, serversJSETag),
		NewStaticHandler("/static/js/chart.js", chartJS, chartJSETag),
		NewStaticHandler("/static/js/hash.js", hashJS, hashJSETag),
		NewFaviconHandler("/favicon.svg", faviconSVG, faviconSVGETag),
	}
}

func dashboardHandler(c *fiber.Ctx) error {
	// Проверяем ETag для кэширования
	if c.Get("If-None-Match") == htmlETag {
		return c.SendStatus(fiber.StatusNotModified)
	}

	// Устанавливаем заголовки кэширования
	c.Set("Cache-Control", "public, max-age=3600") // 1 час
	c.Set("ETag", htmlETag)
	c.Set("Vary", "Accept-Encoding")

	// HTTP/2 Server Push (если поддерживается)
	if c.Protocol() == "https" {
		c.Set("Link", `<https://cdn.tailwindcss.com>; rel=preconnect`)
	}

	return c.Type("html").SendString(htmlPage)
}
