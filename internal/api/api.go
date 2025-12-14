package api

import (
	"iiko-analytic/internal/api/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

type API struct {
	client *fiber.App
}

func NewAPI() *API {
	return &API{
		client: fiber.New(fiber.Config{
			// Включаем компрессию тела
			CompressedFileSuffix: ".gz",
			// Увеличиваем размеры буферов для HTTP/2
			ReadBufferSize:  16384,
			WriteBufferSize: 16384,
			// Отключаем лишние заголовки
			DisableStartupMessage: false,
			// Поддержка Server-Sent Events и HTTP/2 Server Push
			StreamRequestBody: false,
			// Оптимизация работы с памятью
			ReduceMemoryUsage: false,
		}),
	}
}

func (a *API) SetupHandlers(handlers []utils.HandlerInterface) {
	for _, handler := range handlers {
		a.client.Add(handler.Method(), handler.Route(), handler.Handler())
	}
}

func (a *API) SetupMiddlewares() {
	a.client.Use(logger.New())
	a.client.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed, // Быстрее чем LevelBestCompression
	}))
}

func (a *API) Start(port string) error {
	return a.client.Listen(port)
}

// StartTLS запускает сервер с TLS и HTTP/2
// Для HTTP/2 нужно использовать этот метод вместо Start
func (a *API) StartTLS(port, certFile, keyFile string) error {
	return a.client.ListenTLS(port, certFile, keyFile)
}

func (a *API) Shutdown() error {
	return a.client.Shutdown()
}
