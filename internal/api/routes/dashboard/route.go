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

var (
	htmlETag string
)

const (
	Route  = "/"
	Method = fiber.MethodGet
)

func init() {
	// Генерируем ETag при запуске
	hash := sha256.Sum256([]byte(htmlPage))
	htmlETag = fmt.Sprintf(`"%x"`, hash[:8])
}

func NewDashboardHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, dashboardHandler)
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
