package olapbody

import (
	"iiko-analytic/internal/api/common"
	"iiko-analytic/internal/api/utils"
	"iiko-analytic/internal/cache"
	"iiko-analytic/internal/iiko"

	"github.com/gofiber/fiber/v2"
)

const (
	Route  = "/olap-body"
	Method = fiber.MethodPost
)

func NewOlapBodyHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, olapBodyHandler)
}

func olapBodyHandler(c *fiber.Ctx) error {
	var body common.OlapBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	validate := utils.GetValidator()
	if errors := body.Validate(validate); errors != nil {
		return c.Status(fiber.StatusBadRequest).JSON(errors)
	}
	serverAPI := iiko.NewServerAPI(
		body.BaseURL,
		body.User,
		body.PasswordHash,
		cache.GetCompressedCache())

	defer func() {
		go serverAPI.Logout()
	}()

	return c.JSON(serverAPI.OlapBody(body.ToParams()))
}
