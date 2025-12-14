package utils

import "github.com/gofiber/fiber/v2"

type HandlerInterface interface {
	Method() string
	Route() string
	Handler() func(c *fiber.Ctx) error
}

type Handler struct {
	method  string
	route   string
	handler func(c *fiber.Ctx) error
}

func NewHandler(method, route string, handler func(c *fiber.Ctx) error) HandlerInterface {
	return &Handler{
		method:  method,
		route:   route,
		handler: handler,
	}
}

func (h *Handler) Method() string {
	return h.method
}

func (h *Handler) Route() string {
	return h.route
}

func (h *Handler) Handler() func(c *fiber.Ctx) error {
	return h.handler
}
