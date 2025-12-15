package olappresets

import (
	"iiko-analytic/internal/api/common"
	"iiko-analytic/internal/api/utils"
	"iiko-analytic/internal/cache"
	"iiko-analytic/internal/iiko"

	"github.com/gofiber/fiber/v2"
)

const (
	Route  = "/olap-presets"
	Method = fiber.MethodPost
)

func NewOlapPresetsHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, olapPresetsHandler)
}

func olapPresetsHandler(c *fiber.Ctx) error {
	var body common.OlapConnectionBody
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

	presets, err := serverAPI.OlapPresets()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(presets)
}
