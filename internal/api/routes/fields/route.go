package fields

import (
	"iiko-analytic/internal/api/utils"
	"iiko-analytic/internal/cache"
	"iiko-analytic/internal/iiko"

	iikoUtils "iiko-analytic/internal/iiko/utils"

	"github.com/gofiber/fiber/v2"
)

const (
	Route  = "/fields"
	Method = fiber.MethodPost
)

type FieldsBody struct {
	BaseURL      string `json:"baseURL" validate:"required,url"`
	User         string `json:"user" validate:"required"`
	PasswordHash string `json:"passwordHash" validate:"required"`
	ReportType   string `json:"reportType" validate:"required,oneof=SALES TRANSACTIONS"`
}

func NewFieldsHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, fieldsHandler)
}

func fieldsHandler(c *fiber.Ctx) error {
	var body FieldsBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	validate := utils.GetValidator()
	errors, err := validate.Validate(body)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   err.Error(),
			"details": errors,
		})
	}

	serverAPI := iiko.NewServerAPI(
		body.BaseURL,
		body.User,
		body.PasswordHash,
		cache.GetCompressedCache())

	defer func() {
		go serverAPI.Logout()
	}()

	fields, err := serverAPI.Fields(iikoUtils.ReportType(body.ReportType))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{
				"error": err.Error(),
			})
	}
	return c.JSON(fields)
}
