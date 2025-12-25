package dashboard

import (
	"crypto/sha256"
	_ "embed"
	"fmt"
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
	faviconSVGETag      string
)

const (
	Route  = "/"
	Method = fiber.MethodGet
)

func init() {
	// Генерируем ETag при запуске
	htmlETag = generateETag(htmlPage)
	mainJSETag = generateETag(mainJS)
	utilsJSETag = generateETag(utilsJS)
	fieldsJSETag = generateETag(fieldsJS)
	filtersJSETag = generateETag(filtersJS)
	clearFieldsJSETag = generateETag(clearFieldsJS)
	queryJSETag = generateETag(queryJS)
	jsonHighlightJSETag = generateETag(jsonHighlightJS)
	importJSETag = generateETag(importJS)
	faviconSVGETag = generateETag(faviconSVG)
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
